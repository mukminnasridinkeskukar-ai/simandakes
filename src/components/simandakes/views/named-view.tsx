'use client';

// =============================================================
// named-view.tsx — Dashboard > Named (institusi tenaga medis).
// =============================================================

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchNamed } from '../api';
import { getInstitusiIcon } from '../profesi';
import { EmptyState } from '../empty-state';
import { InstitusiDetailDialog } from '../institusi-detail-dialog';
import { StatCard } from '../stat-card';
import { CardGridSkeleton, StatsRowSkeleton } from '../view-skeleton';
import type { InstitusiNamed } from '../types';
import { Button } from '@/components/ui/button';

export function NamedView() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['named'],
    queryFn: fetchNamed,
  });
  const [selected, setSelected] = useState<InstitusiNamed | null>(null);

  const totals = useMemo(() => {
    const list = data ?? [];
    const dokter = list.reduce((sum, i) => sum + (i.dokter || 0), 0);
    const dokterGigi = list.reduce((sum, i) => sum + (i.dokterGigi || 0), 0);
    return { dokter, dokterGigi, medis: dokter + dokterGigi, count: list.length };
  }, [data]);

  const selectedPersentase = useMemo(() => {
    if (!selected || totals.medis === 0) return 0;
    return ((selected.dokter + selected.dokterGigi) / totals.medis) * 100;
  }, [selected, totals.medis]);

  const list = data ?? [];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold sm:text-3xl">
          <span className="bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
            👨‍⚕️ Named
          </span>
        </h2>
        <p className="mt-1 text-sm text-gray-500 sm:text-base">
          Data Tenaga Medis (Dokter &amp; Dokter Gigi) Per Institusi Kesehatan
        </p>
        {!isLoading && list.length > 0 ? (
          <p className="mt-1 text-xs text-gray-400">
            📊 {totals.count} institusi • Klik kartu untuk detail
          </p>
        ) : null}
      </div>

      {/* Summary stats */}
      {isLoading ? (
        <StatsRowSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Dokter" value={totals.dokter} color="#4f46e5" bgColor="#eef2ff" icon="👨‍⚕️" />
          <StatCard label="Total Dokter Gigi" value={totals.dokterGigi} color="#0891b2" bgColor="#cffafe" icon="🦷" />
          <StatCard label="Total Tenaga Medis" value={totals.medis} color="#059669" bgColor="#d1fae5" icon="🏥" />
          <StatCard label="Jumlah Institusi" value={totals.count} color="#f59e0b" bgColor="#fef3c7" icon="📋" />
        </div>
      )}

      {/* Error */}
      {isError ? (
        <EmptyState
          emoji="⚠️"
          title="Gagal memuat data"
          message={error instanceof Error ? error.message : 'Terjadi kesalahan saat mengambil data institusi.'}
          action={
            <Button variant="outline" onClick={() => void refetch()} disabled={isRefetching}>
              Coba Lagi
            </Button>
          }
        />
      ) : null}

      {/* Cards */}
      {isLoading ? (
        <CardGridSkeleton count={8} gridClassName="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" />
      ) : !isError && list.length === 0 ? (
        <EmptyState
          emoji="🏥"
          title="Data Belum Tersedia"
          message="Belum ada data institusi tenaga medis. Data akan tampil otomatis setelah tersedia di server."
        />
      ) : (
        <div className="stagger-fade-up grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((inst) => {
            const total = (inst.dokter || 0) + (inst.dokterGigi || 0);
            return (
              <button
                key={inst.id}
                type="button"
                onClick={() => setSelected(inst)}
                className="group flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white text-left shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
                title={`Klik untuk detail ${inst.nama}`}
              >
                <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-cyan-500" aria-hidden />
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className="flex size-11 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-50 to-cyan-50 text-xl"
                      aria-hidden
                    >
                      {getInstitusiIcon(inst.tipe)}
                    </div>
                    <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                      {inst.tipe}
                    </span>
                  </div>
                  <h3 className="mt-3 line-clamp-2 font-semibold text-gray-900">{inst.nama || 'Institusi Tanpa Nama'}</h3>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xl font-bold text-indigo-600 tabular-nums">{inst.dokter || 0}</p>
                      <p className="text-[11px] text-gray-500">Dokter</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-cyan-600 tabular-nums">{inst.dokterGigi || 0}</p>
                      <p className="text-[11px] text-gray-500">Dokter Gigi</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                    <span className="text-xs text-gray-500">Total Tenaga Medis</span>
                    <span className="text-sm font-bold text-emerald-600 tabular-nums">{total}</span>
                  </div>
                  <span className="mt-3 text-center text-[11px] text-gray-400 transition-colors group-hover:text-indigo-500">
                    👆 Klik untuk detail
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <InstitusiDetailDialog
        kind="named"
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        institusi={selected}
        persentase={selectedPersentase}
      />
    </div>
  );
}
