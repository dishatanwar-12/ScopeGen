from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class ProposalTemplateBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=5)
    is_default: bool = False
    branding: Dict[str, Any] = Field(default_factory=dict)
    sections_schema: List[Dict[str, Any]] = Field(default_factory=list)

class ProposalTemplateCreate(ProposalTemplateBase):
    pass

class ProposalTemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = None
    is_default: Optional[bool] = None
    branding: Optional[Dict[str, Any]] = None
    sections_schema: Optional[List[Dict[str, Any]]] = None
    change_summary: Optional[str] = "Updated template configuration"

class ProposalTemplateOut(ProposalTemplateBase):
    id: str
    approval_status: str
    current_version: int
    approved_by_id: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_by_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

