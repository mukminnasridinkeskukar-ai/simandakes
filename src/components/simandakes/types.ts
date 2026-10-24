// =============================================================
// types.ts — Shared types per API contract (worklog.md Task ID: 1)
// =============================================================

export type NakesStatus = 'aktif' | 'nonaktif' | 'cuti' | 'keluar';
export type InstitusiTipe = 'RS' | 'Puskesmas' | 'Klinik' | 'Apotek' | 'Lainnya';
export type UserRole = 'admin' | 'operator' | 'viewer';

export type UserStatus = 'aktif' | 'nonaktif' | 'suspended';

export interface Nakes {
  id: string;
  nama: string;
  /** One of JENIS_OPTIONS (exact enum value) */
  jenis: string;
  spesialisasi: string | null;
  str: string | null;
  sip: string | null;
  alamatPraktik: string | null;
  jadwalPraktik: string | null;
  /** Daftar layanan praktik mandiri — item dipisah baris baru/koma/titik-koma */
  daftarLayanan: string | null;
  status: NakesStatus;
  fotoUrl: string | null;
  alamatGoogleMaps: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InstitusiNamed {
  id: string;
  nama: string;
  tipe: InstitusiTipe;
  dokter: number;
  dokterGigi: number;
  createdAt: string;
  updatedAt: string;
}

export interface InstitusiNakes {
  id: string;
  nama: string;
  tipe: InstitusiTipe;
  perawat: number;
  bidan: number;
  apoteker: number;
  lainnya: number;
  createdAt: string;
  updatedAt: string;
}

export interface AppUser {
  id: string;
  username: string;
  namaLengkap: string;
  role: UserRole;
  email: string | null;
  status: UserStatus;
  createdAt: string;
}

export interface Stats {
  totalNakes: number;
  aktifNakes: number;
  /** key = exact jenis value (JENIS_OPTIONS) */
  perJenis: Record<string, number>;
  totalDokterNamed: number;
  totalDokterGigiNamed: number;
  totalInstitusiNamed: number;
  totalPerawat: number;
  totalBidan: number;
  totalApoteker: number;
  totalLainnya: number;
  totalInstitusiNakes: number;
}

/** The 16 dashboard views */
export type ViewId =
  | 'named'
  | 'nakes'
  | 'cari-dokter-spesialis'
  | 'cari-dokter-gigi-spesialis'
  | 'cari-dokter'
  | 'cari-dokter-gigi'
  | 'cari-bidan'
  | 'cari-perawat'
  | 'cari-apoteker'
  | 'cari-fisioterapis'
  | 'cari-psikolog-klinis'
  | 'cari-terapis-wicara'
  | 'cari-okupasi-terapis'
  | 'cari-terapis-gigi-mulut'
  | 'cari-praktik'
  | 'admin-dashboard';

/** The 13 enum values of Nakes.jenis (exact, per contract) */
export const JENIS_OPTIONS = [
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
] as const;

export type NakesJenis = (typeof JENIS_OPTIONS)[number];

export const TIPE_OPTIONS: readonly InstitusiTipe[] = ['RS', 'Puskesmas', 'Klinik', 'Apotek', 'Lainnya'];

export const STATUS_OPTIONS: readonly NakesStatus[] = ['aktif', 'nonaktif', 'cuti', 'keluar'];

export const ROLE_OPTIONS: readonly UserRole[] = ['admin', 'operator', 'viewer'];

// ---------- Request payload types ----------

export type NakesInput = Omit<Nakes, 'id' | 'createdAt' | 'updatedAt'>;

export type InstitusiNamedInput = Omit<InstitusiNamed, 'id' | 'createdAt' | 'updatedAt'>;

export type InstitusiNakesInput = Omit<InstitusiNakes, 'id' | 'createdAt' | 'updatedAt'>;

export interface UserCreateInput {
  username: string;
  password: string;
  namaLengkap: string;
  role: UserRole;
  email?: string | null;
}

export interface UserUpdateInput {
  namaLengkap: string;
  role: UserRole;
  email?: string | null;
  password?: string;
}
