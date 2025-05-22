import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generateTableOfContents } from '@/api/openai';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { BookGeneratorSettings, Chapter } from '../AIBookGenerator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  BookText, 
  Target, 
  MessageSquare, 
  BookOpenCheck, 
  LayoutList, 
  Sparkles, 
  Loader2, 
  Trash, 
  GripVertical,
  BookOpen,
  Plus,
  X,
  Check,
  Edit
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided } from '@hello-pangea/dnd';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Real function for AI TOC generation using the Railway backend API
const generateTOCWithAI = async (
  bookSummary: string, 
  tone: string, 
  audience: string
): Promise<Chapter[]> => {
  try {
    console.log('generateTOCWithAI called with:', { bookSummary, tone, audience });
    
    // Use the Railway backend API which has the OpenAI integration
    const apiBaseUrl = 'https://puzzlemakeribral-production.up.railway.app';
    console.log('Using Railway API URL:', apiBaseUrl);
    
    // Enhanced debugging for the request
    const requestBody = {
      bookSummary,
      tone,
      audience
    };
    console.log('Sending request to Railway API:', requestBody);
    
    const response = await fetch(`${apiBaseUrl}/api/openai/generate-toc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Railway API response status:', response.status);
    
    // Handle non-ok responses
    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = 'Could not extract error text';
      }
      console.error('Railway API error response:', errorText);
      throw new Error(`Railway API request failed: ${response.status} ${errorText}`);
    }

    // Parse the response
    let data;
    try {
      data = await response.json();
      console.log('Railway API response data:', data);
    } catch (jsonError) {
      console.error('Error parsing JSON from Railway API:', jsonError);
      throw new Error('Could not parse API response as JSON');
    }
    
    // Check if data.chapters exists
    if (data && data.success && data.chapters && Array.isArray(data.chapters)) {
      return data.chapters.map((chapter: any, index: number) => ({
        id: chapter.id || (index + 1).toString(),
        title: chapter.title || `Chapter ${index + 1}`,
        content: '',
        wordCount: 0,
      }));
    }
    
    // Fallback to mock data if API doesn't return expected format
    console.warn('Railway API did not return expected format, using fallback data');
    return generateMockTOC(bookSummary);
  } catch (error) {
    console.error('Error generating TOC:', error);
    // Always return fallback data on error for a better user experience
    console.log('Returning fallback data due to error');
    return generateMockTOC(bookSummary);
  }
};

// Generate a mock TOC based on the book summary
const generateMockTOC = (bookSummary: string): Chapter[] => {
  // Extract some keywords from the summary to make the mock TOC more relevant
  const keywords = bookSummary.split(' ')
    .filter(word => word.length > 4)
    .map(word => word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ""));
  
  const uniqueKeywords = [...new Set(keywords)];
  const relevantKeywords = uniqueKeywords.slice(0, 5);
  
  console.log('Using keywords for mock TOC:', relevantKeywords);
  
  // Create a basic structure with some of the keywords
  return [
    { id: '1', title: 'Introduction', content: '', wordCount: 0 },
    { id: '2', title: `Chapter 1: Understanding ${relevantKeywords[0] || 'the Basics'}`, content: '', wordCount: 0 },
    { id: '3', title: `Chapter 2: Exploring ${relevantKeywords[1] || 'Key Concepts'}`, content: '', wordCount: 0 },
    { id: '4', title: `Chapter 3: ${relevantKeywords[2] || 'Practical'} Applications`, content: '', wordCount: 0 },
    { id: '5', title: `Chapter 4: Case Studies in ${relevantKeywords[3] || 'the Field'}`, content: '', wordCount: 0 },
    { id: '6', title: `Chapter 5: Advanced ${relevantKeywords[4] || 'Techniques'}`, content: '', wordCount: 0 },
    { id: '7', title: 'Conclusion', content: '', wordCount: 0 },
  ];
};

// Generate a full book proposal with AI
const generateBookProposal = async (
  bookSummary: string,
  tone: string,
  audience: string
): Promise<{
  title: string;
  subtitle: string;
  description: string;
}> => {
  try {
    console.log('Generating book proposal with:', { bookSummary, tone, audience });
    
    // Use the Railway backend API
    const apiBaseUrl = 'https://puzzlemakeribral-production.up.railway.app';
    
    const response = await fetch(`${apiBaseUrl}/api/openai/generate-book-proposal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bookSummary,
        tone,
        audience
      })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Book proposal API response:', data);
    
    if (data.success && data.proposal) {
      return data.proposal;
    }
    
    // Fallback mock data if API doesn't return expected format
    return generateMockProposal(bookSummary, tone, audience);
  } catch (error) {
    console.error('Error generating book proposal:', error);
    // Return fallback data on error
    return generateMockProposal(bookSummary, tone, audience);
  }
};

// Generate a mock book proposal based on the input
const generateMockProposal = (
  bookSummary: string,
  tone: string,
  audience: string
): { title: string; subtitle: string; description: string } => {
  // Extract keywords for a more relevant proposal
  const keywords = bookSummary.split(' ')
    .filter(word => word.length > 4)
    .map(word => word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ""));
  
  const uniqueKeywords = [...new Set(keywords)];
  const mainKeyword = uniqueKeywords[0] || 'Success';
  const secondKeyword = uniqueKeywords[1] || 'Journey';
  
  // Generate different titles based on tone
  let title = '';
  let subtitle = '';
  let description = '';
  
  switch (tone) {
    case 'Serious':
      title = `The ${mainKeyword} Method`;
      subtitle = `A Comprehensive Guide to Understanding ${secondKeyword}`;
      break;
    case 'Fun':
      title = `${mainKeyword} Adventures`;
      subtitle = `Exploring the Exciting World of ${secondKeyword}`;
      break;
    case 'Educational':
      title = `Understanding ${mainKeyword}`;
      subtitle = `A Step-by-Step Guide to Mastering ${secondKeyword}`;
      break;
    case 'Storytelling':
      title = `The ${mainKeyword} Chronicles`;
      subtitle = `A Journey Through ${secondKeyword}`;
      break;
    default:
      title = `The Complete Guide to ${mainKeyword}`;
      subtitle = `Everything You Need to Know About ${secondKeyword}`;
  }
  
  // Generate description based on audience
  switch (audience) {
    case 'Kids':
      description = `This colorful and engaging book helps young readers discover the fascinating world of ${mainKeyword}. Through fun activities, simple explanations, and delightful illustrations, children will learn about ${secondKeyword} while developing their imagination and critical thinking skills.`;
      break;
    case 'Teens':
      description = `Specifically designed for today's teenagers, this book offers practical insights into ${mainKeyword} with relatable examples and real-world applications. Readers will gain valuable knowledge about ${secondKeyword} that they can apply to their studies and personal development.`;
      break;
    case 'Adults':
      description = `A comprehensive exploration of ${mainKeyword} for adult readers seeking to expand their understanding of ${secondKeyword}. This book combines thorough research with practical wisdom, offering both theoretical knowledge and actionable strategies for real-world application.`;
      break;
    default:
      description = `An accessible guide to ${mainKeyword} for readers of all backgrounds. This book provides a thorough introduction to ${secondKeyword}, combining essential theory with practical applications suitable for beginners and experienced individuals alike.`;
  }
  
  return {
    title,
    subtitle,
    description: `${description}\n\nBased on your summary: "${bookSummary}"`
  };
};

interface BookConceptStepProps {
  settings: BookGeneratorSettings;
  onSettingChange: (key: keyof BookGeneratorSettings, value: any) => void;
}

export const BookConceptStep: React.FC<BookConceptStepProps> = ({
  settings,
  onSettingChange,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [summaryText, setSummaryText] = useState(settings.bookSummary || '');
  const [bookProposal, setBookProposal] = useState<{
    title: string;
    subtitle: string;
    description: string;
  } | null>(null);
  const [showProposalReview, setShowProposalReview] = useState(false);
  const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);
  const { toast } = useToast();

  // Update local state when settings change
  useEffect(() => {
    console.log('Settings updated, updating local state');
    setSummaryText(settings.bookSummary || '');
  }, [settings.bookSummary]);

  // Auto-save to localStorage
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (summaryText.trim()) {
        console.log('Auto-saving book summary...');
        onSettingChange('bookSummary', summaryText);
      }
    }, 10000); // Auto-save every 10 seconds

    return () => clearInterval(autoSaveInterval);
  }, [summaryText, onSettingChange]);

  const toneOptions = [
    { value: 'Serious', label: 'Serious - Professional and formal' },
    { value: 'Fun', label: 'Fun - Light-hearted and entertaining' },
    { value: 'Educational', label: 'Educational - Informative and instructional' },
    { value: 'Storytelling', label: 'Storytelling - Narrative and engaging' },
  ];

  const audienceOptions = [
    { value: 'Kids', label: 'Kids (Ages 6-12)' },
    { value: 'Teens', label: 'Teens (Ages 13-17)' },
    { value: 'Adults', label: 'Adults (18+)' },
  ];

  // Handle summary text change
  const handleSummaryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    console.log('Summary changed:', value);
    setSummaryText(value);
    onSettingChange('bookSummary', value);
  };

  // Generate book proposal
  const handleGenerateProposal = async () => {
    if (!summaryText.trim()) {
      toast({
        title: 'Book summary required',
        description: 'Please enter a summary of your book before generating a proposal.',
      });
      return;
    }

    // Update the parent component with the current summary
    onSettingChange('bookSummary', summaryText);
    
    setIsGeneratingProposal(true);
    
    try {
      const proposal = await generateBookProposal(
        summaryText,
        settings.tone,
        settings.targetAudience
      );
      
      setBookProposal(proposal);
      
      // Update settings with the proposal data
      onSettingChange('title', proposal.title);
      onSettingChange('subtitle', proposal.subtitle);
      
      toast({
        title: 'Book proposal generated',
        description: 'Please review the suggested title, subtitle, and description.',
      });
      
      // Show the proposal review UI
      setShowProposalReview(true);
    } catch (error) {
      console.error('Error generating book proposal:', error);
      toast({
        title: 'Error generating proposal',
        description: 'Something went wrong. Please try again.',
      });
    } finally {
      setIsGeneratingProposal(false);
    }
  };

  // Accept the proposal and generate table of contents
  const handleAcceptProposal = () => {
    if (!bookProposal) return;
    
    // Update settings with the accepted proposal
    onSettingChange('title', bookProposal.title);
    onSettingChange('subtitle', bookProposal.subtitle);
    
    // Proceed to generate table of contents
    handleGenerateTOC();
    
    // Hide the proposal review UI
    setShowProposalReview(false);
  };

  // Modify the proposal
  const handleProposalChange = (field: 'title' | 'subtitle' | 'description', value: string) => {
    if (!bookProposal) return;
    
    setBookProposal({
      ...bookProposal,
      [field]: value
    });
    
    // Update settings immediately for title and subtitle
    if (field === 'title' || field === 'subtitle') {
      onSettingChange(field, value);
    }
  };

  // Cancel proposal review
  const handleCancelProposal = () => {
    setShowProposalReview(false);
    setBookProposal(null);
  };

  const handleGenerateTOC = async () => {
    if (!summaryText.trim()) {
      toast({
        title: 'Book summary required',
        description: 'Please enter a summary of your book before generating a table of contents.',
      });
      return;
    }

    // Update the parent component with the current summary
    onSettingChange('bookSummary', summaryText);
    
    setIsGenerating(true);
    toast({
      title: 'Generating table of contents...',
      description: 'This may take up to 30 seconds as we analyze your book concept.',
    });
    
    try {
      console.log('Calling generateTOCWithAI with:', {
        summaryText,
        tone: settings.tone,
        targetAudience: settings.targetAudience
      });
      
      const generatedTOC = await generateTOCWithAI(
        summaryText,
        settings.tone,
        settings.targetAudience
      );
      
      console.log('Generated TOC:', generatedTOC);
      
      // Update the settings with the generated TOC
      onSettingChange('tableOfContents', generatedTOC);
      onSettingChange('chapters', generatedTOC);
      
      toast({
        title: 'Table of Contents generated',
        description: `Generated ${generatedTOC.length} chapters based on your book concept.`,
      });
    } catch (error) {
      console.error('Error generating TOC:', error);
      toast({
        title: 'Error generating Table of Contents',
        description: 'Something went wrong. Please try again.',
      });
      
      // Even if the API fails, generate a basic TOC with the mock function
      const mockTOC = generateMockTOC(summaryText);
      onSettingChange('tableOfContents', mockTOC);
      onSettingChange('chapters', mockTOC);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(settings.tableOfContents);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    onSettingChange('tableOfContents', items);
    onSettingChange('chapters', items);
  };

  const handleEditChapterTitle = (id: string, newTitle: string) => {
    const updatedTOC = settings.tableOfContents.map(chapter => 
      chapter.id === id ? { ...chapter, title: newTitle } : chapter
    );
    
    onSettingChange('tableOfContents', updatedTOC);
    onSettingChange('chapters', updatedTOC);
  };

  const handleDeleteChapter = (id: string) => {
    const updatedTOC = settings.tableOfContents.filter(chapter => chapter.id !== id);
    
    onSettingChange('tableOfContents', updatedTOC);
    onSettingChange('chapters', updatedTOC);
  };

  const handleAddChapter = () => {
    if (!newChapterTitle.trim()) {
      toast({
        title: 'Chapter title required',
        description: 'Please enter a title for the new chapter.',
      });
      return;
    }
    
    const newChapter = {
      id: Date.now().toString(),
      title: newChapterTitle,
      content: '',
      wordCount: 0,
    };
    
    onSettingChange('tableOfContents', [...settings.tableOfContents, newChapter]);
    onSettingChange('chapters', [...settings.chapters, newChapter]);
    setNewChapterTitle('');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <BookText className="h-5 w-5 text-primary" /> Book Concept
          </h3>
          <Separator className="mb-4" />
          
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="bookSummary">Book Summary / Idea</Label>
              <Textarea
                id="bookSummary"
                value={summaryText}
                onChange={handleSummaryChange}
                className="min-h-[200px] resize-y"
                placeholder="Describe your book idea in detail. For example: A motivational book for teenagers about building confidence and overcoming failure."
              />
              <p className="text-xs text-muted-foreground">
                Be specific about your topic, intended audience, and what you want readers to learn or experience.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tone" className="flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" /> Preferred Tone
                </Label>
                <Select
                  value={settings.tone}
                  onValueChange={(value) => onSettingChange('tone', value)}
                >
                  <SelectTrigger id="tone">
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    {toneOptions.map((tone) => (
                      <SelectItem key={tone.value} value={tone.value}>
                        {tone.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="targetAudience" className="flex items-center gap-1">
                  <Target className="h-3.5 w-3.5" /> Target Audience
                </Label>
                <Select
                  value={settings.targetAudience}
                  onValueChange={(value) => onSettingChange('targetAudience', value)}
                >
                  <SelectTrigger id="targetAudience">
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    {audienceOptions.map((audience) => (
                      <SelectItem key={audience.value} value={audience.value}>
                        {audience.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button
              onClick={handleGenerateProposal}
              disabled={isGeneratingProposal}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
              type="button"
            >
              {isGeneratingProposal ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Book Proposal...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Book Proposal
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <LayoutList className="h-5 w-5 text-primary" /> Table of Contents
            </h3>
            <Badge variant="outline">
              {settings.tableOfContents.length} {settings.tableOfContents.length === 1 ? 'Chapter' : 'Chapters'}
            </Badge>
          </div>
          <Separator className="mb-4" />
          
          {settings.tableOfContents.length === 0 ? (
            <div className="text-center p-8 border border-dashed rounded-md">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-3" />
              <p className="text-muted-foreground">
                Your table of contents will appear here after you've generated and accepted a book proposal.
              </p>
              {bookProposal && (
                <Button 
                  onClick={handleGenerateTOC} 
                  className="mt-4" 
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>Generate Table of Contents</>
                  )}
                </Button>
              )}
            </div>
          ) : (
            <>
              <ScrollArea className="h-[320px] pr-4">
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="chapters">
                    {(provided: DroppableProvided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-2"
                      >
                        {settings.tableOfContents.map((chapter, index) => (
                          <Draggable key={chapter.id} draggableId={chapter.id} index={index}>
                            {(provided: DraggableProvided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="flex items-center gap-2 p-2 bg-secondary/10 rounded-md group border border-transparent hover:border-primary/20"
                              >
                                <div
                                  {...provided.dragHandleProps}
                                  className="text-muted-foreground cursor-move p-1"
                                >
                                  <GripVertical className="h-4 w-4" />
                                </div>
                                
                                <Input
                                  value={chapter.title}
                                  onChange={(e) => handleEditChapterTitle(chapter.id, e.target.value)}
                                  className="flex-1 h-8 text-sm bg-transparent border-none focus-visible:ring-1"
                                />
                                
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleDeleteChapter(chapter.id)}
                                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </ScrollArea>
              
              <div className="flex gap-2 mt-4">
                <Input
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  placeholder="New chapter title"
                  className="flex-1"
                />
                <Button onClick={handleAddChapter} disabled={!newChapterTitle.trim()}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Book Proposal Review Dialog */}
      <Dialog open={showProposalReview} onOpenChange={setShowProposalReview}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Review Your Book Proposal</DialogTitle>
            <DialogDescription>
              We've generated a proposal based on your book concept. Review and edit before proceeding.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Edit className="h-4 w-4" /> Book Title
              </Label>
              <Input 
                value={bookProposal?.title || ''}
                onChange={(e) => handleProposalChange('title', e.target.value)}
                className="text-lg font-semibold"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Edit className="h-4 w-4" /> Subtitle
              </Label>
              <Input 
                value={bookProposal?.subtitle || ''}
                onChange={(e) => handleProposalChange('subtitle', e.target.value)}
                className="text-base"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Edit className="h-4 w-4" /> Book Description
              </Label>
              <Textarea 
                value={bookProposal?.description || ''}
                onChange={(e) => handleProposalChange('description', e.target.value)}
                className="min-h-[150px]"
              />
            </div>
          </div>
          
          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={handleCancelProposal}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleAcceptProposal} className="flex-1">
              <Check className="mr-2 h-4 w-4" />
              Accept and Generate Table of Contents
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 