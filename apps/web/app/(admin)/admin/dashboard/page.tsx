'use client'

import Link from 'next/link'
import { ArrowRight, Users, Trophy, Search, Briefcase } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSchool, useStudents } from '@/hooks/useSchool'
import { api } from '@/lib/api'

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-secondary rounded-lg ${className}`} />
}

type TimelineWeek = { label: string; count: number }

export default function AdminDashboardPage() {
  const { school, loading: schoolLoading } = useSchool()
  const { students, loading: studentsLoading } = useStudents()
  const [timeline, setTimeline] = useState<TimelineWeek[]>([])
  const [timelineLoading, setTimelineLoading] = useState(true)

  useEffect(() => {
    api.get<TimelineWeek[]>('/schools/me/timeline')
      .then(setTimeline)
      .catch(() => {})
      .finally(() => setTimelineLoading(false))
  }, [])

  const loading = schoolLoading || studentsLoading

  const totalStudents = students.length
  const withOffer = students.filter((s) => s.hasOffer).length
  const stillSearching = students.filter((s) => !s.hasOffer && s.applicationCount > 0).length
  const noActivity = students.filter((s) => s.applicationCount === 0).length
  const totalApplications = students.reduce((sum, s) => sum + s.applicationCount, 0)

  const kpis = [
    {
      label: 'Étudiants',
      value: totalStudents,
      sub: 'inscrits',
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      label: 'Alternance trouvée',
      value: withOffer,
      sub: `${totalStudents > 0 ? Math.round((withOffer / totalStudents) * 100) : 0}% des étudiants`,
      icon: Trophy,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    },
    {
      label: 'En recherche active',
      value: stillSearching,
      sub: 'avec candidatures',
      icon: Search,
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
    },
    {
      label: 'Candidatures totales',
      value: totalApplications,
      sub: 'tous étudiants confondus',
      icon: Briefcase,
      color: 'text-violet-500',
      bg: 'bg-violet-50 dark:bg-violet-950/30',
    },
  ]

  const recentStudents = [...students]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {schoolLoading ? '…' : school?.name ?? 'Mon école'}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Vue d&apos;ensemble de votre promotion</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-card rounded-2xl border border-border p-5">
            <div className={`w-9 h-9 rounded-xl ${kpi.bg} flex items-center justify-center mb-4`}>
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
            </div>
            {loading ? (
              <Skeleton className="h-7 w-14 mb-1" />
            ) : (
              <p className="text-2xl font-bold tracking-tight">{kpi.value}</p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
            <p className="text-xs text-muted-foreground/60 mt-2">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {noActivity > 0 && !loading && (
        <div className="flex items-start gap-3 px-5 py-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
          <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>{noActivity} étudiant{noActivity > 1 ? 's' : ''}</strong> n&apos;ont pas encore ajouté de candidature.
            <Link href="/admin/students" className="ml-1 underline underline-offset-4 font-medium">
              Voir qui
            </Link>
          </p>
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="mb-5">
          <h2 className="font-semibold text-sm">Activité de la promo</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Candidatures envoyées par semaine (8 dernières semaines)</p>
        </div>
        {timelineLoading ? (
          <div className="flex items-end gap-2 h-28">
            {[60, 40, 75, 30, 88, 50, 65, 45].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className={`w-full rounded-md animate-pulse bg-secondary`} style={{ height: `${h}px` }} />
                <Skeleton className="h-2.5 w-8" />
              </div>
            ))}
          </div>
        ) : (
          (() => {
            const max = Math.max(...timeline.map((w) => w.count), 1)
            return (
              <div className="flex items-end gap-2 h-28">
                {timeline.map((week, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                    <span className="text-xs font-semibold text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      {week.count}
                    </span>
                    <div
                      className="w-full rounded-md bg-primary/20 group-hover:bg-primary/40 transition-colors"
                      style={{ height: `${Math.max((week.count / max) * 88, week.count > 0 ? 6 : 3)}px` }}
                    />
                    <span className="text-[10px] text-muted-foreground/60 truncate w-full text-center">{week.label}</span>
                  </div>
                ))}
              </div>
            )
          })()
        )}
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-sm">Étudiants récents</h2>
            {!loading && <p className="text-xs text-muted-foreground mt-0.5">{totalStudents} au total</p>}
          </div>
          <Link
            href="/admin/students"
            className="text-xs text-primary font-medium hover:underline underline-offset-4 flex items-center gap-1"
          >
            Voir tous <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4">
                <Skeleton className="w-9 h-9 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : recentStudents.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">Aucun étudiant inscrit pour l&apos;instant.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Partagez le code d&apos;invitation depuis les paramètres.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentStudents.map((student) => {
              const initial = student.name?.[0]?.toUpperCase() ?? student.email[0].toUpperCase()
              return (
                <Link
                  key={student.id}
                  href={`/admin/students/${student.id}`}
                  className="px-6 py-4 flex items-center gap-4 hover:bg-secondary/30 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {student.avatar ? (
                      <img src={student.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-primary">{initial}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{student.name ?? student.email}</p>
                    <p className="text-xs text-muted-foreground">{student.applicationCount} candidature{student.applicationCount !== 1 ? 's' : ''}</p>
                  </div>
                  {student.hasOffer ? (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 flex-shrink-0">
                      Alternance trouvée
                    </span>
                  ) : student.applicationCount === 0 ? (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-secondary text-muted-foreground flex-shrink-0">
                      Pas encore démarré
                    </span>
                  ) : (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 flex-shrink-0">
                      En recherche
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
