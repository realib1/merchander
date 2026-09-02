# Merchander Superadmin — Product Requirements Document (PRD)

**Company:** SHERO  
**Product:** Merchander  
**Document Type:** Platform Control Plane PRD  
**Version:** 2.2  
**Status:** Approved Specification  

---

# 1. Overview & Core Philosophy

The **Superadmin** is the operational, governance, and infrastructure control layer of Merchander.

It is **not a second merchant dashboard**.

The Merchant Dashboard exists to help merchants run their commerce businesses. The Superadmin exists to help the Merchander team **run, govern, monitor, support, and protect the Merchander platform**.

### Core Principle

> **Merchants run their businesses. Superadmins run the platform.**

The Superadmin provides platform staff with deep operational visibility and infrastructure control without becoming an unrestricted account capable of casually inspecting or mutating merchant business data.

---

# 2. Objectives

The Superadmin system empowers authorized Merchander staff to:

1. **Govern Merchant Accounts**: Track tenant status (`trial`, `active`, `past_due`, `restricted`, `suspended`, `closed`), enforce platform terms, manage plan upgrades/downgrades.
2. **Manage Plans, Billing & Entitlements**: Configure commercial tiers (`Free`, `Starter`, `Growth`, `Business`, `Enterprise`), define seat/product/AI quotas, and manage subscription pricing in GHS & USD.
3. **Monitor Platform Revenue**: Track Merchander's own MRR, ARR, churn rate, plan distribution, and billing failures (isolated from merchant gross sales).
4. **Govern Payment & Channel Connectors**: Monitor connector health for Paystack, Hubtel, MTN MoMo, Telecel Cash, WhatsApp Cloud API, Instagram, and SMS gateways.
5. **Manage Domain & Edge Infrastructure**: Monitor DNS routing, automated SSL certificate issuance, and custom domain verification across African markets.
6. **Monitor Merchander Intelligence Telemetry**: Track multimodal AI token volume, inference latency, provider health, model safety incidents, and per-tenant cost attribution.
7. **Support Operations & Issue Investigation**: Provide ticket triage, escalation workflows, SLA tracking, and purpose-driven diagnostic context.
8. **Communicate Platform Announcements**: Dispatch targeted in-app system notices, scheduled maintenance banners, and policy updates.
9. **Enforce Security, Compliance & Auditability**: Review immutable audit logs, investigate authentication anomalies, revoke sessions, and manage internal staff RBAC.
10. **Ensure System Health**: Real-time observability over PostgreSQL connection pools, Celery/Redis queue workers, background jobs, and edge latencies.

### Golden Rule of Access

> **Having the technical ability to access data does not grant permission to access it.**

---

# 3. What Superadmin Is NOT

Superadmin is **not a global store management panel**.

The following core merchant commerce entities are **strictly prohibited** from primary platform navigation:
* ❌ Products & Variants
* ❌ Merchant Orders & Fulfillments
* ❌ Customer CRM records
* ❌ Physical Inventory & Stock adjustments
* ❌ Pre-order Batches
* ❌ Merchant Business Targets & Goals
* ❌ Storefront Theme/Content Customization

These belong exclusively to the **Merchant Dashboard**. Superadmin may inspect relevant diagnostic snapshots only inside an explicit, purpose-driven **Merchant Context**.

---

# 4. Platform Staff Roles & Responsibilities

Rather than a single unrestricted administrator ("God Mode"), the platform enforces **7 distinct internal roles**:

### 4.1 Platform Owner
* **Authority**: Highest platform authority.
* **Capabilities**: Full platform configuration, administrator onboarding, permission assignment, plan pricing overrides, emergency platform actions.
* **Boundaries**: Cannot casually tamper with merchant commercial records.

### 4.2 Platform Administrator
* **Authority**: General platform operations.
* **Capabilities**: Merchant account lifecycle management (suspension, reactivation), subscription management, domain configuration, operational settings.
* **Boundaries**: Critical security policy changes and credential resets require Owner approval.

### 4.3 Operations
* **Authority**: Day-to-day tenant monitoring and queue management.
* **Capabilities**: Merchant status review, background job monitoring, connector throughput tracking.
* **Boundaries**: No access to platform financial ledgers or security audit logs.

### 4.4 Support
* **Authority**: Merchant assistance and issue diagnosis.
* **Capabilities**: Support ticket triage, communication with merchants, purpose-driven diagnostic context access.
* **Boundaries**: Cannot modify financial records, view API secrets, change store ownership, or access merchant data without an active support ticket.

### 4.5 Finance
* **Authority**: Commercial and revenue operations.
* **Capabilities**: Platform MRR/ARR analytics, billing history, subscription invoices, payment provider settlement health, fee management.
* **Boundaries**: No access to technical infrastructure, domain routing, or merchant catalog data.

### 4.6 Technical Administrator
* **Authority**: Platform infrastructure and system health.
* **Capabilities**: Manage API connectors, investigate webhook failures, monitor DNS/SSL, tune Celery queues, inspect database latency.
* **Boundaries**: No access to merchant customer records or financial details.

### 4.7 Compliance / Security
* **Authority**: Security governance and incident investigation.
* **Capabilities**: Review immutable audit logs, inspect authentication events, manage MFA requirements, investigate unauthorized access attempts.
* **Boundaries**: Operational data access is strictly limited to active security incident scopes.

---

# 5. Primary Superadmin Navigation

```text
Superadmin
 ├── 1. Overview                 (Platform health, active tenants, MRR, operational alerts)
 ├── 2. Merchants                (Tenant registry, status, plans, filters, context inspector)
 ├── 3. Plans & Billing          (Tier configurations, pricing in GHS/USD, entitlement quotas)
 ├── 4. Platform Revenue         (MRR, ARR, subscription churn, failed billing, platform fees)
 ├── 5. Payments & Providers     (Paystack, Hubtel connector status, currency/country matrix)
 ├── 6. Integrations             (Meta WhatsApp Cloud API, Instagram, SMS gateway telemetry)
 ├── 7. Domains                  (Custom domain verification, DNS status, SSL cert lifecycles)
 ├── 8. Intelligence             (AI token throughput, provider latency, per-tenant cost attribution)
 ├── 9. Help & Support           (Ticket queue, SLA timers, internal notes, incident linking)
 ├── 10. Platform Communications (Targeted in-app broadcasts, scheduled maintenance banners)
 ├── 11. Security & Compliance   (Auth events, suspicious activity, staff role assignments)
 ├── 12. System Health           (DB ping, Redis queue depth, Celery worker status, error rates)
 ├── 13. Audit Logs              (Immutable tamper-resistant log of all staff actions & context views)
 └── 14. Settings                (Global platform configurations, staff management, feature flags)
```

---

# 6. Detailed Module Specifications

## 6.1 Overview
* **Platform KPIs**: Total Merchants, Active Merchants, Paying vs. Trial vs. Past Due, Platform MRR/ARR, Active Integrations, Open Support Tickets, System Status.
* **Operational Attention Center**: Highlights items requiring urgent action:
  * Payment connector latency spikes (>500ms).
  * Domain DNS verification failures.
  * AI token spikes or provider outages.
  * Overdue support tickets exceeding SLA targets.

## 6.2 Merchants
* **Directory Filters**: Filter by Country (Ghana, etc.), Status (`Trial`, `Active`, `Past Due`, `Restricted`, `Suspended`, `Closed`), Plan Tier, and Connected Channels.
* **Actions**: Suspend/Reactivate with mandatory reason, update plan tier, inspect diagnostic logs, initiate audited support session.

## 6.3 Merchant Context & Audited "View as Merchant"
* **Context Inspection**: Displays tenant metadata, domain status, connector logs, error events, and support ticket history.
* **Remote Support Session Workflow**:
  1. Staff specifies ticket ID and legitimate operational reason.
  2. Read-only view is enabled by default.
  3. Persistent top banner is displayed:
     ```text
     ⚠️ ADMIN ACCESS — Viewing ABC Fashion | Reason: Ticket #482 | Admin: support@merchander.app | [Exit]
     ```
  4. Entry, actions, and exit are immutably logged with precise timestamps and session duration.

## 6.4 Plans & Billing
* **Plan Tiers**: Free, Starter, Growth, Business, Enterprise.
* **Entitlement Dimensions**: Product catalog limits, monthly order quotas, AI intelligence query limits, staff seat caps, custom domain allowance.
* **Multi-Currency Pricing**: Native GHS and USD pricing with monthly/annual billing options.

## 6.5 Platform Revenue
* **Metrics**: Platform Gross Revenue, Subscription MRR/ARR, Churn Rate, Average Revenue Per Account (ARPU), Payment Failure Rates.
* **Boundary**: Strictly measures Merchander's subscription & platform income, completely separate from tenant gross merchandise value (GMV).

## 6.6 Payments & Providers
* **Connector Health**: Real-time status for Paystack, Hubtel, MTN MoMo, Telecel Cash, and AT Money.
* **Configurations**: Supported currencies (GHS, USD, NGN, KES), webhook endpoint validation, retry thresholds.
* **Prohibition**: Zero exposure of merchant secret keys or private access tokens.

## 6.7 Integrations
* **Channel Connectors**: Meta WhatsApp Cloud API, Instagram Graph API, Facebook Messenger, SMS gateways (Hubtel/Arkester).
* **Monitoring**: Webhook error rates, rate-limit consumption, delivery failure rates, and connector versions.

## 6.8 Domains
* **DNS & SSL Tracking**: Root domain routing (`merchander.app`, `app.merchander.app`), subdomains (`*.merchander.app`), and custom merchant domains.
* **Automated Probes**: DNS record verification (CNAME/A record validation), Let's Encrypt SSL certificate renewal status.

## 6.9 Intelligence (Platform AI Governance)
* **Telemetry**: Model provider status (Gemini, Claude, GPT), token usage volume, token costs per merchant/plan, P95 inference latency.
* **Safety & Guardrails**: Green/Yellow/Red action escalation logs, hallucination/safety violation flags.

## 6.10 Help & Support
* **Ticket Lifecycle**: `Open` $\rightarrow$ `In Progress` $\rightarrow$ `Waiting for Merchant` $\rightarrow$ `Escalated` $\rightarrow$ `Resolved` $\rightarrow$ `Closed`.
* **Features**: SLA countdown timers, internal staff collaboration notes, ticket assignment, merchant context deep links.

## 6.11 Platform Communications
* **Broadcast Types**: System Announcements, Maintenance Notices, Feature Launches, Security Alerts, Policy Updates.
* **Targeting**: All Merchants, Specific Plan Tiers, Specific Countries, or Specific Statuses.
* **Channels**: Persistent in-dashboard dismissible banners, global modals.

## 6.12 Security & Compliance
* **Access Governance**: Internal staff role assignment, MFA enforcement status, active session revocation.
* **Security Logs**: Failed login attempts, anomalous API query volumes, IP geolocation flags.

## 6.13 System Health
* **Telemetry**: PostgreSQL connection pool health, query latency, Redis queue depth, Celery background worker throughput, edge CDN response times.
* **Incident Management**: Publish, update, and resolve platform status incidents affecting tenant dashboards.

## 6.14 Audit Logs
* **Immutable Event Stream**: Every administrative action (suspension, plan change, context entry, config update) is permanently recorded with actor identity, action type, target entity, reason, IP address, and payload.

---

# 7. Role-Based Access Control (RBAC) Matrix

| Capability | Support | Operations | Finance | Technical | Platform Admin | Platform Owner |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **View Merchant Registry** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Inspect Merchant Diagnostic Context** | ✓ (With Reason) | ✓ | — | ✓ | ✓ | ✓ |
| **Suspend / Reactivate Merchant** | — | ✓ | — | — | ✓ | ✓ |
| **Modify Plan / Pricing Config** | — | — | — | — | ✓ | ✓ |
| **View Platform Revenue & MRR** | — | — | ✓ | — | ✓ | ✓ |
| **Manage Payment Connectors** | — | — | — | ✓ | ✓ | ✓ |
| **Manage Domain Infrastructure** | — | — | — | ✓ | ✓ | ✓ |
| **Monitor AI Telemetry & Quotas** | — | ✓ | — | ✓ | ✓ | ✓ |
| **Manage Support Tickets** | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| **Broadcast Platform Notices** | — | ✓ | — | — | ✓ | ✓ |
| **Manage Staff Roles & RBAC** | — | — | — | — | — | ✓ |
| **View Full Platform Audit Logs** | Limited | Limited | Limited | Limited | ✓ | ✓ |
| **Publish System Incidents** | — | ✓ | — | ✓ | ✓ | ✓ |

---

# 8. Data Models Supporting Superadmin

```text
Database Schema (Platform Control Plane)
 ├── platform_staff_users       (Staff user ID, role, MFA status, is_active)
 ├── platform_audit_logs        (Actor ID, role, action, target_type, target_id, reason, metadata, ip)
 ├── platform_plans             (Plan ID, slug, name, price_ghs, price_usd, cycle, entitlements JSONB)
 ├── platform_announcements     (Title, message, type, target_tier, starts_at, expires_at, is_active)
 ├── platform_incidents         (Service, status, title, message, affected_areas, is_active)
 └── platform_support_tickets   (Tenant ID, reporter, subject, status, priority, assigned_to, metadata)
```

---

# 9. Non-Negotiable Prohibitions (Zero Casual Access)

* ❌ **No Plaintext Secrets**: Superadmin shall never display or decrypt merchant payment secret keys, webhook signing keys, or OAuth client secrets.
* ❌ **No Casual Mutation**: Admins cannot create, modify, or delete merchant products, orders, customers, inventory, or prices.
* ❌ **No Invisible Impersonation**: Secret or unlogged merchant logins are technically forbidden; all context views require a stated purpose and banner.
* ❌ **No Direct Fund Holding**: Merchander connects to external payment rails but does not custody merchant funds.

---

# 10. Success Criteria

1. **Zero Unauthorized Data Exposure**: Merchant commercial data is protected behind purpose-limited, auditable workflows.
2. **Sub-Second Operational Diagnostics**: Platform staff can pinpoint connector errors, DNS misconfigurations, or webhook failures within seconds.
3. **100% Audit Coverage**: Every administrative action is permanently recorded in tamper-resistant audit logs.
4. **Scalable Multi-Market Architecture**: Domain, payment, and channel management seamlessly supports expansion across Ghana and future African regions without core code changes.
