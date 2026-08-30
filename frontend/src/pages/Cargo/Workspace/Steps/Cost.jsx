import React, { useState, useEffect } from 'react';
import {
  estimateCost,
  getCostByCargoRequestId,
} from '../../../../api/cost';
import { Button } from '../../../../components/ui/Button';

export const Cost = ({ cargoId, onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [cost, setCost] = useState(null);

  // Load existing cost if it already exists
  useEffect(() => {
  let mounted = true;

  const loadCost = async () => {
    try {
      const data = await getCostByCargoRequestId(cargoId);

      console.log('Existing cost response:', data);

      if (!mounted || !data) {
        return;
      }

      // GET /cost/:cargoRequestId returns an array.
      // The newest breakdown is first because backend orders by createdAt DESC.
      const latestCost = Array.isArray(data)
        ? data[0]
        : data.costBreakdown || data;

      // Only display it if it actually contains numerical cost data.
      if (latestCost && latestCost.totalCost !== null && latestCost.totalCost !== undefined) {
        setCost(latestCost);
      }
    } catch (error) {
      console.error('Failed to load existing cost:', error);
    }
  };

  if (cargoId) {
    loadCost();
  }

  return () => {
    mounted = false;
  };
}, [cargoId]);

  const handleGenerate = async () => {
    setLoading(true);

    try {
      const data = await estimateCost({
        cargoRequestId: cargoId,
      });

      console.log('Cost response:', data);

      const costData = data?.costBreakdown || data;

      setCost(costData);

      // IMPORTANT:
      // Do NOT call onComplete here.
      // The result should remain visible on the Cost page.
    } catch (error) {
      console.error('Failed to generate cost estimate:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (onComplete) {
      onComplete(true);
    }
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === '') {
      return 'N/A';
    }

    const number = Number(value);

    if (Number.isNaN(number)) {
      return 'N/A';
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(number);
  };

  // ---------------------------------------------------------
  // NO COST YET
  // ---------------------------------------------------------

  if (!cost) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-dashed border-[var(--color-brand-border)] rounded">
        <div className="text-[var(--color-brand-text-secondary)] mb-4 uppercase text-sm tracking-wider">
          NO COST BREAKDOWN AVAILABLE
        </div>

        <p className="text-sm text-center max-w-md text-[var(--color-brand-text-secondary)] mb-6">
          Generate a cost estimate for this cargo request.
        </p>

        <Button
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading
            ? 'CALCULATING COST...'
            : 'GENERATE COST ESTIMATE'}
        </Button>
      </div>
    );
  }

  // ---------------------------------------------------------
  // COST RESULT
  // ---------------------------------------------------------

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="text-xs uppercase font-bold text-[var(--color-brand-text-secondary)]">
            TOTAL ESTIMATED COST
          </div>

          <div className="text-3xl font-bold mt-1">
            {formatCurrency(cost.totalCost)}
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          {loading
            ? 'RECALCULATING...'
            : 'RECALCULATE'}
        </Button>
      </div>

      {/* COST BREAKDOWN */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

        {/* FREIGHT */}
        <div className="p-4 border border-[var(--color-brand-border)] rounded bg-[var(--color-brand-elevated)]">
          <div className="text-xs text-[var(--color-brand-text-secondary)] uppercase">
            Freight Cost
          </div>

          <div className="font-mono mt-2 text-lg">
            {formatCurrency(cost.freightCost)}
          </div>
        </div>

        {/* FUEL */}
        <div className="p-4 border border-[var(--color-brand-border)] rounded bg-[var(--color-brand-elevated)]">
          <div className="text-xs text-[var(--color-brand-text-secondary)] uppercase">
            Fuel Cost
          </div>

          <div className="font-mono mt-2 text-lg">
            {formatCurrency(cost.fuelCost)}
          </div>
        </div>

        {/* PORT */}
        <div className="p-4 border border-[var(--color-brand-border)] rounded bg-[var(--color-brand-elevated)]">
          <div className="text-xs text-[var(--color-brand-text-secondary)] uppercase">
            Port Cost
          </div>

          <div className="font-mono mt-2 text-lg">
            {formatCurrency(cost.portCost)}
          </div>
        </div>

        {/* HANDLING */}
        <div className="p-4 border border-[var(--color-brand-border)] rounded bg-[var(--color-brand-elevated)]">
          <div className="text-xs text-[var(--color-brand-text-secondary)] uppercase">
            Handling Cost
          </div>

          <div className="font-mono mt-2 text-lg">
            {formatCurrency(cost.handlingCost)}
          </div>
        </div>

        {/* DELAY */}
        <div className="p-4 border border-[var(--color-brand-border)] rounded bg-[var(--color-brand-elevated)]">
          <div className="text-xs text-[var(--color-brand-text-secondary)] uppercase">
            Delay Cost
          </div>

          <div className="font-mono mt-2 text-lg">
            {formatCurrency(cost.delayCost)}
          </div>
        </div>

        {/* REPOSITIONING */}
        <div className="p-4 border border-[var(--color-brand-border)] rounded bg-[var(--color-brand-elevated)]">
          <div className="text-xs text-[var(--color-brand-text-secondary)] uppercase">
            Repositioning Cost
          </div>

          <div className="font-mono mt-2 text-lg">
            {formatCurrency(cost.repositioningCost)}
          </div>
        </div>

      </div>

      {/* CONTINUE BUTTON */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={handleContinue}
        >
          CONTINUE TO RISK
        </Button>
      </div>

    </div>
  );
};