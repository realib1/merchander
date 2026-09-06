# Current Feature

> **Generated file.** Holds the one feature, fix, or rollback being built right now. Run
> `/feature <number-or-name>` to spec a build-plan feature, or `/fix "<bug>"` for
> an ad-hoc fix. Use `/rollback <completed-feature>` to plan a safe reversal.
> Build one thing at a time; `/complete` archives it under
> `blueprint/history/` and resets this file.

**Feature 17b: Grounded Catalog Retrieval & LLM Extraction**  
**Status:** `verified`

## Goal
Implement grounded catalog retrieval and LLM reasoning in the Python Intelligence service. The service will fetch real tenant product variants, prices, availability, and pre-order batches from Supabase, pass them as grounding context to an LLM extraction engine, and return structured cart items (`sku`, `quantity`) and customer intent from conversational messages.

## In Scope
- Supabase catalog data service (`app/services/catalog.py`) querying products, variants, inventory, and pre-order batches scoped by `tenant_id`.
- Settings updates (`app/config.py`) adding LLM configuration (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `LLM_MODEL`).
- Grounded extraction service (`app/services/extractor.py`):
  - Catalog grounding context builder.
  - LLM extraction prompt generating structured JSON.
  - Deterministic/heuristic fallback when LLM API keys are unset.
  - Strict SKU grounding: only known tenant SKUs are added to cart items.
- Endpoint wiring: Update `POST /api/v1/extract` to invoke catalog retrieval and extraction pipeline.
- Unit and integration tests in `tests/test_catalog.py` and `tests/test_extractor.py`.

## Out of Scope
- Updating Next.js `src/lib/intelligence/extract.ts` or webhook dispatch (handled in 17c).
- Sending outbound replies over WhatsApp/Telegram (handled in 17c / 18).
- Async Celery/Redis queue setup (handled in 17d).
- Multimodal image lookup (handled in future sub-feature).

## Context & Constraints
- **Tenant Isolation:** All database queries must strictly filter by `tenant_id`.
- **Anti-Hallucination:** Extracted cart items must only contain SKUs verified to exist in the tenant's catalog. Unknown products are noted in intent/notes without inventing SKUs.
- **Offline / Test Resiliency:** If no LLM API key is provided, the extractor falls back to deterministic keyword matching rather than failing.
- **Contracts:** Output must match `ExtractedCart` schema (`items`, `confidence`, `intent`, `notes`).

## Build Steps
- [x] 1. Update `app/config.py` and `services/intelligence/.env.example` with LLM provider settings (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `LLM_MODEL`).
- [x] 2. Implement `app/services/catalog.py` to query tenant products, variants, stock, and pre-orders from Supabase via async HTTP.
- [x] 3. Implement `app/services/extractor.py` with grounded LLM reasoning and deterministic fallback.
- [x] 4. Wire `POST /api/v1/extract` in `app/main.py` to run catalog retrieval and grounded extraction.
- [x] 5. Add unit and integration tests in `tests/test_catalog.py` and `tests/test_extractor.py`, ensuring all tests pass.

## Files & Areas
- `services/intelligence/app/config.py` [MODIFY]
- `services/intelligence/.env.example` [MODIFY]
- `services/intelligence/app/services/__init__.py` [NEW]
- `services/intelligence/app/services/catalog.py` [NEW]
- `services/intelligence/app/services/extractor.py` [NEW]
- `services/intelligence/app/main.py` [MODIFY]
- `services/intelligence/tests/test_catalog.py` [NEW]
- `services/intelligence/tests/test_extractor.py` [NEW]

## Data & Contracts
- **Catalog Context Item:**
  - `product_id`: `str`
  - `product_name`: `str`
  - `variant_id`: `str`
  - `variant_name`: `str`
  - `sku`: `str`
  - `price`: `float`
  - `availability_status`: `str` (`AVAILABLE` | `PRE_ORDER` | `OUT_OF_STOCK`)
- **Extraction Result (`ExtractedCart`):**
  - `items`: `List[ExtractedItem(sku: str, quantity: int)]`
  - `confidence`: `float` (0.0 to 1.0)
  - `intent`: `str` (`inquire_product`, `check_stock`, `create_order`, `check_order`, `greeting`, `unknown`)
  - `notes`: `Optional[str]`

## Testing
- **Catalog Retrieval:** Verify `fetch_tenant_catalog` constructs proper PostgREST queries and parses variant/product relationships.
- **Grounded Extraction:** Verify message "I need 3 of the Red Velvet bag (SKU-RED-01)" produces `{ sku: "SKU-RED-01", quantity: 3 }` with high confidence.
- **Unmatched Product:** Verify message for an item not in catalog produces empty `items` list and appropriate intent.
- **Auth & Error Handling:** Verify 401 without API key and 422 for invalid payloads remain intact.
- Test command: `uv run --extra dev pytest` inside `services/intelligence/`.

## AI Notes
- Use `httpx.AsyncClient` for asynchronous PostgREST calls with `apikey` and `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>` headers.
- Keep prompt templates clean and enforce strict JSON schema output.
