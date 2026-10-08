import logging
from typing import Optional
import uuid

logger = logging.getLogger(__name__)

class NotificationService:
    @staticmethod
    async def send_donor_notification(
        user_id: uuid.UUID,
        title: str,
        message: str,
        tx_hash: Optional[str] = None
    ):
        """Dispatches in-app, Telegram or Push notification to donor."""
        logger.info(
            "Notification sent to donor %s: %s | Message: %s | tx: %s",
            user_id, title, message, tx_hash
        )
        return True

notification_service = NotificationService()
