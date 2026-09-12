import React, { useEffect, useState } from 'react';

import {
  forecastFreight,
  getForecastByCargoRequestId,
  getForecastHistory,
} from '../../../../api/forecast';

import { Button } from '../../../../components/ui/Button';

import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  ArrowRight,
  Calendar,
  Ship,
  RefreshCw,
} from 'lucide-react';

export const Forecast = ({
  cargoId,
  cargo,
  onComplete,
  setForecastData,
}) => {
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [horizon, setHorizon] = useState(14);

  /*
   * REAL XGBoost response:
   *
   * forecastJson: {
   *   predictedFreightRate: 11.0463,
   *   unit: "USD/Tonne",
   *   route: {...},
   *   cargoType: "...",
   *   vesselType: "...",
   *   forecastDate: "..."
   * }
   *
   * Old/mock response may still be an array.
   * We support both formats.
   */
  const chartData = React.useMemo(() => {
    if (!forecast?.forecastJson) {
      return [];
    }

    // Old forecast format
    if (Array.isArray(forecast.forecastJson)) {
      return forecast.forecastJson
        .map((item) => ({
          date: item.date,
          predictedRate: Number(item.predictedRate),
        }))
        .filter(
          (item) =>
            item.date &&
            Number.isFinite(item.predictedRate)
        );
    }

    // REAL XGBoost format
    const realForecast = forecast.forecastJson;

    const rate = Number(
      realForecast.predictedFreightRate ??
      realForecast.prediction
    );

    if (!Number.isFinite(rate)) {
      return [];
    }

    return [
      {
        date:
          realForecast.forecastDate ||
          cargo?.requiredDate ||
          new Date().toISOString(),

        predictedRate: rate,
      },
    ];
  }, [forecast, cargo]);

  const isRealXGBoost =
    forecast?.modelVersion === 'real-xgboost';

  const avgPredictedRate =
    chartData.length > 0
      ? chartData.reduce(
        (sum, item) =>
          sum + Number(item.predictedRate || 0),
        0
      ) / chartData.length
      : null;

  /*
   * Real XGBoost currently returns a point prediction,
   * not a multi-day trajectory.
   *
   * Therefore we do NOT invent a trend.
   */
  const hasTrajectory =
    chartData.length > 1;

  const firstRate =
    hasTrajectory
      ? Number(chartData[0].predictedRate)
      : null;

  const lastRate =
    hasTrajectory
      ? Number(
        chartData[chartData.length - 1]
          .predictedRate
      )
      : null;

  const trendPct =
    hasTrajectory && firstRate > 0
      ? ((lastRate - firstRate) / firstRate) * 100
      : null;

  useEffect(() => {
    const loadForecast = async () => {
      try {
        setError('');

        const [data, historyData] =
          await Promise.all([
            getForecastByCargoRequestId(cargoId),
            getForecastHistory(cargoId).catch(
              () => []
            ),
          ]);

        if (data) {
          setForecast(data);

          if (setForecastData) {
            setForecastData(data);
          }
        }

        setHistory(
          Array.isArray(historyData)
            ? historyData
            : []
        );
      } catch (err) {
        console.log(
          'No existing forecast found.'
        );
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

      if (setForecastData) {
        setForecastData(data);
      }

      // Refresh history after new generation
      try {
        const historyData =
          await getForecastHistory(cargoId);

        setHistory(
          Array.isArray(historyData)
            ? historyData
            : []
        );
      } catch (historyError) {
        console.log(
          'Forecast history refresh skipped.'
        );
      }
    } catch (err) {
      console.error(
        'Forecast generation failed:',
        err
      );

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        'Failed to generate forecast. Please try again.';

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const originName =
    cargo?.originPort?.name ||
    cargo?.originPortId ||
    'ORIGIN';

  const destName =
    cargo?.destinationPort?.name ||
    cargo?.destinationPortId ||
    'DESTINATION';

  let forecastJson = forecast?.forecastJson || null;

if (typeof forecastJson === 'string') {
  try {
    forecastJson = JSON.parse(forecastJson);
  } catch (e) {
    console.error('Failed to parse forecastJson:', e);
  }
}

  const confidence =
    forecast?.confidence;

 const predictedRate =
  forecastJson
    ? Array.isArray(forecastJson)
      ? forecastJson.length > 0
        ? Number(
            forecastJson[0].predictedFreightRate ??
            forecastJson[0].predictedRate
          )
        : null
      : Number(
          forecastJson.predictedFreightRate ??
          forecastJson.prediction
        )
    : avgPredictedRate;

  const forecastUnit =
    forecastJson &&
      !Array.isArray(forecastJson)
      ? forecastJson.unit ||
      'USD/Tonne'
      : 'USD/Tonne';

  /*
   * ---------------------------------------------------------
   * NO FORECAST STATE
   * ---------------------------------------------------------
   */

  if (!forecast) {
    return (
      <div className="space-y-6">

        {cargo && (
          <div className="p-4 border-y border-[var(--color-brand-border-strong)] text-xs flex flex-wrap items-center justify-between gap-3">

            <div className="flex items-center gap-2 text-[var(--color-brand-text-secondary)]">

              <Ship className="w-4 h-4 text-[var(--color-status-info)]" />

              <span>
                Target Cargo:{' '}
                <strong className="text-[var(--color-brand-text-primary)]">
                  {cargo.cargoType}
                </strong>{' '}
                (
                {Number(
                  cargo.quantityMt
                ).toLocaleString()}{' '}
                MT)
              </span>

            </div>

            <div className="text-[var(--color-brand-text-muted)]">
              Route:{' '}
              <span className="text-[var(--color-status-success)] font-bold">
                {originName}
              </span>{' '}
              ➔{' '}
              <span className="text-[var(--color-status-error)] font-bold">
                {destName}
              </span>
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
            Generate a freight-rate prediction
            using the trained XGBoost forecasting
            model for {originName} ➔ {destName}.
          </p>

          <div className="flex items-center gap-3 mb-6">

            <label className="text-xs uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
              Forecast Horizon:
            </label>

            <select
              value={horizon}
              onChange={(e) =>
                setHorizon(
                  Number(e.target.value)
                )
              }
              disabled={loading}
              className="bg-[var(--color-brand-background)] border border-[var(--color-brand-border)] rounded-xl px-4 py-2 text-xs text-[var(--color-brand-text-primary)] outline-none"
            >
              <option value={7}>
                7 Days
              </option>

              <option value={14}>
                14 Days
              </option>

              <option value={30}>
                30 Days
              </option>

              <option value={60}>
                60 Days
              </option>
            </select>

          </div>

          {error && (
            <div className="w-full max-w-md mb-5 p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-[var(--color-status-error)] text-xs">
              {error}
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="text-xs font-bold flex items-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                GENERATING REAL ML FORECAST...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                RUN FREIGHT FORECAST
              </>
            )}
          </Button>

        </div>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * FORECAST RESULT
   * ---------------------------------------------------------
   */

  return (
    <div className="space-y-6">

      {/* CARGO CONTEXT */}

      {cargo && (
        <div className="p-4 border-y border-[var(--color-brand-border-strong)] text-xs flex flex-wrap items-center justify-between gap-3">

          <div className="flex items-center gap-2 text-[var(--color-brand-text-secondary)]">

            <Ship className="w-4 h-4 text-[var(--color-status-info)]" />

            <span>
              Target Cargo:{' '}
              <strong className="text-[var(--color-brand-text-primary)]">
                {cargo.cargoType}
              </strong>{' '}
              (
              {Number(
                cargo.quantityMt
              ).toLocaleString()}{' '}
              MT)
            </span>

          </div>

          <div className="text-[var(--color-brand-text-muted)]">
            Route:{' '}
            <span className="text-[var(--color-status-success)] font-bold">
              {originName}
            </span>{' '}
            ➔{' '}
            <span className="text-[var(--color-status-error)] font-bold">
              {destName}
            </span>
          </div>

        </div>
      )}

      {/* SUMMARY */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        {/* RATE */}

        <div className="p-4 border-t-2 border-blue-400 bg-[var(--color-brand-inset)]">

          <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
            Mean Forecasted Rate
          </div>

          <div className="text-2xl font-bold text-[var(--color-brand-text-primary)] mt-1">

            {Number.isFinite(
              predictedRate
            )
              ? `$${predictedRate.toFixed(2)}`
              : 'N/A'}

            <span className="text-xs text-[var(--color-brand-text-muted)] font-normal">
              {' '}
              / MT
            </span>

          </div>

          <div className="text-[11px] text-[var(--color-brand-text-muted)] mt-0.5">
            Real model prediction
          </div>

        </div>

        {/* CONFIDENCE */}

        <div className="p-4 border-t-2 border-emerald-400 bg-[var(--color-brand-inset)]">

          <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
            Forecast Confidence
          </div>

          <div className="text-2xl font-bold text-[var(--color-brand-text-primary)] mt-1">

            {confidence !== null &&
              confidence !== undefined &&
              Number.isFinite(
                Number(confidence)
              )
              ? `${(
                Number(confidence) *
                100
              ).toFixed(1)}%`
              : 'N/A'}

          </div>

          <div className="text-[11px] text-[var(--color-brand-text-muted)] mt-0.5">
            {confidence !== null &&
              confidence !== undefined
              ? 'Model confidence'
              : 'Not provided by XGBoost model'}
          </div>

        </div>

        {/* TREND */}

        <div className="p-4 border-t-2 border-orange-400 bg-[var(--color-brand-inset)]">

          <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
            Rate Trajectory
          </div>

          <div className="flex items-center gap-1.5 text-xl font-bold mt-1">

            {trendPct === null ? (
              <span className="text-[var(--color-status-info)]">
                POINT FORECAST
              </span>
            ) : trendPct > 0.5 ? (
              <>
                <TrendingUp className="w-5 h-5 text-[var(--color-status-error)]" />

                <span className="text-[var(--color-status-error)]">
                  +{trendPct.toFixed(1)}% UP
                </span>
              </>
            ) : trendPct < -0.5 ? (
              <>
                <TrendingDown className="w-5 h-5 text-[var(--color-status-success)]" />

                <span className="text-[var(--color-status-success)]">
                  {trendPct.toFixed(1)}% DOWN
                </span>
              </>
            ) : (
              <span className="text-[var(--color-status-info)]">
                STABLE
              </span>
            )}

          </div>

          <div className="text-[11px] text-[var(--color-brand-text-muted)] mt-0.5">
            {hasTrajectory
              ? 'Based on forecast trajectory'
              : 'Single real-model prediction'}
          </div>

        </div>

        {/* MODEL */}

        <div className="p-4 border-t-2 border-slate-400 bg-[var(--color-brand-inset)]">

          <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
            AI Model Engine
          </div>

          <div className="text-sm font-bold text-[var(--color-brand-text-primary)] mt-2 truncate">
            {forecast.modelVersion ||
              'real-xgboost'}
          </div>

          <div className="text-[11px] text-[var(--color-brand-text-muted)] mt-0.5">
            {isRealXGBoost
              ? 'Trained XGBoost model'
              : 'Forecast model'}
          </div>

        </div>

      </div>

      {/* ACTION BAR */}

      <div className="flex flex-wrap items-center justify-between gap-4">

        <div>

          <div className="text-sm font-bold text-[var(--color-brand-text-primary)] uppercase tracking-wider">
            FREIGHT RATE FORECAST
          </div>

          <div className="text-xs text-[var(--color-brand-text-secondary)] mt-0.5">
            Predicted freight rate in{' '}
            {forecastUnit}
          </div>

        </div>

        <div className="flex items-center gap-3">

          <select
            value={horizon}
            onChange={(e) =>
              setHorizon(
                Number(e.target.value)
              )
            }
            disabled={loading}
            className="bg-[var(--color-brand-background)] border border-[var(--color-brand-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-brand-text-primary)] outline-none"
          >
            <option value={7}>
              7 Days
            </option>

            <option value={14}>
              14 Days
            </option>

            <option value={30}>
              30 Days
            </option>

            <option value={60}>
              60 Days
            </option>
          </select>

          <Button
            onClick={handleGenerate}
            disabled={loading}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            {loading
              ? 'REGENERATING...'
              : 'REGENERATE FORECAST'}
          </Button>

        </div>

      </div>

      {/* ERROR */}

      {error && (
        <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-[var(--color-status-error)] text-xs">
          {error}
        </div>
      )}

      {/* REAL MODEL RESULT */}

      <div className="border border-[var(--color-brand-border)] bg-[var(--color-brand-background)] rounded-2xl p-6">

        <div className="flex items-center justify-between mb-5">

          <div>
            <div className="text-sm font-bold text-[var(--color-brand-text-primary)] uppercase tracking-wider">
              MODEL PREDICTION
            </div>

            <div className="text-xs text-[var(--color-brand-text-secondary)] mt-1">
              Real XGBoost freight-rate prediction
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 text-xs font-bold">
            {forecast.modelVersion ||
              'real-xgboost'}
          </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div className="p-5 border border-[var(--color-brand-border)] rounded-xl bg-[var(--color-brand-inset)]">

            <div className="text-[10px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
              Predicted Freight Rate
            </div>

            <div className="text-3xl font-bold text-[var(--color-brand-text-primary)] mt-2">

              {Number.isFinite(
                predictedRate
              )
                ? `$${predictedRate.toFixed(2)}`
                : 'N/A'}

            </div>

            <div className="text-xs text-[var(--color-brand-text-muted)] mt-1">
              {forecastUnit}
            </div>

          </div>

          <div className="p-5 border border-[var(--color-brand-border)] rounded-xl bg-[var(--color-brand-inset)]">

            <div className="text-[10px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
              Forecast Date
            </div>

            <div className="flex items-center gap-2 text-lg font-bold text-[var(--color-brand-text-primary)] mt-2">

              <Calendar className="w-5 h-5 text-[var(--color-status-info)]" />

              {forecastJson &&
                !Array.isArray(
                  forecastJson
                ) &&
                forecastJson.forecastDate
                ? new Date(
                  forecastJson.forecastDate
                ).toLocaleDateString(
                  'en-US',
                  {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  }
                )
                : cargo?.requiredDate
                  ? new Date(
                    cargo.requiredDate
                  ).toLocaleDateString(
                    'en-US',
                    {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    }
                  )
                  : 'N/A'}

            </div>

          </div>

          <div className="p-5 border border-[var(--color-brand-border)] rounded-xl bg-[var(--color-brand-inset)]">

            <div className="text-[10px] uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
              Route
            </div>

            <div className="text-lg font-bold text-[var(--color-brand-text-primary)] mt-2">
              {originName} → {destName}
            </div>

            <div className="text-xs text-[var(--color-brand-text-muted)] mt-1">
              {cargo?.cargoType || 'Cargo'}
            </div>

          </div>

        </div>

      </div>

      {/* DAILY DATA */}

      {Array.isArray(
        forecastJson
      ) &&
        chartData.length > 0 && (
          <div className="border border-[var(--color-brand-border)] rounded-2xl overflow-hidden">

            <div className="px-5 py-3 border-b border-[var(--color-brand-border)] bg-[var(--color-brand-inset)] flex justify-between items-center">

              <div className="text-xs uppercase tracking-widest text-[var(--color-brand-text-primary)] font-bold">
                DAILY PREDICTED RATES
              </div>

              <span className="text-[11px] text-[var(--color-brand-text-secondary)]">
                {chartData.length} DATA POINTS
              </span>

            </div>

            <div className="max-h-48 overflow-y-auto">

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-3">

                {chartData.map(
                  (item, index) => (
                    <div
                      key={`${item.date}-${index}`}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-[var(--color-brand-border)] text-xs"
                    >

                      <span className="text-[var(--color-brand-text-muted)]">
                        {new Date(
                          item.date
                        ).toLocaleDateString(
                          'en-US',
                          {
                            month: 'short',
                            day: 'numeric',
                          }
                        )}
                      </span>

                      <span className="font-bold text-[var(--color-brand-text-primary)]">
                        $
                        {Number(
                          item.predictedRate
                        ).toFixed(2)}
                      </span>

                    </div>
                  )
                )}

              </div>

            </div>

          </div>
        )}

      {/* HISTORY */}

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

            {history.map((run) => {

              const runJson =
                run.forecastJson;

              const runRate =
                Array.isArray(runJson)
                  ? runJson.length > 0
                    ? Number(
                      runJson[0].predictedFreightRate ??
                      runJson[0].predictedRate
                    )
                    : null
                  : Number(
                    runJson?.predictedFreightRate ??
                    runJson?.prediction
                  );

              return (
                <div
                  key={run.id}
                  className="px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs"
                >

                  <span className="text-[var(--color-brand-text-secondary)]">
                    {run.createdAt
                      ? new Date(
                        run.createdAt
                      ).toLocaleString()
                      : 'Unknown date'}
                  </span>

                  <span className="text-[var(--color-brand-text-muted)]">
                    {Number.isFinite(
                      runRate
                    )
                      ? `$${runRate.toFixed(2)} / MT`
                      : 'N/A'}
                  </span>

                  <span className="font-bold text-[var(--color-status-success)]">
                    {run.modelVersion ||
                      'real-xgboost'}
                  </span>

                </div>
              );
            })}

          </div>

        </div>
      )}

      {/* CONTINUE */}

      <div className="flex justify-end pt-4 border-t border-[var(--color-brand-border)]">

        <Button
          onClick={onComplete}
          className="flex items-center gap-2 text-xs font-bold"
        >
          CONTINUE TO RISK
          <ArrowRight className="w-4 h-4" />
        </Button>

      </div>

    </div>
  );
};