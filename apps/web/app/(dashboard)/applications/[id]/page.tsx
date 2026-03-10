'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  MapPin,
  Pencil,
  Sparkles,
  Trash2,
  Wallet,
  User,
  Mail,
  X,
} from 'lucide-react'
import {
  fetchApplication,
  updateApplication,
  updateApplicationStatus,
  deleteApplication,
  STATUS_LABELS,
  STATUS_STYLES,
  type ApplicationDetail,
} from '@/lib/applications'
import { api } from '@/lib/api'

const inputCls =
  'w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-card'

const PIPELINE = [
  { value: 'SENT', label: 'Envoyée', dot: 'bg-slate-400' },
  { value: 'FOLLOW_UP', label: 'À relancer', dot: 'bg-blue-400' },
  { value: 'INTERVIEW', label: 'Entretien', dot: 'bg-emerald-400' },
  { value: 'OFFER', label: 'Offre', dot: 'bg-violet-500' },
]
const TERMINAL = [
  { value: 'REJECTED', label: 'Refusé', cls: 'border-red-200 text-red-600 hover:bg-red-50' },
  {
    value: 'ARCHIVED',
    label: 'Archivée',
    cls: 'border-slate-200 text-slate-500 hover:bg-slate-50',
  },
]

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-secondary rounded-lg ${className}`} />
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium mt-0.5">{value}</p>
      </div>
    </div>
  )
}

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [app, setApp] = useState<ApplicationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const [pendingStatus, setPendingStatus] = useState<string | null>(null)
  const [statusNote, setStatusNote] = useState('')
  const [changingStatus, setChangingStatus] = useState(false)

  const [followUpEmail, setFollowUpEmail] = useState<string | null>(null)
  const [loadingAi, setLoadingAi] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchApplication(id)
      .then(setApp)
      .catch(() => router.replace('/applications'))
      .finally(() => setLoading(false))
  }, [id, router])

  async function confirmStatusChange() {
    if (!app || !pendingStatus) return
    setChangingStatus(true)
    try {
      await updateApplicationStatus(id, pendingStatus, statusNote || undefined)
      const updated = await fetchApplication(id)
      setApp(updated)
      setPendingStatus(null)
      setStatusNote('')
    } catch {
    } finally {
      setChangingStatus(false)
    }
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setEditError(null)
    const form = new FormData(e.currentTarget)
    const data = {
      company: form.get('company') as string,
      position: form.get('position') as string,
      location: (form.get('location') as string) || undefined,
      url: (form.get('url') as string) || undefined,
      salary: (form.get('salary') as string) || undefined,
      appliedAt: (form.get('appliedAt') as string)
        ? new Date(form.get('appliedAt') as string).toISOString()
        : undefined,
      notes: (form.get('notes') as string) || undefined,
      contactName: (form.get('contactName') as string) || undefined,
      contactEmail: (form.get('contactEmail') as string) || undefined,
    }
    try {
      const updated = await updateApplication(id, data)
      setApp((prev) => (prev ? { ...prev, ...updated } : prev))
      setEditing(false)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setSaving(false)
    }
  }

  async function handleFollowUpEmail() {
    if (!app) return
    setLoadingAi(true)
    setFollowUpEmail(null)
    try {
      const { text } = await api.post<{ text: string }>('/ai/follow-up-email', {
        company: app.company,
        position: app.position,
      })
      setFollowUpEmail(text)
    } catch {
    } finally {
      setLoadingAi(false)
    }
  }

  async function handleCopy() {
    if (!followUpEmail) return
    await navigator.clipboard.writeText(followUpEmail)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteApplication(id)
      router.push('/applications')
    } catch {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-xl" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!app) return null

  const appliedDate = new Date(app.appliedAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const pipelineIndex = PIPELINE.findIndex((s) => s.value === app.status)
  const isTerminal = TERMINAL.some((t) => t.value === app.status)

  const history = [...app.statusHistory].reverse()

  return (
    <div className="max-w-5xl">
      <div className="flex items-start gap-3 mb-6">
        <Link
          href="/applications"
          className="flex items-center justify-center w-9 h-9 rounded-xl border border-border hover:bg-secondary transition-colors mt-0.5 flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">{app.company}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{app.position}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!editing && (
            <button
              onClick={() => {
                setEditing(true)
                setEditError(null)
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-border rounded-xl hover:bg-secondary transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Modifier
            </button>
          )}
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Supprimer
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Confirmer ?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-2 text-xs font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {deleting ? '…' : 'Oui'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-2 text-xs font-medium border border-border rounded-xl hover:bg-secondary transition-colors"
              >
                Non
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {editError && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {editError}
            </div>
          )}

          {editing ? (
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                <h2 className="font-semibold text-sm">Informations principales</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                      Entreprise <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="company"
                      required
                      defaultValue={app.company}
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                      Poste <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="position"
                      required
                      defaultValue={app.position}
                      className={inputCls}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Date de candidature</label>
                    <input
                      name="appliedAt"
                      type="date"
                      defaultValue={app.appliedAt.split('T')[0]}
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Lieu</label>
                    <input
                      name="location"
                      defaultValue={app.location ?? ''}
                      placeholder="Paris, Remote…"
                      className={inputCls}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Salaire</label>
                    <input
                      name="salary"
                      defaultValue={app.salary ?? ''}
                      placeholder="45k€…"
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">URL de l&apos;offre</label>
                    <input
                      name="url"
                      defaultValue={app.url ?? ''}
                      placeholder="https://…"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
              <div className="bg-card rounded-2xl border border-border p-6 space-y-3">
                <h2 className="font-semibold text-sm">Notes</h2>
                <textarea
                  name="notes"
                  rows={4}
                  defaultValue={app.notes ?? ''}
                  placeholder="Impressions, préparation…"
                  className={`${inputCls} resize-none`}
                />
              </div>
              <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                <h2 className="font-semibold text-sm">Contact</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Nom</label>
                    <input
                      name="contactName"
                      defaultValue={app.contactName ?? ''}
                      placeholder="Jean Dupont"
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Email</label>
                    <input
                      name="contactEmail"
                      type="email"
                      defaultValue={app.contactEmail ?? ''}
                      placeholder="rh@entreprise.com"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-primary text-white font-semibold py-2.5 px-6 rounded-xl hover:bg-primary/90 transition-colors text-sm disabled:opacity-60"
                >
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false)
                    setEditError(null)
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="bg-card rounded-2xl border border-border p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-semibold text-sm">Informations</h2>
                  <span className="text-xs text-muted-foreground">Envoyée le {appliedDate}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {app.location && <InfoRow icon={MapPin} label="Lieu" value={app.location} />}
                  {app.salary && <InfoRow icon={Wallet} label="Salaire" value={app.salary} />}
                  {app.contactName && (
                    <InfoRow icon={User} label="Contact" value={app.contactName} />
                  )}
                  {app.contactEmail && (
                    <InfoRow icon={Mail} label="Email RH" value={app.contactEmail} />
                  )}
                </div>
                {app.url && (
                  <div
                    className={`${app.location || app.salary || app.contactName || app.contactEmail ? 'mt-4 pt-4 border-t border-border' : ''}`}
                  >
                    <a
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline underline-offset-4"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Voir l&apos;offre
                    </a>
                  </div>
                )}
                {!app.location &&
                  !app.salary &&
                  !app.contactName &&
                  !app.contactEmail &&
                  !app.url && (
                    <p className="text-sm text-muted-foreground/60">Aucun détail renseigné.</p>
                  )}
              </div>

              {app.notes && (
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h2 className="font-semibold text-sm mb-3">Notes</h2>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {app.notes}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border p-5">
            <h2 className="font-semibold text-sm mb-4">Statut</h2>

            <div className="space-y-1 mb-4">
              {PIPELINE.map((step, i) => {
                const isCurrent = app.status === step.value
                const isPast = pipelineIndex > i && !isTerminal
                const isClickable = !isCurrent

                return (
                  <button
                    key={step.value}
                    disabled={!isClickable || pendingStatus !== null}
                    onClick={() => {
                      setPendingStatus(step.value)
                      setStatusNote('')
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 ${
                      isCurrent
                        ? 'bg-primary/10 text-primary font-semibold cursor-default'
                        : isPast
                          ? 'text-muted-foreground/60 hover:bg-secondary hover:text-foreground cursor-pointer'
                          : isClickable
                            ? 'text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer'
                            : 'opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        isCurrent
                          ? 'bg-primary'
                          : isPast
                            ? 'bg-muted-foreground/30'
                            : 'border-2 border-border'
                      }`}
                    >
                      {(isCurrent || isPast) && (
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      )}
                    </div>
                    <span className="text-sm">{step.label}</span>
                    {isCurrent && (
                      <span className="ml-auto text-xs font-medium text-primary/70">Actuel</span>
                    )}
                  </button>
                )
              })}
            </div>

            {!isTerminal && (
              <div className="flex gap-2 pt-3 border-t border-border">
                {TERMINAL.map((t) => (
                  <button
                    key={t.value}
                    disabled={pendingStatus !== null}
                    onClick={() => {
                      setPendingStatus(t.value)
                      setStatusNote('')
                    }}
                    className={`flex-1 px-3 py-2 text-xs font-medium border rounded-xl transition-colors ${t.cls} disabled:opacity-40`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
            {isTerminal && (
              <div
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl ${STATUS_STYLES[app.status]}`}
              >
                <div className="w-2 h-2 rounded-full bg-current opacity-60 flex-shrink-0" />
                <span className="text-sm font-semibold">{STATUS_LABELS[app.status]}</span>
                <button
                  onClick={() => {
                    setPendingStatus('SENT')
                    setStatusNote('')
                  }}
                  className="ml-auto text-xs underline underline-offset-2 opacity-60 hover:opacity-100"
                >
                  Réouvrir
                </button>
              </div>
            )}

            {pendingStatus && (
              <div className="mt-4 pt-4 border-t border-border space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium">
                    Passer à <span className="text-primary">{STATUS_LABELS[pendingStatus]}</span>
                  </p>
                  <button
                    onClick={() => {
                      setPendingStatus(null)
                      setStatusNote('')
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Note (optionnel) — ex: entretien RH le 5 mars…"
                  rows={2}
                  className="w-full border border-border rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                />
                <button
                  onClick={confirmStatusChange}
                  disabled={changingStatus}
                  className="w-full bg-primary text-white text-xs font-semibold py-2 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {changingStatus ? 'Mise à jour…' : 'Confirmer'}
                </button>
              </div>
            )}
          </div>

          {history.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-5">
              <h2 className="font-semibold text-sm mb-4">Historique</h2>
              <div className="space-y-0">
                {history.map((entry, i) => (
                  <div key={entry.id} className="flex items-start gap-3">
                    <div className="flex flex-col items-center pt-1">
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          i === history.length - 1 ? 'bg-primary' : 'bg-border'
                        }`}
                      />
                      {i < history.length - 1 && (
                        <div className="w-px bg-border flex-1 mt-1" style={{ minHeight: 28 }} />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <span
                        className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-1 ${
                          STATUS_STYLES[entry.status] ?? 'bg-secondary text-muted-foreground'
                        }`}
                      >
                        {STATUS_LABELS[entry.status] ?? entry.status}
                      </span>
                      <p className="text-xs text-muted-foreground/60">
                        {new Date(entry.changedAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {entry.note && (
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {entry.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Assistant IA</h2>
            </div>

            <button
              onClick={handleFollowUpEmail}
              disabled={loadingAi}
              className="w-full inline-flex items-center justify-center gap-2 bg-primary text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {loadingAi ? 'Génération en cours…' : 'Générer un email de relance'}
            </button>

            {followUpEmail && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Résultat</p>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    {copied ? 'Copié !' : 'Copier'}
                  </button>
                </div>
                <div className="bg-secondary rounded-xl p-4 text-xs text-foreground whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                  {followUpEmail}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
