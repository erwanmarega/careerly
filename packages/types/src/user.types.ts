export type Plan = 'FREE' | 'PRO' | 'PREMIUM'
export type Role = 'STUDENT' | 'SCHOOL_ADMIN'

export interface School {
  id: string
  name: string
  inviteCode: string
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  email: string
  name: string | null
  avatar: string | null
  plan: Plan
  role: Role
  schoolId: string | null
  schoolRemovedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface UserProfile extends User {
  stripeCustomerId?: string | null
}

export interface StudentSummary {
  id: string
  name: string | null
  email: string
  avatar: string | null
  applicationCount: number
  lastApplicationAt: string | null
  statusBreakdown: Record<string, number>
  hasOffer: boolean
  createdAt: string
}
