---
name: frontend-performance-react
description: >-
  Use this skill when developing or optimizing Next.js 15 and React 19 frontend applications,
  managing server vs client component boundaries, implementing streaming SSR, optimistic UI,
  and optimizing Core Web Vitals (LCP, INP, CLS).
---

# Next.js 15 & React 19 High-Performance Engineering Guide

This skill provides optimization patterns, rendering strategies, and performance guidelines for building ultra-fast, responsive web interfaces with Next.js 15 App Router and React 19.

---

## 1. Server Components vs. Client Components Architecture

### 1.1 The Golden Boundary Rule
- Default to **React Server Components (RSC)** (`page.tsx`, `layout.tsx`, static cards, data fetching wrappers).
- Use `'use client'` only at the leaves of the component tree where interactivity (hooks, state, event listeners, browser APIs) is strictly necessary.
- Pass server-rendered JSX as `children` into Client Components to keep heavy dependencies on the server.

```tsx
// ✅ Good: Server Component wrapper with client boundary leaf
// app/(dashboard)/orders/page.tsx (Server Component)
import { Suspense } from "react";
import { OrderTableClient } from "./order-table-client";
import { TableSkeleton } from "@/components/ui/skeletons";

export default async function OrdersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Orders & Transactions</h1>
      <Suspense fallback={<TableSkeleton />}>
        <OrderTableClient />
      </Suspense>
    </div>
  );
}
```

---

## 2. Optimistic UI Mutations

For high-frequency merchant operations (e.g. toggling "Mark as PAID", archiving products, updating stock):
- Implement optimistic updates using React 19's `useOptimistic` hook or SWR/TanStack Query mutation rollbacks so the UI responds in 0ms without waiting for network roundtrips.

```tsx
"use client";
import { useOptimistic, useTransition } from "react";
import { updateOrderStatusAction } from "@/app/actions/orders";

interface OrderItem {
  id: string;
  orderNumber: string;
  paymentStatus: "PENDING" | "PAID";
}

export function OrderRow({ order }: { order: OrderItem }) {
  const [isPending, startTransition] = useTransition();
  const [optimisticOrder, setOptimisticOrder] = useOptimistic(
    order,
    (state, newStatus: "PENDING" | "PAID") => ({ ...state, paymentStatus: newStatus })
  );

  const handleMarkAsPaid = () => {
    startTransition(async () => {
      setOptimisticOrder("PAID");
      await updateOrderStatusAction(order.id, "PAID");
    });
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-slate-800">
      <span className="font-mono text-white">{optimisticOrder.orderNumber}</span>
      <span className={`px-2.5 py-1 text-xs rounded-full ${optimisticOrder.paymentStatus === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
        {optimisticOrder.paymentStatus}
      </span>
      {optimisticOrder.paymentStatus !== "PAID" && (
        <button
          onClick={handleMarkAsPaid}
          disabled={isPending}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          Mark as PAID
        </button>
      )}
    </div>
  );
}
```

---

## 3. Core Web Vitals & Asset Optimization

### 3.1 Largest Contentful Paint (LCP) < 1.2s
- Use `next/image` with explicit `width`, `height`, and `priority` on above-the-fold hero banners and store logos.
- Preconnect to CDN and font domains.

### 3.2 Interaction to Next Paint (INP) < 100ms
- Avoid heavy computation inside React render loops.
- Use `scheduler.yield()` or Web Workers for heavy data processing in the browser.

### 3.3 Cumulative Layout Shift (CLS) = 0
- Always reserve aspect ratio space for images and dynamic data charts using CSS `aspect-ratio` or skeleton placeholders.
- Avoid injecting dynamic banners above existing content without fixed container heights.
