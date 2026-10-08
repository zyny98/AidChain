import logging
from typing import Any, Dict, List, Optional
from web3 import Web3

from app.config import settings

logger = logging.getLogger(__name__)

# Minimal ABI for ClearGrantEscrow events and reading
ESCROW_ABI = [
    {
        "name": "getCampaign",
        "type": "function",
        "inputs": [{"name": "campaignId", "type": "uint256"}],
        "outputs": [
            {"name": "organizer", "type": "address"},
            {"name": "oracle", "type": "address"},
            {"name": "token", "type": "address"},
            {"name": "fundingGoal", "type": "uint256"},
            {"name": "totalDeposited", "type": "uint256"},
            {"name": "totalReleased", "type": "uint256"},
            {"name": "advanceReleased", "type": "bool"},
            {"name": "oracleNonce", "type": "uint256"},
            {"name": "active", "type": "bool"},
            {"name": "milestoneCount", "type": "uint256"}
        ]
    },
    {
        "name": "approveMilestone",
        "type": "function",
        "inputs": [
            {"name": "campaignId", "type": "uint256"},
            {"name": "milestoneIndex", "type": "uint256"},
            {"name": "signature", "type": "bytes"}
        ],
        "outputs": []
    }
]

class BlockchainService:
    def __init__(self):
        self.rpc_url = settings.RPC_URL
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        self.contract_address = settings.CONTRACT_ADDRESS
        
    def is_connected(self) -> bool:
        try:
            return self.w3.is_connected()
        except Exception:
            return False

    def get_explorer_url(self, tx_hash: str) -> str:
        """Returns explorer URL for Polygon Amoy or Sepolia."""
        base = "https://amoy.polygonscan.com/tx/"
        return f"{base}{tx_hash}"

    async def get_audit_trail_events(self, campaign_id: int) -> List[Dict[str, Any]]:
        """Returns structured audit trail events for UI display."""
        # Standard events that always show in demo audit trail
        return [
            {
                "event": "CampaignCreated",
                "title": "Кампания создана и зафиксирована в блокчейне",
                "tx_hash": "0x4b7f8e3a2d1c9b8a7e6f5d4c3b2a1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d",
                "block_number": 12849201,
                "timestamp": "2026-10-06T10:00:00Z"
            },
            {
                "event": "Donated",
                "title": "Взнос заблокирован в смарт-контракте эскроу",
                "tx_hash": "0x8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b",
                "block_number": 12849245,
                "timestamp": "2026-10-06T10:15:00Z"
            },
            {
                "event": "AdvanceReleased",
                "title": "Аванс 20% выплачен организатору после достижения цели сбора",
                "tx_hash": "0x1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d",
                "block_number": 12849300,
                "timestamp": "2026-10-06T10:30:00Z"
            }
        ]

blockchain_service = BlockchainService()
