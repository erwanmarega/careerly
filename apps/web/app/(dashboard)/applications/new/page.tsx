'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createApplication, ALL_STATUSES } from '@/lib/applications'

const inputCls =
  'w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all'

export default function NewApplicationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = new FormData(e.currentTarget)

    const data = {
      company: form.get('company') as string,
      position: form.get('position') as string,
      location: (form.get('location') as string) || undefined,
      url: (form.get('url') as string) || undefined,
      salary: (form.get('salary') as string) || undefined,
      status: (form.get('status') as string) || undefined,
      appliedAt: (form.get('appliedAt') as string)
        ? new Date(form.get('appliedAt') as string).toISOString()
        : undefined,
      notes: (form.get('notes') as string) || undefined,
      contactName: (form.get('contactName') as string) || undefined,
      contactEmail: (form.get('contactEmail') as string) || undefined,
    }

    try {
      const app = await createApplication(data)
      router.refresh()
      router.push(`/applications/${app.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      setLoading(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/applications"
          className="flex items-center justify-center w-9 h-9 rounded-xl border border-border hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nouvelle candidature</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Ajoutez une candidature à suivre</p>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
          <h2 className="font-semibold text-sm">Informations principales</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Entreprise <span className="text-red-500">*</span>
              </label>
              <input name="company" required placeholder="Google, Airbnb…" className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Poste <span className="text-red-500">*</span>
              </label>
              <input
                name="position"
                required
                placeholder="Développeur Full Stack…"
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Statut</label>
              <select name="status" defaultValue="SENT" className={`${inputCls} bg-white`}>
                {ALL_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Date de candidature</label>
              <input name="appliedAt" type="date" defaultValue={today} className={inputCls} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
          <h2 className="font-semibold text-sm">Détails</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Lieu</label>
              <input name="location" placeholder="Paris, Remote…" className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Salaire</label>
              <input name="salary" placeholder="45k€, 50-60k€…" className={inputCls} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">URL de l&apos;offre</label>
            <input name="url" placeholder="https://…" className={inputCls} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
          <h2 className="font-semibold text-sm">Notes</h2>
          <textarea
            name="notes"
            rows={4}
            placeholder="Informations importantes, impressions, préparation…"
            className={`${inputCls} resize-none`}
          />
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
          <h2 className="font-semibold text-sm">Contact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nom du contact</label>
              <input name="contactName" placeholder="Jean Dupont" className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email du contact</label>
              <input
                name="contactEmail"
                type="email"
                placeholder="rh@entreprise.com"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-white font-semibold py-2.5 px-6 rounded-xl hover:bg-primary/90 transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          <Link href="/applications" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Annuler
          </Link>
        </div>
      </form>
    </div>
  )
}
