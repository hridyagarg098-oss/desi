import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkUsageLimit, PLAN_LIMITS, type UsageProfile } from '@/lib/payment/limits'

/**
 * POST /api/call/track
 * Body: { seconds: number }
 * Increments call_seconds_today and returns remaining call time.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const authResult = await Promise.race([
      supabase.auth.getUser(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
    ])
    const user = authResult
      ? (authResult as Awaited<ReturnType<typeof supabase.auth.getUser>>).data?.user ?? null
      : null

    if (!user) {
      return NextResponse.json({ allowed: true, secondsLeft: 30, secondsTotal: 30, plan: 'guest' })
    }

    const { seconds = 1 } = await req.json().catch(() => ({ seconds: 1 }))

    const { data } = await supabase
      .from('profiles')
      .select('tokens, plan, images_today, call_seconds_today, tokens_today, usage_reset_at, trial_expires_at')
      .eq('id', user.id)
      .single()

    const profile = data as UsageProfile | null
    if (!profile) {
      return NextResponse.json({ allowed: true, secondsLeft: 30, secondsTotal: 30, plan: 'free' })
    }

    // Check limit BEFORE incrementing
    const check = checkUsageLimit(profile, 'call')
    if (!check.allowed) {
      return NextResponse.json(
        {
          allowed: false,
          secondsLeft: 0,
          secondsTotal: check.limit,
          secondsUsed: profile.call_seconds_today,
          plan: profile.plan,
          limitHit: check.reason,
          error: check.reason === 'trial_expired'
            ? '⏰ Trial expire ho gaya! ₹20 mein dobara subscribe karo.'
            : `📞 Aaj ka call time khatam! Free mein ${PLAN_LIMITS.free.call_seconds_per_day}s milta hai — Trial lo ₹20 mein, 5 min milega!`,
        },
        { status: 402 }
      )
    }

    // Increment
    const newSeconds = (profile.call_seconds_today ?? 0) + seconds
    await supabase.from('profiles')
      .update({ call_seconds_today: newSeconds })
      .eq('id', user.id)

    const plan = profile.plan ?? 'free'
    const totalAllowed = PLAN_LIMITS[plan]?.call_seconds_per_day ?? 30
    const secondsLeft = Math.max(0, totalAllowed - newSeconds)

    return NextResponse.json({
      allowed: true,
      secondsLeft,
      secondsTotal: totalAllowed,
      secondsUsed: newSeconds,
      plan,
    })
  } catch (err) {
    console.error('[Call Track]', err)
    return NextResponse.json({ allowed: true, secondsLeft: 30, secondsTotal: 30, plan: 'guest' })
  }
}

/**
 * GET /api/call/track
 * Returns current call usage without incrementing.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const authResult = await Promise.race([
      supabase.auth.getUser(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
    ])
    const user = authResult
      ? (authResult as Awaited<ReturnType<typeof supabase.auth.getUser>>).data?.user ?? null
      : null

    if (!user) {
      return NextResponse.json({ secondsLeft: 30, secondsTotal: 30, plan: 'guest' })
    }

    const { data } = await supabase
      .from('profiles')
      .select('plan, call_seconds_today, tokens, images_today, tokens_today, usage_reset_at, trial_expires_at')
      .eq('id', user.id)
      .single()

    const profile = data as UsageProfile | null
    if (!profile) return NextResponse.json({ secondsLeft: 30, secondsTotal: 30, plan: 'free' })

    const plan = profile.plan ?? 'free'
    const limits = PLAN_LIMITS[plan]
    const trialExpired = plan === 'trial' && profile.trial_expires_at
      ? new Date(profile.trial_expires_at) < new Date()
      : false

    return NextResponse.json({
      secondsLeft: Math.max(0, limits.call_seconds_per_day - (profile.call_seconds_today ?? 0)),
      secondsTotal: limits.call_seconds_per_day,
      secondsUsed: profile.call_seconds_today ?? 0,
      tokensLeft: profile.tokens ?? 0,
      tokensTotal: limits.tokens_per_day,
      imagesLeft: Math.max(0, limits.images_per_day - (profile.images_today ?? 0)),
      imagesTotal: limits.images_per_day,
      plan,
      trialExpired,
      trialExpiresAt: profile.trial_expires_at ?? null,
    })
  } catch (err) {
    console.error('[Call Track GET]', err)
    return NextResponse.json({ secondsLeft: 30, secondsTotal: 30, plan: 'guest' })
  }
}
