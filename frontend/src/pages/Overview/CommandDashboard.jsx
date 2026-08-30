import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { getCargoList } from '../../api/cargo';
import { getFreightMarketData } from '../../api/market';
import { getAlerts } from '../../api/alerts';
import { 
  Globe, 
  Map, 
  Ship, 
  Anchor, 
  AlertTriangle, 
  CheckCircle, 
  TrendingDown, 
  TrendingUp, 
  Activity,
  List,
  Info,
  ChevronRight,
  ShieldAlert,
  Server,
  Zap,
  Radio,
  MapPin,
  Clock,
  ArrowRight
} from 'lucide-react';

export const CommandDashboard = () => {
  const [telemetry, setTelemetry] = useState({
    freight: 25.11,
    fuel: 682.40,
    congestion: 3.2,
    volatility: 12.4
  });
  const [activeCargo, setActiveCargo] = useState(null);
  const [eventAlerts, setEventAlerts] = useState([]);

  useEffect(() => {
    // Fetch cargo, market freight rate, and alerts on mount
    const fetchData = async () => {
      try {
        const cargoData = await getCargoList();
        if (cargoData && cargoData.length > 0) {
          setActiveCargo(cargoData[0]);
        }
      } catch (err) {
        console.error('Failed to fetch cargo:', err);
      }

      try {
        const marketData = await getFreightMarketData();
        if (marketData && marketData.length > 0) {
          const latestRate = Number(marketData[marketData.length - 1].rateValue);
          setTelemetry(prev => ({ ...prev, freight: latestRate }));
        }
      } catch (err) {
        console.error('Failed to fetch freight market data:', err);
      }

      try {
        const alertsData = await getAlerts();
        if (alertsData && alertsData.length > 0) {
          setEventAlerts(alertsData.slice(0, 4));
        }
      } catch (err) {
        console.error('Failed to fetch alerts:', err);
      }
    };

    fetchData();

    const interval = setInterval(() => {
      setTelemetry(prev => ({
        ...prev,
        fuel: prev.fuel + (Math.random() * 2 - 1),
        congestion: Math.max(1.0, Math.min(5.0, prev.congestion + (Math.random() * 0.2 - 0.1))),
        volatility: Math.max(5.0, Math.min(25.0, prev.volatility + (Math.random() * 0.4 - 0.2)))
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-brand-background)] text-[var(--color-brand-text-primary)] p-4 font-sans">
      <div className="grid grid-cols-12 gap-4 h-full">
        {/* LEFT COLUMN */}
        <div className="col-span-3 flex flex-col gap-4">
          
          {/* SELECTED CARGO */}
          <Card className="bg-[var(--color-brand-elevated)] border-white/[0.04] rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-[11px] uppercase tracking-[0.15em] flex items-center gap-2 text-[var(--color-brand-text-secondary)]">
                <Ship className="w-4 h-4" />
                Selected Cargo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-mono font-bold text-white">
                    {activeCargo ? activeCargo.cargoType.toUpperCase() : 'IRON ORE'}
                  </h3>
                  <p className="font-mono text-sm text-[var(--color-brand-text-secondary)]">
                    {activeCargo ? `${Number(activeCargo.quantityMt).toLocaleString()} MT` : '55,000 MT'}
                  </p>
                </div>
                <Badge variant="outline" className="border-white/10 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-status-success)]" />
                  {activeCargo ? activeCargo.status.toUpperCase() : 'ACTIVE'}
                </Badge>
              </div>
              
              <div className="space-y-3 mt-6">
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-[var(--color-brand-text-secondary)]" />
                  <div className="font-mono text-sm flex items-center gap-2">
                    {activeCargo ? activeCargo.originPort.name.toUpperCase() : 'NEWCASTLE'}
                    <ArrowRight className="w-3 h-3 text-[var(--color-brand-text-secondary)]" />
                    {activeCargo ? activeCargo.destinationPort.name.toUpperCase() : 'PARADIP'}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-[var(--color-brand-text-secondary)]" />
                  <div className="font-mono text-sm text-[var(--color-brand-text-secondary)]">
                    Req: {activeCargo
                      ? new Date(activeCargo.requiredDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : 'OCT 15 - OCT 25'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PROCUREMENT RECOMMENDATION */}
          <Card className="bg-[var(--color-brand-elevated)] border-white/[0.04] rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            <CardHeader className="pb-2">
              <CardTitle className="text-[11px] uppercase tracking-[0.15em] flex items-center gap-2 text-[var(--color-brand-text-secondary)]">
                <Zap className="w-4 h-4" />
                Procurement Recommendation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-6">
                <h1 className="text-6xl font-bold font-mono tracking-wider text-orange-500 mb-2">WAIT</h1>
                <div className="flex items-center gap-2 mb-4">
                  <div className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-brand-text-secondary)]">Confidence</div>
                  <div className="font-mono text-lg font-bold text-white">85%</div>
                </div>
                <p className="text-sm text-center text-[var(--color-brand-text-secondary)] leading-relaxed">
                  Market indicators suggest freight rates will drop by 3-5% in the next 7 days due to easing port congestion.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* SYSTEM HEALTH */}
          <Card className="bg-[var(--color-brand-elevated)] border-white/[0.04] rounded-2xl flex-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-[11px] uppercase tracking-[0.15em] flex items-center gap-2 text-[var(--color-brand-text-secondary)]">
                <Activity className="w-4 h-4" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/20 rounded-xl border border-white/5 p-3">
                  <div className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-brand-text-secondary)] mb-2">Forecast</div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-status-success)]" />
                    <span className="font-mono text-sm font-bold text-white">9/10</span>
                  </div>
                </div>
                <div className="bg-black/20 rounded-xl border border-white/5 p-3">
                  <div className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-brand-text-secondary)] mb-2">Risk</div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-status-warning)]" />
                    <span className="font-mono text-sm font-bold text-white">MEDIUM</span>
                  </div>
                </div>
                <div className="bg-black/20 rounded-xl border border-white/5 p-3">
                  <div className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-brand-text-secondary)] mb-2">Optimization</div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-status-success)]" />
                    <span className="font-mono text-sm font-bold text-white">READY</span>
                  </div>
                </div>
                <div className="bg-black/20 rounded-xl border border-white/5 p-3">
                  <div className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-brand-text-secondary)] mb-2">Data Stream</div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-status-info)]" />
                    <span className="font-mono text-sm font-bold text-white">ACTIVE</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CENTER COLUMN */}
        <div className="col-span-6 flex flex-col relative rounded-2xl overflow-hidden border border-white/[0.04] bg-[#0a0a0f]">
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgc3Ryb2tlPSIjZmZmZmZmMDgiIGZpbGw9Im5vbmUiPjxwaGF0IGQ9Ik0wIDQwaDQwVjBIMHoiLz48L2c+PC9zdmc+')] opacity-20 pointer-events-none" />
          
          {/* Center Globe */}
          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30">
            <Globe className="w-32 h-32 mb-4 text-[var(--color-brand-text-secondary)]" />
            <div className="text-[14px] uppercase tracking-[0.3em] text-[var(--color-brand-text-secondary)]">Route Visualization</div>
          </div>

          {/* Top-left Overlay */}
          <div className="absolute top-4 left-4 p-4 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 flex flex-col gap-1">
            <div className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-brand-text-secondary)]">Active Route</div>
            <div className="font-mono text-sm font-bold text-white flex items-center gap-2">
              NEWCASTLE <ArrowRight className="w-3 h-3 text-[var(--color-brand-text-secondary)]" /> PARADIP
            </div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-brand-text-secondary)] mt-2">Est. Time Enroute</div>
            <div className="font-mono text-lg text-white">14d 08h</div>
          </div>

          {/* Bottom Timeline Bar Overlay */}
          <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-black/40 backdrop-blur-md border border-white/10">
            <div className="flex justify-between items-center relative z-10">
              {['ORIGIN', 'SEA', 'CANAL', 'SEA', 'DEST'].map((wp, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 bg-black/60 px-3 py-1.5 rounded-lg border border-white/5">
                  <div className={`w-2 h-2 rounded-full ${idx <= 1 ? 'bg-[var(--color-status-info)]' : 'bg-white/20'}`} />
                  <div className="text-[10px] uppercase tracking-[0.1em] text-white/70">{wp}</div>
                </div>
              ))}
            </div>
            {/* Connecting line */}
            <div className="absolute top-7 left-10 right-10 h-px bg-white/10 z-0" />
            <div className="absolute top-7 left-10 right-1/2 h-px bg-[var(--color-status-info)] z-0" />
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="col-span-3 flex flex-col gap-4">
          
          {/* LIVE TELEMETRY */}
          <Card className="bg-[var(--color-brand-elevated)] border-white/[0.04] rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-[11px] uppercase tracking-[0.15em] flex items-center gap-2 text-[var(--color-brand-text-secondary)]">
                <Radio className="w-4 h-4" />
                Live Telemetry
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mt-2">
                
                <div className="flex justify-between items-center border-b border-white/[0.04] border-dashed pb-3">
                  <span className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-brand-text-secondary)]">Freight Rate</span>
                  <div className="flex items-center gap-2 font-mono font-bold text-white transition-all">
                    ${telemetry.freight.toFixed(2)}/MT <TrendingDown className="w-3 h-3 text-[var(--color-status-error)]" />
                  </div>
                </div>

                <div className="flex justify-between items-center border-b border-white/[0.04] border-dashed pb-3">
                  <span className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-brand-text-secondary)]">Fuel Price</span>
                  <div className="flex items-center gap-2 font-mono font-bold text-white transition-all">
                    ${telemetry.fuel.toFixed(2)}/MT
                  </div>
                </div>

                <div className="flex justify-between items-center border-b border-white/[0.04] border-dashed pb-3">
                  <span className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-brand-text-secondary)]">Port Congestion</span>
                  <div className="flex items-center gap-2 font-mono font-bold text-[var(--color-status-warning)] transition-all">
                    {telemetry.congestion.toFixed(1)}
                  </div>
                </div>

                <div className="flex justify-between items-center border-b border-white/[0.04] border-dashed pb-3">
                  <span className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-brand-text-secondary)]">Weather Risk</span>
                  <div className="flex items-center gap-2 font-mono font-bold text-[var(--color-status-success)]">
                    LOW
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-brand-text-secondary)]">Market Volatility</span>
                  <div className="flex items-center gap-2 font-mono font-bold text-[var(--color-status-warning)] transition-all">
                    {telemetry.volatility.toFixed(1)}%
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* EVENT LOG */}
          <Card className="bg-[var(--color-brand-elevated)] border-white/[0.04] rounded-2xl flex-1 flex flex-col">
            <CardHeader className="pb-0 border-b border-white/[0.04]">
              <div className="flex justify-between items-center mb-3">
                <CardTitle className="text-[11px] uppercase tracking-[0.15em] flex items-center gap-2 text-[var(--color-brand-text-secondary)]">
                  <List className="w-4 h-4" />
                  Event Log
                </CardTitle>
                <div className="flex gap-2">
                  <button className="text-[9px] uppercase tracking-wider text-white bg-white/10 px-2 py-1 rounded">ALL</button>
                  <button className="text-[9px] uppercase tracking-wider text-[var(--color-brand-text-secondary)] hover:text-white px-2 py-1">ALERTS</button>
                  <button className="text-[9px] uppercase tracking-wider text-[var(--color-brand-text-secondary)] hover:text-white px-2 py-1">INFO</button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 pt-4 overflow-y-auto">
              <div className="space-y-4">
              {eventAlerts.length > 0 ? (() => {
                  const alertMeta = {
                    WEATHER: { code: 'WTH-ALERT', color: 'var(--color-status-error)' },
                    MARKET:  { code: 'FRC-UPDATE', color: 'var(--color-status-warning)' },
                    VESSEL:  { code: 'SYS-SYNC',  color: 'var(--color-status-info)' },
                    SYSTEM:  { code: 'OPT-COMPL', color: 'var(--color-status-success)' },
                  };
                  return eventAlerts.map((a, idx) => {
                    const meta = alertMeta[a.alertType] || { code: a.alertType, color: 'var(--color-brand-text-secondary)' };
                    return (
                      <div key={a.id ?? idx} className="flex gap-3 items-start">
                        <div className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
                        <div className="flex flex-col gap-1 w-full">
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-[10px] text-[var(--color-brand-text-secondary)]">
                              {new Date(a.triggeredAt).toLocaleTimeString()}
                            </span>
                            <span className="font-mono text-[10px]" style={{ color: meta.color }}>{meta.code}</span>
                          </div>
                          <p className="text-xs text-white/80 leading-relaxed">{a.message}</p>
                        </div>
                      </div>
                    );
                  });
                })() : (
                <>
                  <div className="flex gap-3 items-start">
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-[var(--color-status-warning)] shrink-0" />
                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-[10px] text-[var(--color-brand-text-secondary)]">14:22:05Z</span>
                        <span className="font-mono text-[10px] text-[var(--color-status-warning)]">FRC-UPDATE</span>
                      </div>
                      <p className="text-xs text-white/80 leading-relaxed">Capesize index dropped 2%. Re-running optimization model.</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-[var(--color-status-info)] shrink-0" />
                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-[10px] text-[var(--color-brand-text-secondary)]">13:10:41Z</span>
                        <span className="font-mono text-[10px] text-[var(--color-status-info)]">SYS-SYNC</span>
                      </div>
                      <p className="text-xs text-white/80 leading-relaxed">Port congestion data synced from external provider.</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-[var(--color-status-success)] shrink-0" />
                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-[10px] text-[var(--color-brand-text-secondary)]">11:45:12Z</span>
                        <span className="font-mono text-[10px] text-[var(--color-status-success)]">OPT-COMPL</span>
                      </div>
                      <p className="text-xs text-white/80 leading-relaxed">Route optimization complete. Found 3 viable vessel candidates.</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-[var(--color-status-error)] shrink-0" />
                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-[10px] text-[var(--color-brand-text-secondary)]">09:12:33Z</span>
                        <span className="font-mono text-[10px] text-[var(--color-status-error)]">WTH-ALERT</span>
                      </div>
                      <p className="text-xs text-white/80 leading-relaxed">Typhoon warning near South China Sea. Route risk elevated.</p>
                    </div>
                  </div>
                </>
              )}</div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};
