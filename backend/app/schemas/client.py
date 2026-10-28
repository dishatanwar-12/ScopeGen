from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class ClientBase(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=255)
    primary_contact_name: str = Field(..., min_length=2, max_length=255)
    contact_email: EmailStr
    industry: str = Field(..., min_length=2, max_length=100)
    website: Optional[str] = Field(None, max_length=255)
    background: Optional[str] = None
    internal_notes: Optional[str] = None

class ClientCreate(ClientBase):
    pass

class ClientUpdate(BaseModel):
    company_name: Optional[str] = Field(None, min_length=2, max_length=255)
    primary_contact_name: Optional[str] = Field(None, min_length=2, max_length=255)
    contact_email: Optional[EmailStr] = None
    industry: Optional[str] = Field(None, min_length=2, max_length=100)
    website: Optional[str] = None
    background: Optional[str] = None
    internal_notes: Optional[str] = None

class ClientOut(ClientBase):
    id: str
    owner_id: str
    created_at: datetime
    updated_at: datetime
    project_count: Optional[int] = 0

    class Config:
        from_attributes = True

