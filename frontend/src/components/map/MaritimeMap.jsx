import React, { useEffect, useMemo, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  CircleMarker,
  Tooltip,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Ship,
  Anchor,
  MapPin,
  Compass,
  AlertTriangle,
  Info,
  Maximize2,
  Navigation,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import {
  getPortCoordinates,
  generateMaritimeRoutes,
  calculateDistanceNM,
  MARITIME_CHOKEPOINTS,
} from '../../utils/mapUtils';

// ─── CARTO Basemap configuration ─────────────────────────────────────────────
// Uses CARTO's free, key-less Positron "light" raster endpoint, which loads a
// light basemap and never returns "API KEY REQUIRED". Attribution is preserved.
const CARTO_TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const CARTO_SUBDOMAINS = 'abcd';

// ─── Custom Leaflet Icon Generators ───────────────────────────────────────────

function createPortDivIcon(color, label, isMajor = false) {
  const size = isMajor ? 32 : 24;
  return L.divIcon({
    className: 'custom-port-marker',
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background-color: #ffffff;
        border: 2px solid ${color};
        box-shadow: 0 1px 4px rgba(15,23,42,0.35);
        cursor: pointer;
      ">
        <svg width="${size * 0.5}" height="${size * 0.5}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="5" r="3"></circle>
          <line x1="12" y1="22" x2="12" y2="8"></line>
          <path d="M5 12H2a10 10 0 0 0 20 0h-3"></path>
        </svg>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function createVesselDivIcon(color, isSelected = false) {
  const size = isSelected ? 36 : 28;
  return L.divIcon({
    className: 'custom-vessel-marker',
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background-color: #ffffff;
        border: 2px solid ${color};
        box-shadow: 0 1px 4px rgba(15,23,42,0.35);
        cursor: pointer;
      ">
        <svg width="${size * 0.55}" height="${size * 0.55}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path>
          <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"></path>
          <path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"></path>
          <path d="M12 10V2"></path>
          <path d="M12 2l5 3"></path>
        </svg>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

// ─── Map Bounds Adjuster Component ────────────────────────────────────────────

function AutoFitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length >= 2) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8, animate: true });
    }
  }, [bounds, map]);
  return null;
}

// ─── Main Maritime Map Component ──────────────────────────────────────────────

export const MaritimeMap = ({
  originPort,
  destinationPort,
  allPorts = [],
  vessels = [],
  selectedVessel,
  showAlternativeRoutes = true,
  showAllPorts = true,
  showChokepoints = true,
  showFleet = true,
  onPortSelect,
  onVesselSelect,
  className = 'h-[500px] w-full',
  center = [5.0, 105.0],
  zoom = 3,
}) => {
  // Compute Coordinates for Origin & Destination
  const originCoords = useMemo(() => getPortCoordinates(originPort), [originPort]);
  const destCoords = useMemo(() => getPortCoordinates(destinationPort), [destinationPort]);

  // Compute Maritime Routes
  const { primaryRoute, alternativeRoute } = useMemo(() => {
    if (originCoords.lat === 0 && originCoords.lng === 0) {
      return { primaryRoute: [], alternativeRoute: [] };
    }
    return generateMaritimeRoutes(originCoords, destCoords);
  }, [originCoords, destCoords]);

  // Compute Distance (Nautical Miles)
  const distanceNM = useMemo(() => {
    if (originCoords.lat === 0 && originCoords.lng === 0) return 0;
    return calculateDistanceNM(originCoords, destCoords);
  }, [originCoords, destCoords]);

  // Compute Bounding Box
  const mapBounds = useMemo(() => {
    if (primaryRoute.length > 0) {
      return primaryRoute;
    }
    if (originCoords.lat !== 0 && destCoords.lat !== 0) {
      return [
        [originCoords.lat, originCoords.lng],
        [destCoords.lat, destCoords.lng],
      ];
    }
    return null;
  }, [primaryRoute, originCoords, destCoords]);

  // Active vessel waypoint position (estimated midway along primary route)
  const vesselPosition = useMemo(() => {
    if (primaryRoute.length >= 3) {
      const midIdx = Math.floor(primaryRoute.length / 2);
      return primaryRoute[midIdx];
    }
    return null;
  }, [primaryRoute]);

  return (
    <div className={`relative rounded-lg overflow-hidden border border-[var(--color-brand-border)] shadow-[0_1px_3px_rgba(16,24,40,0.10)] ${className}`}>
      {/* ── LEAFLET MAP CONTAINER ──────────────────────────────────────── */}
      <MapContainer
        center={center}
        zoom={zoom}
        minZoom={2}
        maxZoom={14}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
        style={{ background: '#eef2f7' }}
      >
        {/* CARTO Positron light basemap (key-less, no "API KEY REQUIRED") */}
        <TileLayer
          url={CARTO_TILE_URL}
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap'
          subdomains={CARTO_SUBDOMAINS}
          maxZoom={19}
        />

        {mapBounds && <AutoFitBounds bounds={mapBounds} />}

        {/* ── CHOKEPOINTS ────────────────────────────────────────────── */}
        {showChokepoints &&
          MARITIME_CHOKEPOINTS.map((cp) => (
            <CircleMarker
              key={cp.name}
              center={[cp.lat, cp.lng]}
              radius={5}
              pathOptions={{
                color: '#ec4899',
                fillColor: '#ec4899',
                fillOpacity: 0.6,
                weight: 1.5,
              }}
            >
              <Tooltip direction="top" offset={[0, -5]} opacity={0.9} className="custom-map-tooltip">
                <div className="text-xs font-bold #a21caf">
                  ⚓ {cp.name} ({cp.type})
                </div>
              </Tooltip>
            </CircleMarker>
          ))}

        {/* ── OTHER GLOBAL PORTS ──────────────────────────────────────── */}
        {showAllPorts &&
          allPorts.map((p) => {
            const coords = getPortCoordinates(p);
            const isOrigin = originPort && (p.id === originPort.id || p.name === originPort.name);
            const isDest = destinationPort && (p.id === destinationPort.id || p.name === destinationPort.name);
            if (isOrigin || isDest) return null; // rendered separately

            return (
              <Marker
                key={p.id}
                position={[coords.lat, coords.lng]}
                icon={createPortDivIcon('#06b6d4', p.name, false)}
                eventHandlers={{
                  click: () => onPortSelect && onPortSelect(p),
                }}
              >
                <Popup className="custom-map-popup">
                  <div className="p-1 font-sans text-xs space-y-1.5">
                    <div className="font-bold text-[var(--color-status-info)] text-sm">{p.name}</div>
                    <div className="text-[var(--color-brand-text-muted)]">{p.country} {p.region ? `· ${p.region}` : ''}</div>
                    <div className="grid grid-cols-2 gap-1 pt-1 border-t border-[var(--color-brand-border)] text-[11px]">
                      <div>Draft: <strong className="text-[var(--color-brand-text-primary)]">{p.maxDraftM}m</strong></div>
                      <div>LOA: <strong className="text-[var(--color-brand-text-primary)]">{p.maxLoaM}m</strong></div>
                      <div>Berths: <strong className="text-[var(--color-brand-text-primary)]">{p.berthCapacity}</strong></div>
                      <div>Daily: <strong className="text-[var(--color-brand-text-primary)]">{p.handlingCapacityMtDay} MT</strong></div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* ── PRIMARY RECOMMENDED ROUTE POLYLINE ─────────────────────── */}
        {primaryRoute.length > 0 && (
          <>
            {/* Glowing outer aura */}
            <Polyline
              positions={primaryRoute}
              pathOptions={{
                color: '#175cd3',
                weight: 7,
                opacity: 0.15,
                lineCap: 'round',
              }}
            />
            {/* Solid core route line */}
            <Polyline
              positions={primaryRoute}
              pathOptions={{
                color: '#175cd3',
                weight: 3.5,
                opacity: 0.95,
              }}
            >
              <Tooltip sticky opacity={0.9}>
                <div className="text-xs font-bold text-[var(--color-status-info)]">
                  Primary Voyage Route (~{distanceNM.toLocaleString()} NM)
                </div>
              </Tooltip>
            </Polyline>
          </>
        )}

        {/* ── ALTERNATIVE ROUTE POLYLINE ─────────────────────────────── */}
        {showAlternativeRoutes && alternativeRoute.length > 0 && (
          <Polyline
            positions={alternativeRoute}
            pathOptions={{
              color: '#d97706',
              weight: 2.5,
              opacity: 0.75,
              dashArray: '6, 6',
            }}
          >
            <Tooltip sticky opacity={0.9}>
              <div className="text-xs font-bold text-[var(--color-status-warning)]">
                Alternative Voyage Corridor (~{Math.round(distanceNM * 1.08).toLocaleString()} NM)
              </div>
            </Tooltip>
          </Polyline>
        )}

        {/* ── ORIGIN PORT MARKER ─────────────────────────────────────── */}
        {originCoords.lat !== 0 && (
          <Marker
            position={[originCoords.lat, originCoords.lng]}
            icon={createPortDivIcon('#10b981', 'Origin', true)}
            eventHandlers={{
              click: () => onPortSelect && onPortSelect(originPort),
            }}
          >
            <Popup className="custom-map-popup">
              <div className="p-1 font-sans text-xs space-y-1">
                <Badge className="bg-emerald-100 text-[var(--color-status-success)] text-[11px] uppercase font-bold">
                  ORIGIN PORT (LOAD)
                </Badge>
                <div className="font-bold text-[var(--color-brand-text-primary)] text-sm">{originPort?.name || 'Origin Port'}</div>
                <div className="text-[var(--color-brand-text-muted)] text-[11px]">
                  {originPort?.country || 'Australia'} · Coordinates: [{originCoords.lat.toFixed(2)}, {originCoords.lng.toFixed(2)}]
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* ── DESTINATION PORT MARKER ────────────────────────────────── */}
        {destCoords.lat !== 0 && (
          <Marker
            position={[destCoords.lat, destCoords.lng]}
            icon={createPortDivIcon('#ef4444', 'Destination', true)}
            eventHandlers={{
              click: () => onPortSelect && onPortSelect(destinationPort),
            }}
          >
            <Popup className="custom-map-popup">
              <div className="p-1 font-sans text-xs space-y-1">
                <Badge className="bg-red-100 text-[var(--color-status-error)] text-[11px] uppercase font-bold">
                  DESTINATION PORT (DISCHARGE)
                </Badge>
                <div className="font-bold text-[var(--color-brand-text-primary)] text-sm">{destinationPort?.name || 'Destination Port'}</div>
                <div className="text-[var(--color-brand-text-muted)] text-[11px]">
                  {destinationPort?.country || 'India'} · Coordinates: [{destCoords.lat.toFixed(2)}, {destCoords.lng.toFixed(2)}]
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* ── ACTIVE SELECTED VESSEL MARKER ALONG ROUTE ──────────────── */}
        {selectedVessel && vesselPosition && (
          <Marker
            position={vesselPosition}
            icon={createVesselDivIcon('#134074', true)}
            eventHandlers={{
              click: () => onVesselSelect && onVesselSelect(selectedVessel),
            }}
          >
            <Popup className="custom-map-popup">
              <div className="p-1 font-sans text-xs space-y-1.5 min-w-[200px]">
                <Badge className="bg-blue-100 text-[var(--color-status-info)] text-[11px] uppercase font-bold">
                  ACTIVE VOYAGE VESSEL
                </Badge>
                <div className="font-bold text-[var(--color-brand-text-primary)] text-sm">{selectedVessel.name}</div>
                <div className="text-[var(--color-brand-text-muted)] text-[11px]">{selectedVessel.vesselType || 'BULK CARRIER'}</div>
                <div className="grid grid-cols-2 gap-1 pt-1 border-t border-[var(--color-brand-border)] text-[11px]">
                  <div>Capacity: <strong className="text-[var(--color-brand-text-primary)]">{Number(selectedVessel.capacityMt).toLocaleString()} MT</strong></div>
                  <div>Speed: <strong className="text-[var(--color-brand-text-primary)]">{selectedVessel.speedKnots || 14.5} kn</strong></div>
                  <div>Draft: <strong className="text-[var(--color-brand-text-primary)]">{selectedVessel.draftM}m</strong></div>
                  <div>Charter: <strong className="text-[var(--color-status-success)]">${Number(selectedVessel.dailyCharterCost).toLocaleString()}</strong></div>
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* ── FLEET VESSELS (OTHER FLEET SHIPS) ───────────────────────── */}
        {showFleet &&
          vessels.map((v, idx) => {
            if (selectedVessel && v.id === selectedVessel.id) return null;
            // Place fleet ships at realistic geographic intervals or use actual coordinates if available
            const hasCoords = (v.lat !== undefined || v.latitude !== undefined) && (v.lng !== undefined || v.longitude !== undefined);
            const offsetRad = ((idx * 37) % 360) * (Math.PI / 180);
            const fleetLat = hasCoords ? Number(v.lat ?? v.latitude) : -25.0 + Math.sin(offsetRad) * 20;
            const fleetLng = hasCoords ? Number(v.lng ?? v.longitude) : 80.0 + Math.cos(offsetRad) * 45;

            return (
              <Marker
                key={v.id || idx}
                position={[fleetLat, fleetLng]}
                icon={createVesselDivIcon('#94a3b8', false)}
                eventHandlers={{
                  click: () => onVesselSelect && onVesselSelect(v),
                }}
              >
                <Popup className="custom-map-popup">
                  <div className="p-1 font-sans text-xs space-y-1">
                    <div className="font-bold text-[var(--color-brand-text-primary)]">{v.name}</div>
                    <div className="text-[var(--color-brand-text-muted)] text-[11px]">{v.vesselType || 'BULK CARRIER'} · {v.availabilityStatus || 'AVAILABLE'}</div>
                    <div className="text-[11px] text-[var(--color-brand-text-secondary)]">Capacity: {Number(v.capacityMt).toLocaleString()} MT</div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>

      {/* ── TOP-LEFT TELEMETRY HUD OVERLAY ────────────────────────────── */}
      <div className="absolute top-4 left-4 z-10 p-3.5 rounded-lg glass-panel flex flex-col gap-2 max-w-xs pointer-events-auto">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-[var(--color-brand-text-secondary)]">
            Voyage Route Corridor
          </span>
          <Badge variant="outline" className="text-[11px] bg-blue-500/10 text-[var(--color-status-info)] border-blue-500/30">
            {distanceNM > 0 ? `${distanceNM.toLocaleString()} NM` : 'TRANSIT'}
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--color-brand-text-primary)]">
          <span className="text-[var(--color-status-success)] truncate">{originPort?.name || 'NEWCASTLE'}</span>
          <span className="text-[var(--color-brand-text-muted)]">➔</span>
          <span className="text-[var(--color-status-error)] truncate">{destinationPort?.name || 'PARADIP'}</span>
        </div>

        {selectedVessel && (
          <div className="pt-2 border-t border-[var(--color-brand-border)] flex justify-between items-center text-[11px]">
            <span className="text-[var(--color-brand-text-muted)] truncate">Vessel: {selectedVessel.name}</span>
            <span className="text-[var(--color-status-success)] font-bold">{selectedVessel.speedKnots || 14.5} kn</span>
          </div>
        )}
      </div>

      {/* ── BOTTOM-RIGHT MAP LEGEND ────────────────────────────────────── */}
      <div className="absolute bottom-4 right-4 z-10 p-3 rounded-lg glass-panel flex flex-col gap-1.5 text-[11px] text-[var(--color-brand-text-secondary)] pointer-events-auto">
        <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-muted)] font-bold mb-0.5">
          Map Legend
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm" />
          <span>Origin Port</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-sm" />
          <span>Destination Port</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-[#175cd3]" />
          <span>Recommended Route</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 border-t border-dashed border-amber-400" />
          <span>Alternative Route</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-pink-500" />
          <span>Maritime Chokepoint</span>
        </div>
      </div>
    </div>
  );
};
