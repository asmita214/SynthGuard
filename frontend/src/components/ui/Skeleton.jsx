// src/components/ui/Skeleton.jsx
import { cn } from '../../lib/cn';

export function Skeleton({ className, rounded = 'md' }) {
  const radius = { sm: 'rounded-md', md: 'rounded-xl', lg: 'rounded-2xl', pill: 'rounded-full' }[rounded];
  return (
    <div
      className={cn('animate-pulse bg-surface-3', radius, className)}
      aria-hidden="true"
    />
  );
}