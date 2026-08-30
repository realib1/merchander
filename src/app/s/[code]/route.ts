import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { trackFlyerInteraction } from '@/app/actions/flyers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!code) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const supabase = await createClient();

  const { data: share, error } = await supabase
    .from('flyer_shares')
    .select('id, product_id, tenant_id, products(id, name), tenants(slug)')
    .eq('short_code', code)
    .single();

  if (error || !share) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Increment scans count asynchronously
  await trackFlyerInteraction(code, 'scan');

  // If tenant has a custom store slug, redirect to public store product; otherwise product dashboard
  const tenantData = share.tenants as unknown as { slug: string } | null;
  const storeSlug = tenantData?.slug;

  if (storeSlug) {
    return NextResponse.redirect(new URL(`/store/${storeSlug}?product=${share.product_id}`, request.url));
  }

  return NextResponse.redirect(new URL(`/dashboard/products/${share.product_id}`, request.url));
}
