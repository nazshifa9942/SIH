import React from 'react';
import { cn } from '../../utils/cn';
import { Badge } from './Badge';

/* ─── Page header: title + description + trailing actions ─────────────── */
export const PageHeader = ({ title, description, actions, className, ...props }) => (
  <div className={cn('flex flex-col gap-3 pb-4 sm:flex-row sm:items-start sm:justify-between', className)} {...props}>
    <div className="min-w-0">
      <h1 className="text-lg font-semibold leading-tight text-[var(--color-brand-text-primary)]">{title}</h1>
      {description && (
        <p className="mt-0.5 text-[13px] text-[var(--color-brand-text-secondary)]">{description}</p>
      )}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

/* ─── Status badge: single source of status → color mapping ───────────── */
const STATUS_MAP = {
  AVAILABLE: 'success',
  OPERATIONAL: 'success',
  ACTIVE: 'success',
  RESOLVED: 'success',
  IN_TRANSIT: 'info',
  CHARTERED: 'info',
  INFO: 'info',
  PENDING: 'warning',
  MAINTENANCE: 'warning',
  WARNING: 'warning',
  MEDIUM: 'warning',
  LOW: 'success',
  HIGH: 'error',
  CRITICAL: 'error',
  ERROR: 'error',
  CANCELLED: 'error',
};

export const StatusBadge = ({ status, className }) => {
  const s = String(status || '').toUpperCase();
  const variant = STATUS_MAP[s] || 'default';
  return (
    <Badge variant={variant} className={className}>
      {String(status || 'Unknown').replace(/_/g, ' ')}
    </Badge>
  );
};

/* ─── Empty state ─────────────────────────────────────────────────────── */
export const EmptyState = ({ icon: Icon, title, description, action, className, ...props }) => (
  <div
    className={cn('flex flex-col items-center justify-center gap-2 px-6 py-12 text-center', className)}
    {...props}
  >
    {Icon && (
      <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
        <Icon className="h-5 w-5 text-[var(--color-brand-text-muted)]" aria-hidden="true" />
      </div>
    )}
    <p className="text-sm font-medium text-[var(--color-brand-text-primary)]">{title}</p>
    {description && (
      <p className="max-w-sm text-[13px] text-[var(--color-brand-text-muted)]">{description}</p>
    )}
    {action && <div className="mt-2">{action}</div>}
  </div>
);

/* ─── Error banner with optional retry ────────────────────────────────── */
export const ErrorBanner = ({ message, onRetry, className }) => (
  <div
    role="alert"
    className={cn(
      'flex items-center justify-between gap-3 rounded-md border border-[#fecdca] bg-[var(--color-status-error-bg)] px-3.5 py-2.5 text-[13px] text-[var(--color-status-error)]',
      className
    )}
  >
    <span>{message || 'Something went wrong while loading data.'}</span>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="shrink-0 rounded-md border border-[#fecdca] px-2 py-1 text-xs font-medium hover:bg-white"
      >
        Retry
      </button>
    )}
  </div>
);

/* ─── Skeletons ───────────────────────────────────────────────────────── */
export const Skeleton = ({ className, ...props }) => (
  <div className={cn('skeleton h-4 w-full', className)} aria-hidden="true" {...props} />
);

export const SkeletonCard = ({ lines = 3, className }) => (
  <div className={cn('rounded-lg border border-[var(--color-brand-border)] bg-white p-4', className)}>
    <Skeleton className="h-3 w-1/3" />
    <div className="mt-3 space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-3" />
      ))}
    </div>
  </div>
);

/* ─── Form controls ───────────────────────────────────────────────────── */
export const Input = React.forwardRef(({ label, id, className, ...props }, ref) => (
  <div className={className}>
    {label && (
      <label htmlFor={id} className="ui-label">
        {label}
      </label>
    )}
    <input ref={ref} id={id} className="ui-input" {...props} />
  </div>
));
Input.displayName = 'Input';

export const Select = React.forwardRef(({ label, id, options = [], className, children, ...props }, ref) => (
  <div className={className}>
    {label && (
      <label htmlFor={id} className="ui-label">
        {label}
      </label>
    )}
    <select ref={ref} id={id} className="ui-select" {...props}>
      {children ??
        options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
    </select>
  </div>
));
Select.displayName = 'Select';

/* ─── Modal ───────────────────────────────────────────────────────────── */
export const Modal = ({ open, onClose, title, children, footer, size = 'md' }) => {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div
        className={cn(
          'relative flex max-h-[85vh] w-full flex-col rounded-lg border border-[var(--color-brand-border)] bg-white shadow-[0_12px_32px_-8px_rgba(16,24,40,0.18)]',
          widths[size]
        )}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-brand-border)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--color-brand-text-primary)]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-md p-1 text-[var(--color-brand-text-muted)] hover:bg-slate-100"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-[var(--color-brand-border)] px-4 py-3">{footer}</div>
        )}
      </div>
    </div>
  );
};
