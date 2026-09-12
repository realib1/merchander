import crypto from 'crypto';

export interface PaystackInitParams {
  email: string;
  amountInGhs: number;
  reference?: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
  channels?: Array<'card' | 'bank' | 'ussd' | 'qr' | 'mobile_money' | 'bank_transfer'>;
  secretKey?: string;
}

export interface PaystackInitResponse {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data?: {
    id: number;
    domain: string;
    status: 'success' | 'failed' | 'abandoned' | 'pending';
    reference: string;
    amount: number; // in pesewas
    gateway_response: string;
    paid_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata?: Record<string, unknown>;
    customer?: {
      id: number;
      first_name?: string;
      last_name?: string;
      email: string;
      phone?: string;
    };
    authorization?: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
      account_name?: string;
    };
  };
}

/**
 * Converts Ghana Cedis (GH₵) to Paystack Pesewas (e.g. GH₵ 250 -> 25000 pesewas)
 */
export function ghsToPesewas(amountInGhs: number): number {
  return Math.round(Number(amountInGhs) * 100);
}

/**
 * Converts Paystack Pesewas to Ghana Cedis (e.g. 25000 pesewas -> GH₵ 250.00)
 */
export function pesewasToGhs(amountInPesewas: number): number {
  return Number((Number(amountInPesewas) / 100).toFixed(2));
}

/**
 * Cryptographically validates the Paystack HMAC SHA-512 signature using constant-time equality check
 */
export function validatePaystackSignature(payloadString: string, signature: string, secretKey?: string): boolean {
  if (!secretKey || !signature) return false;

  try {
    const hash = crypto.createHmac('sha512', secretKey).update(payloadString).digest('hex');
    const signatureBuffer = Buffer.from(signature, 'hex');
    const hashBuffer = Buffer.from(hash, 'hex');

    if (signatureBuffer.length !== hashBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(signatureBuffer, hashBuffer);
  } catch (err) {
    console.error('Error validating Paystack signature:', err);
    return false;
  }
}

/**
 * Initializes a live Paystack transaction (Checkout URL & Reference)
 */
export async function initializePaystackTransaction(params: PaystackInitParams): Promise<PaystackInitResponse> {
  if (!params.secretKey) {
    throw new Error('Paystack secret key is not configured for this transaction.');
  }

  const reference = params.reference || `pst_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const amountInPesewas = ghsToPesewas(params.amountInGhs);

  const payload = {
    email: params.email,
    amount: amountInPesewas,
    currency: 'GHS',
    reference,
    callback_url: params.callbackUrl,
    metadata: params.metadata || {},
    channels: params.channels || ['card', 'mobile_money'],
  };

  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = (await res.json()) as PaystackInitResponse;
  return data;
}

/**
 * Verifies a Paystack transaction status server-to-server
 */
export async function verifyPaystackTransaction(
  reference: string,
  secretKey?: string
): Promise<PaystackVerifyResponse> {
  if (!secretKey) {
    throw new Error('Paystack secret key is not configured for this transaction.');
  }

  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  const data = (await res.json()) as PaystackVerifyResponse;
  return data;
}
