import React, { useState } from 'react';
import { createCargo } from '../../../api/cargo';
import { Button } from '../../../components/ui/Button';

export const NewCargoDialog = ({ isOpen, onClose, ports, onSuccess }) => {
  const [formData, setFormData] = useState({
    cargoType: '',
    quantityMt: '',
    originPortId: '',
    destinationPortId: '',
    requiredDate: '',
    contractDuration: 'SPOT'
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await createCargo({
        ...formData,
        quantityMt: Number(formData.quantityMt)
      });
      onSuccess(result.id);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1b23] border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold uppercase tracking-wider mb-6 text-white">New Cargo Request</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] block mb-1">Cargo Type</label>
            <input 
              required
              className="w-full bg-black/30 border border-white/5 p-3 rounded-xl text-sm text-white focus:outline-none focus:border-white/20 transition-colors"
              value={formData.cargoType}
              onChange={e => setFormData({...formData, cargoType: e.target.value})}
              placeholder="e.g. IRON ORE"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] block mb-1">Quantity (MT)</label>
            <input 
              type="number"
              required
              className="w-full bg-black/30 border border-white/5 p-3 rounded-xl text-sm text-white focus:outline-none focus:border-white/20 transition-colors"
              value={formData.quantityMt}
              onChange={e => setFormData({...formData, quantityMt: e.target.value})}
              placeholder="e.g. 55000"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] block mb-1">Origin Port</label>
              <select 
                required
                className="w-full bg-black/30 border border-white/5 p-3 rounded-xl text-sm text-white focus:outline-none focus:border-white/20 transition-colors"
                value={formData.originPortId}
                onChange={e => setFormData({...formData, originPortId: e.target.value})}
              >
                <option value="">Select...</option>
                {ports.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] block mb-1">Destination Port</label>
              <select 
                required
                className="w-full bg-black/30 border border-white/5 p-3 rounded-xl text-sm text-white focus:outline-none focus:border-white/20 transition-colors"
                value={formData.destinationPortId}
                onChange={e => setFormData({...formData, destinationPortId: e.target.value})}
              >
                <option value="">Select...</option>
                {ports.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] block mb-1">Required Date</label>
            <input 
              type="date"
              required
              className="w-full bg-black/30 border border-white/5 p-3 rounded-xl text-sm text-white focus:outline-none focus:border-white/20 transition-colors"
              value={formData.requiredDate}
              onChange={e => setFormData({...formData, requiredDate: e.target.value})}
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>CANCEL</Button>
            <Button type="submit" disabled={loading}>{loading ? 'CREATING...' : 'CREATE CARGO'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
