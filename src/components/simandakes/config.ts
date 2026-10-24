// =============================================================
// config.ts — Konfigurasi global modul SIMANDAKES
// =============================================================

/**
 * URL platform e-Simantri (tujuan tombol "Daftar ke Praktik Mandiri").
 * Ubah nilai di sini bila URL resmi platform berubah.
 */
export const ESIMANTRI_URL = 'https://simantri.kemkes.go.id';

export const ESIMANTRI_LABEL = 'e-Simantri';

/**
 * Daftar layanan disimpan sebagai satu string di database, item dipisah
 * baris baru, koma, atau titik-koma. Helper ini menormalkan ke array.
 */
export function parseDaftarLayanan(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    // handle: literal "\n" (backslash-n), real newline, semicolon, bullet
    .split(/\\n|\r?\n|;|\u2022/)
    .flatMap((line) => line.split(','))
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
