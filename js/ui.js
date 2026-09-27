// =============================================================
// ui.js
// Toast, stats, render dispatcher
// =============================================================

// ==================== SYNC STATUS UI (no-op, no button) ====================
/**
 * UpdateSyncUI — sebelumnya mengubah tombol "Sync Data".
 * Tombol sync sudah dihapus; data otomatis di-fetch dari Nhost saat init.
 * Fungsi ini dipertahankan sebagai no-op supaya kode lain yang memanggil
 * tetap berjalan tanpa error.
 */
function updateSyncUI() {
    // No-op. Data selalu fresh dari Nhost.
    return;
}

// ==================== TOAST NOTIFICATION ====================
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = type === 'success' ? 
        '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' :
        '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
    
    toast.innerHTML = `${icon}<span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => toast.remove(), 4000);
}

// ==================== STATS HELPERS ====================
function getStats() {
    const data = state.cachedNakesData;
    return {
        total: data.length,
        aktif: data.filter(n => n.status === 'aktif').length,
        nonAktif: data.filter(n => n.status !== 'aktif').length,
        dokter: data.filter(n => n.jenis === 'dokter').length,
        bidan: data.filter(n => n.jenis === 'bidan').length,
        perawat: data.filter(n => n.jenis === 'perawat').length
    };
}

function updateHeroStats() {
    const stats = getStats();
    const elDokter = document.getElementById('heroDokterCount');
    const elBidan = document.getElementById('heroBidanCount');
    const elPerawat = document.getElementById('heroPerawatCount');
    const elTotal = document.getElementById('heroTotalCount');
    
    if (elDokter) elDokter.textContent = stats.dokter;
    if (elBidan) elBidan.textContent = stats.bidan;
    if (elPerawat) elPerawat.textContent = stats.perawat;
    if (elTotal) elTotal.textContent = stats.aktif;
}

function getFilteredData() {
    let filtered = state.cachedNakesData;
    
    if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase();
        filtered = filtered.filter(n => 
            n.nama.toLowerCase().includes(q) ||
            n.spesialisasi.toLowerCase().includes(q) ||
            (n.alamat_praktik && n.alamat_praktik.toLowerCase().includes(q))
        );
    }
    
    if (state.filterJenis !== 'semua') {
        filtered = filtered.filter(n => n.jenis === state.filterJenis);
    }
    
    return filtered;
}

// ==================== RENDER FUNCTIONS ====================
