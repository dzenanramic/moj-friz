import { describe, expect, it } from 'vitest'

import { appointmentFormSchema, breakFormSchema, publicBookingFormSchema } from './validation'

describe('appointment form validation', () => {
  const base = {
    hairdresserId: 'hd-lana',
    serviceId: 'svc-zensko',
    dateKey: '2026-11-11',
    time: '09:00',
    internalNote: '',
  }

  it('accepts an existing client', () => {
    const result = appointmentFormSchema.safeParse({ ...base, clientId: 'client-01' })
    expect(result.success).toBe(true)
  })

  it('requires a valid phone when creating a new client', () => {
    const result = appointmentFormSchema.safeParse({
      ...base,
      newClientName: 'Nova Klijentica',
      newClientPhone: '12',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes('newClientPhone'))).toBe(true)
    }
  })

  it('requires a client at all', () => {
    const result = appointmentFormSchema.safeParse(base)
    expect(result.success).toBe(false)
  })
})

describe('break validation', () => {
  it('rejects an end before the start', () => {
    const result = breakFormSchema.safeParse({
      hairdresserId: 'hd-lana',
      dateKey: '2026-11-11',
      startTime: '13:00',
      endTime: '12:00',
      reason: 'Pauza',
    })
    expect(result.success).toBe(false)
  })
})

describe('public booking validation', () => {
  const base = { name: 'Ana Marković', phone: '061 000 001', consent: true, website: '' }

  it('accepts a complete guest booking', () => {
    expect(publicBookingFormSchema.safeParse(base).success).toBe(true)
  })

  it('requires explicit consent', () => {
    const result = publicBookingFormSchema.safeParse({ ...base, consent: false })
    expect(result.success).toBe(false)
  })

  it('rejects a filled honeypot', () => {
    const result = publicBookingFormSchema.safeParse({ ...base, website: 'spam' })
    expect(result.success).toBe(false)
  })
})
