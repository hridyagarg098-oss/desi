'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Character, Message, UserProfile, Subscription } from '@/types'
import type { BondData } from '@/components/chat/BondMeter'

interface AppState {
  // Auth
  user: UserProfile | null
  setUser: (user: UserProfile | null) => void

  // Active chat
  activeChatId: string | null
  setActiveChatId: (id: string | null) => void

  // Active character
  activeCharacter: Character | null
  setActiveCharacter: (char: Character | null) => void

  // Messages (keyed by chatId)
  messages: Record<string, Message[]>
  addMessage: (chatId: string, msg: Message) => void
  setMessages: (chatId: string, msgs: Message[]) => void
  clearMessages: (chatId: string) => void

  // Subscription
  subscription: Subscription | null
  setSubscription: (sub: Subscription | null) => void

  // UI state
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  theme: 'light' | 'dark'
  toggleTheme: () => void

  // Age gate
  ageVerified: boolean
  setAgeVerified: (v: boolean) => void

  // Call state
  callActive: boolean
  setCallActive: (active: boolean) => void
  callCharacter: Character | null
  setCallCharacter: (char: Character | null) => void

  // Image generation
  isGeneratingImage: boolean
  setIsGeneratingImage: (v: boolean) => void

  // ── Conversation Memory (per characterId) ─────────────────────────────────
  // Stores short facts the AI has "learned" about the user across sessions.
  // e.g. ["User's name is Rahul", "User lives in Delhi", "User loves chai"]
  memory: Record<string, string[]>
  addMemory: (characterId: string, fact: string) => void
  setMemory: (characterId: string, facts: string[]) => void
  clearMemory: (characterId: string) => void

  // ── Chat sessions (characterId → real Supabase chatId) ──────────────────────
  // Lets us fetch/save to the correct DB row across page refreshes.
  chatSessions: Record<string, string>
  setChatSession: (characterId: string, chatId: string) => void

  // ── Bond data (live from Supabase, not persisted to localStorage) ──────────
  // Updated in real time after each chat message via the API response.
  bondData: Record<string, BondData>
  setBond: (characterId: string, data: BondData) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Auth
      user: null,
      setUser: (user) => set({ user }),

      // Chat
      activeChatId: null,
      setActiveChatId: (id) => set({ activeChatId: id }),

      // Character
      activeCharacter: null,
      setActiveCharacter: (char) => set({ activeCharacter: char }),

      // Messages
      messages: {},
      addMessage: (chatId, msg) =>
        set((state) => {
          const existing = state.messages[chatId] || []
          // Deduplicate by id — idempotent so React keys are always unique
          if (existing.some((m) => m.id === msg.id)) return state
          return {
            messages: {
              ...state.messages,
              [chatId]: [...existing, msg],
            },
          }
        }),
      setMessages: (chatId, msgs) =>
        set((state) => ({
          messages: { ...state.messages, [chatId]: msgs },
        })),
      clearMessages: (chatId) =>
        set((state) => {
          const { [chatId]: _, ...rest } = state.messages
          return { messages: rest }
        }),

      // Subscription
      subscription: null,
      setSubscription: (sub) => set({ subscription: sub }),

      // UI
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      theme: 'dark',
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),

      // Age gate
      ageVerified: false,
      setAgeVerified: (v) => set({ ageVerified: v }),

      // Call
      callActive: false,
      setCallActive: (active) => set({ callActive: active }),
      callCharacter: null,
      setCallCharacter: (char) => set({ callCharacter: char }),

      // Image gen
      isGeneratingImage: false,
      setIsGeneratingImage: (v) => set({ isGeneratingImage: v }),

      // Memory
      memory: {},
      addMemory: (characterId, fact) =>
        set((state) => {
          const existing = state.memory[characterId] || []
          // Deduplicate — avoid storing the same fact twice
          if (existing.includes(fact)) return state
          // Cap at 20 facts per character to avoid prompt bloat
          const updated = [...existing, fact].slice(-20)
          return { memory: { ...state.memory, [characterId]: updated } }
        }),
      setMemory: (characterId, facts) =>
        set((state) => ({
          memory: { ...state.memory, [characterId]: facts.slice(-20) },
        })),
      clearMemory: (characterId) =>
        set((state) => {
          const { [characterId]: _, ...rest } = state.memory
          return { memory: rest }
        }),

      // Chat sessions
      chatSessions: {},
      setChatSession: (characterId, chatId) =>
        set((state) => ({
          chatSessions: { ...state.chatSessions, [characterId]: chatId },
        })),

      // Bond data — not persisted (fetched fresh from Supabase via chat API)
      bondData: {},
      setBond: (characterId, data) =>
        set((state) => ({
          bondData: { ...state.bondData, [characterId]: data },
        })),
    }),
    {
      name: 'velvet-store',
      partialize: (s) => ({
        ageVerified: s.ageVerified,
        theme: s.theme,
        sidebarOpen: s.sidebarOpen,
        // Persist memory across sessions so the AI "remembers" the user
        memory: s.memory,
        // Persist messages so chat history survives page refresh
        messages: s.messages,
        // Persist resolved Supabase chatIds per character
        chatSessions: s.chatSessions,
      }),
    }
  )
)
