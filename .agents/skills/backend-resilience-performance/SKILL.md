---
name: backend-resilience-performance
description: >-
  Use this skill when optimizing backend performance, tuning database queries, configuring connection pools,
  handling async concurrency, scaling Redis/Celery queues, or adding observability and logging.
---

# Backend Resilience, Database Tuning & Performance Guide

This skill provides optimization patterns, database indexing strategies, asynchronous execution best practices, and observability runbooks for high-throughput social commerce backend operations.

---

## 1. Database Indexing & Query Optimization

### 1.1 Multi-Column Composite Index Strategy
Because every table has `tenant_id`, all indexes must lead with `tenant_id` to match the query planner's prefix access:
- **Time-Series Queries (Orders, Logs)**:
  ```sql
  CREATE INDEX idx_orders_tenant_created ON orders (tenant_id, created_at DESC);
  ```
- **Filtered Lookups (Products by status)**:
  ```sql
  CREATE INDEX idx_products_tenant_active ON products (tenant_id, is_active);
  ```
- **Customer CRM Lookups (by phone number)**:
  ```sql
  CREATE INDEX idx_customers_tenant_phone ON customers (tenant_id, phone_number);
  ```

### 1.2 Eliminating the N+1 Query Problem in Async SQLAlchemy
Always use `selectinload` or `joinedload` when loading relationships:
```python
from sqlalchemy.orm import selectinload

async def get_orders_with_items(tenant_id: UUID, db: AsyncSession):
    stmt = (
        select(Order)
        .where(Order.tenant_id == tenant_id)
        .options(selectinload(Order.items))
        .order_by(Order.created_at.desc())
        .limit(50)
    )
    result = await db.execute(stmt)
    return result.scalars().all()
```

### 1.3 Database Connection Pool Sizing
Configure asyncpg engine pool sizes based on container concurrency:
```python
engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,         # Baseline persistent connections
    max_overflow=10,      # Temporary burst connections
    pool_timeout=30,      # Max seconds to wait for a free connection
    pool_recycle=1800,    # Recycle connections every 30 mins to avoid stale TCP sockets
    pool_pre_ping=True    # Validate connection liveness before checkout
)
```

---

## 2. Asynchronous Concurrency & Resilience Patterns

### 2.1 Async Task Non-Blocking Rule
Never call synchronous/blocking I/O functions (`requests.get`, `time.sleep`, synchronous DB calls) inside FastAPI `async def` route handlers.
- Use `httpx.AsyncClient` instead of `requests`.
- Use `asyncio.sleep` instead of `time.sleep`.
- Offload CPU-intensive operations (image resizing, PDF generation) to Celery workers using `run_in_executor` or background tasks.

### 2.2 Circuit Breaker for Third-Party Services
When contacting external APIs (WhatsApp bridge, Telegram Bot API, Paystack, SMS Gateways):
- Set explicit timeouts (`timeout=5.0s`).
- Wrap calls in retry loops with exponential backoff and jitter.

---

## 3. Observability, Logging & Health Checks

### 3.1 Structured JSON Logging with Tenant Context
Every log line must include structured metadata and `tenant_id` for distributed tracing:
```python
import structlog

logger = structlog.get_logger()

# In route handler / worker
logger.info(
    "order.created",
    tenant_id=str(tenant_ctx.tenant_id),
    order_id=str(new_order.id),
    total_amount=float(new_order.total_amount),
    channel="WHATSAPP"
)
```

### 3.2 Liveness & Readiness Probes
```python
@app.get("/healthz", tags=["Health"])
async def liveness():
    return {"status": "ok"}

@app.get("/ready", tags=["Health"])
async def readiness(db: AsyncSession = Depends(get_tenant_db)):
    try:
        # Check DB connection
        await db.execute(text("SELECT 1"))
        return {"status": "ready", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail="Database unreachable")
```
