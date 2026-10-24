'use client';

// =============================================================
// app-root.tsx — main client dispatcher.
// - view === 'landing' → LandingPage
// - otherwise          → DashboardShell
// - mounts the global LoginDialog
// - session: optimistic restore from localStorage, then always
//   confirmed via GET /api/auth/session (react-query).
// =============================================================

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSession } from './api';
import { SESSION_STORAGE_KEY, useSimandakesStore } from './store';
import { DashboardShell } from './dashboard-shell';
import { LandingPage } from './landing';
import { LoginDialog } from './login-dialog';
import type { AppUser } from './types';

export function AppRoot() {
  const view = useSimandakesStore((s) => s.view);
  const user = useSimandakesStore((s) => s.user);
  const setUser = useSimandakesStore((s) => s.setUser);

  // 1) Optimistic restore of the cached session user.
  useEffect(() => {
    try {
      const cached = window.localStorage.getItem(SESSION_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as AppUser;
        if (parsed && typeof parsed.username === 'string') setUser(parsed);
      }
    } catch {
      // corrupted cache — ignore
    }
  }, [setUser]);

  // 2) Always confirm with the server session.
  const { data: sessionUser, isSuccess: sessionLoaded } = useQuery({
    queryKey: ['session'],
    queryFn: fetchSession,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!sessionLoaded) return;
    setUser(sessionUser ?? null);
  }, [sessionLoaded, sessionUser, setUser]);

  // 3) Persist the session user manually in localStorage
  //    (only after the server has confirmed, so the cache is never wiped early).
  useEffect(() => {
    if (!sessionLoaded) return;
    try {
      if (user) window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
      else window.localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // storage unavailable (private mode) — ignore
    }
  }, [user, sessionLoaded]);

  return (
    <>
      {view === 'landing' ? <LandingPage /> : <DashboardShell />}
      <LoginDialog />
    </>
  );
}
