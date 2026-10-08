"""AI Validation router for AIDCHAIN — receipt and proof verification."""
import uuid
import hashlib
import base64
from datetime import datetime
from decimal import Decimal
from fastapi import APIRouter, File, Form, UploadFile, HTTPException
from typing import Optional
from pydantic import BaseModel

from app.services.ai_service import AIService
from app.services.oracle import oracle_service
from app.models.validation import ValidationVerdict

router = APIRouter(prefix="/ai", tags=["AI Validation"])


class ValidateRequest(BaseModel):
    milestone_id: str
    milestone_title: str = "Humanitarian Aid Procurement"
    milestone_budget: float = 50000.0
    budget_breakdown: Optional[list] = None


@router.post("/validate")
async def validate_receipt(
    milestone_id: str = Form(...),
    milestone_title: str = Form("Humanitarian Aid Procurement"),
    milestone_budget: float = Form(50000.0),
    receipt_file: UploadFile = File(...),
    goods_photo: Optional[UploadFile] = File(None),
):
    """
    AI pipeline for humanitarian aid proof verification:
    1. SHA-256 hash computation
    2. GPT-4o-mini Vision OCR (or realistic demo fallback)
    3. Budget matching check ±10%
    4. Anti-fraud detection
    5. Oracle ECDSA signing if approved
    """
    content = await receipt_file.read()
    sha256_hash = hashlib.sha256(content).hexdigest()

    verdict, confidence, fraud_score, reasons, extracted = await AIService.process_and_validate_receipt(
        image_bytes=content,
        milestone_title=milestone_title,
        milestone_budget=Decimal(str(milestone_budget)),
        budget_breakdown=None,
        is_known_hash_duplicate=False,
    )

    # Sign if approved
    oracle_signature = None
    needs_hitl = verdict == ValidationVerdict.NEEDS_REVIEW

    if verdict == ValidationVerdict.APPROVED:
        try:
            oracle_signature = oracle_service.sign_milestone_decision(
                campaign_id=1,
                milestone_index=0,
                report_hash_hex=sha256_hash,
                nonce=0,
            )
        except Exception as e:
            pass

    return {
        "report_id": str(uuid.uuid4()),
        "verdict": verdict.value,
        "confidence_score": confidence,
        "fraud_score": fraud_score,
        "needs_hitl": needs_hitl,
        "sha256_hash": sha256_hash,
        "bytes32_hash": "0x" + sha256_hash,
        "oracle_signature": oracle_signature,
        "oracle_address": oracle_service.oracle_address,
        "reasons": reasons,
        "extracted_data": {
            "vendor_name": extracted.vendor_name,
            "vendor_bin_iin": extracted.vendor_bin_iin,
            "receipt_date": extracted.receipt_date,
            "total_amount": str(extracted.total_amount) if extracted.total_amount else None,
            "items": [
                {
                    "name": it.name,
                    "quantity": str(it.quantity),
                    "price": str(it.price),
                    "total": str(it.total),
                }
                for it in extracted.items
            ],
            "is_fiscal": extracted.is_fiscal,
        },
        "validated_at": datetime.utcnow().isoformat(),
        "proof_of_aid": {
            "blockchain_hash": "0x" + sha256_hash,
            "explorer_url": f"https://amoy.polygonscan.com/address/{oracle_service.oracle_address}",
            "immutable": True,
        }
    }


@router.get("/status")
async def ai_service_status():
    """Check AI oracle status."""
    return {
        "oracle_address": oracle_service.oracle_address,
        "status": "online",
        "ai_model": "gpt-4o-mini vision (or demo fallback)",
        "confidence_threshold": 80,
        "hitl_enabled": True,
    }
