'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Camera, Save, Loader2, Crown, Coins, Heart,
  Calendar, Mail, CheckCircle2, AlertCircle, Zap, Flame, Sparkles
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  tokens: number
  plan: 'free' | 'basic' | 'premium' | 'trial'
  created_at: string
  updated_at: string
}

const PLAN_META: Record<string, { label: string; color: string; glow: string; icon: React.ReactNode }> = {
  free:    { label: 'Free',    color: '#6B7280', glow: 'rgba(107,114,128,0.3)', icon: <User size={10} /> },
  basic:   { label: 'Basic',   color: '#D97706', glow: 'rgba(217,119,6,0.3)',   icon: <Flame size={10} /> },
  trial:   { label: 'Trial',   color: '#F59E0B', glow: 'rgba(245,158,11,0.4)', icon: <Zap size={10} fill="currentColor" /> },
  premium: { label: 'Premium', color: '#E11D48', glow: 'rgba(225,29,72,0.4)',   icon: <Crown size={10} /> },
}

export default function ProfilePage() {
  const supabase = createClient()

  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUser(user)
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (data) {
        setProfile(data as Profile)
        setFullName(data.full_name ?? '')
        setUsername(data.username ?? '')
      }
      setLoading(false)
    }
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setMessage(null)
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        username: username.toLowerCase().trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
    }
    setSaving(false)
  }

  async function handlePasswordReset() {
    if (!user?.email) return
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/profile`,
    })
    if (!error) {
      setMessage({ type: 'success', text: 'Password reset email sent! Check your inbox.' })
    }
  }

  const planKey = profile?.plan ?? 'free'
  const plan = PLAN_META[planKey] ?? PLAN_META.free

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen"
        style={{ background: 'linear-gradient(160deg, #0C0008 0%, #1A000F 100%)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-[#9F1239]/30 animate-ping" />
            <div className="absolute inset-2 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #9F1239, #7D0A2C)' }}>
              <Loader2 className="animate-spin w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-white/40 text-sm">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen px-4 sm:px-6 py-8 pb-28 lg:pb-8"
      style={{ background: 'linear-gradient(160deg, #0C0008 0%, #1A000F 50%, #0C0008 100%)' }}
    >
      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 right-1/3 w-96 h-96 rounded-full blur-3xl opacity-15"
          style={{ background: 'radial-gradient(circle, #9F1239 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/3 left-1/4 w-64 h-64 rounded-full blur-3xl opacity-10"
          style={{ background: 'radial-gradient(circle, #D97706 0%, transparent 70%)' }} />
      </div>

      <div className="relative max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
            My Profile
          </h1>
          <p className="text-white/35 text-sm">Apni details update karo ✨</p>
        </motion.div>

        {/* Account overview card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-3xl overflow-hidden relative"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Gradient header banner */}
          <div className="h-28 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #9F1239 0%, #7D0A2C 60%, #4A0019 100%)' }}>
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 20px)' }} />
            {/* glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-40"
              style={{ background: 'radial-gradient(circle, #D97706 0%, transparent 70%)' }} />
          </div>

          {/* Avatar + info */}
          <div className="px-6 pb-6 -mt-12 flex items-end gap-4">
            <div className="relative flex-shrink-0">
              {/* animated ring */}
              <div className="absolute -inset-1 rounded-full animate-spin"
                style={{
                  background: 'conic-gradient(from 0deg, #9F1239, #D97706, #F59E0B, #9F1239)',
                  animationDuration: '3s',
                }} />
              <div className="relative w-20 h-20 rounded-full flex items-center justify-center border-4 border-[#0C0008]"
                style={{ background: 'linear-gradient(135deg, #1A000F, #2A000A)' }}>
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {profile?.full_name?.charAt(0) ?? user?.email?.charAt(0)?.toUpperCase() ?? '?'}
                  </span>
                )}
              </div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
                style={{ background: 'linear-gradient(135deg, #D97706, #F59E0B)' }}>
                <Camera size={12} className="text-white" />
              </button>
            </div>

            <div className="flex-1 pb-1">
              <div className="font-bold text-white text-lg mb-0.5" style={{ fontFamily: "'Playfair Display', serif" }}>
                {profile?.full_name || 'Mystery Darling'}
              </div>
              <div className="text-sm text-white/40">{user?.email}</div>
            </div>

            {/* Plan badge */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold mb-1 flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${plan.color}25, ${plan.color}10)`,
                border: `1px solid ${plan.color}50`,
                color: plan.color,
                boxShadow: `0 0 16px ${plan.glow}`,
              }}
            >
              {plan.icon}
              {plan.label}
            </div>
          </div>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              icon: <Coins size={18} style={{ color: '#F59E0B' }} />,
              label: 'Tokens',
              value: profile?.tokens ?? 0,
              color: '#F59E0B',
            },
            {
              icon: <Heart size={18} style={{ color: '#E11D48' }} />,
              label: 'Plan',
              value: plan.label,
              color: plan.color,
            },
            {
              icon: <Calendar size={18} style={{ color: '#8B5CF6' }} />,
              label: 'Joined',
              value: profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
                : '—',
              color: '#8B5CF6',
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="text-center p-4 rounded-2xl relative overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div className="flex justify-center mb-2">{stat.icon}</div>
              <div className="font-bold text-white capitalize text-sm">{stat.value}</div>
              <div className="text-[10px] text-white/35 mt-0.5">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Edit form */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-6 rounded-3xl relative overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.4), transparent)' }} />

          <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(159,18,57,0.2)' }}>
              <User size={14} className="text-[#9F1239]" />
            </div>
            Edit Profile
          </h2>

          <AnimatePresence mode="wait">
            {message && (
              <motion.div
                key={message.type}
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                className={`mb-5 p-3 rounded-xl text-sm flex items-center gap-2 ${
                  message.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}
              >
                {message.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                {message.text}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-3 rounded-xl text-white placeholder-white/25 focus:outline-none transition-all text-sm"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  caretColor: '#F59E0B',
                }}
                onFocus={e => {
                  e.currentTarget.style.border = '1px solid rgba(159,18,57,0.6)'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(159,18,57,0.15)'
                }}
                onBlur={e => {
                  e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">Username</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9F1239]/80 font-semibold text-sm">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="yourname"
                  pattern="[a-zA-Z0-9_]+"
                  className="w-full pl-8 pr-4 py-3 rounded-xl text-white placeholder-white/25 focus:outline-none transition-all text-sm"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    caretColor: '#F59E0B',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.border = '1px solid rgba(159,18,57,0.6)'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(159,18,57,0.15)'
                  }}
                  onBlur={e => {
                    e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>
            </div>

            {/* Email (disabled) */}
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                <input
                  type="email"
                  value={user?.email ?? ''}
                  disabled
                  className="w-full pl-11 pr-4 py-3 rounded-xl text-white/35 cursor-not-allowed text-sm"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                />
              </div>
              <p className="text-[10px] text-white/25 mt-1">Email cannot be changed</p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <motion.button
                type="submit"
                disabled={saving}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #9F1239, #C4934A)', boxShadow: '0 0 24px rgba(159,18,57,0.35)' }}
              >
                {saving ? (
                  <><Loader2 className="animate-spin w-4 h-4" /> Saving...</>
                ) : (
                  <><Save size={14} /> Save Changes</>
                )}
              </motion.button>
              <button
                type="button"
                onClick={handlePasswordReset}
                className="px-4 py-3 rounded-xl text-sm font-medium text-white/60 hover:text-white transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                Reset Pwd
              </button>
            </div>
          </form>
        </motion.div>

        {/* Upgrade CTA */}
        {profile?.plan === 'free' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-3xl relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(159,18,57,0.3), rgba(125,10,44,0.2))',
              border: '1px solid rgba(245,158,11,0.3)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 0 60px rgba(159,18,57,0.2)',
            }}
          >
            {/* Shimmer top */}
            <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.7), transparent)' }} />
            {/* BG orb */}
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-30"
              style={{ background: 'radial-gradient(circle, #D97706 0%, transparent 70%)' }} />

            <div className="relative flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="w-5 h-5 text-[#F59E0B]" />
                  <span className="font-bold text-white text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>Go Premium</span>
                </div>
                <p className="text-white/50 text-sm">
                  Unlimited chats, HD images, voice calls &amp; more
                </p>
              </div>
              <Link
                href="/pricing"
                className="flex-shrink-0 flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #D97706, #F59E0B)', color: '#0C0008', fontWeight: 700 }}
              >
                <Sparkles size={14} /> Upgrade
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
