'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Heart, ChevronDown, ChevronUp, Brain, Sparkles } from 'lucide-react'

export interface BondData {
  level: number        // 1–5
  messageCount: number
  daysChatted: number
  streak: number
}

interface BondMeterProps {
  bond: BondData | null
  memories: string[]
  characterName: string
}

const BOND_CONFIG = [
  { name: 'Strangers',    color: '#6B7280', glow: 'rgba(107,114,128,0.20)', emoji: '👋', nextMsg: 10  },
  { name: 'Acquaintance', color: '#8B5CF6', glow: 'rgba(139,92,246,0.25)',  emoji: '✨', nextMsg: 30  },
  { name: 'Friends',      color: '#3B82F6', glow: 'rgba(59,130,246,0.25)',  emoji: '💙', nextMsg: 75  },
  { name: 'Companions',   color: '#C4934A', glow: 'rgba(196,147,74,0.25)',  emoji: '💛', nextMsg: 150 },
  { name: 'Soulmates',    color: '#C0274A', glow: 'rgba(192,39,74,0.30)',   emoji: '❤️', nextMsg: Infinity },
]
const THRESHOLDS = [0, 10, 30, 75, 150] as const

export default function BondMeter({ bond, memories, characterName }: BondMeterProps) {
  const [expanded, setExpanded] = useState(false)

  if (!bond) return null

  const lvl   = Math.min(5, Math.max(1, bond.level))
  const cfg   = BOND_CONFIG[lvl - 1]
  const next  = BOND_CONFIG[lvl]  // undefined at max
  const lo    = THRESHOLDS[lvl - 1]
  const hi    = lvl < 5 ? THRESHOLDS[lvl] : bond.messageCount + 1
  const pct   = lvl >= 5 ? 100 : Math.min(100, ((bond.messageCount - lo) / (hi - lo)) * 100)
  const msgsToNext = lvl < 5 ? hi - bond.messageCount : 0

  return (
    <div style={{
      background: 'rgba(0,0,0,0.25)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* ── Compact header row ── */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors text-left"
      >
        {/* Bond level badge */}
        <span style={{
          fontSize: '0.65rem',
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: '20px',
          background: `rgba(${cfg.color === '#6B7280' ? '107,114,128' : cfg.color.startsWith('#8') ? '139,92,246' : cfg.color.startsWith('#3') ? '59,130,246' : cfg.color.startsWith('#C4') ? '196,147,74' : '192,39,74'},0.15)`,
          border: `1px solid ${cfg.color}33`,
          color: cfg.color,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          {cfg.emoji} {cfg.name}
        </span>

        {/* Progress bar */}
        <div style={{
          flex: 1,
          height: '4px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '2px',
          overflow: 'hidden',
          minWidth: '40px',
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{
              height: '100%',
              borderRadius: '2px',
              background: next
                ? `linear-gradient(90deg, ${cfg.color}, ${next.color})`
                : cfg.color,
              boxShadow: `0 0 8px ${cfg.color}80`,
            }}
          />
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.6rem', color: 'rgba(255,255,255,0.40)', flexShrink: 0 }}>
          <span>{bond.daysChatted}d</span>
          <span>·</span>
          <span>{bond.messageCount} msgs</span>
          {bond.streak >= 2 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#F97316' }}>
              <Flame size={9} style={{ display: 'inline' }} />{bond.streak}
            </span>
          )}
        </div>

        {expanded
          ? <ChevronUp size={12} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
          : <ChevronDown size={12} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />}
      </button>

      {/* ── Expandable memories panel ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              padding: '12px 16px 14px',
              borderTop: '1px solid rgba(255,255,255,0.05)',
            }}>
              {/* Section header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.65rem',
                fontWeight: 700,
                color: 'rgba(255,255,255,0.35)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '10px',
              }}>
                <Brain size={11} />
                What {characterName} remembers about you
              </div>

              {memories.length === 0 ? (
                <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.30)', lineHeight: 1.5 }}>
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
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '7px',
                        fontSize: '0.72rem',
                        color: 'rgba(255,255,255,0.60)',
                        lineHeight: 1.4,
                      }}
                    >
                      <Heart size={8} style={{ color: cfg.color, flexShrink: 0, marginTop: '3px' }} />
                      {fact}
                    </motion.li>
                  ))}
                </ul>
              )}

              {/* Next level hint */}
              {lvl < 5 && msgsToNext > 0 && (
                <div style={{
                  marginTop: '12px',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  background: `${cfg.glow}`,
                  border: `1px solid ${cfg.color}25`,
                  fontSize: '0.65rem',
                  color: 'rgba(255,255,255,0.40)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}>
                  <Sparkles size={9} style={{ color: next?.color ?? cfg.color }} />
                  {msgsToNext} more {msgsToNext === 1 ? 'message' : 'messages'} to reach{' '}
                  <strong style={{ color: next?.color ?? cfg.color }}>{next?.name}</strong>
                  {next && ` ${next.emoji}`}
                </div>
              )}

              {lvl >= 5 && (
                <div style={{
                  marginTop: '12px',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  background: 'rgba(192,39,74,0.12)',
                  border: '1px solid rgba(192,39,74,0.25)',
                  fontSize: '0.65rem',
                  color: 'rgba(255,255,255,0.50)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}>
                  <Heart size={9} style={{ color: '#C0274A' }} />
                  Maximum bond reached — you are Soulmates ❤️
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
