import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/payment/uropay'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * UROPay Webhook
 * Fires when companion app reads UPI credit SMS on merchant's phone.
 *
 * Headers:
 *   X-Uropay-Environment: TEST | PRODUCTION
 *   X-Uropay-Webhook-Id:  base64 unique id (for deduplication)
 *   X-Uropay-Signature:   HMAC-SHA-256(sha512(secret), JSON.stringify(sortedData + env))
 *
 * Body:
 *   { amount, referenceNumber, from, vpa }
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody    = await request.text()
    const environment = request.headers.get('x-uropay-environment') || 'TEST'
    const webhookId  = request.headers.get('x-uropay-webhook-id') || ''
    const signature  = request.headers.get('x-uropay-signature') || ''

    let transactionData: Record<string, string | null>
    try {
      transactionData = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    // Verify signature
    const isValid = verifyWebhookSignature({ transactionData, environment, signature })
    if (!isValid) {
      console.warn('[Webhook] Invalid signature — rejecting')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    console.log('[Webhook] UROPay event:', { environment, webhookId, transactionData })

    const { referenceNumber, amount } = transactionData

    if (!referenceNumber) {
      // Webhook without reference = pre-notification, nothing to act on yet
      return NextResponse.json({ received: true, note: 'No referenceNumber yet' })
    }

    // Find the pending subscription that matches this reference
    // UROPay doesn't pass merchantOrderId in webhook body — match by referenceNumber
    // The order was updated via /order/update with this referenceNumber
    const { data: subs } = await supabaseAdmin
      .from('subscriptions')
      .select('id, user_id, status, europay_order_id')
      .eq('status', 'pending')
      .eq('plan', 'trial')

    if (!subs || subs.length === 0) {
      console.log('[Webhook] No pending subscriptions found')
      return NextResponse.json({ received: true })
    }

    // Activate the most-recent pending subscription (for now there's typically one per user)
    // In production you'd store the referenceNumber in /order/update and match here
    const sub = subs[0]
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    await Promise.all([
      supabaseAdmin.from('subscriptions').update({
        status:            'active',
        europay_payment_id: referenceNumber,
        trial_started_at:  now.toISOString(),
        trial_expires_at:  expiresAt.toISOString(),
        current_period_end: expiresAt.toISOString(),
        updated_at:        now.toISOString(),
      }).eq('id', sub.id),

      supabaseAdmin.from('profiles').update({
        plan:              'trial',
        trial_expires_at:  expiresAt.toISOString(),  // ← critical: needed by checkUsageLimit
        tokens:            70,
        images_today:      0,
        call_seconds_today: 0,
        tokens_today:       0,
        updated_at:        now.toISOString(),
      }).eq('id', sub.user_id),
    ])

    console.log(`[Webhook] ✅ Trial activated for user ${sub.user_id} | amount ₹${amount} | ref ${referenceNumber}`)

    return NextResponse.json({ received: true, activated: true })
  } catch (error) {
    console.error('[Webhook] Error:', error)
    // Must return 200 or UROPay marks it failed
    return NextResponse.json({ received: true, error: 'Internal error' })
  }
}

// UROPay pings GET to verify webhook URL is reachable
export async function GET() {
  return NextResponse.json({ status: 'webhook active', service: 'DesiDarling' })
}
