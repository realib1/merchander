import { Smartphone, MessageCircle, Banknote } from 'lucide-react';

export const PAYMENT_METHODS = [
  {
    id: 'mtn_momo' as const,
    label: 'Mobile Money (MTN MoMo / Telecel / AT)',
    subtitle: 'Instant prompt on your phone for seamless payment',
    icon: Smartphone,
  },
  {
    id: 'whatsapp' as const,
    label: 'Order on WhatsApp',
    subtitle: 'Confirm details and finalize payment directly via chat',
    icon: MessageCircle,
  },
  {
    id: 'cash_on_delivery' as const,
    label: 'Cash on Delivery (COD)',
    subtitle: 'Pay cash or transfer upon package arrival',
    icon: Banknote,
  },
];
