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
    Accepts normalized channel message and returns extracted cart and intent.
    Grounding with live catalog will be implemented in Feature 17b.
    """
    # 17a contract stub: returns valid ExtractedCart structure
    return ExtractedCart(
        items=[],
        confidence=0.0,
        intent="unknown",
        notes="Scaffold endpoint: schema and auth verified. Grounding engine connects in 17b."
    )
