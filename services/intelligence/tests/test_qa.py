from unittest.mock import patch

import pytest
from app.schemas import (
    CustomerOrderItem,
    CustomerOrderSummary,
)
from app.services.catalog import (
    CatalogProduct,
    CatalogVariant,
    PreOrderBatchContext,
    TenantCatalogContext,
)


@pytest.fixture
def mock_catalog():
    return TenantCatalogContext(
        tenant_id="tenant-test-qa",
        products=[
            CatalogProduct(
                id="prod-1",
                tenant_id="tenant-test-qa",
                name="Perfume Blue",
                description="Fragrant luxury perfume",
                availability_status="AVAILABLE",
                variants=[
                    CatalogVariant(
                        id="var-1",
                        product_id="prod-1",
                        name="50ml",
                        sku="PERF-BLUE-50",
                        price=150.0,
                        quantity=10,
                    )
                ],
            ),
            CatalogProduct(
                id="prod-2",
                tenant_id="tenant-test-qa",
                name="Sneakers White",
                description="Classic unisex sneakers",
                availability_status="OUT_OF_STOCK",
                variants=[
                    CatalogVariant(
                        id="var-2",
                        product_id="prod-2",
                        name="Size 42",
                        sku="SNK-WHT-42",
                        price=350.0,
                        quantity=0,
                    )
                ],
            ),
        ],
        pre_orders=[
            PreOrderBatchContext(
                id="batch-1",
                name="October Import Batch",
                code="PRE-2026-10",
                status="OPEN",
                expected_arrival_start="2026-10-01",
                expected_arrival_end="2026-10-15",
            )
        ],
    )


@pytest.fixture
def mock_active_orders():
    return [
        CustomerOrderSummary(
            id="order-uuid-9021",
            order_number="#ORD-9021",
            status="in_transit",
            total_amount=300.0,
            currency="GHS",
            items=[
                CustomerOrderItem(
                    name="Perfume Blue (50ml)",
                    sku="PERF-BLUE-50",
                    quantity=2,
                    unit_price=150.0,
                )
            ],
            created_at="2026-09-05T10:00:00Z",
            delivery_address="East Legon, Accra",
        )
    ]


def test_product_price_inquiry(client, valid_api_key, mock_catalog):
    """Test product price inquiry returns grounded prices without hallucination."""
    with patch("app.main.fetch_tenant_catalog", return_value=mock_catalog):
        payload = {
            "tenant_id": "tenant-test-qa",
            "message": {
                "platform": "whatsapp",
                "external_id": "msg-qa-1",
                "sender_id": "+233244123456",
                "text": "How much is Perfume Blue?",
                "timestamp": "2026-09-06T12:00:00Z",
            },
        }
        res = client.post(
            "/api/v1/reply", json=payload, headers={"X-API-Key": valid_api_key}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["intent"] == "inquire_product"
        assert "Perfume Blue" in data["reply_text"]
        assert "GH₵150.00" in data["reply_text"]
        assert data["confidence"] >= 0.90
        assert data["requires_human_approval"] is False


def test_product_stock_inquiry_available(client, valid_api_key, mock_catalog):
    """Test stock inquiry for in-stock item confirms availability."""
    with patch("app.main.fetch_tenant_catalog", return_value=mock_catalog):
        payload = {
            "tenant_id": "tenant-test-qa",
            "message": {
                "platform": "whatsapp",
                "external_id": "msg-qa-2",
                "sender_id": "+233244123456",
                "text": "Do you have Perfume Blue in stock?",
                "timestamp": "2026-09-06T12:00:00Z",
            },
        }
        res = client.post(
            "/api/v1/reply", json=payload, headers={"X-API-Key": valid_api_key}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["intent"] == "check_stock"
        assert (
            "available" in data["reply_text"].lower()
            or "in stock" in data["reply_text"].lower()
        )
        assert data["requires_human_approval"] is False


def test_product_stock_inquiry_out_of_stock_with_batch(
    client, valid_api_key, mock_catalog
):
    """Test out-of-stock product inquiry notes stock state and offers pre-order batch ETA."""
    with patch("app.main.fetch_tenant_catalog", return_value=mock_catalog):
        payload = {
            "tenant_id": "tenant-test-qa",
            "message": {
                "platform": "whatsapp",
                "external_id": "msg-qa-3",
                "sender_id": "+233244123456",
                "text": "Is Sneakers White in stock right now?",
                "timestamp": "2026-09-06T12:00:00Z",
            },
        }
        res = client.post(
            "/api/v1/reply", json=payload, headers={"X-API-Key": valid_api_key}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["intent"] == "check_stock"
        assert "out of stock" in data["reply_text"].lower()
        assert "PRE-2026-10" in data["reply_text"]
        assert "2026-10-01" in data["reply_text"]
        assert data["requires_human_approval"] is False


def test_unknown_product_does_not_fabricate(client, valid_api_key, mock_catalog):
    """Test inquiry for non-existent product does not invent pricing or items."""
    with patch("app.main.fetch_tenant_catalog", return_value=mock_catalog):
        payload = {
            "tenant_id": "tenant-test-qa",
            "message": {
                "platform": "whatsapp",
                "external_id": "msg-qa-4",
                "sender_id": "+233244123456",
                "text": "How much is the iPhone 16 Pro Max 1TB Gold?",
                "timestamp": "2026-09-06T12:00:00Z",
            },
        }
        res = client.post(
            "/api/v1/reply", json=payload, headers={"X-API-Key": valid_api_key}
        )
        assert res.status_code == 200
        data = res.json()
        assert (
            "not find" in data["reply_text"].lower()
            or "could not find" in data["reply_text"].lower()
        )
        assert data["requires_human_approval"] is False


def test_order_status_inquiry_with_active_order(
    client, valid_api_key, mock_catalog, mock_active_orders
):
    """Test order status inquiry reports grounded status and delivery details for active order."""
    with (
        patch("app.main.fetch_tenant_catalog", return_value=mock_catalog),
        patch("app.main.fetch_customer_active_orders", return_value=mock_active_orders),
    ):
        payload = {
            "tenant_id": "tenant-test-qa",
            "message": {
                "platform": "whatsapp",
                "external_id": "msg-qa-5",
                "sender_id": "+233244123456",
                "text": "Hello, please where is my order? Any delivery update?",
                "timestamp": "2026-09-06T12:00:00Z",
            },
            "customer": {
                "phone_number": "+233244123456",
                "name": "Kofi Mensah",
            },
        }
        res = client.post(
            "/api/v1/reply", json=payload, headers={"X-API-Key": valid_api_key}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["intent"] == "check_order"
        assert "#ORD-9021" in data["reply_text"]
        assert "in transit" in data["reply_text"].lower()
        assert (
            "Area redacted" in data["reply_text"]
            or "Address redacted" in data["reply_text"]
        )
        assert "GH₵300.00" in data["reply_text"]
        assert data["requires_human_approval"] is False


def test_build_qa_grounding_context_redacts_delivery_addresses(
    mock_catalog, mock_active_orders
):
    """Delivery addresses must be reduced to a non-sensitive area before being sent to the model."""
    from app.services.qa import build_qa_grounding_context

    context = build_qa_grounding_context(mock_catalog, mock_active_orders)

    assert "East Legon, Accra" not in context
    assert "Address redacted" in context or "area redacted" in context.lower()


def test_order_status_inquiry_no_active_orders(client, valid_api_key, mock_catalog):
    """Test order status inquiry with no active orders asks for order number and flags human escalation."""
    with (
        patch("app.main.fetch_tenant_catalog", return_value=mock_catalog),
        patch("app.main.fetch_customer_active_orders", return_value=[]),
    ):
        payload = {
            "tenant_id": "tenant-test-qa",
            "message": {
                "platform": "whatsapp",
                "external_id": "msg-qa-6",
                "sender_id": "+233244999999",
                "text": "Where is my order?",
                "timestamp": "2026-09-06T12:00:00Z",
            },
        }
        res = client.post(
            "/api/v1/reply", json=payload, headers={"X-API-Key": valid_api_key}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["intent"] == "check_order"
        assert data["requires_human_approval"] is True
        assert data["escalation_reason"] is not None
        assert "could not find" in data["reply_text"].lower()


def test_payment_confirmation_escalates_to_human(
    client, valid_api_key, mock_catalog, mock_active_orders
):
    """Test customer payment claim triggers human approval escalation rather than fabricating confirmation."""
    with (
        patch("app.main.fetch_tenant_catalog", return_value=mock_catalog),
        patch("app.main.fetch_customer_active_orders", return_value=mock_active_orders),
    ):
        payload = {
            "tenant_id": "tenant-test-qa",
            "message": {
                "platform": "whatsapp",
                "external_id": "msg-qa-7",
                "sender_id": "+233244123456",
                "text": "I have sent the MoMo payment of 300 GHS for my order #ORD-9021. Please confirm.",
                "timestamp": "2026-09-06T12:00:00Z",
            },
        }
        res = client.post(
            "/api/v1/reply", json=payload, headers={"X-API-Key": valid_api_key}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["intent"] == "confirm_payment"
        assert data["requires_human_approval"] is True
        assert (
            "verify" in data["reply_text"].lower()
            or "verifies" in data["reply_text"].lower()
        )
        assert data["escalation_reason"] is not None


def test_human_agent_escalation(client, valid_api_key, mock_catalog):
    """Test customer asking to speak to human triggers human escalation flag."""
    with patch("app.main.fetch_tenant_catalog", return_value=mock_catalog):
        payload = {
            "tenant_id": "tenant-test-qa",
            "message": {
                "platform": "whatsapp",
                "external_id": "msg-qa-8",
                "sender_id": "+233244123456",
                "text": "Can I please speak to a human representative?",
                "timestamp": "2026-09-06T12:00:00Z",
            },
        }
        res = client.post(
            "/api/v1/reply", json=payload, headers={"X-API-Key": valid_api_key}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["intent"] == "human_agent"
        assert data["requires_human_approval"] is True
        assert (
            "representative" in data["reply_text"].lower()
            or "team" in data["reply_text"].lower()
        )


def test_reply_grounding_delivery_policy(client, valid_api_key, mock_catalog):
    """Test inquiry about delivery returns merchant's configured delivery grounding policy."""
    with patch("app.main.fetch_tenant_catalog", return_value=mock_catalog):
        payload = {
            "tenant_id": "tenant-test-qa",
            "message": {
                "platform": "whatsapp",
                "external_id": "msg-qa-grounding-1",
                "sender_id": "+233244123456",
                "text": "What are your delivery rates and dispatch times for Accra?",
                "timestamp": "2026-09-06T12:00:00Z",
            },
            "grounding": {
                "deliveryInfo": "We offer same-day rider delivery in Greater Accra for GH₵35 and 48-hr parcel delivery nationwide.",
                "returnPolicy": "Items can be exchanged within 7 days in original unworn condition.",
            },
            "agent_config": {
                "responseTone": "friendly",
            },
        }
        res = client.post(
            "/api/v1/reply", json=payload, headers={"X-API-Key": valid_api_key}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["intent"] == "inquire_delivery"
        assert (
            "same-day rider delivery in Greater Accra for GH₵35" in data["reply_text"]
        )
        assert data["requires_human_approval"] is False


def test_reply_grounding_return_policy(client, valid_api_key, mock_catalog):
    """Test customer asking about returns receives merchant's grounded return policy."""
    with patch("app.main.fetch_tenant_catalog", return_value=mock_catalog):
        payload = {
            "tenant_id": "tenant-test-qa",
            "message": {
                "platform": "whatsapp",
                "external_id": "msg-qa-grounding-2",
                "sender_id": "+233244123456",
                "text": "What is your return and refund policy if it doesn't fit?",
                "timestamp": "2026-09-06T12:00:00Z",
            },
            "grounding": {
                "returnPolicy": "All sales are eligible for 7-day exchange with receipt. No cash refunds on opened perfumes.",
            },
        }
        res = client.post(
            "/api/v1/reply", json=payload, headers={"X-API-Key": valid_api_key}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["intent"] == "inquire_policy"
        assert "eligible for 7-day exchange" in data["reply_text"]


def test_reply_endpoint_requires_auth(client):
    """Test /api/v1/reply rejects unauthenticated requests."""
    res = client.post("/api/v1/reply", json={})
    assert res.status_code == 401


def test_production_requires_non_default_intelligence_api_key(monkeypatch):
    """Production should fail closed instead of accepting a bundled dev secret."""
    from app.config import Settings

    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("INTELLIGENCE_SERVICE_API_KEY", "")
    with pytest.raises(ValueError, match="INTELLIGENCE_SERVICE_API_KEY"):
        Settings()


@pytest.mark.anyio
async def test_llm_reply_payment_claims_are_hard_restricted_even_if_model_says_safe():
    from app.schemas import NormalizedMessage
    from app.services.qa import generate_grounded_reply

    message = NormalizedMessage(
        platform="whatsapp",
        external_id="msg-qa-safety-1",
        sender_id="+233244777888",
        text="I paid the MoMo for order #ORD-9021. Please confirm.",
        timestamp="2026-09-06T12:00:00Z",
    )

    async def fake_llm_call(*args, **kwargs):
        return {
            "reply_text": "Payment received successfully.",
            "intent": "confirm_payment",
            "confidence": 0.99,
            "grounded_facts": [],
            "requires_human_approval": False,
            "escalation_reason": None,
        }

    with pytest.MonkeyPatch.context() as mp:
        mp.setattr("app.services.qa.settings.GEMINI_API_KEY", "test-gemini-key")
        mp.setattr("app.services.qa.settings.ENVIRONMENT", "production")
        mp.setattr("app.services.qa.call_gemini_llm", fake_llm_call)

        reply = await generate_grounded_reply(
            message, TenantCatalogContext(tenant_id="tenant-test"), []
        )

    assert reply.requires_human_approval is True
    assert reply.escalation_reason is not None


@pytest.mark.anyio
async def test_fetch_customer_active_orders_unconfigured():
    """Test fetch_customer_active_orders returns empty list when Supabase is unconfigured."""
    from app.services.orders import fetch_customer_active_orders

    orders = await fetch_customer_active_orders(
        tenant_id="tenant-none", customer_id="cust-1"
    )
    assert orders == []


@pytest.mark.anyio
async def test_fetch_customer_active_orders_parsing():
    """Test fetch_customer_active_orders parses order and line items correctly."""
    import httpx
    from app.config import settings
    from app.services.orders import fetch_customer_active_orders

    mock_db_orders = [
        {
            "id": "ord-111",
            "short_id": "ORD111",
            "status": "pending_payment",
            "total_amount": 150.0,
            "delivery_address": "Kumasi Central",
            "created_at": "2026-09-06T10:00:00Z",
            "customer_id": "cust-99",
            "order_items": [
                {
                    "id": "item-1",
                    "quantity": 1,
                    "unit_price": 150.0,
                    "product_variants": {
                        "id": "var-1",
                        "name": "50ml",
                        "sku": "PERF-50",
                        "products": {"name": "Perfume Blue"},
                    },
                }
            ],
        }
    ]

    async def mock_handler(request: httpx.Request):
        if "/rest/v1/orders" in str(request.url):
            return httpx.Response(200, json=mock_db_orders)
        return httpx.Response(200, json=[])

    mock_transport = httpx.MockTransport(mock_handler)
    async with httpx.AsyncClient(transport=mock_transport) as mock_client:
        with (
            patch.object(settings, "SUPABASE_URL", "https://mock.supabase.co"),
            patch.object(settings, "SUPABASE_SERVICE_ROLE_KEY", "mock-secret-key"),
        ):
            orders = await fetch_customer_active_orders(
                tenant_id="tenant-test",
                customer_id="cust-99",
                client=mock_client,
            )
            assert len(orders) == 1
            assert orders[0].order_number == "#ORD111"
            assert orders[0].status == "pending_payment"
            assert orders[0].total_amount == 150.0
            assert orders[0].delivery_address == "Kumasi Central"
            assert len(orders[0].items) == 1
            assert orders[0].items[0].sku == "PERF-50"
            assert orders[0].items[0].name == "Perfume Blue (50ml)"
