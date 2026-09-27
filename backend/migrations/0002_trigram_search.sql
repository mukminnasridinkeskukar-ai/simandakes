-- =============================================================
-- SIMANDAKES - Migration 0002: Search Functions & Views
-- Target: Nhost (Postgres 15 + Hasura GraphQL)
--
-- Berisi:
--   1. Function search_nakes(pattern) - pencarian fuzzy nama nakes
--   2. Function get_nakes_by_jenis(jenis) - filter by jenis untuk menu Pelayanan
--   3. Function get_dashboard_stats() - summary statistik untuk dashboard
--   4. View v_institusi_summary - view ringkasan institusi
-- =============================================================

-- =============================================================
-- 1. SEARCH_NAKES - Fuzzy search berdasarkan nama
--    Dipanggil dari frontend untuk fitur pencarian di menu Nakes
-- =============================================================
CREATE OR REPLACE FUNCTION public.search_nakes(pattern TEXT, limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
    id              UUID,
    legacy_id       TEXT,
    nama            TEXT,
    jenis           public.nakes_jenis,
    spesialisasi    TEXT,
    str             TEXT,
    sip             TEXT,
    alamat_praktik  TEXT,
    jadwal_praktik  TEXT,
    no_telepon      TEXT,
    email           TEXT,
    status          public.nakes_status,
    foto_url        TEXT,
    alamat_google_maps TEXT,
    similarity      REAL
) AS $$
    SELECT
        dn.id,
        dn.legacy_id,
        dn.nama,
        dn.jenis,
        dn.spesialisasi,
        dn.str,
        dn.sip,
        dn.alamat_praktik,
        dn.jadwal_praktik,
        dn.no_telepon,
        dn.email,
        dn.status,
        dn.foto_url,
        dn.alamat_google_maps,
        similarity(dn.nama, pattern) AS similarity
    FROM public.data_nakes dn
    WHERE dn.deleted_at IS NULL
      AND dn.nama ILIKE '%' || pattern || '%'
    ORDER BY similarity DESC
    LIMIT limit_count;
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION public.search_nakes(TEXT, INTEGER) IS 'Pencarian nakes berdasarkan nama dengan fuzzy matching (pg_trgm)';

-- =============================================================
-- 2. GET_NAKES_BY_JENIS - Filter nakes by jenis
--    Dipakai untuk menu Pelayanan Kesehatan:
--      Cari Dokter       → jenis = 'Dokter'
--      Cari Dokter Gigi  → jenis = 'Dokter Gigi'
--      Cari Bidan        → jenis = 'Bidan'
--      Cari Perawat       → jenis = 'Perawat'
--      Cari Apoteker     → jenis = 'Apoteker'
--    Untuk "Cari Praktik" (Seluruh Data), pakai query langsung tanpa filter jenis
-- =============================================================
CREATE OR REPLACE FUNCTION public.get_nakes_by_jenis(jenis_filter public.nakes_jenis, limit_count INTEGER DEFAULT 100)
RETURNS TABLE (
    id              UUID,
    legacy_id       TEXT,
    nama            TEXT,
    jenis           public.nakes_jenis,
    spesialisasi    TEXT,
    str             TEXT,
    sip             TEXT,
    alamat_praktik  TEXT,
    jadwal_praktik  TEXT,
    no_telepon      TEXT,
    email           TEXT,
    status          public.nakes_status,
    foto_url        TEXT,
    alamat_google_maps TEXT
) AS $$
    SELECT
        dn.id,
        dn.legacy_id,
        dn.nama,
        dn.jenis,
        dn.spesialisasi,
        dn.str,
        dn.sip,
        dn.alamat_praktik,
        dn.jadwal_praktik,
        dn.no_telepon,
        dn.email,
        dn.status,
        dn.foto_url,
        dn.alamat_google_maps
    FROM public.data_nakes dn
    WHERE dn.deleted_at IS NULL
      AND dn.jenis = jenis_filter
    ORDER BY dn.nama ASC
    LIMIT limit_count;
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION public.get_nakes_by_jenis(public.nakes_jenis, INTEGER) IS 'Filter nakes berdasarkan jenis untuk menu Pelayanan Kesehatan';

-- =============================================================
-- 3. GET_DASHBOARD_STATS - Statistik untuk dashboard utama
--    Mengembalikan: total per jenis, total aktif, total nonaktif
-- =============================================================
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS TABLE (
    total_nakes         INTEGER,
    total_dokter        INTEGER,
    total_dokter_gigi   INTEGER,
    total_bidan         INTEGER,
    total_perawat       INTEGER,
    total_apoteker      INTEGER,
    total_lainnya       INTEGER,
    total_aktif         INTEGER,
    total_nonaktif      INTEGER,
    total_institusi     INTEGER
) AS $$
    SELECT
        (SELECT COUNT(*) FROM public.data_nakes WHERE deleted_at IS NULL)::INTEGER,
        (SELECT COUNT(*) FROM public.data_nakes WHERE deleted_at IS NULL AND jenis = 'Dokter')::INTEGER,
        (SELECT COUNT(*) FROM public.data_nakes WHERE deleted_at IS NULL AND jenis = 'Dokter Gigi')::INTEGER,
        (SELECT COUNT(*) FROM public.data_nakes WHERE deleted_at IS NULL AND jenis = 'Bidan')::INTEGER,
        (SELECT COUNT(*) FROM public.data_nakes WHERE deleted_at IS NULL AND jenis = 'Perawat')::INTEGER,
        (SELECT COUNT(*) FROM public.data_nakes WHERE deleted_at IS NULL AND jenis = 'Apoteker')::INTEGER,
        (SELECT COUNT(*) FROM public.data_nakes WHERE deleted_at IS NULL AND jenis = 'Tenaga Kesehatan Lainnya')::INTEGER,
        (SELECT COUNT(*) FROM public.data_nakes WHERE deleted_at IS NULL AND status = 'aktif')::INTEGER,
        (SELECT COUNT(*) FROM public.data_nakes WHERE deleted_at IS NULL AND status != 'aktif')::INTEGER,
        (SELECT COUNT(*) FROM public.institusi_named WHERE deleted_at IS NULL)::INTEGER;
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION public.get_dashboard_stats() IS 'Statistik ringkas untuk dashboard utama';

-- =============================================================
-- 4. V_INSTITUSI_SUMMARY - View ringkasan semua institusi
--    Menggabungkan data dari institusi_named & institusi_nakes
-- =============================================================
CREATE OR REPLACE VIEW public.v_institusi_summary AS
SELECT
    COALESCE(nm.nama, ik.institusi) AS nama_institusi,
    COALESCE(nm.tipe, ik.tipe) AS tipe,
    COALESCE(nm.dokter, 0) AS dokter,
    COALESCE(nm.dokter_gigi, 0) AS dokter_gigi,
    COALESCE(ik.perawat, 0) AS perawat,
    COALESCE(ik.bidan, 0) AS bidan,
    COALESCE(ik.apoteker, 0) AS apoteker,
    COALESCE(ik.lainnya, 0) AS lainnya,
    COALESCE(nm.total, 0) + COALESCE(ik.perawat, 0) + COALESCE(ik.bidan, 0) + COALESCE(ik.apoteker, 0) + COALESCE(ik.lainnya, 0) AS total_nakes,
    nm.persentase,
    GREATEST(nm.updated_at, ik.updated_at) AS last_updated
FROM public.institusi_named nm
FULL OUTER JOIN public.institusi_nakes ik
    ON LOWER(TRIM(nm.nama)) = LOWER(TRIM(ik.institusi))
       AND nm.deleted_at IS NULL
       AND ik.deleted_at IS NULL
WHERE (nm.deleted_at IS NULL OR nm.deleted_at IS NULL)
   OR (ik.deleted_at IS NULL OR ik.deleted_at IS NULL);

COMMENT ON VIEW public.v_institusi_summary IS 'View ringkasan semua institusi (gabungan named + nakes)';
