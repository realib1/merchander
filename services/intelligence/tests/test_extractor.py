import pytest
from app.schemas import NormalizedMessage, ExtractedCart
from app.services.catalog import (
    TenantCatalogContext,
    CatalogProduct,
    CatalogVariant,
    PreOrderBatchContext,
)
from app.services.extractor import (
    heuristic_extract,
    extract_intent_and_cart,
    build_catalog_grounding_text,
)


@pytest.fixture
def sample_catalog():
    return TenantCatalogContext(
        tenant_id="tenant-123",
        products=[
            CatalogProduct(
                id="prod-1",
                tenant_id="tenant-123",
                name="Red Velvet Tote",
                availability_status="AVAILABLE",
                variants=[
                    CatalogVariant(
                        id="var-1",
                        product_id="prod-1",
                        name="Red / Large",
                        sku="BAG-RED-LG",
                        price=150.0,
                    ),
                    CatalogVariant(
                        id="var-2",
                        product_id="prod-1",
                        name="Red / Small",
                        sku="BAG-RED-SM",
                        price=100.0,
                    ),
                ],
            ),
            CatalogProduct(
                id="prod-2",
                tenant_id="tenant-123",
                name="Oxford Leather Shoes",
                availability_status="PRE_ORDER",
                variants=[
                    CatalogVariant(
                        id="var-3",
                        product_id="prod-2",
                        name="Black / 42",
                        sku="SHOE-OX-42",
                        price=250.0,
                    ),
                ],
            ),
        ],
        pre_orders=[
            PreOrderBatchContext(
                id="batch-1",
                name="Oct Sea Freight",
                code="BATCH-OCT-26",
                status="OPEN",
                expected_arrival_start="2026-10-15",
                expected_arrival_end="2026-10-25",
            )
        ],
    )


def test_build_catalog_grounding_text(sample_catalog):
    text = build_catalog_grounding_text(sample_catalog)
    assert "Red Velvet Tote" in text
    assert "BAG-RED-LG" in text
    assert "Oxford Leather Shoes" in text
    assert "BATCH-OCT-26" in text


def test_heuristic_extract_exact_sku_and_quantity(sample_catalog):
    msg = NormalizedMessage(
        platform="whatsapp",
        external_id="msg-1",
        sender_id="233241234567",
        text="Hello, I would like to order 3 of BAG-RED-LG please",
        timestamp="2026-09-06T00:00:00Z",
    )
    result = heuristic_extract(msg, sample_catalog)
    assert result.intent == "create_order"
    assert len(result.items) == 1
    assert result.items[0].sku == "BAG-RED-LG"
    assert result.items[0].quantity == 3
    assert result.confidence >= 0.85


def test_heuristic_extract_product_name_fallback(sample_catalog):
    msg = NormalizedMessage(
        platform="whatsapp",
        external_id="msg-2",
        sender_id="233241234567",
        text="Do you have Oxford Leather Shoes in stock?",
        timestamp="2026-09-06T00:00:00Z",
    )
    result = heuristic_extract(msg, sample_catalog)
    assert result.intent == "check_stock"
    assert len(result.items) == 1
    assert result.items[0].sku == "SHOE-OX-42"
    assert result.items[0].quantity == 1


def test_heuristic_extract_unmatched_product(sample_catalog):
    msg = NormalizedMessage(
        platform="whatsapp",
        external_id="msg-3",
        sender_id="233241234567",
        text="I want to buy 5 gold watches",
        timestamp="2026-09-06T00:00:00Z",
    )
    result = heuristic_extract(msg, sample_catalog)
    assert result.intent == "create_order"
    assert result.items == []
    assert result.confidence == 0.0
    assert "no catalog SKUs matched" in (result.notes or "")


def test_heuristic_extract_greeting_only(sample_catalog):
    msg = NormalizedMessage(
        platform="whatsapp",
        external_id="msg-4",
        sender_id="233241234567",
        text="Good morning! How are you doing?",
        timestamp="2026-09-06T00:00:00Z",
    )
    result = heuristic_extract(msg, sample_catalog)
    assert result.intent == "greeting"
    assert result.items == []
    assert result.confidence == 0.0


@pytest.mark.asyncio
async def test_extract_intent_and_cart_async_integration(sample_catalog):
    msg = NormalizedMessage(
        platform="whatsapp",
        external_id="msg-5",
        sender_id="233241234567",
        text="Please send me 2 pieces of BAG-RED-SM",
        timestamp="2026-09-06T00:00:00Z",
    )
    result = await extract_intent_and_cart(msg, sample_catalog)
    assert isinstance(result, ExtractedCart)
    assert len(result.items) == 1
    assert result.items[0].sku == "BAG-RED-SM"
    assert result.items[0].quantity == 2
