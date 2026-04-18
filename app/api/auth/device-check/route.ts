import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const MAX_ACCOUNTS_PER_DEVICE = 2

/**
 * Admin client uses the service role key to bypass RLS.
 * Required here because we need to count ALL user_ids for a device_id
 * (not just the current user's row which is all RLS would allow).
 */
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    console.warn('[DeviceCheck] SUPABASE_SERVICE_ROLE_KEY not set — limit check skipped')
    return null
  }
  return createAdminClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/**
 * POST /api/auth/device-check
 * Called immediately after a successful login to enforce the device account limit.
 *
 * Body: { deviceId: string }
 *
 * Response:
 *   200 { allowed: true }
 *   403 { allowed: false, error: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const deviceId: string = body.deviceId || ''

    // No deviceId = can't enforce (let through gracefully)
    if (!deviceId) {
      console.warn('[DeviceCheck] No deviceId provided — skipping limit check')
      return NextResponse.json({ allowed: true })
    }

    // Get the session of the user who just logged in
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const admin = getAdminClient()
    if (!admin) {
      // Service key not configured — fail open so login still works
      return NextResponse.json({ allowed: true })
    }

    // Get the IP address for logging purposes
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown'

    // Fetch all user_ids that have ever logged in from this device
    const { data: rows, error } = await admin
      .from('device_registrations')
      .select('user_id')
      .eq('device_id', deviceId)

    if (error) {
      console.error('[DeviceCheck] DB query error:', error.message)
      return NextResponse.json({ allowed: true }) // fail open
    }

    const deviceUserIds = (rows ?? []).map((r: { user_id: string }) => r.user_id)
    const uniqueUserIds = [...new Set(deviceUserIds)]
    const alreadyRegistered = uniqueUserIds.includes(user.id)

    // Enforce limit: block if at capacity and this is a NEW account on the device
    if (!alreadyRegistered && uniqueUserIds.length >= MAX_ACCOUNTS_PER_DEVICE) {
      console.warn(
        `[DeviceCheck] Blocked: device=${deviceId.slice(0, 8)}… already has ${uniqueUserIds.length} accounts`
      )
      return NextResponse.json(
        {
          allowed: false,
          error: `This device already has ${MAX_ACCOUNTS_PER_DEVICE} accounts linked to it. Please sign in with one of your existing accounts, or use a different device.`,
        },
        { status: 403 }
      )
    }

    // Register or refresh this device → user pair
    await admin.from('device_registrations').upsert(
      {
        device_id: deviceId,
        user_id: user.id,
        ip_address: ip,
        last_seen: new Date().toISOString(),
      },
      { onConflict: 'device_id,user_id' }
    )

    console.log(
      `[DeviceCheck] ✅ Registered device=${deviceId.slice(0, 8)}… user=${user.id.slice(0, 8)}… ip=${ip}`
    )

    return NextResponse.json({
      allowed: true,
      accountsOnDevice: uniqueUserIds.length + (alreadyRegistered ? 0 : 1),
    })
  } catch (err) {
    console.error('[DeviceCheck] Unhandled error:', err)
    return NextResponse.json({ allowed: true }) // always fail open — never block legitimate logins
  }
}
