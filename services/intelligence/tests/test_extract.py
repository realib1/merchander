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
