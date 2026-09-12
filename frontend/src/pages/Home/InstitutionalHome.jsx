// import React, { useEffect, useState } from 'react';
// import { Link } from 'react-router-dom';
// import { Anchor, ArrowRight, BarChart3, CheckCircle2, FileText, Ship, ShieldCheck } from 'lucide-react';

// const workflow = [
//   { number: '01', title: 'Register cargo demand', text: 'Capture commodity, volume, origin, destination, and delivery requirements.' },
//   { number: '02', title: 'Read the market', text: 'Combine forecast signals, freight conditions, and relevant economic indicators.' },
//   { number: '03', title: 'Evaluate the fleet', text: 'Match vessel availability, route feasibility, timing, and operating constraints.' },
//   { number: '04', title: 'Act with confidence', text: 'Compare recommendations, risk, cost, and contract strategy before commitment.' },
// ];

// const capabilities = [
//   { icon: BarChart3, title: 'Freight forecasting', text: 'Turn market movement into a practical planning signal for procurement teams.' },
//   { icon: Ship, title: 'Vessel chartering', text: 'Assess vessel and port conditions against the needs of each cargo request.' },
//   { icon: ShieldCheck, title: 'Risk-aware decisions', text: 'Bring delivery, market, operational, and commercial risks into one view.' },
//   { icon: FileText, title: 'Decision records', text: 'Carry analysis from the initial request through recommendation and reporting.' },
// ];

// export const InstitutionalHome = () => {
//   const [activeSection, setActiveSection] = useState('system');

//   useEffect(() => {
//     const sections = ['system', 'workflow'];
//     const observer = new IntersectionObserver(
//       (entries) => {
//         const visible = entries
//           .filter((entry) => entry.isIntersecting)
//           .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
//         if (visible[0]) setActiveSection(visible[0].target.id);
//       },
//       { rootMargin: '-20% 0px -60% 0px', threshold: [0.1, 0.5] }
//     );

//     sections.forEach((section) => {
//       const element = document.getElementById(section);
//       if (element) observer.observe(element);
//     });

//     return () => observer.disconnect();
//   }, []);

//   return (
//   <div className="min-h-screen bg-[var(--color-brand-background)] text-[var(--color-brand-text-primary)]">
//     <div className="border-b border-[var(--color-brand-border)] bg-[var(--color-gov-navy)] text-[11px] text-slate-200">
//       <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-2 md:px-8 lg:px-10">
//         <span>Government of India &middot; Ministry of Ports, Shipping &amp; Waterways</span>
//         <div className="hidden items-center gap-4 sm:flex">
//           <a href="#main-content" className="hover:text-white">Skip to content</a>
//           <a href="#footer-links" className="hover:text-white">Accessibility</a>
//           <span aria-label="Current language">English</span>
//         </div>
//       </div>
//     </div>
//     <header className="border-b border-[var(--color-brand-border)] bg-white">
//       <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 md:px-8 lg:px-10">
//         <Link to="/" className="flex min-w-0 items-center gap-3" aria-label="Maritime Decision Support home">
//           <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--color-gov-navy)]">
//             <Anchor className="h-5 w-5 text-white" aria-hidden="true" />
//             <span className="tricolor-rule absolute bottom-0 left-0 right-0 rounded-b-md" />
//           </span>
//           <span className="min-w-0">
//             <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-brand-text-muted)]">
//               Official portal
//             </span>
//             <span className="block truncate text-sm font-semibold text-[var(--color-brand-text-primary)]">
//               Maritime Decision Support
//             </span>
//             <span className="hidden text-[11px] text-[var(--color-brand-text-muted)] sm:block">SIH26006 freight and chartering system</span>
//           </span>
//         </Link>
//         <nav className="flex items-center gap-3" aria-label="Public navigation">
//           <a href="#system" className={`hidden border-b-2 py-1 text-[13px] font-medium transition-colors sm:inline ${activeSection === 'system' ? 'border-[var(--color-gov-saffron)] text-[var(--color-gov-navy)]' : 'border-transparent text-[var(--color-brand-text-secondary)] hover:text-[var(--color-gov-navy)]'}`}>
//             About the system
//           </a>
//           <a href="#workflow" className={`hidden border-b-2 py-1 text-[13px] font-medium transition-colors md:inline ${activeSection === 'workflow' ? 'border-[var(--color-gov-saffron)] text-[var(--color-gov-navy)]' : 'border-transparent text-[var(--color-brand-text-secondary)] hover:text-[var(--color-gov-navy)]'}`}>
//             Workflow
//           </a>
//           <Link
//             to="/login"
//             className="inline-flex h-9 items-center justify-center rounded-md bg-[var(--color-gov-navy)] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[var(--color-gov-navy-light)]"
//           >
//             Sign in to portal
//           </Link>
//         </nav>
//       </div>
//     </header>

//     <main id="main-content">
//       <section className="border-b border-[var(--color-brand-border)] bg-white">
//         <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:px-8 md:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20 lg:px-10 lg:py-24">
//           <div className="max-w-2xl">
//             <p className="mb-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-gov-saffron)]">
//               <span className="h-px w-8 bg-[var(--color-gov-saffron)]" />
//               SIH26006 national maritime operations
//             </p>
//             <h1 className="max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight text-[var(--color-gov-navy)] sm:text-5xl lg:text-[3.75rem]">
//               Better freight decisions, from forecast to charter.
//             </h1>
//             <p className="mt-6 max-w-xl text-base leading-7 text-[var(--color-brand-text-secondary)] md:text-lg">
//               A decision-support system for procurement and logistics teams managing cargo movement, vessel selection, market uncertainty, and delivery commitments.
//             </p>
//             <div className="mt-8 flex flex-wrap items-center gap-4">
//               <Link
//                 to="/login"
//                 className="inline-flex h-11 items-center gap-2 rounded-md bg-[var(--color-gov-saffron)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#c25f0a]"
//               >
//                 Enter the command portal
//                 <ArrowRight className="h-4 w-4" aria-hidden="true" />
//               </Link>
//               <a href="#workflow" className="inline-flex h-11 items-center gap-2 px-1 text-sm font-semibold text-[var(--color-gov-navy)] hover:text-[var(--color-gov-saffron)]">
//                 See how it works
//                 <ArrowRight className="h-4 w-4" aria-hidden="true" />
//               </a>
//             </div>
//           </div>

//           <div className="flex flex-col justify-end border-l-2 border-[var(--color-gov-saffron)] pl-6 lg:pl-8">
//             <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-brand-text-muted)]">One operating picture</p>
//             <p className="mt-3 max-w-md text-2xl font-medium leading-snug text-[var(--color-gov-navy)]">
//               Align cargo requirements, market intelligence, fleet readiness, and risk in one accountable workflow.
//             </p>
//             <div className="mt-8 border-t border-[var(--color-brand-border)] pt-5 text-[13px] leading-6 text-[var(--color-brand-text-secondary)]">
//               <div className="flex items-start gap-3">
//                 <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[var(--color-gov-green)]" aria-hidden="true" />
//                 <span>Designed for practical decisions by authorized government personnel.</span>
//               </div>
//               <div className="mt-3 flex items-start gap-3">
//                 <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[var(--color-gov-green)]" aria-hidden="true" />
//                 <span>Built around traceable analysis rather than isolated data points.</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       <div className="border-b border-[var(--color-brand-border)] bg-white">
//         <div className="mx-auto grid max-w-7xl divide-y divide-[var(--color-brand-border)] px-5 sm:grid-cols-2 sm:divide-x sm:divide-y-0 md:grid-cols-4 md:px-8 lg:px-10">
//           {['Forecast-led planning', 'Vessel and port intelligence', 'Risk-aware recommendations', 'Role-based access'].map((item) => (
//             <div key={item} className="px-0 py-4 text-[12px] font-semibold text-[var(--color-brand-text-secondary)] sm:px-5 md:first:pl-0 md:last:pr-0">
//               <span className="mr-2 text-[var(--color-gov-saffron)]">&#10003;</span>{item}
//             </div>
//           ))}
//         </div>
//       </div>

//       <section id="system" className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20 lg:px-10">
//         <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
//           <div>
//             <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-gov-saffron)]">Purpose</p>
//             <h2 className="mt-3 max-w-md text-3xl font-semibold leading-tight text-[var(--color-gov-navy)]">A common operating view for maritime procurement.</h2>
//           </div>
//           <div className="max-w-2xl text-[15px] leading-7 text-[var(--color-brand-text-secondary)]">
//             <p>
//               Freight and chartering decisions often depend on information spread across market signals, port conditions, vessel availability, and commercial constraints. This portal brings those inputs together so teams can move from a request to a defensible action with less friction.
//             </p>
//             <p className="mt-5">
//               The system supports the full decision cycle while keeping detailed operational work inside the authenticated command environment.
//             </p>
//           </div>
//         </div>
//       </section>

//       <section id="workflow" className="border-y border-[var(--color-brand-border)] bg-[#eef2f5]">
//         <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20 lg:px-10">
//           <div className="flex flex-col justify-between gap-4 border-b border-[var(--color-brand-border-strong)] pb-6 sm:flex-row sm:items-end">
//             <div>
//               <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-gov-saffron)]">Decision workflow</p>
//               <h2 className="mt-2 text-3xl font-semibold text-[var(--color-gov-navy)]">From requirement to recommendation</h2>
//             </div>
//             <p className="max-w-sm text-[13px] leading-5 text-[var(--color-brand-text-secondary)]">A connected sequence that keeps every major decision factor in view.</p>
//           </div>
//           <div className="grid divide-y divide-[var(--color-brand-border-strong)] md:grid-cols-2 md:divide-x md:divide-y-0">
//             {workflow.map((item, index) => (
//               <div key={item.number} className={`py-7 md:px-8 ${index < 2 ? 'md:border-b md:border-[var(--color-brand-border-strong)]' : ''} ${index % 2 === 0 ? 'md:pl-0' : ''} ${index % 2 === 1 ? 'md:pr-0' : ''}`}>
//                 <div className="flex gap-5">
//                   <span className="font-mono text-xs font-semibold text-[var(--color-gov-saffron)]">{item.number}</span>
//                   <div>
//                     <h3 className="text-base font-semibold text-[var(--color-gov-navy)]">{item.title}</h3>
//                     <p className="mt-2 max-w-md text-[13px] leading-6 text-[var(--color-brand-text-secondary)]">{item.text}</p>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20 lg:px-10">
//         <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
//           <div>
//             <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-gov-saffron)]">System capabilities</p>
//             <h2 className="mt-3 max-w-md text-3xl font-semibold leading-tight text-[var(--color-gov-navy)]">Information that leads to action.</h2>
//           </div>
//           <div className="grid divide-y divide-[var(--color-brand-border)] sm:grid-cols-2 sm:gap-x-10 sm:divide-y-0">
//             {capabilities.map(({ icon: Icon, title, text }) => (
//               <div key={title} className="border-b border-[var(--color-brand-border)] py-5 first:pt-0 sm:py-6 sm:[&:nth-child(-n+2)]:pt-0">
//                 <Icon className="h-5 w-5 text-[var(--color-gov-navy)]" aria-hidden="true" />
//                 <h3 className="mt-3 text-sm font-semibold text-[var(--color-brand-text-primary)]">{title}</h3>
//                 <p className="mt-2 text-[13px] leading-6 text-[var(--color-brand-text-secondary)]">{text}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       <section className="border-t border-[var(--color-brand-border)] bg-[var(--color-gov-navy)] text-white">
//         <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-12 md:flex-row md:items-center md:justify-between md:px-8 lg:px-10">
//           <div>
//             <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f6b27a]">Authorized access</p>
//             <h2 className="mt-2 text-2xl font-semibold">Continue to the maritime command portal.</h2>
//             <p className="mt-2 text-sm text-slate-300">Access depends on your assigned government role and permissions.</p>
//           </div>
//           <Link to="/login" className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-semibold text-[var(--color-gov-navy)] hover:bg-slate-100">
//             Sign in
//             <ArrowRight className="h-4 w-4" aria-hidden="true" />
//           </Link>
//         </div>
//       </section>
//     </main>

//     <footer id="footer-links" className="border-t border-[var(--color-brand-border)] bg-white">
//       <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-7 text-[11px] text-[var(--color-brand-text-muted)] md:px-8 lg:px-10">
//         <div className="flex flex-col justify-between gap-3 sm:flex-row">
//           <span className="font-semibold text-[var(--color-brand-text-secondary)]">Ministry of Ports, Shipping &amp; Waterways</span>
//           <span>SIH26006 &middot; Freight forecasting and vessel chartering decision support</span>
//         </div>
//         <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-[var(--color-brand-border)] pt-4">
//           <a href="#main-content" className="hover:text-[var(--color-gov-navy)]">Accessibility</a>
//           <a href="mailto:support@sih2026.gov.in" className="hover:text-[var(--color-gov-navy)]">Portal support</a>
//           <span>Version 1.0</span>
//         </div>
//       </div>
//     </footer>
//   </div>
//   );
// };

import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Gauge,
  MapPinned,
  ShieldCheck,
  Ship,
  Sparkles,
  TrendingDown,
  Waves,
  Zap,
} from 'lucide-react';

const workflow = [
  {
    number: '01',
    title: 'Define cargo demand',
    text: 'Capture commodity, quantity, origin, destination and delivery commitment.',
    icon: FileText,
  },
  {
    number: '02',
    title: 'Forecast freight',
    text: 'Read the latest available freight signal before committing charter spend.',
    icon: TrendingDown,
  },
  {
    number: '03',
    title: 'Check vessel fit',
    text: 'Evaluate capacity, availability and operational constraints for the cargo.',
    icon: Ship,
  },
  {
    number: '04',
    title: 'Make the decision',
    text: 'Bring cost, risk and commercial strategy together in one decision view.',
    icon: ShieldCheck,
  },
];

const capabilities = [
  {
    icon: BarChart3,
    title: 'Freight forecasting',
    text: 'Turn market movement into a planning signal for procurement teams.',
  },
  {
    icon: Ship,
    title: 'Vessel chartering',
    text: 'Match vessel availability and constraints against cargo requirements.',
  },
  {
    icon: ShieldCheck,
    title: 'Risk assessment',
    text: 'Bring congestion, weather, freight and operational risk into one view.',
  },
  {
    icon: Gauge,
    title: 'Cost intelligence',
    text: 'Compare the major cost components before a chartering decision.',
  },
];

const stats = [
  { value: '24', label: 'Cargo requests', detail: 'Across active planning' },
  { value: '18', label: 'Active shipments', detail: 'Currently in workflow' },
  { value: '₹18.7 Cr+', label: 'Estimated savings', detail: 'Planning opportunity' },
  { value: 'LOW', label: 'Overall risk', detail: 'Current decision view' },
];

const marketSignals = [
  { label: 'Freight signal', value: '₹2,485', note: 'Reference planning rate', icon: TrendingDown },
  { label: 'Port readiness', value: 'Moderate', note: 'Review before commitment', icon: Waves },
  { label: 'Fleet availability', value: 'Available', note: 'Suitable capacity found', icon: Ship },
];

export const InstitutionalHome = () => {
  return (
    <div className="min-h-screen bg-[#f5f8fb] text-[#102a43]">
      {/* Thin institutional bar */}
      <div className="bg-[#06295c] text-[11px] text-white/80">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-2 md:px-8">
          <span>SIH 2026 · Maritime Freight Decision Support</span>
          <span className="hidden sm:block">Government-inspired prototype · Authorized access only</span>
        </div>
      </div>

      {/* Main navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between gap-6 px-5 md:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#06295c] shadow-[0_8px_24px_rgba(6,41,92,.18)]">
              <Ship className="h-6 w-6 text-white" />
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#f59e0b] via-white to-[#138a4b]" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-extrabold tracking-tight text-[#06295c]">
                  NavSetu
                </span>
                <span className="rounded-full border border-[#dbe7f4] bg-[#f4f8fd] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#315b88]">
                  AI
                </span>
              </div>
              <p className="truncate text-[10px] font-medium tracking-wide text-slate-500">
                Maritime decision intelligence
              </p>
            </div>
          </Link>


          <Link
            to="/login"
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-[#0757c7] px-4 text-[12px] font-bold text-white shadow-[0_8px_20px_rgba(7,87,199,.2)] transition hover:-translate-y-0.5 hover:bg-[#064daF]"
          >
            Open portal
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-[#06295c]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(55,151,255,.24),transparent_34%),radial-gradient(circle_at_90%_100%,rgba(20,137,92,.20),transparent_35%)]" />
          <div className="absolute -right-24 top-16 h-72 w-72 rounded-full border border-white/10" />
          <div className="absolute -right-10 top-30 h-52 w-52 rounded-full border border-white/10" />

          <div className="relative mx-auto grid max-w-[1440px] gap-12 px-5 py-14 md:px-8 md:py-20 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:py-24">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-100">
                <span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]" />
                Freight · Fleet · Risk · Cost
              </div>

              <h1 className="text-4xl font-black leading-[1.02] tracking-[-0.035em] text-white sm:text-5xl lg:text-[4.5rem]">
                From cargo demand
                <span className="block text-[#8ec8ff]">to a smarter charter.</span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-blue-100/80 md:text-lg">
                NavSetu brings freight forecasting, vessel feasibility, cost,
                risk and contract analysis into one decision workflow for maritime
                procurement and logistics teams.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                

                <Link
                  to="/cargo"
                  className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/20 bg-blue-500 px-5 text-sm font-bold text-white transition hover:bg-white/12"
                >
                  Create cargo request
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[11px] font-medium text-blue-100/65">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#53c98a]" />
                  Traceable workflow
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#53c98a]" />
                  Role-based access
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#53c98a]" />
                  Decision support
                </span>
              </div>
            </div>

            {/* Decision cockpit visual */}
            <div className="relative">
              <div className="absolute -inset-5 rounded-[32px] bg-[#2c8cff]/10 blur-2xl" />
              <div className="relative overflow-hidden rounded-[28px] border border-white/15 bg-white/[0.07] p-3 shadow-2xl backdrop-blur-xl">
                <div className="rounded-[22px] border border-white/10 bg-[#f8fbff] p-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <div>
                      <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                        Decision cockpit
                      </p>
                      <p className="mt-1 text-sm font-extrabold text-[#06295c]">
                        Newcastle → Paradip
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-bold text-emerald-700">
                      LOW RISK
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {[
                      ['Cargo', '55,000 MT'],
                      ['Freight', '₹2,485'],
                      ['Confidence', '85%'],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl border border-slate-200 bg-white p-3">
                        <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                          {label}
                        </p>
                        <p className="mt-1 text-sm font-black text-[#06295c]">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                          Freight forecast signal
                        </p>

                        <p className="mt-1 text-xs font-bold text-[#06295c]">
                          Current reference vs forecast range
                        </p>
                      </div>

                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700">
                        Planning signal
                      </span>
                    </div>

                    {/* Analytical chart */}
                    <div className="mt-5">
                      <div className="relative h-32">
                        {/* horizontal guide lines */}
                        <div className="absolute inset-x-0 top-0 border-t border-dashed border-slate-200" />
                        <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-slate-200" />
                        <div className="absolute inset-x-0 bottom-0 border-t border-slate-200" />

                        {/* chart bars */}
                        <div className="absolute inset-0 flex items-end justify-around px-5">
                          {[
                            {
                              label: 'Forecast Low',
                              value: '$23.75',
                              height: '58%',
                            },
                            {
                              label: 'Current',
                              value: '$25.12',
                              height: '76%',
                            },
                            {
                              label: 'Forecast High',
                              value: '$26.24',
                              height: '88%',
                            },
                          ].map((item) => (
                            <div
                              key={item.label}
                              className="flex h-full w-1/4 flex-col items-center justify-end"
                            >
                              <span className="mb-2 text-[9px] font-extrabold text-[#06295c]">
                                {item.value}
                              </span>

                              <div
                                className="w-10 rounded-t-lg bg-[#0757c7] transition-all hover:bg-[#064daf]"
                                style={{ height: item.height }}
                              />

                              <span className="mt-2 text-center text-[8px] font-semibold text-slate-400">
                                {item.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Interpretation */}
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                      <div>
                        <p className="text-[9px] font-semibold text-slate-400">
                          Expected range
                        </p>

                        <p className="text-[11px] font-extrabold text-[#06295c]">
                          $23.75 — $26.24 / MT
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[9px] font-semibold text-slate-400">
                          Confidence
                        </p>

                        <p className="text-[11px] font-extrabold text-emerald-600">
                          85%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {marketSignals.map(({ label, value, note, icon: Icon }) => (
                      <div key={label} className="rounded-xl bg-[#f1f6fb] p-3">
                        <Icon className="h-4 w-4 text-[#0757c7]" />
                        <p className="mt-2 text-[9px] font-semibold text-slate-500">{label}</p>
                        <p className="mt-0.5 text-xs font-extrabold text-[#06295c]">{value}</p>
                        <p className="mt-1 text-[8px] leading-4 text-slate-400">{note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* KPI strip */}
        <section className="relative z-10 mx-auto -mt-8 max-w-[1320px] px-5 md:px-8">
          <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(16,42,67,.10)] sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((item, index) => (
              <div
                key={item.label}
                className={`relative p-5 md:p-6 ${index > 0 ? 'border-t sm:border-l sm:border-t-0 border-slate-200' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-2 text-2xl font-black tracking-tight text-[#06295c]">
                      {item.value}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500">{item.detail}</p>
                  </div>
                  <div className="rounded-xl bg-[#eef5ff] p-2 text-[#0757c7]">
                    {index === 0 && <FileText className="h-4 w-4" />}
                    {index === 1 && <Ship className="h-4 w-4" />}
                    {index === 2 && <Zap className="h-4 w-4" />}
                    {index === 3 && <ShieldCheck className="h-4 w-4" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Workflow */}
        <section className="mx-auto max-w-[1320px] px-5 py-20 md:px-8 md:py-24">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#0757c7]">
                How it works
              </p>
              <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-tight text-[#06295c] md:text-4xl">
                One connected workflow.
                <span className="text-slate-400"> One decision at the end.</span>
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate-500">
              The platform is designed so every major decision factor is visible
              before procurement teams commit.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {workflow.map(({ number, title, text, icon: Icon }, index) => (
              <div
                key={number}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-[#b9d4f5] hover:shadow-[0_18px_40px_rgba(16,42,67,.08)]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-[#0757c7]">{number}</span>
                  <div className="rounded-xl bg-[#eef5ff] p-2.5 text-[#0757c7] transition group-hover:bg-[#0757c7] group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="mt-8 text-base font-extrabold text-[#06295c]">{title}</h3>
                <p className="mt-2 text-[12px] leading-6 text-slate-500">{text}</p>
                <div className="mt-6 h-1 w-10 rounded-full bg-[#f59e0b] transition-all group-hover:w-16" />
              </div>
            ))}
          </div>
        </section>

        {/* Capability / command centre preview */}
        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto grid max-w-[1320px] gap-12 px-5 py-20 md:px-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center lg:py-24">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#0757c7]">
                Decision intelligence
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-[#06295c] md:text-4xl">
                Less searching.
                <br />
                <span className="text-[#0757c7]">More deciding.</span>
              </h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-slate-500">
                Move from a cargo requirement to a structured recommendation
                without jumping between disconnected market, vessel and cost views.
              </p>

              <Link
                to="/dashboard"
                className="mt-7 inline-flex items-center gap-2 text-sm font-extrabold text-[#0757c7] hover:text-[#06295c]"
              >
                Open the decision dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {capabilities.map(({ icon: Icon, title, text }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-slate-200 bg-[#f8fbff] p-5 transition hover:border-[#c5dcf5] hover:bg-white hover:shadow-lg"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#0757c7] shadow-sm ring-1 ring-slate-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-sm font-extrabold text-[#06295c]">{title}</h3>
                  <p className="mt-2 text-[11px] leading-5 text-slate-500">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Live-feel information band without unsupported "live" claim */}
        <section className="mx-auto max-w-[1320px] px-5 py-20 md:px-8">
          <div className="overflow-hidden rounded-3xl bg-[#06295c] shadow-[0_24px_70px_rgba(6,41,92,.16)]">
            <div className="grid lg:grid-cols-[1fr_1.15fr]">
              <div className="relative overflow-hidden p-8 md:p-10">
                <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full border border-white/10" />
                <div className="absolute -bottom-20 -left-12 h-64 w-64 rounded-full border border-white/10" />

                <div className="relative">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-200">
                    <Sparkles className="h-4 w-4 text-[#f59e0b]" />
                    Decision snapshot
                  </div>
                  <h2 className="mt-5 max-w-md text-2xl font-black tracking-tight text-white md:text-3xl">
                    See the signal before you make the commitment.
                  </h2>
                  <p className="mt-4 max-w-md text-sm leading-6 text-blue-100/70">
                    Forecast, feasibility, risk and cost are presented together
                    so the final recommendation is easier to understand and defend.
                  </p>
                </div>
              </div>

              <div className="grid gap-px bg-white/10 sm:grid-cols-3">
                {[
                  { icon: BarChart3, title: 'Forecast', value: 'Planning signal', note: 'Freight movement' },
                  { icon: Ship, title: 'Vessel', value: 'Feasible', note: 'Capacity & constraints' },
                  { icon: ShieldCheck, title: 'Risk', value: 'Low', note: 'Review indicators' },
                ].map(({ icon: Icon, title, value, note }) => (
                  <div key={title} className="bg-white/[0.06] p-7 backdrop-blur">
                    <Icon className="h-5 w-5 text-[#8ec8ff]" />
                    <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.14em] text-blue-200/60">
                      {title}
                    </p>
                    <p className="mt-2 text-sm font-black text-white">{value}</p>
                    <p className="mt-1 text-[10px] text-blue-100/60">{note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-slate-200 bg-[#eef4fa]">
          <div className="mx-auto flex max-w-[1320px] flex-col gap-6 px-5 py-16 md:flex-row md:items-center md:justify-between md:px-8">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#0757c7]">
                Ready to plan?
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-[#06295c]">
                Start with a cargo requirement.
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                The workflow takes you from requirement to recommendation.
              </p>
            </div>

            <Link
              to="/cargo"
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0757c7] px-5 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(7,87,199,.18)] transition hover:-translate-y-0.5 hover:bg-[#064daf]"
            >
              Create cargo request
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-[#041f47] text-white">
        <div className="mx-auto max-w-[1320px] px-5 py-10 md:px-8">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                  <Ship className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-extrabold">NavSetu AI</p>
                  <p className="text-[10px] text-blue-200/60">Maritime decision intelligence</p>
                </div>
              </div>
              <p className="mt-4 max-w-md text-[11px] leading-5 text-blue-100/55">
                SIH26006 · Intelligent freight forecasting and vessel chartering
                decision-support platform.
              </p>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-3 text-[11px] text-blue-100/65">
              <Link to="/dashboard" className="hover:text-white">Dashboard</Link>
              <Link to="/cargo" className="hover:text-white">Cargo</Link>
              <Link to="/forecast" className="hover:text-white">Forecasting</Link>
              <Link to="/optimization" className="hover:text-white">Optimization</Link>
              <Link to="/recommendations" className="hover:text-white">Recommendations</Link>
            </div>
          </div>

          <div className="mt-8 flex flex-col justify-between gap-2 border-t border-white/10 pt-5 text-[10px] text-blue-100/40 sm:flex-row">
            <span>© 2026 NavSetu AI · SIH 2026 prototype</span>
            <span>Built for freight and maritime decision support</span>
          </div>
        </div>
      </footer>
    </div>
  );
};