import { HelpArticle } from '@/types/support';

export const HELP_ARTICLES: HelpArticle[] = [
  {
    id: 'art-preorders',
    slug: 'how-to-create-preorder-batches',
    title: 'How do I create and manage a pre-order batch?',
    category: 'orders',
    summary: 'Step-by-step guide to setting open/close dates, freight mode (Air/Sea), and live arrival countdowns.',
    content: `
### Overview
Merchander batches allow merchants to collect customer orders during a defined booking window, close procurement, order bulk inventory from suppliers, and dispatch goods upon local arrival.

### Steps to create a batch:
1. Navigate to **Inventory → Pre-order Batches** in your dashboard.
2. Click **New Batch** and enter your Batch Name (e.g. "Batch Sep Wave 1").
3. Set your **Opens At** and **Closes At** cut-off dates.
4. Choose your **Freight Mode**:
   - **Air Cargo**: Fast transit (10–14 days delivery window).
   - **Sea Freight**: Economical bulk shipping (45–60 days delivery window).
5. Specify the **Expected Arrival Window** (e.g., Nov 15 – Nov 22).
6. Click **Create Batch** and link applicable products under the Product Edit screen.

When your storefront visitors view these products, they will automatically see live closing countdowns and arrival timelines on the store announcement banner.
    `.trim(),
    tags: ['preorder', 'batches', 'cargo', 'shipping', 'supplier'],
  },
  {
    id: 'art-whatsapp',
    slug: 'connecting-whatsapp-cloud-api',
    title: 'Why isn’t my WhatsApp connection working or receiving messages?',
    category: 'channels',
    summary:
      'Troubleshoot WhatsApp Business Cloud API webhook verification, token expiration, and phone number registration.',
    content: `
### Troubleshooting WhatsApp Integration
If your store stops receiving customer inquiries or automated cart alerts on WhatsApp:

1. **Verify Webhook Callback URL**:
   - Check that your Meta Developer App has \`https://yourdomain.com/api/webhooks/whatsapp\` registered under WhatsApp Webhook configuration.
2. **Verify Token Status**:
   - Go to **Settings → Channels → WhatsApp** and confirm your Permanent System User Token is active.
3. **Verify Phone Number Quality Rating**:
   - Ensure your WhatsApp Business phone number is not rate-limited or temporarily suspended by Meta.
4. **Anti-Ban Settings**:
   - Ensure human-like typing delays (3–5 seconds) are enabled in Merchander Settings to prevent spam filtering.
    `.trim(),
    tags: ['whatsapp', 'meta', 'api', 'webhooks', 'channels'],
  },
  {
    id: 'art-momo',
    slug: 'momo-sms-reconciliation',
    title: 'How do I verify and reconcile Mobile Money payments via SMS?',
    category: 'payments',
    summary: 'Use the instant SMS parser for MTN MoMo, Telecel Cash, and AT Money to settle unpaid orders.',
    content: `
### Instant SMS Reconciliation
When a customer pays directly to your merchant MoMo wallet:

1. Go to **Payments → MoMo Reconciliation** or open any pending order in **Orders**.
2. Copy the official transaction SMS received from MTN, Telecel, or AT Money.
3. Paste the entire SMS into the parser box.
4. Merchander automatically extracts:
   - **Transaction ID**
   - **Amount Paid (GHS)**
   - **Sender Name & Phone Number**
5. Click **Match & Confirm Order** to settle the order and generate an official receipt.
    `.trim(),
    tags: ['momo', 'mtn', 'telecel', 'reconciliation', 'sms', 'payments'],
  },
  {
    id: 'art-domain',
    slug: 'custom-domain-setup',
    title: 'How do I connect my custom domain (e.g. shop.mybrand.com)?',
    category: 'domain',
    summary: 'Configure CNAME DNS host records at your registrar to point to your Merchander storefront.',
    content: `
### Connecting Custom Domains
To use your own branded web address instead of the default subdomain:

1. Open **Settings → Storefront & Domain**.
2. Enter your custom domain (e.g., \`shop.mybrand.com\` or \`mybrand.com\`).
3. Log in to your DNS registrar (Namecheap, GoDaddy, Cloudflare, etc.).
4. Add a **CNAME Record**:
   - **Host / Name**: \`shop\` (or \`@\` for apex)
   - **Value / Target**: \`cname.merchander.com\`
   - **TTL**: Auto / 3600
5. Click **Verify DNS** in your Merchander dashboard. SSL certificates are provisioned automatically within 10 minutes.
    `.trim(),
    tags: ['domain', 'cname', 'dns', 'storefront', 'ssl'],
  },
  {
    id: 'art-goals',
    slug: 'intelligence-goals-pace-engine',
    title: 'How do I set revenue goals and track daily sales pace?',
    category: 'intelligence',
    summary:
      'Set measurable monthly targets and let Merchander Intelligence project outcomes and alert you when falling behind.',
    content: `
### Setting Business Goals
1. Navigate to **Insights & Goals** in your dashboard.
2. Click **New Target**.
3. Select your metric area:
   - Total Revenue (GH₵)
   - Completed Orders
   - New Customer Acquisition
   - Product Sales Units
   - Pre-order Batch Capacity
4. Choose your period (This Month, This Week, or Custom Date Range).
5. Enter your goal amount and save.

Merchander continuously computes your **actual daily pace vs required daily pace**, calculates remaining numbers, and alerts you if a target becomes **At Risk**.
    `.trim(),
    tags: ['goals', 'targets', 'intelligence', 'pace', 'revenue', 'analytics'],
  },
  {
    id: 'art-landed-cost',
    slug: 'tema-port-freight-cost',
    title: 'How do I calculate Tema Port landed costs for imported stock?',
    category: 'billing',
    summary: 'Allocate sea freight CBM, customs duties, and clearing fees into per-unit product cost price.',
    content: `
### Accurate Landed Cost
1. Go to **Shipments → New Cargo Shipment**.
2. Enter total freight costs, clearing agent fees, and port duties in GHS.
3. Add the manifest items with their respective quantities and CBM volumes.
4. Merchander automatically calculates the true **Allocated Landed Cost per Unit**, allowing you to protect profit margins and set accurate retail prices.
    `.trim(),
    tags: ['freight', 'cbm', 'landed-cost', 'shipments', 'tema-port', 'customs'],
  },
];
