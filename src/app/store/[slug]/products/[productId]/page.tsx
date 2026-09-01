import React from 'react';
import { notFound } from 'next/navigation';
import { getPublicStorefrontBySlug } from '@/app/actions/storefront';
import { DirectProductView } from './components/DirectProductView';
import type { Metadata } from 'next';
import { formatCurrency, slugify } from '@/utils/format';
import { StorefrontProduct } from '@/types/storefront';

interface ProductPageProps {
  params: Promise<{
    slug: string;
    productId: string;
  }>;
}

function findProduct(products: StorefrontProduct[], identifier: string): StorefrontProduct | undefined {
  const clean = decodeURIComponent(identifier).toLowerCase().trim();
  return (
    products.find((p) => p.id.toLowerCase() === clean) ||
    products.find((p) => slugify(p.name) === clean) ||
    products.find((p) => p.id.startsWith(clean) || clean.startsWith(slugify(p.name)))
  );
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug, productId } = await params;
  const data = await getPublicStorefrontBySlug(slug);

  if (!data) {
    return {
      title: 'Store Not Found | Merchander',
    };
  }

  const product = findProduct(data.products, productId);
  if (!product) {
    return {
      title: 'Product Not Found | Merchander',
    };
  }

  const productSlug = slugify(product.name);
  const priceText = formatCurrency(product.min_price, data.config.currency || 'GHS');
  const title = `${product.name} — ${priceText} | ${data.config.store_name}`;
  const description =
    product.description ||
    `Order ${product.name} for ${priceText} directly from ${data.config.store_name} on Merchander. Fast delivery available.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: product.image_url ? [product.image_url] : data.config.banner_url ? [data.config.banner_url] : [],
      url: `https://merchander.com/store/${slug}/products/${productSlug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: product.image_url ? [product.image_url] : [],
    },
  };
}

export default async function DirectProductPage({ params }: ProductPageProps) {
  const { slug, productId } = await params;
  const data = await getPublicStorefrontBySlug(slug);

  if (!data) {
    notFound();
  }

  const product = findProduct(data.products, productId);
  if (!product) {
    notFound();
  }

  const relatedProducts = data.products.filter((p) => p.id !== product.id && p.category_id === product.category_id);
  const primaryColor = data.config.primary_color || '#3b82f6';

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={
        {
          '--color-brand-primary': primaryColor,
          '--brand-primary': primaryColor,
        } as React.CSSProperties
      }
    >
      <DirectProductView
        config={data.config}
        product={product}
        relatedProducts={
          relatedProducts.length > 0 ? relatedProducts : data.products.filter((p) => p.id !== product.id)
        }
        slug={slug}
      />
    </div>
  );
}
