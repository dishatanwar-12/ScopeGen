import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, Float, Integer, ForeignKey, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.core.database import Base

class ServicePackage(Base):
    __tablename__ = "service_packages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    intended_use: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Structured Deliverables and Activities stored as JSON
    included_deliverables: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    included_activities: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    excluded_activities: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    dependencies: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    constraints: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    optional_modules: Mapped[list] = mapped_column(JSON, default=list, nullable=False)

    # Approved Structured Commercial Integrity Fields
    # ONLY these fields are authoritative. AI cannot alter these!
    pricing_model: Mapped[str] = mapped_column(String(50), default="unspecified", nullable=False) # fixed_fee, time_and_materials, retainer, unspecified
    currency: Mapped[str] = mapped_column(String(10), nullable=True) # e.g. USD, EUR, INR
    fixed_fee_amount: Mapped[float] = mapped_column(Float, nullable=True)
    hourly_rate: Mapped[float] = mapped_column(Float, nullable=True)
    payment_schedule: Mapped[str] = mapped_column(Text, nullable=True)
    commercial_terms: Mapped[str] = mapped_column(Text, nullable=True)

    # Governance & Approval
    current_version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    approval_status: Mapped[str] = mapped_column(String(50), default="draft", nullable=False) # draft, approved, archived
    approved_by_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    
    created_by_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    versions = relationship("PackageVersion", back_populates="package", cascade="all, delete-orphan")


class PackageVersion(Base):
    __tablename__ = "package_versions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    package_id: Mapped[str] = mapped_column(String(36), ForeignKey("service_packages.id", ondelete="CASCADE"), index=True, nullable=False)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    snapshot_data: Mapped[dict] = mapped_column(JSON, nullable=False)
    change_summary: Mapped[str] = mapped_column(String(255), nullable=True)
    
    created_by_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    package = relationship("ServicePackage", back_populates="versions")

