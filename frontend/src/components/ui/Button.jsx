// src/components/ui/Button.jsx
import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';

const VARIANTS = {
  primary:
    'bg-brand text-white hover:bg-brand-3 ' +
    'shadow-[0_8px_24px_-10px_rgba(5,150,105,0.55)] ' +
    'hover:shadow-[0_14px_34px_-12px_rgba(5,150,105,0.65)] ' +
    'active:translate-y-[1px]',
  secondary:
    'bg-white text-ink border border-line-strong hover:border-brand hover:text-brand ' +
    'shadow-soft',
  outline:
    'bg-transparent text-ink border border-line-strong hover:border-brand hover:text-brand',
  ghost:
    'bg-transparent text-ink-2 hover:text-ink hover:bg-surface-2',
  danger:
    'bg-transparent text-danger border border-danger/30 hover:bg-danger-soft hover:border-danger/60',
  link:
    'bg-transparent text-brand hover:text-brand-3 underline-offset-4 hover:underline px-0',
};

const SIZES = {
  sm: 'h-9  px-3.5 text-[0.82rem] rounded-xl gap-1.5',
  md: 'h-11 px-5   text-[0.9rem]  rounded-xl gap-2',
  lg: 'h-13 px-7   text-[0.95rem] rounded-2xl gap-2.5',
};

export const Button = forwardRef(function Button(
  { as, to, href, variant = 'primary', size = 'md', fullWidth = false, loading = false, className, children, disabled, ...rest },
  ref,
) {
  const Component = as || (to ? Link : href ? 'a' : 'button');
  const isDisabled = disabled || loading;
  return (
    <Component
      ref={ref}
      to={to}
      href={href}
      type={!to && !href && !as ? rest.type ?? 'button' : rest.type}
      disabled={!to && !href && !as ? isDisabled : undefined}
      aria-busy={loading || undefined}
      aria-disabled={isDisabled || undefined}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap font-medium',
        'transition-[background,color,border-color,box-shadow,transform] duration-200',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
        'disabled:opacity-45 disabled:pointer-events-none',
        VARIANTS[variant], SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading && (
        <span aria-hidden="true" className="size-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
      )}
      {children}
    </Component>
  );
});