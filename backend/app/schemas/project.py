from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class ProjectBase(BaseModel):
    client_id: str
    title: str = Field(..., min_length=2, max_length=255)
    project_type: str = Field(..., min_length=2, max_length=100)
    business_problem: str = Field(..., min_length=5)
    desired_outcomes: str = Field(..., min_length=5)
    existing_environment: Optional[str] = None
    known_constraints: Optional[str] = None
    required_integrations: Optional[str] = None
    delivery_approach: Optional[str] = None
    target_dates: Optional[str] = None
    internal_owner: Optional[str] = None
    status: Optional[str] = "intake"
    service_package_id: Optional[str] = None
    proposal_template_id: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=255)
    project_type: Optional[str] = None
    business_problem: Optional[str] = None
    desired_outcomes: Optional[str] = None
    existing_environment: Optional[str] = None
    known_constraints: Optional[str] = None
    required_integrations: Optional[str] = None
    delivery_approach: Optional[str] = None
    target_dates: Optional[str] = None
    internal_owner: Optional[str] = None
    status: Optional[str] = None
    service_package_id: Optional[str] = None
    proposal_template_id: Optional[str] = None

class ProjectOut(ProjectBase):
    id: str
    owner_id: str
    created_at: datetime
    updated_at: datetime
    client_name: Optional[str] = None
    notes_count: Optional[int] = 0
    docs_count: Optional[int] = 0
    proposals_count: Optional[int] = 0

    class Config:
        from_attributes = True
