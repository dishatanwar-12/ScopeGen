import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, Boolean, Integer, ForeignKey, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.core.database import Base

class Proposal(Base):
    __tablename__ = "proposals"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=False)
    service_package_id: Mapped[str] = mapped_column(String(36), ForeignKey("service_packages.id", ondelete="SET NULL"), nullable=True)
    proposal_template_id: Mapped[str] = mapped_column(String(36), ForeignKey("proposal_templates.id", ondelete="SET NULL"), nullable=True)
    
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="draft", nullable=False) # draft, in_review, approved, archived
    current_version_number: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    
    # AI generation metadata
    generation_metadata: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    # e.g., {"model": "meta/llama-3.3-70b-instruct", "latency_ms": 3200, "tokens": 1400, "warnings": [...], "generated_at": "..."}
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    owner = relationship("User", back_populates="proposals")
    project = relationship("Project", back_populates="proposals")
    service_package = relationship("ServicePackage")
    proposal_template = relationship("ProposalTemplate")
    sections = relationship("ProposalSection", back_populates="proposal", cascade="all, delete-orphan", order_by="ProposalSection.sort_order")
    versions = relationship("ProposalVersion", back_populates="proposal", cascade="all, delete-orphan", order_by="ProposalVersion.version_number.desc()")
    questions = relationship("ConfirmationQuestion", back_populates="proposal", cascade="all, delete-orphan")


class ProposalSection(Base):
    __tablename__ = "proposal_sections"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    proposal_id: Mapped[str] = mapped_column(String(36), ForeignKey("proposals.id", ondelete="CASCADE"), index=True, nullable=False)
    
    section_key: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content_markdown: Mapped[str] = mapped_column(Text, default="", nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_protected: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    source_references: Mapped[list] = mapped_column(JSON, default=list, nullable=False) # e.g. ["Notes: Line 14", "Package: Included Activities"]
    version_lock: Mapped[int] = mapped_column(Integer, default=1, nullable=False) # optimistic concurrency
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    proposal = relationship("Proposal", back_populates="sections")


class ProposalVersion(Base):
    __tablename__ = "proposal_versions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    proposal_id: Mapped[str] = mapped_column(String(36), ForeignKey("proposals.id", ondelete="CASCADE"), index=True, nullable=False)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    snapshot_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    change_summary: Mapped[str] = mapped_column(String(255), nullable=False)
    
    created_by_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    proposal = relationship("Proposal", back_populates="versions")


class ConfirmationQuestion(Base):
    __tablename__ = "confirmation_questions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    proposal_id: Mapped[str] = mapped_column(String(36), ForeignKey("proposals.id", ondelete="CASCADE"), index=True, nullable=False)
    
    question: Mapped[str] = mapped_column(String(500), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False) # pricing, timeline, scope, technical, dependency
    rationale: Mapped[str] = mapped_column(Text, nullable=False)
    impact: Mapped[str] = mapped_column(Text, nullable=False)
    suggested_role: Mapped[str] = mapped_column(String(100), nullable=True) # e.g. "Client Product Owner" or "Internal Sales Lead"
    
    status: Mapped[str] = mapped_column(String(50), default="open", nullable=False) # open, answered, resolved, dismissed
    answer: Mapped[str] = mapped_column(Text, nullable=True)
    resolved_by_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    proposal = relationship("Proposal", back_populates="questions")
