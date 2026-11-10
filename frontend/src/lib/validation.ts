import { z } from 'zod'

import { isValidPhone } from './phone'
import { isValidDateKey, minutesFromTime } from './time'

const dateKeySchema = z
  .string()
  .min(1, 'Izaberite datum.')
  .refine(isValidDateKey, 'Datum nije ispravan.')

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Vrijeme nije ispravno.')

export const appointmentFormSchema = z
  .object({
    hairdresserId: z.string().min(1, 'Izaberite frizera.'),
    serviceId: z.string().min(1, 'Izaberite uslugu.'),
    clientId: z.string().optional(),
    newClientName: z.string().trim().max(80, 'Ime je predugo.').optional(),
    newClientPhone: z.string().trim().max(30, 'Broj telefona je predugačak.').optional(),
    dateKey: dateKeySchema,
    time: timeSchema,
    internalNote: z.string().trim().max(300, 'Napomena može imati najviše 300 znakova.').optional(),
  })
  .superRefine((values, context) => {
    if (!values.clientId) {
      if (!values.newClientName || values.newClientName.trim().length < 2) {
        context.addIssue({
          code: 'custom',
          path: ['newClientName'],
          message: 'Unesite ime i prezime klijenta.',
        })
      }
      if (!values.newClientPhone || !isValidPhone(values.newClientPhone)) {
        context.addIssue({
          code: 'custom',
          path: ['newClientPhone'],
          message: 'Unesite ispravan broj telefona (najmanje 6 cifara).',
        })
      }
    }
  })

export type AppointmentFormValues = z.infer<typeof appointmentFormSchema>

export const breakFormSchema = z
  .object({
    hairdresserId: z.string().min(1, 'Izaberite frizera.'),
    dateKey: dateKeySchema,
    startTime: timeSchema,
    endTime: timeSchema,
    reason: z
      .string()
      .trim()
      .min(2, 'Unesite razlog (npr. Pauza).')
      .max(80, 'Razlog je predugačak.'),
  })
  .superRefine((values, context) => {
    const start = minutesFromTime(values.startTime)
    const end = minutesFromTime(values.endTime)
    if (start === null || end === null) return
    if (end <= start) {
      context.addIssue({
        code: 'custom',
        path: ['endTime'],
        message: 'Kraj mora biti poslije početka.',
      })
    }
  })

export type BreakFormValues = z.infer<typeof breakFormSchema>

export const publicBookingFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Unesite ime i prezime.')
    .max(80, 'Ime je predugo (najviše 80 znakova).'),
  phone: z
    .string()
    .trim()
    .min(1, 'Unesite broj telefona.')
    .refine(isValidPhone, 'Unesite ispravan broj telefona.'),
  consent: z.boolean().refine((value) => value === true, {
    message: 'Potrebna je saglasnost za obradu podataka.',
  }),
  website: z.string().max(0, 'Polje mora ostati prazno.').optional(),
})

export type PublicBookingFormValues = z.infer<typeof publicBookingFormSchema>

export const rescheduleFormSchema = z.object({
  dateKey: dateKeySchema,
  startsAt: z.string().min(1, 'Izaberite termin.'),
})
