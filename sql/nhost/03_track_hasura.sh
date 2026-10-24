#!/usr/bin/env bash
# ============================================================================
# SIMANDAKES — Track tabel Nhost di Hasura + set permission
# Perbaikan error F12:
#   [UNTRACKED_TABLE] data_nakes / institusi_named / institusi_nakes:
#   "field '...' not found in type: 'query_root'"
#
# Penyebab: tabel sudah dibuat di PostgreSQL Nhost, tapi BELUM DI-TRACK di
# metadata Hasura, sehingga tidak muncul di skema GraphQL (query_root).
#
# Cara pakai (ambil nilai dari Nhost Dashboard):
#   HASURA_ENDPOINT='https://<SUBDOMAIN>.hasura.<REGION>.nhost.run/v1/metadata' \
#   HASURA_ADMIN_SECRET='<admin secret dari Nhost Dashboard -> Hasura>' \
#   bash 03_track_hasura.sh
#
# Alternatif tanpa skrip (manual):
#   Nhost Dashboard -> Hasura Console -> Data -> database "default" -> public
#   -> klik "Track" pada: data_nakes, institusi_named, institusi_nakes
#   (permission anonymous/user bisa ditambahkan di tab Permissions)
#
# Yang dilakukan skrip ini (idempoten — aman dijalankan berulang):
#   1. pg_track_table untuk 3 tabel (menghilangkan UNTRACKED_TABLE)
#   2. SELECT permission untuk role `public` (WAJIB — aplikasi SIMANDAKES
#      mengirim request TANPA admin secret, jadi Hasura memakai role
#      unauthorized bawaan Nhost yaitu "public"), plus `anonymous` & `user`
#   3. INSERT/UPDATE permission untuk role `public` (fitur kelola data di
#      admin dashboard app.js) dan role `user`; DELETE hanya role `user`
#      (app.js memakai soft-delete via UPDATE deleted_at)
#   4. reload_metadata
#   5. Verifikasi: hitung data_nakes via GraphQL
# ============================================================================
set -uo pipefail

TABLES=(data_nakes institusi_named institusi_nakes)

: "${HASURA_ENDPOINT:?Set HASURA_ENDPOINT, contoh: https://<subdomain>.hasura.<region>.nhost.run/v1/metadata}"
: "${HASURA_ADMIN_SECRET:?Set HASURA_ADMIN_SECRET (Nhost Dashboard -> Hasura -> Env/Admin Secret)}"

meta() {
  curl -sS -X POST "$HASURA_ENDPOINT" \
    -H 'Content-Type: application/json' \
    -H "x-hasura-admin-secret: $HASURA_ADMIN_SECRET" \
    -d "$1"
}

run_op() {
  local desc="$1" payload="$2" resp
  resp="$(meta "$payload")"
  if echo "$resp" | grep -q '"error"'; then
    if echo "$resp" | grep -qiE 'already tracked|already exists'; then
      echo "SKIP : $desc (sudah ada)"
    else
      echo "GAGAL: $desc"
      echo "$resp"
      return 1
    fi
  else
    echo "OK   : $desc"
  fi
}

FAILED=0

echo "== 1/4 Track tabel =="
for t in "${TABLES[@]}"; do
  run_op "track public.$t" \
    "{\"type\":\"pg_track_table\",\"args\":{\"source\":\"default\",\"table\":{\"schema\":\"public\",\"name\":\"$t\"}}}" \
    || FAILED=1
done

echo "== 2/5 Permission SELECT (public + anonymous + user) =="
for t in "${TABLES[@]}"; do
  for r in public anonymous user; do
    run_op "select $r -> $t" \
      "{\"type\":\"pg_create_select_permission\",\"args\":{\"source\":\"default\",\"table\":{\"schema\":\"public\",\"name\":\"$t\"},\"role\":\"$r\",\"permission\":{\"columns\":\"*\",\"filter\":{},\"allow_aggregations\":true}}}" \
      || FAILED=1
  done
done

echo "== 3/5 Permission INSERT + UPDATE (public + user) — fitur kelola data app.js =="
for t in "${TABLES[@]}"; do
  for r in public user; do
    run_op "insert $r -> $t" \
      "{\"type\":\"pg_create_insert_permission\",\"args\":{\"source\":\"default\",\"table\":{\"schema\":\"public\",\"name\":\"$t\"},\"role\":\"$r\",\"permission\":{\"columns\":\"*\",\"check\":{}}}}" \
      || FAILED=1
    run_op "update $r -> $t" \
      "{\"type\":\"pg_create_update_permission\",\"args\":{\"source\":\"default\",\"table\":{\"schema\":\"public\",\"name\":\"$t\"},\"role\":\"$r\",\"permission\":{\"columns\":\"*\",\"filter\":{},\"check\":{}}}}" \
      || FAILED=1
  done
done

echo "== 4/5 Permission DELETE (user saja — app.js memakai soft-delete via update) =="
for t in "${TABLES[@]}"; do
  run_op "delete user -> $t" \
    "{\"type\":\"pg_create_delete_permission\",\"args\":{\"source\":\"default\",\"table\":{\"schema\":\"public\",\"name\":\"$t\"},\"role\":\"user\",\"permission\":{\"filter\":{}}}}" \
    || FAILED=1
done

echo "== 5/5 Reload metadata =="
run_op "reload_metadata" \
  '{"type":"reload_metadata","args":{"source":"default","reload_connections":true,"reload_remote_schemas":true}}' \
  || FAILED=1

echo
echo "== Verifikasi GraphQL =="
for t in "${TABLES[@]}"; do
  resp="$(meta "{\"type\":\"run_sql\",\"args\":{\"source\":\"default\",\"sql\":\"select count(*) from public.$t\"}}")"
  if echo "$resp" | grep -q '"error"'; then
    echo "GAGAL baca $t:"; echo "$resp"; FAILED=1
  else
    # ambil angka count dari hasil run_sql
    count="$(echo "$resp" | grep -oE '"result":\[\["count","[0-9]+"\]\]' | grep -oE '[0-9]+' | tail -1)"
    echo "public.$t : ${count:-?} baris"
  fi
done

if [ "$FAILED" -ne 0 ]; then
  echo; echo "Selesai dengan ERROR — periksa pesan di atas."
  exit 1
fi
echo
echo "Selesai. Field GraphQL kini tersedia di query_root:"
echo "  query { data_nakes(where: { deleted_at: { _is_null: true } }) { legacy_id nama jenis daftar_layanan foto_url } }"
echo "  -> refresh aplikasi Anda; error UNTRACKED_TABLE harusnya hilang."
