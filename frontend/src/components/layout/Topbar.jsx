import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, Anchor, Box } from 'lucide-react';
import { Button } from '../ui/Button';

export const Topbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-20 shrink-0 items-center justify-between border-b border-[var(--color-brand-border)] bg-[var(--color-brand-background)] px-8">
      <div className="flex gap-12 flex-1 items-center">
        <div className="flex items-center gap-2">
          <Anchor className="h-5 w-5 text-[var(--color-brand-text-secondary)]" />
          <div>
            <div className="text-[10px] tracking-widest text-[var(--color-brand-text-secondary)] uppercase">System</div>
            <div className="text-sm font-bold tracking-wider text-white">SIH26006 CORE</div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <Box className="h-5 w-5 text-[var(--color-brand-text-secondary)]" />
          <div>
            <div className="text-[10px] tracking-widest text-[var(--color-brand-text-secondary)] uppercase">Global Status</div>
            <div className="text-sm font-bold tracking-wider text-[var(--color-status-success)] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-status-success)] animate-pulse"></span>
              ONLINE
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right">
          <div className="text-[10px] tracking-widest text-[var(--color-brand-text-secondary)] uppercase">{user?.role || 'VIEWER'}</div>
          <div className="text-sm font-bold tracking-wider text-white flex items-center gap-2 justify-end">
            <User className="h-4 w-4 text-[var(--color-brand-text-secondary)]" />
            {user?.email || 'Unknown User'}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={logout} title="Log out" className="rounded-full bg-[var(--color-brand-elevated)] border border-[var(--color-brand-border)]">
          <LogOut className="h-4 w-4 text-[var(--color-brand-text-secondary)] hover:text-white" />
        </Button>
      </div>
    </header>
  );
};
