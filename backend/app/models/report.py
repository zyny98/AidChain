"""
Report model.
Represents an uploaded receipt/report file for a milestone.
The SHA-256 hash is computed before upload and stored both
in Supabase Storage metadata and on-chain.
"""

import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ReportStatus(str, PyEnum):
    UPLOADED = "uploaded"         # file uploaded, hash computed
    AI_PROCESSING = "ai_processing"  # AI validation in progress
    AI_APPROVED = "ai_approved"   # AI auto-approved
    AI_REJECTED = "ai_rejected"   # AI auto-rejected
    HITL_QUEUE = "hitl_queue"     # sent to human review
    ADMIN_APPROVED = "admin_approved"
    ADMIN_REJECTED = "admin_rejected"


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    milestone_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("milestones.id", ondelete="CASCADE"), nullable=False, index=True
    )
    uploaded_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )

    # File metadata
    original_filename: Mapped[str] = mapped_column(String(256), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(64), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)

    # Integrity (computed BEFORE upload, never changes)
    sha256_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)

    # Supabase Storage
    storage_path: Mapped[str] = mapped_column(Text, nullable=False)
    # Signed URL is generated on demand, not stored

    # Status
    status: Mapped[ReportStatus] = mapped_column(
        Enum(ReportStatus, name="report_status"),
        default=ReportStatus.UPLOADED,
        nullable=False,
    )

    # Processing notes
    admin_notes: Mapped[str | None] = mapped_column(Text)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    milestone: Mapped["Milestone"] = relationship("Milestone", back_populates="reports")  # noqa: F821
    uploader: Mapped["User"] = relationship("User", foreign_keys=[uploaded_by])  # noqa: F821
    validations: Mapped[list["Validation"]] = relationship(  # noqa: F821
        "Validation", back_populates="report", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Report id={self.id} hash={self.sha256_hash[:16]}... status={self.status}>"
