// =============================================================
// navigation.js
// Navigation, sidebar, legacy authenticateUser
// =============================================================

// ==================== NAVIGATION FUNCTIONS ====================
function showLanding() {
    document.getElementById('landingPage').classList.remove('hidden');
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('dashboardPage').classList.add('hidden');
    state.currentView = 'landing';
}

function showLogin() {
    document.getElementById('landingPage').classList.add('hidden');
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('dashboardPage').classList.add('hidden');
    state.currentView = 'login';
}

function showDashboard() {
    document.getElementById('landingPage').classList.add('hidden');
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('dashboardPage').classList.remove('hidden');
    state.currentView = 'dashboard';
    updateHeroStats();
    renderCurrentView();
}

function navigateTo(view) {
    state.dashboardView = view;
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.view === view) {
            item.classList.add('active');
        }
    });
    
    // Update page title
    const titles = {
        'named': ['Named', 'Manajemen Data Nakes'],
        'nakes': ['Directory Nakes', 'Database Tenaga Kesehatan'],
        'cari-dokter': ['Cari Dokter Praktik', 'Pencarian Dokter Sesuai Kebutuhan'],
        'cari-dokter-gigi': ['Cari Dokter Gigi', 'Pencarian Dokter Gigi'],
        'cari-bidan': ['Cari Bidan Praktik', 'Pencarian Bidan Terpercaya'],
        'cari-perawat': ['Cari Perawat Praktik', 'Pencarian Perawat Profesional'],
        'cari-apoteker': ['Cari Apoteker', 'Pencarian Apoteker'],
        'cari-praktik': ['Cari Praktik Nakes', 'Informasi Tempat Praktik'],
        'admin-dashboard': ['Panel Administrasi', 'Kelola Sistem SIMANDAKES']
    };
    
    if (titles[view]) {
        document.getElementById('pageTitle').textContent = titles[view][0];
        document.getElementById('pageSubtitle').textContent = titles[view][1];
    }
    
    renderCurrentView();
}

// ==================== SIDEBAR FUNCTIONS ====================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    state.sidebarCollapsed = !state.sidebarCollapsed;
    if (state.sidebarCollapsed) {
        sidebar.classList.add('collapsed');
    } else {
        sidebar.classList.remove('collapsed');
    }
}

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

// ==================== GOOGLE SHEETS INTEGRATION ====================
