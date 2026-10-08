"""Donations router for AIDCHAIN."""
import uuid
from datetime import datetime
from decimal import Decimal
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional

router = APIRouter(prefix="/donations", tags=["Donations"])

DONATIONS_DB: dict = {}

class DonationIn(BaseModel):
    campaign_id: uuid.UUID
    amount: Decimal = Field(..., gt=0)
    currency: str = "USD"
    donor_name: Optional[str] = "Анонимный донор"

class DonationOut(BaseModel):
    id: uuid.UUID
    campaign_id: uuid.UUID
    donor_name: Optional[str]
    amount: Decimal
    currency: str
    tx_hash: str
    status: str
    created_at: datetime

@router.post("", response_model=DonationOut, status_code=201)
async def create_donation(payload: DonationIn):
    d_id = uuid.uuid4()
    tx_hash = f"0x{uuid.uuid4().hex}{uuid.uuid4().hex[:32]}"
    donation = DonationOut(
        id=d_id,
        campaign_id=payload.campaign_id,
        donor_name=payload.donor_name,
        amount=payload.amount,
        currency=payload.currency,
        tx_hash=tx_hash,
        status="confirmed",
        created_at=datetime.utcnow(),
    )
    DONATIONS_DB[d_id] = donation
    return donation

@router.get("/campaign/{campaign_id}")
async def get_campaign_donations(campaign_id: uuid.UUID):
    items = [d for d in DONATIONS_DB.values() if d.campaign_id == campaign_id]
    return {"total": len(items), "items": items}

@router.post("/{donation_id}/refund")
async def request_refund(donation_id: uuid.UUID):
    if donation_id not in DONATIONS_DB:
        raise HTTPException(status_code=404, detail="Donation not found")
    tx_hash = f"0x{uuid.uuid4().hex}{uuid.uuid4().hex[:32]}"
    return {
        "donation_id": donation_id,
        "refund_tx_hash": tx_hash,
        "status": "refunded",
        "message": "Возврат инициирован. Транзакция записана в блокчейне."
    }
