import React, { useEffect, useState } from 'react';
import { createCargo, updateCargo } from '../../../api/cargo';
import { Button } from '../../../components/ui/Button';
import { formatDateISO } from '../../../utils/dateUtils';

export const NewCargoDialog = ({
  isOpen,
  onClose,
  ports,
  portsError,
  onRetryPorts,
  onSuccess,
  cargo
}) => {
  const [formData, setFormData] = useState({
    cargoType: cargo?.cargoType || '',
    quantityMt: cargo?.quantityMt || '',
    originPortId: cargo?.originPortId || '',
    destinationPortId: cargo?.destinationPortId || '',
    requiredDate: formatDateISO(cargo?.requiredDate),
    contractDuration: cargo?.contractDuration || 'SPOT'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData({
        cargoType: cargo?.cargoType || '',
        quantityMt: cargo?.quantityMt || '',
        originPortId: cargo?.originPortId || '',
        destinationPortId: cargo?.destinationPortId || '',
        requiredDate: formatDateISO(cargo?.requiredDate),
        contractDuration: cargo?.contractDuration || 'SPOT'
      });

      setError('');
    }
  }, [isOpen, cargo]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));

    setError('');
  };

  const validateForm = () => {
    const cargoType = formData.cargoType.trim();
    const quantity = Number(formData.quantityMt);

    if (!cargoType) {
      return 'Cargo type is required.';
    }

    if (!formData.quantityMt) {
      return 'Quantity is required.';
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return 'Quantity must be greater than 0.';
    }

    if (!formData.originPortId) {
      return 'Please select an origin port.';
    }

    if (!formData.destinationPortId) {
      return 'Please select a destination port.';
    }

    if (formData.originPortId === formData.destinationPortId) {
      return 'Origin and destination ports must be different.';
    }

    if (!formData.requiredDate) {
      return 'Required date is required.';
    }

    const selectedDate = new Date(`${formData.requiredDate}T00:00:00`);
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    if (isNaN(selectedDate.getTime()) || selectedDate < today) {
      return 'Required date cannot be in the past.';
    }

    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const data = {
        ...formData,
        cargoType: formData.cargoType.trim(),
        quantityMt: Number(formData.quantityMt)
      };

      const result = cargo
        ? await updateCargo(cargo.id, data)
        : await createCargo(data);

      onSuccess(result.id);
    } catch (error) {
      console.error('Cargo request failed:', error);

      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error?.message ||
        error?.response?.data?.errors?.[0]?.message ||
        (typeof error?.response?.data?.error === 'string' ? error.response.data.error : null);

      setError(
        backendMessage ||
        (cargo
          ? 'Failed to update cargo request.'
          : 'Failed to create cargo request. Please check your details and try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0b2545]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-slate-300 p-6 md:p-8 rounded-md w-full max-w-md shadow-2xl">

        <div className="border-b-2 border-[var(--color-brand-border)] pb-4 mb-6">
          <div className="text-[11px] uppercase tracking-widest text-slate-500 font-bold">Maritime Cargo Registry</div>
          <h2 className="text-xl font-bold uppercase tracking-wide mt-1 text-[var(--color-gov-navy)]">
            {cargo ? 'Edit Cargo Request' : 'New Cargo Request'}
          </h2>
        </div>

        {error && (
          <div className="mb-5 border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-800">
              {error}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Cargo Type */}
          <div>
            <label className="text-[11px] uppercase tracking-widest text-slate-700 font-bold block mb-1.5">
              Cargo Type
            </label>

            <input
              required
              className="w-full bg-white border border-slate-300 p-3 rounded-md text-sm text-slate-900 focus:outline-none focus:border-[var(--color-brand-border)] transition-colors"
              value={formData.cargoType}
              onChange={(e) =>
                handleChange('cargoType', e.target.value)
              }
              placeholder="e.g. IRON ORE"
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="text-[11px] uppercase tracking-widest text-slate-700 font-bold block mb-1.5">
              Quantity (MT)
            </label>

            <input
              type="number"
              min="1"
              required
              className="w-full bg-white border border-slate-300 p-3 rounded-md text-sm text-slate-900 focus:outline-none focus:border-[var(--color-brand-border)] transition-colors"
              value={formData.quantityMt}
              onChange={(e) =>
                handleChange('quantityMt', e.target.value)
              }
              placeholder="e.g. 55000"
            />
          </div>

          {/* Ports */}
          <div className="grid grid-cols-2 gap-4">

            {/* Origin */}
            <div>
              <label className="text-[11px] uppercase tracking-widest text-slate-700 font-bold block mb-1.5">
                Origin Port
              </label>

              <select
                required
                className="w-full bg-white border border-slate-300 p-3 rounded-md text-sm text-slate-900 focus:outline-none focus:border-[var(--color-brand-border)] transition-colors"
                value={formData.originPortId}
                onChange={(e) =>
                  handleChange('originPortId', e.target.value)
                }
              >
                <option value="">Select...</option>

                {ports.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Destination */}
            <div>
              <label className="text-[11px] uppercase tracking-widest text-slate-700 font-bold block mb-1.5">
                Destination Port
              </label>

              <select
                required
                className="w-full bg-white border border-slate-300 p-3 rounded-md text-sm text-slate-900 focus:outline-none focus:border-[var(--color-brand-border)] transition-colors"
                value={formData.destinationPortId}
                onChange={(e) =>
                  handleChange('destinationPortId', e.target.value)
                }
              >
                <option value="">Select...</option>

                {ports.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {portsError && (
            <div className="border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm text-amber-900">{portsError}</p>
              <button
                type="button"
                onClick={onRetryPorts}
                className="mt-2 text-xs font-bold uppercase tracking-wider text-[var(--color-gov-navy)] underline"
              >
                Retry loading ports
              </button>
            </div>
          )}

          {/* Required Date */}
          <div>
            <label className="text-[11px] uppercase tracking-widest text-slate-700 font-bold block mb-1.5">
              Required Date
            </label>

            <input
              type="date"
              required
              min={new Date().toISOString().split('T')[0]}
              className="w-full bg-white border border-slate-300 p-3 rounded-md text-sm text-slate-900 focus:outline-none focus:border-[var(--color-brand-border)] transition-colors"
              value={formData.requiredDate}
              onChange={(e) =>
                handleChange('requiredDate', e.target.value)
              }
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">

            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={loading}
            >
              CANCEL
            </Button>

            <Button
              type="submit"
              disabled={loading}
            >
              {loading
                ? cargo
                  ? 'UPDATING...'
                  : 'CREATING...'
                : cargo
                  ? 'UPDATE CARGO'
                  : 'CREATE CARGO'}
            </Button>

          </div>

        </form>
      </div>
    </div>
  );
};