import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, requireAuth } from '@/lib/auth'
import { USER_ROLES, USER_STATUS, parseJsonBody, toNullableString } from '../_helpers'

export const dynamic = 'force-dynamic'

/** GET /api/users (AUTH) — list users without passwordHash. */
export async function GET() {
  try {
    const auth = await requireAuth()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const users = await db.user.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        username: true,
        namaLengkap: true,
        role: true,
        email: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ data: users })
  } catch (error) {
    console.error('[GET /api/users]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** POST /api/users (AUTH) — create user. */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await parseJsonBody(request)
    if (!body) {
      return NextResponse.json({ error: 'Body harus berformat JSON yang valid' }, { status: 400 })
    }

    const username = toNullableString(body.username)
    if (!username) {
      return NextResponse.json({ error: 'Username wajib diisi' }, { status: 400 })
    }
    if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
      return NextResponse.json(
        { error: 'Username hanya boleh berisi huruf, angka, titik, garis bawah, dan tanda hubung' },
        { status: 400 }
      )
    }

    const password = body.password
    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password minimal 6 karakter' },
        { status: 400 }
      )
    }

    const namaLengkap = toNullableString(body.namaLengkap)
    if (!namaLengkap) {
      return NextResponse.json({ error: 'Nama lengkap wajib diisi' }, { status: 400 })
    }

    if (typeof body.role !== 'string' || !(USER_ROLES as readonly string[]).includes(body.role)) {
      return NextResponse.json(
        { error: 'Role harus salah satu dari: admin, operator, viewer' },
        { status: 400 }
      )
    }

    let status = 'aktif'
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
      status = body.status
    }

    const duplicate = await db.user.findUnique({ where: { username } })
    if (duplicate) {
      return NextResponse.json(
        { error: 'Username sudah digunakan' },
        { status: 409 }
      )
    }

    const user = await db.user.create({
      data: {
        username,
        passwordHash: hashPassword(password),
        namaLengkap,
        role: body.role,
        email: toNullableString(body.email),
        status,
      },
      select: {
        id: true,
        username: true,
        namaLengkap: true,
        role: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ data: user }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/users]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
