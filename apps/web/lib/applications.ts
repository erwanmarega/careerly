import { api } from './api'

export interface Application {
  id: string
  company: string
  position: string
  location: string | null
  url: string | null
  salary: string | null
  status: string
  appliedAt: string
  notes: string | null
  contactName: string | null
  contactEmail: string | null
  createdAt: string
  updatedAt: string
}

export interface StatusHistoryEntry {
  id: string
  status: string
  changedAt: string
  note: string | null
}

export interface ApplicationDetail extends Application {
  statusHistory: StatusHistoryEntry[]
}

export interface PaginatedApplications {
  data: Application[]
  total: number
  page: number
  limit: number
}

export const STATUS_LABELS: Record<string, string> = {
  SENT: 'Envoyée',
  FOLLOW_UP: 'À relancer',
  INTERVIEW: 'Entretien',
  OFFER: 'Offre',
  REJECTED: 'Refusé',
  ARCHIVED: 'Archivée',
}

export const STATUS_STYLES: Record<string, string> = {
  SENT: 'bg-secondary text-muted-foreground',
  FOLLOW_UP: 'bg-blue-100 text-blue-700',
  INTERVIEW: 'bg-emerald-100 text-emerald-700',
  OFFER: 'bg-violet-100 text-violet-700',
  REJECTED: 'bg-red-100 text-red-600',
  ARCHIVED: 'bg-secondary text-muted-foreground/60',
}

export const ALL_STATUSES = [
  { value: 'SENT', label: 'Envoyée' },
  { value: 'FOLLOW_UP', label: 'À relancer' },
  { value: 'INTERVIEW', label: 'Entretien' },
  { value: 'OFFER', label: 'Offre' },
  { value: 'REJECTED', label: 'Refusé' },
  { value: 'ARCHIVED', label: 'Archivée' },
]

export interface ApplicationFormData {
  company: string
  position: string
  location?: string
  url?: string
  salary?: string
  status?: string
  appliedAt?: string
  notes?: string
  contactName?: string
  contactEmail?: string
}

interface FetchOptions {
  status?: string
  search?: string
  page?: number
  limit?: number
  sortBy?: 'appliedAt' | 'company' | 'status'
  sortOrder?: 'asc' | 'desc'
}

export function fetchApplications(opts: FetchOptions = {}) {
  const params = new URLSearchParams()
  if (opts.status) params.set('status', opts.status)
  if (opts.search) params.set('search', opts.search)
  if (opts.page) params.set('page', String(opts.page))
  if (opts.limit) params.set('limit', String(opts.limit))
  if (opts.sortBy) params.set('sortBy', opts.sortBy)
  if (opts.sortOrder) params.set('sortOrder', opts.sortOrder)
  const qs = params.toString()
  return api.get<PaginatedApplications>(`/applications${qs ? `?${qs}` : ''}`)
}

export function fetchApplication(id: string) {
  return api.get<ApplicationDetail>(`/applications/${id}`)
}

export function createApplication(data: ApplicationFormData) {
  return api.post<Application>('/applications', data)
}

export function updateApplication(id: string, data: Partial<ApplicationFormData>) {
  return api.patch<Application>(`/applications/${id}`, data)
}

export function updateApplicationStatus(id: string, status: string, note?: string) {
  return api.patch<Application>(`/applications/${id}/status`, { status, note })
}

export function deleteApplication(id: string) {
  return api.delete<void>(`/applications/${id}`)
}
