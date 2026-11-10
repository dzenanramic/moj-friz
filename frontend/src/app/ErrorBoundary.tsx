import { Component, type ErrorInfo, type ReactNode } from 'react'

import { Button, buttonClassName } from '@/components/ui/Button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class AppErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Neočekivana greška u demo aplikaciji', error, info.componentStack)
  }

  override render(): ReactNode {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="flex min-h-dvh items-center justify-center bg-paper px-4 py-10">
        <div className="w-full max-w-lg rounded-lg border border-line bg-surface p-6 sm:p-8">
          <p className="text-sm font-medium text-danger">Demo je naišao na grešku</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">
            Prikaz se nije mogao učitati.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Osvježite stranicu ili se vratite na demo početnu. Podaci u ovom pregledniku nisu
            izgubljeni.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={() => window.location.reload()}>Osvježi stranicu</Button>
            <a href="/" className={buttonClassName('secondary')}>
              Demo početna
            </a>
          </div>
        </div>
      </div>
    )
  }
}
