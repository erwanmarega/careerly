export type ApplicationStatus =
  | 'SENT'
  | 'FOLLOW_UP'
  | 'INTERVIEW'
  | 'OFFER'
  | 'REJECTED'
  | 'ARCHIVED'

export interface StatusHistory {
  id: string
  status: ApplicationStatus
  changedAt: string
  note: string | null
  applicationId: string
}

export interface Application {
  id: string
  company: string
  position: string
  location: string | null
  url: string | null
  salary: string | null
  status: ApplicationStatus
  appliedAt: string
  notes: string | null
  contactName: string | null
  contactEmail: string | null
  createdAt: string
  updatedAt: string
  userId: string
  statusHistory?: StatusHistory[]
}

export interface CreateApplicationPayload {
  company: string
  position: string
  location?: string
  url?: string
  salary?: string
  status?: ApplicationStatus
  appliedAt?: string
  notes?: string
  contactName?: string
  contactEmail?: string
}

export interface UpdateApplicationPayload extends Partial<CreateApplicationPayload> {}

export interface PaginatedApplications {
  data: Application[]
  total: number
  page: number
  limit: number
}

export interface ApplicationFilters {
  status?: ApplicationStatus
  search?: string
  page?: number
  limit?: number
}
