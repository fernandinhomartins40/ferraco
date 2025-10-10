/**
 * Generate UUID v4 compatible with both HTTP and HTTPS contexts
 * Falls back to Math.random() when crypto.randomUUID is not available
 */
export function generateUUID(): string {
  // Try to use crypto.randomUUID (only works in secure contexts - HTTPS)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback: Generate UUID v4 using Math.random()
  // Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
