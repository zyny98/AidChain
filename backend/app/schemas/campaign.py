from __future__ import annotations
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any, List, Optional
from pydantic import BaseModel, Field
from app.models.campaign import CampaignStatus
from app.schemas.milestone import BudgetItem, MilestoneCreate, MilestoneResponse

class CampaignBase(BaseModel):
    title: str = Field(..., max_length=256)
    description: Optional[str] = None
    category: Optional[str] = "charity"
    cover_image_url: Optional[str] = None
    goal_amount: Decimal = Field(..., gt=0)
    currency: str = "KZT"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    legal_entity_name: Optional[str] = None
    legal_entity_bin: Optional[str] = None

class CampaignCreate(CampaignBase):
    milestones: List[MilestoneCreate] = Field(..., min_items=1)

class CampaignUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    cover_image_url: Optional[str] = None
    status: Optional[CampaignStatus] = None

class CampaignResponse(CampaignBase):
    id: uuid.UUID
    creator_id: uuid.UUID
    status: CampaignStatus
    raised_amount: Decimal
    contract_campaign_id: Optional[str] = None
    contract_tx_hash: Optional[str] = None
    blockchain_confirmed: bool = False
    created_at: datetime
    updated_at: datetime
    milestones: List[MilestoneResponse] = []

    class Config:
        from_attributes = True

class CampaignListResponse(BaseModel):
    total: int
    items: List[CampaignResponse]
