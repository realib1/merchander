---
name: security-and-isolation
description: >-
  Use this skill when implementing authentication, authorization, cryptography, input validation,
  data isolation, API rate limiting, webhook verification, and OWASP security safeguards.
---

# Security, Multi-Tenant Isolation & OWASP Hardening Guide

This skill provides comprehensive defensive engineering protocols, cryptographic patterns, and vulnerability mitigation guidelines for the Merchander SaaS platform.

---

## 1. Zero-Trust Multi-Tenancy & IDOR Prevention

### 1.1 Insecure Direct Object Reference (IDOR) Mitigation
Never query an entity by its primary key alone without scoping to `tenant_id`:
```python
# ❌ VULNERABLE TO IDOR:
async def get_order_unsafe(order_id: UUID, db: AsyncSession):
    stmt = select(Order).where(Order.id == order_id)
    return (await db.execute(stmt)).scalar_one_or_none()

# ✅ SECURE (Dual-Layer: Query Filter + Database RLS):
async def get_order_secure(order_id: UUID, tenant_id: UUID, db: AsyncSession):
    stmt = select(Order).where(
        Order.id == order_id,
        Order.tenant_id == tenant_id
    )
    return (await db.execute(stmt)).scalar_one_or_none()
```

### 1.2 Principle of Least Privilege in Database Roles
- PostgreSQL application users connecting to the database run under a non-superuser role (e.g. `merchander_app`).
- The `merchander_app` role has RLS strictly enforced on all tables (`NOBYPASSRLS`).

---

## 2. Authentication & Session Security

### 2.1 Password Hashing & Key Derivation
- Use **Argon2id** or **Bcrypt** with work factor ≥ 12. Never MD5 or SHA256.
```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
```

### 2.2 Secure JWT Handling & Expiry
- Access tokens have short TTLs (15–60 minutes).
- Refresh tokens are stored in `HttpOnly`, `SameSite=Strict`, `Secure` cookies.
- Cryptographically sign tokens with asymmetric keys (`RS256` / `Ed25519`) or high-entropy `HS256` secrets (>256 bits).

---

## 3. OWASP Top 10 Safeguards

### 3.1 SQL Injection Prevention
- ALWAYS use parameterized queries with SQLAlchemy 2.0 ORM or `text("...").bindparams(...)`.
- NEVER use f-strings or string concatenation to build SQL statements.

### 3.2 Cross-Site Scripting (XSS) & Content Security Policy (CSP)
- Next.js React JSX automatically escapes content. For raw text rendering or markdown:
  - Sanitize using `DOMPurify` / `sanitize-html`.
  - Configure strict HTTP headers in Next.js / FastAPI:
```python
# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
    return response
```

### 3.3 Server-Side Request Forgery (SSRF) Prevention
When fetching images or validating webhooks provided by merchants:
- Reject private IP ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.1`, `169.254.169.254`).
- Validate URLs against an allowed protocols whitelist (`https://`).

### 3.4 Rate Limiting & Abuse Prevention
Implement token-bucket rate limiting via Redis:
- Auth endpoints: Max 5 attempts per minute per IP.
- Public Webhook endpoints: Max 100 requests per minute per tenant.
- Standard authenticated API: Max 600 requests per minute per tenant.
