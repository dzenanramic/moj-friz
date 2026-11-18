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
  aside,
  align = 'end',
  actionsWrap = 'stack',
  className,
}: {
  title: string
  description?: ReactNode
  actions?: ReactNode
  /**
   * A control that belongs with the title (a search field, a filter). It shares the
   * title's row at every width: on a phone the title takes what it needs and the
   * control takes the rest, so neither wraps onto its own line.
   */
  aside?: ReactNode
  /** How the action buttons line up against the title: 'end' (common) or 'start' (top row). */
  align?: 'start' | 'end'
  /**
   * What the actions do on a phone. `stack` (the default) puts them on their own line under the
   * title, which suits buttons that carry words. `beside` keeps them in the title's column, so a
   * control can sit to the right of a short title without the header growing; the row starts with
   * zero width, so a control that does not fit opens a gap rather than wrapping under the title.
   * The control is centred against the title's line and its height is rounded up to that line,
   * so the header stays exactly one line tall: a control a few pixels shorter or taller does not
   * push the row down or spill out of the header.
   */
  actionsWrap?: 'stack' | 'beside'
  className?: string
}) {
  return (
    <div
      className={cn(
        // By default the actions drop under a long description on a phone. `align="start"`
        // asks for the actions to sit in the title's row at every width instead.
        'flex flex-col gap-5  sm:flex-row sm:justify-between sm:gap-8 sm:pb-9',
        // `beside` lines the actions up with the title's own row, so they are centred against it.
        align === 'end'
          ? actionsWrap === 'beside'
            ? 'sm:items-center'
            : 'sm:items-end'
          : 'sm:items-start',
        align === 'start' &&
          'max-sm:flex-row max-sm:flex-wrap max-sm:items-start max-sm:gap-x-4 max-sm:gap-y-3',
        actionsWrap === 'beside' &&
          // `max-sm:text-h1` hands the title's line height to the actions row (see below), so a
          // control sized to one `em` is exactly the height of the "Kalendar" line.
          'max-sm:flex-row max-sm:items-center max-sm:justify-between max-sm:gap-x-3 max-sm:gap-y-0 max-sm:text-h1',
        className,
      )}
    >
      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:justify-between sm:gap-6',
          actionsWrap === 'beside' ? 'sm:items-center' : 'sm:items-end',
        )}
      >
        <div className="flex min-w-0 items-center justify-between gap-4 sm:contents">
          <div className="min-w-0">
            <h1 className="text-ink">{title}</h1>
            {description ? (
              <div className="mt-2.5 max-w-[60ch] text-sm leading-relaxed text-muted sm:text-[0.95rem]">
                {description}
              </div>
            ) : null}
          </div>
          {aside ? (
            <div className="min-w-0 flex-1 sm:w-[320px] sm:flex-none lg:w-[360px]">{aside}</div>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div
          className={cn(
            'flex shrink-0 flex-wrap items-center gap-2',
            align === 'start' && 'sm:-mt-1.5',
            actionsWrap === 'beside' &&
              'max-sm:w-0 max-sm:grow max-sm:justify-end max-sm:flex-nowrap max-sm:leading-h1',
          )}
        >
          {actions}
        </div>
      ) : null}
    </div>
  )
}

/**
 * A content object on the page: a list, a day, a client's history. It reads as an object
 * because it has a boundary (one hairline), not because it floats — the only thing that floats
 * in this system is a `Surface` (a sheet, a confirmation). Use a Panel for sections that group
 * real content, never for a single line.
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
    <Tag
      className={cn(
        'rounded-md border border-line bg-surface',
        !hasPadding && 'px-3 py-4 sm:px-4',
        className,
      )}
    >
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
  'aria-labelledby': ariaLabelledBy,
}: {
  children: ReactNode
  className?: string
  as?: 'section' | 'div' | 'article'
  'aria-labelledby'?: string
}) {
  return (
    <Tag
      aria-labelledby={ariaLabelledBy}
      className={cn('rounded-xl bg-surface shadow-card', className)}
    >
      {children}
    </Tag>
  )
}

export function SectionHeading({
  id,
  title,
  description,
  action,
  as: Heading = 'h2',
  className,
}: {
  id?: string
  title: string
  description?: ReactNode
  action?: ReactNode
  as?: 'h2' | 'h3'
  className?: string
}) {
  // Ruled, not boxed: a section is a heading over a hairline with its action on the right,
  // the way a ledger opens a group. Only an object (Panel) gets a full boundary.
  return (
    <div
      className={cn(
        'flex flex-wrap items-end justify-between gap-3 border-b border-line pb-2.5',
        className,
      )}
    >
      <div>
        <Heading id={id} className="text-ink">
          {title}
        </Heading>
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
  as: Heading = 'h3',
  className,
}: {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  /** The heading level that fits the page's outline. Defaults to 'h3'. */
  as?: 'h2' | 'h3'
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg bg-surface px-6 py-14 text-center',
        className,
      )}
    >
      {Icon ? <Icon aria-hidden="true" className="mb-4 h-6 w-6 text-muted" /> : null}
      <Heading className="text-ink">{title}</Heading>
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
        : 'h-9 w-9 text-[0.75rem]'
  return (
    <span
      aria-hidden="true"
      data-staff={colorKey}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md font-semibold',
        colorKey ? 'staff-soft staff-text' : 'bg-paper text-ink',
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
      className="rounded-lg bg-danger-tint px-5 py-4 text-sm leading-relaxed text-danger"
    >
      <p className="font-semibold text-danger">{title}</p>
      {message ? <p className="mt-1">{message}</p> : null}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-sm px-3 font-medium text-danger underline underline-offset-4 hover:text-brick"
        >
          Pokušaj ponovo
        </button>
      ) : null}
    </div>
  )
}
