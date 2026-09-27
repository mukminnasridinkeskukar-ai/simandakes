// =============================================================
// session.js
// Session management + logout + notifications
// =============================================================

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
    navigateTo('nakes');
}

function exportData() {
    const data = state.cachedNakesData;
    let csv = 'Nama,Jenis,Spesialisasi,Alamat Praktik,Jadwal Praktik,Telepon,Email,Status\\n';
    data.forEach(n => {
        csv += `"${n.nama}","${n.jenis}","${n.spesialisasi}","${n.alamat_praktik}","${n.jadwal_praktik}","${n.no_telepon}","${n.email}","${n.status}"\\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data_nakes_simandakes.csv';
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification('Data berhasil di-export!', 'success');
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            ${type === 'success' ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>' :
              type === 'error' ? '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>' :
              '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'}
        </svg>
        <span>${message}</span>
    `;
    
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '16px 24px',
        borderRadius: '12px',
        background: type === 'success' ? '#059669' : type === 'error' ? '#ef4444' : '#0ea5e9',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        zIndex: '9999',
        animation: 'slideIn 0.3s ease'
    });
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ==================== INITIALIZATION ====================
