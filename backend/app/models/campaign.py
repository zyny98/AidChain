"""
Campaign model.
On-chain: campaign_id (hash), total_goal, contract_address.
Off-chain: description, media URLs, creator personal info.
"""

import uuid
from datetime import datetime
from decimal import Decimal
from enum import Enum as PyEnum

from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class CampaignStatus(str, PyEnum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Campaign(Base):
    __tablename__ = "campaigns"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # Off-chain metadata
    title: Mapped[str] = mapped_column(String(256), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str | None] = mapped_column(String(64))
    cover_image_url: Mapped[str | None] = mapped_column(Text)

    # Financial
    goal_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    raised_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=Decimal("0.00"), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="KZT", nullable=False)

    # Status
    status: Mapped[CampaignStatus] = mapped_column(
        Enum(CampaignStatus, name="campaign_status"),
        default=CampaignStatus.DRAFT,
        nullable=False,
    )

    # Dates
    start_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    end_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # On-chain data (stored off-chain as reference)
    contract_campaign_id: Mapped[str | None] = mapped_column(
        String(66), unique=True, index=True
    )  # keccak256 ID used in smart contract
    contract_tx_hash: Mapped[str | None] = mapped_column(String(66))  # creation tx
    blockchain_confirmed: Mapped[bool] = mapped_column(default=False, nullable=False)

    # KYC / legal
    legal_entity_name: Mapped[str | None] = mapped_column(String(256))
    legal_entity_bin: Mapped[str | None] = mapped_column(String(12))  # Казахстанский БИН
    legal_document_hash: Mapped[str | None] = mapped_column(String(66))

    # Creator
    creator_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )

    # Extra metadata stored as JSONB
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSONB)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    creator: Mapped["User"] = relationship(  # noqa: F821
        "User", back_populates="campaigns"
    )
    milestones: Mapped[list["Milestone"]] = relationship(  # noqa: F821
        "Milestone", back_populates="campaign", order_by="Milestone.order_index", lazy="selectin"
    )
    donations: Mapped[list["Donation"]] = relationship(  # noqa: F821
        "Donation", back_populates="campaign", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Campaign id={self.id} title={self.title!r} status={self.status}>"
