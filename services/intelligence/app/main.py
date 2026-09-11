from fastapi import FastAPI, Depends, status
from fastapi.middleware.cors import CORSMiddleware

from celery.result import AsyncResult
from app import __version__
from app.config import settings
from app.security import verify_api_key
from app.worker import celery_app
from app.tasks.extraction import extract_cart_async_task
from app.schemas import (
    HealthResponse,
    ExtractionRequest,
    ExtractedCart,
    AsyncTaskResponse,
    TaskStatusResponse,
    ReplyRequest,
    ReplyResponse,
)
from app.services.catalog import fetch_tenant_catalog, TenantCatalogContext
from app.services.orders import fetch_customer_active_orders
from app.services.extractor import extract_intent_and_cart
from app.services.qa import generate_grounded_reply

app = FastAPI(
    title="Merchander Intelligence Service",
    description="Social-commerce reasoning, intent extraction, and automated replies brain.",
    version=__version__,
)

# CORS configuration
if settings.ALLOWED_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.get("/", tags=["General"])
async def root():
    return {
        "service": "merchander-intelligence",
        "version": __version__,
        "health": "/health",
        "docs": "/docs",
    }


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Unauthenticated health check endpoint."""
    return HealthResponse(
        status="ok",
        service="merchander-intelligence",
        version=__version__,
    )


@app.post(
    "/api/v1/extract",
    response_model=ExtractedCart,
    status_code=status.HTTP_200_OK,
    tags=["Extraction"],
    dependencies=[Depends(verify_api_key)],
)
async def extract_cart_intent(payload: ExtractionRequest) -> ExtractedCart:
    """
    Authenticated extraction endpoint.
    Retrieves tenant catalog grounding data from Supabase and extracts intent and cart items.
    """
    if payload.tenant_id:
        catalog = await fetch_tenant_catalog(payload.tenant_id)
    else:
        catalog = TenantCatalogContext(tenant_id="anonymous")

    return await extract_intent_and_cart(payload.message, catalog)


@app.post(
    "/api/v1/extract/async",
    response_model=AsyncTaskResponse,
    status_code=status.HTTP_202_ACCEPTED,
    tags=["Extraction"],
    dependencies=[Depends(verify_api_key)],
)
async def extract_cart_intent_async(payload: ExtractionRequest) -> AsyncTaskResponse:
    """
    Asynchronous extraction endpoint.
    Enqueues extraction task into Celery worker and returns task ID for background polling.
    """
    task = extract_cart_async_task.delay(payload.model_dump())
    return AsyncTaskResponse(task_id=task.id, status="queued")


@app.get(
    "/api/v1/tasks/{task_id}",
    response_model=TaskStatusResponse,
    status_code=status.HTTP_200_OK,
    tags=["Tasks"],
    dependencies=[Depends(verify_api_key)],
)
async def get_task_status(task_id: str) -> TaskStatusResponse:
    """
    Inspect the status and result of an asynchronous background task.
    """
    async_result = AsyncResult(task_id, app=celery_app)
    state = async_result.state

    if state == "SUCCESS":
        return TaskStatusResponse(task_id=task_id, status=state, result=async_result.result)
    elif state == "FAILURE":
        return TaskStatusResponse(task_id=task_id, status=state, error=str(async_result.result))
    else:
        return TaskStatusResponse(task_id=task_id, status=state)


@app.post(
    "/api/v1/reply",
    response_model=ReplyResponse,
    status_code=status.HTTP_200_OK,
    tags=["Q&A"],
    dependencies=[Depends(verify_api_key)],
)
async def get_grounded_reply(payload: ReplyRequest) -> ReplyResponse:
    """
    Generate grounded, conversational reply to customer inquiries (price, variant, stock, pre-order ETA, order status).
    Strictly grounded in real merchant catalog, open pre-orders, and customer active orders.
    """
    if payload.tenant_id:
        catalog = await fetch_tenant_catalog(payload.tenant_id)
        customer_id = payload.customer.customer_id if payload.customer else None
        phone_number = (
            (payload.customer.phone_number if payload.customer else None)
            or payload.message.sender_id
        )
        orders = await fetch_customer_active_orders(
            tenant_id=payload.tenant_id,
            customer_id=customer_id,
            phone_number=phone_number,
        )
    else:
        catalog = TenantCatalogContext(tenant_id="anonymous")
        orders = []

    return await generate_grounded_reply(
        payload.message,
        catalog,
        orders,
        grounding=payload.grounding,
        agent_config=payload.agent_config,
    )



