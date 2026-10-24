// =============================================================
// store.ts — zustand global UI state.
// Note: `view`, filters etc. are intentionally NOT persisted;
// the session user is persisted manually in localStorage
// (key: simandakes_session_user) by app-root.tsx.
// =============================================================

import { create } from 'zustand';
import type { AppUser, NakesStatus, ViewId } from './types';

/** Current top-level view: a dashboard view id or the landing page. */
export type CurrentView = ViewId | 'landing';

export const SESSION_STORAGE_KEY = 'simandakes_session_user';

export type StatusFilter = 'semua' | NakesStatus;

interface SimandakesState {
  view: CurrentView;
  setView: (view: CurrentView) => void;
  user: AppUser | null;
  setUser: (user: AppUser | null) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  search: string;
  setSearch: (search: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (status: StatusFilter) => void;
  loginOpen: boolean;
  setLoginOpen: (open: boolean) => void;
}

export const useSimandakesStore = create<SimandakesState>((set) => ({
  view: 'landing',
  setView: (view) => set({ view }),
  user: null,
  setUser: (user) => set({ user }),
  sidebarOpen: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  search: '',
  setSearch: (search) => set({ search }),
  statusFilter: 'semua',
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  loginOpen: false,
  setLoginOpen: (loginOpen) => set({ loginOpen }),
}));
