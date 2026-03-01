'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Bell, CalendarClock, Plus, Trash2, X } from 'lucide-react'
import { api } from '@/lib/api'
import { useUser } from '@/hooks/useUser'
import { fetchApplications, type Application } from '@/lib/applications'

interface Reminder {
  id: string
  scheduledAt: string
  sent: boolean
  message: string | null
  createdAt: string
  applicationId: string
  application: {
    company: string
    position: string
  }
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-secondary rounded-lg ${className}`} />
}

function ReminderCard({
  reminder,
  onDelete,
  deleting,
}: {
  reminder: Reminder
  onDelete: () => void
  deleting: boolean
}) {
  const date = new Date(reminder.scheduledAt)
  const isOverdue = !reminder.sent && date < new Date()

  return (
    <div className="bg-white rounded-2xl border border-border px-5 py-4 flex items-center gap-4">
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
          reminder.sent ? 'bg-emerald-50' : isOverdue ? 'bg-red-50' : 'bg-primary/10'
        }`}
      >
        <Bell
          className={`w-4 h-4 ${
            reminder.sent ? 'text-emerald-500' : isOverdue ? 'text-red-500' : 'text-primary'
          }`}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">
          {reminder.application.company} — {reminder.application.position}
        </p>
        {reminder.message && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{reminder.message}</p>
        )}
      </div>

      <div className="text-right flex-shrink-0 mr-2">
        <p
          className={`text-xs font-medium ${
            isOverdue && !reminder.sent ? 'text-red-500' : 'text-muted-foreground'
          }`}
        >
          {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' })}
        </p>
        <p className="text-xs text-muted-foreground/60">
          {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {reminder.sent ? (
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 flex-shrink-0">
          Envoyé
        </span>
      ) : (
        <button
          onClick={onDelete}
          disabled={deleting}
          aria-label="Supprimer"
          className="text-muted-foreground/40 hover:text-red-500 transition-colors flex-shrink-0 disabled:opacity-40"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

export default function RemindersPage() {
  const { user } = useUser()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([api.get<Reminder[]>('/reminders'), fetchApplications({ limit: 100 })])
      .then(([r, a]) => {
        setReminders(r)
        setApplications(a.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const form = new FormData(e.currentTarget)
    const scheduledAt = form.get('scheduledAt') as string

    try {
      await api.post<Reminder>('/reminders', {
        applicationId: form.get('applicationId') as string,
        scheduledAt: new Date(scheduledAt).toISOString(),
        message: (form.get('message') as string) || undefined,
      })
      const fresh = await api.get<Reminder[]>('/reminders')
      setReminders(fresh)
      setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await api.delete<void>(`/reminders/${id}`)
      setReminders((prev) => prev.filter((r) => r.id !== id))
    } catch {
    } finally {
      setDeletingId(null)
    }
  }

  const now = new Date()
  const upcoming = reminders.filter((r) => !r.sent && new Date(r.scheduledAt) > now)
  const past = reminders.filter((r) => r.sent || new Date(r.scheduledAt) <= now)
  const isFree = user?.plan === 'FREE'
  const minDateTime = new Date(Date.now() + 60_000).toISOString().slice(0, 16)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rappels</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Recevez un email pour ne pas oublier de relancer
          </p>
        </div>
        {!isFree && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-2 bg-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        )}
      </div>

      {isFree && (
        <div className="bg-primary rounded-2xl p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold mb-1">Les rappels sont réservés au plan Pro</p>
              <p className="text-sm text-white/70 leading-relaxed mb-4">
                Ne laissez plus aucune candidature sans relance. Recevez des rappels par email exactement au moment choisi.
              </p>
              <Link
                href="/settings"
                className="inline-flex items-center gap-1.5 bg-white text-primary text-sm font-semibold px-4 py-2 rounded-xl hover:bg-white/90 transition-colors"
              >
                Passer en Pro <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {showForm && !isFree && (
        <div className="bg-white rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-sm">Nouveau rappel</h2>
            <button
              onClick={() => {
                setShowForm(false)
                setError(null)
              }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          {applications.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-2">
                Vous n&apos;avez aucune candidature.
              </p>
              <Link
                href="/applications/new"
                className="text-sm text-primary font-medium hover:underline underline-offset-4"
              >
                Créer une candidature d&apos;abord
              </Link>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Candidature <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="applicationId"
                    required
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                  >
                    <option value="">Sélectionner…</option>
                    {applications.map((app) => (
                      <option key={app.id} value={app.id}>
                        {app.company} — {app.position}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Date et heure <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="scheduledAt"
                    type="datetime-local"
                    required
                    min={minDateTime}
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Message (optionnel)</label>
                <input
                  name="message"
                  placeholder="Ex : Relancer pour un retour sur l'entretien…"
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-primary text-white font-semibold py-2.5 px-6 rounded-xl hover:bg-primary/90 transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setError(null)
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] rounded-2xl" />
          ))}
        </div>
      ) : reminders.length === 0 && !isFree ? (
        <div className="bg-white rounded-2xl border border-border px-6 py-16 text-center">
          <CalendarClock className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Aucun rappel pour le moment.</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 mt-3 text-sm text-primary font-medium hover:underline underline-offset-4"
          >
            <Plus className="w-3.5 h-3.5" /> Créer le premier
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                À venir · {upcoming.length}
              </p>
              <div className="space-y-2">
                {upcoming.map((r) => (
                  <ReminderCard
                    key={r.id}
                    reminder={r}
                    onDelete={() => handleDelete(r.id)}
                    deleting={deletingId === r.id}
                  />
                ))}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Passés · {past.length}
              </p>
              <div className="space-y-2 opacity-50">
                {past.map((r) => (
                  <ReminderCard
                    key={r.id}
                    reminder={r}
                    onDelete={() => handleDelete(r.id)}
                    deleting={deletingId === r.id}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
