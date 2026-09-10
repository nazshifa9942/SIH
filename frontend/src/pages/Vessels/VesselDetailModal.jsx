import React, { useEffect, useState } from 'react';
import {
  Ship,
  Anchor,
  X,
  Calendar,
  MapPin,
  Gauge,
  Ruler,
  Maximize2,
  DollarSign,
  Fuel,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  History,
  Info,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { getVesselAvailability } from '../../api/vessels';

export const VesselDetailModal = ({ vessel, isOpen, onClose }) => {
  const [availabilityRecords, setAvailabilityRecords] = useState([]);
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [activeTab, setActiveTab] = useState('specs'); // 'specs' | 'availability'

  useEffect(() => {
    if (isOpen && vessel?.id) {
      setLoadingAvail(true);
      getVesselAvailability(vessel.id)
        .then((res) => {
          setAvailabilityRecords(Array.isArray(res) ? res : []);
        })
        .catch((err) => {
          console.error('Failed to load vessel availability:', err);
          setAvailabilityRecords([]);
        })
        .finally(() => {
          setLoadingAvail(false);
        });
    }
  }, [isOpen, vessel?.id]);

  if (!isOpen || !vessel) return null;

  const getStatusColor = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'AVAILABLE') return 'var(--color-status-success)';
    if (s === 'IN_TRANSIT' || s === 'CHARTERED') return 'var(--color-status-info)';
    if (s === 'MAINTENANCE') return 'var(--color-status-warning)';
    return 'var(--color-brand-text-secondary)';
  };

  const formatNumber = (num, decimals = 0) => {
    if (num === null || num === undefined || isNaN(Number(num))) return 'N/A';
    return Number(num).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const status = vessel.availabilityStatus || vessel.status || 'AVAILABLE';
  const statusColor = getStatusColor(status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white border border-[var(--color-brand-border)] rounded-lg shadow-[0_12px_32px_-8px_rgba(16,24,40,0.18)] overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <div className="p-6 border-b border-[var(--color-brand-border)] bg-[var(--color-brand-elevated)] flex justify-between items-start">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
              <Ship className="w-6 h-6 text-[var(--color-status-info)]" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-[var(--color-brand-text-primary)] tracking-wide">{vessel.name}</h2>
                <Badge
                  variant="outline"
                  className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                  style={{
                    borderColor: `${statusColor}40`,
                    backgroundColor: `color-mix(in srgb, ${statusColor} 12%, transparent)`,
                    color: statusColor,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
                  {status}
                </Badge>
              </div>
              <div className="text-xs uppercase tracking-widest text-[var(--color-brand-text-secondary)] mt-1">
                {vessel.vesselType || vessel.type || 'BULK CARRIER'} · ID: {vessel.id?.slice(0, 8)}...
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

        {/* ── TABS ───────────────────────────────────────────────────── */}
        <div className="flex border-b border-[var(--color-brand-border)] bg-[var(--color-brand-inset)] px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('specs')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-xl transition-all ${
              activeTab === 'specs'
                ? 'bg-[var(--color-brand-elevated)] text-[var(--color-gov-saffron)] border-t-2 border-orange-500'
                : 'text-[var(--color-brand-text-muted)] hover:text-[var(--color-brand-text-primary)] hover:bg-slate-50'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            TECHNICAL SPECIFICATIONS
          </button>
          <button
            onClick={() => setActiveTab('availability')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-xl transition-all ${
              activeTab === 'availability'
                ? 'bg-[var(--color-brand-elevated)] text-[var(--color-gov-saffron)] border-t-2 border-orange-500'
                : 'text-[var(--color-brand-text-muted)] hover:text-[var(--color-brand-text-primary)] hover:bg-slate-50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            AVAILABILITY & TIMELINE ({availabilityRecords.length})
          </button>
        </div>

        {/* ── MODAL BODY ─────────────────────────────────────────────── */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: TECHNICAL SPECS */}
          {activeTab === 'specs' && (
            <div className="space-y-6">
              {/* Primary Highlights Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)]">
                  <span className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
                    Deadweight Capacity
                  </span>
                  <div className="text-lg font-bold text-[var(--color-brand-text-primary)] mt-1">
                    {formatNumber(vessel.capacityMt)} <span className="text-xs text-[var(--color-brand-text-muted)] font-normal">MT</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)]">
                  <span className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
                    Service Speed
                  </span>
                  <div className="text-lg font-bold text-[var(--color-brand-text-primary)] mt-1">
                    {formatNumber(vessel.speedKnots, 1)} <span className="text-xs text-[var(--color-brand-text-muted)] font-normal">knots</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)]">
                  <span className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
                    Daily Charter Cost
                  </span>
                  <div className="text-lg font-bold text-[var(--color-status-success)] mt-1">
                    ${formatNumber(vessel.dailyCharterCost)} <span className="text-xs text-[var(--color-brand-text-muted)] font-normal">/day</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)]">
                  <span className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
                    Fuel Consumption
                  </span>
                  <div className="text-lg font-bold text-[var(--color-status-warning)] mt-1">
                    {formatNumber(vessel.fuelConsumption, 1)} <span className="text-xs text-[var(--color-brand-text-muted)] font-normal">MT/day</span>
                  </div>
                </div>
              </div>

              {/* Physical Dimensions & Hydrodynamic Constraints */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--color-brand-text-muted)] mb-3 flex items-center gap-2">
                  <Ruler className="w-3.5 h-3.5 text-[var(--color-status-info)]" />
                  PHYSICAL DIMENSIONS & PORT CONSTRAINTS
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-[var(--color-brand-elevated)] border border-[var(--color-brand-border)]">
                    <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
                      Maximum Draft (T)
                    </div>
                    <div className="text-xl font-bold text-[var(--color-brand-text-primary)] mt-1">
                      {formatNumber(vessel.draftM, 2)} <span className="text-xs text-[var(--color-brand-text-muted)]">meters</span>
                    </div>
                    <div className="text-[11px] text-[var(--color-brand-text-muted)] mt-1">
                      Depth clearance requirement
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[var(--color-brand-elevated)] border border-[var(--color-brand-border)]">
                    <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
                      Length Overall (LOA)
                    </div>
                    <div className="text-xl font-bold text-[var(--color-brand-text-primary)] mt-1">
                      {formatNumber(vessel.loaM, 2)} <span className="text-xs text-[var(--color-brand-text-muted)]">meters</span>
                    </div>
                    <div className="text-[11px] text-[var(--color-brand-text-muted)] mt-1">
                      Berth length constraint
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[var(--color-brand-elevated)] border border-[var(--color-brand-border)]">
                    <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
                      Moulded Beam (B)
                    </div>
                    <div className="text-xl font-bold text-[var(--color-brand-text-primary)] mt-1">
                      {formatNumber(vessel.beamM, 2)} <span className="text-xs text-[var(--color-brand-text-muted)]">meters</span>
                    </div>
                    <div className="text-[11px] text-[var(--color-brand-text-muted)] mt-1">
                      Channel / lock restriction
                    </div>
                  </div>
                </div>
              </div>

              {/* Vessel Operational Summary Note */}
              <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-xs text-[var(--color-brand-text-secondary)] flex items-start gap-3">
                <Info className="w-5 h-5 text-[var(--color-status-info)] flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[var(--color-status-info)] uppercase tracking-wider mb-0.5">
                    Operational Feasibility Summary
                  </div>
                  This vessel is categorized under{' '}
                  <span className="text-[var(--color-brand-text-primary)] font-bold">{vessel.vesselType || 'BULK CARRIER'}</span> class.
                  Its LOA of {formatNumber(vessel.loaM, 1)}m and draft of {formatNumber(vessel.draftM, 1)}m
                  are verified automatically during voyage optimization against port berth limits.
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AVAILABILITY TIMELINE */}
          {activeTab === 'availability' && (
            <div className="space-y-4">
              {loadingAvail ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500" />
                  <span className="text-xs text-[var(--color-brand-text-muted)] uppercase tracking-widest">
                    Retrieving vessel availability schedule...
                  </span>
                </div>
              ) : availabilityRecords.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-[var(--color-brand-border)] bg-[var(--color-brand-inset)]">
                  <Clock className="w-8 h-8 text-[var(--color-brand-text-muted)] mx-auto mb-2" />
                  <div className="text-sm font-bold text-[var(--color-brand-text-secondary)] uppercase tracking-wider">
                    No Direct Availability Records Logged
                  </div>
                  <div className="text-xs text-[var(--color-brand-text-muted)] mt-1">
                    Current vessel status is set to{' '}
                    <span className="text-[var(--color-brand-text-primary)] font-bold">{status}</span>.
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {availabilityRecords.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-4 rounded-2xl bg-[var(--color-brand-elevated)] border border-[var(--color-brand-border)] hover:border-[var(--color-brand-border-strong)] transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-[var(--color-gov-saffron)]" />
                          <span className="font-bold text-[var(--color-brand-text-primary)] text-sm">
                            {item.currentLocation || 'At Sea / Unspecified Location'}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider w-fit"
                          style={{
                            borderColor: `${getStatusColor(item.status)}40`,
                            backgroundColor: `color-mix(in srgb, ${getStatusColor(item.status)} 12%, transparent)`,
                            color: getStatusColor(item.status),
                          }}
                        >
                          {item.status || 'AVAILABLE'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)]">
                          <div className="text-[11px] uppercase text-[var(--color-brand-text-secondary)]">
                            Available From
                          </div>
                          <div className="font-bold text-[var(--color-brand-text-primary)] mt-0.5">
                            {formatDate(item.availableFrom)}
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)]">
                          <div className="text-[11px] uppercase text-[var(--color-brand-text-secondary)]">
                            Available Until
                          </div>
                          <div className="font-bold text-[var(--color-brand-text-primary)] mt-0.5">
                            {formatDate(item.availableUntil)}
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)]">
                          <div className="text-[11px] uppercase text-[var(--color-brand-text-secondary)]">
                            Source / Observed
                          </div>
                          <div className="text-[var(--color-brand-text-secondary)] mt-0.5 truncate">
                            {item.source || 'AIS Feed'} · {formatDate(item.observedAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── FOOTER ─────────────────────────────────────────────────── */}
        <div className="p-4 border-t border-[var(--color-brand-border)] bg-[var(--color-brand-elevated)] flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="px-6">
            CLOSE
          </Button>
        </div>
      </div>
    </div>
  );
};
