import React from 'react';
import { cn } from '../../utils/cn';

export const Badge = React.forwardRef(({ className, variant = 'default', ...props }, ref) => {
  const variants = {
    default: 'bg-slate-100 text-[var(--color-brand-text-secondary)] border-slate-200',
    success: 'bg-[var(--color-status-success-bg)] text-[var(--color-status-success)] border-[#abefc6]',
    warning: 'bg-[var(--color-status-warning-bg)] text-[var(--color-status-warning)] border-[#fedf89]',
    error: 'bg-[var(--color-status-error-bg)] text-[var(--color-status-error)] border-[#fecdca]',
    info: 'bg-[var(--color-status-info-bg)] text-[var(--color-status-info)] border-[#b2ddff]',
    saffron: 'bg-orange-50 text-[#b54708] border-[#fed7aa]',
    navy: 'bg-[#0b2545]/[0.06] text-[var(--color-gov-navy)] border-[#0b2545]/20',
    outline: 'bg-white text-[var(--color-brand-text-secondary)] border-[var(--color-brand-border-strong)]',
  };

  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-4',
        variants[variant],
        className
      )}
      {...props}
    />
  );
});
Badge.displayName = 'Badge';

