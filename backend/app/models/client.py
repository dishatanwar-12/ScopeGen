import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.core.database import Base

class Client(Base):
    __tablename__ = "clients"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    primary_contact_name: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_email: Mapped[str] = mapped_column(String(255), nullable=False)
    industry: Mapped[str] = mapped_column(String(100), nullable=False)
    website: Mapped[str] = mapped_column(String(255), nullable=True)
    background: Mapped[str] = mapped_column(Text, nullable=True)
    internal_notes: Mapped[str] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    owner = relationship("User", back_populates="clients")
    projects = relationship("Project", back_populates="client", cascade="all, delete-orphan")

