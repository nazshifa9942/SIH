import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  Fuel,
  Ship,
  ExternalLink,
  Compass,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import {
  getFreightMarketData,
  getFuelMarketData,
  getCommodityMarketData,
  getEconomicMarketData,
} from '../../../../api/market';
import { MaritimeMap } from '../../../../components/map/MaritimeMap';
import { calculateDistanceNM, getPortCoordinates } from '../../../../utils/mapUtils';

export const CargoInfo = ({ cargo, onComplete }) => {
  const navigate = useNavigate();

  // Market Data linked to this cargo
  const [marketData, setMarketData] = useState({
    freight: null,
    fuel: null,
    commodity: null,
    economic: null,
  });
  const [loadingMarket, setLoadingMarket] = useState(true);

  useEffect(() => {
    async function fetchMarketContext() {
      if (!cargo) return;
      try {
        const [fList, fuelList, cList, eList] = await Promise.all([
          getFreightMarketData().catch(() => []),
          getFuelMarketData().catch(() => []),
          getCommodityMarketData().catch(() => []),
          getEconomicMarketData().catch(() => []),
        ]);

        // Find relevant route freight rate
        const originId = cargo.originPort?.id || cargo.originPortId;
        const destId = cargo.destinationPort?.id || cargo.destinationPortId;

        const routeFreight = Array.isArray(fList)
          ? fList.find((f) => f.originPortId === originId && f.destinationPortId === destId) || fList[0]
          : null;

        // Find relevant commodity rate
        const cargoComm = String(cargo.cargoType || '').toUpperCase().replace('_', ' ');
        const matchingCommodity = Array.isArray(cList)
          ? cList.find((c) => String(c.commodity || '').toUpperCase().includes(cargoComm)) || cList[0]
          : null;

        // Latest fuel rate
        const latestFuel = Array.isArray(fuelList) && fuelList.length > 0 ? fuelList[0] : null;

        // Baltic Dry Index
        const bdiIndex = Array.isArray(eList)
          ? eList.find((e) => String(e.indicatorName || '').toUpperCase().includes('BDI')) || eList[0]
          : null;

        setMarketData({
          freight: routeFreight,
          fuel: latestFuel,
          commodity: matchingCommodity,
          economic: bdiIndex,
        });
      } catch (err) {
        console.error('Failed to load market context for cargo:', err);
      } finally {
        setLoadingMarket(false);
      }
    }

    fetchMarketContext();
  }, [cargo]);

  if (!cargo) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border border-dashed border-[var(--color-brand-border)] rounded-2xl">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--color-brand-border-strong)] border-t-[var(--color-gov-navy)] mb-3" />
        <div className="text-[var(--color-brand-text-secondary)] uppercase text-xs tracking-wider">
          LOADING CARGO SPECIFICATIONS...
        </div>
      </div>
    );
  }

  const requiredDate = cargo.requiredDate || cargo.requiredDeliveryDate;
  const originPort = cargo.originPort || { name: cargo.originPortId || 'Origin Port', country: 'Australia' };
  const destPort = cargo.destinationPort || { name: cargo.destinationPortId || 'Destination Port', country: 'India' };

  // Calculate Distance NM
  const originCoords = getPortCoordinates(originPort);
  const destCoords = getPortCoordinates(destPort);
  const distanceNM = calculateDistanceNM(originCoords, destCoords);
  const sailingDays = distanceNM > 0 ? Math.ceil((distanceNM / 14.5) / 24) : 18;

  const handleOpenMarketDashboard = () => {
    const originId = cargo.originPort?.id || cargo.originPortId || '';
    const destId = cargo.destinationPort?.id || cargo.destinationPortId || '';
    const comm = cargo.cargoType || '';
    navigate(`/market?cargoId=${cargo.id}&origin=${originId}&dest=${destId}&commodity=${encodeURIComponent(comm)}`);
  };

  const handleOpenMapPage = () => {
    navigate(`/map?cargoId=${cargo.id}`);
  };

  return (
    <div className="space-y-6">
      {/* TOP SUMMARY BANNER */}
      <div className="p-5 border-y-2 border-[var(--color-brand-border-strong)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-[var(--color-gov-saffron)] font-bold mb-1">
            CARGO REQUIREMENT SPECIFICATION
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-[var(--color-brand-text-primary)] tracking-wide">
            {cargo.cargoType || 'BULK CARGO'} · {Number(cargo.quantityMt || 0).toLocaleString()} MT
          </h2>
          <div className="text-xs text-[var(--color-brand-text-secondary)] mt-1 flex items-center gap-2">
            <span>Route: <strong className="text-[var(--color-brand-text-primary)]">{originPort.name}</strong> ➔ <strong className="text-[var(--color-brand-text-primary)]">{destPort.name}</strong></span>
            <span>·</span>
            <span>Estimated Distance: <strong className="text-[var(--color-status-info)]">{distanceNM.toLocaleString()} NM</strong> (~{sailingDays} Sailing Days)</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenMarketDashboard}
            className="text-xs border-orange-500/30 text-[var(--color-gov-saffron)] hover:bg-orange-500/10 flex items-center gap-1.5"
          >
            <TrendingUp className="w-3.5 h-3.5" /> Market Analytics <ExternalLink className="w-3 h-3" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenMapPage}
            className="text-xs border-blue-500/30 text-[var(--color-status-info)] hover:bg-blue-500/10 flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5" /> Full Map <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* CARGO KEY ATTRIBUTES GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-3">
        <div className="p-4 border-t border-[var(--color-brand-border-strong)] bg-[var(--color-brand-inset)]">
          <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">Cargo Type</div>
          <div className="text-sm font-bold text-[var(--color-brand-text-primary)] mt-1">{cargo.cargoType || 'N/A'}</div>
        </div>

        <div className="p-4 border-t border-[var(--color-brand-border-strong)] bg-[var(--color-brand-inset)]">
          <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">Planned Volume</div>
          <div className="text-sm font-bold text-[var(--color-status-success)] mt-1">
            {cargo.quantityMt ? `${Number(cargo.quantityMt).toLocaleString()} MT` : 'N/A'}
          </div>
        </div>

        <div className="p-4 border-t border-[var(--color-brand-border-strong)] bg-[var(--color-brand-inset)]">
          <div className="text-[11px] uppercase tracking-widest text-[var(--color-status-success)]">Origin Port (Load)</div>
          <div className="text-sm font-bold text-[var(--color-brand-text-primary)] mt-1 truncate">{originPort.name || 'N/A'}</div>
          <div className="text-[11px] text-[var(--color-brand-text-muted)]">{originPort.country || ''}</div>
        </div>

        <div className="p-4 border-t border-[var(--color-brand-border-strong)] bg-[var(--color-brand-inset)]">
          <div className="text-[11px] uppercase tracking-widest text-[var(--color-status-error)]">Destination (Discharge)</div>
          <div className="text-sm font-bold text-[var(--color-brand-text-primary)] mt-1 truncate">{destPort.name || 'N/A'}</div>
          <div className="text-[11px] text-[var(--color-brand-text-muted)]">{destPort.country || ''}</div>
        </div>

        <div className="p-4 border-t border-[var(--color-brand-border-strong)] bg-[var(--color-brand-inset)]">
          <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">Required Delivery</div>
          <div className="text-sm font-bold text-[var(--color-status-warning)] mt-1">
            {requiredDate ? new Date(requiredDate).toLocaleDateString() : 'N/A'}
          </div>
        </div>

        <div className="p-4 border-t border-[var(--color-brand-border-strong)] bg-[var(--color-brand-inset)]">
          <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">Contract Mode</div>
          <div className="text-sm font-bold text-[var(--color-status-info)] mt-1">{cargo.contractDuration || 'SPOT'}</div>
        </div>
      </div>

      {/* CONNECT CARGO → MARKET CONTEXT WIDGET */}
      <div className="p-5 border-y border-orange-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--color-brand-border)] pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[var(--color-gov-saffron)]" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-brand-text-primary)]">
              LIVE MARKET INTELLIGENCE BENCHMARK FOR THIS CARGO
            </h3>
          </div>
          <span className="text-[11px] text-[var(--color-brand-text-muted)]">
            Real-time feed synced with route & commodity parameters
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Freight Rate */}
            <div className="p-3.5 border-t border-[var(--color-brand-border-strong)] bg-[var(--color-brand-inset)]">
            <div className="text-[11px] uppercase tracking-widest text-[var(--color-status-info)] flex items-center gap-1">
              <Ship className="w-3 h-3" /> Route Spot Freight
            </div>
            <div className="text-lg font-bold text-[var(--color-brand-text-primary)] mt-1">
              {marketData.freight ? `$${Number(marketData.freight.rateValue).toFixed(2)}` : '$18.50'}
              <span className="text-xs text-[var(--color-brand-text-muted)] font-normal"> / MT</span>
            </div>
            <div className="text-[11px] text-[var(--color-brand-text-muted)] mt-0.5">
              {originPort.name} ➔ {destPort.name}
            </div>
          </div>

          {/* Bunker Fuel */}
            <div className="p-3.5 border-t border-[var(--color-brand-border-strong)] bg-[var(--color-brand-inset)]">
            <div className="text-[11px] uppercase tracking-widest text-[var(--color-status-warning)] flex items-center gap-1">
              <Fuel className="w-3 h-3" /> Bunker Fuel (VLSFO)
            </div>
            <div className="text-lg font-bold text-[var(--color-brand-text-primary)] mt-1">
              {marketData.fuel ? `$${Number(marketData.fuel.price).toFixed(2)}` : '$645.00'}
              <span className="text-xs text-[var(--color-brand-text-muted)] font-normal"> / MT</span>
            </div>
            <div className="text-[11px] text-[var(--color-brand-text-muted)] mt-0.5">
              Region: {marketData.fuel?.region || 'Singapore Hub'}
            </div>
          </div>

          {/* Commodity Spot */}
            <div className="p-3.5 border-t border-[var(--color-brand-border-strong)] bg-[var(--color-brand-inset)]">
            <div className="text-[11px] uppercase tracking-widest text-[var(--color-status-success)] flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> Commodity Price
            </div>
            <div className="text-lg font-bold text-[var(--color-brand-text-primary)] mt-1">
              {marketData.commodity ? `$${Number(marketData.commodity.price).toFixed(2)}` : '$108.50'}
              <span className="text-xs text-[var(--color-brand-text-muted)] font-normal"> / MT</span>
            </div>
            <div className="text-[11px] text-[var(--color-brand-text-muted)] mt-0.5 truncate">
              {marketData.commodity?.commodity || cargo.cargoType} CFR
            </div>
          </div>

          {/* Baltic Dry Index */}
            <div className="p-3.5 border-t border-[var(--color-brand-border-strong)] bg-[var(--color-brand-inset)]">
            <div className="text-[11px] uppercase tracking-widest text-[var(--color-gov-navy)] flex items-center gap-1">
              <Layers className="w-3 h-3" /> Baltic Index (BDI)
            </div>
            <div className="text-lg font-bold text-[var(--color-brand-text-primary)] mt-1">
              {marketData.economic ? `${Number(marketData.economic.value).toLocaleString()}` : '1,845'}
              <span className="text-xs text-[var(--color-brand-text-muted)] font-normal"> pts</span>
            </div>
            <div className="text-[11px] text-[var(--color-brand-text-muted)] mt-0.5">Macro Maritime Index</div>
          </div>
        </div>
      </div>

      {/* CONNECT CARGO → MAP ROUTE PREVIEW */}
      <div className="p-5 border-y border-[var(--color-brand-border-strong)] space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--color-brand-border)] pb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[var(--color-status-info)]" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-brand-text-primary)]">
              GEODESIC MARITIME ROUTE VISUALIZATION
            </h3>
          </div>
          <Badge variant="outline" className="text-[11px] text-[var(--color-status-info)] border-blue-500/30">
            {distanceNM > 0 ? `${distanceNM.toLocaleString()} NM` : 'TRANSIT'}
          </Badge>
        </div>

        <MaritimeMap
          originPort={originPort}
          destinationPort={destPort}
          className="h-[320px] w-full"
          showAlternativeRoutes={true}
          showAllPorts={false}
          showFleet={false}
        />
      </div>

      {/* PROCEED ACTION */}
      <div className="flex justify-end pt-4 border-t border-[var(--color-brand-border)]">
        <Button onClick={onComplete} className="flex items-center gap-2 text-xs font-bold">
          CONTINUE TO FORECAST <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

