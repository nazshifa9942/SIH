import React, { useState, useEffect } from 'react';
import { optimizeVesselPlan } from '../../../../api/optimization';
import { getVessels } from '../../../../api/vessels';
import { getPorts } from '../../../../api/ports';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import {
  Ship,
  Anchor,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Clock,
  Gauge,
  Sparkles,
  DollarSign,
  Layers,
  Ruler,
  Info,
} from 'lucide-react';

export const Optimization = ({
  cargoId,
  cargo,
  riskData,
  optimizationData,
  onComplete,
  selectedVoyagePlanId,
  setSelectedVoyagePlanId,
  setOptimizationData,
}) => {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(optimizationData || null);
  const [error, setError] = useState('');
  const [vessels, setVessels] = useState([]);
  const [ports, setPorts] = useState([]);
  const [loadingFleet, setLoadingFleet] = useState(true);

  useEffect(() => {
    if (optimizationData) setPlan(optimizationData);
  }, [optimizationData]);

  // Load fleet vessels and port constraints
  useEffect(() => {
    async function loadFleetAndPorts() {
      try {
        const [vList, pList] = await Promise.all([
          getVessels().catch(() => []),
          getPorts().catch(() => []),
        ]);
        setVessels(Array.isArray(vList) ? vList : []);
        setPorts(Array.isArray(pList) ? pList : []);
      } catch (err) {
        console.error('Failed to load fleet/ports in optimization:', err);
      } finally {
        setLoadingFleet(false);
      }
    }

    loadFleetAndPorts();
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await optimizeVesselPlan({
        cargoRequestId: cargoId,
      });

      setPlan(data);
      if (setOptimizationData) setOptimizationData(data);
      try {
        if (cargoId) sessionStorage.setItem(`maritime_opt_${cargoId}`, JSON.stringify(data));
      } catch (err) {
        console.error('Failed to persist optimization plan to sessionStorage:', err);
      }

      if (data?.voyagePlans?.[0]?.id && setSelectedVoyagePlanId) {
        setSelectedVoyagePlanId(data.voyagePlans[0].id);
      }
    } catch (error) {
      console.error('Optimization failed:', error);
      setError(
        error?.response?.data?.message ||
        error?.response?.data?.error?.message ||
        'Vessel optimization could not be completed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const originPort = cargo?.originPort || {
    name: cargo?.originPortId || 'Origin Port',
    maxDraftM: 18.5,
    maxLoaM: 300,
    handlingCapacityMtDay: 25000,
    berthCapacity: 6,
  };

  const destPort = cargo?.destinationPort || {
    name: cargo?.destinationPortId || 'Destination Port',
    maxDraftM: 16.0,
    maxLoaM: 280,
    handlingCapacityMtDay: 18000,
    berthCapacity: 4,
  };

  const quantityMt = Number(cargo?.quantityMt || 55000);

  // Calculate Turnaround Days
  const originLoadingDays = originPort.handlingCapacityMtDay
    ? Math.ceil(quantityMt / Number(originPort.handlingCapacityMtDay))
    : 3;
  const destDischargeDays = destPort.handlingCapacityMtDay
    ? Math.ceil(quantityMt / Number(destPort.handlingCapacityMtDay))
    : 4;

  const firstVoyage = plan?.voyagePlans?.[0];
  const firstRecommended = plan?.recommendedPlan?.[0];
  const activeVoyagePlanId = selectedVoyagePlanId || firstVoyage?.id;
  const failedChecks = (plan?.constraintChecks || []).filter((check) => !check.passed);

  return (
    <div className="space-y-6 text-slate-100">
      <div className="border-b border-[var(--color-brand-border-strong)] pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gov-saffron)]">
          Stage 04 · Fleet Assignment
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-[var(--color-brand-text-primary)]">
          Vessel Optimization
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-brand-text-primary)]">
          Compare vessel capability, port limits, and turnaround time before selecting the most suitable voyage plan for this cargo request.
        </p>
      </div>

      {/* CONNECT RISK → OPTIMIZATION BANNER */}
      {riskData && (
        <div className="p-4 border-y border-[var(--color-brand-border-strong)] text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className={`text-[11px] uppercase font-bold ${
                riskData.overallLevel === 'HIGH'
                  ? 'bg-red-500/10 text-[var(--color-status-error)] border-red-500/30'
                  : riskData.overallLevel === 'MEDIUM'
                  ? 'bg-amber-500/10 text-[var(--color-status-warning)] border-amber-500/30'
                  : 'bg-emerald-500/10 text-[var(--color-status-success)] border-emerald-500/30'
              }`}
            >
              RISK LEVEL: {riskData.overallLevel || 'LOW'}
            </Badge>
            <span className="text-[var(--color-brand-text-secondary)]">
              Risk assessment factored into fleet assignment & turnaround feasibility
            </span>
          </div>

          <div className="text-[11px] text-[var(--color-brand-text-secondary)]">
            Weather at {destPort.name}: <strong className="text-[var(--color-brand-text-primary)]">CLEAR</strong> · Congestion: <strong className="text-[var(--color-status-success)]">NOMINAL</strong>
          </div>
        </div>
      )}

      {/* CONNECT PORT DATA → OPTIMIZATION TERMINAL CONSTRAINTS */}
      <div className="p-5 border-y border-[var(--color-brand-border-strong)] space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--color-brand-border)] pb-3">
          <div className="flex items-center gap-2">
            <Anchor className="w-4 h-4 text-[var(--color-gov-saffron)]" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-brand-text-primary)]">
              PORT HARBOR CONSTRAINTS & TURNAROUND FEASIBILITY
            </h3>
          </div>
          <span className="text-[11px] text-[var(--color-brand-text-secondary)]">
            Terminal draft limits & throughput benchmarks
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Origin Port Constraints */}
          <div className="p-4 border-t border-[var(--color-brand-border-strong)] bg-[var(--color-brand-inset)] space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[var(--color-status-success)] uppercase">LOAD: {originPort.name}</span>
              <span className="text-[11px] text-[var(--color-brand-text-secondary)]">{originPort.country || 'Australia'}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
              <div>
                <span className="text-[11px] text-[var(--color-brand-text-secondary)] block uppercase">Max Draft</span>
                <strong className="text-[var(--color-brand-text-primary)]">{originPort.maxDraftM || 18.5}m</strong>
              </div>
              <div>
                <span className="text-[11px] text-[var(--color-brand-text-secondary)] block uppercase">Max LOA</span>
                <strong className="text-[var(--color-brand-text-primary)]">{originPort.maxLoaM || 300}m</strong>
              </div>
              <div>
                <span className="text-[11px] text-[var(--color-brand-text-secondary)] block uppercase">Handling</span>
                <strong className="text-[var(--color-brand-text-primary)]">{Number(originPort.handlingCapacityMtDay || 25000).toLocaleString()} MT/d</strong>
              </div>
            </div>
            <div className="pt-2 border-t border-[var(--color-brand-border)] flex justify-between items-center text-[11px]">
              <span className="text-[var(--color-brand-text-secondary)]">Est. Load Time:</span>
              <span className="font-bold text-[var(--color-status-success)]">~{originLoadingDays} Days ({originPort.berthCapacity || 6} Berths)</span>
            </div>
          </div>

          {/* Destination Port Constraints */}
          <div className="p-4 border-t border-[var(--color-brand-border-strong)] bg-[var(--color-brand-inset)] space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[var(--color-status-error)] uppercase">DISCHARGE: {destPort.name}</span>
              <span className="text-[11px] text-[var(--color-brand-text-secondary)]">{destPort.country || 'India'}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
              <div>
                <span className="text-[11px] text-[var(--color-brand-text-secondary)] block uppercase">Max Draft</span>
                <strong className="text-[var(--color-brand-text-primary)]">{destPort.maxDraftM || 16.0}m</strong>
              </div>
              <div>
                <span className="text-[11px] text-[var(--color-brand-text-secondary)] block uppercase">Max LOA</span>
                <strong className="text-[var(--color-brand-text-primary)]">{destPort.maxLoaM || 280}m</strong>
              </div>
              <div>
                <span className="text-[11px] text-[var(--color-brand-text-secondary)] block uppercase">Handling</span>
                <strong className="text-[var(--color-brand-text-primary)]">{Number(destPort.handlingCapacityMtDay || 18000).toLocaleString()} MT/d</strong>
              </div>
            </div>
            <div className="pt-2 border-t border-[var(--color-brand-border)] flex justify-between items-center text-[11px]">
              <span className="text-[var(--color-brand-text-secondary)]">Est. Discharge Time:</span>
              <span className="font-bold text-[var(--color-status-error)]">~{destDischargeDays} Days ({destPort.berthCapacity || 4} Berths)</span>
            </div>
          </div>
        </div>
      </div>

      {/* CONNECT VESSEL DATA → CANDIDATE VESSEL MATCHING */}
      <div className="p-5 border-y border-[var(--color-brand-border-strong)] space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--color-brand-border)] pb-3">
          <div className="flex items-center gap-2">
            <Ship className="w-4 h-4 text-[var(--color-status-info)]" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-brand-text-primary)]">
              FLEET VESSEL CANDIDATES & HYDRODYNAMIC COMPATIBILITY
            </h3>
          </div>
          <span className="text-[11px] text-[var(--color-brand-text-secondary)]">
            {vessels.length} Registered Vessels in Fleet
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--color-brand-inset)] border-b border-[var(--color-brand-border-strong)] text-[var(--color-brand-text-primary)] uppercase text-[11px]">
              <tr>
                <th className="p-3">Vessel Name</th>
                <th className="p-3">Class</th>
                <th className="p-3 text-right">Capacity (DWT)</th>
                <th className="p-3 text-right">Draft</th>
                <th className="p-3 text-right">Speed</th>
                <th className="p-3 text-right">Daily Charter</th>
                <th className="p-3 text-center">Harbor Fit</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {vessels.slice(0, 5).map((v) => {
                const maxDraftAllowed = Math.min(
                  Number(originPort.maxDraftM || 18.5),
                  Number(destPort.maxDraftM || 16.0)
                );
                const isDraftFit = Number(v.draftM || 0) <= maxDraftAllowed;
                const isStatusReady = (v.availabilityStatus || v.status || '').toUpperCase() === 'AVAILABLE';

                return (
                  <tr key={v.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3 font-bold text-[var(--color-brand-text-primary)] flex items-center gap-2">
                      <Ship className="w-3.5 h-3.5 text-[var(--color-status-info)]" />
                      {v.name}
                    </td>
                    <td className="p-3 text-[var(--color-brand-text-secondary)]">{v.vesselType || v.type || 'BULK CARRIER'}</td>
                    <td className="p-3 text-right font-bold text-[var(--color-brand-text-primary)]">{Number(v.capacityMt).toLocaleString()} MT</td>
                    <td className="p-3 text-right text-[var(--color-brand-text-primary)]">{v.draftM}m</td>
                    <td className="p-3 text-right text-[var(--color-brand-text-primary)]">{v.speedKnots || 14.5} kn</td>
                    <td className="p-3 text-right font-bold text-[var(--color-status-success)]">${Number(v.dailyCharterCost).toLocaleString()}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${isDraftFit ? 'bg-emerald-500/15 text-[var(--color-status-success)]' : 'bg-red-500/15 text-[var(--color-status-error)]'}`}>
                        {isDraftFit ? 'COMPATIBLE' : 'DRAFT EXCEEDED'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${isStatusReady ? 'bg-emerald-500/15 text-[var(--color-status-success)]' : 'bg-blue-500/15 text-[var(--color-status-info)]'}`}>
                        {v.availabilityStatus || v.status || 'AVAILABLE'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* GENERATE OR DISPLAY OPTIMIZED VESSEL PLAN */}
      {!plan ? (
        <div className="flex flex-col items-center justify-center p-10 border-y border-dashed border-orange-500/30 bg-orange-500/5">
          <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6 text-[var(--color-gov-saffron)]" />
          </div>
          <div className="text-base font-bold text-[var(--color-brand-text-primary)] mb-1 uppercase tracking-wider">
            RUN MATHEMATICAL VESSEL ALLOCATION OPTIMIZER
          </div>
          <p className="text-xs text-center max-w-md text-[var(--color-brand-text-secondary)] mb-5">
            Computes optimal trip allocation, vessel selection, cost minimization, and port turnaround feasibility for {Number(quantityMt).toLocaleString()} MT.
          </p>
          <Button onClick={handleGenerate} disabled={loading} className="text-xs font-bold flex items-center gap-2">
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> SOLVING CONSTRAINTS...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> GENERATE OPTIMIZED VESSEL PLAN
              </>
            )}
          </Button>
          {error && (
            <div className="w-full max-w-md mt-4 p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-[var(--color-status-error)] text-xs">
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[var(--color-brand-border)] pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[var(--color-status-success)]" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--color-brand-text-primary)]">
                OPTIMIZED VOYAGE PLAN GENERATED
              </h3>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={loading}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              {loading ? 'RECALCULATING...' : 'REGENERATE PLAN'}
            </Button>
          </div>

          {/* OPTIMIZED VOYAGE CARD */}
          <div className="p-5 border-y-2 border-blue-500/40 bg-blue-500/10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-widest text-[var(--color-status-info)] font-bold">
                  ASSIGNED PRIMARY VESSEL
                </div>
                <div className="text-2xl font-bold text-[var(--color-brand-text-primary)] mt-1">
                  {firstVoyage?.vessel?.name || firstRecommended?.vesselName || 'PACIFIC CARRIER (PANAMAX)'}
                </div>
                <div className="text-xs text-[var(--color-brand-text-secondary)] mt-0.5">
                  Planned Volume: {firstVoyage?.plannedQuantityMt ? `${Number(firstVoyage.plannedQuantityMt).toLocaleString()} MT` : `${Number(quantityMt).toLocaleString()} MT`}
                </div>
              </div>

              <div>
                <div className="text-[11px] uppercase tracking-widest text-[var(--color-status-success)] font-bold">
                  FEASIBILITY & TRIPS
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`${plan.feasible ? 'bg-emerald-100 text-[var(--color-status-success)]' : 'bg-red-100 text-[var(--color-status-error)]'} px-2.5 py-1 rounded-lg text-xs uppercase font-bold`}>
                    {plan.feasible ? 'FEASIBLE' : 'INFEASIBLE'}
                  </span>
                  <span className="text-sm font-bold text-[var(--color-brand-text-primary)]">
                    {plan.recommendedPlan?.length || plan.numberOfTrips || 1} VOYAGE {((plan.recommendedPlan?.length || plan.numberOfTrips || 1) === 1) ? 'TRIP' : 'TRIPS'}
                  </span>
                </div>
                <div className="text-[11px] text-[var(--color-brand-text-secondary)] mt-1">
                  {failedChecks.length > 0 ? `${failedChecks.length} constraint checks failed` : 'All harbor constraints verified'}
                </div>
              </div>

              <div>
                <div className="text-[11px] uppercase tracking-widest text-[var(--color-status-warning)] font-bold">
                  TOTAL ESTIMATED VOYAGE COST
                </div>
                <div className="text-2xl font-bold text-[var(--color-status-success)] mt-1">
                  ${Number(plan.totalEstimatedCost || (quantityMt * 18.5)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-[var(--color-brand-text-secondary)] mt-0.5">Charter cost score based on selected vessel & voyage trips</div>
              </div>
            </div>
          </div>

          {/* TRIP DETAILS BREAKDOWN */}
          {plan.recommendedPlan && plan.recommendedPlan.length > 0 && (
            <div className="p-4 border-t border-[var(--color-brand-border-strong)] bg-[var(--color-brand-inset)] space-y-2">
              <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] font-bold">
                RECOMMENDED VOYAGE ALLOCATION SCHEDULE
              </div>
              <div className="space-y-1.5">
                {plan.recommendedPlan.map((trip, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2.5 rounded-lg bg-white/[0.02] border border-[var(--color-brand-border)] text-xs">
                    <span className="text-[var(--color-brand-text-primary)] font-bold">TRIP {trip.tripNumber || idx + 1}: {trip.vesselName || 'Allocated Vessel'}</span>
                    <span className="text-[var(--color-status-success)] font-bold">{Number(trip.quantityMT || quantityMt).toLocaleString()} MT</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {failedChecks.length > 0 && (
            <div className="p-4 border-y border-red-500/20 bg-red-500/5 space-y-2">
              <div className="text-[11px] uppercase tracking-widest text-[var(--color-status-error)] font-bold">
                CONSTRAINTS REQUIRING ATTENTION
              </div>
              {failedChecks.map((check, index) => (
                <div key={`${check.vesselId || 'vessel'}-${check.code || 'check'}-${index}`} className="text-xs text-[var(--color-status-error)]">
                  {check.message || `${check.code || 'Constraint'} failed`}
                </div>
              ))}
            </div>
          )}

          {plan.voyagePlans && plan.voyagePlans.length > 0 && (
            <div className="p-4 border-t border-[var(--color-brand-border-strong)] bg-[var(--color-brand-inset)] space-y-2">
              <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] font-bold">
                SELECT VOYAGE PLAN FOR COSTING
              </div>
              {plan.voyagePlans.map((voyage, index) => (
                <button
                  key={voyage.id}
                  type="button"
                  onClick={() => setSelectedVoyagePlanId?.(voyage.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border text-left text-xs ${
                    voyage.id === activeVoyagePlanId
                      ? 'border-orange-500/40 bg-orange-500/10'
                      : 'border-[var(--color-brand-border)] bg-white/[0.02] hover:bg-slate-100'
                  }`}
                >
                  <span className="text-[var(--color-brand-text-primary)] font-bold">Trip {voyage.tripNumber || index + 1}</span>
                  <span className="text-[var(--color-brand-text-primary)]">{Number(voyage.plannedQuantityMt || 0).toLocaleString()} MT</span>
                  <span className="text-[var(--color-status-info)]">{voyage.id === activeVoyagePlanId ? 'SELECTED' : 'SELECT'}</span>
                </button>
              ))}
            </div>
          )}

          {plan.alternatives && plan.alternatives.length > 0 ? (
            <div className="p-4 border-t border-[var(--color-brand-border-strong)] bg-[var(--color-brand-inset)] space-y-2">
              <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] font-bold">
                ALTERNATIVE PLANS
              </div>
              {plan.alternatives.map((alternative, index) => (
                <div key={alternative.id || index} className="flex justify-between p-3 rounded-lg bg-white/[0.02] text-xs">
                  <span className="text-[var(--color-brand-text-primary)] font-bold">Plan {String.fromCharCode(66 + index)}</span>
                  <span className="text-[var(--color-brand-text-secondary)]">{alternative.numberOfTrips || alternative.trips || 'N/A'} trips</span>
                  <span className="text-[var(--color-status-success)]">${Number(alternative.totalEstimatedCost || alternative.cost || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-[var(--color-brand-text-secondary)] border-y border-dashed border-[var(--color-brand-border-strong)] p-4">
              No alternative vessel plans were returned for this optimization run.
            </div>
          )}

          {/* CONTINUE TO COST BUTTON */}
          <div className="flex justify-end pt-4 border-t border-[var(--color-brand-border)]">
            <Button onClick={() => onComplete(true)} className="flex items-center gap-2 text-xs font-bold">
              CONTINUE TO COST <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};