import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { KDPBookSettings, BookContent, Chapter } from '../KDPBookFormatter';
import { v4 as uuidv4 } from 'uuid';
import { getApiUrl, API_CONFIG } from '@/config/api';
import { useToast } from '@/components/ui/use-toast';
import { 
  Settings, 
  BookOpen, 
  Type, 
  Ruler, 
  FileText, 
  Hash,
  ToggleLeft,
  Info,
  User,
  Building,
  Calendar,
  Barcode,
  Brain,
  Shield,
  RefreshCw,
  Loader2
} from 'lucide-react';

interface BookSettingsStepProps {
  settings: KDPBookSettings;
  bookContent: BookContent;
  onSettingChange: (key: keyof KDPBookSettings, value: any) => void;
  onContentChange: (content: Partial<BookContent>) => void;
}

const trimSizeInfo = {
  '5x8': { desc: 'Ideal for novels, fiction', pages: 'Up to 828 pages' },
  '6x9': { desc: 'Most popular, versatile', pages: 'Up to 630 pages' },
  '7x10': { desc: 'Non-fiction, workbooks', pages: 'Up to 550 pages' },
  '8.5x11': { desc: 'Textbooks, manuals', pages: 'Up to 440 pages' }
};

const fontInfo = {
  'Times New Roman': 'Classic, professional serif font',
  'Garamond': 'Elegant, readable serif font',
  'Arial': 'Clean, modern sans-serif font',
  'Georgia': 'Web-optimized serif font',
  'Palatino': 'Sophisticated serif font'
};

// Conservative chapter detection function
const detectChaptersConservative = (rawText: string): Chapter[] => {
  if (!rawText.trim()) return [];

  // Very conservative patterns - only explicit chapter markers
  const chapterPatterns = [
    /^Chapter\s+(\d+|[IVXLCDM]+)[\s\.:]*(.*)$/gim,
    /^CHAPTER\s+(\d+|[IVXLCDM]+)[\s\.:]*(.*)$/gim,
    /^Ch\.\s*(\d+)[\s\.:]*(.*)$/gim,
    /^(\d+)\.\s+(.+)$/gim // Numbered sections like "1. Introduction"
  ];

  const chapters: Chapter[] = [];
  const lines = rawText.split('\n');
  let currentChapter: Chapter | null = null;
  let chapterCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    let isChapterStart = false;
    let chapterTitle = '';

    // Check each pattern
    for (const pattern of chapterPatterns) {
      pattern.lastIndex = 0; // Reset regex
      const match = pattern.exec(line);
      if (match) {
        isChapterStart = true;
        chapterTitle = match[2]?.trim() || `Chapter ${chapterCount + 1}`;
        break;
      }
    }

    if (isChapterStart) {
      // Save previous chapter
      if (currentChapter) {
        chapters.push(currentChapter);
      }

      // Start new chapter
      chapterCount++;
      currentChapter = {
        id: uuidv4(),
        title: chapterTitle || `Chapter ${chapterCount}`,
        content: '',
        level: 1
      };
    } else if (currentChapter) {
      // Add content to current chapter
      currentChapter.content += (currentChapter.content ? '\n' : '') + line;
    } else if (chapters.length === 0) {
      // No chapters detected yet, create a default chapter
      currentChapter = {
        id: uuidv4(),
        title: 'Main Content',
        content: line,
        level: 1
      };
    }
  }

  // Add the last chapter
  if (currentChapter) {
    chapters.push(currentChapter);
  }

  // If no chapters were detected, treat entire text as one chapter
  if (chapters.length === 0) {
    chapters.push({
      id: uuidv4(),
      title: 'Main Content',
      content: rawText.trim(),
      level: 1
    });
  }

  return chapters;
};

export const BookSettingsStep: React.FC<BookSettingsStepProps> = ({
  settings,
  bookContent,
  onSettingChange,
  onContentChange
}) => {
  const [reanalyzing, setReanalyzing] = useState(false);
  const { toast } = useToast();
  
  const handleMetadataChange = (field: string, value: string) => {
    onContentChange({
      metadata: {
        ...bookContent.metadata,
        [field]: value
      }
    });
  };

  const handleChapterDetectionModeChange = (useAI: boolean) => {
    onSettingChange('detectChapterBreaks', useAI);
    
    if (!useAI && bookContent.rawText) {
      // Re-process with conservative detection
      const conservativeChapters = detectChaptersConservative(bookContent.rawText);
      onContentChange({
        chapters: conservativeChapters
      });
    }
  };

  const handleReanalyzeContent = async () => {
    if (!bookContent.rawText) {
      toast({
        title: 'No content to analyze',
        description: 'Please upload a file first.',
      });
      return;
    }

    setReanalyzing(true);
    
    try {
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.KDP_FORMATTER.ENHANCE), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: bookContent,
          enhancementType: 'structure'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to re-analyze content');
      }

      const data = await response.json();
      
      if (data.success && data.content) {
        // Update with new analysis results
        const enhancedContent = {
          ...data.content,
          rawText: bookContent.rawText, // Preserve original raw text
          // Merge metadata, keeping user-entered values
          metadata: {
            ...data.content.metadata,
            ...Object.fromEntries(
              Object.entries(bookContent.metadata).filter(([_, value]) => value && value.trim() !== '')
            )
          }
        };
        
        onContentChange(enhancedContent);
        
        toast({
          title: 'Content re-analyzed successfully',
          description: `Detected ${enhancedContent.chapters.length} chapters and updated metadata`,
        });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error re-analyzing content:', error);
      
      let errorMessage = 'Failed to re-analyze content. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('not available')) {
          errorMessage = 'AI analysis not available. Please check your OpenAI API configuration.';
        }
      }
      
      toast({
        title: 'Re-analysis failed',
        description: errorMessage,
      });
    } finally {
      setReanalyzing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold tracking-tight">Book Settings</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Configure your book's layout, typography, and metadata for professional KDP formatting
        </p>
      </div>

      {/* Book Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Book Metadata
          </CardTitle>
          <CardDescription>
            Essential information for your book publication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="author" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Author
              </Label>
              <Input
                id="author"
                value={bookContent.metadata.author || ''}
                onChange={(e) => handleMetadataChange('author', e.target.value)}
                placeholder="Enter author name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="publisher" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Publisher
              </Label>
              <Input
                id="publisher"
                value={bookContent.metadata.publisher || ''}
                onChange={(e) => handleMetadataChange('publisher', e.target.value)}
                placeholder="Enter publisher name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="year" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Publication Year
              </Label>
              <Input
                id="year"
                value={bookContent.metadata.year || ''}
                onChange={(e) => handleMetadataChange('year', e.target.value)}
                placeholder="e.g., 2024"
                maxLength={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="isbn" className="flex items-center gap-2">
                <Barcode className="h-4 w-4" />
                ISBN (Optional)
              </Label>
              <Input
                id="isbn"
                value={bookContent.metadata.isbn || ''}
                onChange={(e) => handleMetadataChange('isbn', e.target.value)}
                placeholder="e.g., 978-0-123456-78-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Page Layout Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Page Layout
            </CardTitle>
            <CardDescription>
              Book dimensions and margin settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Trim Size */}
            <div className="space-y-3">
              <Label htmlFor="trimSize" className="text-base font-medium">Trim Size</Label>
              <Select
                value={settings.trimSize}
                onValueChange={(value) => onSettingChange('trimSize', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select trim size" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(trimSizeInfo).map(([size, info]) => (
                    <SelectItem key={size} value={size}>
                      <div className="flex items-center justify-between w-full">
                        <span>{size}"</span>
                        <div className="ml-4 text-xs text-muted-foreground">
                          {info.desc}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  <span>{trimSizeInfo[settings.trimSize].desc} • {trimSizeInfo[settings.trimSize].pages}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Margins */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Ruler className="h-4 w-4" />
                <Label className="text-base font-medium">Margins (inches)</Label>
                <Badge variant="secondary" className="text-xs">KDP Optimized</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="marginTop">Top</Label>
                  <Input
                    id="marginTop"
                    type="number"
                    min="0.5"
                    max="2"
                    step="0.125"
                    value={settings.marginTop}
                    onChange={(e) => onSettingChange('marginTop', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="marginBottom">Bottom</Label>
                  <Input
                    id="marginBottom"
                    type="number"
                    min="0.5"
                    max="2"
                    step="0.125"
                    value={settings.marginBottom}
                    onChange={(e) => onSettingChange('marginBottom', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="marginInside">Inside (Spine)</Label>
                  <Input
                    id="marginInside"
                    type="number"
                    min="0.5"
                    max="2"
                    step="0.125"
                    value={settings.marginInside}
                    onChange={(e) => onSettingChange('marginInside', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="marginOutside">Outside</Label>
                  <Input
                    id="marginOutside"
                    type="number"
                    min="0.25"
                    max="1.5"
                    step="0.125"
                    value={settings.marginOutside}
                    onChange={(e) => onSettingChange('marginOutside', parseFloat(e.target.value))}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Margins automatically adjust based on trim size selection
              </p>
            </div>

            <Separator />

            {/* Bleed */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Include Bleed</Label>
                <p className="text-sm text-muted-foreground">
                  Add 0.125" bleed for professional printing
                </p>
              </div>
              <Checkbox
                checked={settings.bleed}
                onCheckedChange={(checked) => onSettingChange('bleed', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Typography Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              Typography
            </CardTitle>
            <CardDescription>
              Font and text formatting options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Font Family */}
            <div className="space-y-3">
              <Label htmlFor="fontFamily" className="text-base font-medium">Font Family</Label>
              <Select
                value={settings.fontFamily}
                onValueChange={(value) => onSettingChange('fontFamily', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select font" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(fontInfo).map(([font, desc]) => (
                    <SelectItem key={font} value={font}>
                      <div className="flex flex-col items-start">
                        <span style={{ fontFamily: font }}>{font}</span>
                        <span className="text-xs text-muted-foreground">{desc}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Font Size */}
            <div className="space-y-3">
              <Label htmlFor="fontSize" className="text-base font-medium">Font Size</Label>
              <Select
                value={settings.fontSize.toString()}
                onValueChange={(value) => onSettingChange('fontSize', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {[10, 11, 12, 13, 14].map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}pt
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Line Spacing */}
            <div className="space-y-3">
              <Label htmlFor="lineSpacing" className="text-base font-medium">Line Spacing</Label>
              <Select
                value={settings.lineSpacing.toString()}
                onValueChange={(value) => onSettingChange('lineSpacing', parseFloat(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select spacing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1.0">Single (1.0)</SelectItem>
                  <SelectItem value="1.2">1.2x (Recommended)</SelectItem>
                  <SelectItem value="1.5">1.5x</SelectItem>
                  <SelectItem value="2.0">Double (2.0)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Book Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Book Features
          </CardTitle>
          <CardDescription>
            Additional elements to include in your book
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <Label className="font-medium">Title Page</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Add a professional title page
                </p>
              </div>
              <Checkbox
                checked={settings.includeTitlePage}
                onCheckedChange={(checked) => onSettingChange('includeTitlePage', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <Label className="font-medium">Table of Contents</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Generate TOC from chapters
                </p>
              </div>
              <Checkbox
                checked={settings.includeTOC}
                onCheckedChange={(checked) => onSettingChange('includeTOC', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  <Label className="font-medium">Page Numbers</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Add page numbers to footer
                </p>
              </div>
              <Checkbox
                checked={settings.includePageNumbers}
                onCheckedChange={(checked) => onSettingChange('includePageNumbers', checked)}
              />
            </div>

            <div className="col-span-full">
              <div className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {settings.detectChapterBreaks ? <Brain className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                      <Label className="font-medium">Chapter Detection Mode</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {settings.detectChapterBreaks 
                        ? 'AI-powered smart detection (may create false chapters)' 
                        : 'Conservative rule-based detection (only explicit chapters)'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleChapterDetectionModeChange(!settings.detectChapterBreaks)}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Switch to {settings.detectChapterBreaks ? 'Conservative' : 'Smart'}
                    </Button>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground bg-gray-50 dark:bg-gray-800 p-3 rounded">
                  <p className="font-medium mb-1">Current: {bookContent.chapters.length} chapters detected</p>
                  {settings.detectChapterBreaks ? (
                    <p>Smart mode uses AI to detect chapters but may create false positives from random text. Switch to Conservative if you see incorrect chapters.</p>
                  ) : (
                    <p>Conservative mode only detects explicit chapter markers like "Chapter 1", "CHAPTER 1", etc. More reliable but may miss some chapters.</p>
                  )}
                </div>
                
                {/* Re-analyze button */}
                <div className="pt-2 border-t">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleReanalyzeContent}
                    disabled={reanalyzing || !bookContent.rawText}
                    className="w-full flex items-center gap-2"
                  >
                    {reanalyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Re-analyzing content...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4" />
                        Re-analyze with AI for Better Detection
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1 text-center">
                    Use this if the detected chapters or metadata seem incorrect
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Settings Summary</CardTitle>
          <CardDescription>
            Review your current formatting settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <Label className="text-xs text-muted-foreground">TRIM SIZE</Label>
              <p className="font-medium">{settings.trimSize}"</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">FONT</Label>
              <p className="font-medium">{settings.fontFamily}, {settings.fontSize}pt</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">SPACING</Label>
              <p className="font-medium">{settings.lineSpacing}x</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">AUTHOR</Label>
              <p className="font-medium">{bookContent.metadata.author || 'Not specified'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 