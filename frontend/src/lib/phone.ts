/**
 * Conservative phone normalization: never assume that a local number belongs
 * to +387, and never invent a country code. We only remove formatting.
 */
export function normalizePhone(phone: string): string {
  const trimmed = phone.trim()
  const hasPlus = trimmed.startsWith('+')
  let digits = trimmed.replace(/\D/g, '')

  if (digits.startsWith('00')) {
    digits = digits.slice(2)
    return `+${digits}`
  }

  if (hasPlus) return `+${digits}`
  return digits
}

export function isValidPhone(phone: string): boolean {
  const normalized = normalizePhone(phone)
  const digits = normalized.replace(/\D/g, '')
  return digits.length >= 6 && digits.length <= 20
}

export function normalizedPhonesMatch(left: string, right: string): boolean {
  const a = normalizePhone(left)
  const b = normalizePhone(right)
  return a.length > 0 && a === b
}
