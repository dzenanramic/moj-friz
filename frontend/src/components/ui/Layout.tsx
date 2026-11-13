import { ArrowLeft, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

import type { StaffColor } from '@/data/types'
import { cn } from '@/lib/cn'
import { initials } from '@/lib/text'

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string
  description?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-5 pb-7 sm:flex-row sm:items-end sm:justify-between sm:gap-8 sm:pb-9',
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-ink">{title}</h1>
        {description ? (
          <div className="mt-2.5 max-w-[60ch] text-sm leading-relaxed text-muted sm:text-[0.95rem]">
            {description}
          </div>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

/**
 * The standard content block: no border, slightly lifted from the page.
 * Use it for sections that group real content, never for a single line.
 */
export function Panel({
  children,
  className,
  as: Tag = 'section',
}: {
  children: ReactNode
  className?: string
  as?: 'section' | 'div' | 'article'
}) {
  // Width padding lets list rows inside a Panel line up with the page edge instead of
  // being inset twice. Ad-hoc padding can still override it.
  const hasPadding =
    className?.includes('p-') || className?.includes('px-') || className?.includes('py-')
  return (
    <Tag className={cn('rounded-lg bg-surface', !hasPadding && 'px-3 py-4 sm:px-4', className)}>
      {children}
    </Tag>
  )
}

/**
 * A surface that should read as physically above the page: dialogs, the hero
 * preview, the confirmation. Only one elevation in the system.
 */
export function Surface({
  children,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode
  className?: string
  as?: 'section' | 'div' | 'article'
}) {
  return (
    <Tag
      className={cn(
        'rounded-xl bg-surface shadow-[0_1px_2px_rgb(20_24_21/0.05),0_14px_36px_-22px_rgb(20_24_21/0.3)]',
        className,
      )}
    >
      {children}
    </Tag>
  )
}

export function SectionHeading({
  title,
  description,
  action,
  as: Heading = 'h2',
  className,
}: {
  title: string
  description?: ReactNode
  action?: ReactNode
  as?: 'h2' | 'h3'
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-3', className)}>
      <div>
        <Heading className="text-ink">{title}</Heading>
        {description ? (
          <p className="mt-1.5 max-w-[58ch] text-sm leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg bg-surface px-6 py-14 text-center',
        className,
      )}
    >
      {Icon ? <Icon aria-hidden="true" className="mb-4 h-6 w-6 text-line-strong" /> : null}
      <h3 className="text-ink">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn('block animate-pulse rounded bg-line', className)} />
  )
}

export function Avatar({
  name,
  colorKey,
  size = 'md',
}: {
  name: string
  colorKey?: StaffColor
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeClass =
    size === 'sm'
      ? 'h-7 w-7 text-[0.65rem]'
      : size === 'lg'
        ? 'h-11 w-11 text-sm'
        : 'h-9 w-9 text-xs'
  return (
    <span
      aria-hidden="true"
      data-staff={colorKey}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md font-semibold',
        colorKey ? 'staff-soft staff-text' : 'bg-paper text-muted',
        sizeClass,
      )}
    >
      {initials(name)}
    </span>
  )
}

export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-ink"
    >
      <ArrowLeft aria-hidden="true" className="h-4 w-4" />
      {children}
    </Link>
  )
}

export function DefinitionItem({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-1', className)}>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-sm leading-relaxed text-ink">{children}</dd>
    </div>
  )
}

export function ErrorState({
  title = 'Podaci se nisu učitali.',
  message,
  onRetry,
}: {
  title?: string
  message?: string
  onRetry?: () => void
}) {
  return (
    <div
      role="alert"
      className="rounded-lg bg-danger-soft px-5 py-4 text-sm leading-relaxed text-danger-strong"
    >
      <p className="font-semibold text-ink">{title}</p>
      {message ? <p className="mt-1">{message}</p> : null}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 font-medium text-danger underline underline-offset-4 hover:text-danger-strong"
        >
          Pokušaj ponovo
        </button>
      ) : null}
    </div>
  )
}
