"""
Vendor model.
Stores known vendors extracted from receipts.
Used for price benchmarking and duplicate/fraud detection.
"""

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Vendor(Base):
    __tablename__ = "vendors"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # Identification (from Казахстан fiscal system)
    bin_iin: Mapped[str] = mapped_column(String(12), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    legal_form: Mapped[str | None] = mapped_column(String(64))  # ТОО, ИП, АО, etc.
    category: Mapped[str | None] = mapped_column(String(64))     # construction, food, medical, etc.

    # Address
    address: Mapped[str | None] = mapped_column(Text)
    city: Mapped[str | None] = mapped_column(String(64))
    region: Mapped[str | None] = mapped_column(String(64))

    # Price benchmarking data
    # {"item_name": {"min": 100, "max": 500, "avg": 300, "unit": "kg"}}
    price_benchmarks: Mapped[dict | None] = mapped_column(JSONB)

    # Fraud metadata
    is_flagged: Mapped[bool] = mapped_column(default=False, nullable=False)
    flag_reason: Mapped[str | None] = mapped_column(Text)
    total_receipts_seen: Mapped[int] = mapped_column(default=0, nullable=False)

    # Average transaction amount (for anomaly detection)
    avg_transaction_amount: Mapped[Decimal | None] = mapped_column(Numeric(18, 2))
    max_transaction_amount: Mapped[Decimal | None] = mapped_column(Numeric(18, 2))

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<Vendor bin={self.bin_iin} name={self.name!r} flagged={self.is_flagged}>"
