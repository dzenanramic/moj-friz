function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function createOpaqueToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return bytesToBase64Url(bytes)
}

export async function hashToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export function readTokenFromFragment(hash: string): string | null {
  const value = new URLSearchParams(hash.replace(/^#/, '')).get('t')
  return value && value.length > 0 ? value : null
}

export function managementPath(token: string): string {
  return `/upravljanje#t=${encodeURIComponent(token)}`
}

export function confirmationPath(slug: string, token: string): string {
  return `/rezervacija/${encodeURIComponent(slug)}/potvrda#t=${encodeURIComponent(token)}`
}
