import json
import logging
import re
from typing import Optional, List, Dict, Any
import httpx

from app.config import settings
from app.schemas import NormalizedMessage, ExtractedCart, ExtractedItem
from app.services.catalog import TenantCatalogContext

logger = logging.getLogger(__name__)


def build_catalog_grounding_text(catalog: TenantCatalogContext) -> str:
    """Build a concise, formatted text block summarizing the tenant's catalog and pre-orders."""
    lines = []
    lines.append("TENANT CATALOG PRODUCTS & VARIANTS:")
    if not catalog.products:
        lines.append("  (No products registered)")
    else:
        for p in catalog.products:
            lines.append(f"- Product: {p.name} (Availability: {p.availability_status})")
            for v in p.variants:
                lines.append(f"    * SKU: {v.sku} | Name: {v.name} | Price: {v.price:.2f}")

    if catalog.pre_orders:
        lines.append("\nOPEN PRE-ORDER BATCHES:")
        for b in catalog.pre_orders:
            lines.append(f"- Batch: {b.name} (Code: {b.code}, Status: {b.status}, ETA: {b.expected_arrival_start} to {b.expected_arrival_end})")

    return "\n".join(lines)


def heuristic_extract(message: NormalizedMessage, catalog: TenantCatalogContext) -> ExtractedCart:
    """
    Deterministic rule-based extractor for offline development, tests, or fallback.
    Matches exact SKUs and product names against the tenant's catalog.
    """
    text = message.text.lower()
    items: List[ExtractedItem] = []
    matched_skus = set()

    # Determine basic intent (action intents take precedence over greetings)
    intent = "unknown"
    if any(w in text for w in ["order", "buy", "want", "take", "need", "get", "send me", "give me"]):
        intent = "create_order"
    elif any(w in text for w in ["in stock", "available", "have", "left", "remaining"]):
        intent = "check_stock"
    elif any(w in text for w in ["how much", "price", "cost", "rate"]):
        intent = "inquire_product"
    elif any(w in text for w in ["where is my", "tracking", "status of order", "my order"]):
        intent = "check_order"
    elif any(w in text for w in ["hi", "hello", "hey", "good morning", "good afternoon"]):
        intent = "greeting"

    # Search for known SKUs in text
    sku_map = catalog.sku_map
    for sku_upper, variant in sku_map.items():
        sku_clean = sku_upper.lower()
        if sku_clean in text:
            qty = 1
            # Look for number near SKU
            qty_match = re.search(rf"(\d+)\s*(?:pieces?|pcs?|x)?\s*(?:of\s*)?{re.escape(sku_clean)}", text)
            if not qty_match:
                qty_match = re.search(rf"{re.escape(sku_clean)}\s*(?:x\s*)?(\d+)", text)
            if qty_match:
                qty = max(1, int(qty_match.group(1)))

            items.append(ExtractedItem(sku=variant.sku, quantity=qty))
            matched_skus.add(variant.sku)

    # Search for product/variant names if no SKU explicitly matched
    if not items:
        for p in catalog.products:
            p_name_clean = p.name.lower()
            if p_name_clean in text and p.variants:
                # Find matching variant or default to first
                target_variant = p.variants[0]
                for v in p.variants:
                    if v.name.lower() in text:
                        target_variant = v
                        break

                qty = 1
                qty_match = re.search(rf"(\d+)\s*(?:pieces?|pcs?|x)?\s*(?:of\s*)?{re.escape(p_name_clean)}", text)
                if qty_match:
                    qty = max(1, int(qty_match.group(1)))

                if target_variant.sku not in matched_skus:
                    items.append(ExtractedItem(sku=target_variant.sku, quantity=qty))
                    matched_skus.add(target_variant.sku)

    confidence = 0.0
    notes = None
    if items:
        if intent in ("greeting", "unknown"):
            intent = "create_order"
        confidence = 0.90 if any(v.sku.lower() in text for v in catalog.all_variants) else 0.75
        notes = f"Extracted {len(items)} grounded item(s) via catalog match."
    else:
        if intent != "greeting" and intent != "unknown":
            notes = "Inquiry noted, but no catalog SKUs matched the user request."

    return ExtractedCart(
        items=items,
        confidence=confidence,
        intent=intent,
        notes=notes,
    )


async def call_gemini_llm(
    prompt: str,
    api_key: str,
    model: str = "gemini-2.5-flash",
    client: Optional[httpx.AsyncClient] = None,
) -> Optional[Dict[str, Any]]:
    """Call Google Gemini API with JSON response mime type."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.1,
        },
    }

    own_client = False
    if client is None:
        client = httpx.AsyncClient(timeout=15.0)
        own_client = True

    try:
        res = await client.post(url, json=payload)
        if res.status_code == 200:
            data = res.json()
            candidates = data.get("candidates", [])
            if candidates:
                content_text = candidates[0]["content"]["parts"][0]["text"]
                return json.loads(content_text)
        else:
            logger.warning(f"Gemini API returned status {res.status_code}: {res.text}")
    except Exception as e:
        logger.exception(f"Error calling Gemini API: {e}")
    finally:
        if own_client:
            await client.aclose()
    return None


async def extract_intent_and_cart(
    message: NormalizedMessage,
    catalog: TenantCatalogContext,
    client: Optional[httpx.AsyncClient] = None,
) -> ExtractedCart:
    """
    Extract cart items and intent from a customer message, grounded in tenant catalog data.
    Uses LLM when configured, otherwise falls back to deterministic rule matching.
    """
    # 1. Fallback to heuristic if no LLM API key configured or offline
    if not settings.has_llm_key or settings.ENVIRONMENT == "test":
        return heuristic_extract(message, catalog)

    catalog_context = build_catalog_grounding_text(catalog)
    prompt = f"""
You are the Merchander Intelligence Brain for a Ghanaian social-commerce merchant.
Analyze the following customer message received over {message.platform}.

{catalog_context}

CUSTOMER MESSAGE:
"{message.text}"

TASK:
1. Determine the customer's intent:
   - "create_order" (wants to buy/order/purchase specific items)
   - "inquire_product" (asking about product specs, pricing, details)
   - "check_stock" (asking if in stock / available)
   - "check_order" (asking about order status, delivery, tracking)
   - "greeting" (casual greeting / opening conversation)
   - "human_agent" (explicitly asking to speak to a human store rep)
   - "unknown" (other)

2. If the customer wants to purchase or reserve items, identify the items from the catalog.
   CRITICAL GROUNDING RULES:
   - ONLY extract items that match an existing SKU in the catalog above.
   - If an item is NOT in the catalog, DO NOT fabricate or invent a SKU. Return empty items and state in notes that product was not found.
   - Extract the quantity requested (default 1).

Respond ONLY with valid JSON conforming to this schema:
{{
  "intent": "<intent_string>",
  "confidence": <float 0.0 to 1.0>,
  "notes": "<short explanation or observation>",
  "items": [
    {{
      "sku": "<EXACT_SKU_FROM_CATALOG>",
      "quantity": <integer>
    }}
  ]
}}
"""

    llm_result = None
    if settings.GEMINI_API_KEY:
        llm_result = await call_gemini_llm(prompt, settings.GEMINI_API_KEY, settings.LLM_MODEL, client=client)

    if llm_result and isinstance(llm_result, dict):
        raw_items = llm_result.get("items", [])
        verified_items: List[ExtractedItem] = []
        sku_map = catalog.sku_map

        # Grounding check: enforce that every returned SKU exists in tenant catalog
        for it in raw_items:
            sku = it.get("sku", "").upper()
            qty = max(1, int(it.get("quantity", 1)))
            if sku in sku_map:
                verified_items.append(ExtractedItem(sku=sku_map[sku].sku, quantity=qty))

        return ExtractedCart(
            items=verified_items,
            confidence=float(llm_result.get("confidence", 0.8)),
            intent=llm_result.get("intent", "unknown"),
            notes=llm_result.get("notes"),
        )

    # If LLM failed or returned invalid response, use heuristic fallback
    return heuristic_extract(message, catalog)
