from typing import List, Literal, Optional
from pydantic import BaseModel, Field


PlatformType = Literal["whatsapp", "telegram", "web"]
IntentType = Literal[
    "inquire_product",
    "check_stock",
    "create_order",
    "check_order",
    "human_agent",
    "greeting",
    "unknown",
]


class NormalizedMessage(BaseModel):
    """Normalized inbound message from any channel (mirrors TypeScript NormalizedMessage)."""
    platform: PlatformType
    external_id: str = Field(description="Message ID from the platform")
    sender_id: str = Field(description="Sender phone number or external user ID")
    text: str = Field(description="Inbound text content")
    timestamp: str = Field(description="ISO 8601 timestamp string")


class ExtractedItem(BaseModel):
    """Item extracted from message intent (mirrors TypeScript item in ExtractedCart)."""
    sku: str
    quantity: int = Field(default=1, ge=1)


class ExtractedCart(BaseModel):
    """Extracted cart structure (mirrors TypeScript ExtractedCart)."""
    items: List[ExtractedItem] = Field(default_factory=list)
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    intent: Optional[str] = "unknown"
    notes: Optional[str] = None


class ExtractionRequest(BaseModel):
    """Extraction request payload."""
    tenant_id: Optional[str] = None
    message: NormalizedMessage


class HealthResponse(BaseModel):
    """Service health response."""
    status: str = "ok"
    service: str = "merchander-intelligence"
    version: str = "0.1.0"
