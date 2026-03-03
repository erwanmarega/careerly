'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { register } from '@/lib/auth'

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const name = form.get('name') as string
    const email = form.get('email') as string
    const password = form.get('password') as string

    try {
      await register(email, password, name)
      router.push('/onboarding')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-1">Créer un compte</h1>
        <p className="text-muted-foreground text-sm">
          Déjà inscrit ?{' '}
          <Link
            href="/login"
            className="text-primary font-medium hover:underline underline-offset-4"
          >
            Se connecter
          </Link>
        </p>
      </div>

      <a
        href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
        className="w-full flex items-center justify-center gap-3 border border-border rounded-xl py-3 text-sm font-medium hover:bg-secondary transition-colors"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continuer avec Google
      </a>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">ou</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium">
            Prénom
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="given-name"
            required
            placeholder="Thomas"
            className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50 bg-card"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="vous@exemple.com"
            className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50 bg-card"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            Mot de passe
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="8 caractères minimum"
              className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50 pr-11 bg-card"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? 'Masquer' : 'Afficher'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors text-sm mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Création du compte…' : 'Créer mon compte'}
        </button>

        <p className="text-xs text-muted-foreground text-center">
          En créant un compte, vous acceptez nos{' '}
          <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">
            CGU
          </Link>{' '}
          et notre{' '}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
            politique de confidentialité
          </Link>
          .
        </p>
      </form>
    </div>
  )
}
