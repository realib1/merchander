import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

@pytest.fixture(autouse=True)
def set_test_settings(monkeypatch):
    monkeypatch.setattr(settings, "INTELLIGENCE_SERVICE_API_KEY", "test_api_key_secret_123")
    monkeypatch.setattr(settings, "ENVIRONMENT", "test")

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

@pytest.fixture
def valid_api_key():
    return "test_api_key_secret_123"
