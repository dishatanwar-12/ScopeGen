from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.models.client import Client
from backend.app.models.project import Project
from backend.app.models.proposal import Proposal, ConfirmationQuestion
from backend.app.services.nvidia_llm import nvidia_service
from backend.app.api.deps import get_current_user

router = APIRouter()

@router.get("/health")
async def health_check():
    """Basic service health check."""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "environment": settings.APP_ENV
    }

@router.get("/ai-status")
async def ai_status(current_user: User = Depends(get_current_user)):
    """Check NVIDIA NIM connectivity without leaking credentials."""
    status_info = nvidia_service.check_health()
    return status_info

@router.get("/dashboard-stats")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns real database-backed metrics for the authenticated user.
    No hardcoded or fake statistics.
    """
    is_admin = current_user.role == "admin"

    # Proposal counts
    p_base = select(Proposal)
    if not is_admin:
        p_base = p_base.where(Proposal.owner_id == current_user.id)

    total_proposals = (await db.execute(select(func.count(Proposal.id)).where(Proposal.owner_id == current_user.id if not is_admin else True))).scalar_one() or 0
    draft_proposals = (await db.execute(select(func.count(Proposal.id)).where(and_(Proposal.status == "draft", Proposal.owner_id == current_user.id if not is_admin else True)))).scalar_one() or 0
    in_review_proposals = (await db.execute(select(func.count(Proposal.id)).where(and_(Proposal.status == "in_review", Proposal.owner_id == current_user.id if not is_admin else True)))).scalar_one() or 0
    approved_proposals = (await db.execute(select(func.count(Proposal.id)).where(and_(Proposal.status == "approved", Proposal.owner_id == current_user.id if not is_admin else True)))).scalar_one() or 0

    # Total clients and projects
    total_clients = (await db.execute(select(func.count(Client.id)).where(Client.owner_id == current_user.id if not is_admin else True))).scalar_one() or 0
    total_projects = (await db.execute(select(func.count(Project.id)).where(Project.owner_id == current_user.id if not is_admin else True))).scalar_one() or 0

    # Open confirmation questions count
    q_open_stmt = select(func.count(ConfirmationQuestion.id)).join(Proposal, ConfirmationQuestion.proposal_id == Proposal.id).where(
        and_(
            ConfirmationQuestion.status == "open",
            Proposal.owner_id == current_user.id if not is_admin else True
        )
    )
    open_questions = (await db.execute(q_open_stmt)).scalar_one() or 0

    # Recent proposals
    recent_p_stmt = select(Proposal).where(Proposal.owner_id == current_user.id if not is_admin else True).order_by(Proposal.updated_at.desc()).limit(5)
    recent_p_res = await db.execute(recent_p_stmt)
    recent_proposals = []
    for p in recent_p_res.scalars().all():
        proj_res = await db.execute(select(Project.title).where(Project.id == p.project_id))
        proj_title = proj_res.scalar_one_or_none() or "Project"
        recent_proposals.append({
            "id": p.id,
            "title": p.title,
            "project_title": proj_title,
            "status": p.status,
            "version": p.current_version_number,
            "updated_at": p.updated_at
        })

    return {
        "total_proposals": total_proposals,
        "draft_proposals": draft_proposals,
        "in_review_proposals": in_review_proposals,
        "approved_proposals": approved_proposals,
        "total_clients": total_clients,
        "total_projects": total_projects,
        "open_questions": open_questions,
        "recent_proposals": recent_proposals
    }

