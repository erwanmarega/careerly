'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { BarChart3, Bell, LayoutDashboard, LogOut, Menu, Settings, Briefcase, X, School, AlertTriangle, FileText } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { logout } from '@/lib/auth'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/applications', label: 'Candidatures', icon: Briefcase },
  { href: '/stats', label: 'Statistiques', icon: BarChart3 },
  { href: '/reminders', label: 'Rappels', icon: Bell },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/settings', label: 'Paramètres', icon: Settings },
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
        {user?.role === 'SCHOOL_ADMIN' && (
          <Link
            href="/admin/dashboard"
            onClick={onLinkClick}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-primary bg-primary/5 hover:bg-primary/10 mb-2"
          >
            <School className="w-4 h-4 flex-shrink-0" />
            Espace école
          </Link>
        )}
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

const GRACE_DAYS = 7

function getGraceInfo(schoolRemovedAt: string | null) {
  if (!schoolRemovedAt) return null
  const removedMs = new Date(schoolRemovedAt).getTime()
  const elapsed = Math.floor((Date.now() - removedMs) / (1000 * 60 * 60 * 24))
  const remaining = GRACE_DAYS - elapsed
  return { remaining, expired: remaining <= 0 }
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUser()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (user === null) return
    if (user.role === 'SCHOOL_ADMIN') {
      router.replace('/admin/dashboard')
      return
    }
    if (user.onboardingCompleted === false) {
      router.replace('/onboarding')
    }
  }, [user, router])

  const grace = user?.role === 'STUDENT' && !user.schoolId ? getGraceInfo(user.schoolRemovedAt) : null

  const initial = user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? '?'
  const displayName = user?.name ?? user?.email ?? '…'

  async function handleLogout() {
    await logout()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-secondary/30 flex relative">
      <div className="fixed -top-60 -left-60 w-[700px] h-[700px] rounded-full bg-violet-600/10 blur-[160px] pointer-events-none z-0 dark:block hidden" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-indigo-500/8 blur-[140px] pointer-events-none z-0 dark:block hidden" />

      <aside className="w-56 bg-card border-r border-border flex flex-col fixed inset-y-0 left-0 z-30 hidden md:flex">
        <div className="px-5 py-6 border-b border-border">
          <Link href="/dashboard" className="font-bold text-lg tracking-tight">
            Postulo
          </Link>
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
          <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="font-bold text-lg tracking-tight">
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
          <Link href="/dashboard" className="font-bold text-base tracking-tight">
            Postulo
          </Link>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>
        <main className="flex-1 px-6 py-8 max-w-5xl w-full mx-auto">
          {grace?.expired ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-red-600" />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-xl font-bold">Accès expiré</h1>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Votre période d&apos;accès de {GRACE_DAYS} jours après retrait de votre école est terminée. Rejoignez une nouvelle école pour retrouver l&apos;accès à Postulo.
                </p>
              </div>
              <Link
                href="/settings"
                className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                Rejoindre une école
              </Link>
            </div>
          ) : (
            <>
              {grace && (
                <div className="mb-6 flex items-start gap-3 px-4 py-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p className="text-sm leading-snug">
                    Vous avez été retiré de votre école. Votre accès expire dans{' '}
                    <strong>{grace.remaining} jour{grace.remaining > 1 ? 's' : ''}</strong>.
                    Pensez à exporter vos candidatures ou à rejoindre une nouvelle école.
                  </p>
                </div>
              )}
              {children}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
