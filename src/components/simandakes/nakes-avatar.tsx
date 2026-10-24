'use client';

// =============================================================
// nakes-avatar.tsx — photo with graceful fallback to a colored
// initials avatar (+ status dot). Uses plain <img> so remote
// fotoUrl works without next.config remote patterns.
// =============================================================

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { getProfesiConfig } from './profesi';

interface NakesAvatarProps {
  nama: string;
  jenis: string;
  fotoUrl?: string | null;
  status?: string;
  /** pixel size (square) */
  size?: number;
  className?: string;
}

export function NakesAvatar({ nama, jenis, fotoUrl, status, size = 56, className }: NakesAvatarProps) {
  const config = getProfesiConfig(jenis);
  const [imgFailed, setImgFailed] = useState(false);
  const initials = (nama || '??')
    .split(' ')
    .map((w) => w.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const hasFoto = typeof fotoUrl === 'string' && fotoUrl.trim() !== '';
  const showImage = hasFoto && !imgFailed;

  return (
    <div className={cn('relative shrink-0', className)} style={{ width: size, height: size }}>
      {showImage ? (
        // Plain <img>: remote fotoUrl may point anywhere; falls back to initials on error.
        <img
          src={fotoUrl as string}
          alt={`Foto ${nama}`}
          loading="lazy"
          className="h-full w-full rounded-full object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center rounded-full font-bold"
          style={{ background: config.bg, color: config.color, fontSize: Math.max(11, Math.round(size * 0.3)) }}
          aria-hidden
        >
          {initials}
        </div>
      )}
      {status ? (
        <span
          className={cn(
            'absolute right-0 bottom-0 block rounded-full border-2 border-white',
            status === 'aktif' ? 'bg-emerald-500' : 'bg-gray-400'
          )}
          style={{ width: Math.max(10, Math.round(size * 0.24)), height: Math.max(10, Math.round(size * 0.24)) }}
          title={status}
        />
      ) : null}
    </div>
  );
}
