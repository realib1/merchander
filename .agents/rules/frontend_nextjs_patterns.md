# Next.js 15 & Frontend Design Rules

## 1. Code Organization (`apps/web/`)

```
apps/web/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx       # Sidebar, TopNav, Tenant Context Provider
│   │   ├── page.tsx         # Executive Overview / Analytics
│   │   ├── orders/page.tsx  # Order processing & Manual MoMo confirmation
│   │   ├── products/page.tsx # Catalog & stock inventory
│   │   ├── customers/page.tsx # Customer CRM directory
│   │   ├── bots/page.tsx    # WhatsApp QR code pairing & Telegram token setup
│   │   └── settings/page.tsx # Store settings & branch management
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                  # Button, Input, Modal, Badge, Dropdown
│   ├── dashboard/           # MetricsCard, RevenueChart, OrderTable, QRModal
│   └── layout/              # Sidebar, Header, BranchSwitcher
├── lib/
│   ├── api-client.ts        # Authenticated fetch client with JWT
│   └── utils.ts             # Currency formatter (GHS), Date formatters
└── auth.ts                  # NextAuth v5 configuration
```

---

## 2. Visual Excellence & UX Guidelines

1. **Ghanaian Currency Formatting**:
   - Always display currency using `GH₵` or `GHS` with commas and 2 decimal places:
     ```typescript
     export function formatGHS(amount: number | string): string {
       const num = typeof amount === "string" ? parseFloat(amount) : amount;
       return new Intl.NumberFormat("en-GH", {
         style: "currency",
         currency: "GHS"
       }).format(num || 0);
     }
     ```
2. **Theme & Aesthetics**:
   - Modern, sleek interface with curated colors (slate/emerald accents representing commerce and money).
   - Glassmorphic stat cards with subtle borders (`border border-slate-800 bg-slate-900/60 backdrop-blur-md`).
   - Use [StudioGrid Pro E-commerce](https://studiogrid-pro-ecommerce.netlify.app/) as the primary reference for the dashboard layout, KPI widgets, and overall visual aesthetic.
   - Micro-animations on hover, state transitions, and responsive mobile-friendly layouts (Ghanaian merchants often manage stores from their phones).
3. **Optimistic Updates**:
   - Toggling "Mark as PAID" or changing order status must update the UI optimistically with toast feedback.
