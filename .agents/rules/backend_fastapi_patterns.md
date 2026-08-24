# FastAPI & Backend Architectural Rules

## 1. Code Organization (`apps/api/`)

```
apps/api/
├── main.py                  # FastAPI app factory, middleware, router mounts
├── core/
│   ├── config.py            # Pydantic BaseSettings
│   ├── database.py          # SQLAlchemy 2.0 async engine & session dependencies
│   ├── security.py          # JWT encoding/decoding & tenant context dependency
│   └── errors.py            # Global exception handlers
├── models/                  # SQLAlchemy 2.0 ORM models
│   ├── base.py              # Base & TenantModelMixin
│   ├── tenant.py            # Tenant & User models
│   ├── store.py             # Store / Branch models
│   ├── product.py           # Product & Inventory models
│   ├── order.py             # Order & OrderItem models
│   ├── customer.py          # Customer CRM models
│   └── bot.py               # BotConfig & ScheduledPost models
├── schemas/                 # Pydantic v2 schemas (In, Out, Update)
├── routers/                 # API route endpoints
│   ├── auth.py              # /v1/auth
│   ├── tenants.py           # /v1/tenants
│   ├── stores.py            # /v1/stores
│   ├── products.py          # /v1/products
│   ├── orders.py            # /v1/orders
│   ├── customers.py         # /v1/customers
│   ├── analytics.py         # /v1/analytics
│   └── bots.py              # /v1/bots (WhatsApp & Telegram webhooks/pairing)
└── services/                # Business logic, Order parser, Bot dispatcher
```

---

## 2. API Routing & Dependency Standards

- All API endpoints are versioned under `/v1/...`.
- Endpoints requiring authentication MUST use:
  ```python
  @router.get("/products", response_model=List[ProductRead])
  async def list_products(
      tenant_ctx: TenantContext = Depends(get_current_tenant_context),
      db: AsyncSession = Depends(get_tenant_db)
  ):
      stmt = select(Product).order_by(Product.created_at.desc())
      result = await db.execute(stmt)
      return result.scalars().all()
  ```
- Always use `status_code=status.HTTP_201_CREATED` for creation endpoints.
- Return explicit error messages with Pydantic standard format `{"detail": "..."}`.

---

## 3. SQLAlchemy 2.0 Async Guidelines

- Use `await db.execute(select(...))` and `result.scalars().all()` / `result.scalar_one_or_none()`.
- Explicit relationships: specify `lazy="selectin"` for asynchronous relation loading.
- Transactions: Route handlers receive sessions wrapped in transaction blocks via `get_tenant_db`.
