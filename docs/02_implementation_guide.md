# MERCHANDER: Full Stack Implementation Guide
## Next.js 15 App Router + Supabase RLS + Python AI Engine

---

# 1. Architecture Overview

Merchander is built on a **3-Layer Architecture**:

1. **Commerce Core (Next.js 15 + Supabase PostgreSQL)**:
   - Next.js App Router (`src/app/`) with React Server Components (RSC) and Server Actions (`src/app/actions/`).
   - Tenant isolation enforced via PostgreSQL Row Level Security (RLS) and `@supabase/ssr`.
   - Complete domain coverage: Products, Multi-Branch Inventory, Customers, Unified Identities, Orders, Payments, Suppliers, Purchase Orders, Shipments & Landed Costs.

2. **Intelligence Layer (Python + FastAPI)**:
   - Multimodal image lookup ("Do you have this?" + catalog matching).
   - Async task queues with Celery + Redis for auto-replies, notifications, and scheduled workflows.
   - GREEN / YELLOW / RED Action safety boundaries.

3. **Channel Connectors (Meta Graph API / Webhooks)**:
   - Official WhatsApp Cloud API (as an approved Meta Tech Provider).
   - Telegram Bot API and Storefront Webhooks.

---

# 2. Workspace File Structure

```text
merchander/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── dashboard/                  # Tenant-scoped dashboard
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx               # Command Center / Overview
│   │   │   ├── products/              # Catalog & Pre-orders
│   │   │   ├── inventory/             # Multi-store stock & adjustments
│   │   │   ├── orders/                # Orders & creation
│   │   │   ├── payments/              # MoMo, Cash, settlements
│   │   │   ├── customers/             # CRM & channel identities
│   │   │   ├── suppliers/             # Supplier profiles & POs
│   │   │   ├── shipments/             # Sea/Air freight logistics
│   │   │   ├── expenses/              # Operating expenses
│   │   │   ├── staff/                 # Team roles & permissions
│   │   │   └── settings/              # Storefront, channels, notifications
│   │   ├── store/[slug]/              # Public merchant storefront
│   │   ├── actions/                   # Server Actions (Mutations & Data Fetching)
│   │   │   ├── products.ts
│   │   │   ├── orders.ts
│   │   │   ├── payments.ts
│   │   │   ├── suppliers.ts
│   │   │   ├── shipments.ts
│   │   │   ├── customers.ts
│   │   │   └── settings.ts
│   │   └── api/                       # Webhook endpoints (WhatsApp, Hubtel, Paystack)
│   ├── components/                    # Reusable UI & domain components
│   │   ├── ui/                        # Button, Input, Modal, Table primitives
│   │   └── dashboard/                 # MetricCard, StatusBadge, DataTables
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── server.ts              # createClient with cookies (SSR)
│   │   │   ├── client.ts              # Browser client
│   │   │   └── admin.ts               # Service-role client (for webhooks)
│   │   └── utils.ts
│   └── types/
│       ├── supabase.ts                # Auto-generated database types
│       └── ...
├── supabase/
│   └── migrations/                    # Versioned SQL migrations
└── bot/                               # Python automation service
    ├── api/
    ├── automation/
    ├── bots/
    └── tasks/
```

---

# 3. Supabase Server Client & Tenant Scoping Pattern

All Server Actions and RSCs use `@supabase/ssr` with cookie management to pass user sessions directly to PostgreSQL, where RLS policies isolate tenant data.

### `src/lib/supabase/server.ts`
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Handled in middleware
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // Handled in middleware
          }
        },
      },
    }
  );
}
```

---

# 4. Server Action Example: Vertical Slice (Shipments & Landed Costs)

### `src/app/actions/shipments.ts`
```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createShipment(formData: {
  supplier_id: string;
  purchase_order_id?: string;
  title: string;
  tracking_number?: string;
  carrier?: string;
  freight_mode: 'sea' | 'air' | 'road' | 'express';
  origin_port?: string;
  destination_port?: string;
  departure_date?: string;
  eta?: string;
  cbm?: number;
  weight_kg?: number;
  shipping_cost?: number;
  customs_duty?: number;
  currency?: string;
  notes?: string;
}) {
  const supabase = await createClient();

  // 1. Get current authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Unauthorized');

  // 2. Fetch tenant_id
  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  if (!tenantUser) throw new Error('Tenant workspace not found');

  // 3. Insert shipment (RLS guarantees tenant isolation)
  const { data, error } = await supabase
    .from('shipments')
    .insert({
      tenant_id: tenantUser.tenant_id,
      ...formData,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating shipment:', error);
    return { success: false, error: error.message };
  }

  // 4. Log workflow event
  await supabase.from('workflow_logs').insert({
    tenant_id: tenantUser.tenant_id,
    event_type: 'SHIPMENT_CREATED',
    source: 'user',
    actor_id: user.id,
    entity_type: 'shipment',
    entity_id: data.id,
    payload: { title: data.title, eta: data.eta },
  });

  revalidatePath('/dashboard/shipments');
  return { success: true, data };
}
```

---

# 5. Testing & Verification Standard

Before any commit or production deployment, execute:

```bash
# Type check and lint
yarn run check
yarn run lint

# Automated unit & integration tests
yarn run test

# Production build verification
yarn run build
```
