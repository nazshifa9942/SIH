import React, { useState, useEffect } from 'react';
import {
  Ship,
  X,
  CheckCircle2,
  AlertTriangle,
  Ruler,
  DollarSign,
  Gauge,
  Fuel,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { createVessel, updateVessel } from '../../api/vessels';

const VESSEL_TYPES = [
  'CAPESIZE',
  'PANAMAX',
  'SUPRAMAX',
  'HANDYSIZE',
  'BULK_CARRIER',
];

const AVAILABILITY_STATUSES = [
  'AVAILABLE',
  'IN_TRANSIT',
  'CHARTERED',
  'MAINTENANCE',
];

export const VesselDialog = ({ isOpen, vessel, onClose, onSuccess }) => {
  const isEditing = Boolean(vessel?.id);

  const [formData, setFormData] = useState({
    name: '',
    vesselType: 'PANAMAX',
    capacityMt: '',
    draftM: '',
    loaM: '',
    beamM: '',
    speedKnots: '14.5',
    fuelConsumption: '30.0',
    dailyCharterCost: '18500',
    availabilityStatus: 'AVAILABLE',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (vessel) {
      setFormData({
        name: vessel.name || '',
        vesselType: vessel.vesselType || 'PANAMAX',
        capacityMt: vessel.capacityMt !== undefined ? String(vessel.capacityMt) : '',
        draftM: vessel.draftM !== undefined ? String(vessel.draftM) : '',
        loaM: vessel.loaM !== undefined ? String(vessel.loaM) : '',
        beamM: vessel.beamM !== undefined ? String(vessel.beamM) : '',
        speedKnots: vessel.speedKnots !== undefined ? String(vessel.speedKnots) : '14.5',
        fuelConsumption:
          vessel.fuelConsumption !== undefined ? String(vessel.fuelConsumption) : '30.0',
        dailyCharterCost:
          vessel.dailyCharterCost !== undefined ? String(vessel.dailyCharterCost) : '18500',
        availabilityStatus: vessel.availabilityStatus || 'AVAILABLE',
      });
    } else {
      setFormData({
        name: '',
        vesselType: 'PANAMAX',
        capacityMt: '75000',
        draftM: '14.2',
        loaM: '225',
        beamM: '32.2',
        speedKnots: '14.5',
        fuelConsumption: '30.0',
        dailyCharterCost: '18500',
        availabilityStatus: 'AVAILABLE',
      });
    }
    setErrors({});
    setApiError('');
  }, [vessel, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Vessel name is required (min 2 chars)';
    if (!formData.vesselType) newErrors.vesselType = 'Vessel class is required';

    const cap = parseFloat(formData.capacityMt);
    if (isNaN(cap) || cap <= 0) newErrors.capacityMt = 'Valid positive deadweight capacity required';

    const draft = parseFloat(formData.draftM);
    if (isNaN(draft) || draft <= 0) newErrors.draftM = 'Valid positive draft (m) required';

    const loa = parseFloat(formData.loaM);
    if (isNaN(loa) || loa <= 0) newErrors.loaM = 'Valid positive LOA (m) required';

    const beam = parseFloat(formData.beamM);
    if (isNaN(beam) || beam <= 0) newErrors.beamM = 'Valid positive beam (m) required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setApiError('');

    const payload = {
      name: formData.name.trim(),
      vesselType: formData.vesselType,
      capacityMt: parseFloat(formData.capacityMt),
      draftM: parseFloat(formData.draftM),
      loaM: parseFloat(formData.loaM),
      beamM: parseFloat(formData.beamM),
      speedKnots: formData.speedKnots ? parseFloat(formData.speedKnots) : 14.5,
      fuelConsumption: formData.fuelConsumption ? parseFloat(formData.fuelConsumption) : 30.0,
      dailyCharterCost: formData.dailyCharterCost ? parseFloat(formData.dailyCharterCost) : 18000,
      availabilityStatus: formData.availabilityStatus,
    };

    try {
      if (isEditing) {
        await updateVessel(vessel.id, payload);
      } else {
        await createVessel(payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to save vessel:', err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to save vessel specifications. Ensure Admin authorization.';
      setApiError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-[var(--color-brand-border)] rounded-lg shadow-[0_12px_32px_-8px_rgba(16,24,40,0.18)] overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-brand-border)] bg-[var(--color-brand-elevated)] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Ship className="w-5 h-5 text-[var(--color-status-info)]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--color-brand-text-primary)] uppercase tracking-wider">
                {isEditing ? 'EDIT BULK CARRIER SPECS' : 'REGISTER NEW BULK CARRIER'}
              </h2>
              <p className="text-[11px] text-[var(--color-brand-text-secondary)] uppercase tracking-widest">
                Fleet Hydrodynamics & Operational Charter Specifications
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[var(--color-brand-text-muted)] hover:text-[var(--color-brand-text-primary)] rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {apiError && (
            <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-[var(--color-status-error)] text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Vessel Name */}
            <div className="sm:col-span-2">
              <label className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] block mb-1">
                Vessel Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. PACIFIC TITAN"
                className="w-full bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] rounded-xl px-4 py-2.5 text-xs text-[var(--color-brand-text-primary)] placeholder:text-gray-600 focus:outline-none focus:border-[var(--color-gov-navy)]"
              />
              {errors.name && <span className="text-[11px] text-[var(--color-status-error)]">{errors.name}</span>}
            </div>

            {/* Vessel Class */}
            <div>
              <label className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] block mb-1">
                Vessel Class / Category *
              </label>
              <select
                value={formData.vesselType}
                onChange={(e) => setFormData({ ...formData, vesselType: e.target.value })}
                className="w-full bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] rounded-xl px-4 py-2.5 text-xs text-[var(--color-brand-text-primary)] focus:outline-none focus:border-[var(--color-gov-navy)]"
              >
                {VESSEL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Availability Status */}
            <div>
              <label className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] block mb-1">
                Availability Status *
              </label>
              <select
                value={formData.availabilityStatus}
                onChange={(e) => setFormData({ ...formData, availabilityStatus: e.target.value })}
                className="w-full bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] rounded-xl px-4 py-2.5 text-xs text-[var(--color-brand-text-primary)] focus:outline-none focus:border-[var(--color-gov-navy)]"
              >
                {AVAILABILITY_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Capacity DWT */}
            <div>
              <label className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] block mb-1">
                Deadweight Capacity (MT) *
              </label>
              <input
                type="number"
                step="any"
                value={formData.capacityMt}
                onChange={(e) => setFormData({ ...formData, capacityMt: e.target.value })}
                placeholder="e.g. 75000"
                className="w-full bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] rounded-xl px-4 py-2.5 text-xs text-[var(--color-brand-text-primary)] focus:outline-none focus:border-[var(--color-gov-navy)]"
              />
              {errors.capacityMt && <span className="text-[11px] text-[var(--color-status-error)]">{errors.capacityMt}</span>}
            </div>

            {/* Draft (m) */}
            <div>
              <label className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] block mb-1">
                Max Scantling Draft (m) *
              </label>
              <input
                type="number"
                step="any"
                value={formData.draftM}
                onChange={(e) => setFormData({ ...formData, draftM: e.target.value })}
                placeholder="e.g. 14.2"
                className="w-full bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] rounded-xl px-4 py-2.5 text-xs text-[var(--color-brand-text-primary)] focus:outline-none focus:border-[var(--color-gov-navy)]"
              />
              {errors.draftM && <span className="text-[11px] text-[var(--color-status-error)]">{errors.draftM}</span>}
            </div>

            {/* LOA (m) */}
            <div>
              <label className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] block mb-1">
                Length Overall (LOA m) *
              </label>
              <input
                type="number"
                step="any"
                value={formData.loaM}
                onChange={(e) => setFormData({ ...formData, loaM: e.target.value })}
                placeholder="e.g. 225.0"
                className="w-full bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] rounded-xl px-4 py-2.5 text-xs text-[var(--color-brand-text-primary)] focus:outline-none focus:border-[var(--color-gov-navy)]"
              />
              {errors.loaM && <span className="text-[11px] text-[var(--color-status-error)]">{errors.loaM}</span>}
            </div>

            {/* Beam (m) */}
            <div>
              <label className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] block mb-1">
                Extreme Beam (m) *
              </label>
              <input
                type="number"
                step="any"
                value={formData.beamM}
                onChange={(e) => setFormData({ ...formData, beamM: e.target.value })}
                placeholder="e.g. 32.2"
                className="w-full bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] rounded-xl px-4 py-2.5 text-xs text-[var(--color-brand-text-primary)] focus:outline-none focus:border-[var(--color-gov-navy)]"
              />
              {errors.beamM && <span className="text-[11px] text-[var(--color-status-error)]">{errors.beamM}</span>}
            </div>

            {/* Service Speed (knots) */}
            <div>
              <label className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] block mb-1">
                Service Speed (knots)
              </label>
              <input
                type="number"
                step="any"
                value={formData.speedKnots}
                onChange={(e) => setFormData({ ...formData, speedKnots: e.target.value })}
                placeholder="e.g. 14.5"
                className="w-full bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] rounded-xl px-4 py-2.5 text-xs text-[var(--color-brand-text-primary)] focus:outline-none focus:border-[var(--color-gov-navy)]"
              />
            </div>

            {/* Daily Charter Cost ($/day) */}
            <div>
              <label className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] block mb-1">
                Daily Charter Rate (USD / Day)
              </label>
              <input
                type="number"
                step="any"
                value={formData.dailyCharterCost}
                onChange={(e) => setFormData({ ...formData, dailyCharterCost: e.target.value })}
                placeholder="e.g. 18500"
                className="w-full bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] rounded-xl px-4 py-2.5 text-xs text-[var(--color-brand-text-primary)] focus:outline-none focus:border-[var(--color-gov-navy)]"
              />
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-brand-border)]">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              CANCEL
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              size="sm"
              className="bg-blue-500 hover:bg-blue-600 text-[var(--color-brand-text-primary)] font-bold text-xs"
            >
              {submitting ? 'SAVING...' : isEditing ? 'UPDATE VESSEL SPECS' : 'SAVE BULK CARRIER'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
