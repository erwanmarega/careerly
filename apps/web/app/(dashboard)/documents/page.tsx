'use client'

import { useEffect, useRef, useState } from 'react'
import { Upload, Trash2, FileCheck, Loader2, Star } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { api } from '@/lib/api'

interface Document {
  id: string
  name: string
  type: 'CV' | 'COVER_LETTER'
  url: string
  isActive: boolean
  createdAt: string
}

const inputCls =
  'w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-card'

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-secondary rounded-lg ${className}`} />
}

export default function DocumentsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [pendingName, setPendingName] = useState('')
  const [pendingType, setPendingType] = useState<'CV' | 'COVER_LETTER'>('CV')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [activatingId, setActivatingId] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<Document[]>('/documents')
      .then(setDocuments)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingFile(file)
    setPendingName(file.name.replace(/\.[^.]+$/, ''))
    setUploadError(null)
    e.target.value = ''
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!pendingFile || !pendingName.trim()) return
    setUploading(true)
    setUploadError(null)
    try {
      const formData = new FormData()
      formData.append('file', pendingFile)
      formData.append('name', pendingName.trim())
      formData.append('type', pendingType)
      const doc = await api.upload<Document>('/documents', formData)
      setDocuments((prev) => [doc, ...prev])
      setPendingFile(null)
      setPendingName('')
      setPendingType('CV')
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Erreur lors de l'upload")
    } finally {
      setUploading(false)
    }
  }

  async function handleSetActive(id: string, type: 'CV' | 'COVER_LETTER') {
    setActivatingId(id)
    try {
      await api.patch(`/documents/${id}/active`, {})
      setDocuments((prev) =>
        prev.map((d) =>
          d.type === type ? { ...d, isActive: d.id === id } : d,
        ),
      )
    } catch {}
    finally { setActivatingId(null) }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await api.delete(`/documents/${id}`)
      setDocuments((prev) => prev.filter((d) => d.id !== id))
    } catch {}
    finally {
      setDeletingId(null)
    }
  }

  const cvs = documents.filter((d) => d.type === 'CV')
  const lms = documents.filter((d) => d.type === 'COVER_LETTER')

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mes documents</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? '…' : `${documents.length} document${documents.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        {!pendingFile && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 text-sm font-medium px-3.5 py-2 rounded-xl border border-border hover:bg-secondary transition-colors flex-shrink-0"
          >
            <Upload className="w-4 h-4" />
            Ajouter
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={handleFileChange}
      />

      {pendingFile && (
        <form
          onSubmit={handleUpload}
          className="bg-card border border-border rounded-2xl p-5 space-y-4"
        >
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-primary" />
            <p className="text-sm font-medium">{pendingFile.name}</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nom du document</label>
            <input
              value={pendingName}
              onChange={(e) => setPendingName(e.target.value)}
              className={inputCls}
              placeholder="Ex : CV Développeur Web"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Type</label>
            <div className="flex gap-2">
              {(['CV', 'COVER_LETTER'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setPendingType(t)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                    pendingType === t
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:bg-secondary text-muted-foreground'
                  }`}
                >
                  {t === 'CV' ? 'CV' : 'Lettre de motivation'}
                </button>
              ))}
            </div>
          </div>

          {uploadError && <p className="text-sm text-red-500">{uploadError}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={uploading || !pendingName.trim()}
              className="flex-1 bg-primary text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {uploading ? 'Upload en cours…' : 'Enregistrer'}
            </button>
            <button
              type="button"
              onClick={() => { setPendingFile(null); setPendingName(''); setUploadError(null) }}
              className="px-4 py-2.5 text-sm border border-border rounded-xl hover:bg-secondary transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-5 py-4 flex items-center gap-4">
              <Skeleton className="w-9 h-9 rounded-xl" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl">
          <EmptyState
            title="Aucun document pour l'instant."
            description="Ajoute ton CV ou ta lettre de motivation pour les retrouver facilement."
            action={{ label: '+ Ajouter le premier', onClick: () => fileInputRef.current?.click() }}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {cvs.length > 0 && (
            <DocumentGroup title="CV" docs={cvs} deletingId={deletingId} activatingId={activatingId} onDelete={handleDelete} onSetActive={handleSetActive} />
          )}
          {lms.length > 0 && (
            <DocumentGroup title="Lettres de motivation" docs={lms} deletingId={deletingId} activatingId={activatingId} onDelete={handleDelete} onSetActive={handleSetActive} />
          )}
        </div>
      )}
    </div>
  )
}

function DocumentGroup({
  title,
  docs,
  deletingId,
  activatingId,
  onDelete,
  onSetActive,
}: {
  title: string
  docs: Document[]
  deletingId: string | null
  activatingId: string | null
  onDelete: (id: string) => void
  onSetActive: (id: string, type: 'CV' | 'COVER_LETTER') => void
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">{title}</p>
      <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
        {docs.map((doc) => (
          <div key={doc.id} className="px-5 py-4 flex items-center gap-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${doc.isActive ? 'bg-primary/10' : 'bg-secondary'}`}>
              <FileCheck className={`w-4 h-4 ${doc.isActive ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{doc.name}</p>
                {doc.isActive && (
                  <span className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    Principal
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(doc.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
            {!doc.isActive && (
              <button
                onClick={() => onSetActive(doc.id, doc.type)}
                disabled={activatingId === doc.id}
                title="Marquer comme principal"
                className="text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 flex-shrink-0"
              >
                {activatingId === doc.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Star className="w-4 h-4" />
                )}
              </button>
            )}
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary font-medium hover:underline underline-offset-4 flex-shrink-0"
            >
              Voir
            </a>
            <button
              onClick={() => onDelete(doc.id)}
              disabled={deletingId === doc.id}
              className="text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50 flex-shrink-0"
            >
              {deletingId === doc.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
