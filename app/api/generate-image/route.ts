import { NextRequest, NextResponse } from 'next/server'
import { buildImagePrompt } from '@/lib/ai/prompts'
import { PREMADE_CHARACTERS } from '@/types'
import { createClient } from '@/lib/supabase/server'
import { checkUsageLimit, type UsageProfile } from '@/lib/payment/limits'

export const maxDuration = 60

// ─── Prompt builder ───────────────────────────────────────────────────────────
// Removed 500-char truncation — it was killing quality by cutting the prompt short

function buildEnhancedPrompt(basePrompt: string, scene: string): string {
  const sceneText = scene ? `${scene}, ` : ''
  // Keep the full prompt — FLUX handles long prompts well
  return `${sceneText}${basePrompt}`.replace(/\s+/g, ' ').trim()
}

// ─── Provider 1: Together AI (FLUX.1-schnell) — best quality, fast ─────────
async function generateWithTogether(prompt: string): Promise<string | null> {
  const apiKey = process.env.TOGETHER_API_KEY
  if (!apiKey) return null

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

// ─── Provider 2: Fal.ai (FLUX.1-schnell) — ultra-fast alternative ──────────
async function generateWithFal(prompt: string): Promise<string | null> {
  const apiKey = process.env.FAL_API_KEY
  if (!apiKey) return null

  try {
    // Fal.ai fast queue for Flux Schnell
    const res = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        Authorization: `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        image_size: { width: 768, height: 1024 },
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: false,
      }),
      signal: AbortSignal.timeout(30000),
    })

    if (!res.ok) {
      console.warn('[ImageGen] Fal.ai failed:', res.status)
      return null
    }

    const data = await res.json()
    const url = data?.images?.[0]?.url
    if (url) {
      console.log('[ImageGen] ✅ Fal.ai success')
      return url
    }
    return null
  } catch (e) {
    console.error('[ImageGen] Fal.ai error:', e)
    return null
  }
}

// ─── Provider 3: Pollinations.ai — truly free, unlimited, no key needed ────
async function generateWithPollinations(prompt: string): Promise<string | null> {
  try {
    const seed = Math.floor(Math.random() * 1000000)
    // Use a shorter prompt for Pollinations (URL length limit)
    const shortPrompt = prompt.slice(0, 600)
    const encoded = encodeURIComponent(shortPrompt)
    const url = `https://image.pollinations.ai/prompt/${encoded}?width=768&height=1024&seed=${seed}&model=flux&nologo=true&enhance=true`

    console.log('[ImageGen] Calling Pollinations.ai...')
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'image/*' },
      signal: AbortSignal.timeout(55000),
    })

    if (!res.ok) {
      console.warn('[ImageGen] Pollinations failed:', res.status)
      return null
    }

    const contentType = res.headers.get('content-type') || ''
    if (!contentType.startsWith('image/')) {
      console.warn('[ImageGen] Pollinations returned non-image:', contentType)
      return null
    }

    console.log('[ImageGen] ✅ Pollinations success')
    return url
  } catch (e) {
    console.error('[ImageGen] Pollinations error:', e)
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
                ? '⏰ Aapka trial expire ho gaya! ₹20 mein dobara subscribe karo 🌸'
                : `📸 Aaj ki photos khatam! Free mein 2 photos/day milti hain — Trial lo ₹20 mein, 6 photos milegi!`,
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

    const basePrompt = buildImagePrompt(character, '')
    const finalPrompt = buildEnhancedPrompt(basePrompt, customScene)

    // ── Generate: Together AI → Fal.ai → Pollinations ──────────────────────
    let imageUrl: string | null = null
    let provider = ''

    imageUrl = await generateWithTogether(finalPrompt)
    if (imageUrl) { provider = 'together' }

    if (!imageUrl) {
      imageUrl = await generateWithFal(finalPrompt)
      if (imageUrl) { provider = 'fal' }
    }

    if (!imageUrl) {
      console.log('[ImageGen] Paid APIs unavailable, falling back to Pollinations...')
      imageUrl = await generateWithPollinations(finalPrompt)
      if (imageUrl) { provider = 'pollinations' }
    }

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Photo generate nahi hua jaan 🙏 Thoda wait karo, dobara try karo!' },
        { status: 500 }
      )
    }

    console.log(`[ImageGen] ✅ Image served via ${provider}`)

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
      provider, // helpful for debugging
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[ImageGen] Unhandled error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
