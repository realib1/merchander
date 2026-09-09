import { AIActionRecord, ActionTier, ActionType } from '@/types/actions';

/**
 * Cleans a Ghanaian or international phone number into a digits-only format suitable for wa.me.
 * e.g., '024 123 4567' -> '233241234567', '+233244123456' -> '233244123456'
 */
export function sanitizePhoneForWhatsApp(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 10) {
    return '233' + digits.slice(1);
  }
  return digits;
}

/**
 * Builds a direct 1-click WhatsApp takeover link with a personalized prefilled greeting.
 */
export function buildWhatsAppTakeoverUrl(
  phone: string,
  customerName?: string | null,
  _reason?: string | null
): string {
  void _reason;
  const cleanPhone = sanitizePhoneForWhatsApp(phone);
  if (!cleanPhone) return 'https://wa.me/';

  const namePart = customerName ? `${customerName}, ` : '';
  const greeting = `Hello ${namePart}this is Merchander customer support. I am stepping in to assist you directly with your inquiry.`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(greeting)}`;
}

/**
 * Formats an action type into a human-friendly merchant action label.
 */
export function formatActionTypeLabel(actionType: ActionType | string): string {
  switch (actionType) {
    case 'confirm_payment':
      return 'Verify Payment';
    case 'draft_order':
      return 'Draft Order';
    case 'human_handoff':
      return 'Human Handoff';
    case 'proactive_outreach':
      return 'Proactive Outreach';
    case 'reply':
    default:
      return 'Review Reply';
  }
}

/**
 * Formats tier styling classes for consistent operational badge indicators.
 */
export function formatTierBadge(tier: ActionTier): {
  label: string;
  badgeClass: string;
} {
  switch (tier) {
    case 'red':
      return {
        label: 'Red Exception',
        badgeClass: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
      };
    case 'yellow':
      return {
        label: 'Yellow Approval',
        badgeClass: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      };
    case 'green':
    default:
      return {
        label: 'Green Auto',
        badgeClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      };
  }
}

export type QueueTabFilter = 'all' | 'yellow' | 'red' | 'history';

/**
 * Filters and prioritizes queue action records by active tab, status, and query term.
 */
export function filterActionQueue(
  actions: AIActionRecord[],
  query: string,
  activeTab: QueueTabFilter
): AIActionRecord[] {
  const normalizedQuery = query.toLowerCase().trim();

  return actions
    .filter((act) => {
      // Tab filtering
      if (activeTab === 'yellow') {
        if (act.tier !== 'yellow' || act.status !== 'pending') return false;
      } else if (activeTab === 'red') {
        if (act.tier !== 'red' || act.status !== 'pending') return false;
      } else if (activeTab === 'history') {
        if (act.status === 'pending') return false;
      } else {
        // 'all' tab shows all pending by default
        if (act.status !== 'pending') return false;
      }

      // Search query filtering
      if (!normalizedQuery) return true;

      const customerName = act.customer?.name?.toLowerCase() || '';
      const customerPhone =
        act.customer?.phone?.toLowerCase() ||
        act.channel_identity?.channel_handle?.toLowerCase() ||
        '';
      const proposedText = (act.proposed_payload?.reply_text as string)?.toLowerCase() || '';
      const actionType = act.action_type.toLowerCase();
      const escalationReason = act.escalation_reason?.toLowerCase() || '';

      return (
        customerName.includes(normalizedQuery) ||
        customerPhone.includes(normalizedQuery) ||
        proposedText.includes(normalizedQuery) ||
        actionType.includes(normalizedQuery) ||
        escalationReason.includes(normalizedQuery)
      );
    })
    .sort((a, b) => {
      // Prioritize Red urgent exceptions first, then Yellow, then newest
      if (a.status === 'pending' && b.status === 'pending') {
        if (a.tier === 'red' && b.tier !== 'red') return -1;
        if (a.tier !== 'red' && b.tier === 'red') return 1;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
}
