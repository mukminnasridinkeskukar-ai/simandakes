import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

/**
 * SIMANDAKES auth utilities — zero external dependencies.
 *
 * - Password hashing: scryptSync with random 16-byte salt → "salt:hash" (hex)
 * - Session: HMAC-SHA256 signed cookie `simandakes_session`
 *   value = base64url(JSON payload) + "." + hmacHex
 *   payload = { u: username, r: role, n: namaLengkap, exp: epochMillis }
 */

export const SESSION_COOKIE_NAME = 'simandakes_session'
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 days
const SESSION_TTL_MS = SESSION_MAX_AGE_SECONDS * 1000

const AUTH_SECRET =
  process.env.AUTH_SECRET || 'simandakes-dev-secret-2024'

export interface SessionPayload {
  u: string // username
  r: string // role
  n: string // namaLengkap
  exp: number // expiry (epoch millis)
}

export interface SessionUser {
  username: string
  role: string
  namaLengkap: string
}

// ---------------------------------------------------------------------------
// Password hashing (scrypt)
// ---------------------------------------------------------------------------

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = String(stored).split(':')
    if (!salt || !hash) return false
    const candidate = scryptSync(password, salt, 64)
    const expected = Buffer.from(hash, 'hex')
    if (candidate.length !== expected.length) return false
    return timingSafeEqual(candidate, expected)
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Session token (HMAC-signed)
// ---------------------------------------------------------------------------

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/')
  return Buffer.from(padded, 'base64').toString('utf8')
}

function sign(data: string): string {
  return createHmac('sha256', AUTH_SECRET).update(data).digest('hex')
}

export function createSessionCookieValue(
  payload: Omit<SessionPayload, 'exp'> & { exp?: number }
): string {
  const full: SessionPayload = {
    u: payload.u,
    r: payload.r,
    n: payload.n,
    exp: payload.exp ?? Date.now() + SESSION_TTL_MS,
  }
  const body = base64UrlEncode(JSON.stringify(full))
  return `${body}.${sign(body)}`
}

export function verifySessionCookieValue(value: string | undefined | null): SessionPayload | null {
  if (!value) return null
  const dotIndex = value.lastIndexOf('.')
  if (dotIndex <= 0) return null
  const body = value.slice(0, dotIndex)
  const sig = value.slice(dotIndex + 1)
  if (!body || !sig) return null
  try {
    const expected = sign(body)
    const a = Buffer.from(sig, 'hex')
    const b = Buffer.from(expected, 'hex')
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
    const payload = JSON.parse(base64UrlDecode(body)) as SessionPayload
    if (
      typeof payload.u !== 'string' ||
      typeof payload.r !== 'string' ||
      typeof payload.n !== 'string' ||
      typeof payload.exp !== 'number'
    ) {
      return null
    }
    if (payload.exp <= Date.now()) return null
    return payload
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Helpers for route handlers / server code
// ---------------------------------------------------------------------------

/** Reads and verifies the session cookie from incoming request cookies. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value
  const payload = verifySessionCookieValue(raw)
  if (!payload) return null
  return {
    username: payload.u,
    role: payload.r,
    namaLengkap: payload.n,
  }
}

/** Alias used inside route handlers — returns null → respond 401. */
export async function requireAuth(): Promise<SessionUser | null> {
  return getSessionUser()
}
