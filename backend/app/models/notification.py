"""
Notification model.
All notifications are stored off-chain.
Supports email, push, and in-app channels.
"""

import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class NotificationType(str, PyEnum):
    DONATION_RECEIVED = "donation_received"
    MILESTONE_APPROVED = "milestone_approved"
    MILESTONE_REJECTED = "milestone_rejected"
    REPORT_SUBMITTED = "report_submitted"
    REVIEW_REQUIRED = "review_required"       # HITL queue notification
    REFUND_INITIATED = "refund_initiated"
    REFUND_COMPLETED = "refund_completed"
    CAMPAIGN_FUNDED = "campaign_funded"
    CAMPAIGN_EXPIRED = "campaign_expired"
    KYC_STATUS_CHANGED = "kyc_status_changed"
    SYSTEM = "system"


class NotificationChannel(str, PyEnum):
    IN_APP = "in_app"
    EMAIL = "email"
    PUSH = "push"
    WEBHOOK = "webhook"


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    type: Mapped[NotificationType] = mapped_column(
        Enum(NotificationType, name="notification_type"), nullable=False
    )
    channel: Mapped[NotificationChannel] = mapped_column(
        Enum(NotificationChannel, name="notification_channel"),
        default=NotificationChannel.IN_APP,
        nullable=False,
    )

    title: Mapped[str] = mapped_column(String(256), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)

    # Extra data for frontend rendering
    payload: Mapped[dict | None] = mapped_column(JSONB)
    # e.g. {"campaign_id": "...", "milestone_id": "...", "amount": 5000}

    # State
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Delivery status
    is_sent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    error_message: Mapped[str | None] = mapped_column(Text)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="notifications")  # noqa: F821

    def __repr__(self) -> str:
        return f"<Notification id={self.id} type={self.type} user={self.user_id} read={self.is_read}>"
