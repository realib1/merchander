# Feature 17d: Async Queue & Background Task Worker

> **Archived Feature.** Completed on 2026-09-06.

**Status:** `verified`

## Goal
Stand up Celery and Redis worker scaffolding in the Python Intelligence service (`services/intelligence/`). Provide asynchronous background task queuing for heavy extraction jobs and throttled outbound customer notifications, preventing long-running LLM calls from blocking webhook handlers and respecting WhatsApp anti-ban rate limits.

## In Scope
- Dependencies & Configuration:
  - Add `celery[redis]>=5.4.0` and `redis>=5.0.0` to `services/intelligence/pyproject.toml` and `requirements.txt`.
  - Update `app/config.py` and `.env.example` with `REDIS_URL`, `CELERY_BROKER_URL`, and `CELERY_RESULT_BACKEND`.
- Celery Worker Architecture:
  - Create `app/worker.py` configuring the Celery application with JSON serialization and auto-discovery.
- Background Tasks:
  - `app/tasks/extraction.py`: Async cart extraction task (`extract_cart_async_task`) running grounded retrieval and extraction.
  - `app/tasks/notifications.py`: Outbound notification task scaffolding (`throttled_notification_task`) with jittered delay parameters for anti-ban rate limits.
  - `app/tasks/__init__.py`: Task module exports.
- API Endpoints:
  - Add `POST /api/v1/extract/async` in `app/main.py` accepting `ExtractionRequest` and dispatching to Celery worker, returning `task_id` and `queued` status.
  - Add `GET /api/v1/tasks/{task_id}` to inspect task status and retrieve result/error.
  - Add `AsyncTaskResponse` and `TaskStatusResponse` schemas in `app/schemas.py`.
- Testing & Docs:
  - Comprehensive unit test suite in `services/intelligence/tests/test_worker.py` verifying task dispatch, eager execution, and status polling without requiring an external Redis server.
  - Update `services/intelligence/README.md` with Celery worker startup instructions (including Windows `--pool=solo`).

## Out of Scope
- Deploying a live hosted Redis cluster (handled in cloud/deployment phase).
- Outbound WhatsApp direct message sending (handled in Feature 18 & 21).
- Green/Yellow/Red action safety approval gates (handled in Feature 19).
- Conversation-to-order draft creation state machine (handled in Feature 20).

## Context & Constraints
- **Test Resiliency / Zero Live Redis Dependency:** In unit tests, Celery runs in eager mode (`task_always_eager = True`), executing tasks synchronously in-process so `pytest` does not require a running Redis daemon.
- **Windows Worker Compatibility:** Celery on Windows requires the `solo` pool (`--pool=solo`) or threads rather than the prefork pool. Document this clearly.
- **Tenant Scoping:** All task payloads and logs must include `tenant_id`.
- **API Security:** Async dispatch and status polling endpoints must require `X-API-Key` authentication via `verify_api_key`.

## Build Steps
- [x] 1. Add `celery[redis]` and `redis` dependencies to `services/intelligence/pyproject.toml`, `requirements.txt`, and add Redis/Celery settings to `app/config.py` and `.env.example`.
- [x] 2. Implement Celery application configuration in `services/intelligence/app/worker.py`.
- [x] 3. Create background tasks in `services/intelligence/app/tasks/extraction.py` and `services/intelligence/app/tasks/notifications.py`.
- [x] 4. Add async extraction and task status endpoints (`POST /api/v1/extract/async`, `GET /api/v1/tasks/{task_id}`) and schemas in `app/main.py` and `app/schemas.py`.
- [x] 5. Implement test suite in `services/intelligence/tests/test_worker.py`, document worker run command in `README.md`, and verify with `pytest` and `yarn check`.

## Files & Areas
- `services/intelligence/pyproject.toml` [MODIFY]
- `services/intelligence/requirements.txt` [MODIFY]
- `services/intelligence/.env.example` [MODIFY]
- `services/intelligence/app/config.py` [MODIFY]
- `services/intelligence/app/schemas.py` [MODIFY]
- `services/intelligence/app/worker.py` [NEW]
- `services/intelligence/app/tasks/__init__.py` [NEW]
- `services/intelligence/app/tasks/extraction.py` [NEW]
- `services/intelligence/app/tasks/notifications.py` [NEW]
- `services/intelligence/app/main.py` [MODIFY]
- `services/intelligence/tests/test_worker.py` [NEW]
- `services/intelligence/README.md` [MODIFY]

## Data & Contracts
- **Async Extraction Response (`AsyncTaskResponse`):**
  - `task_id`: `str`
  - `status`: `str` ("queued")
- **Task Status Response (`TaskStatusResponse`):**
  - `task_id`: `str`
  - `status`: `str` ("PENDING" | "STARTED" | "SUCCESS" | "FAILURE")
  - `result`: `Optional[Dict[str, Any]]`
  - `error`: `Optional[str]`

## Testing
- Unit tests via `uv run --extra dev pytest tests/test_worker.py`.
- Full Python test suite via `uv run --extra dev pytest`.
- Full Next.js verification via `yarn check` and `yarn test`.

