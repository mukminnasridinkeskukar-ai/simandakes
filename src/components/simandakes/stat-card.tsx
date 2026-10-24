'use client';

// =============================================================
// stat-card.tsx — small summary stat card with accent border.
// =============================================================

import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: ReactNode;
  /** accent color (hex) for left border + value */
  color: string;
  /** light background hex for the icon tile */
  bgColor: string;
  /** emoji or lucide node inside the icon tile */
  icon?: ReactNode;
  loading?: boolean;
  className?: string;
}

export function StatCard({ label, value, color, bgColor, icon, loading = false, className }: StatCardProps) {
  return (
    <div
      className={cn('rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md', className)}
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-gray-500">{label}</p>
          {loading ? (
            <Skeleton className="mt-1.5 h-7 w-12" />
          ) : (
            <p className="mt-0.5 text-2xl font-bold tabular-nums" style={{ color }}>
              {value}
            </p>
          )}
        </div>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg text-lg" style={{ background: bgColor }} aria-hidden>
          {icon ?? '📊'}
        </div>
      </div>
    </div>
  );
}
