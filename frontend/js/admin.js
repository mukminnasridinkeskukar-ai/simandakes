// =============================================================
// admin.js
// Admin tables + CRUD modals (DataNakes, Named, InstitusiNakes, Users)
// =============================================================

// ==================== DATA NAKES TABLE (CRUD) ====================
function renderDataNakesTable() {
    let data = state.cachedNakesData || [];
    
    // Apply search filter
    if (adminSearchQuery) {
        const q = adminSearchQuery.toLowerCase();
        data = data.filter(n => 
            n.nama?.toLowerCase().includes(q) ||
            n.jenis?.toLowerCase().includes(q) ||
            n.spesialisasi?.toLowerCase().includes(q) ||
            n.alamat_praktik?.toLowerCase().includes(q) ||
            n.alamat_google_maps?.toLowerCase().includes(q)
        );
    }
    
    // Pagination
    const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
    const startIndex = (adminCurrentPage - 1) * ITEMS_PER_PAGE;
    const paginatedData = data.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    
    if (paginatedData.length === 0) {
        return `
            <div class="admin-table-container">
                <div class="admin-toolbar">
                    <div class="admin-search">
                        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                        <input type="text" placeholder="Cari nama, jenis, spesialisasi..." oninput="adminSearchTable(this.value, 'datanakes')" value="${adminSearchQuery}">
                    </div>
                    <div class="admin-actions">
                        <button onclick="showAddNakesModal()" class="btn btn-primary btn-sm">
                            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                            Tambah Nakes
                        </button>
                    </div>
                </div>
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <h3>Tidak Ada Data Nakes</h3>
                    <p>${adminSearchQuery ? 'Tidak ada hasil pencarian untuk "' + adminSearchQuery + '"' : 'Belum ada data tenaga kesehatan. Klik tombol di atas untuk menambahkan data baru.'}</p>
                </div>
            </div>
        `;
    }
    
    return `
        <div class="admin-table-container">
            <div class="admin-toolbar">
                <div class="admin-search">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                    <input type="text" placeholder="Cari nama, jenis, spesialisasi..." oninput="adminSearchTable(this.value, 'datanakes')" value="${adminSearchQuery}">
                </div>
                <div class="admin-actions">
                    <button onclick="showAddNakesModal()" class="btn btn-primary btn-sm">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                        Tambah Nakes
                    </button>
                </div>
            </div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>No</th>
                        <th>Nama</th>
                        <th>Jenis</th>
                        <th>Spesialisasi</th>
                        <th>Alamat Praktik</th>
                        <th style="width:80px;">🗺️ Maps</th>
                        <th>Status</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    ${paginatedData.map((n, i) => `
                        <tr>
                            <td style="font-weight:600;color:#6b7280;">${startIndex + i + 1}</td>
                            <td>
                                <div style="display:flex;align-items:center;gap:10px;">
                                    <div style="width:36px;height:36px;border-radius:50%;background:${getProfesiConfig(n.jenis)?.bg || '#f3f4f6'};display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;">
                                        ${getProfesiConfig(n.jenis)?.icon || '👤'}
                                    </div>
                                    <span style="font-weight:600;">${n.nama || '-'}</span>
                                </div>
                            </td>
                            <td><span class="badge ${n.jenis === 'dokter' ? 'badge-blue' : n.jenis === 'bidan' ? 'badge-pink' : n.jenis === 'perawat' ? 'badge-purple' : 'badge-gray'}">${n.jenis?.charAt(0).toUpperCase() + n.jenis?.slice(1) || '-'}</span></td>
                            <td>${n.spesialisasi || '-'}</td>
                            <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${n.alamat_praktik || ''}">${n.alamat_praktik?.substring(0, 25) || '-'}${n.alamat_praktik?.length > 25 ? '...' : ''}</td>
                            <td style="text-align:center;">
                                ${n.alamat_google_maps ? `
                                <button onclick='openGoogleMapsPopup("${(n.alamat_google_maps || '').replace(/'/g, "\\'").replace(/"/g, '&quot;')}", "${(n.nama || 'Lokasi').replace(/'/g, "\\'").replace(/"/g, '&quot;')}")' 
                                        title="Lihat di Google Maps"
                                        style="padding:6px 10px;background:linear-gradient(135deg,#4285f4,#34a853);color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;display:inline-flex;align-items:center;gap:4px;transition:all 0.2s;"
                                        onmouseover="this.style.transform='scale(1.05)'"
                                        onmouseout="this.style.transform=''">
                                    <svg width="12" height="12" fill="white" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                                    Maps
                                </button>
                                ` : '<span style="color:#d1d5db;font-size:11px;">-</span>'}
                            </td>
                            <td><span class="badge-status ${n.status === 'aktif' ? 'badge-aktif' : 'badge-nonaktif'}">${n.status === 'aktif' ? '✓ Aktif' : '✗ Non-aktif'}</span></td>
                            <td>
                                <div class="action-btns">
                                    <button onclick='showEditNakesModal(${JSON.stringify(n).replace(/'/g, "&#39;")})' class="action-btn edit">
                                        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                        Edit
                                    </button>
                                    <button onclick='confirmDeleteNakes(${JSON.stringify(n).replace(/'/g, "&#39;")})' class="action-btn delete">
                                        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                        Hapus
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            ${totalPages > 1 ? `
                <div class="pagination">
                    <button onclick="adminGoToPage(${adminCurrentPage - 1})" ${adminCurrentPage <= 1 ? 'disabled' : ''}>← Prev</button>
                    <span>Halaman ${adminCurrentPage} dari ${totalPages} (${data.length} data)</span>
                    <button onclick="adminGoToPage(${adminCurrentPage + 1})" ${adminCurrentPage >= totalPages ? 'disabled' : ''}>Next →</button>
                </div>
            ` : ''}
        </div>
    `;
}

// ==================== NAMED INSTITUSI TABLE (CRUD) ====================
function renderNamedTable() {
    let data = state.cachedNamedData || [];
    
    if (adminSearchQuery) {
        const q = adminSearchQuery.toLowerCase();
        data = data.filter(i => i.nama?.toLowerCase().includes(q) || i.tipe?.toLowerCase().includes(q));
    }
    
    const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
    const startIndex = (adminCurrentPage - 1) * ITEMS_PER_PAGE;
    const paginatedData = data.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    
    if (paginatedData.length === 0) {
        return `
            <div class="admin-table-container">
                <div class="admin-toolbar">
                    <div class="admin-search">
                        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                        <input type="text" placeholder="Cari institusi..." oninput="adminSearchTable(this.value, 'named')" value="${adminSearchQuery}">
                    </div>
                    <div class="admin-actions">
                        <button onclick="showAddNamedModal()" class="btn btn-primary btn-sm">
                            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                            Tambah Institusi
                        </button>
                    </div>
                </div>
                <div class="empty-state">
                    <div class="empty-state-icon">🏥</div>
                    <h3>Tidak Ada Data Institusi</h3>
                    <p>Belum ada data institusi dokter. Klik tombol di atas untuk menambahkan.</p>
                </div>
            </div>
        `;
    }
    
    return `
        <div class="admin-table-container">
            <div class="admin-toolbar">
                <div class="admin-search">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                    <input type="text" placeholder="Cari institusi..." oninput="adminSearchTable(this.value, 'named')" value="${adminSearchQuery}">
                </div>
                <div class="admin-actions">
                    <button onclick="showAddNamedModal()" class="btn btn-primary btn-sm">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                        Tambah Institusi
                    </button>
                </div>
            </div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>No</th>
                        <th>Institusi</th>
                        <th>Tipe</th>
                        <th>Dokter</th>
                        <th>Dokter Gigi</th>
                        <th>Total</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    ${paginatedData.map((inst, i) => {
                        const total = (inst.dokter || 0) + (inst.dokterGigi || 0);
                        return `
                            <tr>
                                <td style="font-weight:600;color:#6b7280;">${startIndex + i + 1}</td>
                                <td style="font-weight:600;">${inst.nama || '-'}</td>
                                <td><span class="badge badge-blue">${inst.tipe || '-'}</span></td>
                                <td style="font-weight:600;color:#4f46e5;">${inst.dokter || 0}</td>
                                <td style="font-weight:600;color:#0891b2;">${inst.dokterGigi || 0}</td>
                                <td style="font-weight:700;color:#059669;">${total}</td>
                                <td>
                                    <div class="action-btns">
                                        <button onclick='showEditNamedModal(${JSON.stringify(inst).replace(/'/g, "&#39;")})' class="action-btn edit">
                                            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                            Edit
                                        </button>
                                        <button onclick='confirmDeleteNamed(${JSON.stringify(inst).replace(/'/g, "&#39;")})' class="action-btn delete">
                                            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                            Hapus
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            ${totalPages > 1 ? `
                <div class="pagination">
                    <button onclick="adminGoToPage(${adminCurrentPage - 1})" ${adminCurrentPage <= 1 ? 'disabled' : ''}>← Prev</button>
                    <span>Halaman ${adminCurrentPage} dari ${totalPages} (${data.length} data)</span>
                    <button onclick="adminGoToPage(${adminCurrentPage + 1})" ${adminCurrentPage >= totalPages ? 'disabled' : ''}>Next →</button>
                </div>
            ` : ''}
        </div>
    `;
}

// ==================== INSTITUSI NAKES TABLE (CRUD) ====================
function renderInstitusiNakesTable() {
    let data = state.cachedInstitusiNakesData || [];
    
    if (adminSearchQuery) {
        const q = adminSearchQuery.toLowerCase();
        data = data.filter(i => i.nama?.toLowerCase().includes(q) || i.tipe?.toLowerCase().includes(q));
    }
    
    const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
    const startIndex = (adminCurrentPage - 1) * ITEMS_PER_PAGE;
    const paginatedData = data.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    
    if (paginatedData.length === 0) {
        return `
            <div class="admin-table-container">
                <div class="admin-toolbar">
                    <div class="admin-search">
                        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                        <input type="text" placeholder="Cari institusi..." oninput="adminSearchTable(this.value, 'institusi-nakes')" value="${adminSearchQuery}">
                    </div>
                    <div class="admin-actions">
                        <button onclick="showAddInstitusiNakesModal()" class="btn btn-primary btn-sm">
                            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                            Tambah Institusi
                        </button>
                    </div>
                </div>
                <div class="empty-state">
                    <div class="empty-state-icon">🏢</div>
                    <h3>Tidak Ada Data Institusi Nakes</h3>
                    <p>Belum ada data institusi nakes. Klik tombol di atas untuk menambahkan.</p>
                </div>
            </div>
        `;
    }
    
    return `
        <div class="admin-table-container">
            <div class="admin-toolbar">
                <div class="admin-search">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                    <input type="text" placeholder="Cari institusi..." oninput="adminSearchTable(this.value, 'institusi-nakes')" value="${adminSearchQuery}">
                </div>
                <div class="admin-actions">
                    <button onclick="showAddInstitusiNakesModal()" class="btn btn-primary btn-sm">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                        Tambah Institusi
                    </button>
                </div>
            </div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>No</th>
                        <th>Institusi</th>
                        <th>Tipe</th>
                        <th>Perawat</th>
                        <th>Bidan</th>
                        <th>Apoteker</th>
                        <th>Total</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    ${paginatedData.map((inst, i) => {
                        const total = (inst.perawat || 0) + (inst.bidan || 0) + (inst.apoteker || 0) + (inst.lainnya || 0);
                        return `
                            <tr>
                                <td style="font-weight:600;color:#6b7280;">${startIndex + i + 1}</td>
                                <td style="font-weight:600;">${inst.nama || '-'}</td>
                                <td><span class="badge badge-pink">${inst.tipe || '-'}</span></td>
                                <td style="font-weight:600;color:#ec4899;">${inst.perawat || 0}</td>
                                <td style="font-weight:600;color:#db2777;">${inst.bidan || 0}</td>
                                <td style="font-weight:600;color:#ca8a04;">${inst.apoteker || 0}</td>
                                <td style="font-weight:700;color:#059669;">${total}</td>
                                <td>
                                    <div class="action-btns">
                                        <button onclick='showEditInstitusiNakesModal(${JSON.stringify(inst).replace(/'/g, "&#39;")})' class="action-btn edit">
                                            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                            Edit
                                        </button>
                                        <button onclick='confirmDeleteInstitusiNakes(${JSON.stringify(inst).replace(/'/g, "&#39;")})' class="action-btn delete">
                                            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                            Hapus
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            ${totalPages > 1 ? `
                <div class="pagination">
                    <button onclick="adminGoToPage(${adminCurrentPage - 1})" ${adminCurrentPage <= 1 ? 'disabled' : ''}>← Prev</button>
                    <span>Halaman ${adminCurrentPage} dari ${totalPages} (${data.length} data)</span>
                    <button onclick="adminGoToPage(${adminCurrentPage + 1})" ${adminCurrentPage >= totalPages ? 'disabled' : ''}>Next →</button>
                </div>
            ` : ''}
        </div>
    `;
}

// ==================== USERS TABLE (READ-ONLY) ====================
function renderUsersTable() {
    let data = state.cachedUsersData || [];
    
    if (adminSearchQuery) {
        const q = adminSearchQuery.toLowerCase();
        data = data.filter(u => u.username?.toLowerCase().includes(q) || u.nama?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q));
    }
    
    const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
    const startIndex = (adminCurrentPage - 1) * ITEMS_PER_PAGE;
    const paginatedData = data.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    
    if (paginatedData.length === 0) {
        return `
            <div class="admin-table-container">
                <div class="admin-toolbar">
                    <div class="admin-search">
                        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                        <input type="text" placeholder="Cari pengguna..." oninput="adminSearchTable(this.value, 'users')" value="${adminSearchQuery}">
                    </div>
                </div>
                <div class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <h3>Tidak Ada Data Pengguna</h3>
                    <p>Belum ada data pengguna atau data belum disinkron dari Google Sheets.</p>
                </div>
            </div>
        `;
    }
    
    return `
        <div class="admin-table-container">
            <div class="admin-toolbar">
                <div class="admin-search">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                    <input type="text" placeholder="Cari pengguna..." oninput="adminSearchTable(this.value, 'users')" value="${adminSearchQuery}">
                </div>
            </div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>No</th>
                        <th>Username</th>
                        <th>Nama</th>
                        <th>Role</th>
                        <th>Email</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${paginatedData.map((u, i) => `
                        <tr>
                            <td style="font-weight:600;color:#6b7280;">${startIndex + i + 1}</td>
                            <td style="font-weight:600;">${u.username || '-'}</td>
                            <td>${u.nama || '-'}</td>
                            <td><span class="badge ${u.role === 'superadmin' ? 'badge-danger' : u.role === 'operator' ? 'badge-info' : 'badge-gray'}">${u.role || '-'}</span></td>
                            <td>${u.email || '-'}</td>
                            <td><span class="badge-status ${u.status === 'aktif' ? 'badge-aktif' : 'badge-nonaktif'}">${u.status || '-'}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            ${totalPages > 1 ? `
                <div class="pagination">
                    <button onclick="adminGoToPage(${adminCurrentPage - 1})" ${adminCurrentPage <= 1 ? 'disabled' : ''}>← Prev</button>
                    <span>Halaman ${adminCurrentPage} dari ${totalPages} (${data.length} data)</span>
                    <button onclick="adminGoToPage(${adminCurrentPage + 1})" ${adminCurrentPage >= totalPages ? 'disabled' : ''}>Next →</button>
                </div>
            ` : ''}
        </div>
    `;
}

// ==================== ADMIN TABLE HELPERS ====================
function adminSearchTable(query, tab) {
    adminSearchQuery = query;
    adminCurrentPage = 1;
    const contentEl = document.getElementById('adminTabContent');
    if (contentEl) contentEl.innerHTML = renderAdminTabContent();
}

function adminGoToPage(page) {
    adminCurrentPage = page;
    const contentEl = document.getElementById('adminTabContent');
    if (contentEl) contentEl.innerHTML = renderAdminTabContent();
}

// ==================== CRUD MODALS FOR DATA NAKES ====================
function showAddNakesModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'nakesFormModal';
    modal.onclick = (e) => { if (e.target === modal) closeModal('nakesFormModal'); };
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <div>
                    <h2 class="modal-title">➕ Tambah Data Nakes Baru</h2>
                    <p class="modal-subtitle">Masukkan data tenaga kesehatan baru</p>
                </div>
                <button class="modal-close" onclick="closeModal('nakesFormModal')">
                    <svg width="18" height="18" fill="none" stroke="#6b7280" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
            </div>
            <div class="modal-body">
                <form id="nakesForm" onsubmit="handleSaveNakes(event)">
                    <div class="form-grid">
                        <div class="form-group">
                            <label class="form-label">Nama Lengkap *</label>
                            <input type="text" name="nama" class="form-input" placeholder="Dr. John Doe" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Jenis Profesi *</label>
                            <select name="jenis" class="form-select" required>
                                <option value="">Pilih profesi...</option>
                                <option value="dokter">Dokter</option>
                                <option value="dokter gigi">Dokter Gigi</option>
                                <option value="bidan">Bidan</option>
                                <option value="perawat">Perawat</option>
                                <option value="apoteker">Apoteker</option>
                                <option value="lainnya">Lainnya</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Spesialisasi</label>
                            <input type="text" name="spesialisasi" class="form-input" placeholder="Umum, Anak, dll">
                        </div>
                        <div class="form-group">
                            <label class="form-label">No. STR</label>
                            <input type="text" name="str" class="form-input" placeholder="Nomor Surat Tanda Registrasi">
                        </div>
                        <div class="form-group">
                            <label class="form-label">No. SIP</label>
                            <input type="text" name="sip" class="form-input" placeholder="Nomor Izin Praktik">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Status *</label>
                            <select name="status" class="form-select" required>
                                <option value="aktif">Aktif</option>
                                <option value="nonaktif">Non-Aktif</option>
                                <option value="cuti">Cuti</option>
                            </select>
                        </div>
                        <div class="form-group full-width">
                            <label class="form-label">Alamat Praktik</label>
                            <input type="text" name="alamat_praktik" class="form-input" placeholder="Jl. Contoh No. 123, Kota">
                        </div>
                        <div class="form-group full-width">
                            <label class="form-label">🗺️ Alamat Google Maps (URL/Link)</label>
                            <div style="display:flex;gap:8px;align-items:center;">
                                <input type="url" name="alamat_google_maps" class="form-input" placeholder="https://maps.google.com/?q=... atau koordinat" style="flex:1;">
                                <button type="button" onclick="window.open('https://www.google.com/maps','_blank')" 
                                        style="padding:10px 14px;background:#eef2ff;color:#4f46e5;border:1px solid #c7d2fe;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:6px;transition:all 0.2s;"
                                        onmouseover="this.style.background='#e0e7ff'"
                                        onmouseout="this.style.background='#eef2ff'">
                                    <svg width="14" height="14" fill="#4f46e5" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                                    Buka Maps
                                </button>
                            </div>
                            <p style="font-size:11px;color:#9ca3af;margin-top:4px;">💡 Copy link dari Google Maps (klik Share > Copy link) atau masukkan koordinat</p>
                        </div>
                        <div class="form-group full-width">
                            <label class="form-label">Jadwal Praktik</label>
                            <input type="text" name="jadwal_praktik" class="form-input" placeholder="Senin-Jumat, 08:00-16:00">
                        </div>
                        <div class="form-group">
                            <label class="form-label">No. Telepon</label>
                            <input type="tel" name="no_telepon" class="form-input" placeholder="08xxxxxxxxxx">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Email</label>
                            <input type="email" name="email" class="form-input" placeholder="email@contoh.com">
                        </div>
                        <div class="form-group full-width">
                            <label class="form-label">URL Foto</label>
                            <input type="url" name="foto" class="form-input" placeholder="https://contoh.com/foto.jpg">
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal('nakesFormModal')">Batal</button>
                <button type="submit" form="nakesForm" class="btn btn-primary">
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    Simpan Data
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function showEditNakesModal(nakes) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'nakesFormModal';
    modal.onclick = (e) => { if (e.target === modal) closeModal('nakesFormModal'); };
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <div>
                    <h2 class="modal-title">✏️ Edit Data Nakes</h2>
                    <p class="modal-subtitle">Mengedit: <strong>${nakes.nama}</strong></p>
                </div>
                <button class="modal-close" onclick="closeModal('nakesFormModal')">
                    <svg width="18" height="18" fill="none" stroke="#6b7280" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
            </div>
            <div class="modal-body">
                <form id="nakesForm" onsubmit="handleUpdateNakes(event, '${nakes.id || nakes.nama}')">
                    <input type="hidden" name="originalId" value="${nakes.id || ''}">
                    <div class="form-grid">
                        <div class="form-group">
                            <label class="form-label">Nama Lengkap *</label>
                            <input type="text" name="nama" class="form-input" value="${nakes.nama || ''}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Jenis Profesi *</label>
                            <select name="jenis" class="form-select" required>
                                <option value="dokter" ${nakes.jenis === 'dokter' ? 'selected' : ''}>Dokter</option>
                                <option value="dokter gigi" ${nakes.jenis === 'dokter gigi' ? 'selected' : ''}>Dokter Gigi</option>
                                <option value="bidan" ${nakes.jenis === 'bidan' ? 'selected' : ''}>Bidan</option>
                                <option value="perawat" ${nakes.jenis === 'perawat' ? 'selected' : ''}>Perawat</option>
                                <option value="apoteker" ${nakes.jenis === 'apoteker' ? 'selected' : ''}>Apoteker</option>
                                <option value="lainnya" ${nakes.jenis === 'lainnya' ? 'selected' : ''}>Lainnya</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Spesialisasi</label>
                            <input type="text" name="spesialisasi" class="form-input" value="${nakes.spesialisasi || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">No. STR</label>
                            <input type="text" name="str" class="form-input" value="${nakes.str || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">No. SIP</label>
                            <input type="text" name="sip" class="form-input" value="${nakes.sip || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Status *</label>
                            <select name="status" class="form-select" required>
                                <option value="aktif" ${nakes.status === 'aktif' ? 'selected' : ''}>Aktif</option>
                                <option value="nonaktif" ${nakes.status === 'nonaktif' ? 'selected' : ''}>Non-Aktif</option>
                                <option value="cuti" ${nakes.status === 'cuti' ? 'selected' : ''}>Cuti</option>
                            </select>
                        </div>
                        <div class="form-group full-width">
                            <label class="form-label">Alamat Praktik</label>
                            <input type="text" name="alamat_praktik" class="form-input" value="${nakes.alamat_praktik || ''}">
                        </div>
                        <div class="form-group full-width">
                            <label class="form-label">🗺️ Alamat Google Maps (URL/Link)</label>
                            <div style="display:flex;gap:8px;align-items:center;">
                                <input type="url" name="alamat_google_maps" class="form-input" placeholder="https://maps.google.com/?q=... atau koordinat" value="${nakes.alamat_google_maps || ''}" style="flex:1;">
                                ${nakes.alamat_google_maps ? `
                                <a href="${nakes.alamat_google_maps}" target="_blank" 
                                   style="padding:10px 14px;background:#dcfce7;color:#166534;border:1px solid #86efac;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:6px;text-decoration:none;transition:all 0.2s;"
                                   onmouseover="this.style.background='#bbf7d0'"
                                   onmouseout="this.style.background='#dcfce7'">
                                    <svg width="14" height="14" fill="#166534" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                                    Buka
                                </a>
                                ` : `
                                <button type="button" onclick="window.open('https://www.google.com/maps','_blank')" 
                                        style="padding:10px 14px;background:#eef2ff;color:#4f46e5;border:1px solid #c7d2fe;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:6px;transition:all 0.2s;"
                                        onmouseover="this.style.background='#e0e7ff'"
                                        onmouseout="this.style.background='#eef2ff'">
                                    <svg width="14" height="14" fill="#4f46e5" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                                    Cari di Maps
                                </button>
                                `}
                            </div>
                            <p style="font-size:11px;color:#9ca3af;margin-top:4px;">💡 Copy link dari Google Maps (klik Share > Copy link)</p>
                        </div>
                        <div class="form-group full-width">
                            <label class="form-label">Jadwal Praktik</label>
                            <input type="text" name="jadwal_praktik" class="form-input" value="${nakes.jadwal_praktik || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">No. Telepon</label>
                            <input type="tel" name="no_telepon" class="form-input" value="${nakes.no_telepon || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Email</label>
                            <input type="email" name="email" class="form-input" value="${nakes.email || ''}">
                        </div>
                        <div class="form-group full-width">
                            <label class="form-label">URL Foto</label>
                            <input type="url" name="foto" class="form-input" value="${nakes.foto || ''}">
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal('nakesFormModal')">Batal</button>
                <button type="submit" form="nakesForm" class="btn btn-primary">
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    Update Data
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function handleSaveNakes(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    const newNakes = {
        id: 'NK' + Date.now(),
        nama: formData.get('nama'),
        jenis: formData.get('jenis'),
        spesialisasi: formData.get('spesialisasi'),
        str: formData.get('str'),
        sip: formData.get('sip'),
        alamat_praktik: formData.get('alamat_praktik'),
        alamat_google_maps: formData.get('alamat_google_maps'),
        jadwal_praktik: formData.get('jadwal_praktik'),
        no_telepon: formData.get('no_telepon'),
        email: formData.get('email'),
        status: formData.get('status'),
        foto: formData.get('foto')
    };
    
    // Add to local cache
    if (!state.cachedNakesData) state.cachedNakesData = [];
    state.cachedNakesData.push(newNakes);
    
    // Save to localStorage as backup
    saveDataToLocalStorage();
    
    // Try to sync with Google Apps Script if available
    syncNakesChange('add', newNakes);
    
    closeModal('nakesFormModal');
    renderCurrentView();
    showNotification(`✅ Data Nakes "${newNakes.nama}" berhasil ditambahkan!`, 'success');
}

function handleUpdateNakes(e, originalId) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    const updatedData = {
        id: originalId,
        nama: formData.get('nama'),
        jenis: formData.get('jenis'),
        spesialisasi: formData.get('spesialisasi'),
        str: formData.get('str'),
        sip: formData.get('sip'),
        alamat_praktik: formData.get('alamat_praktik'),
        alamat_google_maps: formData.get('alamat_google_maps'),
        jadwal_praktik: formData.get('jadwal_praktik'),
        no_telepon: formData.get('no_telepon'),
        email: formData.get('email'),
        status: formData.get('status'),
        foto: formData.get('foto')
    };
    
    // Update local cache
    if (state.cachedNakesData) {
        const index = state.cachedNakesData.findIndex(n => n.id === originalId || n.nama === originalId);
        if (index !== -1) {
            state.cachedNakesData[index] = updatedData;
        }
    }
    
    // Save to localStorage as backup
    saveDataToLocalStorage();
    
    // Try to sync with Google Apps Script
    syncNakesChange('update', updatedData);
    
    closeModal('nakesFormModal');
    renderCurrentView();
    showNotification(`✅ Data Nakes "${updatedData.nama}" berhasil diupdate!`, 'success');
}

function confirmDeleteNakes(nakes) {
    if (`Hapus data Nakes "${nakes.nama}"?\n\nTindakan ini tidak dapat dibatalkan.`) {
        // Remove from local cache
        if (state.cachedNakesData) {
            state.cachedNakesData = state.cachedNakesData.filter(n => n.id !== nakes.id && n.nama !== nakes.nama);
        }
        
        // Save to localStorage as backup
        saveDataToLocalStorage();
        
        // Try to sync with Google Apps Script
        syncNakesChange('delete', { id: nakes.id, nama: nakes.nama });
        
        renderCurrentView();
        showNotification(`🗑️ Data Nakes "${nakes.nama}" berhasil dihapus!`, 'success');
    }
}

// ==================== CRUD MODALS FOR NAMED ====================
function showAddNamedModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'namedFormModal';
    modal.onclick = (e) => { if (e.target === modal) closeModal('namedFormModal'); };
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <div>
                    <h2 class="modal-title">🏥 Tambah Institusi Dokter</h2>
                    <p class="modal-subtitle">Tambah institusi kesehatan baru (RS, Puskesmas, Klinik)</p>
                </div>
                <button class="modal-close" onclick="closeModal('namedFormModal')">
                    <svg width="18" height="18" fill="none" stroke="#6b7280" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
            </div>
            <div class="modal-body">
                <form id="namedForm" onsubmit="handleSaveNamed(event)">
                    <div class="form-grid">
                        <div class="form-group">
                            <label class="form-label">Nama Institusi *</label>
                            <input type="text" name="nama" class="form-input" placeholder="RS Umum Contoh" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Tipe Institusi *</label>
                            <select name="tipe" class="form-select" required>
                                <option value="">Pilih tipe...</option>
                                <option value="RS">Rumah Sakit</option>
                                <option value="Puskesmas">Puskesmas</option>
                                <option value="Klinik">Klinik</option>
                                <option value="BPM">Bidang Praktik Mandiri</option>
                                <option value="Lainnya">Lainnya</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Jumlah Dokter</label>
                            <input type="number" name="dokter" class="form-input" placeholder="0" min="0" value="0">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Jumlah Dokter Gigi</label>
                            <input type="number" name="dokterGigi" class="form-input" placeholder="0" min="0" value="0">
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal('namedFormModal')">Batal</button>
                <button type="submit" form="namedForm" class="btn btn-primary">
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    Simpan Data
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function showEditNamedModal(inst) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'namedFormModal';
    modal.onclick = (e) => { if (e.target === modal) closeModal('namedFormModal'); };
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <div>
                    <h2 class="modal-title">✏️ Edit Institusi Dokter</h2>
                    <p class="modal-subtitle">Mengedit: <strong>${inst.nama}</strong></p>
                </div>
                <button class="modal-close" onclick="closeModal('namedFormModal')">
                    <svg width="18" height="18" fill="none" stroke="#6b7280" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
            </div>
            <div class="modal-body">
                <form id="namedForm" onsubmit="handleUpdateNamed(event, '${inst.id}')">
                    <div class="form-grid">
                        <div class="form-group">
                            <label class="form-label">Nama Institusi *</label>
                            <input type="text" name="nama" class="form-input" value="${inst.nama || ''}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Tipe Institusi *</label>
                            <select name="tipe" class="form-select" required>
                                <option value="RS" ${inst.tipe === 'RS' ? 'selected' : ''}>Rumah Sakit</option>
                                <option value="Puskesmas" ${inst.tipe === 'Puskesmas' ? 'selected' : ''}>Puskesmas</option>
                                <option value="Klinik" ${inst.tipe === 'Klinik' ? 'selected' : ''}>Klinik</option>
                                <option value="BPM" ${inst.tipe === 'BPM' ? 'selected' : ''}>Bidang Praktik Mandiri</option>
                                <option value="Lainnya" ${inst.tipe === 'Lainnya' ? 'selected' : ''}>Lainnya</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Jumlah Dokter</label>
                            <input type="number" name="dokter" class="form-input" value="${inst.dokter || 0}" min="0">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Jumlah Dokter Gigi</label>
                            <input type="number" name="dokterGigi" class="form-input" value="${inst.dokterGigi || 0}" min="0">
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal('namedFormModal')">Batal</button>
                <button type="submit" form="namedForm" class="btn btn-primary">
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    Update Data
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function handleSaveNamed(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    const newInst = {
        id: 'ND' + Date.now(),
        nama: formData.get('nama'),
        tipe: formData.get('tipe'),
        dokter: parseInt(formData.get('dokter')) || 0,
        dokterGigi: parseInt(formData.get('dokterGigi')) || 0,
        total: (parseInt(formData.get('dokter')) || 0) + (parseInt(formData.get('dokterGigi')) || 0),
        updatedAt: new Date().toISOString()
    };
    
    if (!state.cachedNamedData) state.cachedNamedData = [];
    state.cachedNamedData.push(newInst);
    
    saveDataToLocalStorage();
    syncNamedChange('add', newInst);
    
    closeModal('namedFormModal');
    renderCurrentView();
    showNotification(`✅ Institusi "${newInst.nama}" berhasil ditambahkan!`, 'success');
}

function handleUpdateNamed(e, originalId) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    const updatedData = {
        id: originalId,
        nama: formData.get('nama'),
        tipe: formData.get('tipe'),
        dokter: parseInt(formData.get('dokter')) || 0,
        dokterGigi: parseInt(formData.get('dokterGigi')) || 0,
        total: (parseInt(formData.get('dokter')) || 0) + (parseInt(formData.get('dokterGigi')) || 0),
        updatedAt: new Date().toISOString()
    };
    
    if (state.cachedNamedData) {
        const index = state.cachedNamedData.findIndex(i => i.id === originalId);
        if (index !== -1) {
            state.cachedNamedData[index] = updatedData;
        }
    }
    
    saveDataToLocalStorage();
    syncNamedChange('update', updatedData);
    
    closeModal('namedFormModal');
    renderCurrentView();
    showNotification(`✅ Institusi "${updatedData.nama}" berhasil diupdate!`, 'success');
}

function confirmDeleteNamed(inst) {
    if (`Hapus institusi "${inst.nama}"?\n\nTindakan ini tidak dapat dibatalkan.`) {
        if (state.cachedNamedData) {
            state.cachedNamedData = state.cachedNamedData.filter(i => i.id !== inst.id);
        }
        
        saveDataToLocalStorage();
        syncNamedChange('delete', { id: inst.id, nama: inst.nama });
        
        renderCurrentView();
        showNotification(`🗑️ Institusi "${inst.nama}" berhasil dihapus!`, 'success');
    }
}

// ==================== CRUD MODALS FOR INSTITUSI NAKES ====================
function showAddInstitusiNakesModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'institusiNakesFormModal';
    modal.onclick = (e) => { if (e.target === modal) closeModal('institusiNakesFormModal'); };
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <div>
                    <h2 class="modal-title">🏢 Tambah Institusi Nakes</h2>
                    <p class="modal-subtitle">Tambah institusi dengan data Perawat, Bidan, Apoteker</p>
                </div>
                <button class="modal-close" onclick="closeModal('institusiNakesFormModal')">
                    <svg width="18" height="18" fill="none" stroke="#6b7280" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
            </div>
            <div class="modal-body">
                <form id="institusiNakesForm" onsubmit="handleSaveInstitusiNakes(event)">
                    <div class="form-grid">
                        <div class="form-group">
                            <label class="form-label">Nama Institusi *</label>
                            <input type="text" name="nama" class="form-input" placeholder="Puskesmas Contoh" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Tipe Institusi *</label>
                            <select name="tipe" class="form-select" required>
                                <option value="">Pilih tipe...</option>
                                <option value="RS">Rumah Sakit</option>
                                <option value="Puskesmas">Puskesmas</option>
                                <option value="Klinik">Klinik</option>
                                <option value="BPM">Bidang Praktik Mandiri</option>
                                <option value="Lainnya">Lainnya</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Jumlah Perawat</label>
                            <input type="number" name="perawat" class="form-input" placeholder="0" min="0" value="0">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Jumlah Bidan</label>
                            <input type="number" name="bidan" class="form-input" placeholder="0" min="0" value="0">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Jumlah Apoteker</label>
                            <input type="number" name="apoteker" class="form-input" placeholder="0" min="0" value="0">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Jumlah Lainnya</label>
                            <input type="number" name="lainnya" class="form-input" placeholder="0" min="0" value="0">
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal('institusiNakesFormModal')">Batal</button>
                <button type="submit" form="institusiNakesForm" class="btn btn-primary">
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    Simpan Data
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function showEditInstitusiNakesModal(inst) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'institusiNakesFormModal';
    modal.onclick = (e) => { if (e.target === modal) closeModal('institusiNakesFormModal'); };
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <div>
                    <h2 class="modal-title">✏️ Edit Institusi Nakes</h2>
                    <p class="modal-subtitle">Mengedit: <strong>${inst.nama}</strong></p>
                </div>
                <button class="modal-close" onclick="closeModal('institusiNakesFormModal')">
                    <svg width="18" height="18" fill="none" stroke="#6b7280" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
            </div>
            <div class="modal-body">
                <form id="institusiNakesForm" onsubmit="handleUpdateInstitusiNakes(event, '${inst.id}')">
                    <div class="form-grid">
                        <div class="form-group">
                            <label class="form-label">Nama Institusi *</label>
                            <input type="text" name="nama" class="form-input" value="${inst.nama || ''}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Tipe Institusi *</label>
                            <select name="tipe" class="form-select" required>
                                <option value="RS" ${inst.tipe === 'RS' ? 'selected' : ''}>Rumah Sakit</option>
                                <option value="Puskesmas" ${inst.tipe === 'Puskesmas' ? 'selected' : ''}>Puskesmas</option>
                                <option value="Klinik" ${inst.tipe === 'Klinik' ? 'selected' : ''}>Klinik</option>
                                <option value="BPM" ${inst.tipe === 'BPM' ? 'selected' : ''}>Bidang Praktik Mandiri</option>
                                <option value="Lainnya" ${inst.tipe === 'Lainnya' ? 'selected' : ''}>Lainnya</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Jumlah Perawat</label>
                            <input type="number" name="perawat" class="form-input" value="${inst.perawat || 0}" min="0">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Jumlah Bidan</label>
                            <input type="number" name="bidan" class="form-input" value="${inst.bidan || 0}" min="0">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Jumlah Apoteker</label>
                            <input type="number" name="apoteker" class="form-input" value="${inst.apoteker || 0}" min="0">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Jumlah Lainnya</label>
                            <input type="number" name="lainnya" class="form-input" value="${inst.lainnya || 0}" min="0">
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal('institusiNakesFormModal')">Batal</button>
                <button type="submit" form="institusiNakesForm" class="btn btn-primary">
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    Update Data
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function handleSaveInstitusiNakes(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    const perawat = parseInt(formData.get('perawat')) || 0;
    const bidan = parseInt(formData.get('bidan')) || 0;
    const apoteker = parseInt(formData.get('apoteker')) || 0;
    const lainnya = parseInt(formData.get('lainnya')) || 0;
    
    const newInst = {
        id: 'IN' + Date.now(),
        nama: formData.get('nama'),
        tipe: formData.get('tipe'),
        perawat: perawat,
        bidan: bidan,
        apoteker: apoteker,
        lainnya: lainnya,
        total: perawat + bidan + apoteker + lainnya,
        updatedAt: new Date().toISOString()
    };
    
    if (!state.cachedInstitusiNakesData) state.cachedInstitusiNakesData = [];
    state.cachedInstitusiNakesData.push(newInst);
    
    saveDataToLocalStorage();
    syncInstitusiNakesChange('add', newInst);
    
    closeModal('institusiNakesFormModal');
    renderCurrentView();
    showNotification(`✅ Institusi "${newInst.nama}" berhasil ditambahkan!`, 'success');
}

function handleUpdateInstitusiNakes(e, originalId) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    const perawat = parseInt(formData.get('perawat')) || 0;
    const bidan = parseInt(formData.get('bidan')) || 0;
    const apoteker = parseInt(formData.get('apoteker')) || 0;
    const lainnya = parseInt(formData.get('lainnya')) || 0;
    
    const updatedData = {
        id: originalId,
        nama: formData.get('nama'),
        tipe: formData.get('tipe'),
        perawat: perawat,
        bidan: bidan,
        apoteker: apoteker,
        lainnya: lainnya,
        total: perawat + bidan + apoteker + lainnya,
        updatedAt: new Date().toISOString()
    };
    
    if (state.cachedInstitusiNakesData) {
        const index = state.cachedInstitusiNakesData.findIndex(i => i.id === originalId);
        if (index !== -1) {
            state.cachedInstitusiNakesData[index] = updatedData;
        }
    }
    
    saveDataToLocalStorage();
    syncInstitusiNakesChange('update', updatedData);
    
    closeModal('institusiNakesFormModal');
    renderCurrentView();
    showNotification(`✅ Institusi "${updatedData.nama}" berhasil diupdate!`, 'success');
}

function confirmDeleteInstitusiNakes(inst) {
    if (`Hapus institusi "${inst.nama}"?\n\nTindakan ini tidak dapat dibatalkan.`) {
        if (state.cachedInstitusiNakesData) {
            state.cachedInstitusiNakesData = state.cachedInstitusiNakesData.filter(i => i.id !== inst.id);
        }
        
        saveDataToLocalStorage();
        syncInstitusiNakesChange('delete', { id: inst.id, nama: inst.nama });
        
        renderCurrentView();
        showNotification(`🗑️ Institusi "${inst.nama}" berhasil dihapus!`, 'success');
    }
}

// ==================== DATA PERSISTENCE & SYNC ====================
