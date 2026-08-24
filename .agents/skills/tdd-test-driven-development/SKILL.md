---
name: tdd-test-driven-development
description: >-
  Use this skill when developing new features, fixing bugs, or refactoring code using Test-Driven Development (TDD).
  Enforces the Red-Green-Refactor cycle and bulletproof test coverage.
---

# Test-Driven Development (TDD) Engineering Skill

Inspired by the engineering discipline from Matt Pocock and modern agile practices, this skill enforces a strict **Red-Green-Refactor** development cycle.

---

## 1. The Red-Green-Refactor Cycle

```
  ┌────────────────────────────────────────┐
  │ 1. RED: Write a failing test first     │
  └───────────────────┬────────────────────┘
                      │
                      ▼
  ┌────────────────────────────────────────┐
  │ 2. GREEN: Write minimum code to pass   │
  └───────────────────┬────────────────────┘
                      │
                      ▼
  ┌────────────────────────────────────────┐
  │ 3. REFACTOR: Clean up without breaking │
  └────────────────────────────────────────┘
```

### Phase 1: RED (Write the Test First)
- Never write implementation code before writing the test.
- The test must express the expected behavior and domain contract clearly.
- Run the test and confirm that it **fails for the expected reason** (not due to syntax or import errors).

### Phase 2: GREEN (Minimum Viable Implementation)
- Write the simplest, most direct code that makes the test pass.
- Resist the urge to over-engineer or add premature abstractions during the green phase.
- Run the test suite and verify `PASS`.

### Phase 3: REFACTOR (Elevate Code Quality)
- Clean up variable names, extract helper functions, eliminate duplication, and add type hints.
- Keep tests green at every step of refactoring.

---

## 2. Practical TDD Example (FastAPI + Pytest)

### Step 1: Write the Failing Test (`tests/test_discount_service.py`)
```python
import pytest
from decimal import Decimal
from apps.api.services.pricing import calculate_order_total

def test_calculate_order_total_with_percentage_discount():
    subtotal = Decimal("200.00")
    delivery_fee = Decimal("20.00")
    discount_percent = 10  # 10% off subtotal

    total = calculate_order_total(subtotal, delivery_fee, discount_percent)
    
    # Subtotal after 10% off is 180.00 + 20.00 delivery = 200.00
    assert total == Decimal("200.00")
```

### Step 2: Implement Minimum Solution (`apps/api/services/pricing.py`)
```python
from decimal import Decimal, ROUND_HALF_UP

def calculate_order_total(
    subtotal: Decimal,
    delivery_fee: Decimal = Decimal("0.00"),
    discount_percent: int = 0
) -> Decimal:
    discount_multiplier = Decimal(100 - discount_percent) / Decimal(100)
    discounted_subtotal = (subtotal * discount_multiplier).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return discounted_subtotal + delivery_fee
```

### Step 3: Run & Refactor
```bash
pytest tests/test_discount_service.py -v
```

---

## 3. Boundary & Edge Case Test Matrix
For every business feature, ensure tests cover:
- **Happy Path**: Standard input with expected output.
- **Zero / Empty States**: 0 items, empty strings, null values.
- **Negative / Out-of-Bounds Values**: Negative prices, discount percent > 100%.
- **Concurrent / Race Conditions**: Simultaneous requests trying to claim limited inventory.
- **Tenant Isolation**: Verifying Tenant A's token cannot read Tenant B's data under any condition.
