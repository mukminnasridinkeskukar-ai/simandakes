// =============================================================
// auth.js
// Admin authentication + render admin dashboard
// =============================================================

// ==================== ADMIN DASHBOARD WITH FULL CRUD ====================
let adminCurrentTab = 'datanakes';
let adminSearchQuery = '';
let adminCurrentPage = 1;
const ITEMS_PER_PAGE = 10;

/**
 * Show professional login modal for admin access
 * Uses data from Google Sheets "Users" sheet
 */
function showLoginModal() {
    // Remove existing modal if any
    const existingModal = document.getElementById('adminLoginModal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'adminLoginModal';
    modal.className = 'login-modal-overlay';
    modal.innerHTML = `
        <div class="login-modal" onclick="event.stopPropagation()">
            <div class="login-header">
                <div class="login-header-icon">🔐</div>
                <h2>Panel Administrasi</h2>
                <p>Masuk menggunakan akun dari Google Sheets</p>
            </div>
            <div class="login-body">
                <div id="loginErrorMsg" class="login-error"></div>
                <form onsubmit="handleAdminLogin(event)">
                    <div class="login-form-group">
                        <label class="login-form-label">Username</label>
                        <input type="text" id="adminUsername" class="login-input" placeholder="Masukkan username" required autocomplete="username">
                    </div>
                    <div class="login-form-group">
                        <label class="login-form-label">Password</label>
                        <input type="password" id="adminPassword" class="login-input" placeholder="Masukkan password" required autocomplete="current-password">
                    </div>
                    <button type="submit" id="adminLoginBtn" class="login-btn">
                        <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                        Masuk ke Panel
                    </button>
                </form>
            </div>
            <div class="login-footer">
                <p class="login-hint">🔒 Login menggunakan data akun terdaftar di sistem</p>
            </div>
        </div>
    `;
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) closeModal('adminLoginModal');
    });
    
    document.body.appendChild(modal);
    document.getElementById('adminUsername').focus();
}

/**
 * Handle admin login form submission
 * Authenticates against Google Sheets "Users" sheet data
 */
async function handleAdminLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value;
    const errorEl = document.getElementById('loginErrorMsg');
    const btn = document.getElementById('adminLoginBtn');
    
    // Show loading state
    btn.disabled = true;
    btn.innerHTML = '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" class="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Memverifikasi...';
    errorEl.classList.remove('show');
    
    try {
        // Ensure users data is synced from Google Sheets
        if (!state.cachedUsersData || state.cachedUsersData.length === 0) {
            btn.innerHTML = '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 22" class="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Memuat data...';
            await syncUsersData();
        }
        
        // Small delay for UI feedback
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Authenticate against cached users data from Google Sheets
        const authResult = authenticateUser(username, password);
        
        if (authResult.success) {
            const user = authResult.user;
            
            // Success!
            state.isLoggedIn = true;
            state.userRole = user.role;
            state.userName = user.name;
            
            // Store session in localStorage (for persistence across refresh)
            localStorage.setItem('simandakes_session', JSON.stringify({
                isLoggedIn: true,
                userId: user.id,
                userRole: user.role,
                userName: user.name,
                loginTime: new Date().toISOString()
            }));
            
            closeModal('adminLoginModal');
            updateUIForLoggedInUser();
            navigateTo('admin-dashboard');
            showNotification(`Selamat datang, ${user.name}!`, 'success');
        } else {
            // Failed
            errorEl.textContent = '❌ ' + (authResult.error || 'Username atau password salah! Silakan coba lagi.');
            errorEl.classList.add('show');
            btn.disabled = false;
            btn.innerHTML = '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg> Masuk ke Panel';
            document.getElementById('adminPassword').value = '';
            document.getElementById('adminPassword').focus();
        }
    } catch (error) {
        console.error('Admin login error:', error);
        errorEl.textContent = '❌ Terjadi kesalahan saat memverifikasi data. Silakan coba lagi.';
        errorEl.classList.add('show');
        btn.disabled = false;
        btn.innerHTML = '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg> Masuk ke Panel';
    }
}

/**
 * Update UI elements when user is logged in
 */
function updateUIForLoggedInUser() {
    // Sidebar updates
    const sidebarUser = document.getElementById('sidebarUser');
    if (sidebarUser) sidebarUser.classList.remove('hidden');
    
    const userNameDisplay = document.getElementById('userNameDisplay');
    if (userNameDisplay) userNameDisplay.textContent = state.userName;
    
    const userAvatar = document.getElementById('userAvatar');
    if (userAvatar) userAvatar.textContent = state.userName.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
    
    const roleBadge = document.getElementById('userRoleBadge');
    if (roleBadge) {
        roleBadge.textContent = state.userRole;
        roleBadge.className = 'badge ' + (
            state.userRole === 'superadmin' ? 'badge-danger' :
            state.userRole === 'admin' ? 'badge-danger' :
            state.userRole === 'operator' ? 'badge-info' : 'badge-gray'
        );
    }
    
    const adminNavText = document.getElementById('adminNavText');
    if (adminNavText) adminNavText.textContent = 'Admin Panel';
    
    const logoutNavBtn = document.getElementById('logoutNavBtn');
    if (logoutNavBtn) logoutNavBtn.classList.remove('hidden');
    
    // Header buttons
    const loginHeaderBtn = document.getElementById('loginHeaderBtn');
    if (loginHeaderBtn) loginHeaderBtn.classList.add('hidden');
    
    const logoutHeaderBtn = document.getElementById('logoutHeaderBtn');
    if (logoutHeaderBtn) logoutHeaderBtn.classList.remove('hidden');
}

/**
 * Reset UI when user logs out
 */
function resetUIForLoggedOutUser() {
    const sidebarUser = document.getElementById('sidebarUser');
    if (sidebarUser) sidebarUser.classList.add('hidden');
    
    const adminNavText = document.getElementById('adminNavText');
    if (adminNavText) adminNavText.textContent = 'Login Admin';
    
    const logoutNavBtn = document.getElementById('logoutNavBtn');
    if (logoutNavBtn) logoutNavBtn.classList.add('hidden');
    
    const loginHeaderBtn = document.getElementById('loginHeaderBtn');
    if (loginHeaderBtn) loginHeaderBtn.classList.remove('hidden');
    
    const logoutHeaderBtn = document.getElementById('logoutHeaderBtn');
    if (logoutHeaderBtn) logoutHeaderBtn.classList.add('hidden');
}

/**
 * Close modal by ID
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.remove();
}

/**
 * Render complete Admin Dashboard with tabs and CRUD functionality
 */
function renderAdminDashboard() {
    // Check if user is logged in
    if (!state.isLoggedIn) {
        return renderAdminLoginPrompt();
    }
    
    const stats = getStats();
    
    return `
        <!-- Admin Header -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:16px;">
            <div>
                <h2 style="font-size:28px;font-weight:700;color:#111827;display:flex;align-items:center;gap:12px;">
                    <span style="background:linear-gradient(135deg,#059669,#0ea5e9);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">⚙️ Panel Admin</span>
                </h2>
                <p style="color:#6b7280;font-size:16px;margin-top:4px;">Kelola data SIMANDAKES • Login sebagai <strong>${state.userName}</strong> (${state.userRole})</p>
            </div>
            <div style="display:flex;gap:12px;">
                <button onclick="syncAllData()" class="btn btn-secondary btn-sm">
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                    Sync Data
                </button>
                <button onclick="exportAllAdminData()" class="btn btn-outline btn-sm">
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Export All
                </button>
            </div>
        </div>
        
        <!-- Stats Cards -->
        <div class="stats-cards-grid">
            <div class="stat-card-admin">
                <div class="stat-card-admin-header">
                    <div>
                        <p class="stat-card-label">Total Nakes Individu</p>
                        <p class="stat-card-value" style="color:#4f46e5;">${stats.total}</p>
                    </div>
                    <div class="stat-card-icon" style="background:#eef2ff;">👨‍⚕️</div>
                </div>
            </div>
            <div class="stat-card-admin">
                <div class="stat-card-admin-header">
                    <div>
                        <p class="stat-card-label">Nakes Aktif</p>
                        <p class="stat-card-value" style="color:#059669;">${stats.aktif}</p>
                    </div>
                    <div class="stat-card-icon" style="background:#dcfce7;">✅</div>
                </div>
            </div>
            <div class="stat-card-admin">
                <div class="stat-card-admin-header">
                    <div>
                        <p class="stat-card-label">Institusi Named</p>
                        <p class="stat-card-value" style="color:#0891b2;">${state.cachedNamedData ? state.cachedNamedData.length : 0}</p>
                    </div>
                    <div class="stat-card-icon" style="background:#cffafe;">🏥</div>
                </div>
            </div>
            <div class="stat-card-admin">
                <div class="stat-card-admin-header">
                    <div>
                        <p class="stat-card-label">Institusi Nakes</p>
                        <p class="stat-card-value" style="color:#ec4899;">${state.cachedInstitusiNakesData ? state.cachedInstitusiNakesData.length : 0}</p>
                    </div>
                    <div class="stat-card-icon" style="background:#fce7f3;">🏢</div>
                </div>
            </div>
        </div>
        
        <!-- Tabs Navigation -->
        <div class="admin-tabs">
            <button class="admin-tab ${adminCurrentTab === 'datanakes' ? 'active' : ''}" onclick="switchAdminTab('datanakes')">
                👤 Data Nakes
                <span class="badge badge-blue" style="margin-left:4px;">${state.cachedNakesData ? state.cachedNakesData.length : 0}</span>
            </button>
            <button class="admin-tab ${adminCurrentTab === 'named' ? 'active' : ''}" onclick="switchAdminTab('named')">
                🏥 Institusi Dokter
                <span class="badge badge-info" style="margin-left:4px;">${state.cachedNamedData ? state.cachedNamedData.length : 0}</span>
            </button>
            <button class="admin-tab ${adminCurrentTab === 'institusi-nakes' ? 'active' : ''}" onclick="switchAdminTab('institusi-nakes')">
                🏢 Institusi Nakes
                <span class="badge badge-pink" style="margin-left:4px;">${state.cachedInstitusiNakesData ? state.cachedInstitusiNakesData.length : 0}</span>
            </button>
            <button class="admin-tab ${adminCurrentTab === 'users' ? 'active' : ''}" onclick="switchAdminTab('users')">
                👥 Pengguna
                <span class="badge badge-gray" style="margin-left:4px;">${state.cachedUsersData ? state.cachedUsersData.length : 0}</span>
            </button>
        </div>
        
        <!-- Tab Content -->
        <div id="adminTabContent">
            ${renderAdminTabContent()}
        </div>
    `;
}

/**
 * Render login prompt for non-authenticated users
 */
function renderAdminLoginPrompt() {
    return `
        <div style="min-height:60vh;display:flex;align-items:center;justify-content:center;">
            <div style="text-align:center;max-width:480px;padding:48px;background:white;border-radius:24px;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
                <div style="width:96px;height:96px;background:linear-gradient(135deg,#059669,#0d9488);border-radius:24px;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;font-size:42px;color:white;">
                    🔐
                </div>
                <h2 style="font-size:26px;font-weight:700;color:#111827;margin-bottom:12px;">Panel Administrasi</h2>
                <p style="font-size:16px;color:#6b7280;line-height:1.6;margin-bottom:32px;">
                    Akses terbatas untuk mengelola data SIMANDAKES.<br>
                    Silakan login untuk melanjutkan.
                </p>
                <button onclick="showLoginModal()" class="btn btn-primary btn-lg" style="padding:16px 40px;font-size:16px;">
                    <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                    Login ke Panel Admin
                </button>
            </div>
        </div>
    `;
}

/**
 * Switch between admin tabs
 */
function switchAdminTab(tab) {
    adminCurrentTab = tab;
    adminSearchQuery = '';
    adminCurrentPage = 1;
    
    // Update tab buttons
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    event.target.closest('.admin-tab')?.classList.add('active');
    
    // Re-render content
    const contentEl = document.getElementById('adminTabContent');
    if (contentEl) contentEl.innerHTML = renderAdminTabContent();
}

/**
 * Render content for current admin tab
 */
function renderAdminTabContent() {
    switch(adminCurrentTab) {
        case 'datanakes': return renderDataNakesTable();
        case 'named': return renderNamedTable();
        case 'institusi-nakes': return renderInstitusiNakesTable();
        case 'users': return renderUsersTable();
        default: return renderDataNakesTable();
    }
}

// ==================== DATA NAKES TABLE (CRUD) ====================
