// src/components/ui/Card.jsx
import { cn } from '../../lib/cn';

export function Card({ as: As = 'div', interactive = false, size = 'md', className, children, ...rest }) {
  return (
    <As
      className={cn(
        size === 'lg' ? 'card-lg' : 'card',
        interactive && 'card-hover cursor-pointer',
        className,
      )}
      {...rest}
    >
      {children}
    </As>
  );
}

export function CardHeader({ className, children, ...rest }) {
  return (
    <div className={cn('px-6 pt-6 pb-3', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardTitle({ as: As = 'h3', className, children, ...rest }) {
  return (
    <As className={cn('text-[1.05rem] font-semibold tracking-[-0.005em] text-ink', className)} {...rest}>
      {children}
    </As>
  );
}

export function CardDescription({ className, children, ...rest }) {
  return (
    <p className={cn('mt-1.5 text-[0.9rem] leading-relaxed text-ink-2', className)} {...rest}>
      {children}
    </p>
  );
}

export function CardBody({ className, children, ...rest }) {
  return (
    <div className={cn('px-6 py-5', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...rest }) {
  return (
    <div className={cn('px-6 pb-6 pt-3 flex items-center gap-3', className)} {...rest}>
      {children}
    </div>
  );
}