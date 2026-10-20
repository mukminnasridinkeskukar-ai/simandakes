// === GOOGLE SHEETS DIRECT ACCESS (NO APPS SCRIPT NEEDED) ===
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


// === API FUNCTIONS (Google Sheets Integration) ===
// ==================== API FUNCTIONS (Google Sheets Integration) ====================

/**
 * Fetch data dari Google Sheets Web App
 */
async function fetchFromSheet(action, data = {}) {
    try {
        state.isLoading = true;
        showLoading(true);
        
        const response = await fetch(CONFIG.GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Required for Google Apps Script
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: action,
                ...data,
                timestamp: new Date().toISOString()
            })
        });
        
        // Note: no-cors mode doesn't return response body
        // We assume success if no error thrown
        return { success: true };
        
    } catch (error) {
        console.error('API Error:', error);
        showNotification('Gagal terhubung ke server. Pastikan URL Web App sudah benar.', 'error');
        return { success: false, error: error.message };
    } finally {
        state.isLoading = false;
        showLoading(false);
    }
}

/**
 * GET request untuk membaca data (menggunakan doGet)
 */
async function getFromSheet(action) {
    try {
        const url = `${CONFIG.GOOGLE_APPS_SCRIPT_URL}?action=${action}&t=${Date.now()}`;
        
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        return result;
        
    } catch (error) {
        console.error('GET API Error:', error);
        return { success: false, error: error.message, data: [] };
    }
}

/**
 * Sync data Nakes (DataNakes sheet) dari Google Sheets
 * Sheet "DataNakes": ID, Nama, Jenis, Spesialisasi, STR, SIP, Alamat, Jadwal, Telepon, Email, Status, Foto
 * PRIORITY: CSV direct access → fallback ke Apps Script
 */
async function syncNakesData() {
    state.syncStatus = 'syncing';
    updateSyncUI();
    
    try {
        // METHOD 1: Try CSV direct access first (no Apps Script needed!)
        const csvResult = await fetchGoogleSheetsCSV('DataNakes');
        
        if (csvResult.success && csvResult.data.length > 0) {
            state.cachedNakesData = csvResult.data.map(row => ({
                id: row.id || row[0] || '',
                nama: row.nama || row[1] || '',
                jenis: row.jenis || row[2] || '',
                spesialisasi: row.spesialisasi || row[3] || '',
                str: row.str || row[4] || '',
                sip: row.sip || row[5] || '',
                alamat_praktik: row.alamatpraktik || row.alamat_praktik || row[6] || '',
                jadwal_praktik: row.jadwalpraktik || row.jadwal_praktik || row[7] || '',
                no_telepon: row.notelepon || row.no_telepon || row[8] || '',
                email: row.email || row[9] || '',
                status: row.status || row[10] || 'aktif',
                foto: row.foto || row[11] || '',
                alamat_google_maps: row.alamatgooglemaps || row.alamat_google_maps || row[12] || ''
            }));
            
            state.sheetConnected = true;
            state.lastSyncTime = new Date();
            console.log(`✅ Sync DataNakes via CSV: ${state.cachedNakesData.length} Nakes`);
            showNotification(`Berhasil sync ${state.cachedNakesData.length} data Nakes`, 'success');
        } else {
            // METHOD 2: Fallback to Apps Script Web App
            if (!CONFIG.GOOGLE_APPS_SCRIPT_URL.includes('YOUR_WEB_APP_ID')) {
                const result = await getFromSheet('getNakes');
                
                if (result.success && result.data) {
                    state.cachedNakesData = result.data.map(row => ({
                        id: row[0],
                        nama: row[1],
                        jenis: row[2],
                        spesialisasi: row[3],
                        str: row[4] || '',
                        sip: row[5] || '',
                        alamat_praktik: row[6] || '',
                        jadwal_praktik: row[7] || '',
                        no_telepon: row[8] || '',
                        email: row[9] || '',
                        status: row[10] || 'aktif',
                        foto: row[11] || '',
                        alamat_google_maps: row[12] || ''
                    }));
                    
                    state.sheetConnected = true;
                    state.lastSyncTime = new Date();
                    showNotification(`Berhasil sync ${state.cachedNakesData.length} data Nakes`, 'success');
                } else {
                    console.warn('⚠️ No DataNakes source available');
                    state.sheetConnected = false;
                }
            } else {
                console.warn('⚠️ No DataNakes source available - Apps Script URL not configured');
                state.sheetConnected = false;
            }
        }
    } catch (error) {
        console.error('Sync Nakes error:', error);
        state.sheetConnected = false;
        showNotification('Gagal sync data Nakes: ' + error.message, 'warning');
    }
    
    state.syncStatus = 'idle';
    updateSyncUI();
    updateHeroStats();
}

/**
 * Sync data Users dari Google Sheets
 * Sheet "Users": ID, Username, Password, Nama, Role, Email, Status, LastLogin
 * PRIORITY: CSV direct access → fallback ke Apps Script
 */
async function syncUsersData() {
    try {
        // METHOD 1: Try CSV direct access first (no Apps Script needed!)
        const csvResult = await fetchGoogleSheetsCSV('Users');
        
        if (csvResult.success && csvResult.data.length > 0) {
            state.cachedUsersData = csvResult.data.map(row => ({
                id: row.id || row[0] || '',
                username: row.username || row[1] || '',
                password: row.password || row[2] || '',
                nama: row.nama || row[3] || '',
                role: row.role || row[4] || 'user',
                email: row.email || row[5] || '',
                status: row.status || row[6] || 'aktif',
                lastLogin: row.lastlogin || row.lastlogin || row[7] || '-'
            }));
            
            console.log(`✅ Sync Users via CSV: ${state.cachedUsersData.length} users`);
            return true;
        }
        
        // METHOD 2: Fallback to Apps Script Web App
        const result = await getFromSheet('getUsers');
        
        if (result.success && result.data) {
            state.cachedUsersData = result.data.map(row => ({
                id: row[0],
                username: row[1],
                password: row[2] || '',
                nama: row[3],
                role: row[4] || 'user',
                email: row[5] || '',
                status: row[6] || 'aktif',
                lastLogin: row[7] || '-'
            }));
            
            console.log(`✅ Sync Users via Apps Script: ${state.cachedUsersData.length} users`);
            return true;
        }
    } catch (error) {
        console.error('Users sync error:', error);
    }
    return false;
}

/**
 * Authenticate user against cached Users data from Google Sheets
 * Returns user object if authenticated, null otherwise
 */
function authenticateUser(username, password) {
    const users = state.cachedUsersData || [];
    
    // Find user by username (case-insensitive)
    const user = users.find(u => 
        u.username?.toLowerCase() === username.toLowerCase() && 
        u.status?.toLowerCase() === 'aktif'
    );
    
    if (!user) {
        return { success: false, error: 'Username tidak ditemukan atau tidak aktif' };
    }
    
    // Verify password (plain text comparison - in production should use hashing)
    if (user.password !== password) {
        return { success: false, error: 'Password salah' };
    }
    
    return { 
        success: true, 
        user: {
            id: user.id,
            username: user.username,
            name: user.nama,
            role: user.role,
            email: user.email
        }
    };
}

/**
 * Sync data Named (Dokter & Dokter Gigi per Institusi) dari Google Sheets
 * Sheet "Named": ID, Institusi, Tipe, Dokter, Dokter Gigi, Total, Persentase
 * PRIORITY: CSV direct access → fallback ke Apps Script
 */
async function syncNamedData() {
    try {
        // METHOD 1: Try CSV direct access first (no Apps Script needed!)
        const csvResult = await fetchGoogleSheetsCSV('Named');
        
        if (csvResult.success && csvResult.data.length > 0) {
            state.cachedNamedData = csvResult.data.map(row => ({
                id: row.id || row[0] || '',
                nama: row.institusi || row.nama || row[1] || '',
                tipe: row.tipe || row[2] || 'Lainnya',
                dokter: parseInt(row.dokter || row['doktergigi']?.split?.(',')[0] || row[3]) || 0,
                dokterGigi: parseInt(row['doktergigi'] || row['doktergigi'] || row[4]) || 0,
                total: parseInt(row.total || row[5]) || 0,
                persentase: row.persentase || row[6] || '0',
                updatedAt: row.updatedat || row.updatedAt || row[7] || ''
            }));
            
            console.log(`✅ Sync Named data via CSV: ${state.cachedNamedData.length} institusi`);
            state.sheetConnected = true;
            return true;
        }
        
        // METHOD 2: Fallback to Apps Script Web App
        if (!CONFIG.GOOGLE_APPS_SCRIPT_URL.includes('YOUR_WEB_APP_ID')) {
            const result = await getFromSheet('getNamed');
            
            if (result.success && result.data) {
                state.cachedNamedData = result.data.map(row => ({
                    id: row.id || row[0],
                    nama: row.nama || row[1] || '',
                    tipe: row.tipe || row[2] || 'Lainnya',
                    dokter: parseInt(row.dokter || row[3]) || 0,
                    dokterGigi: parseInt(row.dokterGigi || row[4]) || 0,
                    total: parseInt(row.total || row[5]) || 0,
                    persentase: row.persentase || row[6] || '',
                    updatedAt: row.updatedAt || row[7] || ''
                }));
                
                console.log(`✅ Sync Named data via Apps Script: ${state.cachedNamedData.length} institusi`);
                state.sheetConnected = true;
                return true;
            }
        }
        
        console.warn('⚠️ No data source available for Named');
        state.sheetConnected = false;
        return false;
        
    } catch (error) {
        console.error('Named sync error:', error);
        showNotification('Gagal sync data Named: ' + error.message, 'warning');
        state.sheetConnected = false;
        return false;
    }
}

/**
 * Sync data Nakes Institusi (Perawat, Bidan, Apoteker per Institusi) dari Google Sheets
 * Sheet "Nakes": ID, Institusi, Tipe, Perawat, Bidan, Apoteker, Lainnya, Total, UpdatedAt
 * PRIORITY: CSV direct access → fallback ke Apps Script
 */
async function syncInstitusiNakesData() {
    try {
        // METHOD 1: Try CSV direct access first (no Apps Script needed!)
        const csvResult = await fetchGoogleSheetsCSV('Nakes');
        
        if (csvResult.success && csvResult.data.length > 0) {
            state.cachedInstitusiNakesData = csvResult.data.map(row => ({
                id: row.id || row[0] || '',
                nama: row.institusi || row.nama || row[1] || '',
                tipe: row.tipe || row[2] || 'Lainnya',
                perawat: parseInt(row.perawat || row[3]) || 0,
                bidan: parseInt(row.bidan || row[4]) || 0,
                apoteker: parseInt(row.apoteker || row[5]) || 0,
                lainnya: parseInt(row.lainnya || row[6]) || 0,
                total: parseInt(row.total || row[7]) || 0,
                updatedAt: row.updatedat || row.updatedAt || row[8] || ''
            }));
            
            console.log(`✅ Sync Nakes Institusi via CSV: ${state.cachedInstitusiNakesData.length} institusi`);
            state.sheetConnected = true;
            return true;
        }
        
        // METHOD 2: Fallback to Apps Script Web App
        if (!CONFIG.GOOGLE_APPS_SCRIPT_URL.includes('YOUR_WEB_APP_ID')) {
            const result = await getFromSheet('getInstitusiNakes');
            
            if (result.success && result.data) {
                state.cachedInstitusiNakesData = result.data.map(row => ({
                    id: row.id || row[0],
                    nama: row.nama || row[1] || '',
                    tipe: row.tipe || row[2] || 'Lainnya',
                    perawat: parseInt(row.perawat || row[3]) || 0,
                    bidan: parseInt(row.bidan || row[4]) || 0,
                    apoteker: parseInt(row.apoteker || row[5]) || 0,
                    lainnya: parseInt(row.lainnya || row[6]) || 0,
                    total: parseInt(row.total || row[7]) || 0,
                    updatedAt: row.updatedAt || row[8] || ''
                }));
                
                console.log(`✅ Sync Nakes Institusi via Apps Script: ${state.cachedInstitusiNakesData.length} institusi`);
                state.sheetConnected = true;
                return true;
            }
        }
        
        console.warn('⚠️ No data source available for Nakes Institusi');
        state.sheetConnected = false;
        return false;
        
    } catch (error) {
        console.error('Nakes Institusi sync error:', error);
        showNotification('Gagal sync data Nakes: ' + error.message, 'warning');
        state.sheetConnected = false;
        return false;
    }
}

/**
 * Login via Google Sheets
 */
async function loginToSheet(username, password) {
    try {
        const result = await fetch(CONFIG.GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'login',
                username: username,
                password: password
            })
        });
        
        // Handle no-cors response
        return { success: true }; // Assume success
        
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Tambah data Nakes baru
 */
async function addNakesToSheet(nakesData) {
    return await fetchFromSheet('addNakes', { data: nakesData });
}

/**
 * Update data Nakes
 */
async function updateNakesInSheet(id, nakesData) {
    return await fetchFromSheet('updateNakes', { id: id, data: nakesData });
}

/**
 * Hapus data Nakes
 */
async function deleteNakesFromSheet(id) {
    return await fetchFromSheet('deleteNakes', { id: id });
}


// === GOOGLE SHEETS INTEGRATION ===
// ==================== GOOGLE SHEETS INTEGRATION ====================
async function syncWithGoogleSheet() {
    // Use new comprehensive sync (CSV + Apps Script fallback)
    await syncAllData();
}

