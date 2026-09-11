import json
import logging
import re
from typing import Optional, List, Dict, Any
import httpx

from app.config import settings
from app.schemas import (
    NormalizedMessage,
    CustomerOrderSummary,
    ReplyResponse,
    BusinessGroundingContext,
    AiAgentConfig,
)
from app.services.catalog import TenantCatalogContext
from app.services.extractor import call_gemini_llm

logger = logging.getLogger(__name__)


def build_qa_grounding_context(
    catalog: TenantCatalogContext,
    orders: List[CustomerOrderSummary],
    grounding: Optional[BusinessGroundingContext] = None,
) -> str:
    """Build formatted text block summarizing catalog, open pre-orders, customer orders, and merchant grounding."""
    lines = []
    lines.append("=== TENANT CATALOG PRODUCTS & VARIANTS ===")
    if not catalog.products:
        lines.append("  (No products registered)")
    else:
        for p in catalog.products:
            lines.append(f"- Product: {p.name} (Availability: {p.availability_status})")
            if p.description:
                lines.append(f"  Description: {p.description}")
            for v in p.variants:
                lines.append(
                    f"    * Variant: {v.name} | SKU: {v.sku} | Price: GH₵{v.price:.2f} | Stock: {v.quantity}"
                )

    if catalog.pre_orders:
        lines.append("\n=== OPEN PRE-ORDER BATCHES ===")
        for b in catalog.pre_orders:
            lines.append(
                f"- Batch: {b.name} (Code: {b.code}, Status: {b.status}, ETA: {b.expected_arrival_start} to {b.expected_arrival_end})"
            )

    lines.append("\n=== CUSTOMER ACTIVE ORDERS (UNDELIVERED) ===")
    if not orders:
        lines.append("  (No active undelivered orders found for this customer)")
    else:
        for o in orders:
            item_desc = ", ".join([f"{item.quantity}x {item.name} (@ GH₵{item.unit_price:.2f})" for item in o.items])
            lines.append(
                f"- Order {o.order_number}: Status='{o.status}', Total=GH₵{o.total_amount:.2f}, Items=[{item_desc}], "
                f"Delivery Address='{o.delivery_address or 'Not provided'}'"
            )

    if grounding:
        lines.append("\n=== MERCHANT BUSINESS PROFILE & POLICIES ===")
        if grounding.about_business:
            lines.append(f"- About the Business: {grounding.about_business}")
        if grounding.what_we_sell:
            lines.append(f"- What We Sell: {grounding.what_we_sell}")
        if grounding.delivery_info:
            lines.append(f"- Delivery Information: {grounding.delivery_info}")
        if grounding.return_policy:
            lines.append(f"- Return & Refund Policy: {grounding.return_policy}")
        if grounding.customer_policies:
            lines.append(f"- Customer Policies & Terms: {grounding.customer_policies}")

    return "\n".join(lines)


def heuristic_generate_reply(
    message: NormalizedMessage,
    catalog: TenantCatalogContext,
    orders: List[CustomerOrderSummary],
    grounding: Optional[BusinessGroundingContext] = None,
) -> ReplyResponse:
    """
    Deterministic rule-based reply generator for offline tests, local dev, or fallback.
    Guarantees zero hallucinations and adheres to safety boundaries.
    """
    text = message.text.lower().strip()
    grounded_facts: List[str] = []

    # 1. Check for human escalation requests
    if any(w in text for w in ["speak to human", "speak to agent", "talk to person", "human agent", "manager", "representative"]):
        return ReplyResponse(
            reply_text="Understood! I am notifying our store team right now. A representative will attend to you shortly.",
            intent="human_agent",
            confidence=0.95,
            grounded_facts=["Customer explicitly requested human assistance."],
            requires_human_approval=True,
            escalation_reason="Customer requested human agent",
        )

    # 2. Check for payment confirmation / MoMo claims
    is_payment_claim = (
        (
            any(w in text for w in ["payment", "momo", "paid"])
            and any(w in text for w in ["sent", "confirm", "done", "made", "transferred", "receipt", "screenshot", "check my payment"])
        )
        or any(w in text for w in ["i paid", "i have paid", "have paid", "already paid", "sent payment", "sent momo", "confirm payment"])
    )
    if is_payment_claim:
        order_ref = None
        if orders:
            order_ref = orders[0].order_number
        return ReplyResponse(
            reply_text=(
                f"Thank you for letting us know! We have received your payment notice"
                + (f" regarding order {order_ref}." if order_ref else ".")
                + " Please hold on briefly while our team verifies the payment transaction on our merchant account."
            ),
            intent="confirm_payment",
            confidence=0.90,
            grounded_facts=[f"Active order {order_ref} on file" if order_ref else "Payment notification noted"],
            requires_human_approval=True,
            escalation_reason="Payment confirmation requires merchant verification",
        )

    # 3. Check for order status / tracking inquiries
    if any(w in text for w in ["my order", "order status", "where is my", "tracking", "delivery update", "order dispatch", "track order"]):
        if orders:
            latest = orders[0]
            status_desc = latest.status.replace("_", " ")
            item_names = [it.name for it in latest.items]
            items_str = ", ".join(item_names) if item_names else "items"
            address_str = f" to {latest.delivery_address}" if latest.delivery_address else ""

            reply = (
                f"Hello! Your order {latest.order_number} for {items_str} is currently {status_desc}{address_str}. "
                f"Total amount is GH₵{latest.total_amount:.2f}. We will notify you as soon as the rider moves out!"
            )
            return ReplyResponse(
                reply_text=reply,
                intent="check_order",
                confidence=0.95,
                grounded_facts=[f"Matched active order {latest.order_number} with status '{latest.status}'"],
                requires_human_approval=False,
            )
        else:
            return ReplyResponse(
                reply_text="Hello! We could not find an active undelivered order linked to your number. If you have an order number (e.g. #ORD-123), please share it and our team will check for you.",
                intent="check_order",
                confidence=0.85,
                grounded_facts=["No active orders found in database matching customer credentials"],
                requires_human_approval=True,
                escalation_reason="No matching active orders found",
            )

    # 4. Check for merchant policies & delivery inquiries if grounding provided
    if grounding:
        if any(w in text for w in ["delivery", "deliver", "shipping", "dispatch", "rider fee", "delivery fee", "delivery terms", "do you deliver"]):
            if grounding.delivery_info:
                return ReplyResponse(
                    reply_text=grounding.delivery_info,
                    intent="inquire_delivery",
                    confidence=0.95,
                    grounded_facts=[f"Merchant delivery policy: {grounding.delivery_info}"],
                    requires_human_approval=False,
                )

        if any(w in text for w in ["return", "refund", "exchange", "money back", "return policy", "can i return"]):
            if grounding.return_policy:
                return ReplyResponse(
                    reply_text=grounding.return_policy,
                    intent="inquire_policy",
                    confidence=0.95,
                    grounded_facts=[f"Merchant return policy: {grounding.return_policy}"],
                    requires_human_approval=False,
                )

        if any(w in text for w in ["about you", "about your business", "who are you", "your shop", "tell me about your business"]):
            if grounding.about_business:
                return ReplyResponse(
                    reply_text=grounding.about_business,
                    intent="inquire_business",
                    confidence=0.95,
                    grounded_facts=[f"Merchant profile: {grounding.about_business}"],
                    requires_human_approval=False,
                )

        if any(w in text for w in ["payment methods", "payment policy", "warranty", "customer policy", "how do i pay", "accepted payment"]):
            if grounding.customer_policies:
                return ReplyResponse(
                    reply_text=grounding.customer_policies,
                    intent="inquire_policy",
                    confidence=0.95,
                    grounded_facts=[f"Merchant customer policy: {grounding.customer_policies}"],
                    requires_human_approval=False,
                )

    # 5. Check for greetings
    if any(text.startswith(w) for w in ["hi", "hello", "hey", "good morning", "good afternoon", "good evening"]):
        return ReplyResponse(
            reply_text="Hello! Welcome to our store. How can we assist you today? You can ask about our product prices, available stock, pre-orders, or track an existing order.",
            intent="greeting",
            confidence=0.95,
            grounded_facts=["Standard greeting"],
            requires_human_approval=False,
        )

    # 6. Check for product inquiries & stock checks
    sku_map = catalog.sku_map
    matched_product = None
    matched_variant = None

    # Check for SKU matches
    for sku_upper, variant in sku_map.items():
        if sku_upper.lower() in text:
            matched_variant = variant
            for p in catalog.products:
                if p.id == variant.product_id:
                    matched_product = p
                    break
            break

    # Check for product name matches
    if not matched_product:
        for p in catalog.products:
            if p.name.lower() in text:
                matched_product = p
                if p.variants:
                    matched_variant = p.variants[0]
                break

    if matched_product:
        # Determine if inquiry is stock or price
        is_stock_inquiry = any(w in text for w in ["in stock", "available", "have", "left", "remaining"])
        v_name = f" ({matched_variant.name})" if matched_variant and matched_variant.name != "Default" else ""
        price_str = f"GH₵{matched_variant.price:.2f}" if matched_variant else "listed prices"

        if is_stock_inquiry:
            if matched_product.availability_status == "AVAILABLE" and (matched_variant is None or matched_variant.quantity > 0):
                reply = f"Yes, {matched_product.name}{v_name} is currently available in stock! The price is {price_str}."
                grounded_facts.append(f"{matched_product.name} is AVAILABLE (stock: {matched_variant.quantity if matched_variant else 'ok'})")
                return ReplyResponse(
                    reply_text=reply,
                    intent="check_stock",
                    confidence=0.95,
                    grounded_facts=grounded_facts,
                    requires_human_approval=False,
                )
            else:
                # Out of stock or pre-order only
                if catalog.pre_orders:
                    batch = catalog.pre_orders[0]
                    reply = (
                        f"{matched_product.name} is currently out of stock for immediate delivery. However, our open pre-order batch "
                        f"'{batch.name}' ({batch.code}) is open with expected arrival between {batch.expected_arrival_start} and {batch.expected_arrival_end}."
                    )
                    grounded_facts.append(f"{matched_product.name} out of stock; open pre-order batch {batch.code}")
                else:
                    reply = f"Currently, {matched_product.name}{v_name} is out of stock. Would you like us to notify you when fresh inventory arrives?"
                    grounded_facts.append(f"{matched_product.name} is OUT_OF_STOCK")

                return ReplyResponse(
                    reply_text=reply,
                    intent="check_stock",
                    confidence=0.90,
                    grounded_facts=grounded_facts,
                    requires_human_approval=False,
                )
        else:
            # General price / product inquiry
            variants_detail = []
            for v in matched_product.variants:
                variants_detail.append(f"{v.name}: GH₵{v.price:.2f}")
            var_str = ", ".join(variants_detail) if variants_detail else price_str

            reply = f"{matched_product.name} is available for {var_str}."
            grounded_facts.append(f"Grounded price for {matched_product.name}: {var_str}")
            return ReplyResponse(
                reply_text=reply,
                intent="inquire_product",
                confidence=0.95,
                grounded_facts=grounded_facts,
                requires_human_approval=False,
            )

    # 6. Check for general pre-order inquiries
    if any(w in text for w in ["preorder", "pre-order", "batch", "eta", "arrival date", "when will it arrive"]):
        if catalog.pre_orders:
            batches_str = "; ".join([f"{b.name} ({b.code}): ETA {b.expected_arrival_start} to {b.expected_arrival_end}" for b in catalog.pre_orders])
            return ReplyResponse(
                reply_text=f"Our current open pre-order batches and estimated arrival times are: {batches_str}.",
                intent="inquire_product",
                confidence=0.95,
                grounded_facts=[f"Active pre-order batches: {batches_str}"],
                requires_human_approval=False,
            )

    # 7. Unmatched product inquiry / unknown
    return ReplyResponse(
        reply_text="Thank you for reaching out! I could not find a matching product or order in our system for your request. Could you please specify the product name or your order number?",
        intent="unknown",
        confidence=0.60,
        grounded_facts=["No matching products or orders found in catalog context"],
        requires_human_approval=False,
    )


async def generate_grounded_reply(
    message: NormalizedMessage,
    catalog: TenantCatalogContext,
    orders: List[CustomerOrderSummary],
    client: Optional[httpx.AsyncClient] = None,
    grounding: Optional[BusinessGroundingContext] = None,
    agent_config: Optional[AiAgentConfig] = None,
) -> ReplyResponse:
    """
    Generate grounded, conversational reply using LLM reasoning when configured,
    or deterministic heuristic fallback when offline / in tests.
    """
    if not settings.has_llm_key or settings.ENVIRONMENT == "test":
        return heuristic_generate_reply(message, catalog, orders, grounding=grounding)

    grounding_context = build_qa_grounding_context(catalog, orders, grounding=grounding)

    tone_str = "Warm, professional Ghanaian merchant tone ('Hello', 'Please note', 'Thank you for reaching out')."
    if agent_config and agent_config.response_tone:
        tone = agent_config.response_tone.lower()
        if tone == "friendly":
            tone_str = "Warm, friendly, welcoming, and approachable Ghanaian merchant tone."
        elif tone == "professional":
            tone_str = "Formal, professional, polite, and precise merchant tone."
        elif tone == "enthusiastic":
            tone_str = "Vibrant, energetic, enthusiastic, and engaging merchant tone."
        elif tone == "concise":
            tone_str = "Concise, brief, direct, and straight-to-the-point merchant tone."

    prompt = f"""
You are the Merchander AI Assistant for a Ghanaian social-commerce merchant.
Your goal is to provide polite, helpful, and 100% grounded answers to customer messages.

TONE & STYLE GUIDELINES:
- {tone_str}
- Always use Ghanaian Cedis formatted as "GH₵" (e.g. "GH₵150.00").
- Keep replies concise, conversational, and direct for messaging apps (WhatsApp / Telegram).

STRICT ANTI-HALLUCINATION RULES:
1. ONLY answer based on the real grounding data provided below.
2. If a customer asks for a product or variant NOT listed in the catalog, DO NOT fabricate prices or availability. State clearly that the item is not found in the catalog.
3. If a product is out of stock, state so honestly. If a pre-order batch is available for it, mention the batch ETA dates.
4. ORDER TRACKING: Only report order details if the order is listed in "CUSTOMER ACTIVE ORDERS". Never fabricate tracking numbers or order statuses.
5. PAYMENT VERIFICATION SAFETY: If the customer claims they made a payment (e.g. via Mobile Money / MoMo) or asks to verify payment receipt, DO NOT confirm payment as settled unless explicitly confirmed in database records. Mark `requires_human_approval: true`, explain that human confirmation is needed, and set `escalation_reason`.
6. HUMAN ESCALATION: If the customer explicitly asks for a human agent or if information cannot be verified, set `requires_human_approval: true`.
7. BUSINESS POLICIES & DELIVERY: Ground questions regarding delivery timelines, fees, coverage, and return/refund policies strictly on the "MERCHANT BUSINESS PROFILE & POLICIES" section. Do not fabricate contradictory policies.

GROUNDING DATA:
{grounding_context}

INBOUND CUSTOMER MESSAGE:
Platform: {message.platform}
Sender: {message.sender_id}
Message: "{message.text}"

Return ONLY valid JSON matching this schema:
{{
  "reply_text": "<string: conversational reply ready to send to the customer>",
  "intent": "<string: inquire_product | check_stock | check_order | confirm_payment | human_agent | greeting | unknown>",
  "confidence": <float between 0.0 and 1.0>,
  "grounded_facts": ["<string: fact 1 retrieved from DB>", "<string: fact 2>"],
  "requires_human_approval": <boolean>,
  "escalation_reason": <string or null>
}}
"""

    llm_json = await call_gemini_llm(prompt, settings.GEMINI_API_KEY, client=client)
    if llm_json and "reply_text" in llm_json:
        return ReplyResponse(
            reply_text=llm_json["reply_text"],
            intent=llm_json.get("intent", "unknown"),
            confidence=float(llm_json.get("confidence", 0.85)),
            grounded_facts=llm_json.get("grounded_facts", []),
            requires_human_approval=bool(llm_json.get("requires_human_approval", False)),
            escalation_reason=llm_json.get("escalation_reason"),
        )

    # Fallback to heuristic if LLM call failed or returned unparseable content
    return heuristic_generate_reply(message, catalog, orders, grounding=grounding)
