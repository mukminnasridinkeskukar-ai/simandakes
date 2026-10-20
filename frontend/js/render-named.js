// =============================================================
// render-named.js
// Render Named (institusi) + lightbox
// =============================================================

// ==================== Named View - Card Grid with Lightbox ====================
function renderNamed() {
    // Ambil data dari Google Sheets (cache)
    const namedData = getNamedData();
    
    // Jika data belum tersedia, tampilkan pesan loading/empty
    if (namedData.length === 0) {
        return renderEmptyState('Named', '👨‍⚕️', 'Dokter & Dokter Gigi', '#4f46e5', 'sheet "Named"');
    }
    
    const totalDokter = namedData.reduce((sum, i) => sum + i.dokter, 0);
    const totalDokterGigi = namedData.reduce((sum, i) => sum + i.dokterGigi, 0);
    const totalMedis = totalDokter + totalDokterGigi;
    
    return `
        <div style="margin-bottom:24px;">
            <h2 style="font-size:28px;font-weight:700;color:#111827;display:flex;align-items:center;gap:12px;">
                <span style="background:linear-gradient(135deg,#4f46e5,#0891b2);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">👨‍⚕️ Named</span>
            </h2>
            <p style="color:#6b7280;font-size:16px;margin-top:4px;">Data Tenaga Medis (Dokter & Dokter Gigi) Per Institusi Kesehatan</p>
            <p style="font-size:12px;color:#9ca3af;margin-top:4px;">📊 Data dari Google Sheets • ${namedData.length} institusi • Klik kartu untuk detail</p>
        </div>
        
        <!-- Summary Stats Bar -->
        <div class="stats-grid" style="margin-bottom:24px;">
            <div class="stat-card" style="border-left:4px solid #4f46e5;">
                <div class="stat-card-header">
                    <div>
                        <p class="stat-card-label">Total Dokter</p>
                        <p class="stat-card-value" style="color:#4f46e5;">${totalDokter}</p>
                    </div>
                    <div class="stat-card-icon" style="background:#eef2ff;">👨‍⚕️</div>
                </div>
            </div>
            <div class="stat-card" style="border-left:4px solid #0891b2;">
                <div class="stat-card-header">
                    <div>
                        <p class="stat-card-label">Total Dokter Gigi</p>
                        <p class="stat-card-value" style="color:#0891b2;">${totalDokterGigi}</p>
                    </div>
                    <div class="stat-card-icon" style="background:#cffafe;">🦷</div>
                </div>
            </div>
            <div class="stat-card" style="border-left:4px solid #059669;">
                <div class="stat-card-header">
                    <div>
                        <p class="stat-card-label">Total Tenaga Medis</p>
                        <p class="stat-card-value" style="color:#059669;">${totalMedis}</p>
                    </div>
                    <div class="stat-card-icon" style="background:#d1fae5;">🏥</div>
                </div>
            </div>
            <div class="stat-card" style="border-left:4px solid #f59e0b;">
                <div class="stat-card-header">
                    <div>
                        <p class="stat-card-label">Jumlah Institusi</p>
                        <p class="stat-card-value" style="color:#f59e0b;">${namedData.length}</p>
                    </div>
                    <div class="stat-card-icon" style="background:#fef3c7;">📋</div>
                </div>
            </div>
        </div>

        <!-- Card Grid - Each Institution as Card -->
        <div class="institusi-grid">
            ${namedData.map((inst, index) => {
                const total = inst.dokter + inst.dokterGigi;
                const persentase = totalMedis > 0 ? ((total / totalMedis) * 100).toFixed(1) : '0';
                
                // Icon berdasarkan tipe institusi
                const iconMap = { 'RS': '🏥', 'Puskesmas': '🏘️', 'Klinik': '💊', 'BPM': '🤱' };
                const icon = iconMap[inst.tipe] || '🏢';
                
                return `
                    <div class="institusi-card named-card" onclick='openNamedLightbox(${JSON.stringify(inst).replace(/'/g, "&#39;")})' style="--row-accent: #4f46e5; --progress-from: #4f46e5; --progress-to: #0891b2;">
                        <div class="institusi-card-header">
                            <div class="institusi-card-icon">${icon}</div>
                            <span class="institusi-card-badge">${inst.tipe || 'Lainnya'}</span>
                        </div>
                        <h3 class="institusi-card-title">${inst.nama || 'Institusi Tanpa Nama'}</h3>
                        <div class="institusi-card-stats">
                            <div class="institusi-stat-item">
                                <p class="institusi-stat-value" style="color:#4f46e5;">${inst.dokter || 0}</p>
                                <p class="institusi-stat-label">Dokter</p>
                            </div>
                            <div class="institusi-stat-item">
                                <p class="institusi-stat-value" style="color:#0891b2;">${inst.dokterGigi || 0}</p>
                                <p class="institusi-stat-label">Dokter Gigi</p>
                            </div>
                        </div>
                        <div class="institusi-card-total">
                            <span class="institusi-total-label">Total Tenaga Medis</span>
                            <span class="institusi-total-value">${total}</span>
                        </div>
                        <span class="institusi-card-hint">👆 Klik untuk detail</span>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// ==================== Lightbox Functions for Named ====================
function openNamedLightbox(data) {
    const total = (data.dokter || 0) + (data.dokterGigi || 0);
    const allData = getNamedData();
    const totalMedis = allData.reduce((sum, i) => sum + i.dokter + i.dokterGigi, 0);
    const persentase = totalMedis > 0 ? ((total / totalMedis) * 100).toFixed(1) : '0';
    
    // Icon & color berdasarkan tipe
    const iconMap = { 'RS': '🏥', 'Puskesmas': '🏘️', 'Klinik': '💊', 'BPM': '🤱' };
    const icon = iconMap[data.tipe] || '🏢';
    
    const lightboxHTML = `
        <div class="lightbox-overlay" onclick="closeLightbox(event)">
            <div class="lightbox-modal" onclick="event.stopPropagation()">
                <div class="lightbox-header">
                    <button class="lightbox-close" onclick="closeLightbox(event)">
                        <svg width="18" height="18" fill="none" stroke="#6b7280" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                    <div class="lightbox-icon" style="background: linear-gradient(135deg, #eef2ff, #cffafe);">${icon}</div>
                    <h2 class="lightbox-title">${data.nama || 'Institusi Tanpa Nama'}</h2>
                    <p class="lightbox-subtitle">
                        <span class="badge badge-blue">${data.tipe || 'Lainnya'}</span>
                        ${data.updatedAt ? `<span>Update: ${new Date(data.updatedAt).toLocaleDateString('id-ID')}</span>` : ''}
                    </p>
                </div>
                <div class="lightbox-body">
                    <div class="lightbox-data-grid">
                        <div class="lightbox-data-row" style="--row-accent: #4f46e5;">
                            <span class="lightbox-data-label">📛 Institusi</span>
                            <span class="lightbox-data-value" style="font-size:14px;text-align:right;max-width:60%;">${data.nama || '-'}</span>
                        </div>
                        <div class="lightbox-data-row" style="--row-accent: #0891b2;">
                            <span class="lightbox-data-label">🏷️ Tipe</span>
                            <span class="lightbox-data-value"><span class="badge badge-blue">${data.tipe || '-'}</span></span>
                        </div>
                        <div class="lightbox-data-row" style="--row-accent: #4f46e5;">
                            <span class="lightbox-data-label">👨‍⚕️ Dokter</span>
                            <span class="lightbox-data-value highlight" style="color:#4f46e5;">${data.dokter || 0}</span>
                        </div>
                        <div class="lightbox-data-row" style="--row-accent: #0891b2;">
                            <span class="lightbox-data-label">🦷 Dokter Gigi</span>
                            <span class="lightbox-data-value highlight" style="color:#0891b2;">${data.dokterGigi || 0}</span>
                        </div>
                        <div class="lightbox-data-row" style="--row-accent: #059669;">
                            <span class="lightbox-data-label">📊 Total</span>
                            <span class="lightbox-data-value highlight" style="color:#059669;">${total}</span>
                        </div>
                    </div>
                </div>
                <div class="lightbox-footer">
                    <div class="lightbox-progress">
                        <div class="lightbox-progress-bar" style="width: ${persentase}%"></div>
                    </div>
                    <p class="lightbox-percent">${persentase}% dari total tenaga medis (${totalMedis} orang)</p>
                </div>
            </div>
        </div>
    `;
    
    // Insert ke DOM
    const div = document.createElement('div');
    div.id = 'lightbox-container';
    div.innerHTML = lightboxHTML;
    document.body.appendChild(div);
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

function closeLightbox(event) {
    if (event) event.stopPropagation();
    const container = document.getElementById('lightbox-container');
    if (container) {
        container.remove();
        document.body.style.overflow = '';
    }
}

// ==================== Nakes View - Card Grid with Lightbox ====================
