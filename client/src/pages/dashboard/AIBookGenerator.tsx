import React, { useState, useEffect } from 'react';
import { StepWizard, Step } from '@/components/shared/StepWizard';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

// Step Components (will create these next)
import { BookSettingsStep } from './book-generator/BookSettingsStep';
import { BookConceptStep } from './book-generator/BookConceptStep';
import { ContentGenerationStep } from './book-generator/ContentGenerationStep';
import { FrontMatterStep } from './book-generator/FrontMatterStep';
import { PreviewExportStep } from './book-generator/PreviewExportStep';

// Book Generator Settings Interface
export interface BookGeneratorSettings {
  // Book Settings
  title: string;
  subtitle: string;
  bookSize: '6x9' | '8.5x11' | '5x8' | '7x10';
  fontFamily: string;
  fontSize: number;
  lineSpacing: number;
  pageCount: number;
  includePageNumbers: boolean;
  includeTOC: boolean;
  language: string;
  includeCopyright: boolean;
  includeAuthorBio: boolean;
  
  // Book Concept
  bookSummary: string;
  tone: 'Serious' | 'Fun' | 'Educational' | 'Storytelling';
  targetAudience: 'Kids' | 'Teens' | 'Adults';
  tableOfContents: Chapter[];
  
  // Content
  chapters: Chapter[];
  
  // Front/Back Matter
  titlePage: string;
  copyrightPage: string;
  dedicationPage: string;
  authorBio: string;
  closingThoughts: string;
  includeGlossary: boolean;
  glossaryContent: string;
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
  wordCount: number;
}

// Default settings
export const defaultBookSettings: BookGeneratorSettings = {
  title: 'My Book Title',
  subtitle: 'An Interesting Subtitle',
  bookSize: '6x9',
  fontFamily: 'Times New Roman',
  fontSize: 12,
  lineSpacing: 1.15,
  pageCount: 150,
  includePageNumbers: true,
  includeTOC: true,
  language: 'English',
  includeCopyright: true,
  includeAuthorBio: true,
  
  bookSummary: '',
  tone: 'Educational',
  targetAudience: 'Adults',
  tableOfContents: [],
  
  chapters: [],
  
  titlePage: '',
  copyrightPage: '',
  dedicationPage: '',
  authorBio: '',
  closingThoughts: '',
  includeGlossary: false,
  glossaryContent: '',
};

export const AIBookGenerator = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<BookGeneratorSettings>(defaultBookSettings);
  const [completedSteps, setCompletedSteps] = useState<{[key: string]: boolean}>({
    'book-settings': false,
    'book-concept': false,
    'content-generation': false,
    'front-matter': false,
    'preview-export': false
  });
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'generating' | 'complete' | 'error'>('idle');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string>('');

  // Load saved settings from localStorage if available
  useEffect(() => {
    const savedSettings = localStorage.getItem('bookGeneratorSettings');
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
  const handleSettingChange = (key: keyof BookGeneratorSettings, value: any) => {
    console.log(`Setting ${key} to:`, value);
    
    // Special handling for bookSummary to ensure it updates properly
    if (key === 'bookSummary') {
      console.log('Updating bookSummary from:', settings.bookSummary, 'to:', value);
    }
    
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      // Save to localStorage
      localStorage.setItem('bookGeneratorSettings', JSON.stringify(newSettings));
      return newSettings;
    });
  };

  // Save progress and mark step as completed
  const handleSaveStep = (currentStep: number) => {
    // Save current settings to localStorage
    localStorage.setItem('bookGeneratorSettings', JSON.stringify(settings));

    // Mark steps as completed based on validation
    const stepIds = ['book-settings', 'book-concept', 'content-generation', 'front-matter', 'preview-export'];
    const currentStepId = stepIds[currentStep];
    
    console.log('Saving step:', currentStepId, 'Title:', settings.title, 'Title length:', settings.title.length);
    
    // Step-specific validation
    if (currentStepId === 'book-settings') {
      // Always mark as valid if there's any title, even just a few characters
      const isValid = settings.title.length > 0;
      setCompletedSteps(prev => ({ ...prev, [currentStepId]: isValid }));
      
      // Force a state update to trigger re-render
      if (isValid) {
        setSettings(prev => ({ ...prev }));
      }
      
      console.log('Step completed?', isValid);
    } else if (currentStepId === 'book-concept') {
      const isValid = !!(settings.bookSummary && settings.bookSummary.trim() && settings.tableOfContents.length > 0);
      setCompletedSteps(prev => ({ ...prev, [currentStepId]: isValid }));
    } else if (currentStepId === 'content-generation') {
      const hasContent = settings.chapters.length > 0 && settings.chapters.every(chapter => chapter.content);
      setCompletedSteps(prev => ({ ...prev, [currentStepId]: hasContent }));
    } else if (currentStepId === 'front-matter') {
      const hasFrontMatter = !!(settings.titlePage && settings.copyrightPage);
      setCompletedSteps(prev => ({ ...prev, [currentStepId]: hasFrontMatter }));
    }
  };

  // Handle generating the book PDF
  const handleGenerateBook = async () => {
    setGenerationStatus('generating');
    
    try {
      // Implementation for PDF generation will go here
      // This is just a placeholder that simulates success after 3 seconds
      setTimeout(() => {
        setDownloadUrl('/sample-book.pdf'); // This will be a real URL in the actual implementation
        setGenerationStatus('complete');
        setCompletedSteps(prev => ({ ...prev, 'preview-export': true }));
      }, 3000);
    } catch (error) {
      console.error('Error generating book:', error);
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
      id: 'book-concept',
      title: 'Book Concept',
      component: (
        <BookConceptStep 
          settings={settings} 
          onSettingChange={handleSettingChange} 
        />
      ),
      isComplete: completedSteps['book-concept']
    },
    {
      id: 'content-generation',
      title: 'Content Generation',
      component: (
        <ContentGenerationStep 
          settings={settings} 
          onSettingChange={handleSettingChange} 
        />
      ),
      isComplete: completedSteps['content-generation']
    },
    {
      id: 'front-matter',
      title: 'Front & Back Matter',
      component: (
        <FrontMatterStep 
          settings={settings} 
          onSettingChange={handleSettingChange} 
        />
      ),
      isComplete: completedSteps['front-matter']
    },
    {
      id: 'preview-export',
      title: 'Preview & Export',
      component: (
        <PreviewExportStep 
          settings={settings}
          onSettingChange={handleSettingChange}
          onGenerateBook={handleGenerateBook}
          generationStatus={generationStatus}
          downloadUrl={downloadUrl}
          generationError={generationError}
          onTryAgain={() => setGenerationStatus('idle')}
          onDownload={handleDownload}
        />
      ),
      isComplete: completedSteps['preview-export']
    }
  ];

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/dashboard')}
          className="mr-4"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">AI-Powered KDP Book Generator</h1>
      </div>
      
      <StepWizard 
        steps={steps} 
        onComplete={() => navigate('/dashboard')}
        onSave={handleSaveStep}
        initialStep={0}
        showProgress
      />
    </div>
  );
}; 