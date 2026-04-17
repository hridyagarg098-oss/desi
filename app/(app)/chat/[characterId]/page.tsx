import ChatInterface from '@/components/chat/ChatInterface'
import { PREMADE_CHARACTERS } from '@/types'

interface ChatPageProps {
  params: Promise<{ characterId: string }>
  searchParams: Promise<{ chatId?: string }>
}

export default async function ChatPage({ params, searchParams }: ChatPageProps) {
  const { characterId } = await params
  const { chatId } = await searchParams

  // Match by id first, then by name (case-insensitive) — handles both /chat/priya and /chat/Priya
  const character = PREMADE_CHARACTERS.find(
    (c) =>
      c.id === characterId ||
      c.id === characterId.toLowerCase() ||
      c.name.toLowerCase() === characterId.toLowerCase()
  )

  if (!character) {
    // For custom characters, don't 404 — show a generic chat UI
    // Future: fetch from DB. For now, return a fallback character.
    const fallback = PREMADE_CHARACTERS[0]
    const resolvedChatId = chatId || `chat-${characterId}`
    return (
      <ChatInterface
        characterId={characterId}
        characterName={characterId.charAt(0).toUpperCase() + characterId.slice(1)}
        character={{ ...fallback, id: characterId, name: characterId.charAt(0).toUpperCase() + characterId.slice(1) }}
        chatId={resolvedChatId}
      />
    )
  }

  // Use stable chatId — no Date.now() to avoid new id on each render (causes duplicate welcome msgs)
  const resolvedChatId = chatId || `chat-${character.id}`

  return (
    <ChatInterface
      characterId={character.id}
      characterName={character.name}
      character={character}
      chatId={resolvedChatId}
    />
  )
}
