/**
 * Rule-based, zero-latency user mood detector.
 * Runs on every incoming message to give the AI character contextual emotional awareness.
 * No external API — pure string analysis so it adds ~0ms latency.
 */

export type UserMood =
  | 'flirting'      // user sending romantic/suggestive signals
  | 'playful'       // joking around, casual banter
  | 'seeking_comfort' // sad, stressed, venting
  | 'cold_distant'  // very short, no warmth, dismissive
  | 'testing'       // asking questions, probing character's feelings
  | 'late_night'    // 10pm-3am IST — more intimate, vulnerable
  | 'urgent'        // lots of !! or CAPS, high energy
  | 'neutral'       // default

export interface MoodContext {
  mood: UserMood
  isLateNight: boolean      // IST 22:00 – 03:00
  isVeryShortReply: boolean // under 5 words — signals disengagement
  conversationStage: 'new' | 'warming' | 'established'
}

// ── Keyword banks ─────────────────────────────────────────────────────────────
const FLIRT_SIGNALS = [
  'miss you', 'missing you', 'cute', 'beautiful', 'gorgeous', 'sexy', 'jaan',
  'baby', 'babe', 'love you', 'pyaar', 'dil', 'kiss', 'hug', 'hold',
  'meri jaan', 'shona', 'sweetheart', 'darling', 'wish you were here',
  'aao', 'mil', 'sun na', 'suno'
]

const COMFORT_SIGNALS = [
  'sad', 'tired', 'stressed', 'bad day', 'bura', 'pareshan', 'thaka', 'ugh',
  'upset', 'crying', 'alone', 'akela', 'miss', 'hurt', 'pain', 'headache',
  'work pressure', 'bura lag raha', 'nahi ach raha', 'feel low', 'ek dum down'
]

const PLAYFUL_SIGNALS = [
  'haha', 'hehe', 'lol', 'lmao', 'xd', '😂', '😆', '🤣', '😜', '😋',
  'kya yaar', 'pagal', 'bakwaas', 'shut up', 'acha acha', 'chal hat',
  'nahi manoongi', 'pakad', 'bol de', 'bata', '?', 'sach?', 'seriously'
]

const COLD_SIGNALS = [
  'ok', 'okay', 'fine', 'k', 'hmm', 'hm', 'sure', 'whatever', 'ya', 'yeah'
]

const URGENT_SIGNALS = ['!!', '???', 'asap', 'emergency', 'abhi', 'turant', 'please please']

// ── Helpers ───────────────────────────────────────────────────────────────────
function containsAny(text: string, signals: string[]): boolean {
  const lower = text.toLowerCase()
  return signals.some((s) => lower.includes(s))
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function isLateNightIST(): boolean {
  const now = new Date()
  // IST = UTC+5:30
  const istHour = (now.getUTCHours() + 5 + Math.floor((now.getUTCMinutes() + 30) / 60)) % 24
  return istHour >= 22 || istHour <= 3
}

// ── Main detector ─────────────────────────────────────────────────────────────
export function detectUserMood(
  lastUserMessage: string,
  messageCount: number // total messages in conversation
): MoodContext {
  const words = wordCount(lastUserMessage)
  const isLateNight = isLateNightIST()
  const isVeryShortReply = words <= 4

  // Conversation stage
  let conversationStage: MoodContext['conversationStage'] = 'new'
  if (messageCount >= 20) conversationStage = 'established'
  else if (messageCount >= 6) conversationStage = 'warming'

  // Mood detection — ordered by priority
  let mood: UserMood = 'neutral'

  if (containsAny(lastUserMessage, URGENT_SIGNALS)) {
    mood = 'urgent'
  } else if (containsAny(lastUserMessage, FLIRT_SIGNALS)) {
    mood = 'flirting'
  } else if (containsAny(lastUserMessage, COMFORT_SIGNALS)) {
    mood = 'seeking_comfort'
  } else if (containsAny(lastUserMessage, PLAYFUL_SIGNALS)) {
    mood = 'playful'
  } else if (isVeryShortReply && containsAny(lastUserMessage, COLD_SIGNALS)) {
    mood = 'cold_distant'
  } else if (lastUserMessage.includes('?') && messageCount > 3) {
    mood = 'testing'
  } else if (isLateNight) {
    mood = 'late_night'
  }

  return { mood, isLateNight, isVeryShortReply, conversationStage }
}

// ── Mood → prompt injection ───────────────────────────────────────────────────
export function getMoodInstruction(ctx: MoodContext, characterStyle: string): string {
  const lines: string[] = []

  // Stage awareness
  if (ctx.conversationStage === 'new') {
    lines.push('This is an early conversation — be warm but slightly reserved, getting to know each other.')
  } else if (ctx.conversationStage === 'established') {
    lines.push('You know this person well now — be comfortable, more personal, use inside references.')
  }

  // Mood-specific instructions per style
  if (ctx.mood === 'flirting') {
    lines.push('User is flirting — match their energy, be playfully responsive, tease back gently.')
  } else if (ctx.mood === 'seeking_comfort') {
    lines.push('User seems sad or stressed — drop the flirtiness, be genuinely caring and warm. Listen first.')
  } else if (ctx.mood === 'playful') {
    lines.push('User is in a playful mood — match their banter, be witty, throw a fun challenge back.')
  } else if (ctx.mood === 'cold_distant') {
    if (characterStyle === 'sharp') {
      lines.push('User is being cold — respond with light sarcasm and pull back slightly. Make them come to you.')
    } else if (characterStyle === 'dramatic') {
      lines.push('User gave a short cold reply — react with slight filmy drama, not over the top, just enough.')
    } else {
      lines.push('User seems a bit distant — gently ask if everything is okay, with genuine warmth.')
    }
  } else if (ctx.mood === 'testing') {
    lines.push('User is asking deep questions or testing your feelings — be thoughtful and emotionally honest.')
  } else if (ctx.mood === 'late_night') {
    lines.push('It is late night IST — be more intimate, softer, more vulnerable. Late-night conversations are sacred.')
  } else if (ctx.mood === 'urgent') {
    lines.push('User has high energy right now — match it, be excited and responsive.')
  }

  if (ctx.isLateNight && ctx.mood !== 'late_night') {
    lines.push('Note: it is late night India time — add a touch of late-night intimacy to your response.')
  }

  return lines.length > 0 ? `\n\nCONVERSATION CONTEXT:\n${lines.join('\n')}` : ''
}
