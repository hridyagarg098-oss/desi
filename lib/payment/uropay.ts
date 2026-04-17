/**
 * UROPay API Client — https://app.uropay.me
 * API URL: https://api.uropay.me
 *
 * Auth:
 *   X-API-KEY: your api key
 *   Authorization: Bearer sha512(your_secret)
 *
 * Flow:
 *   1. POST /order/generate  → get uroPayOrderId + QR code
 *   2. Show QR to user, user pays via UPI
 *   3. User enters UPI reference number on your site
 *   4. PATCH /order/update   → confirm payment reference
 *   5. GET  /order/status    → poll for COMPLETED status
 *   6. Webhook fires automatically when companion app reads SMS
 */

import { createHash, createHmac } from 'crypto'

const UROPAY_API_KEY    = process.env.UROPAY_API_KEY    || 'TEST_DQYWJJE87KIHIAW2-api'
const UROPAY_SECRET     = process.env.UROPAY_SECRET     || ''
const UROPAY_BASE_URL   = 'https://api.uropay.me'

/** sha512 hash the secret for Authorization header */
function hashSecret(secret: string): string {
  return createHash('sha512').update(secret).digest('hex')
}

/** Standard headers for all UROPay requests */
function getHeaders(): Record<string, string> {
  return {
    'Content-Type':    'application/json',
    'Accept':          'application/json',
    'X-API-KEY':       UROPAY_API_KEY,
    'Authorization':   `Bearer ${hashSecret(UROPAY_SECRET)}`,
    'Accept-Encoding': 'gzip, deflate, br',
  }
}

export interface UroPayOrder {
  uroPayOrderId:  string
  orderStatus:    string
  upiString:      string
  qrCode:         string   // base64 PNG data URI
  amountInRupees: string
  merchantOrderId: string
}

export interface UroPayWebhookPayload {
  amount:          string
  referenceNumber: string
  from:            string | null
  vpa:             string | null
  // Added by our webhook handler via header
  environment?:    'TEST' | 'PRODUCTION'
  uroPayOrderId?:  string
}

/**
 * Step 1: Generate a UPI order — returns QR code for user to scan
 */
export async function generateOrder(params: {
  merchantOrderId: string
  amount:          number  // in rupees (₹20 = 20)
  customerName:    string
  customerEmail:   string
  transactionNote: string
}): Promise<UroPayOrder | null> {
  try {
    const body = {
      amount:          params.amount,   // UROPay accepts rupees, NOT paise
      merchantOrderId: params.merchantOrderId,
      customerName:    params.customerName,
      customerEmail:   params.customerEmail,
      transactionNote: params.transactionNote,
      emailTrigger:    'ON_COMPLETION',
    }

    const res = await fetch(`${UROPAY_BASE_URL}/order/generate`, {
      method:  'POST',
      headers: getHeaders(),
      body:    JSON.stringify(body),
      signal:  AbortSignal.timeout(15000),
    })

    const json = await res.json()
    console.log('[UROPay] Generate order response:', json)

    if (json.code === 200 && json.data?.uroPayOrderId) {
      return {
        ...json.data,
        merchantOrderId: params.merchantOrderId,
      }
    }

    console.warn('[UROPay] Order generation failed:', json)
    return null
  } catch (err) {
    console.error('[UROPay] generateOrder error:', err)
    return null
  }
}

/**
 * Step 2: Update order with UPI reference number provided by customer
 */
export async function updateOrderWithReference(params: {
  uroPayOrderId:   string
  referenceNumber: string
}): Promise<{ success: boolean; status: string }> {
  try {
    const res = await fetch(`${UROPAY_BASE_URL}/order/update`, {
      method:  'PATCH',
      headers: getHeaders(),
      body:    JSON.stringify({
        uroPayOrderId:   params.uroPayOrderId,
        referenceNumber: params.referenceNumber,
      }),
      signal: AbortSignal.timeout(10000),
    })

    const json = await res.json()
    console.log('[UROPay] Update order response:', json)

    return {
      success: json.code === 200,
      status:  json.data?.orderStatus || 'UNKNOWN',
    }
  } catch (err) {
    console.error('[UROPay] updateOrder error:', err)
    return { success: false, status: 'ERROR' }
  }
}

/**
 * Step 3: Poll order status (no auth header needed — safe for client polling)
 */
export async function getOrderStatus(uroPayOrderId: string): Promise<string> {
  try {
    const res = await fetch(`${UROPAY_BASE_URL}/order/status/${uroPayOrderId}`, {
      method:  'GET',
      headers: {
        'Accept':          'application/json',
        'Content-Type':    'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
        'X-API-KEY':       UROPAY_API_KEY,  // no Authorization needed here
      },
      signal: AbortSignal.timeout(8000),
    })

    const json = await res.json()
    return json.data?.orderStatus || 'UNKNOWN'
  } catch {
    return 'UNKNOWN'
  }
}

/**
 * Verify UROPay webhook signature
 * Signature = HMAC-SHA-256(sha512(secret), JSON.stringify(sortedData + environment))
 */
export function verifyWebhookSignature(params: {
  transactionData: Record<string, string | null>
  environment:     string
  signature:       string
}): boolean {
  try {
    const secret = UROPAY_SECRET
    const hashedSecret = hashSecret(secret)

    // Sort keys alphabetically for consistent signature
    const sortedData = Object.fromEntries(
      Object.entries(params.transactionData).sort(([a], [b]) => a.localeCompare(b))
    )
    const payload = { ...sortedData, environment: params.environment }
    const payloadString = JSON.stringify(payload)

    const expectedSig = createHmac('sha256', hashedSecret)
      .update(payloadString)
      .digest('hex')

    return expectedSig === params.signature
  } catch {
    // In TEST mode with TEST_ API key, allow without signature verification
    return UROPAY_API_KEY.startsWith('TEST_')
  }
}
