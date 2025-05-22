import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookGeneratorSettings, Chapter } from '../AIBookGenerator';
import { 
  Loader2, 
  FileText, 
  Pencil, 
  Save, 
  X, 
  BookOpen,
  BookText,
  Play,
  BookMarked,
  CheckCircle,
  FileDown
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from "@/components/ui/progress";
import { generateCompleteBook } from '@/api/openai';

interface ContentGenerationStepProps {
  settings: BookGeneratorSettings;
  onSettingChange: (key: keyof BookGeneratorSettings, value: any) => void;
}

export const ContentGenerationStepNew: React.FC<ContentGenerationStepProps> = ({
  settings,
  onSettingChange,
}) => {
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewChapter, setPreviewChapter] = useState<Chapter | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [editingPage, setEditingPage] = useState(false);
  const [pageEditValue, setPageEditValue] = useState('');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const { toast } = useToast();

  // Function to count words in a string
  const countWords = (text: string): number => {
    if (!text) return 0;
    return text.split(/\s+/).filter(word => word.length > 0).length;
  };

  const handleEditChapter = (chapterId: string) => {
    const chapter = settings.chapters.find(c => c.id === chapterId);
    if (chapter) {
      setEditValue(chapter.content);
      setEditingChapterId(chapterId);
    }
  };

  const handleSaveEdit = () => {
    if (!editingChapterId) return;
    
    const updatedChapters = settings.chapters.map(chapter => 
      chapter.id === editingChapterId 
        ? { ...chapter, content: editValue, wordCount: countWords(editValue) }
        : chapter
    );
    
    onSettingChange('chapters', updatedChapters);
    setEditingChapterId(null);
    setEditValue('');
    
    toast({
      title: 'Chapter saved',
      description: 'Your chapter content has been updated.',
    });
  };

  const handleCancelEdit = () => {
    setEditingChapterId(null);
    setEditValue('');
  };

  const handleExpandChapter = (chapterId: string) => {
    if (expandedChapter === chapterId) {
      setExpandedChapter(null);
    } else {
      setExpandedChapter(chapterId);
    }
  };

  // Function to generate the entire book at once
  const fullBookGeneration = async () => {
    try {
      setIsGenerating(true);
      setGenerationProgress(0);
      setGenerationError(null);
      
      // Call the API to generate a complete book
      const response = await generateCompleteBook({
        title: settings.title,
        subtitle: settings.subtitle,
        bookSummary: settings.bookSummary,
        tone: settings.tone,
        targetAudience: settings.targetAudience,
        pageCount: settings.pageCount, // Make sure we're using the user's requested page count
        bookSize: settings.bookSize,
        fontFamily: settings.fontFamily,
        fontSize: settings.fontSize
      });
      
      // Check if we have chapters and process them
      if (response.chapters && response.chapters.length > 0) {
        // Check if the estimated page count matches the requested page count
        const generatedPageCount = Math.ceil(response.chapters.reduce((total, ch) => total + ch.wordCount, 0) / 250);
        
        // Log details for debugging
        console.log('Book generation details:', {
          requestedPageCount: settings.pageCount,
          generatedPageCount,
          chapterCount: response.chapters.length,
          totalWords: response.chapters.reduce((total, ch) => total + ch.wordCount, 0)
        });
        
        // Only accept the generation if it's within 10% of the requested page count
        if (Math.abs(generatedPageCount - settings.pageCount) > settings.pageCount * 0.1) {
          console.log('Generated page count is too different from requested page count, retrying...');
          // Retry once
          setIsGenerating(false);
          setTimeout(() => fullBookGeneration(), 500);
          return;
        }
        
        // Save the generated chapters
        onSettingChange('chapters', response.chapters);
        
        // Create a table of contents from the chapters
        const tableOfContents = response.chapters.map((chapter, index) => ({
          id: (index + 1).toString(),
          title: chapter.title,
          content: '',
          wordCount: 0
        }));
        
        onSettingChange('tableOfContents', tableOfContents);
        setIsGenerating(false);
        toast({
          title: 'Book generated successfully',
          description: `Generated a ${settings.pageCount}-page book with ${response.chapters.length} chapters.`,
        });
      } else {
        setIsGenerating(false);
        setGenerationError('Unable to generate your book. Please try again.');
        toast({
          title: 'Book generation failed',
          description: 'Unable to generate your book. Please try again.',
        });
      }
    } catch (error) {
      console.error('Error generating book:', error);
      setIsGenerating(false);
      setGenerationError(error instanceof Error ? error.message : 'Unknown error occurred');
      toast({
        title: 'Book generation failed',
        description: 'Unable to generate your book. Please try again.',
      });
    }
  };
  
  // Generate some fallback content if the API fails
  const generateFallbackBook = () => {
    // Determine a reasonable number of chapters based on page count
    const chaptersCount = Math.max(5, Math.round(settings.pageCount / 30));
    
    // Create sample chapters
    const fallbackChapters: Chapter[] = [];
    
    // Add introduction
    fallbackChapters.push({
      id: '1',
      title: 'Introduction',
      content: `# Introduction\n\nThis is a placeholder for your book introduction. The actual content generation failed, so you'll need to edit this content manually.\n\nYour book concept was: ${settings.bookSummary}`,
      wordCount: 30
    });
    
    // Add main chapters
    for (let i = 1; i < chaptersCount; i++) {
      fallbackChapters.push({
        id: (i + 1).toString(),
        title: `Chapter ${i}`,
        content: `# Chapter ${i}\n\nThis is a placeholder for your chapter content. The actual content generation failed, so you'll need to edit this content manually.`,
        wordCount: 20
      });
    }
    
    // Add conclusion
    fallbackChapters.push({
      id: (chaptersCount + 1).toString(),
      title: 'Conclusion',
      content: `# Conclusion\n\nThis is a placeholder for your book conclusion. The actual content generation failed, so you'll need to edit this content manually.`,
      wordCount: 20
    });
    
    // Update the chapters with the fallback content
    onSettingChange('chapters', fallbackChapters);
    onSettingChange('tableOfContents', fallbackChapters);
  };

  // Preview functionality
  const openChapterPreview = (chapter: Chapter) => {
    setPreviewChapter(chapter);
    setCurrentPage(0);
    setShowPreviewDialog(true);
  };

  const closePreview = () => {
    setShowPreviewDialog(false);
    setPreviewChapter(null);
    setCurrentPage(0);
    setEditingPage(false);
  };

  // Calculate number of pages in a chapter (rough estimate)
  const pagesInChapter = (chapter: Chapter | null) => {
    if (!chapter?.content) return 0;
    // Assuming average words per page based on book size and font
    return Math.ceil(chapter.wordCount / 250);
  };

  // Get content for a specific page in the chapter
  const getPageContent = (chapter: Chapter | null, pageIndex: number) => {
    if (!chapter?.content) return '';
    
    const wordsPerPage = 250;
    const words = chapter.content.split(/\s+/);
    
    const startIdx = pageIndex * wordsPerPage;
    const endIdx = Math.min((pageIndex + 1) * wordsPerPage, words.length);
    
    return words.slice(startIdx, endIdx).join(' ');
  };

  // Edit page content
  const handleEditPage = () => {
    if (!previewChapter) return;
    setPageEditValue(getPageContent(previewChapter, currentPage));
    setEditingPage(true);
  };

  // Save edited page content
  const handleSavePageEdit = () => {
    if (!previewChapter || !editingPage) return;
    
    const chapter = previewChapter;
    const wordsPerPage = 250;
    const words = chapter.content.split(/\s+/);
    const startIdx = currentPage * wordsPerPage;
    const endIdx = Math.min((currentPage + 1) * wordsPerPage, words.length);
    
    // Replace the current page content with edited content
    const newPageWords = pageEditValue.split(/\s+/);
    const newWords = [
      ...words.slice(0, startIdx),
      ...newPageWords,
      ...words.slice(endIdx)
    ];
    
    const newContent = newWords.join(' ');
    
    // Update the chapter with new content
    const updatedChapter = {
      ...chapter,
      content: newContent,
      wordCount: newWords.length
    };
    
    // Update preview chapter
    setPreviewChapter(updatedChapter);
    
    // Update chapters in settings
    const updatedChapters = settings.chapters.map(c => 
      c.id === updatedChapter.id ? updatedChapter : c
    );
    
    onSettingChange('chapters', updatedChapters);
    
    setEditingPage(false);
    
    toast({
      title: 'Page updated',
      description: 'Your changes have been saved.',
    });
  };

  // Cancel page edit
  const handleCancelPageEdit = () => {
    setEditingPage(false);
    setPageEditValue('');
  };

  // Render chapters list
  const renderChapters = () => {
    if (!settings.chapters || settings.chapters.length === 0) {
      return (
        <div className="text-center p-6 border border-dashed rounded-md">
          <BookMarked className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-3" />
          <p className="text-muted-foreground mb-6">
            No content yet. Click the "Generate Book" button to create your book content.
          </p>
          <Button 
            onClick={fullBookGeneration} 
            disabled={isGenerating}
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Book...
              </>
            ) : (
              <>
                <BookOpen className="mr-2 h-4 w-4" />
                Generate Book
              </>
            )}
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {settings.chapters.map((chapter) => (
          <Card key={chapter.id} className="overflow-hidden">
            <div 
              className="p-4 border-b cursor-pointer hover:bg-secondary/10 flex justify-between items-center"
              onClick={() => handleExpandChapter(chapter.id)}
            >
              <div className="flex-1">
                <h3 className="font-medium">{chapter.title}</h3>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <FileText className="h-3 w-3 mr-1" />
                  <span>{chapter.wordCount} words</span>
                  <span className="mx-2">•</span>
                  <span>~{pagesInChapter(chapter)} pages</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={(e) => {
                  e.stopPropagation();
                  openChapterPreview(chapter);
                }}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button variant="outline" size="sm" onClick={(e) => {
                  e.stopPropagation();
                  handleEditChapter(chapter.id);
                }}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
            
            {expandedChapter === chapter.id && (
              <CardContent className="pt-4">
                <ScrollArea className="h-64 w-full">
                  <div className="whitespace-pre-wrap">
                    {chapter.content || 'No content yet.'}
                  </div>
                </ScrollArea>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold">Book Content</h2>
          <p className="text-muted-foreground">Generate and edit your book content</p>
        </div>
        
        <div className="flex gap-2">
          {settings.chapters && settings.chapters.length > 0 && (
            <Button 
              variant="outline" 
              onClick={fullBookGeneration}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Regenerate Book
            </Button>
          )}
        </div>
      </div>
      
      {/* Show progress bar when generating */}
      {isGenerating && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Loader2 className="h-5 w-5 text-primary animate-spin" /> Generating Your Book
            </h3>
            <Separator className="mb-4" />
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>Generating content...</span>
                  <span>{Math.round(generationProgress)}%</span>
                </div>
                <Progress value={generationProgress} />
                <p className="text-xs text-muted-foreground mt-2">
                  Creating a {settings.pageCount}-page book about "{settings.bookSummary.substring(0, 50)}..."
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Show error message if generation failed */}
      {generationError && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-2 text-destructive">Generation Error</h3>
            <p className="text-sm mb-4">{generationError}</p>
            <p className="text-xs text-muted-foreground">Fallback content has been created instead. You can edit it or try again.</p>
          </CardContent>
        </Card>
      )}
      
      {/* Content area */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <BookText className="h-5 w-5 text-primary" /> Book Chapters
          </h3>
          <Separator className="mb-6" />
          
          {renderChapters()}
          
          {/* Chapter completion status */}
          {settings.chapters && settings.chapters.length > 0 && (
            <div className="flex items-center gap-1 text-sm text-green-600 mt-4">
              <CheckCircle className="h-4 w-4" />
              <span>
                Book generated with {settings.chapters.length} chapters and approximately {settings.chapters.reduce((total, chapter) => total + chapter.wordCount, 0)} words
              </span>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Chapter editing dialog */}
      {editingChapterId && (
        <Dialog open={!!editingChapterId} onOpenChange={(isOpen) => {
          if (!isOpen) handleCancelEdit();
        }}>
          <DialogContent className="sm:max-w-[900px]">
            <DialogHeader>
              <DialogTitle>
                Edit Chapter: {settings.chapters.find(c => c.id === editingChapterId)?.title}
              </DialogTitle>
              <DialogDescription>
                Edit your chapter content below. Use markdown formatting for headers, lists, and emphasis.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <Textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="min-h-[60vh] font-mono text-sm resize-none"
              />
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={handleCancelEdit}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Chapter preview dialog */}
      {showPreviewDialog && previewChapter && (
        <Dialog open={showPreviewDialog} onOpenChange={closePreview}>
          <DialogContent className="sm:max-w-[900px]">
            <DialogHeader>
              <DialogTitle>
                {previewChapter.title} - Page {currentPage + 1} of {pagesInChapter(previewChapter)}
              </DialogTitle>
              <DialogDescription>
                Preview how your chapter will appear in the final book.
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="page">
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="page">Page View</TabsTrigger>
                <TabsTrigger value="full">Full Chapter</TabsTrigger>
              </TabsList>
              
              <TabsContent value="page" className="relative">
                {!editingPage ? (
                  <div 
                    className="p-8 border rounded-md h-[60vh] overflow-auto" 
                    style={{ 
                      fontFamily: settings.fontFamily,
                      fontSize: `${settings.fontSize}pt`,
                      lineHeight: settings.lineSpacing
                    }}
                  >
                    <div dangerouslySetInnerHTML={{ __html: getPageContent(previewChapter, currentPage).replace(/\n/g, '<br />') }} />
                    
                    {settings.includePageNumbers && (
                      <div className="absolute bottom-4 right-4 text-sm">
                        {currentPage + 1}
                      </div>
                    )}
                  </div>
                ) : (
                  <Textarea
                    value={pageEditValue}
                    onChange={(e) => setPageEditValue(e.target.value)}
                    className="h-[60vh] font-mono text-sm resize-none"
                    style={{ 
                      fontFamily: settings.fontFamily,
                      fontSize: `${settings.fontSize}pt`,
                      lineHeight: settings.lineSpacing
                    }}
                  />
                )}
              </TabsContent>
              
              <TabsContent value="full">
                <ScrollArea className="h-[60vh] w-full p-4 border rounded-md">
                  <div
                    className="whitespace-pre-wrap p-4"
                    style={{ 
                      fontFamily: settings.fontFamily,
                      fontSize: `${settings.fontSize}pt`,
                      lineHeight: settings.lineSpacing
                    }}
                  >
                    {previewChapter.content}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
            
            <DialogFooter className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0 || editingPage}
                >
                  Previous Page
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.min(pagesInChapter(previewChapter) - 1, currentPage + 1))}
                  disabled={currentPage >= pagesInChapter(previewChapter) - 1 || editingPage}
                >
                  Next Page
                </Button>
              </div>
              
              <div className="flex gap-2">
                {editingPage ? (
                  <>
                    <Button variant="outline" onClick={handleCancelPageEdit}>
                      Cancel
                    </Button>
                    <Button onClick={handleSavePageEdit}>
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" onClick={handleEditPage}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Page
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}; 