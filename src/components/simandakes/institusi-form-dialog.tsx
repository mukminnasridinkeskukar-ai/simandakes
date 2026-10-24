'use client';

// =============================================================
// institusi-form-dialog.tsx — add/edit dialog for InstitusiNamed
// & InstitusiNakes (kind: 'named' | 'nakes').
// =============================================================

import { useState, type ReactNode } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  createInstitusiNakes,
  createNamed,
  updateInstitusiNakes,
  updateNamed,
} from './api';
import {
  TIPE_OPTIONS,
  type InstitusiNamed,
  type InstitusiNamedInput,
  type InstitusiNakes,
  type InstitusiNakesInput,
  type InstitusiTipe,
} from './types';

interface InstitusiFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: 'named' | 'nakes';
  initial: InstitusiNamed | InstitusiNakes | null;
}

interface InstitusiFormState {
  nama: string;
  tipe: InstitusiTipe;
  dokter: string;
  dokterGigi: string;
  perawat: string;
  bidan: string;
  apoteker: string;
  lainnya: string;
}

const DEFAULT_FORM: InstitusiFormState = {
  nama: '',
  tipe: 'Puskesmas',
  dokter: '0',
  dokterGigi: '0',
  perawat: '0',
  bidan: '0',
  apoteker: '0',
  lainnya: '0',
};

function toFormState(inst: InstitusiNamed | InstitusiNakes): InstitusiFormState {
  if ('dokter' in inst) {
    return { ...DEFAULT_FORM, nama: inst.nama, tipe: inst.tipe, dokter: String(inst.dokter), dokterGigi: String(inst.dokterGigi) };
  }
  return {
    ...DEFAULT_FORM,
    nama: inst.nama,
    tipe: inst.tipe,
    perawat: String(inst.perawat),
    bidan: String(inst.bidan),
    apoteker: String(inst.apoteker),
    lainnya: String(inst.lainnya),
  };
}

function toCount(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function InstitusiFormDialog({ open, onOpenChange, kind, initial }: InstitusiFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        {/* Inner form mounts fresh on every open (Radix unmounts content when closed). */}
        <InstitusiForm kind={kind} initial={initial} onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  );
}

function InstitusiForm({
  kind,
  initial,
  onOpenChange,
}: {
  kind: 'named' | 'nakes';
  initial: InstitusiNamed | InstitusiNakes | null;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<InstitusiFormState>(() => (initial ? toFormState(initial) : DEFAULT_FORM));

  const isNamed = kind === 'named';

  const mutation = useMutation({
    mutationFn: async (): Promise<InstitusiNamed | InstitusiNakes> => {
      if (isNamed) {
        const payload: InstitusiNamedInput = {
          nama: form.nama.trim(),
          tipe: form.tipe,
          dokter: toCount(form.dokter),
          dokterGigi: toCount(form.dokterGigi),
        };
        return initial && 'dokter' in initial
          ? updateNamed(initial.id, payload)
          : createNamed(payload);
      }
      const payload: InstitusiNakesInput = {
        nama: form.nama.trim(),
        tipe: form.tipe,
        perawat: toCount(form.perawat),
        bidan: toCount(form.bidan),
        apoteker: toCount(form.apoteker),
        lainnya: toCount(form.lainnya),
      };
      return initial && 'perawat' in initial
        ? updateInstitusiNakes(initial.id, payload)
        : createInstitusiNakes(payload);
    },
    onSuccess: () => {
      toast.success(
        isNamed
          ? initial
            ? 'Institusi Named berhasil diperbarui.'
            : 'Institusi Named berhasil ditambahkan.'
          : initial
            ? 'Institusi Nakes berhasil diperbarui.'
            : 'Institusi Nakes berhasil ditambahkan.'
      );
      void queryClient.invalidateQueries({ queryKey: isNamed ? ['named'] : ['institusi-nakes'] });
      void queryClient.invalidateQueries({ queryKey: ['stats'] });
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan data institusi.');
    },
  });

  function set<K extends keyof InstitusiFormState>(key: K, value: InstitusiFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.nama.trim()) {
      toast.error('Nama institusi wajib diisi.');
      return;
    }
    mutation.mutate();
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {initial ? 'Edit' : 'Tambah'} Institusi {isNamed ? 'Named' : 'Nakes'}
        </DialogTitle>
        <DialogDescription>
          {isNamed
            ? 'Institusi dengan data tenaga medis (dokter & dokter gigi).'
            : 'Institusi dengan data tenaga kesehatan non-dokter.'}
        </DialogDescription>
      </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nama Institusi">
              <Input
                value={form.nama}
                onChange={(e) => set('nama', e.target.value)}
                placeholder={isNamed ? 'RSUD / Puskesmas / Klinik...' : 'Nama institusi...'}
                className="h-10"
              />
            </Field>
            <Field label="Tipe">
              <Select value={form.tipe} onValueChange={(v) => set('tipe', v as InstitusiTipe)}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Pilih tipe" />
                </SelectTrigger>
                <SelectContent>
                  {TIPE_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {isNamed ? (
              <>
                <Field label="Jumlah Dokter">
                  <Input type="number" min={0} value={form.dokter} onChange={(e) => set('dokter', e.target.value)} className="h-10" />
                </Field>
                <Field label="Jumlah Dokter Gigi">
                  <Input type="number" min={0} value={form.dokterGigi} onChange={(e) => set('dokterGigi', e.target.value)} className="h-10" />
                </Field>
              </>
            ) : (
              <>
                <Field label="Jumlah Perawat">
                  <Input type="number" min={0} value={form.perawat} onChange={(e) => set('perawat', e.target.value)} className="h-10" />
                </Field>
                <Field label="Jumlah Bidan">
                  <Input type="number" min={0} value={form.bidan} onChange={(e) => set('bidan', e.target.value)} className="h-10" />
                </Field>
                <Field label="Jumlah Apoteker">
                  <Input type="number" min={0} value={form.apoteker} onChange={(e) => set('apoteker', e.target.value)} className="h-10" />
                </Field>
                <Field label="Jumlah Lainnya">
                  <Input type="number" min={0} value={form.lainnya} onChange={(e) => set('lainnya', e.target.value)} className="h-10" />
                </Field>
              </>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending} className="h-10">
              Batal
            </Button>
            <Button type="submit" disabled={mutation.isPending} className="h-10 bg-emerald-600 text-white hover:bg-emerald-700">
              {mutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Menyimpan...
                </>
              ) : initial ? (
                'Simpan Perubahan'
              ) : (
                'Tambah Institusi'
              )}
            </Button>
          </DialogFooter>
        </form>
    </>
  );
}
