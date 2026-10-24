// =============================================================
// api.ts — typed fetch helpers for the SIMANDAKES REST contract.
// The backend (src/app/api/**) is owned by the backend agent;
// this module only consumes it.
// =============================================================

import type {
  AppUser,
  InstitusiNamed,
  InstitusiNamedInput,
  InstitusiNakes,
  InstitusiNakesInput,
  Nakes,
  NakesInput,
  Stats,
  UserCreateInput,
  UserUpdateInput,
} from './types';

/** Typed JSON fetch. Throws Error with the server-provided message on failure. */
export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      credentials: 'same-origin',
      headers: {
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new Error('Tidak dapat terhubung ke server. Periksa koneksi Anda.');
  }

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    let message = `Permintaan gagal (${res.status})`;
    if (payload && typeof payload === 'object' && 'error' in payload) {
      const err = (payload as { error?: unknown }).error;
      if (typeof err === 'string' && err.length > 0) message = err;
    }
    throw new Error(message);
  }

  return payload as T;
}

// ---------------- Auth ----------------

export async function login(username: string, password: string): Promise<AppUser> {
  const res = await fetchJson<{ user: AppUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  return res.user;
}

export async function logout(): Promise<void> {
  await fetchJson<{ success: boolean }>('/api/auth/logout', { method: 'POST' });
}

export async function fetchSession(): Promise<AppUser | null> {
  const res = await fetchJson<{ user: AppUser | null }>('/api/auth/session');
  return res.user;
}

// ---------------- Stats ----------------

export async function fetchStats(): Promise<Stats> {
  return fetchJson<Stats>('/api/stats');
}

// ---------------- Nakes (data nakes) ----------------

export async function fetchNakes(): Promise<Nakes[]> {
  const res = await fetchJson<{ data: Nakes[] }>('/api/nakes');
  return res.data;
}

export async function createNakes(input: NakesInput): Promise<Nakes> {
  const res = await fetchJson<{ data: Nakes }>('/api/nakes', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function updateNakes(id: string, input: NakesInput): Promise<Nakes> {
  const res = await fetchJson<{ data: Nakes }>(`/api/nakes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function deleteNakes(id: string): Promise<void> {
  await fetchJson<{ success: boolean }>(`/api/nakes/${id}`, { method: 'DELETE' });
}

// ---------------- Institusi Named ----------------

export async function fetchNamed(): Promise<InstitusiNamed[]> {
  const res = await fetchJson<{ data: InstitusiNamed[] }>('/api/named');
  return res.data;
}

export async function createNamed(input: InstitusiNamedInput): Promise<InstitusiNamed> {
  const res = await fetchJson<{ data: InstitusiNamed }>('/api/named', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function updateNamed(id: string, input: InstitusiNamedInput): Promise<InstitusiNamed> {
  const res = await fetchJson<{ data: InstitusiNamed }>(`/api/named/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function deleteNamed(id: string): Promise<void> {
  await fetchJson<{ success: boolean }>(`/api/named/${id}`, { method: 'DELETE' });
}

// ---------------- Institusi Nakes ----------------

export async function fetchInstitusiNakes(): Promise<InstitusiNakes[]> {
  const res = await fetchJson<{ data: InstitusiNakes[] }>('/api/institusi-nakes');
  return res.data;
}

export async function createInstitusiNakes(input: InstitusiNakesInput): Promise<InstitusiNakes> {
  const res = await fetchJson<{ data: InstitusiNakes }>('/api/institusi-nakes', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function updateInstitusiNakes(id: string, input: InstitusiNakesInput): Promise<InstitusiNakes> {
  const res = await fetchJson<{ data: InstitusiNakes }>(`/api/institusi-nakes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function deleteInstitusiNakes(id: string): Promise<void> {
  await fetchJson<{ success: boolean }>(`/api/institusi-nakes/${id}`, { method: 'DELETE' });
}

// ---------------- Users ----------------

export async function fetchUsers(): Promise<AppUser[]> {
  const res = await fetchJson<{ data: AppUser[] }>('/api/users');
  return res.data;
}

export async function createUser(input: UserCreateInput): Promise<AppUser> {
  const res = await fetchJson<{ data: AppUser }>('/api/users', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function updateUser(id: string, input: UserUpdateInput): Promise<AppUser> {
  const res = await fetchJson<{ data: AppUser }>(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function deleteUser(id: string): Promise<void> {
  await fetchJson<{ success: boolean }>(`/api/users/${id}`, { method: 'DELETE' });
}
