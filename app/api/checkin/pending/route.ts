import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

/**
 * GET /api/checkin/pending?characterId=xxx
 *
 * Returns the most recent unread check-in message for this user × character.
 * Also marks it as opened immediately so it only shows once.
 *
 * Called by ChatInterface on mount after existing messages are loaded.
 */
export async function GET(req: NextRequest) {
  const characterId = req.nextUrl.searchParams.get('characterId')
  if (!characterId) {
    return NextResponse.json({ pending: null })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ pending: null })

  // Fetch the most recent unread check-in for this user + character
  const { data: checkin } = await supabase
    .from('checkin_logs')
    .select('id, message, sent_at, character_id')
    .eq('user_id', user.id)
    .eq('character_id', characterId)
    .eq('opened', false)
    .order('sent_at', { ascending: false })
    .limit(1)
    .single()

  if (!checkin) return NextResponse.json({ pending: null })

  // Mark as opened (fire-and-forget)
  const adminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (adminUrl && adminKey) {
    const admin = createAdminClient(adminUrl, adminKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    admin
      .from('checkin_logs')
      .update({ opened: true, opened_at: new Date().toISOString() })
      .eq('id', checkin.id)
      .then(() => {})
  } else {
    // Fallback: mark via user's own session (RLS allows SELECT only, so this might fail)
    supabase
      .from('checkin_logs')
      .update({ opened: true, opened_at: new Date().toISOString() })
      .eq('id', checkin.id)
      .then(() => {})
  }

  return NextResponse.json({
    pending: {
      id: checkin.id,
      message: checkin.message,
      sentAt: checkin.sent_at,
    },
  })
}
