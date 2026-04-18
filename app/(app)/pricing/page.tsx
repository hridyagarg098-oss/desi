'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Zap, Sparkles, CreditCard, Shield, Clock, Crown, Flame } from 'lucide-react'
import { PaymentModal } from '@/components/payment/PaymentModal'

const FEATURES_FREE = [
  '35 chat tokens / day',
  '2 image generations / day',
  '25 seconds voice call / day',
  'All all companions',
  'Basic Hinglish mode',
]

const FEATURES_PREMIUM_NO = [
  'Extended call time',
  'More image generations',
  'Extra chat tokens',
]

const FEATURES_TRIAL = [
  '70 chat tokens for the day',
  '6 image generations / day',
  '5 minutes voice call / day',
  'All all companions',
  'Priority AI response',
  'Smart Hinglish memory',
]

export default function PricingPage() {
  const [paymentOpen, setPaymentOpen] = useState(false)

  return (
    <div
      className="min-h-screen px-4 sm:px-6 py-10 pb-28 lg:pb-10"
      style={{ background: 'linear-gradient(160deg, #0C0008 0%, #1A000F 50%, #0C0008 100%)' }}
    >
      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(ellipse, #9F1239 0%, transparent 70%)' }} />
        <div className="absolute bottom-20 right-1/3 w-64 h-64 rounded-full blur-3xl opacity-10"
          style={{ background: 'radial-gradient(circle, #D97706 0%, transparent 70%)' }} />
      </div>

      <div className="relative max-w-3xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-semibold"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#F59E0B' }}>
            <Flame size={14} />
            Simple, transparent pricing
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
            <span style={{ background: 'linear-gradient(135deg, #FFF1E6, #F9A8D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Choose Your
            </span>
            {' '}
            <span style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Velvet Plan
            </span>
          </h1>
          <p className="text-white/40 text-sm">Pyaar ka subscription — sirf ₹20 mein premium experience 💛</p>
        </motion.div>

        {/* Plan cards */}
        <div className="grid sm:grid-cols-2 gap-6 mb-10">
          {/* FREE */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div className="h-full flex flex-col p-7 rounded-3xl relative overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(20px)',
              }}>
              <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' }} />

              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Zap size={22} className="text-white/60" />
              </div>

              <h3 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Free</h3>
              <p className="text-xs text-white/35 mb-6">Start exploring without spending a rupee</p>

              <div className="mb-8">
                <span className="text-4xl font-bold text-white">₹0</span>
                <span className="text-sm text-white/30 ml-2">/ forever</span>
              </div>

              <ul className="space-y-3 flex-1 mb-8">
                {FEATURES_FREE.map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm text-white/60">
                    <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                      style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
                      <Check size={11} className="text-[#F59E0B]" />
                    </div>
                    {f}
                  </li>
                ))}
                {FEATURES_PREMIUM_NO.map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm text-white/20 line-through">
                    <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <Check size={11} className="text-white/20" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>

              <button disabled className="w-full py-3.5 rounded-xl font-semibold text-sm text-white/30 cursor-not-allowed"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                Current Plan
              </button>
            </div>
          </motion.div>

          {/* TRIAL — FEATURED */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            <div className="h-full flex flex-col p-7 rounded-3xl relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(159,18,57,0.25), rgba(125,10,44,0.15))',
                border: '1px solid rgba(245,158,11,0.35)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 0 60px rgba(159,18,57,0.3), 0 0 120px rgba(159,18,57,0.15)',
              }}>
              {/* Top shimmer */}
              <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.8), transparent)' }} />
              {/* BG glow */}
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-30"
                style={{ background: 'radial-gradient(circle, #9F1239 0%, transparent 70%)' }} />

              {/* Best value badge */}
              <div className="absolute top-5 right-5 flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full"
                style={{ background: 'linear-gradient(135deg, #D97706, #F59E0B)', color: '#0C0008' }}>
                <Zap size={9} fill="currentColor" /> BEST VALUE
              </div>

              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 relative"
                style={{ background: 'linear-gradient(135deg, #9F1239, #7D0A2C)', boxShadow: '0 0 30px rgba(159,18,57,0.5)' }}>
                <Sparkles size={22} className="text-[#F59E0B]" />
              </div>

              <h3 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>1-Day Trial</h3>
              <p className="text-xs text-white/45 mb-6">Ek din premium experience lo — no strings attached</p>

              <div className="mb-8">
                <span className="text-4xl font-bold text-white">₹20</span>
                <span className="text-sm text-white/40 ml-2">/ 24 hours</span>
              </div>

              <ul className="space-y-3 flex-1 mb-8">
                {FEATURES_TRIAL.map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm text-white/70">
                    <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                      style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)' }}>
                      <Check size={11} className="text-[#F59E0B]" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>

              <motion.button
                onClick={() => setPaymentOpen(true)}
                whileTap={{ scale: 0.97 }}
                className="w-full py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 relative overflow-hidden transition-all"
                style={{ background: 'linear-gradient(135deg, #9F1239, #C4934A)', boxShadow: '0 0 30px rgba(159,18,57,0.5)' }}
              >
                {/* shimmer */}
                <motion.div
                  className="absolute inset-0"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }}
                />
                <Sparkles size={15} />
                Start Trial — ₹20
              </motion.button>

              <p className="text-center text-[10px] text-white/25 mt-3">
                UPI payment · Instant activation · Valid 24 hours
              </p>
            </div>
          </motion.div>
        </div>

        {/* Info strip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-5 rounded-2xl mb-6"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(245,158,11,0.15)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(217,119,6,0.15)', border: '1px solid rgba(217,119,6,0.25)' }}>
              <CreditCard size={18} className="text-[#D97706]" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-white mb-1">UPI Payment — Instant &amp; Safe</h3>
              <p className="text-sm text-white/40">
                Pay ₹20 via any UPI app (GPay, PhonePe, Paytm). Trial activates instantly after payment.
              </p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-1 text-[10px] text-emerald-400 font-semibold px-2 py-1 rounded-full"
              style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
              <Shield size={10} /> Secure
            </div>
          </div>
        </motion.div>

        {/* Footer meta */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {[
            { icon: Clock, text: 'Per-user daily limits' },
            { icon: Shield, text: 'Prices in INR' },
            { icon: Crown, text: 'Har ID ke liye alag limit' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 text-xs text-white/25">
              <Icon size={11} />
              {text}
            </div>
          ))}
        </div>
      </div>

      <PaymentModal
        open={paymentOpen}
        reason="upgrade"
        onClose={() => setPaymentOpen(false)}
        onSuccess={() => setPaymentOpen(false)}
      />
    </div>
  )
}
