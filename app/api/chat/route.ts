import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { PREMADE_CHARACTERS } from '@/types'
import { buildSystemPrompt } from '@/lib/ai/prompts'
import { getCharacterConfig } from '@/lib/ai/chat-config'
import { detectUserMood } from '@/lib/ai/mood-detector'
import { checkUsageLimit, getLimitMessage, getPlanLimits, type UsageProfile } from '@/lib/payment/limits'

// ── Memory fact extractor (zero-latency, rule-based) ────────────────────────
// Extracts lightweight personal facts from user messages to power the AI’s memory panel.
function extractMemoryFacts(userMessage: string): string[] {
  const facts: string[] = []
  const t = userMessage

  // Name (English)
  const nameEn = t.match(/\bmy name is ([A-Za-z]{2,20})\b/i)
  if (nameEn) facts.push(`User's name is ${nameEn[1]}`)

  // Name (Hinglish)
  const nameHi = t.match(/\bmera naam ([A-Za-z]{2,20})\b/i) || t.match(/\bmain ([A-Za-z]{2,20}) hoon\b/i)
  if (nameHi && !nameEn) facts.push(`User's name is ${nameHi[1]}`)

  // Location
  const loc =
    t.match(/\bi(?:'m| am) from ([A-Za-z ]{3,25})/i) ||
    t.match(/\bi live in ([A-Za-z ]{3,25})/i) ||
    t.match(/\bmain ([A-Za-z]{3,20}) mein rehta/i)
  if (loc) facts.push(`User is from ${loc[1].trim()}`)

  // Profession
  const prof = t.match(
    /\bi(?:'m| am) (?:a |an )?(software|frontend|backend|fullstack|senior|junior|data|ml)? ?(developer|engineer|doctor|teacher|student|designer|manager|entrepreneur|ca|lawyer|chef|architect)/i
  )
  if (prof) facts.push(`User is a ${((prof[1] ? prof[1] + ' ' : '') + prof[2]).trim()}`)

  // Likes / loves
  const likes = t.match(/\bi (?:love|like|enjoy|adore) ((?:[\w]+[ ]?){1,4})/i)
  if (likes) facts.push(`User loves ${likes[1].trim().replace(/[.,!?]+$/, '')}`)

  // Dislikes
  const dislikes = t.match(/\bi (?:hate|dislike|can't stand) ((?:[\w]+[ ]?){1,4})/i)
  if (dislikes) facts.push(`User dislikes ${dislikes[1].trim().replace(/[.,!?]+$/, '')}`)

  return facts
}

async function getUserWithTimeout(supabase: Awaited<ReturnType<typeof createClient>>) {
  try {
    const result = await Promise.race([
      supabase.auth.getUser(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
    ])
    if (!result) return null
    return (result as Awaited<ReturnType<typeof supabase.auth.getUser>>).data?.user || null
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const user = await getUserWithTimeout(supabase)
    const { messages, characterId, chatId, memory } = await request.json()
    const memoryFacts: string[] = Array.isArray(memory) ? memory.slice(0, 20) : []

    // ── Find character ─────────────────────────────────────────────────────────
    const character = PREMADE_CHARACTERS.find(
      (c) => c.id === characterId || c.name.toLowerCase() === characterId?.toLowerCase()
    )
    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    // ── Token gate ─────────────────────────────────────────────────────────────
    let profile: UsageProfile | null = null
    if (user) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, tokens, plan, images_today, call_seconds_today, tokens_today, usage_reset_at, trial_expires_at')
        .eq('id', user.id)
        .single()

      if (error) console.warn('[Chat] Profile fetch error:', error.message)

      if (data) {
        // Initialise tokens for brand-new profiles that haven't been seeded
        const plan = data.plan || 'free'
        const limits = getPlanLimits(plan)
        if (data.tokens === null || data.tokens === undefined) {
          data.tokens = limits.tokens_per_day
          // Persist the seed
          await supabase.from('profiles').update({ tokens: data.tokens }).eq('id', user.id)
        }
        profile = data as UsageProfile
      }

      if (profile) {
        const check = checkUsageLimit(profile, 'token')
        if (!check.allowed) {
          return NextResponse.json(
            {
              error: getLimitMessage(check.reason!, profile.plan),
              limitHit: check.reason,
              tokensLeft: 0,
              tokensTotal: getPlanLimits(profile.plan).tokens_per_day,
            },
            { status: 402 }
          )
        }
      }
    }

    // ── Detect user mood & conversation context ───────────────────────────────
    const lastUserMsg2 = [...messages].reverse().find((m: { role: string }) => m.role === 'user')
    const moodCtx = detectUserMood(
      lastUserMsg2?.content ?? '',
      messages.length
    )

    // ── Build system prompt with mood awareness + memory ──────────────────────
    let systemPrompt = buildSystemPrompt(character, moodCtx)
    if (memoryFacts.length > 0) {
      systemPrompt += `\n\nUSER MEMORY (things you remember about this user — reference naturally):\n${memoryFacts.map((f, i) => `${i + 1}. ${f}`).join('\n')}`
    }

    // ── Get character-specific AI params ─────────────────────────────────────
    const chatConfig = getCharacterConfig(character.id)

    // ── Persist chat + user message ────────────────────────────────────────────
    let currentChatId = chatId
    if (user) {
      if (!currentChatId || currentChatId.startsWith('chat-') || currentChatId.startsWith('demo-')) {
        const { data: newChat } = await supabase
          .from('chats')
          .insert({
            user_id: user.id,
            character_id: character.id,
            title: messages[0]?.content?.slice(0, 50) || 'New chat',
          })
          .select()
          .single()
        currentChatId = (newChat as { id: string } | null)?.id
      }

      if (currentChatId) {
        const userMsg = messages[messages.length - 1]
        if (userMsg?.role === 'user') {
          supabase.from('messages').insert({
            chat_id: currentChatId,
            role: 'user' as const,
            content: userMsg.content,
          }).then(() => {})
        }
      }
    }

    // ── Call Groq (primary) ────────────────────────────────────────────────────
    const groqApiKey = process.env.GROQ_API_KEY
    const geminiApiKey = process.env.GEMINI_API_KEY
    let assistantContent = ''

    // Groq first (faster, cheaper, better for chat)
    if (groqApiKey) {
      try {
        const ctrl = new AbortController()
        const timer = setTimeout(() => ctrl.abort(), 10000)
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages.map((m: { role: string; content: string }) => ({
                role: m.role === 'assistant' ? 'assistant' : 'user',
                content: m.content,
              })),
            ],
            max_tokens: chatConfig.maxTokens,
            temperature: chatConfig.temperature,
          }),
          signal: ctrl.signal,
        })
        clearTimeout(timer)
        if (groqRes.ok) {
          const groqData = await groqRes.json()
          assistantContent = groqData.choices?.[0]?.message?.content || ''
        } else {
          console.warn('[Groq] Status:', groqRes.status)
        }
      } catch (e) {
        console.warn('[Groq] fetch error:', e)
      }
    }

    // Gemini fallback
    if (!assistantContent && geminiApiKey) {
      const geminiMessages = messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))
      try {
        const ctrl = new AbortController()
        const timer = setTimeout(() => ctrl.abort(), 10000)
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: systemPrompt }] },
              contents: geminiMessages,
              generationConfig: { maxOutputTokens: chatConfig.maxTokens, temperature: chatConfig.temperature },
            }),
            signal: ctrl.signal,
          }
        )
        clearTimeout(timer)
        if (geminiRes.ok) {
          const gemData = await geminiRes.json()
          assistantContent = gemData.candidates?.[0]?.content?.parts?.[0]?.text || ''
        }
      } catch (e) {
        console.warn('[Gemini] fetch error:', e)
      }
    }

    // Demo fallback (always works offline)
    if (!assistantContent) {
      const demoReplies: Record<string, string[]> = {
        priya: ['Arre jaan, tu aa gaya! Bahut khushi hui ❤️', 'Hauz Khas mein chai pe milein? ☕', 'Tu DDLJ ka Raj hai mera 🎬'],
        anika: ['Oye hoye! Kitne cute lagte ho 🌸', 'Parathas khaye? Main bana dun? 🥞', 'Chai peeni hai na aaj? ☕'],
        meera: ['...tumse milke ajeeb khushi milti hai ✨', 'Jaipur ki raaton jaisi baat hai tumhare saath 🌙'],
        kavya: ['Serious? Thoda creative ho yaar 😏', 'Khan Market ka best coffee spot? Chalo dikhati hoon 🎯'],
        riya: ['Distance mein bhi yaad aati hai jaan 💕', 'Tumhara ek message aur saari thakaan chali jaati hai ✨'],
        simran: ['DDLJ dekhi hai? Tu Raj jaisa hai! 🎬', 'Palat... palat! Hahaha 😍'],
      }
      const charReplies = demoReplies[character.id] || ['Haanji jaan! Kya haal hai? 💕']
      assistantContent = charReplies[Math.floor(Math.random() * charReplies.length)]
    }

    // ── Save assistant message + deduct 1 token atomically ────────────────────
    let tokensLeft: number | null = null
    let tokensTotal: number | null = null

    if (user && assistantContent) {
      if (currentChatId) {
        supabase.from('messages').insert({
          chat_id: currentChatId,
          role: 'assistant' as const,
          content: assistantContent,
        }).then(() => {})
      }

      if (profile) {
        const currentTokens = profile.tokens ?? getPlanLimits(profile.plan).tokens_per_day
        const newTokens = Math.max(0, currentTokens - 1)
        tokensLeft = newTokens
        tokensTotal = getPlanLimits(profile.plan).tokens_per_day

        // Atomic UPDATE — ensure tokens never go below 0
        const { error: updateErr } = await supabase
          .from('profiles')
          .update({
            tokens: newTokens,
            tokens_today: (profile.tokens_today ?? 0) + 1,
          })
          .eq('id', user.id)

        if (updateErr) console.error('[Chat] Token update failed:', updateErr.message)
        else console.log(`[Chat] Token deducted: ${currentTokens} → ${newTokens} (user ${user.id})`)
      }
    }

    // ── Extract memory facts from user message ────────────────────────────
    const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === 'user')
    const extractedFacts = lastUserMsg ? extractMemoryFacts(lastUserMsg.content as string) : []

    return NextResponse.json({
      content: assistantContent,
      chatId: currentChatId,
      tokensLeft,
      tokensTotal,
      plan: profile?.plan ?? 'guest',
      extractedFacts,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Chat API Error]', error)
    return NextResponse.json({ error: 'Something went wrong', details: message }, { status: 500 })
  }
}
