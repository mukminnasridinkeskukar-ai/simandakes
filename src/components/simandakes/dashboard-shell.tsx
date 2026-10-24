'use client';

// =============================================================
// dashboard-shell.tsx — dashboard layout: sidebar (desktop) /
// Sheet (mobile), top header, and the 16-view dispatcher.
// Layout: h-screen flex overflow-hidden with internal scroll.
// =============================================================

import { useEffect } from 'react';
import {
  Activity,
  Baby,
  Brain,
  ClipboardList,
  Hand,
  Heart,
  HeartPulse,
  Home,
  Hospital,
  LogIn,
  LogOut,
  Menu,
  MessageSquare,
  PersonStanding,
  Pill,
  ShieldCheck,
  Smile,
  Sparkles,
  Stethoscope,
  Syringe,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useLogout } from './use-logout';
import { PELAYANAN_VIEW_CONFIG } from './profesi';
import { useSimandakesStore } from './store';
import { AdminView } from './views/admin-view';
import { NamedView } from './views/named-view';
import { NakesView } from './views/nakes-view';
import { PelayananView } from './views/pelayanan-view';
import type { ViewId } from './types';

// ---------------- Navigation definition ----------------

interface NavBadge {
  text: string;
  bg: string;
  color: string;
}

interface NavItemDef {
  view: ViewId;
  label: string;
  icon: LucideIcon;
  badge?: NavBadge;
  highlight?: boolean;
}

interface NavGroupDef {
  label?: string;
  items: NavItemDef[];
}

interface NavSectionDef {
  title: string;
  groups: NavGroupDef[];
}

const NAV_SECTIONS: NavSectionDef[] = [
  {
    title: 'Dashboard',
    groups: [
      {
        items: [
          { view: 'named', label: 'Named', icon: Hospital },
          { view: 'nakes', label: 'Nakes', icon: UsersRound },
        ],
      },
    ],
  },
  {
    title: '🏥 Pelayanan Kesehatan',
    groups: [
      {
        label: '👨‍⚕️ Tenaga Medis',
        items: [
          { view: 'cari-dokter-spesialis', label: 'Cari Dokter Spesialis', icon: Stethoscope, badge: { text: 'Spesialis', bg: '#eef2ff', color: '#4f46e5' } },
          { view: 'cari-dokter-gigi-spesialis', label: 'Cari Dokter Gigi Spesialis', icon: Sparkles, badge: { text: 'Spesialis Gigi', bg: '#cffafe', color: '#0891b2' } },
          { view: 'cari-dokter', label: 'Cari Dokter', icon: Activity, badge: { text: 'Dokter Umum', bg: '#eef2ff', color: '#4f46e5' } },
          { view: 'cari-dokter-gigi', label: 'Cari Dokter Gigi', icon: Heart, badge: { text: 'Dokter Gigi Umum', bg: '#cffafe', color: '#0891b2' } },
        ],
      },
      {
        label: '👩‍⚕️ Tenaga Kesehatan',
        items: [
          { view: 'cari-bidan', label: 'Cari Bidan', icon: Baby, badge: { text: 'Kebidanan', bg: '#fce7f3', color: '#ec4899' } },
          { view: 'cari-perawat', label: 'Cari Perawat', icon: Syringe, badge: { text: 'Perawatan', bg: '#f3e8ff', color: '#a855f7' } },
          { view: 'cari-apoteker', label: 'Cari Apoteker', icon: Pill, badge: { text: 'Farmasi', bg: '#fef9c3', color: '#ca8a04' } },
          { view: 'cari-fisioterapis', label: 'Cari Fisioterapis', icon: PersonStanding, badge: { text: 'Fisioterapi', bg: '#dbeafe', color: '#1e40af' } },
          { view: 'cari-psikolog-klinis', label: 'Cari Psikolog Klinis', icon: Brain, badge: { text: 'Psikologi', bg: '#ede9fe', color: '#7c3aed' } },
          { view: 'cari-terapis-wicara', label: 'Cari Terapis Wicara', icon: MessageSquare, badge: { text: 'Terapi Wicara', bg: '#fce7f3', color: '#be185d' } },
          { view: 'cari-okupasi-terapis', label: 'Cari Okupasi Terapis', icon: Hand, badge: { text: 'Terapi Okupasi', bg: '#fef3c7', color: '#92400e' } },
          { view: 'cari-terapis-gigi-mulut', label: 'Cari Terapis Gigi & Mulut', icon: Smile, badge: { text: 'Terapi Gigi', bg: '#cffafe', color: '#0891b2' } },
        ],
      },
      {
        label: '📋 Lengkap',
        items: [
          { view: 'cari-praktik', label: 'Semua Nakes', icon: ClipboardList, badge: { text: 'Seluruh Data', bg: '#d1fae5', color: '#059669' }, highlight: true },
        ],
      },
    ],
  },
  {
    title: 'Panel Admin',
    groups: [
      {
        items: [{ view: 'admin-dashboard', label: 'Admin Panel', icon: ShieldCheck }],
      },
    ],
  },
];

/** Page title/subtitle map — exact copy of original navigation.js */
const TITLES: Record<ViewId, [string, string]> = {
  named: ['Named', 'Manajemen Data Nakes'],
  nakes: ['Directory Nakes', 'Database Tenaga Kesehatan'],
  'cari-dokter-spesialis': ['Cari Dokter Spesialis', 'Pencarian Dokter Spesialis'],
  'cari-dokter-gigi-spesialis': ['Cari Dokter Gigi Spesialis', 'Pencarian Dokter Gigi Spesialis'],
  'cari-dokter': ['Cari Dokter', 'Pencarian Dokter Umum'],
  'cari-dokter-gigi': ['Cari Dokter Gigi', 'Pencarian Dokter Gigi Umum'],
  'cari-bidan': ['Cari Bidan', 'Pencarian Bidan'],
  'cari-perawat': ['Cari Perawat', 'Pencarian Perawat'],
  'cari-apoteker': ['Cari Apoteker', 'Pencarian Apoteker'],
  'cari-fisioterapis': ['Cari Fisioterapis', 'Pencarian Fisioterapis'],
  'cari-psikolog-klinis': ['Cari Psikolog Klinis', 'Pencarian Psikolog Klinis'],
  'cari-terapis-wicara': ['Cari Terapis Wicara', 'Pencarian Terapis Wicara'],
  'cari-okupasi-terapis': ['Cari Okupasi Terapis', 'Pencarian Okupasi Terapis'],
  'cari-terapis-gigi-mulut': ['Cari Terapis Gigi & Mulut', 'Pencarian Terapis Gigi & Mulut'],
  'cari-praktik': ['Cari Praktik Nakes', 'Informasi Tempat Praktik'],
  'admin-dashboard': ['Panel Administrasi', 'Kelola Sistem SIMANDAKES'],
};

// ---------------- Nav rendering (shared desktop & mobile) ----------------

function NavItemButton({
  item,
  active,
  onClick,
}: {
  item: NavItemDef;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`flex min-h-[44px] w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
        active
          ? 'border-emerald-200 bg-emerald-600/10 font-medium text-emerald-700'
          : item.highlight
            ? 'border-transparent text-emerald-700 hover:bg-emerald-50'
            : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <Icon className={`size-4 shrink-0 ${active ? 'text-emerald-600' : 'text-gray-400'}`} aria-hidden />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.badge ? (
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] leading-tight font-medium"
          style={{ background: item.badge.bg, color: item.badge.color }}
        >
          {item.badge.text}
        </span>
      ) : null}
    </button>
  );
}

function SidebarContent({
  activeView,
  onNavigate,
}: {
  activeView: ViewId;
  onNavigate: (view: ViewId) => void;
}) {
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Navigasi dashboard">
      {NAV_SECTIONS.map((section) => (
        <div key={section.title}>
          <p className="mb-2 px-3 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
            {section.title}
          </p>
          <div className="space-y-3">
            {section.groups.map((group, gi) => (
              <div key={group.label ?? gi} className="space-y-1">
                {group.label ? (
                  <p className="px-3 pt-1 text-[11px] font-medium text-gray-400">{group.label}</p>
                ) : null}
                {group.items.map((item) => (
                  <NavItemButton
                    key={item.view}
                    item={item}
                    active={activeView === item.view}
                    onClick={() => onNavigate(item.view)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

function SidebarUserBox() {
  const user = useSimandakesStore((s) => s.user);
  const setLoginOpen = useSimandakesStore((s) => s.setLoginOpen);
  const logout = useLogout();

  if (!user) {
    return (
      <div className="border-t p-4">
        <Button
          variant="outline"
          onClick={() => setLoginOpen(true)}
          className="h-10 w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
        >
          <LogIn className="size-4" aria-hidden />
          Masuk
        </Button>
      </div>
    );
  }

  const initials = (user.namaLengkap || user.username)
    .split(' ')
    .map((w) => w.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="border-t p-4">
      <div className="flex items-center gap-3">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white"
          aria-hidden
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">{user.namaLengkap || user.username}</p>
          <span className="mt-0.5 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 capitalize">
            {user.role}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={logout}
          className="size-10 text-gray-500 hover:bg-red-50 hover:text-red-600"
          title="Keluar"
          aria-label="Keluar"
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function SidebarLogo() {
  return (
    <div className="flex items-center gap-3 px-4">
      <div
        className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-600/20"
        aria-hidden
      >
        <HeartPulse className="size-5" />
      </div>
      <span className="text-base font-bold text-gray-900">SIMANDAKES</span>
    </div>
  );
}

// =============================================================

export function DashboardShell() {
  const view = useSimandakesStore((s) => s.view);
  const setView = useSimandakesStore((s) => s.setView);
  const sidebarOpen = useSimandakesStore((s) => s.sidebarOpen);
  const setSidebarOpen = useSimandakesStore((s) => s.setSidebarOpen);
  const user = useSimandakesStore((s) => s.user);
  const setLoginOpen = useSimandakesStore((s) => s.setLoginOpen);
  const setSearch = useSimandakesStore((s) => s.setSearch);
  const setStatusFilter = useSimandakesStore((s) => s.setStatusFilter);
  const logout = useLogout();

  const activeView: ViewId = view === 'landing' ? 'named' : view;
  const [title, subtitle] = TITLES[activeView] ?? ['SIMANDAKES', ''];

  // Reset search & status filter when switching views (fresh context per view).
  useEffect(() => {
    setSearch('');
    setStatusFilter('semua');
  }, [activeView, setSearch, setStatusFilter]);

  function navigate(target: ViewId) {
    setView(target);
    setSidebarOpen(false);
  }

  const initials = user
    ? (user.namaLengkap || user.username)
        .split(' ')
        .map((w) => w.charAt(0))
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '';

  function renderView(target: ViewId) {
    switch (target) {
      case 'named':
        return <NamedView />;
      case 'nakes':
        return <NakesView />;
      case 'admin-dashboard':
        return <AdminView />;
      default: {
        const config = PELAYANAN_VIEW_CONFIG[target as Exclude<ViewId, 'named' | 'nakes' | 'admin-dashboard'>];
        if (!config) return null;
        return <PelayananView key={target} viewId={target} {...config} />;
      }
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* ==================== Sidebar (desktop) ==================== */}
      <aside className="hidden w-72 shrink-0 flex-col border-r bg-white md:flex">
        <div className="flex h-16 shrink-0 items-center border-b">
          <SidebarLogo />
        </div>
        <SidebarContent activeView={activeView} onNavigate={navigate} />
        <SidebarUserBox />
      </aside>

      {/* ==================== Sidebar (mobile Sheet) ==================== */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent aria-describedby={undefined} side="left" className="w-80 max-w-[85vw] gap-0 overflow-hidden p-0">
          <SheetHeader className="h-16 shrink-0 justify-center border-b px-4 py-0">
            <SheetTitle asChild>
              <div>
                <SidebarLogo />
              </div>
            </SheetTitle>
          </SheetHeader>
          <SidebarContent activeView={activeView} onNavigate={navigate} />
          <SidebarUserBox />
        </SheetContent>
      </Sheet>

      {/* ==================== Main column ==================== */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top header */}
        <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b bg-white px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="size-10 shrink-0 md:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Buka menu navigasi"
            >
              <Menu className="size-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold text-gray-900">{title}</h1>
              <p className="truncate text-xs text-gray-500">{subtitle}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="size-10"
              onClick={() => setView('landing')}
              title="Kembali ke Beranda"
              aria-label="Kembali ke Beranda"
            >
              <Home className="size-4" />
            </Button>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex min-h-[44px] items-center gap-2 rounded-full py-1 pr-2 pl-1 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    aria-label="Menu pengguna"
                  >
                    <span
                      className="flex size-9 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white"
                      aria-hidden
                    >
                      {initials}
                    </span>
                    <span className="hidden max-w-[140px] truncate text-sm font-medium text-gray-700 sm:block">
                      {user.namaLengkap || user.username}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel>
                    <p className="truncate">{user.namaLengkap || user.username}</p>
                    <p className="truncate text-xs font-normal text-muted-foreground">
                      {user.email ?? `@${user.username}`}
                    </p>
                    <Badge className="mt-1.5 border-transparent bg-emerald-100 text-emerald-700 capitalize">
                      {user.role}
                    </Badge>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setView('admin-dashboard')}>
                    <ShieldCheck className="size-4" aria-hidden />
                    Panel Admin
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setView('landing')}>
                    <Home className="size-4" aria-hidden />
                    Beranda
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => void logout()}
                    className="text-red-600 focus:text-red-600"
                  >
                    <LogOut className="size-4" aria-hidden />
                    Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => setLoginOpen(true)}
                className="h-10 bg-emerald-600 px-4 text-white hover:bg-emerald-700"
              >
                <LogIn className="size-4" aria-hidden />
                Masuk
              </Button>
            )}
          </div>
        </header>

        {/* Scrollable main content */}
        <main className="sim-scroll flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">{renderView(activeView)}</div>
          <p className="py-4 text-center text-xs text-muted-foreground">
            SIMANDAKES v2.1 — Data otomatis tersinkron dari server
          </p>
        </main>
      </div>
    </div>
  );
}
