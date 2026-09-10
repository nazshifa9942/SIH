import React, { useState, useEffect, useMemo } from 'react';
import {
  Ship,
  Anchor,
  Clock,
  MapPin,
  Compass,
  AlertTriangle,
  CheckCircle2,
  Play,
  Info,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  getVessels,
  analyzeIdle,
  analyzeRepositioning,
} from '../../api/vessels';
import { getPorts } from '../../api/ports';
import { calculateDistanceNM, getPortCoordinates } from '../../utils/mapUtils';

export const VesselOperations = () => {
  const [vessels, setVessels] = useState([]);
  const [ports, setPorts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Idle Analysis State ──
  const [idleVesselId, setIdleVesselId] = useState('');
  const [idleLoading, setIdleLoading] = useState(false);
  const [idleResult, setIdleResult] = useState(null);
  const [idleError, setIdleError] = useState('');

  // ── Repositioning State ──
  const [repoVesselId, setRepoVesselId] = useState('');
  const [repoTargetPortId, setRepoTargetPortId] = useState('');
  const [repoLoading, setRepoLoading] = useState(false);
  const [repoResult, setRepoResult] = useState(null);
  const [repoError, setRepoError] = useState('');

  // ── Load Base Fleet & Ports ──
  useEffect(() => {
    Promise.all([getVessels().catch(() => []), getPorts().catch(() => [])])
      .then(([vList, pList]) => {
        const vArray = Array.isArray(vList) ? vList : [];
        const pArray = Array.isArray(pList) ? pList : [];
        setVessels(vArray);
        setPorts(pArray);

        if (vArray.length > 0) {
          setIdleVesselId(vArray[0].id);
          setRepoVesselId(vArray[0].id);
        }
        if (pArray.length > 0) {
          setRepoTargetPortId(pArray[0].id);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // ── Run Idle Analysis ──
  const handleRunIdleAnalysis = async () => {
    if (!idleVesselId) return;
    setIdleLoading(true);
    setIdleError('');

    try {
      const res = await analyzeIdle(idleVesselId);
      setIdleResult(res);
    } catch (err) {
      console.error('Idle analysis failed:', err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to execute vessel idle analysis.';
      setIdleError(msg);
      setIdleResult(null);
    } finally {
      setIdleLoading(false);
    }
  };

  // ── Run Repositioning Analysis ──
  const handleRunRepoAnalysis = async () => {
    if (!repoVesselId || !repoTargetPortId) return;
    setRepoLoading(true);
    setRepoError('');

    try {
      const res = await analyzeRepositioning(repoVesselId, repoTargetPortId);
      setRepoResult(res);
    } catch (err) {
      console.error('Repositioning analysis failed:', err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to execute repositioning analysis.';
      setRepoError(msg);
      setRepoResult(null);
    } finally {
      setRepoLoading(false);
    }
  };

  const selectedIdleVessel = useMemo(() => {
    return vessels.find((v) => v.id === idleVesselId) || null;
  }, [vessels, idleVesselId]);

  const selectedRepoVessel = useMemo(() => {
    return vessels.find((v) => v.id === repoVesselId) || null;
  }, [vessels, repoVesselId]);

  const selectedTargetPort = useMemo(() => {
    return ports.find((p) => p.id === repoTargetPortId) || null;
  }, [ports, repoTargetPortId]);

  // Compute estimated repositioning nautical distance if location is known
  const repoNauticalEstimate = useMemo(() => {
    if (!repoResult || !repoResult.currentLocation || !selectedTargetPort) return null;
    const originCoords = getPortCoordinates({ name: repoResult.currentLocation });
    const targetCoords = getPortCoordinates(selectedTargetPort);
    const distNM = calculateDistanceNM(originCoords, targetCoords);
    const speed = selectedRepoVessel?.speedKnots ? Number(selectedRepoVessel.speedKnots) : 14.5;
    const days = speed > 0 ? (distNM / speed / 24).toFixed(1) : 0;
    const charter = selectedRepoVessel?.dailyCharterCost ? Number(selectedRepoVessel.dailyCharterCost) : 0;
    const fuelPerDay = selectedRepoVessel?.fuelConsumption ? Number(selectedRepoVessel.fuelConsumption) : 30;
    const estCharterCost = Math.round(Number(days) * charter);
    const estFuelCost = Math.round(Number(days) * fuelPerDay * 620); // ~620 $/MT VLSFO

    return {
      distNM,
      days,
      estCharterCost,
      estFuelCost,
      totalBallastCost: estCharterCost + estFuelCost,
    };
  }, [repoResult, selectedTargetPort, selectedRepoVessel]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] w-full gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
        <span className="text-xs uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
          Loading Fleet Operations Engine...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* ── SECTION 1: IDLE-TIME ANALYSIS MODULE ───────────────────────── */}
      <Card className="bg-[var(--color-brand-elevated)] border-[var(--color-brand-border)]/[0.06] rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-[var(--color-brand-border)] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[var(--color-status-warning)]" />
              <h2 className="text-base font-bold uppercase tracking-wider text-[var(--color-brand-text-primary)]">
                VESSEL IDLE-TIME ANALYSIS
              </h2>
            </div>
            <p className="text-xs text-[var(--color-brand-text-secondary)] mt-1">
              Evaluates historical availability windows, open layover gaps, and holding cost impact.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={idleVesselId}
              onChange={(e) => setIdleVesselId(e.target.value)}
              className="bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-brand-text-primary)] focus:outline-none focus:border-[var(--color-gov-navy)] min-w-[200px]"
            >
              {vessels.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.vesselType || 'BULK CARRIER'})
                </option>
              ))}
            </select>

            <Button
              onClick={handleRunIdleAnalysis}
              disabled={idleLoading}
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-black font-bold flex items-center gap-2 text-xs"
            >
              <Play className={`w-3.5 h-3.5 ${idleLoading ? 'animate-spin' : ''}`} />
              {idleLoading ? 'EVALUATING...' : 'ANALYZE IDLE TIME'}
            </Button>
          </div>
        </div>

        {idleError && (
          <div className="mb-4 p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-[var(--color-status-error)] text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{idleError}</span>
          </div>
        )}

        {idleResult ? (
          <div className="space-y-5">
            {/* Summary Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)]">
                <span className="text-[11px] uppercase text-[var(--color-brand-text-secondary)] block mb-1">
                  Analysis Status
                </span>
                <Badge
                  variant="outline"
                  className={`text-[11px] font-bold uppercase ${
                    idleResult.status === 'EVALUATED'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-[var(--color-status-success)]'
                      : 'border-amber-500/30 bg-amber-500/10 text-[var(--color-status-warning)]'
                  }`}
                >
                  {idleResult.status}
                </Badge>
              </div>

              <div className="p-4 rounded-xl bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)]">
                <span className="text-[11px] uppercase text-[var(--color-brand-text-secondary)] block mb-1">
                  Total Idle Days
                </span>
                <div className="text-2xl font-bold text-[var(--color-status-warning)]">
                  {idleResult.idleDays} <span className="text-xs text-[var(--color-brand-text-muted)] font-normal">Days</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)]">
                <span className="text-[11px] uppercase text-[var(--color-brand-text-secondary)] block mb-1">
                  Current Location
                </span>
                <div className="text-base font-bold text-[var(--color-brand-text-primary)] flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-[var(--color-gov-saffron)] flex-shrink-0" />
                  {idleResult.currentLocation || 'Unknown / Open Sea'}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)]">
                <span className="text-[11px] uppercase text-[var(--color-brand-text-secondary)] block mb-1">
                  Holding Cost Outlay
                </span>
                <div className="text-xl font-bold text-[var(--color-status-success)]">
                  ${(
                    Number(idleResult.idleDays) *
                    (Number(selectedIdleVessel?.dailyCharterCost) || 18000)
                  ).toLocaleString()}
                </div>
                <div className="text-[11px] text-[var(--color-brand-text-muted)]">
                  @ ${Number(selectedIdleVessel?.dailyCharterCost || 18000).toLocaleString()}/day
                </div>
              </div>
            </div>

            {/* Closed Availability Windows Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--color-brand-text-muted)] mb-3">
                EVALUATED AVAILABILITY WINDOWS ({idleResult.closedWindows?.length || 0})
              </h4>
              {idleResult.closedWindows?.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-[var(--color-brand-border)] bg-[var(--color-brand-inset)]">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-[var(--color-brand-border)] text-[var(--color-brand-text-muted)] text-[11px] uppercase bg-[var(--color-brand-inset)]">
                      <tr>
                        <th className="p-3">Available From</th>
                        <th className="p-3">Available Until</th>
                        <th className="p-3 text-right">Window Duration (Days)</th>
                        <th className="p-3 text-right">Holding Impact ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-[var(--color-brand-text-primary)]">
                      {idleResult.closedWindows.map((w, i) => (
                        <tr key={i} className="hover:bg-white/[0.02]">
                          <td className="p-3">{new Date(w.availableFrom).toLocaleDateString()}</td>
                          <td className="p-3">{new Date(w.availableUntil).toLocaleDateString()}</td>
                          <td className="p-3 text-right font-bold text-[var(--color-status-warning)]">{w.days} d</td>
                          <td className="p-3 text-right font-bold text-[var(--color-status-success)]">
                            ${(
                              Number(w.days) *
                              (Number(selectedIdleVessel?.dailyCharterCost) || 18000)
                            ).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 text-center rounded-xl bg-[var(--color-brand-inset)] text-xs text-[var(--color-brand-text-muted)]">
                  No closed availability windows logged. Vessel has open-ended charter availability.
                </div>
              )}
            </div>

            {/* Basis Policy Note */}
            {idleResult.basis?.note && (
              <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 text-[11px] text-[var(--color-brand-text-muted)] flex items-center gap-2">
                <Info className="w-4 h-4 text-[var(--color-status-info)] flex-shrink-0" />
                <span>{idleResult.basis.note}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center rounded-2xl border border-dashed border-[var(--color-brand-border)] bg-slate-100">
            <Clock className="w-8 h-8 text-[var(--color-brand-text-muted)] mx-auto mb-2" />
            <div className="text-sm font-bold text-[var(--color-brand-text-secondary)]">Select a vessel and trigger idle analysis</div>
            <div className="text-xs text-[var(--color-brand-text-muted)] mt-1">
              Evaluates idle layover days, available windows, and financial holding impact.
            </div>
          </div>
        )}
      </Card>

      {/* ── SECTION 2: REPOSITIONING & BALLAST ANALYSIS MODULE ─────────── */}
      <Card className="bg-[var(--color-brand-elevated)] border-[var(--color-brand-border)]/[0.06] rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-[var(--color-brand-border)] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-[var(--color-status-info)]" />
              <h2 className="text-base font-bold uppercase tracking-wider text-[var(--color-brand-text-primary)]">
                VESSEL REPOSITIONING & BALLAST ANALYSIS
              </h2>
            </div>
            <p className="text-xs text-[var(--color-brand-text-secondary)] mt-1">
              Evaluates vessel relocation feasibility, distance from current location to target loading port, and ballast costs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Vessel Selector */}
            <select
              value={repoVesselId}
              onChange={(e) => setRepoVesselId(e.target.value)}
              className="bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-brand-text-primary)] focus:outline-none focus:border-[var(--color-gov-navy)] min-w-[180px]"
            >
              {vessels.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>

            <span className="text-[var(--color-brand-text-muted)] text-xs">➔</span>

            {/* Target Port Selector */}
            <select
              value={repoTargetPortId}
              onChange={(e) => setRepoTargetPortId(e.target.value)}
              className="bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-brand-text-primary)] focus:outline-none focus:border-[var(--color-gov-navy)] min-w-[180px]"
            >
              {ports.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.country})
                </option>
              ))}
            </select>

            <Button
              onClick={handleRunRepoAnalysis}
              disabled={repoLoading}
              size="sm"
              className="bg-blue-500 hover:bg-blue-600 text-[var(--color-brand-text-primary)] font-bold flex items-center gap-2 text-xs"
            >
              <Play className={`w-3.5 h-3.5 ${repoLoading ? 'animate-spin' : ''}`} />
              {repoLoading ? 'CALCULATING...' : 'ANALYZE REPOSITIONING'}
            </Button>
          </div>
        </div>

        {repoError && (
          <div className="mb-4 p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-[var(--color-status-error)] text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{repoError}</span>
          </div>
        )}

        {repoResult ? (
          <div className="space-y-5">
            {/* Repositioning Summary Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)]">
                <span className="text-[11px] uppercase text-[var(--color-brand-text-secondary)] block mb-1">
                  Location Status
                </span>
                {repoResult.locationMatch ? (
                  <Badge className="bg-emerald-100 text-[var(--color-status-success)] border border-emerald-500/40 text-[11px] font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> AT TARGET PORT
                  </Badge>
                ) : (
                  <Badge className="bg-amber-100 text-[var(--color-status-warning)] border border-amber-500/40 text-[11px] font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 mr-1" /> BALLAST VOYAGE REQUIRED
                  </Badge>
                )}
              </div>

              <div className="p-4 rounded-xl bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)]">
                <span className="text-[11px] uppercase text-[var(--color-brand-text-secondary)] block mb-1">
                  Current AIS Origin
                </span>
                <div className="text-base font-bold text-[var(--color-brand-text-primary)] flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-[var(--color-status-info)] flex-shrink-0" />
                  {repoResult.currentLocation || 'Unknown'}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)]">
                <span className="text-[11px] uppercase text-[var(--color-brand-text-secondary)] block mb-1">
                  Target Loading Terminal
                </span>
                <div className="text-base font-bold text-[var(--color-brand-text-primary)] flex items-center gap-1.5 truncate">
                  <Anchor className="w-3.5 h-3.5 text-[var(--color-gov-saffron)] flex-shrink-0" />
                  {repoResult.targetPort?.name} ({repoResult.targetPort?.country})
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)]">
                <span className="text-[11px] uppercase text-[var(--color-brand-text-secondary)] block mb-1">
                  Daily Charter Benchmark
                </span>
                <div className="text-lg font-bold text-[var(--color-status-success)]">
                  ${(repoResult.referenceDailyCharterCost || 18000).toLocaleString()}/day
                </div>
              </div>
            </div>

            {/* Nautical Relocation Calculation Card */}
            {repoNauticalEstimate && !repoResult.locationMatch && (
              <div className="p-5 rounded-2xl bg-[var(--color-brand-background)] border border-[var(--color-brand-border)] space-y-4">
                <div className="flex justify-between items-center border-b border-[var(--color-brand-border)] pb-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-status-info)] flex items-center gap-2">
                    <Ship className="w-4 h-4 text-[var(--color-status-info)]" />
                    ESTIMATED BALLAST TRANSIT TELEMETRY
                  </div>
                  <Badge variant="outline" className="text-[11px] border-blue-500/30 text-[var(--color-status-info)]">
                    SPEED: {selectedRepoVessel?.speedKnots || 14.5} KNOTS
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[var(--color-brand-text-muted)] text-[11px] block">Nautical Distance</span>
                    <strong className="text-[var(--color-brand-text-primary)] text-base">{repoNauticalEstimate.distNM.toLocaleString()} NM</strong>
                  </div>
                  <div>
                    <span className="text-[var(--color-brand-text-muted)] text-[11px] block">Ballast Transit Time</span>
                    <strong className="text-[var(--color-status-warning)] text-base">~{repoNauticalEstimate.days} Days</strong>
                  </div>
                  <div>
                    <span className="text-[var(--color-brand-text-muted)] text-[11px] block">Ballast Charter Outlay</span>
                    <strong className="text-[var(--color-status-success)] text-base">${repoNauticalEstimate.estCharterCost.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="text-[var(--color-brand-text-muted)] text-[11px] block">Est. Bunkering Fuel</span>
                    <strong className="text-[var(--color-gov-navy)] text-base">${repoNauticalEstimate.estFuelCost.toLocaleString()}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center rounded-2xl border border-dashed border-[var(--color-brand-border)] bg-slate-100">
            <Compass className="w-8 h-8 text-[var(--color-brand-text-muted)] mx-auto mb-2" />
            <div className="text-sm font-bold text-[var(--color-brand-text-secondary)]">
              Select a vessel & target port to analyze repositioning requirements
            </div>
            <div className="text-xs text-[var(--color-brand-text-muted)] mt-1">
              Checks AIS location matches, calculates relocation nautical miles, and estimates ballast costs.
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
