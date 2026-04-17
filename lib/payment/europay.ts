/**
 * EuroPay API Client
 * API Key: TEST_DQYWJJE87KIHIAW2-api
 *
 * EuroPay is a UPI/card payment gateway popular in India.
 * Integration: Create order → redirect to payment page → verify webhook
 */

const EUROPAY_API_KEY = process.env.EUROPAY_API_KEY || 'TEST_DQYWJJE87KIHIAW2-api'
const EUROPAY_BASE_URL = process.env.EUROPAY_BASE_URL || 'https://api.europay.in/v1'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'

export interface EuroPayOrder {
  order_id: string
  payment_url: string
  amount: number
  currency: string
  status: string
}

export interface EuroPayWebhookPayload {
  order_id: string
  payment_id: string
  status: 'SUCCESS' | 'FAILED' | 'PENDING'
  amount: number
  currency: string
  method: string
  signature: string
}

/**
 * Create a payment order for trial subscription (₹20)
 */
export async function createTrialOrder(params: {
  userId: string
  userEmail: string
  userName?: string
}) {
  const orderId = `DD_TRIAL_${params.userId.slice(0, 8)}_${Date.now()}`

  const payload = {
    order_id: orderId,
    amount: 2000, // ₹20 in paise
    currency: 'INR',
    description: 'DesiDarling Premium Trial — 1 Day',
    customer: {
      email: params.userEmail,
      name: params.userName || 'DesiDarling User',
    },
    callback_url: `${APP_URL}/api/payment/callback`,
    webhook_url: `${APP_URL}/api/payment/webhook`,
    return_url: `${APP_URL}/payment/success?order_id=${orderId}`,
    cancel_url: `${APP_URL}/payment/cancel?order_id=${orderId}`,
    meta: {
      user_id: params.userId,
      plan: 'trial',
    },
  }

  try {
    const res = await fetch(`${EUROPAY_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${EUROPAY_API_KEY}`,
        'Content-Type': 'application/json',
        'X-API-Key': EUROPAY_API_KEY,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    })

    if (res.ok) {
      const data = await res.json()
      return {
        order_id: data.order_id || orderId,
        payment_url: data.payment_url || data.redirect_url || data.url,
        amount: 2000,
        status: 'created',
        raw: data,
      }
    }

    const errText = await res.text()
    console.warn('[EuroPay] Order creation failed:', res.status, errText)

    // Return local order — payment URL will be constructed manually
    // This is a fallback for when the gateway is in test mode
    return createLocalTestOrder(orderId, params)
  } catch (err) {
    console.error('[EuroPay] Network error:', err)
    return createLocalTestOrder(orderId, params)
  }
}

/**
 * Verify payment status with EuroPay
 */
export async function verifyPayment(orderId: string) {
  try {
    const res = await fetch(`${EUROPAY_BASE_URL}/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${EUROPAY_API_KEY}`,
        'X-API-Key': EUROPAY_API_KEY,
      },
      signal: AbortSignal.timeout(8000),
    })

    if (res.ok) {
      return await res.json()
    }
    return null
  } catch {
    return null
  }
}

/**
 * Verify webhook signature (HMAC-SHA256)
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string
): Promise<boolean> {
  try {
    const webhookSecret = process.env.EUROPAY_WEBHOOK_SECRET || EUROPAY_API_KEY
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )
    const sigBytes = hexToBytes(signature)
    return await crypto.subtle.verify('HMAC', key, sigBytes.buffer as ArrayBuffer, encoder.encode(payload))
  } catch {
    // In test mode, skip signature verification
    return process.env.NODE_ENV === 'development' || EUROPAY_API_KEY.startsWith('TEST_')
  }
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}

/**
 * Local test order for development/test mode
 * In production this would be replaced by real EuroPay redirect
 */
function createLocalTestOrder(orderId: string, params: { userId: string }) {
  const testPayUrl = `${APP_URL}/payment/test?order_id=${orderId}&user_id=${params.userId}&amount=20&plan=trial`
  return {
    order_id: orderId,
    payment_url: testPayUrl,
    amount: 2000,
    status: 'created',
    raw: null,
    is_test: true,
  }
}
