'use client'

import { useParams, useRouter } from 'next/navigation'
import { PREMADE_CHARACTERS } from '@/types'
import { VoiceCall } from '@/components/chat/VoiceCall'

/**
 * /call/[characterId] — Live voice call powered by ElevenLabs Conversational AI.
 * characterId = character slug (e.g. "priya") or display name.
 */
export default function CallPage() {
  const { characterId } = useParams<{ characterId: string }>()
  const router = useRouter()

  // Resolve character by slug or name
  const char = PREMADE_CHARACTERS.find(
    c => c.id === characterId || c.name.toLowerCase() === characterId?.toLowerCase()
  ) || PREMADE_CHARACTERS[0]

  // All premade characters are routed to the Priya ElevenLabs agent for now.
  // You can add per-character agent IDs here as you create more agents.
  const AGENT_MAP: Record<string, string> = {
    priya:  process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || '',
    anika:  process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || '',
    meera:  process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || '',
    kavya:  process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || '',
    riya:   process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || '',
    simran: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || '',
  }

  const agentId = AGENT_MAP[char.id] || process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || ''

  return (
    <VoiceCall
      character={char}
      agentId={agentId}
      onEnd={() => router.back()}
    />
  )
}
