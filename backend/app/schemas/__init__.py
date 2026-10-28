from backend.app.schemas.user import UserCreate, UserLogin, UserOut, UserUpdate, TokenResponse
from backend.app.schemas.client import ClientCreate, ClientUpdate, ClientOut
from backend.app.schemas.project import ProjectCreate, ProjectUpdate, ProjectOut
from backend.app.schemas.discovery import DiscoveryNoteCreate, DiscoveryNoteOut, SourceDocumentOut, DocumentUploadResponse
from backend.app.schemas.package import ServicePackageCreate, ServicePackageUpdate, ServicePackageOut
from backend.app.schemas.template import ProposalTemplateCreate, ProposalTemplateUpdate, ProposalTemplateOut
from backend.app.schemas.proposal import (
    ProposalOut,
    ProposalSectionOut,
    ProposalSectionUpdate,
    ProposalVersionOut,
    FactReviewRequest,
    FactReviewResponse,
    ProposalGenerateRequest,
    ProposalRegenerateSectionRequest,
    GeneratedProposalModel,
    GeneratedSectionModel
)
from backend.app.schemas.question import ConfirmationQuestionUpdate, ConfirmationQuestionOut

__all__ = [
    "UserCreate",
    "UserLogin",
    "UserOut",
    "UserUpdate",
    "TokenResponse",
    "ClientCreate",
    "ClientUpdate",
    "ClientOut",
    "ProjectCreate",
    "ProjectUpdate",
    "ProjectOut",
    "DiscoveryNoteCreate",
    "DiscoveryNoteOut",
    "SourceDocumentOut",
    "DocumentUploadResponse",
    "ServicePackageCreate",
    "ServicePackageUpdate",
    "ServicePackageOut",
    "ProposalTemplateCreate",
    "ProposalTemplateUpdate",
    "ProposalTemplateOut",
    "ProposalOut",
    "ProposalSectionOut",
    "ProposalSectionUpdate",
    "ProposalVersionOut",
    "FactReviewRequest",
    "FactReviewResponse",
    "ProposalGenerateRequest",
    "ProposalRegenerateSectionRequest",
    "GeneratedProposalModel",
    "GeneratedSectionModel",
    "ConfirmationQuestionUpdate",
    "ConfirmationQuestionOut"
]

