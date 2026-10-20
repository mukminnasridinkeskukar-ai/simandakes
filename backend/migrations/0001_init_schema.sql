-- =============================================================
-- SIMANDAKES - Migration 0001: Initial Schema (v2.1)
-- Target: Nhost (Postgres 15 + Hasura GraphQL)
--
-- Schema ini disesuaikan dengan struktur sidebar aplikasi:
--   Dashboard:
--     - Named    → public.institusi_named
--     - Nakes    → public.data_nakes
--   Pelayanan Kesehatan (filter dari public.data_nakes berdasarkan jenis):
--     - Cari Dokter       → jenis = 'Dokter'
--     - Cari Dokter Gigi  → jenis = 'Dokter Gigi'
--     - Cari Bidan        → jenis = 'Bidan'
--     - Cari Perawat      → jenis = 'Perawat'
--     - Cari Apoteker     → jenis = 'Apoteker'
--     - Cari Praktik      → semua jenis (Seluruh Data)
--   Panel Admin:
--     - Admin Dashboard   → akses ke semua tabel + public.users
--
-- Tabel yang dibuat:
--   1. public.users              - akun login (admin/operator)
--   2. public.data_nakes          - data tenaga kesehatan (dokter, bidan, perawat, dll)
--   3. public.institusi_named     - data institusi Named (dashboard Named)
--   4. public.institusi_nakes     - agregat nakes per institusi (perawat/bidan/apoteker)
--
-- Catatan:
--   - Semua tabel memakai UUID sebagai primary key (default Nhost)
--   - Timestamp pakai timestamptz (default now())
--   - Soft-delete pakai kolom `deleted_at` (NULL = aktif)
--   - Audit trail pakai created_at / updated_at
--   - Enum values pakai CHECK constraint (lebih aman daripada string bebas)
-- =============================================================

-- =============================================================
-- 1. EXTENSIONS
-- =============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- untuk fuzzy search nama

-- =============================================================
-- 2. ENUM TYPES (lebih aman daripada string bebas)
-- =============================================================

-- Jenis tenaga kesehatan — sesuai menu Pelayanan di sidebar
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

-- Role user
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM (
        'admin',
        'operator',
        'viewer'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Status user
DO $$ BEGIN
    CREATE TYPE public.user_status AS ENUM (
        'aktif',
        'nonaktif',
        'suspended'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================
-- 3. USERS TABLE (akun login)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username        TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,            -- hash bcrypt (jangan plain text!)
    nama_lengkap    TEXT NOT NULL,
    role            public.user_role NOT NULL DEFAULT 'operator',
    email           TEXT UNIQUE,
    status          public.user_status NOT NULL DEFAULT 'aktif',
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);

COMMENT ON TABLE public.users IS 'Akun pengguna SIMANDAKES (admin/operator/viewer)';
COMMENT ON COLUMN public.users.password_hash IS 'Password di-hash (bcrypt). JANGAN simpan plain text.';

CREATE INDEX idx_users_username ON public.users (username) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role     ON public.users (role) WHERE deleted_at IS NULL;

-- =============================================================
-- 4. DATA_NAKES TABLE
--    Digunakan untuk menu:
--      - Nakes Directory (sidebar: Dashboard > Nakes)
--      - Cari Dokter, Cari Dokter Gigi, Cari Bidan, Cari Perawat, Cari Apoteker
--      - Cari Praktik (Seluruh Data, semua jenis)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.data_nakes (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    legacy_id           TEXT UNIQUE,         -- ID lama dari Google Sheets (kompatibilitas)
    nama                TEXT NOT NULL,
    jenis               public.nakes_jenis NOT NULL DEFAULT 'Tenaga Kesehatan Lainnya',
    spesialisasi        TEXT,
    str                 TEXT,                -- Surat Tanda Registrasi
    sip                 TEXT,                -- Surat Izin Praktik
    alamat_praktik      TEXT,
    jadwal_praktik      TEXT,
    no_telepon          TEXT,
    email               TEXT,
    status              public.nakes_status NOT NULL DEFAULT 'aktif',
    foto_url            TEXT,
    alamat_google_maps  TEXT,                -- URL Google Maps lengkap
    -- Metadata
    created_by          UUID REFERENCES public.users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ
);

COMMENT ON TABLE public.data_nakes IS 'Data tenaga kesehatan individual (Nakes)';

CREATE INDEX idx_data_nakes_jenis         ON public.data_nakes (jenis) WHERE deleted_at IS NULL;
CREATE INDEX idx_data_nakes_status         ON public.data_nakes (status) WHERE deleted_at IS NULL;
CREATE INDEX idx_data_nakes_spesialisasi   ON public.data_nakes (spesialisasi) WHERE deleted_at IS NULL;
CREATE INDEX idx_data_nakes_nama_trgm      ON public.data_nakes USING gin (nama gin_trgm_ops);
CREATE INDEX idx_data_nakes_created_at     ON public.data_nakes (created_at DESC);
CREATE INDEX idx_data_nakes_jenis_status   ON public.data_nakes (jenis, status) WHERE deleted_at IS NULL;

-- =============================================================
-- 5. INSTITUSI_NAMED TABLE
--    Digunakan untuk menu: Dashboard > Named
--    Menyimpan data institusi dengan jumlah dokter & dokter gigi
-- =============================================================
CREATE TABLE IF NOT EXISTS public.institusi_named (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    legacy_id       TEXT UNIQUE,
    nama            TEXT NOT NULL,
    tipe            public.institusi_tipe NOT NULL DEFAULT 'Lainnya',
    dokter          INTEGER NOT NULL DEFAULT 0 CHECK (dokter >= 0),
    dokter_gigi     INTEGER NOT NULL DEFAULT 0 CHECK (dokter_gigi >= 0),
    total           INTEGER NOT NULL DEFAULT 0 CHECK (total >= 0),
    persentase      TEXT,                       -- dipertahankan string karena formatnya "12.5%"
    updated_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);

COMMENT ON TABLE public.institusi_named IS 'Data institusi untuk dashboard Named';

CREATE INDEX idx_institusi_named_tipe ON public.institusi_named (tipe) WHERE deleted_at IS NULL;

-- =============================================================
-- 6. INSTITUSI_NAKES TABLE
--    Digunakan oleh admin dashboard: agregat nakes per institusi
--    (perawat/bidan/apoteker/lainnya)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.institusi_nakes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    legacy_id       TEXT UNIQUE,
    institusi       TEXT NOT NULL,
    tipe            public.institusi_tipe NOT NULL DEFAULT 'Lainnya',
    perawat         INTEGER NOT NULL DEFAULT 0 CHECK (perawat >= 0),
    bidan           INTEGER NOT NULL DEFAULT 0 CHECK (bidan >= 0),
    apoteker        INTEGER NOT NULL DEFAULT 0 CHECK (apoteker >= 0),
    lainnya         INTEGER NOT NULL DEFAULT 0 CHECK (lainnya >= 0),
    total           INTEGER NOT NULL DEFAULT 0 CHECK (total >= 0),
    updated_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);

COMMENT ON TABLE public.institusi_nakes IS 'Agregat jumlah nakes (perawat/bidan/apoteker/lainnya) per institusi';

CREATE INDEX idx_institusi_nakes_tipe       ON public.institusi_nakes (tipe) WHERE deleted_at IS NULL;
CREATE INDEX idx_institusi_nakes_institusi  ON public.institusi_nakes (institusi) WHERE deleted_at IS NULL;

-- =============================================================
-- 7. TRIGGERS untuk updated_at otomatis
-- =============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_data_nakes_updated_at ON public.data_nakes;
CREATE TRIGGER trg_data_nakes_updated_at BEFORE UPDATE ON public.data_nakes
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_institusi_named_updated_at ON public.institusi_named;
CREATE TRIGGER trg_institusi_named_updated_at BEFORE UPDATE ON public.institusi_named
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_institusi_nakes_updated_at ON public.institusi_nakes;
CREATE TRIGGER trg_institusi_nakes_updated_at BEFORE UPDATE ON public.institusi_nakes
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================
-- 8. SEED USER ADMIN DEFAULT
--    Username: admin
--    Password: admin123  (HASH INI HANYA CONTOH — ganti di production!)
--    Hash di bawah adalah bcrypt untuk "admin123" dengan cost 10
--    Generate hash baru: https://bcrypt-generator.com/
-- =============================================================
INSERT INTO public.users (username, password_hash, nama_lengkap, role, email, status) VALUES
    ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Administrator Sistem', 'admin', 'admin@simandakes.id', 'aktif')
ON CONFLICT (username) DO NOTHING;

-- =============================================================
-- 9. SAMPLE DATA NAKES (untuk demo — hapus di production)
-- =============================================================
INSERT INTO public.data_nakes (legacy_id, nama, jenis, spesialisasi, str, sip, alamat_praktik, jadwal_praktik, no_telepon, email, status, foto_url, alamat_google_maps) VALUES
    -- Dokter Spesialis
    ('NK001', 'dr. Ahmad Fauzi, Sp.PD',     'Dokter Spesialis', 'Penyakit Dalam',  'STR-001', 'SIP-001', 'Jl. Merdeka No. 10, Jakarta Pusat',  'Senin-Jumat 08:00-14:00', '081234567001', 'ahmad.fauzi@simandakes.id',  'aktif',     NULL, 'https://www.google.com/maps?q=Jl+Merdeka+10+Jakarta'),
    ('NK002', 'dr. Siti Aminah, Sp.A',     'Dokter Spesialis', 'Anak',           'STR-002', 'SIP-002', 'Jl. Sudirman No. 25, Jakarta Selatan','Senin-Sabtu 09:00-15:00', '081234567002', 'siti.aminah@simandakes.id', 'aktif',     NULL, 'https://www.google.com/maps?q=Jl+Sudirman+25+Jakarta'),
    ('NK003', 'dr. Bambang Sutrisno, Sp.B', 'Dokter Spesialis', 'Bedah',          'STR-003', 'SIP-003', 'Jl. Pahlawan No. 5, Bandung',         'Senin-Jumat 10:00-16:00', '081234567003', 'bambang.s@simandakes.id',   'aktif',     NULL, 'https://www.google.com/maps?q=Jl+Pahlawan+5+Bandung'),
    -- Dokter Gigi Spesialis
    ('NK004', 'drg. Dewi Saraswati, Sp.Ort', 'Dokter Gigi Spesialis', 'Ortodonsia', 'STR-004', 'SIP-004', 'Jl. Diponegoro No. 8, Surabaya',     'Senin-Jumat 09:00-17:00', '081234567004', 'dewi.s@dgsimandakes.id',    'aktif',     NULL, 'https://www.google.com/maps?q=Jl+Diponegoro+8+Surabaya'),
    ('NK005', 'drg. Hendra Kusuma, Sp.Pros', 'Dokter Gigi Spesialis', 'Prostodonsia', 'STR-005', 'SIP-005', 'Jl. Gatot Subroto No. 12, Bandung','Selasa-Sabtu 10:00-18:00', '081234567005', 'hendra.k@dgsimandakes.id',  'aktif',     NULL, 'https://www.google.com/maps?q=Jl+Gatot+Subroto+12+Bandung'),
    -- Dokter Umum
    ('NK006', 'dr. Rina Wati',              'Dokter',           'Umum',           'STR-006', 'SIP-006', 'Jl. Kartini No. 22, Semarang',        'Senin-Jumat 08:00-14:00', '081234567006', 'rina.wati@simandakes.id',   'aktif',     NULL, 'https://www.google.com/maps?q=Jl+Kartini+22+Semarang'),
    ('NK007', 'dr. Joko Susilo',             'Dokter',           'Umum',           'STR-007', 'SIP-007', 'Jl. Ahmad Yani No. 19, Malang',       'Setiap hari 08:00-20:00', '081234567007', 'joko.susilo@simandakes.id','aktif',     NULL, 'https://www.google.com/maps?q=Jl+Ahmad+Yani+19+Malang'),
    -- Dokter Gigi Umum
    ('NK008', 'drg. Budi Hartono',           'Dokter Gigi',      'Umum',           'STR-008', 'SIP-008', 'Jl. Pemuda No. 33, Medan',             'Senin-Sabtu 09:00-15:00', '081234567008', 'budi.hartono@simandakes.id','aktif',    NULL, 'https://www.google.com/maps?q=Jl+Pemuda+33+Medan'),
    -- Bidan
    ('NK009', 'Bidan Aisyah Putri, S.Keb',   'Bidan',            'Kebidanan',      'STR-009', 'SIP-009', 'Jl. Diponegoro No. 15, Surabaya',     'Setiap hari 08:00-20:00', '081234567009', 'aisyah.putri@simandakes.id','aktif',    NULL, 'https://www.google.com/maps?q=Jl+Diponegoro+15+Surabaya'),
    ('NK010', 'Bidan Fatimah Zahra, S.Keb',  'Bidan',            'Kebidanan',      'STR-010', 'SIP-010', 'Jl. Pahlawan No. 22, Semarang',       'Senin-Sabtu 09:00-18:00', '081234567010', 'fatimah.zahra@simandakes.id','aktif',   NULL, 'https://www.google.com/maps?q=Jl+Pahlawan+22+Semarang'),
    -- Perawat
    ('NK011', 'Ns. Dewi Lestari, S.Kep',     'Perawat',          'Keperawatan',    'STR-011', 'SIP-011', 'Jl. Kartini No. 8, Yogyakarta',       'Shift pagi-sore',        '081234567011', 'dewi.lestari@simandakes.id','aktif',     NULL, 'https://www.google.com/maps?q=Jl+Kartini+8+Yogyakarta'),
    ('NK012', 'Ns. Rina Marlina, S.Kep',     'Perawat',          'Keperawatan',    'STR-012', 'SIP-012', 'Jl. Ahmad Yani No. 19, Malang',       'Shift malam',            '081234567012', 'rina.marlina@simandakes.id','aktif',    NULL, 'https://www.google.com/maps?q=Jl+Ahmad+Yani+19+Malang'),
    -- Apoteker
    ('NK013', 'Apt. Hendra Wijaya, S.Farm',  'Apoteker',         'Farmasi',        'STR-013', 'SIP-013', 'Jl. Gajah Mada No. 33, Medan',         'Senin-Sabtu 08:00-21:00', '081234567013', 'hendra.wijaya@simandakes.id','aktif',   NULL, 'https://www.google.com/maps?q=Jl+Gajah+Mada+33+Medan'),
    ('NK014', 'Apt. Lia Anggraini, S.Farm',  'Apoteker',         'Farmasi',        'STR-014', 'SIP-014', 'Jl. Veteran No. 12, Makassar',        'Senin-Jumat 09:00-17:00', '081234567014', 'lia.anggraini@simandakes.id','aktif',   NULL, 'https://www.google.com/maps?q=Jl+Veteran+12+Makassar'),
    -- Fisioterapis
    ('NK015', 'Yoga Pratama, S.Ft',          'Fisioterapis',     'Rehabilitasi Fisik', 'STR-015', 'SIP-015', 'Jl. Cendrawasih No. 7, Bali',      'Senin-Jumat 10:00-18:00', '081234567015', 'yoga.pratama@simandakes.id','aktif',    NULL, 'https://www.google.com/maps?q=Jl+Cendrawasih+7+Bali'),
    ('NK016', 'Sari Indah, S.Ft',            'Fisioterapis',     'Olahraga',       'STR-016', 'SIP-016', 'Jl. Melati No. 3, Bandung',           'Senin-Sabtu 09:00-16:00', '081234567016', 'sari.indah@simandakes.id', 'aktif',     NULL, 'https://www.google.com/maps?q=Jl+Melati+3+Bandung'),
    -- Psikolog Klinis
    ('NK017', 'Andi Wijaya, M.Psi, Psikolog', 'Psikolog Klinis', 'Klinis Dewasa',  'STR-017', 'SIP-017', 'Jl. Cipta No. 11, Jakarta Selatan',   'Senin-Jumat 13:00-20:00', '081234567017', 'andi.w@simandakes.id',     'aktif',     NULL, 'https://www.google.com/maps?q=Jl+Cipta+11+Jakarta'),
    ('NK018', 'Maya Sari, M.Psi, Psikolog',  'Psikolog Klinis',  'Anak & Remaja',  'STR-018', 'SIP-018', 'Jl. Bunga No. 9, Surabaya',           'Selasa-Sabtu 10:00-17:00', '081234567018', 'maya.sari@simandakes.id','aktif',     NULL, 'https://www.google.com/maps?q=Jl+Bunga+9+Surabaya'),
    -- Terapis Wicara
    ('NK019', 'Rini Astuti, S.Ter.Wic',      'Terapis Wicara',   'Komunikasi & Bicara', 'STR-019', 'SIP-019', 'Jl. Anggrek No. 4, Bandung',     'Senin-Jumat 09:00-15:00', '081234567019', 'rini.astuti@simandakes.id','aktif',    NULL, 'https://www.google.com/maps?q=Jl+Anggrek+4+Bandung'),
    -- Okupasi Terapis
    ('NK020', 'Dewi Utami, S.OT',            'Okupasi Terapis',  'Rehabilitasi ADL', 'STR-020', 'SIP-020', 'Jl. Mawar No. 6, Jakarta',         'Senin-Sabtu 10:00-16:00', '081234567020', 'dewi.utami@simandakes.id','aktif',    NULL, 'https://www.google.com/maps?q=Jl+Mawar+6+Jakarta'),
    -- Terapis Gigi dan Mulut
    ('NK021', 'Siti Halimah, Amd.G',         'Terapis Gigi dan Mulut', 'Hygienist', 'STR-021', 'SIP-021', 'Jl. Kenanga No. 8, Medan',         'Senin-Jumat 08:00-14:00', '081234567021', 'siti.halimah@simandakes.id','aktif',  NULL, 'https://www.google.com/maps?q=Jl+Kenanga+8+Medan')
ON CONFLICT (legacy_id) DO NOTHING;

-- =============================================================
-- 10. SAMPLE INSTITUSI NAMED (untuk dashboard Named)
-- =============================================================
INSERT INTO public.institusi_named (legacy_id, nama, tipe, dokter, dokter_gigi, total, persentase, updated_at) VALUES
    ('NM001', 'RSUD Dr. Soetomo',           'RS',         45, 12, 57,  '15.2%', now()),
    ('NM002', 'RSUP Cipto Mangunkusumo',     'RS',         78, 20, 98,  '26.1%', now()),
    ('NM003', 'Puskesmas Kebon Jeruk',       'Puskesmas',  3,  1,  4,  '1.1%',  now()),
    ('NM004', 'Puskesmas Tebet',             'Puskesmas',  4,  2,  6,  '1.6%',  now()),
    ('NM005', 'Klinik Sehat Sejahtera',      'Klinik',     2,  1,  3,  '0.8%',  now()),
    ('NM006', 'Klinik Bunda Kasih',          'Klinik',     3,  0,  3,  '0.8%',  now()),
    ('NM007', 'Apotek Kimia Farma',          'Apotek',     0,  0,  2,  '0.5%',  now()),
    ('NM008', 'Apotek K-24',                 'Apotek',     0,  0,  3,  '0.8%',  now())
ON CONFLICT (legacy_id) DO NOTHING;

-- =============================================================
-- 11. SAMPLE INSTITUSI NAKES (untuk admin dashboard)
-- =============================================================
INSERT INTO public.institusi_nakes (legacy_id, institusi, tipe, perawat, bidan, apoteker, lainnya, total, updated_at) VALUES
    ('IN001', 'RSUD Dr. Soetomo',           'RS',         120, 25, 8,  15, 168, now()),
    ('IN002', 'RSUP Cipto Mangunkusumo',     'RS',         180, 32, 12, 20, 244, now()),
    ('IN003', 'Puskesmas Kebon Jeruk',       'Puskesmas', 12,  6,  1,  3,  22,  now()),
    ('IN004', 'Puskesmas Tebet',             'Puskesmas', 15,  8,  2,  4,  29,  now()),
    ('IN005', 'Klinik Sehat Sejahtera',      'Klinik',    5,   3,  1,  1,  10, now()),
    ('IN006', 'Klinik Bunda Kasih',          'Klinik',    6,   4,  0,  1,  11, now()),
    ('IN007', 'Apotek Kimia Farma',          'Apotek',    0,   0,  2,  1,  3,  now()),
    ('IN008', 'Apotek K-24',                 'Apotek',    0,   0,  3,  2,  5,  now())
ON CONFLICT (legacy_id) DO NOTHING;

-- =============================================================
-- DONE
-- =============================================================
