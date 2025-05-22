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
  Plus, 
  Trash2, 
  Pencil, 
  Save, 
  X, 
  Check, 
  BookOpen,
  RotateCcw,
  BookText,
  Play
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

// Mock AI content generation function - will replace with real API call
const generateChapterContent = async (
  chapterId: string,
  chapterTitle: string,
  bookSummary: string,
  tone: string,
  audience: string
): Promise<string> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mock response - we'll generate more realistic content with the real API
  return `
This is a sample chapter about "${chapterTitle}".

The content is generated with a ${tone.toLowerCase()} tone, targeting ${audience.toLowerCase()}.

Here's some sample content that explains the main concepts of this chapter:

## Introduction

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi vel magna at libero lacinia condimentum. Fusce volutpat, enim vitae consectetur interdum, tellus orci tempor dolor, ut tincidunt odio enim at arcu. Nullam eget elementum augue. Nulla faucibus, mi eu imperdiet mattis, nisl magna faucibus velit, eu ultrices nisl orci ac libero.

## Main Section

Suspendisse blandit quam in ex maximus, in pretium ex malesuada. Proin hendrerit convallis diam, quis commodo justo. Mauris faucibus varius diam, eu rhoncus magna dignissim in. Vivamus consequat sit amet eros a lobortis. Cras consectetur varius risus ut rutrum. 

## Key Points

- This is an important point to remember
- Here's another key concept for readers
- This insight will help readers understand the topic better
- Practical application of the concepts discussed

## Conclusion

Nam euismod fermentum massa, non vulputate magna accumsan quis. Phasellus ultrices turpis ut justo varius, in volutpat risus faucibus. Nulla facilisi. Maecenas consequat lacus et metus elementum, vel posuere eros tristique.
  `;
};

// Function to count words in a string
const countWords = (text: string): number => {
  if (!text) return 0;
  return text.split(/\s+/).filter(word => word.length > 0).length;
};

interface ContentGenerationStepProps {
  settings: BookGeneratorSettings;
  onSettingChange: (key: keyof BookGeneratorSettings, value: any) => void;
}

export const ContentGenerationStep: React.FC<ContentGenerationStepProps> = ({
  settings,
  onSettingChange,
}) => {
  const [activeChapterId, setActiveChapterId] = useState<string | null>(
    settings.chapters.length > 0 ? settings.chapters[0].id : null
  );
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('edit');
  const [previewPage, setPreviewPage] = useState(0);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null);
  const [currentTab, setCurrentTab] = useState('edit');
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewChapter, setPreviewChapter] = useState<Chapter | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [editingPage, setEditingPage] = useState(false);
  const [pageEditValue, setPageEditValue] = useState('');
  const { toast } = useToast();

  const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://puzzlemakeribral-production.up.railway.app';

  const activeChapter = settings.chapters.find(chapter => chapter.id === activeChapterId);

  const updateChapterContent = (chapterId: string, content: string) => {
    const wordCount = countWords(content);
    const updatedChapters = settings.chapters.map(chapter => 
      chapter.id === chapterId 
        ? { ...chapter, content, wordCount } 
        : chapter
    );
    
    onSettingChange('chapters', updatedChapters);
  };

  const handleGenerateContent = async (chapterId: string) => {
    const chapter = settings.chapters.find(ch => ch.id === chapterId);
    if (!chapter) return;

    setIsGenerating(chapterId);
    
    try {
      const content = await generateChapterContent(
        chapterId,
        chapter.title,
        settings.bookSummary,
        settings.tone,
        settings.targetAudience
      );
      
      updateChapterContent(chapterId, content);
      
      toast({
        title: 'Chapter content generated',
        description: `Generated content for "${chapter.title}"`,
      });
    } catch (error) {
      console.error('Error generating chapter content:', error);
      toast({
        title: 'Error generating content',
        description: 'Something went wrong. Please try again.',
      });
    } finally {
      setIsGenerating(null);
    }
  };

  const handleGenerateAllContent = async () => {
    if (settings.chapters.length === 0) {
      toast({
        title: 'No chapters available',
        description: 'Please create chapters in the previous step before generating content.',
      });
      return;
    }

    for (const chapter of settings.chapters) {
      if (!chapter.content) {
        await handleGenerateContent(chapter.id);
      }
    }
  };

  const getPageText = (content: string, pageIndex: number): string => {
    const wordsPerPage = 250; // Approximate words per page
    const words = content.split(/\s+/).filter(word => word.length > 0);
    const totalPages = Math.ceil(words.length / wordsPerPage);
    
    if (pageIndex >= totalPages) return '';
    
    const startIndex = pageIndex * wordsPerPage;
    const endIndex = Math.min(startIndex + wordsPerPage, words.length);
    
    return words.slice(startIndex, endIndex).join(' ');
  };

  const getChapterProgress = (): number => {
    const totalChapters = settings.chapters.length;
    if (totalChapters === 0) return 0;
    
    const completedChapters = settings.chapters.filter(chapter => chapter.content).length;
    return Math.round((completedChapters / totalChapters) * 100);
  };

  const getTotalWordCount = (): number => {
    return settings.chapters.reduce((total, chapter) => total + chapter.wordCount, 0);
  };

  const getEstimatedPages = (): number => {
    const wordsPerPage = 250; // Approximate words per page
    return Math.ceil(getTotalWordCount() / wordsPerPage);
  };

  const selectNextChapter = () => {
    if (!activeChapterId) return;
    
    const currentIndex = settings.chapters.findIndex(chapter => chapter.id === activeChapterId);
    if (currentIndex < settings.chapters.length - 1) {
      setActiveChapterId(settings.chapters[currentIndex + 1].id);
    }
  };

  const selectPreviousChapter = () => {
    if (!activeChapterId) return;
    
    const currentIndex = settings.chapters.findIndex(chapter => chapter.id === activeChapterId);
    if (currentIndex > 0) {
      setActiveChapterId(settings.chapters[currentIndex - 1].id);
    }
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

  // Function to generate content for a single chapter
  const generateChapterContent = async (chapterIndex: number) => {
    try {
      setGeneratingIndex(chapterIndex);
      const chapter = settings.chapters[chapterIndex];
      
      // If no chapter, abort
      if (!chapter) {
        throw new Error('Chapter not found');
      }

      // Create a prompt for chapter generation
      const prompt = {
        title: settings.title,
        subtitle: settings.subtitle,
        bookSummary: settings.bookSummary,
        tone: settings.tone,
        targetAudience: settings.targetAudience,
        chapterTitle: chapter.title,
        chapterNumber: chapterIndex + 1,
        totalChapters: settings.chapters.length,
      };

      // Try to call the API
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 1 minute timeout
        
        const response = await fetch(`${apiBaseUrl}/api/openai/generate-chapter-content`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(prompt),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.content) {
          // Update the chapter with the generated content
          const updatedChapters = [...settings.chapters];
          updatedChapters[chapterIndex] = {
            ...updatedChapters[chapterIndex],
            content: data.content,
            wordCount: countWords(data.content)
          };
          
          onSettingChange('chapters', updatedChapters);
          
          toast({
            title: 'Content generated',
            description: `Content for "${chapter.title}" has been generated.`,
          });
          
          return true;
        } else {
          throw new Error('API response missing content');
        }
      } catch (error: any) {
        console.error('API error, using fallback generation:', error);
        // Fallback: Generate chapter content locally
        
        // Create a sample chapter based on the chapter title
        let dummyContent = `# ${chapter.title}\n\n`;
        
        // Add 5-7 paragraphs of content
        const paragraphCount = 5 + Math.floor(Math.random() * 3);
        for (let i = 0; i < paragraphCount; i++) {
          dummyContent += `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.\n\n`;
        }
        
        // Add a subheading
        dummyContent += `## Key Points\n\n`;
        
        // Add 3 bullet points
        dummyContent += `- Important point related to ${chapter.title}\n`;
        dummyContent += `- Another crucial element to consider\n`;
        dummyContent += `- Final point to remember\n\n`;
        
        // Add a conclusion paragraph
        dummyContent += `In conclusion, this chapter has covered important aspects of ${chapter.title}. The next chapter will build upon these concepts and explore more advanced topics.`;
        
        // Update the chapter with the generated content
        const updatedChapters = [...settings.chapters];
        updatedChapters[chapterIndex] = {
          ...updatedChapters[chapterIndex],
          content: dummyContent,
          wordCount: countWords(dummyContent)
        };
        
        onSettingChange('chapters', updatedChapters);
        
        toast({
          title: 'Offline content generated',
          description: `Sample content for "${chapter.title}" has been created. You should edit this placeholder text.`,
        });
        
        return true;
      }
    } catch (error) {
      console.error('Error generating chapter content:', error);
      toast({
        title: 'Generation failed',
        description: 'Failed to generate chapter content. Please try again.',
      });
      return false;
    } finally {
      setGeneratingIndex(null);
    }
  };

  // Function to generate all chapters
  const generateAllChapters = async () => {
    setIsGeneratingAll(true);
    setGenerationProgress(0);
    
    let successCount = 0;
    for (let i = 0; i < settings.chapters.length; i++) {
      // Skip chapters that already have content
      if (settings.chapters[i].content) {
        setGenerationProgress(((i + 1) / settings.chapters.length) * 100);
        continue;
      }
      
      const success = await generateChapterContent(i);
      if (success) successCount++;
      
      // Update progress
      setGenerationProgress(((i + 1) / settings.chapters.length) * 100);
    }
    
    setIsGeneratingAll(false);
    
    toast({
      title: 'Generation complete',
      description: `Generated content for ${successCount} chapters.`,
    });
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

  const pagesInChapter = (chapter: Chapter | null) => {
    if (!chapter) return 0;
    return Math.ceil(chapter.wordCount / 250); // Approx. 250 words per page
  };

  const getPageContent = (chapter: Chapter | null, pageIndex: number) => {
    if (!chapter || !chapter.content) return '';
    
    const wordsPerPage = 250;
    const words = chapter.content.split(/\s+/);
    const startIndex = pageIndex * wordsPerPage;
    const pageWords = words.slice(startIndex, startIndex + wordsPerPage);
    
    return pageWords.join(' ');
  };

  const handleEditPage = () => {
    if (!previewChapter) return;
    setPageEditValue(getPageContent(previewChapter, currentPage));
    setEditingPage(true);
  };

  const handleSavePageEdit = () => {
    if (!previewChapter || !editingPage) return;
    
    // Split the chapter content into pages
    const wordsPerPage = 250;
    const words = previewChapter.content.split(/\s+/);
    const startIndex = currentPage * wordsPerPage;
    const endIndex = startIndex + wordsPerPage;
    
    // Replace the current page's content
    const newPageWords = pageEditValue.split(/\s+/);
    const newWords = [
      ...words.slice(0, startIndex),
      ...newPageWords,
      ...words.slice(endIndex)
    ];
    
    // Update chapter content
    const newContent = newWords.join(' ');
    const updatedChapter = {
      ...previewChapter,
      content: newContent,
      wordCount: newWords.length
    };
    
    // Update chapters in settings
    const updatedChapters = settings.chapters.map(chapter => 
      chapter.id === previewChapter.id ? updatedChapter : chapter
    );
    
    onSettingChange('chapters', updatedChapters);
    setPreviewChapter(updatedChapter);
    setEditingPage(false);
    
    toast({
      title: 'Page updated',
      description: `Page ${currentPage + 1} has been updated.`,
    });
  };

  const handleCancelPageEdit = () => {
    setEditingPage(false);
    setPageEditValue('');
  };

  const renderChapters = () => {
    if (settings.chapters.length === 0) {
      return (
        <div className="text-center py-10">
          <BookText className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Chapters Yet</h3>
          <p className="text-muted-foreground mb-4">
            Go back to the Book Concept step to generate your table of contents.
          </p>
          <Button variant="secondary" size="sm">
            Go to Book Concept
          </Button>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {settings.chapters.map((chapter, index) => (
          <Card key={chapter.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-medium">{chapter.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {chapter.wordCount > 0 
                      ? `${chapter.wordCount} words · Approximately ${Math.ceil(chapter.wordCount / 250)} pages` 
                      : 'No content yet'}
                  </p>
                </div>
                <div className="flex gap-2">
                  {generatingIndex === index ? (
                    <Button variant="ghost" size="sm" disabled>
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </Button>
                  ) : (
                    <>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => generateChapterContent(index)}
                        disabled={isGeneratingAll}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Generate
                      </Button>
                      {chapter.content && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditChapter(chapter.id)}
                          disabled={!!editingChapterId}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      )}
                      {chapter.content && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openChapterPreview(chapter)}
                        >
                          <BookOpen className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {chapter.content && (
                <div
                  className={`mt-2 overflow-hidden transition-all duration-300 ${
                    expandedChapter === chapter.id ? 'max-h-60' : 'max-h-20'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">
                    {chapter.content}
                  </div>
                </div>
              )}
              
              {chapter.content && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => handleExpandChapter(chapter.id)}
                >
                  {expandedChapter === chapter.id ? 'Show Less' : 'Show More'}
                </Button>
              )}
              
              {!chapter.content && generatingIndex !== index && (
                <div className="flex items-center justify-center py-6 border rounded-md border-dashed mt-2">
                  <div className="text-center">
                    <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click "Generate" to create content for this chapter
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold">Content Generation</h2>
          <p className="text-muted-foreground">Generate and edit your book's content chapter by chapter</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={generateAllChapters}
            disabled={isGeneratingAll || !!editingChapterId || settings.chapters.length === 0}
          >
            {isGeneratingAll ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-1" />
                Generate All Content
              </>
            )}
          </Button>
        </div>
      </div>
      
      {isGeneratingAll && (
        <div className="space-y-2">
          <Progress value={generationProgress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Generating chapters...</span>
            <span>{Math.round(generationProgress)}%</span>
          </div>
        </div>
      )}
      
      <Tabs defaultValue="edit" value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="edit">Edit Chapters</TabsTrigger>
        </TabsList>
        
        <TabsContent value="edit" className="space-y-4">
          {renderChapters()}
        </TabsContent>
      </Tabs>
      
      {/* Chapter Editing Dialog */}
      {editingChapterId && (
        <Dialog open={!!editingChapterId} onOpenChange={() => handleCancelEdit()}>
          <DialogContent className="max-w-4xl max-h-[90vh] h-[80vh]">
            <DialogHeader>
              <DialogTitle>
                Editing: {settings.chapters.find(c => c.id === editingChapterId)?.title}
              </DialogTitle>
              <DialogDescription>
                Edit the content of this chapter. The content should be approximately 1500-2500 words.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <ScrollArea className="flex-1 mt-4">
                <Textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="min-h-[400px] h-full font-mono"
                />
              </ScrollArea>
              
              <div className="mt-4 text-sm text-muted-foreground">
                Word count: {countWords(editValue)} words
              </div>
            </div>
            
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={handleCancelEdit}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>
                <Save className="h-4 w-4 mr-1" />
                Save Chapter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Chapter Preview Dialog */}
      {showPreviewDialog && previewChapter && (
        <Dialog open={showPreviewDialog} onOpenChange={closePreview}>
          <DialogContent className="max-w-4xl max-h-[90vh] h-[80vh]">
            <DialogHeader>
              <DialogTitle>
                {previewChapter.title} - Page {currentPage + 1} of {pagesInChapter(previewChapter)}
              </DialogTitle>
              <DialogDescription>
                Preview how this chapter will appear in your book
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {editingPage ? (
                <div className="flex-1 flex flex-col">
                  <Textarea
                    value={pageEditValue}
                    onChange={(e) => setPageEditValue(e.target.value)}
                    className="min-h-[400px] flex-1 font-mono"
                  />
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={handleCancelPageEdit}>
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button onClick={handleSavePageEdit}>
                      <Save className="h-4 w-4 mr-1" />
                      Save Page
                    </Button>
                  </div>
                </div>
              ) : (
                <ScrollArea className="flex-1 mt-4">
                  <div 
                    className="border rounded-md p-6 bg-white mb-4"
                    style={{
                      fontFamily: settings.fontFamily,
                      fontSize: `${settings.fontSize}pt`,
                      lineHeight: settings.lineSpacing,
                      position: 'relative',
                      minHeight: '400px'
                    }}
                  >
                    {currentPage === 0 && (
                      <h2 className="text-xl font-bold mb-4">{previewChapter.title}</h2>
                    )}
                    <div className="whitespace-pre-wrap">
                      {getPageContent(previewChapter, currentPage)}
                    </div>
                    
                    {settings.includePageNumbers && (
                      <div className="absolute bottom-4 w-full text-center text-sm">
                        Page {currentPage + 1}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
              
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0 || editingPage}
                  >
                    Previous Page
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(pagesInChapter(previewChapter) - 1, currentPage + 1))}
                    disabled={currentPage === pagesInChapter(previewChapter) - 1 || editingPage}
                  >
                    Next Page
                  </Button>
                </div>
                {!editingPage && (
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={handleEditPage}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit This Page
                  </Button>
                )}
              </div>
            </div>
            
            <DialogFooter className="mt-4">
              <Button onClick={closePreview}>
                Close Preview
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}; 