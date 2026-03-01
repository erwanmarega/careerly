'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { getStoredUser, type AuthUser } from '@/lib/auth'

export function useUser() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = getStoredUser()
    if (stored) {
      setUser(stored)
      setLoading(false)
      return
    }
    api
      .get<AuthUser>('/users/me')
      .then((data) => {
        setUser(data)
        localStorage.setItem('careerly_user', JSON.stringify(data))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { user, loading }
}
