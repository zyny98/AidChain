"""Admin router — HITL review queue, whitelist management."""
import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/admin", tags=["Admin"])

REVIEW_QUEUE: list = [
    {
        "id": "rq-001",
        "report_id": "rep-001",
        "milestone_title": "Food Package Procurement — Syria Relief",
        "confidence_score": 67,
        "fraud_score": 33,
        "vendor_name": "Al-Rashid Trading Co.",
        "amount": "$4,200",
        "reasons": [
            "Уровень доверия ниже порога 80% — требуется ручная проверка",
            "Размытый логотип поставщика на чеке",
            "Сумма: $4,200 USDC (смета: $5,000, отклонение -16%)",
        ],
        "submitted_at": "2026-10-06T08:00:00Z",
        "status": "pending_review",
    },
    {
        "id": "rq-002",
        "report_id": "rep-002",
        "milestone_title": "Medical Supplies Distribution — Gaza",
        "confidence_score": 71,
        "fraud_score": 29,
        "vendor_name": "MediSupply Ltd.",
        "amount": "$12,800",
        "reasons": [
            "Дата чека: 2 дня назад — в допустимом периоде",
            "Товарные позиции частично соответствуют смете",
            "Требуется подтверждение сертификата поставщика",
        ],
        "submitted_at": "2026-10-06T10:30:00Z",
        "status": "pending_review",
    }
]

VENDORS_WHITELIST: list = [
    {"id": "v-001", "name": "ICRC Supply Chain", "country": "Geneva", "verified": True},
    {"id": "v-002", "name": "WFP Logistics", "country": "Rome", "verified": True},
    {"id": "v-003", "name": "MSF Procurement", "country": "Paris", "verified": True},
]


class AdminDecision(BaseModel):
    verdict: str  # "approved" | "rejected"
    comment: Optional[str] = None


@router.get("/review-queue")
async def get_review_queue():
    pending = [r for r in REVIEW_QUEUE if r["status"] == "pending_review"]
    return {"total": len(pending), "items": pending}


@router.post("/review/{review_id}")
async def submit_review_decision(review_id: str, decision: AdminDecision):
    item = next((r for r in REVIEW_QUEUE if r["id"] == review_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Review item not found")

    item["status"] = f"admin_{decision.verdict}"
    item["decided_at"] = datetime.utcnow().isoformat()
    item["admin_comment"] = decision.comment

    return {
        "review_id": review_id,
        "verdict": decision.verdict,
        "message": f"Решение администратора: {'Одобрено ✅' if decision.verdict == 'approved' else 'Отклонено ❌'}",
        "tx_hash": f"0x{uuid.uuid4().hex}{uuid.uuid4().hex[:32]}",
    }


@router.get("/vendors")
async def get_vendors():
    return {"total": len(VENDORS_WHITELIST), "items": VENDORS_WHITELIST}


@router.post("/vendors")
async def add_vendor(name: str, country: str):
    vendor = {"id": f"v-{uuid.uuid4().hex[:8]}", "name": name, "country": country, "verified": False}
    VENDORS_WHITELIST.append(vendor)
    return vendor


@router.get("/stats")
async def get_platform_stats():
    """Platform-wide statistics for AIDCHAIN dashboard."""
    return {
        "total_raised_usd": 1_247_500,
        "total_disbursed_usd": 891_300,
        "total_beneficiaries": 14_280,
        "active_programs": 23,
        "ngos_registered": 47,
        "ai_checks_performed": 1_893,
        "ai_auto_approved_pct": 87,
        "countries": ["Syria", "Gaza", "Ukraine", "Yemen", "Sudan"],
    }
