import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Save, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export interface Step {
  id: string;
  title: string;
  description?: string;
  component: React.ReactNode;
  isComplete?: boolean;
  isValid?: boolean;
  isOptional?: boolean;
}

interface StepWizardProps {
  steps: Step[];
  onComplete: () => void;
  onSave?: (currentStep: number) => void;
  initialStep?: number;
  showProgress?: boolean;
  className?: string;
  disableNavigation?: boolean;
}

export const StepWizard: React.FC<StepWizardProps> = ({
  steps,
  onComplete,
  onSave,
  initialStep = 0,
  showProgress = true,
  className,
  disableNavigation = false,
}) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [savedState, setSavedState] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-save whenever step changes
  useEffect(() => {
    if (onSave) {
      onSave(currentStep);
    }
    // Clear any previous errors when changing steps
    setError(null);
  }, [currentStep, onSave]);

  const goToNextStep = () => {
    const currentStepObj = steps[currentStep];
    
    // If validation is required (isValid is defined and false)
    if (currentStepObj.isValid === false) {
      setError(`Please complete the required information before proceeding.`);
      return;
    }
    
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
    // Allow navigation to a step if:
    // 1. It's previous to the current step (go back)
    // 2. The current step is valid or optional
    const canNavigate = 
      index < currentStep || 
      steps[currentStep].isValid !== false || 
      steps[currentStep].isOptional;
    
    if (canNavigate && index >= 0 && index < steps.length && !disableNavigation) {
      setCurrentStep(index);
    } else if (!canNavigate) {
      setError('Please complete the current step before proceeding.');
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
    <div className={cn("flex flex-col space-y-6", className)}>
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
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200 relative",
              index === currentStep
                ? "border-primary bg-primary text-white shadow-md scale-110"
                : step.isComplete
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-gray-300 bg-white text-gray-500",
              step.isOptional && "after:content-['*'] after:text-xs after:absolute after:top-0 after:right-0"
            )}
            disabled={disableNavigation}
          >
            {step.isComplete ? <Check className="h-4 w-4" /> : index + 1}
          </button>
        ))}
      </div>
      
      {/* Step title and description */}
      <div className="text-center mb-2">
        <h3 className="text-xl font-semibold mb-1">{steps[currentStep].title}</h3>
        {steps[currentStep].description && (
          <p className="text-muted-foreground text-sm">{steps[currentStep].description}</p>
        )}
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md flex items-center"
          >
            <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={steps[currentStep].id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="py-4"
        >
          {steps[currentStep].component}
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="flex justify-between pt-6 border-t mt-8">
        <Button
          onClick={goToPreviousStep}
          variant="outline"
          disabled={currentStep === 0 || disableNavigation}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <div className="flex gap-2">
          {onSave && (
            <Button
              onClick={handleSave}
              variant="outline"
              disabled={disableNavigation}
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
            disabled={disableNavigation}
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