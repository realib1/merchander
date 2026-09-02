export type TicketCategory =
  'account' | 'storefront' | 'orders' | 'payments' | 'channels' | 'domain' | 'intelligence' | 'billing' | 'other';

export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';

export type TicketStatus = 'open' | 'in_progress' | 'waiting_for_merchant' | 'resolved' | 'closed';

export type ServiceStatus = 'operational' | 'degraded_performance' | 'partial_outage' | 'major_outage' | 'maintenance';

export interface SystemContext {
  page_url?: string;
  area?: string;
  error_message?: string | null;
  error_code?: string | null;
  connection_status?: string | null;
  store_name?: string;
  store_slug?: string;
  tenant_id?: string;
  currency?: string;
  user_agent?: string;
  timestamp?: string;
}

export interface SupportTicketMessage {
  id: string;
  ticket_id: string;
  sender_type: 'merchant' | 'support' | 'system';
  sender_id: string;
  sender_name: string;
  message: string;
  is_internal_note?: boolean;
  attachments?: string[];
  created_at: string;
}

export interface SupportTicket {
  id: string;
  reference_code: string;
  tenant_id: string;
  user_id: string;
  user_email: string;
  user_name?: string;
  store_name: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  is_escalated: boolean;
  system_context?: SystemContext;
  messages: SupportTicketMessage[];
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
}

export interface HelpArticle {
  id: string;
  slug: string;
  title: string;
  category: TicketCategory;
  summary: string;
  content: string;
  tags: string[];
}

export interface SystemIncident {
  id: string;
  service: 'storefront' | 'whatsapp' | 'payments' | 'domains' | 'core_api';
  status: ServiceStatus;
  title: string;
  message: string;
  affected_areas: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoreDiagnostics {
  tenantId: string;
  storeName: string;
  storeSlug: string;
  userEmail: string;
  userRole?: string;
  currency: string;
  productCount: number;
  activeBatchCount: number;
  supportPhone: string | null;
  supportEmail: string;
  businessHoursSummary?: string;
  submittedTickets: SupportTicket[];
}

export interface CreateTicketPayload {
  category: TicketCategory;
  subject: string;
  message: string;
  priority?: TicketPriority;
  system_context?: SystemContext;
  attachments?: string[];
}

export interface SupportAccessGrant {
  id: string;
  tenant_id: string;
  granted_by: string;
  granted_by_email?: string;
  ticket_id?: string | null;
  // Only returned to the tenant that owns the grant; platform-side reads omit it.
  token?: string;
  reason: string;
  duration_hours: number;
  status: 'active' | 'revoked' | 'expired';
  expires_at: string;
  created_at: string;
  revoked_at?: string | null;
}
