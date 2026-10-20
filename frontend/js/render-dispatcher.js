// === RENDER FUNCTIONS ===
// ==================== RENDER FUNCTIONS ====================
function renderCurrentView() {
    const content = document.getElementById('pageContent');
    
    switch(state.dashboardView) {
        case 'inovdash': content.innerHTML = renderInovDash(); break;
        case 'named': content.innerHTML = renderNamed(); break;
        case 'nakes': content.innerHTML = renderNakes(); break;
        case 'cari-dokter': content.innerHTML = renderPelayananCard('dokter', 'Cari Dokter', 'Temukan dokter sesuai kebutuhan kesehatan Anda', '#4f46e5', '#eef2ff', '👨‍⚕️'); break;
        case 'cari-dokter-gigi': content.innerHTML = renderPelayananCard('dokter gigi', 'Cari Dokter Gigi', 'Temukan dokter gigi untuk kesehatan gigi dan mulut Anda', '#0891b2', '#cffafe', '🦷'); break;
        case 'cari-bidan': content.innerHTML = renderPelayananCard('bidan', 'Cari Bidan', 'Temukan bidan terpercaya untuk layanan kebidanan', '#ec4899', '#fce7f3', '🤱'); break;
        case 'cari-perawat': content.innerHTML = renderPelayananCard('perawat', 'Cari Perawat', 'Temukan perawat profesional untuk perawatan terbaik', '#a855f7', '#f3e8ff', '💉'); break;
        case 'cari-apoteker': content.innerHTML = renderPelayananCard('apoteker', 'Cari Apoteker', 'Temukan apoteker untuk konsultasi obat dan farmasi', '#ca8a04', '#fef9c3', '💊'); break;
        case 'cari-praktik': content.innerHTML = renderPelayananCard('all', 'Semua Tenaga Kesehatan', 'Jelajahi semua Nakes yang terdaftar di sistem', '#059669', '#d1fae5', '🏥'); break;
        case 'admin-dashboard': content.innerHTML = renderAdminDashboard(); break;
        default: content.innerHTML = renderInovDash();
    }
    
    // Initialize card animations after render
    initCardAnimations();
}

