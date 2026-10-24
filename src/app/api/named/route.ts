import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { coerceTipe, parseJsonBody, toNonNegativeInt, toNullableString } from '../_helpers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/named?search= — institusi Named (dokter/dokterGigi per institusi).
 * Search matches nama/tipe. Ordered by nama asc. → { data: InstitusiNamed[] }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.trim() ?? ''

    const where: Prisma.InstitusiNamedWhereInput = {}
    if (search) {
      // SQLite LIKE is case-insensitive for ASCII.
      const q = `%${search}%`
      where.OR = [{ nama: { contains: q } }, { tipe: { contains: q } }]
    }

    const data = await db.institusiNamed.findMany({
      where,
      orderBy: { nama: 'asc' },
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[GET /api/named]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** POST /api/named (AUTH) — create institusi Named. */
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

    const nama = toNullableString(body.nama)
    if (!nama) {
      return NextResponse.json({ error: 'Nama institusi wajib diisi' }, { status: 400 })
    }

    const data = await db.institusiNamed.create({
      data: {
        nama,
        tipe: coerceTipe(body.tipe),
        dokter: toNonNegativeInt(body.dokter),
        dokterGigi: toNonNegativeInt(body.dokterGigi),
      },
    })

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/named]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
