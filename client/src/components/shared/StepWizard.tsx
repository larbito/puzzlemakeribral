import React, { useState, ReactNode, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

export interface Step {
  id: string;
  title: string;
  component: ReactNode;
  isComplete: boolean;
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
  showProgress = false,
}) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    // Reset interaction state when step changes
    setHasInteracted(false);
  }, [currentStep]);

  const handleNext = () => {
    if (onSave) {
      // Call onSave first to update the completion state
      onSave(currentStep);
    }

    // Force immediate step advance if the current step is already marked complete
    // This will skip the disabled check for better UX
    if (steps[currentStep].isComplete) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        onComplete();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (index: number) => {
    // Can only navigate to previously completed steps or the current step + 1
    if (index <= currentStep || (index === currentStep + 1 && steps[currentStep].isComplete)) {
      setCurrentStep(index);
    }
  };

  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;
  const nextIsDisabled = false; // Always enable the Next button
  const progressValue = ((currentStep + 1) / steps.length) * 100;
  
  // Mark step as interacted with
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasInteracted(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [currentStep]);

  return (
    <div className="space-y-8">
      {showProgress && (
        <div className="w-full space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(progressValue)}% Complete</span>
          </div>
          <Progress value={progressValue} className="h-2" />
        </div>
      )}
      
      <div className="flex overflow-x-auto pb-2 hide-scrollbar">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div 
              className={`flex flex-col items-center cursor-pointer transition-colors px-2 min-w-[100px] ${
                index <= currentStep 
                  ? 'text-primary' 
                  : index === currentStep + 1 && steps[currentStep].isComplete
                  ? 'text-muted-foreground hover:text-primary'
                  : 'text-muted-foreground'
              }`}
              onClick={() => handleStepClick(index)}
            >
              <div 
                className={`flex items-center justify-center w-8 h-8 rounded-full mb-2 transition-colors ${
                  index === currentStep 
                    ? 'bg-primary text-primary-foreground' 
                    : index < currentStep && step.isComplete
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {index < currentStep && step.isComplete ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span className="text-sm whitespace-nowrap">{step.title}</span>
            </div>
            
            {index < steps.length - 1 && (
              <div className="flex items-center px-1 pt-4">
                <div className={`w-12 h-[1px] ${
                  index < currentStep ? 'bg-primary' : 'bg-muted-foreground/30'
                }`} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      
      <Separator />
      
      <div className="min-h-[400px]">
        {steps[currentStep].component}
      </div>
      
      <Separator />
      
      <div className="flex justify-between pt-4">
        <Button 
          variant="outline" 
          onClick={handlePrevious} 
          disabled={isFirstStep}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        
        <Button 
          onClick={handleNext} 
          disabled={false} // Remove the disabled state to allow navigation
          className={isLastStep ? 'bg-green-600 hover:bg-green-700' : ''}
        >
          {isLastStep ? 'Complete' : 'Continue'}
          {!isLastStep && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}; 