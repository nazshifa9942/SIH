import React from 'react';

/**
 * Subtle animated maritime horizon — decorative footer signature for the
 * Overview page. Pure CSS keyframes (no JS animation loop); the ship drifts
 * slowly across layered wave bands. Static under prefers-reduced-motion.
 */
export const MaritimeHorizon = () => (
  <div className="maritime-horizon" aria-hidden="true">
    <div className="maritime-horizon__sun" />

    {/* Distant coastline */}
    <svg
      className="maritime-horizon__hills"
      viewBox="0 0 1200 40"
      preserveAspectRatio="none"
      fill="#b8cfdf"
    >
      <path d="M0 40 L0 26 Q80 8 160 22 Q240 34 320 20 Q420 4 520 24 Q620 38 720 18 Q820 4 920 22 Q1020 36 1120 16 Q1160 10 1200 20 L1200 40 Z" />
    </svg>

    {/* Cargo ship silhouette with containers */}
    <svg className="maritime-horizon__ship" width="120" height="52" viewBox="0 0 120 52" fill="none">
      {/* Wake */}
      <ellipse className="maritime-horizon__wake" cx="14" cy="47" rx="45" ry="3" fill="rgba(255,255,255,0.8)" />
      {/* Hull */}
      <path
        d="M30 38 L98 38 L90 48 L40 48 Z"
        fill="#1e3a5f"
      />
      {/* Deck containers */}
      <rect x="46" y="31" width="12" height="7" rx="1" fill="#b45309" />
      <rect x="60" y="31" width="12" height="7" rx="1" fill="#175cd3" />
      <rect x="74" y="31" width="12" height="7" rx="1" fill="#067647" />
      <rect x="53" y="24" width="12" height="7" rx="1" fill="#b45309" />
      <rect x="67" y="24" width="12" height="7" rx="1" fill="#134074" />
      {/* Bridge */}
      <rect x="88" y="18" width="9" height="20" rx="1" fill="#e2e8f0" stroke="#1e3a5f" strokeWidth="1" />
      <rect x="90" y="21" width="5" height="3" fill="#64748b" />
      {/* Mast */}
      <line x1="50" y1="24" x2="50" y2="14" stroke="#64748b" strokeWidth="1.5" />
    </svg>

    {/* Back wave layer */}
    <svg className="maritime-horizon__waves maritime-horizon__waves--slow" viewBox="0 0 1200 40" preserveAspectRatio="none" fill="#a9c8de">
      <path d="M0 20 Q75 8 150 20 T300 20 T450 20 T600 20 T750 20 T900 20 T1050 20 T1200 20 L1200 40 L0 40 Z" />
      <path d="M0 20 Q75 8 150 20 T300 20 T450 20 T600 20 T750 20 T900 20 T1050 20 T1200 20 L1200 40 L0 40 Z" transform="translate(-1200, 0)" />
    </svg>

    {/* Front wave layer */}
    <svg className="maritime-horizon__waves maritime-horizon__waves--fast" viewBox="0 0 1200 40" preserveAspectRatio="none" fill="#8fb8d6">
      <path d="M0 22 Q100 10 200 22 T400 22 T600 22 T800 22 T1000 22 T1200 22 L1200 40 L0 40 Z" />
      <path d="M0 22 Q100 10 200 22 T400 22 T600 22 T800 22 T1000 22 T1200 22 L1200 40 L0 40 Z" transform="translate(-1200, 0)" />
    </svg>
  </div>
);
