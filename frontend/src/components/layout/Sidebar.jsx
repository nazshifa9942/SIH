// import React from 'react';
// import { NavLink } from 'react-router-dom';
// import { LayoutDashboard, Ship, Box, TrendingUp, AlertCircle, Anchor, Compass, Shield, GitCompare, X } from 'lucide-react';
// import { cn } from '../../utils/cn';

// const navigation = [
//   { name: 'Overview', to: '/overview', icon: LayoutDashboard },
//   { name: 'Cargo', to: '/cargo', icon: Box },
//   { name: 'Vessels', to: '/vessels', icon: Ship },
//   { name: 'Ports', to: '/ports', icon: Anchor },
//   { name: 'Map', to: '/map', icon: Compass },
//   { name: 'Market', to: '/market', icon: TrendingUp },
//   { name: 'Alerts', to: '/alerts', icon: AlertCircle },
//   { name: 'Admin', to: '/admin', icon: Shield },
//   { name: 'What-If', to: '/what-if', icon: GitCompare },
// ];

// const SidebarContent = ({ onNavigate }) => (
//   <>
//     <div className="relative flex h-16 shrink-0 items-center gap-3 border-b border-[var(--color-brand-border)] px-4">
//       <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--color-gov-navy)]">
//         <Anchor className="h-5 w-5 text-white" aria-hidden="true" />
//       </div>
//       <div className="min-w-0">
//         <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-brand-text-muted)]">
//           Government of India
//         </div>
//         <div className="truncate text-[13px] font-semibold leading-tight text-[var(--color-brand-text-primary)]">
//           Maritime Command Portal
//         </div>
//       </div>
//       <div className="tricolor-rule absolute bottom-0 left-0 right-0 opacity-90" />
//     </div>

//     <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3" aria-label="Primary">
//       {navigation.map((item) => (
//         <NavLink
//           key={item.name}
//           to={item.to}
//           end={item.to === '/overview'}
//           onClick={onNavigate}
//           className={({ isActive }) =>
//             cn(
//               'relative flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors',
//               isActive
//                 ? 'bg-[#0b2545]/[0.06] font-semibold text-[var(--color-gov-navy)] before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-0.5 before:rounded-full before:bg-[var(--color-gov-saffron)]'
//                 : 'text-[var(--color-brand-text-secondary)] hover:bg-slate-100 hover:text-[var(--color-brand-text-primary)]'
//             )
//           }
//         >
//           <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
//           {item.name}
//         </NavLink>
//       ))}
//     </nav>

//     <div className="border-t border-[var(--color-brand-border)] px-4 py-3">
//       <p className="text-[11px] leading-relaxed text-[var(--color-brand-text-muted)]">
//         SIH26006 · Freight Forecasting &amp; Vessel Chartering
//       </p>
//     </div>
//   </>
// );

// export const Sidebar = () => (
//   <div className="flex h-full w-56 shrink-0 flex-col border-r border-[var(--color-brand-border)] bg-white">
//     <SidebarContent />
//   </div>
// );

// /** Mobile drawer variant - controlled by AppLayout. */
// export const MobileSidebar = ({ open, onClose }) => (
//   <div
//     className={cn('fixed inset-0 z-50 lg:hidden', open ? 'pointer-events-auto' : 'pointer-events-none')}
//     aria-hidden={!open}
//   >
//     <div
//       className={cn(
//         'absolute inset-0 bg-slate-900/40 transition-opacity duration-200',
//         open ? 'opacity-100' : 'opacity-0'
//       )}
//       onClick={onClose}
//     />
//     <div
//       role="dialog"
//       aria-modal="true"
//       aria-label="Navigation menu"
//       className={cn(
//         'absolute left-0 top-0 flex h-full w-64 flex-col bg-white shadow-xl transition-transform duration-200',
//         open ? 'translate-x-0' : '-translate-x-full'
//       )}
//     >
//       <button
//         type="button"
//         onClick={onClose}
//         aria-label="Close navigation menu"
//         className="absolute right-2 top-4 rounded-md p-1.5 text-[var(--color-brand-text-muted)] hover:bg-slate-100"
//       >
//         <X className="h-4 w-4" />
//       </button>
//       <SidebarContent onNavigate={onClose} />
//     </div>
//   </div>
// );






import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Ship,
  Box,
  TrendingUp,
  AlertCircle,
  Anchor,
  Compass,
  Shield,
  GitCompare,
  X,
  ChevronRight,
  Activity,
  Waves,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../utils/cn';

const navigation = [
  {
    name: 'Overview',
    description: 'Decision cockpit',
    to: '/overview',
    icon: LayoutDashboard,
  },
  {
    name: 'Cargo',
    description: 'Cargo requests',
    to: '/cargo',
    icon: Box,
  },
  {
    name: 'Vessels',
    description: 'Fleet & availability',
    to: '/vessels',
    icon: Ship,
  },
  {
    name: 'Ports',
    description: 'Port operations',
    to: '/ports',
    icon: Anchor,
  },
  {
    name: 'Map',
    description: 'Maritime view',
    to: '/map',
    icon: Compass,
  },
  {
    name: 'Market',
    description: 'Freight & markets',
    to: '/market',
    icon: TrendingUp,
  },
  {
    name: 'Alerts',
    description: 'Attention required',
    to: '/alerts',
    icon: AlertCircle,
  },
];

const workspaceNavigation = [
  {
    name: 'What-If',
    description: 'Scenario comparison',
    to: '/what-if',
    icon: GitCompare,
  },
  {
    name: 'Admin',
    description: 'System controls',
    to: '/admin',
    icon: Shield,
  },
];

const SidebarBrand = () => (
  <div className="relative overflow-hidden border-b border-slate-200/80 px-4 py-5">
    {/* subtle background glow */}
    <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue-100/50 blur-2xl" />

    <div className="relative flex items-center gap-3">
      {/* Logo */}
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#06295c] shadow-[0_8px_22px_rgba(6,41,92,.18)]">
        <Ship className="h-6 w-6 text-white" strokeWidth={1.8} />

        {/* Indian-inspired accent */}
        <div className="absolute bottom-0 left-0 right-0 flex h-[3px]">
          <span className="flex-1 bg-[#f59e0b]" />
          <span className="flex-1 bg-white" />
          <span className="flex-1 bg-[#138a4b]" />
        </div>
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-extrabold tracking-tight text-[#06295c]">
            NavSetu
          </span>

          <span className="rounded-full border border-blue-100 bg-blue-50 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-[#0757c7]">
            AI
          </span>
        </div>

        <p className="mt-0.5 text-[10px] font-medium tracking-wide text-slate-500">
          Maritime decision intelligence
        </p>
      </div>
    </div>

    {/* status */}
    <div className="relative mt-4 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>

        <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">
          System ready
        </span>
      </div>

      <Activity className="h-3.5 w-3.5 text-emerald-600" />
    </div>
  </div>
);

const NavigationItem = ({ item, onNavigate }) => (
  <NavLink
    to={item.to}
    end={item.to === '/overview'}
    onClick={onNavigate}
    className={({ isActive }) =>
      cn(
        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200',
        isActive
          ? 'bg-[#06295c] text-white shadow-[0_8px_20px_rgba(6,41,92,.16)]'
          : 'text-slate-600 hover:bg-[#eef5fb] hover:text-[#06295c]'
      )
    }
  >
    {({ isActive }) => (
      <>
        {/* active accent */}
        {isActive && (
          <span className="absolute left-0 top-2.5 h-7 w-0.5 rounded-r-full bg-[#f59e0b]" />
        )}

        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all',
            isActive
              ? 'bg-white/10 text-[#8ec8ff]'
              : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-[#0757c7]'
          )}
        >
          <item.icon
            className="h-[17px] w-[17px]"
            strokeWidth={isActive ? 2.1 : 1.8}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'text-[12px] font-bold leading-tight',
              isActive ? 'text-white' : 'text-slate-700'
            )}
          >
            {item.name}
          </p>

          <p
            className={cn(
              'mt-0.5 truncate text-[9px]',
              isActive ? 'text-blue-100/60' : 'text-slate-400'
            )}
          >
            {item.description}
          </p>
        </div>

        <ChevronRight
          className={cn(
            'h-3.5 w-3.5 shrink-0 transition-all',
            isActive
              ? 'translate-x-0 text-blue-200 opacity-80'
              : '-translate-x-1 text-slate-300 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
          )}
        />
      </>
    )}
  </NavLink>
);

const SidebarContent = ({ onNavigate }) => (
  <div className="flex h-full flex-col bg-white">
    <SidebarBrand />

    <div className="flex-1 overflow-y-auto px-3 py-4">
      {/* Main */}
      <div className="mb-2 px-2">
        <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
          Command centre
        </p>
      </div>

      <nav className="space-y-1" aria-label="Primary navigation">
        {navigation.map((item) => (
          <NavigationItem
            key={item.name}
            item={item}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      {/* Workspace */}
      <div className="mb-2 mt-7 px-2">
        <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
          Decision workspace
        </p>
      </div>

      <nav className="space-y-1" aria-label="Decision workspace">
        {workspaceNavigation.map((item) => (
          <NavigationItem
            key={item.name}
            item={item}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      {/* Quick intelligence card */}
      <div className="relative mt-6 overflow-hidden rounded-2xl bg-[#06295c] p-4 shadow-[0_12px_30px_rgba(6,41,92,.14)]">
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full border border-white/10" />
        <div className="absolute -bottom-10 -left-5 h-20 w-20 rounded-full border border-white/10" />

        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
              <Sparkles className="h-3.5 w-3.5 text-[#f59e0b]" />
            </div>

            <span className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-blue-100/70">
              Decision intelligence
            </span>
          </div>

          <p className="mt-3 text-[11px] font-bold leading-5 text-white">
            Freight, vessel, risk and cost — together.
          </p>

          <div className="mt-3 flex items-center gap-2 text-[9px] text-blue-100/55">
            <Waves className="h-3.5 w-3.5" />
            <span>Built for SIH26006</span>
          </div>
        </div>
      </div>
    </div>

    {/* Bottom */}
    <div className="border-t border-slate-200/80 bg-[#f8fafc] px-4 py-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-slate-400">
            Platform
          </p>

          <p className="mt-1 text-[10px] font-semibold text-slate-600">
            SIH26006 · Freight Intelligence
          </p>
        </div>

        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white">
          <Anchor className="h-3.5 w-3.5 text-[#0757c7]" />
        </div>
      </div>
    </div>
  </div>
);

export const Sidebar = () => (
  <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white">
    <SidebarContent />
  </aside>
);

/**
 * Mobile drawer variant - controlled by AppLayout.
 */
export const MobileSidebar = ({ open, onClose }) => (
  <div
    className={cn(
      'fixed inset-0 z-50 lg:hidden',
      open ? 'pointer-events-auto' : 'pointer-events-none'
    )}
    aria-hidden={!open}
  >
    {/* Overlay */}
    <div
      className={cn(
        'absolute inset-0 bg-[#041f47]/45 backdrop-blur-[2px] transition-opacity duration-200',
        open ? 'opacity-100' : 'opacity-0'
      )}
      onClick={onClose}
    />

    {/* Drawer */}
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
      className={cn(
        'absolute left-0 top-0 flex h-full w-72 flex-col bg-white shadow-[20px_0_60px_rgba(4,31,71,.18)] transition-transform duration-300',
        open ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close navigation menu"
        className="absolute right-3 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
      >
        <X className="h-4 w-4" />
      </button>

      <SidebarContent onNavigate={onClose} />
    </div>
  </div>
);