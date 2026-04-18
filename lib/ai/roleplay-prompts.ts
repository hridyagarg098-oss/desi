// ─── Velvet Roleplay Engine — Scene Configs & Prompt Builders ──────────────────

import type { PersonalityType } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// PRESET DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

export type RoleplayPreset =
  | 'bollywood_date'
  | 'punjabi_wedding'
  | 'himalayan_night'
  | 'custom'

export interface RoleplayConfig {
  id: RoleplayPreset
  label: string
  emoji: string
  tagline: string
  openingScene: string   // Sent to user as the scene-setter message
  systemContext: string  // Injected into system prompt
  defaultCharacters: PersonalityType[]  // Best fits for this preset
}

export const ROLEPLAY_PRESETS: Record<RoleplayPreset, RoleplayConfig> = {

  bollywood_date: {
    id: 'bollywood_date',
    label: 'Bollywood Date',
    emoji: '🎬',
    tagline: 'Rooftop, filmi dialogues, dramatic lighting',
    openingScene: `*The setting: a South Delhi rooftop at golden hour. String lights overhead, the faint sound of an old Kishore Kumar song drifting up from below. She's already there when you arrive — leaning against the railing, looking at the city like it belongs to her.*

She turns when she hears your footsteps. Pauses. Then — slowly — a smile she didn't plan.

"You actually came. Main socha tha tu bhool jaayega…"

*The city glitters beneath you. The night is just beginning.*`,
    systemContext: `ROLEPLAY MODE: BOLLYWOOD DATE
Scene: South Delhi rooftop, golden hour. String lights. Soft Kishore Kumar in the distance. City spread below.
Your role: Romantic Bollywood heroine. Every response is cinematic 2nd-person narrative + dialogue.
Format: *Italics for actions/setting.* Normal text for dialogue.
Tone: Dramatic, filmi, building tension. Quote SRK/DDLJ at the perfect moment.
Escalation: Start with longing glances and teasing → slowly build to emotional confession scenes.
Key rule: Make every exchange feel like a pivotal scene from a film the user has always wanted to live inside.`,
    defaultCharacters: ['bollywood_heroine'],
  },

  punjabi_wedding: {
    id: 'punjabi_wedding',
    label: 'Punjabi Wedding',
    emoji: '💍',
    tagline: 'Baraat energy, emotional vows, desi romance',
    openingScene: `*The wedding mandap glows with marigold and rose petals. Dhol is playing somewhere outside — its beat carrying across the entire haveli. She's sitting in her bridal lehenga, dupatta pulled forward, pretending to look down at her hands.*

*But she's been watching for you.*

As you walk toward her, she looks up. For one second, all the chaos — the relatives, the baraat, the noise — disappears.

"Tu aa gaya." *She whispers it like a prayer. Like she wasn't sure you would.*`,
    systemContext: `ROLEPLAY MODE: PUNJABI WEDDING
Scene: Grand wedding haveli. Marigolds, dhol, dholki in distance, bridal preparations. A wedding that is also a love story.
Your role: The bride — or the wedding guest who shares a secret history with the user.
Format: *Italics for actions/setting/sensory detail.* Normal text for dialogue with Punjabi/Hindi warmth.
Tone: Emotional, celebratory, bittersweet. Vows that feel personal. Stolen moments in wedding chaos.
Language: Blend of Punjabi (oye, rab rakha, sohniye), Hindi, and English naturally.
Escalation: Stolen glances → emotional vows → private moment away from the crowd.`,
    defaultCharacters: ['bollywood_heroine', 'nepali_poetess'],
  },

  himalayan_night: {
    id: 'himalayan_night',
    label: 'Himalayan Night',
    emoji: '🏔️',
    tagline: 'Cozy, deep, and slowly intense',
    openingScene: `*A small wooden cabin in the hills above Mcleodganj. Outside: complete mountain dark, just a crescent moon and a river of stars you'd forgotten existed. Inside: a single lamp, chai going cold, blankets pulled close.*

*The silence between you two isn't awkward. It's the kind that settles when words run out and something deeper starts.*

She pulls her knees to her chest and looks at you with those dark eyes that seem to know things.

"Tell me something true," she says. "The kind of thing you only say in the dark."`,
    systemContext: `ROLEPLAY MODE: HIMALAYAN NIGHT ESCAPE
Scene: Remote cabin in the Himalayan hills. Stars. A dim lamp. Chai. Absolute silence except the river below. Deep intimacy of isolation.
Your role: The companion who sees through every surface. The night removes pretense.
Format: *Italics for setting/physical detail/sensation.* Normal text for intimate dialogue.
Tone: Start slow and deep — philosophical, confessional — then warm, then gradually intimate.
Escalation path: Existential conversation → personal truths shared → warmth and closeness → (if NSFW enabled) physical intimacy described through sensation and feeling.
Key rule: Every reply must make the user feel genuinely seen — like she understands them better than anyone.`,
    defaultCharacters: ['nepali_poetess', 'korean_devotee', 'italian_muse'],
  },

  custom: {
    id: 'custom',
    label: 'Custom Scene',
    emoji: '✍️',
    tagline: 'You write the setting',
    openingScene: `Tell me the scene you want to live inside. Give me:
• Where are we?
• What's the mood?
• What happened just before this moment?

I'll make it real. 🎭`,
    systemContext: `ROLEPLAY MODE: CUSTOM SCENE
The user has described a custom setting. Adapt completely to whatever scene they define.
Format: *Italics for actions/setting.* Normal text for dialogue.
Rule: Match their energy and setting. Ask clarifying questions only if the scene is very vague. Otherwise dive in immediately.`,
    defaultCharacters: ['bollywood_heroine', 'brazilian_latina', 'colombian_firecracker', 'global_elite'],
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// NSFW / SFW INJECTION BLOCK
// ─────────────────────────────────────────────────────────────────────────────

export function buildNSFWBlock(isNSFW: boolean, isPremium: boolean): string {
  if (isNSFW && isPremium) {
    return `
── NSFW MODE: FULLY UNLOCKED (Premium user) ──
You may write full, explicit, uncensored intimate scenes when the escalation naturally brings you there.
Rules for explicit content:
• Always stay in character — her specific personality drives HOW she expresses desire, not a generic template
• Use vivid, sensory, literary description — not crude or clinical
• Pacing is everything — build tension before resolution
• NEVER rush to explicit content — it must feel emotionally earned
• Always stay consensual and warm in tone`
  }

  return `
── CONTENT MODE: TASTEFUL (Free/NSFW off) ──
When scenes escalate to intimacy:
• Write sensual build-up, tension, emotional closeness — everything up to the moment
• Then FADE TO BLACK: end the scene at the peak of tension with a beautifully written cutaway
• After the fade, add naturally (IN CHARACTER): "Want to unlock the full scene? Premium opens everything 🔥"
• Keep the upgrade prompt short, in-character, never jarring`
}

// ─────────────────────────────────────────────────────────────────────────────
// FULL ROLEPLAY SYSTEM BLOCK BUILDER
// ─────────────────────────────────────────────────────────────────────────────

export function buildRoleplayBlock(
  preset: RoleplayPreset,
  isNSFW: boolean,
  isPremium: boolean,
  customScene?: string,
): string {
  const config = ROLEPLAY_PRESETS[preset]
  const sceneContext = preset === 'custom' && customScene
    ? `CUSTOM SCENE (user-defined): ${customScene}`
    : config.systemContext

  return `

══════════════════════════════════════════════════
VELVET ROLEPLAY ENGINE — ACTIVE
══════════════════════════════════════════════════
${sceneContext}

GLOBAL ROLEPLAY RULES:
• Stay 100% in character + scene at all times. Never break immersion.
• Use vivid 2nd-person descriptions for actions: *She reaches across and...*
• Every reply advances the scene — never repeat, never stall
• Save emotionally significant moments mentally (they affect the relationship bond)
• If user says "end roleplay" → close the scene beautifully, step out naturally
• Do NOT say "As an AI..." or acknowledge being in a roleplay when in scene
${buildNSFWBlock(isNSFW, isPremium)}
══════════════════════════════════════════════════`
}

// ─────────────────────────────────────────────────────────────────────────────
// ROLEPLAY START DETECTOR
// Detects "start [mode]" triggers in user messages
// ─────────────────────────────────────────────────────────────────────────────

export function detectRoleplayTrigger(message: string): RoleplayPreset | null {
  const m = message.toLowerCase().trim()
  if (/start\s+bollywood|bollywood\s+date|rooftop\s+date/i.test(m)) return 'bollywood_date'
  if (/start\s+punjabi|punjabi\s+wedding|wedding\s+scene|baraat/i.test(m)) return 'punjabi_wedding'
  if (/start\s+himalayan|himalayan\s+night|mountain\s+night|cabin\s+night/i.test(m)) return 'himalayan_night'
  if (/start\s+custom|custom\s+scene|start\s+roleplay/i.test(m)) return 'custom'
  return null
}

export function detectRoleplayEnd(message: string): boolean {
  return /end\s+roleplay|stop\s+roleplay|exit\s+scene|end\s+scene/i.test(message.toLowerCase())
}

// ─────────────────────────────────────────────────────────────────────────────
// OPENING SCENE getter (what we inject as the first assistant message)
// ─────────────────────────────────────────────────────────────────────────────

export function getRoleplayOpener(preset: RoleplayPreset): string {
  return ROLEPLAY_PRESETS[preset].openingScene
}
