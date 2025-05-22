import React, { useState, useEffect } from 'react';
import { StepWizard, Step } from '@/components/shared/StepWizard';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
// Import jsPDF type to help with TypeScript
import type { jsPDF } from 'jspdf';

// Step Components
import { BookSettingsStep } from './book-generator/BookSettingsStep';
import { BookConceptStep } from './book-generator/BookConceptStep';
import { ContentGenerationStepNew as ContentGenerationStep } from './book-generator/ContentGenerationStepNew';
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
  const [isSaved, setIsSaved] = useState(false);
  const { toast } = useToast();

  // Check for explicitly saved settings from localStorage on initial load
  useEffect(() => {
    const loadSavedSettings = () => {
      try {
        // Check if settings were explicitly saved
        const savedFlag = localStorage.getItem('bookGeneratorSaved');
        if (savedFlag === 'true') {
          console.log('Loading explicitly saved settings');
          const savedSettings = localStorage.getItem('bookGeneratorSettings');
          if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
            setIsSaved(true);
          }
          
          // Load completion status
          const savedCompletedSteps = localStorage.getItem('bookGeneratorCompletedSteps');
          if (savedCompletedSteps) {
            setCompletedSteps(JSON.parse(savedCompletedSteps));
          }
        } else {
          console.log('No saved settings found or not explicitly saved, using defaults');
          // Clear any localStorage data to ensure fresh start
          localStorage.removeItem('bookGeneratorSettings');
          localStorage.removeItem('bookGeneratorCompletedSteps');
          localStorage.removeItem('bookProposals');
          localStorage.removeItem('currentProposalIndex');
        }
      } catch (error) {
        console.error('Error loading saved settings:', error);
      }
    };
    
    loadSavedSettings();
  }, []);

  // No more auto-save, we'll only save when the user explicitly requests it

  // Handle setting changes
  const handleSettingChange = (key: keyof BookGeneratorSettings, value: any) => {
    console.log(`Setting ${key} to:`, value);
    
    // Special handling for bookSummary to ensure it updates properly
    if (key === 'bookSummary') {
      console.log('Updating bookSummary from:', settings.bookSummary, 'to:', value);
    }
    
    // Update step completion status based on the setting being changed
    const newCompletedSteps = { ...completedSteps };
    
    // Mark book-settings as complete if title is updated and not empty
    if (key === 'title' && value && value.length > 0) {
      newCompletedSteps['book-settings'] = true;
    }
    
    // Mark book-concept as complete if TOC is updated and not empty
    if (key === 'tableOfContents' && value && value.length > 0) {
      newCompletedSteps['book-concept'] = true;
    }
    
    // If anything changed in the completed steps, update the state
    if (JSON.stringify(newCompletedSteps) !== JSON.stringify(completedSteps)) {
      setCompletedSteps(newCompletedSteps);
    }
    
    // Immediately update the settings
    setSettings(prev => {
      return { ...prev, [key]: value };
    });
    
    // Mark as unsaved when any changes are made
    setIsSaved(false);
  };

  // Explicitly save the current state
  const handleSaveProject = () => {
    try {
      // Save settings to localStorage
      localStorage.setItem('bookGeneratorSettings', JSON.stringify(settings));
      localStorage.setItem('bookGeneratorCompletedSteps', JSON.stringify(completedSteps));
      // Set saved flag
      localStorage.setItem('bookGeneratorSaved', 'true');
      
      setIsSaved(true);
      
      toast({
        title: 'Project saved',
        description: 'Your book project has been saved and will be available when you return.',
      });
    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        title: 'Error saving project',
        description: 'Something went wrong. Your changes might not be saved.',
      });
    }
  };

  // Reset the project to defaults
  const handleResetProject = () => {
    // Clear localStorage
    localStorage.removeItem('bookGeneratorSettings');
    localStorage.removeItem('bookGeneratorCompletedSteps');
    localStorage.removeItem('bookGeneratorSaved');
    localStorage.removeItem('bookProposals');
    localStorage.removeItem('currentProposalIndex');
    
    // Reset state
    setSettings(defaultBookSettings);
    setCompletedSteps({
      'book-settings': false,
      'book-concept': false,
      'content-generation': false,
      'front-matter': false,
      'preview-export': false
    });
    setIsSaved(false);
    
    toast({
      title: 'Project reset',
      description: 'Your book project has been reset to default settings.',
    });
  };

  // Save progress and mark step as completed
  const handleSaveStep = (currentStep: number) => {
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
      // Create a payload with the book data
      const bookData = {
        title: settings.title,
        subtitle: settings.subtitle,
        bookSize: settings.bookSize,
        fontFamily: settings.fontFamily,
        fontSize: settings.fontSize,
        lineSpacing: settings.lineSpacing,
        includePageNumbers: settings.includePageNumbers,
        includeTOC: settings.includeTOC,
        chapters: settings.chapters,
        titlePage: settings.titlePage,
        copyrightPage: settings.copyrightPage,
        dedicationPage: settings.dedicationPage,
        authorBio: settings.authorBio,
        includeAuthorBio: settings.includeAuthorBio,
        closingThoughts: settings.closingThoughts,
      };
      
      // Try to generate via API endpoint first
      try {
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://puzzlemakeribral-production.up.railway.app';
        console.log('Using API base URL:', apiBaseUrl);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(`${apiBaseUrl}/api/book-generator/generate-pdf`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bookData),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('PDF generation API response:', data);
        
        if (data.success && data.pdfUrl) {
          setDownloadUrl(data.pdfUrl);
          setGenerationStatus('complete');
          setCompletedSteps(prev => ({ ...prev, 'preview-export': true }));
          return;
        } else {
          throw new Error('API response missing success or pdfUrl');
        }
      } catch (error: any) {
        // Check if it's an abort error (timeout)
        if (error.name === 'AbortError') {
          console.error('API request timed out, using fallback:', error);
        } else {
          console.error('API error, using fallback:', error);
        }
      }
      
      // Fallback: Use client-side PDF generation
      console.log('Using fallback PDF generation');
      
      // Dynamically import the PDF generation library
      const { jsPDF } = await import('jspdf');
      
      // Create a new PDF document
      const pdf = new jsPDF({
        orientation: settings.bookSize === '6x9' || settings.bookSize === '5x8' ? 'portrait' : 'landscape',
        unit: 'in',
        format: settings.bookSize === '6x9' ? [6, 9] : 
                settings.bookSize === '5x8' ? [5, 8] : 
                settings.bookSize === '7x10' ? [7, 10] : [8.5, 11]
      });
      
      // Set font
      pdf.setFont(settings.fontFamily === 'Times New Roman' ? 'times' : 'helvetica');
      pdf.setFontSize(settings.fontSize * 2.83); // Convert pt to PDF units
      
      // Title page
      pdf.text(settings.title, pdf.internal.pageSize.getWidth() / 2, 3, { align: 'center' });
      if (settings.subtitle) {
        pdf.text(settings.subtitle, pdf.internal.pageSize.getWidth() / 2, 3.5, { align: 'center' });
      }
      pdf.text('By [Author Name]', pdf.internal.pageSize.getWidth() / 2, 7, { align: 'center' });
      
      // Table of Contents
      if (settings.includeTOC) {
        pdf.addPage();
        pdf.text('Table of Contents', pdf.internal.pageSize.getWidth() / 2, 1, { align: 'center' });
        
        let yPos = 2;
        settings.chapters.forEach((chapter, index) => {
          pdf.text(`${chapter.title}`, 1, yPos);
          pdf.text(`${index + 3}`, pdf.internal.pageSize.getWidth() - 1, yPos, { align: 'right' });
          yPos += 0.3;
        });
      }
      
      // Copyright page
      if (settings.includeCopyright) {
        pdf.addPage();
        const copyrightText = settings.copyrightPage || 
          `© ${new Date().getFullYear()} [Author Name]. All rights reserved.\n\nNo part of this publication may be reproduced, distributed, or transmitted in any form or by any means without the prior written permission of the publisher.`;
        pdf.text(copyrightText, 1, 3, {
          maxWidth: pdf.internal.pageSize.getWidth() - 2,
          align: 'center'
        });
      }
      
      // Chapters
      settings.chapters.forEach((chapter) => {
        pdf.addPage();
        pdf.text(chapter.title, pdf.internal.pageSize.getWidth() / 2, 1, { align: 'center' });
        
        // Split chapter content into chunks that will fit on pages
        const contentText = chapter.content || `Sample content for ${chapter.title}`;
        const textLines = pdf.splitTextToSize(
          contentText, 
          pdf.internal.pageSize.getWidth() - 2
        );
        
        const linesPerPage = Math.floor((pdf.internal.pageSize.getHeight() - 2) / (settings.lineSpacing * 0.2));
        
        // Add first page of chapter content
        pdf.text(textLines.slice(0, linesPerPage), 1, 1.5);
        
        // Add additional pages if needed
        for (let i = linesPerPage; i < textLines.length; i += linesPerPage) {
          pdf.addPage();
          pdf.text(textLines.slice(i, i + linesPerPage), 1, 1);
          
          if (settings.includePageNumbers) {
            pdf.text(
              String(pdf.internal.pages.length - 1), 
              pdf.internal.pageSize.getWidth() / 2, 
              pdf.internal.pageSize.getHeight() - 0.5,
              { align: 'center' }
            );
          }
        }
      });
      
      // Add page numbers if enabled
      if (settings.includePageNumbers) {
        // Use internal pages array length instead of getNumberOfPages method
        const totalPages = pdf.internal.pages.length - 1; // -1 because jsPDF has an empty first page
        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          pdf.text(
            String(i), 
            pdf.internal.pageSize.getWidth() / 2, 
            pdf.internal.pageSize.getHeight() - 0.5,
            { align: 'center' }
          );
        }
      }
      
      // Generate PDF data URL
      const pdfDataUrl = pdf.output('dataurlstring');
      setDownloadUrl(pdfDataUrl);
      setGenerationStatus('complete');
      setCompletedSteps(prev => ({ ...prev, 'preview-export': true }));
      
    } catch (error) {
      console.error('Error generating book:', error);
      setGenerationError('An unexpected error occurred during PDF generation. Please try again.');
      setGenerationStatus('error');
    }
  };

  // Handle download
  const handleDownload = () => {
    if (generationStatus !== 'complete' || !downloadUrl) {
      toast({
        title: 'Error',
        description: 'No download available. Please generate the book first.',
      });
      return;
    }
    
    try {
      // Check if it's a data URL or a server URL
      if (downloadUrl.startsWith('data:')) {
        // Create an anchor element
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${settings.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Open the URL in a new tab for server-hosted files
        window.open(downloadUrl, '_blank');
      }
      
      toast({
        title: 'Download started',
        description: 'Your book PDF is being downloaded.',
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download failed',
        description: 'There was a problem downloading your book. Please try again.',
      });
    }
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
    <div className="max-w-5xl mx-auto p-6" style={{ position: 'relative', zIndex: 1, pointerEvents: 'auto' }}>
      <div className="flex items-center justify-between mb-8" style={{ pointerEvents: 'auto', position: 'relative', zIndex: 10 }}>
        <div className="flex items-center" style={{ pointerEvents: 'auto' }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="mr-4"
            style={{ pointerEvents: 'auto', position: 'relative', zIndex: 20 }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">AI-Powered KDP Book Generator</h1>
        </div>
        <div className="flex items-center gap-2" style={{ pointerEvents: 'auto', position: 'relative', zIndex: 20 }}>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetProject}
            className="flex items-center gap-1"
            style={{ pointerEvents: 'auto' }}
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSaveProject}
            className="flex items-center gap-1"
            style={{ pointerEvents: 'auto' }}
          >
            <Save className="h-4 w-4" />
            Save Project
          </Button>
        </div>
      </div>
      
      {isSaved && (
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md p-3 mb-6 text-sm text-green-600 dark:text-green-400 flex items-center">
          <Save className="h-4 w-4 mr-2" />
          <span>This project is saved and will be available when you return.</span>
        </div>
      )}
      
      <div className="book-generator-container relative" style={{ position: 'relative', zIndex: 5, pointerEvents: 'auto' }}>
        <StepWizard 
          steps={steps} 
          onComplete={() => navigate('/dashboard')}
          onSave={handleSaveStep}
          initialStep={0}
          showProgress
        />
      </div>
    </div>
  );
}; 