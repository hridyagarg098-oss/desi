'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, Heart, Sparkles, User2, LogIn } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'

const BASE_TABS = [
  { href: '/explore',     icon: Compass,   label: 'Explore'  },
  { href: '/create',      icon: Sparkles,  label: 'Create'   },
  { href: '/my-darlings', icon: Heart,     label: 'Darlings' },
]

export function MobileNav() {
  const pathname = usePathname()
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setLoggedIn(!!session?.user)
    })
    return () => subscription.unsubscribe()
  }, [])

  const authTab = loggedIn
    ? { href: '/profile', icon: User2,  label: 'Profile' }
    : { href: '/login',   icon: LogIn,  label: 'Sign In' }

  const TABS = [...BASE_TABS, authTab]

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden safe-area-bottom"
      style={{
        background: 'linear-gradient(180deg, rgba(12,0,8,0.85) 0%, rgba(8,4,7,0.97) 100%)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
    >
      <div className="flex items-center justify-around py-2 px-1">
        {TABS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href.length > 1 && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 py-1 px-3 min-w-[56px] relative"
            >
              {/* Active glow blob */}
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-glow"
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(139,21,56,0.25), rgba(196,147,74,0.12))',
                    boxShadow: '0 0 12px rgba(196,147,74,0.15)',
                  }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              {/* Icon */}
              <div className="relative z-10 p-1.5">
                <motion.div
                  animate={{ scale: isActive ? 1.15 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <Icon
                    size={21}
                    strokeWidth={isActive ? 2.2 : 1.7}
                    style={{
                      color: isActive ? '#E8B060' : 'rgba(255,255,255,0.35)',
                      filter: isActive ? 'drop-shadow(0 0 6px rgba(232,176,96,0.6))' : 'none',
                      transition: 'all 0.25s ease',
                    }}
                  />
                </motion.div>
              </div>

              {/* Label */}
              <span
                className="text-[10px] font-medium relative z-10 transition-all"
                style={{
                  color: isActive ? '#C4934A' : 'rgba(255,255,255,0.30)',
                  fontFamily: '"DM Sans", sans-serif',
                  letterSpacing: isActive ? '0.02em' : '0.01em',
                }}
              >
                {label}
              </span>

              {/* Active dot */}
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-dot"
                  className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ background: '#C4934A' }}
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default MobileNav
