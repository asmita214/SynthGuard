// src/components/ui/ErrorState.jsx
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../lib/cn';

export function ErrorState({
  title = 'Something went wrong', message, onRetry,
  retryLabel = 'Try again', secondary, className,
}) {
  return (
    <div
      role="alert"
      className={cn('rounded-2xl border border-danger/20 bg-danger-soft/50 px-6 py-8 text-center', className)}
    >
      <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-2xl border border-danger/25 bg-white text-danger shadow-soft">
        <AlertTriangle className="size-5" aria-hidden="true" />
      </div>
      <h3 className="font-display text-xl text-ink">{title}</h3>
      {message && <p className="mx-auto mt-2 max-w-lg text-[0.92rem] leading-relaxed text-ink-2">{message}</p>}
      {(onRetry || secondary) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {onRetry && (
            <Button variant="secondary" size="sm" onClick={onRetry}>
              <RotateCcw className="size-3.5" aria-hidden="true" />{retryLabel}
            </Button>
          )}
          {secondary}
        </div>
      )}
    </div>
  );
}