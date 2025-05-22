import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { BookGeneratorSettings, Chapter } from '../AIBookGenerator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Loader2, 
  FileText, 
  RefreshCw, 
  PenSquare,
  BookOpen,
  AlertCircle,
  CheckCircle,
  EyeIcon,
  ScrollText,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

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
  const { toast } = useToast();

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold">Content Generation</h2>
          <p className="text-muted-foreground">Generate and edit content for each chapter of your book</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleGenerateAllContent}
            disabled={isGenerating !== null || settings.chapters.length === 0}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate All
              </>
            )}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-primary" /> Chapters
            </h3>
            <Separator className="mb-4" />
            
            <div className="space-y-1">
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Generation Progress</span>
                  <Badge variant="outline">{getChapterProgress()}%</Badge>
                </div>
                <Progress value={getChapterProgress()} className="h-2" />
              </div>
              
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Word Count</span>
                <span className="text-sm font-medium">{getTotalWordCount()} words</span>
              </div>
              
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm">Estimated Pages</span>
                <span className="text-sm font-medium">{getEstimatedPages()} pages</span>
              </div>
              
              <Separator className="mb-4" />
              
              <ScrollArea className="h-[320px]">
                <div className="space-y-2 pr-4">
                  {settings.chapters.length === 0 ? (
                    <div className="text-center p-4 border border-dashed rounded-md">
                      <p className="text-muted-foreground text-sm">
                        No chapters created yet. Please add chapters in the previous step.
                      </p>
                    </div>
                  ) : (
                    settings.chapters.map((chapter) => (
                      <div
                        key={chapter.id}
                        className={`p-3 rounded-md cursor-pointer transition-colors ${
                          activeChapterId === chapter.id
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-secondary/50'
                        }`}
                        onClick={() => setActiveChapterId(chapter.id)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="font-medium truncate">{chapter.title}</div>
                          {chapter.content ? (
                            <CheckCircle className="h-4 w-4 flex-shrink-0 ml-2" />
                          ) : (
                            <AlertCircle className="h-4 w-4 flex-shrink-0 ml-2 text-muted-foreground" />
                          )}
                        </div>
                        {chapter.content && (
                          <div className="text-xs mt-1">
                            {chapter.wordCount} words
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
              
              <div className="flex justify-between mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectPreviousChapter}
                  disabled={!activeChapterId || settings.chapters.findIndex(ch => ch.id === activeChapterId) === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectNextChapter}
                  disabled={
                    !activeChapterId || 
                    settings.chapters.findIndex(ch => ch.id === activeChapterId) === settings.chapters.length - 1
                  }
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-3">
          <CardContent className="pt-6">
            {!activeChapter ? (
              <div className="text-center p-8">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-3" />
                <h3 className="text-lg font-medium mb-2">No Chapter Selected</h3>
                <p className="text-muted-foreground mb-4">
                  Select a chapter from the sidebar to edit or generate content.
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">{activeChapter.title}</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab(activeTab === 'edit' ? 'preview' : 'edit')}
                    >
                      {activeTab === 'edit' ? (
                        <>
                          <EyeIcon className="h-4 w-4 mr-2" /> Preview
                        </>
                      ) : (
                        <>
                          <PenSquare className="h-4 w-4 mr-2" /> Edit
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateContent(activeChapter.id)}
                      disabled={isGenerating === activeChapter.id}
                    >
                      {isGenerating === activeChapter.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" /> Regenerate
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <Separator className="mb-4" />
                
                {activeTab === 'edit' ? (
                  <div>
                    <Textarea
                      value={activeChapter.content}
                      onChange={(e) => updateChapterContent(activeChapter.id, e.target.value)}
                      placeholder="Enter or generate content for this chapter..."
                      className="min-h-[400px] resize-y font-mono text-sm"
                    />
                    
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                      <span>{activeChapter.wordCount} words</span>
                      <span>Estimated pages: {Math.ceil(activeChapter.wordCount / 250)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-md p-6 min-h-[400px] bg-white">
                    <div
                      className="prose max-w-none"
                      style={{
                        fontFamily: settings.fontFamily,
                        fontSize: `${settings.fontSize}pt`,
                        lineHeight: settings.lineSpacing,
                      }}
                      dangerouslySetInnerHTML={{ 
                        __html: activeChapter.content
                          .replace(/\n\n/g, '</p><p>')
                          .replace(/\n/g, '<br />')
                          .replace(/^(.*)$/, '<p>$1</p>')
                          .replace(/<p><\/p>/g, '')
                          .replace(/## (.*?)$/gm, '<h2>$1</h2>')
                          .replace(/# (.*?)$/gm, '<h1>$1</h1>')
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                          .replace(/- (.*?)$/gm, '<li>$1</li>')
                          .replace(/<li>(.*?)<\/li>/g, '<ul><li>$1</li></ul>')
                          .replace(/<\/ul><ul>/g, '')
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 