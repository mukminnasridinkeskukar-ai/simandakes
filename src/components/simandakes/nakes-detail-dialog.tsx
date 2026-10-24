'use client';

// =============================================================
// nakes-detail-dialog.tsx — dialog profil besar untuk satu Nakes
// (PRAKTIK MANDIRI). FOTO PROFIL tampil besar di header dialog
// dan dapat diklik untuk diperbesar (lightbox). Profil menampilkan
// Daftar Layanan + tombol pendaftaran ke platform e-Simantri
// (tanpa email/telepon).
// =============================================================

import { useState } from 'react';
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
  X,
  ZoomIn,
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
import { NakesPhotoBanner } from './nakes-photo';
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-h-[90vh] max-w-xl overflow-y-auto p-0 sm:max-w-xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Detail {nakes.nama}</DialogTitle>
          <DialogDescription>Informasi lengkap praktik mandiri tenaga kesehatan</DialogDescription>
        </DialogHeader>
        {/* key → state zoom di-reset saat ganti data / tutup dialog */}
        <ProfileBody key={nakes.id} nakes={nakes} />
      </DialogContent>
    </Dialog>
  );
}

function ProfileBody({ nakes }: { nakes: Nakes }) {
  const [zoomed, setZoomed] = useState(false);
  const config = getProfesiConfig(nakes.jenis);
  const statusBadge = getStatusBadge(nakes.status);
  const layanan = parseDaftarLayanan(nakes.daftarLayanan);
  const hasFoto = typeof nakes.fotoUrl === 'string' && nakes.fotoUrl.trim() !== '';

  const rows: DataRow[] = [
    { icon: Building2, label: 'Jenis Profesi', value: `${config.icon} ${config.label}`, accent: config.color },
    { icon: Sparkles, label: 'Spesialisasi', value: nakes.spesialisasi || '-', accent: config.color },
    { icon: FileText, label: 'No. STR', value: nakes.str || '-', accent: '#2563eb' },
    { icon: Award, label: 'No. SIP', value: nakes.sip || '-', accent: '#059669' },
    { icon: MapPin, label: 'Alamat Praktik', value: nakes.alamatPraktik || '-', accent: '#dc2626', full: true },
    { icon: CalendarDays, label: 'Jadwal Praktik', value: nakes.jadwalPraktik || '-', accent: '#f59e0b', full: true },
  ];

  return (
    <>
      {/* FOTO PROFIL BESAR — header dialog, klik untuk memperbesar */}
      <NakesPhotoBanner
        nama={nakes.nama}
        jenis={nakes.jenis}
        fotoUrl={nakes.fotoUrl}
        className="h-56 sm:h-64"
        overlay
        large
        onZoom={hasFoto ? () => setZoomed(true) : undefined}
      >
        {hasFoto ? (
          <span className="pointer-events-none absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
            <ZoomIn className="size-3" aria-hidden />
            Klik untuk perbesar
          </span>
        ) : null}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 px-5 pt-10 pb-5 text-center">
          <h2 className="truncate text-2xl font-bold text-white drop-shadow-sm">{nakes.nama || 'Tanpa Nama'}</h2>
          <p className="mt-0.5 truncate text-sm font-medium text-white/90 drop-shadow-sm">
            {nakes.spesialisasi || config.label}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-emerald-600/90 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              <Home className="size-3" aria-hidden />
              Praktik Mandiri
            </span>
            <span
              className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-medium backdrop-blur-sm"
              style={{ color: config.color }}
            >
              {config.icon} {config.label}
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-sm',
                statusBadge.className
              )}
            >
              <span className={cn('size-1.5 rounded-full', statusBadge.dotClassName)} aria-hidden />
              {nakes.status === 'aktif' ? 'Praktik Aktif' : statusBadge.label}
            </span>
          </div>
        </div>
      </NakesPhotoBanner>

      {/* Body: detailed information grid */}
      <div className="px-6 pt-5 pb-6">
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

      {/* Lightbox: foto profil diperbesar (nested dialog → fokus trap + Esc + portal sendiri) */}
      <Dialog open={zoomed} onOpenChange={setZoomed}>
        <DialogContent
          aria-describedby={undefined}
          showCloseButton={false}
          className="w-auto max-w-none border-0 bg-transparent p-0 shadow-none"
          onClick={() => setZoomed(false)}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Foto {nakes.nama || 'Tanpa Nama'}</DialogTitle>
            <DialogDescription>Foto profil praktik mandiri diperbesar</DialogDescription>
          </DialogHeader>
          <figure className="flex flex-col items-center gap-4 rounded-3xl bg-gray-950/95 p-4 ring-1 ring-white/10 sm:p-6">
            <img
              src={nakes.fotoUrl as string}
              alt={`Foto ${nakes.nama}`}
              className="max-h-[70vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
            />
            <figcaption className="flex items-center gap-3">
              <p className="max-w-[60vw] truncate text-sm font-medium text-white/85">{nakes.nama || 'Tanpa Nama'}</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomed(false);
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/25"
                aria-label="Tutup foto perbesar"
              >
                <X className="size-3.5" aria-hidden />
                Tutup
              </button>
            </figcaption>
            <p className="text-xs text-white/50">Klik di mana saja untuk menutup</p>
          </figure>
        </DialogContent>
      </Dialog>
    </>
  );
}
