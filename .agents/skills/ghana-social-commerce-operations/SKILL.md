---
name: ghana-social-commerce-operations
description: >-
  Use this skill when handling Ghanaian payment methods (MTN MoMo, Telecel Cash, AT Money),
  local phone number parsing (+233 / 024 / 055 / 020), delivery logistics, and Cash-on-Delivery (COD) flows.
---

# Ghana Social Commerce & Payment Operations Guide

This skill provides domain-specific business rules, regex parsers, and logistics workflows tailored specifically for Ghanaian retail merchants.

---

## 1. Ghana Telecom & Mobile Money (MoMo) Network Matrix

| Network | Prefixes | Mobile Money Brand | USSD Shortcode |
| :--- | :--- | :--- | :--- |
| **MTN Ghana** | `024`, `054`, `055`, `059`, `053` | MTN MoMo | `*170#` |
| **Telecel (Vodafone)** | `020`, `050` | Telecel Cash | `*110#` |
| **AT (AirtelTigo)** | `027`, `057`, `026`, `056` | AT Money | `*110#` |

---

## 2. Phone Number Normalization Engine

Ghanaian phone numbers arrive in multiple user input formats. Always normalize to international E.164 (`+233...`) for database indexing and local display (`024 XXX XXXX`):

```python
import re
from typing import Optional

def normalize_ghana_phone(phone_input: str) -> Optional[str]:
    """
    Normalizes any Ghanaian phone format into standard E.164 (+233XXXXXXXXX).
    Supports: 0244123456, +233244123456, 233244123456, 024-412-3456, 024 412 3456
    """
    if not phone_input:
        return None
        
    cleaned = re.sub(r'[\s\-\(\)]', '', phone_input.strip())
    
    # Match +233 or 233 prefix
    if cleaned.startswith("+233"):
        cleaned = cleaned[4:]
    elif cleaned.startswith("233"):
        cleaned = cleaned[3:]
    elif cleaned.startswith("0"):
        cleaned = cleaned[1:]
        
    # Validate valid 9-digit Ghana subscriber number starting with valid network prefix
    if re.match(r'^[25][0-9]{8}$', cleaned):
        return f"+233{cleaned}"
        
    return None

def format_ghana_local_display(phone_e164: str) -> str:
    """Formats +233244123456 to '024 412 3456' for merchant UI."""
    if phone_e164.startswith("+233") and len(phone_e164) == 13:
        sub = phone_e164[4:]
        return f"0{sub[0:2]} {sub[2:5]} {sub[5:9]}"
    return phone_e164
```

---

## 3. MoMo SMS Reference Parser

When a customer sends their Mobile Money confirmation text in WhatsApp:
*"Payment made! Ref: 48928172901 for 2 pairs of shoes"*

```python
def extract_momo_reference(text: str) -> Optional[str]:
    # Matches common MoMo transaction ID patterns (typically 10-12 digits or alphanumeric ref)
    ref_match = re.search(r'(?:ref|reference|txid|trans id|id)[\s\:\-\#]*([A-Za-z0-9]{8,14})', text, re.IGNORECASE)
    if ref_match:
        return ref_match.group(1)
    # Check for standalone 10-11 digit sequence
    digit_match = re.search(r'\b\d{10,12}\b', text)
    return digit_match.group(0) if digit_match else None
```

---

## 4. Delivery & Waybill Logistics in Ghana

Common delivery hubs:
- **Greater Accra**: East Legon, Spintex, Osu, Madina, Dansoman, Tema, Circle, Lapaz, Kasoa, Adenta.
- **Ashanti (Kumasi)**: Adum, KNUST, Bantama, Kejetia, Ayeduase, Ahodwo.
- **Logistics Dispatch Slip**:
  ```
  ==========================================
             MERCHANDER DISPATCH SLIP
  Order: ORD-1082              Branch: Accra Central
  Customer: Kwame Mensah       Phone: 024 412 3456
  Location: East Legon (Near Shell Fuel Station)
  ------------------------------------------
  1x Nike Air Max 90 (Size 43)     GH₵ 450.00
  Delivery Fee:                    GH₵  30.00
  ------------------------------------------
  TOTAL:                           GH₵ 480.00
  Payment: PAID (MTN MoMo Ref: 48928172901)
  ==========================================
  ```
