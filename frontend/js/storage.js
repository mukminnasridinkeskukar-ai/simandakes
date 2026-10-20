// =============================================================
// storage.js
// Local storage persistence + sync helpers + CSV export
// =============================================================

// ==================== DATA PERSISTENCE & SYNC ====================
/**
 * Save current data state to localStorage as backup
 */
function saveDataToLocalStorage() {
    try {
        localStorage.setItem('simandakes_nakes_data', JSON.stringify(state.cachedNakesData || []));
        localStorage.setItem('simandakes_named_data', JSON.stringify(state.cachedNamedData || []));
        localStorage.setItem('simandakes_institusi_nakes_data', JSON.stringify(state.cachedInstitusiNakesData || []));
        console.log('💾 Data saved to localStorage backup');
    } catch (e) {
        console.warn('Failed to save to localStorage:', e);
    }
}

/**
 * Load data from localStorage backup
 */
function loadDataFromLocalStorage() {
    try {
        const savedNakes = localStorage.getItem('simandakes_nakes_data');
        const savedNamed = localStorage.getItem('simandakes_named_data');
        const savedInstitusiNakes = localStorage.getItem('simandakes_institusi_nakes_data');
        
        if (savedNakes && JSON.parse(savedNakes).length > 0) {
            state.cachedNakesData = JSON.parse(savedNakes);
            console.log('📦 Loaded Nakes data from localStorage:', state.cachedNakesData.length, 'items');
        }
        if (savedNamed && JSON.parse(savedNamed).length > 0) {
            state.cachedNamedData = JSON.parse(savedNamed);
            console.log('📦 Loaded Named data from localStorage:', state.cachedNamedData.length, 'items');
        }
        if (savedInstitusiNakes && JSON.parse(savedInstitusiNakes).length > 0) {
            state.cachedInstitusiNakesData = JSON.parse(savedInstitusiNakes);
            console.log('📦 Loaded Institusi Nakes data from localStorage:', state.cachedInstitusiNakesData.length, 'items');
        }
    } catch (e) {
        console.warn('Failed to load from localStorage:', e);
    }
}

/**
 * Sync changes to Google Apps Script (if configured)
 */
async function syncNakesChange(action, data) {
    // If Apps Script URL is configured, try to sync
    if (!CONFIG.GOOGLE_APPS_SCRIPT_URL.includes('YOUR_WEB_APP_ID')) {
        try {
            await fetchFromSheet(action === 'add' ? 'addNakes' : action === 'update' ? 'updateNakes' : 'deleteNakes', data);
            console.log(`☁️ Nakes ${action} synced to Google Sheets`);
        } catch (e) {
            console.warn('Google Sheets sync failed, data saved locally only:', e.message);
        }
    } else {
        console.log(`ℹ️ Nakes ${action} saved locally (Apps Script not configured)`);
    }
}

async function syncNamedChange(action, data) {
    if (!CONFIG.GOOGLE_APPS_SCRIPT_URL.includes('YOUR_WEB_APP_ID')) {
        try {
            await fetchFromSheet(action === 'add' ? 'addNamed' : action === 'update' ? 'updateNamed' : 'deleteNamed', data);
            console.log(`☁️ Named ${action} synced to Google Sheets`);
        } catch (e) {
            console.warn('Google Sheets sync failed:', e.message);
        }
    }
}

async function syncInstitusiNakesChange(action, data) {
    if (!CONFIG.GOOGLE_APPS_SCRIPT_URL.includes('YOUR_WEB_APP_ID')) {
        try {
            await fetchFromSheet(action === 'add' ? 'addInstitusiNakes' : action === 'update' ? 'updateInstitusiNakes' : 'deleteInstitusiNakes', data);
            console.log(`☁️ Institusi Nakes ${action} synced to Google Sheets`);
        } catch (e) {
            console.warn('Google Sheets sync failed:', e.message);
        }
    }
}

/**
 * Export all admin data to CSV
 */
function exportAllAdminData() {
    exportDataNakesCSV();
    exportNamedCSV();
    exportInstitusiNakesCSV();
    showNotification('Semua data berhasil di-export!', 'success');
}

function exportDataNakesCSV() {
    const data = state.cachedNakesData || [];
    if (data.length === 0) return;
    
    let csv = 'ID,Nama,Jenis,Spesialisasi,STR,SIP,Alamat Praktik,Google Maps URL,Jadwal Praktik,Telepon,Email,Status,Foto\\n';
    data.forEach(n => {
        csv += `"${n.id}","${n.nama}","${n.jenis}","${n.spesialisasi}","${n.str}","${n.sip}","${n.alamat_praktik}","${n.alamat_google_maps || ''}","${n.jadwal_praktik}","${n.no_telepon}","${n.email}","${n.status}","${n.foto}"\\n`;
    });
    downloadCSV(csv, 'simandakes_datanakes.csv');
}

function exportNamedCSV() {
    const data = state.cachedNamedData || [];
    if (data.length === 0) return;
    
    let csv = 'ID,Institusi,Tipe,Dokter,Dokter Gigi,Total,Updated At\\n';
    data.forEach(d => {
        csv += `"${d.id}","${d.nama}","${d.tipe}",${d.dokter},${d.dokterGigi},${d.total},"${d.updatedAt || ''}"\\n`;
    });
    downloadCSV(csv, 'simandakes_named.csv');
}

function exportInstitusiNakesCSV() {
    const data = state.cachedInstitusiNakesData || [];
    if (data.length === 0) return;
    
    let csv = 'ID,Institusi,Tipe,Perawat,Bidan,Apoteker,Lainnya,Total,Updated At\\n';
    data.forEach(d => {
        csv += `"${d.id}","${d.nama}","${d.tipe}",${d.perawat},${d.bidan},${d.apoteker},${d.lainnya},${d.total},"${d.updatedAt || ''}"\\n`;
    });
    downloadCSV(csv, 'simandakes_institusi_nakes.csv');
}

// ==================== SESSION MANAGEMENT ====================
