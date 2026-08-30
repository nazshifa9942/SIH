import React, { useState, useEffect } from 'react';
import { forecastFreight, getForecastByCargoRequestId } from '../../../../api/forecast';
import { Button } from '../../../../components/ui/Button';

export const Forecast = ({ cargoId, onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState(null);

  useEffect(() => {
    // Try to load existing forecast
    getForecastByCargoRequestId(cargoId).then(data => {
      if (data && data.forecastJson) {
        setForecast(data);
        onComplete(true);
      }
    }).catch(() => {
      // Ignore, forecast might not exist
    });
  }, [cargoId, onComplete]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await forecastFreight({ cargoRequestId: cargoId });
      setForecast(data);
      onComplete(true);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!forecast) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-dashed border-[var(--color-brand-border)] rounded">
        <div className="text-[var(--color-brand-text-secondary)] mb-4 uppercase text-sm tracking-wider">NO FORECAST AVAILABLE</div>
        <p className="text-sm text-center max-w-md text-[var(--color-brand-text-secondary)] mb-6">
          Generate a forecast for this cargo request to view projected freight conditions.
        </p>
        <Button onClick={handleGenerate} disabled={loading}>
          {loading ? 'GENERATING FORECAST...' : 'GENERATE FORECAST'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-xs uppercase text-[var(--color-brand-text-secondary)]">Forecast Confidence</div>
          <div className="text-xl font-bold text-[var(--color-status-success)]">
            {forecast.confidence ? `${(forecast.confidence * 100).toFixed(1)}%` : 'N/A'}
          </div>
        </div>
        <Button onClick={handleGenerate} disabled={loading} variant="outline" size="sm">
          {loading ? 'REGENERATING...' : 'REGENERATE FORECAST'}
        </Button>
      </div>
      <div className="h-64 flex items-center justify-center border border-[var(--color-brand-border)] bg-[var(--color-brand-background)]">
        {/* Chart will go here, using recharts in final polish */}
        <span className="text-[var(--color-brand-text-secondary)]">Forecast Chart Placeholder</span>
      </div>
    </div>
  );
};
