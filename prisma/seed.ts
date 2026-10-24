/**
 * SIMANDAKES seed script (idempotent).
 *
 * - Users: upsert by username (admin/operator with hashed passwords).
 * - Data tables (dataNakes, institusiNamed, institusiNakes):
 *   deleteMany + createMany from the original backend migration
 *   (backend/migrations/0001_init_schema.sql sections 9, 10, 11).
 *
 * Run: bun prisma/seed.ts
 */
import { randomBytes, scryptSync } from 'crypto'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/** Same format as src/lib/auth.ts hashPassword: "salt:hash" (hex, scrypt, 64-byte key). */
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

// ---------------------------------------------------------------------------
// Sample data — copied from backend/migrations/0001_init_schema.sql (v2.1)
// ---------------------------------------------------------------------------

const dataNakesSeed = [
  // Dokter Spesialis
  { nama: 'dr. Ahmad Fauzi, Sp.PD', jenis: 'Dokter Spesialis', spesialisasi: 'Penyakit Dalam', str: 'STR-001', sip: 'SIP-001', alamatPraktik: 'Jl. Merdeka No. 10, Jakarta Pusat', jadwalPraktik: 'Senin-Jumat 08:00-14:00', noTelepon: '081234567001', email: 'ahmad.fauzi@simandakes.id', status: 'aktif', alamatGoogleMaps: 'https://www.google.com/maps?q=Jl+Merdeka+10+Jakarta' },
  { nama: 'dr. Siti Aminah, Sp.A', jenis: 'Dokter Spesialis', spesialisasi: 'Anak', str: 'STR-002', sip: 'SIP-002', alamatPraktik: 'Jl. Sudirman No. 25, Jakarta Selatan', jadwalPraktik: 'Senin-Sabtu 09:00-15:00', noTelepon: '081234567002', email: 'siti.aminah@simandakes.id', status: 'aktif', alamatGoogleMaps: 'https://www.google.com/maps?q=Jl+Sudirman+25+Jakarta' },
  { nama: 'dr. Bambang Sutrisno, Sp.B', jenis: 'Dokter Spesialis', spesialisasi: 'Bedah', str: 'STR-003', sip: 'SIP-003', alamatPraktik: 'Jl. Pahlawan No. 5, Bandung', jadwalPraktik: 'Senin-Jumat 10:00-16:00', noTelepon: '081234567003', email: 'bambang.s@simandakes.id', status: 'aktif', alamatGoogleMaps: 'https://www.google.com/maps?q=Jl+Pahlawan+5+Bandung' },
  // Dokter Gigi Spesialis
  { nama: 'drg. Dewi Saraswati, Sp.Ort', jenis: 'Dokter Gigi Spesialis', spesialisasi: 'Ortodonsia', str: 'STR-004', sip: 'SIP-004', alamatPraktik: 'Jl. Diponegoro No. 8, Surabaya', jadwalPraktik: 'Senin-Jumat 09:00-17:00', noTelepon: '081234567004', email: 'dewi.s@dgsimandakes.id', status: 'aktif', alamatGoogleMaps: 'https://www.google.com/maps?q=Jl+Diponegoro+8+Surabaya' },
  { nama: 'drg. Hendra Kusuma, Sp.Pros', jenis: 'Dokter Gigi Spesialis', spesialisasi: 'Prostodonsia', str: 'STR-005', sip: 'SIP-005', alamatPraktik: 'Jl. Gatot Subroto No. 12, Bandung', jadwalPraktik: 'Selasa-Sabtu 10:00-18:00', noTelepon: '081234567005', email: 'hendra.k@dgsimandakes.id', status: 'aktif', alamatGoogleMaps: 'https://www.google.com/maps?q=Jl+Gatot+Subroto+12+Bandung' },
  // Dokter Umum
  { nama: 'dr. Rina Wati', jenis: 'Dokter', spesialisasi: 'Umum', str: 'STR-006', sip: 'SIP-006', alamatPraktik: 'Jl. Kartini No. 22, Semarang', jadwalPraktik: 'Senin-Jumat 08:00-14:00', noTelepon: '081234567006', email: 'rina.wati@simandakes.id', status: 'aktif', alamatGoogleMaps: 'https://www.google.com/maps?q=Jl+Kartini+22+Semarang' },
  { nama: 'dr. Joko Susilo', jenis: 'Dokter', spesialisasi: 'Umum', str: 'STR-007', sip: 'SIP-007', alamatPraktik: 'Jl. Ahmad Yani No. 19, Malang', jadwalPraktik: 'Setiap hari 08:00-20:00', noTelepon: '081234567007', email: 'joko.susilo@simandakes.id', status: 'aktif', alamatGoogleMaps: 'https://www.google.com/maps?q=Jl+Ahmad+Yani+19+Malang' },
  // Dokter Gigi Umum
  { nama: 'drg. Budi Hartono', jenis: 'Dokter Gigi', spesialisasi: 'Umum', str: 'STR-008', sip: 'SIP-008', alamatPraktik: 'Jl. Pemuda No. 33, Medan', jadwalPraktik: 'Senin-Sabtu 09:00-15:00', noTelepon: '081234567008', email: 'budi.hartono@simandakes.id', status: 'aktif', alamatGoogleMaps: 'https://www.google.com/maps?q=Jl+Pemuda+33+Medan' },
  // Bidan
  { nama: 'Bidan Aisyah Putri, S.Keb', jenis: 'Bidan', spesialisasi: 'Kebidanan', str: 'STR-009', sip: 'SIP-009', alamatPraktik: 'Jl. Diponegoro No. 15, Surabaya', jadwalPraktik: 'Setiap hari 08:00-20:00', noTelepon: '081234567009', email: 'aisyah.putri@simandakes.id', status: 'aktif', alamatGoogleMaps: 'https://www.google.com/maps?q=Jl+Diponegoro+15+Surabaya' },
  { nama: 'Bidan Fatimah Zahra, S.Keb', jenis: 'Bidan', spesialisasi: 'Kebidanan', str: 'STR-010', sip: 'SIP-010', alamatPraktik: 'Jl. Pahlawan No. 22, Semarang', jadwalPraktik: 'Senin-Sabtu 09:00-18:00', noTelepon: '081234567010', email: 'fatimah.zahra@simandakes.id', status: 'aktif', alamatGoogleMaps: 'https://www.google.com/maps?q=Jl+Pahlawan+22+Semarang' },
  // Perawat
  { nama: 'Ns. Dewi Lestari, S.Kep', jenis: 'Perawat', spesialisasi: 'Keperawatan', str: 'STR-011', sip: 'SIP-011', alamatPraktik: 'Jl. Kartini No. 8, Yogyakarta', jadwalPraktik: 'Shift pagi-sore', noTelepon: '081234567011', email: 'dewi.lestari@simandakes.id', status: 'aktif', alamatGoogleMaps: 'https://www.google.com/maps?q=Jl+Kartini+8+Yogyakarta' },
  { nama: 'Ns. Rina Marlina, S.Kep', jenis: 'Perawat', spesialisasi: 'Keperawatan', str: 'STR-012', sip: 'SIP-012', alamatPraktik: 'Jl. Ahmad Yani No. 19, Malang', jadwalPraktik: 'Shift malam', noTelepon: '081234567012', email: 'rina.marlina@simandakes.id', status: 'aktif', alamatGoogleMaps: 'https://www.google.com/maps?q=Jl+Ahmad+Yani+19+Malang' },
  // Apoteker
  { nama: 'Apt. Hendra Wijaya, S.Farm', jenis: 'Apoteker', spesialisasi: 'Farmasi', str: 'STR-013', sip: 'SIP-013', alamatPraktik: 'Jl. Gajah Mada No. 33, Medan', jadwalPraktik: 'Senin-Sabtu 08:00-21:00', noTelepon: '081234567013', email: 'hendra.wijaya@simandakes.id', status: 'aktif', alamatGoogleMaps: 'https://www.google.com/maps?q=Jl+Gajah+Mada+33+Medan' },
  { nama: 'Apt. Lia Anggraini, S.Farm', jenis: 'Apoteker', spesialisasi: 'Farmasi', str: 'STR-014', sip: 'SIP-014', alamatPraktik: 'Jl. Veteran No. 12, Makassar', jadwalPraktik: 'Senin-Jumat 09:00-17:00', noTelepon: '081234567014', email: 'lia.anggraini@simandakes.id', status: 'aktif', alamatGoogleMaps: 'https://www.google.com/maps?q=Jl+Veteran+12+Makassar' },
  // Fisioterapis
  { nama: 'Yoga Pratama, S.Ft', jenis: 'Fisioterapis', spesialisasi: 'Rehabilitasi Fisik', str: 'STR-015', sip: 'SIP-015', alamatPraktik: 'Jl. Cendrawasih No. 7, Bali', jadwalPraktik: 'Senin-Jumat 10:00-18:00', noTelepon: '081234567015', email: 'yoga.pratama@simandakes.id', status: 'aktif', alamatGoogleMaps: 'https://www.google.com/maps?q=Jl+Cendrawasih+7+Bali' },
  { nama: 'Sari Indah, S.Ft', jenis: 'Fisioterapis', spesialisasi: 'Olahraga', str: 'STR-016', sip: 'SIP-016', alamatPraktik: 'Jl. Melati No. 3, Bandung', jadwalPraktik: 'Senin-Sabtu 09:00-16:00', noTelepon: '081234567016', email: 'sari.indah@simandakes.id', status: 'aktif', alamatGoogleMaps: 'https://www.google.com/maps?q=Jl+Melati+3+Bandung' },
  // Psikolog Klinis
  { nama: 'Andi Wijaya, M.Psi, Psikolog', jenis: 'Psikolog Klinis', spesialisasi: 'Klinis Dewasa', str: 'STR-017', sip: 'SIP-017', alamatPraktik: 'Jl. Cipta No. 11, Jakarta Selatan', jadwalPraktik: 'Senin-Jumat 13:00-20:00', noTelepon: '081234567017', email: 'andi.w@simandakes.id', status: 'aktif', alamatGoogleMaps: 'https://www.google.com/maps?q=Jl+Cipta+11+Jakarta' },
  { nama: 'Maya Sari, M.Psi, Psikolog', jenis: 'Psikolog Klinis', spesialisasi: 'Anak & Remaja', str: 'STR-018', sip: 'SIP-018', alamatPraktik: 'Jl. Bunga No. 9, Surabaya', jadwalPraktik: 'Selasa-Sabtu 10:00-17:00', noTelepon: '081234567018', email: 'maya.sari@simandakes.id', status: 'aktif', alamatGoogleMaps: 'https://www.google.com/maps?q=Jl+Bunga+9+Surabaya' },
  // Terapis Wicara
  { nama: 'Rini Astuti, S.Ter.Wic', jenis: 'Terapis Wicara', spesialisasi: 'Komunikasi & Bicara', str: 'STR-019', sip: 'SIP-019', alamatPraktik: 'Jl. Anggrek No. 4, Bandung', jadwalPraktik: 'Senin-Jumat 09:00-15:00', noTelepon: '081234567019', email: 'rini.astuti@simandakes.id', status: 'aktif', alamatGoogleMaps: 'https://www.google.com/maps?q=Jl+Anggrek+4+Bandung' },
  // Okupasi Terapis
  { nama: 'Dewi Utami, S.OT', jenis: 'Okupasi Terapis', spesialisasi: 'Rehabilitasi ADL', str: 'STR-020', sip: 'SIP-020', alamatPraktik: 'Jl. Mawar No. 6, Jakarta', jadwalPraktik: 'Senin-Sabtu 10:00-16:00', noTelepon: '081234567020', email: 'dewi.utami@simandakes.id', status: 'aktif', alamatGoogleMaps: 'https://www.google.com/maps?q=Jl+Mawar+6+Jakarta' },
  // Terapis Gigi dan Mulut
  { nama: 'Siti Halimah, Amd.G', jenis: 'Terapis Gigi dan Mulut', spesialisasi: 'Hygienist', str: 'STR-021', sip: 'SIP-021', alamatPraktik: 'Jl. Kenanga No. 8, Medan', jadwalPraktik: 'Senin-Jumat 08:00-14:00', noTelepon: '081234567021', email: 'siti.halimah@simandakes.id', status: 'aktif', alamatGoogleMaps: 'https://www.google.com/maps?q=Jl+Kenanga+8+Medan' },
]

const institusiNamedSeed = [
  { nama: 'RSUD Dr. Soetomo', tipe: 'RS', dokter: 45, dokterGigi: 12 },
  { nama: 'RSUP Cipto Mangunkusumo', tipe: 'RS', dokter: 78, dokterGigi: 20 },
  { nama: 'Puskesmas Kebon Jeruk', tipe: 'Puskesmas', dokter: 3, dokterGigi: 1 },
  { nama: 'Puskesmas Tebet', tipe: 'Puskesmas', dokter: 4, dokterGigi: 2 },
  { nama: 'Klinik Sehat Sejahtera', tipe: 'Klinik', dokter: 2, dokterGigi: 1 },
  { nama: 'Klinik Bunda Kasih', tipe: 'Klinik', dokter: 3, dokterGigi: 0 },
  { nama: 'Apotek Kimia Farma', tipe: 'Apotek', dokter: 0, dokterGigi: 0 },
  { nama: 'Apotek K-24', tipe: 'Apotek', dokter: 0, dokterGigi: 0 },
]

const institusiNakesSeed = [
  { nama: 'RSUD Dr. Soetomo', tipe: 'RS', perawat: 120, bidan: 25, apoteker: 8, lainnya: 15 },
  { nama: 'RSUP Cipto Mangunkusumo', tipe: 'RS', perawat: 180, bidan: 32, apoteker: 12, lainnya: 20 },
  { nama: 'Puskesmas Kebon Jeruk', tipe: 'Puskesmas', perawat: 12, bidan: 6, apoteker: 1, lainnya: 3 },
  { nama: 'Puskesmas Tebet', tipe: 'Puskesmas', perawat: 15, bidan: 8, apoteker: 2, lainnya: 4 },
  { nama: 'Klinik Sehat Sejahtera', tipe: 'Klinik', perawat: 5, bidan: 3, apoteker: 1, lainnya: 1 },
  { nama: 'Klinik Bunda Kasih', tipe: 'Klinik', perawat: 6, bidan: 4, apoteker: 0, lainnya: 1 },
  { nama: 'Apotek Kimia Farma', tipe: 'Apotek', perawat: 0, bidan: 0, apoteker: 2, lainnya: 1 },
  { nama: 'Apotek K-24', tipe: 'Apotek', perawat: 0, bidan: 0, apoteker: 3, lainnya: 2 },
]

const usersSeed = [
  {
    username: 'admin',
    password: 'admin123',
    namaLengkap: 'Administrator Sistem',
    role: 'admin',
    email: 'admin@simandakes.id',
  },
  {
    username: 'operator',
    password: 'operator123',
    namaLengkap: 'Operator Data',
    role: 'operator',
    email: 'operator@simandakes.id',
  },
]

// ---------------------------------------------------------------------------
// Seed logic
// ---------------------------------------------------------------------------

async function main() {
  // 1. Users — upsert by username (keeps id/lastLoginAt across re-runs).
  for (const u of usersSeed) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {
        passwordHash: hashPassword(u.password),
        namaLengkap: u.namaLengkap,
        role: u.role,
        email: u.email,
        status: 'aktif',
      },
      create: {
        username: u.username,
        passwordHash: hashPassword(u.password),
        namaLengkap: u.namaLengkap,
        role: u.role,
        email: u.email,
        status: 'aktif',
      },
    })
  }
  console.log(`Seeded ${usersSeed.length} users (admin/admin123, operator/operator123)`)

  // 2. Data tables — deleteMany + createMany (idempotent snapshot).
  await prisma.dataNakes.deleteMany()
  await prisma.dataNakes.createMany({ data: dataNakesSeed })
  console.log(`Seeded ${dataNakesSeed.length} data nakes`)

  await prisma.institusiNamed.deleteMany()
  await prisma.institusiNamed.createMany({ data: institusiNamedSeed })
  console.log(`Seeded ${institusiNamedSeed.length} institusi named`)

  await prisma.institusiNakes.deleteMany()
  await prisma.institusiNakes.createMany({ data: institusiNakesSeed })
  console.log(`Seeded ${institusiNakesSeed.length} institusi nakes`)
}

main()
  .then(async () => {
    const [users, nakes, named, instNakes] = await Promise.all([
      prisma.user.count(),
      prisma.dataNakes.count(),
      prisma.institusiNamed.count(),
      prisma.institusiNakes.count(),
    ])
    console.log(
      `DB totals → users: ${users}, dataNakes: ${nakes}, institusiNamed: ${named}, institusiNakes: ${instNakes}`
    )
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
