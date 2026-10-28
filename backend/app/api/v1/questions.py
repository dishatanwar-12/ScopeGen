from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.models.proposal import Proposal, ConfirmationQuestion
from backend.app.models.audit import AuditLog
from backend.app.schemas.question import ConfirmationQuestionUpdate, ConfirmationQuestionOut
from backend.app.api.deps import get_current_user

router = APIRouter()

@router.get("/{proposal_id}/questions", response_model=List[ConfirmationQuestionOut])
async def list_proposal_questions(
    proposal_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all confirmation questions for a proposal."""
    p_res = await db.execute(select(Proposal).where(Proposal.id == proposal_id))
    proposal = p_res.scalar_one_or_none()
    if not proposal or (current_user.role != "admin" and proposal.owner_id != current_user.id):
        raise HTTPException(status_code=404, detail="Proposal not found or access denied.")

    stmt = select(ConfirmationQuestion).where(
        ConfirmationQuestion.proposal_id == proposal_id
    ).order_by(ConfirmationQuestion.created_at.asc())
    res = await db.execute(stmt)
    return list(res.scalars().all())

@router.put("/questions/{question_id}", response_model=ConfirmationQuestionOut)
async def update_confirmation_question(
    question_id: str,
    payload: ConfirmationQuestionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Answer, resolve, or dismiss a confirmation question."""
    stmt = select(ConfirmationQuestion).where(ConfirmationQuestion.id == question_id)
    res = await db.execute(stmt)
    q = res.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Confirmation question not found.")

    p_res = await db.execute(select(Proposal).where(Proposal.id == q.proposal_id))
    proposal = p_res.scalar_one_or_none()
    if not proposal or (current_user.role != "admin" and proposal.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Access denied.")

    if payload.answer is not None:
        q.answer = payload.answer
        if q.status == "open":
            q.status = "answered"

    if payload.status is not None:
        q.status = payload.status
        if payload.status in ("resolved", "dismissed"):
            q.resolved_by_id = current_user.id
            q.resolved_at = datetime.now(timezone.utc)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="question.updated",
        resource_type="proposal",
        resource_id=q.proposal_id,
        details={"question_id": q.id, "status": q.status}
    )
    db.add(audit)

    await db.commit()
    await db.refresh(q)
    return q
