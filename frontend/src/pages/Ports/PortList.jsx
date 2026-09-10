import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Anchor,
  Search,
  Filter,
  ArrowUpDown,
  LayoutGrid,
  List as ListIcon,
  RefreshCw,
  Plus,
  Pencil,
  Eye,
  MapPin,
  RotateCcw,
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { getPorts } from '../../api/ports';
import { PortDialog } from './PortDialog';
import { PortDetailModal } from './PortDetailModal';
import { useAuth } from '../../context/AuthContext';

// ─── Filter Constants ─────────────────────────────────────────────────────────

const DRAFT_BRACKETS = [
  { value: 'ALL', label: 'All Draft Capabilities' },
  { value: 'UNDER_12M', label: 'Shallow (< 12.0m Draft)', min: 0, max: 12 },
  { value: '12M_15M', label: 'Medium (12.0m - 15.0m Draft)', min: 12, max: 15 },
  { value: 'OVER_15M', label: 'Deepwater (> 15.0m Capesize Ready)', min: 15, max: Infinity },
];

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Port Name (A → Z)' },
  { value: 'name_desc', label: 'Port Name (Z → A)' },
  { value: 'country_asc', label: 'Country (A → Z)' },
  { value: 'draft_desc', label: 'Draft Depth (Deepest First)' },
  { value: 'draft_asc', label: 'Draft Depth (Shallowest First)' },
  { value: 'capacity_desc', label: 'Daily Handling (Highest First)' },
  { value: 'berths_desc', label: 'Berth Count (Most First)' },
  { value: 'loa_desc', label: 'Max LOA (Longest First)' },
];

export const PortList = () => {
  const { permissions } = useAuth();
  const [ports, setPorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Search & Filter State ──
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('ALL');
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'
  const [draftFilter, setDraftFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('name_asc');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // ── Modals & Dialogs ──
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPort, setEditingPort] = useState(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedPort, setSelectedPort] = useState(null);

  // ── Fetch Ports ──
  const fetchPorts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getPorts();
      setPorts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load ports:', error);
      setPorts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPorts();
  }, [fetchPorts]);

  const formatNumber = (num, decimals = 0) => {
    if (num === null || num === undefined || isNaN(Number(num))) return 'N/A';
    return Number(num).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  // ── Distinct Countries & Regions ──
  const distinctCountries = useMemo(() => {
    return Array.from(new Set(ports.map((p) => p.country).filter(Boolean))).sort();
  }, [ports]);

  const distinctRegions = useMemo(() => {
    return Array.from(new Set(ports.map((p) => p.region).filter(Boolean))).sort();
  }, [ports]);

  // ── Filtered & Sorted Ports ──
  const filteredAndSortedPorts = useMemo(() => {
    let list = [...ports];

    // 1. Search text
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.country?.toLowerCase().includes(q) ||
          p.region?.toLowerCase().includes(q) ||
          p.id?.toLowerCase().includes(q)
      );
    }

    // 2. Country Filter
    if (countryFilter !== 'ALL') {
      list = list.filter((p) => p.country === countryFilter);
    }

    // 3. Region Filter
    if (regionFilter !== 'ALL') {
      list = list.filter((p) => p.region === regionFilter);
    }

    // 4. Status Filter
    if (statusFilter !== 'ALL') {
      const isActive = statusFilter === 'ACTIVE';
      list = list.filter((p) => Boolean(p.active) === isActive);
    }

    // 5. Draft Capability Filter
    if (draftFilter !== 'ALL') {
      const bracket = DRAFT_BRACKETS.find((b) => b.value === draftFilter);
      if (bracket) {
        list = list.filter((p) => {
          const d = Number(p.maxDraftM) || 0;
          return d >= bracket.min && d <= bracket.max;
        });
      }
    }

    // 6. Sorting
    list.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return (a.name || '').localeCompare(b.name || '');
        case 'name_desc':
          return (b.name || '').localeCompare(a.name || '');
        case 'country_asc':
          return (a.country || '').localeCompare(b.country || '');
        case 'draft_desc':
          return (Number(b.maxDraftM) || 0) - (Number(a.maxDraftM) || 0);
        case 'draft_asc':
          return (Number(a.maxDraftM) || 0) - (Number(b.maxDraftM) || 0);
        case 'capacity_desc':
          return (Number(b.handlingCapacityMtDay) || 0) - (Number(a.handlingCapacityMtDay) || 0);
        case 'berths_desc':
          return (Number(b.berthCapacity) || 0) - (Number(a.berthCapacity) || 0);
        case 'loa_desc':
          return (Number(b.maxLoaM) || 0) - (Number(a.maxLoaM) || 0);
        default:
          return 0;
      }
    });

    return list;
  }, [ports, search, countryFilter, regionFilter, statusFilter, draftFilter, sortBy]);

  // ── Port Statistics (Dynamically Computed) ──
  const stats = useMemo(() => {
    const totalCount = ports.length;
    const activeCount = ports.filter((p) => p.active).length;
    const totalHandlingCapacity = ports.reduce(
      (acc, p) => acc + (Number(p.handlingCapacityMtDay) || 0),
      0
    );
    const totalBerths = ports.reduce((acc, p) => acc + (Number(p.berthCapacity) || 0), 0);
    const avgDraft =
      ports.reduce((acc, p) => acc + (Number(p.maxDraftM) || 0), 0) / (totalCount || 1);

    return {
      totalCount,
      activeCount,
      totalHandlingCapacity,
      totalBerths,
      avgDraft,
    };
  }, [ports]);

  const handleOpenCreate = () => {
    setEditingPort(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (port) => {
    setEditingPort(port);
    setIsDialogOpen(true);
  };

  const handleOpenDetail = (port) => {
    setSelectedPort(port);
    setIsDetailOpen(true);
  };

  const handlePortSaved = () => {
    setIsDialogOpen(false);
    setEditingPort(null);
    fetchPorts(true);
  };

  const resetFilters = () => {
    setSearch('');
    setCountryFilter('ALL');
    setRegionFilter('ALL');
    setStatusFilter('ALL');
    setDraftFilter('ALL');
    setSortBy('name_asc');
  };

  const hasActiveFilters =
    search.trim() !== '' ||
    countryFilter !== 'ALL' ||
    regionFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    draftFilter !== 'ALL' ||
    sortBy !== 'name_asc';

  return (
    <div className="flex min-h-full flex-col bg-slate-50 text-slate-900 p-4 md:p-6 gap-6 font-sans">
      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 border-l-4 border-l-[#0b2545] p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <Anchor className="w-6 h-6 text-[var(--color-gov-saffron)]" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-[var(--color-gov-navy)]">Port Management</h1>
              <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-800 text-xs">
                {ports.length} PORTS LOGGED
              </Badge>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Global Maritime Terminal Constraints, Draft Depths & Berthing Capacity Registry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Add Port Button */}
          {permissions.canCreatePort && (
            <Button
              onClick={handleOpenCreate}
              size="sm"
              className="bg-orange-500 hover:bg-orange-600 text-[var(--color-brand-text-primary)] flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> REGISTER PORT
            </Button>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 border border-slate-300 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-orange-500 text-[var(--color-brand-text-primary)] shadow-sm'
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
                  ? 'bg-orange-500 text-[var(--color-brand-text-primary)] shadow-sm'
                  : 'text-slate-600 hover:text-[var(--color-gov-navy)]'
              }`}
              title="Table View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Refresh Action */}
          <Button
            onClick={() => fetchPorts(true)}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 border-slate-300 text-slate-700 hover:border-slate-500"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'SYNCING...' : 'REFRESH'}
          </Button>
        </div>
      </div>

      {/* ── PORT KPI SUMMARY CARDS ────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm">
          <div className="text-xs uppercase font-semibold tracking-wider text-slate-600">
            Total Terminals
          </div>
          <div className="text-2xl font-bold text-[var(--color-gov-navy)] mt-1">
            {stats.totalCount} <span className="text-sm text-slate-500 font-normal">Ports</span>
          </div>
          <div className="text-xs text-slate-600 mt-1">
            {stats.activeCount} Active Terminals
          </div>
        </div>

        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm">
          <div className="text-xs uppercase font-semibold tracking-wider text-slate-600">
            Active Status
          </div>
          <div className="text-2xl font-bold text-[var(--color-status-success)] mt-1">
            {stats.activeCount}
          </div>
          <div className="text-xs text-emerald-800 mt-1">
            {stats.totalCount > 0 ? ((stats.activeCount / stats.totalCount) * 100).toFixed(0) : 0}% Operational
          </div>
        </div>

        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm">
          <div className="text-xs uppercase font-semibold tracking-wider text-slate-600">
            Average Max Draft
          </div>
          <div className="text-2xl font-bold text-[var(--color-status-info)] mt-1">
            {formatNumber(stats.avgDraft, 1)} <span className="text-sm text-slate-500 font-normal">m</span>
          </div>
          <div className="text-xs text-blue-800 mt-1">
            Mean harbor depth limit
          </div>
        </div>

        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm">
          <div className="text-xs uppercase font-semibold tracking-wider text-slate-600">
            Daily Throughput
          </div>
          <div className="text-2xl font-bold text-[var(--color-gov-navy)] mt-1">
            {formatNumber(stats.totalHandlingCapacity / 1000, 1)}k <span className="text-sm text-slate-500 font-normal">MT/Day</span>
          </div>
          <div className="text-xs text-slate-600 mt-1">
            Total handling capacity
          </div>
        </div>

        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm">
          <div className="text-xs uppercase font-semibold tracking-wider text-slate-600">
            Total Berths
          </div>
          <div className="text-2xl font-bold text-[var(--color-gov-saffron)] mt-1">
            {stats.totalBerths}
          </div>
          <div className="text-xs text-slate-600 mt-1">
            Operational quay berths
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
              placeholder="Search by port name, country, region..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-[var(--color-brand-border)] transition-colors"
            />
          </div>

          {/* Filter Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Country Filter */}
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-3 text-sm text-slate-900 focus:outline-none focus:border-[var(--color-brand-border)]"
            >
              <option value="ALL">All Countries</option>
              {distinctCountries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Region Filter */}
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-3 text-sm text-slate-900 focus:outline-none focus:border-[var(--color-brand-border)]"
            >
              <option value="ALL">All Regions</option>
              {distinctRegions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-3 text-sm text-slate-900 focus:outline-none focus:border-[var(--color-brand-border)]"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Ports Only</option>
              <option value="INACTIVE">Inactive Ports Only</option>
            </select>

            {/* Draft Filter */}
            <select
              value={draftFilter}
              onChange={(e) => setDraftFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-3 text-sm text-slate-900 focus:outline-none focus:border-[var(--color-brand-border)]"
            >
              {DRAFT_BRACKETS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
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

        {/* Filter Count Status */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200 text-sm text-slate-600">
          <span>
            Showing <strong className="text-[var(--color-gov-navy)]">{filteredAndSortedPorts.length}</strong> of {ports.length} ports
          </span>
          {hasActiveFilters && (
            <span className="text-[var(--color-gov-saffron)] flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filters applied
            </span>
          )}
        </div>
      </Card>

      {/* ── PORT DISPLAY (GRID vs TABLE) ──────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] w-full gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[var(--color-brand-border-strong)] border-t-[var(--color-gov-navy)]" />
          <span className="text-xs uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
            Loading port registry…
          </span>
        </div>
      ) : filteredAndSortedPorts.length === 0 ? (
        <Card className="flex-1 flex items-center justify-center min-h-[300px] bg-white border-slate-200 rounded-lg shadow-sm">
          <CardContent className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-[var(--color-brand-border)] flex items-center justify-center mx-auto mb-4">
              <Anchor className="h-8 w-8 text-[var(--color-brand-text-muted)]" />
            </div>
            <div className="text-base font-bold text-[var(--color-gov-navy)] mb-1">No ports found</div>
            <div className="text-sm text-slate-600 mb-4 max-w-sm mx-auto">
              No registered maritime ports match your search query or filter criteria.
            </div>
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Reset filters
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        /* ── GRID CARD VIEW ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 content-start">
          {filteredAndSortedPorts.map((p) => (
            <Card
              key={p.id}
              onClick={() => handleOpenDetail(p)}
              className="bg-white border-slate-200 hover:border-[var(--color-brand-border)]/40 hover:shadow-md transition-all cursor-pointer group rounded-lg flex flex-col justify-between shadow-sm"
            >
              <CardContent className="p-5 flex flex-col h-full justify-between gap-4">
                {/* Top Port Name & Status Badge */}
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-[var(--color-gov-navy)] group-hover:text-[var(--color-gov-navy-light)] transition-colors tracking-tight">
                        {p.name}
                      </h3>
                      <span className="text-xs uppercase tracking-wider text-slate-600 flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {p.country} {p.region ? `· ${p.region}` : ''}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                        p.active
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-[var(--color-status-success)]'
                          : 'border-red-500/30 bg-red-500/10 text-[var(--color-status-error)]'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          p.active ? 'bg-emerald-400' : 'bg-red-400'
                        }`}
                      />
                      {p.active ? 'ACTIVE' : 'INACTIVE'}
                    </Badge>
                  </div>
                </div>

                {/* Handling Capacity & Berth Counters */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-xs text-slate-600 uppercase tracking-wider">
                      Handling Rate
                    </div>
                    <div className="text-base font-bold text-[var(--color-gov-navy)] mt-1">
                      {formatNumber(p.handlingCapacityMtDay)} <span className="text-sm text-slate-500 font-normal">MT/d</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-xs text-slate-600 uppercase tracking-wider">
                      Berth Capacity
                    </div>
                    <div className="text-base font-bold text-orange-800 mt-1">
                      {p.berthCapacity || 0} <span className="text-sm text-slate-500 font-normal">Berths</span>
                    </div>
                  </div>
                </div>

                {/* Dimensional Constraints Grid */}
                <div className="grid grid-cols-3 gap-1.5 pt-3 border-t border-slate-200 text-center">
                  <div className="p-2 rounded-lg bg-slate-50">
                    <div className="text-xs text-slate-600 uppercase">Max Draft</div>
                    <div className="text-sm font-bold text-slate-800 mt-1">{formatNumber(p.maxDraftM, 1)}m</div>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50">
                    <div className="text-xs text-slate-600 uppercase">Max LOA</div>
                    <div className="text-sm font-bold text-slate-800 mt-1">{formatNumber(p.maxLoaM, 1)}m</div>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50">
                    <div className="text-xs text-slate-600 uppercase">Max Beam</div>
                    <div className="text-sm font-bold text-slate-800 mt-1">{formatNumber(p.maxBeamM, 1)}m</div>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="flex items-center justify-between text-[11px] text-[var(--color-brand-text-muted)] pt-2 border-t border-[var(--color-brand-border)]">
                  {permissions.canEditPort ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(p);
                      }}
                      className="flex items-center gap-1 text-[var(--color-brand-text-muted)] hover:text-[var(--color-brand-text-primary)] transition-colors"
                    >
                      <Pencil className="w-3 h-3" /> Edit Port
                    </button>
                  ) : (
                    <span className="text-[11px] text-[var(--color-brand-text-muted)]">READ ONLY</span>
                  )}

                  <span className="group-hover:text-[var(--color-gov-saffron)] transition-colors flex items-center gap-1">
                    Inspect Constraints <Eye className="w-3.5 h-3.5" />
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* ── TABLE VIEW ── */
        <Card className="bg-[var(--color-brand-elevated)] border-[var(--color-brand-border)]/[0.06] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--color-brand-inset)] border-b border-[var(--color-brand-border)] text-[var(--color-brand-text-secondary)] uppercase text-[11px]">
                <tr>
                  <th className="p-4">Port Name</th>
                  <th className="p-4">Country & Region</th>
                  <th className="p-4 text-right">Max Draft (m)</th>
                  <th className="p-4 text-right">Max LOA (m)</th>
                  <th className="p-4 text-right">Max Beam (m)</th>
                  <th className="p-4 text-right">Handling (MT/d)</th>
                  <th className="p-4 text-right">Berths</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredAndSortedPorts.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => handleOpenDetail(p)}
                    className="hover:bg-white/[0.03] transition-colors cursor-pointer"
                  >
                    <td className="p-4 font-bold text-[var(--color-brand-text-primary)] flex items-center gap-2">
                      <Anchor className="w-4 h-4 text-[var(--color-gov-saffron)]" />
                      {p.name}
                    </td>
                    <td className="p-4 text-[var(--color-brand-text-secondary)]">
                      {p.country} {p.region ? `(${p.region})` : ''}
                    </td>
                    <td className="p-4 text-right font-bold text-[var(--color-status-info)]">{formatNumber(p.maxDraftM, 2)}</td>
                    <td className="p-4 text-right text-[var(--color-brand-text-secondary)]">{formatNumber(p.maxLoaM, 1)}</td>
                    <td className="p-4 text-right text-[var(--color-brand-text-secondary)]">{formatNumber(p.maxBeamM, 1)}</td>
                    <td className="p-4 text-right font-bold text-[var(--color-brand-text-primary)]">
                      {formatNumber(p.handlingCapacityMtDay)}
                    </td>
                    <td className="p-4 text-right text-[var(--color-gov-saffron)] font-bold">{p.berthCapacity || 0}</td>
                    <td className="p-4 text-center">
                      <Badge
                        variant="outline"
                        className={`px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                          p.active
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-[var(--color-status-success)]'
                            : 'border-red-500/30 bg-red-500/10 text-[var(--color-status-error)]'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            p.active ? 'bg-emerald-400' : 'bg-red-400'
                          }`}
                        />
                        {p.active ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {permissions.canEditPort && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(p);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-100 text-[var(--color-brand-text-muted)] hover:text-[var(--color-brand-text-primary)] transition-colors"
                            title="Edit Port Specifications"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(p);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-100 text-[var(--color-brand-text-muted)] hover:text-[var(--color-brand-text-primary)] transition-colors"
                          title="View Full Specifications"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── CREATE / EDIT PORT DIALOG ──────────────────────────────────── */}
      <PortDialog
        isOpen={isDialogOpen}
        port={editingPort}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingPort(null);
        }}
        onSuccess={handlePortSaved}
      />

      {/* ── PORT DETAIL MODAL ─────────────────────────────────────────── */}
      <PortDetailModal
        port={selectedPort}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedPort(null);
        }}
        onEdit={handleOpenEdit}
      />
    </div>
  );
};
