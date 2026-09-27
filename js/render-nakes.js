// =============================================================
// render-nakes.js
// Render Nakes directory + lightbox + charts + photo helpers
// =============================================================

// ==================== Nakes View - Card Grid with Lightbox ====================
function renderNakes() {
    // Ambil data dari Google Sheets (cache)
    const institusiData = getInstitusiNakesData();
    
    // Jika data belum tersedia, tampilkan pesan loading/empty
    if (institusiData.length === 0) {
        return renderEmptyState('Nakes', '👩‍⚕️', 'Perawat, Bidan, Apoteker, Lainnya', '#ec4899', 'sheet "Nakes"');
    }
    
    const totalPerawat = institusiData.reduce((sum, i) => sum + i.perawat, 0);
    const totalBidan = institusiData.reduce((sum, i) => sum + i.bidan, 0);
    const totalApoteker = institusiData.reduce((sum, i) => sum + i.apoteker, 0);
    const totalLainnya = institusiData.reduce((sum, i) => sum + i.lainnya, 0);
    const totalNakes = totalPerawat + totalBidan + totalApoteker + totalLainnya;

    return `
        <div style="margin-bottom:24px;">
            <h2 style="font-size:28px;font-weight:700;color:#111827;display:flex;align-items:center;gap:12px;">
                <span style="background:linear-gradient(135deg,#ec4899,#db2777);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">👩‍⚕️ Nakes</span>
            </h2>
            <p style="color:#6b7280;font-size:16px;margin-top:4px;">Data Tenaga Kesehatan Non-Dokter Per Institusi Kesehatan</p>
            <p style="font-size:12px;color:#9ca3af;margin-top:4px;">📊 Data dari Google Sheets • ${institusiData.length} institusi • Klik kartu untuk detail</p>
        </div>
        
        <!-- Summary Stats Bar -->
        <div class="stats-grid" style="margin-bottom:24px;">
            <div class="stat-card" style="border-left:4px solid #ec4899;">
                <div class="stat-card-header">
                    <div>
                        <p class="stat-card-label">Total Perawat</p>
                        <p class="stat-card-value" style="color:#ec4899;">${totalPerawat}</p>
                    </div>
                    <div class="stat-card-icon" style="background:#fce7f3;">💉</div>
                </div>
            </div>
            <div class="stat-card" style="border-left:4px solid #db2777;">
                <div class="stat-card-header">
                    <div>
                        <p class="stat-card-label">Total Bidan</p>
                        <p class="stat-card-value" style="color:#db2777;">${totalBidan}</p>
                    </div>
                    <div class="stat-card-icon" style="background:#fce7f3;">🤱</div>
                </div>
            </div>
            <div class="stat-card" style="border-left:4px solid #ca8a04;">
                <div class="stat-card-header">
                    <div>
                        <p class="stat-card-label">Total Apoteker</p>
                        <p class="stat-card-value" style="color:#ca8a04;">${totalApoteker}</p>
                    </div>
                    <div class="stat-card-icon" style="background:#fef9c3;">💊</div>
                </div>
            </div>
            <div class="stat-card" style="border-left:4px solid #6b7280;">
                <div class="stat-card-header">
                    <div>
                        <p class="stat-card-label">Total Nakes</p>
                        <p class="stat-card-value" style="color:#6b7280;">${totalNakes}</p>
                    </div>
                    <div class="stat-card-icon" style="background:#f3f4f6;">🏥</div>
                </div>
            </div>
        </div>

        <!-- Card Grid - Each Institution as Card -->
        <div class="institusi-grid">
            ${institusiData.map((inst, index) => {
                const total = inst.perawat + inst.bidan + inst.apoteker + inst.lainnya;
                
                // Icon berdasarkan tipe institusi
                const iconMap = { 'RS': '🏥', 'Puskesmas': '🏘️', 'Klinik': '💊', 'BPM': '🤱' };
                const icon = iconMap[inst.tipe] || '🏢';
                
                return `
                    <div class="institusi-card nakes-card" onclick='openNakesLightbox(${JSON.stringify(inst).replace(/'/g, "&#39;")})' style="--row-accent: #ec4899; --progress-from: #ec4899; --progress-to: #db2777;">
                        <div class="institusi-card-header">
                            <div class="institusi-card-icon">${icon}</div>
                            <span class="institusi-card-badge">${inst.tipe || 'Lainnya'}</span>
                        </div>
                        <h3 class="institusi-card-title">${inst.nama || 'Institusi Tanpa Nama'}</h3>
                        <div class="institusi-card-stats">
                            <div class="institusi-stat-item">
                                <p class="institusi-stat-value" style="color:#ec4899;">${inst.perawat || 0}</p>
                                <p class="institusi-stat-label">Perawat</p>
                            </div>
                            <div class="institusi-stat-item">
                                <p class="institusi-stat-value" style="color:#db2777;">${inst.bidan || 0}</p>
                                <p class="institusi-stat-label">Bidan</p>
                            </div>
                            <div class="institusi-stat-item">
                                <p class="institusi-stat-value" style="color:#ca8a04;">${inst.apoteker || 0}</p>
                                <p class="institusi-stat-label">Apoteker</p>
                            </div>
                            <div class="institusi-stat-item">
                                <p class="institusi-stat-value" style="color:#6b7280;">${inst.lainnya || 0}</p>
                                <p class="institusi-stat-label">Lainnya</p>
                            </div>
                        </div>
                        <div class="institusi-card-total">
                            <span class="institusi-total-label">Total Nakes</span>
                            <span class="institusi-total-value">${total}</span>
                        </div>
                        <span class="institusi-card-hint">👆 Klik untuk detail</span>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// ==================== Lightbox Functions for Nakes ====================
function openNakesLightbox(data) {
    const total = (data.perawat || 0) + (data.bidan || 0) + (data.apoteker || 0) + (data.lainnya || 0);
    const allData = getInstitusiNakesData();
    const totalAllNakes = allData.reduce((sum, i) => sum + i.perawat + i.bidan + i.apoteker + i.lainnya, 0);
    const persentase = totalAllNakes > 0 ? ((total / totalAllNakes) * 100).toFixed(1) : '0';
    
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
                    <div class="lightbox-icon" style="background: linear-gradient(135deg, #fdf2f8, #fce7f3);">${icon}</div>
                    <h2 class="lightbox-title">${data.nama || 'Institusi Tanpa Nama'}</h2>
                    <p class="lightbox-subtitle">
                        <span class="badge badge-pink">${data.tipe || 'Lainnya'}</span>
                        ${data.updatedAt ? `<span>Update: ${new Date(data.updatedAt).toLocaleDateString('id-ID')}</span>` : ''}
                    </p>
                </div>
                <div class="lightbox-body">
                    <div class="lightbox-data-grid">
                        <div class="lightbox-data-row" style="--row-accent: #ec4899;">
                            <span class="lightbox-data-label">📛 Institusi</span>
                            <span class="lightbox-data-value" style="font-size:14px;text-align:right;max-width:60%;">${data.nama || '-'}</span>
                        </div>
                        <div class="lightbox-data-row" style="--row-accent: #db2777;">
                            <span class="lightbox-data-label">🏷️ Tipe</span>
                            <span class="lightbox-data-value"><span class="badge badge-pink">${data.tipe || '-'}</span></span>
                        </div>
                        <div class="lightbox-data-row" style="--row-accent: #ec4899;">
                            <span class="lightbox-data-label">💉 Perawat</span>
                            <span class="lightbox-data-value highlight" style="color:#ec4899;">${data.perawat || 0}</span>
                        </div>
                        <div class="lightbox-data-row" style="--row-accent: #db2777;">
                            <span class="lightbox-data-label">🤱 Bidan</span>
                            <span class="lightbox-data-value highlight" style="color:#db2777;">${data.bidan || 0}</span>
                        </div>
                        <div class="lightbox-data-row" style="--row-accent: #ca8a04;">
                            <span class="lightbox-data-label">💊 Apoteker</span>
                            <span class="lightbox-data-value highlight" style="color:#ca8a04;">${data.apoteker || 0}</span>
                        </div>
                        <div class="lightbox-data-row" style="--row-accent: #6b7280;">
                            <span class="lightbox-data-label">🏥 Lainnya</span>
                            <span class="lightbox-data-value highlight" style="color:#6b7280;">${data.lainnya || 0}</span>
                        </div>
                        <div class="lightbox-data-row" style="--row-accent: #059669;">
                            <span class="lightbox-data-label">📊 Total Nakes</span>
                            <span class="lightbox-data-value highlight" style="color:#059669;">${total}</span>
                        </div>
                    </div>
                </div>
                <div class="lightbox-footer">
                    <div class="lightbox-progress">
                        <div class="lightbox-progress-bar" style="width: ${persentase}%"></div>
                    </div>
                    <p class="lightbox-percent">${persentase}% dari total tenaga kesehatan (${totalAllNakes} orang)</p>
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

/**
 * Render empty state when data not available
 */
function renderEmptyState(title, emoji, subtitle, color, sheetName) {
    return `
        <div style="min-height:60vh;display:flex;align-items:center;justify-content:center;">
            <div class="card" style="max-width:520px;width:100%;padding:48px;text-align:center;">
                <div style="width:80px;height:80px;background:${color}15;border-radius:20px;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;font-size:36px;">
                    ${emoji}
                </div>
                <h2 style="font-size:24px;font-weight:700;color:#111827;margin-bottom:8px;">Data ${title} Tersedia</h2>
                <p style="color:#6b7280;font-size:15px;margin-bottom:24px;line-height:1.6;">
                    Data dari ${sheetName} belum dimuat atau kosong.<br>
                    Pastikan sheet "${sheetName}" sudah ada di Google Sheets dan berisi data.
                </p>
                <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
                    <button onclick="syncAndRender('${title.toLowerCase()}')" class="btn btn-primary">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                        Sync Ulang Data
                    </button>
                    <button onclick="renderCurrentView()" class="btn btn-secondary">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                        Refresh Halaman
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Sync data dan render ulang
 */
async function syncAndRender(type) {
    showNotification('Menyinkronkan data...', 'info');
    
    if (type === 'named') {
        await syncNamedData();
    } else if (type === 'nakes') {
        await syncInstitusiNakesData();
    } else {
        await Promise.all([syncNamedData(), syncInstitusiNakesData()]);
    }
    
    renderCurrentView();
    showNotification('Data berhasil disinkron!', 'success');
}

// ==================== HELPER FUNCTIONS FOR CHARTS ====================

/**
 * Create SVG donut chart segments
 */
function createDonutChartSVG(data) {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    
    return data.map(item => {
        if (item.value === 0) return '';
        
        const percentage = item.value / total;
        const dashLength = percentage * circumference;
        const gapLength = circumference - dashLength;
        
        const svg = `<circle cx="50" cy="50" r="${radius}" 
                          fill="transparent" 
                          stroke="${item.color}" 
                          stroke-width="20"
                          stroke-dasharray="${dashLength} ${gapLength}"
                          stroke-dashoffset="${-currentAngle * circumference}"
                          style="transition: all 0.5s ease;"
                        />`;
        
        currentAngle += percentage;
        return svg;
    }).join('');
}

/**
 * Export Named data to CSV
 */
function exportNamedData() {
    const namedData = getNamedData();
    
    if (namedData.length === 0) {
        showNotification('Tidak ada data untuk di-export', 'warning');
        return;
    }
    
    let csv = 'Institusi,Tipe,Dokter,Dokter Gigi,Total,Persentase\n';
    const totalDokter = namedData.reduce((sum, i) => sum + i.dokter, 0);
    const totalDG = namedData.reduce((sum, i) => sum + i.dokterGigi, 0);
    const total = totalDokter + totalDG;
    
    namedData.forEach(inst => {
        const subtotal = inst.dokter + inst.dokterGigi;
        csv += `"${inst.nama}",${inst.tipe || ''},${inst.dokter},${inst.dokterGigi},${subtotal},${total > 0 ? ((subtotal/total)*100).toFixed(1) : '0'}%\n`;
    });
    csv += `"TOTAL",,${totalDokter},${totalDG},${total},100%\n`;
    
    downloadCSV(csv, 'named_dokter_data.csv');
}

/**
 * Export Nakes data to CSV
 */
function exportNakesData() {
    const institusiData = getInstitusiNakesData();
    
    if (institusiData.length === 0) {
        showNotification('Tidak ada data untuk di-export', 'warning');
        return;
    }
    
    let csv = 'Institusi,Tipe,Perawat,Bidan,Apoteker,Lainnya,Total\n';
    
    institusiData.forEach(inst => {
        const total = inst.perawat + inst.bidan + inst.apoteker + inst.lainnya;
        csv += `"${inst.nama}",${inst.tipe || ''},${inst.perawat},${inst.bidan},${inst.apoteker},${inst.lainnya},${total}\n`;
    });
    
    const totals = [
        'TOTAL',
        '',
        institusiData.reduce((s,i)=>s+i.perawat,0),
        institusiData.reduce((s,i)=>s+i.bidan,0),
        institusiData.reduce((s,i)=>s+i.apoteker,0),
        institusiData.reduce((s,i)=>s+i.lainnya,0),
        institusiData.reduce((s,i)=>s+i.perawat+i.bidan+i.apoteker+i.lainnya,0)
    ];
    csv += totals.join(',') + '\n';
    
    downloadCSV(csv, 'nakes_institusi_data.csv');
}

/**
 * Download CSV file helper
 */
function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    showNotification(`File "${filename}" berhasil di-download!`, 'success');
}

// ==================== PELAYANAN VIEWS - Card Based with Photo ====================
