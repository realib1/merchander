---
name: modern-system-architecture
description: >-
  Use this skill when designing, structuring, refactoring, or evaluating the overall system architecture,
  data flow, domain boundaries, idempotency, event messaging, and long-term maintainability.
---

# Modern System Architecture & Design Guide

This skill provides architectural principles and concrete patterns for building resilient, extensible, multi-tenant cloud software designed for high availability and long-term evolution.

---

## 1. Core Architectural Tenets

### 1.1 Separation of Concerns & Clean Layering
Every component follows a unidirectional dependency flow:
```
[Client / API Routers] ──► [Application / Services] ──► [Domain / Models] ◄── [Infrastructure / Repositories]
```
- **Routers / Web Layer**: HTTP/WebSocket parsing, authentication extraction, response status formatting. NO business logic.
- **Service Layer**: Business workflows, transaction boundaries, coordination between repositories and external services (WhatsApp, Telegram, SMS).
- **Domain Layer**: Core entities, data validation, business rules, and state machine invariants.
- **Infrastructure Layer**: Database sessions (PostgreSQL RLS), Redis caching/queues, file storage (S3/local), and third-party APIs.

### 1.2 Idempotency in Distributed Actions
Network drops, webhook retries, and worker reconnections must never cause duplicate orders, duplicate charges, or phantom state mutations.
- **Idempotency Keys**: Assign or derive an idempotency key for every inbound external event (e.g. WhatsApp message ID `baileys_msg_id`, Telegram `update_id`).
- Store processed event IDs in Redis or database with a TTL (e.g., 24 hours):
```python
async def is_event_processed(redis_client, event_key: str) -> bool:
    # Set NX (only if not exists) with 24-hour expiration
    was_set = await redis_client.set(f"idempotency:{event_key}", "1", ex=86400, nx=True)
    return not was_set  # True if duplicate
```

### 1.3 State Machine Driven Lifecycles
Avoid arbitrary string status updates. Enforce explicit status transitions:

```
[PENDING] ──► [PAID] ──► [PROCESSING] ──► [SHIPPED] ──► [DELIVERED]
    │           │                                           ▲
    ▼           ▼                                           │
[CANCELLED] [REFUNDED] ─────────────────────────────────────┘
```

```python
VALID_ORDER_TRANSITIONS = {
    "PENDING": {"PAID", "CANCELLED"},
    "PAID": {"PROCESSING", "REFUNDED", "CANCELLED"},
    "PROCESSING": {"SHIPPED", "CANCELLED"},
    "SHIPPED": {"DELIVERED"},
    "DELIVERED": set(),
    "CANCELLED": set(),
    "REFUNDED": set()
}

def transition_order_status(current_status: str, new_status: str) -> bool:
    if new_status not in VALID_ORDER_TRANSITIONS.get(current_status, set()):
        raise ValueError(f"Invalid state transition from {current_status} to {new_status}")
    return True
```

---

## 2. Scalable Asynchronous Event & Queue Patterns

### 2.1 Decouple Ingestion from Processing
When receiving social chat messages or webhooks:
1. Validate format & tenant context immediately (<20ms).
2. Push payload to Celery / Redis queue.
3. Respond `200 OK` / `202 Accepted` to caller instantly to avoid timeout drops.
4. Let workers process parsing, NLP matching, and database persistence asynchronously.

### 2.2 Graceful Degradation & Dead Letter Queues (DLQ)
- Celery tasks must configure `max_retries` with exponential backoff and jitter.
- Unresolvable failures get routed to a `dead_letter_queue` table/queue with full stack trace for merchant or system admin inspection.

---

## 3. Long-Term Maintainability Checklist
- [ ] Every database change has a reversible migration script.
- [ ] No hardcoded configuration strings or secrets; all loaded via typed environment schemas (`pydantic-settings` or `@t3-oss/env-nextjs`).
- [ ] All database writes occur within explicit transactional boundaries.
- [ ] Health check endpoints (`/healthz`, `/ready`) probe database and Redis connectivity.
