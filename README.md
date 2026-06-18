# SIMANDAKES - Sistem Informasi & Manajemen Sumber Daya Kesehatan

Aplikasi web manajemen data kesehatan berbasis Google Apps Script dan HTML/Bootstrap untuk mengelola data SDMK, Fasyankes, Praktik Mandiri Nakes, Praktik Dokter Spesialis, dan Kotak Saran.

## Fitur Utama

- **Dashboard Interaktif** - Menu card dengan akses cepat ke semua modul
- **Manajemen SDMK** - Data tenaga kesehatan, STR, profesi, tempat kerja, status aktif
- **Manajemen Fasyankes** - Fasilitas kesehatan, jenis layanan, alamat, pimpinan, status operasional
- **Praktik Mandiri Nakes** - Catatan praktik mandiri dengan SIP, alamat, dan kontak
- **Praktik Dokter Spesialis** - Data dokter spesialis, SIP, fasyankes mitra, jadwal pelayanan
- **Kotak Saran** - Form aspirasi masyarakat dengan tabel data
- **Panel Admin** - CRUD data, upload foto, export Excel/CSV, export PDF
- **Audit Trail** - Pencatatan otomatis seluruh aktivitas admin
- **Multi-Role Admin** - Super Admin, Admin SDMK, Admin Fasyankes, Admin Praktik
- **Foto & Lightbox** - Upload dan preview foto dengan lightbox integration
- **DataTables** - Tabel interaktif dengan pencarian, pagination, dan sorting

## Struktur File

```
simandakes/
├── index.html    # Frontend: HTML, CSS, JavaScript
├── Code.gs       # Backend: Google Apps Script
└── README.md     # Dokumentasi proyek
```

## Akun Default Admin

| Username   | Password        | Role         |
|------------|-----------------|--------------|
| superadmin | simandakes123   | Super Admin  |
| sdmk       | sdmk123         | Admin SDMK   |
| fasyankes  | fasyankes123    | Admin Fasyankes |
| praktik    | praktik123      | Admin Praktik   |

## Instalasi & Setup

### 1. Persiapan Google Spreadsheet

Buat Google Spreadsheet baru dan catat **Spreadsheet ID** dari URL.

Contoh URL: `https://docs.google.com/spreadsheets/d/1yO3RZmkWNu24IKOpH5y9AiDxl6tSH7rsMbEEJlNV4u4/edit`
- Spreadsheet ID: `1yO3RZmkWNu24IKOpH5y9AiDxl6tSH7rsMbEEJlNV4u4`

### 2. Setup Google Apps Script

1. Buka [script.google.com](https://script.google.com/)
2. Buat proyek baru
3. Ganti konten file `Code.gs` dengan konten dari file `Code.gs` proyek ini
4. Tambahkan file HTML: klik ikon **+** (New File) > **HTML** > beri nama **index** (tanpa ekstensi `.html`)
5. Paste konten dari file `index.html` ke file `index` yang baru dibuat
6. Update `SPREADSHEET_ID` di bagian atas `Code.gs` dengan ID spreadsheet Anda
7. Klik **Deploy > New deployment > Select type > Web app**
   - Description: SIMANDAKES
   - Execute as: Me
   - Who has access: Anyone
8. Klik **Deploy** dan salin URL web app

> URL yang dihasilkan adalah aplikasi Anda yang siap diakses. Tidak perlu tempel file HTML dimana pun - `doGet()` di `Code.gs` yang akan menyajikan halaman.

### 3. Inisialisasi Data

Setelah deploy, jalankan fungsi `initSimandakesData()` di Apps Script editor untuk membuat semua sheet yang dibutuhkan:

```javascript
// Di Apps Script editor, pilih fungsi initSimandakesData dan klik Run
initSimandakesData();
```

Fungsi ini akan membuat:
- Sheet `SDMK` - Data tenaga kesehatan
- Sheet `Fasyankes` - Data fasilitas kesehatan
- Sheet `PraktikMandiri` - Data praktik mandiri nakes
- Sheet `DokterSpesialis` - Data dokter spesialis
- Sheet `KotakSaran` - Data saran masyarakat
- Sheet `AuditTrail` - Log aktivitas admin
- Sheet `AdminUsers` - Data akun admin default

### 4. Konfigurasi Opsional

**Upload Foto ke Folder Tertentu:**
```javascript
// Di Script Properties, tambahkan key UPLOAD_FOLDER_ID dengan ID folder Google Drive
PropertiesService.getScriptProperties().setProperty('UPLOAD_FOLDER_ID', 'ID_FOLDER_ANDA');
```

**Batasi Admin via Email:**
```javascript
// Di Script Properties, tambahkan key ADMIN_EMAILS dengan daftar email admin (pisah koma)
PropertiesService.getScriptProperties().setProperty('ADMIN_EMAILS', 'admin1@email.com,admin2@email.com');
```

## Penggunaan

### Akses Publik
- Buka URL web app hasil deploy untuk melihat dashboard
- Klik menu card untuk melihat data dalam modal popup
- Gunakan kotak saran untuk mengirim aspirasi

### Panel Admin
1. Klik card **Panel Admin** atau tombol **Admin** di header
2. Login dengan akun default:
   - Username: `superadmin`
   - Password: `simandakes123`
3. Pilih modul yang ingin dikelola
4. Tambah/Edit/Hapus data langsung dari tabel
5. Upload foto opsional untuk setiap data
6. Export data ke Excel (CSV) atau PDF

### Export Data
- **Excel (CSV)** - Download file CSV dengan header label yang-readable
- **PDF** - Generate dan download file PDF dengan formatting tabel

## Technology Stack

- **Backend**: Google Apps Script (JavaScript)
- **Frontend**: HTML5, CSS3, JavaScript (vanilla)
- **Framework CSS**: Bootstrap 5.3.0
- **JavaScript Libraries**:
  - jQuery 3.6.4
  - DataTables 1.13.5
  - SweetAlert2 11
  - Lightbox2 2.11.4
  - Font Awesome 6.4.0
  - Animate.css 4.1.1
- **Storage**: Google Sheets
- **File Storage**: Google Drive

## Struktur Data Sheet

### Menu
| Kolom | Tipe | Wajib |
|-------|------|-------|
| ID | text | Ya |
| ParentMenu | text | Tidak |
| MenuName | text | Ya |
| Icon | text (Font Awesome class) | Ya |
| PageType | text | Ya |
| OrderNo | number | Ya |
| Status | text | Ya |

> Catatan: Jika sheet `Menu` kosong, SIMANDAKES akan otomatis mengisi data default saat pertama kali dijalankan. Anda dapat menyesuaikan nama, icon, dan urutan menu langsung di spreadsheet. Menu dengan Status selain "Aktif" tidak akan ditampilkan di Sidebar dan Header.

### SDMK
| Kolom | Tipe | Wajib |
|-------|------|-------|
| id | text | Ya |
| nama | text | Ya |
| nik | text | Ya |
| profesi | text | Ya |
| tempat_kerja | text | Tidak |
| no_str | text | Tidak |
| status_aktif | select | Ya |
| foto | text (URL) | Tidak |

### Fasyankes
| Kolom | Tipe | Wajib |
|-------|------|-------|
| id | text | Ya |
| nama | text | Ya |
| jenis | text | Ya |
| alamat | text | Ya |
| pimpinan | text | Tidak |
| status_operasional | select | Ya |
| foto | text (URL) | Tidak |

### PraktikMandiri
| Kolom | Tipe | Wajib |
|-------|------|-------|
| id | text | Ya |
| nama | text | Ya |
| profesi | text | Ya |
| sip | text | Ya |
| alamat | text | Ya |
| kontak | text | Tidak |
| foto | text (URL) | Tidak |

### DokterSpesialis
| Kolom | Tipe | Wajib |
|-------|------|-------|
| id | text | Ya |
| nama | text | Ya |
| spesialisasi | text | Ya |
| sip | text | Ya |
| fasyankes_mitra | text | Tidak |
| jadwal | text | Tidak |
| foto | text (URL) | Tidak |

### KotakSaran
| Kolom | Tipe | Wajib |
|-------|------|-------|
| id | text | Ya |
| nama | text | Ya |
| email | text | Tidak |
| saran | text | Ya |
| tanggal | datetime | Ya |

### AuditTrail
| Kolom | Tipe |
|-------|------|
| timestamp | datetime |
| action | text |
| by | text |
| username | text |
| role | text |
| module | text |
| record_id | text |
| payload | text |

### AdminUsers
| Kolom | Tipe |
|-------|------|
| username | text |
| password | text |
| role | text |
| nama | text |
| email | text |

## Developer

- **Mukmin Nasridin** - Initial work

## Repository

[https://github.com/mukminnasridinkeskukar-ai/simandakes.git](https://github.com/mukminnasridinkeskukar-ai/simandakes.git)

## Catatan Penting

1. **Spreadsheet ID** harus diganti dengan ID spreadsheet milik Anda di `Code.gs`
2. **Fungsi initSimandakesData()** hanya perlu dijalankan sekali saat setup awal
3. **Session admin** berakhir dalam 6 jam (21600 detik)
4. **Upload foto** menggunakan Google Drive - pastikan memiliki akses Drive
5. **Web App** harus di-deploy ulang setiap kali ada perubahan kode
6. **CSV Export** menggunakan header label yang-readable (bukan key database)
7. **PDF Export** menggunakan data URI base64 untuk direct download
8. **File index.html harus dibuat di Google Apps Script** (bukan di spreadsheet) agar `doGet()` bisa menemukannya

## Troubleshooting

**Web app menampilkan error:**
- Pastikan Spreadsheet ID sudah benar
- Jalankan `initSimandakesData()` terlebih dahulu
- Cek log error di Apps Script editor
- Pastikan file `index.html` sudah dibuat di Apps Script project dengan nama `index`

**Foto tidak muncul:**
- Pastikan URL foto valid dan dapat diakses publik
- Untuk upload, pastikan folder Drive memiliki permission yang benar

**Export tidak bekerja:**
- Pastikan browser mendukung data URI
- Coba download via link yang dihasilkan

## License

Proyek ini dikembangkan untuk keperluan manajemen data kesehatan.