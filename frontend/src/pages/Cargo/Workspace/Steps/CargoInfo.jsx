import React from 'react';

export const CargoInfo = ({ cargo, onComplete }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="text-xs text-[var(--color-brand-text-secondary)] uppercase">Cargo Type</div>
          <div className="font-bold">{cargo.cargoType}</div>
        </div>
        <div>
          <div className="text-xs text-[var(--color-brand-text-secondary)] uppercase">Quantity</div>
          <div className="font-bold">{cargo.quantityMt} MT</div>
        </div>
        <div>
          <div className="text-xs text-[var(--color-brand-text-secondary)] uppercase">Required Date</div>
          <div className="font-bold">{new Date(cargo.requiredDate).toLocaleDateString()}</div>
        </div>
        <div>
          <div className="text-xs text-[var(--color-brand-text-secondary)] uppercase">Contract Duration</div>
          <div className="font-bold">{cargo.contractDuration || 'N/A'}</div>
        </div>
      </div>
      <button
        onClick={onComplete}
        className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white hover:bg-white/15"
      >
        CONTINUE TO FORECAST
      </button>
    </div>
  );
};
