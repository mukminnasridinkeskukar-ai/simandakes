// === STATS HELPERS ===
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

