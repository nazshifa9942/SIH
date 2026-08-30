import React from 'react';
import { cn } from '../../utils/cn';

export const Button = React.forwardRef(({ className, variant = "default", size = "default", ...props }, ref) => {
  const variants = {
    default: "bg-white/10 text-white hover:bg-white/20 border border-white/5",
    outline: "border border-[var(--color-brand-border)] bg-transparent hover:bg-white/5",
    ghost: "bg-transparent hover:bg-white/5 text-[var(--color-brand-text-secondary)] hover:text-white",
    primary: "bg-[var(--color-status-success)] text-white hover:bg-[var(--color-status-success)]/90",
    danger: "bg-[var(--color-status-error)] text-white hover:bg-[var(--color-status-error)]/90",
  };
  
  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-8 rounded-lg px-3 text-[11px] uppercase tracking-wider font-bold",
    lg: "h-12 rounded-xl px-8",
    icon: "h-10 w-10",
  };

  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
});
Button.displayName = "Button";
