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


class AsyncTaskResponse(BaseModel):
    """Response returned when a background task is enqueued."""
    task_id: str
    status: str = "queued"


class TaskStatusResponse(BaseModel):
    """Response returned when polling task status."""
    task_id: str
    status: str = Field(description="Celery task status (PENDING, STARTED, SUCCESS, FAILURE)")
    result: Optional[dict] = None
    error: Optional[str] = None


class CustomerContext(BaseModel):
    """Optional customer identity information for grounding order inquiries."""
    customer_id: Optional[str] = None
    phone_number: Optional[str] = None
    name: Optional[str] = None


class CustomerOrderItem(BaseModel):
    """Line item in a customer order summary."""
    name: str
    sku: Optional[str] = None
    quantity: int = 1
    unit_price: float = 0.0


class CustomerOrderSummary(BaseModel):
    """Summary of a customer's active or recent order for conversational Q&A grounding."""
    id: str
    order_number: str
    status: str
    total_amount: float
    currency: str = "GHS"
    items: List[CustomerOrderItem] = Field(default_factory=list)
    created_at: Optional[str] = None
    delivery_address: Optional[str] = None


class ReplyRequest(BaseModel):
    """Request payload for grounded Q&A and conversational replies."""
    tenant_id: Optional[str] = None
    message: NormalizedMessage
    customer: Optional[CustomerContext] = None


class ReplyResponse(BaseModel):
    """Response returned by the grounded Q&A engine."""
    reply_text: str = Field(description="Conversational reply formatted in Ghanaian merchant tone")
    intent: str = Field(default="unknown", description="Detected customer intent")
    confidence: float = Field(default=0.0, ge=0.0, le=1.0, description="Confidence score")
    grounded_facts: List[str] = Field(default_factory=list, description="List of verified facts retrieved from database")
    requires_human_approval: bool = Field(default=False, description="Flag indicating interaction requires human merchant approval")
    escalation_reason: Optional[str] = Field(default=None, description="Reason for human escalation if required")

