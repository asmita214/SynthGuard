// src/components/ui/StatusPill.jsx
import { RefreshCw } from 'lucide-react';
import { useServerStatus } from '../../hooks/useServerStatus';
import { cn } from '../../lib/cn';

const STATES = {
  online:  { label: 'Server online',      dot: 'bg-brand text-brand',   shell: 'border-brand/30 bg-brand-mist text-brand-3' },
  waking:  { label: 'Waking server',      dot: 'bg-warn text-warn pulse-dot', shell: 'border-warn/30 bg-warn-soft text-warn' },
  offline: { label: 'Server unreachable', dot: 'bg-danger text-danger', shell: 'border-danger/30 bg-danger-soft text-danger' },
};

export function StatusPill({ compact = false, className }) {
  const { status, retry } = useServerStatus();
  const cfg = STATES[status] ?? STATES.offline;
  return (
    <button
      type="button"
      onClick={retry}
      title="Click to re-check the server"
      aria-label={`${cfg.label}. Click to re-check.`}
      className={cn(
        'group inline-flex items-center gap-2 rounded-full border px-3 h-8',
        'text-[0.78rem] font-medium transition-colors duration-200',
        cfg.shell, className,
      )}
    >
      <span className="relative flex size-2 items-center justify-center">
        <span className={cn('absolute size-2 rounded-full', cfg.dot)} />
      </span>
      {!compact && <span className="hidden sm:inline">{cfg.label}</span>}
      <RefreshCw className="size-3 opacity-0 -ml-1 transition-opacity duration-200 group-hover:opacity-70" aria-hidden="true" />
    </button>
  );
}