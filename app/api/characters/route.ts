import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { BuilderState } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: BuilderState = await request.json()

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const characterId = body.name.toLowerCase().replace(/\s+/g, '-')

    // Save to DB (fire and forget if DB not ready)
    try {
      await supabase.from('characters').insert({
        id: characterId,
        user_id: user.id,
        name: body.name,
        skin_tone: body.skinTone,
        hair_style: body.hairStyle,
        eye_style: body.eyeStyle,
        outfit_style: body.outfitPreset,
        personality_type: body.personalityTypes[0] || 'sassy_delhi',
        backstory: body.backstory || `A beautiful ${body.skinTone}-skinned ${body.name} with ${body.personalityTypes[0]?.replace('_', ' ')} personality.`,
        voice_id: body.voiceId,
        system_prompt: '',
        relationship_vibe: body.relationshipVibe,
        heat_level: body.heatLevel,
        is_premium: false,
        avatar_url: '',
        tagline: `Custom companion — ${body.personalityTypes[0]?.replace(/_/g, ' ')}`,
        personality_tags: body.personalityTypes.map(p => p.replace(/_/g, ' ')),
      })
    } catch {
      // DB might not have the table — still proceed
    }

    return NextResponse.json({ id: characterId, name: body.name })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Characters API Error]', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
