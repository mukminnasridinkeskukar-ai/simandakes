// =============================================================
// api.js
// Google Sheets CSV direct access + Inovash link config + state declaration
// =============================================================

// ==================== GOOGLE SHEETS DIRECT ACCESS (NO APPS SCRIPT NEEDED) ====================
/**
 * Fetch data langsung dari Google Sheets via CSV export (publik)
 * Tidak memerlukan deploy Apps Script!
 * Syarat: Sheet harus di-set "Anyone with link can view"
 */
async function fetchGoogleSheetsCSV(sheetName) {
    try {
        const url = `https://docs.google.com/spreadsheets/d/${CONFIG.SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}&t=${Date.now()}`;
        
        console.log(`📊 Fetching ${sheetName} from Google Sheets CSV...`);
        
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Sheet mungkin tidak publik`);
        }
        
        const csvText = await response.text();
        
        // Parse CSV to array of objects
        const lines = csvText.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            return { success: false, data: [], error: 'Sheet kosong atau hanya header' };
        }
        
        // Header dari baris pertama
        const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/\s+/g, ''));
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            const row = {};
            headers.forEach((header, idx) => {
                row[header] = values[idx] || '';
            });
            // Also add numeric index access
            values.forEach((val, idx) => {
                row[idx] = val || '';
            });
            data.push(row);
        }
        
        console.log(`✅ Fetched ${data.length} rows from sheet "${sheetName}"`);
        return { success: true, data: data };
        
    } catch (error) {
        console.error(`❌ Error fetching ${sheetName}:`, error.message);
        return { success: false, data: [], error: error.message };
    }
}

/**
 * Parse single CSV line handling quoted fields
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

/**
 * Save Web App URL to localStorage
 */
function saveWebAppUrl(url) {
    if (url && url.trim() !== '' && !url.includes('YOUR_WEB_APP_ID')) {
        localStorage.setItem('simandakes_gas_url', url.trim());
        CONFIG.GOOGLE_APPS_SCRIPT_URL = url.trim();
        showNotification('URL Web App berhasil disimpan!', 'success');
        return true;
    }
    return false;
}

/**
 * Show URL Configuration Modal
 */
function showUrlConfigModal() {
    const existingModal = document.getElementById('urlConfigModal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'urlConfigModal';
    modal.innerHTML = `
        <div class="lightbox-overlay" onclick="if(event.target === this) document.getElementById('urlConfigModal').remove()">
            <div class="lightbox-modal" style="max-width:600px;" onclick="event.stopPropagation()">
                <div class="lightbox-header">
                    <button class="lightbox-close" onclick="document.getElementById('urlConfigModal').remove()">
                        <svg width="18" height="18" fill="none" stroke="#6b7280" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                    <div class="lightbox-icon" style="background: linear-gradient(135deg, #eef2ff, #dbeafe);">⚙️</div>
                    <h2 class="lightbox-title">Konfigurasi Koneksi</h2>
                    <p class="lightbox-subtitle">Atur cara SIMANDAKES mengambil data dari Google Sheets</p>
                </div>
                <div class="lightbox-body">
                    <div style="margin-bottom:20px;">
                        <label style="display:block;font-weight:600;color:#374151;margin-bottom:8px;font-size:14px;">
                            📗 Opsi 1: Akses Langsung (Recommended)
                        </label>
                        <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:14px;font-size:13px;color:#166534;">
                            ✅ <strong>Tidak perlu deploy apa pun!</strong><br>
                            Sistem akan membaca data langsung dari Google Sheets yang sudah di-set publik.<br>
                            <span style="font-size:12px;color:#15803d;">Status: <span id="csvStatus" style="color:#059669;">✓ Aktif (Auto-detect)</span></span>
                        </div>
                    </div>
                    
                    <div style="margin-bottom:20px;">
                        <label style="display:block;font-weight:600;color:#374151;margin-bottom:8px;font-size:14px;">
                            🔗 Opsi 2: Google Apps Script Web App
                        </label>
                        <input type="url" id="webAppUrlInput" 
                               placeholder="https://script.google.com/macros/s/.../exec"
                               value="${CONFIG.GOOGLE_APPS_SCRIPT_URL.includes('YOUR_WEB_APP_ID') ? '' : CONFIG.GOOGLE_APPS_SCRIPT_URL}"
                               style="width:100%;padding:12px 14px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;"
                               oninput="document.getElementById('urlPreview').textContent = this.value ? this.value.substring(0,50) + '...' : '-'">
                        <p style="font-size:11px;color:#6b7280;margin-top:6px;">URL ini didapat setelah deploy Apps Script sebagai Web App</p>
                        <p style="font-size:11px;color:#9ca3af;margin-top:4px;">Preview: <span id="urlPreview" style="color:#4f46e5;">-</span></p>
                    </div>
                    
                    <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:10px;padding:14px;font-size:12px;color:#92400e;">
                        <strong>💡 Tips:</strong> Pastikan Google Sheets Anda di-set ke <br>
                        <em>"Share → Anyone with the link → Viewer</em> agar Opsi 1 berfungsi.
                    </div>
                </div>
                <div class="lightbox-footer" style="border-top:1px solid #e5e7eb;padding-top:16px;display:flex;gap:12px;justify-content:flex-end;">
                    <button class="btn btn-outline" onclick="document.getElementById('urlConfigModal').remove()">
                        Tutup
                    </button>
                    <button class="btn btn-primary" onclick="if(saveWebAppUrl(document.getElementById('webAppUrlInput').value)){document.getElementById('urlConfigModal').remove();syncAllData();}">
                        💾 Simpan & Sync
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// ==================== KONFIGURASI INOVASH LINKS ====================
// Konfigurasi 12 Platform Eksternal - Ganti URL dengan link sebenarnya
const INOVASH_LINKS = [
    {
        id: 1,
        title: 'DedikasiH',
        subtitle: 'Digitalisasi Kegiatan Pengabdian Masyarakat SDM Kesehatan',
        description: 'Platform DedikasiH dibuat dengan harapan setiap tenaga medis dan tenaga kesehatan yang mendedikasikan dirinya untuk kegiatan kemasyarakatan dapat diapresiasi dalam bentuk satuan kredit profesi (SKP) ranah pengabdian',
        icon: 'health',
        color: '#059669',
        bgColor: '#d1fae5',
        url: 'https://timkersdmk.mukminnasri.com/dedikasih.v1.0.html/',
        category: 'Layanan',
        status: 'active'
    },
    {
        id: 2,
        title: 'MantaF',
        subtitle: 'Manajemen Tata Kelola Jabatan Fungsional Kesehatan',
        description: 'MantaF adalah sistem digital terintegrasi yang dirancang khusus untuk mengelola tata kelola jabatan fungsional kesehatan di lingkungan Dinas Kesehatan Kabupaten Kutai Kartanegara. Platform ini menyederhanakan proses administrasi, meningkatkan transparansi, dan memastikan setiap tahapan berjalan sesuai regulasi yang berlaku',
        icon: 'link',
        color: '#2563eb',
        bgColor: '#dbeafe',
        url: 'https://timkersdmk.mukminnasri.com/mantaF%20v1.0.html/',
        category: 'Registrasi',
        status: 'active'
    },
    {
        id: 3,
        title: 'SIMBAKES',
        subtitle: 'Beasiswa Tematik Bidang Kesehatan',
        description: 'Platform digital untuk pengelolaan program beasiswa pendidikan tenaga kesehatan, seleksi penerima beasiswa, monitoring, pelaporan, dan administrasi beasiswa di Kabupaten Kutai Kartanegara',
        icon: 'shield',
        color: '#7c3aed',
        bgColor: '#ede9fe',
        url: 'https://timkersdmk.mukminnasri.com/simbakes.v1.0.html#dashboard/',
        category: 'Program',
        status: 'active'
    },
    {
        id: 4,
        title: 'PAMUNGKAS',
        subtitle: 'Pengelolaan pengembangan mutu dan peningkatan kompetensi SDM kesehatan',
        description: 'platform digital yang mendukung pengelolaan pengembangan kompetensi dan mutu SDM kesehatan secara terintegrasi. Sistem ini memfasilitasi perencanaan kebutuhan pelatihan, pendataan peserta, pelaksanaan kegiatan, pencatatan jam pelatihan (JP), monitoring dan evaluasi, serta pengelolaan sertifikat dan riwayat pengembangan kompetensi. PAMUNGKAS membantu memastikan setiap tenaga kesehatan memperoleh pengembangan kompetensi yang berkelanjutan, terukur, dan sesuai dengan standar serta kebutuhan pelayanan kesehatan',
        icon: 'document',
        color: '#dc2626',
        bgColor: '#fee2e2',
        url: 'https://timkersdmk.mukminnasri.com/pamungkas.html/',
        category: 'Program',
        status: 'active'
    },
    {
        id: 5,
        title: 'SIREK',
        subtitle: 'Sistem Rekrutmen',
        description: 'Platform digital yang mendukung proses rekrutmen SDM kesehatan secara terintegrasi, transparan, dan akuntabel. Sistem ini memfasilitasi pengelolaan kebutuhan formasi, publikasi lowongan, pendaftaran pelamar, seleksi administrasi, penjadwalan tes dan wawancara, penilaian hasil seleksi, hingga pelaporan proses rekrutmen. SIREK membantu memperoleh SDM kesehatan yang kompeten sesuai kebutuhan organisasi secara efektif, efisien, dan terdokumentasi dengan baik',
        icon: 'printer',
        color: '#ea580c',
        bgColor: '#ffedd5',
        url: 'https://timkersdmk.mukminnasri.com/sirek.v1.3.02.html/',
        category: 'Registrasi',
        status: 'active'
    },
    {
        id: 6,
        title: 'PAKTI',
        subtitle: 'Pengelolaan Angka Kredit Integrasi',
        description: 'platform digital yang mendukung pengelolaan Penetapan Angka Kredit (PAK) Jabatan Fungsional Kesehatan secara terintegrasi, transparan, dan akuntabel. Sistem ini memfasilitasi pengajuan usulan PAK, verifikasi dokumen, penilaian angka kredit, monitoring proses, penerbitan hasil penilaian, hingga penyimpanan riwayat PAK secara elektronik. PAKTI membantu mempercepat proses administrasi, meningkatkan akurasi penilaian, serta mendukung pembinaan dan pengembangan karier Jabatan Fungsional Kesehatan secara efektif dan terdokumentasi.',
        icon: 'dashboard',
        color: '#0891b2',
        bgColor: '#cffafe',
        url: 'https://timkersdmk.mukminnasri.com/dashboardpakintegrasipns.html', 
        category: 'Layanan',
        status: 'active'
    },
    {
        id: 7,
        title: 'MandaT',
        subtitle: 'Manajamen Data Sumber Daya Manusia Terintegrasi',
        description: 'Platform digital yang mengintegrasikan pengelolaan data SDM kesehatan dalam satu sistem yang akurat, mutakhir, dan terpusat. Sistem ini mendukung pendataan profil tenaga kesehatan, status kepegawaian, pendidikan, kompetensi, perizinan, distribusi, serta riwayat pengembangan karier. MANdaT menyediakan informasi yang valid untuk mendukung perencanaan kebutuhan SDM kesehatan, pengambilan keputusan, monitoring, evaluasi, dan penyusunan kebijakan berbasis data.',
        icon: 'badge',
        color: '#4f46e5',
        bgColor: '#eef2ff',
        url: 'https://timkersdmk.mukminnasri.com/MandaT.html/',
        category: 'Registrasi',
        status: 'active'
    },
    {
        id: 8,
        title: 'SIMANTRI',
        subtitle: 'Sistem Informasi dan Manajemen Praktik Tenaga Medis dan Tenaga Kesehatan di Fasyankes dan Praktik Mandiri',
        description: 'Sistem informasi penyelenggaraan praktik',
        icon: 'clipboard',
        color: '#be185d',
        bgColor: '#fce7f3',
        url: 'https://timkersdmk.mukminnasri.com/simantri%20v1.0.html',
        category: 'Registrasi',
        status: 'active'
    },
    {
        id: 9,
        title: 'SAKTI',
        subtitle: 'Sistem Asesmen & Kredensial Tenaga Kesehatan di FKTP',
        description: 'Platform terintegrasi untuk menjamin mutu, kompetensi, dan keselamatan pelayanan tenaga medis dan tenaga kesehatan di Fasilitas Kesehatan Tingkat Pertama.',
        icon: 'chart',
        color: '#16a34a',
        bgColor: '#dcfce7',
        url: '',
        category: 'Monitoring',
        status: 'coming_soon'
    },
    {
        id: 10,
        title: 'PERJADIN',
        subtitle: 'Pengelolaan Perjalanan Dinas',
        description: 'Manajemen Perjadin',
        icon: 'pill',
        color: '#ca8a04',
        bgcolor: '#fef9c3',
        url: '',
        category: 'Dinkes',
        status: 'coming_soon'
    },
    {
        id: 11,
        title: 'SIM Anak & Ibu',
        subtitle: 'Data Kesehatan Ibu & Anak',
        description: 'Monitoring tumbuh kembang anak',
        icon: 'baby',
        color: '#db2777',
        bgColor: '#fce7f3',
        url: '',
        category: 'Program',
        status: 'coming_soon'
    },
    {
        id: 12,
        title: 'Portal Dinkes',
        subtitle: 'Dashboard Regional',
        description: 'Informasi dan layanan Dinkes wilayah',
        icon: 'building',
        color: '#64748b',
        bgColor: '#f1f5f9',
        url: '', // Ganti dengan URL portal Dinkes Anda
        category: 'Dinkes',
        status: 'custom'
    }
];

// Icon SVG templates
const ICON_SVGS = {
    health: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    document: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
    printer: '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    dashboard: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    badge: '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
    clipboard: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>',
    chart: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
    pill: '<path d="M10.5 20.5L3.5 13.5c-1.4-1.4-1.4-3.6 0-5l5-5c1.4-1.4 3.6-1.4 5 0l7 7c1.4 1.4 1.4 3.6 0 5l-5 5c-1.4 1.4-3.6 1.4-5 0z"/><line x1="8.5" y1="8.5" x2="15.5" y2="15.5"/>',
    baby: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
    building: '<rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>'
};

// ==================== STATE MANAGEMENT ====================
let state = {
    currentView: 'landing',
    dashboardView: 'nakes',
    isLoggedIn: false,
    userRole: null,
    userName: '',
    sidebarCollapsed: false,
    searchQuery: '',
    filterJenis: 'semua',
    sheetConnected: false,
    syncStatus: 'idle',
    isLoading: false,
    // Data dari Google Sheets (cache)
    cachedNakesData: [],
    cachedUsersData: [],
    cachedNamedData: [],      // Data dari sheet "Named" (Dokter & DG per institusi)
    cachedInstitusiNakesData: [], // Data dari sheet "Nakes" (Perawat, Bidan, dll per institusi)
    lastSyncTime: null
};

// ==================== API FUNCTIONS (Google Sheets Integration) ====================
