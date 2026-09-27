import logging
import asyncio
from typing import Any, Dict
from app.worker import celery_app

logger = logging.getLogger(__name__)


async def _async_throttled_notification(
    request_id: str,
    tenant_id: str,
    recipient: str,
    message_payload: Dict[str, Any],
    delay_seconds: float = 0.0,
) -> Dict[str, Any]:
    """
    Async implementation to throttle outbound customer notifications, enforcing Meta anti-ban
    delays and jitter between consecutive messages.
    """
    if delay_seconds > 0:
        logger.info(
            f"[Notification Task {request_id}] Applying anti-ban throttle delay={delay_seconds}s "
            f"for tenant={tenant_id}"
        )
        await asyncio.sleep(delay_seconds)

    # In future Feature 21, this will invoke the outbound channel sender
    logger.info(
        f"[Notification Task {request_id}] Notification dispatched for tenant={tenant_id}"
    )

    return {
        "status": "dispatched",
        "tenant_id": tenant_id,
        "recipient": recipient,
        "throttled_delay": delay_seconds,
    }


@celery_app.task(name="tasks.throttled_notification", bind=True, max_retries=3, default_retry_delay=10)
def throttled_notification_task(
    self,
    tenant_id: str,
    recipient: str,
    message_payload: Dict[str, Any],
    delay_seconds: float = 0.0,
) -> Dict[str, Any]:
    """
    Celery task to throttle outbound customer notifications.
    """
    return asyncio.run(
        _async_throttled_notification(
            self.request.id, tenant_id, recipient, message_payload, delay_seconds
        )
    )
