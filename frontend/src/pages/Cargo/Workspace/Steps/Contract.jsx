import React, { useState, useEffect } from 'react';
import {
  compareContracts,
  getContractByCargoRequestId,
} from '../../../../api/contract';
import { Button } from '../../../../components/ui/Button';

export const Contract = ({ cargoId, onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [contract, setContract] = useState(null);
  const [error, setError] = useState(null);

  // Load existing contract comparison ONCE when cargoId changes.
  useEffect(() => {
    if (!cargoId) return;

    let cancelled = false;

    const loadContract = async () => {
      try {
        setError(null);

        const data = await getContractByCargoRequestId(cargoId);

        console.log('Existing contract response:', data);

        if (!cancelled && data) {
          setContract(data);
        }
      } catch (err) {
        if (!cancelled) {
          console.log('No existing contract comparison found.');
        }
      }
    };

    loadContract();

    return () => {
      cancelled = true;
    };
  }, [cargoId]);

  // Generate / regenerate contract comparison.
  const handleGenerate = async () => {
    if (!cargoId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await compareContracts({
        cargoRequestId: cargoId,
      });

      console.log('Contract comparison response:', data);

      const result = data?.contractComparison || data;

      setContract(result);

      // Only complete the workflow after successful generation.
      onComplete(true);
    } catch (err) {
      console.error('Contract comparison failed:', err);

      setError(
        err?.response?.data?.message ||
        'Failed to compare contract strategies.'
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * NO CONTRACT DATA
   * ---------------------------------------------------------
   */
  if (!contract) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-dashed border-[var(--color-brand-border)] rounded">

        <div className="text-[var(--color-brand-text-secondary)] mb-4 uppercase text-sm tracking-wider">
          NO CONTRACT COMPARISON
        </div>

        <p className="text-sm text-center max-w-md text-[var(--color-brand-text-secondary)] mb-6">
          Compare spot, short-term, multiple-voyage and longer-term
          procurement strategies for this cargo request.
        </p>

        {error && (
          <div className="mb-5 p-3 w-full max-w-md rounded border border-[var(--color-status-error)]/40 bg-[var(--color-status-error)]/10 text-[var(--color-status-error)] text-sm">
            {error}
          </div>
        )}

        <Button
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? 'COMPARING...' : 'COMPARE STRATEGIES'}
        </Button>

      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * SAFE DATA EXTRACTION
   * ---------------------------------------------------------
   */

  const selectionStatus =
    contract.selection?.status ||
    'NOT_DETERMINED';

  const selectionReason =
    contract.selection?.reason ||
    'No strategy selection algorithm is currently documented.';

  const previousStrategy =
    contract.persistedRecommendationStrategy?.contractStrategy ||
    null;

  const strategies = Array.isArray(contract.strategies)
    ? contract.strategies
    : [];

  const referenceMetrics = contract.referenceMetrics || {};

  /*
   * ---------------------------------------------------------
   * MAIN CONTRACT COMPARISON UI
   * ---------------------------------------------------------
   */

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">

        <div>
          <div className="text-xs uppercase font-bold text-[var(--color-brand-text-secondary)]">
            CONTRACT COMPARISON
          </div>

          <div className="text-xl font-bold uppercase tracking-wider text-[var(--color-status-info)] mt-1">
            {selectionStatus}
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          {loading ? 'RECOMPARING...' : 'RECOMPARE'}
        </Button>

      </div>

      {/* ERROR */}
      {error && (
        <div className="p-3 rounded border border-[var(--color-status-error)]/40 bg-[var(--color-status-error)]/10 text-[var(--color-status-error)] text-sm">
          {error}
        </div>
      )}

      {/* SELECTION INFORMATION */}
      <div className="p-4 bg-[var(--color-brand-elevated)] border border-[var(--color-brand-border)] rounded">

        <div className="text-xs uppercase text-[var(--color-brand-text-secondary)] mb-2">
          STRATEGY SELECTION
        </div>

        <div className="text-sm text-[var(--color-brand-text-secondary)]">
          Strategy comparison is available, but the backend does not currently
          select a final winner.
        </div>

        <div className="mt-2 text-xs italic text-[var(--color-brand-text-secondary)]">
          {selectionReason}
        </div>

      </div>

      {/* PREVIOUS RECOMMENDATION */}
      {previousStrategy && (
        <div className="p-4 border border-[var(--color-brand-border)] rounded">

          <div className="text-xs uppercase text-[var(--color-brand-text-secondary)] mb-2">
            PREVIOUSLY RECOMMENDED STRATEGY
          </div>

          <div className="font-bold text-[var(--color-brand-text-primary)] uppercase">
            {String(previousStrategy).replace(/_/g, ' ')}
          </div>

        </div>
      )}

      {/* REFERENCE METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        <div className="p-4 border border-[var(--color-brand-border)] rounded">

          <div className="text-xs text-[var(--color-brand-text-secondary)] uppercase">
            Freight Unit Rate
          </div>

          <div className="font-bold mt-1">
            {contract.sufficiency?.freightUnitRate != null
              ? `$${Number(
                  contract.sufficiency.freightUnitRate
                ).toFixed(2)}`
              : 'N/A'}
          </div>

        </div>

        <div className="p-4 border border-[var(--color-brand-border)] rounded">

          <div className="text-xs text-[var(--color-brand-text-secondary)] uppercase">
            Indicative Freight Outlay
          </div>

          <div className="font-bold mt-1">
            {referenceMetrics.indicativeFreightOutlay != null
              ? `$${Number(
                  referenceMetrics.indicativeFreightOutlay
                ).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              : 'N/A'}
          </div>

        </div>

        <div className="p-4 border border-[var(--color-brand-border)] rounded">

          <div className="text-xs text-[var(--color-brand-text-secondary)] uppercase">
            Planned Trips
          </div>

          <div className="font-bold mt-1">
            {referenceMetrics.plannedTripCount ?? 'N/A'}
          </div>

        </div>

        <div className="p-4 border border-[var(--color-brand-border)] rounded">

          <div className="text-xs text-[var(--color-brand-text-secondary)] uppercase">
            Estimated Total Cost
          </div>

          <div className="font-bold mt-1">
            {referenceMetrics.latestEstimatedTotalCost != null
              ? `$${Number(
                  referenceMetrics.latestEstimatedTotalCost
                ).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              : 'N/A'}
          </div>

        </div>

      </div>

      {/* STRATEGIES */}
      <div className="space-y-4">

        {strategies.map((strategy) => {

          const strategyName =
            strategy?.strategy || 'UNKNOWN';

          const strategyStatus =
            strategy?.status || 'EVALUABLE';

          const strategyReason =
            strategy?.reason ||
            'No specific reasoning provided.';

          let statusColor =
            'var(--color-brand-text-secondary)';

          if (strategyStatus === 'FAVORABLE') {
            statusColor =
              'var(--color-status-success)';
          }

          if (strategyStatus === 'UNFAVORABLE') {
            statusColor =
              'var(--color-status-error)';
          }

          return (
            <div
              key={strategyName}
              className="p-4 border border-[var(--color-brand-border)] rounded hover:border-[var(--color-status-info)] transition-colors"
            >

              <div className="flex justify-between items-start mb-2">

                <div className="font-bold uppercase">
                  {strategyName.replace(/_/g, ' ')}
                </div>

                <div
                  className="text-sm font-bold uppercase"
                  style={{ color: statusColor }}
                >
                  {strategyStatus}
                </div>

              </div>

              <div className="text-sm text-[var(--color-brand-text-secondary)]">
                {strategyReason}
              </div>

            </div>
          );
        })}

      </div>

      {/* DISCLAIMER */}
      <div className="text-xs text-[var(--color-brand-text-secondary)] italic mt-6 border-t border-[var(--color-brand-border)] pt-4">
        {contract.disclaimer ||
          'Compare spot, short-term, multiple-voyage and longer-term options only when sufficient data exists.'}
      </div>

      {/* WORKFLOW COMPLETE */}
      <div className="flex justify-end pt-4">

        <Button onClick={() => onComplete(true)}>
          COMPLETE WORKFLOW
        </Button>

      </div>

    </div>
  );
};