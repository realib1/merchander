'use server';

import { createClient } from '@/lib/supabase/server';
import { getTenantInfo } from '@/lib/supabase/queries';
import { revalidatePath } from 'next/cache';
import { OrderSettings, InventorySettings, PaymentSettings } from '@/types/settings';
import { encryptSecret, maskSecret } from '@/utils/encryption';

const DEFAULT_ORDERS: OrderSettings = {
  numbering: {
    prefix: 'ORD',
    format: 'ORD-{{YEAR}}-{{NUMBER}}',
    nextNumber: 142,
  },
  creation: {
    allowStorefront: true,
    allowSocialConversations: true,
    allowDashboard: true,
    allowManual: true,
    aiCreatedOrdersMode: 'require_confirmation',
  },
  confirmation: {
    autoConfirmStorefront: true,
    requireApprovalBeforeProcessing: false,
    sendCustomerConfirmation: true,
  },
  statuses: {
    enabledStatuses: [
      'pending',
      'confirmed',
      'processing',
      'ready',
      'shipped',
      'delivered',
      'cancelled',
      'returned',
      'refunded',
    ],
  },
  cancellation: {
    allowMerchantCancellation: true,
    allowCustomerCancellation: true,
    customerCancellationWindowMinutes: 30,
    requireApprovalAfterProcessing: true,
  },
  returnsRefunds: {
    allowReturnRequests: true,
    refundRequiresMerchantApproval: true,
    defaultRefundMethod: 'original_payment',
  },
  inventory: {
    onConfirmation: 'reserve_stock',
    onCancellationReleaseStock: true,
  },
  notifications: {
    newOrder: true,
    orderCancelled: true,
    paymentReceived: true,
    orderReady: true,
    orderDelivered: true,
    returnRequested: true,
  },
  orderConfirmationEmail: true,
  staffOrderNotifications: true,
  orderPrefix: 'ORD',
  orderSuffix: '',
  abandonedRecoveryEnabled: true,
  abandonedSendAfterHours: 12,
};

export async function getOrderSettings(): Promise<OrderSettings> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return DEFAULT_ORDERS;

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);
    const [settingsRes, ordersCountRes] = await Promise.all([
      supabase.from('tenant_settings').select('settings_data').eq('tenant_id', tenantId).maybeSingle(),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    ]);

    const realNextNumber = (ordersCountRes.count ?? 0) + 1;
    const custom = (settingsRes.data?.settings_data as Record<string, unknown> | null)?.order_settings as
      Record<string, unknown> | undefined;

    if (custom && typeof custom === 'object') {
      const numberingCustom = (custom.numbering as Record<string, unknown>) || {};
      const creationCustom = (custom.creation as Record<string, unknown>) || {};
      const confirmationCustom = (custom.confirmation as Record<string, unknown>) || {};
      const statusesCustom = (custom.statuses as Record<string, unknown>) || {};
      const cancellationCustom = (custom.cancellation as Record<string, unknown>) || {};
      const returnsRefundsCustom = (custom.returnsRefunds as Record<string, unknown>) || {};
      const inventoryCustom = (custom.inventory as Record<string, unknown>) || {};
      const notificationsCustom = (custom.notifications as Record<string, unknown>) || {};

      return {
        numbering: {
          ...DEFAULT_ORDERS.numbering,
          ...numberingCustom,
          prefix: (numberingCustom.prefix ?? custom.orderPrefix ?? 'ORD') as string,
          nextNumber: Number(numberingCustom.nextNumber) || realNextNumber,
        },
        creation: {
          ...DEFAULT_ORDERS.creation,
          ...creationCustom,
        },
        confirmation: {
          ...DEFAULT_ORDERS.confirmation,
          ...confirmationCustom,
          sendCustomerConfirmation: Boolean(
            confirmationCustom.sendCustomerConfirmation ?? custom.orderConfirmationEmail ?? true
          ),
        },
        statuses: {
          ...DEFAULT_ORDERS.statuses,
          ...statusesCustom,
        },
        cancellation: {
          ...DEFAULT_ORDERS.cancellation,
          ...cancellationCustom,
        },
        returnsRefunds: {
          ...DEFAULT_ORDERS.returnsRefunds,
          ...returnsRefundsCustom,
        },
        inventory: {
          ...DEFAULT_ORDERS.inventory,
          ...inventoryCustom,
        },
        notifications: {
          ...DEFAULT_ORDERS.notifications,
          ...notificationsCustom,
        },
        orderConfirmationEmail: Boolean(
          confirmationCustom.sendCustomerConfirmation ?? custom.orderConfirmationEmail ?? true
        ),
        staffOrderNotifications: Boolean(custom.staffOrderNotifications ?? true),
        orderPrefix: (numberingCustom.prefix ?? custom.orderPrefix ?? 'ORD') as string,
        orderSuffix: (custom.orderSuffix ?? '') as string,
        abandonedRecoveryEnabled: Boolean(custom.abandonedRecoveryEnabled ?? true),
        abandonedSendAfterHours: Number(custom.abandonedSendAfterHours ?? 12),
      };
    }

    return {
      ...DEFAULT_ORDERS,
      numbering: {
        ...DEFAULT_ORDERS.numbering,
        nextNumber: realNextNumber,
      },
    };
  } catch (err) {
    console.error('Error fetching order settings:', err);
    return DEFAULT_ORDERS;
  }
}

export async function updateOrderSettings(payload: OrderSettings) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  try {
    const { tenantId, role } = await getTenantInfo(supabase, user.id);
    if (role !== 'owner' && role !== 'admin') return { error: 'Insufficient permissions' };

    const { data: existing } = await supabase
      .from('tenant_settings')
      .select('settings_data')
      .eq('tenant_id', tenantId)
      .maybeSingle();
    const currentData = (existing?.settings_data as Record<string, unknown>) || {};
    const updatedData = { ...currentData, order_settings: payload };

    const { error } = await supabase.from('tenant_settings').upsert(
      {
        tenant_id: tenantId,
        settings_data: updatedData,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'tenant_id' }
    );

    if (error) throw error;
    revalidatePath('/dashboard/settings/orders');
    return { success: true };
  } catch (err) {
    console.error('Error updating order settings:', err);
    return { error: 'Failed to update order settings' };
  }
}

const DEFAULT_INVENTORY: InventorySettings = {
  stopSellingWhenOutOfStock: true,
  trackInventoryByDefault: true,
  enableLowStockAlerts: true,
  lowStockThreshold: 5,
  autoGenerateSkus: true,
  skuSettings: {
    autoGenerate: true,
    style: 'initials',
    prefix: 'SKU',
    includeVariantName: true,
    nextNumber: 1,
  },
};

const DEFAULT_PAYMENTS: PaymentSettings = {
  methods: {
    mobileMoney: true,
    cash: true,
    bankTransfer: true,
    card: false,
    other: false,
  },
  p2pAccounts: [],
  momoDetails: {
    mtnNumber: '',
    mtnAccountName: '',
    telecelNumber: '',
    telecelAccountName: '',
    atNumber: '',
    atAccountName: '',
  },
  bankDetails: {
    bankName: '',
    accountNumber: '',
    accountName: '',
    branch: '',
  },
  codMaxOrderAmount: 500,
  paymentInstructions: 'Please use your Order Short ID as your payment reference.',
  providers: {
    hubtel: { connected: false },
    paystack: { connected: false },
  },
  currency: 'GHS',
  recording: {
    allowManualRecording: true,
    requirePaymentReference: true,
    allowPartialPayments: true,
    recordSupplierPayments: true,
  },
  supplierPayments: {
    enabled: false,
    defaultMethods: ['momo', 'bank', 'cash'],
  },
  enableMtnMomo: true,
  enableTelecelCash: true,
  enableAtMoney: true,
  enableCards: false,
  enableCod: true,
};

export async function getInventorySettings(): Promise<InventorySettings> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return DEFAULT_INVENTORY;

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);
    const { data } = await supabase
      .from('tenant_settings')
      .select('low_stock_threshold, settings_data')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    const custom = (data?.settings_data as Record<string, unknown> | null)?.inventory_settings;
    if (custom && typeof custom === 'object') {
      const customInv = custom as unknown as InventorySettings;
      return {
        ...DEFAULT_INVENTORY,
        ...customInv,
        lowStockThreshold: Number(data?.low_stock_threshold) || customInv.lowStockThreshold || 5,
        skuSettings: {
          ...DEFAULT_INVENTORY.skuSettings!,
          ...(customInv.skuSettings || {}),
        },
      };
    }
    if (data?.low_stock_threshold) {
      return { ...DEFAULT_INVENTORY, lowStockThreshold: data.low_stock_threshold };
    }
  } catch (err) {
    console.error('Error fetching inventory settings:', err);
  }
  return DEFAULT_INVENTORY;
}

export async function updateInventorySettings(payload: InventorySettings) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  try {
    const { tenantId, role } = await getTenantInfo(supabase, user.id);
    if (role !== 'owner' && role !== 'admin') return { error: 'Insufficient permissions' };

    const { data: existing } = await supabase
      .from('tenant_settings')
      .select('settings_data')
      .eq('tenant_id', tenantId)
      .maybeSingle();
    const currentData = (existing?.settings_data as Record<string, unknown>) || {};
    const updatedData = { ...currentData, inventory_settings: payload };

    const { error } = await supabase.from('tenant_settings').upsert(
      {
        tenant_id: tenantId,
        low_stock_threshold: payload.lowStockThreshold,
        settings_data: updatedData,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'tenant_id' }
    );

    if (error) throw error;
    revalidatePath('/dashboard/settings/inventory');
    return { success: true };
  } catch (err) {
    console.error('Error updating inventory settings:', err);
    return { error: 'Failed to update inventory settings' };
  }
}

export async function getPaymentSettings(): Promise<PaymentSettings> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return DEFAULT_PAYMENTS;

  try {
    const { tenantId } = await getTenantInfo(supabase, user.id);
    const { data } = await supabase
      .from('tenant_settings')
      .select('store_currency, settings_data')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    const currentCurrency = data?.store_currency || 'GHS';
    const raw = (data?.settings_data as Record<string, unknown> | null)?.payment_settings as
      Partial<PaymentSettings> | undefined;

    if (raw && typeof raw === 'object') {
      // Merge structured fields with defaults to guarantee all keys exist
      return {
        ...DEFAULT_PAYMENTS,
        ...raw,
        currency: raw.currency || currentCurrency,
        methods: {
          ...DEFAULT_PAYMENTS.methods,
          ...(raw.methods || {}),
          // support legacy toggles if methods not populated
          mobileMoney:
            raw.methods?.mobileMoney ?? (raw.enableMtnMomo || raw.enableTelecelCash || raw.enableAtMoney) ?? true,
          card: raw.methods?.card ?? raw.enableCards ?? false,
          cash: raw.methods?.cash ?? raw.enableCod ?? true,
        },
        p2pAccounts: Array.isArray(raw.p2pAccounts)
          ? raw.p2pAccounts
          : raw.momoDetails?.mtnNumber || raw.bankDetails?.accountNumber
            ? [
                ...(raw.momoDetails?.mtnNumber
                  ? [
                      {
                        id: 'momo-1',
                        type: 'mtn_momo' as const,
                        providerName: 'MTN Mobile Money',
                        accountNumber: raw.momoDetails.mtnNumber,
                        accountName: raw.momoDetails.mtnAccountName || '',
                        isPrimary: true,
                      },
                    ]
                  : []),
                ...(raw.bankDetails?.accountNumber
                  ? [
                      {
                        id: 'bank-1',
                        type: 'bank' as const,
                        providerName: raw.bankDetails.bankName || 'Bank Account',
                        accountNumber: raw.bankDetails.accountNumber,
                        accountName: raw.bankDetails.accountName || '',
                        bankBranch: raw.bankDetails.branch || '',
                      },
                    ]
                  : []),
              ]
            : [],
        momoDetails: {
          ...DEFAULT_PAYMENTS.momoDetails,
          ...(raw.momoDetails || {}),
        },
        bankDetails: {
          ...DEFAULT_PAYMENTS.bankDetails,
          ...(raw.bankDetails || {}),
        },
        recording: {
          ...DEFAULT_PAYMENTS.recording,
          ...(raw.recording || {}),
        },
        supplierPayments: {
          ...DEFAULT_PAYMENTS.supplierPayments,
          ...(raw.supplierPayments || {}),
        },
        providers: {
          ...DEFAULT_PAYMENTS.providers,
          ...(raw.providers
            ? Object.fromEntries(
                Object.entries(raw.providers).map(([k, v]) => [
                  k,
                  {
                    ...v,
                    secretKey: v && typeof v === 'object' && 'secretKey' in v && v.secretKey ? maskSecret(v.secretKey as string) : undefined,
                  },
                ])
              )
            : {}),
        },
      };
    }

    return {
      ...DEFAULT_PAYMENTS,
      currency: currentCurrency,
    };
  } catch (err) {
    console.error('Error fetching payment settings:', err);
    return DEFAULT_PAYMENTS;
  }
}

export async function updatePaymentSettings(payload: PaymentSettings) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  try {
    const { tenantId, role } = await getTenantInfo(supabase, user.id);
    if (role !== 'owner' && role !== 'admin') return { error: 'Insufficient permissions' };

    const { data: existing } = await supabase
      .from('tenant_settings')
      .select('settings_data')
      .eq('tenant_id', tenantId)
      .maybeSingle();
    const currentData = (existing?.settings_data as Record<string, unknown>) || {};
    const existingPaymentSettings = (currentData.payment_settings as PaymentSettings | undefined);
    const existingProviders = existingPaymentSettings?.providers || {};

    const sanitizedProviders = payload.providers
      ? Object.fromEntries(
          Object.entries(payload.providers).map(([providerKey, config]) => {
            const existingSecret = (existingProviders as Record<string, { secretKey?: string }>)[providerKey]?.secretKey;
            let secretToStore = config.secretKey;

            // If secret is masked or untouched, preserve existing encrypted secret
            if (secretToStore && secretToStore.includes('••••')) {
              secretToStore = existingSecret;
            } else if (secretToStore) {
              // Encrypt new secret with AES-256-GCM
              secretToStore = encryptSecret(secretToStore);
            }

            return [
              providerKey,
              {
                ...config,
                secretKey: secretToStore,
              },
            ];
          })
        )
      : payload.providers;

    const payloadToStore: PaymentSettings = {
      ...payload,
      providers: sanitizedProviders as PaymentSettings['providers'],
    };

    const updatedData = { ...currentData, payment_settings: payloadToStore };

    const { error } = await supabase.from('tenant_settings').upsert(
      {
        tenant_id: tenantId,
        store_currency: payload.currency || 'GHS',
        settings_data: updatedData,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'tenant_id' }
    );

    if (error) throw error;
    revalidatePath('/dashboard/settings/payments');
    return { success: true };
  } catch (err) {
    console.error('Error updating payment settings:', err);
    return { error: 'Failed to update payment settings' };
  }
}
