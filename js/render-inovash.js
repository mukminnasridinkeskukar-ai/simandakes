// =============================================================
// render-inovash.js
// Render dashboard Inovash + 12 platform cards + data helpers
// =============================================================

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

// ==================== InovDash View - 12 Platform Links ====================
function renderInovDash() {
    const stats = getStats();
    const activeCount = INOVASH_LINKS.filter(l => l.status === 'active').length;
    const comingSoonCount = INOVASH_LINKS.filter(l => l.status === 'coming_soon').length;
    
    return `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:16px;">
            <div>
                <h2 style="font-size:28px;font-weight:700;color:#111827;display:flex;align-items:center;gap:12px;">
                    <span style="background:linear-gradient(135deg,#059669,#0ea5e9);-webkit-background-clip:text;-webkit-text-fill-color transparent;background-clip:text;">🚀 InovDash</span>
                </h2>
                <p style="color:#6b7280;font-size:16px;margin-top:4px;">Portal Terintegrasi Layanan Kesehatan Indonesia</p>
            </div>
            <div style="display:flex;gap:12px;align-items:center;">
                <span class="badge badge-success">${activeCount} Aktif</span>
                <span class="badge badge-warning">${comingSoonCount} Segera Hadir</span>
                <button class="btn btn-primary btn-sm" onclick="syncWithGoogleSheet()" ${state.syncStatus === 'syncing' ? 'disabled' : ''}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" class="${state.syncStatus === 'syncing' ? 'animate-spin' : ''}"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                    Sync Data
                </button>
            </div>
        </div>

        <!-- Stats Summary Cards -->
        <div class="stats-grid" style="margin-bottom:32px;">
            <div class="stat-card">
                <div class="stat-card-header">
                    <div>
                        <p class="stat-card-label">Total Platform</p>
                        <p class="stat-card-value">12</p>
                    </div>
                    <div class="stat-card-icon" style="background:#f0fdf4;">
                        <svg width="24" height="24" fill="none" stroke="#16a34a" stroke-width="2" viewBox="0 0 24 22"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </div>
                </div>
                <p style="font-size:13px;color:#6b7280;margin-top:8px;">Platform kesehatan terintegrasi</p>
            </div>
            
            <div class="stat-card">
                <div class="stat-card-header">
                    <div>
                        <p class="stat-card-label">Total Nakes</p>
                        <p class="stat-card-value">${stats.total}</p>
                    </div>
                    <div class="stat-card-icon" style="background:#eff6ff;">
                        <svg width="24" height="24" fill="none" stroke="#2563eb" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </div>
                </div>
                <p style="font-size:13px;color:#6b7280;margin-top:8px;">Data tenaga kesehatan</p>
            </div>
            
            <div class="stat-card">
                <div class="stat-card-header">
                    <div>
                        <p class="stat-card-label">Nakes Aktif</p>
                        <p class="stat-card-value">${stats.aktif}</p>
                    </div>
                    <div class="stat-card-icon" style="background:#dcfce7;">
                        <svg width="24" height="24" fill="none" stroke="#16a34a" stroke-width="2" viewBox="0 0 24 22"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </div>
                </div>
                <p style="font-size:13px;color:#6b7280;margin-top:8px;">Status praktik aktif</p>
            </div>
            
            <div class="stat-card">
                <div class="stat-card-header">
                    <div>
                        <p class="stat-card-label">Koneksi Sheet</p>
                        <p class="stat-card-value">${state.sheetConnected ? 'ON' : 'OFF'}</p>
                    </div>
                    <div class="stat-card-icon" style="background:${state.sheetConnected ? '#dcfce7' : '#fef3c7'};">
                        <svg width="24" height="24" fill="none" stroke="${state.sheetConnected ? '#16a34a' : '#ca8a04'}" stroke-width="2" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                    </div>
                </div>
                <p style="font-size:13px;color:${state.sheetConnected ? '#16a34a' : '#ca8a04'};margin-top:8px;">${state.sheetConnected ? 'Terhubung Google Sheets' : 'Belum terhubung'}</p>
            </div>
        </div>

        <!-- Category Filter -->
        <div style="display:flex;gap:8px;margin-bottom:24px;flex-wrap:wrap;" id="categoryFilters">
            <button class="btn btn-sm filter-btn active" onclick="filterCategory('all')" data-category="all">
                Semua (${INOVASH_LINKS.length})
            </button>
            ${[...new Set(INOVASH_LINKS.map(l => l.category))].map(cat => {
                const count = INOVASH_LINKS.filter(l => l.category === cat).length;
                return `<button class="btn btn-sm filter-btn" onclick="filterCategory('${cat}')" data-category="${cat}">${cat} (${count})</button>`;
            }).join('')}
        </div>

        <!-- 12 Platform Cards Grid -->
        <div class="inovash-grid" id="platformGrid">
            ${INOVASH_LINKS.map((link, index) => renderPlatformCard(link, index)).join('')}
        </div>

        <!-- Edit Mode Panel (Hidden by default) -->
        <div id="editPanel" class="hidden" style="margin-top:32px;padding:24px;background:white;border-radius:16px;border:2px dashed #e5e7eb;">
            <h3 style="font-size:18px;font-weight:700;color:#111827;margin-bottom:16px;display:flex;align-items:center;gap:8px;">
                <svg width="20" height="20" fill="none" stroke="#059669" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Editor Konfigurasi Link Platform
            </h3>
            <p style="color:#6b7280;font-size:14px;margin-bottom:20px;">Edit URL untuk setiap platform di bawah ini. Simpan perubahan dengan klik tombol Update.</p>
            
            <div style="display:grid;gap:16px;">
                ${INOVASH_LINKS.map(link => `
                    <div style="display:flex;align-items:center;gap:16px;padding:16px;background:#f9fafb;border-radius:12px;flex-wrap:wrap;">
                        <div style="width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:${link.bgColor};">
                            <svg width="24" height="24" fill="none" stroke="${link.color}" stroke-width="2" viewBox="0 0 24 24">${ICON_SVGS[link.icon] || ICON_SVGS.health}</svg>
                        </div>
                        <div style="flex:1;min-width:200px;">
                            <strong style="color:#111827;">${link.title}</strong>
                            <span style="font-size:12px;color:#6b7280;margin-left:8px;">(${link.category})</span>
                        </div>
                        <div style="flex:2;min-width:250px;">
                            <input type="url" 
                                   id="url_input_${link.id}" 
                                   value="${link.url}" 
                                   placeholder="https://..."
                                   onchange="updateLinkUrl(${link.id}, this.value)"
                                   style="width:100%;padding:10px 14px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;"
                                   title="Masukkan URL lengkap dengan https://">
                        </div>
                        <span class="badge ${link.status === 'active' ? 'badge-success' : link.status === 'coming_soon' ? 'badge-warning' : 'badge-info'}">
                            ${link.status === 'active' ? 'Aktif' : link.status === 'coming_soon' ? 'Segera' : 'Kustom'}
                        </span>
                    </div>
                `).join('')}
            </div>
            
            <div style="margin-top:20px;display:flex;gap:12px;justify-content:flex-end;">
                <button class="btn btn-outline" onclick="resetLinksToDefault()">
                    Reset Default
                </button>
                <button class="btn btn-primary" onclick="saveLinkConfiguration()">
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    Simpan Konfigurasi
                </button>
            </div>
        </div>
    `;
}

// Render individual platform card
function renderPlatformCard(link, index) {
    const hasUrl = link.url && link.url.trim() !== '';
    const statusBadge = {
        'active': '<span class="badge badge-success" style="position:absolute;top:12px;right:12px;">✓ Aktif</span>',
        'coming_soon': '<span class="badge badge-warning" style="position:absolute;top:12px;right:12px;">Segera</span>',
        'custom': '<span class="badge badge-info" style="position:absolute;top:12px;right:12px;">Kustom</span>'
    };
    
    return `
        <div class="platform-card ${!hasUrl ? 'disabled' : ''}" 
             data-category="${link.category}"
             data-id="${link.id}"
             onclick="${hasUrl ? `openPlatform('${link.url}', '${link.title}')` : `showComingSoonAlert('${link.title}')`}"
             style="cursor:${hasUrl ? 'pointer' : 'not-allowed'};animation-delay:${index * 50}ms;">
            
            ${statusBadge[link.status] || ''}
            
            <div class="platform-card-icon" style="background:${link.bgColor};">
                <svg width="32" height="32" fill="none" stroke="${link.color}" stroke-width="2" viewBox="0 0 24 24">
                    ${ICON_SVGS[link.icon] || ICON_SVGS.health}
                </svg>
            </div>
            
            <h3 class="platform-card-title">${link.title}</h3>
            <p class="platform-card-subtitle">${link.subtitle}</p>
            <p class="platform-card-desc">${link.description}</p>
            
            <div class="platform-card-footer">
                <span class="platform-category">${link.category}</span>
                ${hasUrl ? `
                    <button class="platform-open-btn" onclick="event.stopPropagation(); openPlatform('${link.url}', '${link.title}')">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        Buka
                    </button>
                ` : `
                    <span class="platform-no-link">Tidak ada link</span>
                `}
            </div>
            
            ${hasUrl ? `<div class="platform-url-preview">${link.url}</div>` : ''}
        </div>
    `;
}

// Open platform in new window/popup
function openPlatform(url, title) {
    if (!url || url.trim() === '') {
        showNotification('Link belum dikonfigurasi untuk platform ini', 'warning');
        return;
    }
    
    // Check if URL is valid
    try {
        new URL(url);
    } catch (e) {
        showNotification('URL tidak valid: ' + url, 'error');
        return;
    }
    
    // Open in new tab
    window.open(url, '_blank', 'noopener,noreferrer');
    
    showNotification(`Membuka ${title}...`, 'info');
}

// Show alert for coming soon platforms
function showComingSoonAlert(title) {
    showNotification(`${title} - Fitur segera hadir!`, 'warning');
}

// Filter by category
let currentFilter = 'all';
function filterCategory(category) {
    currentFilter = category;
    
    // Update button states
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === category) {
            btn.classList.add('active');
        }
    });
    
    // Filter cards
    document.querySelectorAll('.platform-card').forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

// Toggle edit mode
let editMode = false;
function toggleEditMode() {
    editMode = !editMode;
    const panel = document.getElementById('editPanel');
    const btn = document.getElementById('editModeBtn');
    
    if (panel) {
        panel.classList.toggle('hidden', !editMode);
    }
    
    if (btn) {
        btn.innerHTML = editMode ? 
            '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg> Tutup Editor' :
            '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit Link';
        btn.classList.toggle('btn-primary', editMode);
        btn.classList.toggle('btn-secondary', !editMode);
    }
    
    showNotification(editMode ? 'Mode edit aktif - Anda dapat mengubah URL platform' : 'Mode edit dinonaktifkan', 'info');
}

// Update link URL
function updateLinkUrl(id, newUrl) {
    const linkIndex = INOVASH_LINKS.findIndex(l => l.id === id);
    if (linkIndex !== -1) {
        INOVASH_LINKS[linkIndex].url = newUrl;
        
        // Re-render the grid to update card state
        const grid = document.getElementById('platformGrid');
        if (grid) {
            grid.innerHTML = INOVASH_LINKS.map((link, index) => renderPlatformCard(link, index)).join('');
            
            // Re-apply category filter if active
            if (currentFilter !== 'all') {
                filterCategory(currentFilter);
            }
        }
    }
}

// Save configuration to localStorage
function saveLinkConfiguration() {
    try {
        localStorage.setItem('simandakes_inovash_links', JSON.stringify(INOVASH_LINKS));
        showNotification('Konfigurasi link berhasil disimpan!', 'success');
    } catch (e) {
        showNotification('Gagal menyimpan konfigurasi: ' + e.message, 'error');
    }
}

// Load configuration from localStorage
function loadLinkConfiguration() {
    try {
        const saved = localStorage.getItem('simandash_inovash_links') || localStorage.getItem('simandakes_inovash_links');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length === 12) {
                parsed.forEach(savedLink => {
                    const idx = INOVASH_LINKS.findIndex(l => l.id === savedLink.id);
                    if (idx !== -1) {
                        INOVASH_LINKS[idx].url = savedLink.url || INOVASH_LINKS[idx].url;
                    }
                });
                console.log('Loaded custom link configuration from localStorage');
            }
        }
    } catch (e) {
        console.log('No saved configuration found, using defaults');
    }
}

// Reset links to default values
function resetLinksToDefault() {
    if (confirm('Reset semua link ke nilai default? Perubahan yang belum tersimpan akan hilang.')) {
        location.reload();
    }
}

// ==================== DATA HELPER FUNCTIONS ====================
// Data diambil dari Google Sheets (sheet "Named" dan "Nakes")
// Cache disimpan di: state.cachedNamedData dan state.cachedInstitusiNakesData

/**
 * Get Named data dari cache (Dokter & Dokter Gigi per Institusi)
 * Jika kosong, return array kosong
 */
function getNamedData() {
    return state.cachedNamedData && state.cachedNamedData.length > 0 
        ? state.cachedNamedData 
        : [];
}

/**
 * Get Nakes Institusi data dari cache (Perawat, Bidan, Apoteker per Institusi)
 * Jika kosong, return array kosong
 */
function getInstitusiNakesData() {
    return state.cachedInstitusiNakesData && state.cachedInstitusiNakesData.length > 0 
        ? state.cachedInstitusiNakesData 
        : [];
}

/**
 * Check apakah data Named sudah tersedia
 */
function hasNamedData() {
    return state.cachedNamedData && state.cachedNamedData.length > 0;
}

/**
 * Check apakah data Nakes Institusi sudah tersedia
 */
function hasInstitusiNakesData() {
    return state.cachedInstitusiNakesData && state.cachedInstitusiNakesData.length > 0;
}

// Warna untuk grafik
const CHART_COLORS = {
    dokter: '#4f46e5',
    dokterGigi: '#0891b2',
    perawat: '#ec4899',
    bidan: '#db2777',
    apoteker: '#ca8a04',
    lainnya: '#6b7280'
};

// ==================== Named View - Card Grid with Lightbox ====================
