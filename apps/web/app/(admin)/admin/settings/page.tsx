'use client'

import { useState } from 'react'
import { Copy, Check, RefreshCw, Loader2, AlertTriangle, Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useSchool } from '@/hooks/useSchool'
import { api } from '@/lib/api'

const inputCls =
  'w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-card'

export default function AdminSettingsPage() {
  const { school, loading } = useSchool()
  const { theme, setTheme } = useTheme()
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const displayCode = inviteCode ?? school?.inviteCode ?? ''

  function handleCopy() {
    if (!displayCode) return
    navigator.clipboard.writeText(displayCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleRegenerate() {
    setRegenerating(true)
    setShowConfirm(false)
    try {
      const updated = await api.patch<{ inviteCode: string }>('/schools/me/invite-code', {})
      setInviteCode(updated.inviteCode)
    } catch {
    } finally {
      setRegenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl space-y-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-card rounded-2xl border border-border p-6 space-y-4 animate-pulse">
            <div className="h-4 bg-secondary rounded w-32" />
            <div className="h-10 bg-secondary rounded-xl" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Paramètres de l&apos;école</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gérez votre école et le code d&apos;invitation</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <h2 className="font-semibold text-sm">Informations</h2>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nom de l&apos;école</label>
            <input
              value={school?.name ?? ''}
              disabled
              className={`${inputCls} bg-secondary text-muted-foreground cursor-not-allowed`}
            />
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <div>
            <h2 className="font-semibold text-sm">Code d&apos;invitation</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Partagez ce code aux étudiants. Ils devront le saisir dans leurs paramètres pour rejoindre votre école.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 bg-secondary border border-border rounded-xl px-4 py-3 font-mono text-lg font-bold tracking-widest text-center">
              {displayCode || '—'}
            </div>
            <button
              onClick={handleCopy}
              disabled={!displayCode}
              className="flex items-center gap-2 px-4 py-3 border border-border rounded-xl text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-50"
            >
              {copied ? (
                <><Check className="w-4 h-4 text-emerald-500" />Copié</>
              ) : (
                <><Copy className="w-4 h-4" />Copier</>
              )}
            </button>
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground mb-3">
              Si vous régénérez le code, l&apos;ancien ne fonctionnera plus. Les étudiants déjà inscrits ne sont pas affectés.
            </p>
            <button
              onClick={() => setShowConfirm(true)}
              disabled={regenerating}
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground border border-border px-4 py-2 rounded-xl hover:bg-secondary transition-colors disabled:opacity-50"
            >
              {regenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Régénérer le code
            </button>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <h2 className="font-semibold text-sm">Apparence</h2>
          <div className="flex gap-3">
            {[
              { value: 'light', label: 'Clair', icon: Sun },
              { value: 'dark', label: 'Sombre', icon: Moon },
              { value: 'system', label: 'Système', icon: Monitor },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                  theme === value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="font-semibold text-sm">Régénérer le code ?</p>
                <p className="text-sm text-muted-foreground mt-1">
                  L&apos;ancien code <span className="font-mono font-bold">{displayCode}</span> ne fonctionnera plus. Les nouveaux étudiants devront utiliser le nouveau code.
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 text-sm font-medium border border-border rounded-xl py-2.5 hover:bg-secondary transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleRegenerate}
                className="flex-1 text-sm font-semibold bg-primary text-white rounded-xl py-2.5 hover:bg-primary/90 transition-colors"
              >
                Oui, régénérer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
