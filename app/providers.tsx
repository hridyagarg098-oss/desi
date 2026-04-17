'use client'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { Toaster } from 'sonner'
import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

if (typeof window !== 'undefined') {
  const phKey = process.env.NEXT_PUBLIC_POSTHOG_KEY || 'phc_placeholder'
  const phHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'
  
  // Only init if we actually have a valid key (avoid crashing if not configured)
  if (phKey !== 'phc_placeholder') {
    posthog.init(phKey, {
      api_host: phHost,
      person_profiles: 'identified_only',
      // Disable automatic pageview capture, as we capture manually in the Provider
      capture_pageview: false 
    })
  }
}

function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname
      if (searchParams && searchParams.toString()) {
        url = url + `?${searchParams.toString()}`
      }
      if (posthog.__loaded) {
          posthog.capture('$pageview', {
            $current_url: url,
          })
      }
    }
  }, [pathname, searchParams])

  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      <Toaster position="top-center" richColors theme="system" closeButton />
      {children}
    </PostHogProvider>
  )
}
