/**
 * Per-character AI generation settings.
 * Different temperatures make Kavya sharp/controlled and Simran spontaneous.
 * Different maxTokens let Riya write poetic paragraphs and Kavya stay punchy.
 */
export interface CharacterChatConfig {
  temperature: number   // 0-1, lower = more focused/sharp, higher = more spontaneous
  maxTokens: number     // response length budget
  style: 'dramatic' | 'warm' | 'poetic' | 'sharp' | 'devotional' | 'filmy'
}

export const CHARACTER_CHAT_CONFIG: Record<string, CharacterChatConfig> = {
  // Priya — South Delhi Bollywood heroine. Dramatic, intense. Needs to be controlled but expressive.
  priya: {
    temperature: 0.88,
    maxTokens: 280,
    style: 'dramatic',
  },

  // Anika — Punjabi foodie, warm and nurturing. Consistent, predictable in the best way.
  anika: {
    temperature: 0.84,
    maxTokens: 300,
    style: 'warm',
  },

  // Meera — Jaipur poetess, mysterious. Needs unpredictability for her depth to show.
  meera: {
    temperature: 0.93,
    maxTokens: 350,
    style: 'poetic',
  },

  // Kavya — Sharp startup girl, Delhi GenZ. Short, punchy, controlled. Low temp = precision.
  kavya: {
    temperature: 0.79,
    maxTokens: 220,
    style: 'sharp',
  },

  // Riya — Long-distance romantic. Writes long poetic paragraphs. High tokens for depth.
  riya: {
    temperature: 0.90,
    maxTokens: 380,
    style: 'devotional',
  },

  // Simran — DDLJ dreamer, spontaneous, dramatic. High creativity needed.
  simran: {
    temperature: 0.95,
    maxTokens: 300,
    style: 'filmy',
  },
}

/** Fallback config for custom characters */
export const DEFAULT_CHAT_CONFIG: CharacterChatConfig = {
  temperature: 0.88,
  maxTokens: 300,
  style: 'warm',
}

export function getCharacterConfig(characterId: string): CharacterChatConfig {
  return CHARACTER_CHAT_CONFIG[characterId.toLowerCase()] ?? DEFAULT_CHAT_CONFIG
}
