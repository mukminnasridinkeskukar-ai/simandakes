// =============================================================
// app.js
// App initialization + main entry
//
// Strategi: AUTO-FETCH dari Nhost saat aplikasi dimuat.
// Tidak ada lagi tombol "Sync Data" — data selalu fresh dari backend.
// Tidak ada mock data — kalau Nhost belum dikonfigurasi, tampilkan pesan error.
// =============================================================

// ==================== INITIALIZATION ====================
/**
 * Fetch semua data dari Nhost (GraphQL) saat aplikasi dimuat.
 * Dipanggil otomatis pada DOMContentLoaded.
 *
 * Catatan:
 *   - Hanya pakai Nhost (tidak ada fallback Google Sheets / mock data)
 *   - Bila Nhost belum dikonfigurasi, log error + tampilkan notifikasi
 *   - Bila gagal fetch salah satu sumber, log warning tapi tetap lanjut
 */
async function fetchInitialData() {
    console.log('🔄 Fetching initial data from Nhost...');

    if (!CONFIG.NHOST || !CONFIG.NHOST.BACKEND_URL || CONFIG.NHOST.BACKEND_URL.includes('YOUR-PROJECT-SUBDOMAIN')) {
        const msg = 'Nhost BACKEND_URL belum dikonfigurasi. Set di js/config.js atau via localStorage.';
        console.error('❌ ' + msg);
        showNotification(msg, 'error');
        state.sheetConnected = false;
        updateSyncUI();
        return;
    }

    if (!window.nhostClient) {
        const msg = 'nhostClient tidak tersedia. Pastikan js/nhost-client.js di-load.';
        console.error('❌ ' + msg);
        showNotification(msg, 'error');
        state.sheetConnected = false;
        updateSyncUI();
        return;
    }

    state.syncStatus = 'syncing';
    updateSyncUI();

    try {
        // Fetch ketiga sumber data paralel dari Nhost
        const results = await Promise.allSettled([
            syncNamedData(),
            syncInstitusiNakesData(),
            syncNakesData(),
        ]);

        const successCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
        const failedNames = [];
        if (results[0].status !== 'fulfilled' || results[0].value !== true) failedNames.push('Named');
        if (results[1].status !== 'fulfilled' || results[1].value !== true) failedNames.push('InstitusiNakes');
        if (results[2].status !== 'fulfilled' || results[2].value !== true) failedNames.push('DataNakes');

        if (successCount > 0) {
            console.log(`✅ Initial fetch completed: ${successCount}/3 sources successful`);
            if (failedNames.length > 0) {
                console.warn('⚠️ Failed sources:', failedNames.join(', '));
            }
        } else {
            console.error('❌ All fetch attempts failed');
            showNotification('Gagal mengambil data dari Nhost. Cek koneksi atau konfigurasi.', 'error');
        }

        // Render ulang view aktif dengan data baru
        renderCurrentView();
        updateHeroStats();

    } catch (error) {
        console.error('Initial fetch error:', error);
        showNotification('Error: ' + error.message, 'error');
    } finally {
        state.syncStatus = 'idle';
        updateSyncUI();
    }
}

// ==================== DOM READY ====================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 SIMANDAKES starting...');

    // Cek session yang tersimpan
    if (typeof checkExistingSession === 'function') {
        checkExistingSession();
    }

    // Auto-fetch data dari Nhost
    await fetchInitialData();

    console.log('✅ SIMANDAKES ready');
});
