import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { getCargo } from '../../../api/cargo';

import { CargoInfo } from './Steps/CargoInfo';
import { Forecast } from './Steps/Forecast';
import { Optimization } from './Steps/Optimization';
import { Recommendation } from './Steps/Recommendation';
import { Cost } from './Steps/Cost';
import { Risk } from './Steps/Risk';
import { Contract } from './Steps/Contract';

const STEPS = [
  { id: 'cargo', label: '01 CARGO' },
  { id: 'forecast', label: '02 FORECAST' },
  { id: 'optimization', label: '03 OPTIMIZATION' },
  { id: 'recommendation', label: '04 RECOMMENDATION' },
  { id: 'cost', label: '05 COST' },
  { id: 'risk', label: '06 RISK' },
  { id: 'contract', label: '07 CONTRACT' },
];

export function CargoWorkspace() {
  const { cargoRequestId } = useParams();
  const [cargo, setCargo] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCargo() {
      try {
        const data = await getCargo(cargoRequestId);
        setCargo(data);
      } catch (error) {
        console.error("Failed to fetch cargo:", error);
      } finally {
        setLoading(false);
      }
    }
    if (cargoRequestId) {
      fetchCargo();
    } else {
      setLoading(false);
    }
  }, [cargoRequestId]);

  const markStepComplete = (stepIndex) => {
    setCompletedSteps(prev => ({ ...prev, [stepIndex]: true }));
    if (stepIndex < STEPS.length - 1) {
      setCurrentStep(stepIndex + 1);
    }
  };

  const renderCurrentStep = () => {
    const props = {
      cargoId: cargoRequestId,
      cargo,
      onComplete: () => markStepComplete(currentStep)
    };

    switch (currentStep) {
      case 0: return <CargoInfo {...props} />;
      case 1: return <Forecast {...props} />;
      case 2: return <Optimization {...props} />;
      case 3: return <Recommendation {...props} />;
      case 4: return <Cost {...props} />;
      case 5: return <Risk {...props} />;
      case 6: return <Contract {...props} />;
      default: return null;
    }
  };

  if (loading) {
    return <div className="p-8 text-[var(--color-brand-text-secondary)] font-mono text-sm">LOADING WORKSPACE...</div>;
  }

  return (
    <div className="flex flex-col gap-6 w-full p-6">
      {/* TOP BAR */}
      <div className="sticky top-0 z-10 flex items-center justify-between bg-[var(--color-brand-elevated)] rounded-2xl p-5 border border-white/[0.04] shadow-sm backdrop-blur-md">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-white tracking-widest">
            {cargo?.route || 'NEWCASTLE → PARADIP'}
          </h1>
          <div className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-brand-text-secondary)] font-medium">
            {cargo?.details || 'IRON ORE · 55,000 MT · REQUIRED: 20 SEP 2026'}
          </div>
        </div>
        
        <div className="flex items-center">
          <Badge variant="outline" className="flex items-center gap-2 bg-black/20 text-white border-white/10 px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-status-info)]"></span>
            WORKFLOW ACTIVE
          </Badge>
        </div>
      </div>

      {/* STEP TRACKER */}
      <div className="flex flex-wrap gap-2">
        {STEPS.map((step, index) => {
          const isActive = currentStep === index;
          const isCompleted = completedSteps[index];
          const maxCompleted = Math.max(-1, ...Object.keys(completedSteps).map(Number));
          const isClickable = isCompleted || index <= maxCompleted + 1 || index === 0;

          return (
            <button
              key={step.id}
              onClick={() => isClickable && setCurrentStep(index)}
              disabled={!isClickable && !isActive}
              className={`
                flex items-center gap-2 px-4 py-2.5 text-xs font-mono rounded-lg transition-all
                ${isActive 
                  ? 'bg-white/15 border border-white/20 text-white border-b-2 border-b-[#f97316]' 
                  : 'bg-black/20 border border-white/5 text-[var(--color-brand-text-secondary)]'
                }
                ${!isClickable && !isActive ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-white/10'}
                ${isCompleted && !isActive ? 'text-[var(--color-status-success)]' : ''}
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
      <Card className="bg-[var(--color-brand-elevated)] border-white/[0.04]">
        <CardContent className="p-6">
          {renderCurrentStep()}
        </CardContent>
      </Card>
    </div>
  );
}
