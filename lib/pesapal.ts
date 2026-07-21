// lib/pesapal.ts
// Pesapal API 3.0 integration. Docs: https://developer.pesapal.com/

const PESAPAL_BASE_URL =
  process.env.PESAPAL_ENV === 'live'
    ? 'https://pay.pesapal.com/v3'
    : 'https://cybqa.pesapal.com/pesapalv3' // sandbox

let cachedToken: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  // Pesapal tokens are short-lived (~5 min) — cache in-memory per server instance,
  // refresh with a small safety margin before expiry.
  if (cachedToken && cachedToken.expiresAt > Date.now() + 10_000) {
    return cachedToken.token
  }

  const res = await fetch(`${PESAPAL_BASE_URL}/api/Auth/RequestToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      consumer_key: process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
    }),
  })

  if (!res.ok) {
    throw new Error(`Pesapal auth failed: ${res.status} ${await res.text()}`)
  }

  const data = await res.json()
  if (!data.token) {
    throw new Error(`Pesapal auth returned no token: ${JSON.stringify(data)}`)
  }

  // 4-minute cache window is a conservative margin given the real token life is ~5 min.
  cachedToken = { token: data.token, expiresAt: Date.now() + 4 * 60_000 }
  return data.token
}

// Call this once (see scripts/register-pesapal-ipn.ts) and store the returned
// ipn_id in PESAPAL_IPN_ID. Re-run only if your callback URL changes.
export async function registerIPN(ipnUrl: string) {
  const token = await getAccessToken()
  const res = await fetch(`${PESAPAL_BASE_URL}/api/URLSetup/RegisterIPNURL`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ url: ipnUrl, ipn_notification_type: 'GET' }),
  })
  if (!res.ok) throw new Error(`IPN registration failed: ${res.status} ${await res.text()}`)
  return res.json() as Promise<{ ipn_id: string; url: string }>
}

export interface SubmitOrderParams {
  merchantReference: string // must be unique per submit attempt
  amount: number
  description: string
  callbackUrl: string // where the browser is redirected after payment
  notificationId: string // your PESAPAL_IPN_ID
  customerEmail: string
  customerPhone?: string
  firstName?: string
  lastName?: string
}

export async function submitOrder(params: SubmitOrderParams) {
  const token = await getAccessToken()

  const res = await fetch(`${PESAPAL_BASE_URL}/api/Transactions/SubmitOrderRequest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      id: params.merchantReference,
      currency: 'KES',
      amount: params.amount,
      description: params.description.slice(0, 100), // Pesapal limits description length
      callback_url: params.callbackUrl,
      notification_id: params.notificationId,
      billing_address: {
        email_address: params.customerEmail,
        phone_number: params.customerPhone || '',
        first_name: params.firstName || '',
        last_name: params.lastName || '',
        country_code: 'KE',
      },
    }),
  })

  if (!res.ok) {
    throw new Error(`Pesapal submit order failed: ${res.status} ${await res.text()}`)
  }

  const data = await res.json()
  // data.redirect_url    -> send the browser here to complete payment
  // data.order_tracking_id -> save this, it's how you check status later
  return data as {
    order_tracking_id: string
    merchant_reference: string
    redirect_url: string
    error: unknown
    status: string
  }
}

export async function getTransactionStatus(orderTrackingId: string) {
  const token = await getAccessToken()
  const res = await fetch(
    `${PESAPAL_BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
    { headers: { Accept: 'application/json', Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) {
    throw new Error(`Pesapal status check failed: ${res.status} ${await res.text()}`)
  }
  return res.json() as Promise<{
    payment_method: string
    amount: number
    status_code: number // 0=INVALID, 1=COMPLETED, 2=FAILED, 3=REVERSED
    status_description: string
    merchant_reference: string
    order_tracking_id: string
  }>
}

export const PESAPAL_STATUS = {
  INVALID: 0,
  COMPLETED: 1,
  FAILED: 2,
  REVERSED: 3,
} as const