'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  ArrowUpDown,
  Check,
  Download,
  FileText,
  LayoutList,
  Columns2,
  Plus,
  Search,
  Upload,
  X,
} from 'lucide-react'
import {
  fetchApplications,
  STATUS_LABELS,
  STATUS_STYLES,
  type Application,
} from '@/lib/applications'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { api } from '@/lib/api'
import { useUser } from '@/hooks/useUser'

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

const CSV_TEMPLATE =
  'company,position,location,url,salary,status,appliedAt,notes\n' +
  'Exemple Corp,Développeur Full Stack,Paris,https://exemple.com/offre,50000,envoyée,2024-01-15,Candidature spontanée\n'

const FIELD_ALIASES: Record<string, string[]> = {
  company: ['company', 'entreprise', 'société', 'societe'],
  position: ['position', 'poste', 'intitulé', 'intitule', 'titre'],
  location: ['location', 'lieu', 'ville', 'localisation'],
  url: ['url', 'lien', 'link'],
  salary: ['salary', 'salaire'],
  status: ['status', 'statut'],
  appliedAt: ['appliedat', 'date', 'date de candidature', 'date_candidature'],
  notes: ['notes', 'note', 'commentaire', 'commentaires'],
}

const FIELD_CONFIG = [
  { key: 'company', label: 'Entreprise', required: true },
  { key: 'position', label: 'Poste / Intitulé', required: true },
  { key: 'location', label: 'Lieu', required: false },
  { key: 'url', label: "URL de l'offre", required: false },
  { key: 'salary', label: 'Salaire', required: false },
  { key: 'status', label: 'Statut', required: false },
  { key: 'appliedAt', label: 'Date de candidature', required: false },
  { key: 'notes', label: 'Notes', required: false },
]

function parseCsvHeaders(text: string): string[] {
  const firstLine = text.replace(/\r\n/g, '\n').split('\n')[0]
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (const ch of firstLine) {
    if (ch === '"') inQuotes = !inQuotes
    else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else current += ch
  }
  result.push(current.trim())
  return result
}

function autoDetectMapping(headers: string[]): Record<string, string> {
  const headersLower = headers.map((h) => h.toLowerCase().trim())
  const mapping: Record<string, string> = {}
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    for (const alias of aliases) {
      const idx = headersLower.indexOf(alias)
      if (idx !== -1) {
        mapping[field] = headers[idx]
        break
      }
    }
  }
  return mapping
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-secondary rounded-lg ${className}`} />
}

const LIMIT = 20

export default function ApplicationsPage() {
  const { user } = useUser()
  const isFree = user?.plan === 'FREE'

  const [applications, setApplications] = useState<Application[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sort, setSort] = useState('appliedAt:desc')
  const [exportingCsv, setExportingCsv] = useState(false)
  const [showCsvUpgradeModal, setShowCsvUpgradeModal] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const [kanbanApps, setKanbanApps] = useState<Application[]>([])
  const [kanbanLoading, setKanbanLoading] = useState(false)

  const [importOpen, setImportOpen] = useState(false)
  const [importStep, setImportStep] = useState<'upload' | 'mapping' | 'success'>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [autoDetected, setAutoDetected] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(
    null,
  )
  const [importError, setImportError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function load(s: string, status: string, p: number, sortValue: string) {
    setLoading(true)
    const [sortBy, sortOrder] = sortValue.split(':') as [
      'appliedAt' | 'company' | 'status',
      'asc' | 'desc',
    ]
    fetchApplications({
      search: s || undefined,
      status: status || undefined,
      page: p,
      limit: LIMIT,
      sortBy,
      sortOrder,
    })
      .then((res) => {
        setApplications(res.data)
        setTotal(res.total)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const initialStatus = new URLSearchParams(window.location.search).get('status') ?? ''
    setStatusFilter(initialStatus)
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

  async function handleExportCsv() {
    if (isFree) {
      setShowCsvUpgradeModal(true)
      return
    }
    setExportingCsv(true)
    try {
      const match = document.cookie.match(/(?:^|; )access_token=([^;]*)/)
      const token = match ? decodeURIComponent(match[1]) : null
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
      const res = await fetch(`${apiUrl}/applications/export`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `careerly-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
    } finally {
      setExportingCsv(false)
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

  function openImport() {
    setImportStep('upload')
    setSelectedFile(null)
    setCsvHeaders([])
    setColumnMapping({})
    setAutoDetected(false)
    setImportResult(null)
    setImportError(null)
    setImportOpen(true)
  }

  function closeImport() {
    setImportOpen(false)
  }

  async function handleFileSelect(file: File) {
    setSelectedFile(file)
    setImportError(null)
    try {
      const text = await file.text()
      const headers = parseCsvHeaders(text)
      setCsvHeaders(headers)
      const mapping = autoDetectMapping(headers)
      setColumnMapping(mapping)
      const hasRequired = !!(mapping.company && mapping.position)
      setAutoDetected(hasRequired)
      if (!hasRequired) setImportStep('mapping')
    } catch {
      setCsvHeaders([])
      setAutoDetected(false)
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(true)
  }
  function handleDragLeave() {
    setDragOver(false)
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  async function handleImport() {
    if (!selectedFile) return
    setImporting(true)
    setImportError(null)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('mapping', JSON.stringify(columnMapping))
      const result = await api.upload<{ imported: number; skipped: number }>(
        '/applications/import',
        formData,
      )
      setImportResult(result)
      setImportStep('success')
      load(search, statusFilter, 1, sort)
      setPage(1)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setImporting(false)
    }
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'modele-candidatures.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const canImport = columnMapping.company && columnMapping.position

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
                viewMode === 'list'
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Vue liste"
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={switchToKanban}
              className={`flex items-center justify-center w-8 h-7 rounded-lg transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Vue Kanban"
            >
              <Columns2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={openImport}
            className="inline-flex items-center gap-2 border border-border bg-card text-sm font-medium px-3.5 py-2.5 rounded-xl hover:bg-secondary transition-colors"
            title="Importer un CSV"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Importer</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={exportingCsv}
            className="inline-flex items-center gap-2 border border-border bg-card text-sm font-medium px-3.5 py-2.5 rounded-xl hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title={isFree ? 'Export CSV — Plan Pro requis' : 'Exporter en CSV'}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{exportingCsv ? 'Export…' : 'CSV'}</span>
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
          className="w-full border border-border rounded-xl pl-10 pr-9 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-card"
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
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-2.5 py-1.5 flex-shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <select
              value={sort}
              onChange={(e) => handleSort(e.target.value)}
              className="text-xs font-medium text-muted-foreground bg-transparent outline-none cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {viewMode === 'kanban' &&
        (kanbanLoading ? (
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
          <KanbanBoard apps={filteredKanbanApps} onStatusChange={handleKanbanStatusChange} />
        ))}

      {viewMode === 'list' && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
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

      {showCsvUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-base">Fonctionnalité Pro</h2>
              <button
                onClick={() => setShowCsvUpgradeModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 mb-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <Download className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-violet-900">Export CSV</p>
                  <p className="text-xs text-violet-600">Plan Pro requis</p>
                </div>
              </div>
              <p className="text-xs text-violet-700">
                Exportez toutes vos candidatures au format CSV pour les analyser dans Excel, Google
                Sheets ou tout autre outil.
              </p>
            </div>
            <Link
              href="/settings"
              onClick={() => setShowCsvUpgradeModal(false)}
              className="flex items-center justify-center gap-2 w-full bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              Passer au Pro
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setShowCsvUpgradeModal(false)}
              className="mt-2 w-full text-xs text-muted-foreground hover:text-foreground py-2 transition-colors"
            >
              Pas maintenant
            </button>
          </div>
        </div>
      )}

      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-semibold text-base">Importer un CSV</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {importStep === 'upload' && 'Importez vos candidatures depuis un fichier CSV'}
                  {importStep === 'mapping' && 'Associez les colonnes de votre fichier'}
                  {importStep === 'success' && 'Import terminé'}
                </p>
              </div>
              <button
                onClick={closeImport}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {importStep === 'upload' && (
              <div>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    dragOver
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40 hover:bg-secondary/30'
                  }`}
                >
                  <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm font-medium">Glissez votre fichier ici</p>
                  <p className="text-xs text-muted-foreground mt-1">ou cliquez pour parcourir</p>
                  <p className="text-xs text-muted-foreground/60 mt-2">.csv accepté</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileSelect(file)
                      e.target.value = ''
                    }}
                  />
                </div>

                {selectedFile && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-2.5">
                      <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {(selectedFile.size / 1024).toFixed(1)} Ko
                      </span>
                      <button
                        onClick={() => {
                          setSelectedFile(null)
                          setCsvHeaders([])
                          setAutoDetected(false)
                        }}
                        className="text-muted-foreground hover:text-foreground flex-shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {autoDetected && (
                      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span className="text-xs text-emerald-700 flex-1">
                          Colonnes détectées automatiquement
                        </span>
                        <button
                          onClick={() => setImportStep('mapping')}
                          className="text-xs text-emerald-600 hover:text-emerald-800 font-medium flex-shrink-0"
                        >
                          Modifier
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {importError && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                    <p className="text-sm text-red-700">{importError}</p>
                  </div>
                )}

                <div className="mt-5 flex items-center justify-between">
                  <button
                    onClick={downloadTemplate}
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                  >
                    Télécharger le modèle CSV
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={closeImport}
                      className="px-4 py-2 text-sm font-medium border border-border rounded-xl hover:bg-secondary transition-colors"
                    >
                      Annuler
                    </button>
                    {selectedFile && autoDetected && (
                      <button
                        onClick={handleImport}
                        disabled={importing}
                        className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {importing ? 'Importation…' : 'Importer'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {importStep === 'mapping' && (
              <div>
                {selectedFile && (
                  <div className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-2 mb-4">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground truncate">
                      {selectedFile.name}
                    </span>
                  </div>
                )}

                <p className="text-xs text-muted-foreground mb-3">
                  Associez chaque champ au nom de colonne dans votre fichier. Les champs marqués{' '}
                  <span className="text-red-500 font-medium">*</span> sont obligatoires.
                </p>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {FIELD_CONFIG.map(({ key, label, required }) => (
                    <div key={key} className="flex items-center gap-3">
                        <label className="text-xs font-medium w-40 flex-shrink-0 text-foreground">
                        {label}
                        {required && <span className="text-red-500 ml-0.5">*</span>}
                      </label>
                      <select
                        value={columnMapping[key] ?? ''}
                        onChange={(e) =>
                          setColumnMapping((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        className={`flex-1 text-xs border rounded-lg px-2.5 py-2 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-card ${
                          required && !columnMapping[key]
                            ? 'border-amber-300 bg-amber-50/50'
                            : 'border-border'
                        }`}
                      >
                        <option value="">Ne pas importer</option>
                        {csvHeaders.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                {importError && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                    <p className="text-sm text-red-700">{importError}</p>
                  </div>
                )}

                <div className="mt-5 flex items-center justify-between">
                  <button
                    onClick={() => setImportStep('upload')}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ← Retour
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={importing || !canImport}
                    className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {importing ? 'Importation…' : 'Importer'}
                  </button>
                </div>
              </div>
            )}

            {importStep === 'success' && importResult && (
              <div className="py-4 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-7 h-7 text-emerald-600" />
                </div>
                <p className="text-lg font-bold">
                  {importResult.imported} candidature{importResult.imported !== 1 ? 's' : ''}{' '}
                  importée{importResult.imported !== 1 ? 's' : ''}
                </p>
                {importResult.skipped > 0 && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {importResult.skipped} ligne{importResult.skipped !== 1 ? 's' : ''} ignorée
                    {importResult.skipped !== 1 ? 's' : ''} (données manquantes ou invalides)
                  </p>
                )}
                <button
                  onClick={closeImport}
                  className="mt-6 px-6 py-2.5 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
