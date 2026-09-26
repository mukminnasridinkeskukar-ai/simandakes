// =============================================================
// SIMANDAKES - Nhost Serverless Function: Sync dari Google Sheets
// Endpoint: POST /api/sync-google-sheets
//
// Body: { "sheet": "DataNakes" | "Named" | "Nakes" | "Users" }
// Response 200: { "success": true, "synced": <count> }
//
// Catatan:
//   - Dipakai untuk migrasi awal dari Google Sheets ke Nhost Postgres
//   - Setelah migrasi selesai, function ini bisa dihapus
// =============================================================

export default async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { sheet } = req.body || {};

  // Validasi nama sheet
  const allowedSheets = ['DataNakes', 'Named', 'Nakes', 'Users'];
  if (!allowedSheets.includes(sheet)) {
    return res.status(400).json({
      success: false,
      error: `Sheet tidak valid. Pilih salah satu: ${allowedSheets.join(', ')}`,
    });
  }

  const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;
  if (!SPREADSHEET_ID) {
    return res.status(500).json({
      success: false,
      error: 'GOOGLE_SHEETS_ID belum diset di environment variables',
    });
  }

  try {
    // Fetch CSV dari Google Sheets
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`;
    const csvRes = await fetch(csvUrl);
    if (!csvRes.ok) {
      return res.status(502).json({
        success: false,
        error: `Gagal fetch Google Sheets: HTTP ${csvRes.status}`,
      });
    }

    const csvText = await csvRes.text();
    const rows = parseCSV(csvText);

    if (rows.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Sheet kosong atau hanya berisi header',
      });
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);

    // Map ke struktur Nhost
    let targetTable;
    let mutationName;
    let objects;

    switch (sheet) {
      case 'DataNakes':
        targetTable = 'data_nakes';
        mutationName = 'insert_data_nakes';
        objects = dataRows.map((row) => ({
          legacy_id: row[0] || null,
          nama: row[1] || 'Tanpa Nama',
          jenis: row[2] || 'Tenaga Kesehatan Lainnya',
          spesialisasi: row[3] || null,
          str: row[4] || null,
          sip: row[5] || null,
          alamat_praktik: row[6] || null,
          jadwal_praktik: row[7] || null,
          no_telepon: row[8] || null,
          email: row[9] || null,
          status: row[10] || 'aktif',
          foto_url: row[11] || null,
          alamat_google_maps: row[12] || null,
        }));
        break;
      case 'Named':
        targetTable = 'institusi_named';
        mutationName = 'insert_institusi_named';
        objects = dataRows.map((row) => ({
          legacy_id: row[0] || null,
          nama: row[1] || 'Tanpa Nama',
          tipe: row[2] || 'Lainnya',
          dokter: parseInt(row[3]) || 0,
          dokter_gigi: parseInt(row[4]) || 0,
          total: parseInt(row[5]) || 0,
          persentase: row[6] || '0',
        }));
        break;
      case 'Nakes':
        targetTable = 'institusi_nakes';
        mutationName = 'insert_institusi_nakes';
        objects = dataRows.map((row) => ({
          legacy_id: row[0] || null,
          institusi: row[1] || 'Tanpa Nama',
          tipe: row[2] || 'Lainnya',
          perawat: parseInt(row[3]) || 0,
          bidan: parseInt(row[4]) || 0,
          apoteker: parseInt(row[5]) || 0,
          lainnya: parseInt(row[6]) || 0,
          total: parseInt(row[7]) || 0,
        }));
        break;
      case 'Users':
        return res.status(400).json({
          success: false,
          error: 'Sync Users tidak diizinkan via endpoint ini. Buat user manual via Nhost Console.',
        });
    }

    // Bulk insert ke Nhost via Hasura GraphQL
    const hasuraRes = await fetch(
      `${process.env.NHOST_BACKEND_URL}/v1/graphql`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': process.env.NHOST_ADMIN_SECRET,
        },
        body: JSON.stringify({
          query: `
            mutation Sync${targetTable}($objects: [${targetTable}_insert_input!]!) {
              ${mutationName}(objects: $objects, on_conflict: { constraint: ${targetTable}_legacy_id_key, update_columns: [nama, updated_at] }) {
                affected_rows
                returning { id }
              }
            }
          `,
          variables: { objects },
        }),
      }
    );

    const result = await hasuraRes.json();

    if (result.errors) {
      console.error('Hasura errors:', result.errors);
      return res.status(500).json({
        success: false,
        error: 'Gagal insert ke database',
        details: result.errors,
      });
    }

    const affected = result.data?.[mutationName]?.affected_rows || 0;

    return res.status(200).json({
      success: true,
      sheet,
      target_table: targetTable,
      synced: affected,
      total_rows: dataRows.length,
    });
  } catch (error) {
    console.error('Sync error:', error);
    return res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan server: ' + error.message,
    });
  }
};

// =============================================================
// Helper: CSV parser sederhana (handles quoted fields)
// =============================================================
function parseCSV(text) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\n' || char === '\r') {
        if (currentField || currentRow.length > 0) {
          currentRow.push(currentField.trim());
          rows.push(currentRow);
          currentRow = [];
          currentField = '';
        }
        // Skip \r\n
        if (char === '\r' && nextChar === '\n') i++;
      } else {
        currentField += char;
      }
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }

  return rows;
}
