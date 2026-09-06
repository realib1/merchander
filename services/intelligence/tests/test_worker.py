import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

from app.main import app
from app.config import settings
from app.worker import celery_app
from app.tasks.extraction import extract_cart_async_task
from app.tasks.notifications import throttled_notification_task
from app.services.catalog import TenantCatalogContext, CatalogProduct, CatalogVariant



@pytest.fixture
def auth_headers():
    return {"X-API-Key": settings.INTELLIGENCE_SERVICE_API_KEY}


@pytest.fixture
def mock_catalog():
    return TenantCatalogContext(
        tenant_id="tenant-test-worker",
        products=[
            CatalogProduct(
                id="prod-1",
                tenant_id="tenant-test-worker",
                name="Perfume Blue",
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
            )
        ],
    )



def test_extract_cart_async_task_execution(mock_catalog):
    """Test direct execution of async extraction task in eager mode."""
    with patch("app.tasks.extraction.fetch_tenant_catalog", return_value=mock_catalog):
        task_payload = {
            "tenant_id": "tenant-test-worker",
            "message": {
                "platform": "whatsapp",
                "external_id": "task-msg-1",
                "sender_id": "+233244123456",
                "text": "I want 2 pcs of Perfume Blue please",
                "timestamp": "2026-09-06T12:00:00Z",
            },
        }
        res = extract_cart_async_task.delay(task_payload)
        assert res.successful()
        result_data = res.result
        assert isinstance(result_data, dict)
        assert len(result_data["items"]) == 1
        assert result_data["items"][0]["sku"] == "PERF-BLUE-50"
        assert result_data["items"][0]["quantity"] == 2


def test_throttled_notification_task_execution():
    """Test throttled notification task scaffolding."""
    res = throttled_notification_task.delay(
        tenant_id="tenant-123",
        recipient="+233244123456",
        message_payload={"type": "text", "body": "Order ready for dispatch"},
        delay_seconds=0.0,
    )
    assert res.successful()
    assert res.result["status"] == "dispatched"
    assert res.result["tenant_id"] == "tenant-123"
    assert res.result["recipient"] == "+233244123456"


def test_post_extract_async_endpoint_authenticated(client, auth_headers, mock_catalog):
    """Test POST /api/v1/extract/async enqueues task and returns 202."""
    with patch("app.tasks.extraction.fetch_tenant_catalog", return_value=mock_catalog):
        payload = {
            "tenant_id": "tenant-test-worker",
            "message": {
                "platform": "whatsapp",
                "external_id": "endpoint-msg-1",
                "sender_id": "+233244123456",
                "text": "Do you have PERF-BLUE-50 in stock?",
                "timestamp": "2026-09-06T12:00:00Z",
            },
        }
        response = client.post("/api/v1/extract/async", json=payload, headers=auth_headers)
        assert response.status_code == 202
        data = response.json()
        assert "task_id" in data
        assert data["status"] == "queued"

        # Now test polling the task status endpoint
        task_id = data["task_id"]
        status_res = client.get(f"/api/v1/tasks/{task_id}", headers=auth_headers)
        assert status_res.status_code == 200
        status_data = status_res.json()
        assert status_data["task_id"] == task_id
        assert status_data["status"] == "SUCCESS"
        assert status_data["result"] is not None


def test_async_endpoints_require_auth(client):
    """Test async endpoints reject requests without X-API-Key."""
    post_res = client.post("/api/v1/extract/async", json={})
    assert post_res.status_code == 401

    get_res = client.get("/api/v1/tasks/some-random-id")
    assert get_res.status_code == 401
