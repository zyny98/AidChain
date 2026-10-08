"""
Validation model.
Stores the full AI validation result for a report.
Includes extracted OCR data, confidence score, fraud flags, and admin decision.
"""

import uuid
from datetime import datetime
from decimal import Decimal
from enum import Enum as PyEnum

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ValidationVerdict(str, PyEnum):
    APPROVED = "approved"
    REJECTED = "rejected"
    NEEDS_REVIEW = "needs_review"


class ValidationSource(str, PyEnum):
    AI_AUTO = "ai_auto"       # automatic AI decision
    ADMIN = "admin"           # human override


class Validation(Base):
    __tablename__ = "validations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    report_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, index=True
    )
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL")
    )  # NULL = AI, non-NULL = admin

    # Verdict
    verdict: Mapped[ValidationVerdict] = mapped_column(
        Enum(ValidationVerdict, name="validation_verdict"), nullable=False
    )
    source: Mapped[ValidationSource] = mapped_column(
        Enum(ValidationSource, name="validation_source"),
        default=ValidationSource.AI_AUTO,
        nullable=False,
    )

    # AI scores
    confidence_score: Mapped[int | None] = mapped_column()  # 0–100
    fraud_score: Mapped[int | None] = mapped_column()       # 0–100 (higher = more suspicious)

    # Extracted OCR data (stored as JSONB for flexibility)
    extracted_data: Mapped[dict | None] = mapped_column(JSONB)
    # Example:
    # {
    #   "vendor_name": "ТОО Romashka",
    #   "vendor_bin": "123456789012",
    #   "receipt_date": "2024-01-15",
    #   "items": [{"name": "...", "qty": 1, "price": 1000}],
    #   "subtotal": 1000,
    #   "vat": 120,
    #   "total": 1120,
    #   "fiscal_number": "KZ...",
    # }

    # Reasons / flags
    reasons: Mapped[list | None] = mapped_column(JSONB)   # list of reason strings
    fraud_flags: Mapped[list | None] = mapped_column(JSONB)  # anti-fraud flag names

    # Budget comparison
    budget_match_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))  # % deviation
    budget_comparison_notes: Mapped[str | None] = mapped_column(Text)

    # Admin decision (HITL)
    admin_notes: Mapped[str | None] = mapped_column(Text)
    admin_decision_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Raw AI response (for audit)
    raw_ai_response: Mapped[str | None] = mapped_column(Text)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    report: Mapped["Report"] = relationship("Report", back_populates="validations")  # noqa: F821
    reviewer: Mapped["User | None"] = relationship("User", foreign_keys=[reviewed_by])  # noqa: F821

    def __repr__(self) -> str:
        return (
            f"<Validation id={self.id} verdict={self.verdict} "
            f"confidence={self.confidence_score} source={self.source}>"
        )
