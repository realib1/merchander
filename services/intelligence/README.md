# Merchander Intelligence Service

FastAPI-based microservice powering the social-commerce intelligence brain for Merchander:
- Omnichannel message intent parsing
- Grounded catalog and inventory Q&A (Feature 17b)
- Automated cart extraction from conversational exchanges
- Background queuing and delivery pacing

## Requirements
- Python >= 3.11
- `uv` package manager (recommended) or standard `pip`

## Setup & Running

### Using `uv` (Fastest)
```bash
# Run tests
uv run --extra dev pytest

# Run the development server
uv run uvicorn app.main:app --reload --port 8000
```

### Using standard virtualenv
```bash
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Unix:
source .venv/bin/activate

pip install -r requirements.txt
pytest
uvicorn app.main:app --reload --port 8000
```

### Background Task Worker (Celery + Redis)
Ensure Redis is running (or configured via `REDIS_URL` in `.env`), then launch the Celery worker:

```bash
# On Windows (prefork is unsupported on Windows; use solo pool):
uv run celery -A app.worker.celery_app worker --pool=solo -l info

# On Linux / macOS / Docker:
uv run celery -A app.worker.celery_app worker --pool=prefork -c 4 -l info
```

## Endpoints
- `GET /` - Service metadata
- `GET /health` - Health check (unauthenticated)
- `POST /api/v1/extract` - Synchronous intent extraction (requires `X-API-Key` header)
- `POST /api/v1/extract/async` - Enqueue asynchronous extraction task (returns `202 Accepted` with `task_id`)
- `GET /api/v1/tasks/{task_id}` - Query asynchronous task status and extracted results (requires `X-API-Key` header)
