// src/components/ui/EmptyState.jsx
import { cn } from '../../lib/cn';

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'px-8 py-14 rounded-2xl border border-dashed border-line-strong bg-white/60',
        className,
      )}
    >
      {Icon && (
        <div className="mb-5 flex size-12 items-center justify-center rounded-2xl border border-line bg-brand-mist text-brand shadow-soft">
          <Icon className="size-5" aria-hidden="true" />
        </div>
      )}
      <h3 className="font-display text-xl text-ink">{title}</h3>
      {description && <p className="mt-2 max-w-md text-[0.92rem] leading-relaxed text-ink-2">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}