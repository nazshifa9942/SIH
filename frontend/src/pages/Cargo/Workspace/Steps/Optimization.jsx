import React, { useState } from 'react';
import { optimizeVesselPlan } from '../../../../api/optimization';
import { Button } from '../../../../components/ui/Button';

export const Optimization = ({ cargoId, onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);

    try {
      const data = await optimizeVesselPlan({
        cargoRequestId: cargoId,
      });

      console.log('Optimization response:', data);

      // Show the generated plan on this page
      setPlan(data);

      // DO NOT call onComplete here.
      // The user will click CONTINUE TO RECOMMENDATION.
    } catch (error) {
      console.error('Optimization failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Before generating the plan
  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-dashed border-[var(--color-brand-border)] rounded">
        <div className="text-[var(--color-brand-text-secondary)] mb-4 uppercase text-sm tracking-wider">
          NO VESSEL PLAN AVAILABLE
        </div>

        <p className="text-sm text-center max-w-md text-[var(--color-brand-text-secondary)] mb-6">
          Generate an optimized vessel plan for this cargo request.
        </p>

        <Button onClick={handleGenerate} disabled={loading}>
          {loading ? 'GENERATING PLAN...' : 'GENERATE VESSEL PLAN'}
        </Button>
      </div>
    );
  }

  // Get first vessel/trip if available
  const firstVoyage = plan.voyagePlans?.[0];
  const firstRecommended = plan.recommendedPlan?.[0];

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">
          SELECTED VESSEL
        </h3>

        <Button
          onClick={handleGenerate}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          {loading ? 'REGENERATING...' : 'REGENERATE PLAN'}
        </Button>
      </div>

      {/* VESSEL PLAN */}
      <div className="p-4 border border-[var(--color-status-info)]/30 bg-[var(--color-status-info)]/10 rounded-lg">

        <div className="grid grid-cols-2 gap-4">

          {/* VESSEL INFORMATION */}
          <div>
            <div className="text-xl font-bold text-[var(--color-status-info)]">
              {firstVoyage?.vessel?.name ||
                firstRecommended?.vesselName ||
                'VESSEL PLAN GENERATED'}
            </div>

            <div className="text-sm text-[var(--color-brand-text-secondary)] mt-1">
              {firstVoyage?.plannedQuantityMt
                ? `${firstVoyage.plannedQuantityMt} MT`
                : 'Vessel allocation available'}
            </div>
          </div>

          {/* STATUS */}
          <div className="text-right">

            <span className="bg-[var(--color-status-success)]/20 text-[var(--color-status-success)] px-2 py-1 rounded text-xs uppercase font-bold">
              {plan.feasible ? 'FEASIBLE' : 'INFEASIBLE'}
            </span>

            <div className="text-sm font-bold mt-2">
              {plan.numberOfTrips || 0} TRIPS
            </div>

          </div>

        </div>

      </div>

      {/* ESTIMATED COST */}
      {plan.totalEstimatedCost !== undefined && (
        <div className="p-4 border border-[var(--color-brand-border)] rounded-lg">

          <div className="text-xs uppercase text-[var(--color-brand-text-secondary)]">
            ESTIMATED TOTAL COST
          </div>

          <div className="text-xl font-bold mt-1">
            ${Number(plan.totalEstimatedCost).toLocaleString()}
          </div>

        </div>
      )}

      {/* RECOMMENDED PLAN DETAILS */}
      {plan.recommendedPlan && plan.recommendedPlan.length > 0 && (
        <div className="p-4 border border-[var(--color-brand-border)] rounded-lg">

          <div className="text-xs uppercase text-[var(--color-brand-text-secondary)] mb-3">
            RECOMMENDED VOYAGE PLAN
          </div>

          <div className="space-y-2">

            {plan.recommendedPlan.map((trip, index) => (
              <div
                key={index}
                className="flex justify-between items-center text-sm"
              >
                <span>
                  TRIP {trip.tripNumber || index + 1}
                </span>

                <span className="font-bold">
                  {trip.quantityMT || 0} MT
                </span>
              </div>
            ))}

          </div>

        </div>
      )}

      {/* CONTINUE BUTTON */}
      <div className="flex justify-end pt-4">
        <Button onClick={() => onComplete(true)}>
          CONTINUE TO RECOMMENDATION
        </Button>
      </div>

    </div>
  );
};