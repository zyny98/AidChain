"""Milestones router for AIDCHAIN — proof upload and status."""
import uuid
import hashlib
from datetime import datetime
from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from typing import Optional

router = APIRouter(prefix="/milestones", tags=["Milestones"])

REPORTS_DB: dict = {}

@router.post("/{milestone_id}/reports")
async def upload_proof(
    milestone_id: uuid.UUID,
    receipt_file: UploadFile = File(...),
    goods_photo: Optional[UploadFile] = File(None),
    milestone_title: str = Form(""),
):
    """Upload procurement receipt or distribution proof. Returns SHA-256 hash."""
    content = await receipt_file.read()
    sha256 = hashlib.sha256(content).hexdigest()
    bytes32_hash = "0x" + sha256

    report_id = uuid.uuid4()
    tx_hash = f"0x{uuid.uuid4().hex}{uuid.uuid4().hex[:32]}"

    report = {
        "id": str(report_id),
        "milestone_id": str(milestone_id),
        "filename": receipt_file.filename,
        "sha256_hash": sha256,
        "bytes32_hash": bytes32_hash,
        "tx_hash": tx_hash,
        "blockchain_url": f"https://amoy.polygonscan.com/tx/{tx_hash}",
        "status": "submitted",
        "uploaded_at": datetime.utcnow().isoformat(),
    }
    REPORTS_DB[str(report_id)] = report
    return report

@router.get("/{milestone_id}/reports")
async def get_milestone_reports(milestone_id: uuid.UUID):
    items = [r for r in REPORTS_DB.values() if r["milestone_id"] == str(milestone_id)]
    return {"total": len(items), "items": items}
