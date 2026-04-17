'use client'

import { createBrowserClient } from '@supabase/ssr'

/**
 * Client-side Supabase client.
 * No Database generic — uses default typing to avoid strict 'never' inference.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
