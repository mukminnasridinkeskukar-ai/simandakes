// ============================================================
// Nhost Serverless Function: export-csv
// ============================================================
// Endpoint: GET /functions/export-csv?type=nakes|institusi|platform_links|users
// Mengembalikan file CSV yang langsung di-download browser.
// ============================================================

import { createClient } from 'https://esm.sh/@nhost/nhost-js@latest';

const NHOST_URL = Deno.env.get('NHOST_URL') || '';

function escapeCSV(value: any): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

function objectsToCSV(objects: Record<string, any>[]): string {
    if (objects.length === 0) return '';
    const headers = Object.keys(objects[0]);
    const lines = [headers.join(',')];
    for (const obj of objects) {
        lines.push(headers.map(h => escapeCSV(obj[h])).join(','));
    }
    return lines.join('\n');
}

const QUERIES: Record<string, string> = {
    nakes: `query { nakes(order_by: {updated_at: desc}) {
        id nama jenis spesialisasi str sip alamat_praktik jadwal_praktik
        no_telepon email status foto_url maps_url created_at updated_at
    } }`,
    institusi: `query { institusi(order_by: {updated_at: desc}) {
        id nama tipe dokter_count dokter_gigi_count perawat_count
        bidan_count apoteker_count lainnya_count created_at updated_at
    } }`,
    platform_links: `query { platform_links(order_by: {sort_order: asc}) {
        id title subtitle description icon_key color bg_color url category status
    } }`,
    users: `query { user_profiles(order_by: {nama: asc}) {
        id username nama role status last_login
    } }`,
};

export default async (req: Request): Promise<Response> => {
    try {
        const url = new URL(req.url);
        const type = url.searchParams.get('type');

        if (!type || !QUERIES[type]) {
            return new Response(JSON.stringify({
                error: `Parameter ?type= wajib. Pilihan: ${Object.keys(QUERIES).join(', ')}`
            }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const auth = req.headers.get('Authorization');
        if (!auth || !auth.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401, headers: { 'Content-Type': 'application/json' }
            });
        }
        const token = auth.replace('Bearer ', '');

        const nhost = createClient({ url: NHOST_URL });
        const { data, error } = await nhost.graphql.request(QUERIES[type], {}, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (error) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500, headers: { 'Content-Type': 'application/json' }
            });
        }

        const rows = data[type] || [];
        const csv = objectsToCSV(rows);

        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
        const filename = `${type}_${timestamp}.csv`;

        return new Response(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });

    } catch (error) {
        console.error('Export error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500, headers: { 'Content-Type': 'application/json' }
        });
    }
};
