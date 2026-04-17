'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { MessageCircle, Phone, Sparkles, Heart } from 'lucide-react'
import { PREMADE_CHARACTERS } from '@/types'

export default function MyDarlingsPage() {
  const chars = PREMADE_CHARACTERS.slice(0, 4)

  return (
    <div className="px-4 sm:px-6 py-8 pb-24 lg:pb-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-maroon-800 mb-1">My Darlings</h1>
        <p className="text-maroon-800/55">Your personal companions, always here for you.</p>
      </motion.div>

      {chars.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl mb-4 mx-auto flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8B1538, #C4934A)' }}><Heart size={28} className="text-white" /></div>
          <h3 className="text-xl font-bold text-maroon-800 mb-2">No darlings yet, jaan</h3>
          <p className="text-maroon-800/50 text-sm mb-6">Start chatting with premade darlings or create your own.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/explore" className="btn-ghost">Explore Darlings</Link>
            <Link href="/create" className="btn-primary"><Sparkles size={14} /> Create One</Link>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {chars.map((c, i) => (
            <motion.div key={c.name} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}>
              <div className="card p-5 flex items-center gap-4 hover:shadow-card-hover">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-md"
                    style={{ background: c.avatarGradient || 'linear-gradient(135deg, #8B1538, #C4934A)' }}>
                    {c.name.charAt(0)}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-bold text-maroon-800">{c.name}</h3>
                    {c.is_premium && <span className="badge-desi flex items-center gap-1"><Sparkles size={10} />Premium</span>}
                  </div>
                  <p className="text-xs text-maroon-800/50 truncate">{c.tagline}</p>
                  <p className="text-[11px] text-maroon-800/30 mt-1">Last seen: Today ✓</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link href={`/call/${c.id}`}
                    className="p-2.5 rounded-xl bg-gold-50 text-gold-600 hover:bg-gold-100 border border-gold-200 transition-all">
                    <Phone size={15} />
                  </Link>
                  <Link href={`/chat/${c.id}`}
                    className="p-2.5 rounded-xl bg-maroon-800 text-white hover:bg-maroon-700 shadow-maroon-glow transition-all">
                    <MessageCircle size={15} />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Add more */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <Link href="/explore">
              <div className="card p-5 flex items-center justify-center gap-3 border-dashed border-2 border-ivory-300 hover:border-maroon-200 cursor-pointer h-full min-h-[80px]">
                <Heart size={18} className="text-maroon-800/30" />
                <span className="text-sm font-medium text-maroon-800/40">Add a darling</span>
              </div>
            </Link>
          </motion.div>
        </div>
      )}
    </div>
  )
}
