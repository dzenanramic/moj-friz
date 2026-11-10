import * as AlertDialog from '@radix-ui/react-alert-dialog'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

import { Button } from './Button'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'sm:w-[min(92vw,28rem)]',
  md: 'sm:w-[min(92vw,36rem)]',
  lg: 'sm:w-[min(94vw,44rem)]',
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content
          className={cn(
            'dialog-content dialog-sheet w-full p-5 sm:p-6',
            sizeClasses[size],
            className,
          )}
          aria-describedby={description ? 'modal-description' : undefined}
        >
          <div className="flex shrink-0 items-start justify-between gap-4 pr-8">
            <div>
              <Dialog.Title className="font-display text-2xl leading-tight font-semibold tracking-tight text-ink">
                {title}
              </Dialog.Title>
              {description ? (
                <Dialog.Description
                  id="modal-description"
                  className="mt-1.5 text-sm leading-relaxed text-muted"
                >
                  {description}
                </Dialog.Description>
              ) : null}
            </div>
          </div>
          <Dialog.Close asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-3 text-muted"
              aria-label="Zatvori"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </Button>
          </Dialog.Close>
          <div className="dialog-sheet-body mt-5 pr-1">{children}</div>
          {footer ? (
            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-line pt-4 mt-4 sm:flex-row sm:justify-end">
              {footer}
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  tone?: 'danger' | 'primary'
  pending?: boolean
  onConfirm: () => void
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Odustani',
  tone = 'danger',
  pending = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="dialog-overlay" />
        <AlertDialog.Content className="dialog-content w-full p-5 sm:w-[min(92vw,28rem)] sm:p-6">
          <AlertDialog.Title className="font-display text-2xl leading-tight font-semibold tracking-tight text-ink">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm leading-relaxed text-muted">
            {description}
          </AlertDialog.Description>
          <div className="sticky bottom-0 z-10 -mx-5 -mb-5 mt-6 flex flex-col-reverse gap-2 border-t border-line bg-surface px-5 py-4 sm:-mx-6 sm:-mb-6 sm:flex-row sm:justify-end sm:px-6">
            <AlertDialog.Cancel asChild>
              <Button variant="secondary" disabled={pending}>
                {cancelLabel}
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button
                variant={tone === 'danger' ? 'danger' : 'primary'}
                loading={pending}
                onClick={onConfirm}
              >
                {confirmLabel}
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
