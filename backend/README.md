# Backend — SIMANDAKES

> Backend SIMANDAKES — Postgres + Hasura GraphQL + Auth + Functions di **Nhost**.

---

## Arsitektur

```
┌─────────────────────────────────────────────────────┐
│  Nhost Project                                       │
│  ┌────────────────────────────────────────────────┐  │
│  │  Postgres 15 (managed)                        │  │
│  │  ├── public.users              (akun login)   │  │
│  │  ├── public.data_nakes          (data nakes)  │  │
│  │  ├── public.institusi_named     (menu Named)  │  │
│  │  └── public.institusi_nakes     (agregat)     │  │
│  └────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────┐  │
│  │  Hasura GraphQL Engine (auto-generated API)    │  │
│  │  Endpoint: <url>/v1/graphql                    │  │
│  │  Permissions: anonymous / operator / admin     │  │
│  └────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────┐  │
│  │  Auth (JWT-based)                              │  │
│  │  Endpoint: <url>/v1/auth                       │  │
│  └────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────┐  │
│  │  Functions (Deno-like runtime)                 │  │
│  │  Endpoint: <url>/v1/functions/<name>           │  │
│  │  ├── login.js        → POST /login             │  │
│  │  └── sync-google-sheets.js → POST /sync-google-sheets │  │
│  └────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Struktur Folder

```
backend/
├── migrations/
│   ├── 0001_init_schema.sql         ← schema 5 tabel + triggers + seed data
│   └── 0002_trigram_search.sql      ← pg_trgm extension + function fuzzy search
├── metadata/
│   └── tables_metadata.json         ← template Hasura permissions (anonymous/operator/admin)
└── functions/
    ├── login.js                     ← POST /login: verify bcrypt + issue JWT
    └── sync-google-sheets.js        ← POST /sync-google-sheets: migrasi awal dari Google Sheets
```

## Cara Deploy ke Nhost

### Langkah 1: Buat Project Nhost

1. Daftar/login di [nhost.io](https://nhost.io)
2. Klik **New Project**
3. Pilih region terdekat (Singapore untuk Indonesia)
4. Catat URL project: `https://<subdomain>.nhost.run`
5. Catat **Admin Secret** di Settings → API Keys

### Langkah 2: Apply Migration SQL

1. Buka **Nhost Console → Database → Migrations**
2. Klik **New Migration**
3. Upload file `migrations/0001_init_schema.sql`
4. Beri nama `0001_init_schema` dan jalankan
5. Ulangi untuk `migrations/0002_trigram_search.sql`

Atau lewat SQL Editor:

1. Buka **Nhost Console → Database → SQL**
2. Copy-paste isi `0001_init_schema.sql`
3. Klik **Run** → ulangi untuk `0002_trigram_search.sql`

### Langkah 3: Setup Hasura Permissions

Setelah migration di-apply, Nhost akan otomatis generate API GraphQL. Sekarang set permissions:

1. Buka **Nhost Console → Hasura Console** (klik tombol "Hasura")
2. Di Hasura Console, pergi ke **Data** → pilih tabel → **Permissions**
3. Atur permissions sesuai `metadata/tables_metadata.json`

Atau pakai **Hasura CLI** (lebih praktis):

```bash
# Install Hasura CLI
npm install -g hasura-cli

# Login ke Hasura (pakai admin secret dari Nhost)
export HASURA_GRAPHQL_ADMIN_SECRET="admin-secret-anda"
export HASURA_GRAPHQL_ENDPOINT="https://<subdomain>.nhost.run/v1/graphql"

# Apply metadata
hasura metadata apply --metadata-file backend/metadata/tables_metadata.json
```

**Ringkasan permissions** (lihat file JSON untuk detail lengkap):

| Tabel                | anonymous            | operator             | admin                 |
|---------------------|----------------------|----------------------|-----------------------|
| `users`             | ❌ (no access)        | select (no password) | full CRUD             |
| `data_nakes`        | select (aktif only) | full CRUD            | full CRUD + delete    |
| `institusi_named`   | select               | full CRUD            | full CRUD + delete    |
| `institusi_nakes`   | select               | full CRUD            | full CRUD + delete    |

### Custom Functions (Hasura permissions)

| Function | anonymous | operator | admin |
|----------|-----------|----------|-------|
| `search_nakes(pattern)` | ✅ | ✅ | ✅ |
| `get_nakes_by_jenis(jenis)` | ✅ | ✅ | ✅ |
| `get_dashboard_stats()` | ✅ | ✅ | ✅ |
| `v_institusi_summary` (view) | ✅ | ✅ | ✅ |

### Langkah 4: Deploy Serverless Functions

1. Buka **Nhost Console → Functions**
2. Klik **New Function**
3. Upload file dari `functions/`:
   - `login.js` → endpoint: `login`
   - `sync-google-sheets.js` → endpoint: `sync-google-sheets`
4. Set environment variables (lihat bagian berikutnya)

### Langkah 5: Set Environment Variables

Di **Nhost Console → Settings → Environment Variables**:

| Variable              | Value                                          | Used by                |
|----------------------|------------------------------------------------|------------------------|
| `NHOST_BACKEND_URL`  | `https://<subdomain>.nhost.run`                 | All functions          |
| `NHOST_ADMIN_SECRET` | `<admin-secret-anda>`                          | All functions          |
| `NHOST_AUTH_URL`     | `https://<subdomain>.nhost.run/v1`            | login.js               |
| `GOOGLE_SHEETS_ID`   | `1NLAY2J9Is3n_gv13fK5EtZ38Nm98byIaB6bgg1EAN-0` | sync-google-sheets.js |

### Langkah 6: Test Login

```bash
curl -X POST https://<subdomain>.nhost.run/v1/functions/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Response:

```json
{
  "success": true,
  "token": "eyJhbGc...",
  "refreshToken": "...",
  "user": {
    "id": "uuid-...",
    "username": "admin",
    "nama_lengkap": "Administrator Sistem",
    "role": "admin",
    "email": "admin@simandakes.id"
  }
}
```

### Langkah 7: Migrasi Data dari Google Sheets (Opsional)

Jika sudah punya data di Google Sheets, panggil function sync:

```bash
# Migrasi DataNakes
curl -X POST https://<subdomain>.nhost.run/v1/functions/sync-google-sheets \
  -H "Content-Type: application/json" \
  -d '{"sheet":"DataNakes"}'

# Migrasi Named
curl -X POST https://<subdomain>.nhost.run/v1/functions/sync-google-sheets \
  -H "Content-Type: application/json" \
  -d '{"sheet":"Named"}'

# Migrasi Institusi Nakes
curl -X POST https://<subdomain>.nhost.run/v1/functions/sync-google-sheets \
  -H "Content-Type: application/json" \
  -d '{"sheet":"Nakes"}'
```

Response:

```json
{
  "success": true,
  "sheet": "DataNakes",
  "target_table": "data_nakes",
  "synced": 47,
  "total_rows": 50
}
```

### Langkah 8: Ganti Password Admin Default

⚠️ **PENTING!** Setelah deploy, ganti password admin default:

1. Generate hash bcrypt baru di [bcrypt-generator.com](https://bcrypt-generator.com/) untuk password baru Anda
2. Buka **Nhost Console → Database → users** (tabel)
3. Edit row admin → ganti `password_hash` dengan hash baru
4. Atau via SQL:
   ```sql
   UPDATE public.users
   SET password_hash = '$2a$10$NEWHASHHERE...'
   WHERE username = 'admin';
   ```

## Skema Database

### Tabel `users`

| Kolom            | Type         | Keterangan                          |
|-----------------|--------------|-------------------------------------|
| id              | UUID (PK)    | Auto-generated                      |
| username        | TEXT UNIQUE  | Login identifier                    |
| password_hash   | TEXT         | bcrypt hash (jangan plain text!)    |
| nama_lengkap    | TEXT         | Display name                        |
| role            | TEXT         | `admin` / `operator` / `viewer`    |
| email           | TEXT UNIQUE  | Optional                            |
| status          | TEXT         | `aktif` / `nonaktif` / `suspended` |
| last_login_at   | TIMESTAMPTZ  | Auto-updated saat login             |
| created_at      | TIMESTAMPTZ  | Auto                               |
| updated_at      | TIMESTAMPTZ  | Auto (trigger)                      |
| deleted_at      | TIMESTAMPTZ  | Soft-delete marker                  |

### Tabel `data_nakes`

| Kolom               | Type         | Keterangan                          |
|---------------------|--------------|-------------------------------------|
| id                  | UUID (PK)    | Auto-generated                      |
| legacy_id           | TEXT UNIQUE  | ID dari Google Sheets (kompatibilitas) |
| nama                | TEXT         | Nama nakes                          |
| jenis               | TEXT         | `Dokter`/`Dokter Gigi`/`Bidan`/`Perawat`/`Apoteker`/`Tenaga Kesehatan Lainnya` |
| spesialisasi        | TEXT         | Spesialisasi (mis. "Penyakit Dalam") |
| str                 | TEXT         | Surat Tanda Registrasi              |
| sip                 | TEXT         | Surat Izin Praktik                  |
| alamat_praktik      | TEXT         | Alamat lengkap                      |
| jadwal_praktik      | TEXT         | Jadwal praktik (free text)          |
| no_telepon          | TEXT         | Nomor telepon                       |
| email               | TEXT         | Email                               |
| status              | TEXT         | `aktif`/`nonaktif`/`cuti`/`keluar` |
| foto_url            | TEXT         | URL foto (atau base64 data URL)     |
| alamat_google_maps | TEXT         | URL Google Maps lengkap             |
| created_by          | UUID (FK)    | Reference ke users.id               |
| created_at          | TIMESTAMPTZ  | Auto                               |
| updated_at          | TIMESTAMPTZ  | Auto (trigger)                      |
| deleted_at          | TIMESTAMPTZ  | Soft-delete marker                  |

### Tabel `institusi_named`

| Kolom          | Type         | Keterangan                          |
|---------------|--------------|-------------------------------------|
| id            | UUID (PK)    | Auto-generated                      |
| legacy_id     | TEXT UNIQUE  | ID legacy                           |
| nama          | TEXT         | Nama institusi                      |
| tipe          | TEXT         | `RS`/`Puskesmas`/`Klinik`/`Apotek`/`Lainnya` |
| dokter        | INTEGER      | Jumlah dokter umum                  |
| dokter_gigi   | INTEGER      | Jumlah dokter gigi                  |
| total         | INTEGER      | Total tenaga kesehatan              |
| persentase    | TEXT         | Persentase (string, mis. "12.5%")   |
| updated_at    | TIMESTAMPTZ  | Manual/external update              |
| created_at    | TIMESTAMPTZ  | Auto                               |
| deleted_at    | TIMESTAMPTZ  | Soft-delete marker                  |

### Tabel `institusi_nakes`

| Kolom       | Type         | Keterangan                          |
|------------|--------------|-------------------------------------|
| id         | UUID (PK)    | Auto-generated                      |
| legacy_id  | TEXT UNIQUE  | ID legacy                           |
| institusi | TEXT         | Nama institusi                      |
| tipe       | institusi_tipe | `RS`/`Puskesmas`/`Klinik`/`Apotek`/`Lainnya` |
| perawat    | INTEGER      | Jumlah perawat                      |
| bidan      | INTEGER      | Jumlah bidan                        |
| apoteker   | INTEGER      | Jumlah apoteker                     |
| lainnya    | INTEGER      | Jumlah tenaga kesehatan lainnya    |
| total      | INTEGER      | Total                               |
| updated_at | TIMESTAMPTZ  | Manual/external update              |
| created_at | TIMESTAMPTZ  | Auto                               |
| deleted_at | TIMESTAMPTZ  | Soft-delete marker                  |

### Custom Functions

#### `search_nakes(pattern TEXT, limit_count INTEGER DEFAULT 20)`

Pencarian fuzzy nama nakes (pakai `pg_trgm`).

| Kolom       | Type         | Keterangan                          |
|------------|--------------|-------------------------------------|
| id         | UUID         | ID nakes                            |
| legacy_id  | TEXT         | ID legacy                           |
| nama       | TEXT         | Nama nakes                          |
| jenis      | nakes_jenis  | Jenis nakes                         |
| spesialisasi | TEXT       | Spesialisasi                        |
| ...        | ...          | (kolom lengkap data_nakes)         |
| similarity | REAL         | Skor kemiripan (0-1)               |

#### `get_nakes_by_jenis(jenis_filter nakes_jenis, limit_count INTEGER DEFAULT 100)`

Filter nakes berdasarkan jenis. Dipakai untuk menu Pelayanan:
- `'Dokter'` → Cari Dokter
- `'Dokter Gigi'` → Cari Dokter Gigi
- `'Bidan'` → Cari Bidan
- `'Perawat'` → Cari Perawat
- `'Apoteker'` → Cari Apoteker

#### `get_dashboard_stats()`

Mengembalikan ringkasan statistik untuk dashboard:

| Kolom | Type | Keterangan |
|-------|------|------------|
| total_nakes | INTEGER | Total semua nakes |
| total_dokter | INTEGER | Total dokter |
| total_dokter_gigi | INTEGER | Total dokter gigi |
| total_bidan | INTEGER | Total bidan |
| total_perawat | INTEGER | Total perawat |
| total_apoteker | INTEGER | Total apoteker |
| total_lainnya | INTEGER | Total tenaga kesehatan lainnya |
| total_aktif | INTEGER | Total nakes dengan status aktif |
| total_nonaktif | INTEGER | Total nakes dengan status nonaktif |
| total_institusi | INTEGER | Total institusi di tabel institusi_named |

#### `v_institusi_summary` (View)

Gabungan data dari `institusi_named` + `institusi_nakes`.

| Kolom | Type | Keterangan |
|-------|------|------------|
| nama_institusi | TEXT | Nama institusi (gabungan) |
| tipe | institusi_tipe | Tipe institusi |
| dokter | INTEGER | Jumlah dokter |
| dokter_gigi | INTEGER | Jumlah dokter gigi |
| perawat | INTEGER | Jumlah perawat |
| bidan | INTEGER | Jumlah bidan |
| apoteker | INTEGER | Jumlah apoteker |
| lainnya | INTEGER | Jumlah tenaga kesehatan lainnya |
| total_nakes | INTEGER | Total nakes (dokter + dg + perawat + bidan + apoteker + lainnya) |
| persentase | TEXT | Persentase dari total |
| last_updated | TIMESTAMPTZ | Timestamp update terakhir |

## Sample GraphQL Queries

### Get All Nakes (anonymous)

```graphql
query GetAllNakes {
  data_nakes(where: { deleted_at: { _is_null: true } }, order_by: { created_at: desc }) {
    id
    nama
    jenis
    spesialisasi
    str
    sip
    alamat_praktik
    jadwal_praktik
    no_telepon
    email
    status
    foto_url
    alamat_google_maps
  }
}
```

### Insert Nakes (operator/admin)

```graphql
mutation InsertNakes($object: data_nakes_insert_input!) {
  insert_data_nakes_one(object: $object) {
    id
    legacy_id
  }
}
```

### Fuzzy Search (pakai function `search_nakes`)

```graphql
query SearchNakes($pattern: String!) {
  search_nakes(pattern: $pattern, limit_count: 20) {
    id
    nama
    jenis
    spesialisasi
    similarity
  }
}
```

## Troubleshooting

### Migration gagal

- Cek sintaks SQL di **Nhost Console → Database → SQL** dengan menjalankan sebagian query
- Pastikan extension `uuid-ossp` dan `pgcrypto` sudah ada (Nhost default sudah include)

### Function login return 500

- Cek **Nhost Console → Functions → Logs**
- Pastikan environment variables sudah diset (terutama `NHOST_ADMIN_SECRET`)
- Test query Hasura langsung untuk pastikan schema OK

### Permission denied (anonymous)

- Cek Hasura permissions di `tables_metadata.json`
- Pastikan role `anonymous` sudah di-set untuk tabel yang diakses publik
- Default Nhost: belum ada role anonymous, harus dibuat manual

### Sync dari Google Sheets gagal

- Pastikan Google Sheets diset **"Anyone with link can view"**
- Cek `GOOGLE_SHEETS_ID` di environment variables
- Test URL CSV langsung di browser: `https://docs.google.com/spreadsheets/d/<ID>/gviz/tq?tqx=out:csv&sheet=DataNakes`

## License

MIT — bebas dipakai.
