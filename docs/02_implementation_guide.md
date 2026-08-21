# MERCHANDER IMPLEMENTATION GUIDE
## Multi-Tenant SaaS | Complete Code Setup

---

# PART 1: PROJECT SETUP

## 1.1 Folder Structure

```
merchander/
├── app/                          # Next.js frontend
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/              # Vendor dashboard (tenant-scoped)
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── products/page.tsx
│   │   ├── orders/page.tsx
│   │   ├── analytics/page.tsx
│   │   ├── stores/page.tsx
│   │   ├── bots/page.tsx
│   │   └── settings/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── products/route.ts
│   │   ├── orders/route.ts
│   │   ├── stores/route.ts
│   │   ├── analytics/route.ts
│   │   └── bots/route.ts
│   └── layout.tsx
├── components/
│   ├── ui/
│   ├── dashboard/
│   └── common/
├── lib/
│   ├── auth.ts
│   ├── db.ts
│   └── tenant.ts               # Tenant context helpers
├── middleware.ts                # Tenant enforcement
├── prisma/
│   └── schema.prisma
│
└── bot/                         # Python backend (separate service)
    ├── main.py
    ├── api/
    │   ├── routes.py
    │   └── deps.py
    ├── core/
    │   ├── config.py
    │   ├── database.py
    │   └── security.py
    ├── bots/
    │   ├── whatsapp.py
    │   └── telegram.py
    ├── automation/
    │   ├── engine.py
    │   ├── scheduler.py
    │   ├── parser.py
    │   └── workflows.py
    ├── models/
    │   └── schemas.py
    ├── tasks/
    │   └── celery.py
    └── requirements.txt
```

## 1.2 Next.js Setup

```bash
pnpm create next-app@latest merchander \
  --typescript --tailwind --app --eslint

cd merchander

pnpm add \
  next-auth bcryptjs \
  @prisma/client prisma \
  @tanstack/react-query axios zustand \
  recharts lucide-react \
  react-hook-form zod @hookform/resolvers \
  jsonwebtoken

pnpm add -D vitest @testing-library/react
```

## 1.3 Python Setup

```bash
cd bot/
python -m venv venv
source venv/bin/activate

pip install \
  fastapi uvicorn[standard] \
  sqlalchemy psycopg2-binary \
  celery redis \
  python-telegram-bot \
  python-jose cryptography \
  pydantic-settings \
  apscheduler \
  httpx python-dotenv
```

---

# PART 2: DATABASE (DRIZZLE ORM)

## 2.1 db/schema.ts

`	ypescript
import { pgTable, text, timestamp, boolean, uuid, decimal, jsonb, varchar } from "drizzle-orm/pg-core";

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  plan: varchar("plan", { length: 50 }).default("FREE"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 50 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).default("PENDING"),
  createdAt: timestamp("created_at").defaultNow(),
});
`

`ash
npx drizzle-kit generate
npx drizzle-kit push
`

---

# PART 3: TENANT ISOLATION (NEXT.JS)

## 3.1 lib/tenant.ts

```typescript
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Get tenant_id from current session
export async function getTenantId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new Error("Unauthorized: No tenant context");
  }
  return session.user.tenantId;
}

// Verify resource belongs to current tenant
export async function assertTenantOwnership(
  resourceTenantId: string,
  sessionTenantId: string
) {
  if (resourceTenantId !== sessionTenantId) {
    throw new Error("Forbidden: Resource does not belong to tenant");
  }
}

// Check plan limits before action
export async function checkPlanLimit(
  tenantId: string,
  action: "add_product" | "add_store" | "add_platform"
) {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    include: {
      _count: { select: { products: true, stores: true } }
    }
  });

  const limits = {
    FREE: { products: 10, stores: 1, platforms: 1 },
    BASIC: { products: 50, stores: 2, platforms: 2 },
    PRO: { products: null, stores: 5, platforms: 2 },
  };

  const plan = limits[tenant!.plan as keyof typeof limits];

  if (action === "add_product" && plan.products !== null) {
    if (tenant!._count.products >= plan.products) {
      throw new Error(`Plan limit reached. Upgrade to add more products.`);
    }
  }

  if (action === "add_store" && plan.stores !== null) {
    if (tenant!._count.stores >= plan.stores) {
      throw new Error(`Plan limit reached. Upgrade to add more stores.`);
    }
  }
}
```

## 3.2 middleware.ts

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default async function middleware(request: NextRequest) {
  const session = await auth();

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    if (!session?.user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Protect API routes (except auth)
  if (
    request.nextUrl.pathname.startsWith("/api") &&
    !request.nextUrl.pathname.startsWith("/api/auth")
  ) {
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
```

## 3.3 lib/auth.ts

```typescript
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const user = await db.user.findFirst({
          where: { email: credentials.email as string },
          include: { tenant: true },
        });

        if (!user) throw new Error("Invalid credentials");

        const valid = await compare(credentials.password as string, user.password);
        if (!valid) throw new Error("Invalid credentials");

        if (!user.tenant.isActive) throw new Error("Account suspended");

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
          tenantName: user.tenant.name,
          tenantPlan: user.tenant.plan,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.tenantName = user.tenantName;
        token.tenantPlan = user.tenantPlan;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      session.user.tenantId = token.tenantId as string;
      session.user.tenantName = token.tenantName as string;
      session.user.tenantPlan = token.tenantPlan as string;
      return session;
    },
  },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
});
```

---

# PART 4: API ROUTES (NEXT.JS)

## 4.1 Signup (Create Tenant + User)

```typescript
// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { name, email, password, phone } = await req.json();

  // Check email not taken
  const existing = await db.user.findFirst({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 400 });
  }

  const slug = name.toLowerCase().replace(/\s+/g, "-");

  // Create tenant + user in one transaction
  const result = await db.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        name,
        slug: `${slug}-${Date.now()}`,
        email,
        phone,
        plan: "FREE",
      },
    });

    const user = await tx.user.create({
      data: {
        tenantId: tenant.id,
        email,
        password: await hash(password, 12),
        phone,
        role: "OWNER",
      },
    });

    return { tenant, user };
  });

  return NextResponse.json({ success: true, tenantId: result.tenant.id });
}
```

## 4.2 Products API (Tenant-Scoped)

```typescript
// app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTenantId, checkPlanLimit } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const tenantId = await getTenantId();

  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("storeId");

  const products = await db.select().from(products).where(eq(products.tenantId, tenantId));

  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const tenantId = await getTenantId();

  // Check plan limits before creating
  await checkPlanLimit(tenantId, "add_product");

  const body = await req.json();

  const product = await db.product.create({
    data: {
      tenantId,                          // ALWAYS set tenant
      ...body,
    },
  });

  return NextResponse.json(product, { status: 201 });
}
```

## 4.3 Orders API (Tenant-Scoped)

```typescript
// app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTenantId } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const tenantId = await getTenantId();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const storeId = searchParams.get("storeId");

  const orders = await db.select().from(orders).where(eq(orders.tenantId, tenantId));

  return NextResponse.json(orders);
}
```

## 4.4 Analytics API

```typescript
// app/api/analytics/overview/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTenantId } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const tenantId = await getTenantId();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalOrders, monthOrders, completedOrders, products] = await Promise.all([
    db.order.count({ where: { tenantId } }),
    db.order.count({ where: { tenantId, createdAt: { gte: startOfMonth } } }),
    db.select().from(orders).where(eq(orders.tenantId, tenantId));
}
```

---

# PART 5: PYTHON BOT ENGINE

## 5.1 Core Setup (bot/main.py)

```python
from fastapi import FastAPI
from contextlib import asynccontextmanager
from api.routes import router
from core.config import settings
from automation.scheduler import start_scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start scheduler on startup
    await start_scheduler()
    yield

app = FastAPI(title="Merchander Bot Engine", lifespan=lifespan)
app.include_router(router, prefix="/api")
```

## 5.2 Config (bot/core/config.py)

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    redis_url: str = "redis://localhost:6379"
    encryption_key: str
    nextjs_api_url: str = "http://localhost:3000"
    nextjs_api_secret: str

    class Config:
        env_file = ".env"

settings = Settings()
```

## 5.3 Telegram Bot (bot/bots/telegram.py)

```python
from telegram import Update, Bot
from telegram.ext import Application, MessageHandler, filters, ContextTypes
from automation.parser import OrderParser
from automation.workflows import OrderWorkflow
import asyncio

class TenantTelegramBot:
    """One instance per tenant"""

    def __init__(self, tenant_id: str, bot_token: str):
        self.tenant_id = tenant_id
        self.bot_token = bot_token
        self.app = Application.builder().token(bot_token).build()
        self.parser = OrderParser(tenant_id)
        self.workflow = OrderWorkflow(tenant_id)

        # Register message handler
        self.app.add_handler(
            MessageHandler(filters.TEXT & ~filters.COMMAND, self.handle_message)
        )

    async def handle_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        message = update.message.text
        chat_id = update.message.chat_id
        customer_phone = str(update.message.from_user.id)
        customer_name = update.message.from_user.full_name

        # Try to parse as order
        order = await self.parser.parse(message, customer_name, customer_phone)

        if not order:
            return  # Not an order message

        reply_parts = []

        # Handle out-of-stock rejections
        if order.rejected_items:
            reply_parts.append(self.parser.build_rejection_reply(order))

        # Handle valid items
        if order.is_valid:
            created = await self.workflow.create_order(order, source="TELEGRAM")
            reply_parts.append(self.format_confirmation(created))

        if reply_parts:
            await context.bot.send_message(
                chat_id=chat_id,
                text="\n\n".join(reply_parts)
            )

    def format_confirmation(self, order) -> str:
        """Build confirmation message, ETA-aware for PRE_ORDER items"""
        lines = []
        has_preorder = False

        for item in order["items"]:
            line = f"- {item['qty']}x {item['name']} @ GHS {item['unit_price']}"
            if item.get("stock_status") == "PRE_ORDER" and item.get("estimated_arrival"):
                line += f" *(Pre-order, ETA: {item['estimated_arrival']})*"
                has_preorder = True
            lines.append(line)

        items_text = "\n".join(lines)
        eta_note = (
            "\n\n⚠️ Pre-order items: shipping fee payable on arrival."
            if has_preorder else ""
        )

        return (
            f"✅ Order received!\n\n"
            f"{items_text}\n\n"
            f"Total: GHS {order['total_price']}"
            f"{eta_note}\n\n"
            f"We'll confirm shortly."
        )

    def format_post_caption(self, product: dict) -> str:
        """Build bot post caption based on stock status"""
        status = product.get("stock_status", "AVAILABLE")
        name = product["name"]
        description = product.get("description", "")
        price = product["price"]

        if status == "AVAILABLE":
            status_line = "✅ In Stock — Ready for pickup"
            cta = "Reply to order ⬇️"
        elif status == "PRE_ORDER":
            eta = product.get("estimated_arrival", "TBD")
            shipping_type = product.get("shippingType", "")
            status_line = f"⏳ Pre-Order — Arriving ~{eta}"
            if shipping_type:
                status_line += f"\n🚢 {shipping_type} freight"
            cta = "Reply to pre-order ⬇️"
        else:  # OUT_OF_STOCK
            status_line = "❌ Out of Stock"
            cta = "Reply *NOTIFY* to be alerted when restocked 👇"

        return (
            f"🛍️ *{name}*\n"
            f"{description}\n\n"
            f"💰 Price: GHS {price}\n"
            f"{status_line}\n\n"
            f"{cta}"
        )

    async def post_product(self, product: dict, group_ids: list[str]):
        """Post product to specified groups with availability-aware caption"""
        caption = self.format_post_caption(product)

        for group_id in group_ids:
            if product.get("images"):
                await self.app.bot.send_photo(
                    chat_id=group_id,
                    photo=product["images"][0],
                    caption=caption,
                    parse_mode="Markdown"
                )
            else:
                await self.app.bot.send_message(
                    chat_id=group_id,
                    text=caption,
                    parse_mode="Markdown"
                )

    async def send_order_update(self, customer_chat_id: str, message: str):
        """Send status update to customer"""
        await self.app.bot.send_message(chat_id=customer_chat_id, text=message)

    async def start(self):
        await self.app.initialize()
        await self.app.start()
        await self.app.updater.start_polling()
```

## 5.4 Order Parser (bot/automation/parser.py)

```python
from dataclasses import dataclass, field
from typing import Optional
import re
import httpx
from core.config import settings

@dataclass
class ParsedItem:
    product_name: str
    quantity: int
    matched_product_id: Optional[str] = None
    unit_price: Optional[float] = None
    stock_status: str = "AVAILABLE"         # AVAILABLE, PRE_ORDER, OUT_OF_STOCK
    estimated_arrival: Optional[str] = None # Only set for PRE_ORDER

@dataclass
class ParsedOrder:
    customer_name: str
    customer_phone: str
    items: list[ParsedItem] = field(default_factory=list)
    rejected_items: list[str] = field(default_factory=list)  # OUT_OF_STOCK items
    notify_requests: list[str] = field(default_factory=list) # customer wants restock alert
    is_valid: bool = False

class OrderParser:
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.products_cache = {}

    async def get_tenant_products(self):
        """Fetch tenant products from Next.js API"""
        if not self.products_cache:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{settings.nextjs_api_url}/api/products",
                    headers={"x-bot-secret": settings.nextjs_api_secret,
                             "x-tenant-id": self.tenant_id}
                )
                self.products_cache = {
                    p["name"].lower(): p for p in resp.json()
                }
        return self.products_cache

    async def parse(
        self,
        message: str,
        customer_name: str,
        customer_phone: str
    ) -> Optional[ParsedOrder]:
        """Extract order from message"""

        # Basic check: does message contain ordering intent?
        order_keywords = ["i want", "i need", "order", "please", "send me", "give me"]
        if not any(kw in message.lower() for kw in order_keywords):
            return None

        order = ParsedOrder(
            customer_name=customer_name,
            customer_phone=customer_phone
        )

        products = await self.get_tenant_products()

        # Extract quantity + product name patterns
        # e.g. "2 bags", "3x shoes", "one bag"
        patterns = [
            r"(\d+)\s*x?\s+([a-zA-Z\s]+)",
            r"(\w+)\s+(?:of\s+)?(?:the\s+)?([a-zA-Z\s]+)",
        ]

        # Check for restock notification request
        if "notify" in message.lower():
            order.notify_requests.append(customer_phone)

        for pattern in patterns:
            matches = re.findall(pattern, message.lower())
            for match in matches:
                qty_str, product_name = match
                qty = self._parse_quantity(str(qty_str))
                product_name = product_name.strip()

                matched = self._match_product(product_name, products)
                if not matched:
                    continue

                stock_status = matched.get("stockStatus", "AVAILABLE")

                if stock_status == "OUT_OF_STOCK":
                    # Reject item, record for notify list
                    order.rejected_items.append(matched["name"])
                else:
                    order.items.append(ParsedItem(
                        product_name=matched["name"],
                        quantity=qty,
                        matched_product_id=matched["id"],
                        unit_price=float(matched["price"]),
                        stock_status=stock_status,
                        estimated_arrival=matched.get("estimatedArrival")
                    ))

        order.is_valid = len(order.items) > 0
        return order  # Return even if only rejected items (to send OOS reply)

    def build_rejection_reply(self, order: "ParsedOrder") -> str:
        """Reply when some or all items are out of stock"""
        lines = []
        if order.rejected_items:
            items_text = ", ".join(order.rejected_items)
            lines.append(
                f"❌ Sorry, the following item(s) are currently out of stock:\n"
                f"{items_text}\n\n"
                f"Reply *NOTIFY* and we'll message you when they're back. ✅"
            )
        return "\n".join(lines)

    def _parse_quantity(self, qty_str: str) -> int:
        word_map = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5}
        return word_map.get(qty_str.lower(), int(qty_str) if qty_str.isdigit() else 1)

    def _match_product(self, name: str, products: dict) -> Optional[dict]:
        """Fuzzy match product name"""
        # Exact match
        if name in products:
            return products[name]

        # Partial match
        for product_name, product in products.items():
            if name in product_name or product_name in name:
                return product

        return None
```

## 5.5 Workflow (bot/automation/workflows.py)

```python
import httpx
from core.config import settings
from tasks.celery import celery_app

class OrderWorkflow:
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id

    async def create_order(self, parsed_order, source: str) -> dict:
        """Create order in database via Next.js API"""
        items = [
            {
                "product_id": item.matched_product_id,
                "name": item.product_name,
                "qty": item.quantity,
                "unit_price": item.unit_price,
                "total": item.quantity * item.unit_price
            }
            for item in parsed_order.items
        ]

        total_price = sum(i["total"] for i in items)

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{settings.nextjs_api_url}/api/orders",
                json={
                    "customerName": parsed_order.customer_name,
                    "customerPhone": parsed_order.customer_phone,
                    "items": items,
                    "totalPrice": total_price,
                    "source": source,
                },
                headers={
                    "x-bot-secret": settings.nextjs_api_secret,
                    "x-tenant-id": self.tenant_id
                }
            )

        return resp.json()

    async def notify_preorder_arrival(self, product_id: str):
        """
        Called when vendor marks a PRE_ORDER product as AVAILABLE.
        Notifies all customers with pending pre-orders for that product.
        """
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{settings.nextjs_api_url}/api/orders",
                params={"productId": product_id, "status": "CONFIRMED"},
                headers={
                    "x-bot-secret": settings.nextjs_api_secret,
                    "x-tenant-id": self.tenant_id
                }
            )
            pending_orders = resp.json()

        for order in pending_orders:
            message = (
                f"📦 Great news! Your pre-ordered item has arrived.\n\n"
                f"Order #{order['id'][:8]}\n"
                f"Please arrange pickup or contact us for delivery. 🎉"
            )
            send_message_task.delay(
                tenant_id=self.tenant_id,
                platform=order["source"].lower(),
                customer_contact=order["customerPhone"],
                message=message
            )

    async def notify_restock_waitlist(self, product_id: str, product_name: str):
        """
        Called when vendor marks an OUT_OF_STOCK product as AVAILABLE.
        Notifies customers who requested restock notification.
        """
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{settings.nextjs_api_url}/api/restock-notify",
                params={"productId": product_id},
                headers={
                    "x-bot-secret": settings.nextjs_api_secret,
                    "x-tenant-id": self.tenant_id
                }
            )
            waitlist = resp.json()

        for entry in waitlist:
            message = (
                f"✅ Good news! *{product_name}* is back in stock.\n\n"
                f"Reply to place your order now ⬇️"
            )
            send_message_task.delay(
                tenant_id=self.tenant_id,
                platform=entry["platform"],
                customer_contact=entry["customerPhone"],
                message=message
            )

    async def send_status_update(self, order_id: str, status: str, platform: str):
        """Push status update to customer on platform"""
        status_messages = {
            "CONFIRMED": "✅ Your order has been confirmed!",
            "PROCESSING": "⚙️ Your order is being prepared.",
            "SHIPPED": "🚚 Your order has shipped!",
            "ARRIVED": "📦 Your order has arrived! Please arrange pickup.",
            "COMPLETED": "🎉 Order complete! Thank you for your business.",
            "CANCELLED": "❌ Your order has been cancelled.",
        }

        message = status_messages.get(status, f"Order update: {status}")

        # Dispatch celery task
        send_message_task.delay(
            tenant_id=self.tenant_id,
            platform=platform,
            order_id=order_id,
            message=message
        )

@celery_app.task
def send_message_task(tenant_id: str, platform: str, order_id: str, message: str):
    """Celery task: send message to customer"""
    # Fetch order from DB, get customer contact, send via correct bot
    pass
```

## 5.6 Scheduler (bot/automation/scheduler.py)

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import httpx
from core.config import settings

scheduler = AsyncIOScheduler()

async def start_scheduler():
    """Load all active scheduled posts from DB and register"""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{settings.nextjs_api_url}/api/scheduled-posts/all",
            headers={"x-bot-secret": settings.nextjs_api_secret}
        )
        scheduled_posts = resp.json()

    for post in scheduled_posts:
        register_scheduled_post(post)

    # Register system jobs
    scheduler.add_job(
        generate_daily_reports,
        CronTrigger(hour=23, minute=0),
        id="daily_reports"
    )

    scheduler.start()

def register_scheduled_post(post: dict):
    """Register a tenant's scheduled post"""
    scheduler.add_job(
        execute_scheduled_post,
        CronTrigger.from_crontab(post["scheduleCron"]),
        args=[post["tenantId"], post["productId"], post["targetGroups"], post["platforms"]],
        id=f"post_{post['id']}",
        replace_existing=True
    )

async def execute_scheduled_post(
    tenant_id: str,
    product_id: str,
    target_groups: list,
    platforms: list
):
    """Fetch product and post to all target groups"""
    async with httpx.AsyncClient() as client:
        product_resp = await client.get(
            f"{settings.nextjs_api_url}/api/products/{product_id}",
            headers={
                "x-bot-secret": settings.nextjs_api_secret,
                "x-tenant-id": tenant_id
            }
        )
        product = product_resp.json()

    # Post to each platform
    from bots.telegram import bot_manager
    for platform in platforms:
        if platform == "telegram":
            bot = bot_manager.get_bot(tenant_id)
            if bot:
                groups = [g for g in target_groups if g["platform"] == "telegram"]
                await bot.post_product(product, [g["id"] for g in groups])

async def generate_daily_reports():
    """Send daily summary to all active merchants"""
    async with httpx.AsyncClient() as client:
        tenants_resp = await client.get(
            f"{settings.nextjs_api_url}/api/tenants/active",
            headers={"x-bot-secret": settings.nextjs_api_secret}
        )
        tenants = tenants_resp.json()

    for tenant in tenants:
        generate_tenant_report.delay(tenant["id"])

from tasks.celery import celery_app

@celery_app.task
def generate_tenant_report(tenant_id: str):
    """Generate and send report for one tenant"""
    pass
```

## 5.7 Celery (bot/tasks/celery.py)

```python
from celery import Celery
from core.config import settings

celery_app = Celery(
    "merchander_bot",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["automation.workflows", "automation.scheduler"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Africa/Accra",
    enable_utc=True,
    task_routes={
        "automation.workflows.send_message_task": {"queue": "messages"},
        "automation.scheduler.generate_tenant_report": {"queue": "reports"},
    }
)
```

---

# PART 6: DASHBOARD (NEXT.JS)

## 6.1 Dashboard Layout

```typescript
// app/(dashboard)/layout.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold">Merchander</h2>
          <p className="text-sm text-gray-400">{session.user.tenantName}</p>
          <span className="text-xs bg-blue-600 px-2 py-1 rounded mt-1 inline-block">
            {session.user.tenantPlan}
          </span>
        </div>

        <nav className="p-4 flex-1 space-y-1">
          {[
            { href: "/dashboard", label: "📊 Overview" },
            { href: "/dashboard/products", label: "📦 Products" },
            { href: "/dashboard/orders", label: "📋 Orders" },
            { href: "/dashboard/analytics", label: "📈 Analytics" },
            { href: "/dashboard/stores", label: "🏪 Stores" },
            { href: "/dashboard/bots", label: "🤖 Bots" },
            { href: "/dashboard/settings", label: "⚙️ Settings" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded hover:bg-gray-700 text-sm"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
```

## 6.2 Dashboard Overview

```typescript
// app/(dashboard)/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function DashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: async () => {
      const { data } = await axios.get("/api/analytics/overview");
      return data;
    },
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Overview</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Revenue", value: `GHS ${stats?.totalRevenue || 0}`, color: "bg-green-50 text-green-800" },
          { label: "Total Orders", value: stats?.totalOrders || 0, color: "bg-blue-50 text-blue-800" },
          { label: "This Month", value: stats?.monthOrders || 0, color: "bg-purple-50 text-purple-800" },
          { label: "Products", value: stats?.products || 0, color: "bg-orange-50 text-orange-800" },
        ].map((kpi) => (
          <div key={kpi.label} className={`p-6 rounded-lg ${kpi.color}`}>
            <p className="text-sm font-medium opacity-70">{kpi.label}</p>
            <p className="text-3xl font-bold mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
        <h2 className="text-lg font-semibold mb-4">Revenue Trend</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={stats?.trend || []}>
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

---

# PART 7: ENVIRONMENT FILES

## Next.js (.env.local)

```
DATABASE_URL="postgresql://user:password@localhost:5432/merchander"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<openssl rand -base64 32>"
BOT_API_URL="http://localhost:8000"
BOT_API_SECRET="<generate random secret>"
```

## Python Bot (.env)

```
DATABASE_URL="postgresql://user:password@localhost:5432/merchander"
REDIS_URL="redis://localhost:6379"
ENCRYPTION_KEY="<generate 32-byte key>"
NEXTJS_API_URL="http://localhost:3000"
NEXTJS_API_SECRET="<same as BOT_API_SECRET above>"
```

---

# PART 8: RUNNING LOCALLY

```bash
# Terminal 1: Next.js
pnpm dev

# Terminal 2: Python FastAPI
cd bot && uvicorn main:app --reload --port 8000

# Terminal 3: Celery Worker
cd bot && celery -A tasks.celery worker --loglevel=info -Q messages,reports

# Terminal 4: Redis
redis-server

# Terminal 5: Prisma Studio (optional)
npx drizzle-kit studio
```
