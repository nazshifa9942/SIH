import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Sidebar, MobileSidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAuth } from '../../context/AuthContext';

export const AppLayout = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-[var(--color-brand-background)]">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-brand-border-strong)] border-t-[var(--color-gov-navy)]"
          role="status"
          aria-label="Loading"
        />
        <span className="text-xs font-medium text-[var(--color-brand-text-secondary)]">
          Ministry of Ports, Shipping &amp; Waterways
        </span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-brand-background)]">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <MobileSidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar onOpenNav={() => setNavOpen(true)} />
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

