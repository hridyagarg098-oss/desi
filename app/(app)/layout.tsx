import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import MobileNav from '@/components/layout/MobileNav'
import type { User } from '@supabase/supabase-js'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Don't redirect here — middleware handles protected routes.
  // This layout wraps both public (explore, chat) and auth-gated routes.

  return (
    <div className="flex" style={{ height: '100dvh', background: 'linear-gradient(160deg, #0C0008 0%, #1A000F 50%, #0C0008 100%)' }}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-shrink-0">
        <Sidebar user={user as User | null} />
      </aside>

      {/* Main Content — overflow-y-auto allows pages to scroll; no overflow-hidden so keyboard doesn't clip */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
        {children}
      </main>

      {/* Mobile Bottom Nav — hidden on /chat and /call routes */}
      <MobileNav />
    </div>
  )
}
