// === AUTH VIA NHOST (baru) ===
// Menggantikan authenticateUser() di auth-legacy.js.
// Strategi: jika window.NhostAPI.isConfigured() -> pakai Nhost,
//            jika tidak -> fallback ke auth-legacy (Google Sheets).
//
// Setelah semua user dimigrasi ke Nhost Auth, hapus auth-legacy.js dan
// panggilan syncUsersData() di api-sheets.js.

(function() {
    'use strict';

    function isNhostActive() {
        return window.NhostAPI && window.NhostAPI.isConfigured();
    }

    async function loginWithNhost(email, password) {
        const session = await window.NhostAPI.login(email, password);
        try {
            const profiles = await window.NhostAPI.fetchAll('user_profiles', {
                id: { _eq: session.user.id }
            });
            const profile = profiles[0];
            if (profile) {
                session.profile = profile;
                localStorage.setItem('simandakes_session', JSON.stringify({
                    isLoggedIn: true,
                    userId: profile.id,
                    userRole: profile.role,
                    userName: profile.nama,
                    loginTime: Date.now(),
                }));
            }
        } catch (e) {
            console.warn('[SIMANDAKES] Gagal ambil user_profiles:', e.message);
        }
        return session;
    }

    async function logoutFromNhost() {
        await window.NhostAPI.logout();
        localStorage.removeItem('simandakes_session');
    }

    window.AuthNhost = {
        isNhostActive: isNhostActive,
        loginWithNhost: loginWithNhost,
        logoutFromNhost: logoutFromNhost,
    };

    console.log('[SIMANDAKES] Auth Nhost module loaded.');
})();
