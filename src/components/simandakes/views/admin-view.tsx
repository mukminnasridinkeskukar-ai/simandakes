'use client';

// =============================================================
// admin-view.tsx — Panel Administrasi with 4 tabs:
// Data Nakes / Institusi Named / Institusi Nakes / Pengguna.
// All CRUD via useMutation + invalidateQueries (no manual refresh).
// =============================================================

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  LogIn,
  LogOut,
  MapPin,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  deleteInstitusiNakes,
  deleteNamed,
  deleteNakes,
  deleteUser,
  fetchInstitusiNakes,
  fetchNamed,
  fetchNakes,
  fetchUsers,
} from '../api';
import { ConfirmDeleteDialog } from '../confirm-delete-dialog';
import { InstitusiFormDialog } from '../institusi-form-dialog';
import { NakesFormDialog } from '../nakes-form-dialog';
import { NakesAvatar } from '../nakes-avatar';
import { EmptyState } from '../empty-state';
import { getProfesiConfig, getStatusBadge } from '../profesi';
import { useSimandakesStore } from '../store';
import { UserFormDialog } from '../user-form-dialog';
import { useLogout } from '../use-logout';
import { TableSkeleton } from '../view-skeleton';
import type { AppUser, InstitusiNakes, InstitusiNamed, Nakes } from '../types';

const PAGE_SIZE = 10;

// ---------------- Small shared pieces ----------------

function ColoredChip({ bg, color, children }: { bg: string; color: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex max-w-full items-center truncate rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap" style={{ background: bg, color }}>
      {children}
    </span>
  );
}

function TablePagination({
  page,
  pageCount,
  total,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
      <p className="text-sm text-muted-foreground">
        Halaman {page} dari {pageCount} ({total} data)
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="h-9" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="size-4" aria-hidden />
          Sebelumnya
        </Button>
        <Button variant="outline" size="sm" className="h-9" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
          Berikutnya
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}

function Toolbar({ search, onSearch, onAdd, addLabel }: { search: string; onSearch: (v: string) => void; onAdd: () => void; addLabel: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" aria-hidden />
        <Input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Cari data..."
          className="h-10 pl-9"
          aria-label="Cari data"
        />
      </div>
      <Button onClick={onAdd} className="h-10 bg-emerald-600 text-white hover:bg-emerald-700">
        <Plus className="size-4" aria-hidden />
        {addLabel}
      </Button>
    </div>
  );
}

function useAdminFilter<T>(data: T[] | undefined, haystack: (item: T) => string) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const q = search.trim().toLowerCase();
  const filtered = (data ?? []).filter((item) => {
    if (!q) return true;
    return haystack(item).toLowerCase().includes(q);
  });

  // Page is clamped on render (no setState-in-effect): when the filtered
  // result shrinks below the current page, we simply show the last page.
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return { search, setSearch, filtered, paged, page: safePage, setPage, pageCount };
}

// =============================================================
// Tab 1 — Data Nakes
// =============================================================

function NakesAdminTable() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({ queryKey: ['nakes'], queryFn: fetchNakes });
  const { search, setSearch, filtered, paged, page, setPage, pageCount } = useAdminFilter<Nakes>(data, (n) =>
    `${n.nama} ${n.spesialisasi ?? ''} ${n.jenis} ${n.alamatPraktik ?? ''}`
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Nakes | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Nakes | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNakes(id),
    onSuccess: () => {
      toast.success('Data nakes berhasil dihapus.');
      void queryClient.invalidateQueries({ queryKey: ['nakes'] });
      void queryClient.invalidateQueries({ queryKey: ['stats'] });
      setDeleteTarget(null);
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus data nakes.');
      setDeleteTarget(null);
    },
  });

  return (
    <div className="space-y-4">
      <Toolbar search={search} onSearch={setSearch} onAdd={() => { setEditing(null); setFormOpen(true); }} addLabel="Tambah" />

      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : isError ? (
        <EmptyState emoji="⚠️" title="Gagal memuat data" message={error instanceof Error ? error.message : 'Terjadi kesalahan.'} />
      ) : filtered.length === 0 ? (
        <EmptyState emoji="🔍" title="Tidak ada data" message={search ? `Tidak ada data nakes yang cocok dengan "${search}".` : 'Belum ada data nakes. Tambahkan data baru.'} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border bg-white">
            <Table className="min-w-[860px]">
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Spesialisasi</TableHead>
                  <TableHead>Alamat</TableHead>
                  <TableHead className="text-center">Maps</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((n, idx) => {
                  const config = getProfesiConfig(n.jenis);
                  const statusBadge = getStatusBadge(n.status);
                  return (
                    <TableRow key={n.id}>
                      <TableCell className="text-gray-500 tabular-nums">{(page - 1) * PAGE_SIZE + idx + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <NakesAvatar nama={n.nama} jenis={n.jenis} fotoUrl={n.fotoUrl} size={32} />
                          <span className="max-w-[180px] truncate font-medium text-gray-900">{n.nama}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <ColoredChip bg={config.bg} color={config.color}>
                          {config.icon} {config.label}
                        </ColoredChip>
                      </TableCell>
                      <TableCell className="max-w-[160px] truncate text-gray-600">{n.spesialisasi || '-'}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-gray-600">{n.alamatPraktik || '-'}</TableCell>
                      <TableCell className="text-center">
                        {n.alamatGoogleMaps ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            onClick={() => window.open(n.alamatGoogleMaps as string, '_blank', 'noopener,noreferrer')}
                            title="Buka di Google Maps"
                          >
                            <MapPin className="size-3.5" aria-hidden />
                            Maps
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`border ${statusBadge.className}`}>
                          {statusBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-9 text-gray-500 hover:bg-emerald-50 hover:text-emerald-700"
                            onClick={() => { setEditing(n); setFormOpen(true); }}
                            title="Edit"
                            aria-label={`Edit ${n.nama}`}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-9 text-gray-500 hover:bg-red-50 hover:text-red-600"
                            onClick={() => setDeleteTarget(n)}
                            title="Hapus"
                            aria-label={`Hapus ${n.nama}`}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <TablePagination page={page} pageCount={pageCount} total={filtered.length} onPageChange={setPage} />
        </>
      )}

      <NakesFormDialog open={formOpen} onOpenChange={setFormOpen} initial={editing} />
      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={`Hapus data nakes "${deleteTarget?.nama ?? ''}"?`}
        description="Data tenaga kesehatan ini akan dihapus permanen dari database."
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
      />
    </div>
  );
}

// =============================================================
// Tab 2 — Institusi Named
// =============================================================

function NamedAdminTable() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({ queryKey: ['named'], queryFn: fetchNamed });
  const { search, setSearch, filtered, paged, page, setPage, pageCount } = useAdminFilter<InstitusiNamed>(data, (i) =>
    `${i.nama} ${i.tipe}`
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InstitusiNamed | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InstitusiNamed | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNamed(id),
    onSuccess: () => {
      toast.success('Institusi Named berhasil dihapus.');
      void queryClient.invalidateQueries({ queryKey: ['named'] });
      void queryClient.invalidateQueries({ queryKey: ['stats'] });
      setDeleteTarget(null);
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus institusi.');
      setDeleteTarget(null);
    },
  });

  return (
    <div className="space-y-4">
      <Toolbar search={search} onSearch={setSearch} onAdd={() => { setEditing(null); setFormOpen(true); }} addLabel="Tambah" />

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : isError ? (
        <EmptyState emoji="⚠️" title="Gagal memuat data" message={error instanceof Error ? error.message : 'Terjadi kesalahan.'} />
      ) : filtered.length === 0 ? (
        <EmptyState emoji="🏥" title="Tidak ada data" message={search ? `Tidak ada institusi yang cocok dengan "${search}".` : 'Belum ada institusi Named. Tambahkan data baru.'} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border bg-white">
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>Institusi</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead className="text-center">Dokter</TableHead>
                  <TableHead className="text-center">Dokter Gigi</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((inst, idx) => (
                  <TableRow key={inst.id}>
                    <TableCell className="text-gray-500 tabular-nums">{(page - 1) * PAGE_SIZE + idx + 1}</TableCell>
                    <TableCell className="max-w-[220px] truncate font-medium text-gray-900">{inst.nama}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">
                        {inst.tipe}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-semibold text-indigo-600 tabular-nums">{inst.dokter}</TableCell>
                    <TableCell className="text-center font-semibold text-cyan-600 tabular-nums">{inst.dokterGigi}</TableCell>
                    <TableCell className="text-center font-bold text-emerald-600 tabular-nums">{inst.dokter + inst.dokterGigi}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-9 text-gray-500 hover:bg-emerald-50 hover:text-emerald-700"
                          onClick={() => { setEditing(inst); setFormOpen(true); }}
                          title="Edit"
                          aria-label={`Edit ${inst.nama}`}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-9 text-gray-500 hover:bg-red-50 hover:text-red-600"
                          onClick={() => setDeleteTarget(inst)}
                          title="Hapus"
                          aria-label={`Hapus ${inst.nama}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <TablePagination page={page} pageCount={pageCount} total={filtered.length} onPageChange={setPage} />
        </>
      )}

      <InstitusiFormDialog kind="named" open={formOpen} onOpenChange={setFormOpen} initial={editing} />
      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={`Hapus institusi "${deleteTarget?.nama ?? ''}"?`}
        description="Data institusi Named ini akan dihapus permanen dari database."
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
      />
    </div>
  );
}

// =============================================================
// Tab 3 — Institusi Nakes
// =============================================================

function InstitusiNakesAdminTable() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({ queryKey: ['institusi-nakes'], queryFn: fetchInstitusiNakes });
  const { search, setSearch, filtered, paged, page, setPage, pageCount } = useAdminFilter<InstitusiNakes>(data, (i) =>
    `${i.nama} ${i.tipe}`
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InstitusiNakes | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InstitusiNakes | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteInstitusiNakes(id),
    onSuccess: () => {
      toast.success('Institusi Nakes berhasil dihapus.');
      void queryClient.invalidateQueries({ queryKey: ['institusi-nakes'] });
      void queryClient.invalidateQueries({ queryKey: ['stats'] });
      setDeleteTarget(null);
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus institusi.');
      setDeleteTarget(null);
    },
  });

  return (
    <div className="space-y-4">
      <Toolbar search={search} onSearch={setSearch} onAdd={() => { setEditing(null); setFormOpen(true); }} addLabel="Tambah" />

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : isError ? (
        <EmptyState emoji="⚠️" title="Gagal memuat data" message={error instanceof Error ? error.message : 'Terjadi kesalahan.'} />
      ) : filtered.length === 0 ? (
        <EmptyState emoji="👩‍⚕️" title="Tidak ada data" message={search ? `Tidak ada institusi yang cocok dengan "${search}".` : 'Belum ada institusi Nakes. Tambahkan data baru.'} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border bg-white">
            <Table className="min-w-[820px]">
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>Institusi</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead className="text-center">Perawat</TableHead>
                  <TableHead className="text-center">Bidan</TableHead>
                  <TableHead className="text-center">Apoteker</TableHead>
                  <TableHead className="text-center">Lainnya</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((inst, idx) => (
                  <TableRow key={inst.id}>
                    <TableCell className="text-gray-500 tabular-nums">{(page - 1) * PAGE_SIZE + idx + 1}</TableCell>
                    <TableCell className="max-w-[200px] truncate font-medium text-gray-900">{inst.nama}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-pink-200 bg-pink-50 text-pink-700">
                        {inst.tipe}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-semibold text-pink-600 tabular-nums">{inst.perawat}</TableCell>
                    <TableCell className="text-center font-semibold text-rose-600 tabular-nums">{inst.bidan}</TableCell>
                    <TableCell className="text-center font-semibold text-yellow-600 tabular-nums">{inst.apoteker}</TableCell>
                    <TableCell className="text-center font-semibold text-gray-600 tabular-nums">{inst.lainnya}</TableCell>
                    <TableCell className="text-center font-bold text-emerald-600 tabular-nums">
                      {inst.perawat + inst.bidan + inst.apoteker + inst.lainnya}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-9 text-gray-500 hover:bg-emerald-50 hover:text-emerald-700"
                          onClick={() => { setEditing(inst); setFormOpen(true); }}
                          title="Edit"
                          aria-label={`Edit ${inst.nama}`}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-9 text-gray-500 hover:bg-red-50 hover:text-red-600"
                          onClick={() => setDeleteTarget(inst)}
                          title="Hapus"
                          aria-label={`Hapus ${inst.nama}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <TablePagination page={page} pageCount={pageCount} total={filtered.length} onPageChange={setPage} />
        </>
      )}

      <InstitusiFormDialog kind="nakes" open={formOpen} onOpenChange={setFormOpen} initial={editing} />
      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={`Hapus institusi "${deleteTarget?.nama ?? ''}"?`}
        description="Data institusi Nakes ini akan dihapus permanen dari database."
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
      />
    </div>
  );
}

// =============================================================
// Tab 4 — Pengguna
// =============================================================

const ROLE_BADGE: Record<string, string> = {
  admin: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  operator: 'border-blue-200 bg-blue-50 text-blue-700',
  viewer: 'border-gray-200 bg-gray-50 text-gray-600',
};

const USER_STATUS_BADGE: Record<string, string> = {
  aktif: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  nonaktif: 'border-gray-200 bg-gray-50 text-gray-600',
  suspended: 'border-red-200 bg-red-50 text-red-700',
};

function UsersAdminTable() {
  const user = useSimandakesStore((s) => s.user);
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    enabled: !!user,
  });
  const { search, setSearch, filtered, paged, page, setPage, pageCount } = useAdminFilter<AppUser>(data, (u) =>
    `${u.username} ${u.namaLengkap} ${u.email ?? ''}`
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      toast.success('Pengguna berhasil dihapus.');
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteTarget(null);
    },
    onError: (err: unknown) => {
      // Server enforces guards (cannot delete self / last admin) — show its message.
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus pengguna.');
      setDeleteTarget(null);
    },
  });

  return (
    <div className="space-y-4">
      <Toolbar search={search} onSearch={setSearch} onAdd={() => { setEditing(null); setFormOpen(true); }} addLabel="Tambah" />

      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : isError ? (
        <EmptyState emoji="⚠️" title="Gagal memuat data" message={error instanceof Error ? error.message : 'Terjadi kesalahan.'} />
      ) : filtered.length === 0 ? (
        <EmptyState emoji="👥" title="Tidak ada data" message={search ? `Tidak ada pengguna yang cocok dengan "${search}".` : 'Belum ada pengguna terdaftar.'} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border bg-white">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((u, idx) => (
                  <TableRow key={u.id}>
                    <TableCell className="text-gray-500 tabular-nums">{(page - 1) * PAGE_SIZE + idx + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white" aria-hidden>
                          {(u.namaLengkap || u.username).charAt(0).toUpperCase()}
                        </span>
                        <span className="font-medium text-gray-900">@{u.username}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate text-gray-700">{u.namaLengkap}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`border capitalize ${ROLE_BADGE[u.role] ?? ROLE_BADGE.viewer}`}>
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-gray-600">{u.email || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`border capitalize ${USER_STATUS_BADGE[u.status] ?? USER_STATUS_BADGE.nonaktif}`}>
                        {u.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-9 text-gray-500 hover:bg-emerald-50 hover:text-emerald-700"
                          onClick={() => { setEditing(u); setFormOpen(true); }}
                          title="Edit"
                          aria-label={`Edit ${u.username}`}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-9 text-gray-500 hover:bg-red-50 hover:text-red-600"
                          onClick={() => setDeleteTarget(u)}
                          disabled={user?.id === u.id}
                          title={user?.id === u.id ? 'Tidak dapat menghapus akun sendiri' : 'Hapus'}
                          aria-label={`Hapus ${u.username}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <TablePagination page={page} pageCount={pageCount} total={filtered.length} onPageChange={setPage} />
        </>
      )}

      <UserFormDialog open={formOpen} onOpenChange={setFormOpen} initial={editing} />
      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={`Hapus pengguna "@${deleteTarget?.username ?? ''}"?`}
        description="Akun pengguna ini akan dihapus permanen. Server menolak penghapusan akun sendiri atau admin terakhir."
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
      />
    </div>
  );
}

// =============================================================
// Main AdminView
// =============================================================

export function AdminView() {
  const user = useSimandakesStore((s) => s.user);
  const setLoginOpen = useSimandakesStore((s) => s.setLoginOpen);
  const logout = useLogout();

  if (!user) {
    return (
      <div className="animate-fade-in flex min-h-[60vh] items-center justify-center">
        <Card className="animate-fade-in-up w-full max-w-md border-gray-100 p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex size-20 items-center justify-center rounded-2xl bg-emerald-50" aria-hidden>
            <Lock className="size-9 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Login Diperlukan</h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            Anda harus masuk sebagai <strong>admin</strong> atau <strong>operator</strong> untuk
            mengakses Panel Administrasi SIMANDAKES.
          </p>
          <Button
            onClick={() => setLoginOpen(true)}
            className="mt-6 h-11 w-full bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <LogIn className="size-4" aria-hidden />
            Masuk Sekarang
          </Button>
          <p className="mt-3 text-xs text-gray-400">Demo: admin / admin123</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-600/20"
            aria-hidden
          >
            <ShieldCheck className="size-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
              Selamat datang, {user.namaLengkap || user.username} 👋
            </h2>
            <p className="text-sm text-gray-500">Kelola data SIMANDAKES melalui tab di bawah ini</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 px-3 py-1 text-sm text-emerald-700 capitalize">
            {user.role}
          </Badge>
          <Button variant="outline" onClick={() => void logout()} className="h-10 text-gray-600 hover:bg-red-50 hover:text-red-600">
            <LogOut className="size-4" aria-hidden />
            Keluar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="datanakes" className="gap-6">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-gray-100 p-1">
          <TabsTrigger value="datanakes" className="min-h-[40px] px-4">Data Nakes</TabsTrigger>
          <TabsTrigger value="named" className="min-h-[40px] px-4">Institusi Named</TabsTrigger>
          <TabsTrigger value="inakes" className="min-h-[40px] px-4">Institusi Nakes</TabsTrigger>
          <TabsTrigger value="users" className="min-h-[40px] px-4">Pengguna</TabsTrigger>
        </TabsList>
        <TabsContent value="datanakes" className="animate-fade-in">
          <NakesAdminTable />
        </TabsContent>
        <TabsContent value="named" className="animate-fade-in">
          <NamedAdminTable />
        </TabsContent>
        <TabsContent value="inakes" className="animate-fade-in">
          <InstitusiNakesAdminTable />
        </TabsContent>
        <TabsContent value="users" className="animate-fade-in">
          <UsersAdminTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
