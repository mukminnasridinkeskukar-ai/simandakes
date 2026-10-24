'use client';

// =============================================================
// pelayanan-view.tsx — ONE parameterized component used by all
// 13 "Cari ..." views. Data comes from /api/nakes (via react-query)
// and is filtered client-side for instant UX.
// =============================================================

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, MapPin, Phone, RotateCcw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fetchNakes, fetchStats } from '../api';
import { getProfesiConfig, getStatusBadge, PROFESI_QUICK_STATS } from '../profesi';
import { EmptyState } from '../empty-state';
import { NakesAvatar } from '../nakes-avatar';
import { NakesDetailDialog } from '../nakes-detail-dialog';
import { CardGridSkeleton } from '../view-skeleton';
import { useSimandakesStore, type StatusFilter } from '../store';
import type { Nakes, ViewId } from '../types';
import { cn } from '@/lib/utils';

export interface PelayananViewProps {
  /** the current view id (for quick-stats highlighting) */
  viewId: ViewId;
  /** exact Nakes.jenis values to show */
  jenisList: string[];
  title: string;
  subtitle: string;
  emoji: string;
  primaryColor: string;
  bgColor: string;
}

export function PelayananView({ viewId, jenisList, title, subtitle, emoji, primaryColor, bgColor }: PelayananViewProps) {
  const search = useSimandakesStore((s) => s.search);
  const setSearch = useSimandakesStore((s) => s.setSearch);
  const statusFilter = useSimandakesStore((s) => s.statusFilter);
  const setStatusFilter = useSimandakesStore((s) => s.setStatusFilter);
  const setView = useSimandakesStore((s) => s.setView);

  // Local input with 300ms debounce → store.search (no page refresh).
  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput, setSearch]);

  const { data: allNakes, isLoading } = useQuery({ queryKey: ['nakes'], queryFn: fetchNakes });
  const { data: stats } = useQuery({ queryKey: ['stats'], queryFn: fetchStats });

  const [selected, setSelected] = useState<Nakes | null>(null);

  const jenisSet = useMemo(() => new Set(jenisList), [jenisList]);

  const filtered = useMemo(() => {
    const list = allNakes ?? [];
    const q = search.trim().toLowerCase();
    return list.filter((n) => {
      if (!jenisSet.has(n.jenis)) return false;
      if (statusFilter !== 'semua' && n.status !== statusFilter) return false;
      if (q) {
        const hay = `${n.nama} ${n.spesialisasi ?? ''} ${n.alamatPraktik ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allNakes, jenisSet, statusFilter, search]);

  const aktifCount = filtered.filter((n) => n.status === 'aktif').length;

  function resetFilters() {
    setSearchInput('');
    setSearch('');
    setStatusFilter('semua');
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* ---------- Header row ---------- */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div
            className="flex size-14 shrink-0 items-center justify-center rounded-2xl text-2xl"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
              boxShadow: `0 4px 12px ${primaryColor}33`,
            }}
            aria-hidden
          >
            {emoji}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold text-gray-900 sm:text-2xl">{title}</h2>
            <p className="truncate text-sm text-gray-500">{subtitle}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="rounded-xl px-5 py-2 text-center" style={{ background: bgColor }}>
            <p className="text-xl leading-tight font-bold sm:text-2xl" style={{ color: primaryColor }}>
              {isLoading ? '…' : filtered.length}
            </p>
            <p className="text-[11px] text-gray-500">Total</p>
          </div>
          <div className="rounded-xl bg-emerald-100 px-5 py-2 text-center">
            <p className="text-xl leading-tight font-bold text-emerald-600 sm:text-2xl">
              {isLoading ? '…' : aktifCount}
            </p>
            <p className="text-[11px] text-gray-500">Aktif</p>
          </div>
        </div>
      </div>

      {/* ---------- Quick stats strip (12 profesi, clickable) ---------- */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {PROFESI_QUICK_STATS.map((entry) => {
          const active = entry.view === viewId;
          const count = stats ? stats.perJenis[entry.jenis] ?? 0 : null;
          return (
            <button
              key={entry.view}
              type="button"
              onClick={() => setView(entry.view)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'rounded-xl border bg-white p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
                active ? 'border-transparent' : 'border-gray-100'
              )}
              style={active ? { borderLeft: `4px solid ${entry.color}`, background: entry.bg } : undefined}
            >
              <p className="truncate text-[11px] font-medium text-gray-500">
                {entry.emoji} {entry.label}
              </p>
              <p className="mt-0.5 text-xl font-bold tabular-nums" style={{ color: entry.color }}>
                {count ?? '—'}
              </p>
            </button>
          );
        })}
      </div>

      {/* ---------- Search & filter (no refresh, client-side) ---------- */}
      <Card className="border-gray-100 shadow-sm">
        <CardContent className="flex flex-wrap items-center gap-3 p-4 sm:p-5">
          <div className="relative min-w-[240px] flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-gray-400"
              aria-hidden
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari nama, spesialisasi, atau alamat..."
              aria-label="Cari tenaga kesehatan"
              className="h-11 w-full rounded-xl border border-gray-200 pr-4 pl-11 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="h-11 w-[180px] rounded-xl" aria-label="Filter status">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Status</SelectItem>
              <SelectItem value="aktif">✅ Aktif</SelectItem>
              <SelectItem value="nonaktif">⏸️ Nonaktif</SelectItem>
              <SelectItem value="cuti">🌴 Cuti</SelectItem>
              <SelectItem value="keluar">🚪 Keluar</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={resetFilters}
            className="h-11 rounded-xl px-5"
            title="Reset pencarian"
          >
            <RotateCcw className="size-4" aria-hidden />
            Reset
          </Button>
        </CardContent>
      </Card>

      {/* ---------- Results info ---------- */}
      {!isLoading ? (
        <p className="px-1 text-sm text-gray-500">
          Menampilkan <strong style={{ color: primaryColor }}>{filtered.length}</strong> data{' '}
          {viewId === 'cari-praktik' ? 'Nakes' : title.replace('Cari ', '')}
          {aktifCount > 0 ? <span className="text-emerald-600"> • {aktifCount} aktif</span> : null}
          {filtered.length > 0 ? <span className="text-gray-400"> • Klik kartu untuk detail</span> : null}
        </p>
      ) : null}

      {/* ---------- Cards grid ---------- */}
      {isLoading ? (
        <CardGridSkeleton count={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          emoji={emoji}
          title="Data Tidak Ditemukan"
          message={`Tidak ada data ${viewId === 'cari-praktik' ? 'tenaga kesehatan' : title.replace('Cari ', '')} yang sesuai dengan pencarian atau filter. Coba ubah kata kunci.`}
          action={
            <Button variant="outline" onClick={resetFilters}>
              <RotateCcw className="size-4" aria-hidden />
              Reset Pencarian
            </Button>
          }
        />
      ) : (
        <div className="stagger-fade-up grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
          {filtered.map((n) => {
            const config = getProfesiConfig(n.jenis);
            const statusBadge = getStatusBadge(n.status);
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => setSelected(n)}
                className="group overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-sm transition-all hover:-translate-y-1 hover:border-gray-200 hover:shadow-lg"
                style={{ ['--accent' as string]: config.color }}
                title={`Klik untuk lihat detail ${config.label}`}
              >
                {/* Card top: avatar + badges */}
                <div
                  className="flex items-center gap-3.5 px-5 pt-5 pb-3"
                  style={{ background: `linear-gradient(135deg, ${config.bg}, #ffffff)` }}
                >
                  <NakesAvatar nama={n.nama} jenis={n.jenis} fotoUrl={n.fotoUrl} status={n.status} size={64} />
                  <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
                    <span
                      className="inline-flex max-w-full items-center truncate rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{ background: config.bg, color: config.color }}
                    >
                      {config.icon} {config.label}
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                        statusBadge.className
                      )}
                    >
                      <span className={cn('size-1.5 rounded-full', statusBadge.dotClassName)} aria-hidden />
                      {statusBadge.label}
                    </span>
                  </div>
                </div>

                {/* Card body */}
                <div className="px-5 pt-3 pb-4">
                  <h3 className="truncate text-base font-semibold text-gray-900">{n.nama || 'Tanpa Nama'}</h3>
                  <p className="mt-0.5 truncate text-sm font-medium" style={{ color: config.color }}>
                    {n.spesialisasi || '-'}
                  </p>
                  <div className="mt-3 space-y-1.5 text-xs text-gray-500">
                    <p className="flex items-center gap-2">
                      <MapPin className="size-3.5 shrink-0 text-gray-400" aria-hidden />
                      <span className="truncate">{n.alamatPraktik || '-'}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <CalendarDays className="size-3.5 shrink-0 text-gray-400" aria-hidden />
                      <span className="truncate">{n.jadwalPraktik || '-'}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="size-3.5 shrink-0 text-gray-400" aria-hidden />
                      <span className="truncate">{n.noTelepon || '-'}</span>
                    </p>
                  </div>
                </div>

                {/* Card footer hint */}
                <div className="border-t border-gray-100 bg-gray-50 py-2.5 text-center text-[11px] text-gray-400 transition-colors group-hover:text-gray-500">
                  👆 Klik untuk detail lengkap
                </div>
              </button>
            );
          })}
        </div>
      )}

      <NakesDetailDialog
        nakes={selected}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </div>
  );
}
