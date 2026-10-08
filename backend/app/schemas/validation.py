from __future__ import annotations
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.models.validation import ValidationVerdict, ValidationSource

class ReceiptItem(BaseModel):
    name: str
    quantity: Decimal = Decimal("1.00")
    price: Decimal
    total: Decimal

class ExtractedReceiptData(BaseModel):
    vendor_name: Optional[str] = None
    vendor_bin_iin: Optional[str] = None
    receipt_number: Optional[str] = None
    receipt_date: Optional[str] = None
    items: List[ReceiptItem] = []
    total_amount: Optional[Decimal] = None
    raw_text: Optional[str] = None
    is_fiscal: bool = True

class AIValidateRequest(BaseModel):
    milestone_id: uuid.UUID
    receipt_image_base64: Optional[str] = None
    goods_image_base64: Optional[str] = None

class AIValidateResponse(BaseModel):
    report_id: uuid.UUID
    verdict: ValidationVerdict
    confidence_score: int
    fraud_score: int
    reasons: List[str]
    extracted_data: ExtractedReceiptData
    sha256_hash: str
    oracle_signature: Optional[str] = None
    needs_hitl: bool = False

class AdminDecisionRequest(BaseModel):
    verdict: ValidationVerdict
    comment: Optional[str] = None

class ValidationResponse(BaseModel):
    id: uuid.UUID
    report_id: uuid.UUID
    reviewed_by: Optional[uuid.UUID] = None
    verdict: ValidationVerdict
    source: ValidationSource
    confidence_score: Optional[int] = None
    fraud_score: Optional[int] = None
    reasons: Optional[List[str]] = None
    extracted_data: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True
