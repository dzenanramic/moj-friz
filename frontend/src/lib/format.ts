function groupThousands(value: number): string {
  return Math.trunc(Math.abs(value))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

/**
 * Prices are stored in fening (minor units). Display is always KM, never BAM,
 * and never uses floating point money.
 */
export function formatKM(priceMinor: number | null | undefined): string {
  if (priceMinor === null || priceMinor === undefined) return 'Cijena na upit'
  const negative = priceMinor < 0
  const absolute = Math.abs(Math.round(priceMinor))
  const whole = Math.floor(absolute / 100)
  const fraction = absolute % 100
  const fractionLabel = fraction === 0 ? '' : `,${String(fraction).padStart(2, '0')}`
  return `${negative ? '−' : ''}${groupThousands(whole)}${fractionLabel} KM`
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (rest === 0) return `${hours} h`
  return `${hours} h ${rest} min`
}

/**
 * A rate is stored as 0–1 and read as a percentage. Bosnian uses a comma for decimals and no
 * space before the sign, so the value is formatted here rather than through a locale default.
 */
export function formatPercent(value: number, fractionDigits = 0): string {
  const percentage = Number.isFinite(value) ? value * 100 : 0
  return `${percentage.toFixed(fractionDigits).replace('.', ',')}%`
}

export function formatDurationLong(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${minutes} minuta`
  if (rest === 0) return hours === 1 ? '1 sat' : `${hours} sata`
  return `${hours} h ${rest} min`
}

export function terminology(
  count: number,
  singular: string,
  paucal: string,
  plural: string,
): string {
  const lastTwo = count % 100
  const last = count % 10
  if (lastTwo >= 11 && lastTwo <= 14) return plural
  if (last === 1) return singular
  if (last >= 2 && last <= 4) return paucal
  return plural
}

export function formatTerminCount(count: number): string {
  return `${count} ${terminology(count, 'termin', 'termina', 'termina')}`
}

export function formatHairdresserCount(count: number): string {
  return `${count} ${terminology(count, 'frizer', 'frizera', 'frizera')}`
}

export function formatClientCount(count: number): string {
  return `${count} ${terminology(count, 'klijent', 'klijenta', 'klijenata')}`
}
