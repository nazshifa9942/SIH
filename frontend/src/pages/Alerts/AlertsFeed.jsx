import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Filter,
  Search,
  RefreshCw,
  Eye,
  Ship,
  RotateCcw,
  Zap,
  Info,
  Check,
  ExternalLink,
  BarChart3,
  Globe,
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { getAlerts } from '../../api/alerts';
import { AlertDetailModal } from './AlertDetailModal';

// ─── Constants ─────────────────────────────────────────────────────────────────

const ALERT_CATEGORIES = [
  { value: 'ALL', label: 'All Event Categories' },
  { value: 'WEATHER', label: 'Weather & Storm Tracks' },
  { value: 'MARKET', label: 'Market & Freight Volatility' },
  { value: 'VESSEL', label: 'Vessel AIS & Fleet Availability' },
  { value: 'SYSTEM', label: 'System & Optimization Engine' },
  { value: 'RISK', label: 'Port Congestion & Delays' },
  { value: 'RECOMMENDATION', label: 'Recommendation Action Shifts' },
];

const SEVERITY_LEVELS = [
  { value: 'ALL', label: 'All Severity Levels' },
  { value: 'CRITICAL', label: 'Critical Exceptions' },
  { value: 'WARNING', label: 'Warnings & Volatility' },
  { value: 'INFO', label: 'Operational Info' },
];

const READ_STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'UNREAD', label: 'Pending Acknowledgment (Unread)' },
  { value: 'READ', label: 'Acknowledged (Read)' },
];

const LOCAL_ACK_STORAGE_KEY = 'maritime_acknowledged_alerts';

export const AlertsFeed = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ── Raw Alerts from Backend ──
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Client-side Acknowledged Alerts Set (persisted in localStorage) ──
  const [acknowledgedIds, setAcknowledgedIds] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_ACK_STORAGE_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // ── Search & Filter State ──
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [readFilter, setReadFilter] = useState('ALL');
  const [cargoIdFilter] = useState(searchParams.get('cargoId') || '');

  // ── Selected Alert for Detail Modal ──
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ── Fetch Alerts from API ──
  const fetchAlerts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getAlerts();
      setAlerts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load alert feeds:', error);
      setAlerts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Persist Acknowledged IDs
  const handleAcknowledge = (alertId) => {
    setAcknowledgedIds((prev) => {
      const next = new Set(prev);
      next.add(alertId);
      try {
        localStorage.setItem(LOCAL_ACK_STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch (err) {
        console.error('Failed to persist acknowledgment:', err);
      }
      return next;
    });

    if (selectedAlert && selectedAlert.id === alertId) {
      setSelectedAlert((prev) => ({ ...prev, isRead: true, acknowledgedAt: new Date() }));
    }
  };

  const handleAcknowledgeAll = () => {
    const allIds = alerts.map((a) => a.id);
    const next = new Set(allIds);
    setAcknowledgedIds(next);
    try {
      localStorage.setItem(LOCAL_ACK_STORAGE_KEY, JSON.stringify(Array.from(next)));
    } catch (err) {
      console.error('Failed to persist acknowledgments:', err);
    }
  };

  // Helper to check if an alert is acknowledged
  const isAlertRead = useCallback(
    (alert) => Boolean(alert.acknowledgedAt || acknowledgedIds.has(alert.id)),
    [acknowledgedIds]
  );

  // ── Filtered Alerts ──
  const severityRank = { CRITICAL: 0, WARNING: 1, INFO: 2 };
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      // 0. Cargo ID Filter (from URL or selector)
      if (cargoIdFilter && alert.cargoRequestId !== cargoIdFilter) return false;

      // 1. Text Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesMsg = alert.message?.toLowerCase().includes(q);
        const matchesType = alert.alertType?.toLowerCase().includes(q);
        const matchesCargo = alert.cargoRequest?.cargoType?.toLowerCase().includes(q);
        const matchesId = alert.cargoRequestId?.toLowerCase().includes(q);
        if (!matchesMsg && !matchesType && !matchesCargo && !matchesId) return false;
      }

      // 2. Category Filter
      if (categoryFilter !== 'ALL') {
        const type = (alert.alertType || '').toUpperCase();
        if (type !== categoryFilter.toUpperCase()) return false;
      }

      // 3. Severity Filter
      if (severityFilter !== 'ALL') {
        const sev = (alert.severity || '').toUpperCase();
        if (sev !== severityFilter.toUpperCase()) return false;
      }

      // 4. Read / Unread Filter
      if (readFilter === 'UNREAD' && isAlertRead(alert)) return false;
      if (readFilter === 'READ' && !isAlertRead(alert)) return false;

      return true;
    });
  }, [alerts, search, categoryFilter, severityFilter, readFilter, cargoIdFilter, isAlertRead]);

  // ── Dynamic Summary Statistics ──
  const stats = useMemo(() => {
    const total = alerts.length;
    const criticalCount = alerts.filter((a) =>
      ['CRITICAL', 'ERROR'].includes((a.severity || '').toUpperCase())
    ).length;
    const warningCount = alerts.filter(
      (a) => (a.severity || '').toUpperCase() === 'WARNING'
    ).length;
    const unreadCount = alerts.filter((a) => !isAlertRead(a)).length;
    const recommendationShifts = alerts.filter(
      (a) => a.oldRecommendation || a.newRecommendation
    ).length;

    return {
      total,
      criticalCount,
      warningCount,
      unreadCount,
      recommendationShifts,
    };
  }, [alerts, isAlertRead]);

  const handleOpenDetail = (alert) => {
    setSelectedAlert(alert);
    setIsModalOpen(true);
    // Auto-mark as read on open
    handleAcknowledge(alert.id);
  };

  const resetFilters = () => {
    setSearch('');
    setCategoryFilter('ALL');
    setSeverityFilter('ALL');
    setReadFilter('ALL');
  };

  const hasActiveFilters =
    search.trim() !== '' ||
    categoryFilter !== 'ALL' ||
    severityFilter !== 'ALL' ||
    readFilter !== 'ALL';

  const getSeverityBadge = (severity) => {
    const s = String(severity || '').toUpperCase();
    if (s === 'CRITICAL' || s === 'ERROR') {
      return (
        <span className="inline-flex items-center gap-1 bg-red-500/15 border border-red-500/30 text-[var(--color-status-error)] text-[11px] font-bold px-2 py-0.5 rounded">
          <AlertTriangle className="w-3 h-3" /> CRITICAL
        </span>
      );
    }
    if (s === 'WARNING') {
      return (
        <span className="inline-flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 text-[var(--color-status-warning)] text-[11px] font-bold px-2 py-0.5 rounded">
          <AlertTriangle className="w-3 h-3" /> WARNING
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 bg-blue-500/15 border border-blue-500/30 text-[var(--color-status-info)] text-[11px] font-bold px-2 py-0.5 rounded">
        <Info className="w-3 h-3" /> INFO
      </span>
    );
  };

  return (
    <div className="alerts-dashboard flex flex-col h-full bg-[var(--color-brand-background)] text-[var(--color-brand-text-primary)] p-6 gap-6 font-sans">
      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--color-brand-border)]/[0.06] pb-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-[var(--color-gov-saffron)]" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-wider text-[var(--color-brand-text-primary)]">ALERTS & EXCEPTIONS</h1>
              <Badge variant="outline" className="border-[var(--color-brand-border)] bg-[var(--color-brand-inset)] text-[var(--color-gov-saffron)] text-[11px]">
                {stats.unreadCount} PENDING ACTION
              </Badge>
            </div>
            <p className="text-xs uppercase tracking-[0.15em] text-[var(--color-brand-text-secondary)] mt-0.5">
              Live Exception Stream, Weather Storm Alerts, Market Spikes & Recommendation Shifts
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Mark all as read */}
          {stats.unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAcknowledgeAll}
              className="border-emerald-500/30 text-[var(--color-status-success)] hover:bg-emerald-500/10 text-xs"
            >
              <Check className="w-3.5 h-3.5 mr-1" /> ACKNOWLEDGE ALL
            </Button>
          )}

          {/* Refresh Action */}
          <Button
            onClick={() => fetchAlerts(true)}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 border-[var(--color-brand-border)] hover:border-[var(--color-brand-border-strong)] text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'SYNCING...' : 'REFRESH'}
          </Button>
        </div>
      </div>

      {/* ── SUMMARY KPI COUNTER CARDS ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[var(--color-brand-elevated)] border border-[var(--color-brand-border)]">
          <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
            Total Event Log
          </div>
          <div className="text-2xl font-bold text-[var(--color-brand-text-primary)] mt-1">
            {stats.total} <span className="text-xs text-[var(--color-brand-text-muted)] font-normal">Events</span>
          </div>
          <div className="text-[11px] text-[var(--color-brand-text-muted)] mt-1">
            Across active workflows
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--color-brand-elevated)] border border-[var(--color-brand-border)]">
          <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
            Critical Exceptions
          </div>
          <div className="text-2xl font-bold text-[var(--color-status-error)] mt-1">
            {stats.criticalCount}
          </div>
          <div className="text-[11px] text-[var(--color-status-error)]/80 mt-1">
            Immediate attention required
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--color-brand-elevated)] border border-[var(--color-brand-border)]">
          <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
            Pending Acknowledgment
          </div>
          <div className="text-2xl font-bold text-[var(--color-status-warning)] mt-1">
            {stats.unreadCount}
          </div>
          <div className="text-[11px] text-[var(--color-status-warning)]/80 mt-1">
            Unread / Action items
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--color-brand-elevated)] border border-[var(--color-brand-border)]">
          <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
            Recommendation Shifts
          </div>
          <div className="text-2xl font-bold text-[var(--color-status-success)] mt-1">
            {stats.recommendationShifts}
          </div>
          <div className="text-[11px] text-[var(--color-status-success)]/80 mt-1">
            Automated strategy triggers
          </div>
        </div>
      </div>

      {/* ── SEARCH & FILTER TOOLBAR ───────────────────────────────────── */}
      <Card className="bg-[var(--color-brand-elevated)] border-[var(--color-brand-border)]/[0.06] rounded-2xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-brand-text-secondary)]" />
            <input
              type="text"
              placeholder="Search by keyword, alert type, message, cargo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[var(--color-brand-text-primary)] placeholder:text-[var(--color-brand-text-secondary)] focus:outline-none focus:border-[var(--color-gov-navy)] transition-colors"
            />
          </div>

          {/* Filter Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] rounded-xl px-3 py-2.5 text-xs text-[var(--color-brand-text-primary)] focus:outline-none focus:border-[var(--color-gov-navy)]"
            >
              {ALERT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] rounded-xl px-3 py-2.5 text-xs text-[var(--color-brand-text-primary)] focus:outline-none focus:border-[var(--color-gov-navy)]"
            >
              {SEVERITY_LEVELS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            {/* Read / Unread Filter */}
            <select
              value={readFilter}
              onChange={(e) => setReadFilter(e.target.value)}
              className="bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] rounded-xl px-3 py-2.5 text-xs text-[var(--color-brand-text-primary)] focus:outline-none focus:border-[var(--color-gov-navy)]"
            >
              {READ_STATUS_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>

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

        {/* Filter Results Status */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--color-brand-border)] text-[11px] text-[var(--color-brand-text-secondary)]">
          <span>
            Showing <strong className="text-[var(--color-brand-text-primary)]">{filteredAlerts.length}</strong> of {alerts.length} Events
          </span>
          {hasActiveFilters && (
            <span className="text-[var(--color-gov-saffron)] flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filters Active
            </span>
          )}
        </div>
      </Card>

      {/* ── ALERTS FEED LIST ─────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] w-full gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[var(--color-brand-border-strong)] border-t-[var(--color-gov-navy)]" />
          <span className="text-xs uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
            Loading exception feeds…
          </span>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <Card className="flex-1 flex items-center justify-center min-h-[300px]">
          <CardContent className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-[var(--color-brand-border)] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-[var(--color-status-success)]/40" />
            </div>
            <div className="text-base font-bold text-[var(--color-brand-text-primary)] mb-1">No alerts matching criteria</div>
            <div className="text-xs text-[var(--color-brand-text-secondary)] mb-4 max-w-sm mx-auto">
              All systems nominal. No unresolved exceptions or warning alerts matching your filter.
            </div>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Reset filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {[...filteredAlerts].sort((a, b) => (severityRank[(a.severity || "INFO").toUpperCase()] ?? 3) - (severityRank[(b.severity || "INFO").toUpperCase()] ?? 3)).map((a, idx) => {
            const isRead = isAlertRead(a);
            const isRecShift = Boolean(a.oldRecommendation || a.newRecommendation);

            return (
              <div
                key={a.id || idx}
                onClick={() => handleOpenDetail(a)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isRead
                    ? 'bg-[var(--color-brand-elevated)] border-[var(--color-brand-border)]/[0.04] opacity-80 hover:opacity-100 hover:border-[var(--color-brand-border-strong)]'
                    : 'bg-[var(--color-status-warning-bg)] border-[#fedf89] hover:border-[#f2b27b]'
                }`}
              >
                {/* Left Side: Alert Severity, Type, Message */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="mt-1 flex-shrink-0">
                    <span
                      className={`w-2.5 h-2.5 rounded-full block ${
                        isRead ? 'bg-gray-500' : 'bg-[var(--color-gov-saffron)] animate-pulse'
                      }`}
                    />
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {getSeverityBadge(a.severity)}

                      <span className="text-xs font-bold text-[var(--color-brand-text-secondary)] uppercase tracking-wider">
                        {a.alertType || 'SYSTEM'}
                      </span>

                      {/* Cargo linkage pill */}
                      {a.cargoRequestId && (
                        <Badge
                          variant="outline"
                          className="bg-[var(--color-brand-inset)] text-[var(--color-brand-text-secondary)] border-[var(--color-brand-border)] text-[11px] flex items-center gap-1"
                        >
                          <Ship className="w-3 h-3 text-[var(--color-status-info)]" />
                          {a.cargoRequest?.cargoType || 'Cargo'} · {a.cargoRequestId.slice(0, 8)}...
                        </Badge>
                      )}
                    </div>

                    {/* Alert Main Message */}
                    <p className="text-sm font-medium text-[var(--color-brand-text-primary)] group-hover:text-[var(--color-gov-saffron)] transition-colors leading-relaxed">
                      {a.message}
                    </p>

                    {/* Recommendation Shift Highlight if present */}
                    {isRecShift && (
                      <div className="inline-flex items-center gap-2 p-1.5 px-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-xs text-[var(--color-gov-saffron)] font-bold">
                        <Zap className="w-3.5 h-3.5" />
                        <span>Shift: {a.oldRecommendation || 'MONITOR'}</span>
                        <span className="text-[var(--color-brand-text-muted)]">➔</span>
                        <span className="text-[var(--color-status-success)]">{a.newRecommendation || 'LOCK_NOW'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Timestamp, Status, Action */}
                <div className="flex items-center gap-4 flex-shrink-0 text-xs text-[var(--color-brand-text-secondary)]">
                  <div className="flex flex-col md:items-end">
                    <span className="text-[var(--color-brand-text-primary)] font-bold">
                      {a.triggeredAt && !isNaN(new Date(a.triggeredAt).getTime())
                        ? new Date(a.triggeredAt).toLocaleTimeString()
                        : 'N/A'}
                    </span>
                    <span className="text-[11px] text-[var(--color-brand-text-muted)]">
                      {a.triggeredAt && !isNaN(new Date(a.triggeredAt).getTime())
                        ? new Date(a.triggeredAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })
                        : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetail(a);
                      }}
                      className="text-[var(--color-brand-text-muted)] hover:text-[var(--color-brand-text-primary)] p-2"
                      title="Inspect Alert"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>

                    {a.cargoRequestId && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/cargo/${a.cargoRequestId}`);
                          }}
                          className="text-[var(--color-gov-saffron)] hover:text-[var(--color-gov-saffron)] p-2"
                          title="Open Cargo Workspace"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/market?cargoId=${a.cargoRequestId}`);
                          }}
                          className="text-[var(--color-status-info)] hover:text-[var(--color-status-info)] p-2"
                          title="View Market Analytics"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/map?cargoId=${a.cargoRequestId}`);
                          }}
                          className="text-[var(--color-status-success)] hover:text-[var(--color-status-success)] p-2"
                          title="View on Map"
                        >
                          <Globe className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── DETAIL MODAL ──────────────────────────────────────────────── */}
      <AlertDetailModal
        alert={selectedAlert}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAlert(null);
        }}
        onAcknowledge={handleAcknowledge}
      />
    </div>
  );
};
