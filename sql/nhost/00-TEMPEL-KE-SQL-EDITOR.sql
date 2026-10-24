--  SIMANDAKES — FILE SQL SATU PAKET UNTUK NHOST (PostgreSQL + Hasura)
--  Isi: buat tabel + isi data 21 praktik mandiri (foto & daftar layanan)
--
--  CARA PAKAI (hanya 2 langkah, tanpa perintah apa pun):
--
--  LANGKAH 1.
--    Buka Nhost Dashboard Anda -> menu "SQL" (SQL Editor)
--    -> copy SELURUH isi file ini -> paste -> klik tombol "Run"
--
--  LANGKAH 2. (wajib, supaya tabel muncul di GraphQL)
--    Nhost Dashboard -> "Hasura Console" -> menu "Data" (kiri)
--    -> pilih database "default" -> schema "public"
--    -> klik "Track" pada 3 tabel:  data_nakes, institusi_named,
--       institusi_nakes   (jika ada tombol "Track all", pakai itu)
--
--  SELESAI. Tes cepat di GraphiQL (menu "GraphiQL"):
--      { data_nakes { nama foto_url } }
--
--  File ini aman dijalankan BERULANG (idempoten): tabel tidak diduplikasi,
--  data di-reset ke 21 praktik mandiri + 16 institusi setiap kali dijalankan.

-- ---------------------------------------------------------------------------
-- (OPSIONAL) PEMBERSIH — buka tanda "--" di baris bawah HANYA jika Anda
-- sebelumnya pernah membuat tabel versi lama (huruf besar/CamelCase),
-- contoh dari draft Supabase: "DataNakes", "InstitusiNamed", "InstitusiNakes".
-- ---------------------------------------------------------------------------
-- drop table if exists public."DataNakes";
-- drop table if exists public."InstitusiNamed";
-- drop table if exists public."InstitusiNakes";
-- drop table if exists public.data_nakes_old;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- TABEL data_nakes — PRAKTIK MANDIRI (menu Tenaga Medis & Tenaga Kesehatan)
create table if not exists public.data_nakes (
  id                 uuid primary key default gen_random_uuid(),
  nama               text not null,
  jenis              text not null default 'Tenaga Kesehatan Lainnya',
                     -- 12 profesi: Dokter | Dokter Spesialis | Dokter Gigi |
                     -- Perawat | Bidan | Apoteker | Fisioterapis | dst.
  spesialisasi       text,
  str                text,   -- Surat Tanda Registrasi
  sip                text,   -- Surat Izin Praktik
  alamat_praktik     text,   -- lokasi praktik mandiri
  jadwal_praktik     text,   -- jadwal praktik mandiri
  daftar_layanan     text,   -- DAFTAR LAYANAN praktik mandiri
  status             text not null default 'aktif',  -- aktif | nonaktif | cuti
  foto_url           text,   -- FOTO PROFIL (banner atas kartu; besar di pop up)
  alamat_google_maps text,   -- URL Google Maps lokasi praktik
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

comment on table  public.data_nakes                 is 'Data Praktik Mandiri (tenaga medis & tenaga kesehatan) — tanpa email/telepon, ada Daftar Layanan & Foto Profil';
comment on column public.data_nakes.daftar_layanan  is 'Daftar Layanan praktik mandiri, dipisah baris baru / koma / titik-koma';
comment on column public.data_nakes.foto_url        is 'URL foto profil (banner atas kartu, tampil besar di pop up detail)';

create index if not exists data_nakes_jenis_idx on public.data_nakes (jenis);
create index if not exists data_nakes_status_idx on public.data_nakes (status);
create index if not exists data_nakes_nama_idx on public.data_nakes (nama);

drop trigger if exists trg_data_nakes_updated_at on public.data_nakes;
create trigger trg_data_nakes_updated_at
  before update on public.data_nakes
  for each row execute function public.set_updated_at();

-- TABEL institusi_named — institusi ber_tenaga medis (RS/Puskesmas/Klinik/Apotek)
create table if not exists public.institusi_named (
  id          uuid primary key default gen_random_uuid(),
  nama        text not null,
  tipe        text not null default 'Lainnya',  -- RS | Puskesmas | Klinik | Apotek | Lainnya
  dokter      integer not null default 0,
  dokter_gigi integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.institusi_named is 'Institusi kesehatan ber-tenaga medis (jumlah dokter & dokter gigi)';

create index if not exists institusi_named_tipe_idx on public.institusi_named (tipe);

drop trigger if exists trg_institusi_named_updated_at on public.institusi_named;
create trigger trg_institusi_named_updated_at
  before update on public.institusi_named
  for each row execute function public.set_updated_at();

-- TABEL institusi_nakes — institusi ber_tenaga kesehatan
create table if not exists public.institusi_nakes (
  id         uuid primary key default gen_random_uuid(),
  nama       text not null,
  tipe       text not null default 'Lainnya',
  perawat    integer not null default 0,
  bidan      integer not null default 0,
  apoteker   integer not null default 0,
  lainnya    integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.institusi_nakes is 'Institusi kesehatan ber-tenaga kesehatan (perawat, bidan, apoteker, lainnya)';

create index if not exists institusi_nakes_tipe_idx on public.institusi_nakes (tipe);

drop trigger if exists trg_institusi_nakes_updated_at on public.institusi_nakes;
create trigger trg_institusi_nakes_updated_at
  before update on public.institusi_nakes
  for each row execute function public.set_updated_at();


-- ISI DATA (di-reset setiap file ini dijalankan)

truncate table public.data_nakes, public.institusi_named, public.institusi_nakes;

-- ---------- DATA NAKES / PRAKTIK MANDIRI (21 profil + foto) ----------
insert into public.data_nakes (nama, jenis, spesialisasi, str, sip, alamat_praktik, jadwal_praktik, daftar_layanan, status, foto_url, alamat_google_maps)
values ('Andi Wijaya, M.Psi, Psikolog', 'Psikolog Klinis', 'Klinis Dewasa', 'STR-017', 'SIP-017', 'Jl. Cipta No. 11, Jakarta Selatan', 'Senin-Jumat 13:00-20:00', 'Konsultasi Psikologi
Tes Psikologi
Terapi CBT
Konseling Stres & Kecemasan', 'aktif', '/foto/nakes-17.jpg', 'https://www.google.com/maps?q=Jl+Cipta+11+Jakarta');
insert into public.data_nakes (nama, jenis, spesialisasi, str, sip, alamat_praktik, jadwal_praktik, daftar_layanan, status, foto_url, alamat_google_maps)
values ('Apt. Hendra Wijaya, S.Farm', 'Apoteker', 'Farmasi', 'STR-013', 'SIP-013', 'Jl. Gajah Mada No. 33, Medan', 'Senin-Sabtu 08:00-21:00', 'Penjualan Obat Resep & Bebas
Konsultasi Obat
Cek Tensi Gratis
Racik Obat', 'aktif', '/foto/nakes-13.jpg', 'https://www.google.com/maps?q=Jl+Gajah+Mada+33+Medan');
insert into public.data_nakes (nama, jenis, spesialisasi, str, sip, alamat_praktik, jadwal_praktik, daftar_layanan, status, foto_url, alamat_google_maps)
values ('Apt. Lia Anggraini, S.Farm', 'Apoteker', 'Farmasi', 'STR-014', 'SIP-014', 'Jl. Veteran No. 12, Makassar', 'Senin-Jumat 09:00-17:00', 'Penjualan Obat
Vitamin & Suplemen
Alat Kesehatan
Konsultasi Farmasi', 'aktif', '/foto/nakes-14.jpg', 'https://www.google.com/maps?q=Jl+Veteran+12+Makassar');
insert into public.data_nakes (nama, jenis, spesialisasi, str, sip, alamat_praktik, jadwal_praktik, daftar_layanan, status, foto_url, alamat_google_maps)
values ('Bidan Aisyah Putri, S.Keb', 'Bidan', 'Kebidanan', 'STR-009', 'SIP-009', 'Jl. Diponegoro No. 15, Surabaya', 'Setiap hari 08:00-20:00', 'Pemeriksaan Kehamilan (ANC)
Persalinan Normal
Konsultasi KB
Imunisasi Bayi
Konsultasi Menyusui', 'aktif', '/foto/nakes-09.jpg', 'https://www.google.com/maps?q=Jl+Diponegoro+15+Surabaya');
insert into public.data_nakes (nama, jenis, spesialisasi, str, sip, alamat_praktik, jadwal_praktik, daftar_layanan, status, foto_url, alamat_google_maps)
values ('Bidan Fatimah Zahra, S.Keb', 'Bidan', 'Kebidanan', 'STR-010', 'SIP-010', 'Jl. Pahlawan No. 22, Semarang', 'Senin-Sabtu 09:00-18:00', 'Pemeriksaan Kehamilan
Senam Hamil
Pijat Bayi
Kelas Ibu Hamil', 'aktif', '/foto/nakes-10.jpg', 'https://www.google.com/maps?q=Jl+Pahlawan+22+Semarang');
insert into public.data_nakes (nama, jenis, spesialisasi, str, sip, alamat_praktik, jadwal_praktik, daftar_layanan, status, foto_url, alamat_google_maps)
values ('Dewi Utami, S.OT', 'Okupasi Terapis', 'Rehabilitasi ADL', 'STR-020', 'SIP-020', 'Jl. Mawar No. 6, Jakarta', 'Senin-Sabtu 10:00-16:00', 'Latihan Aktivitas Harian (ADL)
Terapi Sensori Integrasi
Rehabilitasi Kognitif
Home Program', 'aktif', '/foto/nakes-20.jpg', 'https://www.google.com/maps?q=Jl+Mawar+6+Jakarta');
insert into public.data_nakes (nama, jenis, spesialisasi, str, sip, alamat_praktik, jadwal_praktik, daftar_layanan, status, foto_url, alamat_google_maps)
values ('Maya Sari, M.Psi, Psikolog', 'Psikolog Klinis', 'Anak & Remaja', 'STR-018', 'SIP-018', 'Jl. Bunga No. 9, Surabaya', 'Selasa-Sabtu 10:00-17:00', 'Psikologi Anak & Remaja
Tes IQ & Kecerdasan
Terapi Perilaku
Parenting Class', 'aktif', '/foto/nakes-18.jpg', 'https://www.google.com/maps?q=Jl+Bunga+9+Surabaya');
insert into public.data_nakes (nama, jenis, spesialisasi, str, sip, alamat_praktik, jadwal_praktik, daftar_layanan, status, foto_url, alamat_google_maps)
values ('Ns. Dewi Lestari, S.Kep', 'Perawat', 'Keperawatan', 'STR-011', 'SIP-011', 'Jl. Kartini No. 8, Yogyakarta', 'Shift pagi-sore', 'Perawatan Luka
Suntik & Infus
Cek Tensi & Gula Darah
Perawatan Lansia', 'aktif', '/foto/nakes-11.jpg', 'https://www.google.com/maps?q=Jl+Kartini+8+Yogyakarta');
insert into public.data_nakes (nama, jenis, spesialisasi, str, sip, alamat_praktik, jadwal_praktik, daftar_layanan, status, foto_url, alamat_google_maps)
values ('Ns. Rina Marlina, S.Kep', 'Perawat', 'Keperawatan', 'STR-012', 'SIP-012', 'Jl. Ahmad Yani No. 19, Malang', 'Shift malam', 'Home Care
Pemasangan Kateter
Terapi Oksigen
Edukasi Kesehatan', 'aktif', '/foto/nakes-12.jpg', 'https://www.google.com/maps?q=Jl+Ahmad+Yani+19+Malang');
insert into public.data_nakes (nama, jenis, spesialisasi, str, sip, alamat_praktik, jadwal_praktik, daftar_layanan, status, foto_url, alamat_google_maps)
values ('Rini Astuti, S.Ter.Wic', 'Terapis Wicara', 'Komunikasi & Bicara', 'STR-019', 'SIP-019', 'Jl. Anggrek No. 4, Bandung', 'Senin-Jumat 09:00-15:00', 'Terapi Bicara Anak
Terapi Telan (BBD)
Evaluasi Komunikasi
Latihan Menelan', 'aktif', '/foto/nakes-19.jpg', 'https://www.google.com/maps?q=Jl+Anggrek+4+Bandung');
insert into public.data_nakes (nama, jenis, spesialisasi, str, sip, alamat_praktik, jadwal_praktik, daftar_layanan, status, foto_url, alamat_google_maps)
values ('Sari Indah, S.Ft', 'Fisioterapis', 'Olahraga', 'STR-016', 'SIP-016', 'Jl. Melati No. 3, Bandung', 'Senin-Sabtu 09:00-16:00', 'Fisioterapi Olahraga
Terapi Sendi & Otot
TENS & Ultrasound
Home Visit', 'aktif', '/foto/nakes-16.jpg', 'https://www.google.com/maps?q=Jl+Melati+3+Bandung');
insert into public.data_nakes (nama, jenis, spesialisasi, str, sip, alamat_praktik, jadwal_praktik, daftar_layanan, status, foto_url, alamat_google_maps)
values ('Siti Halimah, Amd.G', 'Terapis Gigi dan Mulut', 'Hygienist', 'STR-021', 'SIP-021', 'Jl. Kenanga No. 8, Medan', 'Senin-Jumat 08:00-14:00', 'Scaling & Pembersihan Karang Gigi
Pemutihan Gigi
Edukasi Kesehatan Gigi
Fluorisasi', 'aktif', '/foto/nakes-21.jpg', 'https://www.google.com/maps?q=Jl+Kenanga+8+Medan');
insert into public.data_nakes (nama, jenis, spesialisasi, str, sip, alamat_praktik, jadwal_praktik, daftar_layanan, status, foto_url, alamat_google_maps)
values ('Yoga Pratama, S.Ft', 'Fisioterapis', 'Rehabilitasi Fisik', 'STR-015', 'SIP-015', 'Jl. Cendrawasih No. 7, Bali', 'Senin-Jumat 10:00-18:00', 'Terapi Nyeri Punggung
Rehabilitasi Post-Stroke
Terapi Olahraga
Pijat Terapi', 'aktif', '/foto/nakes-15.jpg', 'https://www.google.com/maps?q=Jl+Cendrawasih+7+Bali');
insert into public.data_nakes (nama, jenis, spesialisasi, str, sip, alamat_praktik, jadwal_praktik, daftar_layanan, status, foto_url, alamat_google_maps)
values ('dr. Ahmad Fauzi, Sp.PD', 'Dokter Spesialis', 'Penyakit Dalam', 'STR-001', 'SIP-001', 'Jl. Merdeka No. 10, Jakarta Pusat', 'Senin-Jumat 08:00-14:00', 'Konsultasi Penyakit Dalam
Medical Check-up
Pengelolaan Diabetes
Pengelolaan Hipertensi', 'aktif', '/foto/nakes-01.jpg', 'https://www.google.com/maps?q=Jl+Merdeka+10+Jakarta');
insert into public.data_nakes (nama, jenis, spesialisasi, str, sip, alamat_praktik, jadwal_praktik, daftar_layanan, status, foto_url, alamat_google_maps)
values ('dr. Bambang Sutrisno, Sp.B', 'Dokter Spesialis', 'Bedah', 'STR-003', 'SIP-003', 'Jl. Pahlawan No. 5, Bandung', 'Senin-Jumat 10:00-16:00', 'Konsultasi Bedah Umum
Prosedur Bedah Minor
Perawatan Luka
Konsultasi Pasca Operasi', 'aktif', '/foto/nakes-03.jpg', 'https://www.google.com/maps?q=Jl+Pahlawan+5+Bandung');
insert into public.data_nakes (nama, jenis, spesialisasi, str, sip, alamat_praktik, jadwal_praktik, daftar_layanan, status, foto_url, alamat_google_maps)
values ('dr. Joko Susilo', 'Dokter', 'Umum', 'STR-007', 'SIP-007', 'Jl. Ahmad Yani No. 19, Malang', 'Setiap hari 08:00-20:00', 'Konsultasi Umum
Pemeriksaan Tensi & Gula Darah
Vaksinasi & Imunisasi
Sertifikat Kesehatan', 'aktif', '/foto/nakes-07.jpg', 'https://www.google.com/maps?q=Jl+Ahmad+Yani+19+Malang');
insert into public.data_nakes (nama, jenis, spesialisasi, str, sip, alamat_praktik, jadwal_praktik, daftar_layanan, status, foto_url, alamat_google_maps)
values ('dr. Rina Wati', 'Dokter', 'Umum', 'STR-006', 'SIP-006', 'Jl. Kartini No. 22, Semarang', 'Senin-Jumat 08:00-14:00', 'Konsultasi Umum
Medical Check-up
Suntik & Vitamin
Perawatan Ringan', 'aktif', '/foto/nakes-06.jpg', 'https://www.google.com/maps?q=Jl+Kartini+22+Semarang');
insert into public.data_nakes (nama, jenis, spesialisasi, str, sip, alamat_praktik, jadwal_praktik, daftar_layanan, status, foto_url, alamat_google_maps)
values ('dr. Siti Aminah, Sp.A', 'Dokter Spesialis', 'Anak', 'STR-002', 'SIP-002', 'Jl. Sudirman No. 25, Jakarta Selatan', 'Senin-Sabtu 09:00-15:00', 'Konsultasi Kesehatan Anak
Imunisasi
Pemantauan Tumbuh Kembang
Perawatan Bayi & Balita', 'aktif', '/foto/nakes-02.jpg', 'https://www.google.com/maps?q=Jl+Sudirman+25+Jakarta');
insert into public.data_nakes (nama, jenis, spesialisasi, str, sip, alamat_praktik, jadwal_praktik, daftar_layanan, status, foto_url, alamat_google_maps)
values ('drg. Budi Hartono', 'Dokter Gigi', 'Umum', 'STR-008', 'SIP-008', 'Jl. Pemuda No. 33, Medan', 'Senin-Sabtu 09:00-15:00', 'Tambal Gigi
Cabut Gigi
Scaling
Konsultasi Kesehatan Gigi', 'aktif', '/foto/nakes-08.jpg', 'https://www.google.com/maps?q=Jl+Pemuda+33+Medan');
insert into public.data_nakes (nama, jenis, spesialisasi, str, sip, alamat_praktik, jadwal_praktik, daftar_layanan, status, foto_url, alamat_google_maps)
values ('drg. Dewi Saraswati, Sp.Ort', 'Dokter Gigi Spesialis', 'Ortodonsia', 'STR-004', 'SIP-004', 'Jl. Diponegoro No. 8, Surabaya', 'Senin-Jumat 09:00-17:00', 'Pemasangan Behel
Perawatan Ortodonti
Koreksi Gigi Tidak Sejajar
Retainer', 'aktif', '/foto/nakes-04.jpg', 'https://www.google.com/maps?q=Jl+Diponegoro+8+Surabaya');
insert into public.data_nakes (nama, jenis, spesialisasi, str, sip, alamat_praktik, jadwal_praktik, daftar_layanan, status, foto_url, alamat_google_maps)
values ('drg. Hendra Kusuma, Sp.Pros', 'Dokter Gigi Spesialis', 'Prostodonsia', 'STR-005', 'SIP-005', 'Jl. Gatot Subroto No. 12, Bandung', 'Selasa-Sabtu 10:00-18:00', 'Gigi Tiruan & Crown
Veneer Gigi
Perawatan Prostodonti
Pemutihan Gigi', 'aktif', '/foto/nakes-05.jpg', 'https://www.google.com/maps?q=Jl+Gatot+Subroto+12+Bandung');

-- ---------- INSTITUSI NAMED (8) ----------
insert into public.institusi_named (nama, tipe, dokter, dokter_gigi)
values ('Apotek K-24', 'Apotek', 0, 0);
insert into public.institusi_named (nama, tipe, dokter, dokter_gigi)
values ('Apotek Kimia Farma', 'Apotek', 0, 0);
insert into public.institusi_named (nama, tipe, dokter, dokter_gigi)
values ('Klinik Bunda Kasih', 'Klinik', 3, 0);
insert into public.institusi_named (nama, tipe, dokter, dokter_gigi)
values ('Klinik Sehat Sejahtera', 'Klinik', 2, 1);
insert into public.institusi_named (nama, tipe, dokter, dokter_gigi)
values ('Puskesmas Kebon Jeruk', 'Puskesmas', 3, 1);
insert into public.institusi_named (nama, tipe, dokter, dokter_gigi)
values ('Puskesmas Tebet', 'Puskesmas', 4, 2);
insert into public.institusi_named (nama, tipe, dokter, dokter_gigi)
values ('RSUD Dr. Soetomo', 'RS', 45, 12);
insert into public.institusi_named (nama, tipe, dokter, dokter_gigi)
values ('RSUP Cipto Mangunkusumo', 'RS', 78, 20);

-- ---------- INSTITUSI NAKES (8) ----------
insert into public.institusi_nakes (nama, tipe, perawat, bidan, apoteker, lainnya)
values ('Apotek K-24', 'Apotek', 0, 0, 3, 2);
insert into public.institusi_nakes (nama, tipe, perawat, bidan, apoteker, lainnya)
values ('Apotek Kimia Farma', 'Apotek', 0, 0, 2, 1);
insert into public.institusi_nakes (nama, tipe, perawat, bidan, apoteker, lainnya)
values ('Klinik Bunda Kasih', 'Klinik', 6, 4, 0, 1);
insert into public.institusi_nakes (nama, tipe, perawat, bidan, apoteker, lainnya)
values ('Klinik Sehat Sejahtera', 'Klinik', 5, 3, 1, 1);
insert into public.institusi_nakes (nama, tipe, perawat, bidan, apoteker, lainnya)
values ('Puskesmas Kebon Jeruk', 'Puskesmas', 12, 6, 1, 3);
insert into public.institusi_nakes (nama, tipe, perawat, bidan, apoteker, lainnya)
values ('Puskesmas Tebet', 'Puskesmas', 15, 8, 2, 4);
insert into public.institusi_nakes (nama, tipe, perawat, bidan, apoteker, lainnya)
values ('RSUD Dr. Soetomo', 'RS', 120, 25, 8, 15);
insert into public.institusi_nakes (nama, tipe, perawat, bidan, apoteker, lainnya)
values ('RSUP Cipto Mangunkusumo', 'RS', 180, 32, 12, 20);

-- Verifikasi cepat:
-- select jenis, count(*) from public.data_nakes group by jenis order by jenis;
-- select count(*) as praktik_mandiri_dengan_foto from public.data_nakes where foto_url is not null;

-- GRANT untuk role bawaan Nhost (Hasura memakai role ini pada permission):
--   anonymous = pengunjung publik   |   "user" = pengguna terautentikasi
-- (Catatan: jika request GraphQL memakai x-hasura-admin-secret, Hasura
--  berjalan sebagai admin dan GRANT ini tidak diperlukan — tetap disertakan
--  agar aman untuk skenario role anonymous/"user".)
grant usage on schema public to anonymous, "user";

grant select on public.data_nakes, public.institusi_named, public.institusi_nakes
  to anonymous, "user";

grant insert, update, delete on public.data_nakes, public.institusi_named, public.institusi_nakes
  to "user";

-- ---------------------------------------------------------------------------
-- LANJUTAN WAJIB: TRACK tabel di Hasura (LANGKAH 2 di bagian atas).
-- Tanpa ini, GraphQL akan menjawab: field 'data_nakes' not found
-- in type 'query_root' ([UNTRACKED_TABLE]).
-- ---------------------------------------------------------------------------
