// src/components/ui/Stat.jsx
import { cn } from '../../lib/cn';

export function Stat({ label, value, hint, tone = 'default', className, children }) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <span className="eyebrow">{label}</span>
      <span
        className={cn(
          'font-display text-3xl md:text-4xl leading-none tracking-[-0.02em]',
          tone === 'brand' && 'text-gradient',
          tone === 'default' && 'text-ink',
          tone === 'muted' && 'text-ink-2',
        )}
      >
        {value}
      </span>
      {hint && <span className="mt-1 text-[0.82rem] text-ink-muted">{hint}</span>}
      {children}
    </div>
  );
}