---
name: spec-and-prd-engineering
description: >-
  Use this skill when turning product ideas into structured PRDs, breaking specs into actionable issues/tickets,
  establishing ubiquitous domain language, and aligning on technical contracts before coding.
---

# Specification & PRD Engineering Skill

This skill encodes the engineering discipline of structuring fuzzy feature requests into crisp technical contracts, domain definitions, and actionable atomic tickets (inspired by `/to-prd` and `/to-issues`).

---

## 1. The Specification Lifecycle

```
[Idea / Feature Request] ──► [PRD & Technical Spec] ──► [Domain Glossary] ──► [Atomic Linear/GitHub Tickets]
```

---

## 2. Product Requirements Document (PRD) Template

When defining a feature, generate a spec formatted as follows:

```markdown
# PRD: [Feature Name]

## 1. Problem Statement & User Value
- **Who**: (e.g. Ghana social commerce merchants with multiple branches)
- **Problem**: (e.g. Orders received in WhatsApp cannot be assigned to Kumasi branch vs Accra branch)
- **Value**: (e.g. Accurate branch inventory and decentralized fulfillment)

## 2. User Stories & Acceptance Criteria
- [ ] **US-1**: As a merchant, I can assign an incoming WhatsApp order to a specific branch.
  - *Acceptance Criteria*: Order record updates `store_id`, inventory decrements from branch stock, dashboard reflects branch tag.
- [ ] **US-2**: As a branch manager, I can view orders filtered only to my assigned branch.

## 3. Data Model Changes
- Add `store_id: UUID NULL REFERENCES stores(id)` to `orders` table.
- Index: `(tenant_id, store_id, created_at DESC)`.

## 4. API Endpoints & Contract
- `PATCH /v1/orders/{id}/assign-branch` (Body: `{ "store_id": "..." }`)

## 5. Security & Isolation Matrix
- Tenant A cannot assign an order to Tenant B's store.
```

---

## 3. Ticket Breakdown Recipe (`/to-issues`)

Every feature must be broken down into small, independently testable units:

1. **Ticket 1 (Database & Migrations)**: DDL changes, RLS policy updates, rollback migration script.
2. **Ticket 2 (Backend API & Schemas)**: Pydantic schemas, service layer logic, route handler with tenant session injection.
3. **Ticket 3 (Unit & Isolation Tests)**: Pytest unit tests, IDOR cross-tenant penetration test.
4. **Ticket 4 (Frontend UI & Integration)**: Next.js 15 Server/Client components, optimistic mutations, accessible modal dialogs, and toast alerts.
