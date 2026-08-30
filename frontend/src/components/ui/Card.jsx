import React from 'react';
import { cn } from '../../utils/cn';

export const Card = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl bg-[var(--color-brand-elevated)] text-[var(--color-brand-text-primary)] border border-[var(--color-brand-border)] shadow-md overflow-hidden",
      className
    )}
    {...props}
  >
    {children}
  </div>
));
Card.displayName = "Card";

export const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1 p-4 pb-2", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-[11px] font-semibold leading-none tracking-[0.15em] text-[var(--color-brand-text-secondary)] uppercase flex items-center gap-2", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

export const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4 pt-4", className)} {...props} />
));
CardContent.displayName = "CardContent";
