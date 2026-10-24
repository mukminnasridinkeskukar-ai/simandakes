import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * Returns the fresh AppUser (from DB) for the current session cookie,
 * or { user: null } when there is no session / the user no longer exists
 * or is inactive.
 */
export async function GET() {
  try {
    const session = await getSessionUser()
    if (!session) {
      return NextResponse.json({ user: null })
    }

    const user = await db.user.findUnique({
      where: { username: session.username },
    })

    if (!user || user.status !== 'aktif') {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({
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
  } catch (error) {
    console.error('[GET /api/auth/session]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
