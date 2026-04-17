/**
 * DesiDarling — Plan limits
 * Only two plans exist: free (starter) and trial (₹20/day)
 */
export const PLAN_LIMITS = {
  free: {
    tokens_per_day:       35,   // ~30-40 messages
    images_per_day:        2,   // 2 photos/day
    call_seconds_per_day:  25,  // 25 seconds call
  },
  trial: {
    tokens_per_day:       70,   // extra 35 bonus tokens
    images_per_day:        6,   // 6 photos/day
    call_seconds_per_day: 300,  // 5 minutes call
  },
} as const

export type Plan = keyof typeof PLAN_LIMITS

export interface UsageProfile {
  id?: string
  plan: Plan
  tokens: number             // remaining tokens (decremented per message)
  images_today: number       // images generated today
  call_seconds_today: number // call seconds used today
  tokens_today: number       // tokens used today (for stats)
  usage_reset_at: string
  trial_expires_at?: string | null
}

/** Returns limits for a plan (defaults to free if unknown) */
export function getPlanLimits(plan: string) {
  return PLAN_LIMITS[plan as Plan] ?? PLAN_LIMITS.free
}

/**
 * Check if the user's daily usage is within limits.
 * Returns allowed=false + reason when over limit.
 */
export function checkUsageLimit(
  profile: UsageProfile,
  resource: 'token' | 'image' | 'call'
): { allowed: boolean; reason?: string; limit: number; used: number } {
  const plan = (profile.plan || 'free') as Plan
  const limits = getPlanLimits(plan)

  // Check trial expiry first
  if (plan === 'trial' && profile.trial_expires_at) {
    if (new Date(profile.trial_expires_at) < new Date()) {
      return { allowed: false, reason: 'trial_expired', limit: 0, used: 0 }
    }
  }

  // Treat null/undefined tokens as full allowance on first use
  const tokens = profile.tokens ?? limits.tokens_per_day

  switch (resource) {
    case 'token':
      return {
        allowed: tokens > 0,
        reason: tokens <= 0 ? 'token_limit' : undefined,
        limit: limits.tokens_per_day,
        used: limits.tokens_per_day - tokens,
      }
    case 'image':
      return {
        allowed: (profile.images_today ?? 0) < limits.images_per_day,
        reason: (profile.images_today ?? 0) >= limits.images_per_day ? 'image_limit' : undefined,
        limit: limits.images_per_day,
        used: profile.images_today ?? 0,
      }
    case 'call':
      return {
        allowed: (profile.call_seconds_today ?? 0) < limits.call_seconds_per_day,
        reason: (profile.call_seconds_today ?? 0) >= limits.call_seconds_per_day ? 'call_limit' : undefined,
        limit: limits.call_seconds_per_day,
        used: profile.call_seconds_today ?? 0,
      }
  }
}

/**
 * Hindi/English user-facing limit messages
 */
export function getLimitMessage(reason: string, plan: Plan): string {
  const isFree = !plan || plan === 'free'
  const msgs: Record<string, string> = {
    token_limit: isFree
      ? 'Aaj ke saare tokens khatam ho gaye jaan 😢 Sirf ₹20 mein 1 din ka trial lo — 70 tokens milenge!'
      : 'Aaj ka trial time khatam! Kal phir milenge 🌙 Ya dobara ₹20 mein renew karo.',
    image_limit: isFree
      ? 'Aaj ki 2 photos ho gayi jaan 😊 Trial lo ₹20 mein — 6 photos milenge roz!'
      : 'Aaj ki 6 photos khatam! Kal nayi photos milenge ✨',
    call_limit: isFree
      ? 'Call time khatam jaan 😢 ₹20 mein trial lo — 5 minutes milenge!'
      : 'Aaj ki 5 minute call khatam! Kal phir baat karte hain 💕',
    trial_expired: '⏰ Aapka 1 din ka trial khatam ho gaya! Phir se sirf ₹20 mein renew karo 🌸',
  }
  return msgs[reason] || 'Daily limit reached. ₹20 mein trial lo!'
}
