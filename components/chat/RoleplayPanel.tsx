'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Film, Sparkles, Mountain, Pen, X, Lock, ToggleLeft, ToggleRight, Clapperboard } from 'lucide-react'
import type { RoleplayPreset } from '@/lib/ai/roleplay-prompts'

interface RoleplayPanelProps {
  activePreset: RoleplayPreset | null
  nsfwEnabled: boolean
  isPremium: boolean
  isVisible: boolean
  characterName: string
  onSelectPreset: (preset: RoleplayPreset) => void
  onToggleNSFW: () => void
  onEndRoleplay: () => void
  onClose: () => void
}

const PRESETS: { id: RoleplayPreset; label: string; emoji: string; tagline: string; color: string }[] = [
  {
    id: 'bollywood_date',
    label: 'Bollywood Date',
    emoji: '🎬',
    tagline: 'Rooftop, filmi dialogues, golden hour',
    color: '#C0274A',
  },
  {
    id: 'punjabi_wedding',
    label: 'Punjabi Wedding',
    emoji: '💍',
    tagline: 'Baraat energy, emotional vows',
    color: '#C4934A',
  },
  {
    id: 'himalayan_night',
    label: 'Himalayan Night',
    emoji: '🏔️',
    tagline: 'Cozy → deep → intense',
    color: '#3B82F6',
  },
  {
    id: 'custom',
    label: 'Custom Scene',
    emoji: '✍️',
    tagline: 'You write the setting',
    color: '#8B5CF6',
  },
]

export default function RoleplayPanel({
  activePreset,
  nsfwEnabled,
  isPremium,
  isVisible,
  characterName,
  onSelectPreset,
  onToggleNSFW,
  onEndRoleplay,
  onClose,
}: RoleplayPanelProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.28, ease: 'easeInOut' }}
          style={{ overflow: 'hidden' }}
        >
          <div style={{
            background: 'linear-gradient(180deg, rgba(26,0,16,0.97) 0%, rgba(8,4,7,0.95) 100%)',
            borderBottom: '1px solid rgba(196,147,74,0.20)',
            backdropFilter: 'blur(20px)',
          }}>
            <div style={{ padding: '14px 16px 16px' }}>

              {/* ── Header ── */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <Clapperboard size={14} style={{ color: '#C4934A' }} />
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(248,238,216,0.80)', letterSpacing: '0.04em' }}>
                    {activePreset ? `In Roleplay — ${characterName}` : `Roleplay with ${characterName}`}
                  </span>
                </div>
                <button
                  onClick={onClose}
                  style={{ color: 'rgba(255,255,255,0.30)', padding: '2px' }}
                >
                  <X size={13} />
                </button>
              </div>

              {/* ── Active roleplay info ── */}
              {activePreset && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    marginBottom: '12px',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    background: 'rgba(192,39,74,0.15)',
                    border: '1px solid rgba(192,39,74,0.30)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: '0.68rem', color: '#F87171' }}>
                    🎭 Scene active — say <strong>"end roleplay"</strong> to close
                  </span>
                  <button
                    onClick={onEndRoleplay}
                    style={{
                      fontSize: '0.62rem',
                      color: '#F87171',
                      background: 'rgba(192,39,74,0.20)',
                      border: '1px solid rgba(192,39,74,0.35)',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      cursor: 'pointer',
                    }}
                  >
                    End
                  </button>
                </motion.div>
              )}

              {/* ── Preset grid ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                {PRESETS.map((preset) => {
                  const isActive = activePreset === preset.id
                  return (
                    <motion.button
                      key={preset.id}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => onSelectPreset(preset.id)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '12px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        background: isActive
                          ? `linear-gradient(135deg, ${preset.color}33, ${preset.color}18)`
                          : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${isActive ? preset.color + '60' : 'rgba(255,255,255,0.08)'}`,
                        transition: 'all 0.18s ease',
                      }}
                    >
                      <div style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{preset.emoji}</div>
                      <div style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: isActive ? preset.color : 'rgba(248,238,216,0.75)',
                        marginBottom: '2px',
                      }}>
                        {preset.label}
                      </div>
                      <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.3 }}>
                        {preset.tagline}
                      </div>
                    </motion.button>
                  )
                })}
              </div>

              {/* ── NSFW toggle ── */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isPremium ? (
                    <Sparkles size={12} style={{ color: '#C4934A' }} />
                  ) : (
                    <Lock size={12} style={{ color: 'rgba(255,255,255,0.35)' }} />
                  )}
                  <div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 600, color: isPremium ? 'rgba(248,238,216,0.80)' : 'rgba(255,255,255,0.35)' }}>
                      Uncensored Mode
                      {!isPremium && <span style={{ marginLeft: '6px', fontSize: '0.58rem', color: '#C4934A' }}>Premium only</span>}
                    </div>
                    <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.30)' }}>
                      {isPremium ? 'Full explicit scenes unlocked' : 'Upgrade to unlock full scenes'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={isPremium ? onToggleNSFW : undefined}
                  disabled={!isPremium}
                  style={{ opacity: isPremium ? 1 : 0.40, cursor: isPremium ? 'pointer' : 'not-allowed' }}
                >
                  {nsfwEnabled && isPremium
                    ? <ToggleRight size={24} style={{ color: '#C0274A' }} />
                    : <ToggleLeft size={24} style={{ color: 'rgba(255,255,255,0.30)' }} />}
                </button>
              </div>

              {/* ── Upgrade nudge for free users ── */}
              {!isPremium && (
                <motion.a
                  href="/pricing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    marginTop: '10px',
                    padding: '8px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(192,39,74,0.25), rgba(196,147,74,0.15))',
                    border: '1px solid rgba(196,147,74,0.25)',
                    fontSize: '0.65rem',
                    color: '#C4934A',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  <Film size={11} />
                  Unlock full uncensored scenes — from ₹20 🔥
                </motion.a>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
