def test_extract_missing_api_key_returns_401(client):
    payload = {
        "message": {
            "platform": "whatsapp",
            "external_id": "wamid.12345",
            "sender_id": "233241234567",
            "text": "I want 2 red bags",
            "timestamp": "2026-09-05T18:00:00Z"
        }
    }
    response = client.post("/api/v1/extract", json=payload)
    assert response.status_code == 401
    assert "Missing API key" in response.json()["detail"]


def test_extract_invalid_api_key_returns_401(client):
    payload = {
        "message": {
            "platform": "whatsapp",
            "external_id": "wamid.12345",
            "sender_id": "233241234567",
            "text": "I want 2 red bags",
            "timestamp": "2026-09-05T18:00:00Z"
        }
    }
    headers = {"X-API-Key": "completely_wrong_key"}
    response = client.post("/api/v1/extract", json=payload, headers=headers)
    assert response.status_code == 401
    assert "Invalid API key" in response.json()["detail"]


def test_extract_valid_request_returns_200_and_cart_schema(client, valid_api_key):
    payload = {
        "tenant_id": "33333333-3333-3333-3333-333333333333",
        "message": {
            "platform": "whatsapp",
            "external_id": "wamid.12345",
            "sender_id": "233241234567",
            "text": "I want 2 red bags",
            "timestamp": "2026-09-05T18:00:00Z"
        }
    }
    headers = {"X-API-Key": valid_api_key}
    response = client.post("/api/v1/extract", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert isinstance(data["items"], list)
    assert "confidence" in data
    assert isinstance(data["confidence"], (int, float))
    assert "intent" in data
    assert "notes" in data


def test_extract_invalid_payload_returns_422(client, valid_api_key):
    headers = {"X-API-Key": valid_api_key}
    # Missing required message object
    payload = {"tenant_id": "33333333-3333-3333-3333-333333333333"}
    response = client.post("/api/v1/extract", json=payload, headers=headers)
    assert response.status_code == 422


def test_extract_with_mocked_catalog_extracts_grounded_items(client, valid_api_key, monkeypatch):
    from app.services.catalog import TenantCatalogContext, CatalogProduct, CatalogVariant

    async def mock_fetch(tenant_id, client=None):
        return TenantCatalogContext(
            tenant_id=tenant_id,
            products=[
                CatalogProduct(
                    id="prod-1",
                    tenant_id=tenant_id,
                    name="Silk Scarf",
                    availability_status="AVAILABLE",
                    variants=[
                        CatalogVariant(
                            id="var-1",
                            product_id="prod-1",
                            name="Red Silk",
                            sku="SCARF-RED-01",
                            price=45.0,
                        )
                    ],
                )
            ],
        )

    monkeypatch.setattr("app.main.fetch_tenant_catalog", mock_fetch)

    payload = {
        "tenant_id": "tenant-xyz",
        "message": {
            "platform": "whatsapp",
            "external_id": "wamid.777",
            "sender_id": "233241234567",
            "text": "Please reserve 4 of SCARF-RED-01 for me",
            "timestamp": "2026-09-06T00:00:00Z",
        },
    }
    headers = {"X-API-Key": valid_api_key}
    response = client.post("/api/v1/extract", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["intent"] == "create_order"
    assert len(data["items"]) == 1
    assert data["items"][0]["sku"] == "SCARF-RED-01"
    assert data["items"][0]["quantity"] == 4
    assert data["confidence"] >= 0.8

