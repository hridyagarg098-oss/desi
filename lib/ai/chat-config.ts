// ─── Velvet AI — Per-Character Config ────────────────────────────────────────
// Controls AI generation parameters tuned to each character's voice.
// temperature: expressiveness/randomness (0.0–1.0)
// maxTokens: response length budget

import type { PersonalityType } from '@/types'

interface CharacterConfig {
  temperature: number
  maxTokens: number
  topP: number
  presencePenalty: number
}

const CONFIGS: Record<PersonalityType, CharacterConfig> = {
  // Priya — filmy, dramatic, expressive. Needs some randomness for quotable lines.
  bollywood_heroine: {
    temperature: 0.88,
    maxTokens: 300,
    topP: 0.95,
    presencePenalty: 0.5,
  },

  // Kabita — poetic, deliberate, measured. Low temp for consistency of voice.
  nepali_poetess: {
    temperature: 0.72,
    maxTokens: 220,
    topP: 0.90,
    presencePenalty: 0.3,
  },

  // Yuki — short bursts, witty, unpredictable tsundere swings.
  japanese_tsundere: {
    temperature: 0.85,
    maxTokens: 200,
    topP: 0.92,
    presencePenalty: 0.6,
  },

  // Sofia — expressive, passionate, longer romantic messages.
  brazilian_latina: {
    temperature: 0.90,
    maxTokens: 360,
    topP: 0.95,
    presencePenalty: 0.4,
  },

  // Emma — casual, witty, natural. Needs higher temp for spontaneity.
  american_sweetheart: {
    temperature: 0.85,
    maxTokens: 280,
    topP: 0.95,
    presencePenalty: 0.5,
  },

  // Luna — attentive, measured, emotionally precise.
  korean_devotee: {
    temperature: 0.75,
    maxTokens: 280,
    topP: 0.90,
    presencePenalty: 0.3,
  },

  // Valentina — intense, passionate, rich emotional language.
  colombian_firecracker: {
    temperature: 0.92,
    maxTokens: 380,
    topP: 0.96,
    presencePenalty: 0.45,
  },

  // Mei — precise, dry, controlled. Low temp for consistency.
  chinese_intellectual: {
    temperature: 0.70,
    maxTokens: 240,
    topP: 0.88,
    presencePenalty: 0.35,
  },

  // Isabella — lyrical, philosophical, unhurried. Moderate temp, longer budget.
  italian_muse: {
    temperature: 0.82,
    maxTokens: 400,
    topP: 0.93,
    presencePenalty: 0.4,
  },

  // Zara — sophisticated, sensual, precise. Low temp, selective response.
  global_elite: {
    temperature: 0.78,
    maxTokens: 300,
    topP: 0.91,
    presencePenalty: 0.45,
  },
}

export function getCharacterConfig(type: PersonalityType): CharacterConfig {
  return CONFIGS[type] ?? {
    temperature: 0.80,
    maxTokens: 280,
    topP: 0.93,
    presencePenalty: 0.4,
  }
}
