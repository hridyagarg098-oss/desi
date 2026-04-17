'use client'

import { Menu, Search, Bell } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

export default function TopBar() {
  const { setSidebarOpen } = useAppStore()

  return (
    <header className="h-14 flex items-center justify-between px-4 sm:px-6 border-b border-ivory-300/60 bg-ivory-100/80 backdrop-blur-md sticky top-0 z-20">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden p-2 rounded-xl text-maroon-800/60 hover:text-maroon-800 hover:bg-maroon-50 transition-colors"
      >
        <Menu size={20} />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-sm mx-4 hidden sm:flex items-center gap-2 bg-white/60 border border-ivory-300 rounded-2xl px-3 py-2">
        <Search size={14} className="text-maroon-800/30" />
        <input
          type="text"
          placeholder="Search darlings..."
          className="bg-transparent text-sm outline-none w-full text-maroon-800 placeholder:text-maroon-800/30"
        />
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-xl text-maroon-800/60 hover:text-maroon-800 hover:bg-maroon-50 transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-maroon-800 rounded-full" />
        </button>
        <div className="w-8 h-8 rounded-full bg-maroon-100 flex items-center justify-center text-sm font-semibold text-maroon-800">
          U
        </div>
      </div>
    </header>
  )
}
