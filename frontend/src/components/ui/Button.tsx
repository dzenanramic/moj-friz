import { Loader2 } from 'lucide-react'
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'

import { cn } from '@/lib/cn'

export type ButtonVariant =
  'primary' | 'accent' | 'secondary' | 'ghost' | 'quiet' | 'danger' | 'danger-ghost'

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover',
  /*
   * The one call to action on a screen: a solid ink fill with paper text, no border.
   * In dark mode `ink` is near-white, so the fill becomes the brand blue instead: a cream
   * block would be the loudest thing on a dark page, which is the opposite of quiet.
   */
  accent:
    'bg-ink text-surface hover:brightness-110 dark:bg-primary dark:text-on-primary dark:hover:bg-primary-hover dark:hover:brightness-100',
  secondary: 'bg-surface text-ink ring-1 ring-inset ring-line hover:bg-paper active:bg-paper',
  ghost: 'text-ink hover:bg-primary-tint',
  quiet: 'text-primary hover:bg-primary-tint',
  /*
   * Destructive actions are the brand's own red, as a quiet outline: a filled red is the
   * loudest thing on a page and belongs to nothing else here. The text carries the warning.
   */
  danger: 'bg-surface text-danger ring-1 ring-inset ring-danger hover:bg-danger-tint',
  'danger-ghost': 'text-danger hover:bg-danger-tint hover:text-brick',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-9 rounded-sm px-3 text-sm',
  md: 'min-h-11 rounded-md px-4 text-sm',
  lg: 'min-h-12 rounded-md px-5 text-base',
  icon: 'h-11 w-11 rounded-md p-0',
}

/**
 * Every button answers the pointer: it steps up 1px on hover and settles back on press.
 * Transform plus colour only, so nothing reflows; disabled buttons never move.
 */
export function buttonClassName(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
): string {
  return cn(
    'inline-flex items-center justify-center gap-2 font-medium transition-[background-color,color,box-shadow,transform] duration-150 ease-[cubic-bezier(.2,.8,.2,1)] enabled:hover:-translate-y-px enabled:active:translate-y-0 enabled:active:scale-[0.985] disabled:pointer-events-none disabled:opacity-50',
    variantClasses[variant],
    sizeClasses[size],
    className,
  )
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    children,
    disabled,
    type = 'button',
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClassName(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : leftIcon}
      {children}
    </button>
  )
})

export interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant
  size?: ButtonSize
  leftIcon?: ReactNode
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  leftIcon,
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={buttonClassName(variant, size, className)} {...props}>
      {leftIcon}
      {children}
    </Link>
  )
}
