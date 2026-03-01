'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Briefcase, CheckCircle2, Sparkles } from 'lucide-react'
import { completeOnboarding } from '@/lib/auth'
import { createApplication } from '@/lib/applications'
import { useUser } from '@/hooks/useUser'

const STEPS = ['Bienvenue', 'Première candidature', 'Tout est prêt']

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-10">
      {STEPS.map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i === current ? 'w-8 bg-primary' : i < current ? 'w-4 bg-primary/30' : 'w-4 bg-border'
          }`}
        />
      ))}
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const { user } = useUser()
  const [step, setStep] = useState(0)

  const [company, setCompany] = useState('')
  const [position, setPosition] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const firstName = user?.name?.split(' ')[0] ?? 'vous'

  async function handleAddApplication(e: React.FormEvent) {
    e.preventDefault()
    if (!company.trim() || !position.trim()) return
    setSaving(true)
    setError(null)
    try {
      await createApplication({ company: company.trim(), position: position.trim() })
      setStep(2)
    } catch {
      setError('Une erreur est survenue. Réessayez.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSkip() {
    setStep(2)
  }

  async function handleFinish() {
    setSaving(true)
    try {
      await completeOnboarding()
      router.replace('/dashboard')
    } catch {
      router.replace('/dashboard')
    }
  }

  return (
    <div className="w-full max-w-md">
      <StepDots current={step} />

      {step === 0 && (
        <div className="animate-in fade-in duration-300">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-8">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-4xl font-black tracking-tight leading-tight mb-4">
            Bienvenue,<br />
            <span className="text-primary">{firstName} !</span>
          </h1>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Careerly vous aide à garder le fil de votre recherche d'emploi.
          </p>
          <ul className="space-y-3 mb-10">
            {[
              'Suivez chaque candidature et son statut',
              'Recevez des rappels pour relancer au bon moment',
              'Visualisez votre progression avec des stats',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
          <button
            onClick={() => setStep(1)}
            className="w-full inline-flex items-center justify-center gap-2 bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary/90 transition-colors"
          >
            Commencer
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="animate-in fade-in duration-300">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-8">
            <Briefcase className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-3xl font-black tracking-tight leading-tight mb-2">
            Votre première<br />candidature
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-8">
            Ajoutez une candidature en cours pour démarrer. Vous pourrez en ajouter d'autres ensuite.
          </p>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleAddApplication} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Entreprise</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="ex : Spotify, Airbnb, Doctolib…"
                required
                className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Poste visé</label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="ex : Product Designer, Dev Frontend…"
                required
                className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50"
              />
            </div>
            <button
              type="submit"
              disabled={saving || !company.trim() || !position.trim()}
              className="w-full inline-flex items-center justify-center gap-2 bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {saving ? 'Ajout en cours…' : 'Ajouter et continuer'}
              {!saving && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <button
            onClick={handleSkip}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors mt-4"
          >
            Passer cette étape
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="animate-in fade-in duration-300 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-black tracking-tight mb-3">
            Tout est prêt !
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-10 max-w-sm mx-auto">
            Votre tableau de bord vous attend. Bonne recherche d'emploi !
          </p>
          <button
            onClick={handleFinish}
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Chargement…' : 'Accéder à mon tableau de bord'}
            {!saving && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      )}
    </div>
  )
}
