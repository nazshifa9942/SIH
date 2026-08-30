import React, { useState } from 'react';
import { getRecommendations } from '../../../../api/recommendation';
import { Button } from '../../../../components/ui/Button';

export const Recommendation = ({ cargoId, onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await getRecommendations({ cargoRequestId: cargoId });
      setRecommendation(data.recommendation || data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!recommendation) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-dashed border-[var(--color-brand-border)] rounded">
        <div className="text-[var(--color-brand-text-secondary)] mb-4 uppercase text-sm tracking-wider">NO RECOMMENDATION AVAILABLE</div>
        <p className="text-sm text-center max-w-md text-[var(--color-brand-text-secondary)] mb-6">
          Generate an AI procurement recommendation based on forecast and optimization.
        </p>
        <Button onClick={handleGenerate} disabled={loading}>
          {loading ? 'GENERATING...' : 'GENERATE RECOMMENDATION'}
        </Button>
      </div>
    );
  }

  const actionColor = {
    'WAIT': 'var(--color-status-warning)',
    'IMPORT NOW': 'var(--color-status-success)',
    'EVALUATE': 'var(--color-status-info)'
  }[recommendation.recommendedAction] || 'var(--color-status-info)';

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-lg border flex flex-col md:flex-row justify-between items-center" style={{ borderColor: actionColor, backgroundColor: `color-mix(in srgb, ${actionColor} 10%, transparent)` }}>
        <div>
          <div className="text-xs uppercase font-bold tracking-widest mb-1" style={{ color: actionColor }}>PROCUREMENT RECOMMENDATION</div>
          <div className="text-4xl font-black uppercase tracking-wider text-white">
            {recommendation.recommendedAction}
          </div>
        </div>
        <div className="mt-4 md:mt-0 text-right">
          <div className="text-sm text-[var(--color-brand-text-secondary)]">Confidence</div>
          <div className="text-2xl font-bold">{recommendation.confidence ? `${(recommendation.confidence * 100).toFixed(1)}%` : 'N/A'}</div>
        </div>
      </div>

      <div>
        <h4 className="text-sm uppercase font-bold text-[var(--color-brand-text-secondary)] mb-2">WHY THIS DECISION?</h4>
        <p className="text-sm p-4 bg-[var(--color-brand-elevated)] rounded border border-[var(--color-brand-border)]">
          {recommendation.explanation || 'No explanation provided by the backend.'}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3 border border-[var(--color-brand-border)] rounded">
          <div className="text-xs text-[var(--color-brand-text-secondary)] uppercase">Expected Freight</div>
          <div className="font-bold">{recommendation.expectedFreight ? `$${Number(recommendation.expectedFreight).toFixed(2)} / MT` : 'N/A'}</div>
        </div>
        <div className="p-3 border border-[var(--color-brand-border)] rounded">
          <div className="text-xs text-[var(--color-brand-text-secondary)] uppercase">Estimated Cost</div>
          <div className="font-bold">{recommendation.estimatedTotalCost ? `$${Number(recommendation.estimatedTotalCost).toLocaleString()}` : 'N/A'}</div>
        </div>
        <div className="p-3 border border-[var(--color-brand-border)] rounded">
          <div className="text-xs text-[var(--color-brand-text-secondary)] uppercase">Risk</div>
          <div className="font-bold text-[var(--color-status-warning)]">{recommendation.riskLevel || 'N/A'}</div>
        </div>
        <div className="p-3 border border-[var(--color-brand-border)] rounded">
          <div className="text-xs text-[var(--color-brand-text-secondary)] uppercase">Contract Strategy</div>
          <div className="font-bold">{recommendation.contractStrategy || 'N/A'}</div>
        </div>
      </div>
      <div className="flex justify-end pt-4">
        <Button onClick={() => onComplete(true)}>
          CONTINUE TO COST
        </Button>
      </div>
    </div>
  );
};
