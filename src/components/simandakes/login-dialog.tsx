'use client';

// =============================================================
// login-dialog.tsx — global login dialog (opened from landing,
// dashboard header, sidebar and the admin view).
// =============================================================

import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, HeartPulse, Loader2, LockKeyhole, User } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from './api';
import { useSimandakesStore } from './store';

export function LoginDialog() {
  const open = useSimandakesStore((s) => s.loginOpen);
  const setOpen = useSimandakesStore((s) => s.setLoginOpen);
  const setView = useSimandakesStore((s) => s.setView);
  const view = useSimandakesStore((s) => s.view);
  const setUser = useSimandakesStore((s) => s.setUser);
  const queryClient = useQueryClient();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => login(username.trim(), password),
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(['session'], user);
      void queryClient.invalidateQueries({ queryKey: ['session'] });
      toast.success(`Selamat datang, ${user.namaLengkap || user.username}!`);
      setOpen(false);
      setUsername('');
      setPassword('');
      setError(null);
      // If already inside the dashboard go to the admin panel,
      // otherwise enter the dashboard.
      setView(view === 'landing' ? 'named' : 'admin-dashboard');
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : 'Username atau password salah!');
    },
  });

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError('Username dan password wajib diisi.');
      return;
    }
    mutation.mutate();
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setError(null);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-h-[85vh] max-w-md overflow-y-auto">
        <DialogHeader className="items-center text-center sm:items-center sm:text-center">
          <div
            className="mx-auto mb-1 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/25"
            aria-hidden
          >
            <HeartPulse className="size-7" />
          </div>
          <DialogTitle className="text-xl font-bold">Masuk ke SIMANDAKES</DialogTitle>
          <DialogDescription>
            Masuk dengan akun Anda untuk mengelola data SDM Kesehatan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-username">Username</Label>
            <div className="relative">
              <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" aria-hidden />
              <Input
                id="login-username"
                autoComplete="username"
                placeholder="Masukkan username"
                className="h-11 pl-9"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" aria-hidden />
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder="Masukkan password"
                className="h-11 pl-9"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error ? (
            <Alert variant="destructive" role="alert">
              <AlertCircle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <Button
            type="submit"
            disabled={mutation.isPending}
            className="h-11 w-full bg-emerald-600 text-base text-white hover:bg-emerald-700"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Memproses...
              </>
            ) : (
              'Masuk'
            )}
          </Button>

          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-center text-xs text-emerald-800">
            Demo: <span className="font-semibold">admin / admin123</span> — juga tersedia{' '}
            <span className="font-semibold">operator / operator123</span>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
