'use client';

// =============================================================
// nakes-photo.tsx — banner FOTO PROFIL untuk bagian atas kartu
// praktik mandiri & header dialog profil. Fallback anggun ke
// inisial berwarna bila foto tidak tersedia / gagal dimuat.
// =============================================================

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { getProfesiConfig } from './profesi';

interface NakesPhotoBannerProps {
  nama: string;
  jenis: string;
  fotoUrl?: string | null;
  /** kelas tinggi banner, mis. 'h-44 sm:h-48' */
  className?: string;
  /** posisi fokus vertikal gambar (CSS object-position) */
  focus?: string;
  /** overlay gradasi gelap di bawah agar teks putih terbaca */
  overlay?: boolean;
  /** huruf inisial lebih besar (untuk dialog) */
  large?: boolean;
  /** bila diisi, banner bisa diklik untuk memperbesar foto (dialog) */
  onZoom?: () => void;
  /** elemen overlay tambahan (badge, nama, dsb) */
  children?: ReactNode;
}

export function NakesPhotoBanner({
  nama,
  jenis,
  fotoUrl,
  className,
  focus = 'center 22%',
  overlay = false,
  large = false,
  onZoom,
  children,
}: NakesPhotoBannerProps) {
  const config = getProfesiConfig(jenis);
  const [imgFailed, setImgFailed] = useState(false);
  const hasFoto = typeof fotoUrl === 'string' && fotoUrl.trim() !== '';
  const showImage = hasFoto && !imgFailed;

  const initials = (nama || '??')
    .split(' ')
    .map((w) => w.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn('relative w-full overflow-hidden', className)}
      style={{ background: `linear-gradient(135deg, ${config.bg}, #ffffff)` }}
    >
      {showImage ? (
        <img
          src={fotoUrl as string}
          alt={`Foto ${nama}`}
          loading="lazy"
          className="h-full w-full object-cover"
          style={{ objectPosition: focus }}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center" aria-hidden>
          <span
            className={cn(
              'font-bold tracking-wider',
              large ? 'text-6xl sm:text-7xl' : 'text-4xl sm:text-5xl'
            )}
            style={{ color: config.color }}
          >
            {initials}
          </span>
        </div>
      )}

      {overlay ? (
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-black/5"
          aria-hidden
        />
      ) : null}

      {onZoom && showImage ? (
        <button
          type="button"
          onClick={onZoom}
          className="absolute inset-0 h-full w-full cursor-zoom-in"
          aria-label={`Perbesar foto ${nama}`}
          title="Klik untuk memperbesar foto"
        />
      ) : null}

      {children}
    </div>
  );
}
