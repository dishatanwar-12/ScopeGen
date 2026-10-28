from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class ServicePackageBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=255)
    category: str = Field(..., min_length=2, max_length=100)
    description: str = Field(..., min_length=5)
    intended_use: str = Field(..., min_length=5)
    
    included_deliverables: List[Dict[str, Any]] = Field(default_factory=list)
    # [{"name": "Architecture Design Document", "description": "High-level diagrams and component models"}]
    included_activities: List[str] = Field(default_factory=list)
    excluded_activities: List[str] = Field(default_factory=list)
    dependencies: List[str] = Field(default_factory=list)
    constraints: List[str] = Field(default_factory=list)
    optional_modules: List[Dict[str, Any]] = Field(default_factory=list)

    # Commercial Fields (Approved structured data)
    pricing_model: str = Field("unspecified", pattern="^(fixed_fee|time_and_materials|retainer|unspecified)$")
    currency: Optional[str] = Field(None, max_length=10)
    fixed_fee_amount: Optional[float] = None
    hourly_rate: Optional[float] = None
    payment_schedule: Optional[str] = None
    commercial_terms: Optional[str] = None

class ServicePackageCreate(ServicePackageBase):
    pass

class ServicePackageUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=255)
    category: Optional[str] = None
    description: Optional[str] = None
    intended_use: Optional[str] = None
    included_deliverables: Optional[List[Dict[str, Any]]] = None
    included_activities: Optional[List[str]] = None
    excluded_activities: Optional[List[str]] = None
    dependencies: Optional[List[str]] = None
    constraints: Optional[List[str]] = None
    optional_modules: Optional[List[Dict[str, Any]]] = None
    pricing_model: Optional[str] = None
    currency: Optional[str] = None
    fixed_fee_amount: Optional[float] = None
    hourly_rate: Optional[float] = None
    payment_schedule: Optional[str] = None
    commercial_terms: Optional[str] = None
    change_summary: Optional[str] = "Updated package details"

class ServicePackageOut(ServicePackageBase):
    id: str
    current_version: int
    approval_status: str
    approved_by_id: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_by_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

