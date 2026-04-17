'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, User, Loader2, Sparkles, CheckCircle2, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ── Floating particles ──────────────────────────────────────────────────────
function ParticleField() {
  const particles = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 8 + 6,
    delay: Math.random() * 4,
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.id % 3 === 0
              ? 'rgba(245,158,11,0.6)'
              : p.id % 3 === 1
              ? 'rgba(159,18,57,0.5)'
              : 'rgba(255,255,255,0.25)',
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// ── Password strength bar ───────────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]
  const strength = checks.filter(Boolean).length

  const colors = ['', '#EF4444', '#F59E0B', '#22D3EE', '#10B981']
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']

  if (!password) return null

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="mt-2 space-y-1.5"
    >
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{
              background: i <= strength ? colors[strength] : 'rgba(255,255,255,0.1)',
            }}
          />
        ))}
      </div>
      <p className="text-xs" style={{ color: colors[strength] }}>
        {labels[strength]}
      </p>
    </motion.div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────
export default function SignupPage() {
  const [step, setStep] = useState<'form' | 'verify'>('form')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setStep('verify')
    setLoading(false)
  }

  async function handleGoogleSignup() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  // ── Verify step ───────────────────────────────────────────────────────────
  if (step === 'verify') {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0C0008 0%, #1A000F 50%, #0C0008 100%)' }}
      >
        {/* Ambient orbs */}
        <div className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #9F1239, transparent)' }} />
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, #F59E0B, transparent)' }} />
        <ParticleField />

        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          className="w-full max-w-md text-center relative z-10"
          style={{
            background: 'rgba(26,0,15,0.7)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: '24px',
            padding: '48px 40px',
            boxShadow: '0 0 60px rgba(159,18,57,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          {/* Glow ring */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="absolute inset-0 rounded-full"
              style={{ background: 'rgba(16,185,129,0.3)', filter: 'blur(12px)' }}
            />
            <div className="relative w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.3), rgba(16,185,129,0.1))', border: '1px solid rgba(16,185,129,0.4)' }}>
              <CheckCircle2 className="w-9 h-9 text-emerald-400" />
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: '#F5ECD5' }}>
            Check your inbox! 💌
          </h2>
          <p className="text-sm mb-2" style={{ color: 'rgba(245,236,213,0.6)' }}>
            We sent a confirmation link to
          </p>
          <p className="text-sm font-semibold mb-6" style={{ color: '#F59E0B' }}>{email}</p>
          <p className="text-sm mb-8" style={{ color: 'rgba(245,236,213,0.5)' }}>
            Click the link to activate your account and meet your darlings 🌹
          </p>

          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full py-3 rounded-xl font-semibold text-sm transition-all relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #9F1239, #7D0A2C)',
              color: '#F5ECD5',
              boxShadow: '0 0 24px rgba(159,18,57,0.5)',
            }}
          >
            Back to Sign In
          </Link>
        </motion.div>
      </div>
    )
  }

  // ── Signup form ───────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0C0008 0%, #1A000F 50%, #0C0008 100%)' }}
    >
      {/* Cinematic ambient orbs */}
      <motion.div
        animate={{ scale: [1, 1.1, 1], x: [0, 20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #9F1239, transparent)' }}
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], x: [0, -20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #F59E0B, transparent)' }}
      />

      <ParticleField />

      {/* Top decorative bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: 'linear-gradient(90deg, transparent, #9F1239, #F59E0B, #9F1239, transparent)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0 rounded-full blur-md"
                style={{ background: '#9F1239' }}
              />
              <div className="relative w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #9F1239, #7D0A2C)', border: '1px solid rgba(245,158,11,0.4)' }}>
                <Sparkles className="w-6 h-6 text-amber-400" />
              </div>
            </div>
            <span className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif", color: '#F5ECD5' }}>
              DesiDarling<span style={{ color: '#F59E0B' }}>.ai</span>
            </span>
          </Link>
          <p className="mt-2 text-sm" style={{ color: 'rgba(245,236,213,0.5)' }}>
            Tumhara intezaar tha... 🌹
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: 'rgba(26,0,15,0.7)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(245,158,11,0.15)',
            borderRadius: '20px',
            padding: '40px',
            boxShadow: '0 0 60px rgba(159,18,57,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: '#F5ECD5' }}>
              Join DesiDarling ✨
            </h1>
            <p className="text-sm" style={{ color: 'rgba(245,236,213,0.5)' }}>
              Create your account to meet your AI companion
            </p>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 rounded-lg text-sm flex items-center gap-2"
                style={{
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#FCA5A5',
                }}
              >
                <Shield className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSignup} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
                style={{ color: 'rgba(245,236,213,0.5)' }}>Your name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: focusedField === 'name' ? '#F59E0B' : 'rgba(245,236,213,0.3)' }} />
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  required
                  placeholder="Raj, Priya, or anyone..."
                  style={{
                    width: '100%',
                    paddingLeft: '40px',
                    paddingRight: '16px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    background: focusedField === 'name' ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${focusedField === 'name' ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '12px',
                    color: '#F5ECD5',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxShadow: focusedField === 'name' ? '0 0 20px rgba(245,158,11,0.1)' : 'none',
                  }}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
                style={{ color: 'rgba(245,236,213,0.5)' }}>Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: focusedField === 'email' ? '#F59E0B' : 'rgba(245,236,213,0.3)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  required
                  placeholder="your@email.com"
                  style={{
                    width: '100%',
                    paddingLeft: '40px',
                    paddingRight: '16px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    background: focusedField === 'email' ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${focusedField === 'email' ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '12px',
                    color: '#F5ECD5',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxShadow: focusedField === 'email' ? '0 0 20px rgba(245,158,11,0.1)' : 'none',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
                style={{ color: 'rgba(245,236,213,0.5)' }}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: focusedField === 'password' ? '#F59E0B' : 'rgba(245,236,213,0.3)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  required
                  minLength={8}
                  placeholder="Min 8 characters"
                  style={{
                    width: '100%',
                    paddingLeft: '40px',
                    paddingRight: '48px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    background: focusedField === 'password' ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${focusedField === 'password' ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '12px',
                    color: '#F5ECD5',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxShadow: focusedField === 'password' ? '0 0 20px rgba(245,158,11,0.1)' : 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'rgba(245,236,213,0.4)' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 relative overflow-hidden mt-2"
              style={{
                background: loading
                  ? 'rgba(159,18,57,0.4)'
                  : 'linear-gradient(135deg, #9F1239, #D97706)',
                color: '#F5ECD5',
                boxShadow: loading ? 'none' : '0 0 30px rgba(159,18,57,0.5)',
                cursor: loading ? 'not-allowed' : 'pointer',
                border: 'none',
              }}
            >
              {/* Shimmer */}
              {!loading && (
                <motion.div
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 opacity-20"
                  style={{ background: 'linear-gradient(90deg, transparent, white, transparent)', width: '60%' }}
                />
              )}
              {loading ? (
                <><Loader2 className="animate-spin w-4 h-4" /> Creating account...</>
              ) : (
                <>Create Account 🌹</>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: 'rgba(245,158,11,0.15)' }} />
            <span className="text-xs" style={{ color: 'rgba(245,236,213,0.35)' }}>ya fir</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(245,158,11,0.15)' }} />
          </div>

          {/* Google */}
          <motion.button
            onClick={handleGoogleSignup}
            disabled={loading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-3 transition-all"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#F5ECD5',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </motion.button>

          <p className="mt-4 text-center text-xs" style={{ color: 'rgba(245,236,213,0.35)' }}>
            By signing up you agree to our{' '}
            <Link href="/terms" className="transition-colors hover:text-amber-400" style={{ color: 'rgba(245,158,11,0.7)' }}>Terms</Link>
            {' '}and{' '}
            <Link href="/privacy" className="transition-colors hover:text-amber-400" style={{ color: 'rgba(245,158,11,0.7)' }}>Privacy Policy</Link>
          </p>

          <p className="mt-3 text-center text-sm" style={{ color: 'rgba(245,236,213,0.4)' }}>
            Already have an account?{' '}
            <Link href="/login" className="font-semibold transition-colors hover:text-amber-300" style={{ color: '#F59E0B' }}>
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
