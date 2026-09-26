-- =============================================================
-- SIMANDAKES - Migration 0002: Trigram Extension for Fuzzy Search
-- =============================================================
-- Nhost sudah include pg_trgm secara default, tapi kita pastikan.
-- Dipakai oleh index GIN pada data_nakes.nama untuk pencarian fuzzy.
-- =============================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Buat function search_nakes(nama_pattern) untuk pencarian fuzzy
CREATE OR REPLACE FUNCTION public.search_nakes(pattern TEXT, limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
    id              UUID,
    nama            TEXT,
    jenis           TEXT,
    spesialisasi    TEXT,
    str             TEXT,
    sip             TEXT,
    alamat_praktik  TEXT,
    no_telepon      TEXT,
    email           TEXT,
    status          TEXT,
    foto_url        TEXT,
    similarity       REAL
) AS $$
    SELECT
        dn.id,
        dn.nama,
        dn.jenis,
        dn.spesialisasi,
        dn.str,
        dn.sip,
        dn.alamat_praktik,
        dn.no_telepon,
        dn.email,
        dn.status,
        dn.foto_url,
        similarity(dn.nama, pattern) AS similarity
    FROM public.data_nakes dn
    WHERE dn.deleted_at IS NULL
      AND dn.nama ILIKE '%' || pattern || '%'
    ORDER BY similarity DESC
    LIMIT limit_count;
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION public.search_nakes(TEXT, INTEGER) IS 'Pencarian nakes berdasarkan nama dengan fuzzy matching';
