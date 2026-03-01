'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowUpDown, Download, LayoutList, Columns2, Plus, Search, X } from 'lucide-react'
import { fetchApplications, STATUS_LABELS, STATUS_STYLES, type Application } from '@/lib/applications'
import { exportApplicationsPdf } from '@/lib/export-pdf'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'

const SORT_OPTIONS = [
  { value: 'appliedAt:desc', label: 'Date (récent)' },
  { value: 'appliedAt:asc', label: 'Date (ancien)' },
  { value: 'company:asc', label: 'Entreprise A→Z' },
  { value: 'company:desc', label: 'Entreprise Z→A' },
  { value: 'status:asc', label: 'Statut A→Z' },
  { value: 'status:desc', label: 'Statut Z→A' },
]

const STATUS_FILTERS = [
  { value: '', label: 'Toutes' },
  { value: 'SENT', label: 'Envoyées' },
  { value: 'FOLLOW_UP', label: 'À relancer' },
  { value: 'INTERVIEW', label: 'Entretiens' },
  { value: 'OFFER', label: 'Offres' },
  { value: 'REJECTED', label: 'Refusées' },
  { value: 'ARCHIVED', label: 'Archivées' },
]

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-secondary rounded-lg ${className}`} />
}

const LIMIT = 20

export default function ApplicationsPage() {
  const searchParams = useSearchParams()
  const initialStatus = searchParams.get('status') ?? ''

  const [applications, setApplications] = useState<Application[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(initialStatus)
  const [sort, setSort] = useState('appliedAt:desc')
  const [exporting, setExporting] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const [kanbanApps, setKanbanApps] = useState<Application[]>([])
  const [kanbanLoading, setKanbanLoading] = useState(false)

  function load(s: string, status: string, p: number, sortValue: string) {
    setLoading(true)
    const [sortBy, sortOrder] = sortValue.split(':') as ['appliedAt' | 'company' | 'status', 'asc' | 'desc']
    fetchApplications({ search: s || undefined, status: status || undefined, page: p, limit: LIMIT, sortBy, sortOrder })
      .then((res) => { setApplications(res.data); setTotal(res.total) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load('', initialStatus, 1, 'appliedAt:desc')
  }, [])

  function handleSearch(value: string) {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
      load(value, statusFilter, 1, sort)
    }, 300)
  }

  function handleStatusFilter(value: string) {
    setStatusFilter(value)
    setPage(1)
    load(search, value, 1, sort)
  }

  function handleSort(value: string) {
    setSort(value)
    setPage(1)
    load(search, statusFilter, 1, value)
  }

  function handlePage(newPage: number) {
    setPage(newPage)
    load(search, statusFilter, newPage, sort)
  }

  async function handleExport() {
    setExporting(true)
    try {
      const [sortBy, sortOrder] = sort.split(':') as ['appliedAt' | 'company' | 'status', 'asc' | 'desc']
      const res = await fetchApplications({ search: search || undefined, status: statusFilter || undefined, sortBy, sortOrder, limit: 10000 })
      await exportApplicationsPdf(res.data)
    } catch {
    } finally {
      setExporting(false)
    }
  }

  async function switchToKanban() {
    setViewMode('kanban')
    setKanbanLoading(true)
    try {
      const res = await fetchApplications({ limit: 1000 })
      setKanbanApps(res.data)
    } catch {
    } finally {
      setKanbanLoading(false)
    }
  }

  function switchToList() {
    setViewMode('list')
  }

  const filteredKanbanApps = search
    ? kanbanApps.filter(
        (a) =>
          a.company.toLowerCase().includes(search.toLowerCase()) ||
          a.position.toLowerCase().includes(search.toLowerCase()),
      )
    : kanbanApps

  function handleKanbanStatusChange(appId: string, newStatus: string) {
    setKanbanApps((prev) => prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a)))
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Candidatures</h1>
          {viewMode === 'list' && !loading && (
            <p className="text-sm text-muted-foreground mt-0.5">{total} au total</p>
          )}
          {viewMode === 'kanban' && !kanbanLoading && (
            <p className="text-sm text-muted-foreground mt-0.5">{kanbanApps.length} au total</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center p-1 bg-secondary rounded-xl border border-border">
            <button
              onClick={switchToList}
              className={`flex items-center justify-center w-8 h-7 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Vue liste"
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={switchToKanban}
              className={`flex items-center justify-center w-8 h-7 rounded-lg transition-colors ${
                viewMode === 'kanban' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Vue Kanban"
            >
              <Columns2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleExport}
            disabled={exporting || (viewMode === 'list' ? total === 0 : kanbanApps.length === 0)}
            className="inline-flex items-center gap-2 border border-border bg-white text-sm font-medium px-3.5 py-2.5 rounded-xl hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Export…' : 'PDF'}
          </button>
          <Link
            href="/applications/new"
            className="inline-flex items-center gap-2 bg-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </Link>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => {
            if (viewMode === 'list') handleSearch(e.target.value)
            else setSearch(e.target.value)
          }}
          placeholder="Rechercher une entreprise ou un poste…"
          className="w-full border border-border rounded-xl pl-10 pr-9 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
        />
        {search && (
          <button
            onClick={() => {
              if (viewMode === 'list') handleSearch('')
              else setSearch('')
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {viewMode === 'list' && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-2 flex-wrap flex-1">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s.value}
                onClick={() => handleStatusFilter(s.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === s.value
                    ? 'bg-primary text-white'
                    : 'bg-white border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 bg-white border border-border rounded-lg px-2.5 py-1.5 flex-shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <select
              value={sort}
              onChange={(e) => handleSort(e.target.value)}
              className="text-xs font-medium text-muted-foreground bg-transparent outline-none cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {viewMode === 'kanban' && (
        kanbanLoading ? (
          <div className="flex gap-3 overflow-x-auto pb-4 -mx-6 px-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-52 flex flex-col gap-2">
                <Skeleton className="h-9 rounded-xl" />
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-24 rounded-xl" />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <KanbanBoard
            apps={filteredKanbanApps}
            onStatusChange={handleKanbanStatusChange}
          />
        )
      )}

      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          {loading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-4">
                  <Skeleton className="w-9 h-9 rounded-xl" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-3.5 w-16 hidden sm:block" />
                </div>
              ))}
            </div>
          ) : applications.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm text-muted-foreground">
                {search || statusFilter
                  ? 'Aucun résultat pour cette recherche.'
                  : "Aucune candidature pour l'instant."}
              </p>
              {!search && !statusFilter && (
                <Link
                  href="/applications/new"
                  className="inline-flex items-center gap-1.5 mt-3 text-sm text-primary font-medium hover:underline underline-offset-4"
                >
                  <Plus className="w-3.5 h-3.5" /> Ajouter la première
                </Link>
              )}
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
                    <p className="text-sm font-semibold">{app.company}</p>
                    <p className="text-xs text-muted-foreground truncate">{app.position}</p>
                    {app.location && (
                      <p className="text-xs text-muted-foreground/50 truncate">{app.location}</p>
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${
                      STATUS_STYLES[app.status] ?? 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {STATUS_LABELS[app.status] ?? app.status}
                  </span>
                  <span className="text-xs text-muted-foreground/50 flex-shrink-0 hidden sm:block w-24 text-right">
                    {new Date(app.appliedAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: '2-digit',
                    })}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {!loading && totalPages > 1 && (
            <div className="px-6 py-4 border-t border-border flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Page {page} sur {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => handlePage(page - 1)}
                  className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg disabled:opacity-40 hover:bg-secondary transition-colors disabled:cursor-not-allowed"
                >
                  Précédent
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => handlePage(page + 1)}
                  className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg disabled:opacity-40 hover:bg-secondary transition-colors disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
