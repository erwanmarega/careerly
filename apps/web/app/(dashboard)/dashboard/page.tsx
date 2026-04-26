'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Bell,
  Plus,
  Send,
  CalendarCheck,
  Trophy,
  TrendingUp,
  RefreshCw,
  Target,
  Pencil,
  Check,
} from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { useStats } from '@/hooks/useStats'
import { useApplications } from '@/hooks/useApplications'
import {
  fetchApplications,
  STATUS_LABELS,
  STATUS_STYLES,
  type Application,
} from '@/lib/applications'
import { api } from '@/lib/api'

interface Reminder {
  id: string
  scheduledAt: string
  sent: boolean
  message: string | null
  application: { company: string; position: string }
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-secondary rounded-lg ${className}`} />
}

function getWeekStart() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1))
  return d
}

export default function DashboardPage() {
  const { user } = useUser()
  const { stats, loading: statsLoading } = useStats()
  const { applications, total, loading: appsLoading } = useApplications(5)

  const [followUp, setFollowUp] = useState<Application[]>([])
  const [followUpTotal, setFollowUpTotal] = useState(0)
  const [followUpLoading, setFollowUpLoading] = useState(true)

  const [reminders, setReminders] = useState<Reminder[]>([])
  const [remindersLoading, setRemindersLoading] = useState(true)

  const [thisWeek, setThisWeek] = useState(0)

  const [weeklyGoal, setWeeklyGoal] = useState<number | null>(null)
  const [editingGoal, setEditingGoal] = useState(false)
  const [goalInput, setGoalInput] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('postulo_weekly_goal')
    if (stored) setWeeklyGoal(Number(stored))
  }, [])

  function saveGoal() {
    const val = parseInt(goalInput)
    if (!isNaN(val) && val > 0) {
      setWeeklyGoal(val)
      localStorage.setItem('postulo_weekly_goal', String(val))
    }
    setEditingGoal(false)
  }

  const firstName = user?.name?.split(' ')[0] ?? ''

  useEffect(() => {
    fetchApplications({ status: 'FOLLOW_UP', limit: 4 })
      .then((res) => {
        setFollowUp(res.data)
        setFollowUpTotal(res.total)
      })
      .catch(() => {})
      .finally(() => setFollowUpLoading(false))
  }, [])

  useEffect(() => {
    api
      .get<Reminder[]>('/reminders')
      .then(setReminders)
      .catch(() => {})
      .finally(() => setRemindersLoading(false))
  }, [])

  useEffect(() => {
    if (!appsLoading && applications.length > 0) {
      const weekStart = getWeekStart()
      fetchApplications({ limit: 100 })
        .then((res) => {
          const count = res.data.filter((a) => new Date(a.appliedAt) >= weekStart).length
          setThisWeek(count)
        })
        .catch(() => {})
    } else if (!appsLoading) {
      setThisWeek(0)
    }
  }, [appsLoading, applications.length])

  const kpis = [
    {
      label: 'Total',
      value: stats?.total ?? 0,
      sub: `${stats?.activeApplications ?? 0} actives`,
      icon: Send,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      label: 'Taux de réponse',
      value: `${stats?.responseRate ?? 0}%`,
      sub: 'des candidatures',
      icon: TrendingUp,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    },
    {
      label: 'Entretiens',
      value: `${stats?.interviewRate ?? 0}%`,
      sub: 'des candidatures',
      icon: CalendarCheck,
      color: 'text-violet-500',
      bg: 'bg-violet-50 dark:bg-violet-950/30',
    },
    {
      label: 'Offres',
      value: `${stats?.offerRate ?? 0}%`,
      sub: "taux d'offre",
      icon: Trophy,
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
    },
  ]

  const upcomingReminders = reminders
    .filter((r) => !r.sent)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 3)

  const isOverdue = (scheduledAt: string) => new Date(scheduledAt) < new Date()

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {firstName ? `Bonjour, ${firstName} !` : 'Bonjour !'}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-muted-foreground text-sm">Voici où en est votre recherche.</p>
            {!appsLoading && thisWeek > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                +{thisWeek} cette semaine
              </span>
            )}
          </div>
        </div>
        <Link
          href="/applications/new"
          className="inline-flex items-center gap-2 bg-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((s) => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-5">
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-4`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            {statsLoading ? (
              <Skeleton className="h-7 w-14 mb-1" />
            ) : (
              <p className="text-2xl font-bold tracking-tight">{s.value}</p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            <p className="text-xs text-muted-foreground/60 mt-2">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-sm">Candidatures récentes</h2>
              {!appsLoading && (
                <p className="text-xs text-muted-foreground mt-0.5">{total} au total</p>
              )}
            </div>
            <Link
              href="/applications"
              className="text-xs text-primary font-medium hover:underline underline-offset-4 flex items-center gap-1"
            >
              Tout voir <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {appsLoading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-4">
                  <Skeleton className="w-9 h-9 rounded-xl" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          ) : applications.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm text-muted-foreground">
                Aucune candidature pour l&apos;instant.
              </p>
              <Link
                href="/applications/new"
                className="inline-flex items-center gap-1.5 mt-3 text-sm text-primary font-medium hover:underline underline-offset-4"
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter la première
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {applications.map((app) => (
                <Link
                  key={app.id}
                  href={`/applications/${app.id}`}
                  className="px-6 py-4 flex items-center gap-4 hover:bg-secondary/30 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-muted-foreground">
                      {app.company[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{app.company}</p>
                    <p className="text-xs text-muted-foreground truncate">{app.position}</p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${
                      STATUS_STYLES[app.status] ?? 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {STATUS_LABELS[app.status] ?? app.status}
                  </span>
                  <span className="text-xs text-muted-foreground/50 flex-shrink-0 hidden sm:block w-20 text-right">
                    {new Date(app.appliedAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-primary" />
                <h2 className="font-semibold text-sm">Objectif hebdo</h2>
              </div>
              {weeklyGoal !== null && !editingGoal && (
                <button
                  onClick={() => {
                    setGoalInput(String(weeklyGoal))
                    setEditingGoal(true)
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {editingGoal ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveGoal()}
                  autoFocus
                  className="w-full border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Ex : 5"
                />
                <button
                  onClick={saveGoal}
                  className="p-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors flex-shrink-0"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : weeklyGoal === null ? (
              <button
                onClick={() => {
                  setGoalInput('')
                  setEditingGoal(true)
                }}
                className="w-full text-sm text-primary font-medium hover:underline underline-offset-4 text-left"
              >
                + Fixer un objectif
              </button>
            ) : (
              <>
                <div className="flex items-end justify-between mb-2">
                  <span className="text-2xl font-bold">{thisWeek}</span>
                  <span className="text-sm text-muted-foreground">
                    / {weeklyGoal} cette semaine
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      thisWeek >= weeklyGoal ? 'bg-emerald-500' : 'bg-primary'
                    }`}
                    style={{ width: `${Math.min((thisWeek / weeklyGoal) * 100, 100)}%` }}
                  />
                </div>
                {thisWeek >= weeklyGoal && (
                  <p className="text-xs text-emerald-600 font-medium mt-2">Objectif atteint 🎉</p>
                )}
              </>
            )}
          </div>

          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
                <h2 className="font-semibold text-sm">À relancer</h2>
                {!followUpLoading && followUpTotal > 0 && (
                  <span className="text-xs font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md">
                    {followUpTotal}
                  </span>
                )}
              </div>
              {followUpTotal > 0 && (
                <Link
                  href="/applications?status=FOLLOW_UP"
                  className="text-xs text-primary font-medium hover:underline underline-offset-4 flex items-center gap-1"
                >
                  Voir tout <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>

            {followUpLoading ? (
              <div className="px-5 py-3 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-7 h-7 rounded-lg" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-2.5 w-28" />
                    </div>
                  </div>
                ))}
              </div>
            ) : followUp.length === 0 ? (
              <div className="px-5 py-6 text-center">
                <p className="text-xs text-muted-foreground">Aucune candidature à relancer.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {followUp.map((app) => (
                  <Link
                    key={app.id}
                    href={`/applications/${app.id}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-secondary/30 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-blue-600">
                        {app.company[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{app.company}</p>
                      <p className="text-xs text-muted-foreground truncate">{app.position}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-amber-500" />
                <h2 className="font-semibold text-sm">Rappels</h2>
              </div>
              <Link
                href="/reminders"
                className="text-xs text-primary font-medium hover:underline underline-offset-4 flex items-center gap-1"
              >
                Gérer <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {remindersLoading ? (
              <div className="px-5 py-3 space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-2.5 w-20" />
                  </div>
                ))}
              </div>
            ) : upcomingReminders.length === 0 ? (
              <div className="px-5 py-6 text-center">
                <p className="text-xs text-muted-foreground">Aucun rappel à venir.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {upcomingReminders.map((r) => {
                  const overdue = isOverdue(r.scheduledAt)
                  return (
                    <div key={r.id} className="flex items-start gap-3 px-5 py-3">
                      <div
                        className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                          overdue ? 'bg-red-400' : 'bg-amber-400'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {r.message ?? r.application.company}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {r.application.company} · {r.application.position}
                        </p>
                        <p
                          className={`text-xs mt-0.5 ${overdue ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}
                        >
                          {overdue ? 'En retard · ' : ''}
                          {new Date(r.scheduledAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
