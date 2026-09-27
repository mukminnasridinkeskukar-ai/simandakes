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
- ⚠️ **Catatan perubahan v2.1**: Menu InovDash & tombol Sync Data sudah dihapus. Data otomatis di-fetch dari Nhost saat aplikasi dimuat (tidak ada mock data, tidak ada fallback Google Sheets).

## Arsitektur

```
Frontend (GitHub Pages)            Backend (Nhost)
┌───────────────────────────────┐ ┌─────────────────────────────┐
│  index.html (ROOT, langsung  │ │  Postgres (managed)         │
│  diakses)                    │ │  Hasura GraphQL (auto-API)  │
│  ├─ css/  (12 files)         │ │  Auth (JWT)                 │
│  ├─ js/   (16 modules)       │ ←──→ │  Storage (file uploads)     │
│  ├─ partials/ (3 HTML)        │ HTTPS  Functions (serverless JS)  │
│  └─ assets/                  │ │                             │
│                              │ │  URL: https://xxx.nhost.run │
│  URL: https://user.github.io/ │ └─────────────────────────────┘
│       simandakes/            │
└───────────────────────────────┘
```

## Struktur Folder

```
simandakes/                           ← root repo (frontend langsung di sini)
├── index.html                        ← ENTRY POINT — buka file ini di browser
├── README.md                         ← file ini (overview + quickstart)
├── FRONTEND.md                       ← panduan deploy frontend ke GitHub Pages
├── .gitignore
├── .env.example
│
├── css/                              ← 11 file CSS modular
│   ├── base.css                      ← reset, root variables
│   ├── utilities.css                 ← helper classes
│   ├── components.css                 ← buttons, cards, badges, avatars
│   ├── forms.css                     ← input, textarea, select
│   ├── tables.css                    ← table styling
│   ├── landing.css                   ← landing page publik
│   ├── dashboard.css                 ← dashboard layout & sidebar
│   ├── pelayanan.css                 ← kartu pelayanan
│   ├── institusi.css                 ← grid institusi
│   ├── modals.css                    ← lightbox & popup
│   └── admin.css                     ← admin panel
│
├── js/                               ← 16 modul JavaScript
│   ├── config.js                     ← konfigurasi (URL backend, mode)
│   ├── nhost-client.js               ← GraphQL client ringan untuk Nhost
│   ├── api.js                        ← layer API (Nhost GraphQL only)
│   ├── api-sheet.js                  ← Nhost GraphQL adapters (sync, CRUD)
│   ├── navigation.js                 ← routing antar halaman
│   ├── ui.js                         ← toast, stats, render dispatcher
│   ├── render-inovash.js             ← render dashboard Inovash
│   ├── render-named.js               ← render data Named
│   ├── render-nakes.js               ← render data Nakes
│   ├── render-pelayanan.js           ← render kartu pelayanan
│   ├── maps.js                       ← Google Maps / OSM integration
│   ├── auth.js                       ← admin authentication
│   ├── admin.js                      ← dashboard admin (CRUD)
│   ├── storage.js                    ← localStorage + sync helpers
│   ├── session.js                    ← session management + logout
│   └── app.js                        ← inisialisasi & main entry
│
├── partials/                         ← referensi HTML (sudah di-inline ke index.html)
│   ├── landing.html
│   ├── login.html
│   └── dashboard.html
│
├── assets/
│   └── favicon.svg
│
└── backend/                          ← deploy ke Nhost
    ├── README.md                     ← panduan deploy backend
    ├── nhost/
    │   └── config.yaml                ← konfigurasi project Nhost
    ├── migrations/
    │   ├── 0001_init_schema.sql       ← schema 5 tabel + triggers + seed
    │   └── 0002_trigram_search.sql    ← extension pg_trgm + function fuzzy search
    ├── metadata/
    │   └── tables_metadata.json       ← Hasura permissions (anonymous/operator/admin)
    └── functions/
        ├── login.js                   ← serverless function: POST /login
        └── sync-google-sheets.js      ← serverless function: migrasi dari Google Sheets
```

> **Kenapa index.html di root?** Supaya bisa **dibuka langsung** dengan double-click, atau di-deploy ke GitHub Pages dengan `Source: main / (root)` tanpa konfigurasi tambahan.

## Cara Cepat Pakai

### A. Buka Langsung di Komputer

1. Unzip file `simandakes.zip`
2. Buka folder `simandakes/`
3. **Double-click `index.html`** → akan terbuka di browser default
4. ⚠️ **Catatan**: Tanpa backend Nhost, aplikasi akan tampil tapi data tidak akan termuat (tidak ada mock data). Untuk pengalaman penuh, deploy backend dulu (lihat bagian Setup Backend).

Untuk testing dengan fitur lengkap, jalankan local HTTP server:

```bash
cd simandakes
python3 -m http.server 8080
# Buka http://localhost:8080
```

### B. Deploy ke GitHub Pages

1. Buat repo GitHub baru (misal: `simandakes-web`)
2. **Copy SEMUA isi root repo ini** (index.html, css/, js/, partials/, assets/, README.md, FRONTEND.md, .gitignore, .env.example, backend/) ke root repo GitHub Anda
   - Folder `backend/` juga bisa di-push sebagai referensi, tidak akan mengganggu GitHub Pages
3. Push ke GitHub
4. Buka **Settings → Pages** → Source: `Deploy from a branch` → Branch: `main` / `(root)`
5. Tunggu 2-3 menit, lalu akses di:
   ```
   https://<username>.github.io/<repo>/
   ```

> 💡 **Tip**: Kalau mau pakai subfolder `docs/` alih-alih root, pindahkan `index.html`, `css/`, `js/`, `partials/`, `assets/` ke folder `docs/`, lalu set GitHub Pages → Source: `main` / `docs`.

Lihat panduan detail di [`FRONTEND.md`](./FRONTEND.md).

## Setup Backend (Nhost)

Lihat panduan lengkap di [`backend/README.md`](./backend/README.md). Ringkasan:

1. Daftar di [nhost.io](https://nhost.io) (gratis untuk project kecil)
2. Buat project baru → catat URL: `https://<subdomain>.nhost.run`
3. Buka **Nhost Console → Databases → Migrations**
4. Upload file di `backend/migrations/` satu per satu
5. Set environment variable `GOOGLE_SHEETS_ID` (untuk migrasi awal)
6. Copy folder `backend/functions/` ke **Nhost Console → Functions**
7. Buat user admin di Nhost Console > SQL: jalankan seed dari `0001_init_schema.sql`

## Konfigurasi Frontend

Edit `js/config.js`:

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

## Migrasi Data dari Google Sheets

Jika Anda sudah punya data di Google Sheets (lihat `SPREADSHEET_ID` lama di `js/config.js`):

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
- 🔄 **Auto-fetch**: data selalu fresh dari Nhost saat halaman dimuat (tidak ada tombol sync, tidak ada mock data)

### Untuk Admin (login required)

- 👨‍⚕️ Manajemen data Nakes (CRUD: Create, Read, Update, Delete)
- 🏥 Manajemen data Named (institusi)
- 📊 Manajemen institusi Nakes (agregat perawat/bidan/apoteker)
- 👥 Manajemen user (admin/operator)
- 📤 Export data ke CSV

## License

MIT License — bebas dipakai, dimodifikasi, didistribusikan.

## Kontak

Untuk pertanyaan teknis atau kontribusi, buat issue di repo GitHub.

---

**Dibuat sebagai konversi dari aplikasi monolitik ke arsitektur modular GitHub Pages + Nhost.**
