// =============================================================
// maps.js
// Google Maps & OpenStreetMap integration (standalone)
// =============================================================

// ==================== GOOGLE MAPS POPUP FUNCTION ====================
/**
 * Open Location Map in a beautiful modal popup
 * Uses OpenStreetMap for embedded view (no X-Frame restrictions)
 * + Google Maps link for external opening
 * @param {string} mapsUrl - Google Maps URL or address or coordinates
 * @param {string} locationName - Name of the location to display
 */
function openGoogleMapsPopup(mapsUrl, locationName) {
    // Remove existing modal if any
    const existingModal = document.getElementById('googleMapsModal');
    if (existingModal) existingModal.remove();
    
    // Extract location query from URL or use as-is
    let locationQuery = mapsUrl;
    let googleMapsUrl = mapsUrl;
    
    if (mapsUrl.startsWith('http')) {
        // Extract the actual location from various Google Maps URL formats
        // Format 1: https://maps.google.com/?q=address
        // Format 2: https://www.google.com/maps/place/...
        // Format 3: https://maps.google.com/maps/@lat,lng,zoom
        
        const qMatch = mapsUrl.match(/[?&]q=([^&]+)/);
        const placeMatch = mapsUrl.match(/\/place\/([^/]+)/);
        const coordsMatch = mapsUrl.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
        
        if (qMatch) {
            locationQuery = decodeURIComponent(qMatch[1]);
        } else if (placeMatch) {
            locationQuery = decodeURIComponent(placeMatch[1]);
        } else if (coordsMatch) {
            locationQuery = `${coordsMatch[1]},${coordsMatch[2]}`;
        } else {
            locationQuery = mapsUrl;
        }
        
        // Ensure we have a proper Google Maps URL for external links
        if (!mapsUrl.includes('google.com/maps') && !mapsUrl.includes('maps.google.com')) {
            googleMapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(locationQuery)}`;
        } else {
            googleMapsUrl = mapsUrl;
        }
    } else {
        // It's an address or coordinates string
        locationQuery = mapsUrl;
        googleMapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(mapsUrl)}`;
    }
    
    // Generate OpenStreetMap embed URL (works in iframe!)
    const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${getOSMBounds(locationQuery)}&layer=mapnik&marker=${locationQuery}`;
    
    // Simpler OSM URL that works better
    const osmSimpleUrl = `https://www.openstreetmap.org/embed?bbox=-0.004,-0.002,0.004,0.002&layer=mapnik&q=${encodeURIComponent(locationQuery)}`;
    
    const modal = document.createElement('div');
    modal.id = 'googleMapsModal';
    modal.className = 'modal-overlay';
    modal.style.zIndex = '10001';
    modal.onclick = (e) => { 
        if (e.target === modal) closeGoogleMapsPopup(); 
    };
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width:920px;max-height:88vh;display:flex;flex-direction:column;">
            <!-- Header -->
            <div class="modal-header" style="padding:20px 24px 16px;border-bottom:1px solid #f3f4f6;">
                <div style="display:flex;align-items:center;gap:12px;">
                    <div style="width:48px;height:48px;background:linear-gradient(135deg,#4285f4,#34a853);border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                    </div>
                    <div style="min-width:0;">
                        <h2 class="modal-title" style="font-size:20px;margin:0;">🗺️ Lokasi Praktik</h2>
                        <p class="modal-subtitle" style="margin-top:2px;font-size:13px;">${escapeHtml(locationName || 'Lokasi')}</p>
                    </div>
                </div>
                <button onclick="closeGoogleMapsPopup()" class="modal-close" style="margin-left:16px;flex-shrink:0;">
                    <svg width="18" height="18" fill="none" stroke="#6b7280" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
            </div>
            
            <!-- Map Type Tabs -->
            <div style="display:flex;gap:4px;padding:12px 24px;background:#f9fafb;border-bottom:1px solid #e5e7eb;">
                <button id="mapsTabOsm" onclick="switchMapsTab('osm')" 
                        style="padding:8px 16px;border:none;background:#059669;color:white;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all 0.2s;">
                    <svg width="14" height="14" fill="white" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                    🗺️ Peta Interaktif
                </button>
                <button id="mapsTabGoogle" onclick="switchMapsTab('google')" 
                        style="padding:8px 16px;border:none;background:white;color:#6b7280;border:1px solid #e5e7eb;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all 0.2s;"
                        onmouseover="this.style.borderColor='#4285f4';this.style.color='#4285f4'"
                        onmouseout="this.style.borderColor='#e5e7eb';this.style.color='#6b7280'">
                    <svg width="14" height="14" fill="#4285f4" viewBox="0 0 24 24"><path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/></svg>
                    Google Maps ↗
                </button>
            </div>
            
            <!-- Map Container -->
            <div style="flex:1;padding:0;position:relative;min-height:420px;background:#f3f4f6;overflow:hidden;" id="mapsContainer">
                <!-- OSM Map View (Default - Embedded) -->
                <div id="mapsViewOsm" style="position:absolute;top:0;left:0;width:100%;height:100%;">
                    <!-- Loading spinner -->
                    <div id="mapsLoader" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:12px;z-index:2;">
                        <svg width="40" height="40" fill="none" stroke="#059669" stroke-width="3" viewBox="0 0 24 24" style="animation:spin 1s linear infinite;">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                        </svg>
                        <span style="font-size:14px;color:#6b7280;font-weight:500;">Memuat peta interaktif...</span>
                    </div>
                    
                    <!-- OpenStreetMap iframe (no X-Frame restriction!) -->
                    <iframe 
                        id="osmIframe"
                        src="https://www.openstreetmap.org/embed?v=2&bbox=${getOSMBoundsForLocation(locationQuery)}&layer=mapnik&marker=${encodeURIComponent(locationQuery)}"
                        width="100%" 
                        height="100%" 
                        style="border:1px solid #e5e7eb;position:relative;z-index:1;"
                        frameborder="0" 
                        allowfullscreen
                        loading="lazy"
                        sandbox="allow-scripts allow-same-origin"
                        onload="document.getElementById('mapsLoader')?.style.setProperty('display','none')"
                        onerror="showMapsFallback('${escapeHtml(locationQuery)}')">
                    </iframe>
                </div>
                
                <!-- Google Maps View (External Link Prompt) -->
                <div id="mapsViewGoogle" style="display:none;position:absolute;top:0;left:0;width:100%;height:100%;background:white;padding:40px;text-align:center;">
                    <div style="max-width:400px;margin:0 auto;">
                        <div style="width:80px;height:80px;background:linear-gradient(135deg,#4285f4,#34a853);border-radius:20px;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
                            <svg width="40" height="40" fill="white" viewBox="0 0 24 24">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                            </svg>
                        </div>
                        <h3 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 10px;">Buka di Google Maps</h3>
                        <p style="font-size:14px;color:#6b7280;margin:0 0 8px;">Google Maps tidak dapat ditampilkan di dalam halaman karena kebijakan keamanan.</p>
                        <p style="font-size:14px;color:#6b7280;margin:0 0 20px;">Klik tombol di bawah untuk membuka lokasi di tab/jendela baru.</p>
                        
                        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin-bottom:20px;text-align:left;">
                            <p style="font-size:12px;color:#9ca3af;margin:0 0 4px;">Lokasi:</p>
                            <p style="font-size:14px;color:#374151;font-weight:600;margin:0;word-break:break-all;">${escapeHtml(locationQuery)}</p>
                        </div>
                        
                        <div style="display:flex;flex-direction:column;gap:10px;">
                            <button onclick="window.open('${googleMapsUrl}', '_blank')" 
                                    style="padding:14px 24px;background:linear-gradient(135deg,#4285f4,#34a853);color:white;border:none;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all 0.2s;"
                                    onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 20px rgba(66,133,244,0.35)'"
                                    onmouseout="this.style.transform='';this.style.boxShadow=''">
                                <svg width="18" height="18" fill="white" viewBox="0 0 24 24"><path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/></svg>
                                Buka Google Maps
                            </button>
                            <button onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(locationQuery)}', '_blank')" 
                                    style="padding:12px 24px;background:white;color:#4285f4;border:2px solid #4285f4;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all 0.2s;"
                                    onmouseover="this.style.background='#eff6ff'"
                                    onmouseout="this.style.background='white'">
                                <svg width="16" height="16" fill="#4285f4" viewBox="0 0 24 24"><path d="M21.71 11.29l-9-9c-.39-.39-1.02-.39-1.41 0l-9 9c-.39.39-.39 1.02 0 1.41l9 9c.39.39 1.02.39 1.41 0l9-9c.39-.38.39-1.01 0-1.41zM14 14.5V12h-4v3H8v-4c0-.55.45-1 1-1h5V7.5l3.5 3.5-3.5 3.5z"/></svg>
                                Petunjuk Arah / Navigasi
                            </button>
                        </div>
                        
                        <p style="font-size:12px;color:#9ca3af;margin-top:20px;">
                            💡 Gunakan tab "Peta Interaktif" untuk melihat peta tanpa meninggalkan halaman ini
                        </p>
                    </div>
                </div>
            </div>
            
            <!-- Footer Actions -->
            <div style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;border-radius:0 0 20px 20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:13px;color:#6b7280;">📍</span>
                    <span style="font-size:13px;color:#374151;font-weight:500;">${escapeHtml(locationQuery)}</span>
                </div>
                <div style="display:flex;gap:10px;">
                    <button onclick="copyLocationToClipboard('${escapeHtml(locationQuery)}')" 
                            id="copyLocationBtn"
                            style="padding:10px 16px;background:white;color:#6b7280;border:1px solid #e5e7eb;border-radius:10px;font-size:13px;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all 0.2s;"
                            onmouseover="this.style.background='#f9fafb'"
                            onmouseout="this.style.background='white'">
                        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        Salin Lokasi
                    </button>
                    <button onclick="window.open('${googleMapsUrl}', '_blank')" 
                            style="padding:10px 18px;background:#4285f4;color:white;border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all 0.2s;"
                            onmouseover="this.style.transform='translateY(-1px)';this.style.boxShadow='0 4px 12px rgba(66,133,244,0.3)'"
                            onmouseout="this.style.transform='';this.style.boxShadow=''">
                        <svg width="14" height="14" fill="white" viewBox="0 0 24 24"><path d="M19 19H5V5H19V19ZM19 3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM14 17V15H10V17H14ZM17 13V11H7V13H17ZM17 9V7H7V9H17Z"/></svg>
                        Buka di Google Maps
                    </button>
                </div>
            </div>
        </div>
        
        <style>
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        </style>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Store URLs for tab switching
    modal.dataset.locationQuery = locationQuery;
    modal.dataset.googleMapsUrl = googleMapsUrl;
    
    // ESC key handler
    const escHandler = (e) => { if (e.key === 'Escape') closeGoogleMapsPopup(); };
    document.addEventListener('keydown', escHandler);
}

/**
 * Switch between OSM and Google Maps tabs
 */
function switchMapsTab(tab) {
    const osmView = document.getElementById('mapsViewOsm');
    const googleView = document.getElementById('mapsViewGoogle');
    const osmTab = document.getElementById('mapsTabOsm');
    const googleTab = document.getElementById('mapsTabGoogle');
    
    if (tab === 'osm') {
        osmView.style.display = '';
        googleView.style.display = 'none';
        osmTab.style.background = '#059669';
        osmTab.style.color = 'white';
        osmTab.style.border = 'none';
        googleTab.style.background = 'white';
        googleTab.style.color = '#6b7280';
        googleTab.style.border = '1px solid #e5e7eb';
    } else {
        osmView.style.display = 'none';
        googleView.style.display = '';
        osmTab.style.background = 'white';
        osmTab.style.color = '#6b7280';
        osmTab.style.border = '1px solid #e5e7eb';
        googleTab.style.background = '#4285f4';
        googleTab.style.color = 'white';
        googleTab.style.border = 'none';
    }
}

/**
 * Show fallback when map fails to load
 */
function showMapsFallback(locationQuery) {
    const loader = document.getElementById('mapsLoader');
    const container = document.getElementById('mapsContainer');
    if (loader && container) {
        loader.innerHTML = `
            <div style="text-align:center;padding:20px;">
                <svg width="48" height="48" fill="none" stroke="#f59e0b" stroke-width="2" viewBox="0 0 24 24" style="margin-bottom:12px;">
                    <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                </svg>
                <p style="font-size:14px;color:#9ca3af;margin:0 0 12px;">Tidak dapat memuat peta</p>
                <button onclick="window.open('https://www.openstreetmap.org/search?query=${encodeURIComponent(locationQuery)}', '_blank')" 
                        style="padding:10px 20px;background:#059669;color:white;border:none;border-radius:8px;cursor:pointer;font-size:13px;">
                    Cari di OpenStreetMap ↗
                </button>
            </div>
        `;
    }
}

/**
 * Copy location to clipboard
 */
function copyLocationToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('copyLocationBtn');
        if (btn) {
            btn.innerHTML = '<svg width="14" height="14" fill="none" stroke="#059669" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> Disalin!';
            btn.style.color = '#059669';
            btn.style.borderColor = '#86efac';
            setTimeout(() => {
                btn.innerHTML = '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Salin Lokasi';
                btn.style.color = '#6b7280';
                btn.style.borderColor = '#e5e7eb';
            }, 2000);
        }
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/'/g, '&#39;').replace(/"/g, '&quot;');
}

/**
 * Get approximate bounding box for OSM based on location query
 * Returns default Jakarta bounds if can't parse
 */
function getOSMBoundsForLocation(query) {
    // Try to parse coordinates
    const coordMatch = query.match(/(-?\d+\.?\d*)[, ]+(-?\d+\.?\d*)/);
    if (coordMatch) {
        const lat = parseFloat(coordMatch[1]);
        const lng = parseFloat(coordMatch[2]);
        const delta = 0.02; // ~2km range
        return `${lng-delta},${lat-delta},${lng+delta},${lat+delta}`;
    }
    
    // Default bounds (Jakarta area)
    return '106.75,-6.35,106.95,-6.15';
}

/**
 * Alias for compatibility
 */
function getOSMBounds(query) {
    return getOSMBoundsForLocation(query);
}

/**
 * Close Google Maps popup
 */
function closeGoogleMapsPopup() {
    const modal = document.getElementById('googleMapsModal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
}

/**
 * Get directions to the location (opens Google Maps)
 */
function getDirections(url) {
    let destination = url;
    
    // If it's a full URL, extract the location
    if (url.includes('google.com/maps')) {
        const qMatch = url.match(/[?&]q=([^&]+)/);
        if (qMatch) destination = decodeURIComponent(qMatch[1]);
        else destination = url;
    }
    
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`, '_blank');
}

// ==================== ADMIN DASHBOARD WITH FULL CRUD ====================
