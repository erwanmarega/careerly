'use client'

export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { setTokens, storeUser, type AuthUser } from '@/lib/auth'

export default function CallbackPage() {
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    const id = params.get('id')
    const email = params.get('email')
    const name = params.get('name')
    const plan = params.get('plan')
    const onboardingCompleted = params.get('onboarding_completed') === 'true'

    if (!accessToken || !refreshToken || !id || !email || !plan) {
      router.replace('/login')
      return
    }

    const user: AuthUser = { id, email, name: name || null, plan, avatar: null, onboardingCompleted }
    setTokens(accessToken, refreshToken)
    storeUser(user)
    router.replace(onboardingCompleted ? '/dashboard' : '/onboarding')
  }, [params, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-sm text-muted-foreground">Connexion en cours…</p>
    </div>
  )
}
