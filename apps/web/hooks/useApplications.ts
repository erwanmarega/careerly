'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export interface Application {
  id: string
  company: string
  position: string
  status: string
  appliedAt: string
  location: string | null
}

interface PaginatedApplications {
  data: Application[]
  total: number
  page: number
  limit: number
}

export function useApplications(limit = 5) {
  const [applications, setApplications] = useState<Application[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<PaginatedApplications>(`/applications?limit=${limit}`)
      .then((res) => {
        setApplications(res.data)
        setTotal(res.total)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [limit])

  return { applications, total, loading }
}
