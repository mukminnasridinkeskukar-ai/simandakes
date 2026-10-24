'use client';

// =============================================================
// nakes-detail-dialog.tsx — big profile dialog for a single Nakes
// (PRAKTIK MANDIRI). Profil menampilkan Daftar Layanan + tombol
// pendaftaran ke platform e-Simantri (tanpa email/telepon).
// =============================================================

import type { LucideIcon } from 'lucide-react';
import {
  Award,
  BadgeCheck,
  Building2,
  CalendarDays,
  ExternalLink,
  FileText,
  Home,
  ListChecks,
  MapPin,
  Navigation,
  Sparkles,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Nakes } from './types';
import { getProfesiConfig, getStatusBadge } from './profesi';
import { NakesAvatar } from './nakes-avatar';
import { ESIMANTRI_LABEL, ESIMANTRI_URL, parseDaftarLayanan } from './config';
import { cn } from '@/lib/utils';

interface NakesDetailDialogProps {
  nakes: Nakes | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DataRow {
  icon: LucideIcon;
  label: string;
  value: string;
  accent: string;
  full?: boolean;
}

export function NakesDetailDialog({ nakes, open, onOpenChange }: NakesDetailDialogProps) {
  if (!nakes) return null;
  const config = getProfesiConfig(nakes.jenis);
  const statusBadge = getStatusBadge(nakes.status);
  const layanan = parseDaftarLayanan(nakes.daftarLayanan);

  const rows: DataRow[] = [
    { icon: Building2, label: 'Jenis Profesi', value: `${config.icon} ${config.label}`, accent: config.color },
    { icon: Sparkles, label: 'Spesialisasi', value: nakes.spesialisasi || '-', accent: config.color },
    { icon: FileText, label: 'No. STR', value: nakes.str || '-', accent: '#2563eb' },
    { icon: Award, label: 'No. SIP', value: nakes.sip || '-', accent: '#059669' },
    { icon: MapPin, label: 'Alamat Praktik', value: nakes.alamatPraktik || '-', accent: '#dc2626', full: true },
    { icon: CalendarDays, label: 'Jadwal Praktik', value: nakes.jadwalPraktik || '-', accent: '#f59e0b', full: true },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-h-[85vh] max-w-xl overflow-y-auto p-0 sm:max-w-xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Detail {nakes.nama}</DialogTitle>
          <DialogDescription>Informasi lengkap praktik mandiri tenaga kesehatan</DialogDescription>
        </DialogHeader>

        {/* Header with photo */}
        <div
          className="px-6 pt-8 pb-6 text-center"
          style={{ background: `linear-gradient(135deg, ${config.bg}, #ffffff)` }}
        >
          <NakesAvatar nama={nakes.nama} jenis={nakes.jenis} fotoUrl={nakes.fotoUrl} status={nakes.status} size={80} className="mx-auto" />
          <h2 className="mt-4 truncate text-2xl font-bold text-gray-900">{nakes.nama || 'Tanpa Nama'}</h2>
          <p className="mt-1 text-base font-medium" style={{ color: config.color }}>
            {nakes.spesialisasi || config.label}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
            >
              <Home className="size-3" aria-hidden />
              Praktik Mandiri
            </span>
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
              style={{ background: config.bg, color: config.color }}
            >
              {config.icon} {config.label}
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium',
                statusBadge.className
              )}
            >
              <span className={cn('size-1.5 rounded-full', statusBadge.dotClassName)} aria-hidden />
              {nakes.status === 'aktif' ? 'Praktik Aktif' : statusBadge.label}
            </span>
          </div>
        </div>

        {/* Body: detailed information grid */}
        <div className="px-6 pb-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {rows.map((row) => (
              <div
                key={row.label}
                className={cn('rounded-lg border border-gray-100 bg-gray-50/60 p-3', row.full && 'sm:col-span-2')}
                style={{ borderLeft: `3px solid ${row.accent}` }}
              >
                <p className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-gray-500 uppercase">
                  <row.icon className="size-3.5" aria-hidden />
                  {row.label}
                </p>
                <p className="mt-1 text-sm leading-relaxed font-medium break-words text-gray-900">{row.value}</p>
              </div>
            ))}

            {/* Daftar Layanan (menggantikan email & telepon) */}
            <div className="rounded-lg border border-gray-100 bg-gray-50/60 p-3 sm:col-span-2" style={{ borderLeft: '3px solid #059669' }}>
              <p className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-gray-500 uppercase">
                <ListChecks className="size-3.5" aria-hidden />
                Daftar Layanan
              </p>
              {layanan.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {layanan.map((item) => (
                    <span
                      key={item}
                      className="inline-flex max-w-full items-center rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800"
                    >
                      <span className="truncate">{item}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-sm font-medium text-gray-400">Belum ada layanan yang didaftarkan</p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <Button
              type="button"
              className="h-11 w-full bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={() => window.open(ESIMANTRI_URL, '_blank', 'noopener,noreferrer')}
            >
              <ExternalLink className="size-4" aria-hidden />
              Daftar ke Praktik Mandiri
            </Button>
            {nakes.alamatGoogleMaps ? (
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                onClick={() => window.open(nakes.alamatGoogleMaps as string, '_blank', 'noopener,noreferrer')}
              >
                <Navigation className="size-4" aria-hidden />
                Buka di Google Maps
              </Button>
            ) : null}
          </div>
          <p className="mt-2 text-center text-[11px] text-gray-400 sm:text-left">
            Pendaftaran praktik mandiri diproses melalui platform {ESIMANTRI_LABEL}.
          </p>
        </div>

        {/* Footer hint */}
        <div className="rounded-b-lg border-t bg-gray-50 px-6 py-3 text-center">
          <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
            <BadgeCheck className="size-3.5" aria-hidden />
            Data praktik mandiri terverifikasi SIMANDAKES
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
