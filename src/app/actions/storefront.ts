'use server';

import { getPublicStorefrontBySlug as _getPublicStorefrontBySlug } from './storefront-public';
import { submitStorefrontOrder as _submitStorefrontOrder } from './storefront-order';
import { getStorefrontOrderTracking as _getStorefrontOrderTracking } from './storefront-tracking';
import { syncGuestWishlist as _syncGuestWishlist } from './storefront-wishlist';
import { uploadStorefrontBanner as _uploadStorefrontBanner } from './storefront-media';
import { getStorefrontConfig as _getStorefrontConfig } from './storefront-config-read';
import { updateStorefrontConfig as _updateStorefrontConfig } from './storefront-config-update';

export async function getPublicStorefrontBySlug(...args: Parameters<typeof _getPublicStorefrontBySlug>) {
  return _getPublicStorefrontBySlug(...args);
}

export async function submitStorefrontOrder(...args: Parameters<typeof _submitStorefrontOrder>) {
  return _submitStorefrontOrder(...args);
}

export async function getStorefrontOrderTracking(...args: Parameters<typeof _getStorefrontOrderTracking>) {
  return _getStorefrontOrderTracking(...args);
}

export async function syncGuestWishlist(...args: Parameters<typeof _syncGuestWishlist>) {
  return _syncGuestWishlist(...args);
}

export async function uploadStorefrontBanner(...args: Parameters<typeof _uploadStorefrontBanner>) {
  return _uploadStorefrontBanner(...args);
}

export async function getStorefrontConfig(...args: Parameters<typeof _getStorefrontConfig>) {
  return _getStorefrontConfig(...args);
}

export async function updateStorefrontConfig(...args: Parameters<typeof _updateStorefrontConfig>) {
  return _updateStorefrontConfig(...args);
}
