import React from 'react';
import {
  AlertTriangle,
  X,
  Clock,
  MapPin,
  Ship,
  Zap,
  ArrowRight,
  CheckCircle2,
  ShieldAlert,
  Info,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const AlertDetailModal = ({ alert, isOpen, onClose, onAcknowledge }) => {
  const navigate = useNavigate();

  if (!isOpen || !alert) return null;

  const severity = (alert.severity || 'INFO').toUpperCase();
  const alertType = (alert.alertType || 'SYSTEM').toUpperCase();

  const getSeverityBadge = () => {
    if (severity === 'CRITICAL' || severity === 'ERROR') {
      return (
        <Badge className="bg-red-100 text-[var(--color-status-error)] border border-red-500/30 text-[11px] font-bold uppercase tracking-wider">
          <AlertTriangle className="w-3 h-3 mr-1" /> CRITICAL EXCEPTION
        </Badge>
      );
    }
    if (severity === 'WARNING') {
      return (
        <Badge className="bg-amber-100 text-[var(--color-status-warning)] border border-amber-500/30 text-[11px] font-bold uppercase tracking-wider">
          <AlertTriangle className="w-3 h-3 mr-1" /> WARNING ALERT
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-100 text-[var(--color-status-info)] border border-blue-500/30 text-[11px] font-bold uppercase tracking-wider">
        <Info className="w-3 h-3 mr-1" /> OPERATIONAL INFO
      </Badge>
    );
  };

  const isAcknowledged = Boolean(alert.acknowledgedAt || alert.isRead);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-[var(--color-brand-border)] rounded-lg shadow-[0_12px_32px_-8px_rgba(16,24,40,0.18)] overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <div className="p-6 border-b border-[var(--color-brand-border)] bg-[var(--color-brand-elevated)] flex justify-between items-start">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-6 h-6 text-[var(--color-gov-saffron)]" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                {getSeverityBadge()}
                <span className="text-xs font-bold text-[var(--color-brand-text-secondary)] uppercase tracking-widest">
                  {alertType} EXCEPTION
                </span>
              </div>
              <h2 className="text-lg font-bold text-[var(--color-brand-text-primary)] tracking-wide leading-snug">
                {alert.message}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[var(--color-brand-text-muted)] hover:text-[var(--color-brand-text-primary)] rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── BODY ───────────────────────────────────────────────────── */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Timestamp & Metadata Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)]">
              <span className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
                Triggered Timestamp
              </span>
              <div className="text-xs font-bold text-[var(--color-brand-text-primary)] mt-1">
                {alert.triggeredAt && !isNaN(new Date(alert.triggeredAt).getTime())
                  ? new Date(alert.triggeredAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })
                  : 'N/A'}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)]">
              <span className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
                Acknowledgment Status
              </span>
              <div className="text-xs font-bold mt-1 flex items-center gap-1.5">
                {isAcknowledged ? (
                  <span className="text-[var(--color-status-success)] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Acknowledged
                  </span>
                ) : (
                  <span className="text-[var(--color-status-warning)]">Pending Action</span>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] col-span-2 sm:col-span-1">
              <span className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
                Alert Identifier
              </span>
              <div className="text-xs text-[var(--color-brand-text-secondary)] mt-1 truncate">
                {alert.id?.slice(0, 12)}...
              </div>
            </div>
          </div>

          {/* Recommendation Transition Shift (if present) */}
          {(alert.oldRecommendation || alert.newRecommendation) && (
            <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 space-y-3">
              <div className="text-xs font-bold uppercase tracking-widest text-[var(--color-gov-saffron)] flex items-center gap-2">
                <Zap className="w-4 h-4 text-[var(--color-gov-saffron)]" />
                PROCUREMENT RECOMMENDATION SHIFT
              </div>
              <div className="flex items-center gap-4 text-sm font-bold">
                <div className="p-2.5 rounded-xl bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] text-[var(--color-brand-text-muted)]">
                  <span className="text-[11px] uppercase text-[var(--color-brand-text-muted)] block mb-0.5">Previous Action</span>
                  {alert.oldRecommendation || 'MONITOR'}
                </div>
                <ArrowRight className="w-5 h-5 text-[var(--color-gov-saffron)] flex-shrink-0" />
                <div className="p-2.5 rounded-xl bg-emerald-100 border border-emerald-500/40 text-[var(--color-status-success)]">
                  <span className="text-[11px] uppercase text-emerald-500/70 block mb-0.5">New Recommended Action</span>
                  {alert.newRecommendation || 'LOCK_NOW'}
                </div>
              </div>
              <p className="text-xs text-[var(--color-brand-text-secondary)]">
                Market conditions and risk models triggered an automated procurement shift. Review the Cargo Workspace to execute or override.
              </p>
            </div>
          )}

          {/* Cargo Request Linkage */}
          {alert.cargoRequestId && (
            <div className="p-4 rounded-2xl bg-[var(--color-brand-elevated)] border border-[var(--color-brand-border)] space-y-3">
              <div className="flex justify-between items-center">
                <div className="text-xs font-bold uppercase tracking-widest text-[var(--color-brand-text-muted)] flex items-center gap-2">
                  <Ship className="w-4 h-4 text-[var(--color-status-info)]" />
                  LINKED CARGO REQUEST
                </div>
                <button
                  onClick={() => {
                    onClose();
                    navigate(`/cargo/${alert.cargoRequestId}`);
                  }}
                  className="text-xs text-[var(--color-gov-saffron)] hover:text-[var(--color-gov-saffron)] flex items-center gap-1 font-bold"
                >
                  Open Cargo Workspace <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[var(--color-brand-inset)]">
                  <span className="text-[11px] text-[var(--color-brand-text-muted)] uppercase">Cargo Type</span>
                  <div className="font-bold text-[var(--color-brand-text-primary)] mt-0.5">
                    {alert.cargoRequest?.cargoType || 'DRY BULK CARGO'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[var(--color-brand-inset)]">
                  <span className="text-[11px] text-[var(--color-brand-text-muted)] uppercase">Status</span>
                  <div className="font-bold text-[var(--color-status-success)] mt-0.5">
                    {alert.cargoRequest?.status || 'ACTIVE'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Operational Guidance */}
          <div className="p-4 rounded-2xl bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] text-xs text-[var(--color-brand-text-secondary)] flex items-start gap-3">
            <Info className="w-5 h-5 text-[var(--color-status-info)] flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-[var(--color-status-info)] uppercase tracking-wider mb-0.5">
                Suggested Logistics Action
              </div>
              Cross-reference active weather storm tracks and bunker fuel price volatility before committing spot contracts or finalizing voyage routing.
            </div>
          </div>
        </div>

        {/* ── FOOTER ─────────────────────────────────────────────────── */}
        <div className="p-4 border-t border-[var(--color-brand-border)] bg-[var(--color-brand-elevated)] flex justify-between items-center">
          <div>
            {!isAcknowledged && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (onAcknowledge) onAcknowledge(alert.id);
                }}
                className="border-emerald-500/30 text-[var(--color-status-success)] hover:bg-emerald-500/10"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> MARK AS ACKNOWLEDGED
              </Button>
            )}
          </div>

          <Button variant="ghost" size="sm" onClick={onClose}>
            CLOSE
          </Button>
        </div>
      </div>
    </div>
  );
};
