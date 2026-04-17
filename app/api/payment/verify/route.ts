/**
 * POST /api/payment/verify
 * Called after user enters their UPI reference number post-payment.
 * Submits reference to UROPay → polls for COMPLETED status → activates trial.
 */
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { updateOrderWithReference, getOrderStatus } from '@/lib/payment/uropay'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { uroPayOrderId, referenceNumber } = await request.json()

    if (!uroPayOrderId || !referenceNumber) {
      return NextResponse.json(
        { error: 'Order ID aur UPI reference number dono chahiye' },
        { status: 400 }
      )
    }

    // Check this order belongs to the user
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('europay_order_id', uroPayOrderId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!sub) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (sub.status === 'active') {
      return NextResponse.json({ success: true, message: 'Already active!' })
    }

    // Submit UPI reference to UROPay
    const updateResult = await updateOrderWithReference({ uroPayOrderId, referenceNumber })

    if (!updateResult.success) {
      return NextResponse.json(
        { error: 'Reference number update nahi hua. Sahi number daalo jaan!' },
        { status: 422 }
      )
    }

    // Poll status (UROPay companion app needed for instant verification)
    // Poll 3 times with 2s gap
    let orderStatus = 'UPDATED'
    for (let i = 0; i < 3; i++) {
      await new Promise(r => setTimeout(r, 2000))
      orderStatus = await getOrderStatus(uroPayOrderId)
      if (orderStatus === 'COMPLETED') break
    }

    if (orderStatus === 'COMPLETED') {
      await activateTrial(user.id, uroPayOrderId, sub.id, supabase)
      return NextResponse.json({
        success: true,
        status: 'COMPLETED',
        message: 'Trial activate ho gaya! Enjoy karo 🎉',
      })
    }

    // Payment reference submitted but not yet confirmed by SMS
    return NextResponse.json({
      success: true,
      status: orderStatus,
      message: 'Reference submit ho gaya! Confirmation mein thoda waqt lagega ✨',
      pending: true,
    })
  } catch (error) {
    console.error('[Payment Verify]', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}

/**
 * GET /api/payment/verify?orderId=xxx
 * Client-side polling for order status (no auth needed per UROPay docs)
 */
export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get('orderId')
  if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 })

  try {
    const status = await getOrderStatus(orderId)

    if (status === 'COMPLETED') {
      // Activate via service role
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('id, status')
          .eq('europay_order_id', orderId)
          .eq('user_id', user.id)
          .maybeSingle()

        if (sub && sub.status !== 'active') {
          await activateTrial(user.id, orderId, sub.id, supabase)
        }
      }
    }

    return NextResponse.json({ status })
  } catch {
    return NextResponse.json({ status: 'UNKNOWN' })
  }
}

type Supabase = Awaited<ReturnType<typeof createClient>>

async function activateTrial(userId: string, orderId: string, subId: string, supabase: Supabase) {
  const now       = new Date()
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  await Promise.all([
    supabase.from('subscriptions').update({
      status:            'active',
      trial_started_at:  now.toISOString(),
      trial_expires_at:  expiresAt.toISOString(),
      current_period_end: expiresAt.toISOString(),
      updated_at:        now.toISOString(),
    }).eq('id', subId),

    supabase.from('profiles').update({
      plan:              'trial',
      trial_expires_at:  expiresAt.toISOString(),  // ← critical: needed by checkUsageLimit
      tokens:            70,
      images_today:      0,
      call_seconds_today: 0,
      tokens_today:       0,
      updated_at:        now.toISOString(),
    }).eq('id', userId),
  ])

  console.log(`[UROPay] ✅ Trial activated for ${userId} → expires ${expiresAt.toISOString()}`)
}
