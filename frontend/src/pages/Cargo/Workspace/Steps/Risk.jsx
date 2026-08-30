import React, { useState, useEffect } from 'react';
import { analyzeRisk, getRiskByCargoRequestId } from '../../../../api/risk';
import { Button } from '../../../../components/ui/Button';

export const Risk = ({ cargoId, onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [risk, setRisk] = useState(null);

  useEffect(() => {
    if (!cargoId) return;

    const loadRisk = async () => {
      try {
        const data = await getRiskByCargoRequestId(cargoId);

        console.log('Existing risk response:', data);

        if (data && data.overallRisk) {
          setRisk(data);
        }
      } catch (error) {
        console.log('No existing risk analysis found.');
      }
    };

    loadRisk();
  }, [cargoId]);

  const handleGenerate = async () => {
    setLoading(true);

    try {
      const data = await analyzeRisk({
        cargoRequestId: cargoId,
      });

      console.log('Risk response:', data);

      setRisk(data.riskAnalysis || data);
    } catch (error) {
      console.error('Risk analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    onComplete(true);
  };

  /*
   * Some risk factors are strings such as:
   * "LOW", "MEDIUM", "HIGH"
   *
   * Other factors can be objects such as:
   * {
   *   status: "LOW",
   *   origin: ...,
   *   destination: ...,
   *   change: ...
   * }
   *
   * This function safely converts either format into something
   * React can render.
   */
  const getRiskLevel = (factor) => {
    if (!factor) {
      return 'N/A';
    }

    if (typeof factor === 'string') {
      return factor;
    }

    if (typeof factor === 'number') {
      return String(factor);
    }

    if (typeof factor === 'object') {
      return (
        factor.level ||
        factor.riskLevel ||
        factor.overallLevel ||
        factor.status ||
        factor.risk ||
        'N/A'
      );
    }

    return 'N/A';
  };

  const getRiskColor = (level) => {
    const normalized = String(level || '').toUpperCase();

    if (normalized === 'HIGH') {
      return 'var(--color-status-error)';
    }

    if (normalized === 'MEDIUM') {
      return 'var(--color-status-warning)';
    }

    if (normalized === 'LOW') {
      return 'var(--color-status-success)';
    }

    return 'var(--color-brand-text-secondary)';
  };

  if (!risk) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-dashed border-[var(--color-brand-border)] rounded">

        <div className="text-[var(--color-brand-text-secondary)] mb-4 uppercase text-sm tracking-wider">
          NO RISK ANALYSIS AVAILABLE
        </div>

        <p className="text-sm text-center max-w-md text-[var(--color-brand-text-secondary)] mb-6">
          Analyze operational and market risks for this cargo request.
        </p>

        <Button
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? 'ANALYZING...' : 'ANALYZE RISK'}
        </Button>

      </div>
    );
  }

  const overallRisk = risk.overallLevel || risk.overallRisk || 'N/A';
  const overallColor = getRiskColor(overallRisk);

  const congestion = getRiskLevel(risk.factors?.congestion);
  const weather = getRiskLevel(risk.factors?.weather);
  const freightVolatility = getRiskLevel(risk.factors?.freightVolatility);
  const vesselAvailability = getRiskLevel(risk.factors?.vesselAvailability);

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">

        <div>
          <div className="text-xs uppercase font-bold text-[var(--color-brand-text-secondary)]">
            OVERALL RISK
          </div>

          <div
            className="text-3xl font-black uppercase tracking-wider"
            style={{ color: overallColor }}
          >
            {overallRisk}
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          {loading ? 'REANALYZING...' : 'REANALYZE'}
        </Button>

      </div>

      {/* MANUAL REVIEW */}
      {risk.reviewRequired && (
        <div className="p-3 bg-[var(--color-status-error)]/10 border border-[var(--color-status-error)] text-[var(--color-status-error)] font-bold rounded uppercase text-sm">
          Manual Review Required
        </div>
      )}

      {/* RISK FACTORS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        {/* CONGESTION */}
        <div className="p-3 border border-[var(--color-brand-border)] rounded">

          <div className="text-xs text-[var(--color-brand-text-secondary)] uppercase">
            Congestion
          </div>

          <div
            className="font-bold"
            style={{ color: getRiskColor(congestion) }}
          >
            {congestion}
          </div>

        </div>

        {/* WEATHER */}
        <div className="p-3 border border-[var(--color-brand-border)] rounded">

          <div className="text-xs text-[var(--color-brand-text-secondary)] uppercase">
            Weather
          </div>

          <div
            className="font-bold"
            style={{ color: getRiskColor(weather) }}
          >
            {weather}
          </div>

        </div>

        {/* FREIGHT VOLATILITY */}
        <div className="p-3 border border-[var(--color-brand-border)] rounded">

          <div className="text-xs text-[var(--color-brand-text-secondary)] uppercase">
            Freight Volatility
          </div>

          <div
            className="font-bold"
            style={{ color: getRiskColor(freightVolatility) }}
          >
            {freightVolatility}
          </div>

        </div>

        {/* VESSEL AVAILABILITY */}
        <div className="p-3 border border-[var(--color-brand-border)] rounded">

          <div className="text-xs text-[var(--color-brand-text-secondary)] uppercase">
            Vessel Availability
          </div>

          <div
            className="font-bold"
            style={{ color: getRiskColor(vesselAvailability) }}
          >
            {vesselAvailability}
          </div>

        </div>

      </div>

      {/* EXTRA DETAILS FOR OBJECT-BASED FACTORS */}
      {risk.factors?.freightVolatility &&
        typeof risk.factors.freightVolatility === 'object' && (
          <div className="p-4 border border-[var(--color-brand-border)] rounded">

            <div className="text-xs uppercase text-[var(--color-brand-text-secondary)] mb-3">
              FREIGHT VOLATILITY DETAILS
            </div>

            <div className="grid grid-cols-3 gap-4">

              <div>
                <div className="text-xs text-[var(--color-brand-text-secondary)]">
                  ORIGIN
                </div>

                <div className="font-bold">
                  {risk.factors.freightVolatility.origin ?? 'N/A'}
                </div>
              </div>

              <div>
                <div className="text-xs text-[var(--color-brand-text-secondary)]">
                  DESTINATION
                </div>

                <div className="font-bold">
                  {risk.factors.freightVolatility.destination ?? 'N/A'}
                </div>
              </div>

              <div>
                <div className="text-xs text-[var(--color-brand-text-secondary)]">
                  CHANGE
                </div>

                <div className="font-bold">
                  {risk.factors.freightVolatility.change ?? 'N/A'}
                </div>
              </div>

            </div>

          </div>
        )}

      {/* DISCLAIMER */}
      <div className="text-xs text-[var(--color-brand-text-secondary)] italic mt-6 border-t border-[var(--color-brand-border)] pt-4">
        {risk.disclaimer ||
          'Risk analysis provided by AI. Final assessment must be verified.'}
      </div>

      {/* CONTINUE */}
      <div className="flex justify-end pt-4">

        <Button onClick={handleContinue}>
          CONTINUE TO CONTRACT
        </Button>

      </div>

    </div>
  );
};