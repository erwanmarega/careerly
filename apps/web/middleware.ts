import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/privacy', '/terms', '/callback', '/privacy-extension']
const AUTH_PATHS = ['/login', '/register']
const STUDENT_ONLY_PREFIXES = ['/dashboard', '/applications', '/stats', '/reminders', '/settings', '/documents', '/onboarding']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('access_token')?.value
  const role = request.cookies.get('user_role')?.value
  const isAdmin = role === 'SCHOOL_ADMIN'

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p)
  const isAuthPath = AUTH_PATHS.some((p) => pathname === p)
  const isAdminPath = pathname.startsWith('/admin')
  const isStudentPath = STUDENT_ONLY_PREFIXES.some((p) => pathname.startsWith(p))

  if (!token && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (token && isAuthPath) {
    return NextResponse.redirect(new URL(isAdmin ? '/admin/dashboard' : '/dashboard', request.url))
  }

  if (token && isAdmin && isStudentPath) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  if (token && !isAdmin && isAdminPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
