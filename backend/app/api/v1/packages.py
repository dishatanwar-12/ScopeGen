from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.models.package import ServicePackage, PackageVersion
from backend.app.models.audit import AuditLog
from backend.app.schemas.package import (
    ServicePackageCreate,
    ServicePackageUpdate,
    ServicePackageOut
)
from backend.app.api.deps import get_current_user, get_current_admin

router = APIRouter()

@router.get("", response_model=List[ServicePackageOut])
async def list_service_packages(
    category: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List service packages.
    Consultants see approved packages (or draft if testing).
    Admins see all packages.
    """
    stmt = select(ServicePackage)
    if current_user.role != "admin" and not status_filter:
        # By default non-admins primarily see approved packages
        stmt = stmt.where(ServicePackage.approval_status != "archived")
    elif status_filter:
        stmt = stmt.where(ServicePackage.approval_status == status_filter)

    if category:
        stmt = stmt.where(ServicePackage.category == category)

    stmt = stmt.order_by(ServicePackage.name.asc())
    res = await db.execute(stmt)
    return list(res.scalars().all())

@router.post("", response_model=ServicePackageOut, status_code=status.HTTP_201_CREATED)
async def create_service_package(
    payload: ServicePackageCreate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    """Create a new service package (Admin only)."""
    # Check duplicate name
    q_dup = select(ServicePackage).where(ServicePackage.name == payload.name)
    res_dup = await db.execute(q_dup)
    if res_dup.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"A service package named '{payload.name}' already exists.")

    new_pkg = ServicePackage(
        created_by_id=admin_user.id,
        approval_status="draft",
        current_version=1,
        **payload.model_dump()
    )
    db.add(new_pkg)
    await db.flush()

    # Create initial version 1
    ver = PackageVersion(
        package_id=new_pkg.id,
        version_number=1,
        snapshot_data=payload.model_dump(),
        change_summary="Initial package creation",
        created_by_id=admin_user.id
    )
    db.add(ver)

    # Audit log
    audit = AuditLog(
        user_id=admin_user.id,
        action="package.created",
        resource_type="package",
        resource_id=new_pkg.id,
        details={"name": new_pkg.name, "category": new_pkg.category}
    )
    db.add(audit)

    await db.commit()
    await db.refresh(new_pkg)
    return new_pkg

@router.get("/{package_id}", response_model=ServicePackageOut)
async def get_service_package(
    package_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get package details."""
    stmt = select(ServicePackage).where(ServicePackage.id == package_id)
    res = await db.execute(stmt)
    pkg = res.scalar_one_or_none()
    if not pkg:
        raise HTTPException(status_code=404, detail="Service package not found.")
    return pkg

@router.put("/{package_id}", response_model=ServicePackageOut)
async def update_service_package(
    package_id: str,
    payload: ServicePackageUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    """Update service package and record a new version (Admin only)."""
    stmt = select(ServicePackage).where(ServicePackage.id == package_id)
    res = await db.execute(stmt)
    pkg = res.scalar_one_or_none()
    if not pkg:
        raise HTTPException(status_code=404, detail="Service package not found.")

    update_dict = payload.model_dump(exclude_unset=True)
    change_summary = update_dict.pop("change_summary", "Updated package details")

    for k, v in update_dict.items():
        setattr(pkg, k, v)

    pkg.current_version += 1
    # If commercial fields or deliverables changed, reset approval status to draft
    if any(k in update_dict for k in ("pricing_model", "fixed_fee_amount", "hourly_rate", "currency", "included_deliverables")):
        pkg.approval_status = "draft"
        pkg.approved_by_id = None
        pkg.approved_at = None

    # Version snapshot
    snapshot = {
        c.name: getattr(pkg, c.name)
        for c in pkg.__table__.columns
        if c.name not in ("created_at", "updated_at")
    }
    ver = PackageVersion(
        package_id=pkg.id,
        version_number=pkg.current_version,
        snapshot_data=snapshot,
        change_summary=change_summary,
        created_by_id=admin_user.id
    )
    db.add(ver)

    audit = AuditLog(
        user_id=admin_user.id,
        action="package.updated",
        resource_type="package",
        resource_id=pkg.id,
        details={"version": pkg.current_version, "summary": change_summary}
    )
    db.add(audit)

    await db.commit()
    await db.refresh(pkg)
    return pkg

@router.post("/{package_id}/approve", response_model=ServicePackageOut)
async def approve_service_package(
    package_id: str,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    """Approve a service package for official proposal generation (Admin only)."""
    stmt = select(ServicePackage).where(ServicePackage.id == package_id)
    res = await db.execute(stmt)
    pkg = res.scalar_one_or_none()
    if not pkg:
        raise HTTPException(status_code=404, detail="Service package not found.")

    pkg.approval_status = "approved"
    pkg.approved_by_id = admin_user.id
    pkg.approved_at = datetime.now(timezone.utc)

    audit = AuditLog(
        user_id=admin_user.id,
        action="package.approved",
        resource_type="package",
        resource_id=pkg.id,
        details={"name": pkg.name, "pricing_model": pkg.pricing_model, "currency": pkg.currency}
    )
    db.add(audit)

    await db.commit()
    await db.refresh(pkg)
    return pkg

@router.post("/{package_id}/archive", response_model=ServicePackageOut)
async def archive_service_package(
    package_id: str,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    """Archive a package so it cannot be used for new proposals (Admin only)."""
    stmt = select(ServicePackage).where(ServicePackage.id == package_id)
    res = await db.execute(stmt)
    pkg = res.scalar_one_or_none()
    if not pkg:
        raise HTTPException(status_code=404, detail="Service package not found.")

    pkg.approval_status = "archived"
    await db.commit()
    await db.refresh(pkg)
    return pkg
