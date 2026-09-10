import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  Fuel,
  BarChart3,
  Globe,
  ArrowUp,
  ArrowDown,
  Filter,
  RefreshCw,
  Ship,
  Activity,
  Layers,
  Table as TableIcon,
  Sparkles,
  RotateCcw,
  AlertTriangle,
  Eye,
  Scale,
  ExternalLink,
  Package,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  getFreightMarketData,
  getFuelMarketData,
  getCommodityMarketData,
  getEconomicMarketData,
} from '../../api/market';
import { getPorts } from '../../api/ports';
import { getCargoList } from '../../api/cargo';
import { getAlerts } from '../../api/alerts';
import { AdvancedAnalytics } from './AdvancedAnalytics';

// ─── Preset Constants ─────────────────────────────────────────────────────────

const DATE_PRESETS = [
  { label: '7D', days: 7 },
  { label: '14D', days: 14 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: 'ALL', days: null },
];

const VESSEL_TYPES = [
  { value: 'ALL', label: 'All Vessel Types' },
  { value: 'CAPESIZE', label: 'Capesize (100k+ DWT)' },
  { value: 'PANAMAX', label: 'Panamax (65k-100k DWT)' },
  { value: 'SUPRAMAX', label: 'Supramax (50k-65k DWT)' },
  { value: 'HANDYSIZE', label: 'Handysize (10k-40k DWT)' },
  { value: 'BULK_CARRIER', label: 'Bulk Carrier (General)' },
];

const FUEL_TYPES = [
  { value: 'ALL', label: 'All Fuel Types' },
  { value: 'VLSFO', label: 'VLSFO (Very Low Sulfur Fuel Oil)' },
  { value: 'HSFO', label: 'HSFO (High Sulfur Fuel Oil)' },
  { value: 'MGO', label: 'MGO (Marine Gas Oil)' },
  { value: 'LNG', label: 'LNG Bunkers' },
];

const FUEL_REGIONS = [
  { value: 'ALL', label: 'All Global Bunkering Hubs' },
  { value: 'Singapore', label: 'Singapore' },
  { value: 'Rotterdam', label: 'Rotterdam (ARA)' },
  { value: 'Fujairah', label: 'Fujairah' },
  { value: 'Houston', label: 'Houston / US Gulf' },
  { value: 'Gibraltar', label: 'Gibraltar' },
  { value: 'Zhoushan', label: 'Zhoushan' },
];

const COMMODITIES = [
  { value: 'ALL', label: 'All Dry Bulk Commodities' },
  { value: 'IRON ORE', label: 'Iron Ore (62% Fe CFR)' },
  { value: 'IRON_ORE', label: 'Iron Ore' },
  { value: 'COAL', label: 'Thermal Coal (FOB)' },
  { value: 'MET COAL', label: 'Coking / Met Coal' },
  { value: 'GRAIN', label: 'Grain / Wheat / Soy' },
  { value: 'BAUXITE', label: 'Bauxite' },
];

const COMMODITY_MARKETS = [
  { value: 'ALL', label: 'All Commodity Hubs' },
  { value: 'Newcastle', label: 'Newcastle (Australia)' },
  { value: 'Qingdao', label: 'Qingdao (China)' },
  { value: 'Rotterdam', label: 'Rotterdam (Europe)' },
  { value: 'Dalian', label: 'Dalian / Bohai' },
  { value: 'Singapore', label: 'Singapore Spot' },
];

const ECONOMIC_INDICATORS = [
  { value: 'ALL', label: 'All Maritime & Macro Indicators' },
  { value: 'BDI', label: 'BDI - Baltic Dry Index' },
  { value: 'BCI', label: 'BCI - Baltic Capesize Index' },
  { value: 'BPI', label: 'BPI - Baltic Panamax Index' },
  { value: 'SCFI', label: 'SCFI - Shanghai Containerized Freight Index' },
  { value: 'PMI', label: 'Global Manufacturing PMI' },
  { value: 'CHINA_PMI', label: 'China Caixin / NBS PMI' },
];

// ─── Mathematical & Statistical Engine ────────────────────────────────────────

function computeSectorStats(records, valueKey) {
  if (!records || records.length === 0) {
    return {
      count: 0,
      latest: 0,
      earliest: 0,
      avg: 0,
      min: 0,
      max: 0,
      range: 0,
      changePct: 0,
      changeVal: 0,
      trendDirection: 'STABLE',
      volatilityPct: 0,
      movingAvg7: 0,
      movingAvg30: 0,
      highDate: 'N/A',
      lowDate: 'N/A',
      latestDate: 'N/A',
    };
  }

  // Sort chronologically ascending
  const sorted = [...records].sort(
    (a, b) => new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime()
  );

  const values = sorted.map((r) => Number(r[valueKey]) || 0);
  const count = values.length;

  const latest = values[count - 1];
  const earliest = values[0];
  const prev = count > 1 ? values[count - 2] : earliest;

  const sum = values.reduce((acc, v) => acc + v, 0);
  const avg = sum / count;

  let min = values[0];
  let max = values[0];
  let minIdx = 0;
  let maxIdx = 0;

  values.forEach((v, i) => {
    if (v < min) {
      min = v;
      minIdx = i;
    }
    if (v > max) {
      max = v;
      maxIdx = i;
    }
  });

  const range = max - min;
  const changeVal = latest - prev;
  const changePct = prev !== 0 ? ((latest - prev) / prev) * 100 : 0;
  const overallChangePct = earliest !== 0 ? ((latest - earliest) / earliest) * 100 : 0;

  let trendDirection = 'STABLE';
  if (changePct > 0.15) trendDirection = 'UP';
  else if (changePct < -0.15) trendDirection = 'DOWN';

  // Volatility: Sample standard deviation / Mean
  let variance = 0;
  if (count > 1) {
    variance = values.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) / (count - 1);
  }
  const stdDev = Math.sqrt(variance);
  const volatilityPct = avg > 0 ? (stdDev / avg) * 100 : 0;

  // Moving averages
  const last7 = values.slice(-7);
  const movingAvg7 = last7.reduce((a, b) => a + b, 0) / (last7.length || 1);

  const last30 = values.slice(-30);
  const movingAvg30 = last30.reduce((a, b) => a + b, 0) / (last30.length || 1);

  const formatDateStr = (d) => {
    if (!d) return 'N/A';
    try {
      return new Date(d).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  return {
    count,
    latest,
    earliest,
    prev,
    avg,
    min,
    max,
    range,
    changePct,
    overallChangePct,
    changeVal,
    trendDirection,
    volatilityPct,
    movingAvg7,
    movingAvg30,
    highDate: formatDateStr(sorted[maxIdx]?.observedAt),
    lowDate: formatDateStr(sorted[minIdx]?.observedAt),
    latestDate: formatDateStr(sorted[count - 1]?.observedAt),
  };
}

// Format numbers nicely
const formatNumber = (num, decimals = 2) => {
  if (num === null || num === undefined || isNaN(num)) return '0.00';
  return Number(num).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

// ─── Main Component ───────────────────────────────────────────────────────────

export function MarketDashboard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // ── Tab Navigation ──
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'freight' | 'fuel' | 'commodity' | 'economic' | 'analysis'

  // ── Raw Data Stores ──
  const [rawFreight, setRawFreight] = useState([]);
  const [rawFuel, setRawFuel] = useState([]);
  const [rawCommodity, setRawCommodity] = useState([]);
  const [rawEconomic, setRawEconomic] = useState([]);
  const [ports, setPorts] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [selectedCargoId, setSelectedCargoId] = useState(searchParams.get('cargoId') || '');
  const [marketAlerts, setMarketAlerts] = useState([]);

  // ── Loading & Refreshing States ──
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(new Date());

  // ── Global Date Range Preset Filter ──
  const [selectedPreset, setSelectedPreset] = useState('ALL');

  // ── Freight Filters ──
  const [freightFilters, setFreightFilters] = useState({
    startDate: '',
    endDate: '',
    originPortId: searchParams.get('origin') || 'ALL',
    destinationPortId: searchParams.get('dest') || 'ALL',
    vesselType: searchParams.get('vessel') || 'ALL',
  });

  // ── Fuel Filters ──
  const [fuelFilters, setFuelFilters] = useState({
    startDate: '',
    endDate: '',
    fuelType: 'ALL',
    region: 'ALL',
  });

  // ── Commodity Filters ──
  const [commodityFilters, setCommodityFilters] = useState({
    startDate: '',
    endDate: '',
    commodity: searchParams.get('commodity') || 'ALL',
    market: 'ALL',
  });

  // ── Economic Filters ──
  const [economicFilters, setEconomicFilters] = useState({
    startDate: '',
    endDate: '',
    indicatorName: 'ALL',
  });

  // ── Fetch All Initial Data ──
  const loadMarketData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [fData, fuelData, cData, eData, portList, cargoList, alertList] = await Promise.all([
        getFreightMarketData().catch(() => []),
        getFuelMarketData().catch(() => []),
        getCommodityMarketData().catch(() => []),
        getEconomicMarketData().catch(() => []),
        getPorts().catch(() => []),
        getCargoList().catch(() => []),
        getAlerts().catch(() => []),
      ]);

      setRawFreight(Array.isArray(fData) ? fData : []);
      setRawFuel(Array.isArray(fuelData) ? fuelData : []);
      setRawCommodity(Array.isArray(cData) ? cData : []);
      setRawEconomic(Array.isArray(eData) ? eData : []);
      setPorts(Array.isArray(portList) ? portList : []);
      setCargos(Array.isArray(cargoList) ? cargoList : []);

      if (Array.isArray(alertList)) {
        const mAlerts = alertList.filter((a) =>
          a.category === 'MARKET' || String(a.title || '').toUpperCase().includes('MARKET') || String(a.title || '').toUpperCase().includes('FREIGHT')
        );
        setMarketAlerts(mAlerts);
      }

      setLastRefreshedAt(new Date());
    } catch (err) {
      console.error('Failed to load market intelligence data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMarketData();
  }, [loadMarketData]);

  // Sync filters when selectedCargoId changes
  useEffect(() => {
    if (!selectedCargoId || cargos.length === 0) return;
    const found = cargos.find((c) => c.id === selectedCargoId);
    if (found) {
      const originId = found.originPort?.id || found.originPortId || 'ALL';
      const destId = found.destinationPort?.id || found.destinationPortId || 'ALL';

      setFreightFilters((prev) => ({
        ...prev,
        originPortId: originId,
        destinationPortId: destId,
      }));

      // Match commodity filter
      const typeStr = String(found.cargoType || '').toUpperCase().replace('_', ' ');
      if (typeStr.includes('IRON')) {
        setCommodityFilters((prev) => ({ ...prev, commodity: 'IRON ORE' }));
      } else if (typeStr.includes('COAL')) {
        setCommodityFilters((prev) => ({ ...prev, commodity: 'COAL' }));
      } else if (typeStr.includes('GRAIN')) {
        setCommodityFilters((prev) => ({ ...prev, commodity: 'GRAIN' }));
      } else if (typeStr.includes('BAUXITE')) {
        setCommodityFilters((prev) => ({ ...prev, commodity: 'BAUXITE' }));
      }
    }
  }, [selectedCargoId, cargos]);

  const handleSelectCargo = (cargoId) => {
    setSelectedCargoId(cargoId);
    if (!cargoId) {
      setFreightFilters((prev) => ({
        ...prev,
        originPortId: 'ALL',
        destinationPortId: 'ALL',
      }));
      setCommodityFilters((prev) => ({
        ...prev,
        commodity: 'ALL',
      }));
    }
  };

  // Handle Date Preset Click across all sectors
  const applyDatePreset = (preset) => {
    setSelectedPreset(preset.label);
    if (!preset.days) {
      // Clear custom dates
      setFreightFilters((prev) => ({ ...prev, startDate: '', endDate: '' }));
      setFuelFilters((prev) => ({ ...prev, startDate: '', endDate: '' }));
      setCommodityFilters((prev) => ({ ...prev, startDate: '', endDate: '' }));
      setEconomicFilters((prev) => ({ ...prev, startDate: '', endDate: '' }));
      return;
    }

    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - preset.days);

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    setFreightFilters((prev) => ({ ...prev, startDate: startStr, endDate: endStr }));
    setFuelFilters((prev) => ({ ...prev, startDate: startStr, endDate: endStr }));
    setCommodityFilters((prev) => ({ ...prev, startDate: startStr, endDate: endStr }));
    setEconomicFilters((prev) => ({ ...prev, startDate: startStr, endDate: endStr }));
  };

  // ── Filtered Data Pipelines ──

  // 1. Filtered Freight
  const filteredFreight = useMemo(() => {
    return rawFreight.filter((item) => {
      const obsDate = new Date(item.observedAt);
      if (freightFilters.startDate) {
        if (obsDate < new Date(`${freightFilters.startDate}T00:00:00`)) return false;
      }
      if (freightFilters.endDate) {
        if (obsDate > new Date(`${freightFilters.endDate}T23:59:59`)) return false;
      }
      if (freightFilters.originPortId !== 'ALL' && item.originPortId !== freightFilters.originPortId) {
        return false;
      }
      if (freightFilters.destinationPortId !== 'ALL' && item.destinationPortId !== freightFilters.destinationPortId) {
        return false;
      }
      if (
        freightFilters.vesselType !== 'ALL' &&
        item.vesselType?.toUpperCase() !== freightFilters.vesselType?.toUpperCase()
      ) {
        return false;
      }
      return true;
    });
  }, [rawFreight, freightFilters]);

  // 2. Filtered Fuel
  const filteredFuel = useMemo(() => {
    return rawFuel.filter((item) => {
      const obsDate = new Date(item.observedAt);
      if (fuelFilters.startDate) {
        if (obsDate < new Date(`${fuelFilters.startDate}T00:00:00`)) return false;
      }
      if (fuelFilters.endDate) {
        if (obsDate > new Date(`${fuelFilters.endDate}T23:59:59`)) return false;
      }
      if (
        fuelFilters.fuelType !== 'ALL' &&
        item.fuelType?.toUpperCase() !== fuelFilters.fuelType?.toUpperCase()
      ) {
        return false;
      }
      if (
        fuelFilters.region !== 'ALL' &&
        !item.region?.toLowerCase().includes(fuelFilters.region.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [rawFuel, fuelFilters]);

  // 3. Filtered Commodity
  const filteredCommodity = useMemo(() => {
    return rawCommodity.filter((item) => {
      const obsDate = new Date(item.observedAt);
      if (commodityFilters.startDate) {
        if (obsDate < new Date(`${commodityFilters.startDate}T00:00:00`)) return false;
      }
      if (commodityFilters.endDate) {
        if (obsDate > new Date(`${commodityFilters.endDate}T23:59:59`)) return false;
      }
      if (
        commodityFilters.commodity !== 'ALL' &&
        !item.commodity?.toUpperCase().includes(commodityFilters.commodity.replace('_', ' ').toUpperCase())
      ) {
        return false;
      }
      if (
        commodityFilters.market !== 'ALL' &&
        !item.market?.toLowerCase().includes(commodityFilters.market.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [rawCommodity, commodityFilters]);

  // 4. Filtered Economic
  const filteredEconomic = useMemo(() => {
    return rawEconomic.filter((item) => {
      const obsDate = new Date(item.observedAt);
      if (economicFilters.startDate) {
        if (obsDate < new Date(`${economicFilters.startDate}T00:00:00`)) return false;
      }
      if (economicFilters.endDate) {
        if (obsDate > new Date(`${economicFilters.endDate}T23:59:59`)) return false;
      }
      if (
        economicFilters.indicatorName !== 'ALL' &&
        !item.indicatorName?.toUpperCase().includes(economicFilters.indicatorName.toUpperCase())
      ) {
        return false;
      }
      return true;
    });
  }, [rawEconomic, economicFilters]);

  // ── Compute Real Statistical Metrics ──
  const freightStats = useMemo(() => computeSectorStats(filteredFreight, 'rateValue'), [filteredFreight]);
  const fuelStats = useMemo(() => computeSectorStats(filteredFuel, 'price'), [filteredFuel]);
  const commodityStats = useMemo(() => computeSectorStats(filteredCommodity, 'price'), [filteredCommodity]);
  const economicStats = useMemo(() => computeSectorStats(filteredEconomic, 'value'), [filteredEconomic]);

  // Transform records into chart time series
  const transformToChartData = (records, valKey) => {
    return [...records]
      .sort((a, b) => new Date(a.observedAt) - new Date(b.observedAt))
      .map((r) => {
        const d = new Date(r.observedAt);
        return {
          rawDate: r.observedAt,
          displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          fullDate: d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          value: Number(Number(r[valKey]).toFixed(2)),
          currency: r.currency || 'USD',
          unit: r.rateUnit || r.unit || 'MT',
          source: r.source || 'FEED',
        };
      });
  };

  const chartFreight = useMemo(() => transformToChartData(filteredFreight, 'rateValue'), [filteredFreight]);
  const chartFuel = useMemo(() => transformToChartData(filteredFuel, 'price'), [filteredFuel]);
  const chartCommodity = useMemo(() => transformToChartData(filteredCommodity, 'price'), [filteredCommodity]);
  const chartEconomic = useMemo(() => transformToChartData(filteredEconomic, 'value'), [filteredEconomic]);

  // Port Map Lookup
  const portMap = useMemo(() => {
    const map = {};
    ports.forEach((p) => {
      map[p.id] = p.name;
    });
    return map;
  }, [ports]);

  // Count active filters for badge display
  const activeFreightFilterCount = [
    freightFilters.startDate,
    freightFilters.endDate,
    freightFilters.originPortId !== 'ALL' ? 'origin' : null,
    freightFilters.destinationPortId !== 'ALL' ? 'dest' : null,
    freightFilters.vesselType !== 'ALL' ? 'vessel' : null,
  ].filter(Boolean).length;

  const activeFuelFilterCount = [
    fuelFilters.startDate,
    fuelFilters.endDate,
    fuelFilters.fuelType !== 'ALL' ? 'type' : null,
    fuelFilters.region !== 'ALL' ? 'region' : null,
  ].filter(Boolean).length;

  const activeCommodityFilterCount = [
    commodityFilters.startDate,
    commodityFilters.endDate,
    commodityFilters.commodity !== 'ALL' ? 'commodity' : null,
    commodityFilters.market !== 'ALL' ? 'market' : null,
  ].filter(Boolean).length;

  const activeEconomicFilterCount = [
    economicFilters.startDate,
    economicFilters.endDate,
    economicFilters.indicatorName !== 'ALL' ? 'indicator' : null,
  ].filter(Boolean).length;

  // ── Render Loading State ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] w-full gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-[var(--color-brand-border-strong)] border-t-[var(--color-gov-navy)]" />
        <span className="text-xs uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
          Connecting to Global Market Data Feeds...
        </span>
      </div>
    );
  }

  return (
    <div className="market-dashboard flex flex-col h-full bg-[var(--color-brand-background)] text-[var(--color-brand-text-primary)] p-6 gap-6 font-sans">
      {/* ── TOP HEADER & CONTROLS ───────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--color-brand-border)]/[0.06] pb-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-[#f97316]" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-wider text-[var(--color-brand-text-primary)]">MARKET INTELLIGENCE</h1>
              <Badge variant="outline" className="border-[var(--color-brand-border)] bg-[var(--color-brand-inset)] text-[var(--color-status-success)] text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                LIVE STREAM
              </Badge>
            </div>
            <p className="text-xs uppercase tracking-[0.15em] text-[var(--color-brand-text-secondary)] mt-0.5">
              Multi-Sector Freight, Bunker Fuel, Commodity & Macroeconomic Analytics
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Date Range Presets */}
          <div className="flex items-center bg-[var(--color-brand-elevated)] border border-[var(--color-brand-border)] rounded-xl p-1">
            {DATE_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyDatePreset(p)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  selectedPreset === p.label
                    ? 'bg-[var(--color-gov-saffron)] text-[var(--color-brand-text-primary)] shadow-md'
                    : 'text-[var(--color-brand-text-secondary)] hover:text-[var(--color-brand-text-primary)] hover:bg-slate-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Refresh Action */}
          <Button
            onClick={() => loadMarketData(true)}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 border-[var(--color-brand-border)] hover:border-[var(--color-brand-border-strong)]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'SYNCING...' : 'REFRESH'}
          </Button>
        </div>
      </div>

      {/* ── CARGO INTEGRATION & ACTIVE SELECTION BAR ────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-[var(--color-gov-saffron)] font-bold uppercase tracking-wider">
            <Package className="w-4 h-4" /> LINK WITH CARGO REQUEST:
          </div>

          <select
            value={selectedCargoId}
            onChange={(e) => handleSelectCargo(e.target.value)}
            className="bg-[var(--color-brand-elevated)] border border-[var(--color-brand-border)] rounded-xl px-3 py-1.5 text-xs text-[var(--color-brand-text-primary)] outline-none max-w-xs"
          >
            <option value="">-- All Market Data (No Cargo Filter) --</option>
            {cargos.map((c) => {
              const oName = c.originPort?.name || c.originPortId || 'Origin';
              const dName = c.destinationPort?.name || c.destinationPortId || 'Dest';
              return (
                <option key={c.id} value={c.id}>
                  {oName} ➔ {dName} ({Number(c.quantityMt || 0).toLocaleString()} MT {c.cargoType || 'BULK'})
                </option>
              );
            })}
          </select>
        </div>

        {selectedCargoId && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-orange-500/15 text-[var(--color-gov-saffron)] border-orange-500/30 text-[11px]">
              FILTERS SYNCED TO CARGO
            </Badge>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/cargo/${selectedCargoId}`)}
              className="text-[11px] border-blue-500/30 text-[var(--color-status-info)] hover:bg-blue-500/10 flex items-center gap-1 py-1 h-7"
            >
              Open Workspace <ExternalLink className="w-3 h-3" />
            </Button>

            <button
              onClick={() => handleSelectCargo('')}
              className="text-[var(--color-brand-text-muted)] hover:text-[var(--color-brand-text-primary)] text-[11px] underline ml-1 cursor-pointer"
            >
              Clear Filter
            </button>
          </div>
        )}
      </div>

      {/* ── MARKET ALERTS TICKER STRIP ──────────────────────────────────── */}
      {marketAlerts.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[var(--color-status-warning)] text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 animate-pulse flex-shrink-0" />
            <span>
              <strong>{marketAlerts.length} Market Volatility & Rate Anomalies Detected:</strong> {marketAlerts[0]?.title || 'Freight rate deviation detected'}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/alerts')}
            className="text-[11px] border-amber-500/40 text-[var(--color-status-warning)] hover:bg-amber-100 py-0.5 h-6 flex-shrink-0"
          >
            View Alerts Feed ➔
          </Button>
        </div>
      )}

      {/* ── NAVIGATION TABS ────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--color-brand-border)]/[0.04] pb-3">
        {[
          { id: 'overview', label: 'EXECUTIVE OVERVIEW', icon: Layers, count: null },
          { id: 'advanced', label: 'ADVANCED ANALYTICS', icon: Scale, count: null },
          { id: 'freight', label: 'FREIGHT RATES', icon: Ship, count: activeFreightFilterCount },
          { id: 'fuel', label: 'BUNKER FUEL', icon: Fuel, count: activeFuelFilterCount },
          { id: 'commodity', label: 'COMMODITIES', icon: BarChart3, count: activeCommodityFilterCount },
          { id: 'economic', label: 'MACRO INDICATORS', icon: Globe, count: activeEconomicFilterCount },
          { id: 'analysis', label: 'PRICE TREND ANALYSIS', icon: Sparkles, count: null },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                isActive
                  ? 'bg-orange-500/15 border border-orange-500/40 text-[var(--color-gov-saffron)] shadow-sm'
                  : 'bg-[var(--color-brand-elevated)] border border-[var(--color-brand-border)] text-[var(--color-brand-text-secondary)] hover:text-[var(--color-brand-text-primary)] hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--color-gov-saffron)]' : 'text-[var(--color-brand-text-muted)]'}`} />
              {tab.label}
              {tab.count > 0 && (
                <span className="w-5 h-5 rounded-full bg-[var(--color-gov-saffron)] text-[var(--color-brand-text-primary)] text-[11px] flex items-center justify-center font-bold">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: EXECUTIVE OVERVIEW ──────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 4 Multi-Sector Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Freight Overview Card */}
            <SectorOverviewCard
              title="FREIGHT MARKET"
              icon={Ship}
              value={`$${formatNumber(freightStats.latest)}`}
              unit="USD / MT"
              stats={freightStats}
              color="#3b82f6"
              gradientId="gradFreight"
              chartData={chartFreight}
              onInspect={() => setActiveTab('freight')}
            />

            {/* Bunker Fuel Overview Card */}
            <SectorOverviewCard
              title="BUNKER FUEL (VLSFO)"
              icon={Fuel}
              value={`$${formatNumber(fuelStats.latest)}`}
              unit="USD / MT"
              stats={fuelStats}
              color="#f59e0b"
              gradientId="gradFuel"
              chartData={chartFuel}
              onInspect={() => setActiveTab('fuel')}
            />

            {/* Commodity Overview Card */}
            <SectorOverviewCard
              title="COMMODITIES (IRON ORE)"
              icon={BarChart3}
              value={`$${formatNumber(commodityStats.latest)}`}
              unit="USD / MT"
              stats={commodityStats}
              color="#10b981"
              gradientId="gradComm"
              chartData={chartCommodity}
              onInspect={() => setActiveTab('commodity')}
            />

            {/* Economic Indicators Overview Card */}
            <SectorOverviewCard
              title="BALTIC / MACRO INDEX"
              icon={Globe}
              value={`${formatNumber(economicStats.latest, 1)}`}
              unit="POINTS"
              stats={economicStats}
              color="#a855f7"
              gradientId="gradEcon"
              chartData={chartEconomic}
              onInspect={() => setActiveTab('economic')}
            />
          </div>

          {/* Quick Cross-Sector Combined Price Trend Snapshot */}
          <Card className="bg-[var(--color-brand-elevated)] border-[var(--color-brand-border)]/[0.06] rounded-2xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--color-brand-text-primary)] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[var(--color-gov-saffron)]" />
                  REAL-TIME CROSS-MARKET VOLATILITY & TREND SUMMARY
                </h3>
                <p className="text-xs text-[var(--color-brand-text-secondary)] mt-1">
                  Dynamically evaluated metrics calculated across all active records
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('analysis')}
                className="text-[var(--color-gov-saffron)] border-orange-500/30 hover:bg-orange-500/10"
              >
                Open Full Trend Analysis <Eye className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)]">
                <span className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
                  Freight Volatility
                </span>
                <div className="text-xl font-bold text-[var(--color-status-info)] mt-1">
                  {formatNumber(freightStats.volatilityPct, 1)}%
                </div>
                <div className="text-[11px] text-[var(--color-brand-text-secondary)] mt-1">
                  Spread: ${formatNumber(freightStats.range)}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)]">
                <span className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
                  Fuel Volatility
                </span>
                <div className="text-xl font-bold text-[var(--color-status-warning)] mt-1">
                  {formatNumber(fuelStats.volatilityPct, 1)}%
                </div>
                <div className="text-[11px] text-[var(--color-brand-text-secondary)] mt-1">
                  Spread: ${formatNumber(fuelStats.range)}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)]">
                <span className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
                  Commodity Volatility
                </span>
                <div className="text-xl font-bold text-[var(--color-status-success)] mt-1">
                  {formatNumber(commodityStats.volatilityPct, 1)}%
                </div>
                <div className="text-[11px] text-[var(--color-brand-text-secondary)] mt-1">
                  Spread: ${formatNumber(commodityStats.range)}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)]">
                <span className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
                  Macro Momentum
                </span>
                <div className="text-xl font-bold text-[var(--color-gov-navy)] mt-1">
                  {economicStats.trendDirection === 'UP' ? 'EXPANSIONARY' : 'STABLE'}
                </div>
                <div className="text-[11px] text-[var(--color-brand-text-secondary)] mt-1">
                  Index Mean: {formatNumber(economicStats.avg, 1)}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── TAB 2: FREIGHT RATES DEEP DIVE ─────────────────────────────── */}
      {activeTab === 'freight' && (
        <div className="space-y-6">
          {/* Freight Filters Panel */}
          <Card className="bg-[var(--color-brand-elevated)] border-[var(--color-brand-border)]/[0.06] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4 border-b border-[var(--color-brand-border)] pb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[var(--color-status-info)]" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-brand-text-primary)]">
                  FREIGHT MARKET FILTERS
                </h3>
              </div>
              <button
                onClick={() =>
                  setFreightFilters({
                    startDate: '',
                    endDate: '',
                    originPortId: 'ALL',
                    destinationPortId: 'ALL',
                    vesselType: 'ALL',
                  })
                }
                className="text-[11px] uppercase tracking-wider text-[var(--color-brand-text-muted)] hover:text-[var(--color-brand-text-primary)] flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Reset Filters
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Start Date */}
              <div>
                <label className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] block mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={freightFilters.startDate}
                  onChange={(e) => setFreightFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="w-full bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-brand-text-primary)] focus:outline-none focus:border-[var(--color-gov-navy)]"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] block mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={freightFilters.endDate}
                  onChange={(e) => setFreightFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="w-full bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-brand-text-primary)] focus:outline-none focus:border-[var(--color-gov-navy)]"
                />
              </div>

              {/* Origin Port */}
              <div>
                <label className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] block mb-1">
                  Origin Port
                </label>
                <select
                  value={freightFilters.originPortId}
                  onChange={(e) => setFreightFilters((prev) => ({ ...prev, originPortId: e.target.value }))}
                  className="w-full bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-brand-text-primary)] focus:outline-none focus:border-[var(--color-gov-navy)]"
                >
                  <option value="ALL">All Origin Ports</option>
                  {ports.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.country})
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination Port */}
              <div>
                <label className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] block mb-1">
                  Destination Port
                </label>
                <select
                  value={freightFilters.destinationPortId}
                  onChange={(e) =>
                    setFreightFilters((prev) => ({ ...prev, destinationPortId: e.target.value }))
                  }
                  className="w-full bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-brand-text-primary)] focus:outline-none focus:border-[var(--color-gov-navy)]"
                >
                  <option value="ALL">All Destination Ports</option>
                  {ports.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.country})
                    </option>
                  ))}
                </select>
              </div>

              {/* Vessel Type */}
              <div>
                <label className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] block mb-1">
                  Vessel Type
                </label>
                <select
                  value={freightFilters.vesselType}
                  onChange={(e) => setFreightFilters((prev) => ({ ...prev, vesselType: e.target.value }))}
                  className="w-full bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-brand-text-primary)] focus:outline-none focus:border-[var(--color-gov-navy)]"
                >
                  {VESSEL_TYPES.map((v) => (
                    <option key={v.value} value={v.value}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Freight Real-time Stats Cards */}
          <SectorStatCards stats={freightStats} unit="$/MT" themeColor="text-[var(--color-status-info)]" />

          {/* Freight Interactive Chart */}
          <SectorDetailChart
            title="FREIGHT SPOT RATE TIME SERIES"
            chartData={chartFreight}
            color="#3b82f6"
            gradientId="chartFreightBig"
            unit="USD/MT"
            stats={freightStats}
          />

          {/* Raw Freight Observations Table */}
          <DataTableSection
            title="FREIGHT RATE OBSERVATION RECORDS"
            records={filteredFreight}
            columns={[
              { header: 'Observed Date', render: (r) => new Date(r.observedAt).toLocaleString() },
              { header: 'Origin Port', render: (r) => portMap[r.originPortId] || r.originPortId || 'N/A' },
              { header: 'Destination Port', render: (r) => portMap[r.destinationPortId] || r.destinationPortId || 'N/A' },
              { header: 'Vessel Type', render: (r) => r.vesselType || 'BULK_CARRIER' },
              {
                header: 'Spot Rate',
                render: (r) => (
                  <span className="font-bold text-[var(--color-brand-text-primary)]">
                    ${formatNumber(r.rateValue)} {r.rateUnit || 'USD/MT'}
                  </span>
                ),
              },
              { header: 'Source', render: (r) => r.source || 'FEED' },
            ]}
          />
        </div>
      )}

      {/* ── TAB 3: BUNKER FUEL DEEP DIVE ───────────────────────────────── */}
      {activeTab === 'fuel' && (
        <div className="space-y-6">
          {/* Fuel Filters Panel */}
          <Card className="bg-[var(--color-brand-elevated)] border-[var(--color-brand-border)]/[0.06] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4 border-b border-[var(--color-brand-border)] pb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[var(--color-status-warning)]" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-brand-text-primary)]">
                  BUNKER FUEL MARKET FILTERS
                </h3>
              </div>
              <button
                onClick={() =>
                  setFuelFilters({
                    startDate: '',
                    endDate: '',
                    fuelType: 'ALL',
                    region: 'ALL',
                  })
                }
                className="text-[11px] uppercase tracking-wider text-[var(--color-brand-text-muted)] hover:text-[var(--color-brand-text-primary)] flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Reset Filters
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] block mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={fuelFilters.startDate}
                  onChange={(e) => setFuelFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="w-full bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-brand-text-primary)] focus:outline-none focus:border-[var(--color-gov-navy)]"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] block mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={fuelFilters.endDate}
                  onChange={(e) => setFuelFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="w-full bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-brand-text-primary)] focus:outline-none focus:border-[var(--color-gov-navy)]"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] block mb-1">
                  Fuel Type
                </label>
                <select
                  value={fuelFilters.fuelType}
                  onChange={(e) => setFuelFilters((prev) => ({ ...prev, fuelType: e.target.value }))}
                  className="w-full bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-brand-text-primary)] focus:outline-none focus:border-[var(--color-gov-navy)]"
                >
                  {FUEL_TYPES.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] block mb-1">
                  Bunkering Region / Hub
                </label>
                <select
                  value={fuelFilters.region}
                  onChange={(e) => setFuelFilters((prev) => ({ ...prev, region: e.target.value }))}
                  className="w-full bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-brand-text-primary)] focus:outline-none focus:border-[var(--color-gov-navy)]"
                >
                  {FUEL_REGIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Fuel Stats Cards */}
          <SectorStatCards stats={fuelStats} unit="$/MT" themeColor="text-[var(--color-status-warning)]" />

          {/* Fuel Chart */}
          <SectorDetailChart
            title="BUNKER FUEL PRICE HISTORICAL TREND"
            chartData={chartFuel}
            color="#f59e0b"
            gradientId="chartFuelBig"
            unit="USD/MT"
            stats={fuelStats}
          />

          {/* Fuel Records Table */}
          <DataTableSection
            title="BUNKER FUEL OBSERVATIONS"
            records={filteredFuel}
            columns={[
              { header: 'Observed Date', render: (r) => new Date(r.observedAt).toLocaleString() },
              { header: 'Fuel Type', render: (r) => r.fuelType || 'VLSFO' },
              { header: 'Region / Port', render: (r) => r.region || 'Singapore' },
              {
                header: 'Price (USD/MT)',
                render: (r) => (
                  <span className="font-bold text-[var(--color-brand-text-primary)]">${formatNumber(r.price)}</span>
                ),
              },
              { header: 'Currency', render: (r) => r.currency || 'USD' },
              { header: 'Source', render: (r) => r.source || 'PLATTS' },
            ]}
          />
        </div>
      )}

      {/* ── TAB 4: COMMODITY DEEP DIVE ─────────────────────────────────── */}
      {activeTab === 'commodity' && (
        <div className="space-y-6">
          {/* Commodity Filters Panel */}
          <Card className="bg-[var(--color-brand-elevated)] border-[var(--color-brand-border)]/[0.06] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4 border-b border-[var(--color-brand-border)] pb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[var(--color-status-success)]" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-brand-text-primary)]">
                  DRY BULK COMMODITY FILTERS
                </h3>
              </div>
              <button
                onClick={() =>
                  setCommodityFilters({
                    startDate: '',
                    endDate: '',
                    commodity: 'ALL',
                    market: 'ALL',
                  })
                }
                className="text-[11px] uppercase tracking-wider text-[var(--color-brand-text-muted)] hover:text-[var(--color-brand-text-primary)] flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Reset Filters
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] block mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={commodityFilters.startDate}
                  onChange={(e) => setCommodityFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="w-full bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-brand-text-primary)] focus:outline-none focus:border-[var(--color-gov-navy)]"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] block mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={commodityFilters.endDate}
                  onChange={(e) => setCommodityFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="w-full bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-brand-text-primary)] focus:outline-none focus:border-[var(--color-gov-navy)]"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] block mb-1">
                  Commodity
                </label>
                <select
                  value={commodityFilters.commodity}
                  onChange={(e) => setCommodityFilters((prev) => ({ ...prev, commodity: e.target.value }))}
                  className="w-full bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-brand-text-primary)] focus:outline-none focus:border-[var(--color-gov-navy)]"
                >
                  {COMMODITIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] block mb-1">
                  Trading Hub / Market
                </label>
                <select
                  value={commodityFilters.market}
                  onChange={(e) => setCommodityFilters((prev) => ({ ...prev, market: e.target.value }))}
                  className="w-full bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-brand-text-primary)] focus:outline-none focus:border-[var(--color-gov-navy)]"
                >
                  {COMMODITY_MARKETS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Commodity Stats */}
          <SectorStatCards stats={commodityStats} unit="$/MT" themeColor="text-[var(--color-status-success)]" />

          {/* Commodity Chart */}
          <SectorDetailChart
            title="DRY BULK COMMODITY SPOT PRICE HISTORY"
            chartData={chartCommodity}
            color="#10b981"
            gradientId="chartCommBig"
            unit="USD/MT"
            stats={commodityStats}
          />

          {/* Commodity Table */}
          <DataTableSection
            title="COMMODITY SPOT PRICE RECORDS"
            records={filteredCommodity}
            columns={[
              { header: 'Observed Date', render: (r) => new Date(r.observedAt).toLocaleString() },
              { header: 'Commodity', render: (r) => r.commodity || 'IRON ORE' },
              { header: 'Trading Market', render: (r) => r.market || 'Qingdao' },
              {
                header: 'Price',
                render: (r) => (
                  <span className="font-bold text-[var(--color-brand-text-primary)]">
                    ${formatNumber(r.price)} {r.currency || 'USD'}
                  </span>
                ),
              },
              { header: 'Source', render: (r) => r.source || 'MARKET' },
            ]}
          />
        </div>
      )}

      {/* ── TAB 5: MACRO & ECONOMIC DEEP DIVE ──────────────────────────── */}
      {activeTab === 'economic' && (
        <div className="space-y-6">
          {/* Economic Filters Panel */}
          <Card className="bg-[var(--color-brand-elevated)] border-[var(--color-brand-border)]/[0.06] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4 border-b border-[var(--color-brand-border)] pb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[var(--color-gov-navy)]" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-brand-text-primary)]">
                  ECONOMIC & BALTIC INDEX FILTERS
                </h3>
              </div>
              <button
                onClick={() =>
                  setEconomicFilters({
                    startDate: '',
                    endDate: '',
                    indicatorName: 'ALL',
                  })
                }
                className="text-[11px] uppercase tracking-wider text-[var(--color-brand-text-muted)] hover:text-[var(--color-brand-text-primary)] flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Reset Filters
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] block mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={economicFilters.startDate}
                  onChange={(e) => setEconomicFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="w-full bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-brand-text-primary)] focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] block mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={economicFilters.endDate}
                  onChange={(e) => setEconomicFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="w-full bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-brand-text-primary)] focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] block mb-1">
                  Economic Indicator / Index
                </label>
                <select
                  value={economicFilters.indicatorName}
                  onChange={(e) => setEconomicFilters((prev) => ({ ...prev, indicatorName: e.target.value }))}
                  className="w-full bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-brand-text-primary)] focus:outline-none focus:border-purple-500"
                >
                  {ECONOMIC_INDICATORS.map((ind) => (
                    <option key={ind.value} value={ind.value}>
                      {ind.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Economic Stats */}
          <SectorStatCards stats={economicStats} unit="pts" themeColor="text-[var(--color-gov-navy)]" />

          {/* Economic Chart */}
          <SectorDetailChart
            title="MACROECONOMIC & SHIPPING INDEX TRENDS"
            chartData={chartEconomic}
            color="#a855f7"
            gradientId="chartEconBig"
            unit="Index Pts"
            stats={economicStats}
          />

          {/* Economic Table */}
          <DataTableSection
            title="ECONOMIC INDICATOR OBSERVATIONS"
            records={filteredEconomic}
            columns={[
              { header: 'Observed Date', render: (r) => new Date(r.observedAt).toLocaleString() },
              { header: 'Indicator Name', render: (r) => r.indicatorName || 'PMI' },
              {
                header: 'Value',
                render: (r) => (
                  <span className="font-bold text-[var(--color-brand-text-primary)]">
                    {formatNumber(r.value, 1)} {r.unit || 'Points'}
                  </span>
                ),
              },
              { header: 'Source', render: (r) => r.source || 'BALTIC_EXCHANGE' },
            ]}
          />
        </div>
      )}

      {/* ── TAB 6: PRICE TREND ANALYSIS ────────────────────────────────── */}
      {activeTab === 'analysis' && (
        <div className="space-y-6">
          {/* Executive Analytics Header */}
          <Card className="bg-gradient-to-r from-orange-500/10 via-blue-500/10 to-transparent border-[var(--color-brand-border)]/[0.06] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-5 h-5 text-[var(--color-gov-saffron)]" />
              <h2 className="text-base font-bold uppercase tracking-wider text-[var(--color-brand-text-primary)]">
                INTEGRATED MARITIME PRICE TREND ANALYSIS
              </h2>
            </div>
            <p className="text-xs text-[var(--color-brand-text-secondary)] leading-relaxed max-w-3xl">
              Cross-sectoral analysis examining the cost interplay between ocean freight rates, bunker fuel
              expenditure, underlying mineral commodity values, and macroeconomic Baltic shipping indexes.
            </p>
          </Card>

          {/* Price Trend Scorecard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <TrendAnalysisCard
              title="Freight Rates"
              stats={freightStats}
              color="#3b82f6"
              unit="$/MT"
              category="Logistics Cost"
            />
            <TrendAnalysisCard
              title="Bunker Fuel"
              stats={fuelStats}
              color="#f59e0b"
              unit="$/MT"
              category="Operational Fuel"
            />
            <TrendAnalysisCard
              title="Commodity"
              stats={commodityStats}
              color="#10b981"
              unit="$/MT"
              category="Raw Materials"
            />
            <TrendAnalysisCard
              title="Baltic / Macro"
              stats={economicStats}
              color="#a855f7"
              unit="Index"
              category="Market Sentiment"
            />
          </div>

          {/* Deep Analytics Matrix Table */}
          <Card className="bg-[var(--color-brand-elevated)] border-[var(--color-brand-border)]/[0.06] rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-[var(--color-brand-border)] bg-[var(--color-brand-inset)]">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-brand-text-primary)]">
                CROSS-MARKET STATISTICAL COMPARISON MATRIX
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-brand-border)] text-[var(--color-brand-text-secondary)] uppercase text-[11px]">
                    <th className="p-4">Sector</th>
                    <th className="p-4">Latest Spot</th>
                    <th className="p-4">Period Mean</th>
                    <th className="p-4">Min (Floor)</th>
                    <th className="p-4">Max (Ceiling)</th>
                    <th className="p-4">Price Spread</th>
                    <th className="p-4">Volatility</th>
                    <th className="p-4">Trend Momentum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr className="hover:bg-white/[0.02]">
                    <td className="p-4 font-bold text-[var(--color-status-info)]">Ocean Freight</td>
                    <td className="p-4 font-bold text-[var(--color-brand-text-primary)]">${formatNumber(freightStats.latest)}</td>
                    <td className="p-4 text-[var(--color-brand-text-secondary)]">${formatNumber(freightStats.avg)}</td>
                    <td className="p-4 text-[var(--color-brand-text-muted)]">${formatNumber(freightStats.min)}</td>
                    <td className="p-4 text-[var(--color-brand-text-muted)]">${formatNumber(freightStats.max)}</td>
                    <td className="p-4 text-[var(--color-brand-text-secondary)]">${formatNumber(freightStats.range)}</td>
                    <td className="p-4 font-bold text-[var(--color-status-info)]">{formatNumber(freightStats.volatilityPct, 1)}%</td>
                    <td className="p-4">
                      <TrendBadge direction={freightStats.trendDirection} pct={freightStats.changePct} />
                    </td>
                  </tr>

                  <tr className="hover:bg-white/[0.02]">
                    <td className="p-4 font-bold text-[var(--color-status-warning)]">Bunker Fuel (VLSFO)</td>
                    <td className="p-4 font-bold text-[var(--color-brand-text-primary)]">${formatNumber(fuelStats.latest)}</td>
                    <td className="p-4 text-[var(--color-brand-text-secondary)]">${formatNumber(fuelStats.avg)}</td>
                    <td className="p-4 text-[var(--color-brand-text-muted)]">${formatNumber(fuelStats.min)}</td>
                    <td className="p-4 text-[var(--color-brand-text-muted)]">${formatNumber(fuelStats.max)}</td>
                    <td className="p-4 text-[var(--color-brand-text-secondary)]">${formatNumber(fuelStats.range)}</td>
                    <td className="p-4 font-bold text-[var(--color-status-warning)]">{formatNumber(fuelStats.volatilityPct, 1)}%</td>
                    <td className="p-4">
                      <TrendBadge direction={fuelStats.trendDirection} pct={fuelStats.changePct} />
                    </td>
                  </tr>

                  <tr className="hover:bg-white/[0.02]">
                    <td className="p-4 font-bold text-[var(--color-status-success)]">Iron Ore / Commodity</td>
                    <td className="p-4 font-bold text-[var(--color-brand-text-primary)]">${formatNumber(commodityStats.latest)}</td>
                    <td className="p-4 text-[var(--color-brand-text-secondary)]">${formatNumber(commodityStats.avg)}</td>
                    <td className="p-4 text-[var(--color-brand-text-muted)]">${formatNumber(commodityStats.min)}</td>
                    <td className="p-4 text-[var(--color-brand-text-muted)]">${formatNumber(commodityStats.max)}</td>
                    <td className="p-4 text-[var(--color-brand-text-secondary)]">${formatNumber(commodityStats.range)}</td>
                    <td className="p-4 font-bold text-[var(--color-status-success)]">{formatNumber(commodityStats.volatilityPct, 1)}%</td>
                    <td className="p-4">
                      <TrendBadge direction={commodityStats.trendDirection} pct={commodityStats.changePct} />
                    </td>
                  </tr>

                  <tr className="hover:bg-white/[0.02]">
                    <td className="p-4 font-bold text-[var(--color-gov-navy)]">Baltic Dry / PMI Index</td>
                    <td className="p-4 font-bold text-[var(--color-brand-text-primary)]">{formatNumber(economicStats.latest, 1)}</td>
                    <td className="p-4 text-[var(--color-brand-text-secondary)]">{formatNumber(economicStats.avg, 1)}</td>
                    <td className="p-4 text-[var(--color-brand-text-muted)]">{formatNumber(economicStats.min, 1)}</td>
                    <td className="p-4 text-[var(--color-brand-text-muted)]">{formatNumber(economicStats.max, 1)}</td>
                    <td className="p-4 text-[var(--color-brand-text-secondary)]">{formatNumber(economicStats.range, 1)}</td>
                    <td className="p-4 font-bold text-[var(--color-gov-navy)]">{formatNumber(economicStats.volatilityPct, 1)}%</td>
                    <td className="p-4">
                      <TrendBadge direction={economicStats.trendDirection} pct={economicStats.changePct} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── TAB: ADVANCED ANALYTICS ────────────────────────────────────── */}
      {activeTab === 'advanced' && (
        <AdvancedAnalytics />
      )}

      {/* ── FOOTER STATUS BAR ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-center text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)] border-t border-[var(--color-brand-border)]/[0.04] pt-4">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Active Datasets: Freight ({filteredFreight.length}), Fuel ({filteredFuel.length}), Commodity ({filteredCommodity.length}), Economic ({filteredEconomic.length})</span>
        </div>
        <div className="mt-2 sm:mt-0">
          Last Synced: {lastRefreshedAt.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function SectorOverviewCard({
  title,
  icon: Icon,
  value,
  unit,
  stats,
  color,
  gradientId,
  chartData,
  onInspect,
}) {
  const isUp = stats.trendDirection === 'UP';
  const isDown = stats.trendDirection === 'DOWN';

  return (
    <Card className="flex flex-col h-full bg-[var(--color-brand-elevated)] border border-[var(--color-brand-border)]/[0.06] rounded-2xl hover:border-[var(--color-brand-border-strong)] transition-all group">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-brand-text-secondary)] flex items-center gap-2">
            <Icon className="w-4 h-4" style={{ color }} />
            {title}
          </CardTitle>
          <button
            onClick={onInspect}
            className="text-[11px] text-[var(--color-brand-text-muted)] hover:text-[var(--color-brand-text-primary)] group-hover:text-[var(--color-gov-saffron)] transition-colors uppercase tracking-wider"
          >
            Filters & Table →
          </button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col flex-grow gap-4">
        <div className="flex justify-between items-end">
          <div>
            <span className="text-3xl font-bold text-[var(--color-brand-text-primary)] tracking-tight">{value}</span>
            <span className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-brand-text-secondary)] ml-2">
              {unit}
            </span>
          </div>
          <div
            className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${
              isUp
                ? 'bg-emerald-500/10 text-[var(--color-status-success)]'
                : isDown
                ? 'bg-red-500/10 text-[var(--color-status-error)]'
                : 'bg-gray-500/10 text-[var(--color-brand-text-secondary)]'
            }`}
          >
            {isUp ? (
              <ArrowUp className="w-3.5 h-3.5" />
            ) : isDown ? (
              <ArrowDown className="w-3.5 h-3.5" />
            ) : null}
            {stats.changePct > 0 ? '+' : ''}
            {formatNumber(stats.changePct, 1)}%
          </div>
        </div>

        {/* Chart Sparkline Area */}
        <div className="h-28 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-brand-surface)',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '0.75rem',
                    fontSize: '11px',
                  }}
                  itemStyle={{ color: '#fff', fontFamily: 'monospace' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '10px' }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={`url(#${gradientId})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-[var(--color-brand-text-muted)]">
              No matching observations
            </div>
          )}
        </div>

        {/* Dynamic Computed Stats Grid (NO hardcoding) */}
        <div className="grid grid-cols-3 gap-2 mt-auto">
          <div className="bg-[var(--color-brand-inset)] rounded-xl border border-[var(--color-brand-border)] p-2.5 flex flex-col items-center justify-center text-center">
            <span className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-brand-text-secondary)] mb-0.5">
              AVG
            </span>
            <span className="text-xs font-bold text-[var(--color-brand-text-primary)]">{formatNumber(stats.avg)}</span>
          </div>

          <div className="bg-[var(--color-brand-inset)] rounded-xl border border-[var(--color-brand-border)] p-2.5 flex flex-col items-center justify-center text-center">
            <span className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-brand-text-secondary)] mb-0.5">
              MIN / MAX
            </span>
            <span className="text-xs font-bold text-[var(--color-brand-text-primary)]">
              {formatNumber(stats.min, 0)} - {formatNumber(stats.max, 0)}
            </span>
          </div>

          <div className="bg-[var(--color-brand-inset)] rounded-xl border border-[var(--color-brand-border)] p-2.5 flex flex-col items-center justify-center text-center">
            <span className="text-[11px] uppercase tracking-[0.15em] text-[var(--color-brand-text-secondary)] mb-0.5">
              VOLATILITY
            </span>
            <span className="text-xs font-bold text-[var(--color-gov-saffron)]">
              {formatNumber(stats.volatilityPct, 1)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SectorStatCards({ stats, themeColor }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <div className="p-4 rounded-xl bg-[var(--color-brand-elevated)] border border-[var(--color-brand-border)]">
        <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
          CURRENT / LATEST
        </div>
        <div className={`text-xl font-bold mt-1 ${themeColor}`}>
          ${formatNumber(stats.latest)}
        </div>
        <div className="text-[11px] text-[var(--color-brand-text-secondary)] mt-0.5">
          {stats.latestDate}
        </div>
      </div>

      <div className="p-4 rounded-xl bg-[var(--color-brand-elevated)] border border-[var(--color-brand-border)]">
        <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
          PERIOD AVERAGE
        </div>
        <div className="text-xl font-bold text-[var(--color-brand-text-primary)] mt-1">
          ${formatNumber(stats.avg)}
        </div>
        <div className="text-[11px] text-[var(--color-brand-text-secondary)] mt-0.5">
          {stats.count} data points
        </div>
      </div>

      <div className="p-4 rounded-xl bg-[var(--color-brand-elevated)] border border-[var(--color-brand-border)]">
        <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
          PERIOD MIN (LOW)
        </div>
        <div className="text-xl font-bold text-[var(--color-status-success)] mt-1">
          ${formatNumber(stats.min)}
        </div>
        <div className="text-[11px] text-[var(--color-brand-text-secondary)] mt-0.5">
          {stats.lowDate}
        </div>
      </div>

      <div className="p-4 rounded-xl bg-[var(--color-brand-elevated)] border border-[var(--color-brand-border)]">
        <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
          PERIOD MAX (HIGH)
        </div>
        <div className="text-xl font-bold text-[var(--color-status-error)] mt-1">
          ${formatNumber(stats.max)}
        </div>
        <div className="text-[11px] text-[var(--color-brand-text-secondary)] mt-0.5">
          {stats.highDate}
        </div>
      </div>

      <div className="p-4 rounded-xl bg-[var(--color-brand-elevated)] border border-[var(--color-brand-border)]">
        <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
          PRICE TREND DELTA
        </div>
        <div
          className={`text-xl font-bold mt-1 flex items-center gap-1 ${
            stats.changePct >= 0 ? 'text-[var(--color-status-success)]' : 'text-[var(--color-status-error)]'
          }`}
        >
          {stats.changePct >= 0 ? '+' : ''}
          {formatNumber(stats.changePct, 1)}%
        </div>
        <div className="text-[11px] text-[var(--color-brand-text-secondary)] mt-0.5 uppercase">
          {stats.trendDirection}
        </div>
      </div>

      <div className="p-4 rounded-xl bg-[var(--color-brand-elevated)] border border-[var(--color-brand-border)]">
        <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
          VOLATILITY (σ/μ)
        </div>
        <div className="text-xl font-bold text-[var(--color-gov-saffron)] mt-1">
          {formatNumber(stats.volatilityPct, 1)}%
        </div>
        <div className="text-[11px] text-[var(--color-brand-text-secondary)] mt-0.5">
          Spread: ${formatNumber(stats.range)}
        </div>
      </div>
    </div>
  );
}

function SectorDetailChart({ title, chartData, color, gradientId, unit, stats }) {
  return (
    <Card className="bg-[var(--color-brand-elevated)] border-[var(--color-brand-border)]/[0.06] rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--color-brand-text-primary)]">{title}</h3>
          <p className="text-xs text-[var(--color-brand-text-secondary)] mt-0.5">
            Interactive chart with mean reference threshold (${formatNumber(stats.avg)})
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[var(--color-brand-text-secondary)]">Observation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-gray-400" />
            <span className="text-[var(--color-brand-text-muted)]">Period Mean</span>
          </div>
        </div>
      </div>

      <div className="h-80 w-full">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="displayDate"
                stroke="rgba(255,255,255,0.2)"
                tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
              />
              <YAxis
                stroke="rgba(255,255,255,0.2)"
                tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                domain={['dataMin - 1', 'dataMax + 1']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#191a23',
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '0.75rem',
                  color: '#fff',
                  fontFamily: 'monospace',
                }}
                labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                formatter={(value) => [`$${formatNumber(value)} ${unit}`, 'Rate / Price']}
              />
              <ReferenceLine
                y={stats.avg}
                stroke="#94a3b8"
                strokeDasharray="4 4"
                label={{
                  value: `Mean: $${formatNumber(stats.avg)}`,
                  fill: '#94a3b8',
                  fontSize: 10,
                  position: 'insideTopLeft',
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2.5}
                fillOpacity={1}
                fill={`url(#${gradientId})`}
                dot={{ r: 3, fill: color }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-[var(--color-brand-text-muted)]">
            No observation data matches selected filter criteria.
          </div>
        )}
      </div>
    </Card>
  );
}

function DataTableSection({ title, records, columns }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return records;
    const q = search.toLowerCase();
    return records.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
  }, [records, search]);

  return (
    <Card className="bg-[var(--color-brand-elevated)] border-[var(--color-brand-border)]/[0.06] rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-[var(--color-brand-border)] bg-[var(--color-brand-inset)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TableIcon className="w-4 h-4 text-[var(--color-brand-text-muted)]" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-brand-text-primary)]">{title}</h3>
          <span className="text-[11px] text-[var(--color-brand-text-muted)]">({filtered.length} records)</span>
        </div>
        <input
          type="text"
          placeholder="Filter table rows..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] rounded-xl px-3 py-1.5 text-xs text-[var(--color-brand-text-primary)] placeholder:text-[var(--color-brand-text-muted)] focus:outline-none focus:border-[var(--color-brand-border-strong)] w-full sm:w-60"
        />
      </div>

      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--color-brand-text-muted)]">No matching records found.</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-[var(--color-brand-inset)] border-b border-[var(--color-brand-border)] text-[var(--color-brand-text-secondary)] uppercase text-[11px]">
              <tr>
                {columns.map((c, i) => (
                  <th key={i} className="p-3.5">
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((r, idx) => (
                <tr key={r.id || idx} className="hover:bg-white/[0.03] transition-colors">
                  {columns.map((c, i) => (
                    <td key={i} className="p-3.5 text-[var(--color-brand-text-secondary)]">
                      {c.render(r)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
}

function TrendAnalysisCard({ title, stats, color, unit, category }) {
  return (
    <Card className="bg-[var(--color-brand-elevated)] border-[var(--color-brand-border)]/[0.06] rounded-2xl p-5 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-2">
          <span className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
            {category}
          </span>
          <TrendBadge direction={stats.trendDirection} pct={stats.changePct} />
        </div>
        <h3 className="text-base font-bold text-[var(--color-brand-text-primary)] tracking-wide">{title}</h3>
        <div className="text-2xl font-bold text-[var(--color-brand-text-primary)] mt-2">
          ${formatNumber(stats.latest)} <span className="text-xs text-[var(--color-brand-text-muted)] font-normal">{unit}</span>
        </div>
      </div>

      <div className="space-y-2 mt-5 pt-4 border-t border-[var(--color-brand-border)] text-xs">
        <div className="flex justify-between text-[var(--color-brand-text-muted)]">
          <span>Overall Shift</span>
          <span className={stats.overallChangePct >= 0 ? 'text-[var(--color-status-success)]' : 'text-[var(--color-status-error)]'}>
            {stats.overallChangePct >= 0 ? '+' : ''}
            {formatNumber(stats.overallChangePct, 1)}%
          </span>
        </div>
        <div className="flex justify-between text-[var(--color-brand-text-muted)]">
          <span>Spread (High - Low)</span>
          <span className="text-[var(--color-brand-text-primary)]">${formatNumber(stats.range)}</span>
        </div>
        <div className="flex justify-between text-[var(--color-brand-text-muted)]">
          <span>Volatility Index</span>
          <span style={{ color }}>{formatNumber(stats.volatilityPct, 1)}%</span>
        </div>
      </div>
    </Card>
  );
}

function TrendBadge({ direction, pct }) {
  if (direction === 'UP') {
    return (
      <span className="inline-flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/30 text-[var(--color-status-success)] text-[11px] font-bold px-2 py-0.5 rounded">
        <ArrowUp className="w-3 h-3" /> +{formatNumber(pct, 1)}% UP
      </span>
    );
  }
  if (direction === 'DOWN') {
    return (
      <span className="inline-flex items-center gap-1 bg-red-500/15 border border-red-500/30 text-[var(--color-status-error)] text-[11px] font-bold px-2 py-0.5 rounded">
        <ArrowDown className="w-3 h-3" /> {formatNumber(pct, 1)}% DOWN
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 bg-gray-500/15 border border-gray-500/30 text-[var(--color-brand-text-secondary)] text-[11px] font-bold px-2 py-0.5 rounded">
      STABLE (0.0%)
    </span>
  );
}
