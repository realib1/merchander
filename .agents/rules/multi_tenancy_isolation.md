# Multi-Tenancy & Data Isolation Rules

This document outlines the strict rules governing multi-tenancy in Merchander.

## 1. Database Layer Isolation Rules

1. **Mandatory Foreign Key**: Every tenant-scoped table MUST include:
   ```sql
   tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
   ```
2. **Mandatory RLS Enablement**:
   ```sql
   ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;
   
   CREATE POLICY tenant_isolation_<table_name> ON <table_name>
       FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);
   ```
3. **Composite Indexes**: Always index `(tenant_id, ...)` for primary query patterns:
   - `(tenant_id, created_at DESC)` for ordered listings.
   - `(tenant_id, is_active)` for status filtering.
   - `(tenant_id, phone_number)` for customer lookups.
4. **Unique Constraints**: Unique constraints on customer data, order numbers, or SKUs must be composite unique keys scoped to `tenant_id`:
   ```sql
   CONSTRAINT uq_tenant_order_number UNIQUE (tenant_id, order_number)
   ```

---

## 2. API & Service Layer Rules

1. **Authentication Token Resolution**:
   - The `tenant_id` must ALWAYS come from the verified JWT payload (`get_current_tenant_context`).
   - Never accept `tenant_id` as a URL query param or body parameter for tenant-scoped operations.
2. **Transaction Scope**:
   - Every database transaction must initialize `SET LOCAL app.current_tenant_id = :tenant_id` via `get_tenant_db`.
3. **ORM Model Scoping**:
   - Every SQLAlchemy model representing tenant-specific data must inherit from `TenantModelMixin` and define `tenant_id: Mapped[uuid.UUID]`.

---

## 3. Background Job (Celery) Isolation Rules

1. **Payload Mandate**: Every Celery task signature must take `tenant_id: str` as a required parameter.
2. **Context Setup**: The task body must immediately wrap its execution in an isolated database session with `SET LOCAL app.current_tenant_id = :tenant_id`.
3. **No Global State**: Background jobs must never cache cross-tenant entities in global memory or un-scoped cache keys.

---

## 4. Bot & Social Ingestion Rules

1. **WhatsApp (Baileys)**:
   - Session keys and credentials must be stored under tenant-specific namespaces in Redis (e.g., `baileys:session:{tenant_id}`).
   - Inbound messages from groups are only processed if the group JID is present in `bot_configs.whatsapp_monitored_groups` for that tenant.
2. **Telegram**:
   - Webhook URL format is strictly `/v1/bots/telegram/webhook/{tenant_id}`.
   - Verify incoming webhook secret token if configured.
