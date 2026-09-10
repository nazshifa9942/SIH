import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  BarChart3,
  Ship,
  Box,
  Scale,
  Gauge,
  Zap,
  Info,
  RefreshCw,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { getCargoList } from '../../api/cargo';
import { getVessels } from '../../api/vessels';
import {
  getFreightMarketData,
  getFuelMarketData,
  getEconomicMarketData,
} from '../../api/market';

export const AdvancedAnalytics = () => {
  const [cargos, setCargos] = useState([]);
  const [vessels, setVessels] = useState([]);
  const [freightData, setFreightData] = useState([]);
  const [fuelData, setFuelData] = useState([]);
  const [economicData, setEconomicData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Load All Macro & Operational Streams ──
  const loadAnalyticsData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [
        cargoList,
        vesselList,
        freightList,
        fuelList,
        economicList,
      ] = await Promise.all([
        getCargoList().catch(() => []),
        getVessels().catch(() => []),
        getFreightMarketData().catch(() => []),
        getFuelMarketData().catch(() => []),
        getEconomicMarketData().catch(() => []),
      ]);

      setCargos(Array.isArray(cargoList) ? cargoList : []);
      setVessels(Array.isArray(vesselList) ? vesselList : []);
      setFreightData(Array.isArray(freightList) ? freightList : []);
      setFuelData(Array.isArray(fuelList) ? fuelList : []);
      setEconomicData(Array.isArray(economicList) ? economicList : []);
    } catch (err) {
      console.error('Failed to load advanced analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  // ── 1. DEMAND ANALYTICS COMPUTATIONS ──
  const demandAnalytics = useMemo(() => {
    const totalDemandMt = cargos.reduce((acc, c) => acc + (Number(c.quantityMt) || 0), 0);

    // Demand breakdown by Commodity Type
    const commodityMap = {};
    cargos.forEach((c) => {
      const type = (c.cargoType || 'Dry Bulk').toUpperCase();
      commodityMap[type] = (commodityMap[type] || 0) + (Number(c.quantityMt) || 0);
    });

    const demandByCommodity = Object.entries(commodityMap).map(([name, value]) => ({
      name,
      value,
    }));

    // Demand breakdown by Trade Corridor (Origin -> Destination)
    const corridorMap = {};
    cargos.forEach((c) => {
      const origin = c.originPort?.name || c.originPortId || 'NEWCASTLE';
      const dest = c.destinationPort?.name || c.destinationPortId || 'PARADIP';
      const key = `${origin} ➔ ${dest}`;
      corridorMap[key] = (corridorMap[key] || 0) + (Number(c.quantityMt) || 0);
    });

    const demandByCorridor = Object.entries(corridorMap).map(([corridor, tonnage]) => ({
      corridor,
      tonnage,
    }));

    return {
      totalDemandMt,
      demandByCommodity,
      demandByCorridor,
      totalContracts: cargos.length,
    };
  }, [cargos]);

  // ── 2. SUPPLY & TONNAGE AVAILABILITY COMPUTATIONS ──
  const supplyAnalytics = useMemo(() => {
    const totalFleetDwt = vessels.reduce((acc, v) => acc + (Number(v.capacityMt) || 0), 0);

    // Available Tonnage vs Committed Tonnage
    const availableVessels = vessels.filter(
      (v) => (v.availabilityStatus || v.status)?.toUpperCase() === 'AVAILABLE'
    );
    const availableTonnage = availableVessels.reduce(
      (acc, v) => acc + (Number(v.capacityMt) || 0),
      0
    );

    const inTransitVessels = vessels.filter((v) =>
      ['IN_TRANSIT', 'CHARTERED'].includes((v.availabilityStatus || v.status)?.toUpperCase())
    );
    const inTransitTonnage = inTransitVessels.reduce(
      (acc, v) => acc + (Number(v.capacityMt) || 0),
      0
    );

    const maintenanceVessels = vessels.filter(
      (v) => (v.availabilityStatus || v.status)?.toUpperCase() === 'MAINTENANCE'
    );
    const maintenanceTonnage = maintenanceVessels.reduce(
      (acc, v) => acc + (Number(v.capacityMt) || 0),
      0
    );

    const availabilityRate = totalFleetDwt > 0 ? (availableTonnage / totalFleetDwt) * 100 : 0;

    // Supply by Vessel Class
    const classMap = {};
    vessels.forEach((v) => {
      const vClass = (v.vesselType || 'Bulk Carrier').toUpperCase();
      classMap[vClass] = (classMap[vClass] || 0) + (Number(v.capacityMt) || 0);
    });

    const supplyByClass = Object.entries(classMap).map(([vesselClass, capacity]) => ({
      vesselClass,
      capacity,
    }));

    const statusBreakdown = [
      { name: 'Available (Spot Ready)', value: availableTonnage, count: availableVessels.length, color: '#10b981' },
      { name: 'Underway / Chartered', value: inTransitTonnage, count: inTransitVessels.length, color: '#3b82f6' },
      { name: 'Maintenance / Drydock', value: maintenanceTonnage, count: maintenanceVessels.length, color: '#f59e0b' },
    ];

    return {
      totalFleetDwt,
      availableTonnage,
      inTransitTonnage,
      maintenanceTonnage,
      availabilityRate,
      supplyByClass,
      statusBreakdown,
      totalVessels: vessels.length,
      availableCount: availableVessels.length,
    };
  }, [vessels]);

  // ── 3. MARKET PRESSURE & SPREAD CORRELATION ──
  const marketPressure = useMemo(() => {
    const demand = demandAnalytics.totalDemandMt || 1;
    const availableSupply = supplyAnalytics.availableTonnage || 1;

    // Supply-to-Demand Ratio (MPI)
    const mpi = availableSupply / demand;

    let pressureLevel = 'BALANCED';
    let pressureBadge = 'bg-blue-100 text-[var(--color-status-info)] border-blue-500/30';
    let pressureDesc =
      'Supply and demand are currently in equilibrium. Freight rates remain steady with normal seasonal volatility.';

    if (mpi < 0.9) {
      pressureLevel = 'HIGH BULLISH PRESSURE';
      pressureBadge = 'bg-red-100 text-[var(--color-status-error)] border-red-500/30';
      pressureDesc =
        'Tonnage deficit detected! Active cargo demand exceeds available spot vessels. Expect strong upward freight rate pressure.';
    } else if (mpi > 1.25) {
      pressureLevel = 'BEARISH / SURPLUS TONNAGE';
      pressureBadge = 'bg-emerald-100 text-[var(--color-status-success)] border-emerald-500/30';
      pressureDesc =
        'Tonnage surplus detected! Available spot vessel supply exceeds demand. Favorable chartering terms with downward freight pressure.';
    }

    // Latest Market Telemetry
    const sortedFreight = [...freightData].sort(
      (a, b) => new Date(a.observedAt) - new Date(b.observedAt)
    );
    const latestFreight =
      sortedFreight.length > 0 ? Number(sortedFreight[sortedFreight.length - 1].rateValue) : 25.1;

    const sortedFuel = [...fuelData].sort(
      (a, b) => new Date(a.observedAt) - new Date(b.observedAt)
    );
    const latestFuel =
      sortedFuel.length > 0 ? Number(sortedFuel[sortedFuel.length - 1].price) : 620.0;

    const sortedEcon = [...economicData].sort(
      (a, b) => new Date(a.observedAt) - new Date(b.observedAt)
    );
    const latestBDI =
      sortedEcon.length > 0 ? Number(sortedEcon[sortedEcon.length - 1].value) : 1840;

    // Freight-to-Fuel Spread ($/MT freight minus fuel portion)
    const fuelCostPerMt = (latestFuel * 30) / 55000; // ~30 MT/day fuel across 55k MT cargo
    const netFreightMargin = latestFreight - fuelCostPerMt;

    // Time Series Comparison (Freight Rate vs Macro Index)
    const timelineData = sortedFreight.slice(-14).map((f, i) => {
      const fuelMatch = sortedFuel[i] ? Number(sortedFuel[i].price) : latestFuel;
      return {
        date: new Date(f.observedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        freightRate: Number(f.rateValue),
        fuelPrice: fuelMatch,
        margin: Number(f.rateValue) - (fuelMatch * 30) / 55000,
      };
    });

    return {
      mpi: Number(mpi.toFixed(2)),
      pressureLevel,
      pressureBadge,
      pressureDesc,
      latestFreight,
      latestFuel,
      latestBDI,
      netFreightMargin: Number(netFreightMargin.toFixed(2)),
      timelineData,
    };
  }, [demandAnalytics, supplyAnalytics, freightData, fuelData, economicData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] w-full gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[var(--color-brand-border-strong)] border-t-[var(--color-gov-navy)]" />
        <span className="text-xs uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
          Synthesizing Macro Market Pressure & Tonnage Econometrics...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* ── TOP HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--color-brand-border)]/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[var(--color-gov-saffron)]" />
            <h2 className="text-base font-bold uppercase tracking-wider text-[var(--color-brand-text-primary)]">
              ADVANCED MARITIME MARKET ANALYTICS
            </h2>
          </div>
          <p className="text-xs text-[var(--color-brand-text-secondary)] mt-0.5">
            Supply vs. Demand Econometrics, Tonnage Availability Ratios & Market Pressure Diagnostics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => loadAnalyticsData(true)}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 border-[var(--color-brand-border)] hover:border-[var(--color-brand-border-strong)] text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'RE-CALCULATING...' : 'REFRESH ANALYTICS'}
          </Button>
        </div>
      </div>

      {/* ── TOP LEVEL ECONOMETRIC KPI CARDS ────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Active Demand */}
        <div className="p-4 rounded-2xl bg-[var(--color-brand-elevated)] border border-[var(--color-brand-border)]">
          <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] flex items-center gap-1.5 mb-1">
            <Box className="w-3.5 h-3.5 text-[var(--color-status-info)]" /> Total Active Demand
          </div>
          <div className="text-2xl font-bold text-[var(--color-brand-text-primary)]">
            {demandAnalytics.totalDemandMt.toLocaleString()}{' '}
            <span className="text-xs text-[var(--color-brand-text-muted)] font-normal">MT</span>
          </div>
          <div className="text-[11px] text-[var(--color-brand-text-muted)] mt-1">
            Across {demandAnalytics.totalContracts} active cargo requests
          </div>
        </div>

        {/* Total Fleet Supply */}
        <div className="p-4 rounded-2xl bg-[var(--color-brand-elevated)] border border-[var(--color-brand-border)]">
          <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] flex items-center gap-1.5 mb-1">
            <Ship className="w-3.5 h-3.5 text-[var(--color-status-success)]" /> Fleet Supply Capacity
          </div>
          <div className="text-2xl font-bold text-[var(--color-status-success)]">
            {supplyAnalytics.totalFleetDwt.toLocaleString()}{' '}
            <span className="text-xs text-[var(--color-brand-text-muted)] font-normal">DWT</span>
          </div>
          <div className="text-[11px] text-[var(--color-status-success)]/80 mt-1">
            {supplyAnalytics.availableTonnage.toLocaleString()} MT ready for spot charter
          </div>
        </div>

        {/* Tonnage Availability Rate */}
        <div className="p-4 rounded-2xl bg-[var(--color-brand-elevated)] border border-[var(--color-brand-border)]">
          <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] flex items-center gap-1.5 mb-1">
            <Scale className="w-3.5 h-3.5 text-[var(--color-status-warning)]" /> Tonnage Availability
          </div>
          <div className="text-2xl font-bold text-[var(--color-status-warning)]">
            {supplyAnalytics.availabilityRate.toFixed(1)}%
          </div>
          <div className="text-[11px] text-[var(--color-brand-text-muted)] mt-1">
            {supplyAnalytics.availableCount} of {supplyAnalytics.totalVessels} ships available
          </div>
        </div>

        {/* Market Pressure Index (MPI) */}
        <div className="p-4 rounded-2xl bg-[var(--color-brand-elevated)] border border-[var(--color-brand-border)]">
          <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] flex items-center gap-1.5 mb-1">
            <Gauge className="w-3.5 h-3.5 text-[var(--color-gov-navy)]" /> Market Pressure (MPI)
          </div>
          <div className="text-2xl font-bold text-[var(--color-gov-navy)]">
            {marketPressure.mpi}x
          </div>
          <div className="text-[11px] text-[var(--color-brand-text-muted)] mt-1 truncate">
            {marketPressure.pressureLevel}
          </div>
        </div>
      </div>

      {/* ── SECTION 1: MARKET PRESSURE & MACRO BALANCE ──────────────────── */}
      <Card className="bg-[var(--color-brand-elevated)] border-[var(--color-brand-border)]/[0.06] rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b border-[var(--color-brand-border)] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-[var(--color-gov-saffron)]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-brand-text-primary)]">
                SUPPLY-DEMAND BALANCE & MARKET PRESSURE INDEX (MPI)
              </h3>
            </div>
            <p className="text-xs text-[var(--color-brand-text-secondary)] mt-0.5">
              Evaluates real-time spot tonnage elasticity against dry bulk procurement requirements.
            </p>
          </div>

          <Badge className={`text-xs font-bold uppercase ${marketPressure.pressureBadge}`}>
            {marketPressure.pressureLevel} ({marketPressure.mpi}x Ratio)
          </Badge>
        </div>

        {/* Market Pressure Explanation Banner */}
        <div className="p-4 rounded-xl bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] mb-6 text-xs text-[var(--color-brand-text-secondary)] flex items-start gap-3">
          <Info className="w-5 h-5 text-[var(--color-status-info)] flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-[var(--color-brand-text-primary)] uppercase tracking-wider mb-0.5">
              Market Diagnostic Intelligence
            </div>
            {marketPressure.pressureDesc}
          </div>
        </div>

        {/* Freight vs Fuel Margin Time Series Chart */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={marketPressure.timelineData}>
              <defs>
                <linearGradient id="freightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="marginGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" tick={{ fill: '#9ca3af', fontSize: 10 }} />
              <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fill: '#9ca3af', fontSize: 10 }} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ backgroundColor: '#181922', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                itemStyle={{ fontSize: '11px', fontFamily: 'monospace' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
              <Area type="monotone" dataKey="freightRate" name="Spot Freight Rate ($/MT)" stroke="#3b82f6" fill="url(#freightGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="margin" name="Net Margin After Fuel ($/MT)" stroke="#10b981" fill="url(#marginGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* ── SECTION 2: DEMAND & SUPPLY DUAL BREAKDOWN ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DEMAND BREAKDOWN CARD */}
        <Card className="bg-[var(--color-brand-elevated)] border-[var(--color-brand-border)]/[0.06] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4 border-b border-[var(--color-brand-border)] pb-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-status-info)] flex items-center gap-2">
                <Box className="w-4 h-4 text-[var(--color-status-info)]" />
                DEMAND BY COMMODITY SECTOR
              </div>
              <Badge variant="outline" className="text-[11px] border-blue-500/30 text-[var(--color-status-info)]">
                {demandAnalytics.totalContracts} CONTRACTS
              </Badge>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={demandAnalytics.demandByCommodity} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" stroke="rgba(255,255,255,0.2)" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.2)" tick={{ fill: '#ffffff', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#181922', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ fontSize: '11px', fontFamily: 'monospace' }}
                  />
                  <Bar dataKey="value" name="Demand (MT)" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trade Corridors List */}
          <div className="mt-4 pt-3 border-t border-[var(--color-brand-border)] text-xs space-y-2">
            <span className="text-[11px] uppercase text-[var(--color-brand-text-muted)] block mb-1">
              Top Shipping Corridors
            </span>
            {demandAnalytics.demandByCorridor.map((c, i) => (
              <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-[var(--color-brand-inset)]">
                <span className="text-[var(--color-brand-text-primary)] font-bold">{c.corridor}</span>
                <span className="text-[var(--color-status-success)] font-bold">{c.tonnage.toLocaleString()} MT</span>
              </div>
            ))}
          </div>
        </Card>

        {/* SUPPLY & TONNAGE AVAILABILITY CARD */}
        <Card className="bg-[var(--color-brand-elevated)] border-[var(--color-brand-border)]/[0.06] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4 border-b border-[var(--color-brand-border)] pb-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-status-success)] flex items-center gap-2">
                <Ship className="w-4 h-4 text-[var(--color-status-success)]" />
                TONNAGE AVAILABILITY BY STATUS
              </div>
              <Badge variant="outline" className="text-[11px] border-emerald-500/30 text-[var(--color-status-success)]">
                {supplyAnalytics.totalVessels} VESSELS
              </Badge>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={supplyAnalytics.statusBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {supplyAnalytics.statusBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#181922', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ fontSize: '11px', fontFamily: 'monospace' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Supply by Class Breakdown */}
          <div className="mt-4 pt-3 border-t border-[var(--color-brand-border)] text-xs space-y-2">
            <span className="text-[11px] uppercase text-[var(--color-brand-text-muted)] block mb-1">
              Fleet Capacity by Vessel Class
            </span>
            <div className="grid grid-cols-2 gap-2">
              {supplyAnalytics.supplyByClass.map((sc, i) => (
                <div key={i} className="p-2 rounded-lg bg-[var(--color-brand-inset)] flex justify-between items-center">
                  <span className="text-[var(--color-brand-text-secondary)]">{sc.vesselClass}</span>
                  <span className="text-[var(--color-status-info)] font-bold">{Number(sc.capacity).toLocaleString()} MT</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
