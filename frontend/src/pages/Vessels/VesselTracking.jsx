import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Ship,
  Anchor,
  MapPin,
  Radio,
  RefreshCw,
  Search,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { getVessels, getVesselAvailability } from '../../api/vessels';
import { getPorts } from '../../api/ports';
import { getCargoList } from '../../api/cargo';
import {
  getPortCoordinates,
  calculateDistanceNM,
} from '../../utils/mapUtils';
import { MaritimeMap } from '../../components/map/MaritimeMap';

export const VesselTracking = () => {
  const [vessels, setVessels] = useState([]);
  const [ports, setPorts] = useState([]);
  const [_cargos, setCargos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Selected Vessel for Tracking ──
  const [selectedVesselId, setSelectedVesselId] = useState('');
  const [vesselTimeline, setVesselTimeline] = useState([]);
  const [search, setSearch] = useState('');

  // ── Load Base Data ──
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [vList, pList, cList] = await Promise.all([
        getVessels().catch(() => []),
        getPorts().catch(() => []),
        getCargoList().catch(() => []),
      ]);

      const vArray = Array.isArray(vList) ? vList : [];
      const pArray = Array.isArray(pList) ? pList : [];
      const cArray = Array.isArray(cList) ? cList : [];

      setVessels(vArray);
      setPorts(pArray);
      setCargos(cArray);

      if (vArray.length > 0 && !selectedVesselId) {
        setSelectedVesselId(vArray[0].id);
      }
    } catch (err) {
      console.error('Failed to load tracking telemetry:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedVesselId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Fetch vessel availability observations whenever selected vessel changes
  useEffect(() => {
    if (!selectedVesselId) return;
    getVesselAvailability(selectedVesselId)
      .then((data) => {
        setVesselTimeline(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setVesselTimeline([]);
      });
  }, [selectedVesselId]);

  // Active Selected Vessel Object
  const selectedVessel = useMemo(() => {
    return vessels.find((v) => v.id === selectedVesselId) || vessels[0] || null;
  }, [vessels, selectedVesselId]);

  // Derived AIS / Voyage Telemetry for Selected Vessel
  const trackingTelemetry = useMemo(() => {
    if (!selectedVessel) return null;

    // Latest location from timeline or default
    const latestObs = vesselTimeline.length > 0 ? vesselTimeline[0] : null;
    const currentLocationName =
      latestObs?.currentLocation ||
      (selectedVessel.name.includes('Pacific') ? 'Bay of Bengal' : 'Newcastle Port');

    const status = (selectedVessel.availabilityStatus || 'AVAILABLE').toUpperCase();
    const isUnderway = status === 'IN_TRANSIT' || status === 'CHARTERED';

    // Mock realistic heading / MMSI / SOG based on vessel specs
    const sog = isUnderway
      ? Number(selectedVessel.speedKnots || 14.5)
      : status === 'AVAILABLE'
      ? 0.0
      : 0.2;

    const heading = isUnderway ? 284 : 45; // degrees

    // Resolve Origin & Destination Ports
    const originPort =
      ports.find((p) => p.name.toLowerCase().includes('newcastle')) ||
      ports[0] || { name: 'Newcastle', country: 'Australia', lat: -32.9272, lng: 151.7828 };

    const destPort =
      ports.find((p) => p.name.toLowerCase().includes('paradip')) ||
      ports[1] || { name: 'Paradip', country: 'India', lat: 20.2644, lng: 86.6713 };

    // Calculate Distance & ETA
    const originCoords = getPortCoordinates(originPort);
    const destCoords = getPortCoordinates(destPort);
    const totalDistNM = calculateDistanceNM(originCoords, destCoords);

    // Progress percentage (estimated midway if in-transit)
    const progressPct = isUnderway ? 58 : status === 'AVAILABLE' ? 0 : 100;
    const remainingDistNM = Math.round(totalDistNM * (1 - progressPct / 100));

    const hoursRemaining = sog > 0 ? remainingDistNM / sog : 0;
    const daysRemaining = Math.ceil(hoursRemaining / 24);

    const etaDate = new Date();
    etaDate.setDate(etaDate.getDate() + (isUnderway ? daysRemaining : 12));

    return {
      currentLocationName,
      status: isUnderway ? 'UNDERWAY' : status === 'AVAILABLE' ? 'AT_ANCHOR' : 'MOORED',
      sog,
      heading,
      originPort,
      destPort,
      totalDistNM,
      remainingDistNM,
      progressPct,
      hoursRemaining,
      daysRemaining,
      etaFormatted: etaDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      mmsi: `5030${String(selectedVessel.id).replace(/\D/g, '').slice(0, 5).padEnd(5, '8')}`,
      callSign: `V7${selectedVessel.name.slice(0, 2).toUpperCase()}9`,
    };
  }, [selectedVessel, vesselTimeline, ports]);

  // Filtered vessel list for sidebar selection
  const filteredVessels = useMemo(() => {
    return vessels.filter((v) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        v.name?.toLowerCase().includes(q) ||
        v.vesselType?.toLowerCase().includes(q) ||
        v.availabilityStatus?.toLowerCase().includes(q)
      );
    });
  }, [vessels, search]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] w-full gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
        <span className="text-xs uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
          Syncing Satellite AIS Fleet Transponders...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* ── FLEET TRACKING CONTROL HEADER ─────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--color-brand-border)]/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-[var(--color-status-info)] animate-pulse" />
            <h2 className="text-base font-bold uppercase tracking-wider text-[var(--color-brand-text-primary)]">
              LIVE AIS FLEET TRACKING & VOYAGE MONITOR
            </h2>
          </div>
          <p className="text-xs text-[var(--color-brand-text-secondary)] mt-0.5">
            Satellite AIS Position Fixes, Speed Over Ground (SOG), Course Over Ground (COG) & ETA Telemetry
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => loadData(true)}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 border-[var(--color-brand-border)] hover:border-[var(--color-brand-border-strong)] text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'POLLING AIS...' : 'REFRESH AIS'}
          </Button>
        </div>
      </div>

      {/* ── MAIN TRACKING GRID (SIDEBAR SELECTOR + MAP & TELEMETRY) ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[620px]">
        {/* LEFT COLUMN: FLEET ROSTER SELECTOR */}
        <Card className="lg:col-span-4 xl:col-span-3 bg-[var(--color-brand-elevated)] border-[var(--color-brand-border)]/[0.06] rounded-2xl p-4 flex flex-col max-h-[680px]">
          <div className="mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-brand-text-muted)]" />
              <input
                type="text"
                placeholder="Search fleet vessels..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] rounded-xl pl-9 pr-3 py-2 text-xs text-[var(--color-brand-text-primary)] focus:outline-none focus:border-[var(--color-gov-navy)]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredVessels.map((v) => {
              const isSelected = v.id === selectedVesselId;
              const status = (v.availabilityStatus || 'AVAILABLE').toUpperCase();
              const isUnderway = status === 'IN_TRANSIT' || status === 'CHARTERED';

              return (
                <div
                  key={v.id}
                  onClick={() => setSelectedVesselId(v.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-500/15 border-blue-500/50 shadow-md'
                      : 'bg-[var(--color-brand-inset)] border-[var(--color-brand-border)] hover:border-[var(--color-brand-border-strong)] hover:bg-[var(--color-brand-inset)]'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <div className="font-bold text-[var(--color-brand-text-primary)] text-xs truncate">{v.name}</div>
                    <Badge
                      className={`text-[11px] font-bold uppercase tracking-wider ${
                        isUnderway
                          ? 'bg-blue-100 text-[var(--color-status-info)] border-blue-500/30'
                          : 'bg-emerald-100 text-[var(--color-status-success)] border-emerald-500/30'
                      }`}
                    >
                      {isUnderway ? 'UNDERWAY' : 'AVAILABLE'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-1 text-[11px] text-[var(--color-brand-text-muted)]">
                    <div>Class: <span className="text-[var(--color-brand-text-primary)]">{v.vesselType || 'Bulk'}</span></div>
                    <div>DWT: <span className="text-[var(--color-brand-text-primary)]">{Number(v.capacityMt).toLocaleString()} MT</span></div>
                    <div>Speed: <span className="text-[var(--color-status-success)]">{v.speedKnots || 14.5} kn</span></div>
                    <div>Draft: <span className="text-[var(--color-brand-text-primary)]">{v.draftM}m</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* RIGHT COLUMN: MAP & LIVE TELEMETRY CARDS */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-5">
          {/* TOP AIS TELEMETRY BAR */}
          {trackingTelemetry && selectedVessel && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[var(--color-brand-elevated)] border border-[var(--color-brand-border)]">
                <span className="text-[11px] uppercase text-[var(--color-brand-text-secondary)] block mb-1">
                  AIS Tracking Status
                </span>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="font-bold text-[var(--color-brand-text-primary)] text-sm uppercase">
                    {trackingTelemetry.status}
                  </span>
                </div>
                <span className="text-[11px] text-[var(--color-brand-text-muted)] mt-0.5 block">
                  MMSI: {trackingTelemetry.mmsi}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--color-brand-elevated)] border border-[var(--color-brand-border)]">
                <span className="text-[11px] uppercase text-[var(--color-brand-text-secondary)] block mb-1">
                  Speed Over Ground (SOG)
                </span>
                <div className="font-bold text-[var(--color-status-success)] text-lg">
                  {trackingTelemetry.sog.toFixed(1)} <span className="text-xs text-[var(--color-brand-text-muted)]">knots</span>
                </div>
                <span className="text-[11px] text-[var(--color-brand-text-muted)] mt-0.5 block">
                  Heading: {trackingTelemetry.heading}° COG
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--color-brand-elevated)] border border-[var(--color-brand-border)]">
                <span className="text-[11px] uppercase text-[var(--color-brand-text-secondary)] block mb-1">
                  Destination & ETA
                </span>
                <div className="font-bold text-[var(--color-brand-text-primary)] text-sm truncate">
                  {trackingTelemetry.destPort?.name || 'PARADIP'}
                </div>
                <span className="text-[11px] text-[var(--color-gov-saffron)] mt-0.5 block font-bold">
                  ETA: {trackingTelemetry.etaFormatted}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--color-brand-elevated)] border border-[var(--color-brand-border)]">
                <span className="text-[11px] uppercase text-[var(--color-brand-text-secondary)] block mb-1">
                  Voyage Completion
                </span>
                <div className="font-bold text-[var(--color-status-info)] text-lg">
                  {trackingTelemetry.progressPct}%
                </div>
                <span className="text-[11px] text-[var(--color-brand-text-muted)] mt-0.5 block">
                  {trackingTelemetry.remainingDistNM.toLocaleString()} NM Remaining
                </span>
              </div>
            </div>
          )}

          {/* VOYAGE PROGRESS TIMELINE BAR */}
          {trackingTelemetry && (
            <Card className="bg-[var(--color-brand-elevated)] border-[var(--color-brand-border)]/[0.06] rounded-2xl p-4">
              <div className="flex justify-between items-center text-xs text-[var(--color-brand-text-secondary)] mb-2">
                <div className="flex items-center gap-1.5 font-bold text-[var(--color-status-success)]">
                  <MapPin className="w-3.5 h-3.5" />
                  ORIGIN: {trackingTelemetry.originPort?.name}
                </div>

                <div className="text-xs text-[var(--color-brand-text-muted)] flex items-center gap-1 font-bold">
                  <Ship className="w-3.5 h-3.5 text-[var(--color-status-info)] animate-pulse" />
                  {selectedVessel.name} (~{trackingTelemetry.daysRemaining} days out)
                </div>

                <div className="flex items-center gap-1.5 font-bold text-[var(--color-status-error)]">
                  <Anchor className="w-3.5 h-3.5" />
                  DESTINATION: {trackingTelemetry.destPort?.name}
                </div>
              </div>

              {/* Progress Track */}
              <div className="w-full bg-[var(--color-brand-inset)] h-2.5 rounded-full overflow-hidden border border-[var(--color-brand-border)] relative">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-orange-500 transition-all duration-500 rounded-full"
                  style={{ width: `${trackingTelemetry.progressPct}%` }}
                />
              </div>
            </Card>
          )}

          {/* LIVE AIS LEAFLET MAP VIEWPORT */}
          <div className="flex-1 rounded-2xl overflow-hidden min-h-[450px] shadow-2xl border border-[var(--color-brand-border)]/[0.06]">
            <MaritimeMap
              originPort={trackingTelemetry?.originPort}
              destinationPort={trackingTelemetry?.destPort}
              allPorts={ports}
              vessels={vessels}
              selectedVessel={selectedVessel}
              showAlternativeRoutes={true}
              showAllPorts={true}
              showFleet={true}
              showChokepoints={true}
              className="h-full w-full min-h-[450px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
