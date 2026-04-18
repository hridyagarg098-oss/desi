'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  User, CreditCard, Bell, Shield, LogOut,
  ChevronRight, Globe, Trash2, Sparkles, Heart
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const SECTIONS = [
  {
    title: 'Account',
    items: [
      { icon: User, label: 'Edit Profile', href: '/profile' },
      { icon: CreditCard, label: 'Billing & Subscription', href: '/pricing' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { icon: Bell, label: 'Notifications', href: '#' },
      { icon: Globe, label: 'Language', href: '#' },
    ],
  },
  {
    title: 'Privacy',
    items: [
      { icon: Shield, label: 'Privacy Settings', href: '#' },
      { icon: Trash2, label: 'Delete Chat History', href: '#', danger: true },
    ],
  },
]

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  async function handleDeleteChats() {
    if (!confirm('Are you sure you want to delete all chat history? This cannot be undone.')) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('chats').delete().eq('user_id', user.id)
    alert('All chats deleted! 🗑️')
  }

  return (
    <div
      className="min-h-screen px-4 sm:px-6 py-8 pb-28 lg:pb-8"
      style={{ background: 'linear-gradient(160deg, #0C0008 0%, #1A000F 50%, #0C0008 100%)' }}
    >
      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-20 left-1/3 w-64 h-64 rounded-full blur-3xl opacity-15"
          style={{ background: 'radial-gradient(circle, #9F1239 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full blur-3xl opacity-10"
          style={{ background: 'radial-gradient(circle, #D97706 0%, transparent 70%)' }} />
      </div>

      <div className="relative max-w-2xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Settings</h1>
          <p className="text-white/35 text-sm">Manage your account preferences</p>
        </motion.div>

        <div className="space-y-5">
          {SECTIONS.map((section, si) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.08 }}
              className="rounded-2xl overflow-hidden relative"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                backdropFilter: 'blur(20px)',
              }}
            >
              {/* Section title */}
              <div className="px-5 py-3 flex items-center gap-2"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="w-1 h-1 rounded-full" style={{ background: '#9F1239' }} />
                <span className="text-xs font-semibold text-white/35 uppercase tracking-widest">
                  {section.title}
                </span>
              </div>

              <ul>
                {section.items.map((item, itemIdx) => (
                  <li
                    key={item.label}
                    style={itemIdx < section.items.length - 1 ? { borderBottom: '1px solid rgba(255,255,255,0.04)' } : {}}
                  >
                    {item.href === '#' && item.label === 'Delete Chat History' ? (
                      <button
                        onClick={handleDeleteChats}
                        className="w-full flex items-center gap-3 px-5 py-4 transition-colors text-left group hover:bg-red-500/5"
                      >
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                          <item.icon size={15} className="text-red-400" />
                        </div>
                        <span className="flex-1 text-sm font-medium text-red-400/70 group-hover:text-red-400 transition-colors">{item.label}</span>
                        <ChevronRight size={14} className="text-red-400/30 group-hover:text-red-400/60 transition-colors" />
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        className="flex items-center gap-3 px-5 py-4 transition-colors group hover:bg-white/[0.02]"
                      >
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all group-hover:scale-105"
                          style={{
                            background: item.danger ? 'rgba(239,68,68,0.1)' : 'rgba(159,18,57,0.12)',
                            border: item.danger ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(159,18,57,0.2)',
                          }}>
                          <item.icon
                            size={15}
                            className={item.danger ? 'text-red-400' : 'text-[#9F1239]'}
                          />
                        </div>
                        <span className={`flex-1 text-sm font-medium transition-colors ${item.danger ? 'text-red-400/70 group-hover:text-red-400' : 'text-white/60 group-hover:text-white/90'}`}>
                          {item.label}
                        </span>
                        <ChevronRight size={14} className="text-white/20 group-hover:text-white/40 transition-all group-hover:translate-x-0.5" />
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}

          {/* Sign out */}
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-semibold text-sm transition-all disabled:opacity-50 hover:bg-red-500/5 group"
            style={{
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#F87171',
            }}
          >
            <LogOut size={15} className="group-hover:-translate-x-0.5 transition-transform" />
            {signingOut ? 'Signing out...' : 'Sign Out'}
          </motion.button>

          {/* Footer branding */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center py-2"
          >
            <p className="text-xs text-white/20 flex items-center justify-center gap-1.5">
              <Sparkles size={10} className="text-[#F59E0B]/40" />
              Velvet v1.0
              <span className="text-white/10">·</span>
              Made with
              <Heart size={9} className="text-red-500/50 fill-current" />
              in Delhi
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
