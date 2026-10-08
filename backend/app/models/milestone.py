"""
Milestone model.
Each campaign has ordered milestones with a budget (смета).
On-chain: milestone_index, budget_amount, report_hash, status.
"""

import uuid
from datetime import datetime
from decimal import Decimal
from enum import Enum as PyEnum

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class MilestoneStatus(str, PyEnum):
    PENDING = "pending"          # waiting to start
    IN_PROGRESS = "in_progress"  # charity is spending
    REPORT_SUBMITTED = "report_submitted"  # report uploaded, AI validating
    APPROVED = "approved"        # oracle signed, funds released
    REJECTED = "rejected"        # oracle rejected, refund triggered
    NEEDS_REVIEW = "needs_review"  # sent to HITL queue


class Milestone(Base):
    __tablename__ = "milestones"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    campaign_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Ordering
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)  # 0-based index in smart contract

    # Descriptive
    title: Mapped[str] = mapped_column(String(256), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    # Financial plan (смета)
    budget_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    spent_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=Decimal("0.00"), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="KZT", nullable=False)

    # Detailed budget breakdown stored as JSONB
    # [{"item": "...", "quantity": 1, "unit_price": 1000.00, "total": 1000.00}]
    budget_breakdown: Mapped[list | None] = mapped_column(JSONB)

    # Dates
    planned_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    planned_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    actual_completion: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Status
    status: Mapped[MilestoneStatus] = mapped_column(
        Enum(MilestoneStatus, name="milestone_status"),
        default=MilestoneStatus.PENDING,
        nullable=False,
    )

    # On-chain references
    report_hash: Mapped[str | None] = mapped_column(String(66))       # SHA-256 of approved report
    approval_tx_hash: Mapped[str | None] = mapped_column(String(66))  # tx that released funds
    oracle_signature: Mapped[str | None] = mapped_column(Text)        # ECDSA signature from oracle

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    campaign: Mapped["Campaign"] = relationship(  # noqa: F821
        "Campaign", back_populates="milestones"
    )
    reports: Mapped[list["Report"]] = relationship(  # noqa: F821
        "Report", back_populates="milestone", lazy="selectin"
    )

    def __repr__(self) -> str:
        return (
            f"<Milestone id={self.id} campaign={self.campaign_id} "
            f"idx={self.order_index} status={self.status}>"
        )
