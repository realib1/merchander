---
name: modern-design-inspiration
description: >-
  Use this skill when designing modern SaaS interfaces, Bento Grid layouts, high-converting onboarding flows,
  micro-animations, and visual aesthetics inspired by top curated design galleries (Bento Grids, SaaSpo, Minimal Gallery, Codrops, StudioGrid Pro, AdminCN).
---

# Modern Design Inspiration & Bento UI Architecture Guide

This skill translates world-class design patterns from curated repositories (Bento Grids, SaaSpo, Minimal Gallery, Codrops, Growth.design, [StudioGrid Pro E-commerce](https://studiogrid-pro-ecommerce.netlify.app/), and [AdminCN Sales Dashboard](https://shadcn-nextjs-admincn-admin-template.vercel.app/dashboard/sales)) into concrete Next.js 15 and TailwindCSS component structures.

---

## 1. Bento Grid Architecture for SaaS Dashboards

Bento Grids organize complex multi-tenant metrics, live status indicators, and actions into harmonious, asymmetric modular tiles.

```
┌─────────────────────────┬─────────────────────────┬─────────────────────────┐
│     TILE 1 (2 cols)     │     TILE 1 (cont.)      │     TILE 2 (1 col)      │
│  Live GMV & Revenue     │  Interactive Chart      │  Bot Status Pill & QR   │
├─────────────────────────┼─────────────────────────┼─────────────────────────┤
│     TILE 3 (1 col)      │     TILE 4 (1 col)      │     TILE 5 (1 col)      │
│  Pending MoMo Orders    │  Top Selling Products   │  Active Branches (Stores│
└─────────────────────────┴─────────────────────────┴─────────────────────────┘
```

### 1.1 Responsive Bento Grid Tailwind Pattern
```tsx
export function BentoDashboardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:gap-6">
      {children}
    </div>
  );
}

export function BentoTile({
  className = "",
  span = "col-span-1",
  children,
}: {
  className?: string;
  span?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur-xl transition-all duration-300 hover:border-slate-700 hover:shadow-2xl hover:shadow-emerald-500/5 ${span} ${className}`}
    >
      {/* Subtle top-left gradient glow on hover */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl transition-opacity duration-500 group-hover:opacity-100 opacity-40" />
      {children}
    </div>
  );
}
```

### 1.2 Sales Analytics & KPI Sparkline Cards (AdminCN Reference)
The [AdminCN Sales Dashboard](https://shadcn-nextjs-admincn-admin-template.vercel.app/dashboard/sales) showcases compact, dense sales KPI cards with embedded Recharts sparklines:
- **Card Layout**: Asymmetrical 6-column dashboard grid (`grid grid-cols-6 gap-6`) where top stat cards span 1 to 2 columns on desktop and 3 columns on mobile.
- **Embedded Sparklines**: Mini area/bar charts (`h-21` to `h-31`) integrated directly into the card body without axes or grid lines to display micro-trends at a glance.
- **Transaction Overview Split Card**: Multi-column Bento card (`col-span-full lg:col-span-4`) featuring a primary chart on the left (e.g., weekly total transaction volume) and a vertical separator leading to weekly performance breakdown metrics (income vs expense deltas, percentage badges, and direct report CTAs).

---

## 2. SaaS Visual Polish & Minimalist Hierarchy (SaaSpo & Minimal Gallery)

### 2.1 Color Tokens & Accents
- **Base Canvas**: `#090D16` (Deep Obsidian Slate)
- **Card Background**: `rgba(15, 23, 42, 0.65)` (Translucent Dark Navy)
- **Borders**: `rgba(255, 255, 255, 0.08)` (Ultra-fine hairline border)
- **Primary Accent**: `#10B981` (Emerald Green - Ghana Currency & Success)
- **Secondary Accent**: `#6366F1` (Indigo - Automation & Bots)
- **Warning / Pending**: `#F59E0B` (Amber - Pending Mobile Money Payment)

### 2.2 Live Status Indicators
```tsx
export function LiveStatusPill({ status }: { status: "CONNECTED" | "PAIRING" | "DISCONNECTED" }) {
  const config = {
    CONNECTED: { color: "bg-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400", label: "Bot Active & Listening" },
    PAIRING: { color: "bg-amber-400 animate-ping", bg: "bg-amber-500/10 border-amber-500/20 text-amber-400", label: "Awaiting QR Scan" },
    DISCONNECTED: { color: "bg-rose-400", bg: "bg-rose-500/10 border-rose-500/20 text-rose-400", label: "Disconnected" }
  }[status];

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${config.bg}`}>
      <span className="relative flex h-2 w-2">
        {status === "CONNECTED" && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${config.color}`} />
      </span>
      {config.label}
    </div>
  );
}
```

---

## 3. High-Conversion Onboarding Flow (Growth.design & Supahero)

Follow a 4-step progressive onboarding checklist with live progress meter:

1. **Step 1: Store Setup** (Store name, branch location, default currency `GH₵`).
2. **Step 2: Connect Social Bot** (Scan WhatsApp QR code or enter Telegram token).
3. **Step 3: Add First Product** (Photo, price in GHS, stock quantity).
4. **Step 4: Select Sales Channel** (Pick WhatsApp group or Telegram channel to auto-post).

```
Progress: [████████████░░░░] 75% Complete (3 of 4 steps completed)
```

---

## 4. Codrops-Inspired Micro-Interactions

- **Button Press Physics**: `active:scale-[0.97] transition-transform duration-100 ease-out`.
- **Card Entry Animations**: `@starting-style` or Tailwind CSS slide-fade transitions (`transition duration-300 ease-in-out opacity-100 translate-y-0`).
- **Interactive Tooltips**: Positioned smoothly using modern CSS Anchor Positioning or Radix primitives with zero layout shifts.
