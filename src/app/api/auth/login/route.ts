import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  createSessionCookieValue,
  verifyPassword,
} from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Body harus berformat JSON yang valid' }, { status: 400 })
    }

    const { username, password } = (body ?? {}) as {
      username?: unknown
      password?: unknown
    }

    if (typeof username !== 'string' || !username.trim()) {
      return NextResponse.json({ error: 'Username wajib diisi' }, { status: 400 })
    }
    if (typeof password !== 'string' || !password) {
      return NextResponse.json({ error: 'Password wajib diisi' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { username: username.trim() },
    })

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { error: 'Username atau password salah' },
        { status: 401 }
      )
    }

    if (user.status !== 'aktif') {
      return NextResponse.json(
        { error: 'Akun tidak aktif. Hubungi administrator.' },
        { status: 401 }
      )
    }

    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    const cookieValue = createSessionCookieValue({
      u: user.username,
      r: user.role,
      n: user.namaLengkap,
    })

    const response = NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        namaLengkap: user.namaLengkap,
        role: user.role,
        email: user.email,
        status: user.status,
        createdAt: user.createdAt,
      },
    })

    response.cookies.set(SESSION_COOKIE_NAME, cookieValue, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    })

    return response
  } catch (error) {
    console.error('[POST /api/auth/login]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
