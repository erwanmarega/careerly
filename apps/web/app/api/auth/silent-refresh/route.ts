import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export async function GET(req: NextRequest) {
  const refreshToken = req.cookies.get('refresh_token')?.value
  const redirect = req.nextUrl.searchParams.get('redirect') ?? '/dashboard'

  if (!refreshToken) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${refreshToken}` },
  })

  if (!res.ok) {
    const response = NextResponse.redirect(new URL('/login', req.url))
    response.cookies.set('refresh_token', '', { maxAge: 0, path: '/' })
    return response
  }

  const json = await res.json()
  const tokens = json.data as { accessToken: string; refreshToken: string }

  const response = NextResponse.redirect(new URL(redirect, req.url))

  response.cookies.set('access_token', encodeURIComponent(tokens.accessToken), {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60,
    path: '/',
  })

  response.cookies.set('refresh_token', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  })

  return response
}
