-- ============================================================================
--  SIMANDAKES — FILE SQL SATU PAKET UNTUK NHOST BARU (PostgreSQL + Hasura)
--  Versi: 2.2 — COCOK PERSIS dengan query aplikasi (js/api-sheet.js)
--  Isi: 3 tabel + enum + index + trigger + data awal (21 praktik mandiri
--       lengkap dengan FOTO & DAFTAR LAYANAN, 8 institusi Named, 8 institusi
--       Nakes) — semuanya dalam SATU file ini.
--
-- ============================================================================
--  CARA PAKAI — 3 LANGKAH (semua lewat klik, tanpa perintah terminal):
--
--  LANGKAH 1 — JALANKAN FILE INI
--    Nhost Dashboard -> menu "SQL" (SQL Editor)
--    -> copy SELURUH isi file ini -> paste -> klik tombol "Run"
--
--  LANGKAH 2 — TRACK TABEL (wajib, supaya tabel muncul di GraphQL)
--    Nhost Dashboard -> "Hasura Console" (tombol di kanan atas) -> menu "Data"
--    -> klik database "default" -> schema "public"
--    -> centang 3 tabel: data_nakes, institusi_named, institusi_nakes
--    -> klik tombol "Track selected"  (atau "Track all" jika ada)
--
--  LANGKAH 3 — IZIN AKSES (wajib, supaya aplikasi boleh BACA & TULIS)
--    Masih di "Data" -> klik tabel "data_nakes" -> tab "Permissions"
--    -> pada kotak role, tulis: public  -> klik tombol (icon) "..."
--       New role -> pilih "insert" -> centang "Enable all" -> Save
--       Ulangi untuk "update" -> Save
--       Ulangi untuk "select" -> centang semua kolom + "Allow aggregations" -> Save
--    -> Ulangi langkah yang sama untuk tabel "institusi_named"
--    -> Ulangi langkah yang sama untuk tabel "institusi_nakes"
--
--  SELESAI! Tes cepat di Hasura Console -> menu "GraphiQL":
--      { data_nakes(where: { deleted_at: { _is_null: true } }) { legacy_id nama foto_url } }
--    Harus muncul 21 baris dengan foto /foto/nakes-01.jpg s/d nakes-21.jpg
--
--  PENTING: aplikasi SIMANDAKES membaca Nhost TANPA password (tanpa admin
--  secret), jadi Hasura memakai role "public" — itulah kenapa LANGKAH 3
--  membuat permission untuk role "public". Tanpa ini aplikasi tampil kosong.
--
--  File ini aman dijalankan BERULANG (idempoten).
--  Panduan lengkap bergambar: lihat file PANDUAN-NHOST-BARU.md
-- ============================================================================

create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- (OPSIONAL) PEMBERSIH — buka tanda "--" di baris bawah HANYA jika database
-- sudah berisi tabel lama yang berbeda struktur.
-- ---------------------------------------------------------------------------
-- drop table if exists public.data_nakes cascade;
-- drop table if exists public.institusi_named cascade;
-- drop table if exists public.institusi_nakes cascade;

-- ---------------------------------------------------------------------------
-- ENUM TYPES (sesuai desain asli backend — error "duplicate" diabaikan agar
-- file bisa dijalankan berulang)
-- ---------------------------------------------------------------------------

-- Jenis tenaga kesehatan — sesuai menu Pelayanan di sidebar aplikasi
DO $$ BEGIN
    CREATE TYPE public.nakes_jenis AS ENUM (
        'Dokter',
        'Dokter Spesialis',
        'Dokter Gigi',
        'Dokter Gigi Spesialis',
        'Bidan',
        'Perawat',
        'Apoteker',
        'Fisioterapis',
        'Psikolog Klinis',
        'Terapis Wicara',
        'Okupasi Terapis',
        'Terapis Gigi dan Mulut',
        'Tenaga Kesehatan Lainnya'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Status nakes
DO $$ BEGIN
    CREATE TYPE public.nakes_status AS ENUM (
        'aktif',
        'nonaktif',
        'cuti',
        'keluar'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tipe institusi
DO $$ BEGIN
    CREATE TYPE public.institusi_tipe AS ENUM (
        'RS',
        'Puskesmas',
        'Klinik',
        'Apotek',
        'Lainnya'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- TABEL 1: data_nakes — PRAKTIK MANDIRI (menu Nakes & semua "Cari <profesi>")
-- Kolom = persis query GetAllNakes di js/api-sheet.js + daftar_layanan baru
-- ---------------------------------------------------------------------------
create table if not exists public.data_nakes (
    id                  uuid primary key default gen_random_uuid(),
    legacy_id           text unique,              -- ID lama (NK001..NK021)
    nama                text not null,
    jenis               public.nakes_jenis not null default 'Tenaga Kesehatan Lainnya',
    spesialisasi        text,
    str                 text,                     -- Surat Tanda Registrasi
    sip                 text,                     -- Surat Izin Praktik
    alamat_praktik      text,
    jadwal_praktik      text,
    no_telepon          text,                     -- dipertahankan (nullable) agar query lama tetap valid; praktik mandiri: kosong
    email               text,                     -- dipertahankan (nullable) agar query lama tetap valid; praktik mandiri: kosong
    daftar_layanan      text,                     -- BARU: daftar layanan praktik mandiri (pisah baris/koma)
    status              public.nakes_status not null default 'aktif',
    foto_url            text,                     -- FOTO PROFIL (banner kartu + pop up besar)
    alamat_google_maps  text,                     -- URL Google Maps lokasi praktik
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now(),
    deleted_at          timestamptz               -- soft-delete (NULL = aktif)
);

comment on table  public.data_nakes                 is 'Data tenaga kesehatan individual / praktik mandiri (Nakes)';
comment on column public.data_nakes.daftar_layanan  is 'Daftar layanan praktik mandiri, dipisah baris baru / koma / titik-koma';
comment on column public.data_nakes.foto_url        is 'URL foto profil (banner atas kartu, tampil besar di pop up detail)';
comment on column public.data_nakes.deleted_at      is 'Soft-delete: NULL = aktif, isi timestamp = terhapus';

create index if not exists idx_data_nakes_jenis   on public.data_nakes (jenis)     where deleted_at is null;
create index if not exists idx_data_nakes_status  on public.data_nakes (status)    where deleted_at is null;
create index if not exists idx_data_nakes_nama    on public.data_nakes (nama);
create index if not exists idx_data_nakes_created on public.data_nakes (created_at desc);

-- ---------------------------------------------------------------------------
-- TABEL 2: institusi_named — institusi ber-tenaga MEDIS (dashboard Named)
-- ---------------------------------------------------------------------------
create table if not exists public.institusi_named (
    id              uuid primary key default gen_random_uuid(),
    legacy_id       text unique,              -- ID lama (NM001..NM008)
    nama            text not null,
    tipe            public.institusi_tipe not null default 'Lainnya',
    dokter          integer not null default 0 check (dokter >= 0),
    dokter_gigi     integer not null default 0 check (dokter_gigi >= 0),
    total           integer not null default 0 check (total >= 0),
    persentase      text,                     -- format "12.5%"
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    deleted_at      timestamptz
);

comment on table public.institusi_named is 'Institusi kesehatan ber-tenaga medis: jumlah dokter & dokter gigi (dashboard Named)';

create index if not exists idx_institusi_named_tipe on public.institusi_named (tipe) where deleted_at is null;

-- ---------------------------------------------------------------------------
-- TABEL 3: institusi_nakes — agregat nakes per institusi (admin dashboard)
-- PERHATIAN: kolom namanya "institusi" (bukan "nama") — sesuai query aplikasi
-- ---------------------------------------------------------------------------
create table if not exists public.institusi_nakes (
    id              uuid primary key default gen_random_uuid(),
    legacy_id       text unique,              -- ID lama (IN001..IN008)
    institusi       text not null,            -- NAMA institusi (kolom memang bernama institusi)
    tipe            public.institusi_tipe not null default 'Lainnya',
    perawat         integer not null default 0 check (perawat >= 0),
    bidan           integer not null default 0 check (bidan >= 0),
    apoteker        integer not null default 0 check (apoteker >= 0),
    lainnya         integer not null default 0 check (lainnya >= 0),
    total           integer not null default 0 check (total >= 0),
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    deleted_at      timestamptz
);

comment on table public.institusi_nakes is 'Agregat jumlah nakes (perawat/bidan/apoteker/lainnya) per institusi';

create index if not exists idx_institusi_nakes_tipe      on public.institusi_nakes (tipe)      where deleted_at is null;
create index if not exists idx_institusi_nakes_institusi on public.institusi_nakes (institusi) where deleted_at is null;

-- ---------------------------------------------------------------------------
-- TRIGGER updated_at otomatis
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_data_nakes_updated_at on public.data_nakes;
create trigger trg_data_nakes_updated_at
  before update on public.data_nakes
  for each row execute function public.set_updated_at();

drop trigger if exists trg_institusi_named_updated_at on public.institusi_named;
create trigger trg_institusi_named_updated_at
  before update on public.institusi_named
  for each row execute function public.set_updated_at();

drop trigger if exists trg_institusi_nakes_updated_at on public.institusi_nakes;
create trigger trg_institusi_nakes_updated_at
  before update on public.institusi_nakes
  for each row execute function public.set_updated_at();

-- ============================================================================
-- ISI DATA (di-reset ke data awal setiap kali file ini dijalankan)
-- ============================================================================

truncate table public.data_nakes, public.institusi_named, public.institusi_nakes;

-- ---------------------------------------------------------------------------
-- DATA NAKES / PRAKTIK MANDIRI — 21 profil (NK001..NK021) + foto + layanan
-- ---------------------------------------------------------------------------
insert into public.data_nakes (legacy_id, nama, jenis, spesialisasi, str, sip, alamat_praktik, jadwal_praktik, daftar_layanan, status, foto_url, alamat_google_maps)
values ('NK001', 'dr. Ahmad Fauzi, Sp.PD', 'Dokter Spesialis', 'Penyakit Dalam', 'STR-001', 'SIP-001', 'Jl. Merdeka No. 10, Jakarta Pusat', 'Senin-Jumat 08:00-14:00', 'Konsultasi Penyakit Dalam
Medical Check-up
Pengelolaan Diabetes
Pengelolaan Hipertensi', 'aktif', '/foto/nakes-01.jpg', 'https://www.google.com/maps?q=Jl+Merdeka+10+Jakarta');
insert into public.data_nakes (legacy_id, nama, jenis, spesialisasi, str, sip, alamat_praktik, jadwal_praktik, daftar_layanan, status, foto_url, alamat_google_maps)
values ('NK002', 'dr. Siti Aminah, Sp.A', 'Dokter Spesialis', 'Anak', 'STR-002', 'SIP-002', 'Jl. Sudirman No. 25, Jakarta Selatan', 'Senin-Sabtu 09:00-15:00', 'Konsultasi Kesehatan Anak
Imunisasi
Pemantauan Tumbuh Kembang
Perawatan Bayi & Balita', 'aktif', '/foto/nakes-02.jpg', 'https://www.google.com/maps?q=Jl+Sudirman+25+Jakarta');
insert into public.data_nakes (legacy_id, nama, jenis, spesialisasi, str, sip, alamat_praktik, jadwal_praktik, daftar_layanan, status, foto_url, alamat_google_maps)
values ('NK003', 'dr. Bambang Sutrisno, Sp.B', 'Dokter Spesialis', 'Bedah', 'STR-003', 'SIP-003', 'Jl. Pahlawan No. 5, Bandung', 'Senin-Jumat 10:00-16:00', 'Konsultasi Bedah Umum
Prosedur Bedah Minor
Perawatan Luka
Konsultasi Pasca Operasi', 'aktif', '/foto/nakes-03.jpg', 'https://www.google.com/maps?q=Jl+Pahlawan+5+Bandung');
insert into public.data_nakes (legacy_id, nama, jenis, spesialisasi, str, sip, alamat_praktik, jadwal_praktik, daftar_layanan, status, foto_url, alamat_google_maps)
values ('NK004', 'drg. Dewi Saraswati, Sp.Ort', 'Dokter Gigi Spesialis', 'Ortodonsia', 'STR-004', 'SIP-004', 'Jl. Diponegoro No. 8, Surabaya', 'Senin-Jumat 09:00-17:00', 'Pemasangan Behel
Perawatan Ortodonti
Koreksi Gigi Tidak Sejajar
Retainer', 'aktif', '/foto/nakes-04.jpg', 'https://www.google.com/maps?q=Jl+Diponegoro+8+Surabaya');
insert into public.data_nakes (legacy_id, nama, jenis, spesialisasi, str, sip, alamat_praktik, jadwal_praktik, daftar_layanan, status, foto_url, alamat_google_maps)
values ('NK005', 'drg. Hendra Kusuma, Sp.Pros', 'Dokter Gigi Spesialis', 'Prostodonsia', 'STR-005', 'SIP-005', 'Jl. Gatot Subroto No. 12, Bandung', 'Selasa-Sabtu 10:00-18:00', 'Gigi Tiruan & Crown
Veneer Gigi
Perawatan Prostodonti
Pemutihan Gigi', 'aktif', '/foto/nakes-05.jpg', 'https://www.google.com/maps?q=Jl+Gatot+Subroto+12+Bandung');
insert into public.data_nakes (legacy_id, nama, jenis, spesialisasi, str, sip, alamat_praktik, jadwal_praktik, daftar_layanan, status, foto_url, alamat_google_maps)
values ('NK006', 'dr. Rina Wati', 'Dokter', 'Umum', 'STR-006', 'SIP-006', 'Jl. Kartini No. 22, Semarang', 'Senin-Jumat 08:00-14:00', 'Konsultasi Umum
Medical Check-up
Suntik & Vitamin
Perawatan Ringan', 'aktif', '/foto/nakes-06.jpg', 'https://www.google.com/maps?q=Jl+Kartini+22+Semarang');
insert into public.data_nakes (legacy_id, nama, jenis, spesialisasi, str, sip, alamat_praktik, jadwal_praktik, daftar_layanan, status, foto_url, alamat_google_maps)
values ('NK007', 'dr. Joko Susilo', 'Dokter', 'Umum', 'STR-007', 'SIP-007', 'Jl. Ahmad Yani No. 19, Malang', 'Setiap hari 08:00-20:00', 'Konsultasi Umum
Pemeriksaan Tensi & Gula Darah
Vaksinasi & Imunisasi
Sertifikat Kesehatan', 'aktif', '/foto/nakes-07.jpg', 'https://www.google.com/maps?q=Jl+Ahmad+Yani+19+Malang');
insert into public.data_nakes (legacy_id, nama, jenis, spesialisasi, str, sip, alamat_praktik, jadwal_praktik, daftar_layanan, status, foto_url, alamat_google_maps)
values ('NK008', 'drg. Budi Hartono', 'Dokter Gigi', 'Umum', 'STR-008', 'SIP-008', 'Jl. Pemuda No. 33, Medan', 'Senin-Sabtu 09:00-15:00', 'Tambal Gigi
Cabut Gigi
Scaling
Konsultasi Kesehatan Gigi', 'aktif', '/foto/nakes-08.jpg', 'https://www.google.com/maps?q=Jl+Pemuda+33+Medan');
insert into public.data_nakes (legacy_id, nama, jenis, spesialisasi, str, sip, alamat_praktik, jadwal_praktik, daftar_layanan, status, foto_url, alamat_google_maps)
values ('NK009', 'Bidan Aisyah Putri, S.Keb', 'Bidan', 'Kebidanan', 'STR-009', 'SIP-009', 'Jl. Diponegoro No. 15, Surabaya', 'Setiap hari 08:00-20:00', 'Pemeriksaan Kehamilan (ANC)
Persalinan Normal
Konsultasi KB
Imunisasi Bayi
Konsultasi Menyusui', 'aktif', '/foto/nakes-09.jpg', 'https://www.google.com/maps?q=Jl+Diponegoro+15+Surabaya');
insert into public.data_nakes (legacy_id, nama, jenis, spesialisasi, str, sip, alamat_praktik, jadwal_praktik, daftar_layanan, status, foto_url, alamat_google_maps)
values ('NK010', 'Bidan Fatimah Zahra, S.Keb', 'Bidan', 'Kebidanan', 'STR-010', 'SIP-010', 'Jl. Pahlawan No. 22, Semarang', 'Senin-Sabtu 09:00-18:00', 'Pemeriksaan Kehamilan
Senam Hamil
Pijat Bayi
Kelas Ibu Hamil', 'aktif', '/foto/nakes-10.jpg', 'https://www.google.com/maps?q=Jl+Pahlawan+22+Semarang');
insert into public.data_nakes (legacy_id, nama, jenis, spesialisasi, str, sip, alamat_praktik, jadwal_praktik, daftar_layanan, status, foto_url, alamat_google_maps)
values ('NK011', 'Ns. Dewi Lestari, S.Kep', 'Perawat', 'Keperawatan', 'STR-011', 'SIP-011', 'Jl. Kartini No. 8, Yogyakarta', 'Shift pagi-sore', 'Perawatan Luka
Suntik & Infus
Cek Tensi & Gula Darah
Perawatan Lansia', 'aktif', '/foto/nakes-11.jpg', 'https://www.google.com/maps?q=Jl+Kartini+8+Yogyakarta');
insert into public.data_nakes (legacy_id, nama, jenis, spesialisasi, str, sip, alamat_praktik, jadwal_praktik, daftar_layanan, status, foto_url, alamat_google_maps)
values ('NK012', 'Ns. Rina Marlina, S.Kep', 'Perawat', 'Keperawatan', 'STR-012', 'SIP-012', 'Jl. Ahmad Yani No. 19, Malang', 'Shift malam', 'Home Care
Pemasangan Kateter
Terapi Oksigen
Edukasi Kesehatan', 'aktif', '/foto/nakes-12.jpg', 'https://www.google.com/maps?q=Jl+Ahmad+Yani+19+Malang');
insert into public.data_nakes (legacy_id, nama, jenis, spesialisasi, str, sip, alamat_praktik, jadwal_praktik, daftar_layanan, status, foto_url, alamat_google_maps)
values ('NK013', 'Apt. Hendra Wijaya, S.Farm', 'Apoteker', 'Farmasi', 'STR-013', 'SIP-013', 'Jl. Gajah Mada No. 33, Medan', 'Senin-Sabtu 08:00-21:00', 'Penjualan Obat Resep & Bebas
Konsultasi Obat
Cek Tensi Gratis
Racik Obat', 'aktif', '/foto/nakes-13.jpg', 'https://www.google.com/maps?q=Jl+Gajah+Mada+33+Medan');
insert into public.data_nakes (legacy_id, nama, jenis, spesialisasi, str, sip, alamat_praktik, jadwal_praktik, daftar_layanan, status, foto_url, alamat_google_maps)
values ('NK014', 'Apt. Lia Anggraini, S.Farm', 'Apoteker', 'Farmasi', 'STR-014', 'SIP-014', 'Jl. Veteran No. 12, Makassar', 'Senin-Jumat 09:00-17:00', 'Penjualan Obat
Vitamin & Suplemen
Alat Kesehatan
Konsultasi Farmasi', 'aktif', '/foto/nakes-14.jpg', 'https://www.google.com/maps?q=Jl+Veteran+12+Makassar');
insert into public.data_nakes (legacy_id, nama, jenis, spesialisasi, str, sip, alamat_praktik, jadwal_praktik, daftar_layanan, status, foto_url, alamat_google_maps)
values ('NK015', 'Yoga Pratama, S.Ft', 'Fisioterapis', 'Rehabilitasi Fisik', 'STR-015', 'SIP-015', 'Jl. Cendrawasih No. 7, Bali', 'Senin-Jumat 10:00-18:00', 'Terapi Nyeri Punggung
Rehabilitasi Post-Stroke
Terapi Olahraga
Pijat Terapi', 'aktif', '/foto/nakes-15.jpg', 'https://www.google.com/maps?q=Jl+Cendrawasih+7+Bali');
insert into public.data_nakes (legacy_id, nama, jenis, spesialisasi, str, sip, alamat_praktik, jadwal_praktik, daftar_layanan, status, foto_url, alamat_google_maps)
values ('NK016', 'Sari Indah, S.Ft', 'Fisioterapis', 'Olahraga', 'STR-016', 'SIP-016', 'Jl. Melati No. 3, Bandung', 'Senin-Sabtu 09:00-16:00', 'Fisioterapi Olahraga
Terapi Sendi & Otot
TENS & Ultrasound
Home Visit', 'aktif', '/foto/nakes-16.jpg', 'https://www.google.com/maps?q=Jl+Melati+3+Bandung');
insert into public.data_nakes (legacy_id, nama, jenis, spesialisasi, str, sip, alamat_praktik, jadwal_praktik, daftar_layanan, status, foto_url, alamat_google_maps)
values ('NK017', 'Andi Wijaya, M.Psi, Psikolog', 'Psikolog Klinis', 'Klinis Dewasa', 'STR-017', 'SIP-017', 'Jl. Cipta No. 11, Jakarta Selatan', 'Senin-Jumat 13:00-20:00', 'Konsultasi Psikologi
Tes Psikologi
Terapi CBT
Konseling Stres & Kecemasan', 'aktif', '/foto/nakes-17.jpg', 'https://www.google.com/maps?q=Jl+Cipta+11+Jakarta');
insert into public.data_nakes (legacy_id, nama, jenis, spesialisasi, str, sip, alamat_praktik, jadwal_praktik, daftar_layanan, status, foto_url, alamat_google_maps)
values ('NK018', 'Maya Sari, M.Psi, Psikolog', 'Psikolog Klinis', 'Anak & Remaja', 'STR-018', 'SIP-018', 'Jl. Bunga No. 9, Surabaya', 'Selasa-Sabtu 10:00-17:00', 'Psikologi Anak & Remaja
Tes IQ & Kecerdasan
Terapi Perilaku
Parenting Class', 'aktif', '/foto/nakes-18.jpg', 'https://www.google.com/maps?q=Jl+Bunga+9+Surabaya');
insert into public.data_nakes (legacy_id, nama, jenis, spesialisasi, str, sip, alamat_praktik, jadwal_praktik, daftar_layanan, status, foto_url, alamat_google_maps)
values ('NK019', 'Rini Astuti, S.Ter.Wic', 'Terapis Wicara', 'Komunikasi & Bicara', 'STR-019', 'SIP-019', 'Jl. Anggrek No. 4, Bandung', 'Senin-Jumat 09:00-15:00', 'Terapi Bicara Anak
Terapi Telan (BBD)
Evaluasi Komunikasi
Latihan Menelan', 'aktif', '/foto/nakes-19.jpg', 'https://www.google.com/maps?q=Jl+Anggrek+4+Bandung');
insert into public.data_nakes (legacy_id, nama, jenis, spesialisasi, str, sip, alamat_praktik, jadwal_praktik, daftar_layanan, status, foto_url, alamat_google_maps)
values ('NK020', 'Dewi Utami, S.OT', 'Okupasi Terapis', 'Rehabilitasi ADL', 'STR-020', 'SIP-020', 'Jl. Mawar No. 6, Jakarta', 'Senin-Sabtu 10:00-16:00', 'Latihan Aktivitas Harian (ADL)
Terapi Sensori Integrasi
Rehabilitasi Kognitif
Home Program', 'aktif', '/foto/nakes-20.jpg', 'https://www.google.com/maps?q=Jl+Mawar+6+Jakarta');
insert into public.data_nakes (legacy_id, nama, jenis, spesialisasi, str, sip, alamat_praktik, jadwal_praktik, daftar_layanan, status, foto_url, alamat_google_maps)
values ('NK021', 'Siti Halimah, Amd.G', 'Terapis Gigi dan Mulut', 'Hygienist', 'STR-021', 'SIP-021', 'Jl. Kenanga No. 8, Medan', 'Senin-Jumat 08:00-14:00', 'Scaling & Pembersihan Karang Gigi
Pemutihan Gigi
Edukasi Kesehatan Gigi
Fluorisasi', 'aktif', '/foto/nakes-21.jpg', 'https://www.google.com/maps?q=Jl+Kenanga+8+Medan');

-- ---------------------------------------------------------------------------
-- INSTITUSI NAMED — 8 (NM001..NM008)
-- ---------------------------------------------------------------------------
insert into public.institusi_named (legacy_id, nama, tipe, dokter, dokter_gigi, total, persentase) values
('NM001', 'RSUD Dr. Soetomo',          'RS',         45, 12, 57, '15.2%'),
('NM002', 'RSUP Cipto Mangunkusumo',   'RS',         78, 20, 98, '26.1%'),
('NM003', 'Puskesmas Kebon Jeruk',     'Puskesmas',   3,  1,  4, '1.1%'),
('NM004', 'Puskesmas Tebet',           'Puskesmas',   4,  2,  6, '1.6%'),
('NM005', 'Klinik Sehat Sejahtera',    'Klinik',      2,  1,  3, '0.8%'),
('NM006', 'Klinik Bunda Kasih',        'Klinik',      3,  0,  3, '0.8%'),
('NM007', 'Apotek Kimia Farma',        'Apotek',      0,  0,  2, '0.5%'),
('NM008', 'Apotek K-24',               'Apotek',      0,  0,  3, '0.8%');

-- ---------------------------------------------------------------------------
-- INSTITUSI NAKES — 8 (IN001..IN008) — kolom "institusi" = nama institusi
-- ---------------------------------------------------------------------------
insert into public.institusi_nakes (legacy_id, institusi, tipe, perawat, bidan, apoteker, lainnya, total) values
('IN001', 'RSUD Dr. Soetomo',          'RS',         120, 25,  8, 15, 168),
('IN002', 'RSUP Cipto Mangunkusumo',   'RS',         180, 32, 12, 20, 244),
('IN003', 'Puskesmas Kebon Jeruk',     'Puskesmas',   12,  6,  1,  3,  22),
('IN004', 'Puskesmas Tebet',           'Puskesmas',   15,  8,  2,  4,  29),
('IN005', 'Klinik Sehat Sejahtera',    'Klinik',       5,  3,  1,  1,  10),
('IN006', 'Klinik Bunda Kasih',        'Klinik',       6,  4,  0,  1,  11),
('IN007', 'Apotek Kimia Farma',        'Apotek',       0,  0,  2,  1,   3),
('IN008', 'Apotek K-24',               'Apotek',       0,  0,  3,  2,   5);

-- ---------------------------------------------------------------------------
-- GRANT level database — aman dijalankan di project Nhost BARU:
-- role dicek dulu keberadaannya, jadi file TIDAK error walau role belum ada.
-- Permission Hasura (LANGKAH 3 di atas) tetap yang utama untuk aplikasi.
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anonymous') then
    grant usage on schema public to anonymous;
    grant select on public.data_nakes, public.institusi_named, public.institusi_nakes to anonymous;
  end if;
  if exists (select 1 from pg_roles where rolname = 'user') then
    grant usage on schema public to "user";
    grant select, insert, update, delete on public.data_nakes, public.institusi_named, public.institusi_nakes to "user";
  end if;
  grant usage on schema public to public;
  grant select, insert, update, delete on public.data_nakes, public.institusi_named, public.institusi_nakes to public;
end $$;

-- ---------------------------------------------------------------------------
-- VERIFIKASI cepat setelah Run (hasilnya di panel bawah SQL Editor):
--   select count(*) from public.data_nakes;            -- harus 21
--   select count(*) from public.data_nakes where foto_url is not null;  -- 21
--   select count(*) from public.institusi_named;       -- harus 8
--   select count(*) from public.institusi_nakes;       -- harus 8
--
-- LANJUTAN WAJIB: LANGKAH 2 (Track) & LANGKAH 3 (Permissions) di bagian atas.
-- Tanpa LANGKAH 2 -> error F12: [UNTRACKED_TABLE] field 'data_nakes' not
-- found in type 'query_root'.
-- Tanpa LANGKAH 3 -> GraphQL balas "permission denied" / tampilan kosong.
-- ============================================================================
