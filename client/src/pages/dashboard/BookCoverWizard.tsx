import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// Step Components
import Step1Settings from '@/components/book-cover-wizard/Step1Settings';
import Step2CoverModes from '@/components/book-cover-wizard/Step2CoverModes';
import Step3BackCover from '@/components/book-cover-wizard/Step3BackCover';
import Step4SpineEditor from '@/components/book-cover-wizard/Step4SpineEditor';
import Step5FinalExport from '@/components/book-cover-wizard/Step5FinalExport';

// Types
export interface BookSettings {
  trimSize: string;
  pageCount: number;
  paperType: 'white' | 'cream' | 'color';
  includeBleed: boolean;
  dimensions: {
    frontWidth: number;
    frontHeight: number;
    spineWidth: number;
    fullWrapWidth: number;
    fullWrapHeight: number;
  };
}

export interface CoverData {
  frontCoverImage: string | null;
  frontCoverPrompt: string;
  backCoverImage: string | null;
  backCoverPrompt: string;
  backText?: string;
  interiorImages: string[];
  spineText: string;
  spineColor: string;
  spineFont: string;
  extractedColors: string[];
  finalCoverImage: string | null;
}

export interface WizardState {
  currentStep: number;
  completedSteps: Set<number>;
  bookSettings: BookSettings;
  coverData: CoverData;
  isLoading: boolean;
  loadingMessage: string;
}

const STEPS = [
  { id: 1, title: 'Book Settings', description: 'Configure trim size, pages, and specifications' },
  { id: 2, title: 'Front Cover', description: 'Create your front cover design' },
  { id: 3, title: 'Back Cover', description: 'Generate matching back cover' },
  { id: 4, title: 'Spine Design', description: 'Design spine with colors and text' },
  { id: 5, title: 'Final Export', description: 'Assemble and download your cover' },
];

const BookCoverWizard: React.FC = () => {
  const [state, setState] = useState<WizardState>({
    currentStep: 1,
    completedSteps: new Set(),
    bookSettings: {
      trimSize: '6x9',
      pageCount: 300,
      paperType: 'white',
      includeBleed: true,
      dimensions: {
        frontWidth: 6,
        frontHeight: 9,
        spineWidth: 0.675,
        fullWrapWidth: 12.675,
        fullWrapHeight: 9,
      },
    },
    coverData: {
      frontCoverImage: null,
      frontCoverPrompt: '',
      backCoverImage: null,
      backCoverPrompt: '',
      spineText: '',
      spineColor: '#3B82F6',
      spineFont: 'helvetica',
      extractedColors: [],
      interiorImages: [],
      finalCoverImage: null,
    },
    isLoading: false,
    loadingMessage: '',
  });

  // Navigation functions
  const goToStep = (step: number) => {
    if (step >= 1 && step <= 5) {
      setState(prev => ({ ...prev, currentStep: step }));
    }
  };

  const nextStep = () => {
    const next = Math.min(state.currentStep + 1, 5);
    setState(prev => ({
      ...prev,
      currentStep: next,
      completedSteps: new Set([...prev.completedSteps, prev.currentStep]),
    }));
  };

  const prevStep = () => {
    const previous = Math.max(state.currentStep - 1, 1);
    setState(prev => ({ ...prev, currentStep: previous }));
  };

  // Update functions for child components
  const updateBookSettings = (settings: Partial<BookSettings>) => {
    setState(prev => ({
      ...prev,
      bookSettings: { ...prev.bookSettings, ...settings },
    }));
  };

  const updateCoverData = (data: Partial<CoverData>) => {
    setState(prev => ({
      ...prev,
      coverData: { ...prev.coverData, ...data },
    }));
  };

  const setLoading = (loading: boolean, message = '') => {
    setState(prev => ({
      ...prev,
      isLoading: loading,
      loadingMessage: message,
    }));
  };

  // Step validation
  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return Boolean(state.bookSettings.trimSize && state.bookSettings.pageCount > 0);
      case 2:
        return Boolean(state.coverData.frontCoverImage);
      case 3:
        return Boolean(state.coverData.backCoverImage);
      case 4:
        return Boolean(state.coverData.spineColor);
      case 5:
        return Boolean(state.coverData.finalCoverImage);
      default:
        return false;
    }
  };

  const canProceed = isStepValid(state.currentStep);

  // Render current step component
  const renderCurrentStep = () => {
    const commonProps = {
      bookSettings: state.bookSettings,
      coverData: state.coverData,
      updateBookSettings,
      updateCoverData,
      setLoading,
      isLoading: state.isLoading,
      onNext: nextStep,
    };

    switch (state.currentStep) {
      case 1:
        return <Step1Settings {...commonProps} />;
      case 2:
        return <Step2CoverModes {...commonProps} />;
      case 3:
        return <Step3BackCover {...commonProps} />;
      case 4:
        return <Step4SpineEditor {...commonProps} />;
      case 5:
        return <Step5FinalExport {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
          KDP Book Cover Generator
        </h1>
        <p className="text-zinc-400 text-lg">
          Create professional Amazon KDP-ready book covers in 5 simple steps
        </p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <Badge variant="secondary" className="bg-blue-900/20 text-blue-300">
            Powered by DALL·E 3
          </Badge>
          <Badge variant="secondary" className="bg-green-900/20 text-green-300">
            KDP Ready
          </Badge>
        </div>
      </div>

      {/* Progress Indicator */}
      <Card className="mb-8 bg-zinc-900/80 border-zinc-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Progress</h3>
            <span className="text-sm text-zinc-400">
              Step {state.currentStep} of {STEPS.length}
            </span>
          </div>
          
          <div className="flex items-center space-x-4 overflow-x-auto pb-2">
            {STEPS.map((step, index) => {
              const isActive = state.currentStep === step.id;
              const isCompleted = state.completedSteps.has(step.id);
              const isAccessible = step.id <= state.currentStep || isCompleted;

              return (
                <div key={step.id} className="flex items-center flex-shrink-0">
                  <button
                    onClick={() => isAccessible && goToStep(step.id)}
                    disabled={!isAccessible}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : isCompleted
                        ? 'bg-green-600 text-white hover:bg-green-500'
                        : isAccessible
                        ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      isCompleted ? 'bg-green-700' : isActive ? 'bg-blue-700' : 'bg-zinc-700'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        step.id
                      )}
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium">{step.title}</div>
                      <div className="text-xs opacity-80">{step.description}</div>
                    </div>
                  </button>
                  
                  {index < STEPS.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-zinc-600 mx-2 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Loading Overlay */}
      {state.isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="bg-zinc-900 border-zinc-800 p-6">
            <div className="flex items-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              <div>
                <div className="text-white font-medium">Processing...</div>
                <div className="text-zinc-400 text-sm">{state.loadingMessage}</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={state.currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderCurrentStep()}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <Card className="mt-8 bg-zinc-900/80 border-zinc-800">
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={state.currentStep === 1 || state.isLoading}
              className="border-zinc-700 hover:bg-zinc-800"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-zinc-400">
                {canProceed ? '✅ Ready to continue' : '⚠️ Complete this step to continue'}
              </div>
              
              {state.currentStep < 5 && (
                <Button
                  onClick={nextStep}
                  disabled={!canProceed || state.isLoading}
                  className="bg-blue-600 hover:bg-blue-500"
                >
                  Next Step
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookCoverWizard; 