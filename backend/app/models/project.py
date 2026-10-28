import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.core.database import Base

class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    client_id: Mapped[str] = mapped_column(String(36), ForeignKey("clients.id", ondelete="CASCADE"), index=True, nullable=False)
    
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    project_type: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g., Cloud Migration, Custom AI, Web App
    business_problem: Mapped[str] = mapped_column(Text, nullable=False)
    desired_outcomes: Mapped[str] = mapped_column(Text, nullable=False)
    existing_environment: Mapped[str] = mapped_column(Text, nullable=True)
    known_constraints: Mapped[str] = mapped_column(Text, nullable=True)
    required_integrations: Mapped[str] = mapped_column(Text, nullable=True)
    delivery_approach: Mapped[str] = mapped_column(Text, nullable=True)
    target_dates: Mapped[str] = mapped_column(String(255), nullable=True)
    internal_owner: Mapped[str] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="intake", nullable=False) # intake, in_review, proposal_ready, archived

    # Selected packages and templates
    service_package_id: Mapped[str] = mapped_column(String(36), ForeignKey("service_packages.id", ondelete="SET NULL"), nullable=True)
    proposal_template_id: Mapped[str] = mapped_column(String(36), ForeignKey("proposal_templates.id", ondelete="SET NULL"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    owner = relationship("User", back_populates="projects")
    client = relationship("Client", back_populates="projects")
    service_package = relationship("ServicePackage")
    proposal_template = relationship("ProposalTemplate")
    discovery_notes = relationship("DiscoveryNote", back_populates="project", cascade="all, delete-orphan")
    source_documents = relationship("SourceDocument", back_populates="project", cascade="all, delete-orphan")
    proposals = relationship("Proposal", back_populates="project", cascade="all, delete-orphan")
