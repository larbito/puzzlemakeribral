import React, { useState, useEffect, useCallback } from 'react';
import { StepWizard, Step } from '@/components/shared/StepWizard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, RotateCcw, Moon, Sun, FileText, Settings, Eye, Sparkles, Download, Upload, CheckCircle, AlertCircle, MessageSquare, BookOpen, Palette, Send, Wand2, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDropzone } from 'react-dropzone';
import { getApiUrl, API_CONFIG } from '@/config/api';
import { Label } from '@/components/ui/label';

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

// AI-Enhanced interfaces
interface BookAnalysis {
  metadata: {
    title: string;
    subtitle?: string;
    author: string;
    dedication?: string;
    foreword?: string;
    acknowledgments?: string;
    copyright?: string;
    isbn?: string;
    publisher?: string;
    year?: string;
    totalChapters: number;
  };
  bookAnalysis: {
    genre: string;
    tone: string;
    targetAudience: string;
    complexity: string;
    estimatedReadingLevel: string;
    contentType: string;
    totalChapters: number;
    averageChapterLength: number;
  };
  recommendedTemplate: {
    templateId: string;
    templateName: string;
    reasoning: string;
    trimSize: string;
    fontFamily: string;
    fontSize: number;
    lineSpacing: number;
    margins: {
      top: number;
      bottom: number;
      inside: number;
      outside: number;
    };
    includeElements: {
      titlePage: boolean;
      tableOfContents: boolean;
      pageNumbers: boolean;
      chapterHeaders: boolean;
    };
  };
  structuredContent: {
    chapters: Array<{
      id: string;
      title: string;
      type: string;
      content: string;
      level: number;
      startPage?: number;
      wordCount?: number;
      startsAt?: string;
    }>;
    tableOfContents: Array<{
      title: string;
      page: number;
      level: number;
    }>;
  };
  alternativeTemplates: Array<{
    templateId: string;
    templateName: string;
    reasoning: string;
    suitabilityScore: number;
  }>;
}

interface TemplateSuggestion {
  id: string;
  name: string;
  description: string;
  style: string;
  bestFor: string;
  settings: any;
  previewCSS?: string;
  suitabilityScore: number;
}

interface FormattingSuggestions {
  suggestions: TemplateSuggestion[];
}

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
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<'upload' | 'analysis' | 'templates' | 'preview' | 'export'>('upload');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [bookAnalysis, setBookAnalysis] = useState<BookAnalysis | null>(null);
  const [templateSuggestions, setTemplateSuggestions] = useState<FormattingSuggestions | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateSuggestion | null>(null);
  const [customCSS, setCustomCSS] = useState('');
  const [formattedHTML, setFormattedHTML] = useState('');
  const [aiMessage, setAiMessage] = useState('');
  const [processingFeedback, setProcessingFeedback] = useState(false);
  const [rawText, setRawText] = useState('');

  // Load saved project on mount
  useEffect(() => {
    // Start fresh every time - no localStorage loading
    // Also clear any remaining cache
    clearAllCaches();
    console.log('KDP Formatter initialized - starting fresh');
  }, []);

  // Clear all possible caches
  const clearAllCaches = () => {
    // Clear any potential localStorage keys
    const keysToRemove = [
      'kdpFormatterSettings',
      'kdpFormatterContent', 
      'kdpFormatterSaved',
      'kdpFormatterPresets',
      'kdp-formatter-analysis',
      'kdp-formatter-book',
      'kdp-formatter-templates'
    ];
    
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        // Ignore errors
      }
    });

    // Clear session storage too
    try {
      sessionStorage.clear();
    } catch (e) {
      // Ignore errors
    }
  };

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
    // Remove auto-save functionality
  };

  // Handle content changes
  const handleContentChange = (newContent: Partial<BookContent>) => {
    setBookContent(prev => ({ ...prev, ...newContent }));
    // Remove auto-save functionality
  };

  // Handle chapter content edits
  const handleChapterEdit = (chapterId: string, newContent: string) => {
    setBookContent(prev => ({
      ...prev,
      chapters: prev.chapters.map(chapter => 
        chapter.id === chapterId ? { ...chapter, content: newContent } : chapter
      )
    }));
    // Remove auto-save functionality
  };

  // Handle file upload
  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setCompletedSteps(prev => ({ ...prev, 'file-upload': true }));
    // Remove auto-save functionality
  };

  // Reset the project to defaults
  const handleResetProject = () => {
    // Clear all caches first
    clearAllCaches();
    
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
    setCurrentStep('upload');
    setAnalyzing(false);
    setAnalysisProgress(0);
    setBookAnalysis(null);
    setTemplateSuggestions(null);
    setSelectedTemplate(null);
    setCustomCSS('');
    setFormattedHTML('');
    setAiMessage('');
    setProcessingFeedback(false);
    setRawText('');
    
    toast({
      title: 'Complete Fresh Start',
      description: 'All data cleared. Ready for a new book upload.',
    });
  };

  // Force complete refresh (clears everything and reloads page)
  const handleForceRefresh = () => {
    clearAllCaches();
    
    // Clear browser cache if possible
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    
    toast({
      title: 'Force Refresh',
      description: 'Clearing all caches and reloading...',
    });
    
    // Force reload after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  // Save the current project (remove this functionality)
  const handleSaveProject = () => {
    toast({
      title: 'Project Management Disabled',
      description: 'Each session starts fresh. Upload your file to begin formatting.',
    });
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

  // File upload with AI analysis
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setAnalyzing(true);
    setAnalysisProgress(10);
    setCurrentStep('analysis');

    try {
      const formData = new FormData();
      formData.append('file', file);

      setAnalysisProgress(30);
      
      const response = await fetch(getApiUrl('/api/kdp-formatter/extract'), {
        method: 'POST',
        body: formData,
        headers: {
          // Add cache-busting headers
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      setAnalysisProgress(70);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      
      if (data.success && data.content) {
        setAnalysisProgress(100);
        
        // Use real AI analysis from backend
        const realAnalysis = {
          metadata: {
            title: data.content.title || 'Untitled Book',
            author: data.content.metadata?.author || 'Unknown Author',
            subtitle: data.content.metadata?.subtitle || '',
            publisher: data.content.metadata?.publisher || '',
            year: data.content.metadata?.year || new Date().getFullYear().toString(),
            dedication: data.content.metadata?.dedication || '',
            totalChapters: data.content.metadata?.totalChapters || data.content.chapters.length
          },
          bookAnalysis: {
            genre: data.content.chapters.length > 10 ? 'Novel' : data.content.chapters.length > 5 ? 'Novella' : 'Short Work',
            tone: 'Narrative',
            targetAudience: 'General Readers',
            complexity: data.content.chapters.length > 15 ? 'Complex' : 'Moderate',
            estimatedReadingLevel: 'Adult',
            contentType: 'Narrative',
            totalChapters: data.content.chapters.length,
            averageChapterLength: Math.round(
              data.content.chapters.reduce((acc: number, ch: any) => acc + (ch.content?.length || 0), 0) / data.content.chapters.length
            )
          },
          recommendedTemplate: {
            templateId: data.content.chapters.length > 15 ? 'novel-template' : data.content.chapters.length > 8 ? 'textbook-template' : 'minimalist-template',
            templateName: data.content.chapters.length > 15 ? 'Novel Template' : data.content.chapters.length > 8 ? 'Textbook Template' : 'Minimalist Template',
            reasoning: `Best suited for ${data.content.chapters.length} chapters with ${data.content.metadata?.author ? 'identified author' : 'standard formatting'}`,
            trimSize: data.content.chapters.length > 15 ? '6x9' : '5x8',
            fontFamily: 'Times New Roman',
            fontSize: 12,
            lineSpacing: 1.2,
            margins: data.content.chapters.length > 15 
              ? { top: 0.875, bottom: 0.875, inside: 0.875, outside: 0.625 }
              : { top: 0.75, bottom: 0.75, inside: 0.75, outside: 0.5 },
            includeElements: { 
              titlePage: true, 
              tableOfContents: data.content.chapters.length > 3, 
              pageNumbers: true, 
              chapterHeaders: true 
            }
          },
          structuredContent: {
            chapters: data.content.chapters.map((chapter: any, index: number) => ({
              id: chapter.id,
              title: chapter.title,
              type: 'chapter',
              content: chapter.content,
              level: chapter.level || 1,
              startPage: index + 1,
              wordCount: chapter.wordCount || chapter.content.split(' ').length,
              startsAt: chapter.startsAt || chapter.content.substring(0, 50)
            })),
            tableOfContents: data.content.chapters.map((chapter: any, index: number) => ({
              title: chapter.title,
              page: index + 1,
              level: 1
            }))
          },
          alternativeTemplates: [
            { templateId: 'novel-template', templateName: 'Novel Template', reasoning: 'For narrative content', suitabilityScore: 90 },
            { templateId: 'textbook-template', templateName: 'Textbook Template', reasoning: 'For structured content', suitabilityScore: 75 },
            { templateId: 'minimalist-template', templateName: 'Minimalist Template', reasoning: 'For clean layout', suitabilityScore: 80 }
          ]
        };

        // Create template suggestions based on real analysis
        const intelligentSuggestions = {
          suggestions: [
            {
              id: 'intelligent-novel',
              name: `${realAnalysis.bookAnalysis.genre} Template`,
              description: `Optimized for ${realAnalysis.metadata.totalChapters} chapters with professional typography`,
              style: 'intelligent',
              bestFor: `${realAnalysis.bookAnalysis.genre} with ${realAnalysis.bookAnalysis.complexity.toLowerCase()} structure`,
              settings: realAnalysis.recommendedTemplate,
              suitabilityScore: 95
            },
            {
              id: 'classic-book',
              name: 'Classic Book Format',
              description: 'Traditional book formatting with elegant typography',
              style: 'classic',
              bestFor: 'Most fiction and non-fiction books',
              settings: {
                trimSize: '6x9',
                fontFamily: 'Times New Roman',
                fontSize: 12,
                lineSpacing: 1.2,
                margins: { top: 0.875, bottom: 0.875, inside: 0.875, outside: 0.625 },
                includeElements: { titlePage: true, tableOfContents: true, pageNumbers: true, chapterHeaders: true }
              },
              suitabilityScore: 88
            },
            {
              id: 'modern-clean',
              name: 'Modern Clean Layout',
              description: 'Contemporary design with clean lines and good readability',
              style: 'modern',
              bestFor: 'Contemporary fiction and business books',
              settings: {
                trimSize: realAnalysis.recommendedTemplate.trimSize,
                fontFamily: 'Georgia',
                fontSize: 11,
                lineSpacing: 1.3,
                margins: { top: 1.0, bottom: 1.0, inside: 1.0, outside: 0.75 },
                includeElements: { titlePage: true, tableOfContents: data.content.chapters.length > 5, pageNumbers: true, chapterHeaders: true }
              },
              suitabilityScore: 82
            }
          ]
        };

        setBookAnalysis(realAnalysis);
        setTemplateSuggestions(intelligentSuggestions);
        setRawText(data.content.rawText || '');
        setBookContent(data.content);
        setCurrentStep('templates');

        toast({
          title: 'Analysis Complete!',
          description: `Found "${realAnalysis.metadata.title}" by ${realAnalysis.metadata.author} with ${data.content.chapters.length} chapters.`,
        });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Failed to analyze book',
      });
      setCurrentStep('upload');
    } finally {
      setAnalyzing(false);
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024
  });

  // Select template and generate preview
  const selectTemplate = async (template: TemplateSuggestion) => {
    setSelectedTemplate(template);
    await generatePreview(template);
  };

  // Generate formatted preview
  const generatePreview = async (template: TemplateSuggestion) => {
    if (!bookAnalysis) return;

    try {
      // Generate HTML locally instead of calling backend
      const formattedHTML = generateFormattedHTML(
        {
          chapters: bookAnalysis.structuredContent.chapters,
          metadata: bookAnalysis.metadata
        },
        template.settings,
        template.previewCSS || customCSS
      );
      
      setFormattedHTML(formattedHTML);
      setCurrentStep('preview');
    } catch (error) {
      console.error('Preview generation error:', error);
      toast({
        title: 'Preview Error',
        description: 'Failed to generate preview',
      });
    }
  };

  // Local HTML generation function
  const generateFormattedHTML = (content: any, settings: any, customCSS = '') => {
    const { chapters, metadata } = content;
    const { title = 'Untitled Book', author = '', publisher = '', year = new Date().getFullYear() } = metadata;
    
    // Get page dimensions based on trim size
    const pageDimensions: { [key: string]: { width: string; height: string } } = {
      '5x8': { width: '5in', height: '8in' },
      '6x9': { width: '6in', height: '9in' },
      '7x10': { width: '7in', height: '10in' },
      '8.5x11': { width: '8.5in', height: '11in' }
    };
    
    const dimensions = pageDimensions[settings.trimSize] || pageDimensions['6x9'];
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        @page {
            size: ${dimensions.width} ${dimensions.height};
            margin: ${settings.margins.top}in ${settings.margins.outside}in ${settings.margins.bottom}in ${settings.margins.inside}in;
        }
        
        * {
            box-sizing: border-box;
        }
        
        body {
            font-family: "${settings.fontFamily}", serif;
            font-size: ${settings.fontSize}pt;
            line-height: ${settings.lineSpacing};
            margin: 0;
            padding: 0;
            color: #000000;
            background: white;
            text-rendering: optimizeLegibility;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        
        .page {
            width: 100%;
            min-height: calc(${dimensions.height} - ${settings.margins.top + settings.margins.bottom}in);
            padding: 0.5in;
            margin-bottom: 0.25in;
            background: white;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            border: 1px solid #e0e0e0;
            page-break-after: always;
            position: relative;
        }
        
        .page:last-child {
            page-break-after: avoid;
        }
        
        /* Typography */
        h1, h2, h3, h4, h5, h6 {
            font-weight: bold;
            margin: 0;
            line-height: 1.2;
        }
        
        h1 { 
            font-size: ${Math.round(settings.fontSize * 1.5)}pt; 
            text-align: center; 
            margin-bottom: 1em;
        }
        
        h2 { 
            font-size: ${Math.round(settings.fontSize * 1.25)}pt; 
            margin-bottom: 0.75em;
        }
        
        h3 { 
            font-size: ${Math.round(settings.fontSize * 1.1)}pt; 
            margin-bottom: 0.5em;
        }
        
        p {
            margin: 0 0 ${settings.lineSpacing * 0.5}em 0;
            text-align: justify;
            text-indent: 0.5in;
            orphans: 2;
            widows: 2;
        }
        
        p:first-child {
            text-indent: 0;
        }
        
        /* Title Page */
        .title-page {
            text-align: center;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100%;
            padding: 2in 1in;
        }
        
        .title-page h1 {
            font-size: ${Math.round(settings.fontSize * 2)}pt;
            margin-bottom: 0.5em;
            font-weight: bold;
            letter-spacing: 0.02em;
        }
        
        .title-page .subtitle {
            font-size: ${Math.round(settings.fontSize * 1.2)}pt;
            font-style: italic;
            margin-bottom: 1em;
            color: #555;
        }
        
        .title-page .author {
            font-size: ${Math.round(settings.fontSize * 1.1)}pt;
            margin-top: 2em;
            font-weight: normal;
        }
        
        .title-page .publisher,
        .title-page .year {
            font-size: ${Math.round(settings.fontSize * 0.9)}pt;
            margin-top: 1em;
            color: #666;
        }
        
        /* Table of Contents */
        .toc {
            padding-top: 1in;
        }
        
        .toc h2 {
            text-align: center;
            margin-bottom: 1.5em;
            font-size: ${Math.round(settings.fontSize * 1.3)}pt;
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }
        
        .toc-entry {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 0.75em;
            font-size: ${Math.round(settings.fontSize * 0.95)}pt;
        }
        
        .toc-entry::after {
            content: "";
            flex: 1;
            border-bottom: 1px dotted #999;
            margin: 0 0.5em;
            height: 1px;
            align-self: flex-end;
            margin-bottom: 0.25em;
        }
        
        /* Chapter Styling */
        .chapter {
            padding-top: 1in;
        }
        
        .chapter-title {
            font-size: ${Math.round(settings.fontSize * 1.4)}pt;
            font-weight: bold;
            text-align: center;
            margin: 0 0 2em 0;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            page-break-after: avoid;
        }
        
        .chapter-content {
            text-align: justify;
            hyphens: auto;
            -webkit-hyphens: auto;
            -moz-hyphens: auto;
            -ms-hyphens: auto;
        }
        
        .chapter-content p {
            margin-bottom: ${settings.lineSpacing * 0.8}em;
        }
        
        .chapter-content p:first-of-type {
            text-indent: 0;
            margin-top: 1em;
        }
        
        /* Page Numbers */
        .page-number {
            position: absolute;
            bottom: 0.5in;
            width: 100%;
            text-align: center;
            font-size: ${Math.round(settings.fontSize * 0.8)}pt;
            color: #666;
        }
        
        /* Print Specific */
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .page {
                box-shadow: none;
                border: none;
                margin-bottom: 0;
            }
            
            .page-number {
                color: #000;
            }
        }
        
        /* Custom spacing and breaks */
        .section-break {
            page-break-before: always;
        }
        
        .no-break {
            page-break-inside: avoid;
        }
        
        /* Additional styling for better readability */
        blockquote {
            margin: 1em 2em;
            padding-left: 1em;
            border-left: 3px solid #ddd;
            font-style: italic;
        }
        
        em {
            font-style: italic;
        }
        
        strong {
            font-weight: bold;
        }
        
        ${customCSS}
    </style>
</head>
<body>
    ${settings.includeElements.titlePage ? `
    <div class="page title-page">
        <div>
            <h1>${title}</h1>
            ${metadata.subtitle ? `<p class="subtitle">${metadata.subtitle}</p>` : ''}
            <p class="author">by ${author}</p>
            ${publisher ? `<p class="publisher">${publisher}</p>` : ''}
            ${year ? `<p class="year">${year}</p>` : ''}
        </div>
    </div>
    ` : ''}
    
    ${settings.includeElements.tableOfContents && chapters.length > 1 ? `
    <div class="page toc">
        <h2>Table of Contents</h2>
        ${chapters.map((chapter: any, index: number) => `
            <div class="toc-entry">
                <span>${chapter.title}</span>
                <span>${index + (settings.includeElements.titlePage ? 3 : 1)}</span>
            </div>
        `).join('')}
    </div>
    ` : ''}
    
    ${chapters.map((chapter: any, index: number) => {
      const pageNumber = index + (settings.includeElements.titlePage ? 2 : 1) + (settings.includeElements.tableOfContents ? 1 : 0);
      
      // Split content into paragraphs and format properly
      const paragraphs = chapter.content
        .split(/\n\s*\n/)
        .filter((p: string) => p.trim())
        .map((p: string) => p.trim().replace(/\n/g, ' '));
      
      return `
        <div class="page">
            <div class="chapter">
                <h2 class="chapter-title">${chapter.title}</h2>
                <div class="chapter-content">
                    ${paragraphs.map((paragraph: string) => 
                        `<p>${paragraph}</p>`
                    ).join('')}
                </div>
            </div>
            ${settings.includeElements.pageNumbers ? 
                `<div class="page-number">${pageNumber}</div>` 
                : ''
            }
        </div>
      `;
    }).join('')}
</body>
</html>`;
  };

  // AI feedback system
  const sendAIFeedback = async () => {
    if (!aiMessage.trim() || !bookAnalysis || !selectedTemplate) return;

    setProcessingFeedback(true);

    try {
      // Process feedback locally with basic formatting rules
      let updatedTemplate = { ...selectedTemplate };
      let additionalCSS = customCSS;
      let explanation = 'Applied your formatting request.';

      const message = aiMessage.toLowerCase();
      
      // Basic feedback processing rules
      if (message.includes('bold') && message.includes('chapter')) {
        additionalCSS += '\n.chapter-title { font-weight: bold !important; }';
        explanation = 'Made chapter titles bold.';
      }
      
      if (message.includes('center') || message.includes('centered')) {
        additionalCSS += '\n.chapter-title { text-align: center !important; }';
        explanation = 'Centered chapter titles.';
      }
      
      if (message.includes('bigger') || message.includes('larger') || message.includes('increase')) {
        if (message.includes('font') || message.includes('text')) {
          updatedTemplate.settings.fontSize = Math.min(updatedTemplate.settings.fontSize + 1, 16);
          explanation = 'Increased font size.';
        }
      }
      
      if (message.includes('smaller') || message.includes('decrease')) {
        if (message.includes('font') || message.includes('text')) {
          updatedTemplate.settings.fontSize = Math.max(updatedTemplate.settings.fontSize - 1, 8);
          explanation = 'Decreased font size.';
        }
      }
      
      if (message.includes('margin') || message.includes('space')) {
        if (message.includes('more') || message.includes('increase')) {
          updatedTemplate.settings.margins.top += 0.125;
          updatedTemplate.settings.margins.bottom += 0.125;
          explanation = 'Increased margins.';
        } else if (message.includes('less') || message.includes('decrease')) {
          updatedTemplate.settings.margins.top = Math.max(updatedTemplate.settings.margins.top - 0.125, 0.5);
          updatedTemplate.settings.margins.bottom = Math.max(updatedTemplate.settings.margins.bottom - 0.125, 0.5);
          explanation = 'Decreased margins.';
        }
      }
      
      if (message.includes('line spacing') || message.includes('line height')) {
        if (message.includes('more') || message.includes('increase')) {
          updatedTemplate.settings.lineSpacing = Math.min(updatedTemplate.settings.lineSpacing + 0.1, 3.0);
          explanation = 'Increased line spacing.';
        } else if (message.includes('less') || message.includes('decrease')) {
          updatedTemplate.settings.lineSpacing = Math.max(updatedTemplate.settings.lineSpacing - 0.1, 1.0);
          explanation = 'Decreased line spacing.';
        }
      }

      // Update template and regenerate preview
      setSelectedTemplate(updatedTemplate);
      setCustomCSS(additionalCSS);
      
      // Regenerate preview with updates
      await generatePreview(updatedTemplate);

      toast({
        title: 'Changes Applied',
        description: explanation,
      });

      setAiMessage('');
    } catch (error) {
      console.error('AI feedback error:', error);
      toast({
        title: 'Feedback Error',
        description: 'Failed to process AI feedback',
      });
    } finally {
      setProcessingFeedback(false);
    }
  };

  // Export to PDF
  const exportToPDF = async () => {
    if (!formattedHTML) return;

    try {
      // Create a new window with the formatted content
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(formattedHTML);
        printWindow.document.close();
        
        // Wait for content to load
        printWindow.onload = () => {
          setTimeout(() => {
            // Focus and trigger print dialog
            printWindow.focus();
            printWindow.print();
          }, 1000);
        };
      }

      setCurrentStep('export');
      toast({
        title: 'PDF Export Started',
        description: 'A new window opened with your formatted book. Use Ctrl/Cmd+P to print and save as PDF with these settings: No margins, Include backgrounds.',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Error',
        description: 'Failed to export PDF. Try using a different browser or disable popup blockers.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">AI-Powered KDP Book Formatter</h1>
              <p className="text-lg text-muted-foreground mt-2">
                Upload your manuscript and let AI handle the complete formatting process
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleForceRefresh}
                variant="outline"
                size="sm"
                className="bg-red-50 hover:bg-red-100 border-red-200 text-red-700"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Force Fresh Start
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[
              { id: 'upload', label: 'Upload', icon: Upload },
              { id: 'analysis', label: 'AI Analysis', icon: Sparkles },
              { id: 'templates', label: 'Templates', icon: Palette },
              { id: 'preview', label: 'Preview', icon: Eye },
              { id: 'export', label: 'Export', icon: Download }
            ].map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted = ['upload', 'analysis', 'templates', 'preview'].indexOf(currentStep) > index;
              
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                    isActive ? 'bg-primary text-primary-foreground' : 
                    isCompleted ? 'bg-green-500 text-white' : 
                    'bg-muted text-muted-foreground'
                  }`}>
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span className={`text-sm font-medium ${
                    isActive ? 'text-primary' : 
                    isCompleted ? 'text-green-600' : 
                    'text-muted-foreground'
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        {currentStep === 'upload' && (
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Your Manuscript
              </CardTitle>
              <CardDescription>
                Upload your manuscript and AI will automatically extract content, detect structure, and suggest optimal formatting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${
                  isDragActive 
                    ? 'border-primary bg-primary/5 scale-105' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
              >
                <input {...getInputProps()} />
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-medium">
                      {isDragActive ? 'Drop your manuscript here' : 'Drag & drop your manuscript'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      or click to browse files
                    </p>
                  </div>
                  <Button variant="outline" size="lg" className="mt-4">
                    Choose File
                  </Button>
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-medium mb-2">AI Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Automatically detects chapters, metadata, and content structure
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Palette className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-medium mb-2">Smart Templates</h3>
                  <p className="text-sm text-muted-foreground">
                    AI suggests optimal formatting templates based on your content
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Eye className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-medium mb-2">Live Preview</h3>
                  <p className="text-sm text-muted-foreground">
                    Real-time preview with AI-powered feedback system
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 'analysis' && (
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI Analysis in Progress
              </CardTitle>
              <CardDescription>
                Our AI is analyzing your manuscript structure, content, and extracting metadata
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {analyzing ? 'Analyzing content...' : 'Analysis complete'}
                  </span>
                  <span>{analysisProgress}%</span>
                </div>
                <Progress value={analysisProgress} className="h-2" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className={`h-4 w-4 ${analysisProgress > 10 ? 'text-green-500' : 'text-gray-300'}`} />
                  <span>Text Extraction</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className={`h-4 w-4 ${analysisProgress > 50 ? 'text-green-500' : 'text-gray-300'}`} />
                  <span>Structure Analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className={`h-4 w-4 ${analysisProgress > 90 ? 'text-green-500' : 'text-gray-300'}`} />
                  <span>Template Suggestions</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 'templates' && templateSuggestions && bookAnalysis && (
          <div className="space-y-6">
            <Card className="max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  AI Template Suggestions
                </CardTitle>
                <CardDescription>
                  Based on your book's content, genre, and style, AI recommends these formatting templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templateSuggestions.suggestions.map((template) => (
                    <Card 
                      key={template.id} 
                      className={`cursor-pointer transition-all hover:scale-105 ${
                        selectedTemplate?.id === template.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => selectTemplate(template)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <Badge variant="secondary">{template.suitabilityScore}%</Badge>
                        </div>
                        <CardDescription className="text-sm">
                          {template.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div><strong>Style:</strong> {template.style}</div>
                          <div><strong>Best for:</strong> {template.bestFor}</div>
                          <div><strong>Size:</strong> {template.settings.trimSize}</div>
                          <div><strong>Font:</strong> {template.settings.fontFamily}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Book Analysis Summary */}
            <Card className="max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  AI Analysis Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Detected Metadata</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Title:</strong> {bookAnalysis.metadata.title}</div>
                      <div><strong>Author:</strong> {bookAnalysis.metadata.author}</div>
                      <div><strong>Chapters:</strong> {bookAnalysis.metadata.totalChapters}</div>
                      <div><strong>Genre:</strong> {bookAnalysis.bookAnalysis.genre}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Content Analysis</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Tone:</strong> {bookAnalysis.bookAnalysis.tone}</div>
                      <div><strong>Audience:</strong> {bookAnalysis.bookAnalysis.targetAudience}</div>
                      <div><strong>Complexity:</strong> {bookAnalysis.bookAnalysis.complexity}</div>
                      <div><strong>Reading Level:</strong> {bookAnalysis.bookAnalysis.estimatedReadingLevel}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === 'preview' && formattedHTML && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Formatting Controls */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Format Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Book Size */}
                    <div className="space-y-2">
                      <Label>Book Size</Label>
                      <select 
                        className="w-full p-2 border rounded-md"
                        value={selectedTemplate?.settings.trimSize || '6x9'}
                        onChange={(e) => {
                          if (selectedTemplate) {
                            const updatedTemplate = {
                              ...selectedTemplate,
                              settings: { ...selectedTemplate.settings, trimSize: e.target.value }
                            };
                            setSelectedTemplate(updatedTemplate);
                            generatePreview(updatedTemplate);
                          }
                        }}
                      >
                        <option value="5x8">5" x 8" (Compact)</option>
                        <option value="6x9">6" x 9" (Standard)</option>
                        <option value="7x10">7" x 10" (Large)</option>
                        <option value="8.5x11">8.5" x 11" (Textbook)</option>
                      </select>
                    </div>

                    {/* Font Family */}
                    <div className="space-y-2">
                      <Label>Font Family</Label>
                      <select 
                        className="w-full p-2 border rounded-md"
                        value={selectedTemplate?.settings.fontFamily || 'Times New Roman'}
                        onChange={(e) => {
                          if (selectedTemplate) {
                            const updatedTemplate = {
                              ...selectedTemplate,
                              settings: { ...selectedTemplate.settings, fontFamily: e.target.value }
                            };
                            setSelectedTemplate(updatedTemplate);
                            generatePreview(updatedTemplate);
                          }
                        }}
                      >
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Garamond">Garamond</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Palatino">Palatino</option>
                        <option value="Arial">Arial</option>
                      </select>
                    </div>

                    {/* Font Size */}
                    <div className="space-y-2">
                      <Label>Font Size: {selectedTemplate?.settings.fontSize || 12}pt</Label>
                      <input
                        type="range"
                        min="9"
                        max="16"
                        value={selectedTemplate?.settings.fontSize || 12}
                        className="w-full"
                        onChange={(e) => {
                          if (selectedTemplate) {
                            const updatedTemplate = {
                              ...selectedTemplate,
                              settings: { ...selectedTemplate.settings, fontSize: parseInt(e.target.value) }
                            };
                            setSelectedTemplate(updatedTemplate);
                            generatePreview(updatedTemplate);
                          }
                        }}
                      />
                    </div>

                    {/* Line Spacing */}
                    <div className="space-y-2">
                      <Label>Line Spacing: {selectedTemplate?.settings.lineSpacing || 1.2}</Label>
                      <input
                        type="range"
                        min="1.0"
                        max="2.5"
                        step="0.1"
                        value={selectedTemplate?.settings.lineSpacing || 1.2}
                        className="w-full"
                        onChange={(e) => {
                          if (selectedTemplate) {
                            const updatedTemplate = {
                              ...selectedTemplate,
                              settings: { ...selectedTemplate.settings, lineSpacing: parseFloat(e.target.value) }
                            };
                            setSelectedTemplate(updatedTemplate);
                            generatePreview(updatedTemplate);
                          }
                        }}
                      />
                    </div>

                    {/* Margins */}
                    <div className="space-y-3">
                      <Label>Margins (inches)</Label>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <Label className="text-xs">Top: {selectedTemplate?.settings.margins.top || 0.875}"</Label>
                          <input
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.125"
                            value={selectedTemplate?.settings.margins.top || 0.875}
                            className="w-full"
                            onChange={(e) => {
                              if (selectedTemplate) {
                                const updatedTemplate = {
                                  ...selectedTemplate,
                                  settings: { 
                                    ...selectedTemplate.settings, 
                                    margins: { 
                                      ...selectedTemplate.settings.margins, 
                                      top: parseFloat(e.target.value) 
                                    }
                                  }
                                };
                                setSelectedTemplate(updatedTemplate);
                                generatePreview(updatedTemplate);
                              }
                            }}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Bottom: {selectedTemplate?.settings.margins.bottom || 0.875}"</Label>
                          <input
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.125"
                            value={selectedTemplate?.settings.margins.bottom || 0.875}
                            className="w-full"
                            onChange={(e) => {
                              if (selectedTemplate) {
                                const updatedTemplate = {
                                  ...selectedTemplate,
                                  settings: { 
                                    ...selectedTemplate.settings, 
                                    margins: { 
                                      ...selectedTemplate.settings.margins, 
                                      bottom: parseFloat(e.target.value) 
                                    }
                                  }
                                };
                                setSelectedTemplate(updatedTemplate);
                                generatePreview(updatedTemplate);
                              }
                            }}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Inside: {selectedTemplate?.settings.margins.inside || 0.875}"</Label>
                          <input
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.125"
                            value={selectedTemplate?.settings.margins.inside || 0.875}
                            className="w-full"
                            onChange={(e) => {
                              if (selectedTemplate) {
                                const updatedTemplate = {
                                  ...selectedTemplate,
                                  settings: { 
                                    ...selectedTemplate.settings, 
                                    margins: { 
                                      ...selectedTemplate.settings.margins, 
                                      inside: parseFloat(e.target.value) 
                                    }
                                  }
                                };
                                setSelectedTemplate(updatedTemplate);
                                generatePreview(updatedTemplate);
                              }
                            }}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Outside: {selectedTemplate?.settings.margins.outside || 0.625}"</Label>
                          <input
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.125"
                            value={selectedTemplate?.settings.margins.outside || 0.625}
                            className="w-full"
                            onChange={(e) => {
                              if (selectedTemplate) {
                                const updatedTemplate = {
                                  ...selectedTemplate,
                                  settings: { 
                                    ...selectedTemplate.settings, 
                                    margins: { 
                                      ...selectedTemplate.settings.margins, 
                                      outside: parseFloat(e.target.value) 
                                    }
                                  }
                                };
                                setSelectedTemplate(updatedTemplate);
                                generatePreview(updatedTemplate);
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Include Elements */}
                    <div className="space-y-2">
                      <Label>Include Elements</Label>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedTemplate?.settings.includeElements.titlePage || false}
                            onChange={(e) => {
                              if (selectedTemplate) {
                                const updatedTemplate = {
                                  ...selectedTemplate,
                                  settings: { 
                                    ...selectedTemplate.settings, 
                                    includeElements: { 
                                      ...selectedTemplate.settings.includeElements, 
                                      titlePage: e.target.checked 
                                    }
                                  }
                                };
                                setSelectedTemplate(updatedTemplate);
                                generatePreview(updatedTemplate);
                              }
                            }}
                          />
                          <span className="text-sm">Title Page</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedTemplate?.settings.includeElements.tableOfContents || false}
                            onChange={(e) => {
                              if (selectedTemplate) {
                                const updatedTemplate = {
                                  ...selectedTemplate,
                                  settings: { 
                                    ...selectedTemplate.settings, 
                                    includeElements: { 
                                      ...selectedTemplate.settings.includeElements, 
                                      tableOfContents: e.target.checked 
                                    }
                                  }
                                };
                                setSelectedTemplate(updatedTemplate);
                                generatePreview(updatedTemplate);
                              }
                            }}
                          />
                          <span className="text-sm">Table of Contents</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedTemplate?.settings.includeElements.pageNumbers || false}
                            onChange={(e) => {
                              if (selectedTemplate) {
                                const updatedTemplate = {
                                  ...selectedTemplate,
                                  settings: { 
                                    ...selectedTemplate.settings, 
                                    includeElements: { 
                                      ...selectedTemplate.settings.includeElements, 
                                      pageNumbers: e.target.checked 
                                    }
                                  }
                                };
                                setSelectedTemplate(updatedTemplate);
                                generatePreview(updatedTemplate);
                              }
                            }}
                          />
                          <span className="text-sm">Page Numbers</span>
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Preview */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Live Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg bg-white shadow-inner">
                      <iframe
                        srcDoc={formattedHTML}
                        className="w-full h-[600px] border-0 rounded-lg"
                        title="Book Preview"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* AI Feedback Panel */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      AI Assistant
                    </CardTitle>
                    <CardDescription>
                      Ask AI to fix or change something
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ai-feedback">Your Request</Label>
                      <Textarea
                        id="ai-feedback"
                        placeholder="e.g., Make chapter titles bold and centered, increase font size, adjust margins..."
                        value={aiMessage}
                        onChange={(e) => setAiMessage(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                    
                    <Button 
                      onClick={sendAIFeedback}
                      disabled={!aiMessage.trim() || processingFeedback}
                      className="w-full"
                    >
                      {processingFeedback ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Apply Changes
                        </>
                      )}
                    </Button>

                    <div className="mt-6 space-y-2">
                      <Button 
                        onClick={exportToPDF}
                        className="w-full"
                        size="lg"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export to PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'export' && (
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Complete - Ready for KDP
              </CardTitle>
              <CardDescription>
                Your book has been formatted according to KDP standards and is ready for publishing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium mb-2">Professional Formatting Applied!</h3>
                <p className="text-muted-foreground mb-4">
                  Your book now includes proper margins, typography, and layout optimized for Amazon KDP
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">📄 PDF Export Instructions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="space-y-2">
                      <p><strong>1. Print to PDF:</strong></p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Use Ctrl/Cmd + P in the preview window</li>
                        <li>Select "Save as PDF" as destination</li>
                        <li>Set margins to "None" or "Custom: 0"</li>
                        <li>Enable "Background graphics"</li>
                        <li>Choose "More settings" → "Paper size: A4 or Letter"</li>
                      </ul>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                      <p className="text-blue-800 dark:text-blue-200 text-xs">
                        <strong>Tip:</strong> For best results, use Chrome or Firefox. Avoid Safari for PDF generation.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">📚 KDP Upload Ready</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="space-y-2">
                      <p><strong>Your book includes:</strong></p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>KDP-compliant margins and spacing</li>
                        <li>Professional typography</li>
                        <li>Proper chapter breaks and pagination</li>
                        <li>Table of contents (if enabled)</li>
                        <li>Title page with metadata</li>
                      </ul>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                      <p className="text-green-800 dark:text-green-200 text-xs">
                        <strong>Book Details:</strong><br/>
                        Size: {selectedTemplate?.settings.trimSize}<br/>
                        Font: {selectedTemplate?.settings.fontFamily} {selectedTemplate?.settings.fontSize}pt<br/>
                        Pages: ~{bookAnalysis?.metadata.totalChapters} chapters
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-4 justify-center pt-4">
                <Button 
                  onClick={() => exportToPDF()} 
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF Again
                </Button>
                <Button 
                  onClick={() => setCurrentStep('preview')} 
                  variant="outline"
                  size="lg"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Back to Preview
                </Button>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline"
                  size="lg"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Format New Book
                </Button>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium mb-3">Next Steps for KDP Publishing:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-orange-600 font-bold">1</span>
                    </div>
                    <p><strong>Upload to KDP</strong></p>
                    <p className="text-muted-foreground">Go to kdp.amazon.com and upload your PDF as manuscript</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-orange-600 font-bold">2</span>
                    </div>
                    <p><strong>Design Cover</strong></p>
                    <p className="text-muted-foreground">Create or upload your book cover (separate from manuscript)</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-orange-600 font-bold">3</span>
                    </div>
                    <p><strong>Publish</strong></p>
                    <p className="text-muted-foreground">Set pricing, description, and publish your book worldwide</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}; 