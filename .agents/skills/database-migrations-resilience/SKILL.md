---
name: database-migrations-resilience
description: >-
  Use this skill when creating or modifying PostgreSQL database tables, writing Alembic migrations,
  adding indexes concurrently, or ensuring zero-downtime schema evolution.
---

# Database Migrations & Zero-Downtime PostgreSQL Resilience

This skill provides safety rules and patterns for evolving the multi-tenant PostgreSQL schema without downtime or table locking.

---

## 1. Zero-Downtime Migration Principles

### 1.1 Safe Column Additions
- Always add new columns with `NULL` or a default value that doesn't trigger table rewrite in PostgreSQL 11+:
  ```sql
  -- Safe in Postgres 11+ (metadata-only update)
  ALTER TABLE products ADD COLUMN compare_at_price NUMERIC(12, 2) DEFAULT NULL;
  ```

### 1.2 Concurrent Index Creation
- Never create indexes on large production tables without `CONCURRENTLY`:
  ```sql
  CREATE INDEX CONCURRENTLY idx_orders_tenant_created ON orders (tenant_id, created_at DESC);
  ```

---

## 2. Mandatory RLS Migration Template

Every new table migration in Alembic MUST follow this exact template:

```python
"""create discounts table

Revision ID: 0192837465ab
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade() -> None:
    # 1. Create table
    op.create_table(
        'discounts',
        sa.Column('id', sa.UUID(), nullable=False, primary_key=True),
        sa.Column('tenant_id', sa.UUID(), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('percent', sa.Integer(), nullable=False, default=0),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint('tenant_id', 'code', name='uq_tenant_discount_code')
    )
    
    # 2. Add Composite Index
    op.create_index('idx_discounts_tenant', 'discounts', ['tenant_id', 'is_active'])

    # 3. CRITICAL: Enable PostgreSQL Row-Level Security
    op.execute("ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;")
    op.execute("""
        CREATE POLICY tenant_isolation_discounts ON discounts
        FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);
    """)

def downgrade() -> None:
    op.drop_table('discounts')
```
