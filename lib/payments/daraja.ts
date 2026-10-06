// lib/payments/daraja.ts
//
// Minimal Safaricom Daraja client: send an M-Pesa STK push, ask what
// happened to one, and read the callback Safaricom posts back.
//
// ENV VARS
//   DARAJA_ENV              "sandbox" (default) or "live"
//   DARAJA_CONSUMER_KEY     from your Daraja app
//   DARAJA_CONSUMER_SECRET  from your Daraja app
//   DARAJA_SHORTCODE        sandbox: 174379. Live Paybill: the Paybill number.
//                           Live Till: the store / head-office number Safaricom gave you.
//   DARAJA_PARTY_B          live Till only: the Till number itself. Defaults to DARAJA_SHORTCODE.
//   DARAJA_PASSKEY          sandbox: the public test passkey from the Daraja portal. Live: yours.
//   DARAJA_TRANSACTION_TYPE "CustomerPayBillOnline" (default, Paybill)
//                           or "CustomerBuyGoodsOnline" (Till)
//   DARAJA_CALLBACK_SECRET  any long random string; appended to the callback URL so
//                           only requests that know it are accepted
//   NEXT_PUBLIC_SITE_URL    public https base URL — Safaricom must be able to reach it
//                           (a localhost URL will never receive callbacks)

export class DarajaError extends Error {}

type DarajaConfig = {
  baseUrl: string;
  shortcode: string;
  partyB: string;
  passkey: string;
  key: string;
  secret: string;
  transactionType: 'CustomerPayBillOnline' | 'CustomerBuyGoodsOnline';
};

function getConfig(): DarajaConfig {
  const live = process.env.DARAJA_ENV === 'live';
  const shortcode = process.env.DARAJA_SHORTCODE;
  const passkey = process.env.DARAJA_PASSKEY;
  const key = process.env.DARAJA_CONSUMER_KEY;
  const secret = process.env.DARAJA_CONSUMER_SECRET;

  if (!shortcode || !passkey || !key || !secret) {
    throw new DarajaError('M-Pesa is not configured on the server.');
  }

  return {
    baseUrl: live ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke',
    shortcode,
    partyB: process.env.DARAJA_PARTY_B || shortcode,
    passkey,
    key,
    secret,
    transactionType:
      process.env.DARAJA_TRANSACTION_TYPE === 'CustomerBuyGoodsOnline'
        ? 'CustomerBuyGoodsOnline'
        : 'CustomerPayBillOnline',
  };
}

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://hustlecare.net'
  ).replace(/\/$/, '');
}

// ── Access token (cached until shortly before it expires) ────────────────────

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(cfg: DarajaConfig): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.value;

  const res = await fetch(`${cfg.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${cfg.key}:${cfg.secret}`).toString('base64')}`,
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new DarajaError(`Could not get an M-Pesa access token (HTTP ${res.status}).`);

  const data = (await res.json()) as { access_token?: string; expires_in?: string | number };
  if (!data.access_token) throw new DarajaError('M-Pesa returned no access token.');

  const ttlMs = (Number(data.expires_in) || 3599) * 1000;
  cachedToken = { value: data.access_token, expiresAt: Date.now() + ttlMs - 60_000 };
  return data.access_token;
}

// Safaricom wants YYYYMMDDHHmmss. Using East Africa Time (UTC+3) keeps the
// timestamp consistent with what their servers expect.
function timestampEAT(): string {
  const d = new Date(Date.now() + 3 * 60 * 60 * 1000);
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}` +
    `${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}`
  );
}

function buildPassword(cfg: DarajaConfig, timestamp: string): string {
  return Buffer.from(`${cfg.shortcode}${cfg.passkey}${timestamp}`).toString('base64');
}

// ── Send the prompt ──────────────────────────────────────────────────────────

export interface StkPushResult {
  merchantRequestId: string;
  checkoutRequestId: string;
  customerMessage: string;
}

export async function initiateStkPush(args: {
  amount: number;
  /** 2547XXXXXXXX — no plus sign (see toMpesaMsisdn) */
  msisdn: string;
  accountReference: string;
  description: string;
}): Promise<StkPushResult> {
  const secretForUrl = process.env.DARAJA_CALLBACK_SECRET;
  if (!secretForUrl) throw new DarajaError('M-Pesa callback secret is not configured.');

  const cfg = getConfig();
  const token = await getAccessToken(cfg);
  const timestamp = timestampEAT();

  // The path deliberately avoids words like "mpesa", "safaricom" and
  // "daraja" — Safaricom has been known to reject callback URLs containing them.
  const callbackUrl = `${getSiteUrl()}/api/payments/stk-callback?secret=${encodeURIComponent(secretForUrl)}`;

  const res = await fetch(`${cfg.baseUrl}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      BusinessShortCode: cfg.shortcode,
      Password: buildPassword(cfg, timestamp),
      Timestamp: timestamp,
      TransactionType: cfg.transactionType,
      Amount: Math.ceil(args.amount),
      PartyA: args.msisdn,
      PartyB: cfg.partyB,
      PhoneNumber: args.msisdn,
      CallBackURL: callbackUrl,
      AccountReference: args.accountReference.slice(0, 12),
      TransactionDesc: args.description.slice(0, 13),
    }),
    cache: 'no-store',
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, string | undefined>;

  if (!res.ok || data.ResponseCode !== '0' || !data.CheckoutRequestID) {
    throw new DarajaError(
      data.errorMessage || data.ResponseDescription || `M-Pesa request failed (HTTP ${res.status}).`,
    );
  }

  return {
    merchantRequestId: data.MerchantRequestID ?? '',
    checkoutRequestId: data.CheckoutRequestID,
    customerMessage: data.CustomerMessage ?? '',
  };
}

// ── Ask what happened (used when the callback is late or never arrives) ──────

export type StkQueryResult =
  | { state: 'success'; resultDesc: string }
  | { state: 'failed'; resultDesc: string }
  | { state: 'pending' };

export async function queryStkStatus(checkoutRequestId: string): Promise<StkQueryResult> {
  const cfg = getConfig();
  const token = await getAccessToken(cfg);
  const timestamp = timestampEAT();

  const res = await fetch(`${cfg.baseUrl}/mpesa/stkpushquery/v1/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      BusinessShortCode: cfg.shortcode,
      Password: buildPassword(cfg, timestamp),
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    }),
    cache: 'no-store',
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, string | undefined>;

  if (!res.ok) {
    // Safaricom answers "still being processed" with this error code.
    if (data.errorCode === '500.001.1001') return { state: 'pending' };
    throw new DarajaError(data.errorMessage || `M-Pesa status check failed (HTTP ${res.status}).`);
  }

  const resultDesc = data.ResultDesc ?? '';
  if (data.ResultCode === '0') return { state: 'success', resultDesc };
  if (data.ResultCode === undefined) return { state: 'pending' };
  return { state: 'failed', resultDesc };
}

// ── Read the callback Safaricom posts to us ──────────────────────────────────

export interface StkCallback {
  merchantRequestId: string;
  checkoutRequestId: string;
  resultCode: number;
  resultDesc: string;
  amount?: number;
  receiptNumber?: string;
  phone?: string;
}

export function parseStkCallback(body: unknown): StkCallback | null {
  const cb = (body as { Body?: { stkCallback?: Record<string, unknown> } } | null)?.Body?.stkCallback;
  if (!cb || typeof cb.CheckoutRequestID !== 'string') return null;

  const items = ((cb.CallbackMetadata as { Item?: { Name: string; Value?: string | number }[] } | undefined)
    ?.Item ?? []) as { Name: string; Value?: string | number }[];
  const pick = (name: string) => items.find((i) => i.Name === name)?.Value;

  const amount = pick('Amount');
  const receipt = pick('MpesaReceiptNumber');
  const phone = pick('PhoneNumber');

  return {
    merchantRequestId: String(cb.MerchantRequestID ?? ''),
    checkoutRequestId: cb.CheckoutRequestID,
    resultCode: Number(cb.ResultCode),
    resultDesc: String(cb.ResultDesc ?? ''),
    amount: amount !== undefined ? Number(amount) : undefined,
    receiptNumber: receipt !== undefined ? String(receipt) : undefined,
    phone: phone !== undefined ? String(phone) : undefined,
  };
}