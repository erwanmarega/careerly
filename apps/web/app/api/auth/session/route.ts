import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { refreshToken } = await req.json()
  const res = NextResponse.json({ ok: true })
  res.cookies.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set('refresh_token', '', { maxAge: 0, path: '/' })
  return res
}
