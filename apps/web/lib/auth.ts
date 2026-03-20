import { api } from './api'

export interface AuthUser {
  id: string
  email: string
  name: string | null
  plan: string
  role: 'STUDENT' | 'SCHOOL_ADMIN'
  schoolId: string | null
  avatar: string | null
  onboardingCompleted?: boolean
}

interface AuthResponse {
  tokens: { accessToken: string; refreshToken: string }
  user: AuthUser
}

export async function setTokens(accessToken: string, refreshToken: string) {
  document.cookie = `access_token=${encodeURIComponent(accessToken)}; path=/; max-age=${15 * 60}; SameSite=Lax`
  await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
}

export async function clearTokens() {
  document.cookie = 'access_token=; path=/; max-age=0'
  document.cookie = 'user_role=; path=/; max-age=0'
  await fetch('/api/auth/session', { method: 'DELETE' })
  localStorage.removeItem('postulo_user')
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('postulo_user')
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

export function storeUser(user: AuthUser) {
  localStorage.setItem('postulo_user', JSON.stringify(user))
  document.cookie = `user_role=${user.role ?? 'STUDENT'}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`
}

export async function login(email: string, password: string) {
  const data = await api.post<AuthResponse>('/auth/login', { email, password })
  await setTokens(data.tokens.accessToken, data.tokens.refreshToken)
  storeUser(data.user)
  return data.user
}

export async function register(email: string, password: string, name: string) {
  const data = await api.post<AuthResponse>('/auth/register', { email, password, name })
  await setTokens(data.tokens.accessToken, data.tokens.refreshToken)
  storeUser(data.user)
  return data.user
}

export async function completeOnboarding() {
  const user = await api.patch<AuthUser>('/users/me/onboarding', {})
  storeUser(user)
  return user
}

export async function logout() {
  try {
    await api.post('/auth/logout', {})
  } finally {
    await clearTokens()
  }
}
