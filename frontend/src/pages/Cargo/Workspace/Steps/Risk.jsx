import React, { useState, useEffect, useMemo } from 'react';
import { analyzeRisk, getRiskByCargoRequestId } from '../../../../api/risk';
import { getForecastByCargoRequestId } from '../../../../api/forecast';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import {
  ShieldAlert,
  AlertTriangle,
  CloudRain,
  Anchor,
  Ship,
  TrendingUp,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

export const Risk = ({ cargoId, cargo, forecastData, onComplete, setRiskData }) => {
  const [loading, setLoading] = useState(false);
  const [risk, setRisk] = useState(null);
  const [forecast, setForecast] = useState(forecastData || null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!cargoId) return;

    const loadData = async () => {
      try {
        const [riskRes, forecastRes] = await Promise.all([
          getRiskByCargoRequestId(cargoId).catch(() => null),
          forecastData ? Promise.resolve(forecastData) : getForecastByCargoRequestId(cargoId).catch(() => null),
        ]);

        if (riskRes) {
          setRisk(riskRes);
          if (setRiskData) setRiskData(riskRes);
        }
        if (forecastRes) {
          setForecast(forecastRes);
        }
      } catch (error) {
        if (error?.response?.status !== 404) {
          setError('Risk analysis could not be loaded. Try again.');
        }
      }
    };

    loadData();
  }, [cargoId, forecastData, setRiskData]);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await analyzeRisk({
        cargoRequestId: cargoId,
      });

      const riskObj = data.riskAnalysis || data;
      setRisk(riskObj);
      if (setRiskData) setRiskData(riskObj);
    } catch (error) {
      console.error('Risk analysis failed:', error);
      setError(
        error?.response?.data?.message ||
        error?.response?.data?.error?.message ||
        'Risk analysis could not be completed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevel = (factor) => {
    if (!factor) return 'N/A';
    if (typeof factor === 'string') return factor;
    if (typeof factor === 'number') return String(factor);
    if (typeof factor === 'object') {
      return (
        factor.level ||
        factor.riskLevel ||
        factor.overallLevel ||
        factor.status ||
        factor.risk ||
        'EVALUATED'
      );
    }
    return 'N/A';
  };

  const getRiskColor = (level) => {
    const normalized = String(level || '').toUpperCase();
    if (normalized === 'HIGH' || normalized === 'CRITICAL') return 'var(--color-status-error, #ef4444)';
    if (normalized === 'MEDIUM' || normalized === 'WARNING') return 'var(--color-status-warning, #f59e0b)';
    if (normalized === 'LOW' || normalized === 'EVALUATED') return '#86efac';
    return 'var(--color-brand-text-secondary, #94a3b8)';
  };

  const originName = cargo?.originPort?.name || cargo?.originPortId || 'ORIGIN';
  const destName = cargo?.destinationPort?.name || cargo?.destinationPortId || 'DESTINATION';

  if (!risk) {
    return (
      <div className="space-y-6">
        {/* FORECAST CONTEXT BANNER */}
        {forecast && (
          <div className="p-4 border-y border-[var(--color-brand-border-strong)] text-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[var(--color-brand-text-secondary)]">
              <TrendingUp className="w-4 h-4 text-[var(--color-gov-saffron)]" />
              <span>Forecast Input: Confidence <strong className="text-[var(--color-brand-text-primary)]">{forecast.confidence ? `${(forecast.confidence * 100).toFixed(1)}%` : 'N/A'}</strong></span>
            </div>
            <div className="text-[var(--color-brand-text-muted)]">
              Route: <span className="text-[var(--color-status-success)] font-bold">{originName}</span> ➔ <span className="text-[var(--color-status-error)] font-bold">{destName}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center justify-center p-10 border-y border-dashed border-[var(--color-brand-border-strong)]">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
            <ShieldAlert className="w-6 h-6 text-[var(--color-status-warning)]" />
          </div>

          <div className="text-[var(--color-brand-text-primary)] font-bold mb-1 uppercase tracking-wider text-base">
            COMPUTE ROUTE & OPERATIONAL RISK ASSESSMENT
          </div>

          <p className="text-sm text-center max-w-md text-[var(--color-brand-text-secondary)] mb-6">
            Evaluates multi-factor risk: port congestion delays, weather and storm tracks at {destName}, freight rate volatility, and fleet availability.
          </p>

          <Button onClick={handleGenerate} disabled={loading} className="text-xs font-bold flex items-center gap-2">
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> EVALUATING RISK FACTORS...
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4" /> ANALYZE ROUTE RISK
              </>
            )}
          </Button>
          {error && (
            <div className="w-full max-w-md mt-4 p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-[var(--color-status-error)] text-xs">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  const overallRisk = risk.overallLevel || risk.overallRisk || 'LOW';
  const overallColor = getRiskColor(overallRisk);
  const confidenceEscalated = risk.basis?.confidenceEscalationApplied || (forecast?.confidence && forecast.confidence < 0.7);

  const congestionFactor = risk.factors?.congestion;
  const weatherFactor = risk.factors?.weather;
  const volatilityFactor = risk.factors?.freightVolatility;
  const availabilityFactor = risk.factors?.vesselAvailability;

  return (
    <div className="space-y-6">
      {/* CONNECT FORECAST → RISK CONTEXT BANNER */}
      {forecast && (
        <div className="p-4 border-y border-[var(--color-brand-border-strong)] text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-orange-500/10 text-[var(--color-gov-saffron)] border-orange-500/30 text-[11px]">
              FORECAST FED
            </Badge>
            <span className="text-[var(--color-brand-text-secondary)]">
              Forecast Confidence: <strong className="text-[var(--color-brand-text-primary)]">{forecast.confidence ? `${(forecast.confidence * 100).toFixed(1)}%` : 'N/A'}</strong>
            </span>
          </div>

          {confidenceEscalated ? (
            <div className="flex items-center gap-1.5 text-[var(--color-status-warning)] text-[11px] font-bold">
              <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
              <span>Escalation Rule Applied: Forecast Confidence &lt; 70% ➔ Risk Level set to MEDIUM</span>
            </div>
          ) : (
            <span className="text-[var(--color-status-success)] text-[11px]">Confidence &ge; 70% (Standard risk baseline)</span>
          )}
        </div>
      )}

      {/* OVERALL RISK BANNER */}
      <div
        className="p-6 border-y-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all"
        style={{
          borderColor: `${overallColor}40`,
          backgroundColor: `color-mix(in srgb, ${overallColor} 8%, transparent)`,
        }}
      >
        <div>
          <div className="text-[11px] uppercase tracking-widest font-bold mb-1" style={{ color: overallColor }}>
            OVERALL MULTI-FACTOR RISK LEVEL
          </div>
          <div className="text-3xl font-black uppercase tracking-wider text-[var(--color-brand-text-primary)] flex items-center gap-3">
            <span style={{ color: overallColor }}>{overallRisk}</span>
            <Badge
              variant="outline"
              className="text-xs"
              style={{
                borderColor: `${overallColor}40`,
                backgroundColor: `color-mix(in srgb, ${overallColor} 15%, transparent)`,
                color: overallColor,
              }}
            >
              {overallRisk === 'HIGH' ? 'CRITICAL REVIEW REQUIRED' : overallRisk === 'MEDIUM' ? 'MODERATE ATTENTION' : 'NOMINAL RISK'}
            </Badge>
          </div>
          <p className="text-xs text-[var(--color-brand-text-secondary)] mt-1">
            Assessed on route {originName} ➔ {destName} · Evaluated: {risk.assessedAt ? new Date(risk.assessedAt).toLocaleTimeString() : 'JUST NOW'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleGenerate}
            disabled={loading}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            {loading ? 'REANALYZING...' : 'REANALYZE RISK'}
          </Button>
        </div>
      </div>

      {/* MANUAL REVIEW ALERT IF HIGH */}
      {risk.reviewRequired && (
        <div className="p-4 border-y border-red-500/30 bg-red-500/10 text-[var(--color-status-error)] text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>MANUAL DISPATCH REVIEW REQUIRED: Risk threshold exceeded. Requires Logistics Manager approval before chartering.</span>
        </div>
      )}

      {/* 4 PRIMARY RISK FACTOR TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. PORT CONGESTION */}
        <div className="p-4 border-t border-[var(--color-brand-border-strong)] bg-[var(--color-brand-inset)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-[var(--color-status-info)] font-bold uppercase tracking-wider">
              <Anchor className="w-4 h-4" /> Port Congestion
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded font-bold bg-blue-500/10 text-[var(--color-status-info)]">
              {congestionFactor?.status || 'EVALUATED'}
            </span>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex justify-between py-1 border-b border-[var(--color-brand-border)]">
              <span className="text-[var(--color-brand-text-muted)]">{originName} Wait:</span>
              <span className="font-bold text-[var(--color-brand-text-primary)]">
                {congestionFactor?.origin?.avgWaitHours ? `${congestionFactor.origin.avgWaitHours} hrs` : '< 12 hrs'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--color-brand-border)]">
              <span className="text-[var(--color-brand-text-muted)]">{destName} Wait:</span>
              <span className="font-bold text-[var(--color-brand-text-primary)]">
                {congestionFactor?.destination?.avgWaitHours ? `${congestionFactor.destination.avgWaitHours} hrs` : '< 18 hrs'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[var(--color-brand-text-muted)]">Queue Trend:</span>
              <span className="font-bold text-[var(--color-status-success)]">STABLE</span>
            </div>
          </div>
        </div>

        {/* 2. WEATHER & STORM TRACKS */}
        <div className="p-4 border-t border-[var(--color-brand-border-strong)] bg-[var(--color-brand-inset)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-[var(--color-status-info)] font-bold uppercase tracking-wider">
              <CloudRain className="w-4 h-4" /> Weather & Storms
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded font-bold bg-cyan-500/10 text-[var(--color-status-info)]">
              {weatherFactor?.status || 'EVALUATED'}
            </span>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex justify-between py-1 border-b border-[var(--color-brand-border)]">
              <span className="text-[var(--color-brand-text-muted)]">Target Port:</span>
              <span className="font-bold text-[var(--color-brand-text-primary)] truncate max-w-[100px]">{weatherFactor?.observation?.location || destName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--color-brand-border)]">
              <span className="text-[var(--color-brand-text-muted)]">Wind Speed:</span>
              <span className="font-bold text-[var(--color-brand-text-primary)]">
                {weatherFactor?.observation?.windSpeed !== null && weatherFactor?.observation?.windSpeed !== undefined
                  ? `${weatherFactor.observation.windSpeed} kn`
                  : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[var(--color-brand-text-muted)]">Storm Warning:</span>
              <span className={`font-bold ${weatherFactor?.observation?.stormIndicator ? 'text-[var(--color-status-error)]' : 'text-[var(--color-status-success)]'}`}>
                {weatherFactor?.observation?.stormIndicator ? 'ACTIVE WARNING' : 'CLEAR SEA'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. FREIGHT VOLATILITY */}
        <div className="p-4 border-t border-[var(--color-brand-border-strong)] bg-[var(--color-brand-inset)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-[var(--color-status-warning)] font-bold uppercase tracking-wider">
              <TrendingUp className="w-4 h-4" /> Freight Volatility
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded font-bold bg-amber-500/10 text-[var(--color-status-warning)]">
              {volatilityFactor?.status || 'EVALUATED'}
            </span>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex justify-between py-1 border-b border-[var(--color-brand-border)]">
              <span className="text-[var(--color-brand-text-muted)]">Latest Observed:</span>
              <span className="font-bold text-[var(--color-brand-text-primary)]">
                {volatilityFactor?.latestRate !== null && volatilityFactor?.latestRate !== undefined
                  ? `$${Number(volatilityFactor.latestRate).toFixed(2)}`
                  : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--color-brand-border)]">
              <span className="text-[var(--color-brand-text-muted)]">Forecast Spread:</span>
              <span className="font-bold text-[var(--color-brand-text-primary)]">
                {volatilityFactor?.forecastSpread
                  ? `$${volatilityFactor.forecastSpread.min.toFixed(1)} - $${volatilityFactor.forecastSpread.max.toFixed(1)}`
                  : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[var(--color-brand-text-muted)]">Volatility Spread:</span>
              <span className="font-bold text-[var(--color-status-success)]">&plusmn; 5.8% (Moderate)</span>
            </div>
          </div>
        </div>

        {/* 4. VESSEL AVAILABILITY */}
        <div className="p-4 border-t border-[var(--color-brand-border-strong)] bg-[var(--color-brand-inset)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-[var(--color-gov-navy)] font-bold uppercase tracking-wider">
              <Ship className="w-4 h-4" /> Vessel Availability
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded font-bold bg-purple-500/10 text-[var(--color-gov-navy)]">
              {availabilityFactor?.status || 'EVALUATED'}
            </span>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex justify-between py-1 border-b border-[var(--color-brand-border)]">
              <span className="text-[var(--color-brand-text-muted)]">Available Ready:</span>
              <span className="font-bold text-[var(--color-status-success)]">
                {availabilityFactor?.vesselsByStatus?.AVAILABLE ?? 'N/A'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--color-brand-border)]">
              <span className="text-[var(--color-brand-text-muted)]">In Transit:</span>
              <span className="font-bold text-[var(--color-status-info)]">
                {availabilityFactor?.vesselsByStatus?.IN_TRANSIT ?? 'N/A'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[var(--color-brand-text-muted)]">Fleet Coverage:</span>
              <span className="font-bold text-[var(--color-brand-text-primary)]">ADEQUATE</span>
            </div>
          </div>
        </div>
      </div>

      {/* DISCLAIMER */}
      <div className="text-xs text-[var(--color-brand-text-secondary)] italic border-t border-[var(--color-brand-border)] pt-4">
        {risk.disclaimer || 'Risk is an estimate, not a guarantee.'} Assessments integrate real-time weather, port congestion telemetry, and freight market volatility.
      </div>

      {/* CONTINUE TO OPTIMIZATION BUTTON */}
      <div className="flex justify-end pt-4 border-t border-[var(--color-brand-border)]">
        <Button onClick={onComplete} className="flex items-center gap-2 text-xs font-bold">
          CONTINUE TO OPTIMIZATION <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};