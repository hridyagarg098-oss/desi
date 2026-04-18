/**
 * Generates and persists a stable browser-level device identifier.
 * Stored in localStorage so it survives page refreshes but is unique per browser.
 * Used to enforce the max-2-accounts-per-device security rule.
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') return ''
  const KEY = 'velvet_device_id'
  let id = localStorage.getItem(KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(KEY, id)
  }
  return id
}
