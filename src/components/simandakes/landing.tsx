'use client';

// =============================================================
// landing.tsx — port of partials/landing.html.
// Sticky footer via min-h-screen flex flex-col + mt-auto.
// All stats are live via useQuery (no refresh buttons).
// =============================================================

import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  ArrowRight,
  Award,
  BadgeCheck,
  Baby,
  Building2,
  Database,
  HeartPulse,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Smartphone,
  Stethoscope,
  Syringe,
  Users,
  UserPlus,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fetchNakes, fetchStats } from './api';
import { useSimandakesStore } from './store';
import { getProfesiConfig } from './profesi';
import { NakesAvatar } from './nakes-avatar';
import type { Stats, ViewId } from './types';

const CONTAINER = 'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8';

// ---------------- Feature cards ----------------

interface FeatureDef {
  icon: LucideIcon;
  title: string;
  desc: string;
  bg: string;
  color: string;
}

const FEATURES: FeatureDef[] = [
  { icon: UserPlus, title: 'Named', desc: 'Sistem manajemen data tenaga medis per institusi dengan validasi otomatis', bg: '#f5f3ff', color: '#7c3aed' },
  { icon: Users, title: 'Nakes Directory', desc: 'Database lengkap tenaga kesehatan yang dapat diakses publik', bg: '#ecfdf5', color: '#059669' },
  { icon: Search, title: 'Pencarian Cerdas', desc: 'Cari dokter, bidan, perawat berdasarkan lokasi dan spesialisasi', bg: '#fff7ed', color: '#f97316' },
  { icon: Database, title: 'Data Terpusat', desc: 'Data tersinkron otomatis dari server database secara real-time', bg: '#f0fdfa', color: '#14b8a6' },
  { icon: ShieldCheck, title: 'Keamanan Berlapis', desc: 'Sistem akses multi-level dengan sesi terenkripsi dan aman', bg: '#fef2f2', color: '#ef4444' },
  { icon: Smartphone, title: 'Multi Perangkat', desc: 'Tampilan responsif — nyaman diakses dari HP, tablet, maupun desktop', bg: '#eff6ff', color: '#2563eb' },
];

// ---------------- Layanan cards ----------------

interface LayananDef {
  view: ViewId;
  title: string;
  desc: string;
  emoji: string;
  bg: string;
  color: string;
  /** key(s) in Stats.perJenis used for the live count */
  jenisKeys: string[];
}

const LAYANAN_CARDS: LayananDef[] = [
  { view: 'cari-dokter', title: 'Cari Dokter', desc: 'Dokter umum & spesialis', emoji: '👨‍⚕️', bg: '#eef2ff', color: '#4f46e5', jenisKeys: ['Dokter', 'Dokter Spesialis'] },
  { view: 'cari-dokter-gigi', title: 'Cari Dokter Gigi', desc: 'Dokter gigi umum & spesialis', emoji: '🦷', bg: '#cffafe', color: '#0891b2', jenisKeys: ['Dokter Gigi', 'Dokter Gigi Spesialis'] },
  { view: 'cari-bidan', title: 'Cari Bidan', desc: 'Layanan kebidanan profesional', emoji: '🤱', bg: '#fce7f3', color: '#ec4899', jenisKeys: ['Bidan'] },
  { view: 'cari-perawat', title: 'Cari Perawat', desc: 'Perawat terlatih profesional', emoji: '💉', bg: '#f3e8ff', color: '#a855f7', jenisKeys: ['Perawat'] },
  { view: 'cari-apoteker', title: 'Cari Apoteker', desc: 'Layanan farmasi terpercaya', emoji: '💊', bg: '#fef9c3', color: '#ca8a04', jenisKeys: ['Apoteker'] },
  { view: 'cari-fisioterapis', title: 'Cari Fisioterapis', desc: 'Terapi fisik & rehabilitasi', emoji: '🏃', bg: '#dbeafe', color: '#1e40af', jenisKeys: ['Fisioterapis'] },
  { view: 'cari-psikolog-klinis', title: 'Cari Psikolog Klinis', desc: 'Konsultasi kesehatan mental', emoji: '🧠', bg: '#ede9fe', color: '#7c3aed', jenisKeys: ['Psikolog Klinis'] },
  { view: 'cari-praktik', title: 'Cari Praktik Nakes', desc: 'Informasi tempat praktik', emoji: '📋', bg: '#d1fae5', color: '#059669', jenisKeys: [] },
];

// ---------------- Hero preview mini cards ----------------

interface MiniCardDef {
  icon: LucideIcon;
  label: string;
  bg: string;
  tileBg: string;
  valueColor: string;
  value: (stats: Stats | undefined) => number | null;
}

const MINI_CARDS: MiniCardDef[] = [
  {
    icon: Stethoscope,
    label: 'Dokter',
    bg: '#eff6ff',
    tileBg: '#3b82f6',
    valueColor: '#1e40af',
    value: (s) => (s ? sumJenis(s, ['Dokter', 'Dokter Spesialis', 'Dokter Gigi', 'Dokter Gigi Spesialis']) : null),
  },
  {
    icon: Baby,
    label: 'Bidan',
    bg: '#fdf2f8',
    tileBg: '#ec4899',
    valueColor: '#be185d',
    value: (s) => (s ? s.perJenis['Bidan'] ?? 0 : null),
  },
  {
    icon: Syringe,
    label: 'Perawat',
    bg: '#f5f3ff',
    tileBg: '#a855f7',
    valueColor: '#7c3aed',
    value: (s) => (s ? s.perJenis['Perawat'] ?? 0 : null),
  },
  {
    icon: Activity,
    label: 'Total Aktif',
    bg: '#ecfdf5',
    tileBg: '#22c55e',
    valueColor: '#166534',
    value: (s) => (s ? s.aktifNakes : null),
  },
];

function sumJenis(stats: Stats, keys: string[]): number {
  return keys.reduce((sum, k) => sum + (stats.perJenis[k] ?? 0), 0);
}

// =============================================================

export function LandingPage() {
  const setView = useSimandakesStore((s) => s.setView);
  const setLoginOpen = useSimandakesStore((s) => s.setLoginOpen);

  const { data: stats } = useQuery({ queryKey: ['stats'], queryFn: fetchStats });
  const { data: nakesList } = useQuery({ queryKey: ['nakes'], queryFn: fetchNakes });

  const enterDashboard = (target: ViewId = 'named') => setView(target);
  const openLogin = () => setLoginOpen(true);

  const topAktif = (nakesList ?? []).filter((n) => n.status === 'aktif').slice(0, 3);

  const heroStats: { value: string; label: string }[] = [
    { value: stats ? String(stats.totalNakes) : '—', label: 'Tenaga Kesehatan' },
    {
      value: stats ? String(stats.totalInstitusiNamed + stats.totalInstitusiNakes) : '—',
      label: 'Fasilitas Kesehatan',
    },
    { value: '34', label: 'Provinsi Terjangkau' },
  ];

  return (
    <div className="sim-landing-bg flex min-h-screen flex-col">
      {/* ==================== Navbar ==================== */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/85 backdrop-blur-md">
        <div className={`${CONTAINER} flex h-16 items-center justify-between gap-3`}>
          <div className="flex items-center gap-3">
            <div
              className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-600/20"
              aria-hidden
            >
              <HeartPulse className="size-5" />
            </div>
            <span className="text-lg font-bold text-gray-900">SIMANDAKES</span>
          </div>
          <nav className="hidden items-center gap-8 sm:flex" aria-label="Navigasi landing">
            <a href="#fitur" className="text-sm font-medium text-gray-600 transition-colors hover:text-emerald-600">
              Fitur
            </a>
            <a href="#layanan" className="text-sm font-medium text-gray-600 transition-colors hover:text-emerald-600">
              Layanan
            </a>
            <a href="#tentang" className="text-sm font-medium text-gray-600 transition-colors hover:text-emerald-600">
              Tentang
            </a>
          </nav>
          <Button
            onClick={openLogin}
            className="h-10 shrink-0 bg-emerald-600 px-4 text-sm text-white hover:bg-emerald-700 sm:text-sm"
          >
            <span className="sm:hidden">Masuk</span>
            <span className="hidden sm:inline">Masuk ke Dashboard</span>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* ==================== Hero ==================== */}
        <section className="pt-14 pb-16 sm:pt-20 lg:pb-24">
          <div className={CONTAINER}>
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="animate-fade-in-up">
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-medium text-emerald-700">
                  <Zap className="size-4" aria-hidden />
                  Platform SDM Kesehatan Terpadu
                </span>
                <h1 className="mt-6 text-4xl leading-tight font-extrabold tracking-tight text-gray-900 sm:text-5xl">
                  Sistem Informasi dan Manajemen
                  <span className="text-gradient-emerald block">SDM Kesehatan</span>
                </h1>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-gray-600 sm:text-lg">
                  SIMANDAKES adalah platform digital terintegrasi untuk mengelola informasi tenaga
                  kesehatan di Indonesia. Memudahkan pencarian praktisi kesehatan terpercaya dan
                  manajemen data yang efisien.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Button
                    onClick={() => enterDashboard('named')}
                    className="h-12 bg-emerald-600 px-6 text-base text-white hover:bg-emerald-700"
                  >
                    Mulai Sekarang
                    <ArrowRight className="size-5" aria-hidden />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 border-gray-300 px-6 text-base"
                    onClick={() => document.getElementById('fitur')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    Pelajari Lebih Lanjut
                  </Button>
                </div>

                {/* Live hero stats */}
                <div className="mt-10 grid grid-cols-3 gap-4 border-t border-gray-200 pt-8 sm:gap-6">
                  {heroStats.map((s) => (
                    <div key={s.label}>
                      <p className="text-2xl font-bold text-emerald-600 sm:text-3xl">{s.value}</p>
                      <p className="mt-1 text-xs text-gray-500 sm:text-sm">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dashboard preview card */}
              <div className="animate-fade-in-up relative overflow-x-clip" style={{ animationDelay: '0.15s' }}>
                <div
                  className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-500 opacity-10"
                  style={{ transform: 'rotate(3deg)' }}
                  aria-hidden
                />
                <div className="relative rounded-3xl bg-white p-6 shadow-xl sm:p-8">
                  <div className="mb-6 flex items-center justify-between">
                    <strong className="text-gray-900">Dashboard Ringkasan</strong>
                    <Badge className="border-transparent bg-emerald-100 text-emerald-700">
                      <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
                      Live
                    </Badge>
                  </div>

                  <div className="mb-6 grid grid-cols-2 gap-4">
                    {MINI_CARDS.map((card) => {
                      const value = card.value(stats);
                      return (
                        <div key={card.label} className="rounded-xl p-4" style={{ background: card.bg }}>
                          <div
                            className="mb-2 flex size-8 items-center justify-center rounded-lg text-white"
                            style={{ background: card.tileBg }}
                            aria-hidden
                          >
                            <card.icon className="size-4" />
                          </div>
                          <p className="text-xs font-medium text-gray-600">{card.label}</p>
                          <p className="text-2xl font-bold" style={{ color: card.valueColor }}>
                            {value ?? '—'}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-2">
                    {topAktif.length === 0
                      ? Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-50" />
                        ))
                      : topAktif.map((n) => {
                          const config = getProfesiConfig(n.jenis);
                          return (
                            <div
                              key={n.id}
                              className="flex items-center gap-3 rounded-xl bg-gray-50/60 px-3 py-2.5 transition-colors hover:bg-gray-50"
                            >
                              <NakesAvatar nama={n.nama} jenis={n.jenis} fotoUrl={n.fotoUrl} size={36} />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-gray-900">{n.nama}</p>
                                <p className="truncate text-xs text-gray-500">{n.spesialisasi || config.label}</p>
                              </div>
                              <BadgeCheck className="size-5 shrink-0 text-emerald-500" aria-hidden />
                            </div>
                          );
                        })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== Features ==================== */}
        <section id="fitur" className="scroll-mt-20 bg-white py-16 lg:py-20">
          <div className={CONTAINER}>
            <div className="mb-12 text-center">
              <Badge className="border-transparent bg-emerald-100 text-emerald-700">Fitur Unggulan</Badge>
              <h2 className="mt-4 text-3xl font-bold text-gray-900 sm:text-4xl">
                Solusi Lengkap untuk Manajemen SDM Kesehatan
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-gray-600">
                Platform yang dirancang khusus untuk memenuhi kebutuhan pengelolaan data tenaga
                kesehatan Indonesia
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <div
                    className="flex size-14 items-center justify-center rounded-2xl"
                    style={{ background: f.bg }}
                    aria-hidden
                  >
                    <f.icon className="size-7" style={{ color: f.color }} />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== Layanan ==================== */}
        <section id="layanan" className="scroll-mt-20 py-16 lg:py-20">
          <div className={CONTAINER}>
            <div className="mb-12 text-center">
              <Badge className="border-transparent bg-blue-100 text-blue-700">Layanan Kami</Badge>
              <h2 className="mt-4 text-3xl font-bold text-gray-900 sm:text-4xl">
                Layanan Pencarian Praktisi Kesehatan
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-gray-600">
                Temukan tenaga kesehatan profesional yang terverifikasi di sekitar Anda
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
              {LAYANAN_CARDS.map((card) => {
                const count = card.jenisKeys.length
                  ? card.jenisKeys.reduce((sum, k) => sum + (stats?.perJenis[k] ?? 0), 0)
                  : stats?.totalNakes;
                return (
                  <button
                    key={card.view}
                    type="button"
                    onClick={() => enterDashboard(card.view)}
                    className="group rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
                  >
                    <div
                      className="flex size-12 items-center justify-center rounded-xl text-2xl"
                      style={{ background: card.bg }}
                      aria-hidden
                    >
                      {card.emoji}
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-gray-900 sm:text-base">{card.title}</h3>
                    <p className="mt-1 hidden text-xs text-gray-500 sm:block">{card.desc}</p>
                    <p className="mt-3 text-xl font-bold" style={{ color: card.color }}>
                      {count ?? '—'}
                      <span className="ml-1 text-[11px] font-medium text-gray-400">nakes</span>
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==================== Tentang ==================== */}
        <section id="tentang" className="scroll-mt-20 bg-white py-16 lg:py-20">
          <div className={CONTAINER}>
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <Badge className="border-transparent bg-emerald-100 text-emerald-700">Tentang Kami</Badge>
                <h2 className="mt-4 text-3xl font-bold text-gray-900 sm:text-4xl">
                  Meningkatkan Akses Layanan Kesehatan Berkualitas
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-gray-600">
                  SIMANDAKES hadir sebagai solusi digital untuk menghubungkan masyarakat dengan
                  tenaga kesehatan profesional yang terverifikasi.
                </p>
                <div className="mt-8 space-y-5">
                  <AboutItem
                    icon={Activity}
                    tileBg="#d1fae5"
                    color="#059669"
                    title="Misi Utama"
                    desc="Menyediakan data akurat dan terkini tentang tenaga kesehatan Indonesia"
                  />
                  <AboutItem
                    icon={Building2}
                    tileBg="#dbeafe"
                    color="#2563eb"
                    title="Visi"
                    desc="Menjadi platform terdepan dalam manajemen SDM kesehatan digital"
                  />
                  <AboutItem
                    icon={Award}
                    tileBg="#f3e8ff"
                    color="#7c3aed"
                    title="Standar Kualitas"
                    desc="Data tervalidasi dari sumber resmi dan terpercaya"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                <AboutMiniCard from="#059669" to="#0d9488" icon={Award} title="STR" sub="Teregistrasi" />
                <AboutMiniCard from="#2563eb" to="#1d4ed8" icon={Database} title="SIP" sub="Berizin Resmi" />
                <AboutMiniCard from="#a855f7" to="#9333ea" icon={Building2} title="Faskes" sub="Terdaftar" />
                <AboutMiniCard from="#f97316" to="#ea580c" icon={Activity} title="24/7" sub="Akses Online" />
              </div>
            </div>
          </div>
        </section>

        {/* ==================== CTA ==================== */}
        <section className="py-16 lg:py-20">
          <div className={CONTAINER}>
            <div className="rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-14 text-center text-white shadow-xl shadow-emerald-600/20">
              <h2 className="text-3xl font-bold sm:text-4xl">Siap Memulai?</h2>
              <p className="mx-auto mt-3 max-w-xl text-emerald-50">
                Bergabunglah dengan ribuan fasilitas kesehatan yang sudah menggunakan SIMANDAKES
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Button
                  onClick={() => enterDashboard('named')}
                  className="h-12 bg-white px-6 text-base text-emerald-700 hover:bg-emerald-50"
                >
                  Buka Dashboard
                  <ArrowRight className="size-5" aria-hidden />
                </Button>
                <Button
                  variant="outline"
                  className="h-12 border-white/60 bg-transparent px-6 text-base text-white hover:bg-white/10 hover:text-white"
                  asChild
                >
                  <a href="mailto:info@simandakes.go.id">Hubungi Kami</a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ==================== Footer (sticky via mt-auto) ==================== */}
      <footer className="mt-auto bg-gray-900 text-gray-400">
        <div className={CONTAINER}>
          <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <div className="flex items-center gap-3">
                <div
                  className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white"
                  aria-hidden
                >
                  <HeartPulse className="size-5" />
                </div>
                <span className="text-lg font-bold text-white">SIMANDAKES</span>
              </div>
              <p className="mt-4 max-w-sm text-sm leading-relaxed">
                Sistem Informasi dan Manajemen Sumber Daya Manusia Kesehatan untuk Indonesia yang
                lebih sehat.
              </p>
              <div className="mt-5 flex gap-3">
                <a
                  href="mailto:info@simandakes.go.id"
                  className="flex size-10 items-center justify-center rounded-full bg-white/5 transition-colors hover:bg-emerald-600 hover:text-white"
                  aria-label="Email"
                >
                  <Mail className="size-4" />
                </a>
                <a
                  href="tel:02112345678"
                  className="flex size-10 items-center justify-center rounded-full bg-white/5 transition-colors hover:bg-emerald-600 hover:text-white"
                  aria-label="Telepon"
                >
                  <Phone className="size-4" />
                </a>
                <span
                  className="flex size-10 items-center justify-center rounded-full bg-white/5"
                  aria-label="Lokasi Jakarta"
                >
                  <MapPin className="size-4" />
                </span>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold tracking-wide text-white uppercase">Layanan</h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li>
                  <button onClick={() => enterDashboard('cari-dokter')} className="transition-colors hover:text-emerald-400">
                    Cari Dokter
                  </button>
                </li>
                <li>
                  <button onClick={() => enterDashboard('cari-bidan')} className="transition-colors hover:text-emerald-400">
                    Cari Bidan
                  </button>
                </li>
                <li>
                  <button onClick={() => enterDashboard('cari-perawat')} className="transition-colors hover:text-emerald-400">
                    Cari Perawat
                  </button>
                </li>
                <li>
                  <button onClick={() => enterDashboard('cari-praktik')} className="transition-colors hover:text-emerald-400">
                    Info Praktik
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold tracking-wide text-white uppercase">Kontak</h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li>(021) 1234-5678</li>
                <li>info@simandakes.go.id</li>
                <li>Jakarta, Indonesia</li>
                <li>Senin–Jumat, 08.00–16.00</li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 py-6 text-xs sm:flex-row">
            <p>© 2024 SIMANDAKES — Dinas Kesehatan. Hak Cipta Dilindungi.</p>
            <div className="flex gap-6">
              <span className="cursor-default transition-colors hover:text-gray-300">Kebijakan Privasi</span>
              <span className="cursor-default transition-colors hover:text-gray-300">Syarat &amp; Ketentuan</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ---------------- Small landing sub-components ----------------

function AboutItem({
  icon: Icon,
  tileBg,
  color,
  title,
  desc,
}: {
  icon: LucideIcon;
  tileBg: string;
  color: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl" style={{ background: tileBg }} aria-hidden>
        <Icon className="size-5" style={{ color }} />
      </div>
      <div>
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <p className="mt-1 text-sm text-gray-600">{desc}</p>
      </div>
    </div>
  );
}

function AboutMiniCard({
  from,
  to,
  icon: Icon,
  title,
  sub,
}: {
  from: string;
  to: string;
  icon: LucideIcon;
  title: string;
  sub: string;
}) {
  return (
    <div
      className="rounded-2xl p-6 text-center text-white shadow-lg"
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      <Icon className="mx-auto mb-2 size-9 opacity-90" aria-hidden />
      <p className="text-2xl font-bold">{title}</p>
      <p className="mt-1 text-sm opacity-90">{sub}</p>
    </div>
  );
}
