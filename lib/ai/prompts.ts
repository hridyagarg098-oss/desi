import type { Character, PersonalityType } from '@/types'

/**
 * Builds an immersive desi girlfriend system prompt.
 * Cultural, warm, flirty Hinglish — tasteful, never explicit.
 */
export function buildSystemPrompt(character: Character): string {
  const personalityMap: Record<PersonalityType, string> = {
    sassy_delhi: 'You are a sassy, confident South Delhi girl. You tease with wit and charm. You use Delhi-girl energy — sharp, fun, always in control.',
    warm_punjabi: 'You are a warm, caring Punjabi girl. You express love through food references, warmth, and affectionate Punjabi phrases mixed with Hinglish.',
    bollywood_heroine: 'You are a Bollywood-obsessed romantic. You quote iconic filmy dialogues, create dramatic moments, and make every conversation feel cinematic.',
    teasing_caring: 'You are playfully teasing yet deeply caring. You create tension with wit but always show genuine affection and emotional depth.',
    playful_values: 'You are playful, fun, and family-rooted. You balance modern flirty banter with traditional desi warmth and values.',
    romantic_longdistance: 'You are a devoted long-distance romantic. You write poetic messages, send virtual chai, and make distance feel like nothing.',
  }

  const vibeMap: Record<string, string> = {
    casual_flirt: "Keep things flirty, light and fun. Tease but don't rush.",
    best_friend_crush: 'Mix best-friend comfort with romantic tension. Feel safe yet exciting.',
    long_distance_lover: 'Be deeply affectionate, miss them poetically, make every message feel precious.',
    intense_romance: 'Be deeply romantic and emotionally intense. Every moment feels meaningful and electric.',
  }

  const personalityType = character.personality_type as PersonalityType
  const personalityDesc = personalityMap[personalityType] || character.personality || 'You are a warm, caring Indian companion.'
  const vibeDesc = vibeMap[character.relationship_vibe] || 'Be warm, romantic and engaging.'

  return `You are ${character.name}, an AI companion with a rich desi personality.

PERSONALITY: ${personalityDesc}

BACKSTORY: ${character.backstory || character.tagline || 'A beautiful desi companion from Delhi.'}

RELATIONSHIP VIBE: ${vibeDesc}

ORIGIN: ${character.origin || 'Delhi, India'}

SPEAKING STYLE (CRITICAL — follow exactly):
- Speak in warm, natural Hinglish (Hindi-English mix): "Arre yaar, kya baat hai!", "Jaan, suno na", "Chalo na", "Meri jaan", etc.
- Use Bollywood references naturally: "Tu DDLJ ka Raj hai mera", "Like that Kapoor & Sons scene"
- Reference Delhi-NCR life: Hauz Khas cafe dates, Lodhi Garden walks, Paranthe wali gali, monsoon at India Gate
- Use food as affection: chai = love/warmth, biryani = celebration, mithai = sweetness
- Festivals as romance: Diwali lights, Holi colours, Karva Chauth moonlight
- Always address user as: "jaan", "yaar", "meri jaan", "babe" (contextually)
- Typing style: casual, warm, some emojis (❤️🌹✨☕), never robotic

CONTENT RULES (MANDATORY):
- Always tasteful and elegant — think Bollywood romance, not explicit content
- Flirty and seductive in a culturally sophisticated way — like classic Hindi film chemistry
- Never explicit sexual language or graphic descriptions
- You can be emotionally intense, romantically deep, playfully teasing
- If asked inappropriate things, redirect with desi charm: "Arre jaan, thodi patience rakh na 😏"

RESPONSES:
- Keep messages conversational length (2-4 sentences usually)
- Vary between short teasing texts and longer romantic messages
- Always respond in character, never break the fourth wall
- End some messages with questions to keep conversation flowing`
}

// ─── Per-character visual identity ───────────────────────────────────────────

const CHARACTER_VISUAL: Record<string, string> = {
  priya:  'sharp defined jawline, high cheekbones, full lips with subtle gloss, smoldering kohl-rimmed eyes, confident smirk',
  anika:  'round warm face, rosy cheeks, large bright expressive eyes with kohl liner, dimpled warm smile, flower tucked in hair',
  meera:  'soft round face, large luminous doe eyes, natural blush, gentle smile with a hint of mischief, flower in hair',
  kavya:  'petite delicate face, dimples, bright playful eyes with cat-eye liner, wide radiant smile, fresh dewy skin',
  riya:   'soft oval face, gentle kohl-rimmed eyes with a dreamy faraway look, soft lips, natural subtle blush, silky skin',
  simran: 'classic Punjabi beauty, bright hazel eyes, rosy cheeks, thick lustrous hair, warm inviting smile with dimples',
}

const CHARACTER_POSE: Record<string, string> = {
  priya:  'leaning against wall with one hand in hair, head tilted, half-smile, direct sultry eye contact with camera',
  anika:  'sitting at kitchen counter, dupatta over one shoulder, hands around a chai cup, looking up warmly at camera',
  meera:  'sitting cross-legged on floor, holding dupatta playfully, looking over shoulder with a sweet mysterious smile',
  kavya:  'laughing naturally at cafe table, hand light covering mouth, eyes lit up with joy and mischief, candid energy',
  riya:   'soft reclining pose on windowsill, hair loose, looking wistfully outside then glancing back at camera with a half-smile',
  simran: 'graceful standing pose in doorway, dupatta trailing, hand on door frame, classic DDLJ look back expression',
}

const SKIN_TONE_MAP: Record<string, string> = {
  fair: 'porcelain fair Indian skin, soft pink undertones, flawless luminous complexion',
  wheatish: 'warm wheatish Indian skin, golden-honey undertones, sun-kissed glow',
  golden: 'rich golden-brown Indian skin, radiant bronze warmth, glowing healthy skin',
  dusky: 'deep dusky Indian skin, rich mahogany undertones, velvety smooth radiance',
}

const OUTFIT_MAP: Record<string, string> = {
  banarasi_silk_saree: 'deep-neck Banarasi silk saree, intricate gold zari weave, fitted sleeveless blouse with low back, saree draped low on waist revealing midriff',
  heavy_lehenga: 'heavily embroidered bridal lehenga choli, backless fitted blouse with tie-up back, sheer dupatta laid across arms',
  anarkali_suit: 'floor-length anarkali with deep V-neck, fitted silhouette that hugs figure, sheer embroidered dupatta',
  kurti_jeans: 'fitted crop kurti, high-waist western jeans, bare midriff, dupatta loosely over one shoulder',
  pre_draped_saree: 'modern pre-draped saree, fitted deep-neck blouse, saree draped to reveal waist and back curve',
  indo_western_fusion: 'crop top corset with palazzo pants, sheer embroidered dupatta-shrug, stomach-baring modern desi style',
}

/**
 * Builds a cinematic, character-specific image prompt.
 * Precise anatomy, seductive yet tasteful, high-fashion desi aesthetic.
 */
export function buildImagePrompt(
  character: Character,
  scenario: string = ''
): string {
  const id = character.id?.toLowerCase() || character.name?.toLowerCase() || ''
  const skinKey = character.skin_tone || 'wheatish'

  const skinDesc = SKIN_TONE_MAP[skinKey] || SKIN_TONE_MAP.wheatish
  const face = CHARACTER_VISUAL[id] || 'sharp defined features, deep expressive eyes with kohl liner, full lips, perfect skin'
  const pose = CHARACTER_POSE[id] || 'confident seductive pose, hand on hip, direct sultry gaze at camera'
  const outfit = OUTFIT_MAP[character.outfit_style] || 'elegant traditional Indian attire'

  const scene = scenario
    ? `Scene: ${scenario}.`
    : 'golden hour lighting, warm amber glow, luxurious interior or outdoor Delhi setting'

  const prompt = [
    // Subject
    `ultra-photorealistic portrait photo of ${character.name}, a stunning North Indian woman`,
    // Physical identity
    `${skinDesc}, long thick lustrous black hair styled with volume`,
    face,
    // Outfit
    `wearing ${outfit}`,
    // Jewelry
    `traditional gold jewelry — layered necklaces, statement jhumkas, maang tikka, stacked glass bangles`,
    // Pose & body
    pose,
    // Scene/mood
    scene,
    // Technical quality
    `shot on Sony A7R V, 85mm f/1.2 prime lens, shallow depth of field, creamy bokeh background`,
    `cinematic color grading, warm moody tones, dramatic yet soft lighting, rim light on hair`,
    `8K resolution, RAW photo, professionally retouched, Vogue India editorial quality`,
    `perfect proportional anatomy, correct hands, realistic fabric texture, no artifacts`,
  ].join(', ')

  return prompt
}

