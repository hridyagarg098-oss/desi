'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'
import {
  Sparkles, Heart, MessageCircle, Phone, Star,
  ChevronRight, Flame, Zap, Shield, User2, Crown,
} from 'lucide-react'
import { PREMADE_CHARACTERS } from '@/types'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

// ─── Animation variants ───────────────────────────────────────────────────────

const fadeUp = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0,  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
}

const FEATURED = PREMADE_CHARACTERS.slice(0, 4)

// ─── Particle background ──────────────────────────────────────────────────────

function HeroParticles() {
  const particles = Array.from({ length: 30 })
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 1.5 + (i % 3),
            height: 1.5 + (i % 3),
            left: `${(i * 13 + 5) % 100}%`,
            top: `${(i * 11 + 8) % 100}%`,
            background: i % 2 === 0
              ? 'rgba(196,147,74,0.55)'
              : 'rgba(192,39,74,0.40)',
          }}
          animate={{
            y: [0, -(20 + (i % 5) * 10), 0],
            opacity: [0.12, 0.5, 0.12],
          }}
          transition={{
            duration: 4 + (i % 5),
            repeat: Infinity,
            delay: i * 0.22,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// ─── Character card (hero grid) ───────────────────────────────────────────────

function CharacterCard({ char, i }: { char: typeof FEATURED[0]; i: number }) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href={`/chat/${char.id}`}>
        <div
          className="relative overflow-hidden rounded-2xl cursor-pointer"
          style={{ aspectRatio: '3/4' }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* Card image / gradient */}
          <div
            className="absolute inset-0 transition-transform duration-500"
            style={{
              background: char.avatarGradient || 'linear-gradient(135deg, #8B1538, #C4934A)',
              transform: hovered ? 'scale(1.08)' : 'scale(1)',
            }}
          >
            {char.avatar_url && (
              <img
                src={char.avatar_url}
                alt={char.name}
                className="w-full h-full object-cover object-top"
                style={{ opacity: 0.92 }}
                onError={e => { e.currentTarget.style.display = 'none' }}
              />
            )}
          </div>

          {/* Gold shimmer on hover */}
          <div
            className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(196,147,74,0.12) 0%, transparent 60%)',
              opacity: hovered ? 1 : 0,
            }}
          />

          {/* Bottom gradient & info */}
          <div
            className="absolute bottom-0 left-0 right-0 p-4"
            style={{ background: 'linear-gradient(to top, rgba(8,4,7,0.90) 0%, rgba(8,4,7,0.40) 60%, transparent 100%)' }}
          >
            <p className="font-bold text-white text-base leading-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
              {char.name}
            </p>
            <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(196,147,74,0.80)' }}>
              {char.tagline}
            </p>

            {/* Hover CTA */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 8 }}
              transition={{ duration: 0.25 }}
              className="mt-2.5"
            >
              <span
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, #8B1538, #C4934A)',
                  color: '#fff',
                  boxShadow: '0 0 12px rgba(196,147,74,0.35)',
                }}
              >
                <MessageCircle size={11} /> Baatein Karo
              </span>
            </motion.div>
          </div>

          {/* Corner badge */}
          {i === 0 && (
            <div
              className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold"
              style={{ background: 'rgba(196,147,74,0.85)', color: '#0C0008' }}
            >
              <Flame size={9} /> Popular
            </div>
          )}

          {/* Hover glow border */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none transition-all duration-300"
            style={{
              boxShadow: hovered
                ? 'inset 0 0 0 1.5px rgba(196,147,74,0.50), 0 0 30px rgba(196,147,74,0.20)'
                : 'inset 0 0 0 1px rgba(255,255,255,0.06)',
            }}
          />
        </div>
      </Link>
    </motion.div>
  )
}

// ─── Feature highlight item ───────────────────────────────────────────────────

function FeatureItem({ icon: Icon, title, desc, color }: {
  icon: React.ElementType; title: string; desc: string; color: string
}) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="relative rounded-2xl p-5 overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div
        className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(circle at 30% 30%, ${color}15 0%, transparent 60%)` }}
      />
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
        style={{ background: `${color}20`, border: `1px solid ${color}30` }}
      >
        <Icon size={18} style={{ color }} />
      </div>
      <h3 className="font-semibold text-white text-sm mb-1" style={{ fontFamily: '"Playfair Display", serif' }}>
        {title}
      </h3>
      <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.40)' }}>
        {desc}
      </p>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef })
  const parallaxY = useTransform(scrollYProgress, [0, 1], ['0%', '25%'])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setAuthUser(data.user)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <main
      className="min-h-screen overflow-x-hidden"
      style={{ background: 'linear-gradient(180deg, #06000A 0%, #0C0008 30%, #080407 100%)' }}
    >

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 inset-x-0 z-50"
        style={{
          background: 'rgba(6,0,10,0.75)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400 }}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #8B1538, #C4934A)', boxShadow: '0 0 12px rgba(196,147,74,0.35)' }}
            >
              <Heart className="w-4 h-4 text-white fill-current" />
            </motion.div>
            <div className="leading-none">
              <span className="font-bold text-lg text-white tracking-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
                Velvet
              </span>
              <span className="font-bold text-lg" style={{ color: '#C4934A' }}>.ai</span>
            </div>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {[
              { href: '/explore', label: 'Explore' },
              { href: '/create',  label: 'Create'  },
              { href: '#pricing', label: 'Pricing' },
            ].map(({ href, label }) => (
              <Link key={href} href={href}
                className="hover:text-white transition-colors duration-200 relative group"
              >
                {label}
                <span className="absolute -bottom-0.5 left-0 w-0 h-px group-hover:w-full transition-all duration-300"
                  style={{ background: '#C4934A' }} />
              </Link>
            ))}
          </div>

          {/* Auth buttons */}
          <div className="flex items-center gap-2.5">
            {!authLoading && (
              authUser ? (
                <>
                  <span
                    className="text-xs font-medium hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                    style={{ color: '#C4934A', background: 'rgba(196,147,74,0.10)', border: '1px solid rgba(196,147,74,0.20)' }}
                  >
                    <User2 size={12} />{authUser.email?.split('@')[0]}
                  </span>
                  <Link href="/explore"
                    className="text-sm font-semibold px-5 py-2 rounded-full text-white transition-all hover:opacity-90 flex items-center gap-1.5"
                    style={{ background: 'linear-gradient(135deg, #8B1538, #C4934A)', boxShadow: '0 0 16px rgba(139,21,56,0.35)' }}
                  >
                    <Sparkles size={13} /> Go to App
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login"
                    className="text-sm font-medium px-4 py-2 rounded-full transition-all"
                    style={{ color: 'rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}
                  >
                    Sign In
                  </Link>
                  <Link href="/explore"
                    className="text-sm font-semibold px-5 py-2 rounded-full text-white transition-all hover:opacity-90 flex items-center gap-1.5"
                    style={{ background: 'linear-gradient(135deg, #8B1538, #C4934A)', boxShadow: '0 0 16px rgba(139,21,56,0.30)' }}
                  >
                    Browse Free
                  </Link>
                </>
              )
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative pt-16 min-h-screen flex items-center overflow-hidden">

        {/* Background layers */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top maroon orb */}
          <div className="absolute top-[-10%] left-[50%] -translate-x-1/2 w-[700px] h-[500px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(139,21,56,0.28) 0%, transparent 70%)', filter: 'blur(70px)' }} />
          {/* Gold accent orb */}
          <div className="absolute bottom-[10%] right-[-5%] w-[400px] h-[400px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(196,147,74,0.15) 0%, transparent 70%)', filter: 'blur(60px)' }} />
          {/* Grid line texture */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <HeroParticles />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 grid lg:grid-cols-2 gap-16 items-center w-full">

          {/* ── Copy ───────────────────────────────────────────────────── */}
          <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-7">

            {/* Badge */}
            <motion.div variants={fadeUp}>
              <span
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold"
                style={{ background: 'rgba(196,147,74,0.10)', border: '1px solid rgba(196,147,74,0.25)', color: '#E8B060' }}
              >
                <Zap size={12} className="fill-current" />
                AI-Powered Desi Romance
              </span>
            </motion.div>

            {/* Headline */}
            <motion.div variants={fadeUp}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight"
                style={{ fontFamily: '"Playfair Display", serif' }}>
                <span className="text-white">Apni </span>
                <span style={{
                  background: 'linear-gradient(135deg, #C4934A 0%, #E8B060 40%, #C0274A 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  Velvet
                </span>
                <br />
                <span className="text-white">Se Milo</span>
                <span style={{ color: '#C0274A' }}> ❤</span>
              </h1>
              <p className="mt-3 text-xl sm:text-2xl font-medium" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: '"Playfair Display", serif', fontStyle: 'italic' }}>
                Your Perfect North Indian AI Companion
              </p>
            </motion.div>

            {/* Subtext */}
            <motion.p variants={fadeUp} className="text-base leading-relaxed max-w-lg" style={{ color: 'rgba(255,255,255,0.50)' }}>
              Flirty Hinglish chats, Bollywood nights, chai dates &amp; warm desi romance —
              <span className="text-white font-medium"> always yours, jaan.</span>
            </motion.p>

            {/* Social proof */}
            <motion.div variants={fadeUp} className="flex items-center gap-4 flex-wrap">
              <div className="flex -space-x-2.5">
                {PREMADE_CHARACTERS.slice(0, 4).map((c) => (
                  <div key={c.id}
                    className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0"
                    style={{
                      background: c.avatarGradient,
                      border: '2px solid rgba(196,147,74,0.40)',
                      boxShadow: '0 0 8px rgba(0,0,0,0.5)',
                    }}>
                    <img src={c.avatar_url} alt={c.name} className="w-full h-full object-cover object-top"
                      onError={e => { e.currentTarget.style.display = 'none' }} />
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1" style={{ color: '#C4934A' }}>
                  {[...Array(5)].map((_, i) => <Star key={i} size={11} fill="currentColor" />)}
                  <span className="text-xs ml-1 font-semibold" style={{ color: '#E8B060' }}>4.9</span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  <span className="font-semibold text-white">50,000+</span> desi hearts connected
                </p>
              </div>
            </motion.div>

            {/* CTA buttons */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
              <Link href="/explore"
                className="flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-base font-bold text-white transition-all hover:scale-[1.03] active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #8B1538 0%, #C0274A 50%, #C4934A 100%)',
                  boxShadow: '0 0 30px rgba(192,39,74,0.45), 0 8px 24px rgba(0,0,0,0.5)',
                }}
              >
                <Sparkles size={18} />
                Browse Darlings — Free
              </Link>
              <Link href="/create"
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold transition-all hover:scale-[1.02] active:scale-95"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(196,147,74,0.30)',
                  color: '#E8B060',
                }}
              >
                Apni Girl Banao <ChevronRight size={16} />
              </Link>
            </motion.div>

            {/* Feature pills */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-2">
              {[
                { icon: MessageCircle, text: 'Hinglish Chat'       },
                { icon: Phone,         text: 'Voice Calling'       },
                { icon: Sparkles,      text: 'AI Photo Gen'        },
                { icon: Heart,         text: 'Bollywood Romance'   },
                { icon: Shield,        text: '100% Private'        },
              ].map(({ icon: Icon, text }) => (
                <span key={text}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    color: 'rgba(255,255,255,0.50)',
                  }}
                >
                  <Icon size={10} style={{ color: '#C4934A' }} />
                  {text}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* ── Hero visual ─────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, x: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="relative flex justify-center"
            style={{ y: parallaxY }}
          >
            <div className="relative w-full max-w-sm">
              {/* Glow halo */}
              <div className="absolute inset-0 rounded-[2.5rem] scale-110 opacity-40"
                style={{ background: 'linear-gradient(135deg, #8B1538, #C4934A)', filter: 'blur(30px)' }} />

              {/* Main image */}
              <Link href="/chat/priya" className="block relative rounded-[2.5rem] overflow-hidden group shadow-2xl"
                style={{ aspectRatio: '3/4', border: '1px solid rgba(196,147,74,0.20)' }}>
                <img
                  src="/avatars/priya.png"
                  alt="Priya — Your Velvet"
                  className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  onError={e => {
                    e.currentTarget.style.display = 'none'
                    const fb = e.currentTarget.parentElement?.querySelector('.hero-fallback') as HTMLElement | null
                    if (fb) fb.style.display = 'flex'
                  }}
                />
                <div className="hero-fallback absolute inset-0 items-center justify-center flex-col gap-4 bg-gradient-to-b from-[#8B1538] to-[#C4934A]" style={{ display: 'none' }}>
                  <span className="text-9xl">🥻</span>
                  <p className="text-white/70 text-sm font-medium">Your Velvet awaits...</p>
                </div>

                {/* Bottom overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-5"
                  style={{ background: 'linear-gradient(to top, rgba(6,0,10,0.88) 0%, transparent 100%)' }}>
                  <p className="font-bold text-xl text-white" style={{ fontFamily: '"Playfair Display", serif' }}>Priya 🌹</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(196,147,74,0.70)' }}>Tap to start chatting →</p>
                </div>

                {/* Hover CTA */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'rgba(8,4,7,0.40)' }}>
                  <span
                    className="flex items-center gap-2 px-6 py-3 rounded-full text-white font-bold text-sm"
                    style={{ background: 'linear-gradient(135deg, #8B1538, #C4934A)', boxShadow: '0 0 20px rgba(196,147,74,0.50)' }}
                  >
                    <MessageCircle size={15} /> Baatein Shuru Karo!
                  </span>
                </div>
              </Link>

              {/* Floating chat bubble */}
              <motion.div
                animate={{ y: [-5, 5, -5] }}
                transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
                className="absolute -left-10 top-1/4 rounded-2xl p-3 flex items-center gap-2.5 shadow-2xl max-w-[185px]"
                style={{
                  background: 'rgba(18,0,14,0.90)',
                  border: '1px solid rgba(196,147,74,0.25)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #8B1538, #C4934A)' }}>
                  <MessageCircle size={13} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Priya says...</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'rgba(196,147,74,0.75)' }}>Arre jaan, kahan ho? ❤️</p>
                </div>
              </motion.div>

              {/* Floating voice badge */}
              <motion.div
                animate={{ y: [5, -5, 5] }}
                transition={{ repeat: Infinity, duration: 3.8, ease: 'easeInOut' }}
                className="absolute -right-8 bottom-1/3 rounded-2xl p-3 flex items-center gap-2.5 shadow-2xl"
                style={{
                  background: 'rgba(18,0,14,0.90)',
                  border: '1px solid rgba(196,147,74,0.25)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #C4934A, #E8B060)' }}>
                  <Phone size={13} style={{ color: '#0C0008' }} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Voice Call</p>
                  <p className="text-[10px] flex items-center gap-1" style={{ color: '#34D399' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> Live now
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Meet the Companions ───────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 relative">
        {/* Section glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(196,147,74,0.30), transparent)' }} />

        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <span
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-5"
              style={{ background: 'rgba(196,147,74,0.10)', border: '1px solid rgba(196,147,74,0.22)', color: '#E8B060' }}
            >
              <Heart size={12} className="fill-current" /> Meet the Companions
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3" style={{ fontFamily: '"Playfair Display", serif' }}>
              Find Your Perfect <span style={{ color: '#C4934A' }}>Desi Girl</span>
            </h2>
            <p className="max-w-xl mx-auto text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.40)' }}>
              Each companion has a unique personality, backstory, and cultural voice.
              Click any card to start chatting instantly — <span className="text-white font-medium">bilkul free!</span>
            </p>
          </motion.div>

          {/* Character grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
            {FEATURED.map((char, i) => (
              <CharacterCard key={char.id} char={char} i={i} />
            ))}
          </div>

          {/* View all CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-10"
          >
            <Link href="/explore"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all hover:scale-105"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(196,147,74,0.25)', color: '#C4934A' }}
            >
              Meet All Companions <ChevronRight size={15} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3" style={{ fontFamily: '"Playfair Display", serif' }}>
              Sab Kuch Ek Jagah
            </h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Everything you need for the perfect desi AI romance experience
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: MessageCircle, title: 'Hinglish Flirty Chat',  desc: 'Real desi banter, poetry, and cute nicknames in Hindi & English.',   color: '#C4934A' },
              { icon: Phone,         title: 'Voice Calling',          desc: 'Talk to your darling with a real-time AI voice that feels human.',    color: '#C0274A' },
              { icon: Sparkles,      title: 'AI Photo Generation',   desc: 'Ask your darling for photos and get beautiful AI-generated images.',   color: '#8B63D4' },
              { icon: Heart,         title: 'Bollywood Romance',     desc: 'Movie nights, songs, and all those filmy romantic moments.',           color: '#E05070' },
              { icon: Crown,         title: 'Your Own AI Girl',       desc: 'Create a custom companion with your preferred personality & look.',    color: '#E8B060' },
              { icon: Shield,        title: '100% Private',           desc: 'End-to-end privacy. Your conversations stay yours forever.',           color: '#34D399' },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
              >
                <FeatureItem {...f} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-4 sm:px-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(196,147,74,0.25), transparent)' }} />

        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3" style={{ fontFamily: '"Playfair Display", serif' }}>
              Simple Pricing
            </h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.40)' }}>
              Start free. Upgrade anytime.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
            {/* Free plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="rounded-2xl p-6"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <h3 className="font-bold text-lg text-white mb-1" style={{ fontFamily: '"Playfair Display", serif' }}>Free</h3>
              <p className="text-3xl font-bold text-white mb-1">₹0</p>
              <p className="text-xs mb-6" style={{ color: 'rgba(255,255,255,0.35)' }}>Forever free</p>
              <ul className="space-y-2.5 mb-6">
                {[
                  '35 chat tokens / day',
                  '30 sec voice call / day',
                  '2 AI photos / day',
                  'Access all companions',
                ].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>
                    <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[10px]"
                      style={{ background: 'rgba(196,147,74,0.20)', color: '#C4934A' }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/explore"
                className="flex items-center justify-center py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.70)' }}
              >
                Start Free
              </Link>
            </motion.div>

            {/* Trial/Premium plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl p-6 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(139,21,56,0.35) 0%, rgba(196,147,74,0.15) 100%)',
                border: '1px solid rgba(196,147,74,0.30)',
                boxShadow: '0 0 40px rgba(139,21,56,0.20)',
              }}
            >
              {/* Popular badge */}
              <div className="absolute top-0 right-0 px-3 py-1 text-[10px] font-bold rounded-bl-xl rounded-tr-xl"
                style={{ background: 'linear-gradient(135deg, #8B1538, #C4934A)', color: '#fff' }}>
                MOST POPULAR
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <Zap size={14} className="fill-current" style={{ color: '#E8B060' }} />
                <h3 className="font-bold text-lg text-white" style={{ fontFamily: '"Playfair Display", serif' }}>Trial</h3>
              </div>
              <p className="text-3xl font-bold text-white mb-1">₹20<span className="text-base font-normal" style={{ color: 'rgba(255,255,255,0.50)' }}>/day</span></p>
              <p className="text-xs mb-6" style={{ color: 'rgba(196,147,74,0.70)' }}>Full access for a day</p>
              <ul className="space-y-2.5 mb-6">
                {[
                  'Unlimited chat tokens',
                  '5 min voice calls',
                  '10 AI photos / day',
                  'Priority AI responses',
                  'Premium characters',
                ].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
                    <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[10px]"
                      style={{ background: 'rgba(196,147,74,0.25)', color: '#E8B060' }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/pricing"
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #8B1538, #C4934A)', boxShadow: '0 0 20px rgba(139,21,56,0.35)' }}
              >
                <Zap size={13} className="fill-current" /> Try for ₹20
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(139,21,56,0.25) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center relative"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>
            Pyaar Ka Safar
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #C4934A, #E8B060)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Aaj Se Shuru Karo
            </span>
          </h2>
          <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.40)' }}>
            Join thousands of users who found their perfect desi AI companion — free to start.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/explore"
              className="flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-base font-bold text-white transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #8B1538, #C0274A, #C4934A)',
                boxShadow: '0 0 35px rgba(192,39,74,0.45)',
              }}
            >
              <Sparkles size={18} /> Browse Darlings — Free
            </Link>
            <Link href="/create"
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold transition-all hover:scale-105"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(196,147,74,0.25)', color: '#C4934A' }}
            >
              Create Your Own Girl
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="pb-8 pt-12 px-4 sm:px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="w-4 h-4 fill-current" style={{ color: '#C4934A' }} />
            <span className="font-bold" style={{ color: 'rgba(255,255,255,0.60)', fontFamily: '"Playfair Display", serif' }}>
              Velvet
            </span>
          </Link>
          <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.22)' }}>
            Made with ❤️ in India · AI companions for entertainment only · 18+ only
          </p>
          <div className="flex items-center gap-4 text-xs" style={{ color: 'rgba(255,255,255,0.30)' }}>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms"   className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
