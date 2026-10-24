'use client';

// =============================================================
// view-skeleton.tsx — loading skeletons (never blocking spinners).
// =============================================================

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/** Row of stat card skeletons (used by Named / Nakes dashboards). */
export function StatsRowSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-12" />
            </div>
            <Skeleton className="size-10 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Grid of card skeletons (used by institusi grids & pelayanan results). */
export function CardGridSkeleton({
  count = 6,
  className,
  gridClassName,
}: {
  count?: number;
  className?: string;
  gridClassName?: string;
}) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-3', gridClassName, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center gap-3 p-5">
            <Skeleton className="size-14 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <div className="space-y-2.5 p-5 pt-0">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Table skeleton (used by admin CRUD tables). */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 rounded-lg border bg-white p-4">
      <Skeleton className="h-9 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="hidden h-4 w-24 sm:block" />
          <Skeleton className="hidden h-4 w-16 md:block" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}
