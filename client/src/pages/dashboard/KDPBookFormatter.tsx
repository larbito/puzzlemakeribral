import React, { useState } from 'react';
import { StepWizard, Step } from '@/components/shared/StepWizard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

// Step Components - these will be created next
import { FileUploadStep } from './kdp-formatter/FileUploadStep';
import { BookSettingsStep } from './kdp-formatter/BookSettingsStep';
import { PreviewEditStep } from './kdp-formatter/PreviewEditStep';
import { AIEnhanceStep } from './kdp-formatter/AIEnhanceStep';
import { ExportStep } from './kdp-formatter/ExportStep';

// KDP Book Settings Interface
export interface KDPBookSettings {
  // Book Settings
  trimSize: '6x9' | '5x8' | '8.5x11' | '7x10';
  marginTop: number;
  marginBottom: number;
  marginInside: number;
  marginOutside: number;
  bleed: boolean;
  fontFamily: string;
  fontSize: number;
  lineSpacing: number;
  includeTOC: boolean;
  includePageNumbers: boolean;
}

// Content Interface
export interface BookContent {
  rawText: string; // Original extracted text
  title: string;
  chapters: Chapter[];
  metadata: {
    author?: string;
    publisher?: string;
    year?: string;
    isbn?: string;
  };
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
  level: number; // Heading level (1 for chapter, 2 for section, etc.)
}

// Default settings
export const defaultBookSettings: KDPBookSettings = {
  trimSize: '6x9',
  marginTop: 0.75,
  marginBottom: 0.75,
  marginInside: 0.75,
  marginOutside: 0.5,
  bleed: false,
  fontFamily: 'Times New Roman',
  fontSize: 12,
  lineSpacing: 1.15,
  includeTOC: true,
  includePageNumbers: true,
};

// Default empty content
export const emptyBookContent: BookContent = {
  rawText: '',
  title: 'Untitled Book',
  chapters: [],
  metadata: {},
};

export const KDPBookFormatter = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<KDPBookSettings>(defaultBookSettings);
  const [bookContent, setBookContent] = useState<BookContent>(emptyBookContent);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [textExtracted, setTextExtracted] = useState(false);
  const [formattedContent, setFormattedContent] = useState<string[]>([]);
  const [completedSteps, setCompletedSteps] = useState<{[key: string]: boolean}>({
    'file-upload': false,
    'book-settings': false,
    'preview-edit': false,
    'ai-enhance': false,
    'export-pdf': false
  });
  const [isSaved, setIsSaved] = useState(false);
  const { toast } = useToast();

  // Handle setting changes
  const handleSettingChange = (key: keyof KDPBookSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setIsSaved(false);
  };

  // Handle content changes
  const handleContentChange = (newContent: Partial<BookContent>) => {
    setBookContent(prev => ({ ...prev, ...newContent }));
    setIsSaved(false);
  };

  // Handle chapter content edits
  const handleChapterEdit = (chapterId: string, newContent: string) => {
    setBookContent(prev => ({
      ...prev,
      chapters: prev.chapters.map(chapter => 
        chapter.id === chapterId ? { ...chapter, content: newContent } : chapter
      )
    }));
    setIsSaved(false);
  };

  // Handle file upload
  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setCompletedSteps(prev => ({ ...prev, 'file-upload': true }));
    setIsSaved(false);
    
    // The actual file processing will be handled in the FileUploadStep component
  };

  // Reset the project to defaults
  const handleResetProject = () => {
    setSettings(defaultBookSettings);
    setBookContent(emptyBookContent);
    setUploadedFile(null);
    setTextExtracted(false);
    setFormattedContent([]);
    setCompletedSteps({
      'file-upload': false,
      'book-settings': false,
      'preview-edit': false,
      'ai-enhance': false,
      'export-pdf': false
    });
    setIsSaved(false);
    
    toast({
      title: 'Project reset',
      description: 'Your book formatting project has been reset to default settings.',
    });
  };

  // Save the current project
  const handleSaveProject = () => {
    try {
      // Save settings and content to localStorage
      localStorage.setItem('kdpFormatterSettings', JSON.stringify(settings));
      localStorage.setItem('kdpFormatterContent', JSON.stringify(bookContent));
      localStorage.setItem('kdpFormatterSaved', 'true');
      
      setIsSaved(true);
      
      toast({
        title: 'Project saved',
        description: 'Your book formatting project has been saved and will be available when you return.',
      });
    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        title: 'Error saving project',
        description: 'Something went wrong. Your changes might not be saved.',
      });
    }
  };

  // Handle step completion
  const handleSaveStep = (currentStep: number) => {
    const stepIds = ['file-upload', 'book-settings', 'preview-edit', 'ai-enhance', 'export-pdf'];
    const currentStepId = stepIds[currentStep];
    
    // Step-specific validation
    if (currentStepId === 'file-upload') {
      setCompletedSteps(prev => ({ ...prev, [currentStepId]: textExtracted }));
    } else if (currentStepId === 'book-settings') {
      // Always mark book settings as complete if we've gotten to this step
      setCompletedSteps(prev => ({ ...prev, [currentStepId]: true }));
    } else if (currentStepId === 'preview-edit') {
      // Mark preview-edit as complete if we have formatted content
      setCompletedSteps(prev => ({ ...prev, [currentStepId]: formattedContent.length > 0 }));
    }
  };

  // Build steps array for the wizard
  const steps: Step[] = [
    {
      id: 'file-upload',
      title: 'Upload File',
      component: (
        <FileUploadStep 
          onFileUploaded={handleFileUpload}
          onContentExtracted={handleContentChange}
          onTextExtracted={() => setTextExtracted(true)}
        />
      ),
      isComplete: completedSteps['file-upload']
    },
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
      id: 'preview-edit',
      title: 'Preview & Edit',
      component: (
        <PreviewEditStep 
          settings={settings}
          bookContent={bookContent}
          onContentChange={handleContentChange}
          onChapterEdit={handleChapterEdit}
          onFormattedContent={setFormattedContent}
        />
      ),
      isComplete: completedSteps['preview-edit']
    },
    {
      id: 'ai-enhance',
      title: 'AI Enhancement',
      component: (
        <AIEnhanceStep 
          bookContent={bookContent}
          onContentChange={handleContentChange}
        />
      ),
      isComplete: completedSteps['ai-enhance']
    },
    {
      id: 'export-pdf',
      title: 'Export PDF',
      component: (
        <ExportStep 
          settings={settings}
          bookContent={bookContent}
          formattedContent={formattedContent}
        />
      ),
      isComplete: completedSteps['export-pdf']
    }
  ];

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">KDP Book Formatter & Editor</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetProject}
            className="flex items-center gap-1"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSaveProject}
            className="flex items-center gap-1"
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
      
      <div className="kdp-formatter-container">
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