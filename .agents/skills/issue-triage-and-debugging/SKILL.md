---
name: issue-triage-and-debugging
description: >-
  Use this skill when diagnosing bugs, investigating failed orders, debugging Celery task stalls,
  troubleshooting socket disconnections, or triaging issues.
---

# Issue Triage, Root-Cause Analysis & Debugging Skill

This skill encodes systematic debugging workflows to isolate and resolve software bugs without guessing.

---

## 1. The 4-Step Diagnosis Protocol

```
[1. Reproduce with Exact Payload] ──► [2. Isolate Component] ──► [3. Write Failing Test] ──► [4. Apply Minimal Fix]
```

1. **Step 1: Capture Raw Inbound Payload**:
   - Inspect `workflow_logs` for the raw webhook/message JSON that triggered the error.
2. **Step 2: Isolate the Failure Layer**:
   - Is it auth token failure (401)?
   - Is it PostgreSQL RLS session mismatch (empty result)?
   - Is it regex parser mismatch (unrecognized phrasing)?
   - Is it Celery timeout / queue backlog?
3. **Step 3: Write Regression Test First (TDD)**:
   - Add the failing payload as a new test case in `tests/test_order_parser.py` or `tests/test_tenant_isolation.py`.
4. **Step 4: Patch & Verify**:
   - Fix the bug and ensure the regression test and all existing test suites pass.

---

## 2. Common Debugging Checkpoints in Merchander

### A. Missing Rows in Query Output (PostgreSQL RLS)
- **Symptom**: `SELECT * FROM products` returns 0 rows even though records exist in the database.
- **Cause**: Transaction did not execute `SET LOCAL app.current_tenant_id = :tenant_id` or session tenant ID doesn't match product `tenant_id`.
- **Diagnostic Command**:
  ```sql
  SHOW app.current_tenant_id;
  ```

### B. Inbound WhatsApp Message Not Creating Order
- **Symptom**: Customer texts in WhatsApp group, but no order appears in dashboard.
- **Troubleshooting Checklist**:
  1. Check if group JID is in `bot_configs.whatsapp_monitored_groups`.
  2. Check if product name in message matches any active product title or tag.
  3. Verify message is not from the bot's own JID (infinite loop filter).
