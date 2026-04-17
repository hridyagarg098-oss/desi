'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Shield } from 'lucide-react'

export default function AgeGatePage() {
  const [declined, setDeclined] = useState(false)
  const router = useRouter()

  const handleVerify = () => {
    // Set session cookie for age verification
    document.cookie = 'age_verified=1; max-age=86400; path=/'
    router.push('/login')
  }

  return (
    <main className="min-h-screen bg-maroon-gradient flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative henna motif */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: "url('/henna-motif.svg')", backgroundSize: '500px', backgroundRepeat: 'repeat' }}
      />

      {/* Gold corner ornaments */}
      <div className="absolute top-8 left-8 text-gold-600 opacity-30 text-4xl">❈</div>
      <div className="absolute top-8 right-8 text-gold-600 opacity-30 text-4xl">❈</div>
      <div className="absolute bottom-8 left-8 text-gold-600 opacity-30 text-4xl">❈</div>
      <div className="absolute bottom-8 right-8 text-gold-600 opacity-30 text-4xl">❈</div>

      <AnimatePresence mode="wait">
        {!declined ? (
          <motion.div
            key="gate"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="card-glass max-w-md w-full mx-auto p-10 text-center border border-white/20"
          >
            {/* Logo */}
            <div className="text-5xl mb-4">💕</div>
            <h1 className="text-3xl font-bold text-maroon-800 mb-2">DesiDarling.ai</h1>
            <div className="w-16 h-px bg-gold-600 mx-auto mb-6 opacity-60" />

            {/* Warning */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <Shield size={18} className="text-gold-600" />
              <span className="text-sm font-semibold text-maroon-800/80 uppercase tracking-wide">
                Adults Only — 18+
              </span>
            </div>

            <p className="text-maroon-800/60 text-sm leading-relaxed mb-8">
              DesiDarling.ai is an AI companion platform designed for adults 18 years and older.
              Content is romantic and mature in nature. Please confirm your age to continue.
            </p>

            {/* Desi ornamental border */}
            <div className="text-gold-500/40 text-xs tracking-widest mb-8">
              ❧ ── ✦ ── ❧
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleVerify}
                className="btn-primary w-full py-4 text-base"
              >
                ✓ Yes, I am 18 or older — Enter
              </button>
              <button
                onClick={() => setDeclined(true)}
                className="text-sm text-maroon-800/40 hover:text-maroon-800/70 transition-colors py-2"
              >
                No, I am under 18 — Exit
              </button>
            </div>

            <p className="text-xs text-maroon-800/30 mt-6">
              By entering, you confirm you are 18+ and agree to our Terms of Service and Privacy Policy.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="declined"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-white"
          >
            <div className="text-6xl mb-4">🙏</div>
            <h2 className="text-2xl font-bold mb-2">Thank you for being honest</h2>
            <p className="text-white/60">This platform is for adults 18+. Come back when you&apos;re older.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
