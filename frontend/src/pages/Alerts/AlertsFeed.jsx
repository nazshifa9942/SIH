import React from 'react';
import { Activity, Network, Wifi, Cpu } from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { getAlerts } from '../../api/alerts';

// ─── Initial telemetry state for the animated right column ───────────────────

const INITIAL_RADAR = [
  { subject: 'Network',  A: 98,  fullMark: 100 },
  { subject: 'Database', A: 85,  fullMark: 100 },
  { subject: 'API',      A: 100, fullMark: 100 },
  { subject: 'Storage',  A: 92,  fullMark: 100 },
  { subject: 'Auth',     A: 100, fullMark: 100 },
];

const INITIAL_LOAD = [
  { name: '00:00', cpu: 30, mem: 40 },
  { name: '00:05', cpu: 45, mem: 45 },
  { name: '00:10', cpu: 60, mem: 55 },
  { name: '00:15', cpu: 55, mem: 50 },
  { name: '00:20', cpu: 75, mem: 65 },
  { name: '00:25', cpu: 65, mem: 70 },
  { name: '00:30', cpu: 85, mem: 75 },
];

const INITIAL_UPLINK = [
  { name: 'PostgreSQL',          status: 'success', basePing: 12,  ping: '12ms'  },
  { name: 'Redis Cache',         status: 'success', basePing: 8,   ping: '8ms'   },
  { name: 'Optimization Engine', status: 'warning', basePing: 154, ping: '154ms' },
  { name: 'AIS Feed',            status: 'success', basePing: 24,  ping: '24ms'  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Maps a severity string to a Tailwind dot colour class.
 * error   → red
 * warning → amber
 * info    → blue
 * success → green
 */
const getSeverityDot = (severity) => {
  switch (severity) {
    case 'error':   return 'bg-[#ef4444]';
    case 'warning': return 'bg-[#f59e0b]';
    case 'info':    return 'bg-[#3b82f6]';
    case 'success': return 'bg-[#10b981]';
    default:        return 'bg-gray-500';
  }
};

/** Shared dot colour for the uplink/status rows (same mapping). */
const getStatusColor = (status) => getSeverityDot(status);

// ─── Component ───────────────────────────────────────────────────────────────

export const AlertsFeed = () => {
  // ── Real alerts from backend (null = loading) ──────────────────────────────
  const [alerts, setAlerts] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false;
    getAlerts()
      .then((data) => { if (!cancelled) setAlerts(data); })
      .catch(() => { if (!cancelled) setAlerts([]); }); // degrade gracefully
    return () => { cancelled = true; };
  }, []);

  // ── Animated telemetry state (right column) ────────────────────────────────
  const [radarData, setRadarData] = React.useState(INITIAL_RADAR);
  const [loadData,  setLoadData]  = React.useState(INITIAL_LOAD);
  const [uplinkData, setUplinkData] = React.useState(INITIAL_UPLINK);

  React.useEffect(() => {
    const interval = setInterval(() => {
      // Jitter radar data slightly
      setRadarData((prev) =>
        prev.map((item) => ({
          ...item,
          A: Math.min(100, Math.max(70, item.A + (Math.random() * 4 - 2))),
        }))
      );

      // Shift load data like a live ticker
      setLoadData((prev) => {
        const newData = [...prev.slice(1)];
        const last = prev[prev.length - 1];
        const [mins, secs] = last.name.split(':').map(Number);
        const nextSecs = (secs + 5) % 60;
        const nextMins = secs + 5 >= 60 ? (mins + 1) % 60 : mins;
        const nextTime = `${nextMins.toString().padStart(2, '0')}:${nextSecs.toString().padStart(2, '0')}`;
        newData.push({
          name: nextTime,
          cpu: Math.min(100, Math.max(10, last.cpu + (Math.random() * 20 - 10))),
          mem: Math.min(100, Math.max(10, last.mem + (Math.random() * 10 - 5))),
        });
        return newData;
      });

      // Fluctuate pings
      setUplinkData((prev) =>
        prev.map((item) => ({
          ...item,
          ping:
            Math.max(
              1,
              Math.round(
                item.basePing + (Math.random() * item.basePing * 0.2 - item.basePing * 0.1)
              )
            ) + 'ms',
        }))
      );
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const activeAlertCount = alerts ? alerts.filter((a) => !a.acknowledgedAt).length : '—';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 bg-[var(--color-brand-background)] min-h-screen text-white font-sans">
      <div className="grid grid-cols-12 gap-4">

        {/* ── LEFT COLUMN: System Diagnostics ── */}
        <div className="col-span-12 md:col-span-8 space-y-4">
          <Card className="bg-[var(--color-brand-elevated)] border border-white/[0.04] rounded-2xl shadow-lg backdrop-blur-md">
            <CardHeader className="border-b border-white/5 pb-4">
              <CardTitle className="text-[11px] uppercase tracking-[0.15em] flex items-center gap-2 text-[var(--color-brand-text-secondary)]">
                <Activity className="w-4 h-4" />
                SYSTEM DIAGNOSTICS
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">

              {/* Summary Stats Row */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-black/20 rounded-xl border border-white/5 p-3 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] uppercase tracking-[0.15em] text-gray-400 mb-1">SYSTEM HEALTH</span>
                  <span className="font-mono font-bold text-lg text-[#10b981]">98%</span>
                </div>
                <div className="bg-black/20 rounded-xl border border-white/5 p-3 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] uppercase tracking-[0.15em] text-gray-400 mb-1">ACTIVE ALERTS</span>
                  <span className="font-mono font-bold text-lg text-[#ef4444]">{activeAlertCount}</span>
                </div>
                <div className="bg-black/20 rounded-xl border border-white/5 p-3 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] uppercase tracking-[0.15em] text-gray-400 mb-1">AVG LATENCY</span>
                  <span className="font-mono font-bold text-lg text-white">24ms</span>
                </div>
                <div className="bg-black/20 rounded-xl border border-white/5 p-3 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] uppercase tracking-[0.15em] text-gray-400 mb-1">NETWORK</span>
                  <span className="font-mono font-bold text-lg text-[#3b82f6]">NOMINAL</span>
                </div>
              </div>

              {/* Event Stream */}
              <div>
                <h3 className="text-[11px] uppercase tracking-[0.15em] text-gray-400 mb-3">Event Stream</h3>

                {alerts === null ? (
                  /* Loading state */
                  <div className="flex items-center justify-center py-10">
                    <span className="font-mono text-xs text-gray-500 animate-pulse tracking-widest">
                      LOADING FEEDS...
                    </span>
                  </div>
                ) : alerts.length === 0 ? (
                  /* Empty state */
                  <div className="flex items-center justify-center py-10">
                    <span className="font-mono text-xs text-gray-500 tracking-widest">
                      NO ALERTS FOUND
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {alerts.map((alert) => (
                      <div
                        key={alert._id ?? alert.id}
                        className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0"
                      >
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${getSeverityDot(alert.severity)}`} />
                        <span className="font-mono text-xs text-gray-400 w-20 shrink-0">
                          {alert.triggeredAt
                            ? new Date(alert.triggeredAt).toLocaleTimeString()
                            : '—'}
                        </span>
                        <span className="text-sm text-gray-200">{alert.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </CardContent>
          </Card>
        </div>

        {/* ── RIGHT COLUMN: Topology Radar + Live Uplink + System Load ── */}
        <div className="col-span-12 md:col-span-4 space-y-4">

          {/* Topology Radar */}
          <Card className="bg-[var(--color-brand-elevated)] border border-white/[0.04] rounded-2xl shadow-lg backdrop-blur-md">
            <CardHeader className="border-b border-white/5 pb-4">
              <CardTitle className="text-[11px] uppercase tracking-[0.15em] flex items-center gap-2 text-[var(--color-brand-text-secondary)]">
                <Network className="w-4 h-4" />
                CONNECTION TOPOLOGY
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Health" dataKey="A" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Live Uplink */}
          <Card className="bg-[var(--color-brand-elevated)] border border-white/[0.04] rounded-2xl shadow-lg backdrop-blur-md">
            <CardHeader className="border-b border-white/5 pb-4">
              <CardTitle className="text-[11px] uppercase tracking-[0.15em] flex items-center gap-2 text-[var(--color-brand-text-secondary)]">
                <Wifi className="w-4 h-4" />
                LIVE UPLINK
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-col">
                {uplinkData.map((service, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-3 border-b border-dotted border-white/10 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(service.status)}`} />
                      <span className="text-sm text-gray-200">{service.name}</span>
                    </div>
                    <span className="font-mono text-xs text-gray-400">{service.ping}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* System Load */}
          <Card className="bg-[var(--color-brand-elevated)] border border-white/[0.04] rounded-2xl shadow-lg backdrop-blur-md">
            <CardHeader className="border-b border-white/5 pb-4">
              <CardTitle className="text-[11px] uppercase tracking-[0.15em] flex items-center gap-2 text-[var(--color-brand-text-secondary)]">
                <Cpu className="w-4 h-4" />
                SYSTEM LOAD
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={loadData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                  <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#191a23', border: '1px solid rgba(255,255,255,0.05)' }}
                    itemStyle={{ fontSize: '12px' }}
                    labelStyle={{ fontSize: '12px', color: '#9ca3af' }}
                  />
                  <Area type="monotone" dataKey="cpu" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="mem" stackId="2" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};
