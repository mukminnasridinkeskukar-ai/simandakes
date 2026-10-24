'use client';

// =============================================================
// user-form-dialog.tsx — add/edit dialog for Pengguna.
// Password is required when adding, optional when editing.
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
import { createUser, updateUser } from './api';
import { ROLE_OPTIONS, type AppUser, type UserCreateInput, type UserRole, type UserUpdateInput } from './types';

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: AppUser | null;
}

interface UserFormState {
  username: string;
  password: string;
  namaLengkap: string;
  role: UserRole;
  email: string;
}

const DEFAULT_FORM: UserFormState = {
  username: '',
  password: '',
  namaLengkap: '',
  role: 'viewer',
  email: '',
};

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </Label>
      {children}
      {hint ? <p className="text-[11px] text-gray-400">{hint}</p> : null}
    </div>
  );
}

export function UserFormDialog({ open, onOpenChange, initial }: UserFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        {/* Inner form mounts fresh on every open (Radix unmounts content when closed). */}
        <UserForm initial={initial} onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  );
}

function UserForm({ initial, onOpenChange }: { initial: AppUser | null; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<UserFormState>(() =>
    initial
      ? { ...DEFAULT_FORM, username: initial.username, namaLengkap: initial.namaLengkap, role: initial.role, email: initial.email ?? '' }
      : DEFAULT_FORM
  );

  const mutation = useMutation({
    mutationFn: () => {
      if (initial) {
        const payload: UserUpdateInput = {
          namaLengkap: form.namaLengkap.trim(),
          role: form.role,
          email: form.email.trim() || null,
        };
        if (form.password.trim()) payload.password = form.password;
        return updateUser(initial.id, payload);
      }
      const payload: UserCreateInput = {
        username: form.username.trim(),
        password: form.password,
        namaLengkap: form.namaLengkap.trim(),
        role: form.role,
        email: form.email.trim() || null,
      };
      return createUser(payload);
    },
    onSuccess: () => {
      toast.success(initial ? 'Data pengguna berhasil diperbarui.' : 'Pengguna baru berhasil ditambahkan.');
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan data pengguna.');
    },
  });

  function set<K extends keyof UserFormState>(key: K, value: UserFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!initial && !form.username.trim()) {
      toast.error('Username wajib diisi.');
      return;
    }
    if (!form.namaLengkap.trim()) {
      toast.error('Nama lengkap wajib diisi.');
      return;
    }
    if (!initial && !form.password) {
      toast.error('Password wajib diisi untuk pengguna baru.');
      return;
    }
    mutation.mutate();
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{initial ? 'Edit Pengguna' : 'Tambah Pengguna'}</DialogTitle>
        <DialogDescription>
          {initial
            ? `Perbarui data pengguna @${initial.username}.`
            : 'Buat akun baru untuk mengakses panel administrasi.'}
        </DialogDescription>
      </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Username" required={initial === null}>
            <Input
              value={form.username}
              onChange={(e) => set('username', e.target.value)}
              disabled={initial !== null}
              placeholder="username"
              className="h-10"
            />
          </Field>
          <Field
            label="Password"
            required={initial === null}
            hint={initial ? 'Kosongkan jika tidak ingin mengubah password.' : undefined}
          >
            <Input
              type="password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              placeholder={initial ? '••••••••' : 'password'}
              autoComplete={initial ? 'new-password' : 'off'}
              className="h-10"
            />
          </Field>
          <Field label="Nama Lengkap" required>
            <Input value={form.namaLengkap} onChange={(e) => set('namaLengkap', e.target.value)} placeholder="Nama lengkap" className="h-10" />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Role" required>
              <Select value={form.role} onValueChange={(v) => set('role', v as UserRole)}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r} className="capitalize">
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="nama@email.com" className="h-10" />
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
                'Tambah Pengguna'
              )}
            </Button>
          </DialogFooter>
        </form>
    </>
  );
}
