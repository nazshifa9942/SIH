import React from 'react';
import {
  Anchor,
  X,
  MapPin,
  Ruler,
  Ship,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const PortDetailModal = ({ port, isOpen, onClose, onEdit }) => {
  if (!isOpen || !port) return null;

  const formatNumber = (num, decimals = 0) => {
    if (num === null || num === undefined || isNaN(Number(num))) return 'N/A';
    return Number(num).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const draft = Number(port.maxDraftM) || 0;
  const loa = Number(port.maxLoaM) || 0;
  const beam = Number(port.maxBeamM) || 0;

  // Feasibility heuristics for common vessel classes
  const vesselClasses = [
    {
      name: 'Capesize (100k+ DWT)',
      draftReq: 16.5,
      loaReq: 280,
      beamReq: 43,
    },
    {
      name: 'Panamax (65k-100k DWT)',
      draftReq: 13.5,
      loaReq: 225,
      beamReq: 32.2,
    },
    {
      name: 'Supramax (50k-65k DWT)',
      draftReq: 12.0,
      loaReq: 190,
      beamReq: 32.2,
    },
    {
      name: 'Handysize (10k-40k DWT)',
      draftReq: 10.0,
      loaReq: 170,
      beamReq: 27,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-[var(--color-brand-border)] rounded-lg shadow-[0_12px_32px_-8px_rgba(16,24,40,0.18)] overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <div className="p-6 border-b border-[var(--color-brand-border)] bg-[var(--color-brand-elevated)] flex justify-between items-start">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center flex-shrink-0">
              <Anchor className="w-6 h-6 text-[var(--color-gov-saffron)]" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-[var(--color-brand-text-primary)] tracking-wide">{port.name}</h2>
                <Badge
                  variant="outline"
                  className={`px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                    port.active
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-[var(--color-status-success)]'
                      : 'border-red-500/30 bg-red-500/10 text-[var(--color-status-error)]'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      port.active ? 'bg-emerald-400' : 'bg-red-400'
                    }`}
                  />
                  {port.active ? 'ACTIVE PORT' : 'INACTIVE'}
                </Badge>
              </div>
              <div className="text-xs uppercase tracking-widest text-[var(--color-brand-text-secondary)] mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[var(--color-brand-text-muted)]" />
                {port.country} {port.region ? `· ${port.region}` : ''}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[var(--color-brand-text-muted)] hover:text-[var(--color-brand-text-primary)] rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── CONTENT ────────────────────────────────────────────────── */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Key Throughput Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)]">
              <span className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
                Daily Handling Capacity
              </span>
              <div className="text-lg font-bold text-[var(--color-brand-text-primary)] mt-1">
                {formatNumber(port.handlingCapacityMtDay)} <span className="text-xs text-[var(--color-brand-text-muted)] font-normal">MT/Day</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)]">
              <span className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
                Operational Berths
              </span>
              <div className="text-lg font-bold text-[var(--color-gov-saffron)] mt-1">
                {port.berthCapacity || 0} <span className="text-xs text-[var(--color-brand-text-muted)] font-normal">Berths</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] col-span-2 sm:col-span-1">
              <span className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
                Status
              </span>
              <div className="text-lg font-bold text-[var(--color-status-success)] mt-1">
                {port.active ? 'OPERATIONAL' : 'OFFLINE'}
              </div>
            </div>
          </div>

          {/* Physical & Navigational Constraints */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--color-brand-text-muted)] mb-3 flex items-center gap-2">
              <Ruler className="w-3.5 h-3.5 text-[var(--color-gov-saffron)]" />
              NAVIGATIONAL & BERTH CONSTRAINTS
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-[var(--color-brand-elevated)] border border-[var(--color-brand-border)]">
                <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
                  Maximum Allowable Draft (T)
                </div>
                <div className="text-xl font-bold text-[var(--color-brand-text-primary)] mt-1">
                  {formatNumber(port.maxDraftM, 2)} <span className="text-xs text-[var(--color-brand-text-muted)]">meters</span>
                </div>
                <div className="text-[11px] text-[var(--color-brand-text-muted)] mt-1">
                  Safe water depth under keel
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--color-brand-elevated)] border border-[var(--color-brand-border)]">
                <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
                  Maximum Length Overall (LOA)
                </div>
                <div className="text-xl font-bold text-[var(--color-brand-text-primary)] mt-1">
                  {formatNumber(port.maxLoaM, 2)} <span className="text-xs text-[var(--color-brand-text-muted)]">meters</span>
                </div>
                <div className="text-[11px] text-[var(--color-brand-text-muted)] mt-1">
                  Quay and basin boundary
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--color-brand-elevated)] border border-[var(--color-brand-border)]">
                <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
                  Maximum Beam Limit (B)
                </div>
                <div className="text-xl font-bold text-[var(--color-brand-text-primary)] mt-1">
                  {formatNumber(port.maxBeamM, 2)} <span className="text-xs text-[var(--color-brand-text-muted)]">meters</span>
                </div>
                <div className="text-[11px] text-[var(--color-brand-text-muted)] mt-1">
                  Channel / crane outreach width
                </div>
              </div>
            </div>
          </div>

          {/* Feasible Vessel Classes Analysis */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--color-brand-text-muted)] mb-3 flex items-center gap-2">
              <Ship className="w-3.5 h-3.5 text-[var(--color-status-info)]" />
              BULK CARRIER CLASS COMPATIBILITY
            </h4>
            <div className="space-y-2">
              {vesselClasses.map((vc) => {
                const draftPass = draft >= vc.draftReq;
                const loaPass = loa >= vc.loaReq;
                const beamPass = beam >= vc.beamReq;
                const fullyCompatible = draftPass && loaPass && beamPass;

                return (
                  <div
                    key={vc.name}
                    className="p-3.5 rounded-2xl bg-[var(--color-brand-elevated)] border border-[var(--color-brand-border)] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {fullyCompatible ? (
                        <CheckCircle2 className="w-5 h-5 text-[var(--color-status-success)] flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-[var(--color-status-error)] flex-shrink-0" />
                      )}
                      <div>
                        <div className="text-xs font-bold text-[var(--color-brand-text-primary)]">{vc.name}</div>
                        <div className="text-[11px] text-[var(--color-brand-text-muted)]">
                          Req: {vc.draftReq}m Draft · {vc.loaReq}m LOA · {vc.beamReq}m Beam
                        </div>
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className={`text-[11px] font-bold uppercase tracking-wider ${
                        fullyCompatible
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-[var(--color-status-success)]'
                          : 'border-red-500/30 bg-red-500/10 text-[var(--color-status-error)]'
                      }`}
                    >
                      {fullyCompatible ? 'FEASIBLE' : 'RESTRICTED'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Port UUID Metadata */}
          <div className="p-3 rounded-xl bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] text-[11px] text-[var(--color-brand-text-secondary)] flex justify-between items-center">
            <span>Port Identifier: {port.id}</span>
          </div>
        </div>

        {/* ── FOOTER ─────────────────────────────────────────────────── */}
        <div className="p-4 border-t border-[var(--color-brand-border)] bg-[var(--color-brand-elevated)] flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onClose();
              if (onEdit) onEdit(port);
            }}
            className="border-orange-500/30 text-[var(--color-gov-saffron)] hover:bg-orange-500/10"
          >
            EDIT SPECIFICATIONS
          </Button>

          <Button variant="ghost" size="sm" onClick={onClose}>
            CLOSE
          </Button>
        </div>
      </div>
    </div>
  );
};
