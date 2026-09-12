import React, { useState, useEffect } from 'react';
import { estimateCost, getCostByCargoRequestId } from '../../../../api/cost';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import {
  DollarSign,
  Ship,
  Fuel,
  Anchor,
  Clock,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

export const Cost = ({
  cargoId,
  cargo,
  optimizationData,
  selectedVoyagePlanId,
  onComplete,
  setCostData,
}) => {
  const [loading, setLoading] = useState(false);
  const [cost, setCost] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');

  // Load existing cost if it already exists
  useEffect(() => {
    let mounted = true;

    const loadCost = async () => {
      try {
        const data = await getCostByCargoRequestId(cargoId);

        if (!mounted || !data) return;

        const breakdowns = Array.isArray(data) ? data : data.costBreakdowns || [data.costBreakdown || data];
        const latestCost = breakdowns[0];

        if (latestCost && latestCost.totalCost !== null && latestCost.totalCost !== undefined) {
          setCost(latestCost);
          setHistory(breakdowns.filter(Boolean));
          if (setCostData) setCostData(latestCost);
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
  }, [cargoId, setCostData]);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await estimateCost({
        cargoRequestId: cargoId,
        voyagePlanId: selectedVoyagePlanId,
      });

      const costDataObj = data?.costBreakdown || data;
      setCost(costDataObj);
      setHistory((previous) => [costDataObj, ...previous]);
      if (setCostData) setCostData(costDataObj);
    } catch (error) {
      console.error('Failed to generate cost estimate:', error);
      setError(
        error?.response?.data?.message ||
        error?.response?.data?.error?.message ||
        'Cost estimate could not be generated. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === '') return '$0.00';
    const number = Number(value);
    if (Number.isNaN(number)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(number);
  };

  const quantityMt = Number(cargo?.quantityMt || 55000);
  const costPerMt = cost && cost.totalCost ? Number(cost.totalCost) / quantityMt : 0;
  const vesselName = optimizationData?.voyagePlans?.[0]?.vessel?.name || optimizationData?.recommendedPlan?.[0]?.vesselName || 'PANAMAX BULK CARRIER';

  if (!cost) {
    return (
      <div className="space-y-6 text-slate-100">
        <div className="border-b border-[var(--color-brand-border-strong)] pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gov-saffron)]">
            Stage 05 · Financial Assessment
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-[var(--color-brand-text-primary)]">
            Voyage Cost Estimate
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-brand-text-primary)]">
            Review the expected financial commitment for the selected voyage, including freight, fuel, port charges, handling, and delay allowances.
          </p>
        </div>
        {/* OPTIMIZATION CONTEXT BANNER */}
        <div className="p-4 border-y border-[var(--color-brand-border-strong)] text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[var(--color-brand-text-secondary)]">
            <Ship className="w-4 h-4 text-[var(--color-status-info)]" />
            <span>Assigned Vessel: <strong className="text-[var(--color-brand-text-primary)]">{vesselName}</strong></span>
          </div>
          <div className="text-[var(--color-brand-text-secondary)]">
            Cargo Volume: <span className="text-[var(--color-status-success)] font-bold">{Number(quantityMt).toLocaleString()} MT</span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-10 border-y border-dashed border-[var(--color-brand-border-strong)]">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
            <DollarSign className="w-6 h-6 text-[var(--color-status-success)]" />
          </div>

          <div className="text-[var(--color-brand-text-primary)] font-bold mb-1 uppercase tracking-wider text-base">
            COMPUTE VOYAGE COST ESTIMATE & BREAKDOWN
          </div>

          <p className="text-sm text-center max-w-md text-[var(--color-brand-text-primary)] mb-6 leading-6">
            Calculates comprehensive voyage financial breakdown: freight outlay (forecast rate &times; volume), fuel consumption, port tariffs, handling charges, and demurrage contingencies.
          </p>

          <Button onClick={handleGenerate} disabled={loading} className="text-xs font-bold flex items-center gap-2">
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> COMPUTING VOYAGE COSTS...
              </>
            ) : (
              <>
                <DollarSign className="w-4 h-4" /> GENERATE COST ESTIMATE
              </>
            )}
          </Button>
          {error && (
            <div className="w-full max-w-md mt-4 p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-[var(--color-status-error)] text-xs">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-100">
      <div className="border-b border-[var(--color-brand-border-strong)] pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gov-saffron)]">
          Stage 05 · Financial Assessment
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-[var(--color-brand-text-primary)]">
          Voyage Cost Estimate
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-brand-text-primary)]">
          Review the expected financial commitment for the selected voyage, including freight, fuel, port charges, handling, and delay allowances.
        </p>
      </div>
      {/* CONNECT OPTIMIZATION → COST CONTEXT BANNER */}
      <div className="p-4 border-y border-[var(--color-brand-border-strong)] text-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-blue-500/10 text-[var(--color-status-info)] border-blue-500/30 text-[11px]">
            VOYAGE PLAN LINKED
          </Badge>
          <span className="text-[var(--color-brand-text-secondary)]">
            Vessel: <strong className="text-[var(--color-brand-text-primary)]">{vesselName}</strong> · Trips: <strong className="text-[var(--color-status-success)]">{optimizationData?.recommendedPlan?.length || optimizationData?.numberOfTrips || 1}</strong>
          </span>
        </div>

        <div className="text-[var(--color-brand-text-secondary)]">
          Freight Source: <strong className="text-[var(--color-gov-saffron)]">{cost.meta?.freightSource || 'FORECAST'}</strong>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-[var(--color-status-error)] text-xs">
          {error}
        </div>
      )}

      {cost.meta?.componentStatus && (
        <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-[var(--color-status-warning)] text-xs">
          Cost basis: Freight is calculated using the latest available forecast or market rate. Fuel, port, handling, delay, repositioning, and other charges are currently not included because approved calculation formulas are not configured.
        </div>
      )}

      {/* TOTAL ESTIMATED COST BANNER */}
      <div className="p-6 border-y-2 border-emerald-500/40 bg-emerald-500/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-[var(--color-status-success)] font-bold mb-1">
            TOTAL ESTIMATED VOYAGE COST
          </div>
          <div className="text-4xl font-black text-[var(--color-brand-text-primary)] tracking-wide">
            {formatCurrency(cost.totalCost)}
          </div>
          <div className="text-xs text-[var(--color-brand-text-secondary)] mt-1 flex items-center gap-2">
            <span>Unit Economics: <strong className="text-[var(--color-status-success)]">${costPerMt.toFixed(2)}</strong> / Metric Ton</span>
            <span>·</span>
            <span>Total Quantity: <strong className="text-[var(--color-brand-text-primary)]">{Number(quantityMt).toLocaleString()} MT</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleGenerate}
            disabled={loading}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            {loading ? 'RECALCULATING...' : 'RECALCULATE'}
          </Button>
        </div>
      </div>

      {/* ITEMIZED COST BREAKDOWN TILES */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* FREIGHT */}
        <div className="p-5 border-t border-[var(--color-brand-border-strong)] bg-[var(--color-brand-inset)] space-y-2">
          <div className="text-[11px] text-[var(--color-status-info)] uppercase tracking-widest font-bold flex items-center gap-1.5">
            <Ship className="w-3.5 h-3.5" /> Freight Outlay
          </div>
          <div className="text-2xl font-bold text-[var(--color-brand-text-primary)]">
            {formatCurrency(cost.freightCost)}
          </div>
          <div className="text-[11px] text-[var(--color-brand-text-secondary)]">
            {quantityMt.toLocaleString()} MT &times; ${cost.meta?.freightUnitRate ? cost.meta.freightUnitRate.toFixed(2) : costPerMt.toFixed(2)}/MT
          </div>
        </div>

        {/* FUEL */}
        <div className="p-5 border-t border-[var(--color-brand-border-strong)] bg-[var(--color-brand-inset)] space-y-2">
          <div className="text-[11px] text-[var(--color-status-warning)] uppercase tracking-widest font-bold flex items-center gap-1.5">
            <Fuel className="w-3.5 h-3.5" /> Bunker Fuel
          </div>
          <div className="text-2xl font-bold text-[var(--color-brand-text-primary)]">
            {formatCurrency(cost.fuelCost)}
          </div>
          <div className="text-[11px] text-[var(--color-brand-text-secondary)]">Included in charter / voyage terms</div>
        </div>

        {/* PORT TARIFFS */}
        <div className="p-5 border-t border-[var(--color-brand-border-strong)] bg-[var(--color-brand-inset)] space-y-2">
          <div className="text-[11px] text-[var(--color-status-success)] uppercase tracking-widest font-bold flex items-center gap-1.5">
            <Anchor className="w-3.5 h-3.5" /> Port Tariffs & Dues
          </div>
          <div className="text-2xl font-bold text-[var(--color-brand-text-primary)]">
            {formatCurrency(cost.portCost)}
          </div>
          <div className="text-[11px] text-[var(--color-brand-text-secondary)]">Berthage, pilotage & tugboat fees</div>
        </div>

        {/* HANDLING */}
        <div className="p-5 border-t border-[var(--color-brand-border-strong)] bg-[var(--color-brand-inset)] space-y-2">
          <div className="text-[11px] text-[var(--color-gov-navy)] uppercase tracking-widest font-bold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Terminal Handling
          </div>
          <div className="text-2xl font-bold text-[var(--color-brand-text-primary)]">
            {formatCurrency(cost.handlingCost)}
          </div>
          <div className="text-[11px] text-[var(--color-brand-text-secondary)]">Stevedoring & conveyor charges</div>
        </div>

        {/* DELAY & DEMURRAGE */}
        <div className="p-5 border-t border-[var(--color-brand-border-strong)] bg-[var(--color-brand-inset)] space-y-2">
          <div className="text-[11px] text-[var(--color-status-error)] uppercase tracking-widest font-bold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Delay / Demurrage Contingency
          </div>
          <div className="text-2xl font-bold text-[var(--color-brand-text-primary)]">
            {formatCurrency(cost.delayCost)}
          </div>
          <div className="text-[11px] text-[var(--color-brand-text-secondary)]">Port congestion buffer allowance</div>
        </div>

        {/* REPOSITIONING */}
        <div className="p-5 border-t border-[var(--color-brand-border-strong)] bg-[var(--color-brand-inset)] space-y-2">
          <div className="text-[11px] text-[var(--color-status-info)] uppercase tracking-widest font-bold flex items-center gap-1.5">
            <Ship className="w-3.5 h-3.5" /> Vessel Repositioning
          </div>
          <div className="text-2xl font-bold text-[var(--color-brand-text-primary)]">
            {formatCurrency(cost.repositioningCost)}
          </div>
          <div className="text-[11px] text-[var(--color-brand-text-secondary)]">Ballast voyage positioning</div>
        </div>

        {/* OTHER CHARGES */}
        <div className="p-5 border-t border-[var(--color-brand-border-strong)] bg-[var(--color-brand-inset)] space-y-2">
          <div className="text-[11px] text-[var(--color-brand-text-secondary)] uppercase tracking-widest font-bold flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5" /> Other Charges
          </div>
          <div className="text-2xl font-bold text-[var(--color-brand-text-primary)]">
            {formatCurrency(cost.otherCost)}
          </div>
          <div className="text-[11px] text-[var(--color-brand-text-secondary)]">Taxes, documentation & miscellaneous</div>
        </div>
      </div>

      {/* COST BREAKDOWN CHART */}
      <div className="p-5 border-y border-[var(--color-brand-border-strong)] bg-slate-100 space-y-4">
        <div className="text-xs uppercase tracking-widest text-[var(--color-brand-text-primary)] font-bold">COST BREAKDOWN</div>
        {[
          ['Freight', cost.freightCost, 'bg-blue-400'],
          ['Fuel', cost.fuelCost, 'bg-amber-400'],
          ['Port', cost.portCost, 'bg-emerald-400'],
          ['Handling', cost.handlingCost, 'bg-purple-400'],
          ['Delay', cost.delayCost, 'bg-red-400'],
          ['Repositioning', cost.repositioningCost, 'bg-cyan-400'],
          ['Other', cost.otherCost, 'bg-slate-400'],
        ].map(([label, value, color]) => {
          const amount = Number(value) || 0;
          const total = Number(cost.totalCost) || 1;
          return (
            <div key={label} className="grid grid-cols-[110px_1fr_100px] items-center gap-3 text-xs">
              <span className="text-[var(--color-brand-text-primary)]">{label}</span>
              <div className="h-2 rounded-full bg-[var(--color-brand-inset)] overflow-hidden">
                <div className={`h-full ${color}`} style={{ width: `${Math.min(100, (amount / total) * 100)}%` }} />
              </div>
              <span className="text-right text-[var(--color-brand-text-primary)]">{formatCurrency(amount)}</span>
            </div>
          );
        })}
      </div>

      {/* COST COMPARISON HISTORY */}
      {history.length > 1 && (
        <div className="p-5 border-y border-[var(--color-brand-border-strong)] bg-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-widest text-[var(--color-brand-text-primary)] font-bold">COST COMPARISON HISTORY</div>
            <span className="text-[11px] text-[var(--color-brand-text-secondary)]">{history.length} SAVED RUNS</span>
          </div>
          {history.map((run, index) => {
            const amount = Number(run.totalCost) || 0;
            const maxAmount = Math.max(...history.map((item) => Number(item.totalCost) || 0), 1);
            return (
              <div key={run.id || `${run.createdAt}-${index}`} className="grid grid-cols-[110px_1fr_120px] items-center gap-3 text-xs">
                <span className="text-[var(--color-brand-text-primary)]">{run.createdAt ? new Date(run.createdAt).toLocaleDateString() : `Run ${index + 1}`}</span>
                <div className="h-3 rounded-full bg-[var(--color-brand-inset)] overflow-hidden">
                  <div className="h-full bg-emerald-400" style={{ width: `${(amount / maxAmount) * 100}%` }} />
                </div>
                <span className="text-right font-bold text-[var(--color-brand-text-primary)]">{formatCurrency(amount)}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* CONTINUE TO RECOMMENDATION BUTTON */}
      <div className="flex justify-end pt-4 border-t border-[var(--color-brand-border)]">
        <Button onClick={() => onComplete(true)} className="flex items-center gap-2 text-xs font-bold">
          CONTINUE TO RECOMMENDATION <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};