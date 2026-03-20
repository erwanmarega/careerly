'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, ArrowRight, Send, Check, Download } from 'lucide-react'
import { useStudents } from '@/hooks/useSchool'
import { api } from '@/lib/api'

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-secondary rounded-lg ${className}`} />
}

export default function AdminStudentsPage() {
  const { students, loading } = useStudents()
  const [search, setSearch] = useState('')
  const [reminding, setReminding] = useState<string | null>(null)
  const [reminded, setReminded] = useState<Set<string>>(new Set())

  function handleExportCsv() {
    const headers = ['Nom', 'Email', 'Nb candidatures', 'Statut', 'Dernière candidature']
    const rows = students.map((s) => {
      const statut = s.hasOffer
        ? 'Alternance trouvée'
        : s.applicationCount === 0
          ? 'Pas démarré'
          : 'En recherche'
      const lastDate = s.lastApplicationAt
        ? new Date(s.lastApplicationAt).toLocaleDateString('fr-FR')
        : ''
      return [s.name ?? '', s.email, String(s.applicationCount), statut, lastDate]
    })

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rapport-etudiants-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleRemind(studentId: string, e: React.MouseEvent) {
    e.preventDefault()
    setReminding(studentId)
    try {
      await api.post(`/schools/me/students/${studentId}/remind`, {})
      setReminded((prev) => new Set(prev).add(studentId))
    } catch {
    } finally {
      setReminding(null)
    }
  }

  const filtered = students.filter((s) => {
    const q = search.toLowerCase()
    return (
      s.name?.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Étudiants</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? '…' : `${students.length} étudiant${students.length !== 1 ? 's' : ''} inscrit${students.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        {!loading && students.length > 0 && (
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 text-sm font-medium px-3.5 py-2 rounded-xl border border-border hover:bg-secondary transition-colors flex-shrink-0"
          >
            <Download className="w-4 h-4" />
            Télécharger le rapport
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un étudiant…"
          className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm bg-card outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-3 w-52" />
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-4 w-4 rounded" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              {search ? 'Aucun résultat pour cette recherche.' : 'Aucun étudiant inscrit pour l\'instant.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((student) => {
              const initial = student.name?.[0]?.toUpperCase() ?? student.email[0].toUpperCase()
              const lastDate = student.lastApplicationAt
                ? new Date(student.lastApplicationAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                  })
                : null

              return (
                <Link
                  key={student.id}
                  href={`/admin/students/${student.id}`}
                  className="px-6 py-4 flex items-center gap-4 hover:bg-secondary/30 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {student.avatar ? (
                      <img src={student.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-primary">{initial}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{student.name ?? '—'}</p>
                    <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                  </div>

                  <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-xs font-semibold">{student.applicationCount}</span>
                    <span className="text-xs text-muted-foreground">candidature{student.applicationCount !== 1 ? 's' : ''}</span>
                    {lastDate && (
                      <span className="text-xs text-muted-foreground/60 ml-1">· {lastDate}</span>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    {student.hasOffer ? (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                        Alternance trouvée
                      </span>
                    ) : student.applicationCount === 0 ? (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-secondary text-muted-foreground">
                        Pas démarré
                      </span>
                    ) : (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                        En recherche
                      </span>
                    )}
                  </div>

                  {student.applicationCount === 0 && (
                    <button
                      onClick={(e) => handleRemind(student.id, e)}
                      disabled={reminding === student.id || reminded.has(student.id)}
                      className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:cursor-not-allowed ${
                        reminded.has(student.id)
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-border hover:bg-secondary text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {reminded.has(student.id) ? (
                        <><Check className="w-3 h-3" /> Envoyé</>
                      ) : reminding === student.id ? (
                        <>Envoi…</>
                      ) : (
                        <><Send className="w-3 h-3" /> Relancer</>
                      )}
                    </button>
                  )}

                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
