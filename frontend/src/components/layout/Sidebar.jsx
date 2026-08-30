import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Ship, Box, TrendingUp, AlertCircle, Anchor } from 'lucide-react';
import { cn } from '../../utils/cn';

const navigation = [
  { name: 'OVERVIEW', to: '/', icon: LayoutDashboard },
  { name: 'CARGO', to: '/cargo', icon: Box },
  { name: 'VESSELS', to: '/vessels', icon: Ship },
  { name: 'MARKET', to: '/market', icon: TrendingUp },
  { name: 'ALERTS', to: '/alerts', icon: AlertCircle },
];

export const Sidebar = () => {
  return (
    <div className="flex h-full w-24 flex-col border-r border-[var(--color-brand-border)] bg-[var(--color-brand-background)]">
      <div className="flex h-20 shrink-0 items-center justify-center border-b border-[var(--color-brand-border)]">
        <Anchor className="h-8 w-8 text-white" />
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto pt-4 pb-4">
        <nav className="flex-1 space-y-4 px-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  isActive
                    ? 'bg-[var(--color-brand-elevated)] text-white'
                    : 'text-[var(--color-brand-text-secondary)] hover:bg-[var(--color-brand-elevated)] hover:text-white',
                  'group flex flex-col items-center justify-center rounded-xl p-3 text-[10px] font-medium transition-colors tracking-widest'
                )
              }
            >
              <item.icon
                className="mb-1.5 h-6 w-6 flex-shrink-0"
                aria-hidden="true"
              />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};
