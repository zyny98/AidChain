import os
import logging
from eth_account import Account
from eth_account.messages import encode_defunct
from web3 import Web3

from app.config import settings

logger = logging.getLogger(__name__)

class OracleService:
    def __init__(self):
        # Load or generate oracle private key
        pk = settings.ORACLE_PRIVATE_KEY
        if not pk or pk == "0x..." or len(pk) < 60:
            # Generate deterministic fallback key for test/demo mode
            self.account = Account.create("cleargarant-test-oracle-seed")
        else:
            if not pk.startswith("0x"):
                pk = "0x" + pk
            self.account = Account.from_key(pk)
        
        logger.info("Oracle initialized with address: %s", self.account.address)

    @property
    def oracle_address(self) -> str:
        return self.account.address

    def sign_milestone_decision(
        self,
        campaign_id: int,
        milestone_index: int,
        report_hash_hex: str,
        nonce: int,
    ) -> str:
        """
        Signs the milestone approval/rejection payload matching ClearGrantEscrow.sol:
        keccak256(abi.encodePacked(campaignId, milestoneIndex, reportHash, nonce))
        """
        # Ensure report_hash_hex is 32-byte hex bytes
        if report_hash_hex.startswith("0x"):
            report_hash_bytes = bytes.fromhex(report_hash_hex[2:])
        else:
            report_hash_bytes = bytes.fromhex(report_hash_hex)

        # Pad to exactly 32 bytes if necessary
        if len(report_hash_bytes) < 32:
            report_hash_bytes = report_hash_bytes.ljust(32, b"\x00")
        elif len(report_hash_bytes) > 32:
            report_hash_bytes = report_hash_bytes[:32]

        # Solidity packed encoding: uint256, uint256, bytes32, uint256
        packed = (
            campaign_id.to_bytes(32, byteorder="big")
            + milestone_index.to_bytes(32, byteorder="big")
            + report_hash_bytes
            + nonce.to_bytes(32, byteorder="big")
        )
        msg_hash = Web3.keccak(packed)

        # Sign with Ethereum prefix: "\x19Ethereum Signed Message:\n32" + hash
        signable_message = encode_defunct(primitive=msg_hash)
        signed = self.account.sign_message(signable_message)

        return signed.signature.hex()

oracle_service = OracleService()
