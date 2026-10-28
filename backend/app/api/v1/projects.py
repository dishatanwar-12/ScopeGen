from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_

from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.models.client import Client
from backend.app.models.project import Project
from backend.app.models.discovery import DiscoveryNote, SourceDocument
from backend.app.models.proposal import Proposal
from backend.app.schemas.project import ProjectCreate, ProjectUpdate, ProjectOut
from backend.app.api.deps import get_current_user

router = APIRouter()

@router.get("", response_model=List[ProjectOut])
async def list_projects(
    client_id: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    q: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List projects owned by current user."""
    stmt = select(Project).join(Client, Project.client_id == Client.id)
    if current_user.role != "admin":
        stmt = stmt.where(Project.owner_id == current_user.id)
    
    if client_id:
        stmt = stmt.where(Project.client_id == client_id)
    if status_filter:
        stmt = stmt.where(Project.status == status_filter)
    if q:
        stmt = stmt.where(or_(
            Project.title.ilike(f"%{q}%"),
            Project.business_problem.ilike(f"%{q}%"),
            Client.company_name.ilike(f"%{q}%")
        ))

    stmt = stmt.order_by(Project.updated_at.desc())
    res = await db.execute(stmt)
    projects = list(res.scalars().all())

    results = []
    for p in projects:
        # Load client name
        c_res = await db.execute(select(Client.company_name).where(Client.id == p.client_id))
        client_name = c_res.scalar_one_or_none() or "Unknown"

        # Counts
        notes_res = await db.execute(select(func.count(DiscoveryNote.id)).where(DiscoveryNote.project_id == p.id))
        docs_res = await db.execute(select(func.count(SourceDocument.id)).where(SourceDocument.project_id == p.id))
        props_res = await db.execute(select(func.count(Proposal.id)).where(Proposal.project_id == p.id))

        p_out = ProjectOut.model_validate(p)
        p_out.client_name = client_name
        p_out.notes_count = notes_res.scalar_one() or 0
        p_out.docs_count = docs_res.scalar_one() or 0
        p_out.proposals_count = props_res.scalar_one() or 0
        results.append(p_out)

    return results

@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
async def create_project(
    payload: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new project record under an existing client."""
    # Verify client exists and is owned by current user
    q_client = select(Client).where(Client.id == payload.client_id)
    if current_user.role != "admin":
        q_client = q_client.where(Client.owner_id == current_user.id)
    res_client = await db.execute(q_client)
    client = res_client.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Target client not found or access denied.")

    new_project = Project(
        owner_id=current_user.id,
        **payload.model_dump()
    )
    db.add(new_project)
    await db.commit()
    await db.refresh(new_project)

    out = ProjectOut.model_validate(new_project)
    out.client_name = client.company_name
    return out

@router.get("/{project_id}", response_model=ProjectOut)
async def get_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get project details."""
    stmt = select(Project).where(Project.id == project_id)
    if current_user.role != "admin":
        stmt = stmt.where(Project.owner_id == current_user.id)
    res = await db.execute(stmt)
    project = res.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or access denied.")

    c_res = await db.execute(select(Client.company_name).where(Client.id == project.client_id))
    client_name = c_res.scalar_one_or_none() or "Unknown"

    notes_res = await db.execute(select(func.count(DiscoveryNote.id)).where(DiscoveryNote.project_id == project.id))
    docs_res = await db.execute(select(func.count(SourceDocument.id)).where(SourceDocument.project_id == project.id))
    props_res = await db.execute(select(func.count(Proposal.id)).where(Proposal.project_id == project.id))

    p_out = ProjectOut.model_validate(project)
    p_out.client_name = client_name
    p_out.notes_count = notes_res.scalar_one() or 0
    p_out.docs_count = docs_res.scalar_one() or 0
    p_out.proposals_count = props_res.scalar_one() or 0
    return p_out

@router.put("/{project_id}", response_model=ProjectOut)
async def update_project(
    project_id: str,
    payload: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update project details."""
    stmt = select(Project).where(Project.id == project_id)
    if current_user.role != "admin":
        stmt = stmt.where(Project.owner_id == current_user.id)
    res = await db.execute(stmt)
    project = res.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or access denied.")

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(project, field, val)

    await db.commit()
    await db.refresh(project)
    return ProjectOut.model_validate(project)

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a project record."""
    stmt = select(Project).where(Project.id == project_id)
    if current_user.role != "admin":
        stmt = stmt.where(Project.owner_id == current_user.id)
    res = await db.execute(stmt)
    project = res.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or access denied.")

    await db.delete(project)
    await db.commit()
    return None
