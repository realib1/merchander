/**
 * Domain & Storefront URL utilities for Merchander
 */

export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'merchander.com';
export const CNAME_TARGET = process.env.NEXT_PUBLIC_CNAME_TARGET || `cname.${ROOT_DOMAIN}`;

/**
 * Clean and normalize a domain input (strips protocol, port, path, trailing slashes, and spaces)
 */
export function normalizeDomain(input: string): string {
  if (!input) return '';
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '')
    .trim();
}

/**
 * Validate whether a string is a valid hostname/domain
 */
export function isValidCustomDomain(domain: string): boolean {
  const normalized = normalizeDomain(domain);
  if (!normalized) return false;

  // Prevent linking to the root domain or internal subdomains directly as custom domains
  if (normalized === ROOT_DOMAIN || normalized.endsWith(`.${ROOT_DOMAIN}`)) {
    return false;
  }

  // Standard domain regex (supports subdomains like shop.brand.com and apex brand.com)
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
  return domainRegex.test(normalized);
}

/**
 * Format default Merchander subdomain URL for a merchant slug: [slug].merchander.com
 */
export function getStorefrontSubdomainUrl(slug: string): string {
  const cleanSlug =
    slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '') || 'store';
  return `https://${cleanSlug}.${ROOT_DOMAIN}`;
}

/**
 * Determine DNS host / name prefix for CNAME record instructions
 */
export function getDnsHostRecord(domain: string): { type: 'CNAME'; host: string; target: string } {
  const normalized = normalizeDomain(domain);
  const parts = normalized.split('.');

  if (parts.length > 2) {
    // Subdomain (e.g. shop.brand.com -> host is "shop")
    return {
      type: 'CNAME',
      host: parts.slice(0, -2).join('.'),
      target: CNAME_TARGET,
    };
  }

  // Apex domain (e.g. brand.com -> host is "@")
  return {
    type: 'CNAME',
    host: '@',
    target: CNAME_TARGET,
  };
}
