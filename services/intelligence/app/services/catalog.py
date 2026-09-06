import logging
from typing import List, Optional, Dict, Any
import httpx
from pydantic import BaseModel, Field
from app.config import settings

logger = logging.getLogger(__name__)


class CatalogVariant(BaseModel):
    id: str
    product_id: str
    name: str
    sku: str
    price: float
    cost_price: Optional[float] = None
    quantity: int = 0


class CatalogProduct(BaseModel):
    id: str
    tenant_id: str
    name: str
    description: Optional[str] = None
    availability_status: str = "AVAILABLE"  # AVAILABLE | PRE_ORDER | OUT_OF_STOCK
    variants: List[CatalogVariant] = Field(default_factory=list)


class PreOrderBatchContext(BaseModel):
    id: str
    name: str
    code: str
    status: str
    expected_arrival_start: Optional[str] = None
    expected_arrival_end: Optional[str] = None


class TenantCatalogContext(BaseModel):
    tenant_id: str
    products: List[CatalogProduct] = Field(default_factory=list)
    pre_orders: List[PreOrderBatchContext] = Field(default_factory=list)

    @property
    def all_variants(self) -> List[CatalogVariant]:
        return [variant for product in self.products for variant in product.variants]

    @property
    def sku_map(self) -> Dict[str, CatalogVariant]:
        return {v.sku.upper(): v for v in self.all_variants if v.sku}


async def fetch_tenant_catalog(tenant_id: str, client: Optional[httpx.AsyncClient] = None) -> TenantCatalogContext:
    """
    Fetch active catalog products, variants, and open pre-orders for a tenant from Supabase PostgREST.
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        logger.info(f"Supabase not configured, returning empty catalog for tenant {tenant_id}")
        return TenantCatalogContext(tenant_id=tenant_id)

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
        # 1. Fetch products with nested variants
        products_url = f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1/products"
        products_params = {
            "tenant_id": f"eq.{tenant_id}",
            "select": "id,tenant_id,name,description,availability_status,product_variants(id,product_id,name,sku,price,cost_price)",
        }
        res_prod = await client.get(products_url, params=products_params, headers=headers)
        
        parsed_products: List[CatalogProduct] = []
        if res_prod.status_code == 200:
            for p in res_prod.json():
                variants = [
                    CatalogVariant(
                        id=v.get("id", ""),
                        product_id=v.get("product_id", p.get("id")),
                        name=v.get("name", "Default"),
                        sku=v.get("sku", ""),
                        price=float(v.get("price", 0.0)),
                        cost_price=float(v["cost_price"]) if v.get("cost_price") is not None else None,
                    )
                    for v in p.get("product_variants", [])
                ]
                parsed_products.append(
                    CatalogProduct(
                        id=p.get("id", ""),
                        tenant_id=p.get("tenant_id", tenant_id),
                        name=p.get("name", ""),
                        description=p.get("description"),
                        availability_status=p.get("availability_status", "AVAILABLE"),
                        variants=variants,
                    )
                )
        else:
            logger.warning(f"Error fetching products for tenant {tenant_id}: {res_prod.status_code} {res_prod.text}")

        # 2. Fetch open pre-order batches
        batches_url = f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1/preorder_batches"
        batches_params = {
            "tenant_id": f"eq.{tenant_id}",
            "status": "in.(OPEN,CLOSING_SOON)",
            "select": "id,name,code,status,expected_arrival_start,expected_arrival_end",
        }
        res_batch = await client.get(batches_url, params=batches_params, headers=headers)
        parsed_batches: List[PreOrderBatchContext] = []
        if res_batch.status_code == 200:
            for b in res_batch.json():
                parsed_batches.append(
                    PreOrderBatchContext(
                        id=b.get("id", ""),
                        name=b.get("name", ""),
                        code=b.get("code", ""),
                        status=b.get("status", "OPEN"),
                        expected_arrival_start=b.get("expected_arrival_start"),
                        expected_arrival_end=b.get("expected_arrival_end"),
                    )
                )

        return TenantCatalogContext(
            tenant_id=tenant_id,
            products=parsed_products,
            pre_orders=parsed_batches,
        )
    except Exception as e:
        logger.exception(f"Unexpected error fetching catalog for tenant {tenant_id}: {e}")
        return TenantCatalogContext(tenant_id=tenant_id)
    finally:
        if own_client:
            await client.aclose()
