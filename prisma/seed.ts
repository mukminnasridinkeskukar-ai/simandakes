/**
 * SIMANDAKES seed script (idempotent).
 *
 * - Users: upsert by username (admin/operator with hashed passwords).
 * - Data tables (dataNakes, institusiNamed, institusiNakes):
 *   deleteMany + createMany. Semua data nakes = PRAKTIK MANDIRI
 *   (profil: tanpa email/telepon, memuat Daftar Layanan).
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
  { nama: 'dr. Ahmad Fauzi, Sp.PD', jenis: 'Dokter Spesialis', spesialisasi: 'Penyakit Dalam', str: 'STR-001', sip: 'SIP-001', fotoUrl: '/foto/nakes-01.jpg', alamatPraktik: 'Jl. Merdeka No. 10, Jakarta Pusat', jadwalPraktik: 'Senin-Jumat 08:00-14:00', daftarLayanan: 'Konsultasi Penyakit Dalam\nMedical Check-up\nPengelolaan Diabetes\nPengelolaan Hipertensi', status: 'aktif', alamatGoogleMaps: 'https://www.google.com/maps?q=Jl+Merdeka+10+Jakarta' },
  { nama: 'dr. Siti Aminah, Sp.A', jenis: 'Dokter Spesialis', spesialisasi: 'Anak', str: 'STR-002', sip: 'SIP-002', fotoUrl: '/foto/nakes-02.jpg', alamatPraktik: 'Jl. Sudirman No. 25, Jakarta Selatan', jadwalPraktik: 'Senin-Sabtu 09:00-15:00', daftarLayanan: 'Konsultasi Kesehatan Anak\nImunisasi\nPemantauan Tumbuh Kembang\nPerawatan Bayi & Balita', status: 'aktif', alamatGoogleMaps: 'https://www.google.com/maps?q=Jl+Sudirman+25+Jakarta' },
  { nama: 'dr. Bambang Sutrisno, Sp.B', jenis: 'Dokter Spesialis', spesialisasi: 'Bedah', str: 'STR-003', sip: 'SIP-003', fotoUrl: '/foto/nakes-03.jpg', alamatPraktik: 'Jl. Pahlawan No. 5, Bandung', jadwalPraktik: 'Senin-Jumat 10:00-16:00', daftarLayanan: 'Konsultasi Bedah Umum\nProsedur Bedah Minor\nPerawatan Luka\nKonsultasi Pasca Operasi', status: 'aktif', alamatGoogleMaps: 'https://www.google.com/maps?q=Jl+Pahlawan+5+Bandung' },
  // Dokter Gigi Spesialis
  { nama: 'drg. Dewi Saraswati, Sp.Ort', jenis: 'Dokter Gigi Spesialis', spesialisasi: 'Ortodonsia', str: 'STR-004', sip: 'SIP-004', fotoUrl: '/foto/nakes-04.jpg', alamatPraktik: 'Jl. Diponegoro No. 8, Surabaya', jadwalPraktik: 'Senin-Jumat 09:00-17:00', daftarLayanan: 'Pemasangan Behel\nPerawatan Ortodonti\nKoreksi Gigi Tidak Sejajar\nRetainer', status: 'aktif', alamatGoogleMaps: 'https://www.google.com/maps?q=Jl+Diponegoro+8+Surabaya' },
  { nama: 'drg. Hendra Kusuma, Sp.Pros', jenis: 'Dokter Gigi Spesialis', spesialisasi: 'Prostodonsia', str: 'STR-005', sip: 'SIP-005', fotoUrl: '/foto/nakes-05.jpg', alamatPraktik: 'Jl. Gatot Subroto No. 12, Bandung', jadwalPraktik: 'Selasa-Sabtu 10:00-18:00', daftarLayanan: 'Gigi Tiruan & Crown\nVeneer Gigi\nPerawatan Prostodonti\nPemutihan Gigi', status: 'aktif', alamatGoogleMaps: 'https://www.google.com/maps?q=Jl+Gatot+Subroto+12+Bandung' },
  // Dokter Umum
  { nama: 'dr. Rina Wati', jenis: 'Dokter', spesialisasi: 'Umum', str: 'STR-006', sip: 'SIP-006', fotoUrl: '/foto/nakes-06.jpg', alamatPraktik: 'Jl. Kartini No. 22, Semarang', jadwalPraktik: 'Senin-Jumat 08:00-14:00', daftarLayanan: 'Konsultasi Umum\nMedical Check-up\nSuntik & Vitamin\nPerawatan Ringan', status: 'aktif', alamatGoogleMaps: 'https://www.google.com/maps?q=Jl+Kartini+22+Semarang' },
  { nama: 'dr. Joko Susilo', jenis: 'Dokter', spesialisasi: 'Umum', str: 'STR-007', sip: 'SIP-007', fotoUrl: '/foto/nakes-07.jpg', alamatPraktik: 'Jl. Ahmad Yani No. 19, Malang', jadwalPraktik: 'Setiap hari 08:00-20:00', daftarLayanan: 'Konsultasi Umum\nPemeriksaan Tensi & Gula Darah\nVaksinasi & Imunisasi\nSertifikat Kesehatan', status: 'aktif', alamatGoogleMaps: 'https://www.google.com/maps?q=Jl+Ahmad+Yani+19+Malang' },
  // Dokter Gigi Umum
  { nama: 'drg. Budi Hartono', jenis: 'Dokter Gigi', spesialisasi: 'Umum', str: 'STR-008', sip: 'SIP-008', fotoUrl: '/foto/nakes-08.jpg', alamatPraktik: 'Jl. Pemuda No. 33, Medan', jadwalPraktik: 'Senin-Sabtu 09:00-15:00', daftarLayanan: 'Tambal Gigi\nCabut Gigi\nScaling\nKonsultasi Kesehatan Gigi', status: 'aktif', alamatGoogleMaps: 'https://www.google.com/maps?q=Jl+Pemuda+33+Medan' },
  // Bidan
  { nama: 'Bidan Aisyah Putri, S.Keb', jenis: 'Bidan', spesialisasi: 'Kebidanan', str: 'STR-009', sip: 'SIP-009', fotoUrl: '/foto/nakes-09.jpg', alamatPraktik: 'Jl. Diponegoro No. 15, Surabaya', jadwalPraktik: 'Setiap hari 08:00-20:00', daftarLayanan: 'Pemeriksaan Kehamilan (ANC)\nPersalinan Normal\nKonsultasi KB\nImunisasi Bayi\nKonsultasi Menyusui', status: 'aktif', alamatGoogleMaps: 'https://www.google.com/maps?q=Jl+Diponegoro+15+Surabaya' },
  { nama: 'Bidan Fatimah Zahra, S.Keb', jenis: 'Bidan', spesialisasi: 'Kebidanan', str: 'STR-010', sip: 'SIP-010', fotoUrl: '/foto/nakes-10.jpg', alamatPraktik: 'Jl. Pahlawan No. 22, Semarang', jadwalPraktik: 'Senin-Sabtu 09:00-18:00', daftarLayanan: 'Pemeriksaan Kehamilan\nSenam Hamil\nPijat Bayi\nKelas Ibu Hamil', status: 'aktif', alamatGoogleMaps: 'https://www.google.com/maps?q=Jl+Pahlawan+22+Semarang' },
  // Perawat
  { nama: 'Ns. Dewi Lestari, S.Kep', jenis: 'Perawat', spesialisasi: 'Keperawatan', str: 'STR-011', sip: 'SIP-011', fotoUrl: '/foto/nakes-11.jpg', alamatPraktik: 'Jl. Kartini No. 8, Yogyakarta', jadwalPraktik: 'Shift pagi-sore', daftarLayanan: 'Perawatan Luka\nSuntik & Infus\nCek Tensi & Gula Darah\nPerawatan Lansia', status: 'aktif', alamatGoogleMaps: 'https://www.google.com/maps?q=Jl+Kartini+8+Yogyakarta' },
  { nama: 'Ns. Rina Marlina, S.Kep', jenis: 'Perawat', spesialisasi: 'Keperawatan', str: 'STR-012', sip: 'SIP-012', fotoUrl: '/foto/nakes-12.jpg', alamatPraktik: 'Jl. Ahmad Yani No. 19, Malang', jadwalPraktik: 'Shift malam', daftarLayanan: 'Home Care\nPemasangan Kateter\nTerapi Oksigen\nEdukasi Kesehatan', status: 'aktif', alamatGoogleMaps: 'https://www.google.com/maps?q=Jl+Ahmad+Yani+19+Malang' },
  // Apoteker
  { nama: 'Apt. Hendra Wijaya, S.Farm', jenis: 'Apoteker', spesialisasi: 'Farmasi', str: 'STR-013', sip: 'SIP-013', fotoUrl: '/foto/nakes-13.jpg', alamatPraktik: 'Jl. Gajah Mada No. 33, Medan', jadwalPraktik: 'Senin-Sabtu 08:00-21:00', daftarLayanan: 'Penjualan Obat Resep & Bebas\nKonsultasi Obat\nCek Tensi Gratis\nRacik Obat', status: 'aktif', alamatGoogleMaps: 'https://www.google.com/maps?q=Jl+Gajah+Mada+33+Medan' },
  { nama: 'Apt. Lia Anggraini, S.Farm', jenis: 'Apoteker', spesialisasi: 'Farmasi', str: 'STR-014', sip: 'SIP-014', fotoUrl: '/foto/nakes-14.jpg', alamatPraktik: 'Jl. Veteran No. 12, Makassar', jadwalPraktik: 'Senin-Jumat 09:00-17:00', daftarLayanan: 'Penjualan Obat\nVitamin & Suplemen\nAlat Kesehatan\nKonsultasi Farmasi', status: 'aktif', alamatGoogleMaps: 'https://www.google.com/maps?q=Jl+Veteran+12+Makassar' },
  // Fisioterapis
  { nama: 'Yoga Pratama, S.Ft', jenis: 'Fisioterapis', spesialisasi: 'Rehabilitasi Fisik', str: 'STR-015', sip: 'SIP-015', fotoUrl: '/foto/nakes-15.jpg', alamatPraktik: 'Jl. Cendrawasih No. 7, Bali', jadwalPraktik: 'Senin-Jumat 10:00-18:00', daftarLayanan: 'Terapi Nyeri Punggung\nRehabilitasi Post-Stroke\nTerapi Olahraga\nPijat Terapi', status: 'aktif', alamatGoogleMaps: 'https://www.google.com/maps?q=Jl+Cendrawasih+7+Bali' },
  { nama: 'Sari Indah, S.Ft', jenis: 'Fisioterapis', spesialisasi: 'Olahraga', str: 'STR-016', sip: 'SIP-016', fotoUrl: '/foto/nakes-16.jpg', alamatPraktik: 'Jl. Melati No. 3, Bandung', jadwalPraktik: 'Senin-Sabtu 09:00-16:00', daftarLayanan: 'Fisioterapi Olahraga\nTerapi Sendi & Otot\nTENS & Ultrasound\nHome Visit', status: 'aktif', alamatGoogleMaps: 'https://www.google.com/maps?q=Jl+Melati+3+Bandung' },
  // Psikolog Klinis
  { nama: 'Andi Wijaya, M.Psi, Psikolog', jenis: 'Psikolog Klinis', spesialisasi: 'Klinis Dewasa', str: 'STR-017', sip: 'SIP-017', fotoUrl: '/foto/nakes-17.jpg', alamatPraktik: 'Jl. Cipta No. 11, Jakarta Selatan', jadwalPraktik: 'Senin-Jumat 13:00-20:00', daftarLayanan: 'Konsultasi Psikologi\nTes Psikologi\nTerapi CBT\nKonseling Stres & Kecemasan', status: 'aktif', alamatGoogleMaps: 'https://www.google.com/maps?q=Jl+Cipta+11+Jakarta' },
  { nama: 'Maya Sari, M.Psi, Psikolog', jenis: 'Psikolog Klinis', spesialisasi: 'Anak & Remaja', str: 'STR-018', sip: 'SIP-018', fotoUrl: '/foto/nakes-18.jpg', alamatPraktik: 'Jl. Bunga No. 9, Surabaya', jadwalPraktik: 'Selasa-Sabtu 10:00-17:00', daftarLayanan: 'Psikologi Anak & Remaja\nTes IQ & Kecerdasan\nTerapi Perilaku\nParenting Class', status: 'aktif', alamatGoogleMaps: 'https://www.google.com/maps?q=Jl+Bunga+9+Surabaya' },
  // Terapis Wicara
  { nama: 'Rini Astuti, S.Ter.Wic', jenis: 'Terapis Wicara', spesialisasi: 'Komunikasi & Bicara', str: 'STR-019', sip: 'SIP-019', fotoUrl: '/foto/nakes-19.jpg', alamatPraktik: 'Jl. Anggrek No. 4, Bandung', jadwalPraktik: 'Senin-Jumat 09:00-15:00', daftarLayanan: 'Terapi Bicara Anak\nTerapi Telan (BBD)\nEvaluasi Komunikasi\nLatihan Menelan', status: 'aktif', alamatGoogleMaps: 'https://www.google.com/maps?q=Jl+Anggrek+4+Bandung' },
  // Okupasi Terapis
  { nama: 'Dewi Utami, S.OT', jenis: 'Okupasi Terapis', spesialisasi: 'Rehabilitasi ADL', str: 'STR-020', sip: 'SIP-020', fotoUrl: '/foto/nakes-20.jpg', alamatPraktik: 'Jl. Mawar No. 6, Jakarta', jadwalPraktik: 'Senin-Sabtu 10:00-16:00', daftarLayanan: 'Latihan Aktivitas Harian (ADL)\nTerapi Sensori Integrasi\nRehabilitasi Kognitif\nHome Program', status: 'aktif', alamatGoogleMaps: 'https://www.google.com/maps?q=Jl+Mawar+6+Jakarta' },
  // Terapis Gigi dan Mulut
  { nama: 'Siti Halimah, Amd.G', jenis: 'Terapis Gigi dan Mulut', spesialisasi: 'Hygienist', str: 'STR-021', sip: 'SIP-021', fotoUrl: '/foto/nakes-21.jpg', alamatPraktik: 'Jl. Kenanga No. 8, Medan', jadwalPraktik: 'Senin-Jumat 08:00-14:00', daftarLayanan: 'Scaling & Pembersihan Karang Gigi\nPemutihan Gigi\nEdukasi Kesehatan Gigi\nFluorisasi', status: 'aktif', alamatGoogleMaps: 'https://www.google.com/maps?q=Jl+Kenanga+8+Medan' },
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
