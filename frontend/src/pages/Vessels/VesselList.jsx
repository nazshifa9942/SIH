import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Ship,
  Search,
  Filter,
  ArrowUpDown,
  LayoutGrid,
  List as ListIcon,
  RefreshCw,
  Eye,
  RotateCcw,
  Plus,
  Pencil,
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { getVessels } from '../../api/vessels';
import { VesselDetailModal } from './VesselDetailModal';
import { VesselOperations } from './VesselOperations';
import { VesselTracking } from './VesselTracking';
import { VesselDialog } from './VesselDialog';
import { useAuth } from '../../context/AuthContext';

// ─── Constants ─────────────────────────────────────────────────────────────────

const VESSEL_TYPES = [
  { value: 'ALL', label: 'All Vessel Classes' },
  { value: 'CAPESIZE', label: 'Capesize (100k+ DWT)' },
  { value: 'PANAMAX', label: 'Panamax (65k-100k DWT)' },
  { value: 'SUPRAMAX', label: 'Supramax (50k-65k DWT)' },
  { value: 'HANDYSIZE', label: 'Handysize (10k-40k DWT)' },
  { value: 'BULK_CARRIER', label: 'Bulk Carrier (General)' },
];

const AVAILABILITY_STATUSES = [
  { value: 'ALL', label: 'All Availability Statuses' },
  { value: 'AVAILABLE', label: 'Available (Ready for Charter)' },
  { value: 'IN_TRANSIT', label: 'In Transit / On Voyage' },
  { value: 'CHARTERED', label: 'Chartered' },
  { value: 'MAINTENANCE', label: 'In Maintenance / Drydock' },
];

const CAPACITY_RANGES = [
  { value: 'ALL', label: 'All Capacities' },
  { value: 'UNDER_40K', label: 'Small / Handysize (< 40,000 MT)', min: 0, max: 40000 },
  { value: '40K_70K', label: 'Supramax (40,000 - 70,000 MT)', min: 40000, max: 70000 },
  { value: '70K_100K', label: 'Panamax (70,000 - 100,000 MT)', min: 70000, max: 100000 },
  { value: 'OVER_100K', label: 'Capesize / VLOC (> 100,000 MT)', min: 100000, max: Infinity },
];

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Vessel Name (A → Z)' },
  { value: 'name_desc', label: 'Vessel Name (Z → A)' },
  { value: 'capacity_desc', label: 'Capacity (Highest First)' },
  { value: 'capacity_asc', label: 'Capacity (Lowest First)' },
  { value: 'cost_asc', label: 'Charter Rate (Lowest First)' },
  { value: 'cost_desc', label: 'Charter Rate (Highest First)' },
  { value: 'speed_desc', label: 'Speed (Fastest First)' },
  { value: 'draft_asc', label: 'Draft (Shallowest First)' },
  { value: 'loa_asc', label: 'LOA (Shortest First)' },
];

export const VesselList = () => {
  const [vessels, setVessels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Filters & Search ──
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [capacityFilter, setCapacityFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('capacity_desc');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [activeTab, setActiveTab] = useState('fleet'); // 'fleet' | 'operations'

  const { permissions } = useAuth();
  const [selectedVessel, setSelectedVessel] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVessel, setEditingVessel] = useState(null);

  // ── Fetch Vessels from API ──
  const fetchVessels = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getVessels();
      setVessels(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load fleet vessels:', error);
      setVessels([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchVessels();
  }, [fetchVessels]);

  const getStatusColor = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'AVAILABLE') return 'var(--color-status-success)';
    if (s === 'IN_TRANSIT' || s === 'CHARTERED') return 'var(--color-status-info)';
    if (s === 'MAINTENANCE') return 'var(--color-status-warning)';
    return 'var(--color-brand-text-secondary)';
  };

  const formatNumber = (num, decimals = 0) => {
    if (num === null || num === undefined || isNaN(Number(num))) return 'N/A';
    return Number(num).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  // ── Filter & Sort Logic ──
  const filteredAndSortedVessels = useMemo(() => {
    let list = [...vessels];

    // 1. Text Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (v) =>
          v.name?.toLowerCase().includes(q) ||
          v.vesselType?.toLowerCase().includes(q) ||
          v.type?.toLowerCase().includes(q) ||
          v.availabilityStatus?.toLowerCase().includes(q) ||
          v.status?.toLowerCase().includes(q)
      );
    }

    // 2. Type Filter
    if (typeFilter !== 'ALL') {
      list = list.filter(
        (v) => (v.vesselType || v.type)?.toUpperCase() === typeFilter.toUpperCase()
      );
    }

    // 3. Status Filter
    if (statusFilter !== 'ALL') {
      list = list.filter(
        (v) => (v.availabilityStatus || v.status)?.toUpperCase() === statusFilter.toUpperCase()
      );
    }

    // 4. Capacity Filter
    if (capacityFilter !== 'ALL') {
      const range = CAPACITY_RANGES.find((r) => r.value === capacityFilter);
      if (range) {
        list = list.filter((v) => {
          const cap = Number(v.capacityMt) || 0;
          return cap >= range.min && cap <= range.max;
        });
      }
    }

    // 5. Sorting
    list.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return (a.name || '').localeCompare(b.name || '');
        case 'name_desc':
          return (b.name || '').localeCompare(a.name || '');
        case 'capacity_desc':
          return (Number(b.capacityMt) || 0) - (Number(a.capacityMt) || 0);
        case 'capacity_asc':
          return (Number(a.capacityMt) || 0) - (Number(b.capacityMt) || 0);
        case 'cost_asc':
          return (Number(a.dailyCharterCost) || 0) - (Number(b.dailyCharterCost) || 0);
        case 'cost_desc':
          return (Number(b.dailyCharterCost) || 0) - (Number(a.dailyCharterCost) || 0);
        case 'speed_desc':
          return (Number(b.speedKnots) || 0) - (Number(a.speedKnots) || 0);
        case 'draft_asc':
          return (Number(a.draftM) || 0) - (Number(b.draftM) || 0);
        case 'loa_asc':
          return (Number(a.loaM) || 0) - (Number(b.loaM) || 0);
        default:
          return 0;
      }
    });

    return list;
  }, [vessels, search, typeFilter, statusFilter, capacityFilter, sortBy]);

  // ── Fleet Statistics (Real API values) ──
  const stats = useMemo(() => {
    const totalCount = vessels.length;
    const availableCount = vessels.filter(
      (v) => (v.availabilityStatus || v.status)?.toUpperCase() === 'AVAILABLE'
    ).length;
    const activeCount = vessels.filter((v) =>
      ['IN_TRANSIT', 'CHARTERED'].includes((v.availabilityStatus || v.status)?.toUpperCase())
    ).length;
    const maintenanceCount = vessels.filter(
      (v) => (v.availabilityStatus || v.status)?.toUpperCase() === 'MAINTENANCE'
    ).length;

    const totalCapacity = vessels.reduce((acc, v) => acc + (Number(v.capacityMt) || 0), 0);
    const avgSpeed =
      vessels.reduce((acc, v) => acc + (Number(v.speedKnots) || 0), 0) / (totalCount || 1);
    const avgCharterCost =
      vessels.reduce((acc, v) => acc + (Number(v.dailyCharterCost) || 0), 0) / (totalCount || 1);

    return {
      totalCount,
      availableCount,
      activeCount,
      maintenanceCount,
      totalCapacity,
      avgSpeed,
      avgCharterCost,
    };
  }, [vessels]);

  const handleOpenDetail = (vessel) => {
    setSelectedVessel(vessel);
    setIsModalOpen(true);
  };

  const resetFilters = () => {
    setSearch('');
    setTypeFilter('ALL');
    setStatusFilter('ALL');
    setCapacityFilter('ALL');
    setSortBy('capacity_desc');
  };

  const hasActiveFilters =
    search.trim() !== '' ||
    typeFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    capacityFilter !== 'ALL' ||
    sortBy !== 'capacity_desc';

  return (
    <div className="flex min-h-full flex-col bg-slate-50 text-slate-900 p-4 md:p-6 gap-6 font-sans">
      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 border-l-4 border-l-[#0b2545] p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Ship className="w-6 h-6 text-[var(--color-status-info)]" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-[var(--color-gov-navy)]">Vessel Management</h1>
              <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-800 text-xs">
                {vessels.length} VESSELS REGISTERED
              </Badge>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Fleet specifications, hydrodynamics and charter availability
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Register Vessel Button */}
          {permissions.canCreateVessel && (
            <Button
              onClick={() => {
                setEditingVessel(null);
                setIsDialogOpen(true);
              }}
              size="sm"
              className="bg-blue-500 hover:bg-blue-600 text-[var(--color-brand-text-primary)] flex items-center gap-2 text-xs font-bold"
            >
              <Plus className="w-4 h-4" /> REGISTER VESSEL
            </Button>
          )}

          {activeTab === 'fleet' && (
            <div className="flex items-center bg-slate-100 border border-slate-300 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-[var(--color-gov-navy)] text-white shadow-sm'
                    : 'text-slate-600 hover:text-[var(--color-gov-navy)]'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'table'
                    ? 'bg-[var(--color-gov-navy)] text-white shadow-sm'
                    : 'text-slate-600 hover:text-[var(--color-gov-navy)]'
                }`}
                title="Table View"
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Refresh Action */}
          <Button
            onClick={() => fetchVessels(true)}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 border-slate-300 text-slate-700 hover:border-slate-500"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* ── TAB NAVIGATION ────────────────────────────────────────────── */}
      <div className="flex flex-wrap border-b border-slate-300 gap-6">
        <button
          onClick={() => setActiveTab('fleet')}
          className={`pb-3 text-xs uppercase tracking-widest transition-all relative ${
            activeTab === 'fleet'
              ? 'text-[var(--color-status-info)] font-bold'
              : 'text-slate-700 hover:text-[var(--color-gov-navy)]'
          }`}
        >
          Fleet Specifications & Inventory
          {activeTab === 'fleet' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('operations')}
          className={`pb-3 text-xs uppercase tracking-widest transition-all relative flex items-center gap-2 ${
            activeTab === 'operations'
              ? 'text-[var(--color-status-info)] font-bold'
              : 'text-slate-700 hover:text-[var(--color-gov-navy)]'
          }`}
        >
          Idle & Repositioning Operations
          <Badge className="bg-amber-100 text-[var(--color-status-warning)] border border-amber-500/30 text-[11px]">
            ANALYTICS
          </Badge>
          {activeTab === 'operations' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('tracking')}
          className={`pb-3 text-xs uppercase tracking-widest transition-all relative flex items-center gap-2 ${
            activeTab === 'tracking'
              ? 'text-[var(--color-status-info)] font-bold'
              : 'text-slate-700 hover:text-[var(--color-gov-navy)]'
          }`}
        >
          Live AIS Fleet Tracking
          <Badge className="bg-emerald-100 text-[var(--color-status-success)] border border-emerald-500/30 text-[11px]">
            GIS SATELLITE
          </Badge>
          {activeTab === 'tracking' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />
          )}
        </button>
      </div>

      {activeTab === 'tracking' ? (
        <VesselTracking />
      ) : activeTab === 'operations' ? (
        <VesselOperations />
      ) : (
        <>
          {/* ── FLEET KPI SUMMARY CARDS ───────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs uppercase font-semibold tracking-wider text-slate-600">
            Total Fleet Size
          </div>
          <div className="text-2xl font-bold text-[var(--color-gov-navy)] mt-1">
            {stats.totalCount} <span className="text-sm text-slate-500 font-normal">Ships</span>
          </div>
          <div className="text-xs text-slate-600 mt-1">
            {stats.availableCount} Available now
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs uppercase font-semibold tracking-wider text-slate-600">
            Available for Charter
          </div>
          <div className="text-2xl font-bold text-[var(--color-status-success)] mt-1">
            {stats.availableCount}
          </div>
          <div className="text-xs text-emerald-800 mt-1">
            {stats.totalCount > 0 ? ((stats.availableCount / stats.totalCount) * 100).toFixed(0) : 0}% of fleet ready
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs uppercase font-semibold tracking-wider text-slate-600">
            Active / In-Transit
          </div>
          <div className="text-2xl font-bold text-[var(--color-status-info)] mt-1">
            {stats.activeCount}
          </div>
          <div className="text-xs text-blue-800 mt-1">
            On active voyages
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs uppercase font-semibold tracking-wider text-slate-600">
            Total Fleet Capacity
          </div>
          <div className="text-2xl font-bold text-[var(--color-gov-navy)] mt-1">
            {formatNumber(stats.totalCapacity / 1000, 1)}k <span className="text-sm text-slate-500 font-normal">DWT</span>
          </div>
          <div className="text-xs text-slate-600 mt-1">
            {formatNumber(stats.totalCapacity)} MT Total
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs uppercase font-semibold tracking-wider text-slate-600">
            Avg Daily Charter
          </div>
          <div className="text-2xl font-bold text-[var(--color-status-warning)] mt-1">
            ${formatNumber(stats.avgCharterCost)}
          </div>
          <div className="text-xs text-slate-600 mt-1">
            Avg Speed: {formatNumber(stats.avgSpeed, 1)} kn
          </div>
        </div>
      </div>

      {/* ── FILTER & CONTROLS TOOLBAR ─────────────────────────────────── */}
      <Card className="bg-white border-slate-200 rounded-lg p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-brand-text-secondary)]" />
            <input
              type="text"
              placeholder="Search by vessel name, class, status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-[var(--color-brand-border)] transition-colors"
            />
          </div>

          {/* Filter Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Vessel Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-3 text-sm text-slate-900 focus:outline-none focus:border-[var(--color-brand-border)]"
            >
              {VESSEL_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>

            {/* Availability Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-3 text-sm text-slate-900 focus:outline-none focus:border-[var(--color-brand-border)]"
            >
              {AVAILABILITY_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            {/* Capacity Filter */}
            <select
              value={capacityFilter}
              onChange={(e) => setCapacityFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-3 text-sm text-slate-900 focus:outline-none focus:border-[var(--color-brand-border)]"
            >
              {CAPACITY_RANGES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            {/* Sort Filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-3 py-3">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-600" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-sm text-slate-900 focus:outline-none cursor-pointer"
              >
                {SORT_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value} className="bg-white">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filter Button */}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-100 text-[var(--color-brand-text-muted)] hover:text-[var(--color-brand-text-primary)] transition-colors flex items-center gap-1 text-xs cursor-pointer"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Count & Result Status */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200 text-sm text-slate-600">
          <span>
            Showing <strong className="text-[var(--color-gov-navy)]">{filteredAndSortedVessels.length}</strong> of {vessels.length} vessels
          </span>
          {hasActiveFilters && (
            <span className="text-[var(--color-gov-saffron)] flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filters Applied
            </span>
          )}
        </div>
      </Card>

      {/* ── FLEET DISPLAY (GRID vs TABLE) ─────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] w-full gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
          <span className="text-sm uppercase tracking-wider text-slate-600">
            Loading Fleet Registry...
          </span>
        </div>
      ) : filteredAndSortedVessels.length === 0 ? (
        <Card className="flex-1 flex items-center justify-center min-h-[300px] bg-white border-slate-200 rounded-lg shadow-sm">
          <CardContent className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-[var(--color-brand-border)] flex items-center justify-center mx-auto mb-4">
              <Ship className="h-8 w-8 text-[var(--color-brand-text-muted)]" />
            </div>
            <div className="text-base font-bold text-[var(--color-gov-navy)] mb-1">No vessels found</div>
            <div className="text-sm text-slate-600 mb-4 max-w-sm mx-auto">
              No registered vessels match your search query or filter criteria.
            </div>
            <Button variant="outline" size="sm" onClick={resetFilters}>
              RESET FILTERS
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        /* ── GRID CARD VIEW ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 content-start">
          {filteredAndSortedVessels.map((v) => {
            const status = v.availabilityStatus || v.status || 'AVAILABLE';
            const statusColor = getStatusColor(status);

            return (
              <Card
                key={v.id}
                onClick={() => handleOpenDetail(v)}
                className="bg-white border-slate-200 hover:border-[var(--color-brand-border)]/40 hover:shadow-md transition-all cursor-pointer group rounded-lg flex flex-col justify-between shadow-sm"
              >
                <CardContent className="p-5 flex flex-col h-full justify-between gap-4">
                  {/* Top Vessel Title & Status Badge */}
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-[var(--color-gov-navy)] group-hover:text-blue-700 transition-colors tracking-tight">
                          {v.name}
                        </h3>
                        <span className="text-xs uppercase tracking-wider text-slate-600">
                          {v.vesselType || v.type || 'BULK CARRIER'}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                        style={{
                          borderColor: `${statusColor}40`,
                          backgroundColor: `color-mix(in srgb, ${statusColor} 10%, transparent)`,
                          color: statusColor,
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
                        {status}
                      </Badge>
                    </div>
                  </div>

                  {/* Primary Capacity & Rate Indicators */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="text-xs text-slate-600 uppercase tracking-wider">
                        Deadweight (DWT)
                      </div>
                      <div className="text-base font-bold text-[var(--color-gov-navy)] mt-1">
                        {formatNumber(v.capacityMt)} <span className="text-sm text-slate-500 font-normal">MT</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="text-xs text-slate-600 uppercase tracking-wider">
                        Daily Charter Cost
                      </div>
                      <div className="text-base font-bold text-emerald-800 mt-1">
                        ${formatNumber(v.dailyCharterCost)} <span className="text-sm text-slate-500 font-normal">/day</span>
                      </div>
                    </div>
                  </div>

                  {/* Hydrodynamic & Dimensional Specs Grid */}
                  <div className="grid grid-cols-4 gap-1.5 pt-3 border-t border-slate-200 text-center">
                    <div className="p-2 rounded-lg bg-slate-50">
                      <div className="text-xs text-slate-600 uppercase">Speed</div>
                      <div className="text-sm font-bold text-slate-800 mt-1">{formatNumber(v.speedKnots, 1)} kn</div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50">
                      <div className="text-xs text-slate-600 uppercase">Draft</div>
                      <div className="text-sm font-bold text-slate-800 mt-1">{formatNumber(v.draftM, 1)}m</div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50">
                      <div className="text-xs text-slate-600 uppercase">LOA</div>
                      <div className="text-sm font-bold text-slate-800 mt-1">{formatNumber(v.loaM, 1)}m</div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50">
                      <div className="text-xs text-slate-600 uppercase">Beam</div>
                      <div className="text-sm font-bold text-slate-800 mt-1">{formatNumber(v.beamM, 1)}m</div>
                    </div>
                  </div>

                  {/* Click To Inspect Footer */}
                  <div className="flex items-center justify-between text-[11px] text-[var(--color-brand-text-muted)] pt-2 border-t border-[var(--color-brand-border)]">
                    {permissions.canEditVessel ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingVessel(v);
                          setIsDialogOpen(true);
                        }}
                        className="flex items-center gap-1 text-[var(--color-brand-text-muted)] hover:text-[var(--color-brand-text-primary)] transition-colors"
                      >
                        <Pencil className="w-3 h-3" /> Edit Specs
                      </button>
                    ) : (
                      <span className="text-[11px] text-[var(--color-brand-text-muted)]">READ ONLY</span>
                    )}

                    <span className="group-hover:text-[var(--color-status-info)] transition-colors flex items-center gap-1">
                      Inspect Specs <Eye className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* ── TABLE VIEW ── */
        <Card className="bg-[var(--color-brand-elevated)] border-[var(--color-brand-border)]/[0.06] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--color-brand-inset)] border-b border-[var(--color-brand-border)] text-[var(--color-brand-text-secondary)] uppercase text-[11px]">
                <tr>
                  <th className="p-4">Vessel Name</th>
                  <th className="p-4">Class / Type</th>
                  <th className="p-4 text-right">Capacity (MT)</th>
                  <th className="p-4 text-right">Draft (m)</th>
                  <th className="p-4 text-right">LOA (m)</th>
                  <th className="p-4 text-right">Beam (m)</th>
                  <th className="p-4 text-right">Speed (kn)</th>
                  <th className="p-4 text-right">Charter ($/day)</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredAndSortedVessels.map((v) => {
                  const status = v.availabilityStatus || v.status || 'AVAILABLE';
                  const statusColor = getStatusColor(status);

                  return (
                    <tr
                      key={v.id}
                      onClick={() => handleOpenDetail(v)}
                      className="hover:bg-white/[0.03] transition-colors cursor-pointer"
                    >
                      <td className="p-4 font-bold text-[var(--color-brand-text-primary)] flex items-center gap-2">
                        <Ship className="w-4 h-4 text-[var(--color-status-info)]" />
                        {v.name}
                      </td>
                      <td className="p-4 text-[var(--color-brand-text-muted)]">{v.vesselType || v.type || 'BULK CARRIER'}</td>
                      <td className="p-4 text-right font-bold text-[var(--color-brand-text-primary)]">{formatNumber(v.capacityMt)}</td>
                      <td className="p-4 text-right text-[var(--color-brand-text-secondary)]">{formatNumber(v.draftM, 2)}</td>
                      <td className="p-4 text-right text-[var(--color-brand-text-secondary)]">{formatNumber(v.loaM, 1)}</td>
                      <td className="p-4 text-right text-[var(--color-brand-text-secondary)]">{formatNumber(v.beamM, 1)}</td>
                      <td className="p-4 text-right text-[var(--color-brand-text-secondary)]">{formatNumber(v.speedKnots, 1)}</td>
                      <td className="p-4 text-right font-bold text-[var(--color-status-success)]">
                        ${formatNumber(v.dailyCharterCost)}
                      </td>
                      <td className="p-4 text-center">
                        <Badge
                          variant="outline"
                          className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5"
                          style={{
                            borderColor: `${statusColor}40`,
                            backgroundColor: `color-mix(in srgb, ${statusColor} 10%, transparent)`,
                            color: statusColor,
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
                          {status}
                        </Badge>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {permissions.canEditVessel && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingVessel(v);
                                setIsDialogOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-100 text-[var(--color-brand-text-muted)] hover:text-[var(--color-brand-text-primary)] transition-colors"
                              title="Edit Vessel Specifications"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetail(v);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-100 text-[var(--color-brand-text-muted)] hover:text-[var(--color-brand-text-primary)] transition-colors"
                            title="View Vessel Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      </>
      )}

      {/* ── DETAIL MODAL ──────────────────────────────────────────────── */}
      <VesselDetailModal
        vessel={selectedVessel}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedVessel(null);
        }}
      />

      {/* ── CREATE / EDIT VESSEL DIALOG ────────────────────────────────── */}
      <VesselDialog
        isOpen={isDialogOpen}
        vessel={editingVessel}
        onSuccess={fetchVessels}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingVessel(null);
        }}
      />
    </div>
  );
};
