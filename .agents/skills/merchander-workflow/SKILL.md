---
name: merchander-workflow
description: >-
  Use this skill when developing, testing, migrating database models, adding API endpoints,
  or verifying multi-tenant data isolation and bot workflows in the Merchander codebase.
---

# Merchander Development & Multi-Tenant Workflow Skill

This skill provides step-by-step procedures, runbooks, and recipes for building features in Merchander while maintaining strict multi-tenant isolation.

---

## 1. Runbook: Adding a New Tenant-Scoped Database Table

When creating a new entity (e.g. `discounts`, `delivery_zones`, `staff_notes`):

### Step 1: Define SQLAlchemy Model
In `apps/api/models/<entity>.py`:
```python
import uuid
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from apps.api.models.base import Base, TenantModelMixin

class DiscountCode(Base, TenantModelMixin):
    __tablename__ = "discount_codes"

    code: Mapped[str] = mapped_column(nullable=False)
    discount_percent: Mapped[int] = mapped_column(default=0)
    is_active: Mapped[bool] = mapped_column(default=True)
    # Note: id, tenant_id, created_at, updated_at are inherited from TenantModelMixin
```

### Step 2: Generate Alembic Migration with RLS Policy
In `packages/db/migrations/versions/...`:
```python
def upgrade():
    # 1. Create table
    op.create_table(
        'discount_codes',
        sa.Column('id', sa.UUID(), nullable=False, primary_key=True),
        sa.Column('tenant_id', sa.UUID(), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('discount_percent', sa.Integer(), nullable=False, default=0),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint('tenant_id', 'code', name='uq_tenant_discount_code')
    )
    op.create_index('idx_discount_codes_tenant', 'discount_codes', ['tenant_id', 'is_active'])

    # 2. Enable PostgreSQL Row-Level Security (RLS)
    op.execute("ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;")
    op.execute("""
        CREATE POLICY tenant_isolation_discount_codes ON discount_codes
        FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);
    """)

def downgrade():
    op.drop_table('discount_codes')
```

---

## 2. Runbook: Adding a Tenant-Scoped FastAPI Endpoint

### Step 1: Create Pydantic Schema
In `apps/api/schemas/discount.py`:
```python
from pydantic import BaseModel, UUID4
from datetime import datetime

class DiscountCreate(BaseModel):
    code: str
    discount_percent: int

class DiscountRead(DiscountCreate):
    id: UUID4
    tenant_id: UUID4
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
```

### Step 2: Create Router Endpoint with Tenant Dependencies
In `apps/api/routers/discounts.py`:
```python
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from apps.api.core.security import TenantContext, get_current_tenant_context
from apps.api.core.database import get_tenant_db
from apps.api.models.discount import DiscountCode
from apps.api.schemas.discount import DiscountCreate, DiscountRead
from typing import List

router = APIRouter(prefix="/v1/discounts", tags=["Discounts"])

@router.get("", response_model=List[DiscountRead])
async def list_discounts(
    tenant_ctx: TenantContext = Depends(get_current_tenant_context),
    db: AsyncSession = Depends(get_tenant_db)
):
    stmt = select(DiscountCode).order_by(DiscountCode.created_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("", response_model=DiscountRead, status_code=status.HTTP_201_CREATED)
async def create_discount(
    data: DiscountCreate,
    tenant_ctx: TenantContext = Depends(get_current_tenant_context),
    db: AsyncSession = Depends(get_tenant_db)
):
    new_discount = DiscountCode(
        tenant_id=tenant_ctx.tenant_id,
        code=data.code,
        discount_percent=data.discount_percent
    )
    db.add(new_discount)
    await db.commit()
    await db.refresh(new_discount)
    return new_discount
```

---

## 3. Runbook: Executing Multi-Tenant Penetration Tests

Always run the automated isolation suite after modifying queries or models:

```bash
pytest tests/test_tenant_isolation.py -v
```

Verification check:
- Test 1: Tenant A cannot read Tenant B's products (`404 Not Found`).
- Test 2: Tenant A cannot update Tenant B's orders (`404 Not Found`).
- Test 3: Raw SQL queries without `app.current_tenant_id` return empty sets due to PostgreSQL RLS policies.
