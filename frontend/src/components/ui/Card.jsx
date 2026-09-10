import React from 'react';
import { cn } from '../../utils/cn';

export const Card = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-lg border border-[var(--color-brand-border)] bg-white text-[var(--color-brand-text-primary)] shadow-[0_1px_2px_rgba(16,24,40,0.06)] overflow-hidden',
      className
    )}
    {...props}
  >
    {children}
  </div>
));
Card.displayName = 'Card';

export const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col gap-1 px-4 pt-4 pb-3', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-[13px] font-semibold leading-none text-[var(--color-brand-text-primary)] flex items-center gap-2',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

export const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('px-4 pb-4', className)} {...props} />
));
CardContent.displayName = 'CardContent';

