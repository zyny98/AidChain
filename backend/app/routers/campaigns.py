from datetime import datetime
from decimal import Decimal
from typing import List, Optional
import uuid
from fastapi import APIRouter, HTTPException, Query, status

from app.models.campaign import CampaignStatus
from app.models.milestone import MilestoneStatus
from app.schemas.campaign import CampaignCreate, CampaignListResponse, CampaignResponse
from app.schemas.milestone import MilestoneResponse
from app.services.blockchain import blockchain_service

router = APIRouter(prefix="/campaigns", tags=["Campaigns"])

# In-memory storage for resilient demo execution
CAMPAIGNS_DB: dict[uuid.UUID, CampaignResponse] = {}

def init_mock_campaigns():
    if CAMPAIGNS_DB:
        return
    # 1. Ремонт детской площадки в Астане (из примера ТЗ)
    c1_id = uuid.UUID("a1111111-1111-1111-1111-111111111111")
    c1_creator = uuid.UUID("u1111111-1111-1111-1111-111111111111")
    m1_id = uuid.UUID("m1111111-1111-1111-1111-111111111111")
    m2_id = uuid.UUID("m2222222-2222-2222-2222-222222222222")
    
    CAMPAIGNS_DB[c1_id] = CampaignResponse(
        id=c1_id,
        creator_id=c1_creator,
        title="Ремонт и безопасное покрытие детской площадки",
        description="Сбор на закупку краски, резинового покрытия и ремонт игровых конструкций во дворе школы №15.",
        category="Благоустройство",
        cover_image_url="https://images.unsplash.com/photo-1576085898323-218337e3e43c?auto=format&fit=crop&w=800&q=80",
        goal_amount=Decimal("500000.00"),
        raised_amount=Decimal("350000.00"),
        currency="KZT",
        status=CampaignStatus.ACTIVE,
        contract_campaign_id="1",
        contract_tx_hash="0x4b7f8e3a2d1c9b8a7e6f5d4c3b2a1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d",
        blockchain_confirmed=True,
        legal_entity_name="ОФ «Мөлдір Болашақ»",
        legal_entity_bin="190440032190",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        milestones=[
            MilestoneResponse(
                id=m1_id,
                campaign_id=c1_id,
                order_index=0,
                title="Этап 1: Закупка краски, кистей и грунтовки",
                description="Приобретение лакокрасочных материалов для конструкций",
                budget_amount=Decimal("50000.00"),
                spent_amount=Decimal("50000.00"),
                currency="KZT",
                status=MilestoneStatus.APPROVED,
                report_hash="0x9e8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            ),
            MilestoneResponse(
                id=m2_id,
                campaign_id=c1_id,
                order_index=1,
                title="Этап 2: Резиновая плитка и монтаж",
                description="Закупка травмобезопасного резинового покрытия 120 кв.м.",
                budget_amount=Decimal("350000.00"),
                spent_amount=Decimal("0.00"),
                currency="KZT",
                status=MilestoneStatus.PENDING,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
        ]
    )

init_mock_campaigns()

@router.get("", response_model=CampaignListResponse)
async def list_campaigns(
    category: Optional[str] = None,
    status_filter: Optional[CampaignStatus] = None,
):
    items = list(CAMPAIGNS_DB.values())
    if category:
        items = [c for c in items if c.category == category]
    if status_filter:
        items = [c for c in items if c.status == status_filter]
    return CampaignListResponse(total=len(items), items=items)

@router.post("", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
async def create_campaign(payload: CampaignCreate):
    c_id = uuid.uuid4()
    creator_id = uuid.uuid4()
    
    milestone_responses = []
    for idx, m in enumerate(payload.milestones):
        m_id = uuid.uuid4()
        milestone_responses.append(
            MilestoneResponse(
                id=m_id,
                campaign_id=c_id,
                order_index=idx,
                title=m.title,
                description=m.description,
                budget_amount=m.budget_amount,
                spent_amount=Decimal("0.00"),
                currency=m.currency,
                status=MilestoneStatus.PENDING,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
        )

    # Generate simulated on-chain campaign ID and tx_hash
    tx_hash = f"0x{uuid.uuid4().hex}{uuid.uuid4().hex[:32]}"
    campaign_resp = CampaignResponse(
        id=c_id,
        creator_id=creator_id,
        title=payload.title,
        description=payload.description,
        category=payload.category,
        cover_image_url=payload.cover_image_url or "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80",
        goal_amount=payload.goal_amount,
        raised_amount=Decimal("0.00"),
        currency=payload.currency,
        status=CampaignStatus.ACTIVE,
        contract_campaign_id=str(len(CAMPAIGNS_DB) + 1),
        contract_tx_hash=tx_hash,
        blockchain_confirmed=True,
        legal_entity_name=payload.legal_entity_name,
        legal_entity_bin=payload.legal_entity_bin,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        milestones=milestone_responses,
    )

    CAMPAIGNS_DB[c_id] = campaign_resp
    return campaign_resp

@router.get("/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(campaign_id: uuid.UUID):
    if campaign_id not in CAMPAIGNS_DB:
        raise HTTPException(status_code=404, detail="Кампания не найдена")
    return CAMPAIGNS_DB[campaign_id]

@router.get("/{campaign_id}/audit")
async def get_campaign_audit_trail(campaign_id: uuid.UUID):
    if campaign_id not in CAMPAIGNS_DB:
        raise HTTPException(status_code=404, detail="Кампания не найдена")
    events = await blockchain_service.get_audit_trail_events(1)
    return {
        "campaign_id": campaign_id,
        "contract_address": blockchain_service.contract_address,
        "events": events
    }
