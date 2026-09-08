---
name: ui-ux-design-system
description: >-
  Use this skill when building or styling UI components, pages, design systems, theme tokens,
  micro-interactions, responsive layouts, empty states, and animations.
---

# Modern UI/UX Design System & Aesthetics Guide

This skill provides guidelines and patterns for creating high-polish, state-of-the-art merchant dashboards and customer-facing interfaces that deliver a premium, delightful user experience (Primary References: [StudioGrid Pro E-commerce](https://studiogrid-pro-ecommerce.netlify.app/), [AdminCN Sales Dashboard](https://shadcn-nextjs-admincn-admin-template.vercel.app/dashboard/sales)).

---

## 1. Core Visual Principles

### 1.1 Curated Color Palette & Glassmorphism
Avoid raw, oversaturated primary colors. Use harmonious, balanced color tokens:
- **Backgrounds**: Sleek dark slate (`#0B0F17`, `#111827`) and crisp light ivory (`#FAFAF9`, `#F8FAFC`).
- **Surface & Cards**: Glassmorphic panels with subtle frosted borders:
  ```css
  .glass-card {
    background: rgba(17, 24, 39, 0.7);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  }
  ```
- **Primary Brand Accents**:
  - Emerald Green (`#10B981` / `#059669`) representing financial growth & commerce.
  - Electric Indigo (`#6366F1` / `#4F46E5`) for interactive controls, focus states, and primary CTAs.
  - Warm Amber (`#F59E0B`) for pending MoMo payments and alerts.

### 1.2 Typography & Hierarchy
- Use modern Google Fonts (`Outfit` or `Plus Jakarta Sans` for headings, `Inter` for data tables and UI controls).
- Number / Metric display: Use `tabular-nums` (`font-mono` or `font-feature-settings: 'tnum'`) on prices and quantities so figures align vertically in tables.
- Visual hierarchy: Always distinguish primary values (bold 18px-24px), labels (medium 12px-14px uppercase muted), and helper text (regular 12px subtle).

---

## 2. Complete UI State Coverage

Every dynamic component MUST handle 5 fundamental UI states:

1. **Loading State**:
   - Use shimmer/skeleton loaders matching the exact layout of the target content rather than a generic spinner.
2. **Empty State**:
   - Friendly graphic/icon + clear explanation + immediate Call-to-Action (e.g. "No orders captured yet. Connect your WhatsApp group to start receiving orders!").
3. **Error State**:
   - Distinct, non-destructive alert with actionable retry button and human-readable explanation.
4. **Success / Feedback State**:
   - Instant toast notification (`sonner` or custom) with sound/visual checkmark.
5. **Interactive / Hover / Active States**:
   - Smooth transition (`transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1)`).
   - Subtle scale on hover (`hover:scale-[1.02]`), distinct active press (`active:scale-[0.98]`).

---

## 3. Component Design Patterns

### 3.1 Stat & KPI Card Pattern
```tsx
interface MetricCardProps {
  title: string;
  value: string;
  changePercent?: number;
  periodLabel?: string;
  icon: React.ReactNode;
}

export function MetricCard({ title, value, changePercent, periodLabel, icon }: MetricCardProps) {
  const isPositive = (changePercent ?? 0) >= 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md shadow-xl transition hover:border-slate-700">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <div className="text-3xl font-extrabold tracking-tight text-white tabular-nums">{value}</div>
        {changePercent !== undefined && (
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span className={`inline-flex items-center font-medium ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPositive ? '↑' : '↓'} {Math.abs(changePercent)}%
            </span>
            <span className="text-slate-500">{periodLabel || 'vs last month'}</span>
          </div>
        )}
      </div>
    </div>
  );
}
```

### 3.2 Mobile-First Responsive Design
- African merchants conduct >70% of store management on smartphones.
- Dashboards must collapse sidebars into smooth slide-over bottom sheets or drawers on viewport `< 768px`.
- Tables switch to touch-friendly card list views on mobile screens.
- Touch targets must meet a minimum size of `44px × 44px`.
