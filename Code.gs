// ===================== KONFIGURASI =====================
var SPREADSHEET_ID = '1stLJMW31-A_arnePaPldx2RYJX_B2UiTq970N8UtLvE';
var SCRIPT_PROP_KEY = 'ADMIN_EMAILS';

// ===================== DOGET / INDEX =====================
function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('SIMANDAKES')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ===================== UTILITAS SHEET =====================
function getSS() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getSheet(name) {
  var ss = getSS();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function ensureSheet(name, headers) {
  var sheet = getSheet(name);
  if (sheet.getLastRow() === 0 && headers) {
    sheet.appendRow(headers);
  }
  return sheet;
}

function sheetToObjects(sheet) {
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0];
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[String(headers[j]).trim()] = values[i][j] !== undefined ? values[i][j] : '';
    }
    obj._row = i + 1;
    rows.push(obj);
  }
  return rows;
}

function findRowById(sheet, idValue) {
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return -1;
  var headers = values[0];
  var idCol = -1;
  for (var i = 0; i < headers.length; i++) {
    if (String(headers[i]).trim().toLowerCase() === 'id') {
      idCol = i;
      break;
    }
  }
  if (idCol === -1) return -1;
  for (var r = 1; r < values.length; r++) {
    if (String(values[r][idCol]).trim() === String(idValue)) {
      return r + 1;
    }
  }
  return -1;
}

function generateId(prefix, sheet) {
  var data = sheetToObjects(sheet);
  var maxNum = 0;
  data.forEach(function(row) {
    var id = String(row['id'] || '');
    var numPart = parseInt(id.replace(prefix, ''), 10);
    if (!isNaN(numPart) && numPart > maxNum) maxNum = numPart;
  });
  return prefix + String(maxNum + 1).padStart(3, '0');
}

// ===================== HEADER & DASHBOARD =====================
function getHeaderData() {
  return getSheetData();
}

function getDashboardData() {
  return getSheetData('Dashboard');
}

function getSheetData(sheetName) {
  try {
    var ss = getSS();
    var sheet = sheetName ? ss.getSheetByName(sheetName) : ss.getSheets()[0];
    if (!sheet) return [];
    return sheet.getDataRange().getValues();
  } catch (err) {
    return [['Error: ' + err.message]];
  }
}

// ===================== MENU =====================
function getMenu() {
  var sheet = getSheet('Menu');
  if (sheet.getLastRow() < 2) {
    return seedMenuSheet();
  }
  var menus = sheetToObjects(sheet);
  return menus.filter(function(m) {
    return String(m.Status || m.status || 'Aktif').toLowerCase() === 'aktif';
  });
}

function seedMenuSheet() {
  var sheet = ensureSheet('Menu', ['ID','ParentMenu','MenuName','Icon','PageType','OrderNo','Status']);
  var defaultMenus = [
    { id: 'sdmk',           parent: '', name: 'SDMK',              icon: 'fas fa-user-md',         pageType: 'sdmk',            order: 1,  status: 'Aktif' },
    { id: 'fasyankes',      parent: '', name: 'Fasyankes',         icon: 'fas fa-hospital',        pageType: 'fasyankes',       order: 2,  status: 'Aktif' },
    { id: 'praktik_nakes',  parent: '', name: 'Praktik Mandiri Nakes', icon: 'fas fa-user-nurse', pageType: 'praktik',        order: 3,  status: 'Aktif' },
    { id: 'dokter_spesialis', parent:'', name: 'Praktik Dokter Spesialis', icon: 'fas fa-stethoscope', pageType: 'dokter',    order: 4,  status: 'Aktif' },
    { id: 'kotak_saran',    parent: '', name: 'Kotak Saran',       icon: 'fas fa-envelope',        pageType: 'saran',           order: 5,  status: 'Aktif' }
  ];
  defaultMenus.forEach(function(m) {
    sheet.appendRow([m.id, m.parent, m.name, m.icon, m.pageType, m.order, m.status]);
  });
  return defaultMenus;
}

// ===================== GENERIC CRUD HELPERS =====================
function getData(sheetName) {
  return sheetToObjects(getSheet(sheetName));
}

function saveData(sheetName, data, idPrefix, headers) {
  var sheet = getSheet(sheetName);
  if (!data.id) {
    data.id = generateId(idPrefix, sheet);
  }
  var row = findRowById(sheet, data.id);
  if (row === -1) {
    sheet.appendRow(headers.map(function(h) { return data[h] || ''; }));
  } else {
    var range = sheet.getRange(row, 1, 1, headers.length);
    range.setValues([headers.map(function(h) { return data[h] || ''; })]);
  }
  return { ok: true, data: data };
}

function updateData(sheetName, id, payload) {
  var sheet = getSheet(sheetName);
  var row = findRowById(sheet, id);
  if (row === -1) {
    return { ok: false, message: 'Data tidak ditemukan.' };
  }
  var headers = sheet.getDataRange().getValues()[0];
  var range = sheet.getRange(row, 1, 1, headers.length);
  var newRow = [];
  for (var i = 0; i < headers.length; i++) {
    var key = String(headers[i]).trim();
    newRow.push(payload[key] !== undefined ? payload[key] : range.getCell(1, i+1).getValue());
  }
  range.setValues([newRow]);
  var updated = {};
  headers.forEach(function(h, idx) {
    updated[h] = newRow[idx];
  });
  updated._row = row;
  return { ok: true, data: updated };
}

function deleteData(sheetName, id) {
  var sheet = getSheet(sheetName);
  var row = findRowById(sheet, id);
  if (row === -1) {
    return { ok: false, message: 'Data tidak ditemukan.' };
  }
  sheet.deleteRow(row);
  return { ok: true };
}

// ===================== SDMK =====================
function getSDMK() {
  return getData('SDMK');
}

function saveSDMK(data) {
  return saveData('SDMK', data, 'SDM', ['id','nama','nik','profesi','tempat_kerja','no_str','status_aktif','foto']);
}

// ===================== FASYANKES =====================
function getFasyankes() {
  return getData('Fasyankes');
}

function saveFasyankes(data) {
  return saveData('Fasyankes', data, 'FAS', ['id','nama','jenis','alamat','pimpinan','status_operasional','foto']);
}

// ===================== PRAKTIK MANDIRI =====================
function getPraktikNakes() {
  return getData('PraktikMandiri');
}

function savePraktikNakes(data) {
  return saveData('PraktikMandiri', data, 'PMN', ['id','nama','profesi','sip','alamat','kontak','foto']);
}

// Alias untuk kompatibilitas
function getPraktikMandiri() {
  return getPraktikNakes();
}

function savePraktikMandiri(data) {
  return savePraktikNakes(data);
}

// ===================== DOKTER SPESIALIS =====================
function getDokterSpesialis() {
  return getData('DokterSpesialis');
}

function saveDokterSpesialis(data) {
  return saveData('DokterSpesialis', data, 'PDS', ['id','nama','spesialisasi','sip','fasyankes_mitra','jadwal','foto']);
}

// ===================== KOTAK SARAN =====================
function getKotakSaran() {
  return getData('KotakSaran');
}

function saveKotakSaran(data) {
  var sheet = ensureSheet('KotakSaran', ['id','nama','email','saran','tanggal']);
  if (!data.id) {
    data.id = generateId('SRN', sheet);
  }
  if (!data.tanggal) {
    data.tanggal = new Date();
  }
  var headers = sheet.getDataRange().getValues()[0] || ['id','nama','email','saran','tanggal'];
  sheet.appendRow(headers.map(function(h) {
    var v = data[h];
    if (h === 'tanggal' && v instanceof Date) return v;
    return v || '';
  }));
  return { ok: true, data: data };
}

// ===================== ADMIN MODULES =====================
var ADMIN_MODULES = [
  {
    id: 'sdmk',
    name: 'SDMK',
    icon: 'fas fa-user-md',
    headers: [
      { key: 'foto',            label: 'Foto',            type: 'text',     required: false },
      { key: 'id',              label: 'ID',              type: 'text',     required: true  },
      { key: 'nama',            label: 'Nama',            type: 'text',     required: true  },
      { key: 'nik',             label: 'NIK',             type: 'text',     required: true  },
      { key: 'profesi',         label: 'Profesi',         type: 'text',     required: true  },
      { key: 'tempat_kerja',    label: 'Tempat Kerja',    type: 'text',     required: false },
      { key: 'no_str',          label: 'No STR',          type: 'text',     required: false },
      { key: 'status_aktif',    label: 'Status Aktif',    type: 'select',   required: true,
      options: ['Aktif','Tidak Aktif','Pending'] }
    ],
    sheetName: 'SDMK',
    idPrefix: 'SDM'
  },
  {
    id: 'fasyankes',
    name: 'Fasyankes',
    icon: 'fas fa-hospital',
    headers: [
      { key: 'foto',              label: 'Foto',            type: 'text',     required: false },
      { key: 'id',                label: 'ID',              type: 'text',     required: true  },
      { key: 'nama',              label: 'Nama',            type: 'text',     required: true  },
      { key: 'jenis',             label: 'Jenis',           type: 'text',     required: true  },
      { key: 'alamat',            label: 'Alamat',          type: 'text',     required: true  },
      { key: 'pimpinan',          label: 'Pimpinan',        type: 'text',     required: false },
      { key: 'status_operasional', label: 'Status Operasional', type: 'select', required: true,
      options: ['Aktif','Nonaktif','Pending'] }
    ],
    sheetName: 'Fasyankes',
    idPrefix: 'FAS'
  },
  {
    id: 'praktik_nakes',
    name: 'Praktik Mandiri Nakes',
    icon: 'fas fa-user-nurse',
    headers: [
      { key: 'foto',     label: 'Foto',       type: 'text',   required: false },
      { key: 'id',       label: 'ID',         type: 'text',   required: true  },
      { key: 'nama',     label: 'Nama',       type: 'text',   required: true  },
      { key: 'profesi',  label: 'Profesi',    type: 'text',   required: true  },
      { key: 'sip',      label: 'SIP',        type: 'text',   required: true  },
      { key: 'alamat',   label: 'Alamat',     type: 'text',   required: true  },
      { key: 'kontak',   label: 'Kontak',     type: 'text',   required: false }
    ],
    sheetName: 'PraktikMandiri',
    idPrefix: 'PMN'
  },
  {
    id: 'dokter_spesialis',
    name: 'Praktik Dokter Spesialis',
    icon: 'fas fa-stethoscope',
    headers: [
      { key: 'foto',           label: 'Foto',           type: 'text',   required: false },
      { key: 'id',             label: 'ID',             type: 'text',   required: true  },
      { key: 'nama',           label: 'Nama',           type: 'text',   required: true  },
      { key: 'spesialisasi',   label: 'Spesialisasi',   type: 'text',   required: true  },
      { key: 'sip',            label: 'SIP',            type: 'text',   required: true  },
      { key: 'fasyankes_mitra', label: 'Fasyankes Mitra', type: 'text', required: false },
      { key: 'jadwal',         label: 'Jadwal',         type: 'text',   required: false }
    ],
    sheetName: 'DokterSpesialis',
    idPrefix: 'PDS'
  }
];

// ===================== SESSION & AUTH =====================
function checkSession() {
  var cache = CacheService.getUserCache();
  var session = cache.get('adminSession');
  if (session) {
    try { session = JSON.parse(session); } catch(e) { session = null; }
  }
  return { ok: true, data: session };
}

function checkAdmin() {
  var userEmail = Session.getActiveUser().getEmail();
  if (!userEmail) return false;
  var adminEmails = PropertiesService.getScriptProperties().getProperty(SCRIPT_PROP_KEY) || '';
  var admins = adminEmails.split(',').map(function(e) { return e.trim(); });
  return admins.indexOf(userEmail) > -1;
}

function login(payload) {
  var username = String(payload.username || '').trim();
  var password = String(payload.password || '').trim();

  var accounts = {
    'superadmin': { password: 'simandakes123', role: 'Super Admin', nama: 'Super Admin' },
    'sdmk':       { password: 'sdmk123',       role: 'Admin SDMK', nama: 'Admin SDMK' },
    'fasyankes':  { password: 'fasyankes123',  role: 'Admin Fasyankes', nama: 'Admin Fasyankes' },
    'praktik':    { password: 'praktik123',    role: 'Admin Praktik', nama: 'Admin Praktik' }
  };

  var account = accounts[username];
  if (!account || account.password !== password) {
    return { ok: false, message: 'Username atau password salah.' };
  }

  var session = {
    username: username,
    nama: account.nama,
    role: account.role,
    loginTime: new Date()
  };

  var cache = CacheService.getUserCache();
  cache.put('adminSession', JSON.stringify(session), 21600);
  saveAuditTrail({
    action: 'login',
    description: 'Login berhasil',
    by: username,
    username: username,
    role: account.role,
    module: 'Auth',
    recordId: ''
  });

  return { ok: true, data: session };
}

function logout() {
  var session = checkSession();
  if (session && session.data) {
    saveAuditTrail({
      action: 'logout',
      description: 'Logout',
      by: session.data.username,
      username: session.data.username,
      role: session.data.role,
      module: 'Auth',
      recordId: ''
    });
  }
  CacheService.getUserCache().remove('adminSession');
  return { ok: true };
}

// ===================== ADMIN ROUTER =====================
function getAdminModules() {
  var session = checkSession();
  if (!session || !session.data) {
    return { ok: false, data: [], message: 'Sesi berakhir. Silakan login kembali.' };
  }

  var role = session.data.role;
  var modules = [];

  if (role === 'Super Admin') {
    modules = ADMIN_MODULES.slice();
  } else if (role === 'Admin SDMK') {
    modules = ADMIN_MODULES.filter(function(m) { return m.id === 'sdmk'; });
  } else if (role === 'Admin Fasyankes') {
    modules = ADMIN_MODULES.filter(function(m) { return m.id === 'fasyankes'; });
  } else if (role === 'Admin Praktik') {
    modules = ADMIN_MODULES.filter(function(m) {
      return m.id === 'praktik_nakes' || m.id === 'dokter_spesialis';
    });
  }

  return { ok: true, session: session.data, data: modules };
}

function getAdminData(moduleId) {
  var session = checkSession();
  if (!session || !session.data) {
    return { ok: false, message: 'Sesi berakhir. Silakan login kembali.' };
  }

  var module = ADMIN_MODULES.find(function(m) { return m.id === moduleId; });
  if (!module) {
    return { ok: false, message: 'Modul tidak ditemukan: ' + moduleId };
  }

  var rows = getData(module.sheetName);
  return { ok: true, data: rows };
}

function saveAdminData(moduleId, payload) {
  var session = checkSession();
  if (!session || !session.data) {
    return { ok: false, message: 'Sesi berakhir.' };
  }

  var module = ADMIN_MODULES.find(function(m) { return m.id === moduleId; });
  if (!module) {
    return { ok: false, message: 'Modul tidak ditemukan.' };
  }

  var headers = module.headers.map(function(h) { return h.key; });
  var result = saveData(module.sheetName, payload, module.idPrefix, headers);
  if (result.ok) {
    var action = payload._row ? 'update' : 'create';
    saveAuditTrail({
      action: action,
      description: module.name + ' - ' + (payload.nama || payload.id || ''),
      by: session.data.username,
      username: session.data.username,
      role: session.data.role,
      module: module.name,
      recordId: payload.id || ''
    });
  }
  return result;
}

function updateAdminData(moduleId, id, payload) {
  var session = checkSession();
  if (!session || !session.data) {
    return { ok: false, message: 'Sesi berakhir.' };
  }

  var module = ADMIN_MODULES.find(function(m) { return m.id === moduleId; });
  if (!module) {
    return { ok: false, message: 'Modul tidak ditemukan.' };
  }

  var result = updateData(module.sheetName, id, payload);
  if (result.ok) {
    saveAuditTrail({
      action: 'update',
      description: module.name + ' - ' + (result.data.nama || id),
      by: session.data.username,
      username: session.data.username,
      role: session.data.role,
      module: module.name,
      recordId: id
    });
  }
  return result;
}

function deleteAdminData(moduleId, id) {
  var session = checkSession();
  if (!session || !session.data) {
    return { ok: false, message: 'Sesi berakhir.' };
  }

  var module = ADMIN_MODULES.find(function(m) { return m.id === moduleId; });
  if (!module) {
    return { ok: false, message: 'Modul tidak ditemukan.' };
  }

  var result = deleteData(module.sheetName, id);
  if (result.ok) {
    saveAuditTrail({
      action: 'delete',
      description: module.name + ' - ' + id,
      by: session.data.username,
      username: session.data.username,
      role: session.data.role,
      module: module.name,
      recordId: id
    });
  }
  return result;
}

// ===================== UPLOAD FOTO =====================
function uploadAdminPhoto(data) {
  try {
    var filename = data.filename || 'photo.jpg';
    var base64 = data.file || '';
    var mimeType = data.mimeType || 'image/jpeg';

    var blob = Utilities.newBlob(Utilities.base64Decode(base64), mimeType, filename);
    var folderId = PropertiesService.getScriptProperties().getProperty('UPLOAD_FOLDER_ID') || '';
    var file;

    if (folderId) {
      var folder = DriveApp.getFolderById(folderId);
      file = folder.createFile(blob);
    } else {
      file = DriveApp.createFile(blob);
    }

    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var url = file.getUrl();

    return { ok: true, url: url };
  } catch (err) {
    return { ok: false, message: 'Gagal upload: ' + err.message };
  }
}

// ===================== AUDIT TRAIL =====================
function getAuditTrail() {
  var sheet = getSheet('AuditTrail');
  return sheetToObjects(sheet);
}

function saveAuditTrail(data) {
  try {
    var sheet = ensureSheet('AuditTrail', ['timestamp','action','by','username','role','module','record_id','payload']);
    var row = [
      data.timestamp || new Date(),
      data.action || '',
      data.by || '',
      data.username || '',
      data.role || '',
      data.module || '',
      data.recordId || '',
      data.description || ''
    ];
    sheet.appendRow(row);
    return { ok: true, data: data };
  } catch (err) {
    return { ok: false, message: err.message };
  }
}

// ===================== EXPORT: EXCEL (CSV) =====================
function exportAdminExcel(moduleId) {
  try {
    var module = ADMIN_MODULES.find(function(m) { return m.id === moduleId; });
    if (!module) {
      return { ok: false, message: 'Modul tidak ditemukan.' };
    }

    var rows = getData(module.sheetName);
    var csvContent = module.headers.map(function(h) {
      return '"' + String(h.label).replace(/"/g, '""') + '"';
    }).join(',') + '\n';

    rows.forEach(function(row) {
      var line = module.headers.map(function(h) {
        var val = row[h.key] !== undefined ? String(row[h.key]) : '';
        val = val.replace(/"/g, '""');
        if (val.indexOf(',') !== -1 || val.indexOf('\n') !== -1 || val.indexOf('"') !== -1) {
          val = '"' + val + '"';
        }
        return val;
      }).join(',');
      csvContent += line + '\n';
    });

    var url = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);

    return { ok: true, url: url };
  } catch (err) {
    return { ok: false, message: 'Gagal export Excel: ' + err.message };
  }
}

// ===================== EXPORT: PDF =====================
function exportAdminPdf(moduleId) {
  try {
    var module = ADMIN_MODULES.find(function(m) { return m.id === moduleId; });
    if (!module) {
      return { ok: false, message: 'Modul tidak ditemukan.' };
    }

    var rows = getData(module.sheetName);
    var headers = module.headers.map(function(h) { return h.label; });
    var keys = module.headers.map(function(h) { return h.key; });

    var htmlTable = '<html><head><style>' +
      'table{border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:11px;}' +
      'th{background:#0f172a;color:#fff;padding:8px;text-align:left;}' +
      'td{padding:6px 8px;border-bottom:1px solid #e2e8f0;}' +
      'tr:nth-child(even){background:#f8fafc;}' +
      'h1{font-family:Arial,sans-serif;font-size:18px;color:#0f172a;text-align:center;}' +
      'p{font-family:Arial,sans-serif;font-size:11px;color:#64748b;text-align:center;}</style></head><body>' +
      '<h1>SIMANDAKES - ' + module.name + '</h1>' +
      '<p>Dicetak: ' + new Date().toLocaleString('id-ID') + '</p><br>' +
      '<table><thead><tr>';

    headers.forEach(function(h) {
      htmlTable += '<th>' + escapeHtml(h) + '</th>';
    });

    htmlTable += '</tr></thead><tbody>';
    rows.forEach(function(row) {
      htmlTable += '<tr>';
      keys.forEach(function(k) {
        htmlTable += '<td>' + escapeHtml(String(row[k] !== undefined ? row[k] : '')) + '</td>';
      });
      htmlTable += '</tr>';
    });
    htmlTable += '</tbody></table></body></html>';

    var blob = Utilities.newBlob(htmlTable, 'text/html', module.name + '_export.html');
    var pdfBlob = blob.getAs('application/pdf');

    var url = 'data:application/pdf;base64,' + Utilities.base64Encode(pdfBlob.getBytes());

    return { ok: true, url: url };
  } catch (err) {
    return { ok: false, message: 'Gagal export PDF: ' + err.message };
  }
}

function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  var s = String(value);
  var OUT = [];
  for (var i = 0; i < s.length; i++) {
    var c = s.charAt(i);
    if (c === '&') OUT.push('&');
    else if (c === '<') OUT.push('<');
    else if (c === '>') OUT.push('>');
    else if (c === '"') OUT.push('"');
    else if (c === "'") OUT.push('&#039;');
    else OUT.push(c);
  }
  return OUT.join('');
}

// ===================== INIT DATA (Run sekali) =====================
function initSimandakesData() {
  ensureSheet('Menu', ['ID','ParentMenu','MenuName','Icon','PageType','OrderNo','Status']);
  ensureSheet('SDMK',       ['id','nama','nik','profesi','tempat_kerja','no_str','status_aktif','foto']);
  ensureSheet('Fasyankes',  ['id','nama','jenis','alamat','pimpinan','status_operasional','foto']);
  ensureSheet('PraktikMandiri', ['id','nama','profesi','sip','alamat','kontak','foto']);
  ensureSheet('DokterSpesialis', ['id','nama','spesialisasi','sip','fasyankes_mitra','jadwal','foto']);
  ensureSheet('KotakSaran', ['id','nama','email','saran','tanggal']);
  ensureSheet('AuditTrail', ['timestamp','action','by','username','role','module','record_id','payload']);
  ensureSheet('AdminUsers', ['username','password','role','nama','email']);

  var adminSheet = getSheet('AdminUsers');
  if (adminSheet.getLastRow() < 2) {
    adminSheet.appendRow(['superadmin','simandakes123','Super Admin','Super Admin','']);
    adminSheet.appendRow(['sdmk','sdmk123','Admin SDMK','Admin SDMK','']);
    adminSheet.appendRow(['fasyankes','fasyankes123','Admin Fasyankes','Admin Fasyankes','']);
    adminSheet.appendRow(['praktik','praktik123','Admin Praktik','Admin Praktik','']);
  }

  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty(SCRIPT_PROP_KEY)) {
    props.setProperty(SCRIPT_PROP_KEY, '');
  }
}