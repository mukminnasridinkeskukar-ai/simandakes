// =============================================================
// api-sheet.js
// Google Sheets/Apps Script API: sync, CRUD, login via sheet
// + Nhost GraphQL adapters (auto-route berdasarkan CONFIG.BACKEND_MODE)
// =============================================================

// ==================== NHOST GraphQL QUERIES ====================
const NHOST_QUERIES = {
    getAllNakes: `
        query GetAllNakes {
            data_nakes(where: { deleted_at: { _is_null: true } }, order_by: { created_at: desc }) {
                id legacy_id nama jenis spesialisasi str sip
                alamat_praktik jadwal_praktik no_telepon email status
                foto_url alamat_google_maps created_at updated_at
            }
        }`,
    insertNakes: `
        mutation InsertNakes($object: data_nakes_insert_input!) {
            insert_data_nakes_one(object: $object) { id legacy_id }
        }`,
    updateNakes: `
        mutation UpdateNakes($id: uuid!, $set: data_nakes_set_input!) {
            update_data_nakes_by_pk(pk_columns: { id: $id }, _set: $set) { id }
        }`,
    deleteNakes: `
        mutation DeleteNakes($id: uuid!) {
            update_data_nakes_by_pk(pk_columns: { id: $id }, _set: { deleted_at: now() }) { id }
        }`,
    getAllNamed: `
        query GetAllNamed {
            institusi_named(where: { deleted_at: { _is_null: true } }, order_by: { created_at: desc }) {
                id legacy_id nama tipe dokter dokter_gigi total persentase updated_at
            }
        }`,
    getAllInstitusiNakes: `
        query GetAllInstitusiNakes {
            institusi_nakes(where: { deleted_at: { _is_null: true } }, order_by: { created_at: desc }) {
                id legacy_id institusi tipe perawat bidan apoteker lainnya total updated_at
            }
        }`,
    getNakesByLegacyId: `
        query GetNakesByLegacyId($legacy_id: String) {
            data_nakes(where: { legacy_id: { _eq: $legacy_id } }, limit: 1) { id }
        }`,
};

// ==================== NHOST DATA ADAPTERS ====================
function nakesFromNhost(row) {
    return {
        id: row.legacy_id || row.id,
        uuid: row.id,
        nama: row.nama,
        jenis: row.jenis,
        spesialisasi: row.spesialisasi || '',
        str: row.str || '',
        sip: row.sip || '',
        alamat_praktik: row.alamat_praktik || '',
        jadwal_praktik: row.jadwal_praktik || '',
        no_telepon: row.no_telepon || '',
        email: row.email || '',
        status: row.status || 'aktif',
        foto: row.foto_url || '',
        alamat_google_maps: row.alamat_google_maps || '',
    };
}

function namedFromNhost(row) {
    return {
        id: row.legacy_id || row.id,
        uuid: row.id,
        nama: row.nama,
        tipe: row.tipe || 'Lainnya',
        dokter: row.dokter || 0,
        dokterGigi: row.dokter_gigi || 0,
        total: row.total || 0,
        persentase: row.persentase || '0',
        updatedAt: row.updated_at || '',
    };
}

function institusiNakesFromNhost(row) {
    return {
        id: row.legacy_id || row.id,
        uuid: row.id,
        institusi: row.institusi,
        tipe: row.tipe || 'Lainnya',
        perawat: row.perawat || 0,
        bidan: row.bidan || 0,
        apoteker: row.apoteker || 0,
        lainnya: row.lainnya || 0,
        total: row.total || 0,
        updatedAt: row.updated_at || '',
    };
}

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
 * Sync data Nakes dari Nhost.
 * Tabel: data_nakes
 */
async function syncNakesData() {
    // === NHOST ONLY: tidak ada fallback Google Sheets / mock data ===
    if (!window.nhostClient) {
        console.error('nhostClient tidak tersedia.');
        state.sheetConnected = false;
        return false;
    }

    try {
        state.syncStatus = 'syncing';
        updateSyncUI();
        const data = await nhostClient.query(NHOST_QUERIES.getAllNakes);
        state.cachedNakesData = (data.data_nakes || []).map(nakesFromNhost);
        state.sheetConnected = true;
        state.lastSyncTime = new Date();
        console.log(`✅ Sync DataNakes via Nhost: ${state.cachedNakesData.length} Nakes`);
        state.syncStatus = 'idle';
        updateSyncUI();
        updateHeroStats();
        return true;
    } catch (error) {
        console.error('Nhost sync Nakes error:', error);
        state.sheetConnected = false;
        state.syncStatus = 'idle';
        updateSyncUI();
        return false;
    }
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
 * Sync data Named dari Nhost.
 * Tabel: institusi_named
 */
async function syncNamedData() {
    // === NHOST ONLY ===
    if (!window.nhostClient) {
        console.error('nhostClient tidak tersedia.');
        state.sheetConnected = false;
        return false;
    }

    try {
        const data = await nhostClient.query(NHOST_QUERIES.getAllNamed);
        state.cachedNamedData = (data.institusi_named || []).map(namedFromNhost);
        console.log(`✅ Sync Named via Nhost: ${state.cachedNamedData.length} institusi`);
        state.sheetConnected = true;
        return true;
    } catch (error) {
        console.error('Nhost sync Named error:', error);
        state.sheetConnected = false;
        return false;
    }
}

/**
 * Sync data Institusi Nakes dari Nhost.
 * Tabel: institusi_nakes (agregat perawat/bidan/apoteker/lainnya per institusi)
 */
async function syncInstitusiNakesData() {
    // === NHOST ONLY ===
    if (!window.nhostClient) {
        console.error('nhostClient tidak tersedia.');
        state.sheetConnected = false;
        return false;
    }

    try {
        const data = await nhostClient.query(NHOST_QUERIES.getAllInstitusiNakes);
        state.cachedInstitusiNakesData = (data.institusi_nakes || []).map(institusiNakesFromNhost);
        console.log(`✅ Sync InstitusiNakes via Nhost: ${state.cachedInstitusiNakesData.length} institusi`);
        state.sheetConnected = true;
        return true;
    } catch (error) {
        console.error('Nhost sync InstitusiNakes error:', error);
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
    if (CONFIG.BACKEND_MODE === 'nhost' && window.nhostClient) {
        try {
            const object = {
                nama: nakesData.nama,
                jenis: nakesData.jenis,
                spesialisasi: nakesData.spesialisasi,
                str: nakesData.str,
                sip: nakesData.sip,
                alamat_praktik: nakesData.alamat_praktik || nakesData.alamatpraktik,
                jadwal_praktik: nakesData.jadwal_praktik || nakesData.jadwalpraktik,
                no_telepon: nakesData.no_telepon || nakesData.notelepon,
                email: nakesData.email,
                status: nakesData.status || 'aktif',
                foto_url: nakesData.foto,
                alamat_google_maps: nakesData.alamat_google_maps || nakesData.alamatgooglemaps,
                legacy_id: nakesData.id || null,
            };
            const data = await nhostClient.mutate(NHOST_QUERIES.insertNakes, { object });
            showNotification('Data nakes berhasil ditambahkan ke Nhost', 'success');
            return { success: true, id: data.insert_data_nakes_one?.id };
        } catch (error) {
            console.error('Nhost addNakes error:', error);
            showNotification('Gagal tambah nakes ke Nhost: ' + error.message, 'error');
            return { success: false, error: error.message };
        }
    }
    return await fetchFromSheet('addNakes', { data: nakesData });
}

/**
 * Update data Nakes
 */
async function updateNakesInSheet(id, nakesData) {
    if (CONFIG.BACKEND_MODE === 'nhost' && window.nhostClient) {
        try {
            // Cari UUID berdasarkan legacy_id
            const lookup = await nhostClient.query(NHOST_QUERIES.getNakesByLegacyId, { legacy_id: id });
            const uuid = lookup.data_nakes?.[0]?.id || id;

            const set = {
                nama: nakesData.nama,
                jenis: nakesData.jenis,
                spesialisasi: nakesData.spesialisasi,
                str: nakesData.str,
                sip: nakesData.sip,
                alamat_praktik: nakesData.alamat_praktik || nakesData.alamatpraktik,
                jadwal_praktik: nakesData.jadwal_praktik || nakesData.jadwalpraktik,
                no_telepon: nakesData.no_telepon || nakesData.notelepon,
                email: nakesData.email,
                status: nakesData.status || 'aktif',
                foto_url: nakesData.foto,
                alamat_google_maps: nakesData.alamat_google_maps || nakesData.alamatgooglemaps,
            };
            await nhostClient.mutate(NHOST_QUERIES.updateNakes, { id: uuid, set });
            showNotification('Data nakes berhasil diupdate di Nhost', 'success');
            return { success: true };
        } catch (error) {
            console.error('Nhost updateNakes error:', error);
            showNotification('Gagal update nakes di Nhost: ' + error.message, 'error');
            return { success: false, error: error.message };
        }
    }
    return await fetchFromSheet('updateNakes', { id: id, data: nakesData });
}

/**
 * Hapus data Nakes (soft delete di Nhost)
 */
async function deleteNakesFromSheet(id) {
    if (CONFIG.BACKEND_MODE === 'nhost' && window.nhostClient) {
        try {
            const lookup = await nhostClient.query(NHOST_QUERIES.getNakesByLegacyId, { legacy_id: id });
            const uuid = lookup.data_nakes?.[0]?.id || id;
            await nhostClient.mutate(NHOST_QUERIES.deleteNakes, { id: uuid });
            showNotification('Data nakes berhasil dihapus (soft delete) di Nhost', 'success');
            return { success: true };
        } catch (error) {
            console.error('Nhost deleteNakes error:', error);
            showNotification('Gagal hapus nakes di Nhost: ' + error.message, 'error');
            return { success: false, error: error.message };
        }
    }
    return await fetchFromSheet('deleteNakes', { id: id });
}

// ==================== UI HELPERS ====================
function showLoading(show) {
    const loader = document.getElementById('globalLoader');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}

// ==================== NAVIGATION FUNCTIONS ====================
