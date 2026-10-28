import os
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.models.project import Project
from backend.app.models.discovery import DiscoveryNote, SourceDocument
from backend.app.schemas.discovery import (
    DiscoveryNoteCreate,
    DiscoveryNoteOut,
    SourceDocumentOut,
    DocumentUploadResponse
)
from backend.app.services.document_parser import extract_text_from_file
from backend.app.api.deps import get_current_user

router = APIRouter()

@router.get("/{project_id}/notes", response_model=List[DiscoveryNoteOut])
async def list_discovery_notes(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all discovery notes for a project."""
    # Verify project ownership
    q_proj = select(Project).where(Project.id == project_id)
    if current_user.role != "admin":
        q_proj = q_proj.where(Project.owner_id == current_user.id)
    res_proj = await db.execute(q_proj)
    if not res_proj.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Project not found or access denied.")

    stmt = select(DiscoveryNote).where(DiscoveryNote.project_id == project_id).order_by(DiscoveryNote.created_at.asc())
    res = await db.execute(stmt)
    return list(res.scalars().all())

@router.post("/{project_id}/notes", response_model=DiscoveryNoteOut, status_code=status.HTTP_201_CREATED)
async def add_discovery_note(
    project_id: str,
    payload: DiscoveryNoteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a discovery note to a project."""
    q_proj = select(Project).where(Project.id == project_id)
    if current_user.role != "admin":
        q_proj = q_proj.where(Project.owner_id == current_user.id)
    res_proj = await db.execute(q_proj)
    if not res_proj.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Project not found or access denied.")

    new_note = DiscoveryNote(
        project_id=project_id,
        note_type=payload.note_type,
        content=payload.content
    )
    db.add(new_note)
    await db.commit()
    await db.refresh(new_note)
    return new_note

@router.delete("/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_discovery_note(
    note_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a discovery note."""
    stmt = select(DiscoveryNote).where(DiscoveryNote.id == note_id)
    res = await db.execute(stmt)
    note = res.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Discovery note not found.")

    # Check project ownership
    q_proj = select(Project).where(Project.id == note.project_id)
    if current_user.role != "admin":
        q_proj = q_proj.where(Project.owner_id == current_user.id)
    res_proj = await db.execute(q_proj)
    if not res_proj.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Access denied.")

    await db.delete(note)
    await db.commit()
    return None

@router.get("/{project_id}/documents", response_model=List[SourceDocumentOut])
async def list_source_documents(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List uploaded source documents for a project."""
    q_proj = select(Project).where(Project.id == project_id)
    if current_user.role != "admin":
        q_proj = q_proj.where(Project.owner_id == current_user.id)
    res_proj = await db.execute(q_proj)
    if not res_proj.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Project not found or access denied.")

    stmt = select(SourceDocument).where(SourceDocument.project_id == project_id).order_by(SourceDocument.uploaded_at.desc())
    res = await db.execute(stmt)
    docs = list(res.scalars().all())

    results = []
    for d in docs:
        d_out = SourceDocumentOut(
            id=d.id,
            project_id=d.project_id,
            original_filename=d.original_filename,
            file_type=d.file_type,
            file_size_bytes=d.file_size_bytes,
            extracted_text_preview=d.extracted_text[:300] + ("..." if len(d.extracted_text) > 300 else ""),
            sanitized_text=d.sanitized_text,
            uploaded_at=d.uploaded_at
        )
        results.append(d_out)
    return results

@router.post("/{project_id}/documents/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    project_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload and safely extract text from TXT, PDF, or DOCX document."""
    q_proj = select(Project).where(Project.id == project_id)
    if current_user.role != "admin":
        q_proj = q_proj.where(Project.owner_id == current_user.id)
    res_proj = await db.execute(q_proj)
    if not res_proj.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Project not found or access denied.")

    # Validate file extension
    ext = file.filename.lower().split('.')[-1] if file.filename and '.' in file.filename else ""
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File extension '.{ext}' is not supported. Allowed formats: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    file_bytes = await file.read()
    max_bytes = settings.UPLOAD_MAX_SIZE_MB * 1024 * 1024
    if len(file_bytes) > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds limit of {settings.UPLOAD_MAX_SIZE_MB}MB."
        )

    # Safe text extraction and sanitization
    raw_text, sanitized_text, warnings = extract_text_from_file(file_bytes, file.filename)

    # Save to disk safely
    storage_filename = f"{uuid.uuid4().hex}_{file.filename}"
    storage_path = os.path.join(settings.UPLOAD_DIR, storage_filename)
    with open(storage_path, "wb") as f:
        f.write(file_bytes)

    source_doc = SourceDocument(
        project_id=project_id,
        original_filename=file.filename,
        storage_path=storage_path,
        file_type=ext,
        file_size_bytes=len(file_bytes),
        extracted_text=raw_text,
        sanitized_text=sanitized_text
    )
    db.add(source_doc)
    await db.commit()
    await db.refresh(source_doc)

    doc_out = SourceDocumentOut(
        id=source_doc.id,
        project_id=source_doc.project_id,
        original_filename=source_doc.original_filename,
        file_type=source_doc.file_type,
        file_size_bytes=source_doc.file_size_bytes,
        extracted_text_preview=sanitized_text[:300] + ("..." if len(sanitized_text) > 300 else ""),
        sanitized_text=sanitized_text,
        uploaded_at=source_doc.uploaded_at
    )

    return DocumentUploadResponse(
        document=doc_out,
        message="Document uploaded and text parsed successfully.",
        warnings=warnings
    )

@router.delete("/documents/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    doc_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a source document."""
    stmt = select(SourceDocument).where(SourceDocument.id == doc_id)
    res = await db.execute(stmt)
    doc = res.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    q_proj = select(Project).where(Project.id == doc.project_id)
    if current_user.role != "admin":
        q_proj = q_proj.where(Project.owner_id == current_user.id)
    res_proj = await db.execute(q_proj)
    if not res_proj.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Access denied.")

    if os.path.exists(doc.storage_path):
        try:
            os.remove(doc.storage_path)
        except OSError:
            pass

    await db.delete(doc)
    await db.commit()
    return None

