/**
 * Pure utilities for merchant workspace provisioning, slug validation,
 * password generation, and onboarding credential formatting.
 */

export const RESERVED_SUBDOMAIN_SLUGS = new Set([
  'admin',
  'api',
  'app',
  'auth',
  'billing',
  'checkout',
  'dashboard',
  'help',
  'login',
  'mail',
  'merchander',
  'platform',
  'portal',
  'root',
  'settings',
  'shero',
  'signup',
  'status',
  'store',
  'support',
  'test',
  'webhook',
  'webhooks',
  'www',
]);

/**
 * Normalizes a raw business or store name into a valid URL slug.
 */
export function cleanSlug(raw: string): string {
  if (!raw) return '';
  return raw
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '') // remove apostrophes: "Abena's" -> "Abenas"
    .replace(/[^a-z0-9]+/g, '-') // non-alphanumeric to hyphen
    .replace(/^-+|-+$/g, '') // trim leading and trailing hyphens
    .slice(0, 60);
}

/**
 * Validates whether a proposed subdomain slug meets domain and security requirements.
 */
export function validateMerchantSlug(slug: string): { isValid: boolean; error?: string } {
  if (!slug || slug.trim().length === 0) {
    return { isValid: false, error: 'Subdomain slug is required' };
  }

  const trimmed = slug.trim();

  if (trimmed.length < 2) {
    return { isValid: false, error: 'Subdomain slug must be at least 2 characters' };
  }

  if (trimmed.length > 60) {
    return { isValid: false, error: 'Subdomain slug must not exceed 60 characters' };
  }

  // Enforce lowercase alphanumeric with single hyphens, no leading/trailing hyphens
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!slugPattern.test(trimmed)) {
    return {
      isValid: false,
      error: 'Slug may only contain lowercase letters, numbers, and hyphens without consecutive or edge hyphens',
    };
  }

  if (RESERVED_SUBDOMAIN_SLUGS.has(trimmed)) {
    return { isValid: false, error: `"${trimmed}" is a reserved platform keyword and cannot be used` };
  }

  return { isValid: true };
}

/**
 * Validates email format for a merchant account.
 */
export function validateOwnerEmail(email: string): { isValid: boolean; error?: string } {
  if (!email || email.trim().length === 0) {
    return { isValid: false, error: 'Email address is required' };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email.trim())) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true };
}

/**
 * Generates a secure, readable temporary password for initial merchant provisioning.
 */
export function generateInitialPassword(): string {
  const chars = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  let randomPart = '';
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const year = new Date().getFullYear();
  return `Merchander-${year}-${randomPart}`;
}

export interface MerchantCredentialsDetails {
  businessName: string;
  storeUrl: string;
  ownerEmail: string;
  temporaryPassword?: string;
  loginUrl?: string;
}

/**
 * Formats a clean message containing new merchant credentials for 1-click clipboard copying.
 */
export function formatMerchantCredentials(details: MerchantCredentialsDetails): string {
  const loginUrl = details.loginUrl || 'https://merchander.app/login';
  const passwordLine = details.temporaryPassword
    ? `🔑 Temporary Password: ${details.temporaryPassword}\n`
    : '';

  return (
    `🎉 Welcome to Merchander!\n\n` +
    `Your workspace for "${details.businessName}" is ready.\n\n` +
    `🌐 Online Storefront: ${details.storeUrl}\n` +
    `💻 Merchant Dashboard: ${loginUrl}\n` +
    `📧 Login Email: ${details.ownerEmail}\n` +
    passwordLine +
    `\nPlease log in and update your password in Settings when convenient.`
  );
}
