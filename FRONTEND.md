# Frontend — SIMANDAKES

> Frontend SIMANDAKES — static HTML/CSS/JS siap deploy ke **GitHub Pages**.

---

## Struktur Folder

```
simandakes/                        ← root repo (frontend di root)
├── index.html                  ← entry point (langsung diakses)
├── css/                         ← 12 file CSS modular
├── js/                          ← 16 modul JavaScript
├── partials/                   ← 3 partial HTML (sudah di-inline ke index.html)
├── assets/                      ← gambar, favicon, dll
├── backend/                     ← kode backend untuk Nhost (lihat backend/README.md)
├── README.md                    ← overview + quickstart
└── FRONTEND.md                 ← file ini
```

## Cara Deploy ke GitHub Pages

### Opsi A: Repo Khusus (paling mudah)

1. **Buat repo GitHub baru**, misalnya `simandakes-web`
2. Clone repo ke lokal:
   ```bash
   git clone https://github.com/USERNAME/simandakes-web.git
   cd simandakes-web
   ```
3. **Copy SEMUA isi root repo** (`index.html`, `css/`, `js/`, `partials/`, `assets/`) ke root repo GitHub Anda:
   ```bash
   cp -r /path/ke/simandakes/{index.html,css,js,partials,assets} .
   ```
4. Commit & push:
   ```bash
   git add .
   git commit -m "Initial commit: SIMANDAKES frontend"
   git push origin main
   ```
5. Buka **Settings → Pages**:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` / `(root)` → klik **Save**
6. Tunggu ~2 menit, lalu akses:
   ```
   https://USERNAME.github.io/simandakes-web/
   ```

### Opsi B: Subfolder `docs/` di repo yang sudah ada

1. Di root repo Anda, buat folder `docs/`:
   ```bash
   mkdir docs
   cp -r /path/ke/simandakes/{index.html,css,js,partials,assets} docs/
   ```
2. Commit & push
3. **Settings → Pages** → Source: `main` / `docs`

### Opsi C: GitHub Actions (build otomatis)

Untuk setup CI/CD yang otomatis build & deploy:

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Pages
        uses: actions/configure-pages@v5
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./frontend  # atau . kalau frontend di root
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## Konfigurasi Backend

Sebelum deploy, set URL backend Nhost di `js/config.js`:

```javascript
const NHOST_CONFIG = {
    BACKEND_URL: 'https://PROJECT-ANDA.nhost.run',
    // ...
};
```

Atau set via localStorage (lebih fleksibel untuk dev/staging switch):

```javascript
localStorage.setItem('simandakes_backend_mode', 'nhost');
localStorage.setItem('simandakes_nhost_url', 'https://PROJECT-ANDA.nhost.run');
location.reload();
```

## Mode Backend

Aplikasi mendukung 3 mode backend:

| Mode | Konstanta   | Keterangan                                       | Cocok untuk        |
|------|-------------|--------------------------------------------------|--------------------|
| Nhost | `'nhost'`  | Pakai Nhost (Postgres + Hasura GraphQL + Auth)   | **Production** ⭐ |
| GAS   | `'gas'`    | Pakai Google Apps Script Web App (legacy)        | Migration window   |
| CSV   | `'csv'`    | Pakai Google Sheets CSV export (read-only)       | Demo / read-only   |

Untuk ganti mode:

```javascript
localStorage.setItem('simandakes_backend_mode', 'csv'); // atau 'nhost', 'gas'
location.reload();
```

## Modul JavaScript

Urutan load di `index.html` penting karena pakai `defer`:

| #  | File                  | Fungsi                                  |
|----|----------------------|------------------------------------------|
| 1  | `config.js`          | Konfigurasi global (URL, mode, dll)     |
| 2  | `nhost-client.js`    | GraphQL client ringan untuk Nhost       |
| 3  | `api.js`             | Layer API (sync, CRUD, fetch)           |
| 4  | `state.js`           | Global state & cache in-memory          |
| 5  | `storage.js`         | Helpers localStorage                    |
| 6  | `export.js`          | Export data ke CSV                      |
| 7  | `navigation.js`      | Routing antar view (landing/login/dash) |
| 8  | `render-inovash.js`  | Render dashboard Inovash + platform cards |
| 9  | `render-named.js`    | Render data Named (institusi)           |
| 10 | `render-nakes.js`    | Render data Nakes + lightbox profile    |
| 11 | `render-pelayanan.js`| Render kartu pelayanan + popup maps     |
| 12 | `maps.js`            | Google Maps & OpenStreetMap integration |
| 13 | `auth.js`            | Admin login/logout + session check      |
| 14 | `admin.js`           | Dashboard admin (tables, modals, CRUD)  |
| 15 | `app.js`             | Inisialisasi & event listeners utama    |

## Catatan Pengembangan

### Update CSS

- Edit file CSS di `css/` yang sesuai (jangan campur aduk)
- Untuk tema warna, edit `:root` variables di `css/base.css`
- Refresh browser (Ctrl+F5) untuk bypass cache

### Tambah JS Baru

- Tambah file baru di `js/`
- Tambah `<script src="js/nama-file.js" defer></script>` di `index.html` pada urutan yang benar
- Pastikan tidak ada dependency circular

### Local Testing

Tidak perlu server lokal untuk testing dasar. Bisa langsung buka `index.html` di browser.

Tapi kalau mau testing fetch API (Nhost/Google Sheets), perlu HTTP server karena CORS:

```bash
# Python 3
python3 -m http.server 8080

# atau Node.js
npx serve .
```

Lalu buka `http://localhost:8080`.

## Troubleshooting

### Halaman blank / JS error

1. Buka DevTools (F12) → Console
2. Cek error messages
3. Pastikan semua file di `js/` dan `css/` ter-load (lihat tab Network)
4. Pastikan `config.js` tidak punya syntax error

### Data tidak muncul

1. Cek `BACKEND_MODE` di localStorage:
   ```javascript
   localStorage.getItem('simandakes_backend_mode');
   ```
2. Kalau `'nhost'`, pastikan URL Nhost valid:
   ```javascript
   localStorage.getItem('simandakes_nhost_url');
   ```
3. Cek koneksi ke GraphQL:
   ```bash
   curl https://PROJECT-ANDA.nhost.run/v1/graphql -X POST \
     -H "Content-Type: application/json" \
     -d '{"query":"{ __typename }"}'
   ```

### Maps tidak tampil

- OpenStreetMap (default): pastikan internet stabil
- Google Maps: popup di-block? Cek popup blocker di browser

## Browser Support

- ✅ Chrome / Edge 90+
- ✅ Firefox 90+
- ✅ Safari 14+
- ⚠️ IE 11: TIDAK didukung (pakai `let`, `const`, arrow functions, template literals)

## License

MIT — bebas dipakai.
