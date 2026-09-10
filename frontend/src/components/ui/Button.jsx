import React from 'react';
import { cn } from '../../utils/cn';

const spinner = (
  <span
    className="mr-1.5 inline-block h-3 w-3 animate-spin rounded-full border-[1.5px] border-current border-t-transparent"
    aria-hidden="true"
  />
);

export const Button = React.forwardRef(
  ({ className, variant = 'default', size = 'default', loading = false, disabled, children, ...props }, ref) => {
    const variants = {
      default:
        'bg-[var(--color-gov-navy)] text-white hover:bg-[var(--color-gov-navy-light)] shadow-[0_1px_2px_rgba(16,24,40,0.06)]',
      primary:
        'bg-[var(--color-gov-saffron)] text-white hover:bg-[#c25f0a] shadow-[0_1px_2px_rgba(16,24,40,0.06)]',
      outline:
        'border border-[var(--color-brand-border-strong)] bg-white text-[var(--color-brand-text-primary)] hover:bg-slate-50',
      ghost: 'bg-transparent text-[var(--color-brand-text-secondary)] hover:bg-slate-100 hover:text-[var(--color-brand-text-primary)]',
      navy: 'bg-[var(--color-gov-navy)] text-white hover:bg-[var(--color-gov-navy-light)]',
      danger: 'bg-[var(--color-status-error)] text-white hover:bg-[#912018]',
      'outline-danger':
        'border border-[#f4c7c3] bg-white text-[var(--color-status-error)] hover:bg-[var(--color-status-error-bg)]',
    };

    const sizes = {
      default: 'h-9 px-3.5 text-[13px]',
      sm: 'h-8 px-3 text-xs',
      lg: 'h-10 px-5 text-sm',
      icon: 'h-9 w-9',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-1.5 rounded-md text-[13px] font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-status-info)]/40 focus-visible:ring-offset-1',
          'disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading && spinner}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

