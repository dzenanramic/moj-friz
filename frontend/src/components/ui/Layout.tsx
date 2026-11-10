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
        'flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-6',
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="font-display text-[2rem] leading-[1.05] font-semibold tracking-[-0.02em] text-ink sm:text-[2.6rem]">
          {title}
        </h1>
        {description ? (
          <div className="mt-2 max-w-[62ch] text-sm leading-relaxed text-muted sm:text-[0.95rem]">
            {description}
          </div>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

export function Panel({
  children,
  className,
  as: Tag = 'section',
}: {
  children: ReactNode
  className?: string
  as?: 'section' | 'div' | 'article'
}) {
  return <Tag className={cn('rounded-lg border border-line bg-surface', className)}>{children}</Tag>
}

export function SectionHeading({
  title,
  description,
  action,
  className,
}: {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-3', className)}>
      <div>
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
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
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-line-strong bg-surface/60 px-6 py-12 text-center',
        className,
      )}
    >
      {Icon ? (
        <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-pine-soft text-pine">
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
      ) : null}
      <h3 className="font-display text-xl font-semibold tracking-tight text-ink">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn('block animate-pulse rounded bg-line/70', className)} />
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
      ? 'h-8 w-8 text-[0.65rem]'
      : size === 'lg'
        ? 'h-12 w-12 text-sm'
        : 'h-10 w-10 text-xs'
  return (
    <span
      aria-hidden="true"
      data-staff={colorKey}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-wide',
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
      <dt className="text-xs font-medium text-muted">{label}</dt>
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
      className="rounded-lg border border-danger/25 bg-danger-soft px-5 py-4 text-sm leading-relaxed text-danger-strong"
    >
      <p className="font-semibold">{title}</p>
      {message ? <p className="mt-1 opacity-90">{message}</p> : null}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 inline-flex min-h-9 items-center rounded-sm border border-danger/30 px-3 text-sm font-medium transition-colors hover:bg-danger/10"
        >
          Pokušaj ponovo
        </button>
      ) : null}
    </div>
  )
}
