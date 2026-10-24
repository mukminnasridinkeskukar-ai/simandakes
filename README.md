# SIMANDAKES — Sistem Informasi Manajemen SDM Kesehatan (v2.1)

Aplikasi web Next.js 16 (App Router) untuk manajemen data SDM Kesehatan.
Data tersimpan di database lokal (SQLite via Prisma) — semua menu memuat data
**otomatis** dari backend, tanpa tombol refresh.

## Fitur
- Landing page dengan statistik live dari database
- Dashboard dengan 16 menu: Named, Nakes, 12x "Cari <Profesi>", dan Panel Admin
- **Data Praktik Mandiri** (Pelayanan Kesehatan): profil menampilkan Daftar
  Layanan (tanpa email/telepon) + tombol "Daftar ke Praktik Mandiri" yang
  mengarah ke platform e-Simantri
- Panel Admin: CRUD lengkap (Data Nakes / Institusi Named / Institusi Nakes / Pengguna)
- Login/logout dengan session cookie (hashing scrypt + HMAC)
- Fully responsive (mobile / tablet / desktop), sidebar menjadi drawer di mobile

## Menjalankan
1. Install dependency (pilih salah satu):
   - `bun install` (disarankan, ada bun.lock)
   - `npm install`
2. Setup database (file DB sudah tersedia di `db/custom.db` berisi data contoh):
   - `npx prisma generate` (atau `bun run db:generate`)
3. Jalankan dev server:
   - `bun run dev` (atau `npm run dev`)
4. Buka http://localhost:3000

Jika ingin database kosong lalu diisi ulang data contoh:
- hapus `db/custom.db`, jalankan `npx prisma db push`, lalu `bun prisma/seed.ts`

## Akun Demo
- Admin: username `admin` / password `admin123`
- Operator: username `operator` / password `operator123`

## URL e-Simantri
URL platform pendaftaran praktik mandiri didefinisikan di
`src/components/simandakes/config.ts` (konstanta `ESIMANTRI_URL`).
Ubah nilai di sana bila URL resmi berubah.

## Struktur Penting
- `src/app/page.tsx` — entry (merender AppRoot)
- `src/components/simandakes/` — semua komponen UI (landing, dashboard, views, dialogs)
- `src/app/api/` — REST API (auth, stats, nakes, named, institusi-nakes, users)
- `src/lib/auth.ts` — autentikasi (scrypt + session cookie HMAC)
- `prisma/schema.prisma` — skema database (SQLite, DataNakes.daftarLayanan)
- `prisma/seed.ts` — data contoh (21 nakes praktik mandiri, 8 institusi, 2 user)
