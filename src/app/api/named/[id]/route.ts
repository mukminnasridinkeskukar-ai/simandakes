import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { coerceTipe, parseJsonBody, toNonNegativeInt, toNullableString } from '../../_helpers'

export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ id: string }> }

/** PUT /api/named/[id] (AUTH) — partial update. */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const existing = await db.institusiNamed.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Institusi tidak ditemukan' }, { status: 404 })
    }

    const body = await parseJsonBody(request)
    if (!body) {
      return NextResponse.json({ error: 'Body harus berformat JSON yang valid' }, { status: 400 })
    }

    const update: Record<string, unknown> = {}
    if ('nama' in body) {
      const nama = toNullableString(body.nama)
      if (!nama) {
        return NextResponse.json({ error: 'Nama institusi wajib diisi' }, { status: 400 })
      }
      update.nama = nama
    }
    if ('tipe' in body) update.tipe = coerceTipe(body.tipe)
    if ('dokter' in body) update.dokter = toNonNegativeInt(body.dokter)
    if ('dokterGigi' in body) update.dokterGigi = toNonNegativeInt(body.dokterGigi)

    const data = await db.institusiNamed.update({ where: { id }, data: update })
    return NextResponse.json({ data })
  } catch (error) {
    console.error('[PUT /api/named/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** DELETE /api/named/[id] (AUTH). */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const existing = await db.institusiNamed.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Institusi tidak ditemukan' }, { status: 404 })
    }

    await db.institusiNamed.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/named/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
