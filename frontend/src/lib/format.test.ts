import { describe, expect, it } from 'vitest'

import { formatDuration, formatKM, formatPercent, terminology } from './format'
import { isValidPhone, normalizePhone } from './phone'

describe('money and duration formatting', () => {
  it('formats fening as KM without floating point money', () => {
    expect(formatKM(2500)).toBe('25 KM')
    expect(formatKM(2550)).toBe('25,50 KM')
    expect(formatKM(123456)).toBe('1.234,56 KM')
    expect(formatKM(null)).toBe('Cijena na upit')
  })

  it('formats durations for busy salon staff', () => {
    expect(formatDuration(30)).toBe('30 min')
    expect(formatDuration(60)).toBe('1 h')
    expect(formatDuration(150)).toBe('2 h 30 min')
  })

  it('formats rates as percentages with a Bosnian decimal comma', () => {
    expect(formatPercent(0.625)).toBe('63%')
    expect(formatPercent(0.625, 1)).toBe('62,5%')
    expect(formatPercent(0)).toBe('0%')
    expect(formatPercent(Number.NaN)).toBe('0%')
  })

  it('uses Bosnian plural forms', () => {
    expect(terminology(1, 'termin', 'termina', 'termina')).toBe('termin')
    expect(terminology(3, 'termin', 'termina', 'termina')).toBe('termina')
    expect(terminology(11, 'termin', 'termina', 'termina')).toBe('termina')
  })
})

describe('phone normalization', () => {
  it('removes formatting without assuming a country code', () => {
    expect(normalizePhone('061 000 001')).toBe('061000001')
    expect(normalizePhone('+387 61 000 001')).toBe('+38761000001')
    expect(normalizePhone('00387 61 000 001')).toBe('+38761000001')
  })

  it('validates a conservative range of lengths', () => {
    expect(isValidPhone('061 000 001')).toBe(true)
    expect(isValidPhone('123')).toBe(false)
    expect(isValidPhone('+387 (61) 000-001')).toBe(true)
  })
})
