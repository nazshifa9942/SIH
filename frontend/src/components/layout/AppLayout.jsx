// import React, { useState } from 'react';
// import { Outlet, Navigate, useLocation } from 'react-router-dom';
// import { Sidebar, MobileSidebar } from './Sidebar';
// import { Topbar } from './Topbar';
// import { useAuth } from '../../context/AuthContext';

// export const AppLayout = () => {
//   const { user, loading } = useAuth();
//   const location = useLocation();
//   const [navOpen, setNavOpen] = useState(false);

//   if (loading) {
//     return (
//       <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-[var(--color-brand-background)]">
//         <div
//           className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-brand-border-strong)] border-t-[var(--color-gov-navy)]"
//           role="status"
//           aria-label="Loading"
//         />
//         <span className="text-xs font-medium text-[var(--color-brand-text-secondary)]">
//           Ministry of Ports, Shipping &amp; Waterways
//         </span>
//       </div>
//     );
//   }

//   if (!user) {
//     return <Navigate to="/login" state={{ from: location }} replace />;
//   }

//   return (
//     <div className="flex h-screen overflow-hidden bg-[var(--color-brand-background)]">
//       <div className="hidden lg:block">
//         <Sidebar />
//       </div>
//       <MobileSidebar open={navOpen} onClose={() => setNavOpen(false)} />
//       <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
//         <Topbar onOpenNav={() => setNavOpen(true)} />
//         <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">
//           <Outlet />
//         </main>
//       </div>
//     </div>
//   );
// };


import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Ship, Waves } from 'lucide-react';
import { Sidebar, MobileSidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAuth } from '../../context/AuthContext';

export const AppLayout = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);

  /*
   * Authentication state
   */
  if (loading) {
    return (
      <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#f4f8fc]">
        {/* Background decoration */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-blue-100/50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-sky-100/50 blur-3xl" />

        <div className="relative flex flex-col items-center">
          {/* Logo */}
          <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-[#06295c] shadow-[0_14px_35px_rgba(6,41,92,.18)]">
            <Ship
              className="h-8 w-8 text-white"
              strokeWidth={1.7}
              aria-hidden="true"
            />

            {/* Indian-inspired accent */}
            <div className="absolute bottom-0 left-0 right-0 flex h-1">
              <span className="flex-1 bg-[#f59e0b]" />
              <span className="flex-1 bg-white" />
              <span className="flex-1 bg-[#138a4b]" />
            </div>
          </div>

          {/* Loading indicator */}
          <div className="mt-6 flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#0757c7]" />
            <span
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#0757c7]"
              style={{ animationDelay: '150ms' }}
            />
            <span
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#0757c7]"
              style={{ animationDelay: '300ms' }}
            />
          </div>

          <p className="mt-3 text-sm font-bold text-[#06295c]">
            NavSetu AI
          </p>

          <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
            Preparing decision workspace
          </p>
        </div>
      </div>
    );
  }

  /*
   * Authentication guard
   */
  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f8fc] text-slate-800">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      <MobileSidebar
        open={navOpen}
        onClose={() => setNavOpen(false)}
      />

      {/* Main application shell */}
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* subtle background texture */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-32 top-20 h-72 w-72 rounded-full bg-blue-100/30 blur-3xl" />
          <div className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-sky-100/20 blur-3xl" />

          {/* maritime wave line */}
          <div className="absolute bottom-0 left-0 right-0 h-24 opacity-[0.025]">
            <Waves className="h-full w-full" strokeWidth={1} />
          </div>
        </div>

        {/* Topbar */}
        <div className="relative z-20 shrink-0">
          <Topbar onOpenNav={() => setNavOpen(true)} />
        </div>

        {/* Page content */}
        <main className="relative z-10 min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="mx-auto min-h-full w-full max-w-[1800px] px-4 py-5 md:px-6 md:py-6 xl:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};