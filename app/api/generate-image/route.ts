import { NextRequest, NextResponse } from 'next/server'
import { buildImagePrompt } from '@/lib/ai/prompts'
import { PREMADE_CHARACTERS } from '@/types'
import { createClient } from '@/lib/supabase/server'
import { checkUsageLimit, type UsageProfile } from '@/lib/payment/limits'

export const maxDuration = 60

function buildEnhancedPrompt(basePrompt: string, scene: string): string {
  const quality = 'photorealistic, 8K, RAW photo, professional photography, 85mm lens, soft bokeh, ultra-detailed'
  const subject = 'beautiful Indian woman, correct anatomy, proportional body, natural skin texture'
  const negative = 'no deformities, no extra limbs, no blurry face, no cartoon, no nudity, no explicit'
  const sceneText = scene ? `${scene},` : ''
  return `${sceneText} ${basePrompt}, ${quality}, ${subject}, ${negative}`
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500)
}

async function generateWithPollinations(prompt: string): Promise<string | null> {
  try {
    const encoded = encodeURIComponent(prompt)
    const seed = Math.floor(Math.random() * 1000000)
    const url = `https://image.pollinations.ai/prompt/${encoded}?width=768&height=1024&seed=${seed}&model=flux&nologo=true`
    console.log('[ImageGen] Calling Pollinations.ai:', url.slice(0, 120) + '...')
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'image/*' },
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

async function generateWithGeminiFallback(prompt: string): Promise<string | null> {
  const apiKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
  ].filter(Boolean) as string[]

  const model = 'gemini-2.0-flash-preview-image-generation'
  for (const apiKey of apiKeys) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
      const body = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
      }
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000),
      })
      if (!res.ok) { console.warn('[ImageGen] Gemini returned', res.status); continue }
      const data = await res.json()
      interface GeminiPart { inlineData?: { mimeType: string; data: string }; text?: string }
      const parts: GeminiPart[] = data?.candidates?.[0]?.content?.parts ?? []
      const imgPart = parts.find((p) => p?.inlineData?.mimeType?.startsWith('image/'))
      if (imgPart?.inlineData?.data) {
        const { mimeType, data: b64 } = imgPart.inlineData
        return `data:${mimeType};base64,${b64}`
      }
    } catch (e) {
      console.warn('[ImageGen] Gemini fallback error:', e)
    }
  }
  return null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { characterId, chatId } = body
    const customScene: string = body.customPrompt || body.customScenario || ''

    // ── Auth + limit check ─────────────────────────────────────────────────────
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

    // ── Resolve character ─────────────────────────────────────────────────────
    let character = PREMADE_CHARACTERS.find(
      (c) => c.id === characterId || c.name.toLowerCase() === characterId?.toLowerCase()
    )
    if (!character) character = PREMADE_CHARACTERS[0]

    const basePrompt = buildImagePrompt(character, '')
    const finalPrompt = buildEnhancedPrompt(basePrompt, customScene)

    // ── Generate ──────────────────────────────────────────────────────────────
    let imageUrl = await generateWithPollinations(finalPrompt)
    if (!imageUrl) {
      console.log('[ImageGen] Pollinations failed, trying Gemini fallback...')
      imageUrl = await generateWithGeminiFallback(finalPrompt)
    }

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Photo generate nahi hua jaan 🙏 Thoda wait karo, dobara try karo!' },
        { status: 500 }
      )
    }

    // ── Save record + increment images_today ──────────────────────────────────
    if (user && profile) {
      // Await the increment so concurrent requests can't bypass the limit
      const { error: imgUpdateErr } = await supabase.from('profiles')
        .update({ images_today: (profile.images_today ?? 0) + 1 })
        .eq('id', user.id)
      if (imgUpdateErr) console.error('[ImageGen] images_today update error:', imgUpdateErr.message)

      // Log to generated_images (best-effort, non-blocking is fine)
      supabase.from('generated_images').insert({
        user_id: user.id,
        character_id: character.id,
        chat_id: chatId || null,
        image_url: imageUrl,
        prompt: customScene || 'Character portrait',
      }).then(() => {})
    }

    const imagesLeft = profile
      ? Math.max(0, (profile.images_today ?? 0) === 0
          ? (profile.plan === 'free' ? 2 : profile.plan === 'trial' ? 6 : 30) - 1
          : (profile.plan === 'free' ? 2 : profile.plan === 'trial' ? 6 : 30) - (profile.images_today + 1))
      : null

    return NextResponse.json({
      image_url: imageUrl,
      imagesLeft,
      imagesUsed: profile ? (profile.images_today ?? 0) + 1 : null,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[ImageGen] Unhandled error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
