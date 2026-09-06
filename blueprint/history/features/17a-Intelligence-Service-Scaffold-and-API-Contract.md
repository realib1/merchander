# Current Feature

> **Generated file.** Holds the one feature, fix, or rollback being built right now. Run
> `/feature <number-or-name>` to spec a build-plan feature, or `/fix "<bug>"` for
> an ad-hoc fix. Use `/rollback <completed-feature>` to plan a safe reversal.
> Build one thing at a time; `/complete` archives it under
> `blueprint/history/` and resets this file.

**Feature 17a: Intelligence Service Scaffold & API Contract**  
**Status:** `verified`

## Goal
Establish the standalone Python / FastAPI microservice for the Merchander Intelligence layer in `services/intelligence`. This service will provide the AI brain for social-commerce reasoning, intent extraction, and automated replies. Step 17a sets up the service structure, environment configuration, API key security, Pydantic schemas mirroring Next.js contracts, health monitoring, and a repeatable test suite.

## In Scope
- Stand up the Python microservice directory structure under `services/intelligence/`.
- Dependency management: `pyproject.toml` and `requirements.txt` (FastAPI, Pydantic v2, Uvicorn, Httpx, Pytest, python-dotenv).
- Configuration module (`app/config.py`) with environment variable validation (`INTELLIGENCE_SERVICE_API_KEY`, `ENVIRONMENT`, `PORT`).
- API security layer (`app/security.py`) enforcing `X-API-Key` authentication on protected endpoints.
- Pydantic models (`app/schemas.py`) matching TypeScript types (`NormalizedMessage`, `ExtractedCart`, `ExtractedItem`).
- Endpoints:
  - `GET /health` (unauthenticated health check returning service status and version).
  - `POST /api/v1/extract` (authenticated contract endpoint accepting `NormalizedMessage` and returning validated `ExtractedCart` schema).
- Test harness using `pytest` verifying health, unauthorized rejections (401), and contract validation (200 / 422).

## Out of Scope
- Live LLM API invocation / prompt engineering (handled in 17b).
- Supabase database client and catalog fetching (handled in 17b).
- Wiring Next.js webhook routes or `src/lib/intelligence/extract.ts` (handled in 17c).
- Celery / Redis background queue workers (handled in 17d).
- Multimodal image lookup (handled in future sub-feature).

## Context & Constraints
- **Location:** Resides in `services/intelligence/` inside this repository for cohesive contract versioning with Next.js.
- **Contract Parity:** `ExtractedCart` and `NormalizedMessage` Pydantic schemas must strictly align with `src/types/messaging.ts`.
- **Security:** Protected routes must require `X-API-Key: <INTELLIGENCE_SERVICE_API_KEY>` to prevent unauthorized extraction requests.
- **Port:** Defaults to port `8000`.

## Build Steps
- [x] 1. Initialize `services/intelligence/` with `pyproject.toml`, `requirements.txt`, `.env.example`, and `.gitignore`.
- [x] 2. Implement `app/config.py` using Pydantic Settings for type-safe environment configuration.
- [x] 3. Implement `app/security.py` providing the `verify_api_key` FastAPI dependency.
- [x] 4. Define Pydantic request/response schemas in `app/schemas.py` mirroring `src/types/messaging.ts`.
- [x] 5. Implement FastAPI application in `app/main.py` with `GET /health` and authenticated `POST /api/v1/extract` contract route.
- [x] 6. Create unit tests with `pytest` in `tests/test_health.py` and `tests/test_extract.py` validating 200, 401, and 422 behavior.

## Files & Areas
- `services/intelligence/pyproject.toml` [NEW]
- `services/intelligence/requirements.txt` [NEW]
- `services/intelligence/.env.example` [NEW]
- `services/intelligence/app/config.py` [NEW]
- `services/intelligence/app/security.py` [NEW]
- `services/intelligence/app/schemas.py` [NEW]
- `services/intelligence/app/main.py` [NEW]
- `services/intelligence/tests/test_health.py` [NEW]
- `services/intelligence/tests/test_extract.py` [NEW]
- `.env.example` [MODIFY] (document `PYTHON_BRAIN_URL` and `INTELLIGENCE_SERVICE_API_KEY`)

## Data & Contracts
- **`NormalizedMessage` (Input):**
  - `platform`: `Literal['whatsapp', 'telegram', 'web']`
  - `external_id`: `str`
  - `sender_id`: `str`
  - `text`: `str`
  - `timestamp`: `str` (ISO 8601)
- **`ExtractedCart` (Output):**
  - `items`: `List[ExtractedItem]` where `ExtractedItem` has `sku: str`, `quantity: int`
  - `confidence`: `float` (0.0 to 1.0)
- **Auth Header:** `X-API-Key: <secret>`

## Testing
- **Health Check:** `GET /health` returns HTTP 200 with `{"status": "ok", "service": "merchander-intelligence"}`.
- **Auth Rejection:** `POST /api/v1/extract` without valid `X-API-Key` returns HTTP 401 Unauthorized.
- **Contract Schema Validation:** `POST /api/v1/extract` with valid payload returns HTTP 200 and schema compliant with `ExtractedCart`.
- **Validation Error:** `POST /api/v1/extract` with invalid JSON returns HTTP 422 Unprocessable Entity.
- Test command: `pytest` inside `services/intelligence/`.

## AI Notes
- Keep the FastAPI app modular (`app/api/v1/` structure) so 17b can easily plug in the LLM pipeline.
- Ensure CORS or internal networking headers are ready for Next.js Server Action / route handler calls.
- Do not import heavy ML/torch libraries in 17a; keep dependencies lean and fast to install.
