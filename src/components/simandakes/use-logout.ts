'use client';

// =============================================================
// use-logout.ts — shared logout hook (sidebar, header, admin).
// =============================================================

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logout as logoutRequest } from './api';
import { useSimandakesStore } from './store';

export function useLogout() {
  const queryClient = useQueryClient();
  const setUser = useSimandakesStore((s) => s.setUser);

  return useCallback(async () => {
    try {
      await logoutRequest();
      toast.success('Anda telah keluar dari sistem.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal keluar dari sistem.');
    } finally {
      setUser(null);
      queryClient.setQueryData(['session'], null);
      void queryClient.invalidateQueries({ queryKey: ['session'] });
    }
  }, [queryClient, setUser]);
}
