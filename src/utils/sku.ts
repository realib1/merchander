/**
 * SKU Auto-Generation Utility
 * Generates structured, readable Stock Keeping Units based on merchant preferences.
 */

export type SkuGenerationStyle = 'initials' | 'prefix' | 'category_initials';

export interface SkuGeneratorOptions {
  style?: SkuGenerationStyle;
  prefix?: string;
  sequenceNumber?: number;
  includeVariantName?: boolean;
  separator?: string;
}

/**
 * Extracts uppercase initials from a string (e.g. "Air Jordan Retro" -> "AJR")
 */
export function extractInitials(text: string, maxChars = 4): string {
  if (!text) return 'PRD';
  const words = text
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return 'PRD';

  if (words.length === 1) {
    const single = words[0].toUpperCase();
    return single.length <= maxChars ? single : single.slice(0, maxChars);
  }

  const initials = words.map((w) => w[0].toUpperCase()).join('');
  return initials.slice(0, maxChars);
}

/**
 * Formats a variant title into a compact uppercase slug (e.g. "Red / Extra Large" -> "RED-XL")
 */
export function formatVariantCode(variantName?: string): string {
  if (!variantName || variantName.toLowerCase() === 'standard' || variantName.toLowerCase() === 'default') {
    return '';
  }

  return variantName
    .split(/[\/\-,]/)
    .map((part) => {
      const clean = part.trim();
      const lower = clean.toLowerCase();
      if (lower === 'extra large' || lower === 'xlarge') return 'XL';
      if (lower === 'extra extra large' || lower === 'xxlarge') return 'XXL';
      if (lower === 'extra small' || lower === 'xsmall') return 'XS';
      if (lower === 'small') return 'S';
      if (lower === 'medium') return 'M';
      if (lower === 'large') return 'L';
      return clean.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    })
    .filter(Boolean)
    .join('-');
}

/**
 * Generates an auto-formatted SKU string
 */
export function generateProductSku(params: {
  productName: string;
  variantName?: string;
  categoryName?: string;
  options?: SkuGeneratorOptions;
}): string {
  const { productName, variantName, categoryName, options = {} } = params;
  const style = options.style || 'initials';
  const separator = options.separator || '-';
  const seq = options.sequenceNumber ?? 1;
  const paddedSeq = String(seq).padStart(2, '0');

  const parts: string[] = [];

  switch (style) {
    case 'prefix': {
      const customPrefix = (options.prefix || 'SKU')
        .trim()
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase();
      parts.push(customPrefix || 'SKU');
      break;
    }
    case 'category_initials': {
      const catCode = extractInitials(categoryName || 'CAT', 3);
      const prodCode = extractInitials(productName, 3);
      parts.push(`${catCode}${separator}${prodCode}`);
      break;
    }
    case 'initials':
    default: {
      const initials = extractInitials(productName, 4);
      parts.push(initials);
      break;
    }
  }

  if (options.includeVariantName !== false) {
    const variantCode = formatVariantCode(variantName);
    if (variantCode) {
      parts.push(variantCode);
    }
  }

  parts.push(paddedSeq);

  return parts.filter(Boolean).join(separator);
}
