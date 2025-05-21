import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Save, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';

export interface Step {
  id: string;
  title: string;
  component: React.ReactNode;
  isComplete?: boolean;
}

interface StepWizardProps {
  steps: Step[];
  onComplete: () => void;
  onSave?: (currentStep: number) => void;
  initialStep?: number;
  showProgress?: boolean;
}

export const StepWizard: React.FC<StepWizardProps> = ({
  steps,
  onComplete,
  onSave,
  initialStep = 0,
  showProgress = true,
}) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [savedState, setSavedState] = useState<number | null>(null);

  // Auto-save whenever step changes
  useEffect(() => {
    if (onSave) {
      onSave(currentStep);
    }
  }, [currentStep, onSave]);

  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (index: number) => {
    if (index >= 0 && index < steps.length) {
      setCurrentStep(index);
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(currentStep);
      setSavedState(currentStep);
      setTimeout(() => setSavedState(null), 2000);
    }
  };

  const calculateProgress = () => {
    return ((currentStep + 1) / steps.length) * 100;
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* Progress indicator */}
      {showProgress && (
        <div className="w-full space-y-2">
          <Progress value={calculateProgress()} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{steps[currentStep].title}</span>
          </div>
        </div>
      )}

      {/* Step indicator buttons */}
      <div className="flex justify-center space-x-2 mb-6">
        {steps.map((step, index) => (
          <button
            key={step.id}
            onClick={() => goToStep(index)}
            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
              index === currentStep
                ? 'border-primary bg-primary text-white'
                : step.isComplete
                ? 'border-primary/50 bg-primary/10 text-primary'
                : 'border-gray-300 bg-white text-gray-500'
            }`}
          >
            {step.isComplete ? <Check className="h-4 w-4" /> : index + 1}
          </button>
        ))}
      </div>

      {/* Current step content */}
      <motion.div
        key={steps[currentStep].id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="py-4"
      >
        {steps[currentStep].component}
      </motion.div>

      {/* Navigation buttons */}
      <div className="flex justify-between pt-6 border-t mt-8">
        <Button
          onClick={goToPreviousStep}
          variant="outline"
          disabled={currentStep === 0}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <div className="flex gap-2">
          {onSave && (
            <Button
              onClick={handleSave}
              variant="outline"
              className="flex items-center gap-2"
            >
              {savedState === currentStep ? (
                <>
                  <Check className="h-4 w-4" /> Saved
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Save
                </>
              )}
            </Button>
          )}

          <Button
            onClick={goToNextStep}
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 flex items-center gap-2"
          >
            {currentStep === steps.length - 1 ? (
              'Complete'
            ) : (
              <>
                Next <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}; 