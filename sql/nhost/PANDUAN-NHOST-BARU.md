# 📗 PANDUAN — Ganti Nhost Baru & Sambungkan SIMANDAKES

> Alur: **Aplikasi (web) → Nhost Hasura (GraphQL)**.
> Setelah project baru dibuat, yang harus dilakukan hanya 4 hal:
> **(1) jalankan SQL, (2) track tabel, (3) buat izin akses, (4) ganti URL di aplikasi.**

---

## 1️⃣ Hapus project Nhost lama

1. Buka https://console.nhost.io
2. Klik project lama Anda (yang URL-nya `ropxcexlewwkfyjsftus...`)
3. Menu kiri bawah → **Project Settings** (ikon gerigi) → **General**
4. Scroll ke bawah ke bagian **Danger Zone** → **Delete project**
5. Ketik nama project untuk konfirmasi → **Delete**

⚠️ Setelah dihapus, URL lama mati permanen. Data lamanya memang sudah
tidak diperlukan — data terbaru ada di file SQL langkah 3.

---

## 2️⃣ Buat project Nhost baru

1. Di https://console.nhost.io klik **+ New project** (atau "Create project")
2. Isi:
   - **Name**: `simandakes` (bebas)
   - **Region**: **Singapore (ap-southeast-1)** ← pilih yang ini, paling dekat Indonesia
   - Plan: **Starter (Free)**
3. Klik **Create** → tunggu ±1–2 menut sampai status **Running**

---

## 3️⃣ Jalankan SQL (buat tabel + isi data) — 1 menit

1. Siapkan file: **`sql/nhost/00-TEMPEL-KE-SQL-EDITOR.sql`**
   (ada di folder ZIP yang bisa diunduh dari halaman utama)
2. Di Nhost Dashboard, klik menu **SQL** (ikon database / SQL Editor)
3. **Copy SELURUH isi file** itu → **paste** ke kotak SQL → klik **Run**
4. Hasil sukses = tidak ada pesan error merah.
   Cek cepat di bagian bawah: `select count(*) from public.data_nakes;`
   → harus **21**.

> File ini sudah mencakup: 3 tabel (`data_nakes`, `institusi_named`,
> `institusi_nakes`), enum, index, trigger, dan data awal
> **21 praktik mandiri lengkap dengan FOTO + DAFTAR LAYANAN**,
> 8 institusi Named, 8 institusi Nakes.

> ⚠️ **Popup merah "Tracking items failed — set_updated_at" itu NORMAL —
> abaikan saja!** Itu cuma Hasura mencoba men-track fungsi trigger
> `set_updated_at` (fungsi trigger memang tidak bisa di-track dan tidak
> diperlukan). SQL & data Anda TETAP sukses masuk — tidak ada yang rusak.
> Efeknya: track tabel ikut batal (gagal 1 = gagal paket), jadi WAJIB
> lanjut ke langkah 4 di bawah untuk men-track 3 tabel secara manual.

---

## 4️⃣ Track tabel di Hasura — supaya muncul di GraphQL

Jika langkah ini dilewati, F12 akan menampilkan
`[UNTRACKED_TABLE] field 'data_nakes' not found in type: 'query_root'`.

1. Nhost Dashboard → tombol **Hasura Console** (kanan atas)
2. Menu kiri **Data** → klik database **default** → **public**
3. Centang 3 tabel: `data_nakes`, `institusi_named`, `institusi_nakes`
4. Klik **Track selected** (atau **Track all**)

---

## 5️⃣ Buat izin akses (Permissions) — PALING SERING TERLEWAT

Aplikasi SIMANDAKES membaca Nhost **tanpa password**, jadi Hasura
menjalankannya sebagai role **`public`**. Tanpa permission ini,
tampilan aplikasi **kosong** walau tidak ada error merah.

Untuk **SETIAP tabel** (`data_nakes`, `institusi_named`, `institusi_nakes`):

1. Menu **Data** → klik nama tabel → tab **Permissions**
2. Kotak **Role** → ketik: `public` → klik **✎ edit** (masuk mode permission)
3. Baris **select** → klik icon ✎ →
   centang semua kolom (✓ Full access / select all) →
   centang **Allow aggregations** → **Save Permissions**
4. Baris **insert** → klik icon ✎ → centang semua kolom → **Save**
5. Baris **update** → klik icon ✎ → centang semua kolom → **Save**
6. Ulangi untuk tabel ke-2 dan ke-3

> 🔒 Catatan keamanan: permission insert/update untuk `public` memang
> terbuka supaya fitur "kelola data" di aplikasi jalan (aplikasi tidak
> mengirim password). Kalau nanti sudah pakai login JWT, role `public`
> bisa disempitkan jadi select saja.

---

## 6️⃣ Sambungkan aplikasi ke Nhost baru

**Cara permanen (wajib):** edit file aplikasi **`js/config.js`**, baris ±15:

```js
const NHOST_CONFIG = {
    BACKEND_URL: 'https://SUBDOMAIN-BARU-ANDA.hasura.ap-southeast-1.nhost.run',
```

- Ganti `SUBDOMAIN-BARU-ANDA` dengan subdomain project baru
  (lihat dashboard Nhost, contoh: `abcdefghijk.hasura.ap-southeast-1.nhost.run`)
- Kalau aplikasi di-host via GitHub Pages: commit & push perubahan ini.
- Biarkan `ADMIN_SECRET: ''` tetap kosong.

**Cara cepat untuk tes dulu (sekali di 1 browser):** buka console browser (F12):

```js
localStorage.setItem('simandakes_nhost_url', 'https://SUBDOMAIN-BARU-ANDA.hasura.ap-southeast-1.nhost.run');
location.reload();
```

---

## 7️⃣ Tes hasilnya

1. **Tes GraphQL**: Hasura Console → menu **GraphiQL** → jalankan:

   ```graphql
   query {
     data_nakes(where: { deleted_at: { _is_null: true } }, order_by: { created_at: desc }) {
       legacy_id nama jenis foto_url daftar_layanan
     }
     institusi_named { nama total }
     institusi_nakes { institusi total }
   }
   ```

   Harus keluar: 21 nakes (dengan foto `/foto/nakes-01..21.jpg`), 8+8 institusi.

2. **Tes aplikasi**: buka aplikasi → menu **Cari Dokter / Bidan / dll**
   → kartu profil + foto muncul otomatis. F12 bersih tanpa error merah.

---

## 8️⃣ Foto profil (supaya foto tampil)

Kolom `foto_url` berisi path `/foto/nakes-01.jpg` … `nakes-21.jpg`.
Supaya foto muncul:

- Salin folder **`public/foto/`** (ada di ZIP unduhan) ke folder aplikasi
  yang di-host (mis. repo GitHub Pages → folder `/foto/`), **atau**
- Upload foto ke Nhost Storage lalu update kolom foto_url dengan URL
  Storage, contoh:
  `UPDATE data_nakes SET foto_url='https://storage.<region>.nhost.run/v1/files/...';`

---

## ⚡ Jalur cepat (opsional): biar asisten yang kerjakan

Langkah 3–5 di atas bisa diotomatisasi. Cukup kirimkan 2 hal ini:

1. **URL Hasura baru** — `https://xxxxx.hasura.ap-southeast-1.nhost.run`
2. **Hasura Admin Secret** — Dashboard → **Project Settings → Hasura → Admin Secret**

Nanti semua tabel, data, tracking, dan permission diset langsung,
lalu tinggal ganti 1 baris `BACKEND_URL` di `js/config.js`.

> 🔐 Setelah selesai, rotasi secret: Project Settings → Hasura → Rotate.

---

## 🛠 Troubleshooting

| Gejala (F12) | Penyebab | Solusi |
|---|---|---|
| `[UNTRACKED_TABLE] field ... not found in query_root` | Tabel belum di-track | Ulangi langkah 4 |
| Tampilan kosong / `permission-denied` / `check constraints` | Role `public` belum punya permission | Ulangi langkah 5 |
| `not a valid graphql query (validation-failed)` | Query terpotong/tercampur karakter saat copy | Hard refresh (Ctrl+Shift+R), pastikan URL diakhiri `/v1/graphql` |
| `failed to fetch` / semua fetch gagal | URL salah / project belum Running | Cek BACKEND_URL & status project |
| Data tampil tapi **foto** kosong | Folder `/foto/` belum di-host | Lihat langkah 8 |
| Kolom error seperti `email not found` | Memakai file SQL versi lama | Selalu pakai `00-TEMPEL-KE-SQL-EDITOR.sql` versi terbaru dari ZIP |
