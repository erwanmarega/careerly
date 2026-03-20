'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LayoutDashboard, LogOut, Menu, Settings, Users, X } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { logout } from '@/lib/auth'

const nav = [
  { href: '/admin/dashboard', label: "Vue d'ensemble", icon: LayoutDashboard },
  { href: '/admin/students', label: 'Étudiants', icon: Users },
  { href: '/admin/settings', label: 'Mon école', icon: Settings },
]

function SidebarContent({
  pathname,
  user,
  displayName,
  initial,
  onLinkClick,
  onLogout,
}: {
  pathname: string
  user: ReturnType<typeof useUser>['user']
  displayName: string
  initial: string
  onLinkClick?: () => void
  onLogout: () => void
}) {
  return (
    <>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={onLinkClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={displayName}
              className="w-7 h-7 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-primary">{initial}</span>
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground">Administrateur</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
      </div>
    </>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading } = useUser()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!loading && user && user.role !== 'SCHOOL_ADMIN') {
      router.replace('/dashboard')
    }
  }, [user, loading, router])

  const initial = user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? '?'
  const displayName = user?.name ?? user?.email ?? '…'

  async function handleLogout() {
    await logout()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-secondary/30 flex">
      <aside className="w-56 bg-card border-r border-border flex flex-col fixed inset-y-0 left-0 z-30 hidden md:flex">
        <div className="px-5 py-6 border-b border-border">
          <Link href="/admin/dashboard" className="font-bold text-lg tracking-tight">
            Postulo
          </Link>
          <p className="text-xs text-muted-foreground mt-0.5">Espace école</p>
        </div>
        <SidebarContent
          pathname={pathname}
          user={user}
          displayName={displayName}
          initial={initial}
          onLogout={handleLogout}
        />
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 flex flex-col transform transition-transform duration-300 ease-in-out md:hidden border-r border-border ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ backgroundColor: 'hsl(var(--card))' }}
      >
        <div className="px-5 py-5 border-b border-border flex items-center justify-between">
          <Link
            href="/admin/dashboard"
            onClick={() => setMobileOpen(false)}
            className="font-bold text-lg tracking-tight"
          >
            Postulo
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <SidebarContent
          pathname={pathname}
          user={user}
          displayName={displayName}
          initial={initial}
          onLinkClick={() => setMobileOpen(false)}
          onLogout={handleLogout}
        />
      </div>

      <div className="flex-1 md:ml-56 flex flex-col min-h-screen">
        <header className="bg-card border-b border-border px-4 py-3.5 flex items-center justify-between md:hidden sticky top-0 z-30">
          <Link href="/admin/dashboard" className="font-bold text-base tracking-tight">
            Postulo
          </Link>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>
        <main className="flex-1 px-6 py-8 max-w-5xl w-full mx-auto">{children}</main>
      </div>
    </div>
  )
}
