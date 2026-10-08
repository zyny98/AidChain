"""
Donation model.
On-chain: tx_hash, amount, donor wallet.
Off-chain: donor identity, personal notes.
"""

import uuid
from datetime import datetime
from decimal import Decimal
from enum import Enum as PyEnum

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class DonationStatus(str, PyEnum):
    PENDING = "pending"          # payment initiated, awaiting confirmation
    CONFIRMED = "confirmed"      # on-chain confirmed
    REFUND_REQUESTED = "refund_requested"
    REFUNDED = "refunded"
    FAILED = "failed"


class PaymentMethod(str, PyEnum):
    CRYPTO = "crypto"         # direct wallet transfer
    CARD = "card"             # fiat via payment gateway
    BANK_TRANSFER = "bank_transfer"


class Donation(Base):
    __tablename__ = "donations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    campaign_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("campaigns.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    donor_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), index=True
    )  # nullable = anonymous donation

    # Amount
    amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="KZT", nullable=False)
    amount_usd: Mapped[Decimal | None] = mapped_column(Numeric(18, 6))  # converted for reporting

    # Payment
    payment_method: Mapped[PaymentMethod] = mapped_column(
        Enum(PaymentMethod, name="payment_method"), nullable=False
    )
    status: Mapped[DonationStatus] = mapped_column(
        Enum(DonationStatus, name="donation_status"),
        default=DonationStatus.PENDING,
        nullable=False,
    )

    # On-chain data (only hashes/addresses go on blockchain)
    tx_hash: Mapped[str | None] = mapped_column(String(66), unique=True, index=True)
    donor_wallet: Mapped[str | None] = mapped_column(String(42))  # public wallet address
    block_number: Mapped[int | None] = mapped_column()
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Fiat payment gateway refs (off-chain only)
    gateway_payment_id: Mapped[str | None] = mapped_column(String(128))
    gateway_status: Mapped[str | None] = mapped_column(String(64))

    # Refund
    refund_reason: Mapped[str | None] = mapped_column(Text)
    refund_tx_hash: Mapped[str | None] = mapped_column(String(66))
    refunded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Optional personal message (off-chain)
    message: Mapped[str | None] = mapped_column(Text)
    is_anonymous: Mapped[bool] = mapped_column(default=False, nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    campaign: Mapped["Campaign"] = relationship("Campaign", back_populates="donations")  # noqa: F821
    donor: Mapped["User | None"] = relationship("User", back_populates="donations")  # noqa: F821

    def __repr__(self) -> str:
        return f"<Donation id={self.id} amount={self.amount}{self.currency} status={self.status}>"
