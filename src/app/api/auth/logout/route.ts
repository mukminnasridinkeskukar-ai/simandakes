import { NextResponse } from 'next/server'
import { SESSION_COOKIE_NAME } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const response = NextResponse.json({ success: true })
    response.cookies.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })
    return response
  } catch (error) {
    console.error('[POST /api/auth/logout]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
