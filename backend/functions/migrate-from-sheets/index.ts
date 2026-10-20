// ============================================================
// Nhost Serverless Function: migrate-from-sheets
// ============================================================
// Endpoint: POST /functions/migrate-from-sheets
// Trigger: manual oleh admin (sekali saja, untuk migrasi data lama)
//
// Cara pakai:
//   curl -X POST https://YOUR-NHOST-URL/functions/migrate-from-sheets \
//     -H "Authorization: Bearer <ADMIN_JWT>" \
//     -H "Content-Type: application/json" \
//     -d '{"spreadsheetId":"1NLAY2J9...","sheets":["DataNakes","Named","Nakes"]}'
// ============================================================

import { createClient } from 'https://esm.sh/@nhost/nhost-js@latest';

const NHOST_URL = Deno.env.get('NHOST_URL') || '';
const NHOST_ADMIN_SECRET = Deno.env.get('NHOST_ADMIN_SECRET') || '';

interface MigrationRequest {
    spreadsheetId: string;
    sheets: string[];
}

async function fetchGoogleSheetsCSV(spreadsheetId: string, sheetName: string): Promise<string> {
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch sheet ${sheetName}: ${response.status}`);
    }
    return response.text();
}

function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i+1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += ch;
        }
    }
    result.push(current.trim());
    return result;
}

function csvToObjects(csv: string): Record<string, string>[] {
    const lines = csv.split('\n').filter(l => l.trim().length > 0);
    if (lines.length === 0) return [];
    const headers = parseCSVLine(lines[0]);
    return lines.slice(1).map(line => {
        const values = parseCSVLine(line);
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => {
            obj[h] = values[i] || '';
        });
        return obj;
    });
}

async function migrateDataNakes(admin: any, rows: Record<string, string>[]): Promise<number> {
    let count = 0;
    for (const row of rows) {
        try {
            await admin.graphql.request(`
                mutation InsertNakes($object: nakes_insert_input!) {
                    insert_nakes(object: $object) { id }
                }
            `, {
                object: {
                    nama: row.nama || row.Nama || '',
                    jenis: (row.jenis || row.Jenis || 'lainnya').toLowerCase(),
                    spesialisasi: row.spesialisasi || row.Spesialisasi || null,
                    str: row.str || row.STR || null,
                    sip: row.sip || row.SIP || null,
                    alamat_praktik: row.alamat_praktik || row.Alamat || null,
                    jadwal_praktik: row.jadwal_praktik || row.Jadwal || null,
                    no_telepon: row.no_telepon || row.Telepon || null,
                    email: row.email || row.Email || null,
                    status: (row.status || 'aktif').toLowerCase(),
                    foto_url: row.foto || row.Foto || null,
                    maps_url: row.alamat_google_maps || row.Maps || null,
                }
            });
            count++;
        } catch (e) {
            console.error('Failed to insert nakes:', row.nama, e.message);
        }
    }
    return count;
}

async function migrateInstitusi(admin: any, namedRows: Record<string,string>[], nakesRows: Record<string,string>[]): Promise<number> {
    const institusiMap = new Map<string, any>();

    for (const row of namedRows) {
        const nama = (row.institusi || row.nama || '').trim();
        if (!nama) continue;
        if (!institusiMap.has(nama)) {
            institusiMap.set(nama, {
                nama,
                tipe: (row.tipe || 'Lainnya'),
                dokter_count: parseInt(row.dokter || '0', 10) || 0,
                dokter_gigi_count: parseInt(row.doktergigi || row.dokterGigi || '0', 10) || 0,
                perawat_count: 0,
                bidan_count: 0,
                apoteker_count: 0,
                lainnya_count: 0,
            });
        } else {
            const inst = institusiMap.get(nama);
            inst.dokter_count += parseInt(row.dokter || '0', 10) || 0;
            inst.dokter_gigi_count += parseInt(row.doktergigi || '0', 10) || 0;
        }
    }

    for (const row of nakesRows) {
        const nama = (row.institusi || row.nama || '').trim();
        if (!nama) continue;
        if (!institusiMap.has(nama)) {
            institusiMap.set(nama, {
                nama,
                tipe: (row.tipe || 'Lainnya'),
                dokter_count: 0,
                dokter_gigi_count: 0,
                perawat_count: parseInt(row.perawat || '0', 10) || 0,
                bidan_count: parseInt(row.bidan || '0', 10) || 0,
                apoteker_count: parseInt(row.apoteker || '0', 10) || 0,
                lainnya_count: parseInt(row.lainnya || '0', 10) || 0,
            });
        } else {
            const inst = institusiMap.get(nama);
            inst.perawat_count += parseInt(row.perawat || '0', 10) || 0;
            inst.bidan_count += parseInt(row.bidan || '0', 10) || 0;
            inst.apoteker_count += parseInt(row.apoteker || '0', 10) || 0;
            inst.lainnya_count += parseInt(row.lainnya || '0', 10) || 0;
        }
    }

    let count = 0;
    for (const inst of institusiMap.values()) {
        try {
            await admin.graphql.request(`
                mutation InsertInstitusi($object: institusi_insert_input!) {
                    insert_institusi(object: $object) { id }
                }
            `, { object: inst });
            count++;
        } catch (e) {
            console.error('Failed to insert institusi:', inst.nama, e.message);
        }
    }
    return count;
}

export default async (req: Request): Promise<Response> => {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const body: MigrationRequest = await req.json();
        const { spreadsheetId, sheets } = body;

        if (!spreadsheetId || !sheets || !sheets.length) {
            return new Response(JSON.stringify({ error: 'spreadsheetId & sheets wajib diisi' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const admin = createClient({ url: NHOST_URL, adminSecret: NHOST_ADMIN_SECRET });

        const results: Record<string, number> = {};
        let namedRows: Record<string,string>[] = [];
        let nakesRows: Record<string,string>[] = [];

        for (const sheetName of sheets) {
            console.log(`Migrating sheet: ${sheetName}...`);
            const csv = await fetchGoogleSheetsCSV(spreadsheetId, sheetName);
            const rows = csvToObjects(csv);
            console.log(`  Parsed ${rows.length} rows`);

            if (sheetName === 'DataNakes') {
                results.nakes = await migrateDataNakes(admin, rows);
            } else if (sheetName === 'Named') {
                namedRows = rows;
            } else if (sheetName === 'Nakes') {
                nakesRows = rows;
            }
        }

        if (namedRows.length > 0 || nakesRows.length > 0) {
            results.institusi = await migrateInstitusi(admin, namedRows, nakesRows);
        }

        return new Response(JSON.stringify({
            success: true,
            migrated: results,
            timestamp: new Date().toISOString(),
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Migration error:', error);
        return new Response(JSON.stringify({
            error: error.message,
            stack: error.stack,
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
