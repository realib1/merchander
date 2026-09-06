import asyncio
import concurrent.futures
import logging
from typing import Any, Dict, Optional
from app.worker import celery_app
from app.schemas import NormalizedMessage
from app.services.catalog import fetch_tenant_catalog, TenantCatalogContext
from app.services.extractor import extract_intent_and_cart

logger = logging.getLogger(__name__)


def _run_async(coro):
    """Safely execute an async coroutine whether or not an event loop is already running in current thread."""
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
            return pool.submit(asyncio.run, coro).result()
    return asyncio.run(coro)


async def _run_extraction(tenant_id: Optional[str], message: NormalizedMessage) -> Dict[str, Any]:
    if tenant_id:
        catalog = await fetch_tenant_catalog(tenant_id)
    else:
        catalog = TenantCatalogContext(tenant_id="anonymous")
    result = await extract_intent_and_cart(message, catalog)
    return result.model_dump()


@celery_app.task(name="tasks.extract_cart_async", bind=True, max_retries=3, default_retry_delay=5)
def extract_cart_async_task(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Celery task to asynchronously extract intent and cart items from a normalized message.
    """
    tenant_id = request_data.get("tenant_id")
    msg_dict = request_data.get("message", {})
    message = NormalizedMessage(**msg_dict)

    logger.info(
        f"[Async Task {self.request.id}] Extracting intent for platform={message.platform} "
        f"external_id={message.external_id} tenant={tenant_id or 'none'}"
    )

    try:
        return _run_async(_run_extraction(tenant_id, message))
    except Exception as exc:
        logger.error(f"[Async Task {self.request.id}] Extraction failed: {exc}")
        raise self.retry(exc=exc)

