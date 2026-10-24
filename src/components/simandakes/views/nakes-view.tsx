'use client';

// =============================================================
// nakes-view.tsx — Dashboard > Nakes (institusi tenaga kesehatan
// non-dokter: perawat, bidan, apoteker, lainnya).
// =============================================================

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { fetchInstitusiNakes } from '../api';
import { getInstitusiIcon } from '../profesi';
import { EmptyState } from '../empty-state';
import { InstitusiDetailDialog } from '../institusi-detail-dialog';
import { StatCard } from '../stat-card';
import { CardGridSkeleton, StatsRowSkeleton } from '../view-skeleton';
import type { InstitusiNakes } from '../types';

const COUNT_FIELDS = [
  { key: 'perawat', label: 'Perawat', color: '#ec4899' },
  { key: 'bidan', label: 'Bidan', color: '#db2777' },
  { key: 'apoteker', label: 'Apoteker', color: '#ca8a04' },
  { key: 'lainnya', label: 'Lainnya', color: '#6b7280' },
] as const;

export function NakesView() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['institusi-nakes'],
    queryFn: fetchInstitusiNakes,
  });
  const [selected, setSelected] = useState<InstitusiNakes | null>(null);

  const totals = useMemo(() => {
    const list = data ?? [];
    const perawat = list.reduce((sum, i) => sum + (i.perawat || 0), 0);
    const bidan = list.reduce((sum, i) => sum + (i.bidan || 0), 0);
    const apoteker = list.reduce((sum, i) => sum + (i.apoteker || 0), 0);
    const lainnya = list.reduce((sum, i) => sum + (i.lainnya || 0), 0);
    return { perawat, bidan, apoteker, lainnya, total: perawat + bidan + apoteker + lainnya, count: list.length };
  }, [data]);

  const selectedPersentase = useMemo(() => {
    if (!selected || totals.total === 0) return 0;
    const total =
      selected.perawat + selected.bidan + selected.apoteker + selected.lainnya;
    return (total / totals.total) * 100;
  }, [selected, totals.total]);

  const list = data ?? [];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold sm:text-3xl">
          <span className="bg-gradient-to-r from-pink-500 to-rose-600 bg-clip-text text-transparent">
            👩‍⚕️ Nakes
          </span>
        </h2>
        <p className="mt-1 text-sm text-gray-500 sm:text-base">
          Data Tenaga Kesehatan Non-Dokter Per Institusi Kesehatan
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
          <StatCard label="Total Perawat" value={totals.perawat} color="#ec4899" bgColor="#fce7f3" icon="💉" />
          <StatCard label="Total Bidan" value={totals.bidan} color="#db2777" bgColor="#fce7f3" icon="🤱" />
          <StatCard label="Total Apoteker" value={totals.apoteker} color="#ca8a04" bgColor="#fef9c3" icon="💊" />
          <StatCard label="Total Nakes" value={totals.total} color="#6b7280" bgColor="#f3f4f6" icon="🏥" />
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
          emoji="👩‍⚕️"
          title="Data Belum Tersedia"
          message="Belum ada data institusi tenaga kesehatan. Data akan tampil otomatis setelah tersedia di server."
        />
      ) : (
        <div className="stagger-fade-up grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((inst) => {
            const total = inst.perawat + inst.bidan + inst.apoteker + inst.lainnya;
            return (
              <button
                key={inst.id}
                type="button"
                onClick={() => setSelected(inst)}
                className="group flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white text-left shadow-sm transition-all hover:-translate-y-1 hover:border-pink-200 hover:shadow-lg"
                title={`Klik untuk detail ${inst.nama}`}
              >
                <div className="h-1 w-full bg-gradient-to-r from-pink-500 to-rose-500" aria-hidden />
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className="flex size-11 items-center justify-center rounded-lg bg-gradient-to-br from-pink-50 to-rose-50 text-xl"
                      aria-hidden
                    >
                      {getInstitusiIcon(inst.tipe)}
                    </div>
                    <span className="rounded-full border border-pink-200 bg-pink-50 px-2 py-0.5 text-[10px] font-medium text-pink-700">
                      {inst.tipe}
                    </span>
                  </div>
                  <h3 className="mt-3 line-clamp-2 font-semibold text-gray-900">{inst.nama || 'Institusi Tanpa Nama'}</h3>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {COUNT_FIELDS.map((field) => (
                      <div key={field.key}>
                        <p className="text-lg font-bold tabular-nums" style={{ color: field.color }}>
                          {inst[field.key] || 0}
                        </p>
                        <p className="text-[11px] text-gray-500">{field.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                    <span className="text-xs text-gray-500">Total Nakes</span>
                    <span className="text-sm font-bold text-pink-600 tabular-nums">{total}</span>
                  </div>
                  <span className="mt-3 text-center text-[11px] text-gray-400 transition-colors group-hover:text-pink-500">
                    👆 Klik untuk detail
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <InstitusiDetailDialog
        kind="nakes"
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
