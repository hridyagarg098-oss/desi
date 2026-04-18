import type { Metadata, Viewport } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Providers } from './providers'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '600', '700', '900'],
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Velvet — AI Companions Worth Remembering',
  description:
    'Meet Velvet companions from around the world — deeply personal, culturally authentic AI conversations that feel real. Available 24/7.',
  keywords: ['AI companion', 'AI girlfriend', 'Velvet AI', 'AI chat', 'virtual companion', 'AI relationship'],
  openGraph: {
    title: 'Velvet — AI Companions Worth Remembering',
    description: 'Deeply personal, culturally authentic AI companions. Available 24/7.',
    type: 'website',
    locale: 'en_US',
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#9F1239',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,      // prevents iOS zoom on input tap
  viewportFit: 'cover',     // unlocks env(safe-area-inset-bottom) on iPhone notch/home bar
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${playfair.variable} ${dmSans.variable}`}>
      <head />
      <body className="antialiased">
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  )
}
