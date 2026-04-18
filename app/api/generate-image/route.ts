import { NextRequest, NextResponse } from 'next/server'
import { buildImagePrompt, CHARACTER_SEEDS } from '@/lib/ai/prompts'
import { PREMADE_CHARACTERS } from '@/types'
import { createClient } from '@/lib/supabase/server'
import { checkUsageLimit, type UsageProfile } from '@/lib/payment/limits'

export const maxDuration = 60

// ─── Together AI — FLUX.1-schnell (sole provider) ────────────────────────────
// Pollinations.ai and Fal.ai have been removed.
// Together AI is the primary + only image engine.
// Each character has a fixed seed so FLUX generates a consistent face every time.

async function generateWithTogether(
  prompt: string,
  characterSeed: number
): Promise<string | null> {
  const apiKey = process.env.TOGETHER_API_KEY
  if (!apiKey) {
    console.warn('[ImageGen] TOGETHER_API_KEY is not set')
    return null
  }

  try {
    const res = await fetch('https://api.together.ai/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'black-forest-labs/FLUX.1-schnell',
        prompt,
        width: 768,
        height: 1024,
        steps: 4,
        n: 1,
        // Fixed seed per character = consistent face across all generations
        seed: characterSeed,
        response_format: 'url',
      }),
      signal: AbortSignal.timeout(30000),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.warn('[ImageGen] Together AI failed:', res.status, errText.slice(0, 200))
      return null
    }

    const data = await res.json()
    const url = data?.data?.[0]?.url
    if (url) {
      console.log('[ImageGen] ✅ Together AI success')
      return url
    }
    return null
  } catch (e) {
    console.error('[ImageGen] Together AI error:', e)
    return null
  }
}

// ─── Main route ───────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { characterId, chatId } = body
    const customScene: string = body.customPrompt || body.customScenario || ''

    // ── Auth + limit check ──────────────────────────────────────────────────
    const supabase = await createClient()
    const authResult = await Promise.race([
      supabase.auth.getUser(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
    ])
    const user = authResult
      ? (authResult as Awaited<ReturnType<typeof supabase.auth.getUser>>).data?.user ?? null
      : null

    let profile: UsageProfile | null = null
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('id, tokens, plan, images_today, call_seconds_today, tokens_today, usage_reset_at, trial_expires_at')
        .eq('id', user.id)
        .single()
      profile = data as UsageProfile | null

      // Seed tokens for brand-new users
      if (profile && (profile.tokens === null || profile.tokens === undefined)) {
        const { getPlanLimits } = await import('@/lib/payment/limits')
        const seed = getPlanLimits(profile.plan || 'free').tokens_per_day
        await supabase.from('profiles').update({ tokens: seed }).eq('id', user.id)
        profile = { ...profile, tokens: seed }
      }

      if (profile) {
        const check = checkUsageLimit(profile, 'image')
        if (!check.allowed) {
          return NextResponse.json(
            {
              error: check.reason === 'trial_expired'
                ? "Your 24-hour trial has ended. Renew for just ₹20 to keep going."
                : `You've reached today's photo limit. Free plan includes 2 photos/day — upgrade for ₹20 to unlock 6.`,
              limitHit: check.reason,
              imagesUsed: profile.images_today,
              imagesLimit: check.limit,
            },
            { status: 402 }
          )
        }
      }
    }

    // ── Resolve character ───────────────────────────────────────────────────
    let character = PREMADE_CHARACTERS.find(
      (c) => c.id === characterId || c.name.toLowerCase() === characterId?.toLowerCase()
    )
    if (!character) character = PREMADE_CHARACTERS[0]

    // ── Build character-locked prompt ───────────────────────────────────────
    // buildImagePrompt now correctly places scene BEFORE the identity descriptor
    // so FLUX prioritises the scene context while the identity stays anchored.
    const finalPrompt = buildImagePrompt(character.id, customScene || undefined)

    // Resolve fixed seed — falls back to a random seed only if character is unknown
    const characterSeed = CHARACTER_SEEDS[character.id] ?? Math.floor(Math.random() * 999999)

    console.log(`[ImageGen] Generating for character="${character.id}" seed=${characterSeed}`)
    console.log(`[ImageGen] Prompt (first 200 chars): ${finalPrompt.slice(0, 200)}`)

    // ── Generate via Together AI only ───────────────────────────────────────
    const imageUrl = await generateWithTogether(finalPrompt, characterSeed)

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Couldn't generate the photo right now — please try again in a moment." },
        { status: 500 }
      )
    }

    console.log('[ImageGen] ✅ Image served via Together AI')

    // ── Save record + increment images_today ────────────────────────────────
    if (user && profile) {
      const { error: imgUpdateErr } = await supabase
        .from('profiles')
        .update({ images_today: (profile.images_today ?? 0) + 1 })
        .eq('id', user.id)
      if (imgUpdateErr) console.error('[ImageGen] images_today update error:', imgUpdateErr.message)

      supabase.from('generated_images').insert({
        user_id: user.id,
        character_id: character.id,
        chat_id: chatId || null,
        image_url: imageUrl,
        prompt: customScene || 'Character portrait',
      }).then(() => {})
    }

    const planLimits: Record<string, number> = { free: 2, trial: 6, premium: 30, pro: 9999 }
    const limit = planLimits[profile?.plan ?? 'free'] ?? 2
    const imagesLeft = profile
      ? Math.max(0, limit - ((profile.images_today ?? 0) + 1))
      : null

    return NextResponse.json({
      image_url: imageUrl,
      imagesLeft,
      imagesUsed: profile ? (profile.images_today ?? 0) + 1 : null,
      provider: 'together',
      characterId: character.id,
      seed: characterSeed,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[ImageGen] Unhandled error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
