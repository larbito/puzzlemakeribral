import React, { useState, useEffect } from 'react';
import { StepWizard, Step } from '@/components/shared/StepWizard';
import { BookSettingsStep } from './steps/BookSettingsStep';
import { ThemesAndWordsStep } from './steps/ThemesAndWordsStep';
import { PuzzleConfigurationStep } from './steps/PuzzleConfigurationStep';
import { PreviewDownloadStep } from './steps/PreviewDownloadStep';
import { WordSearchSettings, defaultWordSearchSettings } from './WordSearch';
import wordSearchApi from '@/lib/services/wordSearchApi';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const WordSearchWizard = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<WordSearchSettings>(defaultWordSearchSettings);
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'generating' | 'complete' | 'error'>('idle');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string>('');
  const [completedSteps, setCompletedSteps] = useState<{[key: string]: boolean}>({
    'book-settings': false,
    'themes-words': false,
    'puzzle-config': false,
    'preview-download': false
  });

  // Load saved settings from localStorage if available
  useEffect(() => {
    const savedSettings = localStorage.getItem('wordSearchSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
      } catch (error) {
        console.error('Error parsing saved settings:', error);
      }
    }
  }, []);

  // Handle setting changes
  const handleSettingChange = (key: keyof WordSearchSettings, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      // Save to localStorage
      localStorage.setItem('wordSearchSettings', JSON.stringify(newSettings));
      return newSettings;
    });
  };

  // Save progress and mark step as completed
  const handleSaveStep = (currentStep: number) => {
    // Save current settings to localStorage
    localStorage.setItem('wordSearchSettings', JSON.stringify(settings));

    // Mark steps as completed based on validation
    const stepIds = ['book-settings', 'themes-words', 'puzzle-config', 'preview-download'];
    const currentStepId = stepIds[currentStep];
    
    // Step-specific validation
    if (currentStepId === 'book-settings') {
      const isValid = !!settings.title.trim();
      setCompletedSteps(prev => ({ ...prev, [currentStepId]: isValid }));
    } else if (currentStepId === 'themes-words') {
      const hasWords = settings.customWords.trim().length > 0 || !!settings.theme.trim();
      setCompletedSteps(prev => ({ ...prev, [currentStepId]: hasWords }));
    } else if (currentStepId === 'puzzle-config') {
      const hasDirections = Object.values(settings.directions).some(v => v);
      setCompletedSteps(prev => ({ ...prev, [currentStepId]: hasDirections }));
    }
  };

  // Handle generating the puzzle book
  const handleGeneratePuzzle = async () => {
    // Validate title
    if (!settings.title.trim()) {
      alert('Please enter a book title');
      return;
    }
    
    setGenerationStatus('generating');
    
    try {
      // Call API to generate the puzzle book
      console.log('Calling generateWordSearch with settings:', settings);
      const jobId = await wordSearchApi.generateWordSearch(settings);
      console.log('Received jobId:', jobId);
      
      // Poll for job status
      const result = await wordSearchApi.pollGenerationStatus(jobId, (progress) => {
        // Update progress indicator if needed
        console.log(`Generation progress: ${progress}%`);
      });
      
      // Check final status
      if (result.status === 'completed' && result.downloadUrl) {
        // Store download URL
        setDownloadUrl(result.downloadUrl);
        setGenerationStatus('complete');
        setCompletedSteps(prev => ({ ...prev, 'preview-download': true }));
      } else {
        setGenerationError(result.error || 'Failed to generate puzzle book');
        setGenerationStatus('error');
      }
    } catch (error) {
      console.error('Error generating puzzle book:', error);
      setGenerationError('An unexpected error occurred. Please try again.');
      setGenerationStatus('error');
    }
  };

  // Handle download
  const handleDownload = () => {
    if (generationStatus !== 'complete' || !downloadUrl) return;
    
    // Open the download URL in a new tab
    window.open(downloadUrl, '_blank');
  };

  // Build steps array for the wizard
  const steps: Step[] = [
    {
      id: 'book-settings',
      title: 'Book Settings',
      component: (
        <BookSettingsStep 
          settings={settings} 
          onSettingChange={handleSettingChange} 
        />
      ),
      isComplete: completedSteps['book-settings']
    },
    {
      id: 'themes-words',
      title: 'Themes & Words',
      component: (
        <ThemesAndWordsStep 
          settings={settings} 
          onSettingChange={handleSettingChange} 
        />
      ),
      isComplete: completedSteps['themes-words']
    },
    {
      id: 'puzzle-config',
      title: 'Puzzle Configuration',
      component: (
        <PuzzleConfigurationStep 
          settings={settings} 
          onSettingChange={handleSettingChange} 
        />
      ),
      isComplete: completedSteps['puzzle-config']
    },
    {
      id: 'preview-download',
      title: 'Preview & Download',
      component: (
        <PreviewDownloadStep 
          settings={settings}
          onGeneratePuzzle={handleGeneratePuzzle}
          generationStatus={generationStatus}
          downloadUrl={downloadUrl}
          generationError={generationError}
          onTryAgain={() => setGenerationStatus('idle')}
          onDownload={handleDownload}
        />
      ),
      isComplete: completedSteps['preview-download']
    }
  ];

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/dashboard/puzzles')}
          className="mr-4"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Word Search Puzzle Book</h1>
      </div>
      
      <StepWizard 
        steps={steps} 
        onComplete={() => navigate('/dashboard/puzzles')}
        onSave={handleSaveStep}
        initialStep={0}
        showProgress
      />
    </div>
  );
}; 