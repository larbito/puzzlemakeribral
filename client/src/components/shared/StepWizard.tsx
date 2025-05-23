import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Check, ChevronRight, ChevronLeft } from 'lucide-react';

export interface Step {
  id: string;
  title: string;
  component: React.ReactNode;
  isComplete?: boolean;
}

interface StepWizardProps {
  steps: Step[];
  initialStep?: number;
  onComplete?: () => void;
  onSave?: (currentStep: number) => void;
  showProgress?: boolean;
}

export const StepWizard: React.FC<StepWizardProps> = ({
  steps,
  initialStep = 0,
  onComplete,
  onSave,
  showProgress = false
}) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [progress, setProgress] = useState(0);

  // Calculate progress percentage
  useEffect(() => {
    if (steps.length > 0) {
      setProgress(((currentStep + 1) / steps.length) * 100);
    }
  }, [currentStep, steps.length]);

  // Handle next step
  const handleNext = () => {
    if (onSave) {
      onSave(currentStep);
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else if (onComplete) {
      onComplete();
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Handle direct step navigation
  const handleStepClick = (index: number) => {
    // Check if the step is available for navigation (steps need to be consecutive)
    if (index <= currentStep || (steps[index - 1] && steps[index - 1].isComplete)) {
      setCurrentStep(index);
    }
  };

  return (
    <div className="step-wizard">
      {/* Steps Navigation Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "flex flex-col items-center relative cursor-pointer",
                index === currentStep
                  ? "text-primary"
                  : (index < currentStep || step.isComplete)
                  ? "text-primary/70 dark:text-primary/60"
                  : "text-muted-foreground"
              )}
              onClick={() => handleStepClick(index)}
            >
              <div
                className={cn(
                  "rounded-full h-10 w-10 flex items-center justify-center border-2 z-10 bg-background transition-colors",
                  index === currentStep
                    ? "border-primary"
                    : (index < currentStep || step.isComplete)
                    ? "border-primary/70 dark:border-primary/60"
                    : "border-muted-foreground"
                )}
              >
                {index < currentStep || step.isComplete ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span className="text-sm mt-2 font-medium">{step.title}</span>

              {/* Connecting Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "absolute top-5 w-[calc(100%-2rem)] h-0.5 left-1/2",
                    (index < currentStep || step.isComplete)
                      ? "bg-primary/70 dark:bg-primary/60"
                      : "bg-muted-foreground/30"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Progress Bar (Optional) */}
        {showProgress && (
          <Progress value={progress} className="h-1 mt-6" />
        )}
      </div>

      {/* Step Content */}
      <Card className="mb-6 p-6">
        {steps[currentStep]?.component}
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <Button
          onClick={handleNext}
          className="flex items-center gap-1"
        >
          {currentStep === steps.length - 1 ? (
            'Complete'
          ) : (
            <>
              Next
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}; 