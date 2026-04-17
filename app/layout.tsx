import type { Metadata, Viewport } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
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
  title: 'DesiDarling.ai — Your Perfect North Indian AI Girlfriend',
  description:
    'Meet your Desi Darling — flirty Hinglish chats, Bollywood nights, chai dates & warm desi romance. The most premium Indian AI companion experience.',
  keywords: ['AI girlfriend', 'desi AI', 'Indian AI companion', 'Hinglish chat', 'AI chat India'],
  openGraph: {
    title: 'DesiDarling.ai — Your Perfect North Indian AI Girlfriend',
    description: 'Warm Hinglish chats, Bollywood romance, and late-night chai dates — always yours.',
    type: 'website',
    locale: 'en_IN',
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#9F1239',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${playfair.variable} ${dmSans.variable}`}>
      <head />
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
