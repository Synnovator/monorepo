/**
 * Cookie-based session management with AES-GCM encryption.
 * Works in Cloudflare Workers runtime (crypto.subtle).
 */

export interface Session {
  login: string;
  avatar_url: string;
  access_token: string;
}

const COOKIE_NAME = 'session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

async function deriveKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('synnovator-session'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encrypt(data: Session, secret: string): Promise<string> {
  const key = await deriveKey(secret);
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(JSON.stringify(data)),
  );
  const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
}

export async function decrypt(token: string, secret: string): Promise<Session | null> {
  try {
    const key = await deriveKey(secret);
    const combined = Uint8Array.from(atob(token), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext,
    );
    return JSON.parse(new TextDecoder().decode(decrypted)) as Session;
  } catch {
    return null;
  }
}

export function setSessionCookie(headers: Headers, token: string): void {
  headers.append(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`,
  );
}

export function clearSessionCookie(headers: Headers): void {
  headers.append(
    'Set-Cookie',
    `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
  );
}

export function getSessionCookie(request: Request): string | null {
  const cookies = request.headers.get('Cookie') || '';
  const match = cookies.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]*)`));
  return match ? match[1] : null;
}

export async function getSession(request: Request, secret: string): Promise<Session | null> {
  const token = getSessionCookie(request);
  if (!token) return null;
  return decrypt(token, secret);
}
