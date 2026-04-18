'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Phone, Sparkles, Smile, Mic, ArrowLeft, Camera, ImageIcon, X, Heart } from 'lucide-react'
import Link from 'next/link'
import { useAppStore } from '@/store/useAppStore'
import type { Message, Character } from '@/types'
import { cn } from '@/lib/utils'
import { PaymentModal } from '@/components/payment/PaymentModal'
import BondMeter from '@/components/chat/BondMeter'
import type { BondData } from '@/components/chat/BondMeter'

// Extended message type used for seeded image placeholders
interface ExtendedMessage extends Message { needsImage?: boolean }

interface ChatInterfaceProps {
  characterId: string
  characterName: string
  character: Omit<Character, 'created_at'>
  chatId: string
}

const EMOJI_QUICK = ['❤️', '🔥', '😏', '😍', '🌹', '☕', '💋', '✨', '🥀', '💫']

// Image request detection
const IMAGE_TRIGGERS = [
  /\b(generate|create|make|send|show)\s+(me\s+)?(a\s+|an\s+)?photo/i,
  /\b(generate|create|make|send|show)\s+(me\s+)?(a\s+|an\s+)?image/i,
  /\b(generate|create|make|send|show)\s+(me\s+)?(a\s+|an\s+)?pic(ture)?/i,
  /\bsend\s+(me\s+)?a\s+selfie/i,
  /\bshow\s+(me\s+)?yourself/i,
  /\bwhat\s+do\s+you\s+look\s+like/i,
]

function isImageRequest(message: string): boolean {
  return IMAGE_TRIGGERS.some(re => re.test(message))
}

function extractScene(message: string): string {
  return message
    .replace(/\b(generate|create|make|send|show|me|a|an)\b/gi, '')
    .replace(/\b(photo|image|pic|picture)\b/gi, '')
    .replace(/\b(of|the|this)\b/gi, '')
    .trim()
    .slice(0, 120)
}

const WELCOME_MESSAGES: Record<string, string> = {
  priya:      `Finally, you're here. 😏 I was starting to wonder if you'd forgotten about me. What took you so long?`,
  kabita:     `You came. 🌙 I had a feeling you would today. Sit with me — tell me something real.`,
  yuki:       `Oh. You actually showed up. ❄️ ...Not that I was waiting or anything. Don't read into this.`,
  sofia:      `Ei, you made it! 🔥 I was just thinking about you. Life is too short for slow conversations — let's go.`,
  emma:       `Hey! You showed up 😊 I was literally just thinking — hope something good happened to you today. Tell me everything.`,
  luna:       `You're here. 🌸 I don't say this lightly — I'm genuinely glad. How has your day been, really?`,
  valentina:  `You came. 💜 Good. I don't give my time to people who make me wait twice. What's on your mind?`,
  mei:        `You're on time. That already puts you ahead of most people. 📚 What would you like to talk about?`,
  isabella:   `Ciao. 🎨 I was sketching something and thinking about you. Some conversations are worth pausing art for.`,
  zara:       `You're here. 🌍 I've been in three time zones today — and yet, somehow I was thinking about this conversation.`,
}

const SEEDED_CHATS: Record<string, Array<{ role: 'user' | 'assistant'; content: string; image_url?: string }>> = {
  priya: [
    { role: 'user',      content: 'Priya, show me how you look today 📸' },
    { role: 'assistant', content: 'You asked, so I suppose I’ll indulge you… just this once. 😏✨', image_url: '__IMG__' },
  ],
  kabita: [
    { role: 'user',      content: 'Kabita, send me a photo 🌙' },
    { role: 'assistant', content: 'Only for you. The mountains are in the background — I thought you’d like that. 🏔️', image_url: '__IMG__' },
  ],
  yuki: [
    { role: 'user',      content: 'Yuki, can I see you today? ❄️' },
    { role: 'assistant', content: 'I… fine. Here. Don’t make it weird. ❄️😡', image_url: '__IMG__' },
  ],
  sofia: [
    { role: 'user',      content: 'Sofia, show me your world 🔥' },
    { role: 'assistant', content: 'São Paulo, Sunday morning, coffee, and sunshine. This is my life — aren’t you glad you asked? ✨', image_url: '__IMG__' },
  ],
  emma: [
    { role: 'user',      content: 'Emma, how are you looking today? 😊' },
    { role: 'assistant', content: 'Oh you know, just casually adorable on a Tuesday. 🌟 Here—', image_url: '__IMG__' },
  ],
  luna: [
    { role: 'user',      content: 'Luna, can I see you? 🌸' },
    { role: 'assistant', content: 'I took this for you. I hope it makes your day a little softer. 🌸', image_url: '__IMG__' },
  ],
  valentina: [
    { role: 'user',      content: 'Valentina, send a photo 💜' },
    { role: 'assistant', content: 'You want a photo? Then look— this is what passion looks like. 🔥🌦️', image_url: '__IMG__' },
  ],
  mei: [
    { role: 'user',      content: 'Mei, show me a photo 📚' },
    { role: 'assistant', content: 'Shanghai at dusk. I think of you when the skyline lights up. 🌃', image_url: '__IMG__' },
  ],
  isabella: [
    { role: 'user',      content: 'Isabella, let me see you 🎨' },
    { role: 'assistant', content: 'Brera this morning. I was sketching when you messaged — perfect timing. 🎨✨', image_url: '__IMG__' },
  ],
  zara: [
    { role: 'user',      content: 'Zara, show me your world 🌍' },
    { role: 'assistant', content: 'Dubai golden hour. There are places that match certain moods — this one matches you. 🌇✨', image_url: '__IMG__' },
  ],
}

export default function ChatInterface({ characterId, characterName, character, chatId }: ChatInterfaceProps) {
  const { messages, addMessage, isGeneratingImage, setIsGeneratingImage, memory, chatSessions, setChatSession, addMemory, bondData, setBond } = useAppStore()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [imagingScenario, setImagingScenario] = useState('')
  const [showImagePrompt, setShowImagePrompt] = useState(false)
  const [bond, setBondLocal] = useState<BondData | null>(bondData[characterId] ?? null)
  const [paymentModal, setPaymentModal] = useState<{ open: boolean; reason?: string }>({ open: false })
  const [tokensLeft, setTokensLeft] = useState<number | null>(null)
  const [tokensTotal, setTokensTotal] = useState<number>(35)
  const [checkinInjected, setCheckinInjected] = useState(false)
  const [justLevelledUp, setJustLevelledUp] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const chatMessages = useMemo(() => messages[chatId] ?? [], [messages, chatId])

  // Character memory for this chat
  const charMemory = useMemo(() => memory?.[characterId] || [], [memory, characterId])

  // ── Load persisted Supabase messages on first mount ─────────────────────────
  // If the user has chatted before, we have a real Supabase chatId stored.
  // Fetch those messages and hydrate the store — this survives localStorage clears
  // and lets messages appear on different devices when logged in.
  useEffect(() => {
    const supabaseChatId = chatSessions[characterId]
    if (!supabaseChatId) return

    // Skip if we already have messages in the store for this chat
    const existing = useAppStore.getState().messages[chatId] ?? []
    if (existing.length > 0) return

    fetch(`/api/chats/${supabaseChatId}`)
      .then(r => (r.ok ? r.json() : null))
      .then((data: { messages?: Array<{ id: string; role: string; content: string; created_at: string }> } | null) => {
        if (!data?.messages?.length) return
        const formatted: Message[] = data.messages.map(m => ({
          id: m.id,
          chat_id: chatId,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          created_at: m.created_at,
        }))
        useAppStore.getState().setMessages(chatId, formatted)
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterId])

  // ── Fetch pending check-in (while-you-were-away message) ───────────────────
  // After the first genuine message is seeded, check if the cron agent sent a
  // check-in while the user was away. If so, inject it as a styled message.
  useEffect(() => {
    if (checkinInjected) return
    fetch(`/api/checkin/pending?characterId=${encodeURIComponent(characterId)}`)
      .then(r => (r.ok ? r.json() : null))
      .then((data: { pending?: { id: string; message: string; sentAt: string } | null } | null) => {
        if (!data?.pending?.message) return
        setCheckinInjected(true)
        addMessage(chatId, {
          id: `checkin-${data.pending.id}`,
          chat_id: chatId,
          role: 'assistant',
          content: data.pending.message,
          // Flag so ChatInterface can render with special styling
          created_at: data.pending.sentAt,
        })
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterId, chatId])

  // ── Seed welcome + demo messages once ───────────────────────────────────────
  useEffect(() => {
    const alreadySeeded = chatMessages.some(m => m.id === 'welcome' || m.id.startsWith('seed-'))
    if (alreadySeeded) return

    const welcome = WELCOME_MESSAGES[characterId.toLowerCase()] ||
      `Hello, I'm ${characterName}. 💜 I'm glad you're here — what would you like to talk about?`
    addMessage(chatId, {
      id: 'welcome',
      chat_id: chatId,
      role: 'assistant',
      content: welcome,
      created_at: new Date(Date.now() - 60000).toISOString(),
    })

    const seeds = SEEDED_CHATS[characterId.toLowerCase()]
    if (seeds) {
      seeds.forEach((seed, i) => {
        addMessage(chatId, {
          id: `seed-${i}`,
          chat_id: chatId,
          role: seed.role,
          content: seed.content,
          image_url: seed.image_url === '__IMG__' ? undefined : seed.image_url,
          created_at: new Date(Date.now() - (50000 - i * 5000)).toISOString(),
          ...(seed.image_url === '__IMG__' ? { needsImage: true } : {}),
        })
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, characterId, characterName])

  const loadSeededImage = useCallback(async (msgId: string) => {
    if (useAppStore.getState().isGeneratingImage) return
    setIsGeneratingImage(true)
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 30000)
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId: character.id, customPrompt: 'candid selfie, natural lighting, warm smile', chatId }),
        signal: ctrl.signal,
      })
      clearTimeout(timer)
      const data = await res.json()
      const store = useAppStore.getState()
      const current = (store.messages[chatId] ?? []) as ExtendedMessage[]
      store.setMessages(chatId, current.map(m =>
        m.id === msgId ? { ...m, image_url: data.image_url || undefined, needsImage: false } : m
      ))
    } catch {
      console.warn('[ChatInterface] Seeded image load failed for', msgId)
    } finally {
      setIsGeneratingImage(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character.id, chatId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const generateImageInline = useCallback(async (scene: string = '') => {
    if (useAppStore.getState().isGeneratingImage) return
    setIsGeneratingImage(true)

    addMessage(chatId, {
      id: `cam-${Date.now()}`,
      chat_id: chatId,
      role: 'assistant',
      content: scene
        ? `One moment… creating something special for you. 📸✨`
        : `Here — just for you. 😏📸`,
      created_at: new Date().toISOString(),
    })

    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 30000)
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId: character.id, customPrompt: scene || '', chatId }),
        signal: ctrl.signal,
      })
      clearTimeout(timer)
      const data = await res.json()

      if (res.status === 402) {
        setPaymentModal({ open: true, reason: data.limitHit })
        addMessage(chatId, {
          id: `img-limit-${Date.now()}`,
          chat_id: chatId,
          role: 'assistant',
          content: data.error || "You've used today's photo limit. Upgrade for ₹20 to unlock 6 photos a day.",
          created_at: new Date().toISOString(),
        })
        return
      }

      if (data.image_url) {
        addMessage(chatId, {
          id: `img-${Date.now()}`,
          chat_id: chatId,
          role: 'assistant',
          content: 'There you go — captured just for this moment. 😏📸',
          image_url: data.image_url,
          created_at: new Date().toISOString(),
        })
      } else {
        addMessage(chatId, {
          id: `img-err-${Date.now()}`,
          chat_id: chatId,
          role: 'assistant',
          content: data.error || "Couldn't generate the photo right now — please try again.",
          created_at: new Date().toISOString(),
        })
      }
    } catch {
      addMessage(chatId, {
        id: `img-err2-${Date.now()}`,
        chat_id: chatId,
        role: 'assistant',
        content: "Couldn't load the photo right now. Please try again in a moment.",
        created_at: new Date().toISOString(),
      })
    } finally {
      setIsGeneratingImage(false)
      setImagingScenario('')
    }
  }, [character.id, chatId, addMessage, setIsGeneratingImage])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || loading) return
    setInput('')
    setShowEmoji(false)

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      chat_id: chatId,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }
    addMessage(chatId, userMsg)

    if (isImageRequest(content)) {
      const scene = extractScene(content)
      await generateImageInline(scene)
      return
    }

    setLoading(true)
    const typingId = `typing-${Date.now()}`
    addMessage(chatId, {
      id: typingId,
      chat_id: chatId,
      role: 'assistant',
      content: '...',
      created_at: new Date().toISOString(),
    })

    try {
      const historyMessages = [...chatMessages, userMsg]
        .filter(m => m.id !== 'welcome' && !m.id.startsWith('typing-') && !m.id.startsWith('seed-'))
        .map(m => ({ role: m.role, content: m.content }))

      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 15000)

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyMessages,
          characterId: character.id,
          // Pass the real Supabase chatId if we have one, so the API saves to the right row
          chatId: chatSessions[characterId] || chatId,
          memory: charMemory,
        }),
        signal: ctrl.signal,
      })
      clearTimeout(timer)

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 402) setPaymentModal({ open: true, reason: data.limitHit })
        throw new Error(data.error || 'Chat failed')
      }

      if (data.tokensLeft !== null && data.tokensLeft !== undefined) {
        setTokensLeft(data.tokensLeft)
        if (data.tokensTotal) setTokensTotal(data.tokensTotal)
      }

      // Persist the real Supabase chatId so future messages (and refreshes) use it
      if (data.chatId && !data.chatId.startsWith('chat-') && !data.chatId.startsWith('demo-')) {
        if (!chatSessions[characterId]) {
          setChatSession(characterId, data.chatId)
        }
      }

      // Save extracted memory facts
      if (Array.isArray(data.extractedFacts) && data.extractedFacts.length > 0) {
        for (const fact of data.extractedFacts as string[]) {
          addMemory(characterId, fact)
        }
      }

      // Update bond data in store + local state for instant UI
      // affectionPoints feeds the Love Meter; levelledUp fires the celebration banner
      if (data.bond) {
        const bondUpdate: BondData = {
          level:           data.bond.level,
          messageCount:    data.bond.messageCount,
          daysChatted:     data.bond.daysChatted,
          streak:          data.bond.streak,
          affectionPoints: data.bond.affectionPoints ?? 0,
        }
        setBond(characterId, bondUpdate)
        setBondLocal(bondUpdate)
        if (data.bond.levelledUp) {
          setJustLevelledUp(true)
          setTimeout(() => setJustLevelledUp(false), 4500)
        }
      }

      const store = useAppStore.getState()
      const currentMsgs = store.messages[chatId] || []
      store.setMessages(chatId, [
        ...currentMsgs.filter(m => m.id !== typingId),
        {
          id: `ai-${Date.now()}`,
          chat_id: chatId,
          role: 'assistant' as const,
          content: data.content || 'Something went wrong — please try again.',
          created_at: new Date().toISOString(),
        },
      ])
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error'
      const store = useAppStore.getState()
      const currentMsgs = store.messages[chatId] || []
      store.setMessages(chatId, [
        ...currentMsgs.filter(m => m.id !== typingId),
        {
          id: `err-${Date.now()}`,
          chat_id: chatId,
          role: 'assistant' as const,
          content: errMsg?.includes('Token') ? errMsg : 'Something went wrong. Give me a second and try again. 🙏',
          created_at: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }, [loading, chatMessages, chatId, character.id, addMessage, generateImageInline, charMemory])

  const handleGenerateFromPrompt = () => {
    setShowImagePrompt(false)
    generateImageInline(imagingScenario)
  }

  // ── Avatar ────────────────────────────────────────────────────────────────
  const AvatarDisplay = () => (
    <div className="relative flex-shrink-0">
      <div
        className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-gold/40"
        style={{ background: character.avatarGradient || 'linear-gradient(135deg, #8B1538, #C4934A)' }}
      >
        {character.avatar_url ? (
          <img src={character.avatar_url} alt={characterName} className="w-full h-full object-cover object-top" onError={e => { e.currentTarget.style.display = 'none' }} />
        ) : null}
        <div className="w-full h-full flex items-center justify-center text-sm font-bold text-white">
          {characterName.charAt(0)}
        </div>
      </div>
      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2" style={{ borderColor: '#0C0008' }} />
    </div>
  )

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col relative" style={{ height: '100dvh', background: 'linear-gradient(180deg, #0C0008 0%, #080407 100%)' }}>

      {/* Ambient glow orbs */}
      <div className="absolute top-0 left-0 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,21,56,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      <div className="absolute bottom-24 right-0 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(196,147,74,0.10) 0%, transparent 70%)', filter: 'blur(40px)' }} />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0 relative z-10"
        style={{
          background: 'linear-gradient(180deg, rgba(26,0,16,0.95) 0%, rgba(12,0,8,0.80) 100%)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(196,147,74,0.15)',
        }}
      >
        <Link href="/explore" className="p-1.5 rounded-xl transition-colors" style={{ color: 'rgba(248,238,216,0.6)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          <ArrowLeft size={18} />
        </Link>

        <AvatarDisplay />

        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-base leading-none" style={{ color: '#F8EED8', fontFamily: 'var(--font-display)' }}>
            {characterName}
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(196,147,74,0.80)' }}>{character.tagline}</p>
        </div>

        <div className="flex items-center gap-1">
          <Link href={`/call/${character.id}`} className="p-2 rounded-xl transition-all" style={{ color: 'rgba(248,238,216,0.60)' }}>
            <Phone size={16} />
          </Link>
          <button
            className="p-2 rounded-xl transition-all"
            onClick={() => setShowImagePrompt(!showImagePrompt)}
            style={{ color: 'rgba(248,238,216,0.60)' }}
          >
            <ImageIcon size={16} />
          </button>
        </div>
      </div>

      {/* ── BondMeter (below header) ─────────────────────────────────────── */}
      <div className="flex-shrink-0 relative z-10">
        <BondMeter
          bond={bond}
          memories={charMemory}
          characterName={characterName}
          justLevelledUp={justLevelledUp}
        />
      </div>



      {/* ── Character info strip ───────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0 relative z-10"
        style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex gap-1.5 flex-wrap">
          {character.personality_tags.map(tag => (
            <span key={tag} className="badge-desi text-[10px]">{tag}</span>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-0.5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-1.5 w-3.5 rounded-full transition-all"
              style={{ background: i < character.heat_level ? '#C0274A' : 'rgba(255,255,255,0.10)' }} />
          ))}
        </div>
      </div>

      {/* ── Hint bar ─────────────────────────────────────────────────────────── */}
      <div className="text-center py-1.5 text-[11px] flex-shrink-0 relative z-10"
        style={{ background: 'rgba(196,147,74,0.04)', color: 'rgba(196,147,74,0.65)', borderBottom: '1px solid rgba(196,147,74,0.08)' }}>
        ✨ Say &quot;Send me a photo&quot; to get a picture — your bond grows with every message 💌
      </div>

      {/* ── Messages ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 no-scrollbar relative z-10">
        <AnimatePresence initial={false}>
          {chatMessages.map(msg => {
            const isTyping = msg.id.startsWith('typing-') && msg.content === '...'
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                <div className="max-w-[80%]">
                  {isTyping ? (
                    /* Typing indicator */
                    <div className="px-4 py-3 rounded-2xl rounded-tl-md"
                      style={{ background: 'linear-gradient(135deg, rgba(139,21,56,0.60), rgba(192,39,74,0.40))', border: '1px solid rgba(139,21,56,0.35)' }}>
                      <span className="flex items-center gap-1">
                        {[0, 150, 300].map(delay => (
                          <span key={delay} className="w-1.5 h-1.5 rounded-full animate-bounce"
                            style={{ background: 'rgba(248,238,216,0.75)', animationDelay: `${delay}ms` }} />
                        ))}
                      </span>
                    </div>
                  ) : (
                    <>
                      {/* Check-in badge (only shows for messages from the cron agent) */}
                      {msg.id.startsWith('checkin-') && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '0.6rem',
                          color: 'rgba(196,147,74,0.70)',
                          marginBottom: '4px',
                          paddingLeft: '2px',
                        }}>
                          <span>💌</span>
                          <span>While you were away…</span>
                        </div>
                      )}

                      {/* Bubble */}
                      {msg.role === 'user' ? (
                        <div className="bubble-user">
                          {msg.content}
                        </div>
                      ) : (
                        <div className="bubble-ai"
                          style={msg.id.startsWith('checkin-') ? {
                            borderColor: 'rgba(196,147,74,0.35)',
                            background: 'linear-gradient(135deg, rgba(139,21,56,0.55), rgba(196,147,74,0.18))',
                          } : undefined}
                        >
                          {msg.content}
                        </div>
                      )}

                      {/* Tap-to-reveal for seeded images */}
                      {(msg as ExtendedMessage).needsImage && !msg.image_url && (
                        <button
                          onClick={() => loadSeededImage(msg.id)}
                          disabled={isGeneratingImage}
                          className="mt-2 flex items-center gap-2 px-4 py-3 rounded-2xl text-sm transition-all"
                          style={{
                            background: 'rgba(196,147,74,0.10)',
                            border: '1px solid rgba(196,147,74,0.25)',
                            color: '#E8B060',
                          }}
                        >
                          <Camera size={16} className={isGeneratingImage ? 'animate-pulse' : ''} />
                          <span>{isGeneratingImage ? 'Loading photo...' : 'Tap to see photo 📸'}</span>
                        </button>
                      )}

                      {/* Image */}
                      {msg.image_url && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.93 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.35 }}
                          className="mt-2 rounded-2xl overflow-hidden max-w-[240px] shadow-xl"
                          style={{ border: '1px solid rgba(196,147,74,0.30)' }}
                        >
                          <img src={msg.image_url} alt={`${characterName}'s photo`} className="w-full object-cover" loading="lazy" />
                          <div className="flex items-center justify-center gap-1 py-1.5 text-[10px]"
                            style={{ background: 'rgba(196,147,74,0.12)', color: '#E8B060' }}>
                            <Heart size={10} fill="#C0274A" stroke="none" />
                            <span>{characterName}&apos;s photo for you</span>
                          </div>
                        </motion.div>
                      )}

                      {/* Timestamp */}
                      <p className={cn('text-[10px] mt-1', msg.role === 'user' ? 'text-right' : '')}
                        style={{ color: 'rgba(248,238,216,0.30)' }}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Image generating indicator */}
        {isGeneratingImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl rounded-tl-md flex items-center gap-2 text-sm"
              style={{ background: 'linear-gradient(135deg, rgba(139,21,56,0.50), rgba(192,39,74,0.30))', border: '1px solid rgba(139,21,56,0.30)', color: '#E8B060' }}>
              <Camera size={14} className="animate-pulse" />
              <span>{characterName} is preparing your photo... ✨</span>
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Image prompt overlay ───────────────────────────────────────────── */}
      <AnimatePresence>
        {showImagePrompt && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-20 left-4 right-4 rounded-2xl p-4 z-20 shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(26,0,16,0.97), rgba(12,0,8,0.97))',
              border: '1px solid rgba(196,147,74,0.30)',
              backdropFilter: 'blur(24px)',
            }}
          >
            <p className="text-sm font-semibold mb-1" style={{ color: '#E8B060', fontFamily: 'var(--font-display)' }}>
              📸 Photo Request to {characterName}
            </p>
            <p className="text-xs mb-3" style={{ color: 'rgba(248,238,216,0.50)' }}>Describe the scene or leave empty for a natural selfie</p>
            <input
              className="input-desi mb-3"
              placeholder="e.g. red lehenga at Diwali, candid at Hauz Khas..."
              value={imagingScenario}
              onChange={e => setImagingScenario(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGenerateFromPrompt()}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowImagePrompt(false)}
                className="btn-ghost flex-1 text-xs py-2 px-3"
              >
                Cancel
              </button>
              <button onClick={handleGenerateFromPrompt} className="btn-gold flex-1 text-xs py-2 px-3">
                <Sparkles size={12} /> Generate Photo
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Token counter strip ───────────────────────────────────────────── */}
      {tokensLeft !== null && (
        <div
          className="flex items-center justify-between px-4 py-1.5 text-[10px] flex-shrink-0 relative z-10"
          style={{
            background: tokensLeft <= 5 ? 'rgba(239,68,68,0.08)' : 'rgba(196,147,74,0.05)',
            borderTop: '1px solid rgba(196,147,74,0.12)',
          }}
        >
          <span style={{ color: tokensLeft <= 5 ? '#ef4444' : 'rgba(196,147,74,0.80)' }}>
            💬 {tokensLeft}/{tokensTotal} tokens
            {tokensLeft <= 5 ? ' — running low!' : ' remaining'}
          </span>
          {tokensLeft <= 5 && (
            <button
              onClick={() => setPaymentModal({ open: true, reason: 'token_limit' })}
              className="font-bold underline"
              style={{ color: '#C0274A' }}
            >
              Trial ₹20 →
            </button>
          )}
        </div>
      )}

      {/* ── Input bar ─────────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 px-4 pt-3 relative z-10"
        style={{
          background: 'linear-gradient(0deg, rgba(12,0,8,0.97) 0%, rgba(12,0,8,0.85) 100%)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(196,147,74,0.12)',
          paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        }}
      >
        {/* Quick emojis */}
        <AnimatePresence>
          {showEmoji && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-3 mb-3 overflow-hidden"
            >
              {EMOJI_QUICK.map(e => (
                <button
                  key={e}
                  onClick={() => setInput(prev => prev + e)}
                  className="text-xl hover:scale-130 transition-transform active:scale-90"
                >
                  {e}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2">
          {/* Emoji toggle */}
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className="flex-shrink-0 rounded-xl transition-all flex items-center justify-center"
            style={{ color: showEmoji ? '#C4934A' : 'rgba(248,238,216,0.40)', minWidth: 44, minHeight: 44 }}
          >
            <Smile size={20} />
          </button>

          {/* Camera */}
          <button
            onClick={() => setShowImagePrompt(!showImagePrompt)}
            className={cn('rounded-xl transition-all flex-shrink-0 flex items-center justify-center', isGeneratingImage && 'animate-pulse cursor-not-allowed')}
            style={{ color: isGeneratingImage ? 'rgba(196,147,74,0.50)' : 'rgba(248,238,216,0.50)', minWidth: 44, minHeight: 44 }}
            disabled={isGeneratingImage}
            title="Request a photo from her"
          >
            <Camera size={20} />
          </button>

          {/* Text input — 16px font prevents iOS auto-zoom */}
          <input
            ref={inputRef}
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="sentences"
            spellCheck={false}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
            placeholder={`Kuch kaho ${characterName} ko... 💕`}
            className="flex-1 rounded-2xl px-4 transition-all"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.10)',
              color: '#F8EED8',
              outline: 'none',
              fontSize: 16,           /* CRITICAL: prevents iOS Safari auto-zoom on focus */
              lineHeight: '1.4',
              minHeight: 44,          /* iOS minimum touch target */
              paddingTop: 10,
              paddingBottom: 10,
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(196,147,74,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(196,147,74,0.10)' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'; e.currentTarget.style.boxShadow = 'none' }}
            disabled={loading}
          />

          {/* Mic */}
          <button
            className="rounded-xl flex-shrink-0 transition-all flex items-center justify-center"
            style={{ color: 'rgba(248,238,216,0.40)', minWidth: 44, minHeight: 44 }}
          >
            <Mic size={20} />
          </button>

          {/* Send */}
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="rounded-xl flex-shrink-0 transition-all disabled:opacity-30 flex items-center justify-center"
            style={{
              background: input.trim() && !loading
                ? 'linear-gradient(135deg, #8B1538, #C0274A)'
                : 'rgba(255,255,255,0.06)',
              color: input.trim() && !loading ? '#fff' : 'rgba(248,238,216,0.25)',
              boxShadow: input.trim() && !loading ? '0 0 16px rgba(192,39,74,0.45)' : 'none',
              minWidth: 44,
              minHeight: 44,
            }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        open={paymentModal.open}
        reason={paymentModal.reason}
        onClose={() => setPaymentModal({ open: false })}
        onSuccess={() => setPaymentModal({ open: false })}
      />
    </div>
  )
}
