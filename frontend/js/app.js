// =============================================================
// app.js
// App initialization + main entry
// =============================================================

// ==================== INITIALIZATION ====================
/**
 * Sync semua data dari Google Sheets (CSV direct access)
 */
async function syncAllData() {
    console.log('🔄 Starting full data sync via CSV...');
    showNotification('Menyinkronkan data...', 'info');
    
    try {
        // Always try CSV first - works without Apps Script deployment!
        const results = await Promise.all([
            syncNamedData(),
            syncInstitusiNakesData(),
            syncNakesData()
        ]);
        
        const successCount = results.filter(r => r).length;
        
        if (successCount > 0) {
            showNotification(`✅ Berhasil sync ${successCount}/3 sumber data`, 'success');
            console.log(`✅ Sync completed: ${successCount}/3 sources successful`);
        } else {
            showNotification('⚠️ Gagal sync - cek koneksi atau setting sheet publik', 'warning');
            console.warn('⚠️ All sync attempts failed');
        }
        
        // Re-render current view with new data
        renderCurrentView();
        updateHeroStats();
        
    } catch (error) {
        console.error('Sync error:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}


