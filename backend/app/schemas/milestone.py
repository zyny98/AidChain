from __future__ import annotations
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any, List, Optional
from pydantic import BaseModel, Field
from app.models.milestone import MilestoneStatus

class BudgetItem(BaseModel):
    item: str
    quantity: Decimal = Decimal("1.00")
    unit_price: Decimal
    total: Decimal
    unit: Optional[str] = "шт"

class MilestoneBase(BaseModel):
    order_index: int = Field(..., ge=0)
    title: str = Field(..., max_length=256)
    description: Optional[str] = None
    budget_amount: Decimal = Field(..., gt=0)
    currency: str = "KZT"
    planned_start: Optional[datetime] = None
    planned_end: Optional[datetime] = None
    budget_breakdown: Optional[List[BudgetItem]] = None

class MilestoneCreate(MilestoneBase):
    pass

class MilestoneUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[MilestoneStatus] = None
    spent_amount: Optional[Decimal] = None

class MilestoneResponse(MilestoneBase):
    id: uuid.UUID
    campaign_id: uuid.UUID
    spent_amount: Decimal
    status: MilestoneStatus
    on_chain_index: Optional[int] = None
    on_chain_status: Optional[int] = None
    report_hash: Optional[str] = None
    actual_completion: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
