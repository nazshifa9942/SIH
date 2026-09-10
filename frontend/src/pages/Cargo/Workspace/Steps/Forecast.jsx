import React, { useEffect, useState } from 'react';
import {
  forecastFreight,
  getForecastByCargoRequestId,
  getForecastHistory,
} from '../../../../api/forecast';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Calendar,
  Layers,
  Ship,
  RefreshCw,
} from 'lucide-react';

export const Forecast = ({ cargoId, cargo, onComplete, setForecastData }) => {
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [horizon, setHorizon] = useState(14);

  const chartData = forecast?.forecastJson || [];

  // Compute average predicted rate & trend
  const avgPredictedRate = chartData.length > 0
    ? chartData.reduce((acc, p) => acc + (parseFloat(p.predictedRate) || 0), 0) / chartData.length
    : null;

  const firstRate = chartData.length > 0 ? parseFloat(chartData[0].predictedRate) || 0 : 0;
  const lastRate = chartData.length > 0 ? parseFloat(chartData[chartData.length - 1].predictedRate) || 0 : 0;
  const trendPct = firstRate > 0 ? ((lastRate - firstRate) / firstRate) * 100 : 0;

  useEffect(() => {
    const loadForecast = async () => {
      try {
        setError('');
        const [data, historyData] = await Promise.all([
          getForecastByCargoRequestId(cargoId),
          getForecastHistory(cargoId).catch(() => []),
        ]);
        if (data && data.forecastJson) {
          setForecast(data);
          if (setForecastData) setForecastData(data);
        }
        setHistory(Array.isArray(historyData) ? historyData : []);
      } catch (error) {
        console.log('No existing forecast found.');
      }
    };

    if (cargoId) {
      loadForecast();
    }
  }, [cargoId, setForecastData]);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await forecastFreight({
        cargoRequestId: cargoId,
        forecastHorizonDays: Number(horizon),
      });

      setForecast(data);
      if (setForecastData) setForecastData(data);
    } catch (error) {
      console.error('Forecast generation failed:', error);

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error?.message ||
        'Failed to generate forecast. Please try again.';

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const originName = cargo?.originPort?.name || cargo?.originPortId || 'ORIGIN';
  const destName = cargo?.destinationPort?.name || cargo?.destinationPortId || 'DESTINATION';

  if (!forecast) {
    return (
      <div className="space-y-6">
        {/* CARGO CONTEXT HEADER */}
        {cargo && (
          <div className="p-4 border-y border-[var(--color-brand-border-strong)] text-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[var(--color-brand-text-secondary)]">
              <Ship className="w-4 h-4 text-[var(--color-status-info)]" />
              <span>Target Cargo: <strong className="text-[var(--color-brand-text-primary)]">{cargo.cargoType}</strong> ({Number(cargo.quantityMt).toLocaleString()} MT)</span>
            </div>
            <div className="text-[var(--color-brand-text-muted)]">
              Route: <span className="text-[var(--color-status-success)] font-bold">{originName}</span> ➔ <span className="text-[var(--color-status-error)] font-bold">{destName}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center justify-center p-10 border-y border-dashed border-[var(--color-brand-border-strong)]">
          <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-[var(--color-gov-saffron)]" />
          </div>

          <div className="text-[var(--color-brand-text-primary)] font-bold mb-1 uppercase tracking-wider text-base">
            GENERATE FREIGHT RATE ML FORECAST
          </div>

          <p className="text-sm text-center max-w-md text-[var(--color-brand-text-secondary)] mb-6">
            Forecast future route freight rates using AI historical time-series modeling for {originName} ➔ {destName}.
          </p>

          <div className="flex items-center gap-3 mb-6">
            <label className="text-xs uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
              Forecast Horizon:
            </label>

            <select
              value={horizon}
              onChange={(e) => setHorizon(Number(e.target.value))}
              disabled={loading}
              className="bg-[var(--color-brand-background)] border border-[var(--color-brand-border)] rounded-xl px-4 py-2 text-xs text-[var(--color-brand-text-primary)] outline-none"
            >
              <option value={7}>7 Days (Short-term)</option>
              <option value={14}>14 Days (Standard)</option>
              <option value={30}>30 Days (Monthly Outlook)</option>
              <option value={60}>60 Days (Extended Outlook)</option>
            </select>
          </div>

          {error && (
            <div className="w-full max-w-md mb-5 p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-[var(--color-status-error)] text-xs">
              {error}
            </div>
          )}

          <Button onClick={handleGenerate} disabled={loading} className="text-xs font-bold flex items-center gap-2">
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> GENERATING ML FORECAST...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> RUN FREIGHT FORECAST
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CARGO CONTEXT HEADER */}
      {cargo && (
        <div className="p-4 border-y border-[var(--color-brand-border-strong)] text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[var(--color-brand-text-secondary)]">
            <Ship className="w-4 h-4 text-[var(--color-status-info)]" />
            <span>Target Cargo: <strong className="text-[var(--color-brand-text-primary)]">{cargo.cargoType}</strong> ({Number(cargo.quantityMt).toLocaleString()} MT)</span>
          </div>
          <div className="text-[var(--color-brand-text-muted)]">
            Route: <span className="text-[var(--color-status-success)] font-bold">{originName}</span> ➔ <span className="text-[var(--color-status-error)] font-bold">{destName}</span>
          </div>
        </div>
      )}

      {/* FORECAST SUMMARY METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 border-t-2 border-blue-400 bg-[var(--color-brand-inset)]">
          <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
            Mean Forecasted Rate
          </div>
          <div className="text-2xl font-bold text-[var(--color-brand-text-primary)] mt-1">
            {avgPredictedRate !== null ? `$${avgPredictedRate.toFixed(2)}` : 'N/A'}
            <span className="text-xs text-[var(--color-brand-text-muted)] font-normal"> / MT</span>
          </div>
          <div className="text-[11px] text-[var(--color-brand-text-muted)] mt-0.5">Across {chartData.length} day horizon</div>
        </div>

        <div className="p-4 border-t-2 border-emerald-400 bg-[var(--color-brand-inset)]">
          <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
            Forecast Confidence
          </div>
          <div
            className={`text-2xl font-bold mt-1 ${
              forecast.confidence >= 0.7 ? 'text-[var(--color-status-success)]' : 'text-[var(--color-status-warning)]'
            }`}
          >
            {forecast.confidence !== undefined ? `${(forecast.confidence * 100).toFixed(1)}%` : 'N/A'}
          </div>
          <div className="text-[11px] text-[var(--color-brand-text-muted)] mt-0.5">
            {forecast.confidence >= 0.7 ? 'High Confidence' : 'Escalates Risk (Confidence < 70%)'}
          </div>
        </div>

        <div className="p-4 border-t-2 border-orange-400 bg-[var(--color-brand-inset)]">
          <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
            Rate Trajectory Trend
          </div>
          <div className="flex items-center gap-1.5 text-xl font-bold text-[var(--color-brand-text-primary)] mt-1">
            {trendPct > 0.5 ? (
              <>
                <TrendingUp className="w-5 h-5 text-[var(--color-status-error)]" />
                <span className="text-[var(--color-status-error)]">+{trendPct.toFixed(1)}% UP</span>
              </>
            ) : trendPct < -0.5 ? (
              <>
                <TrendingDown className="w-5 h-5 text-[var(--color-status-success)]" />
                <span className="text-[var(--color-status-success)]">{trendPct.toFixed(1)}% DOWN</span>
              </>
            ) : (
              <span className="text-[var(--color-status-info)]">STABLE (0.0%)</span>
            )}
          </div>
          <div className="text-[11px] text-[var(--color-brand-text-muted)] mt-0.5">Projected rate movement</div>
        </div>

        <div className="p-4 border-t-2 border-slate-400 bg-[var(--color-brand-inset)]">
          <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
            AI Model Engine
          </div>
          <div className="text-sm font-bold text-[var(--color-brand-text-primary)] mt-2 truncate">
            {forecast.modelVersion || 'PROPHET_TIME_SERIES_V1'}
          </div>
          <div className="text-[11px] text-[var(--color-brand-text-muted)] mt-0.5">{chartData.length} Daily Projections</div>
        </div>
      </div>

      {/* ACTION BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-sm font-bold text-[var(--color-brand-text-primary)] uppercase tracking-wider">
            PROJECTED FREIGHT RATE TRAJECTORY
          </div>
          <div className="text-xs text-[var(--color-brand-text-secondary)] mt-0.5">
            Daily predicted freight rate in USD per Metric Ton
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={horizon}
            onChange={(e) => setHorizon(Number(e.target.value))}
            disabled={loading}
            className="bg-[var(--color-brand-background)] border border-[var(--color-brand-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-brand-text-primary)] outline-none"
          >
            <option value={7}>7 Days</option>
            <option value={14}>14 Days</option>
            <option value={30}>30 Days</option>
            <option value={60}>60 Days</option>
          </select>

          <Button
            onClick={handleGenerate}
            disabled={loading}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            {loading ? 'REGENERATING...' : 'REGENERATE FORECAST'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-[var(--color-status-error)] text-xs">
          {error}
        </div>
      )}

      {/* CHART */}
      <div className="h-72 border border-[var(--color-brand-border)] bg-[var(--color-brand-background)] rounded-2xl p-4">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 10,
                right: 20,
                left: 10,
                bottom: 10,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />

              <XAxis
                dataKey="date"
                tick={{
                  fill: 'var(--color-brand-text-secondary)',
                  fontSize: 10,
                }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                  });
                }}
              />

              <YAxis
                tick={{
                  fill: 'var(--color-brand-text-secondary)',
                  fontSize: 10,
                }}
                domain={['auto', 'auto']}
                tickFormatter={(v) => `$${v}`}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-brand-elevated)',
                  border: '1px solid var(--color-brand-border)',
                  borderRadius: '12px',
                  color: 'white',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                }}
                labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                formatter={(value) => [`$${Number(value).toFixed(2)} / MT`, 'Predicted Freight Rate']}
              />

              {avgPredictedRate && (
                <ReferenceLine
                  y={avgPredictedRate}
                  stroke="#f97316"
                  strokeDasharray="3 3"
                  label={{ value: `Avg: $${avgPredictedRate.toFixed(2)}`, fill: '#f97316', fontSize: 10, position: 'insideTopRight' }}
                />
              )}

              <Line
                type="monotone"
                dataKey="predictedRate"
                stroke="var(--color-brand-accent, #f97316)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#f97316' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-[var(--color-brand-text-secondary)]">
            No forecast data available.
          </div>
        )}
      </div>

      {/* FORECAST DAILY SPREAD DATA TABLE */}
      {chartData.length > 0 && (
        <div className="border border-[var(--color-brand-border)] rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--color-brand-border)] bg-[var(--color-brand-inset)] flex justify-between items-center">
            <div className="text-xs uppercase tracking-widest text-[var(--color-brand-text-primary)] font-bold">
              DAILY PREDICTED RATES BREAKDOWN
            </div>
            <span className="text-[11px] text-[var(--color-brand-text-secondary)]">
              {chartData.length} DATA POINTS
            </span>
          </div>

          <div className="max-h-48 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-3">
              {chartData.map((item, index) => (
                <div
                  key={`${item.date}-${index}`}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-[var(--color-brand-border)] text-xs"
                >
                  <span className="text-[var(--color-brand-text-muted)]">
                    {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="font-bold text-[var(--color-brand-text-primary)]">
                    ${Number(item.predictedRate).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {history.length > 1 && (
        <div className="border border-[var(--color-brand-border)] rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--color-brand-border)] bg-[var(--color-brand-inset)] flex justify-between items-center">
            <div className="text-xs uppercase tracking-widest text-[var(--color-brand-text-primary)] font-bold">
              FORECAST RUN HISTORY
            </div>
            <span className="text-[11px] text-[var(--color-brand-text-secondary)]">
              {history.length} SAVED RUNS
            </span>
          </div>
          <div className="divide-y divide-white/5">
            {history.map((run) => (
              <div key={run.id} className="px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-[var(--color-brand-text-secondary)]">
                  {run.createdAt ? new Date(run.createdAt).toLocaleString() : 'Unknown date'}
                </span>
                <span className="text-[var(--color-brand-text-muted)]">
                  {Array.isArray(run.forecastJson) ? `${run.forecastJson.length} days` : 'N/A'}
                </span>
                <span className="font-bold text-[var(--color-status-success)]">
                  {run.confidence !== undefined ? `${(Number(run.confidence) * 100).toFixed(1)}% confidence` : 'N/A'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTINUE TO RISK BUTTON */}
      <div className="flex justify-end pt-4 border-t border-[var(--color-brand-border)]">
        <Button onClick={onComplete} className="flex items-center gap-2 text-xs font-bold">
          CONTINUE TO RISK <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};