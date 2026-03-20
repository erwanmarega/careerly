'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, UserMinus } from 'lucide-react'
import { api } from '@/lib/api'
import type { Application, StudentSummary } from '@postulo/types'

const STATUS_LABELS: Record<string, string> = {
  SENT: 'Envoyée',
  FOLLOW_UP: 'À relancer',
  INTERVIEW: 'Entretien',
  OFFER: 'Offre',
  REJECTED: 'Refusée',
  ARCHIVED: 'Archivée',
}

const STATUS_STYLES: Record<string, string> = {
  SENT: 'bg-blue-100 text-blue-700',
  FOLLOW_UP: 'bg-amber-100 text-amber-700',
  INTERVIEW: 'bg-violet-100 text-violet-700',
  OFFER: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  ARCHIVED: 'bg-secondary text-muted-foreground',
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-secondary rounded-lg ${className}`} />
}

export default function AdminStudentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [student, setStudent] = useState<StudentSummary | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [showConfirm, setShowConfirm] = useState(false)
  const [removing, setRemoving] = useState(false)

  async function handleRemove() {
    setRemoving(true)
    try {
      await api.delete(`/schools/me/students/${id}`)
      router.push('/admin/students')
    } catch {
      setRemoving(false)
      setShowConfirm(false)
    }
  }

  useEffect(() => {
    Promise.all([
      api.get<StudentSummary[]>('/schools/me/students'),
      api.get<Application[]>(`/schools/me/students/${id}/applications`),
    ])
      .then(([students, apps]) => {
        const found = students.find((s) => s.id === id) ?? null
        setStudent(found)
        setApplications(apps)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const initial = student?.name?.[0]?.toUpperCase() ?? student?.email[0].toUpperCase() ?? '?'

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/students"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux étudiants
        </Link>

        {loading ? (
          <div className="flex items-center gap-4">
            <Skeleton className="w-14 h-14 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
        ) : student ? (
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              {student.avatar ? (
                <img src={student.avatar} alt="" className="w-14 h-14 rounded-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-primary">{initial}</span>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold tracking-tight">{student.name ?? '—'}</h1>
              <p className="text-sm text-muted-foreground">{student.email}</p>
            </div>
            {student.hasOffer && (
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700">
                Alternance trouvée
              </span>
            )}
            <button
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-2 text-sm font-medium px-3.5 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"
            >
              <UserMinus className="w-4 h-4" />
              Retirer de l&apos;école
            </button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Étudiant introuvable.</p>
        )}
      </div>

      {!loading && student && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Candidatures', value: student.applicationCount },
            { label: 'Entretiens', value: student.statusBreakdown['INTERVIEW'] ?? 0 },
            { label: 'Offres', value: student.statusBreakdown['OFFER'] ?? 0 },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-card border border-border rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-sm">Candidatures</h2>
          {!loading && (
            <p className="text-xs text-muted-foreground mt-0.5">{applications.length} au total</p>
          )}
        </div>

        {loading ? (
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
            <p className="text-sm text-muted-foreground">Cet étudiant n&apos;a pas encore ajouté de candidature.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {applications.map((app) => (
              <div key={app.id} className="px-6 py-4 flex items-center gap-4">
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
                {app.url && (
                  <a
                    href={app.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <div className="space-y-1">
              <h2 className="font-semibold text-base">Retirer cet étudiant ?</h2>
              <p className="text-sm text-muted-foreground">
                {student?.name ?? student?.email} sera retiré de votre école. Ses candidatures seront conservées mais il n&apos;apparaîtra plus dans votre tableau de bord.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={removing}
                className="text-sm font-medium px-4 py-2 rounded-xl border border-border hover:bg-secondary transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleRemove}
                disabled={removing}
                className="text-sm font-medium px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {removing ? 'Retrait…' : 'Retirer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
