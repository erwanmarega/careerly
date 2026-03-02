'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { getStoredUser, type AuthUser } from '@/lib/auth'

export function useUser() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  async function refresh() {
    try {
      const data = await api.get<AuthUser>('/users/me')
      setUser(data)
      localStorage.setItem('careerly_user', JSON.stringify(data))
      window.dispatchEvent(new CustomEvent('careerly:user-updated', { detail: data }))
    } catch {}
  }

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

  useEffect(() => {
    function handleUpdated(e: CustomEvent) {
      setUser(e.detail)
    }
    window.addEventListener('careerly:user-updated', handleUpdated as EventListener)
    return () => window.removeEventListener('careerly:user-updated', handleUpdated as EventListener)
  }, [])

  return { user, loading, refresh }
}
