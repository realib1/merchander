import { getURL } from '@/utils/url';
import crypto from 'crypto';

export interface HubtelPromptParams {
  customerPhone: string;
  amount: number;
  clientReference: string;
  description: string;
  merchantAccountOrPosId?: string;
  clientId?: string;
  clientSecret?: string;
  callbackUrl?: string;
}

export interface HubtelPromptResponse {
  responseCode: string;
  status: string;
  data?: {
    transactionId?: string;
    clientReference: string;
    amount: number;
    charges?: number;
    description?: string;
  };
  message?: string;
}

export interface HubtelStatusResponse {
  responseCode: string;
  status: string;
  data?: {
    transactionId: string;
    clientReference: string;
    amount: number;
    charges: number;
    status: 'Success' | 'Pending' | 'Failed';
  };
}

/**
 * Normalizes phone number to 10-digit format for Hubtel Direct MoMo Prompt (e.g. 0244123456)
 */
export function formatPhoneForHubtel(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('233') && digits.length === 12) {
    return '0' + digits.substring(3);
  }
  return digits;
}

/**
 * Validates Hubtel Basic Auth / webhook authorization header.
 * Fails closed: a missing header or unconfigured credentials never authenticate.
 */
export function validateHubtelAuth(
  authHeader: string | null,
  expectedClientId?: string,
  expectedClientSecret?: string
): boolean {
  if (!authHeader || !expectedClientId || !expectedClientSecret) return false;

  try {
    const expected = 'Basic ' + Buffer.from(`${expectedClientId}:${expectedClientSecret}`).toString('base64');
    const received = Buffer.from(authHeader);
    const expectedBuffer = Buffer.from(expected);

    // Compare in constant time so a wrong header cannot be narrowed byte by byte.
    if (received.length !== expectedBuffer.length) return false;
    return crypto.timingSafeEqual(received, expectedBuffer);
  } catch (err) {
    console.error('Error validating Hubtel auth:', err);
    return false;
  }
}

/**
 * Requests a direct USSD Prompt on the buyer's Mobile Money phone via Hubtel Direct Debit API
 */
export async function requestHubtelMobileMoneyPrompt(params: HubtelPromptParams): Promise<HubtelPromptResponse> {
  const clientId = params.clientId;
  const clientSecret = params.clientSecret;
  const merchantAccount = params.merchantAccountOrPosId;

  if (!clientId || !clientSecret) {
    throw new Error('Hubtel API credentials (Client ID / Secret) are not configured for this tenant.');
  }

  const normalizedPhone = formatPhoneForHubtel(params.customerPhone);
  const authHeader = 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const payload = {
    CustomerName: 'Store Customer',
    CustomerMsisdn: normalizedPhone,
    CustomerEmail: '',
    Channel: 'mobilemoney',
    Amount: params.amount,
    PrimaryCallbackUrl: params.callbackUrl || `${getURL()}/api/webhooks/hubtel`,
    Description: params.description,
    ClientReference: params.clientReference,
  };

  const endpoint = merchantAccount
    ? `https://rmp.hubtel.com/merchantaccount/merchants/${merchantAccount}/receive/mobilemoney`
    : 'https://api-merchant.hubtel.com/v1/merchantaccount/onlinecheckout/invoice/create';

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = (await res.json()) as HubtelPromptResponse;
  return data;
}

/**
 * Checks transaction status via Hubtel API
 */
export async function checkHubtelTransactionStatus(
  clientReference: string,
  customClientId?: string,
  customClientSecret?: string
): Promise<HubtelStatusResponse> {
  const clientId = customClientId;
  const clientSecret = customClientSecret;

  if (!clientId || !clientSecret) {
    throw new Error('Hubtel API credentials are not configured for this tenant.');
  }

  const authHeader = 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch(
    `https://api-merchant.hubtel.com/v1/merchantaccount/transactions/status?clientReference=${encodeURIComponent(
      clientReference
    )}`,
    {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    }
  );

  const data = (await res.json()) as HubtelStatusResponse;
  return data;
}
