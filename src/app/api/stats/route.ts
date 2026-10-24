import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** GET /api/stats — all dashboard counts in one payload. */
export async function GET() {
  try {
    const [jenisGroups, statusGroups, namedRows, nakesInstRows] = await Promise.all([
      db.dataNakes.groupBy({ by: ['jenis'], _count: { _all: true } }),
      db.dataNakes.groupBy({ by: ['status'], _count: { _all: true } }),
      db.institusiNamed.findMany({ select: { dokter: true, dokterGigi: true } }),
      db.institusiNakes.findMany({
        select: { perawat: true, bidan: true, apoteker: true, lainnya: true },
      }),
    ])

    const perJenis: Record<string, number> = {}
    for (const g of jenisGroups) {
      perJenis[g.jenis] = g._count._all
    }

    const aktifNakes =
      statusGroups.find((g) => g.status === 'aktif')?._count._all ?? 0

    const stats = {
      totalNakes: jenisGroups.reduce((acc, g) => acc + g._count._all, 0),
      aktifNakes,
      perJenis,

      totalDokterNamed: namedRows.reduce((acc, r) => acc + r.dokter, 0),
      totalDokterGigiNamed: namedRows.reduce((acc, r) => acc + r.dokterGigi, 0),
      totalInstitusiNamed: namedRows.length,

      totalPerawat: nakesInstRows.reduce((acc, r) => acc + r.perawat, 0),
      totalBidan: nakesInstRows.reduce((acc, r) => acc + r.bidan, 0),
      totalApoteker: nakesInstRows.reduce((acc, r) => acc + r.apoteker, 0),
      totalLainnya: nakesInstRows.reduce((acc, r) => acc + r.lainnya, 0),
      totalInstitusiNakes: nakesInstRows.length,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('[GET /api/stats]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
