-- ============================================================
-- SIMANDAKES - Initial Schema
-- Target: Nhost (Postgres + Hasura)
-- ============================================================

-- 1. TABEL: institusi (menggabungkan Named + Nakes sheets lama)
CREATE TABLE IF NOT EXISTS public.institusi (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nama                text NOT NULL,
    tipe                text NOT NULL CHECK (tipe IN ('RS','Puskesmas','Klinik','BPM','Lainnya')),
    dokter_count        integer NOT NULL DEFAULT 0 CHECK (dokter_count >= 0),
    dokter_gigi_count   integer NOT NULL DEFAULT 0 CHECK (dokter_gigi_count >= 0),
    perawat_count       integer NOT NULL DEFAULT 0 CHECK (perawat_count >= 0),
    bidan_count         integer NOT NULL DEFAULT 0 CHECK (bidan_count >= 0),
    apoteker_count      integer NOT NULL DEFAULT 0 CHECK (apoteker_count >= 0),
    lainnya_count       integer NOT NULL DEFAULT 0 CHECK (lainnya_count >= 0),
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE VIEW public.institusi_named_view AS
SELECT id, nama, tipe,
    dokter_count AS dokter,
    dokter_gigi_count AS "dokterGigi",
    (dokter_count + dokter_gigi_count) AS total,
    updated_at AS "updatedAt"
FROM public.institusi;

CREATE OR REPLACE VIEW public.institusi_nakes_view AS
SELECT id, nama, tipe,
    perawat_count AS perawat,
    bidan_count AS bidan,
    apoteker_count AS apoteker,
    lainnya_count AS lainnya,
    (perawat_count + bidan_count + apoteker_count + lainnya_count) AS total,
    updated_at AS "updatedAt"
FROM public.institusi;

-- 2. TABEL: nakes (tenaga kesehatan individual)
CREATE TABLE IF NOT EXISTS public.nakes (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nama            text NOT NULL,
    jenis           text NOT NULL CHECK (jenis IN ('dokter','dokter gigi','bidan','perawat','apoteker','lainnya')),
    spesialisasi    text,
    str             text,
    sip             text,
    alamat_praktik  text,
    jadwal_praktik  text,
    no_telepon      text,
    email           text,
    status          text NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif','nonaktif','cuti')),
    foto_url        text,
    maps_url        text,
    institusi_id    uuid REFERENCES public.institusi(id) ON DELETE SET NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nakes_jenis ON public.nakes(jenis);
CREATE INDEX IF NOT EXISTS idx_nakes_status ON public.nakes(status);
CREATE INDEX IF NOT EXISTS idx_nakes_institusi ON public.nakes(institusi_id);

-- 3. TABEL: platform_links (menggantikan INOVASH_LINKS hardcoded)
CREATE TABLE IF NOT EXISTS public.platform_links (
    id          integer PRIMARY KEY,
    title       text NOT NULL,
    subtitle    text,
    description text,
    icon_key    text,
    color       text,
    bg_color    text,
    url         text DEFAULT '',
    category    text CHECK (category IN ('Layanan','Registrasi','Program','Monitoring','Dinkes')),
    status      text CHECK (status IN ('active','coming_soon','custom')) DEFAULT 'coming_soon',
    sort_order  integer DEFAULT 0,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 4. TABEL: user_profiles (extend auth.users bawaan Nhost)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username    text UNIQUE NOT NULL,
    nama        text NOT NULL,
    role        text NOT NULL CHECK (role IN ('superadmin','operator','observer')) DEFAULT 'observer',
    status      text NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif','nonaktif')),
    last_login  timestamptz,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 5. TRIGGERS & FUNCTIONS
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_institusi_updated BEFORE UPDATE ON public.institusi
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_nakes_updated BEFORE UPDATE ON public.nakes
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_platform_links_updated BEFORE UPDATE ON public.platform_links
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_user_profiles_updated BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create user_profiles saat user register via Nhost Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, username, nama, role, status)
    VALUES (
        NEW.id,
        split_part(NEW.email, '@', 1),
        split_part(NEW.email, '@', 1),
        'observer',
        'aktif'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.institusi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text AS $$
    SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- === POLICIES: institusi ===
CREATE POLICY "institusi_select_public" ON public.institusi
    FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "institusi_insert_admin" ON public.institusi
    FOR INSERT TO authenticated
    WITH CHECK (public.current_user_role() IN ('superadmin','operator'));
CREATE POLICY "institusi_update_admin" ON public.institusi
    FOR UPDATE TO authenticated
    USING (public.current_user_role() IN ('superadmin','operator'))
    WITH CHECK (public.current_user_role() IN ('superadmin','operator'));
CREATE POLICY "institusi_delete_admin" ON public.institusi
    FOR DELETE TO authenticated
    USING (public.current_user_role() IN ('superadmin','operator'));

-- === POLICIES: nakes ===
CREATE POLICY "nakes_select_public" ON public.nakes
    FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "nakes_insert_admin" ON public.nakes
    FOR INSERT TO authenticated
    WITH CHECK (public.current_user_role() IN ('superadmin','operator'));
CREATE POLICY "nakes_update_admin" ON public.nakes
    FOR UPDATE TO authenticated
    USING (public.current_user_role() IN ('superadmin','operator'))
    WITH CHECK (public.current_user_role() IN ('superadmin','operator'));
CREATE POLICY "nakes_delete_admin" ON public.nakes
    FOR DELETE TO authenticated
    USING (public.current_user_role() IN ('superadmin','operator'));

-- === POLICIES: platform_links ===
CREATE POLICY "platform_links_select_public" ON public.platform_links
    FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "platform_links_insert_admin" ON public.platform_links
    FOR INSERT TO authenticated
    WITH CHECK (public.current_user_role() = 'superadmin');
CREATE POLICY "platform_links_update_admin" ON public.platform_links
    FOR UPDATE TO authenticated
    USING (public.current_user_role() = 'superadmin')
    WITH CHECK (public.current_user_role() = 'superadmin');

-- === POLICIES: user_profiles ===
CREATE POLICY "user_profiles_select_own_or_admin" ON public.user_profiles
    FOR SELECT TO authenticated
    USING (id = auth.uid() OR public.current_user_role() = 'superadmin');
CREATE POLICY "user_profiles_update_own_or_admin" ON public.user_profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid() OR public.current_user_role() = 'superadmin')
    WITH CHECK (id = auth.uid() OR public.current_user_role() = 'superadmin');
CREATE POLICY "user_profiles_delete_admin" ON public.user_profiles
    FOR DELETE TO authenticated
    USING (public.current_user_role() = 'superadmin');

-- 7. SEED: platform_links (12 platform awal)
INSERT INTO public.platform_links (id, title, subtitle, description, icon_key, color, bg_color, url, category, status, sort_order) VALUES
(1,  'InovDash',       'Dashboard Pusat',     'Dashboard utama integrasi SDM Kesehatan', 'dashboard', '#059669', '#d1fae5', '', 'Monitoring', 'coming_soon', 1),
(2,  'SIPTK',          'Sistem Data SDMK',    'Sistem Informasi PT Kesehatan', 'database', '#0ea5e9', '#e0f2fe', 'https://timkersdmk.mukminnasri.com/siptk', 'Registrasi', 'active', 2),
(3,  'Bantuan Sosial', 'Program Bantuan',     'Manajemen program bantuan sosial SDMK', 'gift', '#f97316', '#ffedd5', '', 'Program', 'coming_soon', 3),
(4,  'Diklat',         'Pelatihan SDMK',      'Manajemen diklat & pelatihan', 'academic', '#a855f7', '#f3e8ff', '', 'Program', 'coming_soon', 4),
(5,  'Resignation',    'Manajemen Resign',    'Tracking resign & exit interview', 'logout', '#ef4444', '#fee2e2', '', 'Monitoring', 'coming_soon', 5),
(6,  'SIP Online',     'Surat Izin Praktik',  'Pengajuan & tracking SIP online', 'document', '#059669', '#d1fae5', 'https://timkersdmk.mukminnasri.com/sip', 'Registrasi', 'active', 6),
(7,  'Survey',         'Survey SDMK',         'Survey & data collection', 'survey', '#0ea5e9', '#e0f2fe', '', 'Monitoring', 'coming_soon', 7),
(8,  'Commdev',        'Community Development', 'Manajemen pengembangan komunitas', 'community', '#ec4899', '#fce7f3', '', 'Program', 'coming_soon', 8),
(9,  'Visum',          'Verifikasi SDMK',     'Verifikasi data SDMK', 'verify', '#a855f7', '#f3e8ff', '', 'Registrasi', 'coming_soon', 9),
(10, 'Absensi',        'Manajemen Kehadiran', 'Tracking kehadiran SDMK', 'attendance', '#f97316', '#ffedd5', '', 'Layanan', 'coming_soon', 10),
(11, 'Renstra',        'Rencana Strategis',   'Rencana strategis SDMK', 'strategy', '#059669', '#d1fae5', '', 'Dinkes', 'coming_soon', 11),
(12, 'Dinkes Mail',    'Email Dinas',         'Mail khusus Dinas Kesehatan', 'mail', '#ef4444', '#fee2e2', '', 'Dinkes', 'coming_soon', 12)
ON CONFLICT (id) DO NOTHING;

-- 8. Catatan admin user:
-- Setelah migrasi pertama, user superadmin WAJIB dibuat manual via:
--   Nhost Console -> Auth -> Add User -> isi email + password
-- Lalu update role:
--   UPDATE public.user_profiles SET role='superadmin' WHERE username='<username>';
