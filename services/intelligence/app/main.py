from fastapi import FastAPI, Depends, status
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.config import settings
from app.security import verify_api_key
from app.schemas import (
    HealthResponse,
    ExtractionRequest,
    ExtractedCart,
)
from app.services.catalog import fetch_tenant_catalog, TenantCatalogContext
from app.services.extractor import extract_intent_and_cart

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

