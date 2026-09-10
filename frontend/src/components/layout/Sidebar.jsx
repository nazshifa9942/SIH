import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Ship, Box, TrendingUp, AlertCircle, Anchor, Compass, Shield, GitCompare, X } from 'lucide-react';
import { cn } from '../../utils/cn';

const navigation = [
  { name: 'Overview', to: '/', icon: LayoutDashboard },
  { name: 'Cargo', to: '/cargo', icon: Box },
  { name: 'Vessels', to: '/vessels', icon: Ship },
  { name: 'Ports', to: '/ports', icon: Anchor },
  { name: 'Map', to: '/map', icon: Compass },
  { name: 'Market', to: '/market', icon: TrendingUp },
  { name: 'Alerts', to: '/alerts', icon: AlertCircle },
  { name: 'Admin', to: '/admin', icon: Shield },
  { name: 'What-If', to: '/what-if', icon: GitCompare },
];

const SidebarContent = ({ onNavigate }) => (
  <>
    <div className="relative flex h-16 shrink-0 items-center gap-3 border-b border-[var(--color-brand-border)] px-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--color-gov-navy)]">
        <Anchor className="h-5 w-5 text-white" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-brand-text-muted)]">
          Government of India
        </div>
        <div className="truncate text-[13px] font-semibold leading-tight text-[var(--color-brand-text-primary)]">
          Maritime Command Portal
        </div>
      </div>
      <div className="tricolor-rule absolute bottom-0 left-0 right-0 opacity-90" />
    </div>

    <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3" aria-label="Primary">
      {navigation.map((item) => (
        <NavLink
          key={item.name}
          to={item.to}
          end={item.to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'relative flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors',
              isActive
                ? 'bg-[#0b2545]/[0.06] font-semibold text-[var(--color-gov-navy)] before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-0.5 before:rounded-full before:bg-[var(--color-gov-saffron)]'
                : 'text-[var(--color-brand-text-secondary)] hover:bg-slate-100 hover:text-[var(--color-brand-text-primary)]'
            )
          }
        >
          <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
          {item.name}
        </NavLink>
      ))}
    </nav>

    <div className="border-t border-[var(--color-brand-border)] px-4 py-3">
      <p className="text-[11px] leading-relaxed text-[var(--color-brand-text-muted)]">
        SIH26006 · Freight Forecasting &amp; Vessel Chartering
      </p>
    </div>
  </>
);

export const Sidebar = () => (
  <div className="flex h-full w-56 shrink-0 flex-col border-r border-[var(--color-brand-border)] bg-white">
    <SidebarContent />
  </div>
);

/** Mobile drawer variant - controlled by AppLayout. */
export const MobileSidebar = ({ open, onClose }) => (
  <div
    className={cn('fixed inset-0 z-50 lg:hidden', open ? 'pointer-events-auto' : 'pointer-events-none')}
    aria-hidden={!open}
  >
    <div
      className={cn(
        'absolute inset-0 bg-slate-900/40 transition-opacity duration-200',
        open ? 'opacity-100' : 'opacity-0'
      )}
      onClick={onClose}
    />
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
      className={cn(
        'absolute left-0 top-0 flex h-full w-64 flex-col bg-white shadow-xl transition-transform duration-200',
        open ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close navigation menu"
        className="absolute right-2 top-4 rounded-md p-1.5 text-[var(--color-brand-text-muted)] hover:bg-slate-100"
      >
        <X className="h-4 w-4" />
      </button>
      <SidebarContent onNavigate={onClose} />
    </div>
  </div>
);
