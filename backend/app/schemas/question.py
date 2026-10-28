from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class ConfirmationQuestionUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern="^(open|answered|resolved|dismissed)$")
    answer: Optional[str] = None

class ConfirmationQuestionOut(BaseModel):
    id: str
    proposal_id: str
    question: str
    category: str
    rationale: str
    impact: str
    suggested_role: Optional[str] = None
    status: str
    answer: Optional[str] = None
    resolved_by_id: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

