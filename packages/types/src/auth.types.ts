export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface RegisterPayload {
  email: string
  password: string
  name?: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface AuthResponse {
  tokens: AuthTokens
  user: {
    id: string
    email: string
    name: string | null
    plan: string
  }
}
