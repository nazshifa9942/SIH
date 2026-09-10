import React, { useState, useEffect } from 'react';
import {
  compareContracts,
  getContractByCargoRequestId,
} from '../../../../api/contract';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import {
  FileText,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  DollarSign,
  CheckCircle2,
  Clock,
  Layers,
  Scale,
  RefreshCw,
  Info,
} from 'lucide-react';

export const Contract = ({
  cargoId,
  cargo,
  recommendationData,
  costData,
  forecastData,
  onComplete,
  setContractData,
}) => {
  const [loading, setLoading] = useState(false);
  const [contract, setContract] = useState(null);
  const [error, setError] = useState(null);
  const [selectedStrategy, setSelectedStrategy] = useState(null);

  // Load existing contract comparison ONCE when cargoId changes.
  useEffect(() => {
    if (!cargoId) return;

    let cancelled = false;

    const loadContract = async () => {
      try {
        setError(null);
        const data = await getContractByCargoRequestId(cargoId);

        if (!cancelled && data) {
          setContract(data);
          if (setContractData) setContractData(data);
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
  }, [cargoId, setContractData]);

  // Generate / regenerate contract comparison.
  const handleGenerate = async () => {
    if (!cargoId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await compareContracts({
        cargoRequestId: cargoId,
      });

      const result = data?.contractComparison || data;
      setContract(result);
      if (setContractData) setContractData(result);
    } catch (err) {
      console.error('Contract comparison failed:', err);
      setError(
        err?.response?.data?.message || 'Failed to compare contract strategies.'
      );
    } finally {
      setLoading(false);
    }
  };

  const STRATEGY_DETAILS = {
    SPOT: {
      label: 'Spot Single Voyage',
      description: 'Charter vessel on the open market for a single one-way transit. Maximum flexibility, high exposure to spot freight fluctuations.',
      rateFlexibility: 'High (Immediate Market Rate)',
      riskMitigation: 'Low (Exposed to Volatility)',
      bestFor: 'Urgent shipments or when freight rates are trending downward (WAIT).',
    },
    SHORT_TERM: {
      label: 'Short-Term Time Charter',
      description: 'Charter vessel for a short fixed duration (1-3 months). Balances rate stability with moderate operational commitments.',
      rateFlexibility: 'Moderate (Fixed Period Rate)',
      riskMitigation: 'Medium (Shields against near-term spikes)',
      bestFor: 'Multitrip programs with 2-3 scheduled shipments over 60 days.',
    },
    MULTIPLE_VOYAGE: {
      label: 'Multiple Voyage Contract (COA)',
      description: 'Contract of Affreightment agreed for a specific aggregate tonnage across several consecutive voyages over 3-6 months.',
      rateFlexibility: 'Fixed Freight per Lift',
      riskMitigation: 'High (Guaranteed vessel slots & fixed rate)',
      bestFor: 'High-volume cargo procurement (100,000+ MT) locking in volume discounts.',
    },
    LONGER_TERM: {
      label: 'Long-Term Period Charter',
      description: 'Fixed charter commitment for 6-12 months. Maximizes fleet control and rate predictability for sustained supply chains.',
      rateFlexibility: 'Long-Term Locked Rate',
      riskMitigation: 'Maximum (Full insulation from market surges)',
      bestFor: 'Base-load strategic raw material feeds with predictable monthly demand.',
    },
  };

  if (!contract) {
    return (
      <div className="space-y-6 text-slate-100">
        <div className="border-b border-[var(--color-brand-border-strong)] pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gov-saffron)]">
            Stage 07 · Contract Strategy
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-[var(--color-brand-text-primary)]">
            Procurement Contract Review
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-brand-text-primary)]">
            Compare contract structures against the recommendation, freight benchmark, and expected voyage requirements before completing the workflow.
          </p>
        </div>
        {/* RECOMMENDATION CONTEXT BANNER */}
        {recommendationData && (
          <div className="p-4 border-y border-[var(--color-brand-border-strong)] text-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[var(--color-brand-text-secondary)]">
              <Sparkles className="w-4 h-4 text-[var(--color-gov-navy)]" />
              <span>Recommended Action: <strong className="text-[var(--color-brand-text-primary)]">{recommendationData.recommendedAction}</strong></span>
            </div>
            <div className="text-[var(--color-brand-text-secondary)]">
              Contract Mode: <span className="text-[var(--color-status-info)] font-bold">{recommendationData.contractStrategy || 'SPOT'}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center justify-center p-10 border-y border-dashed border-[var(--color-brand-border-strong)]">
          <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-[var(--color-status-info)]" />
          </div>

          <div className="text-[var(--color-brand-text-primary)] font-bold mb-1 uppercase tracking-wider text-base">
            COMPARE PROCUREMENT CONTRACT STRATEGIES
          </div>

          <p className="text-sm text-center max-w-md text-[var(--color-brand-text-secondary)] mb-6">
            Compare Spot, Short-Term, Multiple-Voyage (COA), and Long-Term period charter structures based on rate trajectory, cost benchmarks, and market exposure.
          </p>

          {error && (
            <div className="mb-5 p-3 w-full max-w-md rounded-xl border border-red-500/20 bg-red-500/10 text-[var(--color-status-error)] text-xs">
              {error}
            </div>
          )}

          <Button onClick={handleGenerate} disabled={loading} className="text-xs font-bold flex items-center gap-2">
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> EVALUATING STRATEGIES...
              </>
            ) : (
              <>
                <Scale className="w-4 h-4" /> COMPARE PROCUREMENT STRATEGIES
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  const selectionStatus = contract.selection?.status || 'EVALUATION_READY';
  const persistedStrategy =
    contract.persistedRecommendationStrategy?.contractStrategy ||
    recommendationData?.contractStrategy ||
    cargo?.contractDuration ||
    'SPOT';
  const activeStrategy = selectedStrategy || contract.selection?.strategy || persistedStrategy;

  const strategies = Array.isArray(contract.strategies) ? contract.strategies : [];
  const referenceMetrics = contract.referenceMetrics || {};

  return (
    <div className="space-y-6 text-slate-100">
      <div className="border-b border-[var(--color-brand-border-strong)] pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gov-saffron)]">
          Stage 07 · Contract Strategy
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-[var(--color-brand-text-primary)]">
          Procurement Contract Review
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-brand-text-primary)]">
          Compare contract structures against the recommendation, freight benchmark, and expected voyage requirements before completing the workflow.
        </p>
      </div>
      {/* CONNECT RECOMMENDATION → CONTRACT CONTEXT BANNER */}
      <div className="p-4 border-y border-[var(--color-brand-border-strong)] text-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-purple-500/10 text-[var(--color-gov-navy)] border-purple-500/30 text-[11px]">
            RECOMMENDATION DIRECTIVE
          </Badge>
          <span className="text-[var(--color-brand-text-secondary)]">
            Directive: <strong className="text-[var(--color-brand-text-primary)]">{recommendationData?.recommendedAction || 'EVALUATE'}</strong> · Strategy: <strong className="text-[var(--color-status-info)]">{persistedStrategy}</strong>
          </span>
        </div>

        <div className="text-[var(--color-brand-text-secondary)]">
          Sufficiency: <strong className="text-[var(--color-status-success)]">{contract.sufficiency?.status || 'SUFFICIENT_DATA'}</strong>
        </div>
      </div>

      {/* HEADER WITH RECOMPARE */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest font-bold text-[var(--color-brand-text-secondary)]">
            CONTRACT STRATEGY EVALUATION MATRIX
          </div>
          <h2 className="text-xl font-bold text-[var(--color-brand-text-primary)] tracking-wide mt-0.5">
            4-Pillar Procurement Structure Analysis
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleGenerate}
            disabled={loading}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            {loading ? 'RECOMPARING...' : 'RECOMPARE STRATEGIES'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-[var(--color-status-error)] text-xs">
          {error}
        </div>
      )}

      {/* REFERENCE METRICS TILES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 border-t border-[var(--color-brand-border-strong)] bg-[var(--color-brand-inset)] space-y-1">
          <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-primary)]">Freight Benchmark Rate</div>
          <div className="text-xl font-bold text-[var(--color-brand-text-primary)]">
            {contract.sufficiency?.freightUnitRate != null
              ? `$${Number(contract.sufficiency.freightUnitRate).toFixed(2)}`
              : 'N/A'}
            <span className="text-xs text-[var(--color-brand-text-secondary)] font-normal"> / MT</span>
          </div>
        </div>

        <div className="p-4 border-t border-[var(--color-brand-border-strong)] bg-[var(--color-brand-inset)] space-y-1">
          <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-primary)]">Indicative Freight Outlay</div>
          <div className="text-xl font-bold text-[var(--color-status-success)]">
            {referenceMetrics.indicativeFreightOutlay != null
              ? `$${Number(referenceMetrics.indicativeFreightOutlay).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              : 'N/A'}
          </div>
        </div>

        <div className="p-4 border-t border-[var(--color-brand-border-strong)] bg-[var(--color-brand-inset)] space-y-1">
          <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-primary)]">Planned Voyage Trips</div>
          <div className="text-xl font-bold text-[var(--color-brand-text-primary)]">
            {referenceMetrics.plannedTripCount ?? 'N/A'}{referenceMetrics.plannedTripCount != null ? ' Trips' : ''}
          </div>
        </div>

        <div className="p-4 border-t border-[var(--color-brand-border-strong)] bg-[var(--color-brand-inset)] space-y-1">
          <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-primary)]">Latest Estimated Cost</div>
          <div className="text-xl font-bold text-[var(--color-status-success)]">
            {referenceMetrics.latestEstimatedTotalCost != null
              ? `$${Number(referenceMetrics.latestEstimatedTotalCost).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              : 'N/A'}
          </div>
        </div>
      </div>

      {/* STRATEGIES COMPARATIVE MATRIX TILES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {strategies.map((stratItem) => {
          const key = stratItem?.strategy || 'SPOT';
          const isPersisted = key.toUpperCase() === persistedStrategy.toUpperCase();
          const info = STRATEGY_DETAILS[key] || {
            label: key,
            description: 'Custom contract framework.',
            rateFlexibility: 'Standard',
            riskMitigation: 'Standard',
            bestFor: 'General cargo procurement.',
          };
          return (
            <button
              type="button"
              onClick={() => {
                setSelectedStrategy(key);
                if (setContractData) {
                  setContractData({
                    ...contract,
                    selection: { status: 'USER_SELECTED', strategy: key },
                  });
                }
              }}
              key={key}
              className={`p-5 border-t-2 transition-all space-y-3 ${
                activeStrategy.toUpperCase() === key.toUpperCase()
                  ? 'border-blue-500/50 bg-blue-500/10 shadow-lg'
                  : 'border-[var(--color-brand-border-strong)] bg-slate-100 hover:border-[var(--color-brand-border)]/30'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[var(--color-brand-text-primary)] uppercase">{info.label}</h3>
                    {isPersisted && (
                      <Badge className="bg-blue-100 text-[var(--color-status-info)] border-blue-500/30 text-[11px]">
                        RECOMMENDED
                      </Badge>
                    )}
                  </div>
                  <div className="text-[11px] text-[var(--color-brand-text-secondary)] mt-0.5">{key}</div>
                </div>

                <Badge variant="outline" className="text-[11px] bg-emerald-500/10 text-[var(--color-status-success)] border-emerald-500/30">
                  {stratItem.status || 'EVALUABLE'}
                </Badge>
              </div>

              <p className="text-xs text-[var(--color-brand-text-secondary)] font-sans leading-relaxed">
                {info.description}
              </p>

              <div className="pt-2 border-t border-[var(--color-brand-border)] space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--color-brand-text-primary)] text-[11px]">Rate Mechanism:</span>
                  <span className="text-[var(--color-brand-text-primary)] font-bold text-[11px]">{info.rateFlexibility}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-brand-text-primary)] text-[11px]">Risk Mitigation:</span>
                  <span className="text-[var(--color-status-success)] font-bold text-[11px]">{info.riskMitigation}</span>
                </div>
                <div className="pt-1 text-[11px] text-[var(--color-brand-text-primary)]">
                  <strong className="text-[var(--color-gov-saffron)]">Suitability:</strong> {info.bestFor}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* DISCLAIMER */}
      <div className="text-xs text-[var(--color-brand-text-secondary)] italic border-t border-[var(--color-brand-border)] pt-4">
        {contract.disclaimer || 'Compare spot, short-term, multiple-voyage and longer-term options only when sufficient data exists.'}
      </div>

      {/* COMPLETE WORKFLOW ACTION */}
      <div className="flex justify-end pt-4 border-t border-[var(--color-brand-border)]">
        <Button onClick={() => onComplete(true)} className="flex items-center gap-2 text-xs font-bold bg-orange-600 hover:bg-orange-500 text-[var(--color-brand-text-primary)]">
          COMPLETE WORKFLOW & VIEW REPORTS <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};