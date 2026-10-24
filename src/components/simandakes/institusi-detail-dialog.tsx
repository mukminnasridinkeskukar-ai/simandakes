'use client';

// =============================================================
// institusi-detail-dialog.tsx — detail dialog for InstitusiNamed
// & InstitusiNakes with progress bar (port of openNamedLightbox /
// openNakesLightbox).
// =============================================================

import type { LucideIcon } from 'lucide-react';
import { Building2, FileText, Stethoscope, Tag } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import type { InstitusiNamed, InstitusiNakes } from './types';
import { getInstitusiIcon } from './profesi';
import { cn } from '@/lib/utils';

interface InstitusiDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: 'named' | 'nakes';
  institusi: InstitusiNamed | InstitusiNakes | null;
  /** percentage of this institution's total relative to all institutions */
  persentase: number;
}

interface DetailRow {
  icon: LucideIcon;
  label: string;
  value: string;
  color: string;
  isBadge?: boolean;
  full?: boolean;
}

export function InstitusiDetailDialog({ open, onOpenChange, kind, institusi, persentase }: InstitusiDetailDialogProps) {
  if (!institusi) return null;

  const isNamed = kind === 'named';
  const named = isNamed ? (institusi as InstitusiNamed) : null;
  const nakes = isNamed ? null : (institusi as InstitusiNakes);

  const total = isNamed
    ? (named ? named.dokter + named.dokterGigi : 0)
    : (nakes ? nakes.perawat + nakes.bidan + nakes.apoteker + nakes.lainnya : 0);

  const rows: DetailRow[] = [
    {
      icon: Building2,
      label: 'Nama Institusi',
      value: institusi.nama || '-',
      color: isNamed ? '#4f46e5' : '#ec4899',
      full: true,
    },
    { icon: Tag, label: 'Tipe', value: institusi.tipe, color: isNamed ? '#0891b2' : '#db2777', isBadge: true },
  ];

  if (named) {
    rows.push(
      { icon: Stethoscope, label: 'Dokter', value: String(named.dokter), color: '#4f46e5' },
      { icon: FileText, label: 'Dokter Gigi', value: String(named.dokterGigi), color: '#0891b2' }
    );
  }
  if (nakes) {
    rows.push(
      { icon: Stethoscope, label: 'Perawat', value: String(nakes.perawat), color: '#ec4899' },
      { icon: FileText, label: 'Bidan', value: String(nakes.bidan), color: '#db2777' },
      { icon: FileText, label: 'Apoteker', value: String(nakes.apoteker), color: '#ca8a04' },
      { icon: FileText, label: 'Lainnya', value: String(nakes.lainnya), color: '#6b7280' }
    );
  }

  const progressGradient = isNamed
    ? '[&>div]:bg-gradient-to-r [&>div]:from-indigo-500 [&>div]:to-cyan-500'
    : '[&>div]:bg-gradient-to-r [&>div]:from-pink-500 [&>div]:to-rose-500';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader className="items-center text-center sm:items-center sm:text-center">
          <div
            className={cn(
              'mx-auto mb-1 flex size-16 items-center justify-center rounded-2xl text-3xl',
              isNamed ? 'bg-gradient-to-br from-indigo-50 to-cyan-50' : 'bg-gradient-to-br from-pink-50 to-rose-50'
            )}
            aria-hidden
          >
            {getInstitusiIcon(institusi.tipe)}
          </div>
          <DialogTitle className="text-xl font-bold">{institusi.nama || 'Institusi Tanpa Nama'}</DialogTitle>
          <DialogDescription>
            <span
              className={cn(
                'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium',
                isNamed ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-pink-200 bg-pink-50 text-pink-700'
              )}
            >
              {institusi.tipe}
            </span>
            {institusi.updatedAt ? (
              <span className="mt-1 block text-xs text-gray-400">
                Update: {new Date(institusi.updatedAt).toLocaleDateString('id-ID')}
              </span>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {rows.map((row) => (
            <div
              key={row.label}
              className={cn('rounded-lg border border-gray-100 bg-gray-50/60 p-3', row.full && 'sm:col-span-2')}
              style={{ borderLeft: `3px solid ${row.color}` }}
            >
              <p className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-gray-500 uppercase">
                <row.icon className="size-3.5" aria-hidden />
                {row.label}
              </p>
              <p className={cn('mt-1 text-sm font-semibold break-words', row.full ? 'text-gray-900' : 'text-xl')} style={row.full ? undefined : { color: row.color }}>
                {row.value}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-gray-50 p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">{isNamed ? 'Total Tenaga Medis' : 'Total Nakes'}</span>
            <span className="text-xl font-bold text-emerald-600">{total}</span>
          </div>
          <Progress value={Math.min(100, Math.max(0, persentase))} className={cn('h-2.5 bg-gray-200', progressGradient)} />
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {persentase.toFixed(1)}% dari total {isNamed ? 'tenaga medis' : 'nakes'} terdaftar
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
