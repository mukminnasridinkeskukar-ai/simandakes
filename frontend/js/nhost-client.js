// =============================================================
// nhost-client.js
// Lightweight Nhost GraphQL client (tanpa dependency eksternal)
// =============================================================
//
// Fungsi utama:
//   - nhostClient.query(graphqlQuery, variables)      → SELECT
//   - nhostClient.mutate(graphqlMutation, variables)  → INSERT/UPDATE/DELETE
//   - nhostClient.login(username, password)           → Auth
//   - nhostClient.logout()                            → Clear session
//   - nhostClient.isAuthenticated()                   → Cek status login
//   - nhostClient.getAuthToken()                      → Ambil JWT dari localStorage
//
// Token disimpan di localStorage dengan key 'simandakes_nhost_token'
// =============================================================

const NHOST_CLIENT = (function () {
    const TOKEN_KEY = 'simandakes_nhost_token';
    const REFRESH_TOKEN_KEY = 'simandakes_nhost_refresh_token';
    const USER_KEY = 'simandakes_nhost_user';

    function getBackendUrl() {
        return (CONFIG.NHOST && CONFIG.NHOST.BACKEND_URL) || '';
    }

    function getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }

    function getRefreshToken() {
        return localStorage.getItem(REFRESH_TOKEN_KEY);
    }

    function setSession(session) {
        if (session.accessToken) {
            localStorage.setItem(TOKEN_KEY, session.accessToken);
        }
        if (session.refreshToken) {
            localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
        }
        if (session.user) {
            localStorage.setItem(USER_KEY, JSON.stringify(session.user));
        }
    }

    function clearSession() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }

    function getUser() {
        const raw = localStorage.getItem(USER_KEY);
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch (e) {
            console.warn('Failed to parse user JSON:', e);
            return null;
        }
    }

    function isAuthenticated() {
        const token = getToken();
        if (!token) return false;
        // Cek apakah token expired (JWT payload ada di segmen ke-2)
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const now = Math.floor(Date.now() / 1000);
            return payload.exp > now;
        } catch (e) {
            return false;
        }
    }

    function getRole() {
        const user = getUser();
        return user?.role || 'anonymous';
    }

    /**
     * Kirim GraphQL request ke Nhost
     * @param {string} query - GraphQL query/mutation string
     * @param {object} variables - Variabel GraphQL
     * @param {boolean} useAdminSecret - Pakai admin secret (server-side only, HATI-HATI)
     * @returns {Promise<object>} - Response data atau throw error
     */
    async function graphqlRequest(query, variables = {}, useAdminSecret = false) {
        const backendUrl = getBackendUrl();
        if (!backendUrl || backendUrl.includes('YOUR-PROJECT-SUBDOMAIN')) {
            throw new Error('Nhost BACKEND_URL belum dikonfigurasi. Set di config.js atau via localStorage.');
        }

        const headers = {
            'Content-Type': 'application/json',
        };

        // Attach JWT jika ada (untuk query yang butuh auth)
        const token = getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Admin secret (untuk development/testing saja)
        if (useAdminSecret && CONFIG.NHOST && CONFIG.NHOST.ADMIN_SECRET) {
            headers['x-hasura-admin-secret'] = CONFIG.NHOST.ADMIN_SECRET;
        }

        const response = await fetch(`${backendUrl}/v1/graphql`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ query, variables }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();

        if (result.errors && result.errors.length > 0) {
            const errMsg = result.errors.map((e) => e.message).join('; ');
            throw new Error(`GraphQL Error: ${errMsg}`);
        }

        return result.data;
    }

    /**
     * Login via Nhost serverless function /api/login
     * Function tersebut akan verify password & return JWT.
     */
    async function login(username, password) {
        const backendUrl = getBackendUrl();
        if (!backendUrl || backendUrl.includes('YOUR-PROJECT-SUBDOMAIN')) {
            throw new Error('Nhost BACKEND_URL belum dikonfigurasi.');
        }

        const response = await fetch(`${backendUrl}/v1/functions/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Login gagal');
        }

        setSession({
            accessToken: result.token,
            refreshToken: result.refreshToken,
            user: result.user,
        });

        return result.user;
    }

    /**
     * Logout: clear session dari localStorage.
     * (Nhost akan auto-expire token di server setelah refresh window habis.)
     */
    function logout() {
        clearSession();
    }

    return {
        // State
        isAuthenticated,
        getRole,
        getUser,
        getToken,
        getRefreshToken,

        // GraphQL
        query: graphqlRequest,
        mutate: graphqlRequest, // sama aja, GraphQL gak peduli query/mutation

        // Auth
        login,
        logout,

        // Session (untuk debugging)
        setSession,
        clearSession,
    };
})();

// Expose ke global
window.nhostClient = NHOST_CLIENT;
