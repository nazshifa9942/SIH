import React from 'react';
import { useAuth, ROLES } from '../../context/AuthContext';
import { LogOut, Menu } from 'lucide-react';
import { Button } from '../ui/Button';

const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.PROCUREMENT_MANAGER]: 'Procurement Manager',
  [ROLES.LOGISTICS_MANAGER]: 'Logistics Manager',
  [ROLES.VIEWER]: 'Viewer (Read-only)',
};

export const Topbar = ({ onOpenNav }) => {
  const { user, role, switchRole, logout } = useAuth();

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--color-brand-border)] bg-white px-4 md:px-6">
      {/* Mobile nav trigger */}
      <button
        type="button"
        onClick={onOpenNav}
        aria-label="Open navigation menu"
        className="rounded-md p-2 text-[var(--color-brand-text-secondary)] hover:bg-slate-100 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-semibold text-[var(--color-brand-text-primary)]">
          Ministry of Ports, Shipping &amp; Waterways
        </div>
        <div className="hidden text-[11px] text-[var(--color-brand-text-muted)] sm:block">
          Freight forecasting and vessel chartering recommendations
        </div>
      </div>

      {/* Role switcher (frontend simulation) */}
      <div className="hidden items-center gap-2 sm:flex">
        <label
          htmlFor="role-switcher"
          className="text-[11px] font-medium text-[var(--color-brand-text-muted)]"
        >
          Role
        </label>
        <select
          id="role-switcher"
          value={role}
          onChange={(e) => switchRole(e.target.value)}
          className="ui-select !h-8 !w-44 !text-xs"
        >
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* User identity */}
      <div className="hidden text-right md:block">
        <div className="text-[13px] font-medium leading-tight text-[var(--color-brand-text-primary)]">
          {user?.name || 'User Session'}
        </div>
        <div className="text-[11px] leading-tight text-[var(--color-brand-text-muted)]">
          {user?.email || role.replace('_', ' ').toLowerCase()}
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={logout}
        title="Log out"
        aria-label="Log out"
      >
        <LogOut className="h-4 w-4 text-[var(--color-brand-text-secondary)]" />
      </Button>
    </header>
  );
};
