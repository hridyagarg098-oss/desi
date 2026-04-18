'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, Loader2, Heart, Sparkles, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getDeviceId } from '@/lib/device/getDeviceId'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextUrl = searchParams.get('next') || '/explore'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace(nextUrl)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Step 1 — Authenticate with Supabase
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Step 2 — Device limit check (runs after session is set)
    try {
      const deviceId = getDeviceId()
      const res = await fetch('/api/auth/device-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      })
      const data = await res.json()

      if (!data.allowed) {
        // Device is at capacity — sign back out and show the error
        await supabase.auth.signOut()
        setError(data.error || 'This device has reached its account limit.')
        setLoading(false)
        return
      }
    } catch {
      // Device check failed silently — still allow login (fail open)
      console.warn('[Login] Device check request failed — continuing')
    }

    router.push(nextUrl)
    router.refresh()
  }

  async function handleGoogleLogin() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${nextUrl}` },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'white',
  }

  function onFocus(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.border = '1px solid rgba(159,18,57,0.7)'
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(159,18,57,0.15), 0 0 20px rgba(159,18,57,0.1)'
  }
  function onBlur(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'
    e.currentTarget.style.boxShadow = 'none'
  }

  return (
    <div className="relative p-8 rounded-3xl"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(24px)',
        boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
      }}>
      {/* Top shimmer line */}
      <div className="absolute inset-x-0 top-0 h-px rounded-t-3xl"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.5), transparent)' }} />

      <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
        Welcome back 💛
      </h1>
      <p className="text-white/40 text-sm mb-7">Sign in to continue your conversations</p>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="mb-5 p-3 rounded-xl text-sm flex items-center gap-2"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171' }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleLogin} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-white/55 mb-1.5">Email address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9F1239]/60" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              className="w-full pl-11 pr-4 py-3 rounded-xl placeholder-white/25 focus:outline-none transition-all text-sm"
              style={inputStyle}
              onFocus={onFocus}
              onBlur={onBlur}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-white/55 mb-1.5">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9F1239]/60" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full pl-11 pr-12 py-3 rounded-xl placeholder-white/25 focus:outline-none transition-all text-sm"
              style={inputStyle}
              onFocus={onFocus}
              onBlur={onBlur}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Forgot password */}
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm text-[#9F1239] hover:text-[#D97706] transition-colors">
            Forgot password?
          </Link>
        </div>

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={loading}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #9F1239, #C4934A)', boxShadow: '0 0 30px rgba(159,18,57,0.45)' }}
        >
          <motion.div
            className="absolute inset-0"
            animate={{ x: loading ? 0 : ['-100%', '200%'] }}
            transition={{ repeat: loading ? 0 : Infinity, duration: 2.5, ease: 'linear' }}
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)' }}
          />
          {loading ? (
            <><Loader2 className="animate-spin w-4 h-4" /> Signing in...</>
          ) : (
            <>Sign In <ArrowRight size={15} /></>
          )}
        </motion.button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
        <span className="text-xs text-white/30">or</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
      </div>

      {/* Google SSO */}
      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full py-3 rounded-xl font-medium text-sm text-white/70 hover:text-white disabled:opacity-50 transition-all flex items-center justify-center gap-3 hover:bg-white/5"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      {/* Sign up link */}
      <p className="mt-6 text-center text-sm text-white/35">
        New here?{' '}
        <Link href="/signup" className="text-[#9F1239] font-semibold hover:text-[#D97706] transition-colors">
          Create account
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0C0008 0%, #1A000F 50%, #0C0008 100%)' }}>
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, #9F1239 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #D97706 0%, transparent 70%)' }} />

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full pointer-events-none"
          style={{ background: i % 2 === 0 ? '#9F1239' : '#D97706', left: `${15 + i * 15}%`, top: `${20 + (i % 3) * 25}%` }}
          animate={{ y: [0, -30, 0], opacity: [0.3, 0.7, 0.3] }}
          transition={{ repeat: Infinity, duration: 3 + i * 0.5, delay: i * 0.4 }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-full flex items-center justify-center relative"
              style={{ background: 'linear-gradient(135deg, #9F1239, #7D0A2C)', boxShadow: '0 0 30px rgba(159,18,57,0.5)' }}>
              <Heart className="w-5 h-5 text-[#F59E0B] fill-current" />
            </div>
            <span className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              <span style={{ background: 'linear-gradient(135deg, #FFF1E6, #F9A8D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Velvet
              </span>
            </span>
          </Link>
          <p className="mt-2 text-white/35 text-sm flex items-center justify-center gap-1.5">
            <Sparkles size={12} className="text-[#F59E0B]/60" />
            Your world, your companion
          </p>
        </div>

        <Suspense fallback={
          <div className="p-8 rounded-3xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Loader2 className="animate-spin w-6 h-6 text-[#9F1239]" />
          </div>
        }>
          <LoginForm />
        </Suspense>
      </motion.div>
    </div>
  )
}
