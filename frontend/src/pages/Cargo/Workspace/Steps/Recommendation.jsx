import React, { useState, useEffect } from 'react';
import {
  getRecommendations,
  getRecommendationHistory,
} from '../../../../api/recommendation';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import {
  Sparkles,
  Clock,
  ArrowRight,
  Info,
  RefreshCw,
  DollarSign,
  Layers,
} from 'lucide-react';

export const Recommendation = ({
  cargoId,
  cargo,
  costData,
  forecastData,
  optimizationData,
  riskData,
  onComplete,
  setRecommendationData,
}) => {
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [history, setHistory] = useState([]);

  // Load recommendation history when workspace opens
  useEffect(() => {
    let mounted = true;

    const loadHistory = async () => {
      try {
        const data = await getRecommendationHistory(cargoId);

        if (!mounted || !Array.isArray(data)) return;

        setHistory(data);

        if (data.length > 0) {
          setRecommendation(data[0]);
          if (setRecommendationData) setRecommendationData(data[0]);
        }
      } catch (error) {
        console.error('Failed to load recommendation history:', error);
      }
    };

    if (cargoId) {
      loadHistory();
    }

    return () => {
      mounted = false;
    };
  }, [cargoId, setRecommendationData]);

  const handleGenerate = async () => {
    setLoading(true);

    try {
      const data = await getRecommendations({
        cargoRequestId: cargoId,
      });

      const newRecommendation = data.recommendation || data;
      setRecommendation(newRecommendation);
      if (setRecommendationData) setRecommendationData(newRecommendation);

      try {
        const updatedHistory = await getRecommendationHistory(cargoId);
        if (Array.isArray(updatedHistory)) {
          setHistory(updatedHistory);
        }
      } catch (historyError) {
        console.error('Failed to refresh recommendation history:', historyError);
      }
    } catch (error) {
      console.error('Failed to generate recommendation:', error);
    } finally {
      setLoading(false);
    }
  };

  const actionColor = {
    CHARTER_NOW: 'var(--color-status-success, #10b981)',
    WAIT: 'var(--color-status-warning, #f59e0b)',
    EVALUATE: 'var(--color-status-info, #3b82f6)',
  };

  const actionBadge = {
    CHARTER_NOW: 'bg-emerald-100 text-[var(--color-status-success)] border-emerald-500/30',
    WAIT: 'bg-amber-100 text-[var(--color-status-warning)] border-amber-500/30',
    EVALUATE: 'bg-blue-100 text-[var(--color-status-info)] border-blue-500/30',
  };

  const previous = history.length > 1 ? history[1] : null;

  if (!recommendation) {
    return (
      <div className="space-y-6">
        {/* COST CONTEXT BANNER */}
        {costData && (
          <div className="p-4 border-y border-[var(--color-brand-border-strong)] text-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[var(--color-brand-text-secondary)]">
              <DollarSign className="w-4 h-4 text-[var(--color-status-success)]" />
              <span>Calculated Cost: <strong className="text-[var(--color-brand-text-primary)]">${Number(costData.totalCost || 0).toLocaleString()}</strong></span>
            </div>
            <div className="text-[var(--color-brand-text-secondary)]">
              Quantity: <span className="text-[var(--color-status-success)] font-bold">{Number(cargo?.quantityMt || 0).toLocaleString()} MT</span>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center justify-center p-10 border-y border-dashed border-[var(--color-brand-border-strong)]">
          <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6 text-[var(--color-gov-navy)]" />
          </div>

          <div className="text-[var(--color-brand-text-primary)] font-bold mb-1 uppercase tracking-wider text-base">
            GENERATE AI PROCUREMENT RECOMMENDATION
          </div>

          <p className="text-sm text-center max-w-md text-[var(--color-brand-text-secondary)] mb-6">
            Synthesizes freight forecasts, market rate trend ratios, voyage costs, and port risk to prescribe the optimal chartering decision (CHARTER_NOW, WAIT, or EVALUATE).
          </p>

          <Button onClick={handleGenerate} disabled={loading} className="text-xs font-bold flex items-center gap-2">
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> SYNTHESIZING RECOMMENDATION...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> GENERATE PROCUREMENT RECOMMENDATION
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  const currentAction = recommendation.recommendedAction || 'EVALUATE';
  const color = actionColor[currentAction] || 'var(--color-status-info)';
  const badgeClass = actionBadge[currentAction] || 'bg-blue-100 text-[var(--color-status-info)] border-blue-500/30';
  const bestPlan = recommendation.vesselPlanJson || optimizationData;
  const recommendedVessels = bestPlan?.recommendedPlan || [];
  const expectedSavings = recommendation.expectedSavings !== undefined
    ? Number(recommendation.expectedSavings)
    : null;

  return (
    <div className="space-y-6">
      {/* CONNECT COST → RECOMMENDATION CONTEXT BANNER */}
      <div className="p-4 border-y border-[var(--color-brand-border-strong)] text-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-emerald-500/10 text-[var(--color-status-success)] border-emerald-500/30 text-[11px]">
            COST FED
          </Badge>
          <span className="text-[var(--color-brand-text-secondary)]">
            Latest Estimated Total: <strong className="text-[var(--color-brand-text-primary)]">${Number(recommendation.estimatedTotalCost || costData?.totalCost || 0).toLocaleString()}</strong>
          </span>
        </div>

        <div className="text-[var(--color-brand-text-secondary)]">
          Contract Mode: <strong className="text-[var(--color-status-info)]">{recommendation.contractStrategy || 'SPOT'}</strong>
        </div>
      </div>

      {/* PRIMARY RECOMMENDATION CARD */}
      <div
        className="p-6 border-y-2 transition-all"
        style={{
          borderColor: `${color}40`,
          backgroundColor: `color-mix(in srgb, ${color} 8%, transparent)`,
        }}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--color-brand-border)] pb-4">
          <div>
            <div className="text-[11px] uppercase tracking-widest font-bold mb-1" style={{ color }}>
              AI PROCUREMENT DECISION DIRECTIVE
            </div>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-black uppercase tracking-wider text-[var(--color-brand-text-primary)]" style={{ color }}>
                {currentAction.replace('_', ' ')}
              </span>
              <Badge variant="outline" className={`text-xs font-bold ${badgeClass}`}>
                {currentAction === 'CHARTER_NOW' ? 'LOCK IN RATES' : currentAction === 'WAIT' ? 'RATES DECLINING' : 'MARKET STABLE'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleGenerate}
              disabled={loading}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              {loading ? 'RECALCULATING...' : 'RECALCULATE RECOMMENDATION'}
            </Button>
          </div>
        </div>

        {/* EXPLANATION */}
        {recommendation.explanation && (
          <div className="py-4 text-sm text-[var(--color-brand-text-primary)] leading-relaxed flex items-start gap-2">
            <Info className="w-4 h-4 text-[var(--color-gov-navy)] flex-shrink-0 mt-0.5" />
            <span>{recommendation.explanation}</span>
          </div>
        )}

        {/* CHARTER WINDOW */}
        {recommendation.windowStart && recommendation.windowEnd && (
          <div className="p-3 bg-[var(--color-brand-inset)] border-y border-[var(--color-brand-border-strong)] text-xs flex items-center justify-between text-[var(--color-brand-text-primary)]">
            <span className="flex items-center gap-1.5 text-[var(--color-status-warning)] font-bold">
              <Clock className="w-3.5 h-3.5" /> Recommended Charter Window:
            </span>
            <span className="font-bold text-[var(--color-brand-text-primary)]">
              {new Date(recommendation.windowStart).toLocaleDateString()} ➔ {new Date(recommendation.windowEnd).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* METRICS TILES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 border-t border-[var(--color-brand-border-strong)] bg-[var(--color-brand-inset)] space-y-1">
          <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-primary)]">Expected Freight</div>
          <div className="text-xl font-bold text-[var(--color-brand-text-primary)]">
            {recommendation.expectedFreight != null ? `$${Number(recommendation.expectedFreight).toFixed(2)}` : 'N/A'}
            <span className="text-xs text-[var(--color-brand-text-secondary)] font-normal"> / MT</span>
          </div>
        </div>

        <div className="p-4 border-t border-[var(--color-brand-border-strong)] bg-[var(--color-brand-inset)] space-y-1">
          <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-primary)]">Estimated Total Cost</div>
          <div className="text-xl font-bold text-[var(--color-status-success)]">
            {recommendation.estimatedTotalCost != null ? `$${Number(recommendation.estimatedTotalCost).toLocaleString()}` : 'N/A'}
          </div>
        </div>

        <div className="p-4 border-t border-[var(--color-brand-border-strong)] bg-[var(--color-brand-inset)] space-y-1">
          <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-primary)]">Confidence Score</div>
          <div className="text-xl font-bold text-[var(--color-brand-text-primary)]">
            {recommendation.confidence !== null &&
              recommendation.confidence !== undefined &&
              Number.isFinite(Number(recommendation.confidence))
              ? `${(Number(recommendation.confidence) * 100).toFixed(1)}%`
              : 'MODEL CONFIDENCE NOT PROVIDED'}
          </div>
        </div>

        <div className="p-4 border-t border-[var(--color-brand-border-strong)] bg-[var(--color-brand-inset)] space-y-1">
          <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-primary)]">Contract Strategy</div>
          <div className="text-base font-bold text-[var(--color-status-info)] truncate">
            {recommendation.contractStrategy || 'SPOT'}
          </div>
        </div>

        <div className="p-4 border-t border-[var(--color-brand-border-strong)] bg-[var(--color-brand-inset)] space-y-1">
          <div className="text-[11px] uppercase tracking-widest text-[var(--color-brand-text-primary)]">Expected Savings</div>
          <div className="text-xl font-bold text-[var(--color-status-success)]">
            {expectedSavings !== null ? `$${expectedSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : 'N/A'}
          </div>
          <div className="text-[11px] text-[var(--color-brand-text-secondary)]">Compared with current freight rate</div>
        </div>
      </div>

      {/* BEST VESSEL PLAN */}
      {recommendedVessels.length > 0 && (
        <div className="p-5 border border-[var(--color-brand-border)] rounded-2xl bg-[var(--color-brand-elevated)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-widest text-[var(--color-brand-text-primary)]">Recommended Vessel Plan</div>
            <span className="text-[11px] text-[var(--color-status-success)]">{bestPlan.numberOfTrips || recommendedVessels.length} TRIPS</span>
          </div>
          {recommendedVessels.map((trip, index) => (
            <div key={`${trip.vesselId || trip.vesselName}-${trip.tripNumber || index}`} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)] text-xs">
              <span className="font-bold text-[var(--color-brand-text-primary)]">Trip {trip.tripNumber || index + 1}</span>
              <span className="text-[var(--color-status-info)]">{trip.vesselName || 'Assigned vessel'}</span>
              <span className="text-[var(--color-brand-text-secondary)]">{Number(trip.quantityMT || 0).toLocaleString()} MT</span>
            </div>
          ))}
          {riskData?.overallLevel && (
            <div className="text-[11px] text-[var(--color-brand-text-muted)]">Risk input: <strong className="text-[var(--color-brand-text-primary)]">{riskData.overallLevel}</strong></div>
          )}
        </div>
      )}

      {/* COMPARISON WITH PREVIOUS RUN */}
      {previous && (
        <div className="p-5 border border-[var(--color-brand-border)] rounded-2xl bg-[var(--color-brand-elevated)] space-y-3">
          <div className="text-xs font-bold uppercase tracking-widest text-[var(--color-brand-text-primary)] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[var(--color-status-info)]" />
            Comparison with Previous Run ({new Date(previous.createdAt).toLocaleDateString()})
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)]">
              <span className="text-[var(--color-brand-text-muted)] block text-[11px] uppercase">Previous Action</span>
              <strong className="text-[var(--color-brand-text-primary)]">{previous.recommendedAction}</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)]">
              <span className="text-[var(--color-brand-text-muted)] block text-[11px] uppercase">Previous Freight</span>
              <strong className="text-[var(--color-brand-text-primary)]">${Number(previous.expectedFreight || 0).toFixed(2)} / MT</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)]">
              <span className="text-[var(--color-brand-text-muted)] block text-[11px] uppercase">Previous Total</span>
              <strong className="text-[var(--color-brand-text-primary)]">${Number(previous.estimatedTotalCost || 0).toLocaleString()}</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-[var(--color-brand-inset)] border border-[var(--color-brand-border)]">
              <span className="text-[var(--color-brand-text-muted)] block text-[11px] uppercase">Previous Strategy</span>
              <strong className="text-[var(--color-status-info)]">{previous.contractStrategy || 'SPOT'}</strong>
            </div>
          </div>
        </div>
      )}

      {/* PROCEED ACTION */}
      <div className="flex justify-end pt-4 border-t border-[var(--color-brand-border)]">
        <Button onClick={() => onComplete(true)} className="flex items-center gap-2 text-xs font-bold">
          CONTINUE TO CONTRACT <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};