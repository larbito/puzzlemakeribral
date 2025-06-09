import React, { useState, useEffect } from 'react';
import { StepWizard, Step } from '@/components/shared/StepWizard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, RotateCcw, Moon, Sun, FileText, Settings, Eye, Sparkles, Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

// Step Components - these will be created next
import { FileUploadStep } from './kdp-formatter/FileUploadStep';
import { BookSettingsStep } from './kdp-formatter/BookSettingsStep';
import { PreviewEditStep } from './kdp-formatter/PreviewEditStep';
import { AIEnhanceStep } from './kdp-formatter/AIEnhanceStep';
import { ExportStep } from './kdp-formatter/ExportStep';

// Dark mode context
const ThemeToggle = () => {
  const [theme, setTheme] = useState(
    localStorage.getItem('kdp-theme') || 
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  );

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'dark' ? 'light' : 'dark');
    root.classList.add(theme);
    localStorage.setItem('kdp-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={toggleTheme} 
      className="flex items-center gap-2"
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {theme === 'dark' ? 'Light' : 'Dark'}
    </Button>
  );
};

// KDP Book Settings Interface
export interface KDPBookSettings {
  // Book Settings
  trimSize: '5x8' | '6x9' | '7x10' | '8.5x11';
  marginTop: number;
  marginBottom: number;
  marginInside: number;
  marginOutside: number;
  bleed: boolean;
  fontFamily: 'Times New Roman' | 'Garamond' | 'Arial' | 'Georgia' | 'Palatino';
  fontSize: 10 | 11 | 12 | 13 | 14;
  lineSpacing: 1.0 | 1.2 | 1.5 | 2.0;
  includeTOC: boolean;
  includePageNumbers: boolean;
  includeTitlePage: boolean;
  detectChapterBreaks: boolean;
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

// KDP margin presets based on trim sizes
const marginPresets = {
  '5x8': { top: 0.75, bottom: 0.75, inside: 0.75, outside: 0.5 },
  '6x9': { top: 0.875, bottom: 0.875, inside: 0.875, outside: 0.625 },
  '7x10': { top: 1.0, bottom: 1.0, inside: 1.0, outside: 0.75 },
  '8.5x11': { top: 1.0, bottom: 1.0, inside: 1.0, outside: 0.75 }
};

// Default settings
export const defaultBookSettings: KDPBookSettings = {
  trimSize: '6x9',
  marginTop: 0.875,
  marginBottom: 0.875,
  marginInside: 0.875,
  marginOutside: 0.625,
  bleed: false,
  fontFamily: 'Times New Roman',
  fontSize: 12,
  lineSpacing: 1.2,
  includeTOC: true,
  includePageNumbers: true,
  includeTitlePage: true,
  detectChapterBreaks: true,
};

// Default empty content
export const emptyBookContent: BookContent = {
  rawText: '',
  title: 'Untitled Book',
  chapters: [],
  metadata: {},
};

interface FormattingPreset {
  id: string;
  name: string;
  description: string;
  settings: Omit<KDPBookSettings, 'detectChapterBreaks'>;
}

const defaultPresets: FormattingPreset[] = [
  {
    id: 'novel-6x9',
    name: 'Novel (6×9)',
    description: 'Perfect for fiction, novels, and narrative non-fiction',
    settings: {
      trimSize: '6x9',
      marginTop: 0.875,
      marginBottom: 0.875,
      marginInside: 0.875,
      marginOutside: 0.625,
      bleed: false,
      fontFamily: 'Times New Roman',
      fontSize: 12,
      lineSpacing: 1.2,
      includeTOC: true,
      includePageNumbers: true,
      includeTitlePage: true
    }
  },
  {
    id: 'textbook-8x11',
    name: 'Textbook (8.5×11)',
    description: 'Ideal for educational content, manuals, and reference books',
    settings: {
      trimSize: '8.5x11',
      marginTop: 1.0,
      marginBottom: 1.0,
      marginInside: 1.0,
      marginOutside: 0.75,
      bleed: false,
      fontFamily: 'Arial',
      fontSize: 11,
      lineSpacing: 1.5,
      includeTOC: true,
      includePageNumbers: true,
      includeTitlePage: true
    }
  },
  {
    id: 'poetry-5x8',
    name: 'Poetry (5×8)',
    description: 'Compact format for poetry collections and short works',
    settings: {
      trimSize: '5x8',
      marginTop: 0.75,
      marginBottom: 0.75,
      marginInside: 0.75,
      marginOutside: 0.5,
      bleed: false,
      fontFamily: 'Garamond',
      fontSize: 11,
      lineSpacing: 1.0,
      includeTOC: false,
      includePageNumbers: true,
      includeTitlePage: true
    }
  }
];

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
  const [userPresets, setUserPresets] = useState<FormattingPreset[]>([]);

  // Load saved project on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('kdpFormatterSettings');
      const savedContent = localStorage.getItem('kdpFormatterContent');
      const wasSaved = localStorage.getItem('kdpFormatterSaved');
      
      if (savedSettings && wasSaved) {
        setSettings(JSON.parse(savedSettings));
        setIsSaved(true);
      }
      if (savedContent && wasSaved) {
        setBookContent(JSON.parse(savedContent));
      }
    } catch (error) {
      console.error('Error loading saved project:', error);
    }
  }, []);

  // Handle setting changes with margin presets
  const handleSettingChange = (key: keyof KDPBookSettings, value: any) => {
    if (key === 'trimSize') {
      const preset = marginPresets[value as keyof typeof marginPresets];
      setSettings(prev => ({ 
        ...prev, 
        [key]: value,
        marginTop: preset.top,
        marginBottom: preset.bottom,
        marginInside: preset.inside,
        marginOutside: preset.outside
      }));
    } else {
      setSettings(prev => ({ ...prev, [key]: value }));
    }
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
    
    if (currentStepId === 'file-upload') {
      setCompletedSteps(prev => ({ ...prev, [currentStepId]: textExtracted }));
    } else if (currentStepId === 'book-settings') {
      setCompletedSteps(prev => ({ ...prev, [currentStepId]: true }));
    } else if (currentStepId === 'preview-edit') {
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
          bookContent={bookContent}
          onSettingChange={handleSettingChange}
          onContentChange={handleContentChange}
        />
      ),
      isComplete: completedSteps['book-settings']
    },
    {
      id: 'preview-edit',
      title: 'Preview & Edit',
      component: (
        <PreviewEditStep 
          bookContent={bookContent}
          settings={settings}
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
          bookContent={bookContent}
          settings={settings}
          formattedContent={formattedContent}
        />
      ),
      isComplete: completedSteps['export-pdf']
    }
  ];

  // Add preset management functions
  const loadPreset = (preset: FormattingPreset) => {
    setSettings({
      ...preset.settings,
      detectChapterBreaks: settings.detectChapterBreaks // Preserve current detection mode
    });
    
    toast({
      title: 'Preset loaded',
      description: `Applied ${preset.name} formatting settings`,
    });
  };

  const saveAsPreset = (name: string, description: string) => {
    const newPreset: FormattingPreset = {
      id: `custom-${Date.now()}`,
      name,
      description,
      settings: {
        trimSize: settings.trimSize,
        marginTop: settings.marginTop,
        marginBottom: settings.marginBottom,
        marginInside: settings.marginInside,
        marginOutside: settings.marginOutside,
        bleed: settings.bleed,
        fontFamily: settings.fontFamily,
        fontSize: settings.fontSize,
        lineSpacing: settings.lineSpacing,
        includeTOC: settings.includeTOC,
        includePageNumbers: settings.includePageNumbers,
        includeTitlePage: settings.includeTitlePage
      }
    };
    
    const updatedPresets = [...userPresets, newPreset];
    setUserPresets(updatedPresets);
    localStorage.setItem('kdpFormatterPresets', JSON.stringify(updatedPresets));
    
    toast({
      title: 'Preset saved',
      description: `Saved "${name}" preset for future use`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Button>
              <div className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-semibold">KDP Book Formatter</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetProject}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSaveProject}
                className="flex items-center gap-2"
                disabled={isSaved}
              >
                <Save className="h-4 w-4" />
                {isSaved ? 'Saved' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Formatting Progress
            </CardTitle>
            <CardDescription>
              Transform your manuscript into a professional KDP-ready book
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {steps.map((step, index) => (
                <div 
                  key={step.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    step.isComplete 
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {index === 0 && <FileText className="h-4 w-4" />}
                    {index === 1 && <Settings className="h-4 w-4" />}
                    {index === 2 && <Eye className="h-4 w-4" />}
                    {index === 3 && <Sparkles className="h-4 w-4" />}
                    {index === 4 && <Download className="h-4 w-4" />}
                    <span className="text-sm font-medium">{step.title}</span>
                  </div>
                  <div className={`text-xs ${step.isComplete ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                    {step.isComplete ? 'Complete' : 'Pending'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step Wizard */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <StepWizard 
            steps={steps} 
            onSave={handleSaveStep}
          />
        </div>
      </div>
    </div>
  );
}; 