from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.models.template import ProposalTemplate, TemplateVersion
from backend.app.models.audit import AuditLog
from backend.app.schemas.template import (
    ProposalTemplateCreate,
    ProposalTemplateUpdate,
    ProposalTemplateOut
)
from backend.app.api.deps import get_current_user, get_current_admin

router = APIRouter()

@router.get("", response_model=List[ProposalTemplateOut])
async def list_templates(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List approved and active proposal templates."""
    stmt = select(ProposalTemplate).where(ProposalTemplate.approval_status != "archived").order_by(ProposalTemplate.is_default.desc(), ProposalTemplate.name.asc())
    res = await db.execute(stmt)
    return list(res.scalars().all())

@router.post("", response_model=ProposalTemplateOut, status_code=status.HTTP_201_CREATED)
async def create_template(
    payload: ProposalTemplateCreate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    """Create a company proposal template (Admin only)."""
    q_dup = select(ProposalTemplate).where(ProposalTemplate.name == payload.name)
    res_dup = await db.execute(q_dup)
    if res_dup.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"A template named '{payload.name}' already exists.")

    new_tpl = ProposalTemplate(
        created_by_id=admin_user.id,
        approval_status="draft",
        current_version=1,
        **payload.model_dump()
    )
    db.add(new_tpl)
    await db.flush()

    ver = TemplateVersion(
        template_id=new_tpl.id,
        version_number=1,
        snapshot_data=payload.model_dump(),
        change_summary="Initial template creation",
        created_by_id=admin_user.id
    )
    db.add(ver)

    audit = AuditLog(
        user_id=admin_user.id,
        action="template.created",
        resource_type="template",
        resource_id=new_tpl.id,
        details={"name": new_tpl.name}
    )
    db.add(audit)

    await db.commit()
    await db.refresh(new_tpl)
    return new_tpl

@router.get("/{template_id}", response_model=ProposalTemplateOut)
async def get_template(
    template_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get template details."""
    stmt = select(ProposalTemplate).where(ProposalTemplate.id == template_id)
    res = await db.execute(stmt)
    tpl = res.scalar_one_or_none()
    if not tpl:
        raise HTTPException(status_code=404, detail="Proposal template not found.")
    return tpl

@router.put("/{template_id}", response_model=ProposalTemplateOut)
async def update_template(
    template_id: str,
    payload: ProposalTemplateUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    """Update template and create version snapshot (Admin only)."""
    stmt = select(ProposalTemplate).where(ProposalTemplate.id == template_id)
    res = await db.execute(stmt)
    tpl = res.scalar_one_or_none()
    if not tpl:
        raise HTTPException(status_code=404, detail="Proposal template not found.")

    update_dict = payload.model_dump(exclude_unset=True)
    change_summary = update_dict.pop("change_summary", "Updated template configuration")

    for k, v in update_dict.items():
        setattr(tpl, k, v)

    tpl.current_version += 1
    snapshot = {
        c.name: getattr(tpl, c.name)
        for c in tpl.__table__.columns
        if c.name not in ("created_at", "updated_at")
    }
    ver = TemplateVersion(
        template_id=tpl.id,
        version_number=tpl.current_version,
        snapshot_data=snapshot,
        change_summary=change_summary,
        created_by_id=admin_user.id
    )
    db.add(ver)

    await db.commit()
    await db.refresh(tpl)
    return tpl

@router.post("/{template_id}/approve", response_model=ProposalTemplateOut)
async def approve_template(
    template_id: str,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    """Approve a proposal template for general company use (Admin only)."""
    stmt = select(ProposalTemplate).where(ProposalTemplate.id == template_id)
    res = await db.execute(stmt)
    tpl = res.scalar_one_or_none()
    if not tpl:
        raise HTTPException(status_code=404, detail="Proposal template not found.")

    tpl.approval_status = "approved"
    tpl.approved_by_id = admin_user.id
    tpl.approved_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(tpl)
    return tpl

