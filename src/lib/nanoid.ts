/**
 * Tiny nanoid-like ID generator — no external dependency.
 * Returns a URL-safe random string of the given length.
 */
export function nanoid(length = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const arr = new Uint8Array(length)
  crypto.getRandomValues(arr)
  return Array.from(arr, b => chars[b % chars.length]).join('')
}
