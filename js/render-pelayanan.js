// =============================================================
// render-pelayanan.js
// Render kartu pelayanan + profile lightbox + maps popup
// =============================================================

// ==================== PELAYANAN VIEWS - Card Based with Photo ====================

/**
 * Get profesi color configuration
 */
function getProfesiConfig(jenis) {
    const configs = {
        'dokter': { bg: '#eef2ff', color: '#4f46e5', badge: 'badge-blue', icon: '👨‍⚕️', label: 'Dokter' },
        'dokter gigi': { bg: '#cffafe', color: '#0891b2', badge: 'badge-cyan', icon: '🦷', label: 'Dokter Gigi' },
        'bidan': { bg: '#fce7f3', color: '#ec4899', badge: 'badge-pink', icon: '🤱', label: 'Bidan' },
        'perawat': { bg: '#f3e8ff', color: '#a855f7', badge: 'badge-purple', icon: '💉', label: 'Perawat' },
        'apoteker': { bg: '#fef9c3', color: '#ca8a04', badge: 'badge-yellow', icon: '💊', label: 'Apoteker' }
    };
    return configs[jenis?.toLowerCase()] || { bg: '#f3f4f6', color: '#6b7280', badge: 'badge-gray', icon: '🏥', label: jenis || 'Nakes' };
}

/**
 * Convert various Google Drive URL formats to direct image URL
 * Handles: drive.google.com, docs.google.com, file IDs, direct links
 */
function convertToDirectImageUrl(url) {
    if (!url || url.trim() === '') return '';
    
    let cleanUrl = url.trim();
    let fileId = '';
    
    // Pattern 1: Standard Google Drive file URL
    // https://drive.google.com/file/d/FILE_ID/view or /open?id=FILE_ID
    const driveFileMatch = cleanUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveFileMatch) {
        fileId = driveFileMatch[1];
    }
    
    // Pattern 2: Drive open URL with id parameter
    if (!fileId) {
        const driveOpenMatch = cleanUrl.match(/[?&]id=([a-zA-Z0-9_-]{20,})/);
        if (driveOpenMatch) {
            fileId = driveOpenMatch[1];
        }
    }
    
    // Pattern 3: Just a file ID (33+ chars)
    if (!fileId && /^[a-zA-Z0-9_-]{25,}$/.test(cleanUrl)) {
        fileId = cleanUrl;
    }
    
    // Pattern 4: Google Docs/Sheets viewer URL
    if (!fileId) {
        const docsMatch = cleanUrl.match(/docs\.google\.com.*?d\/([a-zA-Z0-9_-]+)/);
        if (docsMatch) {
            fileId = docsMatch[1];
        }
    }
    
    // If we found a file ID, construct direct image URL
    if (fileId) {
        return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
    
    // Pattern 5: Already a direct URL (https://...), return as-is but try to fix common issues
    if (cleanUrl.startsWith('http')) {
        // If it's already a lh3.googleusercontent.com URL, ensure it has proper format
        if (cleanUrl.includes('googleusercontent.com')) {
            return cleanUrl.split('?')[0]; // Remove any query params that might break it
        }
        // For other URLs, add export=view for Google URLs
        if (cleanUrl.includes('google.com') || cleanUrl.includes('googleapis.com')) {
            if (!cleanUrl.includes('export=')) {
                return cleanUrl + (cleanUrl.includes('?') ? '&' : '?') + 'export=view';
            }
        }
        return cleanUrl;
    }
    
    // Could not convert, return original
    return url;
}

/**
 * Generate avatar initials or photo HTML
 * Uses multiple URL conversion strategies for reliable image loading
 */
function renderPhotoOrAvatar(nakes, size = 80) {
    const fotoUrl = nakes.foto ? nakes.foto.trim() : '';
    
    if (fotoUrl !== '') {
        const jenisClass = (nakes.jenis || '').toLowerCase().replace(/\s/g, '-') || 'default';
        const initials = nakes.nama.split(' ').map(x => x[0]).join('').slice(0, 2);
        const fontSize = Math.round(size * 0.28);
        
        // Convert URL to direct image format
        const directUrl = convertToDirectImageUrl(fotoUrl);
        // Generate unique ID for this image element
        const imgId = 'nakes-photo-' + (nakes.id || nakes.nama).toString().replace(/[^a-zA-Z0-9]/g, '-') + '-' + Date.now() + Math.random().toString(36).substr(2, 5);
        
        return `
            <div class="nakes-photo-wrapper" style="width:${size}px;height:${size}px;" id="${imgId}-wrapper">
                <img src="${directUrl}" 
                     alt="Foto ${nakes.nama}" 
                     class="nakes-photo" 
                     loading="lazy"
                     crossorigin="anonymous"
                     data-nama="${nakes.nama}"
                     data-jenis="${jenisClass}"
                     data-size="${size}"
                     data-fontsize="${fontSize}"
                     data-initials="${initials}"
                     data-status="${nakes.status || ''}"
                     data-original-url="${fotoUrl}"
                     data-wrapper-id="${imgId}-wrapper"
                     onload="this.classList.add('loaded');document.getElementById(this.dataset.wrapperId)?.classList.add('has-image');"
                     onerror="handleImageError(this)">
                <div class="nakes-status-indicator ${nakes.status === 'aktif' ? 'status-online' : 'status-offline'}"></div>
            </div>
        `;
    }
    
    const config = getProfesiConfig(nakes.jenis);
    return `
        <div class="nakes-photo-wrapper has-image" style="width:${size}px;height:${size}px;">
            <div class="nakes-avatar" style="width:${size}px;height:${size}px;font-size:${size*0.28}px;background:${config.bg};color:${config.color};">
                ${nakes.nama.split(' ').map(x => x[0]).join('').slice(0,2)}
            </div>
            <div class="nakes-status-indicator ${nakes.status === 'aktif' ? 'status-online' : 'status-offline'}"></div>
        </div>
    `;
}

/**
 * Handle image error - try alternative URLs before falling back to avatar
 * Implements multi-strategy fallback for maximum compatibility
 */
function handleImageError(img) {
    const nama = img.dataset.nama || '';
    const jenis = img.dataset.jenis || 'default';
    const size = img.dataset.size || '80';
    const fontSize = img.dataset.fontsize || '22';
    const initials = img.dataset.initials || '??';
    const status = img.dataset.status || '';
    const originalUrl = img.dataset.originalUrl || img.src || '';
    
    // Track retry count using dataset
    const retryCount = parseInt(img.dataset.retryCount || '0');
    
    // Strategy 1: Try with different URL format based on original URL
    if (retryCount === 0 && originalUrl) {
        let alternativeUrl = null;
        
        // Extract file ID from original URL
        let fileId = null;
        const driveFileMatch = originalUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (driveFileMatch) fileId = driveFileMatch[1];
        
        if (!fileId) {
            const idMatch = originalUrl.match(/[?&]id=([a-zA-Z0-9_-]{20,})/);
            if (idMatch) fileId = idMatch[1];
        }
        
        if (fileId) {
            // Try different URL format on each retry
            if (retryCount === 0) {
                // Try Google Thumbnails API
                alternativeUrl = `https://drive.google.com/thumbnail?authuser=0&sz=w320&id=${fileId}`;
            } else if (retryCount === 1) {
                // Try with export=download
                alternativeUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
            }
        } else if (originalUrl.includes('google')) {
            // For other Google URLs, try adding export=download
            alternativeUrl = originalUrl.split('?')[0] + '?export=download';
        }
        
        if (alternativeUrl && alternativeUrl !== img.src) {
            img.dataset.retryCount = String(retryCount + 1);
            img.src = alternativeUrl;
            return; // Don't replace yet, wait for this attempt
        }
    }
    
    // Strategy 2: All attempts failed - replace with avatar
    const config = getProfesiConfig(jenis.replace('-', ' '));
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = `nakes-avatar nakes-avatar-${jenis} fallback-avatar`;
    avatarDiv.style.cssText = `width:${size}px;height:${size}px;font-size:${fontSize}px;background:${config.bg};color:${config.color};display:flex;align-items:center;justify-content:center;font-weight:700;border-radius:50%;flex-shrink:0;`;
    avatarDiv.textContent = initials;
    
    // Keep the status indicator
    const wrapper = img.parentNode;
    img.remove();
    wrapper.insertBefore(avatarDiv, wrapper.firstChild);
    
    console.log(`📷 Using avatar fallback for: ${nama} (original URL: ${originalUrl.substring(0, 50)}...)`);
}

/**
 * Main Pelayanan View - Card Grid with Clickable Cards & Lightbox Popup
 * Data dari Google Sheets "DataNakes"
 */
function renderPelayananCard(type, title, subtitle, primaryColor, bgColor, emoji) {
    // Filter data berdasarkan type/profesi
    let filtered = state.cachedNakesData;
    
    // Mapping profesi - handle berbagai variasi penulisan
    const profesiMap = {
        'dokter': ['dokter', 'dr.', 'dr', 'doctor'],
        'dokter gigi': ['dokter gigi', 'drg.', 'drg', 'gigi'],
        'bidan': ['bidan', 'bdn'],
        'perawat': ['perawat', 'ns.', 'ns', 'nrs'],
        'apoteker': ['apoteker', 'apt.', 'apt'],
        'all': []
    };
    
    if (type !== 'all' && profesiMap[type]) {
        const keywords = profesiMap[type];
        filtered = filtered.filter(n => {
            const jenis = (n.jenis || '').toLowerCase().trim();
            return keywords.some(kw => jenis.includes(kw));
        });
    }
    
    // Apply search filter
    if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase();
        filtered = filtered.filter(n => 
            n.nama?.toLowerCase().includes(q) ||
            n.spesialisasi?.toLowerCase().includes(q) ||
            n.alamat_praktik?.toLowerCase().includes(q)
        );
    }
    
    // Apply status filter
    if (state.filterJenis && state.filterJenis !== 'semua') {
        if (state.filterJenis === 'aktif') {
            filtered = filtered.filter(n => n.status === 'aktif');
        } else if (state.filterJenis === 'tidak aktif') {
            filtered = filtered.filter(n => n.status !== 'aktif');
        }
    }
    
    const count = filtered.length;
    const aktifCount = filtered.filter(n => n.status === 'aktif').length;
    
    // Hitung statistik per profesi dari SEMUA data (bukan filtered)
    const allData = state.cachedNakesData;
    const stats = {
        dokter: allData.filter(n => ['dokter','dr.','dr'].some(k => (n.jenis||'').toLowerCase().includes(k))).length,
        'dokter gigi': allData.filter(n => ['dokter gigi','drg.','drg'].some(k => (n.jenis||'').toLowerCase().includes(k))).length,
        bidan: allData.filter(n => ['bidan','bdn'].some(k => (n.jenis||'').toLowerCase().includes(k))).length,
        perawat: allData.filter(n => ['perawat','ns.','ns'].some(k => (n.jenis||'').toLowerCase().includes(k))).length,
        apoteker: allData.filter(n => ['apoteker','apt.','apt'].some(k => (n.jenis||'').toLowerCase().includes(k))).length
    };
    
    return `
        <!-- Header Section -->
        <div style="margin-bottom:24px;">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
                <div style="display:flex;align-items:center;gap:16px;">
                    <div style="width:56px;height:56px;background:linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd);border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:28px;box-shadow:0 4px 12px ${primaryColor}33;">
                        ${emoji}
                    </div>
                    <div>
                        <h2 style="font-size:26px;font-weight:700;color:#111827;margin:0;">${title}</h2>
                        <p style="color:#6b7280;font-size:15px;margin:4px 0 0;">${subtitle}</p>
                    </div>
                </div>
                <div style="display:flex;gap:12px;align-items:center;">
                    <div style="padding:10px 20px;background:${bgColor};border-radius:12px;text-align:center;">
                        <p style="font-size:22px;font-weight:700;color:${primaryColor};margin:0;">${count}</p>
                        <p style="font-size:11px;color:#6b7280;margin:2px 0 0;">Total</p>
                    </div>
                    <div style="padding:10px 20px;background:#d1fae5;border-radius:12px;text-align:center;">
                        <p style="font-size:22px;font-weight:700;color:#059669;margin:0;">${aktifCount}</p>
                        <p style="font-size:11px;color:#6b7280;margin:2px 0 0;">Aktif</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Quick Stats Bar (Profesi Summary) -->
        <div class="stats-grid" style="margin-bottom:24px;">
            <div onclick="navigateTo('cari-dokter')" class="stat-card cursor-pointer" style="${type === 'dokter' ? `border-left:4px solid #4f46e5;background:#eef2ff;` : ''}">
                <div class="stat-card-header">
                    <div><p class="stat-card-label">👨‍⚕️ Dokter</p><p class="stat-card-value" style="color:#4f46e5;">${stats.dokter}</p></div>
                </div>
            </div>
            <div onclick="navigateTo('cari-dokter-gigi')" class="stat-card cursor-pointer" style="${type === 'dokter gigi' ? `border-left:4px solid #0891b2;background:#cffafe;` : ''}">
                <div class="stat-card-header">
                    <div><p class="stat-card-label">🦷 Dokter Gigi</p><p class="stat-card-value" style="color:#0891b2;">${stats['dokter gigi']}</p></div>
                </div>
            </div>
            <div onclick="navigateTo('cari-bidan')" class="stat-card cursor-pointer" style="${type === 'bidan' ? `border-left:4px solid #ec4899;background:#fce7f3;` : ''}">
                <div class="stat-card-header">
                    <div><p class="stat-card-label">🤱 Bidan</p><p class="stat-card-value" style="color:#ec4899;">${stats.bidan}</p></div>
                </div>
            </div>
            <div onclick="navigateTo('cari-perawat')" class="stat-card cursor-pointer" style="${type === 'perawat' ? `border-left:4px solid #a855f7;background:#f3e8ff;` : ''}">
                <div class="stat-card-header">
                    <div><p class="stat-card-label">💉 Perawat</p><p class="stat-card-value" style="color:#a855f7;">${stats.perawat}</p></div>
                </div>
            </div>
            <div onclick="navigateTo('cari-apoteker')" class="stat-card cursor-pointer" style="${type === 'apoteker' ? `border-left:4px solid #ca8a04;background:#fef9c3;` : ''}">
                <div class="stat-card-header">
                    <div><p class="stat-card-label">💊 Apoteker</p><p class="stat-card-value" style="color:#ca8a04;">${stats.apoteker}</p></div>
                </div>
            </div>
        </div>

        <!-- Search & Filter Section -->
        <div class="card" style="margin-bottom:24px;border:none;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
            <div class="card-body" style="padding:20px 24px;">
                <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center;">
                    <div style="flex:1;min-width:280px;position:relative;">
                        <svg style="position:absolute;left:14px;top:50%;transform:translateY(-50%);pointer-events:none;" width="20" height="20" fill="none" stroke="#9ca3af" stroke-width="2" viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8"/>
                            <path d="M21 21l-4.35-4.35"/>
                        </svg>
                        <input type="text" 
                               class="input input-with-icon" 
                               placeholder="🔍 Cari nama, spesialisasi, atau alamat..." 
                               value="${state.searchQuery}" 
                               onkeyup="state.searchQuery=this.value;renderCurrentView();" 
                               id="searchPelayananInput"
                               style="padding-left:44px;height:46px;border-radius:12px;font-size:15px;">
                    </div>
                    <select class="input" onchange="state.filterJenis=this.value;renderCurrentView();" style="height:46px;border-radius:12px;min-width:180px;font-size:14px;" id="filterJenisSelect">
                        <option value="semua" ${state.filterJenis === 'semua' ? 'selected' : ''}>Semua Status</option>
                        <option value="aktif" ${state.filterJenis === 'aktif' ? 'selected' : ''}>✅ Aktif</option>
                        <option value="tidak aktif" ${state.filterJenis === 'tidak aktif' ? 'selected' : ''}>⏸️ Tidak Aktif</option>
                    </select>
                    <button onclick="state.searchQuery='';document.getElementById('searchPelayananInput').value='';renderCurrentView();" 
                            class="btn btn-secondary" style="height:46px;border-radius:12px;padding:0 20px;" title="Reset pencarian">
                        🔄 Reset
                    </button>
                    <button onclick="syncAllData()" class="btn btn-primary" style="height:46px;border-radius:12px;padding:0 20px;" title="Sync data terbaru">
                        ⬇️ Sync
                    </button>
                </div>
            </div>
        </div>

        <!-- Results Info -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;padding:0 4px;">
            <p style="font-size:14px;color:#6b7280;margin:0;">
                Menampilkan <strong style="color:${primaryColor};">${count}</strong> data ${type === 'all' ? 'Nakes' : type}
                ${aktifCount > 0 ? `<span style="color:#059669;">• ${aktifCount} aktif</span>` : ''}
                ${count > 0 && count < 100 ? `<span style="color:#9ca3af;">• Klik kartu untuk detail</span>` : ''}
            </p>
        </div>

        <!-- NAKES CARDS GRID - Each card is clickable for popup! -->
        <div class="nakes-cards-grid" id="nakesCardsGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:20px;">
            ${count > 0 ? filtered.map((n, index) => {
                const config = getProfesiConfig(n.jenis);
                // Escape data for safe JSON string in onclick
                const safeNakes = JSON.stringify(n).replace(/"/g, '&quot;');
                
                return `
                    <!-- NAKES CARD - CLICKABLE FOR POPUP -->
                    <div class="nakes-profile-card" 
                         onclick='openNakesProfileLightbox(${safeNakes})'
                         style="--accent-color: ${config.color}; --accent-bg: ${config.bg}; animation-delay:${index * 0.06}s;"
                         title="Klik untuk lihat detail ${config.label}">
                        
                        <!-- Card Top: Photo/Avatar + Badges -->
                        <div class="npc-header">
                            <div class="npc-photo-container">
                                ${renderPhotoOrAvatar(n, 80)}
                            </div>
                            <div class="npc-badges">
                                <span class="badge ${config.badge}" style="font-size:10px;padding:3px 8px;">${config.icon} ${config.label}</span>
                                <span class="badge ${n.status === 'aktif' ? 'badge-success' : 'badge-gray'}" style="font-size:10px;padding:3px 8px;">
                                    ${n.status === 'aktif' ? '● Aktif' : '○ Non-aktif'}
                                </span>
                            </div>
                        </div>
                        
                        <!-- Card Body: Name & Info -->
                        <div class="npc-body">
                            <h3 class="npc-name" style="color:#111827;">${n.nama || 'Tanpa Nama'}</h3>
                            <p class="npc-spesialisasi" style="color:${config.color};">${n.spesialisasi || '-'}</p>
                            
                            <div class="npc-info-list">
                                <div class="npc-info-row">
                                    <svg width="14" height="14" fill="none" stroke="#9ca3af" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                    <span>${(n.alamat_praktik || '-').substring(0, 40)}${(n.alamat_praktik||'').length > 40 ? '...' : ''}</span>
                                </div>
                                <div class="npc-info-row">
                                    <svg width="14" height="14" fill="none" stroke="#9ca3af" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                    <span>${n.jadwal_praktik || '-'}</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Card Footer: Hint -->
                        <div class="npc-footer">
                            <span class="npc-hint">👆 Klik untuk detail lengkap</span>
                        </div>
                    </div>
                `;
            }).join('') : `
                <!-- EMPTY STATE -->
                <div style="grid-column:1/-1;min-height:400px;display:flex;align-items:center;justify-content:center;">
                    <div class="card" style="max-width:480px;width:100%;padding:40px;text-align:center;">
                        <div style="width:80px;height:80px;background:${bgColor};border-radius:20px;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:36px;">
                            ${emoji}
                        </div>
                        <h3 style="font-size:20px;font-weight:600;color:#111827;margin-bottom:8px;">Data Tidak Ditemukan</h3>
                        <p style="color:#6b7280;font-size:14px;margin-bottom:20px;line-height:1.6;">
                            Tidak ada data <strong>${type === 'all' ? 'tenaga kesehatan' : type}</strong> yang sesuai.
                            <br>Pastikan sheet "DataNakes" di Google Sheets sudah berisi data.
                        </p>
                        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
                            <button onclick="state.searchQuery='';renderCurrentView();" class="btn btn-outline">
                                🔄 Reset Pencarian
                            </button>
                            <button onclick="syncAllData();renderCurrentView();" class="btn btn-primary">
                                ⬇️ Sync Ulang Data
                            </button>
                        </div>
                    </div>
                </div>
            `}
        </div>

        <!-- CSS for Nakes Profile Cards (inline to ensure it works) -->
        <style>
            .nakes-profile-card {
                background:white;border-radius:16px;
                box-shadow:0 2px 8px rgba(0,0,0,0.08),0 0 0 1px rgba(0,0,0,0.04);
                overflow:hidden;cursor:pointer;
                transition:all 0.25s ease;
                border:2px solid transparent;
            }
            .nakes-profile-card:hover {
                transform:translateY(-4px);
                box-shadow:0 12px 28px rgba(0,0,0,0.12),0 0 0 1px var(--accent-color);
                border-color:var(--accent-color);
            }
            .npc-header {
                background:linear-gradient(135deg, var(--accent-bg), white);
                padding:20px 20px 12px;
                display:flex;align-items:center;gap:14px;
            }
            .npc-photo-container { flex-shrink:0; }
            .npc-badges { display:flex;flex-direction:column;gap:4px;flex:1; }
            .npc-body { padding:16px 20px; }
            .npc-name {
                font-size:17px;font-weight:600;color:#111827;
                margin:0 0 4px;line-height:1.3;
                overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
            }
            .npc-spesialisasi {
                font-size:13px;font-weight:500;margin:0 0 12px;
                overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
            }
            .npc-info-list { display:flex;flex-direction:column;gap:8px; }
            .npc-info-row {
                display:flex;align-items:flex-start;gap:8px;
                font-size:12px;color:#6b7280;line-height:1.4;
            }
            .npc-info-row svg { flex-shrink:0;margin-top:1px;opacity:0.6; }
            .npc-info-row span { overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
            .npc-footer {
                padding:12px 20px;
                background:#f9fafb;border-top:1px solid #f3f4f6;
                text-align:center;
            }
            .npc-hint { font-size:11px;color:#9ca3af; }
            .cursor-pointer { cursor:pointer; transition:all 0.2s; }
            .cursor-pointer:hover { opacity:0.85; }
            
            /* Lightbox styles for Nakes profile */
            .nakes-lightbox-overlay {
                position:fixed;top:0;left:0;right:0;bottom:0;
                background:rgba(0,0,0,0.6);
                backdrop-filter:blur(4px);
                z-index:10000;
                display:flex;align-items:center;justify-content:center;
                padding:20px;
                animation:fadeIn 0.2s ease;
            }
            .nakes-lightbox-modal {
                background:white;border-radius:20px;
                width:100%;max-width:560px;max-height:90vh;
                overflow-y:auto;
                box-shadow:0 25px 50px rgba(0,0,0,0.25);
                animation:slideUp 0.3s ease;
            }
            @keyframes fadeIn { from{opacity:0;} to{opacity:1;} }
            @keyframes slideUp { from{transform:translateY(30px);opacity:0;} to{transform:translateY(0);opacity:1;} }
        </style>
    `;
}

// ==================== NAKES PROFILE LIGHTBOX (POPUP DETAIL) ====================
/**
 * Open detailed popup for a single Nakes profile
 * Shows ALL data from Google Sheets DataNakes
 */
function openNakesProfileLightbox(nakes) {
    const config = getProfesiConfig(nakes.jenis);
    
    const lightboxHTML = `
        <div class="nakes-lightbox-overlay" onclick="closeNakesProfileLightbox(event)">
            <div class="nakes-lightbox-modal" onclick="event.stopPropagation()">
                <!-- Header with Photo -->
                <div style="background:linear-gradient(135deg, ${config.bg}, #fff);padding:32px;text-align:center;position:relative;">
                    <button onclick="closeNakesProfileLightbox(event)" 
                            style="position:absolute;top:12px;right:12px;width:36px;height:36px;
                                   border-radius:50%;background:white;border:none;cursor:pointer;
                                   display:flex;align-items:center;justify-content:center;
                                   box-shadow:0 2px 8px rgba(0,0,0,0.15);transition:all 0.2s;"
                            onmouseover="this.style.background='#f3f4f6'"
                            onmouseout="this.style.background='white'">
                        <svg width="18" height="18" fill="none" stroke="#6b7280" stroke-width="2" viewBox="0 0 24 24">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                    
                    ${renderPhotoOrAvatar(nakes, 110)}
                    
                    <h2 style="font-size:24px;font-weight:700;color:#111827;margin-top:16px;margin-bottom:4px;">
                        ${nakes.nama || 'Tanpa Nama'}
                    </h2>
                    <p style="color:${config.color};font-weight:500;font-size:16px;margin:0;">
                        ${config.icon} ${nakes.spesialisasi || config.label}
                    </p>
                    
                    <div style="display:flex;gap:8px;justify-content:center;margin-top:14px;flex-wrap:wrap;">
                        <span class="badge ${config.badge}" style="font-size:12px;padding:6px 14px;">
                            ${config.icon} ${config.label}
                        </span>
                        <span class="badge ${nakes.status === 'aktif' ? 'badge-success' : 'badge-gray'}" style="font-size:12px;padding:6px 14px;">
                            ${nakes.status === 'aktif' ? '● Praktik Aktif' : '○ Tidak Aktif'}
                        </span>
                    </div>
                </div>
                
                <!-- Body: Detailed Information Grid -->
                <div style="padding:24px;">
                    <h3 style="font-size:15px;font-weight:600;color:#374151;margin:0 0 16px;
                              display:flex;align-items:center;gap:8px;">
                        <svg width="18" height="18" fill="none" stroke="${config.color}" stroke-width="2" viewBox="0 0 24 24">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                        </svg>
                        Informasi Lengkap
                    </h3>
                    
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
                        <!-- Row 1: Jenis & Spesialisasi -->
                        <div class="lightbox-data-row" style="--row-accent: ${config.color};">
                            <span class="lightbox-data-label">📋 Jenis Profesi</span>
                            <span class="lightbox-data-value highlight" style="color:${config.color};">${config.icon} ${config.label}</span>
                        </div>
                        <div class="lightbox-data-row" style="--row-accent: ${config.color};">
                            <span class="lightbox-data-label">🎯 Spesialisasi</span>
                            <span class="lightbox-data-value">${nakes.spesialisasi || '-'}</span>
                        </div>
                        
                        <!-- Row 2: STR & SIP -->
                        <div class="lightbox-data-row" style="--row-accent: #2563eb;">
                            <span class="lightbox-data-label">📜 No. STR</span>
                            <span class="lightbox-data-value">${nakes.str || '-'}</span>
                        </div>
                        <div class="lightbox-data-row" style="--row-accent: #059669;">
                            <span class="lightbox-data-label">✅ No. SIP</span>
                            <span class="lightbox-data-value">${nakes.sip || '-'}</span>
                        </div>
                        
                        <!-- Row 3: Alamat (full width) with Google Maps button -->
                        <div class="lightbox-data-row" style="grid-column:1/-1;--row-accent: #dc2626;">
                            <span class="lightbox-data-label">📍 Alamat Praktik</span>
                            <span class="lightbox-data-value" style="text-align:left;word-break:break-word;display:flex;flex-direction:column;gap:8px;">
                                <span>${nakes.alamat_praktik || '-'}</span>
                                ${nakes.alamat_google_maps ? `
                                <button onclick='openGoogleMapsPopup("${nakes.alamat_google_maps.replace(/"/g, '\\"')}", "${(nakes.nama || 'Lokasi').replace(/"/g, '\\"')}")' 
                                        style="display:inline-flex;align-items:center;gap:6px;padding:8px 16px;background:linear-gradient(135deg,#4285f4,#34a853);color:white;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s;width:fit-content;"
                                        onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px rgba(66,133,244,0.4)'"
                                        onmouseout="this.style.transform='';this.style.boxShadow=''">
                                    <svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                                    🗺️ Lihat di Google Maps
                                </button>
                                ` : ''}
                            </span>
                        </div>
                        
                        <!-- Row 4: Jadwal (full width) -->
                        <div class="lightbox-data-row" style="grid-column:1/-1;--row-accent: #f59e0b;">
                            <span class="lightbox-data-label">📅 Jadwal Praktik</span>
                            <span class="lightbox-data-value" style="text-align:left;white-space:pre-wrap;">${nakes.jadwal_praktik || '-'}</span>
                        </div>
                        
                        <!-- Row 5: Status -->
                        <div class="lightbox-data-row" style="--row-accent: #6b7280;">
                            <span class="lightbox-data-label">📊 Status</span>
                            <span class="lightbox-data-value">
                                <span class="badge ${nakes.status === 'aktif' ? 'badge-success' : 'badge-gray'}" style="font-size:12px;">
                                    ${nakes.status === 'aktif' ? '● Aktif Berpraktik' : '○ Tidak Aktif'}
                                </span>
                            </span>
                        </div>
                    </div>
                    
                </div>
                
                <!-- Footer with close hint -->
                <div style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;
                            text-align:center;border-radius:0 0 20px 20px;">
                    <p style="font-size:12px;color:#9ca3af;margin:0;">Klik luar area ini untuk menutup</p>
                </div>
            </div>
        </div>
    `;
    
    // Create and append lightbox
    const div = document.createElement('div');
    div.id = 'nakesProfileLightbox';
    div.innerHTML = lightboxHTML;
    document.body.appendChild(div);
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    // Add keyboard listener
    document.addEventListener('keydown', handleNakesLightboxKeydown);
}

/**
 * Close Nakes profile lightbox
 */
function closeNakesProfileLightbox(event) {
    if (event && event.target.classList.contains('nakes-lightbox-modal')) return;
    
    const container = document.getElementById('nakesProfileLightbox');
    if (container) {
        container.remove();
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleNakesLightboxKeydown);
    }
}

/**
 * Handle ESC key to close lightbox
 */
function handleNakesLightboxKeydown(e) {
    if (e.key === 'Escape') {
        closeNakesProfileLightbox(e);
    }
}

/**
 * Show Nakes Detail Modal (legacy - kept for compatibility)
 */
function showNakesDetail(id) {
    const nakes = state.cachedNakesData.find(n => n.id == id);
    if (!nakes) return;
    openNakesProfileLightbox(nakes);
}

/**
 * Close Nakes Detail Modal (legacy - kept for compatibility)
 */
function closeNakesDetail(event) {
    if (event && event.target !== event.currentTarget) return;
    closeNakesProfileLightbox(event);
}

/**
 * Toggle View Mode (Grid/List)
 */
let currentViewMode = 'grid';
function toggleViewMode(mode) {
    currentViewMode = mode;
    const grid = document.getElementById('pelayananGrid');
    const gridBtn = document.getElementById('gridViewBtn');
    const listBtn = document.getElementById('listViewBtn');
    
    if (!grid) return;
    
    if (mode === 'list') {
        grid.style.gridTemplateColumns = '1fr';
        listBtn.classList.add('active');
        gridBtn.classList.remove('active');
    } else {
        grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(340px, 1fr))';
        gridBtn.classList.add('active');
        listBtn.classList.remove('active');
    }
}

/**
 * Initialize Card Animations
 */
function initCardAnimations() {
    const cards = document.querySelectorAll('.nakes-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'all 0.4s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 50);
    });
}

// ==================== GOOGLE MAPS POPUP FUNCTION ====================
