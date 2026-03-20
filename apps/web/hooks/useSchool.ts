'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { StudentSummary } from '@postulo/types'

export interface SchoolInfo {
  id: string
  name: string
  inviteCode: string
  studentCount: number
  createdAt: string
}

export function useSchool() {
  const [school, setSchool] = useState<SchoolInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<SchoolInfo>('/schools/me')
      .then(setSchool)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { school, loading }
}

export function useStudents() {
  const [students, setStudents] = useState<StudentSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<StudentSummary[]>('/schools/me/students')
      .then(setStudents)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { students, loading }
}
