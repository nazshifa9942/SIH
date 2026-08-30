import React from 'react';
import { cn } from '../../utils/cn';

export const Badge = React.forwardRef(({ className, variant = "default", ...props }, ref) => {
  const variants = {
    default: "bg-[var(--color-brand-elevated)] text-[var(--color-brand-text-primary)] border-transparent",
    success: "bg-[var(--color-status-success)]/10 text-[var(--color-status-success)] border-[var(--color-status-success)]/20",
    warning: "bg-[var(--color-status-warning)]/10 text-[var(--color-status-warning)] border-[var(--color-status-warning)]/20",
    error: "bg-[var(--color-status-error)]/10 text-[var(--color-status-error)] border-[var(--color-status-error)]/20",
    info: "bg-[var(--color-status-info)]/10 text-[var(--color-status-info)] border-[var(--color-status-info)]/20",
    outline: "text-[var(--color-brand-text-primary)] border-[var(--color-brand-border)]",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  );
});
Badge.displayName = "Badge";
