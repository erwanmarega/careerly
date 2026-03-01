export type Plan = 'FREE' | 'PRO' | 'PREMIUM'

export interface User {
  id: string
  email: string
  name: string | null
  avatar: string | null
  plan: Plan
  createdAt: string
  updatedAt: string
}

export interface UserProfile extends User {
  stripeCustomerId?: string | null
}
