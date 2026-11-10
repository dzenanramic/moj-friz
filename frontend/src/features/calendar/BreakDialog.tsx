import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/Button'
import { FormError, SelectField } from '@/components/ui/form'
import { Modal } from '@/components/ui/Modal'
import { gatewayErrorMessage } from '@/data/gateway'
import { useCreateTimeBlock, useHairdressers } from '@/data/queries'
import {
  addDaysToDateKey,
  capitalizeFirst,
  formatDateKey,
  formatWeekday,
  rangeDateKeys,
  timeFromMinutes,
  todayDateKey,
} from '@/lib/time'
import { breakFormSchema, type BreakFormValues } from '@/lib/validation'

const TIME_OPTIONS = Array.from({ length: 57 }, (_, index) => timeFromMinutes(7 * 60 + index * 15))

interface BreakDialogProps {
  defaultDateKey?: string
  defaultHairdresserId?: string
  onClose: () => void
}

export function BreakDialog({ defaultDateKey, defaultHairdresserId, onClose }: BreakDialogProps) {
  const hairdressers = useHairdressers()
  const createBlock = useCreateTimeBlock()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const activeHairdressers = useMemo(
    () => (hairdressers.data ?? []).filter((hairdresser) => hairdresser.isActive),
    [hairdressers.data],
  )
  const firstHairdresser = defaultHairdresserId ?? activeHairdressers[0]?.id ?? ''

  const today = todayDateKey()
  const dateOptions = useMemo(() => rangeDateKeys(today, addDaysToDateKey(today, 90)), [today])

  const form = useForm<BreakFormValues>({
    resolver: zodResolver(breakFormSchema),
    defaultValues: {
      hairdresserId: firstHairdresser,
      dateKey: defaultDateKey ?? todayDateKey(),
      startTime: '12:00',
      endTime: '12:30',
      reason: 'Pauza',
    },
  })
  const { register, handleSubmit, formState, setValue } = form
  const errors = formState.errors

  useEffect(() => {
    if (!form.getValues('hairdresserId') && activeHairdressers[0]) {
      setValue('hairdresserId', activeHairdressers[0].id)
    }
  }, [activeHairdressers, form, setValue])

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)
    try {
      await createBlock.mutateAsync({
        hairdresserId: values.hairdresserId,
        dateKey: values.dateKey,
        startTime: values.startTime,
        endTime: values.endTime,
        reason: values.reason,
      })
      toast.success('Pauza je dodata u raspored.')
      onClose()
    } catch (error) {
      setSubmitError(gatewayErrorMessage(error))
    }
  })

  return (
    <Modal
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title="Dodaj pauzu ili odsustvo"
      description="Blokirajte vrijeme u rasporedu jednog frizera. Pauza se odmah vidi i u online dostupnosti."
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={createBlock.isPending}>
            Odustani
          </Button>
          <Button type="submit" form="break-form" loading={createBlock.isPending}>
            Dodaj u raspored
          </Button>
        </>
      }
    >
      <form id="break-form" onSubmit={onSubmit} className="space-y-5" noValidate>
        {submitError ? <FormError>{submitError}</FormError> : null}

        <SelectField
          label="Frizer"
          id="break-hairdresser"
          error={errors.hairdresserId?.message}
          {...register('hairdresserId')}
        >
          <option value="">Izaberite frizera</option>
          {activeHairdressers.map((hairdresser) => (
            <option key={hairdresser.id} value={hairdresser.id}>
              {hairdresser.displayName}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Datum"
          id="break-date"
          error={errors.dateKey?.message}
          {...register('dateKey')}
        >
          {dateOptions.map((option) => (
            <option key={option} value={option}>
              {option === today
                ? `Danas — ${formatDateKey(option)}`
                : option === addDaysToDateKey(today, 1)
                  ? `Sutra — ${formatDateKey(option)}`
                  : `${capitalizeFirst(formatWeekday(option))}, ${formatDateKey(option)}`}
            </option>
          ))}
        </SelectField>

        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Od"
            id="break-start"
            error={errors.startTime?.message}
            {...register('startTime')}
          >
            {TIME_OPTIONS.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Do"
            id="break-end"
            error={errors.endTime?.message}
            {...register('endTime')}
          >
            {TIME_OPTIONS.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </SelectField>
        </div>

        <SelectField
          label="Razlog"
          id="break-reason"
          error={errors.reason?.message}
          {...register('reason')}
        >
          <option value="Pauza">Pauza</option>
          <option value="Odsustvo">Odsustvo</option>
          <option value="Sastanak">Sastanak</option>
          <option value="Drugi razlog">Drugi razlog</option>
        </SelectField>

        <p className="text-xs leading-relaxed text-muted">
          Pauza mora biti unutar radnog vremena i ne smije se preklopiti sa postojećim terminom.
        </p>
      </form>
    </Modal>
  )
}
