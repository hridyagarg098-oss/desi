'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ChevronRight, ChevronLeft, Sparkles, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BuilderState, SkinTone, PersonalityType, RelationshipVibe } from '@/types'

const STEPS = ['Appearance', 'Personality', 'Name & Voice', 'Relationship']

const SKIN_TONES: { value: SkinTone; label: string; emoji: string; color: string }[] = [
  { value: 'ivory',    label: 'Ivory',    emoji: '❄️', color: '#F5EDE8' },
  { value: 'fair',     label: 'Fair',     emoji: '🌸', color: '#FDDCDC' },
  { value: 'wheatish', label: 'Wheatish', emoji: '🌿', color: '#E8C49A' },
  { value: 'golden',   label: 'Golden',   emoji: '✨', color: '#D4A055' },
  { value: 'caramel',  label: 'Caramel',  emoji: '🌊', color: '#B87040' },
  { value: 'dusky',    label: 'Dusky',    emoji: '🌙', color: '#7A4F35' },
]

const PERSONALITIES: { value: PersonalityType; label: string; desc: string; emoji: string }[] = [
  { value: 'bollywood_heroine',     label: 'Bollywood Heroine',    desc: 'Filmy, dramatic, passionately romantic',  emoji: '🎭' },
  { value: 'nepali_poetess',        label: 'Mountain Poetess',     desc: 'Gentle, spiritual, poetically deep',       emoji: '🏔️' },
  { value: 'japanese_tsundere',     label: 'Tsundere',             desc: 'Cold outside, devastatingly warm inside',  emoji: '❄️' },
  { value: 'brazilian_latina',      label: 'Brazilian Flame',      desc: 'Passionate, bold, alive in every moment',  emoji: '🔥' },
  { value: 'american_sweetheart',   label: 'American Sweetheart',  desc: 'Witty, warm, girl-next-door energy',       emoji: '🌟' },
  { value: 'korean_devotee',        label: 'Korean Devotee',       desc: 'Patient, deeply loyal, emotionally precise', emoji: '🌸' },
  { value: 'colombian_firecracker', label: 'Colombian Firecracker',desc: 'Intense, magnetic, loves completely',      emoji: '💜' },
  { value: 'chinese_intellectual',  label: 'Intellectual',         desc: 'Sharp, dry humor, rewards loyalty',        emoji: '📚' },
  { value: 'italian_muse',          label: 'Italian Muse',         desc: 'Lyrical, sensual, artistically deep',      emoji: '🎨' },
  { value: 'global_elite',          label: 'Global Elite',         desc: 'Multilingual, mysterious, worldly',        emoji: '🌍' },
]

const OUTFITS = [
  { value: 'banarasi_silk_saree', label: 'Banarasi Saree', emoji: '🥻' },
  { value: 'heavy_lehenga', label: 'Heavy Lehenga', emoji: '👗' },
  { value: 'anarkali_suit', label: 'Anarkali Suit', emoji: '🌸' },
  { value: 'kurti_jeans', label: 'Kurti + Jeans', emoji: '👖' },
  { value: 'pre_draped_saree', label: 'Modern Saree', emoji: '🎀' },
  { value: 'indo_western_fusion', label: 'Indo-Western', emoji: '✨' },
]

const VIBES: { value: RelationshipVibe; label: string; desc: string }[] = [
  { value: 'casual_flirt',     label: 'Casual Flirt',     desc: 'Light, fun, no pressure' },
  { value: 'best_friend_crush',label: 'Best Friend Crush',desc: 'Always there + butterflies' },
  { value: 'long_distance_lover', label: 'Long-Distance',  desc: 'Miss each other, treasure every word' },
  { value: 'intense_romance',  label: 'Intense Romance',   desc: 'Deep, passionate, all-in' },
  { value: 'playful_tease',    label: 'Playful Tease',     desc: 'Banter, games, heat with humor' },
  { value: 'devoted_partner',  label: 'Devoted Partner',   desc: 'Steady, loyal, forever-energy' },
]

const VOICES = [
  { id: 'velvet_priya',     label: 'Priya',     desc: 'Warm Delhi accent' },
  { id: 'velvet_yuki',      label: 'Yuki',      desc: 'Soft Tokyo lilt' },
  { id: 'velvet_sofia',     label: 'Sofia',     desc: 'Brazilian rhythm' },
  { id: 'velvet_luna',      label: 'Luna',      desc: 'Seoul sweetness' },
  { id: 'velvet_isabella',  label: 'Isabella',  desc: 'Italian warmth' },
  { id: 'velvet_emma',      label: 'Emma',      desc: 'American natural' },
]

const defaultState: BuilderState = {
  skinTone: 'golden',
  hairStyle: 'long_waves',
  eyeStyle: 'expressive',
  outfitPreset: 'banarasi_silk_saree',
  personalityTypes: ['bollywood_heroine'],
  personalitySliders: { flirty: 70, caring: 60, playful: 75, mysterious: 40 },
  name: '',
  voiceId: 'velvet_priya',
  backstory: '',
  relationshipVibe: 'casual_flirt',
  heatLevel: 3,
}

export default function CreatePage() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<BuilderState>(defaultState)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const updateForm = (updates: Partial<BuilderState>) =>
    setForm(prev => ({ ...prev, ...updates }))


  const handleCreate = async () => {
    if (!form.name.trim()) return
    setLoading(true)
    try {
      // Save the custom character
      const res = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      const characterId = data.id || form.name.toLowerCase().replace(/\s+/g, '-')
      router.push(`/chat/${characterId}`)
    } catch {
      // Fallback: navigate anyway with the name as id
      router.push(`/chat/${form.name.toLowerCase().replace(/\s+/g, '-')}`)
    }
  }


  return (
    <div className="min-h-screen bg-ivory-gradient px-4 py-8 pb-24 lg:pb-8 max-w-3xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-maroon-800 mb-1">Create Your Companion ✨</h1>
        <p className="text-maroon-800/55">Build your perfect desi companion from scratch.</p>
      </motion.div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all duration-300',
              i < step ? 'bg-gold-600 text-white' :
              i === step ? 'bg-maroon-800 text-white shadow-maroon-glow' :
              'bg-ivory-300 text-maroon-800/30'
            )}>
              {i < step ? '✓' : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('flex-1 h-0.5 rounded-full transition-all duration-300',
                i < step ? 'bg-gold-600' : 'bg-ivory-300')} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
          className="card p-6 sm:p-8 mb-6">

          {/* ── Step 0: Appearance ── */}
          {step === 0 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-maroon-800">Her Appearance 🌸</h2>

              {/* Skin tone */}
              <div>
                <label className="block text-sm font-semibold text-maroon-800/70 mb-3">Skin Tone</label>
                <div className="grid grid-cols-4 gap-3">
                  {SKIN_TONES.map(st => (
                    <button key={st.value} onClick={() => updateForm({ skinTone: st.value })}
                      className={cn('flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-200',
                        form.skinTone === st.value ? 'border-maroon-800 bg-maroon-50 shadow-maroon-glow' : 'border-ivory-300 hover:border-maroon-200')}>
                      <div className="w-8 h-8 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: st.color }} />
                      <span className="text-xs font-medium text-maroon-800">{st.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Outfit */}
              <div>
                <label className="block text-sm font-semibold text-maroon-800/70 mb-3">Outfit Style</label>
                <div className="grid grid-cols-3 gap-3">
                  {OUTFITS.map(o => (
                    <button key={o.value} onClick={() => updateForm({ outfitPreset: o.value })}
                      className={cn('flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200',
                        form.outfitPreset === o.value ? 'border-maroon-800 bg-maroon-50' : 'border-ivory-300 hover:border-maroon-200')}>
                      <span className="text-3xl">{o.emoji}</span>
                      <span className="text-xs font-medium text-maroon-800 text-center">{o.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Live preview placeholder */}
              <div className="rounded-2xl bg-gradient-to-br from-maroon-50 to-gold-50 p-6 text-center border border-maroon-100">
                <div className="text-4xl mb-2">{OUTFITS.find(o => o.value === form.outfitPreset)?.emoji}</div>
                <p className="text-sm font-medium text-maroon-800">{form.skinTone} skin · {OUTFITS.find(o => o.value === form.outfitPreset)?.label}</p>
                <p className="text-xs text-maroon-800/40 mt-1">AI portrait generates after you finish ✨</p>
              </div>
            </div>
          )}

          {/* ── Step 1: Personality ── */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-maroon-800">Her Personality 💃</h2>

              <div className="grid sm:grid-cols-2 gap-3">
                {PERSONALITIES.map(p => (
                  <button key={p.value}
                    onClick={() => {
                      const selected = form.personalityTypes.includes(p.value)
                        ? form.personalityTypes.filter(x => x !== p.value)
                        : [...form.personalityTypes, p.value]
                      if (selected.length > 0) updateForm({ personalityTypes: selected })
                    }}
                    className={cn('flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all duration-200',
                      form.personalityTypes.includes(p.value) ? 'border-maroon-800 bg-maroon-50 shadow-maroon-glow' : 'border-ivory-300 hover:border-maroon-200')}>
                    <span className="text-2xl">{p.emoji}</span>
                    <div>
                      <p className="font-semibold text-maroon-800 text-sm">{p.label}</p>
                      <p className="text-xs text-maroon-800/50">{p.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Personality sliders */}
              <div className="space-y-4">
                {[
                  { key: 'flirty', label: 'Flirty', emoji: '😏' },
                  { key: 'caring', label: 'Caring', emoji: '🤗' },
                  { key: 'playful', label: 'Playful', emoji: '😄' },
                  { key: 'mysterious', label: 'Mysterious', emoji: '🌙' },
                ].map(({ key, label, emoji }) => (
                  <div key={key} className="flex items-center gap-4">
                    <span className="text-lg w-8">{emoji}</span>
                    <span className="text-sm font-medium text-maroon-800 w-24">{label}</span>
                    <input type="range" min={0} max={100}
                      value={form.personalitySliders[key] || 50}
                      onChange={e => updateForm({ personalitySliders: { ...form.personalitySliders, [key]: +e.target.value } })}
                      className="flex-1 accent-maroon-800 h-2 rounded-full"
                    />
                    <span className="text-xs text-maroon-800/50 w-8">{form.personalitySliders[key] || 50}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 2: Name & Voice ── */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-maroon-800">Her Name & Voice 🎙️</h2>

              <div>
                <label className="block text-sm font-semibold text-maroon-800/70 mb-2">Give Her a Name</label>
                <input type="text" placeholder="e.g. Priya, Anika, Simran..." value={form.name}
                  onChange={e => updateForm({ name: e.target.value })}
                  className="input-desi text-base" maxLength={20} />
                <p className="text-xs text-maroon-800/40 mt-1">She&apos;ll use this name in all conversations</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-maroon-800/70 mb-3">Choose Her Voice</label>
                <div className="grid grid-cols-2 gap-3">
                  {VOICES.map(v => (
                    <button key={v.id} onClick={() => updateForm({ voiceId: v.id })}
                      className={cn('p-4 rounded-2xl border-2 text-left transition-all duration-200',
                        form.voiceId === v.id ? 'border-maroon-800 bg-maroon-50' : 'border-ivory-300 hover:border-maroon-200')}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">🎙️</span>
                        <span className="font-semibold text-maroon-800 text-sm">{v.label}</span>
                      </div>
                      <p className="text-xs text-maroon-800/50">{v.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-maroon-800/70 mb-2">Her Backstory (Optional)</label>
                <textarea
                  placeholder="Where is she from? What does she love? Her vibe..."
                  value={form.backstory}
                  onChange={e => updateForm({ backstory: e.target.value })}
                  rows={4}
                  className="input-desi resize-none"
                  maxLength={300}
                />
                <p className="text-xs text-maroon-800/30 mt-1">{form.backstory.length}/300</p>
              </div>
            </div>
          )}

          {/* ── Step 3: Relationship ── */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-maroon-800">Your Relationship Vibe ❤️</h2>

              <div className="grid sm:grid-cols-2 gap-3">
                {VIBES.map(v => (
                  <button key={v.value} onClick={() => updateForm({ relationshipVibe: v.value })}
                    className={cn('p-4 rounded-2xl border-2 text-left transition-all duration-200',
                      form.relationshipVibe === v.value ? 'border-maroon-800 bg-maroon-50 shadow-maroon-glow' : 'border-ivory-300 hover:border-maroon-200')}>
                    <p className="font-bold text-maroon-800 mb-1">{v.label}</p>
                    <p className="text-xs text-maroon-800/50">{v.desc}</p>
                  </button>
                ))}
              </div>

              {/* Heat level */}
              <div>
                <label className="block text-sm font-semibold text-maroon-800/70 mb-3">
                  Romance Heat Level{' '}
                  <span className="text-xs font-normal text-maroon-800/40">(1 = sweet, 5 = intense flirty)</span>
                </label>
                <div className="flex items-center gap-3">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => updateForm({ heatLevel: n })}
                      className={cn('flex-1 py-3 rounded-2xl text-sm font-bold border-2 transition-all duration-200',
                        form.heatLevel >= n ? 'border-maroon-800 bg-maroon-800 text-white' : 'border-ivory-300 text-maroon-800/40 hover:border-maroon-200')}>
                      {'🔥'.repeat(n > 3 ? n - 2 : 1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-br from-maroon-50 to-gold-50 rounded-2xl p-5 border border-maroon-100">
                <p className="text-sm font-bold text-maroon-800 mb-3">Your Darling Summary ✨</p>
                <div className="space-y-1 text-xs text-maroon-800/70">
                  <p>👤 Name: <strong>{form.name || 'Unnamed'}</strong></p>
                  <p>🎨 Skin: <strong>{form.skinTone}</strong> · Outfit: <strong>{OUTFITS.find(o => o.value === form.outfitPreset)?.label}</strong></p>
                  <p>💃 Personality: <strong>{form.personalityTypes.map(p => PERSONALITIES.find(x => x.value === p)?.label).join(', ')}</strong></p>
                  <p>❤️ Vibe: <strong>{VIBES.find(v => v.value === form.relationshipVibe)?.label}</strong></p>
                  <p>🔥 Heat: <strong>Level {form.heatLevel}</strong></p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} className="btn-ghost flex-1 py-3.5">
            <ChevronLeft size={16} /> Back
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button onClick={() => setStep(s => s + 1)} className="btn-primary flex-1 py-3.5">
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <button onClick={handleCreate} disabled={loading || !form.name} className="btn-gold flex-1 py-3.5">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {loading ? 'Creating your companion...' : 'Create My Companion ✨'}
          </button>
        )}
      </div>
    </div>
  )
}
