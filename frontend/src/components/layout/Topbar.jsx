// import React from 'react';
// import { useAuth, ROLES } from '../../context/AuthContext';
// import { LogOut, Menu } from 'lucide-react';
// import { Button } from '../ui/Button';

// const ROLE_LABELS = {
//   [ROLES.ADMIN]: 'Administrator',
//   [ROLES.PROCUREMENT_MANAGER]: 'Procurement Manager',
//   [ROLES.LOGISTICS_MANAGER]: 'Logistics Manager',
//   [ROLES.VIEWER]: 'Viewer (Read-only)',
// };

// export const Topbar = ({ onOpenNav }) => {
//   const { user, role, switchRole, logout } = useAuth();

//   return (
//     <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--color-brand-border)] bg-white px-4 md:px-6">
//       {/* Mobile nav trigger */}
//       <button
//         type="button"
//         onClick={onOpenNav}
//         aria-label="Open navigation menu"
//         className="rounded-md p-2 text-[var(--color-brand-text-secondary)] hover:bg-slate-100 lg:hidden"
//       >
//         <Menu className="h-5 w-5" />
//       </button>

//       <div className="min-w-0 flex-1">
//         <div className="truncate text-[13px] font-semibold text-[var(--color-brand-text-primary)]">
//           Ministry of Ports, Shipping &amp; Waterways
//         </div>
//         <div className="hidden text-[11px] text-[var(--color-brand-text-muted)] sm:block">
//           Freight forecasting and vessel chartering recommendations
//         </div>
//       </div>

//       {/* Role switcher (frontend simulation) */}
//       <div className="hidden items-center gap-2 sm:flex">
//         <label
//           htmlFor="role-switcher"
//           className="text-[11px] font-medium text-[var(--color-brand-text-muted)]"
//         >
//           Role
//         </label>
//         <select
//           id="role-switcher"
//           value={role}
//           onChange={(e) => switchRole(e.target.value)}
//           className="ui-select !h-8 !w-44 !text-xs"
//         >
//           {Object.entries(ROLE_LABELS).map(([value, label]) => (
//             <option key={value} value={value}>
//               {label}
//             </option>
//           ))}
//         </select>
//       </div>

//       {/* User identity */}
//       <div className="hidden text-right md:block">
//         <div className="text-[13px] font-medium leading-tight text-[var(--color-brand-text-primary)]">
//           {user?.name || 'User Session'}
//         </div>
//         <div className="text-[11px] leading-tight text-[var(--color-brand-text-muted)]">
//           {user?.email || role.replace('_', ' ').toLowerCase()}
//         </div>
//       </div>

//       <Button
//         variant="ghost"
//         size="icon"
//         onClick={logout}
//         title="Log out"
//         aria-label="Log out"
//       >
//         <LogOut className="h-4 w-4 text-[var(--color-brand-text-secondary)]" />
//       </Button>
//     </header>
//   );
// };




import React from 'react';
import { useAuth, ROLES } from '../../context/AuthContext';
import {
  LogOut,
  Menu,
  ChevronDown,
  UserRound,
  ShieldCheck,
  Circle,
} from 'lucide-react';
import { Button } from '../ui/Button';

const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.PROCUREMENT_MANAGER]: 'Procurement Manager',
  [ROLES.LOGISTICS_MANAGER]: 'Logistics Manager',
  [ROLES.VIEWER]: 'Viewer (Read-only)',
};

const ROLE_SHORT_LABELS = {
  [ROLES.ADMIN]: 'Admin',
  [ROLES.PROCUREMENT_MANAGER]: 'Procurement',
  [ROLES.LOGISTICS_MANAGER]: 'Logistics',
  [ROLES.VIEWER]: 'Viewer',
};

export const Topbar = ({ onOpenNav }) => {
  const { user, role, switchRole, logout } = useAuth();

  const roleLabel = ROLE_LABELS[role] || 'User';

  return (
    <header className="relative flex h-[68px] shrink-0 items-center gap-3 border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-xl md:px-6">
      {/* subtle top accent */}
      <div className="absolute left-0 right-0 top-0 h-[2px] bg-gradient-to-r from-[#f59e0b] via-white to-[#138a4b]" />

      {/* Mobile navigation */}
      <button
        type="button"
        onClick={onOpenNav}
        aria-label="Open navigation menu"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-[#0757c7] lg:hidden"
      >
        <Menu className="h-[18px] w-[18px]" />
      </button>

      {/* Page identity */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h1 className="truncate text-[14px] font-extrabold tracking-tight text-[#06295c]">
            Ministry of Ports, Shipping &amp; Waterways
          </h1>

          <span className="hidden rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.12em] text-[#0757c7] sm:inline-flex">
            Decision Intelligence
          </span>
        </div>

        <p className="mt-0.5 hidden truncate text-[10px] font-medium text-slate-400 md:block">
          Freight forecasting · vessel chartering · risk · cost analysis
        </p>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* System status */}
        <div className="hidden items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 xl:flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>

          <span className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-emerald-700">
            System Ready
          </span>
        </div>

        {/* Role switcher */}
        <div className="hidden items-center gap-2 sm:flex">
          <div className="relative">
            <ShieldCheck className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#0757c7]" />

            <select
              id="role-switcher"
              value={role}
              onChange={(e) => switchRole(e.target.value)}
              title={`Current role: ${roleLabel}`}
              className="h-9 w-36 appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-8 text-[10px] font-bold text-[#06295c] outline-none transition-all hover:border-blue-200 hover:bg-white focus:border-[#0757c7] focus:ring-2 focus:ring-blue-100 md:w-44"
            >
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {/* User profile */}
        <div className="hidden items-center gap-2.5 border-l border-slate-200 pl-3 md:flex">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#06295c] text-white shadow-sm">
            <UserRound className="h-4 w-4" />
          </div>

          <div className="min-w-0 max-w-[170px]">
            <p className="truncate text-[11px] font-extrabold text-[#06295c]">
              {user?.name || 'User Session'}
            </p>

            <p className="mt-0.5 truncate text-[9px] font-medium text-slate-400">
              {ROLE_SHORT_LABELS[role] ||
                user?.email ||
                role?.replace('_', ' ').toLowerCase()}
            </p>
          </div>
        </div>

        {/* Mobile role indicator */}
        <div className="flex h-9 items-center rounded-xl border border-slate-200 bg-slate-50 px-2.5 sm:hidden">
          <Circle className="h-2.5 w-2.5 fill-emerald-500 text-emerald-500" />
        </div>

        {/* Logout */}
        <Button
          variant="ghost"
          size="icon"
          onClick={logout}
          title="Log out"
          aria-label="Log out"
          className="!h-9 !w-9 rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:border-red-100 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
};