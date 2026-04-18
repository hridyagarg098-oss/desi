'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Heart, ChevronDown, ChevronUp, Brain, Sparkles, Star } from 'lucide-react'

export interface BondData {
  level: number          // 1–5
  messageCount: number
  daysChatted: number
  streak: number
  affectionPoints?: number   // 0–1000+
}

interface BondMeterProps {
  bond: BondData | null
  memories: string[]
  characterName: string
  justLevelledUp?: boolean   // triggers the level-up celebration animation
}

// ── Velvet Love Level config ──────────────────────────────────────────────────
const LOVE_LEVELS = [
  {
    name: 'Playful',
    emoji: '✨',
    color: '#8B5CF6',
    glow: 'rgba(139,92,246,0.22)',
    min: 0,
    max: 99,
    tagline: 'Just getting started…',
  },
  {
    name: 'Flirty',
    emoji: '💜',
    color: '#EC4899',
    glow: 'rgba(236,72,153,0.22)',
    min: 100,
    max: 249,
    tagline: 'Something special is forming',
  },
  {
    name: 'Romantic',
    emoji: '🌹',
    color: '#F43F5E',
    glow: 'rgba(244,63,94,0.22)',
    min: 250,
    max: 499,
    tagline: 'Feelings run deep here',
  },
  {
    name: 'Deeply in Love',
    emoji: '❤️',
    color: '#C0274A',
    glow: 'rgba(192,39,74,0.28)',
    min: 500,
    max: 999,
    tagline: 'An unbreakable connection',
  },
  {
    name: 'Devoted Soulmate',
    emoji: '💎',
    color: '#C4934A',
    glow: 'rgba(196,147,74,0.30)',
    min: 1000,
    max: Infinity,
    tagline: 'Rare, precious, forever',
  },
]

function getLevelFromPoints(pts: number): number {
  if (pts >= 1000) return 5
  if (pts >= 500)  return 4
  if (pts >= 250)  return 3
  if (pts >= 100)  return 2
  return 1
}

export default function BondMeter({ bond, memories, characterName, justLevelledUp }: BondMeterProps) {
  const [expanded, setExpanded] = useState(false)
  const [showLevelUp, setShowLevelUp] = useState(false)

  useEffect(() => {
    if (justLevelledUp) {
      setShowLevelUp(true)
      const t = setTimeout(() => setShowLevelUp(false), 4000)
      return () => clearTimeout(t)
    }
  }, [justLevelledUp])

  if (!bond) return null

  const pts       = bond.affectionPoints ?? 0
  const lvl       = getLevelFromPoints(pts)
  const cfg       = LOVE_LEVELS[lvl - 1]
  const nextCfg   = LOVE_LEVELS[lvl]   // undefined at max
  const pct       = lvl >= 5
    ? 100
    : Math.min(100, ((pts - cfg.min) / (nextCfg.min - cfg.min)) * 100)
  const ptsToNext = lvl < 5 ? nextCfg.min - pts : 0

  return (
    <div style={{ background: 'rgba(0,0,0,0.28)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>

      {/* ── Level-up celebration banner ── */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -10 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35 }}
            style={{
              overflow: 'hidden',
              background: `linear-gradient(135deg, ${cfg.glow}, rgba(0,0,0,0))`,
              borderBottom: `1px solid ${cfg.color}33`,
            }}
          >
            <div style={{
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.72rem',
              color: cfg.color,
              fontWeight: 600,
            }}>
              <motion.span
                animate={{ rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.4, 1.2, 1.3, 1] }}
                transition={{ duration: 0.7 }}
              >
                {cfg.emoji}
              </motion.span>
              <span>
                Your bond just reached <strong>{cfg.name}</strong> — {cfg.tagline}
              </span>
              <motion.div
                style={{ marginLeft: 'auto', display: 'flex', gap: '3px' }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: 3, duration: 0.8 }}
              >
                {[0, 1, 2].map(i => (
                  <Star key={i} size={8} fill={cfg.color} color="transparent" />
                ))}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Compact header row ── */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors text-left"
      >
        {/* Love Level badge */}
        <span style={{
          fontSize: '0.62rem',
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: '20px',
          background: `${cfg.glow}`,
          border: `1px solid ${cfg.color}44`,
          color: cfg.color,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          {cfg.emoji} {cfg.name}
        </span>

        {/* Love Meter progress bar */}
        <div style={{ flex: 1, minWidth: '40px' }}>
          <div style={{
            height: '4px',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1.4, ease: 'easeOut' }}
              style={{
                height: '100%',
                borderRadius: '2px',
                background: nextCfg
                  ? `linear-gradient(90deg, ${cfg.color}, ${nextCfg.color})`
                  : cfg.color,
                boxShadow: `0 0 6px ${cfg.color}80`,
              }}
            />
          </div>
          {/* Love Meter % label */}
          <div style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.28)', marginTop: '1px', textAlign: 'right' }}>
            Love Meter ↑ {Math.round(pct)}%
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.6rem', color: 'rgba(255,255,255,0.38)', flexShrink: 0 }}>
          <span>{bond.daysChatted}d</span>
          <span>·</span>
          <span>{pts} pts</span>
          {bond.streak >= 2 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#F97316' }}>
              <Flame size={9} />{bond.streak}
            </span>
          )}
        </div>

        {expanded
          ? <ChevronUp size={12} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
          : <ChevronDown size={12} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />}
      </button>

      {/* ── Expandable panel ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '12px 16px 14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              {/* Memories header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '0.62rem', fontWeight: 700,
                color: 'rgba(255,255,255,0.35)',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                marginBottom: '10px',
              }}>
                <Brain size={10} />
                What {characterName} remembers about you
              </div>

              {memories.length === 0 ? (
                <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.28)', lineHeight: 1.5 }}>
                  Keep chatting — {characterName} will start remembering the things you share.
                </p>
              ) : (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {memories.slice(0, 10).map((fact, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '7px',
                        fontSize: '0.72rem', color: 'rgba(255,255,255,0.60)', lineHeight: 1.4,
                      }}
                    >
                      <Heart size={8} style={{ color: cfg.color, flexShrink: 0, marginTop: '3px' }} />
                      {fact}
                    </motion.li>
                  ))}
                </ul>
              )}

              {/* Points to next level */}
              {lvl < 5 && ptsToNext > 0 && (
                <div style={{
                  marginTop: '12px', padding: '7px 10px', borderRadius: '8px',
                  background: cfg.glow, border: `1px solid ${cfg.color}25`,
                  fontSize: '0.65rem', color: 'rgba(255,255,255,0.40)',
                  display: 'flex', alignItems: 'center', gap: '5px',
                }}>
                  <Sparkles size={9} style={{ color: nextCfg?.color ?? cfg.color }} />
                  {ptsToNext} more points to reach{' '}
                  <strong style={{ color: nextCfg?.color }}>{nextCfg?.name}</strong>
                  {nextCfg && ` ${nextCfg.emoji}`}
                </div>
              )}

              {lvl >= 5 && (
                <div style={{
                  marginTop: '12px', padding: '7px 10px', borderRadius: '8px',
                  background: 'rgba(196,147,74,0.12)', border: '1px solid rgba(196,147,74,0.25)',
                  fontSize: '0.65rem', color: 'rgba(255,255,255,0.50)',
                  display: 'flex', alignItems: 'center', gap: '5px',
                }}>
                  <Heart size={9} style={{ color: '#C4934A' }} />
                  Devoted Soulmate — the highest bond possible 💎
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
