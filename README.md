# SIMANDAKES — Modular Edition

> **SIMANDAKES** = **S**istem **I**nformasi dan **M**anajemen **A**plikasi **D**ata **AKES** (SDM Kesehatan)
>
> Aplikasi web untuk pencarian dan manajemen data tenaga kesehatan di Indonesia.

---

## Ringkasan

Repo ini berisi **versi modular** dari SIMANDAKES yang aslinya adalah satu file HTML monolitik (`7022 baris`, ~340 KB). Kode sudah dipecah menjadi struktur folder terpisah agar:

- 🧩 **Maintainable** — tiap file CSS/JS punya satu concern
- 🚀 **Performant** — browser bisa cache file individual
- 👥 **Collaborative** — multiple developer bisa kerja paralel tanpa conflict
- 🔄 **Backend-agnostic** — tinggal toggle `BACKEND_MODE` untuk ganti antara Google Sheets (legacy) dan Nhost (production)

## Arsitektur

```
Frontend (GitHub Pages)            Backend (Nhost)
┌─────────────────────────┐       ┌─────────────────────────────┐
│  Static HTML/CSS/JS     │       │  Postgres (managed)         │
│  ───────────────────    │       │  Hasura GraphQL (auto-API)  │
│  index.html             │       │  Auth (JWT)                 │
│  ├─ css/  (12 files)    │ ←──→ │  Storage (file uploads)     │
│  ├─ js/   (15 modules)  │  HTTPS  Functions (serverless JS)  │
│  ├─ partials/ (3 HTML)  │       │                             │
│  └─ assets/             │       │  URL: https://xxx.nhost.run │
│                         │       └─────────────────────────────┘
│  URL: https://user.github.io/    │
│       simandakes/                │
└─────────────────────────┘
```

## Struktur Folder

```
simandakes/
├── README.md                          ← file ini
├── frontend/                          ← deploy ke GitHub Pages
│   ├── README.md                      ← panduan deploy frontend
│   ├── index.html                     ← entry point (semua CSS/JS di-load di sini)
│   ├── css/
│   │   ├── base.css                   ← reset, root variables
│   │   ├── utilities.css              ← helper classes
│   │   ├── components.css             ← buttons, cards, badges, avatars
│   │   ├── forms.css                  ← input, textarea, select
│   │   ├── tables.css                 ← table styling
│   │   ├── landing.css               ← landing page publik
│   │   ├── dashboard.css              ← dashboard layout & sidebar
│   │   ├── inovash.css                ← Inovash platform cards
│   │   ├── pelayanan.css              ← kartu pelayanan (cari dokter/bidan/perawat)
│   │   ├── institusi.css              ← grid institusi
│   │   ├── modals.css                 ← lightbox & popup
│   │   └── admin.css                  ← admin panel
│   ├── js/
│   │   ├── config.js                  ← konfigurasi (URL backend, mode)
│   │   ├── nhost-client.js            ← GraphQL client ringan untuk Nhost
│   │   ├── api.js                     ← layer API (Nhost / Google Sheets)
│   │   ├── state.js                   ← global state
│   │   ├── storage.js                 ← localStorage helpers
│   │   ├── export.js                  ← export CSV
│   │   ├── navigation.js              ← routing antar halaman
│   │   ├── render-inovash.js          ← render dashboard Inovash
│   │   ├── render-named.js            ← render data Named
│   │   ├── render-nakes.js            ← render data Nakes
│   │   ├── render-pelayanan.js        ← render kartu pelayanan
│   │   ├── maps.js                    ← Google Maps / OSM integration
│   │   ├── auth.js                    ← admin authentication
│   │   ├── admin.js                   ← dashboard admin (CRUD)
│   │   └── app.js                     ← inisialisasi & main entry
│   ├── partials/
│   │   ├── landing.html               ← partial landing page
│   │   ├── login.html                 ← partial halaman login
│   │   └── dashboard.html             ← partial dashboard layout
│   └── assets/
│       └── (favicon, gambar, dll)
│
└── backend/                           ← deploy ke Nhost
    ├── README.md                      ← panduan deploy backend
    ├── migrations/
    │   ├── 0001_init_schema.sql       ← schema 5 tabel + triggers + seed
    │   └── 0002_trigram_search.sql    ← extension pg_trgm + function fuzzy search
    ├── metadata/
    │   └── tables_metadata.json       ← Hasura permissions (anonymous/operator/admin)
    └── functions/
        ├── login.js                   ← serverless function: POST /api/login
        └── sync-google-sheets.js      ← serverless function: migrasi awal dari Google Sheets
```

## Quick Start (5 menit)

### 1. Deploy Backend ke Nhost

Lihat panduan lengkap di [`backend/README.md`](./backend/README.md). Ringkasan:

1. Daftar di [nhost.io](https://nhost.io) (gratis untuk project kecil)
2. Buat project baru → catat URL: `https://<subdomain>.nhost.run`
3. Buka **Nhost Console → Databases → Migrations**
4. Upload file di `backend/migrations/` satu per satu
5. Set environment variable `GOOGLE_SHEETS_ID` (untuk migrasi awal)
6. Copy folder `backend/functions/` ke **Nhost Console → Functions**
7. Buat user admin di Nhost Console > SQL: jalankan seed dari `0001_init_schema.sql`

### 2. Konfigurasi Frontend

Edit `frontend/js/config.js`:

```javascript
const NHOST_CONFIG = {
    BACKEND_URL: 'https://project-anda.nhost.run',
    // ...
};

const BACKEND_MODE = 'nhost';  // ubah dari 'csv' default
```

Atau set via localStorage di browser console:

```javascript
localStorage.setItem('simandakes_backend_mode', 'nhost');
localStorage.setItem('simandakes_nhost_url', 'https://project-anda.nhost.run');
location.reload();
```

### 3. Deploy Frontend ke GitHub Pages

Lihat panduan lengkap di [`frontend/README.md`](./frontend/README.md). Ringkasan:

1. Buat repo GitHub baru (misal: `simandakes-web`)
2. Copy isi folder `frontend/` ke root repo (atau ke folder `docs/`)
3. Push ke GitHub
4. Buka **Settings → Pages** → Source: `main` / `docs` (atau root)
5. Akses di `https://<username>.github.io/<repo>/`

## Migrasi Data dari Google Sheets

Jika Anda sudah punya data di Google Sheets (lihat `SPREADSHEET_ID` lama di `config.js`):

1. Pastikan Google Sheets diset **"Anyone with link can view"**
2. Set environment variable di Nhost: `GOOGLE_SHEETS_ID=<id-spreadsheet>`
3. Panggil function sync lewat curl atau Postman:

   ```bash
   curl -X POST https://project-anda.nhost.run/v1/functions/sync-google-sheets \
     -H "Content-Type: application/json" \
     -d '{"sheet":"DataNakes"}'
   ```

4. Ulangi untuk sheet `Named`, `Nakes` (jangan `Users` — buat manual di Nhost Console)
5. Cek data di Nhost Console → Database → tabel terkait

## Default Login

Setelah seed `0001_init_schema.sql` dijalankan, user default:

```
Username: admin
Password: admin123
```

⚠️ **Ganti password ini SEGERA** di Nhost Console > Database > users > edit row.
Buat hash bcrypt baru di [bcrypt-generator.com](https://bcrypt-generator.com/).

## Tech Stack

| Layer        | Teknologi                          | Versi    |
|--------------|------------------------------------|----------|
| Frontend     | HTML5 + CSS3 + Vanilla JavaScript  | ES2020+  |
| Styling      | Custom CSS (no framework)          | -        |
| Maps         | OpenStreetMap (iframe) + Google Maps (popup) | - |
| Backend DB   | PostgreSQL                          | 15+      |
| Backend API  | Hasura GraphQL Engine               | v2.30+   |
| Backend Auth  | Nhost Auth (JWT)                    | -        |
| Serverless   | Nhost Functions (Deno-like runtime) | -        |
| Hosting      | GitHub Pages (frontend) + Nhost (backend) | - |

## Fitur Aplikasi

### Untuk Publik (anonymous)

- 🏠 Landing page dengan hero, features, services, about, CTA
- 🔍 Pencarian nakes (dokter, bidan, perawat) berdasarkan nama/spesialisasi/lokasi
- 📞 Lihat detail nakes (STR, SIP, alamat, jadwal praktik, telepon, email)
- 🗺️ Popup Google Maps untuk alamat praktik
- 📊 Lihat statistik institusi kesehatan

### Untuk Admin (login required)

- 📋 Dashboard Inovash (12 link platform SIMRS, SIRS, SIP, dll)
- 👨‍⚕️ Manajemen data Nakes (CRUD: Create, Read, Update, Delete)
- 🏥 Manajemen data Named (institusi)
- 📊 Manajemen institusi Nakes (agregat perawat/bidan/apoteker)
- 👥 Manajemen user (admin/operator)
- 📤 Export data ke CSV
- ⚙️ Edit URL link Inovash

## License

MIT License — bebas dipakai, dimodifikasi, didistribusikan.

## Kontak

Untuk pertanyaan teknis atau kontribusi, buat issue di repo GitHub.

---

**Dibuat sebagai konversi dari aplikasi monolitik ke arsitektur modular GitHub Pages + Nhost.**
