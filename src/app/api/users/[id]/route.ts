import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, requireAuth } from '@/lib/auth'
import { USER_ROLES, USER_STATUS, parseJsonBody, toNullableString } from '../../_helpers'

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ id: string }> }

const USER_SELECT = {
  id: true,
  username: true,
  namaLengkap: true,
  role: true,
  email: true,
  status: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} as const

/** PUT /api/users/[id] (AUTH) — update user; password optional (re-hash). */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const existing = await db.user.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    const body = await parseJsonBody(request)
    if (!body) {
      return NextResponse.json({ error: 'Body harus berformat JSON yang valid' }, { status: 400 })
    }

    const update: Record<string, unknown> = {}

    // Username is immutable — reject any attempt to change it.
    if ('username' in body) {
      const nextUsername = toNullableString(body.username)
      if (!nextUsername || nextUsername !== existing.username) {
        return NextResponse.json(
          { error: 'Username tidak dapat diubah' },
          { status: 400 }
        )
      }
    }

    if ('password' in body) {
      if (typeof body.password !== 'string' || body.password.length < 6) {
        return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 })
      }
      update.passwordHash = hashPassword(body.password)
    }

    if ('namaLengkap' in body) {
      const namaLengkap = toNullableString(body.namaLengkap)
      if (!namaLengkap) {
        return NextResponse.json({ error: 'Nama lengkap wajib diisi' }, { status: 400 })
      }
      update.namaLengkap = namaLengkap
    }

    if ('role' in body) {
      if (typeof body.role !== 'string' || !(USER_ROLES as readonly string[]).includes(body.role)) {
        return NextResponse.json(
          { error: 'Role harus salah satu dari: admin, operator, viewer' },
          { status: 400 }
        )
      }
      update.role = body.role
    }

    if ('status' in body) {
      if (
        typeof body.status !== 'string' ||
        !(USER_STATUS as readonly string[]).includes(body.status)
      ) {
        return NextResponse.json(
          { error: 'Status harus salah satu dari: aktif, nonaktif, suspended' },
          { status: 400 }
        )
      }
      // Guard: don't allow demoting the last active admin into a non-active state.
      if (
        existing.role === 'admin' &&
        body.status !== 'aktif' &&
        (await countActiveAdminsExcluding(existing.id)) === 0
      ) {
        return NextResponse.json(
          { error: 'Tidak dapat mengubah status admin terakhir' },
          { status: 400 }
        )
      }
      update.status = body.status
    }

    if ('email' in body) {
      update.email = toNullableString(body.email)
    }

    const data = await db.user.update({
      where: { id },
      data: update,
      select: USER_SELECT,
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[PUT /api/users/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** DELETE /api/users/[id] (AUTH) — cannot delete self or the last admin. */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const existing = await db.user.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    if (existing.username === auth.username) {
      return NextResponse.json(
        { error: 'Tidak dapat menghapus akun sendiri' },
        { status: 400 }
      )
    }

    if (existing.role === 'admin') {
      const adminCount = await db.user.count({ where: { role: 'admin' } })
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Tidak dapat menghapus admin terakhir' },
          { status: 400 }
        )
      }
    }

    await db.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/users/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function countActiveAdminsExcluding(userId: string): Promise<number> {
  return db.user.count({
    where: { role: 'admin', status: 'aktif', NOT: { id: userId } },
  })
}
