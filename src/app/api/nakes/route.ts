import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import {
  NAKES_JENIS,
  NAKES_STATUS,
  coerceJenis,
  coerceNakesStatus,
  parseJsonBody,
  toNullableString,
} from '../_helpers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/nakes?search=&jenis=&status=
 * - search: contains (SQLite LIKE → case-insensitive for ASCII) across
 *   nama / spesialisasi / alamatPraktik
 * - jenis: comma-separated exact values (e.g. `Dokter,Dokter Spesialis`)
 * - status: exact aktif|nonaktif|cuti|keluar (omit = all)
 * Ordered by nama asc. → { data: Nakes[] }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.trim() ?? ''
    const jenisParam = searchParams.get('jenis')?.trim() ?? ''
    const statusParam = searchParams.get('status')?.trim() ?? ''

    const where: Prisma.DataNakesWhereInput = {}

    if (search) {
      // SQLite LIKE is case-insensitive for ASCII → plain contains is enough.
      const q = `%${search}%`
      where.OR = [
        { nama: { contains: q } },
        { spesialisasi: { contains: q } },
        { alamatPraktik: { contains: q } },
      ]
    }

    if (jenisParam) {
      const jenisList = jenisParam
        .split(',')
        .map((j) => j.trim())
        .filter((j) => (NAKES_JENIS as readonly string[]).includes(j))
      if (jenisList.length > 0) {
        where.jenis = { in: jenisList }
      }
    }

    if (statusParam) {
      if ((NAKES_STATUS as readonly string[]).includes(statusParam)) {
        where.status = statusParam
      }
    }

    const data = await db.dataNakes.findMany({
      where,
      orderBy: { nama: 'asc' },
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[GET /api/nakes]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** POST /api/nakes (AUTH) — create a new tenaga kesehatan record. */
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
      return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 })
    }

    const jenisInput = body.jenis
    if (typeof jenisInput !== 'string' || !jenisInput.trim()) {
      return NextResponse.json({ error: 'Jenis wajib diisi' }, { status: 400 })
    }
    const jenis = coerceJenis(jenisInput)
    const status = coerceNakesStatus(body.status)

    const data = await db.dataNakes.create({
      data: {
        nama,
        jenis,
        status,
        spesialisasi: toNullableString(body.spesialisasi),
        str: toNullableString(body.str),
        sip: toNullableString(body.sip),
        alamatPraktik: toNullableString(body.alamatPraktik),
        jadwalPraktik: toNullableString(body.jadwalPraktik),
        noTelepon: toNullableString(body.noTelepon),
        email: toNullableString(body.email),
        fotoUrl: toNullableString(body.fotoUrl),
        alamatGoogleMaps: toNullableString(body.alamatGoogleMaps),
      },
    })

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/nakes]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
