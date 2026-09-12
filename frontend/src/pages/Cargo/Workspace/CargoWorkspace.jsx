import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, AlertTriangle, ShieldAlert, ArrowRight, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { getCargo } from '../../../api/cargo';
import { getAlerts } from '../../../api/alerts';
import { formatDateSafely } from '../../../utils/dateUtils';

import { CargoInfo } from './Steps/CargoInfo';
import { Forecast } from './Steps/Forecast';
import { Risk } from './Steps/Risk';
import { Optimization } from './Steps/Optimization';
import { Cost } from './Steps/Cost';
import { Recommendation } from './Steps/Recommendation';
import { Contract } from './Steps/Contract';
import { Reports } from './Steps/Reports';

const STEPS = [
  { id: 'cargo', label: '01 CARGO' },
  { id: 'forecast', label: '02 FORECAST' },
  { id: 'risk', label: '03 RISK' },
  { id: 'optimization', label: '04 OPTIMIZATION' },
  { id: 'cost', label: '05 COST' },
  { id: 'recommendation', label: '06 RECOMMENDATION' },
  { id: 'contract', label: '07 CONTRACT' },
  { id: 'reports', label: '08 REPORTS' },
];

export function CargoWorkspace() {
  const { cargoRequestId } = useParams();
  const navigate = useNavigate();
  const [cargo, setCargo] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState({});
  const [loading, setLoading] = useState(true);

  // Integrated Pipeline Shared States
  const [forecastData, setForecastData] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [optimizationData, setOptimizationData] = useState(null);
  const [selectedVoyagePlanId, setSelectedVoyagePlanId] = useState(null);
  const [costData, setCostData] = useState(null);
  const [recommendationData, setRecommendationData] = useState(null);
  const [contractData, setContractData] = useState(null);
  const [workflowReady, setWorkflowReady] = useState(false);

  // Active Alerts for this cargo
  const [cargoAlerts, setCargoAlerts] = useState([]);

  const workflowStorageKey = cargoRequestId
    ? `maritime_workflow_${cargoRequestId}`
    : null;

  useEffect(() => {
    setWorkflowReady(false);

    if (!workflowStorageKey) return;

    try {
      const savedWorkflow = localStorage.getItem(workflowStorageKey);
      const parsedWorkflow = savedWorkflow ? JSON.parse(savedWorkflow) : {};

      setCurrentStep(
        Number.isInteger(parsedWorkflow.currentStep) && parsedWorkflow.currentStep >= 0
          ? Math.min(parsedWorkflow.currentStep, STEPS.length - 1)
          : 0
      );
      setCompletedSteps(parsedWorkflow.completedSteps || {});
      setForecastData(parsedWorkflow.forecastData || null);
      setRiskData(parsedWorkflow.riskData || null);
      setOptimizationData(parsedWorkflow.optimizationData || null);
      setSelectedVoyagePlanId(parsedWorkflow.selectedVoyagePlanId || null);
      setCostData(parsedWorkflow.costData || null);
      setRecommendationData(parsedWorkflow.recommendationData || null);
      setContractData(parsedWorkflow.contractData || null);
    } catch (error) {
      console.error('Failed to restore cargo workflow:', error);
      setCurrentStep(0);
      setCompletedSteps({});
      setForecastData(null);
      setRiskData(null);
      setOptimizationData(null);
      setSelectedVoyagePlanId(null);
      setCostData(null);
      setRecommendationData(null);
      setContractData(null);
    } finally {
      setWorkflowReady(true);
    }
  }, [workflowStorageKey]);

  useEffect(() => {
    if (!workflowReady || !workflowStorageKey) return;

    try {
      localStorage.setItem(
        workflowStorageKey,
        JSON.stringify({
          currentStep,
          completedSteps,
          forecastData,
          riskData,
          optimizationData,
          selectedVoyagePlanId,
          costData,
          recommendationData,
          contractData,
          savedAt: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.error('Failed to persist cargo workflow:', error);
    }
  }, [
    workflowReady,
    workflowStorageKey,
    currentStep,
    completedSteps,
    forecastData,
    riskData,
    optimizationData,
    selectedVoyagePlanId,
    costData,
    recommendationData,
    contractData,
  ]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [cargoRes, alertsRes] = await Promise.all([
          getCargo(cargoRequestId).catch(() => null),
          getAlerts().catch(() => []),
        ]);
        setCargo(cargoRes);
        if (Array.isArray(alertsRes) && cargoRequestId) {
          const matching = alertsRes.filter((a) => a.cargoRequestId === cargoRequestId);
          setCargoAlerts(matching);
        }
      } catch (error) {
        console.error('Failed to fetch cargo workspace data:', error);
      } finally {
        setLoading(false);
      }
    }
    if (cargoRequestId) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [cargoRequestId]);

  const markStepComplete = (stepIndex) => {
    setCompletedSteps((prev) => ({ ...prev, [stepIndex]: true }));
    if (stepIndex < STEPS.length - 1) {
      setCurrentStep(stepIndex + 1);
    }
  };

  const routeTitle = cargo
    ? `${cargo.originPort?.name || cargo.originPortId || 'ORIGIN'} → ${cargo.destinationPort?.name || cargo.destinationPortId || 'DESTINATION'}`
    : 'CARGO WORKSPACE';

  const detailsSubtitle = cargo
    ? `${cargo.cargoType || 'DRY BULK'} · ${Number(cargo.quantityMt || 0).toLocaleString()} MT · REQUIRED: ${formatDateSafely(
      cargo.requiredDate || cargo.requiredDeliveryDate,
      'N/A',
      { day: 'numeric', month: 'short', year: 'numeric' }
    )}`
    : 'IRON ORE · 55,000 MT · REQUIRED: 20 SEP 2026';

  const renderCurrentStep = () => {
    const sharedProps = {
      cargoId: cargoRequestId,
      cargo,
      // Cross-step data connections
      forecastData,
      setForecastData,
      riskData,
      setRiskData,
      optimizationData,
      setOptimizationData,
      selectedVoyagePlanId,
      setSelectedVoyagePlanId,
      costData,
      setCostData,
      recommendationData,
      setRecommendationData,
      contractData,
      setContractData,
      cargoAlerts,
      onComplete: () => markStepComplete(currentStep),
      setCurrentStep,
    };

    switch (currentStep) {
      case 0:
        return <CargoInfo {...sharedProps} />;
      case 1:
        return <Forecast {...sharedProps} />;
      case 2:
        return <Risk {...sharedProps} />;
      case 3:
        return <Optimization {...sharedProps} />;
      case 4:
        return <Cost {...sharedProps} />;
      case 5:
        return <Recommendation {...sharedProps} />;
      case 6:
        return <Contract {...sharedProps} />;
      case 7:
        return (
          <Reports
            cargoId={cargoRequestId}
            cargo={cargo}
            forecast={forecastData}
            risk={riskData}
            optimization={optimizationData}
            cost={costData}
            recommendation={recommendationData}
            contract={contractData}
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 gap-4 min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[var(--color-brand-border-strong)] border-t-[var(--color-gov-navy)]" />
        <span className="text-xs uppercase tracking-widest text-[var(--color-brand-text-secondary)]">
          LOADING CARGO WORKSPACE PIPELINE...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* TOP BAR */}
      <div className="sticky top-0 z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 border border-[var(--color-brand-border)] rounded-lg shadow-[0_1px_2px_rgba(16,24,40,0.06)]">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-bold text-[var(--color-gov-navy)] tracking-wide">{routeTitle}</h1>
            <Badge
              variant="outline"
              className="bg-orange-50 text-orange-800 border-orange-200 text-[11px] uppercase"
            >
              {cargo?.status || 'ACTIVE'}
            </Badge>
          </div>
          <div className="text-[11px] uppercase tracking-[0.15em] text-slate-600 font-medium">
            {detailsSubtitle}
          </div>
        </div>

        {/* Action and Alert Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {cargoAlerts.length > 0 && (
            <button
              onClick={() => navigate(`/alerts?cargoId=${cargoRequestId}`)}
              className="flex items-center gap-1.5 px-3 py-1 border border-red-200 bg-red-50 text-red-800 text-xs font-bold hover:bg-red-100 transition-all cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
              {cargoAlerts.length} ACTIVE {cargoAlerts.length === 1 ? 'ALERT' : 'ALERTS'}
            </button>
          )}

          <Badge variant="outline" className="flex items-center gap-2 bg-slate-50 text-[var(--color-gov-navy)] border-slate-300 px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-status-info)]"></span>
            PIPELINE ACTIVE
          </Badge>
        </div>
      </div>

      {/* STEP TRACKER */}

      <div className="flex flex-wrap gap-0 border-b border-[var(--color-brand-border-strong)]">
        {STEPS.map((step, index) => {
          const isActive = currentStep === index;
          const isCompleted = completedSteps[index];

          const maxCompleted = Math.max(
            -1,
            ...Object.keys(completedSteps).map(Number)
          );

          const isClickable =
            isCompleted ||
            index <= maxCompleted + 1 ||
            index === 0;

          return (
            <button
              key={step.id}
              onClick={() => isClickable && setCurrentStep(index)}
              disabled={!isClickable && !isActive}
              className={`
          flex items-center gap-2
          px-4 py-3
          text-xs
          transition-all
          border-b-2
          ${isActive
                  ? "bg-white border-[#f47920] text-[var(--color-gov-navy)] font-bold"
                  : "bg-transparent border-transparent text-slate-600"
                }
          ${!isClickable && !isActive
                  ? "opacity-40 cursor-not-allowed"
                  : "cursor-pointer hover:bg-white"
                }
          ${isCompleted && !isActive
                  ? "text-[var(--color-status-success)]"
                  : ""
                }
        `}
            >
              {isCompleted && !isActive ? (
                <Check className="w-4 h-4 text-[var(--color-status-success)]" />
              ) : null}

              {step.label}
            </button>
          );
        })}
      </div>



      {/* CONTENT AREA */}
      <Card>
        <CardContent className="p-6">{renderCurrentStep()}</CardContent>
      </Card>
    </div>
  );
}
