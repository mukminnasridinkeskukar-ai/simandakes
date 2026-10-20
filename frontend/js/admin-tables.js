// === DATA NAKES TABLE (CRUD) ===
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


// === NAMED INSTITUSI TABLE (CRUD) ===
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


// === INSTITUSI NAKES TABLE (CRUD) ===
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


// === USERS TABLE (READ-ONLY) ===
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


// === ADMIN TABLE HELPERS ===
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

