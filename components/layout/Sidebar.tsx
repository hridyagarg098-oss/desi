'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, MessageCircle, Sparkles, Heart, Settings,
  LogOut, Crown, User, Coins, Zap, ChevronRight
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { PLAN_LIMITS } from '@/lib/payment/limits'

type Profile = Database['public']['Tables']['profiles']['Row']

interface SidebarProps {
  user?: SupabaseUser | null
}

const NAV_ITEMS = [
  { href: '/explore',      label: 'Discover',     icon: Home,           desc: 'Browse darlings' },
  { href: '/my-darlings',  label: 'My Darlings',  icon: Heart,          desc: 'Your connections' },
  { href: '/create',       label: 'Create',        icon: Sparkles,       desc: 'Build your AI' },
  { href: '/pricing',      label: 'Upgrade',       icon: Crown,          desc: 'Plans & pricing' },
]

export function Sidebar({ user: initialUser }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [user, setUser] = useState<SupabaseUser | null>(initialUser ?? null)

  useEffect(() => {
    async function loadProfile(uid: string) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single()
      if (data) setProfile(data)
    }

    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      setUser(currentUser)
      if (currentUser) loadProfile(currentUser.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        loadProfile(currentUser.id)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Darling'
  const maxTokens = PLAN_LIMITS[profile?.plan as keyof typeof PLAN_LIMITS]?.tokens_per_day ?? 35
  const currentTokens = Math.min(profile?.tokens ?? 0, maxTokens)
  const tokenPct = Math.min(100, (currentTokens / maxTokens) * 100)

  const planBadge =
    profile?.plan === 'trial'
      ? { label: 'Trial', color: '#E8B060', icon: <Zap size={10} className="fill-current" /> }
      : profile?.plan === 'premium'
      ? { label: 'Premium', color: '#C4934A', icon: <Crown size={10} /> }
      : { label: 'Free', color: 'rgba(255,255,255,0.35)', icon: null }

  return (
    <div className="w-64 h-full flex flex-col" style={{
      background: 'linear-gradient(180deg, #150010 0%, #0C0008 60%, #0a0006 100%)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
    }}>

      {/* ── Ambient orbs ────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,21,56,0.18) 0%, transparent 70%)', filter: 'blur(30px)' }}
      />

      {/* ── Logo ────────────────────────────────────────────────── */}
      <div className="p-6 pb-5 relative z-10">
        <Link href="/" className="flex items-center gap-3 group">
          <motion.div
            whileHover={{ scale: 1.08, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #8B1538, #C4934A)',
              boxShadow: '0 0 20px rgba(196,147,74,0.35)',
            }}
          >
            <Heart className="w-5 h-5 text-white fill-current" />
          </motion.div>
          <div>
            <div className="font-bold text-[15px] leading-none text-white tracking-tight"
              style={{ fontFamily: '"Playfair Display", serif' }}>
              DesiDarling
            </div>
            <div className="text-[9px] font-semibold tracking-[0.2em] uppercase mt-0.5"
              style={{ color: '#C4934A' }}>
              .ai — Your AI Companion
            </div>
          </div>
        </Link>

        {/* Gold divider */}
        <div className="mt-5 h-px" style={{
          background: 'linear-gradient(90deg, transparent, rgba(196,147,74,0.30), transparent)'
        }} />
      </div>

      {/* ── Navigation ──────────────────────────────────────────── */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto no-scrollbar relative z-10">
        {NAV_ITEMS.map((item, i) => {
          const isActive = pathname === item.href || (item.href.length > 1 && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 3 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer group relative ${
                  isActive ? 'text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
                }`}
                style={isActive ? {
                  background: 'linear-gradient(135deg, rgba(139,21,56,0.45), rgba(196,147,74,0.15))',
                  border: '1px solid rgba(196,147,74,0.18)',
                } : {}}
              >
                {/* Active indicator line */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
                    style={{ background: 'linear-gradient(180deg, #C4934A, #C0274A)' }}
                  />
                )}

                <item.icon
                  size={17}
                  className="flex-shrink-0 transition-all"
                  style={{ color: isActive ? '#E8B060' : undefined }}
                />
                <div className="flex-1 min-w-0">
                  <div className="truncate leading-none">{item.label}</div>
                  {isActive && (
                    <div className="text-[10px] mt-0.5 truncate" style={{ color: 'rgba(196,147,74,0.65)' }}>
                      {item.desc}
                    </div>
                  )}
                </div>
                {isActive && (
                  <ChevronRight size={12} style={{ color: 'rgba(196,147,74,0.50)' }} />
                )}
              </motion.div>
            </Link>
          )
        })}

        {/* Recent chats heading */}
        <div className="pt-5 pb-1.5 px-3">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase" style={{ color: 'rgba(255,255,255,0.20)' }}>
            Recent Chats
          </div>
        </div>
        <Link href="/my-darlings">
          <div className="px-3 py-2 rounded-xl text-xs text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all flex items-center gap-2 cursor-pointer">
            <MessageCircle size={13} />
            <span className="truncate">View all conversations</span>
          </div>
        </Link>
      </nav>

      {/* ── Bottom section ───────────────────────────────────────── */}
      <div className="p-3 space-y-2.5 relative z-10" style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>

        {/* Token bar */}
        <AnimatePresence>
          {profile && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl p-3 space-y-2"
              style={{
                background: 'rgba(196,147,74,0.07)',
                border: '1px solid rgba(196,147,74,0.14)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'rgba(255,255,255,0.50)' }}>
                  <Coins size={11} style={{ color: '#C4934A' }} />
                  Tokens
                </div>
                <span className="text-[11px] font-bold tabular-nums" style={{ color: '#E8B060' }}>
                  {currentTokens}/{maxTokens}
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${tokenPct}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #8B1538, #C4934A)' }}
                />
              </div>
              {profile.plan === 'free' && (
                <Link
                  href="/pricing"
                  className="flex items-center justify-center gap-1 text-[10px] font-semibold transition-all hover:opacity-80"
                  style={{ color: '#C4934A' }}
                >
                  <Zap size={9} className="fill-current" />
                  Upgrade — Trial ₹20/day
                </Link>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* User card */}
        {user && (
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all hover:bg-white/[0.04] group cursor-default">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #8B1538, #C4934A)', boxShadow: '0 0 12px rgba(196,147,74,0.25)' }}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User size={13} className="text-white" />
              )}
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-white truncate leading-none">{displayName}</div>
              <div className="flex items-center gap-1 mt-0.5">
                {planBadge.icon}
                <span className="text-[9px] font-medium" style={{ color: planBadge.color }}>
                  {planBadge.label}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {user ? (
          <div className="flex gap-1.5">
            <Link
              href="/settings"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-medium transition-all"
              style={{ color: 'rgba(255,255,255,0.40)', background: 'rgba(255,255,255,0.04)' }}
            >
              <Settings size={12} /> Settings
            </Link>
            <button
              onClick={handleSignOut}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-medium transition-all hover:bg-red-900/25 hover:text-red-400"
              style={{ color: 'rgba(255,255,255,0.40)', background: 'rgba(255,255,255,0.04)' }}
            >
              <LogOut size={12} /> Sign out
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{
              background: 'linear-gradient(135deg, #8B1538, #C4934A)',
              color: '#fff',
              boxShadow: '0 0 16px rgba(139,21,56,0.35)',
            }}
          >
            <User size={14} /> Sign In
          </Link>
        )}
      </div>
    </div>
  )
}
