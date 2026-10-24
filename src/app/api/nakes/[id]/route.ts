import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import {
  coerceJenis,
  coerceNakesStatus,
  parseJsonBody,
  toNullableString,
  toOptionalString,
} from '../../_helpers'

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ id: string }> }

/** GET /api/nakes/[id] → { data: Nakes } */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const data = await db.dataNakes.findUnique({ where: { id } })
    if (!data) {
      return NextResponse.json({ error: 'Data nakes tidak ditemukan' }, { status: 404 })
    }
    return NextResponse.json({ data })
  } catch (error) {
    console.error('[GET /api/nakes/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** PUT /api/nakes/[id] (AUTH) — partial update. */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const existing = await db.dataNakes.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Data nakes tidak ditemukan' }, { status: 404 })
    }

    const body = await parseJsonBody(request)
    if (!body) {
      return NextResponse.json({ error: 'Body harus berformat JSON yang valid' }, { status: 400 })
    }

    const update: Record<string, unknown> = {}

    if ('nama' in body) {
      const nama = toNullableString(body.nama)
      if (!nama) {
        return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 })
      }
      update.nama = nama
    }
    if ('jenis' in body) {
      if (typeof body.jenis !== 'string' || !body.jenis.trim()) {
        return NextResponse.json({ error: 'Jenis wajib diisi' }, { status: 400 })
      }
      update.jenis = coerceJenis(body.jenis)
    }
    if ('status' in body) {
      update.status = coerceNakesStatus(body.status)
    }

    const optionalFields = [
      'spesialisasi',
      'str',
      'sip',
      'alamatPraktik',
      'jadwalPraktik',
      'daftarLayanan',
      'fotoUrl',
      'alamatGoogleMaps',
    ] as const
    for (const field of optionalFields) {
      if (field in body) {
        update[field] = toOptionalString(body[field])
      }
    }

    const data = await db.dataNakes.update({
      where: { id },
      data: update,
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[PUT /api/nakes/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** DELETE /api/nakes/[id] (AUTH). */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const existing = await db.dataNakes.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Data nakes tidak ditemukan' }, { status: 404 })
    }

    await db.dataNakes.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/nakes/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
