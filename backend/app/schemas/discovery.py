from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class DiscoveryNoteCreate(BaseModel):
    note_type: str = Field("meeting_notes", pattern="^(meeting_notes|interview|requirements|pain_points|constraints|technical|risks|open_questions|decisions)$")
    content: str = Field(..., min_length=2)

class DiscoveryNoteOut(BaseModel):
    id: str
    project_id: str
    note_type: str
    content: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SourceDocumentOut(BaseModel):
    id: str
    project_id: str
    original_filename: str
    file_type: str
    file_size_bytes: int
    extracted_text_preview: str
    sanitized_text: str
    uploaded_at: datetime

    class Config:
        from_attributes = True

class DocumentUploadResponse(BaseModel):
    document: SourceDocumentOut
    message: str
    warnings: list[str] = []
