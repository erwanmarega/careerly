const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

function getToken(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|; )access_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

interface ApiResponse<T> {
  success: boolean
  data: T
}

let refreshPromise: Promise<boolean> | null = null

async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise
  refreshPromise = fetch('/api/auth/refresh', { method: 'POST' })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      refreshPromise = null
    })
  return refreshPromise
}

function clearClientAuth() {
  document.cookie = 'access_token=; path=/; max-age=0'
  document.cookie = 'user_role=; path=/; max-age=0'
  localStorage.removeItem('postulo_user')
}

async function parseResponse<T>(res: Response): Promise<T> {
  const text = await res.text()
  const json = (text ? JSON.parse(text) : { success: true, data: undefined }) as
    | ApiResponse<T>
    | { success: false; message: string }

  if (!res.ok) {
    const msg = (json as { message?: string }).message ?? 'Une erreur est survenue'
    throw new Error(Array.isArray(msg) ? msg[0] : msg)
  }

  return (json as ApiResponse<T>).data
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (res.status === 401) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      const newToken = getToken()
      const retry = await fetch(`${API_URL}${path}`, {
        ...options,
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
          ...options.headers,
        },
      })
      return parseResponse<T>(retry)
    }
    clearClientAuth()
    window.location.href = '/login'
    throw new Error('Session expirée')
  }

  return parseResponse<T>(res)
}

async function upload<T>(path: string, formData: FormData): Promise<T> {
  const token = getToken()

  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    cache: 'no-store',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  if (res.status === 401) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      const newToken = getToken()
      const retry = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        cache: 'no-store',
        headers: newToken ? { Authorization: `Bearer ${newToken}` } : {},
        body: formData,
      })
      return parseResponse<T>(retry)
    }
    clearClientAuth()
    window.location.href = '/login'
    throw new Error('Session expirée')
  }

  return parseResponse<T>(res)
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  upload: <T>(path: string, formData: FormData) => upload<T>(path, formData),
}
