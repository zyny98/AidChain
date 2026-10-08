from __future__ import annotations
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field
from app.models.donation import DonationStatus, PaymentMethod

class DonationCreate(BaseModel):
    campaign_id: uuid.UUID
    amount: Decimal = Field(..., gt=0)
    currency: str = "KZT"
    payment_method: PaymentMethod = PaymentMethod.CARD_SIMULATED
    donor_name: Optional[str] = "Анонимный донор"
    comment: Optional[str] = None

class DonationResponse(BaseModel):
    id: uuid.UUID
    campaign_id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    donor_name: Optional[str] = None
    amount: Decimal
    currency: str
    token_amount: Optional[Decimal] = None
    payment_method: PaymentMethod
    status: DonationStatus
    tx_hash: Optional[str] = None
    on_chain_confirmed: bool = False
    refunded_amount: Optional[Decimal] = None
    refund_tx_hash: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class RefundRequest(BaseModel):
    donation_id: uuid.UUID
    reason: Optional[str] = None
