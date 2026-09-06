import pytest
import httpx
from app.config import settings
from app.services.catalog import (
    fetch_tenant_catalog,
    CatalogProduct,
    CatalogVariant,
    PreOrderBatchContext,
    TenantCatalogContext,
)


@pytest.mark.asyncio
async def test_fetch_catalog_unconfigured_returns_empty():
    settings.SUPABASE_URL = ""
    settings.SUPABASE_SERVICE_ROLE_KEY = ""
    catalog = await fetch_tenant_catalog("tenant-123")
    assert catalog.tenant_id == "tenant-123"
    assert catalog.products == []
    assert catalog.pre_orders == []
    assert catalog.all_variants == []
    assert catalog.sku_map == {}


@pytest.mark.asyncio
async def test_fetch_catalog_mock_response():
    settings.SUPABASE_URL = "http://supabase.mock"
    settings.SUPABASE_SERVICE_ROLE_KEY = "test_service_key"

    def mock_handler(request: httpx.Request):
        url = str(request.url)
        if "products" in url:
            return httpx.Response(
                200,
                json=[
                    {
                        "id": "prod-1",
                        "tenant_id": "tenant-123",
                        "name": "Red Velvet Tote",
                        "description": "Luxurious bag",
                        "availability_status": "AVAILABLE",
                        "product_variants": [
                            {
                                "id": "var-1",
                                "product_id": "prod-1",
                                "name": "Large",
                                "sku": "BAG-RED-LG",
                                "price": 150.0,
                                "cost_price": 80.0,
                            },
                            {
                                "id": "var-2",
                                "product_id": "prod-1",
                                "name": "Small",
                                "sku": "BAG-RED-SM",
                                "price": 100.0,
                                "cost_price": 50.0,
                            },
                        ],
                    }
                ],
            )
        elif "preorder_batches" in url:
            return httpx.Response(
                200,
                json=[
                    {
                        "id": "batch-1",
                        "name": "Oct Sea Freight",
                        "code": "BATCH-OCT-26",
                        "status": "OPEN",
                        "expected_arrival_start": "2026-10-15",
                        "expected_arrival_end": "2026-10-25",
                    }
                ],
            )
        return httpx.Response(404)

    transport = httpx.MockTransport(mock_handler)
    async with httpx.AsyncClient(transport=transport) as client:
        catalog = await fetch_tenant_catalog("tenant-123", client=client)

    assert catalog.tenant_id == "tenant-123"
    assert len(catalog.products) == 1
    assert catalog.products[0].name == "Red Velvet Tote"
    assert len(catalog.all_variants) == 2
    assert "BAG-RED-LG" in catalog.sku_map
    assert "BAG-RED-SM" in catalog.sku_map
    assert len(catalog.pre_orders) == 1
    assert catalog.pre_orders[0].code == "BATCH-OCT-26"
