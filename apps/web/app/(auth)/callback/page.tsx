'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import { setTokens, storeUser, type AuthUser } from '@/lib/auth'

function CallbackContent() {
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const code = params.get('code')
    if (!code) {
      router.replace('/login')
      return
    }

    api
      .post<{ tokens: { accessToken: string; refreshToken: string }; user: AuthUser }>(
        '/auth/exchange-code',
        { code },
      )
      .then(async ({ tokens, user }) => {
        await setTokens(tokens.accessToken, tokens.refreshToken)
        storeUser(user)
        if (user.role === 'SCHOOL_ADMIN') {
          router.replace('/admin/dashboard')
        } else {
          router.replace(user.onboardingCompleted ? '/dashboard' : '/onboarding')
        }
      })
      .catch(() => {
        router.replace('/login')
      })
  }, [params, router])

  return null
}

export default function CallbackPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-sm text-muted-foreground">Connexion en cours…</p>
      <Suspense fallback={null}>
        <CallbackContent />
      </Suspense>
    </div>
  )
}
