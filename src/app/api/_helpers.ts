/**
 * Shared validation / coercion helpers for SIMANDAKES API routes.
 * This file is NOT a route handler — only route.ts files are routed.
 */

export const NAKES_JENIS = [
  'Dokter Spesialis',
  'Dokter Gigi Spesialis',
  'Dokter',
  'Dokter Gigi',
  'Bidan',
  'Perawat',
  'Apoteker',
  'Fisioterapis',
  'Psikolog Klinis',
  'Terapis Wicara',
  'Okupasi Terapis',
  'Terapis Gigi dan Mulut',
  'Tenaga Kesehatan Lainnya',
] as const

export const NAKES_STATUS = ['aktif', 'nonaktif', 'cuti', 'keluar'] as const

export const INSTITUSI_TIPE = ['RS', 'Puskesmas', 'Klinik', 'Apotek', 'Lainnya'] as const

export const USER_ROLES = ['admin', 'operator', 'viewer'] as const
export const USER_STATUS = ['aktif', 'nonaktif', 'suspended'] as const

export type NakesJenis = (typeof NAKES_JENIS)[number]
export type NakesStatusValue = (typeof NAKES_STATUS)[number]
export type InstitusiTipeValue = (typeof INSTITUSI_TIPE)[number]
export type UserRoleValue = (typeof USER_ROLES)[number]

/** Keeps a value only if it is a string; empty string → null. */
export function toNullableString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

/** Optional string — undefined stays undefined (don't touch the column). */
export function toOptionalString(value: unknown): string | undefined | null {
  if (value === undefined) return undefined
  return toNullableString(value)
}

/** Coerces to a valid jenis; falls back to 'Tenaga Kesehatan Lainnya'. */
export function coerceJenis(value: unknown): NakesJenis {
  return (NAKES_JENIS as readonly string[]).includes(String(value))
    ? (value as NakesJenis)
    : 'Tenaga Kesehatan Lainnya'
}

/** Coerces to a valid nakes status; falls back to 'aktif'. */
export function coerceNakesStatus(value: unknown): NakesStatusValue {
  return (NAKES_STATUS as readonly string[]).includes(String(value))
    ? (value as NakesStatusValue)
    : 'aktif'
}

/** Coerces to a valid institusi tipe; falls back to 'Lainnya'. */
export function coerceTipe(value: unknown): InstitusiTipeValue {
  return (INSTITUSI_TIPE as readonly string[]).includes(String(value))
    ? (value as InstitusiTipeValue)
    : 'Lainnya'
}

/** Coerces to a non-negative integer; null/invalid → 0. */
export function toNonNegativeInt(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.round(value))
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return Math.max(0, Math.round(parsed))
  }
  return 0
}

/** Safe string body parse — returns null when the body is not valid JSON. */
export async function parseJsonBody(
  request: Request
): Promise<Record<string, unknown> | null> {
  try {
    const parsed = await request.json()
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
    return null
  } catch {
    return null
  }
}
