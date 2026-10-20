// =============================================================
// config.js
// Konfigurasi aplikasi & constants
// =============================================================

// ==================== PILIH BACKEND ====================
// 'nhost' → Pakai Nhost (Postgres + Hasura GraphQL + Auth) — REKOMENDASI PRODUCTION
// 'gas'   → Pakai Google Apps Script + Google Sheets (legacy/fallback)
// 'csv'   → Pakai Google Sheets CSV export (read-only, tidak perlu Apps Script)
const BACKEND_MODE = localStorage.getItem('simandakes_backend_mode') || 'nhost';

// ==================== KONFIGURASI NHOST ====================
const NHOST_CONFIG = {
    // Format: https://xxxxxxxxxxxxx.nhost.run
    BACKEND_URL: localStorage.getItem('simandakes_nhost_url') || 'https://YOUR-PROJECT-SUBDOMAIN.nhost.run',

    // Admin secret (untuk development/testing — JANGAN di-commit ke repo publik di production)
    ADMIN_SECRET: '',

    // Default role untuk query anonymous (publik)
    ANONYMOUS_ROLE: 'anonymous',
};

// ==================== KONFIGURASI GOOGLE APPS SCRIPT (LEGACY) ====================
// Dipakai hanya jika BACKEND_MODE === 'gas' atau 'csv'
const GAS_CONFIG = {
    // URL Web App Google Apps Script
    GOOGLE_APPS_SCRIPT_URL: localStorage.getItem('simandakes_gas_url') || 'https://script.google.com/macros/s/AKfycbw1tbKhsFtvjx8wRj4g1xpoMU17DDB6-0J8NKUxx5Q1G7cisQM3vBA2X1PWAS8YLqlbCg/exec',

    // ID Spreadsheet Google Sheets (untuk akses langsung via CSV)
    SPREADSHEET_ID: '1NLAY2J9Is3n_gv13fK5EtZ38Nm98byIaB6bgg1EAN-0',
};

// ==================== PENGATURAN APLIKASI ====================
const APP_CONFIG = {
    APP_NAME: 'SIMANDAKES',
    VERSION: '2.0.0-modular',

    // Timeout untuk API calls (ms)
    API_TIMEOUT: 30000,

    // Auto refresh interval (ms) - set 0 untuk disable
    AUTO_REFRESH_INTERVAL: 0,

    // LocalStorage keys
    STORAGE_KEYS: {
        NAKE_DATA: 'simandakes_nakes_data',
        NAMED_DATA: 'simandakes_named_data',
        INSTITUSI_NAKES_DATA: 'simandakes_institusi_nakes_data',
        INOVASH_LINKS: 'simandakes_inovash_links',
        SESSION: 'simandakes_session',
        BACKEND_MODE: 'simandakes_backend_mode',
        NHOST_URL: 'simandakes_nhost_url',
        GAS_URL: 'simandakes_gas_url',
    },
};

// ==================== COMPILE FINAL CONFIG ====================
// Export satu objek CONFIG supaya API tetap compatible dengan kode lama
const CONFIG = {
    ...APP_CONFIG,
    BACKEND_MODE,
    NHOST: NHOST_CONFIG,
    GOOGLE_APPS_SCRIPT_URL: GAS_CONFIG.GOOGLE_APPS_SCRIPT_URL,
    SPREADSHEET_ID: GAS_CONFIG.SPREADSHEET_ID,
};

// Freeze supaya tidak sengaja diubah
Object.freeze(CONFIG);
Object.freeze(CONFIG.NHOST);
Object.freeze(CONFIG.STORAGE_KEYS);

// =============================================================
// INFO: Cara ganti backend mode dari console browser:
//   localStorage.setItem('simandakes_backend_mode', 'nhost');
//   localStorage.setItem('simandakes_nhost_url', 'https://project-anda.nhost.run');
//   location.reload();
//
// Untuk kembali ke Google Sheets:
//   localStorage.setItem('simandakes_backend_mode', 'csv');
//   location.reload();
// =============================================================
