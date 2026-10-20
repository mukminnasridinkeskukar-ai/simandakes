// =============================================================
// export.js
// Export data ke CSV
// =============================================================

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
/**
 * Check for existing session on page load
 */
function checkExistingSession() {
    const session = localStorage.getItem('simandakes_session');
    if (session) {
        try {
            const parsed = JSON.parse(session);
            if (parsed.isLoggedIn && parsed.loginTime) {
                // Check if session is less than 24 hours old
                const loginDate = new Date(parsed.loginTime);
                const now = new Date();
                const hoursDiff = (now - loginDate) / (1000 * 60 * 60);
                
                if (hoursDiff < 24) {
                    state.isLoggedIn = parsed.isLoggedIn;
                    state.userRole = parsed.userRole;
                    state.userName = parsed.userName;
                    updateUIForLoggedInUser();
                    console.log('✅ Session restored for:', parsed.userName);
                    return true;
                } else {
                    // Session expired
                    localStorage.removeItem('simandakes_session');
                    console.log('⏰ Session expired');
                }
            }
        } catch (e) {
            console.warn('Invalid session data');
        }
    }
    return false;
}

/**
 * Handle logout - clear session and reset UI
 */
function handleLogout() {
    state.isLoggedIn = false;
    state.userRole = null;
    state.userName = '';
    
    // Clear session
    localStorage.removeItem('simandakes_session');
    
    // Reset UI
    resetUIForLoggedOutUser();
    
    showToast('Anda telah keluar dari sistem', 'success');
    navigateTo('inovdash');
}

