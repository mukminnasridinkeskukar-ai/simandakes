'use client';

// =============================================================
// empty-state.tsx — shared empty / error state card.
// =============================================================

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  /** Emoji shown inside the icon tile */
  emoji?: string;
  title: string;
  message: string;
  /** Optional action row (e.g. a Reset button) */
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ emoji = '📭', title, message, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex min-h-[320px] items-center justify-center', className)}>
      <div className="animate-fade-in-up w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex size-20 items-center justify-center rounded-2xl bg-emerald-50 text-4xl" aria-hidden>
          {emoji}
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">{message}</p>
        {action ? <div className="mt-5 flex flex-wrap justify-center gap-3">{action}</div> : null}
      </div>
    </div>
  );
}
