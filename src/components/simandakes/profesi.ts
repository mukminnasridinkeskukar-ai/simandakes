// =============================================================
// profesi.ts — Profesi color scheme (ported from original
// js/render-pelayanan.js getProfesiConfig), institusi icons,
// status badges and the per-view pelayanan configuration.
// =============================================================

import type { NakesStatus, ViewId } from './types';
import { JENIS_OPTIONS } from './types';

export interface ProfesiConfig {
  /** light background hex */
  bg: string;
  /** accent hex */
  color: string;
  /** original badge semantic name (styling is done inline via bg/color) */
  badgeClass: string;
  icon: string;
  label: string;
}

const CONFIGS: Record<string, ProfesiConfig> = {
  // Tenaga Medis
  'dokter umum': { bg: '#eef2ff', color: '#4f46e5', badgeClass: 'badge-blue', icon: '👨‍⚕️', label: 'Dokter Umum' },
  dokter: { bg: '#eef2ff', color: '#4f46e5', badgeClass: 'badge-blue', icon: '👨‍⚕️', label: 'Dokter' },
  'dokter spesialis': { bg: '#eef2ff', color: '#312e81', badgeClass: 'badge-blue', icon: '👨‍⚕️', label: 'Dokter Spesialis' },
  'dokter gigi': { bg: '#cffafe', color: '#0891b2', badgeClass: 'badge-cyan', icon: '🦷', label: 'Dokter Gigi' },
  'dokter gigi spesialis': { bg: '#cffafe', color: '#0e7490', badgeClass: 'badge-cyan', icon: '🦷', label: 'Dokter Gigi Spesialis' },

  // Tenaga Kesehatan
  bidan: { bg: '#fce7f3', color: '#ec4899', badgeClass: 'badge-pink', icon: '🤱', label: 'Bidan' },
  perawat: { bg: '#f3e8ff', color: '#a855f7', badgeClass: 'badge-purple', icon: '💉', label: 'Perawat' },
  apoteker: { bg: '#fef9c3', color: '#ca8a04', badgeClass: 'badge-yellow', icon: '💊', label: 'Apoteker' },
  fisioterapis: { bg: '#dbeafe', color: '#1e40af', badgeClass: 'badge-blue', icon: '🏃', label: 'Fisioterapis' },
  'psikolog klinis': { bg: '#ede9fe', color: '#7c3aed', badgeClass: 'badge-purple', icon: '🧠', label: 'Psikolog Klinis' },
  psikolog: { bg: '#ede9fe', color: '#7c3aed', badgeClass: 'badge-purple', icon: '🧠', label: 'Psikolog' },
  'terapis wicara': { bg: '#fce7f3', color: '#be185d', badgeClass: 'badge-pink', icon: '💬', label: 'Terapis Wicara' },
  'okupasi terapis': { bg: '#fef3c7', color: '#92400e', badgeClass: 'badge-yellow', icon: '👐', label: 'Okupasi Terapis' },
  'terapis gigi mulut': { bg: '#cffafe', color: '#0891b2', badgeClass: 'badge-cyan', icon: '🦷', label: 'Terapis Gigi & Mulut' },
  'terapis gigi dan mulut': { bg: '#cffafe', color: '#0891b2', badgeClass: 'badge-cyan', icon: '🦷', label: 'Terapis Gigi & Mulut' },
  'tenaga kesehatan lainnya': { bg: '#f3f4f6', color: '#6b7280', badgeClass: 'badge-gray', icon: '🩺', label: 'Tenaga Kesehatan Lainnya' },
};

const FALLBACK: ProfesiConfig = { bg: '#f3f4f6', color: '#6b7280', badgeClass: 'badge-gray', icon: '🏥', label: 'Nakes' };

/** Profesi color config with partial matching (port of getProfesiConfig). */
export function getProfesiConfig(jenis: string): ProfesiConfig {
  const j = (jenis || '').toLowerCase().trim();
  if (CONFIGS[j]) return CONFIGS[j];
  for (const key of Object.keys(CONFIGS)) {
    if (j.includes(key)) return CONFIGS[key];
  }
  return { ...FALLBACK, label: jenis || 'Nakes' };
}

/** Institusi type icon (emoji inside colored squares, matching original style). */
export function getInstitusiIcon(tipe: string): string {
  const map: Record<string, string> = {
    RS: '🏥',
    Puskesmas: '🏘️',
    Klinik: '💊',
    Apotek: '🏪',
    Lainnya: '🏢',
  };
  return map[tipe] ?? '🏢';
}

// ---------------- Status badges (tailwind-safe static classes) ----------------

export interface StatusBadgeConfig {
  label: string;
  className: string;
  dotClassName: string;
}

const STATUS_BADGES: Record<NakesStatus, StatusBadgeConfig> = {
  aktif: {
    label: 'Aktif',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    dotClassName: 'bg-emerald-500',
  },
  nonaktif: {
    label: 'Nonaktif',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
    dotClassName: 'bg-gray-400',
  },
  cuti: {
    label: 'Cuti',
    className: 'bg-amber-100 text-amber-700 border-amber-200',
    dotClassName: 'bg-amber-500',
  },
  keluar: {
    label: 'Keluar',
    className: 'bg-red-100 text-red-700 border-red-200',
    dotClassName: 'bg-red-500',
  },
};

export function getStatusBadge(status: string): StatusBadgeConfig {
  return STATUS_BADGES[status as NakesStatus] ?? STATUS_BADGES.nonaktif;
}

// ---------------- Pelayanan (cari) view configuration ----------------

export interface PelayananViewConfig {
  /** exact Nakes.jenis values to include */
  jenisList: string[];
  title: string;
  subtitle: string;
  emoji: string;
  primaryColor: string;
  bgColor: string;
}

export const ALL_JENIS_LIST: string[] = [...JENIS_OPTIONS];

export const PELAYANAN_VIEW_CONFIG: Record<Exclude<ViewId, 'named' | 'nakes' | 'admin-dashboard'>, PelayananViewConfig> = {
  'cari-dokter-spesialis': {
    jenisList: ['Dokter Spesialis'],
    title: 'Cari Dokter Spesialis',
    subtitle: 'Pencarian Dokter Spesialis',
    emoji: '👨‍⚕️',
    primaryColor: '#312e81',
    bgColor: '#eef2ff',
  },
  'cari-dokter-gigi-spesialis': {
    jenisList: ['Dokter Gigi Spesialis'],
    title: 'Cari Dokter Gigi Spesialis',
    subtitle: 'Pencarian Dokter Gigi Spesialis',
    emoji: '🦷',
    primaryColor: '#0e7490',
    bgColor: '#cffafe',
  },
  'cari-dokter': {
    jenisList: ['Dokter'],
    title: 'Cari Dokter',
    subtitle: 'Pencarian Dokter Umum',
    emoji: '👨‍⚕️',
    primaryColor: '#4f46e5',
    bgColor: '#eef2ff',
  },
  'cari-dokter-gigi': {
    jenisList: ['Dokter Gigi'],
    title: 'Cari Dokter Gigi',
    subtitle: 'Pencarian Dokter Gigi Umum',
    emoji: '🦷',
    primaryColor: '#0891b2',
    bgColor: '#cffafe',
  },
  'cari-bidan': {
    jenisList: ['Bidan'],
    title: 'Cari Bidan',
    subtitle: 'Pencarian Bidan',
    emoji: '🤱',
    primaryColor: '#ec4899',
    bgColor: '#fce7f3',
  },
  'cari-perawat': {
    jenisList: ['Perawat'],
    title: 'Cari Perawat',
    subtitle: 'Pencarian Perawat',
    emoji: '💉',
    primaryColor: '#a855f7',
    bgColor: '#f3e8ff',
  },
  'cari-apoteker': {
    jenisList: ['Apoteker'],
    title: 'Cari Apoteker',
    subtitle: 'Pencarian Apoteker',
    emoji: '💊',
    primaryColor: '#ca8a04',
    bgColor: '#fef9c3',
  },
  'cari-fisioterapis': {
    jenisList: ['Fisioterapis'],
    title: 'Cari Fisioterapis',
    subtitle: 'Pencarian Fisioterapis',
    emoji: '🏃',
    primaryColor: '#1e40af',
    bgColor: '#dbeafe',
  },
  'cari-psikolog-klinis': {
    jenisList: ['Psikolog Klinis'],
    title: 'Cari Psikolog Klinis',
    subtitle: 'Pencarian Psikolog Klinis',
    emoji: '🧠',
    primaryColor: '#7c3aed',
    bgColor: '#ede9fe',
  },
  'cari-terapis-wicara': {
    jenisList: ['Terapis Wicara'],
    title: 'Cari Terapis Wicara',
    subtitle: 'Pencarian Terapis Wicara',
    emoji: '💬',
    primaryColor: '#be185d',
    bgColor: '#fce7f3',
  },
  'cari-okupasi-terapis': {
    jenisList: ['Okupasi Terapis'],
    title: 'Cari Okupasi Terapis',
    subtitle: 'Pencarian Okupasi Terapis',
    emoji: '👐',
    primaryColor: '#92400e',
    bgColor: '#fef3c7',
  },
  'cari-terapis-gigi-mulut': {
    jenisList: ['Terapis Gigi dan Mulut'],
    title: 'Cari Terapis Gigi & Mulut',
    subtitle: 'Pencarian Terapis Gigi & Mulut',
    emoji: '🦷',
    primaryColor: '#0891b2',
    bgColor: '#cffafe',
  },
  'cari-praktik': {
    jenisList: ALL_JENIS_LIST,
    title: 'Cari Praktik Nakes',
    subtitle: 'Informasi Tempat Praktik',
    emoji: '📋',
    primaryColor: '#059669',
    bgColor: '#d1fae5',
  },
};

// ---------------- Quick-stats strip entries (12 profesi) ----------------

export interface ProfesiQuickStat {
  view: ViewId;
  label: string;
  emoji: string;
  /** exact jenis key in Stats.perJenis */
  jenis: string;
  color: string;
  bg: string;
}

export const PROFESI_QUICK_STATS: ProfesiQuickStat[] = [
  { view: 'cari-dokter-spesialis', label: 'Dr. Spesialis', emoji: '👨‍⚕️', jenis: 'Dokter Spesialis', color: '#312e81', bg: '#eef2ff' },
  { view: 'cari-dokter-gigi-spesialis', label: 'Dr. Gigi Spesialis', emoji: '🦷', jenis: 'Dokter Gigi Spesialis', color: '#0e7490', bg: '#cffafe' },
  { view: 'cari-dokter', label: 'Dokter Umum', emoji: '👨‍⚕️', jenis: 'Dokter', color: '#4f46e5', bg: '#eef2ff' },
  { view: 'cari-dokter-gigi', label: 'Dokter Gigi', emoji: '🦷', jenis: 'Dokter Gigi', color: '#0891b2', bg: '#cffafe' },
  { view: 'cari-bidan', label: 'Bidan', emoji: '🤱', jenis: 'Bidan', color: '#ec4899', bg: '#fce7f3' },
  { view: 'cari-perawat', label: 'Perawat', emoji: '💉', jenis: 'Perawat', color: '#a855f7', bg: '#f3e8ff' },
  { view: 'cari-apoteker', label: 'Apoteker', emoji: '💊', jenis: 'Apoteker', color: '#ca8a04', bg: '#fef9c3' },
  { view: 'cari-fisioterapis', label: 'Fisioterapis', emoji: '🏃', jenis: 'Fisioterapis', color: '#1e40af', bg: '#dbeafe' },
  { view: 'cari-psikolog-klinis', label: 'Psikolog Klinis', emoji: '🧠', jenis: 'Psikolog Klinis', color: '#7c3aed', bg: '#ede9fe' },
  { view: 'cari-terapis-wicara', label: 'Terapis Wicara', emoji: '💬', jenis: 'Terapis Wicara', color: '#be185d', bg: '#fce7f3' },
  { view: 'cari-okupasi-terapis', label: 'Okupasi Terapis', emoji: '👐', jenis: 'Okupasi Terapis', color: '#92400e', bg: '#fef3c7' },
  { view: 'cari-terapis-gigi-mulut', label: 'Terapis Gigi & Mulut', emoji: '🦷', jenis: 'Terapis Gigi dan Mulut', color: '#0891b2', bg: '#cffafe' },
];
