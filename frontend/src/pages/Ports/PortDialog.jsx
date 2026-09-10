import React, { useEffect, useState } from 'react';
import { Anchor, X, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { createPort, updatePort } from '../../api/ports';

export const PortDialog = ({ isOpen, port, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    region: '',
    maxDraftM: '',
    maxLoaM: '',
    maxBeamM: '',
    handlingCapacityMtDay: '',
    berthCapacity: '',
    active: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (port) {
        setFormData({
          name: port.name || '',
          country: port.country || '',
          region: port.region || '',
          maxDraftM: port.maxDraftM !== undefined ? String(port.maxDraftM) : '',
          maxLoaM: port.maxLoaM !== undefined ? String(port.maxLoaM) : '',
          maxBeamM: port.maxBeamM !== undefined ? String(port.maxBeamM) : '',
          handlingCapacityMtDay:
            port.handlingCapacityMtDay !== undefined ? String(port.handlingCapacityMtDay) : '',
          berthCapacity: port.berthCapacity !== undefined ? String(port.berthCapacity) : '',
          active: port.active !== undefined ? Boolean(port.active) : true,
        });
      } else {
        setFormData({
          name: '',
          country: '',
          region: '',
          maxDraftM: '',
          maxLoaM: '',
          maxBeamM: '',
          handlingCapacityMtDay: '',
          berthCapacity: '',
          active: true,
        });
      }
      setError('');
    }
  }, [isOpen, port]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const validate = () => {
    if (!formData.name.trim()) return 'Port name is required.';
    if (!formData.country.trim()) return 'Country is required.';

    const draft = Number(formData.maxDraftM);
    if (!formData.maxDraftM || isNaN(draft) || draft <= 0) {
      return 'Maximum Draft must be a positive number in meters.';
    }

    const loa = Number(formData.maxLoaM);
    if (!formData.maxLoaM || isNaN(loa) || loa <= 0) {
      return 'Maximum LOA must be a positive number in meters.';
    }

    const beam = Number(formData.maxBeamM);
    if (!formData.maxBeamM || isNaN(beam) || beam <= 0) {
      return 'Maximum Beam must be a positive number in meters.';
    }

    const handling = Number(formData.handlingCapacityMtDay);
    if (!formData.handlingCapacityMtDay || isNaN(handling) || handling <= 0) {
      return 'Handling capacity must be a positive number in MT/day.';
    }

    const berths = parseInt(formData.berthCapacity, 10);
    if (formData.berthCapacity === '' || isNaN(berths) || berths < 0) {
      return 'Berth capacity must be a non-negative integer.';
    }

    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        country: formData.country.trim(),
        region: formData.region?.trim() || null,
        maxDraftM: Number(formData.maxDraftM),
        maxLoaM: Number(formData.maxLoaM),
        maxBeamM: Number(formData.maxBeamM),
        handlingCapacityMtDay: Number(formData.handlingCapacityMtDay),
        berthCapacity: parseInt(formData.berthCapacity, 10),
        active: Boolean(formData.active),
      };

      if (port?.id) {
        await updatePort(port.id, payload);
      } else {
        await createPort(payload);
      }

      onSuccess();
    } catch (err) {
      console.error('Port save error:', err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.response?.data?.errors?.[0]?.message ||
        'Failed to save port. Please verify credentials/permissions and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white border border-[var(--color-brand-border)] p-7 rounded-lg shadow-[0_12px_32px_-8px_rgba(16,24,40,0.18)] my-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-5 border-b border-[var(--color-brand-border)] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
              <Anchor className="w-5 h-5 text-[var(--color-gov-saffron)]" />
            </div>
            <div>
              <h2 className="text-lg font-bold uppercase tracking-wider text-[var(--color-brand-text-primary)]">
                {port ? 'Edit Port Specifications' : 'Register New Port'}
              </h2>
              <span className="text-[11px] text-[var(--color-brand-text-secondary)] uppercase tracking-widest">
                Port Constraints & Physical Limit Configuration
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--color-brand-text-muted)] hover:text-[var(--color-brand-text-primary)] rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-[var(--color-status-error)] text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Port Name & Country */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] block mb-1">
                Port Name *
              </label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g. Newcastle"
                className="w-full bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] p-2.5 rounded-xl text-xs text-[var(--color-brand-text-primary)] focus:outline-none focus:border-[var(--color-gov-navy)]"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] block mb-1">
                Country *
              </label>
              <input
                required
                type="text"
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value)}
                placeholder="e.g. Australia"
                className="w-full bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] p-2.5 rounded-xl text-xs text-[var(--color-brand-text-primary)] focus:outline-none focus:border-[var(--color-gov-navy)]"
              />
            </div>
          </div>

          {/* Region */}
          <div>
            <label className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] block mb-1">
              Region / Coastline (Optional)
            </label>
            <input
              type="text"
              value={formData.region}
              onChange={(e) => handleChange('region', e.target.value)}
              placeholder="e.g. Asia-Pacific / East Coast"
              className="w-full bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] p-2.5 rounded-xl text-xs text-[var(--color-brand-text-primary)] focus:outline-none focus:border-[var(--color-gov-navy)]"
            />
          </div>

          {/* Constraints Grid (Draft, LOA, Beam) */}
          <div className="p-4 rounded-2xl bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-gov-saffron)]">
              Navigational & Berth Constraints
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] uppercase text-[var(--color-brand-text-secondary)] block mb-1">
                  Max Draft (m) *
                </label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="1"
                  value={formData.maxDraftM}
                  onChange={(e) => handleChange('maxDraftM', e.target.value)}
                  placeholder="e.g. 15.2"
                  className="w-full bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] p-2.5 rounded-xl text-xs text-[var(--color-brand-text-primary)] focus:outline-none focus:border-[var(--color-gov-navy)]"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase text-[var(--color-brand-text-secondary)] block mb-1">
                  Max LOA (m) *
                </label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="1"
                  value={formData.maxLoaM}
                  onChange={(e) => handleChange('maxLoaM', e.target.value)}
                  placeholder="e.g. 292.0"
                  className="w-full bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] p-2.5 rounded-xl text-xs text-[var(--color-brand-text-primary)] focus:outline-none focus:border-[var(--color-gov-navy)]"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase text-[var(--color-brand-text-secondary)] block mb-1">
                  Max Beam (m) *
                </label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="1"
                  value={formData.maxBeamM}
                  onChange={(e) => handleChange('maxBeamM', e.target.value)}
                  placeholder="e.g. 45.0"
                  className="w-full bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] p-2.5 rounded-xl text-xs text-[var(--color-brand-text-primary)] focus:outline-none focus:border-[var(--color-gov-navy)]"
                />
              </div>
            </div>
          </div>

          {/* Operational Capacity (Handling rate, Berths) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] block mb-1">
                Daily Handling Capacity (MT/Day) *
              </label>
              <input
                required
                type="number"
                step="1"
                min="100"
                value={formData.handlingCapacityMtDay}
                onChange={(e) => handleChange('handlingCapacityMtDay', e.target.value)}
                placeholder="e.g. 50000"
                className="w-full bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] p-2.5 rounded-xl text-xs text-[var(--color-brand-text-primary)] focus:outline-none focus:border-[var(--color-gov-navy)]"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] block mb-1">
                Berth Capacity (No. of Berths) *
              </label>
              <input
                required
                type="number"
                step="1"
                min="0"
                value={formData.berthCapacity}
                onChange={(e) => handleChange('berthCapacity', e.target.value)}
                placeholder="e.g. 6"
                className="w-full bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] p-2.5 rounded-xl text-xs text-[var(--color-brand-text-primary)] focus:outline-none focus:border-[var(--color-gov-navy)]"
              />
            </div>
          </div>

          {/* Status Checkbox */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="portActiveCheckbox"
              checked={formData.active}
              onChange={(e) => handleChange('active', e.target.checked)}
              className="w-4 h-4 rounded border-[var(--color-brand-border-strong)] bg-[var(--color-brand-inset)] text-[var(--color-gov-saffron)] focus:ring-0 cursor-pointer"
            />
            <label
              htmlFor="portActiveCheckbox"
              className="text-xs text-[var(--color-brand-text-secondary)] cursor-pointer select-none"
            >
              Port Active & Open for Charter Operations
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-brand-border)]">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={loading}>
              CANCEL
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="bg-orange-500 hover:bg-orange-600">
              {loading
                ? port
                  ? 'UPDATING...'
                  : 'CREATING...'
                : port
                ? 'UPDATE PORT'
                : 'REGISTER PORT'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
