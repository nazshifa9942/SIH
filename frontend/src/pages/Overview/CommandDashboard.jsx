// import React, { useState, useEffect, useMemo, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import {
//   Ship,
//   TrendingDown,
//   TrendingUp,
//   Activity,
//   ChevronRight,
//   Zap,
//   Clock,
//   ArrowRight,
//   RefreshCw,
//   Compass,
//   MapPin,
//   Info,
//   Box,
// } from 'lucide-react';
// import { Card } from '../../components/ui/Card';
// import { PageHeader, EmptyState, StatusBadge, SkeletonCard, Skeleton } from '../../components/ui/Primitives';
// import { MaritimeHorizon } from '../../components/maritime/MaritimeHorizon';
// import { Button } from '../../components/ui/Button';
// import { Badge } from '../../components/ui/Badge';
// import { getCargoList } from '../../api/cargo';
// import {
//   getFreightMarketData,
//   getFuelMarketData,
//   getCommodityMarketData,
//   getEconomicMarketData,
// } from '../../api/market';
// import { getAlerts } from '../../api/alerts';
// import { getPorts } from '../../api/ports';
// import { getVessels } from '../../api/vessels';
// import { getRecommendationHistory } from '../../api/recommendation';
// import { getRiskByCargoRequestId } from '../../api/risk';
// import { getForecastByCargoRequestId } from '../../api/forecast';
// import { MaritimeMap } from '../../components/map/MaritimeMap';

// export const CommandDashboard = () => {
//   const navigate = useNavigate();

//   // ── Global Base Data ──
//   const [cargos, setCargos] = useState([]);
//   const [activeCargoId, setActiveCargoId] = useState('');
//   const [ports, setPorts] = useState([]);
//   const [vessels, setVessels] = useState([]);
//   const [alerts, setAlerts] = useState([]);

//   // ── Market Real Data ──
//   const [freightData, setFreightData] = useState([]);
//   const [fuelData, setFuelData] = useState([]);
//   const [commodityData, setCommodityData] = useState([]);
//   const [economicData, setEconomicData] = useState([]);

//   // ── Active Cargo Linked Intelligence ──
//   const [recommendation, setRecommendation] = useState(null);
//   const [riskData, setRiskData] = useState(null);
//   const [forecastData, setForecastData] = useState(null);

//   // ── Loading & Refresh States ──
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [alertFilter, setAlertFilter] = useState('ALL'); // 'ALL' | 'ALERTS' | 'INFO'

//   // ── Fetch Global Dashboard Base Data ──
//   const loadDashboardData = useCallback(async (isRefresh = false) => {
//     if (isRefresh) setRefreshing(true);
//     else setLoading(true);

//     try {
//       const [
//         cargoList,
//         portList,
//         vesselList,
//         alertList,
//         freightRates,
//         fuelPrices,
//         commodityPrices,
//         economicIndices,
//       ] = await Promise.all([
//         getCargoList().catch(() => []),
//         getPorts().catch(() => []),
//         getVessels().catch(() => []),
//         getAlerts().catch(() => []),
//         getFreightMarketData().catch(() => []),
//         getFuelMarketData().catch(() => []),
//         getCommodityMarketData().catch(() => []),
//         getEconomicMarketData().catch(() => []),
//       ]);

//       const cList = Array.isArray(cargoList) ? cargoList : [];
//       setCargos(cList);
//       setPorts(Array.isArray(portList) ? portList : []);
//       setVessels(Array.isArray(vesselList) ? vesselList : []);
//       setAlerts(Array.isArray(alertList) ? alertList : []);
//       setFreightData(Array.isArray(freightRates) ? freightRates : []);
//       setFuelData(Array.isArray(fuelPrices) ? fuelPrices : []);
//       setCommodityData(Array.isArray(commodityPrices) ? commodityPrices : []);
//       setEconomicData(Array.isArray(economicIndices) ? economicIndices : []);

//       setActiveCargoId((prev) => prev || (cList.length > 0 ? cList[0].id : ''));
//     } catch (err) {
//       console.error('Failed to load command dashboard data:', err);
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   }, []);

//   useEffect(() => {
//     loadDashboardData();
//   }, [loadDashboardData]);

//   // ── Fetch Cargo-Specific Intelligence on Active Cargo Change ──
//   useEffect(() => {
//     if (!activeCargoId) return;

//     let isMounted = true;

//     Promise.all([
//       getRecommendationHistory(activeCargoId).catch(() => []),
//       getRiskByCargoRequestId(activeCargoId).catch(() => null),
//       getForecastByCargoRequestId(activeCargoId).catch(() => null),
//     ]).then(([recHistory, riskRes, forecastRes]) => {
//       if (!isMounted) return;

//       const latestRec = Array.isArray(recHistory) && recHistory.length > 0 ? recHistory[0] : null;
//       setRecommendation(latestRec);
//       setRiskData(riskRes);
//       setForecastData(forecastRes);
//     });

//     return () => {
//       isMounted = false;
//     };
//   }, [activeCargoId]);

//   // ── Active Selected Cargo Object ──
//   const activeCargo = useMemo(() => {
//     return cargos.find((c) => c.id === activeCargoId) || cargos[0] || null;
//   }, [cargos, activeCargoId]);

//   // ── Real Market Stats Computations ──
//   const marketStats = useMemo(() => {
//     const sortedFreight = [...freightData].sort(
//       (a, b) => new Date(a.observedAt) - new Date(b.observedAt)
//     );
//     const latestFreight = sortedFreight.length > 0 ? Number(sortedFreight[sortedFreight.length - 1].rateValue) : null;
//     const prevFreight = sortedFreight.length > 1 ? Number(sortedFreight[sortedFreight.length - 2].rateValue) : latestFreight;
//     const freightDelta = prevFreight > 0 ? ((latestFreight - prevFreight) / prevFreight) * 100 : 0;

//     const sortedFuel = [...fuelData].sort(
//       (a, b) => new Date(a.observedAt) - new Date(b.observedAt)
//     );
//     const latestFuel = sortedFuel.length > 0 ? Number(sortedFuel[sortedFuel.length - 1].price) : null;

//     const sortedComm = [...commodityData].sort(
//       (a, b) => new Date(a.observedAt) - new Date(b.observedAt)
//     );
//     const latestComm = sortedComm.length > 0 ? Number(sortedComm[sortedComm.length - 1].price) : null;

//     const sortedEcon = [...economicData].sort(
//       (a, b) => new Date(a.observedAt) - new Date(b.observedAt)
//     );
//     const latestEcon = sortedEcon.length > 0 ? Number(sortedEcon[sortedEcon.length - 1].value) : null;

//     // Standard deviation volatility calculation across freight data
//     let volatility = null;
//     if (sortedFreight.length > 1) {
//       const vals = sortedFreight.map((f) => Number(f.rateValue) || 0);
//       const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
//       const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (vals.length - 1);
//       volatility = mean > 0 ? (Math.sqrt(variance) / mean) * 100 : 0;
//     }

//     return {
//       latestFreight,
//       freightDelta,
//       latestFuel,
//       latestComm,
//       latestEcon,
//       volatility,
//     };
//   }, [freightData, fuelData, commodityData, economicData]);

//   // ── Fleet Statistics ──
//   const fleetStats = useMemo(() => {
//     const total = vessels.length;
//     const available = vessels.filter(
//       (v) => (v.availabilityStatus || v.status)?.toUpperCase() === 'AVAILABLE'
//     ).length;
//     const inTransit = vessels.filter((v) =>
//       ['IN_TRANSIT', 'CHARTERED'].includes((v.availabilityStatus || v.status)?.toUpperCase())
//     ).length;
//     const readinessPct = total > 0 ? Math.round((available / total) * 100) : 0;

//     return { total, available, inTransit, readinessPct };
//   }, [vessels]);

//   // ── Filtered Alerts ──
//   const filteredAlerts = useMemo(() => {
//     if (alertFilter === 'ALERTS') {
//       return alerts.filter((a) => ['CRITICAL', 'WARNING'].includes(a.severity?.toUpperCase()));
//     }
//     if (alertFilter === 'INFO') {
//       return alerts.filter((a) => a.severity?.toUpperCase() === 'INFO');
//     }
//     return alerts;
//   }, [alerts, alertFilter]);

//   // Format Helper
//   const formatNum = (num, decimals = 2) => {
//     if (num === null || num === undefined || isNaN(Number(num))) return 'N/A';
//     return Number(num).toLocaleString('en-US', {
//       minimumFractionDigits: decimals,
//       maximumFractionDigits: decimals,
//     });
//   };

//   if (loading) {
//     return (
//       <div className="flex flex-col gap-5 w-full">
//         <div className="flex items-start justify-between pb-2 border-b border-[var(--color-brand-border)]">
//           <div><div className="skeleton h-5 w-52" /><div className="skeleton h-3 w-96 mt-2" /></div>
//           <div className="skeleton h-8 w-24" />
//         </div>
//         <div className="grid grid-cols-12 gap-5">
//           <div className="col-span-12 lg:col-span-3 flex flex-col gap-5">
//             <SkeletonCard lines={4} /><SkeletonCard lines={3} /><SkeletonCard lines={4} />
//           </div>
//           <div className="col-span-12 lg:col-span-6"><Skeleton className="h-[480px] rounded-lg" /></div>
//           <div className="col-span-12 lg:col-span-3 flex flex-col gap-5"><SkeletonCard lines={5} /><SkeletonCard lines={5} /></div>
//         </div>
//       </div>
//     );
//   }

//   // Recommendation visual attributes (backend-provided)
//   const recAction = recommendation?.recommendedAction || 'MONITOR';
//   const recConfidence = recommendation?.confidence ? Number(recommendation.confidence) : 85;
//   const isLockNow = recAction.toUpperCase().includes('LOCK');
//   const isWait = recAction.toUpperCase().includes('WAIT');
//   const recBand = isLockNow
//     ? 'bg-[var(--color-status-success-bg)] text-[var(--color-status-success)]'
//     : isWait
//     ? 'bg-[var(--color-status-warning-bg)] text-[var(--color-status-warning)]'
//     : 'bg-[var(--color-status-info-bg)] text-[var(--color-status-info)]';

//   const overallRisk =
//     riskData?.overallLevel || riskData?.overallRisk || recommendation?.riskLevel || 'LOW';
//   const riskDot =
//     overallRisk === 'LOW' ? 'bg-emerald-500' : overallRisk === 'MEDIUM' ? 'bg-amber-500' : 'bg-red-500';

//   const severityDot = (severity) => {
//     const s = String(severity || 'INFO').toUpperCase();
//     if (s === 'CRITICAL') return 'bg-red-500';
//     if (s === 'WARNING') return 'bg-amber-500';
//     return 'bg-blue-500';
//   };

//   const requiredDate = activeCargo?.requiredDate || activeCargo?.requiredDeliveryDate;

//   return (
//     <div className="flex flex-col gap-5 w-full">
//       {/* ── Page header ──────────────────────────────────────────────── */}
//       <PageHeader
//         title="Command overview"
//         description="Live decision support, maritime GIS intelligence & multi-sector procurement operations"
//         actions={
//           <>
//             <span className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-[#abefc6] bg-[var(--color-status-success-bg)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-status-success)]">
//               <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
//               Operational telemetry active
//             </span>
//             <div className="hidden lg:flex items-center gap-3 rounded-lg border border-[var(--color-brand-border)] bg-white px-3 py-1.5 text-[12px] shadow-[0_1px_2px_rgba(16,24,40,0.06)]">
//               <span className="text-[var(--color-brand-text-muted)]">Fleet ready</span>
//               <strong className="text-[var(--color-status-success)]">{fleetStats.readinessPct}%</strong>
//               <span className="h-3 w-px bg-[var(--color-brand-border)]" />
//               <span className="text-[var(--color-brand-text-muted)]">Requests</span>
//               <strong className="text-[var(--color-brand-text-primary)]">{cargos.length}</strong>
//               <span className="h-3 w-px bg-[var(--color-brand-border)]" />
//               <span className="text-[var(--color-brand-text-muted)]">Alerts</span>
//               <strong className="text-[var(--color-status-warning)]">{alerts.length}</strong>
//             </div>
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => loadDashboardData(true)}
//               disabled={refreshing}
//             >
//               <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
//               Refresh
//             </Button>
//           </>
//         }
//       />
//       {/* ── Main 3-zone grid ─────────────────────────────────────────── */}
//       <div className="grid grid-cols-12 gap-5">
//         {/* LEFT — operational context */}
//         <div className="col-span-12 lg:col-span-3 flex flex-col gap-5">
//           {/* Selected cargo request */}
//           <Card className="p-4">
//             <div className="flex items-center justify-between gap-2 mb-3">
//               <h2 className="flex items-center gap-2 text-[13px] font-semibold text-[var(--color-brand-text-primary)]">
//                 <Ship className="h-4 w-4 text-[var(--color-status-info)]" />
//                 Selected cargo request
//               </h2>
//               {activeCargo && (
//                 <button
//                   onClick={() => navigate(`/cargo/${activeCargo.id}`)}
//                   className="inline-flex items-center gap-0.5 text-[13px] font-medium text-[var(--color-status-info)] hover:underline"
//                 >
//                   Workspace <ChevronRight className="h-3.5 w-3.5" />
//                 </button>
//               )}
//             </div>

//             {cargos.length > 1 && (
//               <select
//                 value={activeCargoId}
//                 onChange={(e) => setActiveCargoId(e.target.value)}
//                 className="ui-select mb-3"
//                 aria-label="Select cargo request"
//               >
//                 {cargos.map((c) => (
//                   <option key={c.id} value={c.id}>
//                     {c.cargoType || 'Cargo'} · {Number(c.quantityMt).toLocaleString()} MT
//                   </option>
//                 ))}
//               </select>
//             )}

//             {activeCargo ? (
//               <div>
//                 <div className="flex items-center justify-between gap-2">
//                   <h3 className="text-[15px] font-semibold text-[var(--color-brand-text-primary)] truncate">
//                     {activeCargo.cargoType || 'Cargo'}
//                   </h3>
//                   <StatusBadge status={activeCargo.status} />
//                 </div>
//                 <p className="mt-0.5 text-[13px] text-[var(--color-brand-text-secondary)]">
//                   {Number(activeCargo.quantityMt).toLocaleString()} MT
//                 </p>
//                 <div className="mt-2 flex items-center gap-1.5 text-[13px] text-[var(--color-brand-text-primary)]">
//                   <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--color-status-success)]" />
//                   <span className="truncate font-medium">{activeCargo.originPort?.name || 'Origin'}</span>
//                   <ArrowRight className="h-3 w-3 shrink-0 text-[var(--color-brand-text-muted)]" />
//                   <span className="truncate font-medium">{activeCargo.destinationPort?.name || 'Destination'}</span>
//                 </div>
//                 {requiredDate && (
//                   <div className="mt-3 flex items-center justify-between border-t border-[var(--color-brand-border)] pt-3 text-[13px]">
//                     <span className="flex items-center gap-1.5 text-[var(--color-brand-text-muted)]">
//                       <Clock className="h-3.5 w-3.5" /> Required
//                     </span>
//                     <span className="font-medium text-[var(--color-brand-text-primary)]">
//                       {new Date(requiredDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
//                     </span>
//                   </div>
//                 )}
//               </div>
//             ) : (
//               <EmptyState
//                 icon={Box}
//                 title="No active cargo request"
//                 description="Select a cargo request to view details and analysis."
//                 className="py-6"
//               />
//             )}
//           </Card>

//           {/* Procurement recommendation */}
//           <Card className="p-4">
//             <h2 className="flex items-center gap-2 text-[13px] font-semibold text-[var(--color-brand-text-primary)]">
//               <Zap className="h-4 w-4 text-[var(--color-gov-saffron)]" />
//               Procurement recommendation
//             </h2>
//             <div className={`mt-3 flex items-center justify-between rounded-md px-3 py-2.5 ${recBand}`}>
//               <span className="text-lg font-semibold tracking-tight">{recAction}</span>
//               <span className="text-[12px] font-medium">Confidence {recConfidence}%</span>
//             </div>
//             <p className="mt-3 text-[13px] leading-relaxed text-[var(--color-brand-text-secondary)]">
//               {recommendation?.explanation ||
//                 'Market analytics indicate freight rate stabilization. Verify vessel scheduling and voyage feasibility.'}
//             </p>
//             {recommendation?.expectedFreight && (
//               <div className="mt-3 flex items-center justify-between border-t border-[var(--color-brand-border)] pt-3 text-[13px]">
//                 <span className="text-[var(--color-brand-text-muted)]">Target rate</span>
//                 <span className="font-semibold text-[var(--color-brand-text-primary)]">
//                   ${formatNum(recommendation.expectedFreight)}/MT
//                 </span>
//               </div>
//             )}
//           </Card>

//           {/* Workflow & risk status */}
//           <Card className="p-4 flex-1">
//             <h2 className="flex items-center gap-2 text-[13px] font-semibold text-[var(--color-brand-text-primary)]">
//               <Activity className="h-4 w-4 text-[var(--color-status-info)]" />
//               Workflow &amp; risk status
//             </h2>
//             <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
//               <div>
//                 <dt className="text-[11px] text-[var(--color-brand-text-muted)]">Forecast engine</dt>
//                 <dd className="mt-0.5 flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-brand-text-primary)]">
//                   <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
//                   {forecastData ? forecastData.modelVersion || 'Calibrated' : 'Calibrated'}
//                 </dd>
//               </div>
//               <div>
//                 <dt className="text-[11px] text-[var(--color-brand-text-muted)]">Voyage risk</dt>
//                 <dd className="mt-0.5 flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-brand-text-primary)]">
//                   <span className={`h-1.5 w-1.5 rounded-full ${riskDot}`} />
//                   {String(overallRisk).replace(/_/g, ' ')}
//                 </dd>
//               </div>
//               <div>
//                 <dt className="text-[11px] text-[var(--color-brand-text-muted)]">Fleet match</dt>
//                 <dd className="mt-0.5 flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-brand-text-primary)]">
//                   <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
//                   {fleetStats.available} ready
//                 </dd>
//               </div>
//               <div>
//                 <dt className="text-[11px] text-[var(--color-brand-text-muted)]">Market feeds</dt>
//                 <dd className="mt-0.5 flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-brand-text-primary)]">
//                   <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-gov-navy)]" />
//                   {freightData.length + fuelData.length} streams
//                 </dd>
//               </div>
//             </dl>
//           </Card>
//         </div>

//         {/* CENTER — GIS map (visual anchor) */}
//         <div className="col-span-12 lg:col-span-6 flex flex-col gap-3">
//           <div className="flex items-center justify-between">
//             <h2 className="flex items-center gap-2 text-[13px] font-semibold text-[var(--color-brand-text-primary)]">
//               <Compass className="h-4 w-4 text-[var(--color-status-info)]" />
//               Voyage corridor
//             </h2>
//             <button
//               onClick={() => navigate('/map')}
//               className="inline-flex items-center gap-0.5 text-[13px] font-medium text-[var(--color-status-info)] hover:underline"
//             >
//               Full map <ChevronRight className="h-3.5 w-3.5" />
//             </button>
//           </div>
//           <div className="h-[320px] sm:h-[400px] lg:h-[540px] rounded-lg overflow-hidden border border-[var(--color-brand-border)] shadow-[0_1px_3px_rgba(16,24,40,0.10)]">
//             <MaritimeMap
//               originPort={activeCargo?.originPort}
//               destinationPort={activeCargo?.destinationPort}
//               allPorts={ports}
//               vessels={vessels}
//               selectedVessel={vessels[0]}
//               showAlternativeRoutes={true}
//               showAllPorts={true}
//               showFleet={true}
//               showChokepoints={true}
//               className="h-full w-full"
//             />
//           </div>
//         </div>

//         {/* RIGHT — live operational intelligence */}
//         <div className="col-span-12 lg:col-span-3 flex flex-col gap-5">
//           {/* Market telemetry */}
//           <Card className="p-4">
//             <div className="flex items-center justify-between mb-2">
//               <h2 className="text-[13px] font-semibold text-[var(--color-brand-text-primary)]">Market telemetry</h2>
//               <button
//                 onClick={() => navigate('/market')}
//                 className="text-[13px] font-medium text-[var(--color-status-info)] hover:underline"
//               >
//                 Details
//               </button>
//             </div>
//             <dl className="divide-y divide-[var(--color-brand-border)]">
//               <div className="flex items-center justify-between py-2">
//                 <dt className="text-[13px] text-[var(--color-brand-text-secondary)]">Ocean freight</dt>
//                 <dd className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--color-brand-text-primary)]">
//                   ${formatNum(marketStats.latestFreight)}/MT
//                   {marketStats.freightDelta >= 0 ? (
//                     <TrendingUp className="h-3.5 w-3.5 text-[var(--color-status-success)]" />
//                   ) : (
//                     <TrendingDown className="h-3.5 w-3.5 text-[var(--color-status-error)]" />
//                   )}
//                 </dd>
//               </div>
//               <div className="flex items-center justify-between py-2">
//                 <dt className="text-[13px] text-[var(--color-brand-text-secondary)]">Bunker (VLSFO)</dt>
//                 <dd className="text-[13px] font-semibold text-[var(--color-brand-text-primary)]">${formatNum(marketStats.latestFuel)}/MT</dd>
//               </div>
//               <div className="flex items-center justify-between py-2">
//                 <dt className="text-[13px] text-[var(--color-brand-text-secondary)]">Iron ore (62% Fe)</dt>
//                 <dd className="text-[13px] font-semibold text-[var(--color-brand-text-primary)]">${formatNum(marketStats.latestComm)}/MT</dd>
//               </div>
//               <div className="flex items-center justify-between py-2">
//                 <dt className="text-[13px] text-[var(--color-brand-text-secondary)]">Baltic index / PMI</dt>
//                 <dd className="text-[13px] font-semibold text-[var(--color-brand-text-primary)]">{formatNum(marketStats.latestEcon, 1)} pts</dd>
//               </div>
//               <div className="flex items-center justify-between py-2">
//                 <dt className="text-[13px] text-[var(--color-brand-text-secondary)]">Freight volatility</dt>
//                 <dd className="text-[13px] font-semibold text-[var(--color-brand-text-primary)]">{formatNum(marketStats.volatility, 1)}%</dd>
//               </div>
//             </dl>
//           </Card>

//           {/* Live event stream */}
//           <Card className="p-4 flex-1 flex flex-col min-h-0">
//             <div className="flex items-center justify-between gap-2">
//               <h2 className="text-[13px] font-semibold text-[var(--color-brand-text-primary)]">Live event stream</h2>
//               <div className="flex rounded-md border border-[var(--color-brand-border)] bg-[var(--color-brand-inset)] p-0.5" role="group" aria-label="Event filter">
//                 {['ALL', 'ALERTS', 'INFO'].map((filter) => (
//                   <button
//                     key={filter}
//                     onClick={() => setAlertFilter(filter)}
//                     aria-pressed={alertFilter === filter}
//                     className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
//                       alertFilter === filter
//                         ? 'bg-white text-[var(--color-brand-text-primary)] shadow-sm'
//                         : 'text-[var(--color-brand-text-muted)] hover:text-[var(--color-brand-text-primary)]'
//                     }`}
//                   >
//                     {filter === 'ALL' ? 'All' : filter === 'ALERTS' ? 'Alerts' : 'Info'}
//                   </button>
//                 ))}
//               </div>
//             </div>

//             {filteredAlerts.length > 0 ? (
//               <ul className="mt-1 divide-y divide-[var(--color-brand-border)] overflow-y-auto max-h-[300px]">
//                 {filteredAlerts.slice(0, 8).map((a, idx) => (
//                   <li key={a.id || idx} className="flex gap-2.5 py-2.5">
//                     <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${severityDot(a.severity)}`} />
//                     <div className="min-w-0 flex-1">
//                       <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--color-brand-text-muted)]">
//                         <span>{new Date(a.triggeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
//                         <span className="font-medium text-[var(--color-brand-text-secondary)]">{a.alertType || 'System'}</span>
//                       </div>
//                       <p className="mt-0.5 text-[13px] leading-snug text-[var(--color-brand-text-primary)] break-words">{a.message}</p>
//                     </div>
//                   </li>
//                 ))}
//               </ul>
//             ) : (
//               <EmptyState
//                 icon={Info}
//                 title="No active event alerts"
//                 description="System is operating normally."
//                 className="py-8"
//               />
//             )}
//           </Card>
//         </div>
//       </div>

//       {/* ── Maritime horizon signature ───────────────────────────────── */}
//       <MaritimeHorizon />
//     </div>
//   );
// };




import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ship,
  TrendingDown,
  TrendingUp,
  Activity,
  ChevronRight,
  Zap,
  Clock,
  ArrowRight,
  RefreshCw,
  Compass,
  MapPin,
  Info,
  Box,
  ShieldCheck,
  BarChart3,
  Anchor,
  CircleDollarSign,
} from 'lucide-react';

import { Card } from '../../components/ui/Card';
import {
  PageHeader,
  EmptyState,
  StatusBadge,
  SkeletonCard,
  Skeleton,
} from '../../components/ui/Primitives';
import { MaritimeHorizon } from '../../components/maritime/MaritimeHorizon';
import { Button } from '../../components/ui/Button';
import { getCargoList } from '../../api/cargo';
import {
  getFreightMarketData,
  getFuelMarketData,
  getCommodityMarketData,
  getEconomicMarketData,
} from '../../api/market';
import { getAlerts } from '../../api/alerts';
import { getPorts } from '../../api/ports';
import { getVessels } from '../../api/vessels';
import { getRecommendationHistory } from '../../api/recommendation';
import { getRiskByCargoRequestId } from '../../api/risk';
import { getForecastByCargoRequestId } from '../../api/forecast';
import { MaritimeMap } from '../../components/map/MaritimeMap';

export const CommandDashboard = () => {
  const navigate = useNavigate();

  // ── Global Base Data ──
  const [cargos, setCargos] = useState([]);
  const [activeCargoId, setActiveCargoId] = useState('');
  const [ports, setPorts] = useState([]);
  const [vessels, setVessels] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // ── Market Real Data ──
  const [freightData, setFreightData] = useState([]);
  const [fuelData, setFuelData] = useState([]);
  const [commodityData, setCommodityData] = useState([]);
  const [economicData, setEconomicData] = useState([]);

  // ── Active Cargo Linked Intelligence ──
  const [recommendation, setRecommendation] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [forecastData, setForecastData] = useState(null);

  // ── Loading & Refresh States ──
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alertFilter, setAlertFilter] = useState('ALL');

  // ── Fetch Global Dashboard Base Data ──
  const loadDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [
        cargoList,
        portList,
        vesselList,
        alertList,
        freightRates,
        fuelPrices,
        commodityPrices,
        economicIndices,
      ] = await Promise.all([
        getCargoList().catch(() => []),
        getPorts().catch(() => []),
        getVessels().catch(() => []),
        getAlerts().catch(() => []),
        getFreightMarketData().catch(() => []),
        getFuelMarketData().catch(() => []),
        getCommodityMarketData().catch(() => []),
        getEconomicMarketData().catch(() => []),
      ]);

      const cList = Array.isArray(cargoList) ? cargoList : [];

      setCargos(cList);
      setPorts(Array.isArray(portList) ? portList : []);
      setVessels(Array.isArray(vesselList) ? vesselList : []);
      setAlerts(Array.isArray(alertList) ? alertList : []);
      setFreightData(Array.isArray(freightRates) ? freightRates : []);
      setFuelData(Array.isArray(fuelPrices) ? fuelPrices : []);
      setCommodityData(Array.isArray(commodityPrices) ? commodityPrices : []);
      setEconomicData(Array.isArray(economicIndices) ? economicIndices : []);

      setActiveCargoId((prev) =>
        prev || (cList.length > 0 ? cList[0].id : '')
      );
    } catch (err) {
      console.error('Failed to load command dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // ── Fetch Cargo-Specific Intelligence ──
  useEffect(() => {
    if (!activeCargoId) return;

    let isMounted = true;

    Promise.all([
      getRecommendationHistory(activeCargoId).catch(() => []),
      getRiskByCargoRequestId(activeCargoId).catch(() => null),
      getForecastByCargoRequestId(activeCargoId).catch(() => null),
    ]).then(([recHistory, riskRes, forecastRes]) => {
      if (!isMounted) return;

      const latestRec =
        Array.isArray(recHistory) && recHistory.length > 0
          ? recHistory[0]
          : null;

      setRecommendation(latestRec);
      setRiskData(riskRes);
      setForecastData(forecastRes);
    });

    return () => {
      isMounted = false;
    };
  }, [activeCargoId]);

  // ── Active Cargo ──
  const activeCargo = useMemo(() => {
    return (
      cargos.find((c) => c.id === activeCargoId) ||
      cargos[0] ||
      null
    );
  }, [cargos, activeCargoId]);

  // ── Market Stats ──
  const marketStats = useMemo(() => {
    const sortedFreight = [...freightData].sort(
      (a, b) => new Date(a.observedAt) - new Date(b.observedAt)
    );

    const latestFreight =
      sortedFreight.length > 0
        ? Number(sortedFreight[sortedFreight.length - 1].rateValue)
        : null;

    const prevFreight =
      sortedFreight.length > 1
        ? Number(sortedFreight[sortedFreight.length - 2].rateValue)
        : latestFreight;

    const freightDelta =
      prevFreight > 0
        ? ((latestFreight - prevFreight) / prevFreight) * 100
        : 0;

    const sortedFuel = [...fuelData].sort(
      (a, b) => new Date(a.observedAt) - new Date(b.observedAt)
    );

    const latestFuel =
      sortedFuel.length > 0
        ? Number(sortedFuel[sortedFuel.length - 1].price)
        : null;

    const sortedComm = [...commodityData].sort(
      (a, b) => new Date(a.observedAt) - new Date(b.observedAt)
    );

    const latestComm =
      sortedComm.length > 0
        ? Number(sortedComm[sortedComm.length - 1].price)
        : null;

    const sortedEcon = [...economicData].sort(
      (a, b) => new Date(a.observedAt) - new Date(b.observedAt)
    );

    const latestEcon =
      sortedEcon.length > 0
        ? Number(sortedEcon[sortedEcon.length - 1].value)
        : null;

    let volatility = null;

    if (sortedFreight.length > 1) {
      const vals = sortedFreight.map(
        (f) => Number(f.rateValue) || 0
      );

      const mean =
        vals.reduce((a, b) => a + b, 0) / vals.length;

      const variance =
        vals.reduce(
          (a, b) => a + Math.pow(b - mean, 2),
          0
        ) /
        (vals.length - 1);

      volatility =
        mean > 0
          ? (Math.sqrt(variance) / mean) * 100
          : 0;
    }

    return {
      latestFreight,
      freightDelta,
      latestFuel,
      latestComm,
      latestEcon,
      volatility,
    };
  }, [freightData, fuelData, commodityData, economicData]);

  // ── Fleet Statistics ──
  const fleetStats = useMemo(() => {
    const total = vessels.length;

    const available = vessels.filter(
      (v) =>
        (v.availabilityStatus || v.status)?.toUpperCase() ===
        'AVAILABLE'
    ).length;

    const inTransit = vessels.filter((v) =>
      ['IN_TRANSIT', 'CHARTERED'].includes(
        (v.availabilityStatus || v.status)?.toUpperCase()
      )
    ).length;

    const readinessPct =
      total > 0 ? Math.round((available / total) * 100) : 0;

    return {
      total,
      available,
      inTransit,
      readinessPct,
    };
  }, [vessels]);

  // ── Filtered Alerts ──
  const filteredAlerts = useMemo(() => {
    if (alertFilter === 'ALERTS') {
      return alerts.filter((a) =>
        ['CRITICAL', 'WARNING'].includes(
          a.severity?.toUpperCase()
        )
      );
    }

    if (alertFilter === 'INFO') {
      return alerts.filter(
        (a) => a.severity?.toUpperCase() === 'INFO'
      );
    }

    return alerts;
  }, [alerts, alertFilter]);

  const formatNum = (num, decimals = 2) => {
    if (
      num === null ||
      num === undefined ||
      isNaN(Number(num))
    ) {
      return 'N/A';
    }

    return Number(num).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex w-full flex-col gap-6">
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div>
            <div className="skeleton h-6 w-56" />
            <div className="skeleton mt-2 h-3 w-96" />
          </div>

          <div className="skeleton h-9 w-24 rounded-xl" />
        </div>

        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12 flex flex-col gap-5 lg:col-span-3">
            <SkeletonCard lines={4} />
            <SkeletonCard lines={3} />
            <SkeletonCard lines={4} />
          </div>

          <div className="col-span-12 lg:col-span-6">
            <Skeleton className="h-[480px] rounded-2xl" />
          </div>

          <div className="col-span-12 flex flex-col gap-5 lg:col-span-3">
            <SkeletonCard lines={5} />
            <SkeletonCard lines={5} />
          </div>
        </div>
      </div>
    );
  }

  const recAction =
    recommendation?.recommendedAction || 'MONITOR';

  const recConfidence = recommendation?.confidence
    ? Number(recommendation.confidence)
    : 85;

  const isLockNow = recAction.toUpperCase().includes('LOCK');
  const isWait = recAction.toUpperCase().includes('WAIT');

  const recBand = isLockNow
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : isWait
      ? 'border-amber-200 bg-amber-50 text-amber-700'
      : 'border-blue-200 bg-blue-50 text-blue-700';

  const overallRisk =
    riskData?.overallLevel ||
    riskData?.overallRisk ||
    recommendation?.riskLevel ||
    'LOW';

  const riskDot =
    overallRisk === 'LOW'
      ? 'bg-emerald-500'
      : overallRisk === 'MEDIUM'
        ? 'bg-amber-500'
        : 'bg-red-500';

  const severityDot = (severity) => {
    const s = String(severity || 'INFO').toUpperCase();

    if (s === 'CRITICAL') return 'bg-red-500';
    if (s === 'WARNING') return 'bg-amber-500';

    return 'bg-blue-500';
  };

  const requiredDate =
    activeCargo?.requiredDate ||
    activeCargo?.requiredDeliveryDate;

  return (
    <div className="flex w-full flex-col gap-6">
      {/* ============================================================
          PAGE HEADER
      ============================================================ */}
      <PageHeader
        title="Decision overview"
        description="A single workspace for cargo, freight, vessel, risk and procurement decisions."
        actions={
          <div className="flex items-center gap-2">
            {/* System status */}
            <div className="hidden items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 md:flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
              </span>

              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-700">
                Data connected
              </span>
            </div>

            {/* Summary */}
            <div className="hidden items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:flex">
              <div className="px-3 py-2">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Fleet ready
                </p>
                <p className="mt-0.5 text-sm font-extrabold text-emerald-600">
                  {fleetStats.readinessPct}%
                </p>
              </div>

              <div className="h-8 w-px bg-slate-200" />

              <div className="px-3 py-2">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Requests
                </p>
                <p className="mt-0.5 text-sm font-extrabold text-[#06295c]">
                  {cargos.length}
                </p>
              </div>

              <div className="h-8 w-px bg-slate-200" />

              <div className="px-3 py-2">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Alerts
                </p>
                <p className="mt-0.5 text-sm font-extrabold text-amber-600">
                  {alerts.length}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => loadDashboardData(true)}
              disabled={refreshing}
              className="rounded-xl"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  refreshing ? 'animate-spin' : ''
                }`}
              />
              Refresh
            </Button>
          </div>
        }
      />

      {/* ============================================================
          MAIN GRID
      ============================================================ */}
      <div className="grid grid-cols-12 gap-5">
        {/* ==========================================================
            LEFT
        ========================================================== */}
        <div className="col-span-12 flex flex-col gap-5 lg:col-span-3">
          {/* Selected Cargo */}
          <Card className="group overflow-hidden rounded-2xl border-slate-200 bg-white p-0 shadow-[0_8px_30px_rgba(15,45,80,0.05)]">
            <div className="border-b border-slate-100 bg-gradient-to-r from-[#f7faff] to-white px-5 py-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#0757c7]">
                    <Ship className="h-4 w-4" />
                  </div>

                  <div>
                    <h2 className="text-[12px] font-extrabold text-[#06295c]">
                      Selected cargo
                    </h2>

                    <p className="text-[9px] font-medium uppercase tracking-wider text-slate-400">
                      Active request
                    </p>
                  </div>
                </div>

                {activeCargo && (
                  <button
                    onClick={() =>
                      navigate(`/cargo/${activeCargo.id}`)
                    }
                    className="flex items-center gap-0.5 text-[10px] font-bold text-[#0757c7] transition-colors hover:text-[#06295c]"
                  >
                    Open
                    <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="p-5">
              {cargos.length > 1 && (
                <select
                  value={activeCargoId}
                  onChange={(e) =>
                    setActiveCargoId(e.target.value)
                  }
                  className="ui-select mb-4 !h-10 !rounded-xl"
                  aria-label="Select cargo request"
                >
                  {cargos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.cargoType || 'Cargo'} ·{' '}
                      {Number(c.quantityMt).toLocaleString()} MT
                    </option>
                  ))}
                </select>
              )}

              {activeCargo ? (
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                        Cargo type
                      </p>

                      <h3 className="truncate text-base font-extrabold text-[#06295c]">
                        {activeCargo.cargoType || 'Cargo'}
                      </h3>
                    </div>

                    <StatusBadge status={activeCargo.status} />
                  </div>

                  <div className="mt-4 rounded-xl bg-slate-50 px-3 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Quantity
                      </span>

                      <span className="text-sm font-extrabold text-[#06295c]">
                        {Number(
                          activeCargo.quantityMt
                        ).toLocaleString()}{' '}
                        <span className="text-[10px] font-bold text-slate-400">
                          MT
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                      Voyage
                    </p>

                    <div className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-bold text-[#06295c]">
                          {activeCargo.originPort?.name ||
                            'Origin'}
                        </p>

                        <p className="mt-0.5 text-[9px] text-slate-400">
                          Origin
                        </p>
                      </div>

                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white">
                        <ArrowRight className="h-3 w-3 text-[#0757c7]" />
                      </div>

                      <div className="min-w-0 flex-1 text-right">
                        <p className="truncate text-[11px] font-bold text-[#06295c]">
                          {activeCargo.destinationPort?.name ||
                            'Destination'}
                        </p>

                        <p className="mt-0.5 text-[9px] text-slate-400">
                          Destination
                        </p>
                      </div>
                    </div>
                  </div>

                  {requiredDate && (
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
                        <Clock className="h-3.5 w-3.5" />
                        Required by
                      </span>

                      <span className="text-[11px] font-extrabold text-[#06295c]">
                        {new Date(
                          requiredDate
                        ).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState
                  icon={Box}
                  title="No active cargo"
                  description="Create or select a cargo request to begin analysis."
                  className="py-6"
                />
              )}
            </div>
          </Card>

          {/* Recommendation */}
          <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white p-0 shadow-[0_8px_30px_rgba(15,45,80,0.05)]">
            <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Zap className="h-4 w-4" />
              </div>

              <div>
                <h2 className="text-[12px] font-extrabold text-[#06295c]">
                  Procurement signal
                </h2>

                <p className="text-[9px] font-medium uppercase tracking-wider text-slate-400">
                  Decision support
                </p>
              </div>
            </div>

            <div className="p-5">
              <div
                className={`flex items-center justify-between rounded-xl border px-4 py-3 ${recBand}`}
              >
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider opacity-70">
                    Suggested action
                  </p>

                  <span className="mt-0.5 block text-lg font-extrabold tracking-tight">
                    {recAction}
                  </span>
                </div>

                <div className="text-right">
                  <p className="text-[9px] font-bold uppercase tracking-wider opacity-70">
                    Confidence
                  </p>

                  <p className="mt-0.5 text-sm font-extrabold">
                    {recConfidence}%
                  </p>
                </div>
              </div>

              <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
                {recommendation?.explanation ||
                  'Market analytics indicate freight rate stabilization. Verify vessel scheduling and voyage feasibility.'}
              </p>

              {recommendation?.expectedFreight && (
                <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3">
                  <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                    <CircleDollarSign className="h-3.5 w-3.5" />
                    Reference rate
                  </span>

                  <span className="text-sm font-extrabold text-[#06295c]">
                    ${formatNum(
                      recommendation.expectedFreight
                    )}
                    <span className="text-[9px] text-slate-400">
                      /MT
                    </span>
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Workflow Status */}
          <Card className="flex-1 rounded-2xl border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,45,80,0.05)]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#0757c7]">
                <Activity className="h-4 w-4" />
              </div>

              <div>
                <h2 className="text-[12px] font-extrabold text-[#06295c]">
                  Decision status
                </h2>

                <p className="text-[9px] font-medium uppercase tracking-wider text-slate-400">
                  Current workspace
                </p>
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 p-3">
                <dt className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Forecast
                </dt>

                <dd className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-[#06295c]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {forecastData
                    ? forecastData.modelVersion ||
                      'Available'
                    : 'Available'}
                </dd>
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                <dt className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Risk
                </dt>

                <dd className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-[#06295c]">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${riskDot}`}
                  />
                  {String(overallRisk).replace(
                    /_/g,
                    ' '
                  )}
                </dd>
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                <dt className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Fleet
                </dt>

                <dd className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-[#06295c]">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  {fleetStats.available} ready
                </dd>
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                <dt className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Data points
                </dt>

                <dd className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-[#06295c]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0757c7]" />
                  {freightData.length +
                    fuelData.length}{' '}
                  records
                </dd>
              </div>
            </dl>
          </Card>
        </div>

        {/* ==========================================================
            CENTER — MAP
        ========================================================== */}
        <div className="col-span-12 flex flex-col gap-3 lg:col-span-6">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#06295c] text-white">
                  <Compass className="h-4 w-4" />
                </div>

                <div>
                  <h2 className="text-[13px] font-extrabold text-[#06295c]">
                    Maritime view
                  </h2>

                  <p className="text-[9px] font-medium uppercase tracking-wider text-slate-400">
                    Port & fleet context
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/map')}
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-bold text-[#0757c7] transition-colors hover:bg-blue-50"
            >
              Open map
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="relative h-[320px] overflow-hidden rounded-2xl border border-slate-200 bg-[#eef4f8] shadow-[0_12px_35px_rgba(15,45,80,0.08)] sm:h-[400px] lg:h-[540px]">
            {/* Map top label */}
            <div className="pointer-events-none absolute left-4 top-4 z-10">
              <div className="flex items-center gap-2 rounded-xl border border-white/70 bg-white/90 px-3 py-2 shadow-lg backdrop-blur-md">
                <Anchor className="h-3.5 w-3.5 text-[#0757c7]" />

                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-wider text-[#06295c]">
                    Maritime network
                  </p>

                  <p className="text-[8px] font-medium text-slate-400">
                    Ports · vessels · cargo context
                  </p>
                </div>
              </div>
            </div>

            <MaritimeMap
              originPort={activeCargo?.originPort}
              destinationPort={activeCargo?.destinationPort}
              allPorts={ports}
              vessels={vessels}
              selectedVessel={vessels[0]}
              showAlternativeRoutes={true}
              showAllPorts={true}
              showFleet={true}
              showChokepoints={true}
              className="h-full w-full"
            />
          </div>

          {/* Map footer metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-[#0757c7]" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Ports
                </span>
              </div>

              <p className="mt-1 text-base font-extrabold text-[#06295c]">
                {ports.length}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <Ship className="h-3.5 w-3.5 text-[#0757c7]" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Vessels
                </span>
              </div>

              <p className="mt-1 text-base font-extrabold text-[#06295c]">
                {vessels.length}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <Box className="h-3.5 w-3.5 text-[#0757c7]" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Cargo requests
                </span>
              </div>

              <p className="mt-1 text-base font-extrabold text-[#06295c]">
                {cargos.length}
              </p>
            </div>
          </div>
        </div>

        {/* ==========================================================
            RIGHT
        ========================================================== */}
        <div className="col-span-12 flex flex-col gap-5 lg:col-span-3">
          {/* Market */}
          <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white p-0 shadow-[0_8px_30px_rgba(15,45,80,0.05)]">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#0757c7]">
                  <BarChart3 className="h-4 w-4" />
                </div>

                <div>
                  <h2 className="text-[12px] font-extrabold text-[#06295c]">
                    Market snapshot
                  </h2>

                  <p className="text-[9px] font-medium uppercase tracking-wider text-slate-400">
                    Latest available data
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate('/market')}
                className="text-[10px] font-bold text-[#0757c7] hover:text-[#06295c]"
              >
                Details
              </button>
            </div>

            <dl className="divide-y divide-slate-100">
              <div className="flex items-center justify-between px-5 py-3">
                <dt className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  Ocean freight
                </dt>

                <dd className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#06295c]">
                  ${formatNum(marketStats.latestFreight)}
                  /MT

                  {marketStats.freightDelta >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                  )}
                </dd>
              </div>

              <div className="flex items-center justify-between px-5 py-3">
                <dt className="text-[10px] font-medium text-slate-500">
                  Bunker fuel
                </dt>

                <dd className="text-[11px] font-extrabold text-[#06295c]">
                  ${formatNum(marketStats.latestFuel)}
                  /MT
                </dd>
              </div>

              <div className="flex items-center justify-between px-5 py-3">
                <dt className="text-[10px] font-medium text-slate-500">
                  Commodity
                </dt>

                <dd className="text-[11px] font-extrabold text-[#06295c]">
                  ${formatNum(marketStats.latestComm)}
                  /MT
                </dd>
              </div>

              <div className="flex items-center justify-between px-5 py-3">
                <dt className="text-[10px] font-medium text-slate-500">
                  Economic indicator
                </dt>

                <dd className="text-[11px] font-extrabold text-[#06295c]">
                  {formatNum(
                    marketStats.latestEcon,
                    1
                  )}
                </dd>
              </div>

              <div className="flex items-center justify-between bg-slate-50/70 px-5 py-3">
                <dt className="text-[10px] font-semibold text-slate-500">
                  Freight variability
                </dt>

                <dd className="text-[11px] font-extrabold text-[#06295c]">
                  {formatNum(
                    marketStats.volatility,
                    1
                  )}
                  %
                </dd>
              </div>
            </dl>
          </Card>

          {/* Alerts */}
          <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border-slate-200 bg-white p-0 shadow-[0_8px_30px_rgba(15,45,80,0.05)]">
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <ShieldCheck className="h-4 w-4" />
                  </div>

                  <div>
                    <h2 className="text-[12px] font-extrabold text-[#06295c]">
                      Attention center
                    </h2>

                    <p className="text-[9px] font-medium uppercase tracking-wider text-slate-400">
                      Alerts & information
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="mt-4 flex rounded-xl border border-slate-200 bg-slate-50 p-1"
                role="group"
                aria-label="Event filter"
              >
                {['ALL', 'ALERTS', 'INFO'].map(
                  (filter) => (
                    <button
                      key={filter}
                      onClick={() =>
                        setAlertFilter(filter)
                      }
                      aria-pressed={
                        alertFilter === filter
                      }
                      className={`flex-1 rounded-lg px-2 py-1.5 text-[9px] font-bold transition-all ${
                        alertFilter === filter
                          ? 'bg-white text-[#06295c] shadow-sm'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {filter === 'ALL'
                        ? 'All'
                        : filter === 'ALERTS'
                          ? 'Alerts'
                          : 'Info'}
                    </button>
                  )
                )}
              </div>
            </div>

            {filteredAlerts.length > 0 ? (
              <ul className="max-h-[340px] overflow-y-auto">
                {filteredAlerts
                  .slice(0, 8)
                  .map((a, idx) => (
                    <li
                      key={a.id || idx}
                      className="group flex gap-3 border-b border-slate-100 px-5 py-3 transition-colors hover:bg-slate-50"
                    >
                      <div className="pt-1">
                        <span
                          className={`block h-2 w-2 rounded-full ${severityDot(
                            a.severity
                          )}`}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9px] font-medium text-slate-400">
                            {new Date(
                              a.triggeredAt
                            ).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>

                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-slate-500">
                            {a.alertType || 'System'}
                          </span>
                        </div>

                        <p className="mt-1.5 break-words text-[10px] font-medium leading-relaxed text-[#06295c]">
                          {a.message}
                        </p>
                      </div>
                    </li>
                  ))}
              </ul>
            ) : (
              <div className="flex flex-1 items-center justify-center px-5">
                <EmptyState
                  icon={Info}
                  title="No active alerts"
                  description="No attention items are currently available."
                  className="py-8"
                />
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Bottom maritime signature */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <MaritimeHorizon />
      </div>
    </div>
  );
};