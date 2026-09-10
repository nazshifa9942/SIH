import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Compass,
  Ship,
  Anchor,
  Navigation,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { MaritimeMap } from '../../components/map/MaritimeMap';
import { getCargoList } from '../../api/cargo';
import { getPorts } from '../../api/ports';
import { getVessels } from '../../api/vessels';
import { calculateDistanceNM, getPortCoordinates } from '../../utils/mapUtils';

export const MaritimeMapPage = () => {
  const [searchParams] = useSearchParams();
  const urlCargoId = searchParams.get('cargoId') || '';
  const [cargoList, setCargoList] = useState([]);
  const [ports, setPorts] = useState([]);
  const [vessels, setVessels] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Selected Route & Entity State ──
  const [selectedCargoId, setSelectedCargoId] = useState('');
  const [selectedOriginPortId, setSelectedOriginPortId] = useState('');
  const [selectedDestPortId, setSelectedDestPortId] = useState('');
  const [selectedVesselId, setSelectedVesselId] = useState('');

  // ── Layer Toggles ──
  const [showAlternativeRoutes, setShowAlternativeRoutes] = useState(true);
  const [showAllPorts, setShowAllPorts] = useState(true);
  const [showFleet, setShowFleet] = useState(true);
  const [showChokepoints, setShowChokepoints] = useState(true);

  // ── Inspected Entity (Port or Vessel clicked on map) ──
  const [inspectedEntity, setInspectedEntity] = useState(null); // { type: 'port'|'vessel', data: ... }

  // ── Load All Base Data ──
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [cargos, portData, vesselData] = await Promise.all([
        getCargoList().catch(() => []),
        getPorts().catch(() => []),
        getVessels().catch(() => []),
      ]);

      const cList = Array.isArray(cargos) ? cargos : [];
      const pList = Array.isArray(portData) ? portData : [];
      const vList = Array.isArray(vesselData) ? vesselData : [];

      setCargoList(cList);
      setPorts(pList);
      setVessels(vList);

      // Priority to urlCargoId if present, else default to first cargo request
      const targetCargo = urlCargoId ? cList.find((c) => c.id === urlCargoId) || cList[0] : cList[0];
      if (targetCargo) {
        setSelectedCargoId(targetCargo.id);
        setSelectedOriginPortId(targetCargo.originPortId || targetCargo.originPort?.id || '');
        setSelectedDestPortId(targetCargo.destinationPortId || targetCargo.destinationPort?.id || '');
      } else if (pList.length >= 2) {
        setSelectedOriginPortId((prev) => prev || pList[0].id);
        setSelectedDestPortId((prev) => prev || pList[1].id);
      }

      if (vList.length > 0) {
        setSelectedVesselId((prev) => prev || vList[0].id);
      }
    } catch (err) {
      console.error('Failed to load maritime map data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [urlCargoId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Cargo Selection Change
  const handleCargoChange = (cargoId) => {
    setSelectedCargoId(cargoId);
    if (!cargoId) return;
    const found = cargoList.find((c) => c.id === cargoId);
    if (found) {
      setSelectedOriginPortId(found.originPortId || found.originPort?.id || '');
      setSelectedDestPortId(found.destinationPortId || found.destinationPort?.id || '');
    }
  };

  // Resolve Active Origin & Destination Objects
  const activeOriginPort = useMemo(() => {
    return ports.find((p) => p.id === selectedOriginPortId) || {
      name: 'Newcastle',
      country: 'Australia',
      lat: -32.9272,
      lng: 151.7828,
    };
  }, [ports, selectedOriginPortId]);

  const activeDestPort = useMemo(() => {
    return ports.find((p) => p.id === selectedDestPortId) || {
      name: 'Paradip',
      country: 'India',
      lat: 20.2644,
      lng: 86.6713,
    };
  }, [ports, selectedDestPortId]);

  const activeVessel = useMemo(() => {
    return vessels.find((v) => v.id === selectedVesselId) || vessels[0] || null;
  }, [vessels, selectedVesselId]);

  // Compute Voyage Distance & ETA
  const originCoords = useMemo(() => getPortCoordinates(activeOriginPort), [activeOriginPort]);
  const destCoords = useMemo(() => getPortCoordinates(activeDestPort), [activeDestPort]);

  const distanceNM = useMemo(() => {
    return calculateDistanceNM(originCoords, destCoords);
  }, [originCoords, destCoords]);

  const speedKnots = activeVessel?.speedKnots ? Number(activeVessel.speedKnots) : 14.5;
  const sailingHours = speedKnots > 0 ? distanceNM / speedKnots : 0;
  const sailingDays = Math.ceil(sailingHours / 24);

  // Map Click Callbacks
  const handlePortSelect = (port) => {
    setInspectedEntity({ type: 'port', data: port });
  };

  const handleVesselSelect = (vessel) => {
    setInspectedEntity({ type: 'vessel', data: vessel });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] w-full gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-[var(--color-brand-border-strong)] border-t-[var(--color-gov-navy)]" />
        <span className="text-sm uppercase tracking-wider text-slate-700">
          Initializing Maritime Cartography & AIS GIS Engine...
        </span>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col bg-slate-50 text-slate-900 p-4 md:p-6 gap-6 font-sans">
      {/* ── TOP HEADER & CONTROLS ───────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 border-l-4 border-l-[#0b2545] p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <Compass className="w-6 h-6 text-[var(--color-gov-saffron)]" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-[var(--color-gov-navy)]">Maritime Route Map</h1>
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                GIS ROUTE ENGINE
              </Badge>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Interactive Geodesic Route Visualizer, Port Terminal Limits & Fleet AIS Tracking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => loadData(true)}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 border-slate-300 text-slate-700 hover:border-slate-500"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'SYNCING...' : 'REFRESH MAP'}
          </Button>
        </div>
      </div>

      {/* ── ROUTE & VOYAGE CONTROLS BAR ─────────────────────────────────── */}
      <Card className="bg-white border-slate-200 rounded-lg p-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Cargo Request Selector */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1">
              Active Cargo Request
            </label>
            <select
              value={selectedCargoId}
              onChange={(e) => handleCargoChange(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[var(--color-brand-border)]"
            >
              <option value="">Custom Port Pair</option>
              {cargoList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.cargoType} ({Number(c.quantityMt).toLocaleString()} MT)
                </option>
              ))}
            </select>
          </div>

          {/* Origin Port */}
          <div>
            <label className="text-sm font-semibold text-emerald-800 block mb-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Origin Port (Load)
            </label>
            <select
              value={selectedOriginPortId}
              onChange={(e) => setSelectedOriginPortId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-700"
            >
              {ports.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.country})
                </option>
              ))}
            </select>
          </div>

          {/* Destination Port */}
          <div>
            <label className="text-sm font-semibold text-red-800 block mb-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Destination Port (Discharge)
            </label>
            <select
              value={selectedDestPortId}
              onChange={(e) => setSelectedDestPortId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-red-700"
            >
              {ports.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.country})
                </option>
              ))}
            </select>
          </div>

          {/* Active Vessel Candidate */}
          <div>
            <label className="text-sm font-semibold text-blue-800 block mb-1 flex items-center gap-1">
              <Ship className="w-3 h-3 text-[var(--color-status-info)]" /> Assigned Vessel
            </label>
            <select
              value={selectedVesselId}
              onChange={(e) => setSelectedVesselId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-700"
            >
              {vessels.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({Number(v.capacityMt).toLocaleString()} MT)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Layer Checkboxes */}
        <div className="flex flex-wrap items-center gap-6 mt-4 pt-4 border-t border-slate-200 text-sm">
          <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showAlternativeRoutes}
              onChange={(e) => setShowAlternativeRoutes(e.target.checked)}
              className="w-3.5 h-3.5 rounded bg-[var(--color-brand-inset)] border-[var(--color-brand-border-strong)] text-[var(--color-gov-saffron)]"
            />
            Alternative Route Corridors
          </label>

          <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showAllPorts}
              onChange={(e) => setShowAllPorts(e.target.checked)}
              className="w-3.5 h-3.5 rounded bg-[var(--color-brand-inset)] border-[var(--color-brand-border-strong)] text-[var(--color-gov-saffron)]"
            />
            Global Maritime Ports ({ports.length})
          </label>

          <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showFleet}
              onChange={(e) => setShowFleet(e.target.checked)}
              className="w-3.5 h-3.5 rounded bg-[var(--color-brand-inset)] border-[var(--color-brand-border-strong)] text-[var(--color-gov-saffron)]"
            />
            Fleet AIS Vessels ({vessels.length})
          </label>

          <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showChokepoints}
              onChange={(e) => setShowChokepoints(e.target.checked)}
              className="w-3.5 h-3.5 rounded bg-[var(--color-brand-inset)] border-[var(--color-brand-border-strong)] text-[var(--color-gov-saffron)]"
            />
            Strategic Chokepoints (Canals & Straits)
          </label>
        </div>
      </Card>

      {/* ── MAP CONTAINER & SIDEBAR INSPECTOR ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Leaflet Map Viewport */}
        <div className="lg:col-span-8 xl:col-span-9 h-[clamp(320px,62vh,620px)] min-h-0">
          <MaritimeMap
            originPort={activeOriginPort}
            destinationPort={activeDestPort}
            allPorts={ports}
            vessels={vessels}
            selectedVessel={activeVessel}
            showAlternativeRoutes={showAlternativeRoutes}
            showAllPorts={showAllPorts}
            showFleet={showFleet}
            showChokepoints={showChokepoints}
            onPortSelect={handlePortSelect}
            onVesselSelect={handleVesselSelect}
            className="h-full w-full"
          />
        </div>

        {/* Right Telemetry & Inspector Panel */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
          {/* Voyage Route Telemetry Card */}
          <Card className="bg-white border-slate-200 rounded-lg p-5 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-gov-navy)] mb-4 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-[var(--color-gov-saffron)]" />
              VOYAGE NAUTICAL METRICS
            </h3>

            <div className="space-y-3 text-sm">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600">Total Distance</span>
                <span className="font-bold text-[var(--color-gov-navy)]">{distanceNM.toLocaleString()} NM</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600">Est. Sailing Time</span>
                <span className="font-bold text-emerald-800">~{sailingDays} Days ({sailingHours.toFixed(0)}h)</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600">Assigned Vessel</span>
                <span className="font-bold text-blue-800 truncate max-w-[130px]">{activeVessel?.name || 'N/A'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600">Service Speed</span>
                <span className="font-bold text-[var(--color-gov-navy)]">{speedKnots} knots</span>
              </div>
            </div>
          </Card>

          {/* Inspected Entity Details Drawer / Card */}
          {inspectedEntity ? (
            <Card className="bg-white border-slate-200 rounded-lg p-5 space-y-3 shadow-sm">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  {inspectedEntity.type === 'port' ? (
                    <Anchor className="w-4 h-4 text-[var(--color-gov-saffron)]" />
                  ) : (
                    <Ship className="w-4 h-4 text-[var(--color-status-info)]" />
                  )}
                  <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--color-gov-navy)]">
                    {inspectedEntity.type === 'port' ? 'PORT INSPECTOR' : 'VESSEL INSPECTOR'}
                  </h4>
                </div>
                <button
                  onClick={() => setInspectedEntity(null)}
                  className="text-sm text-slate-500 hover:text-slate-900"
                >
                  ✕
                </button>
              </div>

              {inspectedEntity.type === 'port' ? (
                <div className="space-y-2 text-sm">
                  <div className="text-base font-bold text-[var(--color-gov-navy)]">{inspectedEntity.data.name}</div>
                  <div className="text-slate-600 text-sm">
                    {inspectedEntity.data.country} {inspectedEntity.data.region ? `· ${inspectedEntity.data.region}` : ''}
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-xs text-slate-600 block">MAX DRAFT</span>
                      <span className="font-bold text-[var(--color-status-info)]">{inspectedEntity.data.maxDraftM}m</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-xs text-slate-600 block">MAX LOA</span>
                      <span className="font-bold text-slate-800">{inspectedEntity.data.maxLoaM}m</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-xs text-slate-600 block">BERTHS</span>
                      <span className="font-bold text-[var(--color-gov-saffron)]">{inspectedEntity.data.berthCapacity}</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-xs text-slate-600 block">HANDLING</span>
                      <span className="font-bold text-[var(--color-status-success)]">{Number(inspectedEntity.data.handlingCapacityMtDay).toLocaleString()} MT/d</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="text-base font-bold text-[var(--color-gov-navy)]">{inspectedEntity.data.name}</div>
                  <div className="text-slate-600 text-sm">
                    {inspectedEntity.data.vesselType || 'BULK CARRIER'} · {inspectedEntity.data.availabilityStatus || 'AVAILABLE'}
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-xs text-slate-600 block">DWT CAPACITY</span>
                      <span className="font-bold text-[var(--color-gov-navy)]">{Number(inspectedEntity.data.capacityMt).toLocaleString()} MT</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-xs text-slate-600 block">SPEED</span>
                      <span className="font-bold text-[var(--color-status-success)]">{inspectedEntity.data.speedKnots || 14.5} kn</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-xs text-slate-600 block">DRAFT</span>
                      <span className="font-bold text-slate-800">{inspectedEntity.data.draftM}m</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-xs text-slate-600 block">CHARTER RATE</span>
                      <span className="font-bold text-[var(--color-status-warning)]">${Number(inspectedEntity.data.dailyCharterCost).toLocaleString()}/d</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <Card className="bg-white border-slate-200 rounded-lg p-5 text-center shadow-sm">
              <Info className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <div className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Interactive Map Inspector
              </div>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                Click on any port beacon or vessel marker on the map to inspect specifications and constraints.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
