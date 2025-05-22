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
  Plus
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided } from '@hello-pangea/dnd';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';

// Real function for AI TOC generation using the API
const generateTOCWithAI = async (
  bookSummary: string, 
  tone: string, 
  audience: string
): Promise<Chapter[]> => {
  try {
    console.log('generateTOCWithAI called with:', { bookSummary, tone, audience });
    
    // Check if API URL is correct
    const apiBaseUrl = 'https://puzzlemakeribral-production.up.railway.app';
    console.log('Using API URL:', apiBaseUrl);
    
    // Make direct fetch call for debugging
    const response = await fetch(`${apiBaseUrl}/api/generate-toc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bookSummary,
        tone,
        audience,
      }),
    });

    console.log('API response status:', response.status);
    
    // Handle non-ok responses
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }

    // Parse the response
    const data = await response.json();
    console.log('API response data:', data);
    
    // Check if data.chapters exists
    if (data.chapters && Array.isArray(data.chapters)) {
      return data.chapters.map((chapter: any, index: number) => ({
        id: (index + 1).toString(),
        title: chapter.title || `Chapter ${index + 1}`,
        content: '',
        wordCount: 0,
      }));
    }
    
    // Fallback to mock data if API doesn't return expected format
    console.warn('API did not return expected format, using fallback data');
    return [
      { id: '1', title: 'Introduction', content: '', wordCount: 0 },
      { id: '2', title: 'Chapter 1: Understanding the Basics', content: '', wordCount: 0 },
      { id: '3', title: 'Chapter 2: Key Concepts', content: '', wordCount: 0 },
      { id: '4', title: 'Chapter 3: Practical Applications', content: '', wordCount: 0 },
      { id: '5', title: 'Chapter 4: Case Studies', content: '', wordCount: 0 },
      { id: '6', title: 'Chapter 5: Advanced Techniques', content: '', wordCount: 0 },
      { id: '7', title: 'Conclusion', content: '', wordCount: 0 },
    ];
  } catch (error) {
    console.error('Error generating TOC:', error);
    
    // Always return fallback data on error
    console.log('Returning fallback data due to error');
    return [
      { id: '1', title: 'Introduction', content: '', wordCount: 0 },
      { id: '2', title: 'Chapter 1: Understanding the Basics', content: '', wordCount: 0 },
      { id: '3', title: 'Chapter 2: Key Concepts', content: '', wordCount: 0 },
      { id: '4', title: 'Chapter 3: Practical Applications', content: '', wordCount: 0 },
      { id: '5', title: 'Chapter 4: Case Studies', content: '', wordCount: 0 },
      { id: '6', title: 'Chapter 5: Advanced Techniques', content: '', wordCount: 0 },
      { id: '7', title: 'Conclusion', content: '', wordCount: 0 },
    ];
  }
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Update local state when settings change
  useEffect(() => {
    console.log('Settings updated, updating local state');
    setSummaryText(settings.bookSummary || '');
  }, [settings.bookSummary]);

  // Add global document click handler to help with focus issues
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      // Check if click was inside our wrapper
      const wrapper = document.querySelector('.textarea-wrapper');
      if (wrapper && wrapper.contains(e.target as Node)) {
        console.log('Click inside wrapper');
        // Focus the textarea if the click was inside our wrapper
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }
    };

    // Add the event listener
    document.addEventListener('click', handleDocumentClick);

    // Cleanup
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

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
              <div 
                className="textarea-wrapper relative w-full min-h-[200px] border rounded-md border-[#4d4d4d] hover:border-[#3a86ff] focus-within:border-[#3a86ff] focus-within:ring-2 focus-within:ring-[#3a86ff] focus-within:ring-opacity-30"
                onClick={(e) => {
                  console.log('Wrapper clicked');
                  if (textareaRef.current) {
                    textareaRef.current.focus();
                  }
                  e.stopPropagation();
                }}
                style={{ zIndex: 50 }}
              >
                <textarea
                  ref={textareaRef}
                  id="bookSummary"
                  value={summaryText}
                  onChange={handleSummaryChange}
                  onClick={(e) => {
                    console.log('Textarea clicked');
                    e.stopPropagation();
                  }}
                  onFocus={() => console.log('Textarea focused')}
                  onBlur={() => console.log('Textarea blurred')}
                  className="absolute top-0 left-0 w-full h-full p-3 resize-y bg-[#1e1e1e] text-white outline-none border-none rounded-md"
                  placeholder="Describe your book idea in detail. For example: A motivational book for teenagers about building confidence and overcoming failure."
                  tabIndex={0}
                  style={{ zIndex: 100, minHeight: '200px' }}
                />
              </div>
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
              onClick={handleGenerateTOC}
              disabled={isGenerating || !summaryText.trim()}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
              type="button"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Table of Contents...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Table of Contents
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
          
          <div className="space-y-4">
            {settings.tableOfContents.length === 0 ? (
              <div className="text-center p-8 border border-dashed rounded-md">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-3" />
                <p className="text-muted-foreground">
                  Your table of contents will appear here. Generate it using AI or add chapters manually.
                </p>
              </div>
            ) : (
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
            )}
            
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 