import logging
import re
from typing import List, Optional, Dict, Any
import httpx
from app.config import settings
from app.schemas import CustomerOrderSummary, CustomerOrderItem

logger = logging.getLogger(__name__)


def _clean_phone(phone: str) -> str:
    """Normalize phone number by removing spaces, dashes, and parens."""
    return re.sub(r"[^\d+]", "", phone.strip())


async def fetch_customer_active_orders(
    tenant_id: str,
    customer_id: Optional[str] = None,
    phone_number: Optional[str] = None,
    order_number: Optional[str] = None,
    client: Optional[httpx.AsyncClient] = None,
) -> List[CustomerOrderSummary]:
    """
    Fetch active, undelivered orders for a customer in a tenant from Supabase PostgREST.
    Matches orders by customer_id, phone number, or explicit order number.
    Filters out 'delivered' and 'cancelled' orders so only in-progress orders are returned.
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        logger.info(f"Supabase not configured, returning empty orders for tenant {tenant_id}")
        return []

    headers = {
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        "Accept": "application/json",
    }

    own_client = False
    if client is None:
        client = httpx.AsyncClient(timeout=10.0)
        own_client = True

    try:
        matched_customer_ids = set()
        if customer_id:
            matched_customer_ids.add(customer_id)

        # 1. If phone number is provided, search for customer IDs by phone
        if phone_number:
            clean_phone = _clean_phone(phone_number)
            customers_url = f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1/customers"
            # Support exact match or local suffix match if available
            c_res = await client.get(
                customers_url,
                params={"tenant_id": f"eq.{tenant_id}", "select": "id,phone"},
                headers=headers,
            )
            if c_res.status_code == 200:
                for c in c_res.json():
                    c_phone = _clean_phone(c.get("phone") or "")
                    if c_phone and (c_phone == clean_phone or c_phone.endswith(clean_phone[-9:]) or clean_phone.endswith(c_phone[-9:])):
                        matched_customer_ids.add(c["id"])

        # 2. Build orders query
        orders_url = f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1/orders"
        orders_params: Dict[str, str] = {
            "tenant_id": f"eq.{tenant_id}",
            "status": "not.in.(delivered,cancelled)",
            "select": "id,short_id,status,total_amount,delivery_address,created_at,customer_id,order_items(id,quantity,unit_price,product_variants(id,name,sku,products(name)))",
            "order": "created_at.desc",
            "limit": "5",
        }

        # If order number specified, look up directly
        if order_number:
            clean_num = order_number.replace("#", "").strip()
            # If it's a UUID, search id; else search short_id
            if len(clean_num) == 36 and "-" in clean_num:
                orders_params["id"] = f"eq.{clean_num}"
            else:
                orders_params["short_id"] = f"eq.{clean_num.upper()}"
        elif matched_customer_ids:
            if len(matched_customer_ids) == 1:
                orders_params["customer_id"] = f"eq.{list(matched_customer_ids)[0]}"
            else:
                ids_str = ",".join(matched_customer_ids)
                orders_params["customer_id"] = f"in.({ids_str})"
        else:
            # Neither customer ID, phone match, nor order number could be resolved
            return []

        res = await client.get(orders_url, params=orders_params, headers=headers)
        if res.status_code != 200:
            logger.warning(f"Error fetching active orders for tenant {tenant_id}: {res.status_code} {res.text}")
            return []

        orders_data = res.json()
        result: List[CustomerOrderSummary] = []
        for o in orders_data:
            order_id = o.get("id", "")
            short_id = o.get("short_id") or order_id[:8].upper()
            status = o.get("status", "pending")
            total_amount = float(o.get("total_amount", 0.0))
            delivery_address = o.get("delivery_address")
            created_at = o.get("created_at")

            items: List[CustomerOrderItem] = []
            for item_row in o.get("order_items", []):
                pv = item_row.get("product_variants") or {}
                prod = pv.get("products") or {}
                item_name = prod.get("name") or pv.get("name") or "Product"
                if pv.get("name") and pv.get("name") != item_name:
                    item_name = f"{item_name} ({pv.get('name')})"

                items.append(
                    CustomerOrderItem(
                        name=item_name,
                        sku=pv.get("sku"),
                        quantity=int(item_row.get("quantity", 1)),
                        unit_price=float(item_row.get("unit_price", 0.0)),
                    )
                )

            result.append(
                CustomerOrderSummary(
                    id=order_id,
                    order_number=f"#{short_id}",
                    status=status,
                    total_amount=total_amount,
                    currency="GHS",
                    items=items,
                    created_at=created_at,
                    delivery_address=delivery_address,
                )
            )

        return result

    except Exception as exc:
        logger.exception(f"Unexpected error fetching customer active orders: {exc}")
        return []
    finally:
        if own_client:
            await client.aclose()
