'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ConversationProvider, useConversation } from '@elevenlabs/react'
import { motion, AnimatePresence } from 'framer-motion'
import { PhoneOff, Mic, MicOff, Volume2, VolumeX, Wifi, WifiOff, Heart } from 'lucide-react'
import type { Character } from '@/types'
import { PaymentModal } from '@/components/payment/PaymentModal'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TranscriptLine {
  role: 'user' | 'agent'
  text: string
  id: number
}

interface VoiceCallProps {
  character: Character
  agentId?: string
  onEnd: () => void
}

// ─── Cinematic particle system ────────────────────────────────────────────────

function Particles({ speaking }: { speaking: boolean }) {
  const count = 28
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: count }).map((_, i) => {
        const size = 1.5 + (i % 3) * 1.2
        const left = `${(i * 11 + 7) % 100}%`
        const bottom = `${(i * 7 + 3) % 40}%`
        const duration = 3 + (i % 5) * 0.8
        const delay = i * 0.18
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: size, height: size, left, bottom,
              background: i % 3 === 0
                ? 'rgba(196,147,74,0.7)'
                : i % 3 === 1
                ? 'rgba(192,39,74,0.5)'
                : 'rgba(248,238,216,0.35)',
            }}
            animate={{
              y: [0, -(60 + (i % 4) * 30)],
              opacity: speaking ? [0, 0.8, 0] : [0, 0.25, 0],
              scale: [1, 0.3],
            }}
            transition={{
              duration,
              repeat: Infinity,
              delay,
              ease: 'easeOut',
            }}
          />
        )
      })}
    </div>
  )
}

// ─── Waveform visualiser ──────────────────────────────────────────────────────

function SpeakingWave({ active }: { active: boolean }) {
  const bars = 7
  return (
    <div className="flex items-center gap-[3px] h-10">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className="rounded-full"
          style={{
            width: 3,
            background: `linear-gradient(180deg, #E8B060, #C0274A)`,
          }}
          animate={
            active
              ? {
                  height: [`${4 + i}px`, `${10 + i * 5}px`, `${4 + i}px`],
                  opacity: [0.5, 1, 0.5],
                }
              : { height: '4px', opacity: 0.2 }
          }
          transition={{
            duration: 0.5 + i * 0.07,
            repeat: Infinity,
            delay: i * 0.08,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// ─── Halo ring (multi-layer pulse) ───────────────────────────────────────────

function HaloRings({ speaking, connecting }: { speaking: boolean; connecting: boolean }) {
  if (!speaking && !connecting) return null
  const color = speaking ? 'rgba(196,147,74,' : 'rgba(139,21,56,'
  return (
    <>
      {[1.12, 1.22, 1.35].map((scale, i) => (
        <motion.span
          key={i}
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ border: `1px solid ${color}${0.5 - i * 0.12})` }}
          animate={{ scale: [1, scale], opacity: [0.7 - i * 0.15, 0] }}
          transition={{
            duration: 1.2 + i * 0.3,
            repeat: Infinity,
            delay: i * 0.25,
            ease: 'easeOut',
          }}
        />
      ))}
    </>
  )
}

// ─── Inner call UI ────────────────────────────────────────────────────────────

function VoiceCallInner({ character, agentId, onEnd }: VoiceCallProps) {
  const resolvedAgentId = agentId || process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || ''

  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(1)
  const [transcript, setTranscript] = useState<TranscriptLine[]>([])
  const [micPermission, setMicPermission] = useState<'idle' | 'granted' | 'denied'>('idle')
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const [secondsTotal, setSecondsTotal] = useState(30)
  const [limitHit, setLimitHit] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const transcriptRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const trackRef = useRef<NodeJS.Timeout | null>(null)
  const lineId = useRef(0)

  const conversation = useConversation({
    onConnect: () => {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
      trackRef.current = setInterval(async () => {
        try {
          const res = await fetch('/api/call/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ seconds: 1 }),
          })
          const data = await res.json()
          if (res.status === 402 || !data.allowed) {
            setLimitHit(true)
            setSecondsTotals(data.secondsTotal ?? 30)
            setSecondsLeft(0)
            clearInterval(trackRef.current!)
            clearInterval(timerRef.current!)
            conversation.endSession()
            setTimeout(() => setShowPayment(true), 800)
          } else {
            setSecondsLeft(data.secondsLeft ?? 0)
            setSecondsTotals(data.secondsTotal ?? 30)
          }
        } catch { /* no-op */ }
      }, 1000)
    },
    onDisconnect: () => {
      clearInterval(timerRef.current!)
      clearInterval(trackRef.current!)
    },
    onMessage: (msg) => {
      const role = msg.source === 'ai' ? 'agent' : 'user'
      const text = (msg as { message?: string }).message || ''
      if (text) setTranscript(prev => [...prev, { role, text, id: ++lineId.current }])
    },
    onError: (err) => console.error('[ElevenLabs]', err),
  })

  function setSecondsTotals(v: number) { setSecondsTotal(v) }

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [transcript])

  useEffect(() => () => {
    clearInterval(timerRef.current!)
    clearInterval(trackRef.current!)
  }, [])

  const handleStart = useCallback(async () => {
    try {
      const res = await fetch('/api/call/track')
      if (res.ok) {
        const data = await res.json()
        if (!data.allowed || data.secondsLeft === 0) {
          setLimitHit(true)
          setShowPayment(true)
          return
        }
        setSecondsLeft(data.secondsLeft ?? null)
        setSecondsTotal(data.secondsTotal ?? 30)
      }
    } catch { /* no-op */ }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      setMicPermission('granted')
      await conversation.startSession({ agentId: resolvedAgentId, connectionType: 'websocket' })
    } catch (e) {
      console.error('[VoiceCall] mic error:', e)
      setMicPermission('denied')
    }
  }, [conversation, resolvedAgentId])

  const handleEnd = useCallback(async () => {
    clearInterval(timerRef.current!)
    clearInterval(trackRef.current!)
    conversation.endSession()
    setTimeout(onEnd, 500)
  }, [conversation, onEnd])

  const toggleMic = useCallback(() => {
    conversation.setMuted(!conversation.isMuted)
  }, [conversation])

  const handleVolume = useCallback((v: number) => {
    setVolumeState(v)
    if (conversation.status === 'connected') {
      try { conversation.setVolume({ volume: v }) } catch { /* no-op */ }
    }
  }, [conversation])

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const isSpeaking  = conversation.isSpeaking
  const isConnected = conversation.status === 'connected'
  const isConnecting = conversation.status === 'connecting'
  const micEnabled  = !conversation.isMuted
  const isLow       = secondsLeft !== null && secondsLeft <= 5 && isConnected

  const bgGradient = character.avatarGradient || 'linear-gradient(135deg, #8B1538 0%, #C4934A 100%)'

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-between overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #06000A 0%, #120010 40%, #0a0006 100%)' }}
    >

      {/* Payment gate */}
      {showPayment && (
        <PaymentModal
          open={showPayment}
          onClose={() => { setShowPayment(false); onEnd() }}
          reason={limitHit ? 'call_limit' : undefined}
        />
      )}

      {/* ── Deep ambient layers ──────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Maroon orb — top */}
        <div className="absolute top-[-15%] left-[50%] -translate-x-1/2 w-[500px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139,21,56,0.30) 0%, transparent 70%)', filter: 'blur(60px)' }}>
        </div>
        {/* Gold orb — bottom-right */}
        <div className="absolute bottom-[-10%] right-[-10%] w-[350px] h-[350px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(196,147,74,0.18) 0%, transparent 70%)', filter: 'blur(60px)' }}>
        </div>
        {/* Subtle noise vignette */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)',
        }} />
      </div>

      {/* Particles */}
      <Particles speaking={isSpeaking} />

      {/* ── Top status bar ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full flex items-center justify-between px-6 pt-10 z-10"
      >
        {/* Status pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <motion.div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              background: isConnected ? '#34D399' : isConnecting ? '#FBBF24' : 'rgba(255,255,255,0.30)',
              boxShadow: isConnected ? '0 0 8px rgba(52,211,153,0.7)' : isConnecting ? '0 0 8px rgba(251,191,36,0.6)' : 'none',
            }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.60)' }}>
            {isConnected ? 'Connected' : isConnecting ? 'Connecting…' : 'Ready'}
          </span>
        </div>

        {/* Timer + signal */}
        <div className="flex items-center gap-2">
          {isConnected
            ? <Wifi size={14} style={{ color: '#34D399' }} />
            : <WifiOff size={14} style={{ color: 'rgba(255,255,255,0.25)' }} />
          }
          {isConnected && (
            <span className="text-xs font-mono" style={{ color: 'rgba(196,147,74,0.70)' }}>
              {fmt(duration)}
            </span>
          )}
          {isConnected && secondsLeft !== null && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isLow ? 'bg-red-900/60 text-red-400' : ''}`}
              style={!isLow ? { color: 'rgba(255,255,255,0.30)' } : {}}>
              {secondsLeft}s left
            </span>
          )}
        </div>
      </motion.div>

      {/* ── Low time warning ─────────────────────────────────────── */}
      <AnimatePresence>
        {isLow && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-24 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white"
            style={{ background: 'rgba(220,38,38,0.85)', backdropFilter: 'blur(12px)', boxShadow: '0 0 20px rgba(220,38,38,0.5)' }}
          >
            <span className="animate-pulse">⚡</span>
            {secondsLeft}s bachi — call khatam hone wali hai!
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Limit overlay ────────────────────────────────────────── */}
      <AnimatePresence>
        {limitHit && !showPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center p-8 text-center"
            style={{ background: 'rgba(8,4,7,0.85)', backdropFilter: 'blur(20px)' }}
          >
            <motion.div
              initial={{ scale: 0.7 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
              style={{ background: 'linear-gradient(135deg, #8B1538, #C4934A)', boxShadow: '0 0 40px rgba(196,147,74,0.4)' }}
            >
              <Heart className="w-9 h-9 text-white fill-current" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: '"Playfair Display", serif' }}>
              Free Time Khatam Hua
            </h2>
            <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.50)' }}>
              Aur baat karo — sirf ₹20 mein 5 minute ka trial lo!
            </p>
            <button
              onClick={() => setShowPayment(true)}
              className="px-8 py-3.5 rounded-full text-white font-bold text-sm transition-all hover:opacity-90 hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #8B1538, #C4934A)', boxShadow: '0 0 30px rgba(196,147,74,0.40)' }}
            >
              ₹20 mein Trial Lo ✨
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Character avatar ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22, delay: 0.15 }}
        className="flex flex-col items-center gap-6 z-10"
      >
        {/* Avatar ring system */}
        <div className="relative flex items-center justify-center">
          {/* Outer decorative ring */}
          <div className="absolute w-52 h-52 rounded-full"
            style={{
              background: 'conic-gradient(from 0deg, rgba(196,147,74,0.20), rgba(139,21,56,0.15), rgba(196,147,74,0.20))',
            }}
          />
          {/* Spinning ring */}
          <motion.div
            className="absolute w-48 h-48 rounded-full"
            style={{ border: '1px solid rgba(196,147,74,0.15)' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          />

          {/* Main avatar */}
          <div
            className="relative w-40 h-40 rounded-full flex items-center justify-center shadow-2xl"
            style={{ background: bgGradient, border: '2px solid rgba(196,147,74,0.20)' }}
          >
            {/* Halo rings */}
            <HaloRings speaking={isSpeaking} connecting={isConnecting} />

            {/* Character emoji / image */}
            {character.avatar_url ? (
              <img
                src={character.avatar_url}
                alt={character.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-7xl select-none">🥻</span>
            )}
          </div>

          {/* Glow beneath avatar */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-8 rounded-full"
            style={{ background: isSpeaking ? 'rgba(196,147,74,0.35)' : 'rgba(139,21,56,0.20)', filter: 'blur(16px)', transition: 'all 0.5s ease' }}
          />
        </div>

        {/* Name & tagline */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white leading-none" style={{ fontFamily: '"Playfair Display", serif' }}>
            {character.name}
          </h2>
          <p className="text-sm mt-1.5 font-medium" style={{ color: '#C4934A' }}>
            {character.tagline}
          </p>

          {/* Waveform + status */}
          <div className="mt-5 flex flex-col items-center gap-2">
            <SpeakingWave active={isSpeaking} />
            <AnimatePresence mode="wait">
              <motion.span
                key={isSpeaking ? 'speaking' : isConnected ? 'listening' : isConnecting ? 'connecting' : 'idle'}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="text-xs font-medium tracking-wide"
                style={{ color: 'rgba(255,255,255,0.35)', fontFamily: '"DM Sans", sans-serif' }}
              >
                {!isConnected && !isConnecting && 'Tap the button to start'}
                {isConnecting && 'Connecting you to ' + character.name + '…'}
                {isConnected && isSpeaking && character.name + ' is speaking…'}
                {isConnected && !isSpeaking && 'Listening to you…'}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* ── Live transcript ──────────────────────────────────────── */}
      <AnimatePresence>
        {transcript.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm mx-auto px-4 z-10"
          >
            <div
              ref={transcriptRef}
              className="max-h-28 overflow-y-auto space-y-2 rounded-2xl p-3 no-scrollbar"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                backdropFilter: 'blur(12px)',
              }}
            >
              {transcript.map(line => (
                <motion.p
                  key={line.id}
                  initial={{ opacity: 0, x: line.role === 'agent' ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`text-xs leading-relaxed ${
                    line.role === 'agent' ? 'text-left' : 'text-right'
                  }`}
                >
                  {line.role === 'agent' && (
                    <span className="font-semibold mr-1" style={{ color: '#E8B060' }}>{character.name}:</span>
                  )}
                  <span style={{ color: line.role === 'agent' ? 'rgba(248,238,216,0.80)' : 'rgba(255,255,255,0.50)' }}>
                    {line.text}
                  </span>
                </motion.p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Controls section ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col items-center gap-5 pb-14 z-10 w-full px-8"
      >
        {/* Volume slider */}
        <AnimatePresence>
          {isConnected && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 w-full max-w-xs"
            >
              <VolumeX size={14} style={{ color: 'rgba(255,255,255,0.30)' }} className="flex-shrink-0" />
              <input
                type="range" min={0} max={1} step={0.05} value={volume}
                onChange={e => handleVolume(parseFloat(e.target.value))}
                className="flex-1 h-0.5 rounded-full cursor-pointer"
                style={{ accentColor: '#C4934A' }}
              />
              <Volume2 size={14} style={{ color: 'rgba(255,255,255,0.30)' }} className="flex-shrink-0" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main controls */}
        <div className="flex items-center gap-7">
          {/* Mic toggle */}
          <AnimatePresence>
            {isConnected && (
              <motion.button
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                whileTap={{ scale: 0.88 }}
                onClick={toggleMic}
                className="w-14 h-14 rounded-full flex items-center justify-center transition-all"
                style={micEnabled ? {
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.15)',
                } : {
                  background: 'rgba(220,38,38,0.20)',
                  border: '1px solid rgba(220,38,38,0.35)',
                  boxShadow: '0 0 16px rgba(220,38,38,0.30)',
                }}
              >
                {micEnabled
                  ? <Mic size={20} style={{ color: 'rgba(255,255,255,0.80)' }} />
                  : <MicOff size={20} style={{ color: '#F87171' }} />
                }
              </motion.button>
            )}
          </AnimatePresence>

          {/* Primary CTA */}
          {!isConnected && !isConnecting ? (
            // ─ Start Call ───────────────────────────────────────────
            <motion.button
              onClick={handleStart}
              whileTap={{ scale: 0.92 }}
              disabled={micPermission === 'denied'}
              className="relative w-28 h-28 rounded-full flex items-center justify-center transition-all disabled:opacity-40"
              style={{
                background: 'linear-gradient(135deg, #8B1538 0%, #C0274A 50%, #C4934A 100%)',
                boxShadow: '0 0 40px rgba(192,39,74,0.55), 0 0 80px rgba(139,21,56,0.30)',
              }}
            >
              {/* Rotating border ring */}
              <motion.div
                className="absolute inset-[-3px] rounded-full"
                style={{ border: '2px solid rgba(196,147,74,0.40)' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              />
              <span className="text-4xl select-none">📞</span>
            </motion.button>
          ) : (
            // ─ End Call ─────────────────────────────────────────────
            <motion.button
              onClick={handleEnd}
              whileTap={{ scale: 0.92 }}
              className="w-20 h-20 rounded-full flex items-center justify-center transition-all"
              style={{
                background: 'linear-gradient(135deg, #7F1D1D, #DC2626)',
                boxShadow: '0 0 30px rgba(220,38,38,0.55)',
              }}
            >
              <PhoneOff size={26} className="text-white" />
            </motion.button>
          )}

          {/* Right balance spacer */}
          {isConnected && <div className="w-14 h-14" />}
        </div>

        {/* Mic denied */}
        <AnimatePresence>
          {micPermission === 'denied' && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-red-400 text-center max-w-xs"
            >
              Microphone access denied. Allow mic access in browser settings and reload.
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

// ─── Outer wrapper ────────────────────────────────────────────────────────────

export function VoiceCall(props: VoiceCallProps) {
  return (
    <ConversationProvider>
      <VoiceCallInner {...props} />
    </ConversationProvider>
  )
}
