'use client';

// =============================================================
// nakes-detail-dialog.tsx — big profile dialog for a single
// Nakes (ported from openNakesProfileLightbox).
// =============================================================

import type { LucideIcon } from 'lucide-react';
import {
  Award,
  BadgeCheck,
  Building2,
  CalendarDays,
  FileText,
  Mail,
  MapPin,
  Navigation,
  Phone,
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

  const rows: DataRow[] = [
    { icon: Building2, label: 'Jenis Profesi', value: `${config.icon} ${config.label}`, accent: config.color },
    { icon: Sparkles, label: 'Spesialisasi', value: nakes.spesialisasi || '-', accent: config.color },
    { icon: FileText, label: 'No. STR', value: nakes.str || '-', accent: '#2563eb' },
    { icon: Award, label: 'No. SIP', value: nakes.sip || '-', accent: '#059669' },
    { icon: MapPin, label: 'Alamat Praktik', value: nakes.alamatPraktik || '-', accent: '#dc2626', full: true },
    { icon: CalendarDays, label: 'Jadwal Praktik', value: nakes.jadwalPraktik || '-', accent: '#f59e0b', full: true },
    { icon: Phone, label: 'Telepon', value: nakes.noTelepon || '-', accent: '#0891b2' },
    { icon: Mail, label: 'Email', value: nakes.email || '-', accent: '#7c3aed' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-h-[85vh] max-w-xl overflow-y-auto p-0 sm:max-w-xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Detail {nakes.nama}</DialogTitle>
          <DialogDescription>Informasi lengkap tenaga kesehatan</DialogDescription>
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
          </div>

          {nakes.alamatGoogleMaps ? (
            <Button
              type="button"
              className="mt-4 h-11 w-full bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto"
              onClick={() => window.open(nakes.alamatGoogleMaps as string, '_blank', 'noopener,noreferrer')}
            >
              <Navigation className="size-4" aria-hidden />
              Buka di Google Maps
            </Button>
          ) : null}
        </div>

        {/* Footer hint */}
        <div className="rounded-b-lg border-t bg-gray-50 px-6 py-3 text-center">
          <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
            <BadgeCheck className="size-3.5" aria-hidden />
            Data tenaga kesehatan terverifikasi SIMANDAKES
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
