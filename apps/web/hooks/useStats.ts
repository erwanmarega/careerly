'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export interface StatsOverview {
  total: number
  responseRate: number
  interviewRate: number
  offerRate: number
  activeApplications: number
}

export function useStats() {
  const [stats, setStats] = useState<StatsOverview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<StatsOverview>('/stats/overview')
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { stats, loading }
}
