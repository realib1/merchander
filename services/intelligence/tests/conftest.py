import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings
from app.worker import celery_app

# Configure Celery eager mode and in-memory backend for testing
celery_app.conf.update(
    task_always_eager=True,
    task_eager_propagates=True,
    task_store_eager_result=True,
    result_backend="cache+memory://",
)
celery_app._backend = celery_app._get_backend()

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
