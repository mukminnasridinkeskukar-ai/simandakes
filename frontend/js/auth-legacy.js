// === AUTH FUNCTIONS ===
// ==================== AUTH FUNCTIONS ====================
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    const btn = document.getElementById('loginBtn');
    
    // Show loading
    btn.innerHTML = '<svg class="animate-spin" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2v4m0 12v4m-8-8h4m12 0h4"/></svg> Memproses...';
    btn.disabled = true;
    errorEl.classList.add('hidden');
    
    // Async authentication using data from Google Sheets Users sheet
    setTimeout(async () => {
        try {
            // Ensure users data is synced
            if (!state.cachedUsersData || state.cachedUsersData.length === 0) {
                await syncUsersData();
            }
            
            // Authenticate against cached users data
            const authResult = authenticateUser(username, password);
            
            if (authResult.success) {
                state.isLoggedIn = true;
                state.userRole = authResult.user.role;
                state.userName = authResult.user.name;
                loginSuccess();
            } else {
                errorEl.textContent = authResult.error || 'Username atau password salah!';
                errorEl.classList.remove('hidden');
                btn.innerHTML = '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Masuk ke Dashboard';
                btn.disabled = false;
            }
        } catch (error) {
            console.error('Login error:', error);
            errorEl.textContent = 'Terjadi kesalahan saat memverifikasi data. Silakan coba lagi.';
            errorEl.classList.remove('hidden');
            btn.innerHTML = '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Masuk ke Dashboard';
            btn.disabled = false;
        }
    }, 800);
}

function loginSuccess() {
    // Update UI for logged-in user
    document.getElementById('sidebarUser').classList.remove('hidden');
    document.getElementById('userNameDisplay').textContent = state.userName;
    document.getElementById('userAvatar').textContent = state.userName.split(' ').map(n=>n[0]).join('').slice(0,2);
    
    const roleBadge = document.getElementById('userRoleBadge');
    roleBadge.textContent = state.userRole;
    roleBadge.className = 'badge ' + (
        state.userRole === 'superadmin' ? 'badge-danger' :
        state.userRole === 'operator' ? 'badge-info' : 'badge-gray'
    );
    
    document.getElementById('adminNavText').textContent = 'Admin Panel';
    document.getElementById('logoutNavBtn').classList.remove('hidden');
    document.getElementById('loginHeaderBtn').classList.add('hidden');
    document.getElementById('logoutHeaderBtn').classList.remove('hidden');
    
    showToast('Selamat datang, ' + state.userName + '!', 'success');
    showDashboard();
    navigateTo('admin-dashboard');
}


// === SESSION MANAGEMENT ===
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

