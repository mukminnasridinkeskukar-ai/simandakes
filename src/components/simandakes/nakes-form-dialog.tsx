'use client';

// =============================================================
// nakes-form-dialog.tsx — add/edit dialog for Data Nakes.
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
import { Textarea } from '@/components/ui/textarea';
import { createNakes, updateNakes } from './api';
import { JENIS_OPTIONS, STATUS_OPTIONS, type Nakes, type NakesInput, type NakesJenis, type NakesStatus } from './types';

interface NakesFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** existing row when editing, null when adding */
  initial: Nakes | null;
}

interface NakesFormState {
  nama: string;
  jenis: NakesJenis;
  spesialisasi: string;
  str: string;
  sip: string;
  alamatPraktik: string;
  jadwalPraktik: string;
  noTelepon: string;
  email: string;
  status: NakesStatus;
  fotoUrl: string;
  alamatGoogleMaps: string;
}

const DEFAULT_FORM: NakesFormState = {
  nama: '',
  jenis: 'Dokter',
  spesialisasi: '',
  str: '',
  sip: '',
  alamatPraktik: '',
  jadwalPraktik: '',
  noTelepon: '',
  email: '',
  status: 'aktif',
  fotoUrl: '',
  alamatGoogleMaps: '',
};

function toFormState(nakes: Nakes): NakesFormState {
  return {
    nama: nakes.nama ?? '',
    jenis: (JENIS_OPTIONS as readonly string[]).includes(nakes.jenis)
      ? (nakes.jenis as NakesJenis)
      : 'Tenaga Kesehatan Lainnya',
    spesialisasi: nakes.spesialisasi ?? '',
    str: nakes.str ?? '',
    sip: nakes.sip ?? '',
    alamatPraktik: nakes.alamatPraktik ?? '',
    jadwalPraktik: nakes.jadwalPraktik ?? '',
    noTelepon: nakes.noTelepon ?? '',
    email: nakes.email ?? '',
    status: nakes.status,
    fotoUrl: nakes.fotoUrl ?? '',
    alamatGoogleMaps: nakes.alamatGoogleMaps ?? '',
  };
}

function orNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </Label>
      {children}
    </div>
  );
}

export function NakesFormDialog({ open, onOpenChange, initial }: NakesFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        {/* Inner form mounts fresh on every open (Radix unmounts content when closed). */}
        <NakesForm initial={initial} onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  );
}

function NakesForm({ initial, onOpenChange }: { initial: Nakes | null; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<NakesFormState>(() => (initial ? toFormState(initial) : DEFAULT_FORM));

  const mutation = useMutation({
    mutationFn: (payload: NakesInput) =>
      initial ? updateNakes(initial.id, payload) : createNakes(payload),
    onSuccess: () => {
      toast.success(initial ? 'Data nakes berhasil diperbarui.' : 'Data nakes berhasil ditambahkan.');
      void queryClient.invalidateQueries({ queryKey: ['nakes'] });
      void queryClient.invalidateQueries({ queryKey: ['stats'] });
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan data nakes.');
    },
  });

  function set<K extends keyof NakesFormState>(key: K, value: NakesFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.nama.trim()) {
      toast.error('Nama wajib diisi.');
      return;
    }
    const payload: NakesInput = {
      nama: form.nama.trim(),
      jenis: form.jenis,
      spesialisasi: orNull(form.spesialisasi),
      str: orNull(form.str),
      sip: orNull(form.sip),
      alamatPraktik: orNull(form.alamatPraktik),
      jadwalPraktik: orNull(form.jadwalPraktik),
      noTelepon: orNull(form.noTelepon),
      email: orNull(form.email),
      status: form.status,
      fotoUrl: orNull(form.fotoUrl),
      alamatGoogleMaps: orNull(form.alamatGoogleMaps),
    };
    mutation.mutate(payload);
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{initial ? 'Edit Data Nakes' : 'Tambah Data Nakes'}</DialogTitle>
        <DialogDescription>
          {initial ? `Perbarui data untuk ${initial.nama}.` : 'Lengkapi formulir untuk menambah tenaga kesehatan baru.'}
        </DialogDescription>
      </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nama Lengkap" required>
              <Input value={form.nama} onChange={(e) => set('nama', e.target.value)} placeholder="Dr. Nama Lengkap" className="h-10" />
            </Field>
            <Field label="Jenis Profesi" required>
              <Select value={form.jenis} onValueChange={(v) => set('jenis', v as NakesJenis)}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Pilih jenis" />
                </SelectTrigger>
                <SelectContent>
                  {JENIS_OPTIONS.map((j) => (
                    <SelectItem key={j} value={j}>
                      {j}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Spesialisasi">
              <Input value={form.spesialisasi} onChange={(e) => set('spesialisasi', e.target.value)} placeholder="Penyakit Dalam" className="h-10" />
            </Field>
            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => set('status', v as NakesStatus)}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="No. STR">
              <Input value={form.str} onChange={(e) => set('str', e.target.value)} placeholder="STR123..." className="h-10" />
            </Field>
            <Field label="No. SIP">
              <Input value={form.sip} onChange={(e) => set('sip', e.target.value)} placeholder="SIP123..." className="h-10" />
            </Field>
            <Field label="No. Telepon">
              <Input value={form.noTelepon} onChange={(e) => set('noTelepon', e.target.value)} placeholder="0812..." className="h-10" />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="nama@email.com" className="h-10" />
            </Field>
            <Field label="Alamat Praktik">
              <Textarea value={form.alamatPraktik} onChange={(e) => set('alamatPraktik', e.target.value)} placeholder="Alamat tempat praktik" rows={2} />
            </Field>
            <Field label="Jadwal Praktik">
              <Textarea value={form.jadwalPraktik} onChange={(e) => set('jadwalPraktik', e.target.value)} placeholder="Senin–Jumat, 08.00–14.00" rows={2} />
            </Field>
            <Field label="URL Foto">
              <Input value={form.fotoUrl} onChange={(e) => set('fotoUrl', e.target.value)} placeholder="https://..." className="h-10" />
            </Field>
            <Field label="URL Google Maps">
              <Input value={form.alamatGoogleMaps} onChange={(e) => set('alamatGoogleMaps', e.target.value)} placeholder="https://maps.google.com/..." className="h-10" />
            </Field>
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
                'Tambah Data'
              )}
            </Button>
          </DialogFooter>
        </form>
    </>
  );
}
