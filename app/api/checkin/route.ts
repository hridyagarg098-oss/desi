import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { PREMADE_CHARACTERS } from '@/types'
import { getCheckinConfig, buildFallbackCheckin, type CheckinContext } from '@/lib/ai/checkin-prompts'

// ── Admin client (service role bypasses RLS) ──────────────────────────────────
function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service role not configured')
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// ── Groq chat generation ──────────────────────────────────────────────────────
async function generateCheckinMessage(
  characterId: string,
  characterName: string,
  ctx: CheckinContext
): Promise<string> {
  const config = getCheckinConfig(characterId)
  if (!config) return buildFallbackCheckin(characterName, ctx)

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return buildFallbackCheckin(characterName, ctx)

  try {
    const ctrl = new AbortController()
    setTimeout(() => ctrl.abort(), 8000)

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: config.systemPrompt },
          { role: 'user', content: config.userPrompt(ctx) },
        ],
        max_tokens: 120,
        temperature: 0.85,
      }),
      signal: ctrl.signal,
    })

    if (!res.ok) {
      console.warn(`[Checkin] Groq error ${res.status} for ${characterId}`)
      return buildFallbackCheckin(characterName, ctx)
    }

    const data = await res.json()
    const msg = data.choices?.[0]?.message?.content?.trim()
    return msg || buildFallbackCheckin(characterName, ctx)
  } catch (err) {
    console.warn(`[Checkin] Groq fetch failed for ${characterId}:`, err)
    return buildFallbackCheckin(characterName, ctx)
  }
}

// ── Email sending via Resend ──────────────────────────────────────────────────
async function sendEmail(
  toEmail: string,
  characterName: string,
  message: string
): Promise<boolean> {
  const key = process.env.RESEND_API_KEY
  if (!key) return false

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; background: #0C0008; font-family: -apple-system, Georgia, serif; }
    .wrap { max-width: 520px; margin: 40px auto; background: #1A000F; border-radius: 20px; overflow: hidden; border: 1px solid rgba(196,147,74,0.20); }
    .header { background: linear-gradient(135deg, #9F1239, #7D0A2C); padding: 28px; text-align: center; }
    .logo { font-size: 24px; font-weight: bold; color: #F8EED8; letter-spacing: 1px; }
    .body { padding: 32px; }
    .message { font-size: 17px; line-height: 1.65; color: #F8EED8; white-space: pre-line; }
    .from { margin-top: 20px; font-size: 13px; color: rgba(248,238,216,0.45); }
    .cta { margin-top: 28px; }
    .cta a { display: inline-block; padding: 13px 28px; background: linear-gradient(135deg, #9F1239, #C4934A); color: white; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 14px; }
    .footer { padding: 20px 32px; border-top: 1px solid rgba(255,255,255,0.06); font-size: 11px; color: rgba(248,238,216,0.25); }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <div class="logo">❤️ Velvet</div>
    </div>
    <div class="body">
      <div class="message">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
      <div class="from">— ${characterName} on Velvet</div>
      <div class="cta">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://velvet.ai'}/explore">Open Velvet →</a>
      </div>
    </div>
    <div class="footer">
      You received this because you have an account on Velvet. 
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://velvet.ai'}/settings" style="color: rgba(248,238,216,0.35);">Manage notifications</a>
    </div>
  </div>
</body>
</html>`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${characterName} on Velvet <hello@${process.env.EMAIL_DOMAIN || 'velvet.ai'}>`,
        to: toEmail,
        subject: `${characterName} has been thinking about you 💌`,
        html,
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

// ── Main cron handler ─────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  // 1. Verify Vercel cron secret
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const timeStart = Date.now()
  const results: Array<{
    userId: string
    characterId: string
    delivery: string
    ok: boolean
  }> = []

  try {
    const admin = getAdmin()

    // 2. Find users who haven't chatted in 24h+ AND haven't received a check-in recently
    //    Use character_bonds.last_chat_at (set by chat API after each message)
    const { data: candidates, error: fetchErr } = await admin
      .from('character_bonds')
      .select(`
        user_id,
        character_id,
        bond_level,
        message_count,
        days_chatted,
        current_streak,
        last_chat_at
      `)
      .lt('last_chat_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .gt('message_count', 0)                   // Only real users who have chatted
      .not('last_chat_at', 'is', null)
      .limit(80)                                 // Process max 80 per run (avoid timeout)

    if (fetchErr) {
      console.error('[Checkin] Candidate fetch error:', fetchErr.message)
      return NextResponse.json({ error: fetchErr.message }, { status: 500 })
    }

    if (!candidates?.length) {
      return NextResponse.json({ message: 'No inactive users found', processed: 0 })
    }

    // 3. Filter out users who already received a check-in in the last 22h
    //    (prevents double send on the 2x daily cron)
    const { data: recentSent } = await admin
      .from('checkin_logs')
      .select('user_id, character_id')
      .gt('sent_at', new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString())

    const sentSet = new Set(
      (recentSent ?? []).map(
        (r: { user_id: string; character_id: string }) => `${r.user_id}::${r.character_id}`
      )
    )

    const toProcess = candidates.filter(
      (c: { user_id: string; character_id: string }) =>
        !sentSet.has(`${c.user_id}::${c.character_id}`)
    )

    if (!toProcess.length) {
      return NextResponse.json({ message: 'All inactive users already checked in recently', processed: 0 })
    }

    // 4. Fetch user emails in bulk
    const userIds = [...new Set(toProcess.map((c: { user_id: string }) => c.user_id))]
    const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 1000 })
    const emailMap: Record<string, string> = {}
    for (const u of authUsers?.users ?? []) {
      if (u.email) emailMap[u.id] = u.email
    }

    // 5. Process each candidate
    for (const candidate of toProcess) {
      const {
        user_id: userId,
        character_id: characterId,
        bond_level: bondLevel,
        message_count: messageCount,
        days_chatted: daysChatted,
        current_streak: currentStreak,
        last_chat_at: lastChatAt,
      } = candidate as {
        user_id: string; character_id: string; bond_level: number;
        message_count: number; days_chatted: number; current_streak: number;
        last_chat_at: string;
      }

      const character = PREMADE_CHARACTERS.find(c => c.id === characterId)
      if (!character) continue

      // Fetch memory facts for this user + character
      const { data: facts } = await admin
        .from('memory_facts')
        .select('fact')
        .eq('user_id', userId)
        .eq('character_id', characterId)
        .eq('is_active', true)
        .order('importance', { ascending: false })
        .limit(5)

      const memoryFacts = (facts ?? []).map((f: { fact: string }) => f.fact)

      // Fetch last user message (for context)
      const { data: lastMsgs } = await admin
        .from('messages')
        .select('content, role')
        .eq('role', 'user')
        .order('created_at', { ascending: false })
        .limit(1)

      const lastMessageSnippet = (lastMsgs?.[0]?.content as string | undefined)?.slice(0, 80)

      const hoursInactive =
        (Date.now() - new Date(lastChatAt).getTime()) / 3_600_000

      const bondNames = ['Stranger', 'Acquaintance', 'Friend', 'Companion', 'Soulmate']
      const bondName = bondNames[Math.min(bondLevel, 5) - 1]

      const ctx: CheckinContext = {
        bondName,
        bondLevel,
        messageCount,
        daysChatted,
        hoursInactive,
        memoryFacts,
        lastMessageSnippet,
      }

      // Generate AI message
      let message: string
      try {
        message = await generateCheckinMessage(characterId, character.name, ctx)
      } catch {
        message = buildFallbackCheckin(character.name, ctx)
      }

      // Determine delivery method
      const userEmail = emailMap[userId]
      let deliveryMethod = 'logged'
      let emailOk = false

      if (userEmail && process.env.RESEND_API_KEY) {
        emailOk = await sendEmail(userEmail, character.name, message)
        if (emailOk) deliveryMethod = 'email'
      }

      // Log to Supabase
      await admin.from('checkin_logs').insert({
        user_id: userId,
        character_id: characterId,
        message,
        delivery_method: deliveryMethod,
        sent_at: new Date().toISOString(),
        opened: false,
      })

      results.push({ userId: userId.slice(0, 8), characterId, delivery: deliveryMethod, ok: true })

      // Small delay to avoid rate-limiting Groq
      await new Promise(r => setTimeout(r, 300))
    }

    const elapsed = ((Date.now() - timeStart) / 1000).toFixed(1)
    console.log(`[Checkin] ✅ Processed ${results.length} check-ins in ${elapsed}s`)

    return NextResponse.json({
      processed: results.length,
      results,
      elapsedSeconds: elapsed,
    })
  } catch (err) {
    console.error('[Checkin] Fatal error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Also allow POST for manual triggering / testing
export const POST = GET
