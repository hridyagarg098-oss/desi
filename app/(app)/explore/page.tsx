'use client'

import { useState, useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import Link from 'next/link'
import { Heart, MessageCircle, Sparkles, Filter, Star, Flame, Mic } from 'lucide-react'
import { PREMADE_CHARACTERS, type Character } from '@/types'
import { cn } from '@/lib/utils'

const FILTERS = ['All', 'Free', 'Premium', 'Intense', 'Romantic', 'Playful', 'Asia', 'Latin', 'Europe', 'Americas']

const SKIN_EMOJIS: Record<string, string> = {
  ivory:    '❄️',
  fair:     '🌸',
  wheatish: '🌿',
  golden:   '✨',
  caramel:  '🌊',
  dusky:    '🌙',
}

function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 300, damping: 30 })
  const springY = useSpring(y, { stiffness: 300, damping: 30 })
  const rotateX = useTransform(springY, [-0.5, 0.5], ['8deg', '-8deg'])
  const rotateY = useTransform(springX, [-0.5, 0.5], ['-8deg', '8deg'])

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    x.set((e.clientX - rect.left) / rect.width - 0.5)
    y.set((e.clientY - rect.top) / rect.height - 0.5)
  }
  function onMouseLeave() {
    x.set(0)
    y.set(0)
  }
  return (
    <motion.div
      ref={ref}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: '1000px' }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default function ExplorePage() {
  const [activeFilter, setActiveFilter] = useState('All')
  const [likedChars, setLikedChars] = useState<Set<string>>(new Set())

  const filtered = PREMADE_CHARACTERS.filter(c => {
    if (activeFilter === 'All') return true
    if (activeFilter === 'Free') return !c.is_premium
    if (activeFilter === 'Premium') return c.is_premium
    if (activeFilter === 'Intense') return c.heat_level >= 4
    if (activeFilter === 'Romantic') return ['devoted_partner', 'long_distance_lover', 'intense_romance'].includes(c.relationship_vibe)
    if (activeFilter === 'Playful') return ['casual_flirt', 'playful_tease', 'best_friend_crush'].includes(c.relationship_vibe)
    if (activeFilter === 'Asia') return ['priya', 'kabita', 'yuki', 'luna', 'mei'].includes(c.id)
    if (activeFilter === 'Latin') return ['sofia', 'valentina'].includes(c.id)
    if (activeFilter === 'Europe') return ['isabella', 'zara'].includes(c.id)
    if (activeFilter === 'Americas') return ['emma', 'sofia', 'valentina'].includes(c.id)
    return true
  })

  return (
    <div
      className="min-h-screen px-3 sm:px-6 py-5 sm:py-8 pb-24 lg:pb-8"
      style={{ background: 'linear-gradient(160deg, #0C0008 0%, #1A000F 50%, #0C0008 100%)' }}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, #9F1239 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-10"
          style={{ background: 'radial-gradient(circle, #D97706 0%, transparent 70%)' }} />
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-10">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold mb-1 sm:mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            <span style={{ background: 'linear-gradient(135deg, #FFF1E6, #F59E0B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Meet the Companions
            </span>
          </h1>
          <p className="text-white/40 text-xs sm:text-sm">10 personalities from around the world — find yours, or build your own ✨</p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-2 overflow-x-auto no-scrollbar mb-8 pb-2"
        >
          <Filter size={14} className="text-white/30 flex-shrink-0" />
          {FILTERS.map(f => (
            <motion.button
              key={f}
              onClick={() => setActiveFilter(f)}
              whileTap={{ scale: 0.93 }}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border',
                activeFilter === f
                  ? 'text-white border-[#F59E0B]/60 shadow-lg'
                  : 'border-white/10 text-white/50 hover:border-white/20 hover:text-white/70'
              )}
              style={activeFilter === f ? {
                background: 'linear-gradient(135deg, #9F1239, #7D0A2C)',
                boxShadow: '0 0 20px rgba(159,18,57,0.4)',
              } : {
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(10px)',
              }}
            >
              {f}
            </motion.button>
          ))}
        </motion.div>

        {/* Create CTA Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-10 p-6 rounded-2xl flex items-center justify-between gap-4 relative overflow-hidden border border-[#F59E0B]/20"
          style={{
            background: 'linear-gradient(135deg, rgba(159,18,57,0.15), rgba(217,119,6,0.10))',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* shimmer line */}
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.6), transparent)' }} />
          <div>
            <h3 className="font-bold text-white mb-1 flex items-center gap-2">
              <Sparkles size={16} className="text-[#F59E0B]" />
              Create Your Custom Companion
            </h3>
            <p className="text-sm text-white/45">Design her from the ground up — personality, appearance, voice, and more.</p>
          </div>
          <Link
            href="/create"
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white flex-shrink-0 transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #9F1239, #C4934A)', boxShadow: '0 0 20px rgba(159,18,57,0.4)' }}
          >
            <Sparkles size={14} /> Create
          </Link>
        </motion.div>

        {/* Character grid */}
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 sm:gap-4 space-y-3 sm:space-y-4">
          {filtered.map((char, i) => (
            <motion.div
              key={char.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="break-inside-avoid"
            >
              <TiltCard>
                <CharacterCard
                  character={char}
                  liked={likedChars.has(char.id)}
                  onLike={() => setLikedChars(prev => {
                    const next = new Set(prev)
                    if (next.has(char.id)) next.delete(char.id)
                    else next.add(char.id)
                    return next
                  })}
                />
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CharacterCard({
  character: c, liked, onLike,
}: { character: Character; liked: boolean; onLike: () => void }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="overflow-hidden rounded-3xl group relative transition-all duration-500"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: hovered ? '1px solid rgba(245,158,11,0.5)' : '1px solid rgba(255,255,255,0.07)',
        boxShadow: hovered ? '0 0 40px rgba(245,158,11,0.15), 0 20px 60px rgba(0,0,0,0.6)' : '0 8px 32px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(16px)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Avatar */}
      <div
        className="w-full relative overflow-hidden"
        style={{ height: 'clamp(130px, 30vw, 200px)', background: c.avatarGradient || 'linear-gradient(135deg, #8B1538, #C4934A)' }}
      >
        <img
          src={c.avatar_url}
          alt={c.name}
          className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-110"
          onError={e => {
            const t = e.currentTarget
            t.style.display = 'none'
            const fallback = t.parentElement?.querySelector('.avatar-fallback') as HTMLElement | null
            if (fallback) fallback.style.display = 'flex'
          }}
        />
        <div className="avatar-fallback absolute inset-0 items-center justify-center" style={{ display: 'none' }}>
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white/30 shadow-lg">
            <span className="text-4xl font-bold text-white">{c.name.charAt(0)}</span>
          </div>
        </div>

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Skin tone / nationality badge */}
        <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs text-white/80 font-medium">
          {c.nationality}
        </div>

        {/* Online indicator */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2 py-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-white/80 font-medium">Online</span>
        </div>

        {/* Premium badge */}
        {c.is_premium && (
          <div className="absolute top-3 left-3 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'linear-gradient(135deg, #D97706, #F59E0B)', color: '#0C0008' }}>
            <Star size={8} fill="currentColor" /> Premium
          </div>
        )}

        {/* Like button */}
        <motion.button
          onClick={onLike}
          whileTap={{ scale: 1.4 }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <Heart size={14} fill={liked ? '#F43F5E' : 'none'} stroke={liked ? '#F43F5E' : 'rgba(255,255,255,0.7)'} strokeWidth={2} />
        </motion.button>

        {/* Hover reveal personality tags */}
        <motion.div
          animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 8 }}
          transition={{ duration: 0.25 }}
          className="absolute inset-x-0 bottom-10 px-3 flex flex-wrap gap-1"
        >
          {c.personality_tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-[9px] px-2 py-0.5 rounded-full font-semibold"
              style={{ background: 'rgba(159,18,57,0.8)', color: '#FFE4D6', backdropFilter: 'blur(8px)' }}>
              {tag}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Info */}
      <div className="p-2.5 sm:p-4">
        <div className="flex items-start justify-between mb-0.5">
          <h3 className="font-bold text-white text-sm sm:text-base" style={{ fontFamily: "'Playfair Display', serif" }}>{c.name}</h3>
          <span className="text-[10px] sm:text-xs text-emerald-400 font-medium">{c.is_premium ? '⭐' : 'Free'}</span>
        </div>
        <p className="text-[10px] sm:text-xs text-white/40 mb-2 line-clamp-2">{c.tagline}</p>

        {/* Heat level */}
        <div className="flex items-center gap-0.5 sm:gap-1 mb-2 sm:mb-4">
          <Flame size={9} className="text-[#F59E0B]" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-1 flex-1 rounded-full transition-colors"
              style={{ background: i < c.heat_level ? 'linear-gradient(90deg, #9F1239, #D97706)' : 'rgba(255,255,255,0.08)' }} />
          ))}
        </div>

        <div className="flex gap-1.5">
          <Link
            href={`/chat/${c.id}`}
            className="flex items-center justify-center gap-1 flex-1 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-semibold text-white transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #9F1239, #C4934A)', boxShadow: '0 0 15px rgba(159,18,57,0.3)' }}
          >
            <MessageCircle size={11} />Chat
          </Link>
          <Link
            href={`/call/${c.id}`}
            className="flex items-center justify-center gap-1 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
            style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#F59E0B' }}
          >
            <Mic size={11} />
          </Link>
        </div>
      </div>
    </div>
  )
}
