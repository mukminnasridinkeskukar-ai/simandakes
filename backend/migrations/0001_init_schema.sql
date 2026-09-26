-- =============================================================
-- SIMANDAKES - Migration 0001: Initial Schema
-- Target: Nhost (Postgres 15 + Hasura GraphQL)
--
-- Tabel yang dibuat:
--   1. public.users              - akun login (admin/operator)
--   2. public.data_nakes         - data tenaga kesehatan (dokter, bidan, perawat, dll)
--   3. public.institusi_named    - data institusi Named (inovasi dash)
--   4. public.institusi_nakes    - data agregat nakes per institusi (perawat/bidan/apoteker)
--   5. public.inovash_links      - konfigurasi link dashboard Inovash
--
-- Catatan:
--   - Semua tabel memakai UUID sebagai primary key (default Nhost)
--   - Timestamp pakai timestamptz (default now())
--   - Soft-delete pakai kolom `deleted_at` (NULL = aktif)
--   - Audit trail pakai created_at / updated_at
-- =============================================================

-- =============================================================
-- 1. EXTENSIONS
-- =============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
-- 2. USERS TABLE (akun login)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username        TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,            -- hash bcrypt/sha256 (jangan simpan plain text!)
    nama_lengkap    TEXT NOT NULL,
    role            TEXT NOT NULL DEFAULT 'operator'
                    CHECK (role IN ('admin', 'operator', 'viewer')),
    email           TEXT UNIQUE,
    status          TEXT NOT NULL DEFAULT 'aktif'
                    CHECK (status IN ('aktif', 'nonaktif', 'suspended')),
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
-- 3. DATA_NAKES TABLE
--    Sheet asli: DataNakes (ID, Nama, Jenis, Spesialisasi, STR, SIP, Alamat, Jadwal, Telepon, Email, Status, Foto, AlamatGoogleMaps)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.data_nakes (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- ID legacy dari Google Sheets (string, dipertahankan untuk kompatibilitas)
    legacy_id           TEXT UNIQUE,
    nama                TEXT NOT NULL,
    jenis               TEXT NOT NULL
                        CHECK (jenis IN ('Dokter', 'Dokter Gigi', 'Bidan', 'Perawat', 'Apoteker', 'Tenaga Kesehatan Lainnya')),
    spesialisasi        TEXT,
    str                 TEXT,                  -- Surat Tanda Registrasi
    sip                 TEXT,                  -- Surat Izin Praktik
    alamat_praktik      TEXT,
    jadwal_praktik      TEXT,
    no_telepon          TEXT,
    email               TEXT,
    status              TEXT NOT NULL DEFAULT 'aktif'
                        CHECK (status IN ('aktif', 'nonaktif', 'cuti', 'keluar')),
    foto_url            TEXT,
    alamat_google_maps  TEXT,                  -- URL Google Maps lengkap
    -- Metadata
    created_by          UUID REFERENCES public.users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ
);

COMMENT ON TABLE public.data_nakes IS 'Data tenaga kesehatan individual (Nakes)';

CREATE INDEX idx_data_nakes_jenis        ON public.data_nakes (jenis) WHERE deleted_at IS NULL;
CREATE INDEX idx_data_nakes_status        ON public.data_nakes (status) WHERE deleted_at IS NULL;
CREATE INDEX idx_data_nakes_spesialisasi  ON public.data_nakes (spesialisasi) WHERE deleted_at IS NULL;
CREATE INDEX idx_data_nakes_nama_trgm     ON public.data_nakes USING gin (nama gin_trgm_ops);
CREATE INDEX idx_data_nakes_created_at    ON public.data_nakes (created_at DESC);

-- =============================================================
-- 4. INSTITUSI_NAMED TABLE
--    Sheet asli: Named (inovasi Named - data institusi dengan jumlah dokter/gigi)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.institusi_named (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    legacy_id       TEXT UNIQUE,
    nama            TEXT NOT NULL,
    tipe            TEXT NOT NULL DEFAULT 'Lainnya'
                    CHECK (tipe IN ('RS', 'Puskesmas', 'Klinik', 'Apotek', 'Lainnya')),
    dokter          INTEGER NOT NULL DEFAULT 0 CHECK (dokter >= 0),
    dokter_gigi     INTEGER NOT NULL DEFAULT 0 CHECK (dokter_gigi >= 0),
    total           INTEGER NOT NULL DEFAULT 0 CHECK (total >= 0),
    persentase      TEXT,                       -- dipertahankan string karena formatnya "12.5%"
    updated_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);

COMMENT ON TABLE public.institusi_named IS 'Data institusi untuk dashboard Named (inovasi Named)';

CREATE INDEX idx_institusi_named_tipe ON public.institusi_named (tipe) WHERE deleted_at IS NULL;

-- =============================================================
-- 5. INSTITUSI_NAKES TABLE
--    Sheet asli: Nakes (agregat nakes per institusi: perawat/bidan/apoteker/lainnya)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.institusi_nakes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    legacy_id       TEXT UNIQUE,
    institusi       TEXT NOT NULL,
    tipe            TEXT NOT NULL DEFAULT 'Lainnya'
                    CHECK (tipe IN ('RS', 'Puskesmas', 'Klinik', 'Apotek', 'Lainnya')),
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
CREATE INDEX idx_institusi_nakes_institusi   ON public.institusi_nakes (institusi) WHERE deleted_at IS NULL;

-- =============================================================
-- 6. INOVASH_LINKS TABLE
--    LocalStorage asli: simandakes_inovash_links (12 link platform dashboard Inovash)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.inovash_links (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug            TEXT NOT NULL UNIQUE,       -- contoh: 'simrs', 'sirs', 'sip'
    title           TEXT NOT NULL,
    url             TEXT NOT NULL,
    category        TEXT NOT NULL DEFAULT 'umum'
                    CHECK (category IN ('umum', 'pelayanan', 'admin', 'laporan')),
    emoji           TEXT DEFAULT '🔗',
    color           TEXT DEFAULT '#059669',
    is_active       BOOLEAN NOT NULL DEFAULT true,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.inovash_links IS 'Konfigurasi link platform pada dashboard Inovash';

CREATE INDEX idx_inovash_links_category ON public.inovash_links (category) WHERE is_active = true;
CREATE INDEX idx_inovash_links_sort     ON public.inovash_links (sort_order);

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

DROP TRIGGER IF EXISTS trg_inovash_links_updated_at ON public.inovash_links;
CREATE TRIGGER trg_inovash_links_updated_at BEFORE UPDATE ON public.inovash_links
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================
-- 8. SEED DATA - Insert link Inovash default (12 platform)
-- =============================================================
INSERT INTO public.inovash_links (slug, title, url, category, emoji, color, sort_order) VALUES
    ('simrs',     'SIMRS',           'https://example.com/simrs',     'pelayanan', '🏥', '#059669', 1),
    ('sirs',      'SIRS',            'https://example.com/sirs',      'pelayanan', '📊', '#2563eb', 2),
    ('sip',       'SIP Online',      'https://example.com/sip',       'pelayanan', '📝', '#7c3aed', 3),
    ('sirisan',   'SIRISAN',         'https://example.com/sirisan',   'pelayanan', '💉', '#f97316', 4),
    ('siti-nakes','SITI Nakes',      'https://example.com/siti',      'pelayanan', '👨‍⚕️', '#14b8a6', 5),
    ('siakda',    'SIAKDA',          'https://example.com/siakda',    'admin',     '⚙️', '#dc2626', 6),
    ('simf ',     'SIMF',            'https://example.com/simf',      'admin',     '🗂️', '#0891b2', 7),
    ('sippp',     'SIPP Online',     'https://example.com/sippp',     'admin',     '📋', '#9333ea', 8),
    ('e-imdb',    'E-IMDB',          'https://example.com/e-imdb',   'laporan',   '📈', '#16a34a', 9),
    ('eturbux',   'e-Turbux',        'https://example.com/eturbux',   'laporan',   '🌐', '#0d9488', 10),
    ('sehat-cek', 'SehatCek',        'https://example.com/sehatcek',  'umum',      '✅', '#65a30d', 11),
    ('isoman',    'Isoman Apps',     'https://example.com/isoman',    'umum',      '🏠', '#92400e', 12)
ON CONFLICT (slug) DO NOTHING;

-- =============================================================
-- 9. SEED USER ADMIN DEFAULT
--    Username: admin
--    Password: admin123  (HASH INI HANYA CONTOH — ganti di production!)
--    Hash di bawah adalah bcrypt untuk "admin123" dengan cost 10
--    Generate hash baru: https://bcrypt-generator.com/
-- =============================================================
INSERT INTO public.users (username, password_hash, nama_lengkap, role, email, status) VALUES
    ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Administrator Sistem', 'admin', 'admin@simandakes.id', 'aktif')
ON CONFLICT (username) DO NOTHING;

-- =============================================================
-- DONE
-- =============================================================
