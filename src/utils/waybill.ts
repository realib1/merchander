import { formatCurrency } from './format';

export type WaybillOrder = {
  orderId: string;
  storeName: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  items: Array<{ name: string; variantName?: string; price: number; quantity: number }>;
  deliveryFee: number;
  totalAmount: number;
  paymentStatus: string;
  transactionRef?: string;
};

/**
 * Generates a standard Ghanaian Logistics Dispatch Slip (Waybill) text.
 * Suitable for printing to thermal POS printers or copying into rider WhatsApp chats.
 */
export function generateDispatchSlip(order: WaybillOrder): string {
  const line = '------------------------------------------';
  const doubleLine = '==========================================';

  let itemsText = '';
  order.items.forEach(item => {
    const itemName = item.variantName ? `${item.name} (${item.variantName})` : item.name;
    const priceStr = formatCurrency(item.price).padStart(15);
    itemsText += `${item.quantity}x ${itemName.padEnd(25)} ${priceStr}\n`;
  });

  const deliveryFeeStr = formatCurrency(order.deliveryFee).padStart(15);
  const totalStr = formatCurrency(order.totalAmount).padStart(15);
  
  let paymentText = order.paymentStatus === 'paid' ? 'PAID' : 'PENDING CASH ON DELIVERY';
  if (order.transactionRef) {
    paymentText += ` (Ref: ${order.transactionRef})`;
  }

  return `
${doubleLine}
           MERCHANDER DISPATCH SLIP
Order: ${order.orderId.substring(0, 8).toUpperCase()}      Branch: ${order.storeName}
Customer: ${order.customerName}
Phone: ${order.customerPhone}
Location: ${order.deliveryAddress}
${line}
${itemsText}
Delivery Fee:                   ${deliveryFeeStr}
${line}
TOTAL:                          ${totalStr}
Payment: ${paymentText}
${doubleLine}
`.trim();
}
