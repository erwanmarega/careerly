'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, TrendingUp, CalendarCheck, Trophy, BarChart2, PieChart as PieChartIcon, Clock, Activity } from 'lucide-react'
import { api } from '@/lib/api'
import { STATUS_LABELS } from '@/lib/applications'

interface StatsOverview {
  total: number
  responseRate: number
  interviewRate: number
  offerRate: number
  activeApplications: number
  avgResponseDays: number | null
  thisWeekCount: number
  lastWeekCount: number
}

interface StatusStat {
  status: string
  count: number
  percentage: number
}

interface TimelineEntry {
  date: string
  count: number
}

const STATUS_BAR_COLORS: Record<string, string> = {
  SENT: 'bg-slate-400',
  FOLLOW_UP: 'bg-blue-400',
  INTERVIEW: 'bg-emerald-400',
  OFFER: 'bg-violet-500',
  REJECTED: 'bg-red-400',
  ARCHIVED: 'bg-slate-300',
}

const STATUS_PIE_COLORS: Record<string, string> = {
  SENT: '#94a3b8',
  FOLLOW_UP: '#60a5fa',
  INTERVIEW: '#34d399',
  OFFER: '#8b5cf6',
  REJECTED: '#f87171',
  ARCHIVED: '#cbd5e1',
}

const PERIODS = [
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '90d', label: '3 mois' },
  { value: 'all', label: 'Tout' },
]

function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`animate-pulse bg-secondary rounded-lg ${className}`} style={style} />
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  bg,
}: {
  label: string
  value: string | number
  sub: string
  icon: React.ElementType
  color: string
  bg: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5">
      <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-4`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      <p className="text-xs text-muted-foreground/60 mt-2">{sub}</p>
    </div>
  )
}

function PieChart({ data }: { data: StatusStat[] }) {
  const [hovered, setHovered] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const animKey = useRef(0)

  useEffect(() => {
    setReady(false)
    animKey.current += 1
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [data])

  if (data.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Aucune donnée à afficher</p>
      </div>
    )
  }

  const total = data.reduce((s, d) => s + d.count, 0)
  const cx = 80
  const cy = 80
  const r = 68

  let currentAngle = -Math.PI / 2

  const slices = data.map((d) => {
    const angle = (d.count / total) * 2 * Math.PI
    const startAngle = currentAngle
    const endAngle = currentAngle + angle
    currentAngle = endAngle

    const x1 = cx + r * Math.cos(startAngle)
    const y1 = cy + r * Math.sin(startAngle)
    const x2 = cx + r * Math.cos(endAngle)
    const y2 = cy + r * Math.sin(endAngle)
    const largeArc = angle > Math.PI ? 1 : 0

    const path = `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`

    return { ...d, path }
  })

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <style>{`
        @keyframes pie-slice-in {
          from { transform: scale(0); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        @keyframes pie-legend-in {
          from { opacity: 0; transform: translateX(-6px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <svg width="160" height="160" viewBox="0 0 160 160" className="flex-shrink-0">
        {slices.map((slice, i) => (
          <g
            key={`${slice.status}-${animKey.current}`}
            style={{
              transformOrigin: `${cx}px ${cy}px`,
              ...(ready
                ? { animation: `pie-slice-in 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 75}ms both` }
                : { transform: 'scale(0)', opacity: 0 }),
            }}
          >
            <path
              d={slice.path}
              fill={STATUS_PIE_COLORS[slice.status] ?? '#6366f1'}
              stroke="white"
              strokeWidth="2"
              opacity={hovered === null || hovered === slice.status ? 1 : 0.4}
              onMouseEnter={() => setHovered(slice.status)}
              onMouseLeave={() => setHovered(null)}
              className="cursor-default transition-opacity duration-200"
            />
          </g>
        ))}
      </svg>

      <div className="space-y-2.5 flex-1 min-w-0">
        {[...slices].sort((a, b) => b.count - a.count).map((slice, i) => (
          <div
            key={`${slice.status}-legend-${animKey.current}`}
            className="flex items-center gap-2"
            onMouseEnter={() => setHovered(slice.status)}
            onMouseLeave={() => setHovered(null)}
            style={
              ready
                ? { animation: `pie-legend-in 0.35s ease-out ${i * 60 + 150}ms both` }
                : { opacity: 0 }
            }
          >
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform duration-150"
              style={{
                backgroundColor: STATUS_PIE_COLORS[slice.status] ?? '#6366f1',
                transform: hovered === slice.status ? 'scale(1.5)' : 'scale(1)',
              }}
            />
            <span className={`text-xs truncate transition-all duration-150 ${hovered === slice.status ? 'font-medium' : ''}`}>
              {STATUS_LABELS[slice.status] ?? slice.status}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums ml-auto flex-shrink-0">
              {slice.count} · {slice.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TimelineChart({ data }: { data: TimelineEntry[] }) {
  if (data.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Aucune donnée à afficher</p>
      </div>
    )
  }

  const max = Math.max(...data.map((d) => d.count))

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-1.5 h-28">
        {data.map((entry) => (
          <div key={entry.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
            <div
              className="w-full bg-primary/80 rounded-t-md transition-all duration-500 hover:bg-primary cursor-default min-h-[3px]"
              style={{ height: `${max > 0 ? (entry.count / max) * 100 : 0}%` }}
            />
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-foreground text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              {entry.count}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground/60 px-0.5">
        <span>
          {new Date(data[0].date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
        </span>
        {data.length > 4 && (
          <span>
            {new Date(data[Math.floor(data.length / 2)].date).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
            })}
          </span>
        )}
        <span>
          {new Date(data[data.length - 1].date).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
          })}
        </span>
      </div>
    </div>
  )
}

export default function StatsPage() {
  const [overview, setOverview] = useState<StatsOverview | null>(null)
  const [byStatus, setByStatus] = useState<StatusStat[]>([])
  const [timeline, setTimeline] = useState<TimelineEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [statusView, setStatusView] = useState<'bar' | 'pie'>('bar')
  const [period, setPeriod] = useState('all')

  useEffect(() => {
    setLoading(true)
    const q = period !== 'all' ? `?period=${period}` : ''
    Promise.all([
      api.get<StatsOverview>(`/stats/overview${q}`),
      api.get<StatusStat[]>(`/stats/by-status${q}`),
      api.get<{ data: TimelineEntry[] }>(`/stats/timeline${q}`),
    ])
      .then(([ov, st, tl]) => {
        setOverview(ov)
        setByStatus(st)
        setTimeline(tl.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [period])

  const weekDiff = (overview?.thisWeekCount ?? 0) - (overview?.lastWeekCount ?? 0)
  const weekSubLabel = overview
    ? (weekDiff > 0 ? `+${weekDiff}` : `${weekDiff}`) + ' vs semaine dernière'
    : '—'
  const weekColor = weekDiff > 0 ? 'text-emerald-500' : weekDiff < 0 ? 'text-red-500' : 'text-slate-500'
  const weekBg = weekDiff > 0 ? 'bg-emerald-50' : weekDiff < 0 ? 'bg-red-50' : 'bg-slate-50'

  const kpis = [
    {
      label: 'Candidatures',
      value: overview?.total ?? 0,
      sub: `${overview?.activeApplications ?? 0} actives`,
      icon: Send,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
    {
      label: 'Taux de réponse',
      value: `${overview?.responseRate ?? 0}%`,
      sub: 'des candidatures',
      icon: TrendingUp,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
    },
    {
      label: "Taux d'entretien",
      value: `${overview?.interviewRate ?? 0}%`,
      sub: 'des candidatures',
      icon: CalendarCheck,
      color: 'text-violet-500',
      bg: 'bg-violet-50',
    },
    {
      label: "Taux d'offre",
      value: `${overview?.offerRate ?? 0}%`,
      sub: 'des candidatures',
      icon: Trophy,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
    },
    {
      label: 'Délai moyen de réponse',
      value: overview?.avgResponseDays != null ? `${overview.avgResponseDays}j` : '—',
      sub: 'entre envoi et réponse',
      icon: Clock,
      color: 'text-slate-500',
      bg: 'bg-slate-50',
    },
    {
      label: 'Cette semaine',
      value: overview?.thisWeekCount ?? 0,
      sub: overview ? weekSubLabel : '—',
      icon: Activity,
      color: weekColor,
      bg: weekBg,
    },
  ]

  const funnelSteps = overview
    ? [
        {
          label: 'Candidatures envoyées',
          value: overview.total,
          pct: 100,
          color: 'bg-blue-500',
          light: 'bg-blue-50',
          text: 'text-blue-700',
        },
        {
          label: 'Réponses reçues',
          value: Math.round((overview.responseRate / 100) * overview.total),
          pct: overview.responseRate,
          color: 'bg-emerald-500',
          light: 'bg-emerald-50',
          text: 'text-emerald-700',
        },
        {
          label: 'Entretiens obtenus',
          value: Math.round((overview.interviewRate / 100) * overview.total),
          pct: overview.interviewRate,
          color: 'bg-violet-500',
          light: 'bg-violet-50',
          text: 'text-violet-700',
        },
        {
          label: 'Offres reçues',
          value: Math.round((overview.offerRate / 100) * overview.total),
          pct: overview.offerRate,
          color: 'bg-amber-500',
          light: 'bg-amber-50',
          text: 'text-amber-700',
        },
      ]
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Statistiques</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Vue globale de votre recherche d&apos;emploi</p>
        </div>
        <div className="flex items-center p-1 bg-secondary rounded-xl border border-border">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                period === p.value
                  ? 'bg-white shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)
          : kpis.map((k) => <KpiCard key={k.label} {...k} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-sm">Répartition par statut</h2>
            {!loading && byStatus.length > 0 && (
              <div className="flex items-center gap-1 p-1 bg-secondary rounded-xl">
                <button
                  onClick={() => setStatusView('bar')}
                  aria-label="Vue barres"
                  className={`flex items-center justify-center w-7 h-7 rounded-lg transition-colors ${
                    statusView === 'bar'
                      ? 'bg-white text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setStatusView('pie')}
                  aria-label="Vue camembert"
                  className={`flex items-center justify-center w-7 h-7 rounded-lg transition-colors ${
                    statusView === 'pie'
                      ? 'bg-white text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <PieChartIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="h-2.5 w-full rounded-full" />
                </div>
              ))}
            </div>
          ) : byStatus.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune candidature pour le moment</p>
          ) : statusView === 'bar' ? (
            <div className="space-y-4">
              {[...byStatus]
                .sort((a, b) => b.count - a.count)
                .map((s) => (
                  <div key={s.status}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium">
                        {STATUS_LABELS[s.status] ?? s.status}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {s.count} · {s.percentage}%
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${STATUS_BAR_COLORS[s.status] ?? 'bg-primary'}`}
                        style={{ width: `${s.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <PieChart data={byStatus} />
          )}
        </div>

        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-semibold text-sm mb-5">Funnel de conversion</h2>
          {loading ? (
            <div className="space-y-3">
              {[100, 75, 45, 20].map((w) => (
                <Skeleton key={w} className="h-10 rounded-xl" style={{ width: `${w}%` }} />
              ))}
            </div>
          ) : !overview || overview.total === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune candidature pour le moment</p>
          ) : (
            <div className="space-y-2">
              {funnelSteps.map((step, i) => (
                <div key={step.label} className="space-y-0">
                  <div
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl ${step.light} transition-all duration-700`}
                    style={{ width: `${Math.max(step.pct, 20)}%`, minWidth: 'fit-content' }}
                  >
                    <span className={`text-xs font-medium whitespace-nowrap ${step.text}`}>
                      {step.label}
                    </span>
                    <span className={`text-xs font-bold ml-4 tabular-nums ${step.text}`}>
                      {step.value}
                    </span>
                  </div>
                  {i < funnelSteps.length - 1 && (
                    <div className="w-px h-2 bg-border ml-4" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-sm">Activité</h2>
          {!loading && timeline.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {timeline.reduce((s, d) => s + d.count, 0)} candidatures sur {timeline.length} jour{timeline.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-5">Candidatures envoyées par jour</p>
        {loading ? (
          <Skeleton className="h-32 w-full rounded-xl" />
        ) : (
          <TimelineChart data={timeline} />
        )}
      </div>
    </div>
  )
}
