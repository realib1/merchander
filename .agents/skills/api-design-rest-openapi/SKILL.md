---
name: api-design-rest-openapi
description: >-
  Use this skill when designing RESTful APIs, defining OpenAPI contracts, structuring response payloads,
  handling error envelopes, configuring pagination, or managing API versioning.
---

# RESTful API Design & OpenAPI Architecture Guide

This skill provides rules and best practices for creating predictable, self-documenting, and standardized REST APIs across the platform.

---

## 1. RESTful URL & Method Conventions

### 1.1 Resource-Oriented Naming
- Use plural nouns for resources: `/v1/products`, `/v1/orders`, `/v1/customers`.
- Use nested paths for sub-resources: `/v1/orders/{order_id}/items`.
- Use explicit verbs only for non-CRUD actions: `/v1/orders/{order_id}/confirm-momo-payment`.

### 1.2 HTTP Verbs & Status Code Matrix

| Action | Method | Path | Success Status | Error Status |
| :--- | :--- | :--- | :--- | :--- |
| **List** | `GET` | `/v1/products` | `200 OK` | `401 Unauthorized` |
| **Get by ID** | `GET` | `/v1/products/{id}`| `200 OK` | `404 Not Found` |
| **Create** | `POST` | `/v1/products` | `201 Created` | `422 Unprocessable Entity` |
| **Full Replace** | `PUT` | `/v1/products/{id}`| `200 OK` | `404 Not Found` |
| **Partial Update** | `PATCH` | `/v1/products/{id}`| `200 OK` | `404 Not Found` |
| **Delete** | `DELETE` | `/v1/products/{id}`| `204 No Content` | `404 Not Found` |

---

## 2. Standard Response & Error Envelopes

### 2.1 Cursor-Based Pagination Format
```json
{
  "items": [
    { "id": "019...", "name": "Nike Air Max", "price": "450.00" }
  ],
  "pagination": {
    "total_count": 142,
    "limit": 20,
    "next_cursor": "eyJjcmVhdGVkX2F0IjoiMjAyNi0wOC0xN1QxNTo..."
  }
}
```

### 2.2 Standard Error Response Envelope
```json
{
  "error": {
    "code": "ORDER_ALREADY_PAID",
    "message": "Order ORD-1092 has already been marked as PAID.",
    "status": 409,
    "timestamp": "2026-08-17T15:00:00Z"
  }
}
```
