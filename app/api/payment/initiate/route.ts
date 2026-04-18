import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { generateOrder } from '@/lib/payment/uropay'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Login karein pehle jaan! 🌸' },
        { status: 401 }
      )
    }

    const { plan } = await request.json()

    if (plan !== 'trial') {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Check if user already has an active non-expired trial
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id, plan, status, trial_expires_at')
      .eq('user_id', user.id)
      .eq('plan', 'trial')
      .eq('status', 'active')
      .maybeSingle()

    if (existingSub) {
      const expired = existingSub.trial_expires_at
        ? new Date(existingSub.trial_expires_at) < new Date()
        : false

      if (!expired) {
        return NextResponse.json(
          { error: 'Aapka trial already active hai jaan! 💕' },
          { status: 409 }
        )
      }
    }

    // Get user profile for customer details
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle()

    const merchantOrderId = `DD_TRIAL_${user.id.slice(0, 8)}_${Date.now()}`
    const customerName    = (profile as { full_name?: string } | null)?.full_name || 'Velvet User'

    // Create UROPay order — returns QR code for UPI payment
    const order = await generateOrder({
      merchantOrderId,
      amount:          20,  // ₹20 trial
      customerName,
      customerEmail:   user.email || '',
      transactionNote: 'Velvet Premium Trial — 1 Day',
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Payment shuru nahi hua. Dobara try karo! 🙏' },
        { status: 500 }
      )
    }

    // Save pending subscription record
    await supabase.from('subscriptions').upsert(
      {
        user_id:           user.id,
        plan:              'trial',
        status:            'pending',
        europay_order_id:  order.uroPayOrderId,   // reusing column
        amount_inr:        20,
        updated_at:        new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

    return NextResponse.json({
      uroPayOrderId:  order.uroPayOrderId,
      merchantOrderId,
      qrCode:         order.qrCode,        // base64 PNG — show to user
      upiString:      order.upiString,     // deep-link for mobile
      amountInRupees: order.amountInRupees,
    })
  } catch (error) {
    console.error('[Payment Initiate]', error)
    return NextResponse.json(
      { error: 'Kuch problem hai, try karein dobara!' },
      { status: 500 }
    )
  }
}
