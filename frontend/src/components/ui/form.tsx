import { ChevronDown, TriangleAlert } from 'lucide-react'
import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'

import { cn } from '@/lib/cn'

const controlBase =
  'block w-full rounded-md border border-line bg-surface px-3 text-base text-ink outline-none placeholder:text-muted transition-[border-color,box-shadow,background-color] duration-150 hover:border-muted focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-tint)] disabled:bg-paper disabled:text-muted aria-invalid:border-danger aria-invalid:focus:border-danger aria-invalid:focus:shadow-[0_0_0_3px_var(--brick-tint)]'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(controlBase, 'min-h-11 py-2', className)} {...props} />
  },
)

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(controlBase, 'min-h-24 resize-y py-2.5 leading-relaxed', className)}
      {...props}
    />
  )
})

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <span className="relative block">
        <select
          ref={ref}
          className={cn(controlBase, 'min-h-11 appearance-none py-2 pr-10', className)}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        />
      </span>
    )
  },
)

interface BaseFieldProps {
  label: string
  id: string
  hint?: string
  error?: string
  optional?: boolean
  className?: string
}

function fieldDescriptionIds(id: string, hint?: string, error?: string): string | undefined {
  const ids = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean)
  return ids.length > 0 ? ids.join(' ') : undefined
}

function FieldLabel({
  label,
  htmlFor,
  optional,
}: {
  label: string
  htmlFor: string
  optional?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
      </label>
      {optional ? <span className="text-xs text-muted">neobavezno</span> : null}
    </div>
  )
}

function FieldMessages({ id, hint, error }: { id: string; hint?: string; error?: string }) {
  return (
    <>
      {hint ? (
        <p id={`${id}-hint`} className="text-xs leading-relaxed text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
    </>
  )
}

export interface TextFieldProps
  extends BaseFieldProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'className'> {}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, id, hint, error, optional, className, ...props },
  ref,
) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <FieldLabel label={label} htmlFor={id} optional={optional} />
      <Input
        ref={ref}
        id={id}
        aria-describedby={fieldDescriptionIds(id, hint, error)}
        aria-invalid={error ? true : undefined}
        {...props}
      />
      <FieldMessages id={id} hint={hint} error={error} />
    </div>
  )
})

export interface TextareaFieldProps
  extends BaseFieldProps, Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'className'> {}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  function TextareaField({ label, id, hint, error, optional, className, ...props }, ref) {
    return (
      <div className={cn('space-y-1.5', className)}>
        <FieldLabel label={label} htmlFor={id} optional={optional} />
        <Textarea
          ref={ref}
          id={id}
          aria-describedby={fieldDescriptionIds(id, hint, error)}
          aria-invalid={error ? true : undefined}
          {...props}
        />
        <FieldMessages id={id} hint={hint} error={error} />
      </div>
    )
  },
)

export interface SelectFieldProps
  extends BaseFieldProps, Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'className'> {}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, id, hint, error, optional, className, children, ...props },
  ref,
) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <FieldLabel label={label} htmlFor={id} optional={optional} />
      <Select
        ref={ref}
        id={id}
        aria-describedby={fieldDescriptionIds(id, hint, error)}
        aria-invalid={error ? true : undefined}
        {...props}
      >
        {children}
      </Select>
      <FieldMessages id={id} hint={hint} error={error} />
    </div>
  )
})

/** For custom controls (combobox, segmented input) that manage their own ARIA ids. */
export function CustomField({
  label,
  htmlFor,
  hint,
  error,
  optional,
  className,
  summary,
  children,
}: Omit<BaseFieldProps, 'id'> & { htmlFor: string; children: ReactNode; summary?: ReactNode }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <FieldLabel label={label} htmlFor={htmlFor} optional={optional} />
        {/* A custom control often hides its value behind a glyph; this is that value in words. */}
        {summary ? <p className="text-sm font-medium text-ink">{summary}</p> : null}
      </div>
      {children}
      <FieldMessages id={htmlFor} hint={hint} error={error} />
    </div>
  )
}

interface CheckboxFieldProps {
  id?: string
  label: ReactNode
  error?: string
  className?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  name?: string
  disabled?: boolean
}

export function CheckboxField({
  id,
  label,
  error,
  className,
  checked,
  onCheckedChange,
  name,
  disabled,
}: CheckboxFieldProps) {
  const generatedId = useId()
  const checkboxId = id ?? generatedId
  const errorId = `${checkboxId}-error`

  return (
    <div className={cn('space-y-1', className)}>
      <label
        htmlFor={checkboxId}
        className="flex cursor-pointer items-start gap-3 py-1 text-sm leading-relaxed text-ink"
      >
        <input
          id={checkboxId}
          name={name}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onCheckedChange(event.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="mt-0.5 h-5 w-5 shrink-0 rounded-xs border-line accent-primary"
        />
        <span>{label}</span>
      </label>
      {error ? (
        <p id={errorId} className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function FormError({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-md bg-brick-tint px-3.5 py-3 text-sm leading-relaxed text-danger"
    >
      <TriangleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  )
}

export function FormHint({ children }: { children: ReactNode }) {
  return <p className="text-xs leading-relaxed text-muted">{children}</p>
}
