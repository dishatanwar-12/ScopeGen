import io
import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.models.client import Client
from backend.app.models.project import Project
from backend.app.models.package import ServicePackage
from backend.app.models.discovery import DiscoveryNote, SourceDocument
from backend.app.models.proposal import (
    Proposal,
    ProposalSection,
    ProposalVersion,
    ConfirmationQuestion
)
from backend.app.models.audit import AuditLog
from backend.app.schemas.proposal import (
    ProposalOut,
    ProposalSectionOut,
    ProposalSectionUpdate,
    ProposalVersionOut,
    FactReviewRequest,
    FactReviewResponse,
    ProposalGenerateRequest,
    ProposalRegenerateSectionRequest
)
from backend.app.schemas.question import ConfirmationQuestionOut
from backend.app.services.fact_extractor import extract_and_review_facts
from backend.app.services.proposal_generator import generate_and_save_proposal
from backend.app.services.nvidia_llm import nvidia_service
from backend.app.services.commercial_guardrail import audit_and_sanitize_generated_text
from backend.app.services.export_pdf import generate_proposal_pdf
from backend.app.services.export_docx import generate_proposal_docx
from backend.app.api.deps import get_current_user

router = APIRouter()

@router.post("/review-facts", response_model=FactReviewResponse)
async def review_project_facts(
    payload: FactReviewRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Step 7 in Workflow: Extract and categorize all available facts, goals,
    assumptions, contradictions, and commercial terms before calling NVIDIA NIM.
    """
    q_proj = select(Project).where(Project.id == payload.project_id)
    if current_user.role != "admin":
        q_proj = q_proj.where(Project.owner_id == current_user.id)
    res_proj = await db.execute(q_proj)
    project = res_proj.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or access denied.")

    # Service package
    package_id = payload.service_package_id or project.service_package_id
    service_package = None
    if package_id:
        res_pkg = await db.execute(select(ServicePackage).where(ServicePackage.id == package_id))
        service_package = res_pkg.scalar_one_or_none()

    # Notes and Documents
    res_notes = await db.execute(select(DiscoveryNote).where(DiscoveryNote.project_id == payload.project_id))
    notes = list(res_notes.scalars().all())

    res_docs = await db.execute(select(SourceDocument).where(SourceDocument.project_id == payload.project_id))
    docs = list(res_docs.scalars().all())

    return extract_and_review_facts(
        project=project,
        service_package=service_package,
        discovery_notes=notes,
        source_documents=docs
    )

@router.post("/generate", response_model=ProposalOut, status_code=status.HTTP_201_CREATED)
async def generate_proposal(
    payload: ProposalGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Step 8 in Workflow: Call real NVIDIA NIM inference, enforce commercial firewall,
    and persist generated proposal with traceable sections and confirmation questions.
    """
    try:
        proposal = await generate_and_save_proposal(
            db=db,
            project_id=payload.project_id,
            user_id=current_user.id,
            service_package_id=payload.service_package_id,
            proposal_template_id=payload.proposal_template_id,
            custom_instructions=payload.custom_instructions,
            override_title=payload.override_title
        )
        return await get_full_proposal_schema(db, proposal.id)
    except Exception as e:
        logger_error = str(e)
        raise HTTPException(status_code=500, detail=f"Proposal generation failed: {logger_error}")

@router.get("", response_model=List[ProposalOut])
async def list_proposals(
    project_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List proposals belonging to the current user."""
    stmt = select(Proposal)
    if current_user.role != "admin":
        stmt = stmt.where(Proposal.owner_id == current_user.id)
    if project_id:
        stmt = stmt.where(Proposal.project_id == project_id)
    if status_filter:
        stmt = stmt.where(Proposal.status == status_filter)

    stmt = stmt.order_by(Proposal.updated_at.desc())
    res = await db.execute(stmt)
    proposals = list(res.scalars().all())

    results = []
    for p in proposals:
        p_out = await get_full_proposal_schema(db, p.id)
        results.append(p_out)
    return results

@router.get("/{proposal_id}", response_model=ProposalOut)
async def get_proposal(
    proposal_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get single proposal details."""
    stmt = select(Proposal).where(Proposal.id == proposal_id)
    if current_user.role != "admin":
        stmt = stmt.where(Proposal.owner_id == current_user.id)
    res = await db.execute(stmt)
    proposal = res.scalar_one_or_none()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found or access denied.")

    return await get_full_proposal_schema(db, proposal_id)

@router.put("/{proposal_id}/sections/{section_id}", response_model=ProposalSectionOut)
async def update_section(
    proposal_id: str,
    section_id: str,
    payload: ProposalSectionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a section's markdown content.
    Enforces optimistic concurrency via version_lock and audits commercial safeguards.
    """
    stmt = select(ProposalSection).where(
        and_(ProposalSection.id == section_id, ProposalSection.proposal_id == proposal_id)
    )
    res = await db.execute(stmt)
    sec = res.scalar_one_or_none()
    if not sec:
        raise HTTPException(status_code=404, detail="Proposal section not found.")

    # Concurrency check
    if sec.version_lock != payload.version_lock:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Section was modified by another session. Please refresh and review before saving."
        )

    # Fetch proposal and package for commercial safety check
    p_res = await db.execute(select(Proposal).where(Proposal.id == proposal_id))
    proposal = p_res.scalar_one_or_none()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found.")
    if current_user.role != "admin" and proposal.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    pkg_dict = None
    if proposal.service_package_id:
        pkg_res = await db.execute(select(ServicePackage).where(ServicePackage.id == proposal.service_package_id))
        pkg = pkg_res.scalar_one_or_none()
        if pkg:
            pkg_dict = {
                "currency": pkg.currency,
                "fixed_fee_amount": pkg.fixed_fee_amount,
                "hourly_rate": pkg.hourly_rate
            }

    # Sanitize and audit
    clean_text, warnings, extra_q = audit_and_sanitize_generated_text(sec.section_key, payload.content_markdown, pkg_dict)

    if payload.title:
        sec.title = payload.title
    sec.content_markdown = clean_text
    sec.version_lock += 1

    await db.commit()
    await db.refresh(sec)
    return ProposalSectionOut.model_validate(sec)

@router.post("/{proposal_id}/regenerate-section", response_model=ProposalSectionOut)
async def regenerate_section(
    proposal_id: str,
    payload: ProposalRegenerateSectionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Regenerates a single proposal section using NVIDIA NIM while preserving all other sections.
    """
    stmt = select(Proposal).where(Proposal.id == proposal_id)
    if current_user.role != "admin":
        stmt = stmt.where(Proposal.owner_id == current_user.id)
    res = await db.execute(stmt)
    proposal = res.scalar_one_or_none()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found or access denied.")

    # Find target section
    sec_stmt = select(ProposalSection).where(
        and_(ProposalSection.proposal_id == proposal.id, ProposalSection.section_key == payload.section_key)
    )
    sec_res = await db.execute(sec_stmt)
    sec = sec_res.scalar_one_or_none()
    if not sec:
        raise HTTPException(status_code=404, detail=f"Section '{payload.section_key}' not found.")

    if sec.is_protected or payload.section_key == "commercial_terms":
        raise HTTPException(
            status_code=400,
            detail="Commercial and protected legal sections cannot be regenerated by AI. Use package values or manual authorized overrides."
        )

    # Fetch context
    p_proj = await db.execute(select(Project).where(Project.id == proposal.project_id))
    project = p_proj.scalar_one_or_none()

    pkg_dict = None
    if proposal.service_package_id:
        pkg_res = await db.execute(select(ServicePackage).where(ServicePackage.id == proposal.service_package_id))
        pkg = pkg_res.scalar_one_or_none()
        if pkg:
            pkg_dict = {"currency": pkg.currency, "fixed_fee_amount": pkg.fixed_fee_amount}

    user_instructions = (
        f"Regenerate ONLY the section titled '{sec.title}' (key: {sec.section_key}) for project '{project.title if project else ''}'.\n"
        f"Current content:\n{sec.content_markdown}\n\n"
        f"Special revision instructions:\n{payload.instructions or 'Improve clarity, detail, and professional tone.'}\n"
        "Return the revised markdown text directly without extra conversational intro."
    )

    sys_prompt = "You are ProposalCraft AI. Rewrite the requested proposal section strictly in markdown without inventing pricing or dates."
    new_text, _ = nvidia_service.generate_chat_completion(
        system_prompt=sys_prompt,
        user_prompt=user_instructions,
        json_mode=False
    )

    clean_text, _, _ = audit_and_sanitize_generated_text(sec.section_key, new_text, pkg_dict)
    sec.content_markdown = clean_text
    sec.version_lock += 1

    await db.commit()
    await db.refresh(sec)
    return ProposalSectionOut.model_validate(sec)

@router.post("/{proposal_id}/versions", response_model=ProposalVersionOut)
async def create_proposal_version(
    proposal_id: str,
    summary: Optional[str] = "Manual draft snapshot",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a persistent snapshot version of the proposal."""
    p_res = await db.execute(select(Proposal).where(Proposal.id == proposal_id))
    proposal = p_res.scalar_one_or_none()
    if not proposal or (current_user.role != "admin" and proposal.owner_id != current_user.id):
        raise HTTPException(status_code=404, detail="Proposal not found or access denied.")

    sec_res = await db.execute(select(ProposalSection).where(ProposalSection.proposal_id == proposal_id).order_by(ProposalSection.sort_order.asc()))
    sections = list(sec_res.scalars().all())

    snapshot_sections = [
        {"section_key": s.section_key, "title": s.title, "content_markdown": s.content_markdown, "sort_order": s.sort_order}
        for s in sections
    ]

    proposal.current_version_number += 1
    new_ver = ProposalVersion(
        proposal_id=proposal.id,
        version_number=proposal.current_version_number,
        snapshot_json={"title": proposal.title, "sections": snapshot_sections},
        change_summary=summary or f"Version {proposal.current_version_number}",
        created_by_id=current_user.id
    )
    db.add(new_ver)
    await db.commit()
    await db.refresh(new_ver)
    return ProposalVersionOut.model_validate(new_ver)

@router.get("/{proposal_id}/versions", response_model=List[ProposalVersionOut])
async def list_proposal_versions(
    proposal_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List historical snapshots for a proposal."""
    p_res = await db.execute(select(Proposal).where(Proposal.id == proposal_id))
    proposal = p_res.scalar_one_or_none()
    if not proposal or (current_user.role != "admin" and proposal.owner_id != current_user.id):
        raise HTTPException(status_code=404, detail="Proposal not found or access denied.")

    stmt = select(ProposalVersion).where(ProposalVersion.proposal_id == proposal_id).order_by(ProposalVersion.version_number.desc())
    res = await db.execute(stmt)
    return list(res.scalars().all())

@router.post("/{proposal_id}/restore/{version_id}", response_model=ProposalOut)
async def restore_proposal_version(
    proposal_id: str,
    version_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Restore proposal sections to a previous version snapshot."""
    p_res = await db.execute(select(Proposal).where(Proposal.id == proposal_id))
    proposal = p_res.scalar_one_or_none()
    if not proposal or (current_user.role != "admin" and proposal.owner_id != current_user.id):
        raise HTTPException(status_code=404, detail="Proposal not found or access denied.")

    v_res = await db.execute(select(ProposalVersion).where(and_(ProposalVersion.id == version_id, ProposalVersion.proposal_id == proposal_id)))
    target_version = v_res.scalar_one_or_none()
    if not target_version:
        raise HTTPException(status_code=404, detail="Target version snapshot not found.")

    snapshot = target_version.snapshot_json
    saved_sections = snapshot.get("sections", [])

    # Update or recreate sections
    for item in saved_sections:
        s_key = item.get("section_key")
        sec_stmt = select(ProposalSection).where(and_(ProposalSection.proposal_id == proposal_id, ProposalSection.section_key == s_key))
        sec_res = await db.execute(sec_stmt)
        sec = sec_res.scalar_one_or_none()
        if sec:
            sec.title = item.get("title", sec.title)
            sec.content_markdown = item.get("content_markdown", "")
            sec.sort_order = item.get("sort_order", sec.sort_order)
            sec.version_lock += 1

    # Record new restore version
    proposal.current_version_number += 1
    restore_ver = ProposalVersion(
        proposal_id=proposal.id,
        version_number=proposal.current_version_number,
        snapshot_json=snapshot,
        change_summary=f"Restored from version {target_version.version_number}",
        created_by_id=current_user.id
    )
    db.add(restore_ver)
    await db.commit()

    return await get_full_proposal_schema(db, proposal_id)

@router.put("/{proposal_id}/status")
async def update_proposal_status(
    proposal_id: str,
    new_status: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Transition proposal status (draft -> in_review -> approved -> archived)."""
    if new_status not in ("draft", "in_review", "approved", "archived"):
        raise HTTPException(status_code=400, detail="Invalid status value.")

    p_res = await db.execute(select(Proposal).where(Proposal.id == proposal_id))
    proposal = p_res.scalar_one_or_none()
    if not proposal or (current_user.role != "admin" and proposal.owner_id != current_user.id):
        raise HTTPException(status_code=404, detail="Proposal not found or access denied.")

    # Check unresolved pricing questions if approving
    if new_status == "approved":
        q_open = select(func.count(ConfirmationQuestion.id)).where(
            and_(
                ConfirmationQuestion.proposal_id == proposal_id,
                ConfirmationQuestion.status == "open",
                ConfirmationQuestion.category == "pricing"
            )
        )
        res_open = await db.execute(q_open)
        if res_open.scalar_one() > 0:
            raise HTTPException(
                status_code=400,
                detail="Cannot approve proposal: Unresolved commercial confirmation questions remain."
            )

    proposal.status = new_status
    await db.commit()
    return {"message": f"Proposal status updated to '{new_status}'."}

@router.get("/{proposal_id}/export/pdf")
async def export_proposal_pdf(
    proposal_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Stream generated high-resolution PDF."""
    p_data, sections = await get_proposal_for_export(db, proposal_id, current_user)
    pdf_bytes = generate_proposal_pdf(
        proposal_title=p_data["title"],
        client_name=p_data["client_name"],
        project_title=p_data["project_title"],
        status=p_data["status"],
        sections=sections
    )
    safe_filename = re.sub(r'[^a-zA-Z0-9_\-]', '_', p_data["title"])[:50]
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{safe_filename}.pdf"'}
    )

@router.get("/{proposal_id}/export/docx")
async def export_proposal_docx(
    proposal_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Stream generated editable Word (.docx) document."""
    p_data, sections = await get_proposal_for_export(db, proposal_id, current_user)
    docx_bytes = generate_proposal_docx(
        proposal_title=p_data["title"],
        client_name=p_data["client_name"],
        project_title=p_data["project_title"],
        status=p_data["status"],
        sections=sections
    )
    safe_filename = re.sub(r'[^a-zA-Z0-9_\-]', '_', p_data["title"])[:50]
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{safe_filename}.docx"'}
    )

# Helper functions
async def get_full_proposal_schema(db: AsyncSession, proposal_id: str) -> ProposalOut:
    stmt = select(Proposal).where(Proposal.id == proposal_id)
    res = await db.execute(stmt)
    proposal = res.scalar_one_or_none()

    # Client & Project titles
    p_proj = await db.execute(select(Project).where(Project.id == proposal.project_id))
    project = p_proj.scalar_one_or_none()
    
    client_name = "Unknown Client"
    if project:
        c_res = await db.execute(select(Client.company_name).where(Client.id == project.client_id))
        client_name = c_res.scalar_one_or_none() or "Unknown Client"

    pkg_name = None
    if proposal.service_package_id:
        pkg_res = await db.execute(select(ServicePackage.name).where(ServicePackage.id == proposal.service_package_id))
        pkg_name = pkg_res.scalar_one_or_none()

    # Sections
    sec_stmt = select(ProposalSection).where(ProposalSection.proposal_id == proposal.id).order_by(ProposalSection.sort_order.asc())
    sec_res = await db.execute(sec_stmt)
    sections = [ProposalSectionOut.model_validate(s) for s in sec_res.scalars().all()]

    # Questions
    q_stmt = select(ConfirmationQuestion).where(ConfirmationQuestion.proposal_id == proposal.id).order_by(ConfirmationQuestion.created_at.asc())
    q_res = await db.execute(q_stmt)
    questions = [ConfirmationQuestionOut.model_validate(q) for q in q_res.scalars().all()]

    return ProposalOut(
        id=proposal.id,
        owner_id=proposal.owner_id,
        project_id=proposal.project_id,
        service_package_id=proposal.service_package_id,
        proposal_template_id=proposal.proposal_template_id,
        title=proposal.title,
        status=proposal.status,
        current_version_number=proposal.current_version_number,
        generation_metadata=proposal.generation_metadata or {},
        created_at=proposal.created_at,
        updated_at=proposal.updated_at,
        project_title=project.title if project else "Project",
        client_name=client_name,
        service_package_name=pkg_name,
        sections=sections,
        questions=questions
    )

async def get_proposal_for_export(db: AsyncSession, proposal_id: str, user: User):
    stmt = select(Proposal).where(Proposal.id == proposal_id)
    if user.role != "admin":
        stmt = stmt.where(Proposal.owner_id == user.id)
    res = await db.execute(stmt)
    proposal = res.scalar_one_or_none()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found or access denied.")

    p_proj = await db.execute(select(Project).where(Project.id == proposal.project_id))
    project = p_proj.scalar_one_or_none()

    client_name = "Client"
    if project:
        c_res = await db.execute(select(Client.company_name).where(Client.id == project.client_id))
        client_name = c_res.scalar_one_or_none() or "Client"

    sec_res = await db.execute(
        select(ProposalSection).where(ProposalSection.proposal_id == proposal.id).order_by(ProposalSection.sort_order.asc())
    )
    sections_data = [
        {
            "title": s.title,
            "content_markdown": s.content_markdown,
            "sort_order": s.sort_order
        }
        for s in sec_res.scalars().all()
    ]

    p_data = {
        "title": proposal.title,
        "status": proposal.status,
        "client_name": client_name,
        "project_title": project.title if project else "Project SOW"
    }
    return p_data, sections_data
