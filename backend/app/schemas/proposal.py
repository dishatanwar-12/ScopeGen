from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from backend.app.schemas.question import ConfirmationQuestionOut

class ProposalSectionOut(BaseModel):
    id: str
    proposal_id: str
    section_key: str
    title: str
    content_markdown: str
    sort_order: int
    is_protected: bool
    source_references: List[str]
    version_lock: int
    updated_at: datetime

    class Config:
        from_attributes = True

class ProposalSectionUpdate(BaseModel):
    title: Optional[str] = None
    content_markdown: str
    version_lock: int # optimistic locking: must match current version_lock

class ProposalVersionOut(BaseModel):
    id: str
    proposal_id: str
    version_number: int
    change_summary: str
    created_by_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ProposalOut(BaseModel):
    id: str
    owner_id: str
    project_id: str
    service_package_id: Optional[str] = None
    proposal_template_id: Optional[str] = None
    title: str
    status: str
    current_version_number: int
    generation_metadata: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
    
    project_title: Optional[str] = None
    client_name: Optional[str] = None
    service_package_name: Optional[str] = None
    sections: List[ProposalSectionOut] = []
    questions: List[ConfirmationQuestionOut] = []

    class Config:
        from_attributes = True

class FactReviewRequest(BaseModel):
    project_id: str
    service_package_id: Optional[str] = None
    proposal_template_id: Optional[str] = None

class FactReviewResponse(BaseModel):
    confirmed_facts: List[Dict[str, str]]
    client_goals: List[str]
    package_derived_deliverables: List[Dict[str, Any]]
    package_derived_activities: List[str]
    package_exclusions: List[str]
    explicitly_agreed_decisions: List[str]
    unconfirmed_assumptions: List[str]
    missing_information: List[str]
    contradictions: List[str]
    scope_ambiguities: List[str]
    commercial_status: Dict[str, Any]
    can_generate: bool
    readiness_score: int # 0 to 100

class ProposalGenerateRequest(BaseModel):
    project_id: str
    service_package_id: str
    proposal_template_id: Optional[str] = None
    custom_instructions: Optional[str] = None
    override_title: Optional[str] = None

class ProposalRegenerateSectionRequest(BaseModel):
    section_key: str
    instructions: Optional[str] = None

# Structured Output Schema for NVIDIA LLM Generation
class GeneratedSectionModel(BaseModel):
    section_key: str
    title: str
    content_markdown: str
    source_references: List[str] = Field(default_factory=list)

class GeneratedQuestionModel(BaseModel):
    question: str
    category: str # pricing, timeline, scope, technical, dependency
    rationale: str
    impact: str
    suggested_role: Optional[str] = None

class GeneratedProposalModel(BaseModel):
    proposal_title: str
    executive_summary: str
    client_background: str
    business_problem: str
    objectives_and_outcomes: str
    proposed_solution: str
    in_scope_deliverables: List[Dict[str, str]] # [{"name": "...", "description": "...", "acceptance_criteria": "..."}]
    out_of_scope_exclusions: List[str]
    assumptions: List[str]
    dependencies: List[str]
    client_responsibilities: List[str]
    milestones_and_sequencing: List[Dict[str, str]] # [{"milestone": "Phase 1: Architecture", "order": "1", "activities": "..."}]
    risks_and_mitigations: List[Dict[str, str]] # [{"risk": "...", "mitigation": "..."}]
    unresolved_questions: List[GeneratedQuestionModel] = Field(default_factory=list)
    internal_review_warnings: List[str] = Field(default_factory=list)

