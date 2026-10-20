// === NHOST API CLIENT (baru) ===
// Klien GraphQL/REST untuk backend Nhost.
// Menggantikan panggilan Google Sheets di api-sheets.js (yang akan di-deprecate).
//
// Cara pakai:
//   1. Set window.NHOST_URL di index.html
//   2. Pastikan tabel Postgres sudah di-migrate (lihat backend/migrations/)
//   3. Login via Nhost Auth -> dapat JWT -> simpan di localStorage 'nhost_session'
//
// Dokumentasi Nhost: https://docs.nhost.io

(function() {
    'use strict';

    const NHOST_URL = window.NHOST_URL || localStorage.getItem('nhost_url') || '';
    const GRAPHQL_URL = NHOST_URL ? NHOST_URL + '/v1/graphql' : '';
    const AUTH_URL = NHOST_URL ? NHOST_URL + '/v1/auth' : '';

    if (!NHOST_URL) {
        console.warn('[SIMANDAKES] NHOST_URL belum diset. Backend Nhost tidak aktif. Fallback ke Google Sheets (legacy).');
    }

    function getAuthToken() {
        const session = localStorage.getItem('nhost_session');
        if (!session) return null;
        try {
            const parsed = JSON.parse(session);
            return parsed.accessToken || null;
        } catch (e) {
            return null;
        }
    }

    async function graphql(query, variables) {
        variables = variables || {};
        if (!GRAPHQL_URL) {
            throw new Error('NHOST_URL belum dikonfigurasi');
        }
        const token = getAuthToken();
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }
        const response = await fetch(GRAPHQL_URL, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ query: query, variables: variables }),
        });
        if (!response.ok) {
            throw new Error('GraphQL HTTP ' + response.status + ': ' + response.statusText);
        }
        const json = await response.json();
        if (json.errors && json.errors.length > 0) {
            throw new Error('GraphQL error: ' + json.errors[0].message);
        }
        return json.data;
    }

    // === AUTH ===
    async function login(email, password) {
        if (!AUTH_URL) throw new Error('NHOST_URL belum dikonfigurasi');
        const response = await fetch(AUTH_URL + '/signin/email-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: password }),
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Login gagal');
        }
        const session = await response.json();
        localStorage.setItem('nhost_session', JSON.stringify(session));
        return session;
    }

    async function logout() {
        const token = getAuthToken();
        if (!token || !AUTH_URL) {
            localStorage.removeItem('nhost_session');
            return;
        }
        try {
            await fetch(AUTH_URL + '/signout', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token },
            });
        } finally {
            localStorage.removeItem('nhost_session');
        }
    }

    async function getCurrentUser() {
        const token = getAuthToken();
        if (!token || !AUTH_URL) return null;
        const response = await fetch(AUTH_URL + '/user', {
            headers: { 'Authorization': 'Bearer ' + token },
        });
        if (!response.ok) return null;
        const data = await response.json();
        return data.user || null;
    }

    // === CRUD HELPERS ===
    async function fetchAll(table, where, limit) {
        where = where || {};
        limit = limit || 1000;
        const whereClause = Object.keys(where).length > 0
            ? '(where: ' + JSON.stringify(where).replace(/"([^"]+)":/g, '$1:') + ')'
            : '';
        const fieldMap = {
            nakes: 'id nama jenis spesialisasi str sip alamat_praktik jadwal_praktik no_telepon email status foto_url maps_url institusi_id created_at updated_at',
            institusi: 'id nama tipe dokter_count dokter_gigi_count perawat_count bidan_count apoteker_count lainnya_count created_at updated_at',
            platform_links: 'id title subtitle description icon_key color bg_color url category status sort_order',
            user_profiles: 'id username nama role status last_login',
        };
        const fields = fieldMap[table] || 'id';
        const query = 'query { ' + table + ' ' + whereClause + ' (limit: ' + limit + ', order_by: {updated_at: desc}) { ' + fields + ' } }';
        const data = await graphql(query);
        return data[table] || [];
    }

    async function insert(table, object) {
        const mutation = 'mutation insert_' + table + '($object: ' + table + '_insert_input!) { insert_' + table + '(object: $object) { id } }';
        return graphql(mutation, { object: object });
    }

    async function update(table, id, set) {
        const mutation = 'mutation update_' + table + '($id: uuid!, $set: ' + table + '_set_input!) { update_' + table + '(pk_columns: { id: $id }, _set: $set) { id } }';
        return graphql(mutation, { id: id, set: set });
    }

    async function remove(table, id) {
        const mutation = 'mutation delete_' + table + '($id: uuid!) { delete_' + table + '(id: $id) { id } }';
        return graphql(mutation, { id: id });
    }

    window.NhostAPI = {
        graphql: graphql,
        login: login,
        logout: logout,
        getCurrentUser: getCurrentUser,
        fetchAll: fetchAll,
        insert: insert,
        update: update,
        remove: remove,
        isConfigured: function() { return Boolean(NHOST_URL); },
    };

    console.log('[SIMANDAKES] Nhost API client loaded. Backend:', NHOST_URL || '(not configured)');
})();
