// src/components/ui/Badge.jsx
import { cn } from '../../lib/cn';

const TONES = {
  brand:  'bg-brand-mist text-brand-3 border-brand/20',
  lime:   'bg-lime-soft text-lime border-lime/25',
  muted:  'bg-surface-2 text-ink-2 border-line',
  outline:'bg-white text-ink-2 border-line-strong',
  warn:   'bg-warn-soft text-warn border-warn/25',
  danger: 'bg-danger-soft text-danger border-danger/25',
  info:   'bg-info-soft text-info border-info/25',
};

const SIZES = {
  sm: 'h-6 px-2.5 text-[0.7rem] tracking-[0.05em] uppercase',
  md: 'h-7 px-3 text-[0.78rem]',
};

export function Badge({ tone = 'muted', size = 'sm', className, children, ...rest }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap',
        TONES[tone], SIZES[size], className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}