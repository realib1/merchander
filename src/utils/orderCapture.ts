export interface CartItemInput {
  sku?: string;
  name?: string;
  quantity: number;
}

export interface MatchedVariantData {
  id: string;
  sku: string;
  name: string;
  productName: string;
  price: number;
  availableStock: number;
  isPreorder?: boolean;
}

export interface ValidatedOrderItem {
  variantId: string;
  sku: string;
  productName: string;
  variantName: string;
  displayName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  availableStock: number;
  hasStockWarning: boolean;
}

export interface OrderCalculationResult {
  items: ValidatedOrderItem[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  hasStockDeficit: boolean;
  warnings: string[];
}

/**
 * Calculates order subtotals, grand totals, and evaluates stock warnings against live inventory.
 */
export function calculateOrderTotals(
  matchedItems: Array<{
    variant: MatchedVariantData;
    quantity: number;
  }>,
  deliveryFee: number = 0
): OrderCalculationResult {
  let subtotal = 0;
  let hasStockDeficit = false;
  const warnings: string[] = [];

  const items: ValidatedOrderItem[] = matchedItems.map(({ variant, quantity }) => {
    const validQty = Math.max(1, Math.floor(quantity) || 1);
    const lineTotal = Math.round(variant.price * validQty * 100) / 100;
    subtotal += lineTotal;

    const hasStockWarning = !variant.isPreorder && variant.availableStock < validQty;
    if (hasStockWarning) {
      hasStockDeficit = true;
      warnings.push(
        `Insufficient stock for "${variant.productName} (${variant.name})": requested ${validQty}, but only ${variant.availableStock} available.`
      );
    }

    const displayName =
      variant.name && variant.name.toLowerCase() !== 'default'
        ? `${variant.productName} - ${variant.name}`
        : variant.productName;

    return {
      variantId: variant.id,
      sku: variant.sku,
      productName: variant.productName,
      variantName: variant.name,
      displayName,
      quantity: validQty,
      unitPrice: variant.price,
      lineTotal,
      availableStock: variant.availableStock,
      hasStockWarning,
    };
  });

  const normalizedDeliveryFee = Math.max(0, Math.round((Number(deliveryFee) || 0) * 100) / 100);
  const totalAmount = Math.round((subtotal + normalizedDeliveryFee) * 100) / 100;

  return {
    items,
    subtotal: Math.round(subtotal * 100) / 100,
    deliveryFee: normalizedDeliveryFee,
    totalAmount,
    hasStockDeficit,
    warnings,
  };
}

/**
 * Formats a warm, professional customer order confirmation message in Ghanaian merchant tone.
 */
export function formatOrderConfirmationMessage(params: {
  customerName?: string | null;
  orderNumber: string;
  items: Array<{ displayName: string; quantity: number; unitPrice: number; lineTotal: number }>;
  totalAmount: number;
  deliveryFee?: number;
  currency?: string;
}): string {
  const name = params.customerName?.trim() || 'Customer';
  const currency = params.currency || 'GHS';
  const fee = params.deliveryFee || 0;

  const itemLines = params.items.map(
    (item) => `• ${item.quantity}x ${item.displayName} (${currency} ${item.unitPrice.toFixed(2)}) = ${currency} ${item.lineTotal.toFixed(2)}`
  );

  const lines = [
    `Hello ${name}! 🎉`,
    '',
    `We have prepared your order #${params.orderNumber}:`,
    ...itemLines,
    '',
  ];

  if (fee > 0) {
    lines.push(`Delivery Fee: ${currency} ${fee.toFixed(2)}`);
  }

  lines.push(`Total Amount: ${currency} ${params.totalAmount.toFixed(2)}`);
  lines.push('');
  lines.push(`We'll share payment details and delivery updates shortly. Thank you for shopping with us!`);

  return lines.join('\n');
}

/**
 * Immediate automated customer assurance copy dispatched on WhatsApp when an order intent is detected.
 */
export function formatOrderAssuranceNotice(): string {
  return "We've received your order request! Our team is confirming stock and preparing your order details now. We'll get back to you shortly.";
}

/**
 * Generates an array of grounded fact strings for the merchant's approval queue card.
 */
export function buildGroundedOrderFacts(
  items: ValidatedOrderItem[],
  storeName?: string | null
): string[] {
  const facts: string[] = [];
  const storeLabel = storeName ? ` at ${storeName}` : '';

  items.forEach((item) => {
    const stockStatus = item.hasStockWarning
      ? `⚠️ LOW/DEFICIT STOCK: only ${item.availableStock} available`
      : `${item.availableStock} in stock`;

    facts.push(
      `Validated "${item.displayName}" (SKU: ${item.sku}) at GHS ${item.unitPrice.toFixed(2)} (${stockStatus}${storeLabel})`
    );
  });

  return facts;
}
