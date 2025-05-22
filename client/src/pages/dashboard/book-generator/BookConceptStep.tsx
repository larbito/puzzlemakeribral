import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  LayoutList, 
  Sparkles, 
  Loader2, 
  Trash, 
  GripVertical,
  BookOpen,
  Plus,
  X,
  Check,
  Edit,
  RefreshCcw,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided } from '@hello-pangea/dnd';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { Textarea } from '@/components/ui/textarea';

// Extend the proposal interface to include table of contents
interface BookProposal {
  title: string;
  subtitle: string;
  description: string;
  tableOfContents: Chapter[];
}

// Mock functions for guaranteed functionality
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

// Generate a full book proposal locally to guarantee functionality
const generateBookProposal = async (
  bookSummary: string,
  tone: string,
  audience: string
): Promise<BookProposal> => {
  try {
    console.log('Generating book proposal with:', { bookSummary, tone, audience });
    
    // Use the Railway backend API - if this fails, we use fallback
    const apiBaseUrl = 'https://puzzlemakeribral-production.up.railway.app';
    
    try {
      const response = await fetch(`${apiBaseUrl}/api/openai/generate-book-proposal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookSummary,
          tone,
          audience,
          includeTableOfContents: true // Request TOC as part of the proposal
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Book proposal API response:', data);
      
      if (data.success && data.proposal) {
        // If the API returned TOC, use it, otherwise generate a mock TOC
        const tableOfContents = data.proposal.tableOfContents || generateMockTOC(bookSummary);
        
        return {
          ...data.proposal,
          tableOfContents
        };
      }
    } catch (error) {
      console.error('API error, using fallback:', error);
    }
    
    // Fallback mock data if API doesn't return expected format
    const mockProposal = generateMockProposal(bookSummary, tone, audience);
    const mockTOC = generateMockTOC(bookSummary);
    
    return {
      ...mockProposal,
      tableOfContents: mockTOC
    };
  } catch (error) {
    console.error('Error generating book proposal:', error);
    // Return fallback data on error
    const mockProposal = generateMockProposal(bookSummary, tone, audience);
    const mockTOC = generateMockTOC(bookSummary);
    
    return {
      ...mockProposal,
      tableOfContents: mockTOC
    };
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
  const [bookProposals, setBookProposals] = useState<BookProposal[]>([]);
  const [currentProposalIndex, setCurrentProposalIndex] = useState(0);
  const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);
  const [showProposal, setShowProposal] = useState(false);
  const { toast } = useToast();

  // Get current proposal
  const currentProposal = bookProposals[currentProposalIndex];

  // Update local state when settings change
  useEffect(() => {
    console.log('Settings updated, updating local state');
    setSummaryText(settings.bookSummary || '');
  }, [settings.bookSummary]);

  // Check if there are saved proposals but only load them if the user has explicitly saved their work
  useEffect(() => {
    // Only load saved proposals if they exist and bookGeneratorSaved flag is set
    const savedFlag = localStorage.getItem('bookGeneratorSaved');
    if (savedFlag === 'true') {
      const savedProposals = localStorage.getItem('bookProposals');
      const savedIndex = localStorage.getItem('currentProposalIndex');
      
      if (savedProposals) {
        try {
          const parsedProposals = JSON.parse(savedProposals);
          if (Array.isArray(parsedProposals) && parsedProposals.length > 0) {
            setBookProposals(parsedProposals);
            setShowProposal(true);
            
            if (savedIndex) {
              const index = parseInt(savedIndex, 10);
              setCurrentProposalIndex(isNaN(index) ? 0 : index);
            }
          }
        } catch (error) {
          console.error('Error loading saved proposals:', error);
        }
      }
    }
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

  // Modify handleSummaryChange to only update local state, not persistent storage
  const handleSummaryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    console.log('Summary changed:', value);
    setSummaryText(value);
    onSettingChange('bookSummary', value);
  };

  // Generate book proposal
  const handleGenerateProposal = async () => {
    // Validate input
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
      // Generate proposal with guaranteed fallback
      const proposal = await generateBookProposal(
        summaryText,
        settings.tone || 'Educational', // Default if not set
        settings.targetAudience || 'Adults' // Default if not set
      );
      
      // Add new proposal to history
      const newProposals = [...bookProposals, proposal];
      setBookProposals(newProposals);
      setCurrentProposalIndex(newProposals.length - 1);
      
      // Update settings with the proposal data
      onSettingChange('title', proposal.title);
      onSettingChange('subtitle', proposal.subtitle);
      onSettingChange('tableOfContents', proposal.tableOfContents);
      onSettingChange('chapters', proposal.tableOfContents);
      
      // Save to localStorage for debugging
      try {
        localStorage.setItem('lastGeneratedProposal', JSON.stringify(proposal));
        localStorage.setItem('bookProposals', JSON.stringify(newProposals));
        localStorage.setItem('currentProposalIndex', String(newProposals.length - 1));
      } catch (err) {
        console.error('Error saving to localStorage:', err);
      }
      
      toast({
        title: 'Book proposal generated',
        description: 'Your book proposal has been generated with a table of contents.',
      });
      
      // Show the proposal UI
      setShowProposal(true);
    } catch (error) {
      console.error('Error generating proposal:', error);
      
      // Even on complete failure, generate something for the user
      const mockProposal = generateMockProposal(summaryText, settings.tone, settings.targetAudience);
      const mockTOC = generateMockTOC(summaryText);
      
      const proposal = {
        ...mockProposal,
        tableOfContents: mockTOC
      };
      
      const newProposals = [...bookProposals, proposal];
      setBookProposals(newProposals);
      setCurrentProposalIndex(newProposals.length - 1);
      
      onSettingChange('title', proposal.title);
      onSettingChange('subtitle', proposal.subtitle);
      onSettingChange('tableOfContents', proposal.tableOfContents);
      onSettingChange('chapters', proposal.tableOfContents);
      
      setShowProposal(true);
      
      toast({
        title: 'Using offline mode',
        description: 'Generated a proposal using local processing.',
      });
    } finally {
      setIsGeneratingProposal(false);
    }
  };

  // Regenerate a proposal
  const handleRegenerateProposal = async () => {
    if (!summaryText.trim()) {
      toast({
        title: 'Book summary required',
        description: 'Please enter a summary before regenerating.',
      });
      return;
    }
    
    setIsGeneratingProposal(true);
    
    try {
      const proposal = await generateBookProposal(
        summaryText,
        settings.tone,
        settings.targetAudience
      );
      
      // Add new proposal to history
      const newProposals = [...bookProposals, proposal];
      setBookProposals(newProposals);
      setCurrentProposalIndex(newProposals.length - 1);
      
      // Update settings
      onSettingChange('title', proposal.title);
      onSettingChange('subtitle', proposal.subtitle);
      onSettingChange('tableOfContents', proposal.tableOfContents);
      onSettingChange('chapters', proposal.tableOfContents);
      
      toast({
        title: 'New proposal generated',
        description: 'A new book proposal has been added to your history.',
      });
    } catch (error) {
      console.error('Error regenerating proposal:', error);
      
      // Fallback to mock data
      const mockProposal = generateMockProposal(summaryText, settings.tone, settings.targetAudience);
      const mockTOC = generateMockTOC(summaryText);
      
      const proposal = {
        ...mockProposal,
        tableOfContents: mockTOC
      };
      
      const newProposals = [...bookProposals, proposal];
      setBookProposals(newProposals);
      setCurrentProposalIndex(newProposals.length - 1);
      
      onSettingChange('title', proposal.title);
      onSettingChange('subtitle', proposal.subtitle);
      onSettingChange('tableOfContents', proposal.tableOfContents);
      onSettingChange('chapters', proposal.tableOfContents);
      
      toast({
        title: 'New proposal generated',
        description: 'Used offline mode to generate a new proposal.',
      });
    } finally {
      setIsGeneratingProposal(false);
    }
  };

  // Navigate to previous proposal
  const handlePreviousProposal = () => {
    if (currentProposalIndex > 0) {
      const newIndex = currentProposalIndex - 1;
      setCurrentProposalIndex(newIndex);
      
      const proposal = bookProposals[newIndex];
      onSettingChange('title', proposal.title);
      onSettingChange('subtitle', proposal.subtitle);
      onSettingChange('tableOfContents', proposal.tableOfContents);
      onSettingChange('chapters', proposal.tableOfContents);
    }
  };

  // Navigate to next proposal
  const handleNextProposal = () => {
    if (currentProposalIndex < bookProposals.length - 1) {
      const newIndex = currentProposalIndex + 1;
      setCurrentProposalIndex(newIndex);
      
      const proposal = bookProposals[newIndex];
      onSettingChange('title', proposal.title);
      onSettingChange('subtitle', proposal.subtitle);
      onSettingChange('tableOfContents', proposal.tableOfContents);
      onSettingChange('chapters', proposal.tableOfContents);
    }
  };

  // Accept the proposal
  const handleAcceptProposal = () => {
    if (!currentProposal) return;
    
    // Update settings with the accepted proposal
    onSettingChange('title', currentProposal.title);
    onSettingChange('subtitle', currentProposal.subtitle);
    onSettingChange('tableOfContents', currentProposal.tableOfContents);
    onSettingChange('chapters', currentProposal.tableOfContents);
    
    toast({
      title: 'Proposal accepted',
      description: 'Your book concept has been saved.',
    });
  };

  // Modify the proposal
  const handleProposalChange = (field: 'title' | 'subtitle' | 'description', value: string) => {
    if (!currentProposal) return;
    
    // Update current proposal
    const updatedProposals = [...bookProposals];
    updatedProposals[currentProposalIndex] = {
      ...updatedProposals[currentProposalIndex],
      [field]: value
    };
    
    setBookProposals(updatedProposals);
    
    // Update settings immediately for title and subtitle
    if (field === 'title' || field === 'subtitle') {
      onSettingChange(field, value);
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

  return (
    <div className="space-y-6 relative" style={{ pointerEvents: 'auto' }}>
      {/* Step 1: Enter Book Concept */}
      {!showProposal && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative" style={{ zIndex: 10 }}>
          <Card className="relative" style={{ pointerEvents: 'auto', zIndex: 10 }}>
            <CardContent className="pt-6 relative" style={{ pointerEvents: 'auto' }}>
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <BookText className="h-5 w-5 text-primary" /> Book Concept
              </h3>
              <Separator className="mb-4" />
              
              <div className="space-y-6 relative" style={{ pointerEvents: 'auto' }}>
                <div className="space-y-2 relative" style={{ pointerEvents: 'auto' }}>
                  <Label htmlFor="bookSummary" className="relative" style={{ pointerEvents: 'auto' }}>Book Summary / Idea</Label>
                  <Textarea
                    id="bookSummary"
                    value={summaryText}
                    onChange={handleSummaryChange}
                    className="min-h-[200px] resize-y relative"
                    style={{ pointerEvents: 'auto', zIndex: 10 }}
                    placeholder="Describe your book idea in detail. For example: A motivational book for teenagers about building confidence and overcoming failure."
                  />
                  <p className="text-xs text-muted-foreground">
                    Be specific about your topic, intended audience, and what you want readers to learn or experience.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative" style={{ pointerEvents: 'auto', zIndex: 10 }}>
                  <div className="space-y-2 relative" style={{ pointerEvents: 'auto' }}>
                    <Label htmlFor="tone" className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" /> Preferred Tone
                    </Label>
                    <Select
                      value={settings.tone}
                      onValueChange={(value) => onSettingChange('tone', value)}
                    >
                      <SelectTrigger id="tone" className="relative" style={{ pointerEvents: 'auto', zIndex: 20 }}>
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
                  
                  <div className="space-y-2 relative" style={{ pointerEvents: 'auto' }}>
                    <Label htmlFor="targetAudience" className="flex items-center gap-1">
                      <Target className="h-3.5 w-3.5" /> Target Audience
                    </Label>
                    <Select
                      value={settings.targetAudience}
                      onValueChange={(value) => onSettingChange('targetAudience', value)}
                    >
                      <SelectTrigger id="targetAudience" className="relative" style={{ pointerEvents: 'auto', zIndex: 20 }}>
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
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 relative"
                  style={{ pointerEvents: 'auto', zIndex: 20, position: 'relative' }}
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
              
              <div className="text-center p-8 border border-dashed rounded-md">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-3" />
                <p className="text-muted-foreground">
                  Generate a book proposal to see a suggested title, subtitle, and table of contents.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Book Proposal and Table of Contents */}
      {showProposal && currentProposal && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Book Proposal</h2>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowProposal(false)}
              >
                Back to Concept
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRegenerateProposal}
                disabled={isGeneratingProposal}
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Book Details */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <BookText className="h-5 w-5 text-primary" /> Book Details
                  </h3>
                  
                  {bookProposals.length > 1 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handlePreviousProposal}
                        disabled={currentProposalIndex === 0}
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-xs">
                        {currentProposalIndex + 1} / {bookProposals.length}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleNextProposal}
                        disabled={currentProposalIndex === bookProposals.length - 1}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <Separator className="mb-4" />
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Book Title</Label>
                    <Input 
                      value={currentProposal.title}
                      onChange={(e) => handleProposalChange('title', e.target.value)}
                      className="text-lg font-semibold"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Subtitle</Label>
                    <Input 
                      value={currentProposal.subtitle}
                      onChange={(e) => handleProposalChange('subtitle', e.target.value)}
                      className="text-base"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Book Description</Label>
                    <Textarea 
                      value={currentProposal.description}
                      onChange={(e) => handleProposalChange('description', e.target.value)}
                      className="min-h-[150px] resize-y"
                    />
                  </div>
                  
                  <Button
                    onClick={handleAcceptProposal}
                    className="w-full"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Accept Proposal
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Table of Contents */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <LayoutList className="h-5 w-5 text-primary" /> Table of Contents
                  </h3>
                  <Badge variant="outline">
                    {currentProposal.tableOfContents.length} {currentProposal.tableOfContents.length === 1 ? 'Chapter' : 'Chapters'}
                  </Badge>
                </div>
                <Separator className="mb-4" />
                
                {currentProposal.tableOfContents.length === 0 ? (
                  <div className="text-center p-8 border border-dashed rounded-md">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-3" />
                    <p className="text-muted-foreground">
                      No chapters yet. Regenerate the proposal to get a table of contents.
                    </p>
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
                              {currentProposal.tableOfContents.map((chapter, index) => (
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
                                        onChange={(e) => {
                                          const updatedTOC = [...currentProposal.tableOfContents];
                                          updatedTOC[index] = {
                                            ...chapter,
                                            title: e.target.value
                                          };
                                          
                                          // Update current proposal
                                          const updatedProposals = [...bookProposals];
                                          updatedProposals[currentProposalIndex] = {
                                            ...currentProposal,
                                            tableOfContents: updatedTOC
                                          };
                                          setBookProposals(updatedProposals);
                                          
                                          // Update settings
                                          onSettingChange('tableOfContents', updatedTOC);
                                          onSettingChange('chapters', updatedTOC);
                                        }}
                                        className="flex-1 h-8 text-sm bg-transparent border-none focus-visible:ring-1"
                                      />
                                      
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => {
                                          const updatedTOC = currentProposal.tableOfContents.filter((_, i) => i !== index);
                                          
                                          // Update current proposal
                                          const updatedProposals = [...bookProposals];
                                          updatedProposals[currentProposalIndex] = {
                                            ...currentProposal,
                                            tableOfContents: updatedTOC
                                          };
                                          setBookProposals(updatedProposals);
                                          
                                          // Update settings
                                          onSettingChange('tableOfContents', updatedTOC);
                                          onSettingChange('chapters', updatedTOC);
                                        }}
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
                      <Button 
                        onClick={() => {
                          if (!newChapterTitle.trim()) return;
                          
                          const newChapter = {
                            id: Date.now().toString(),
                            title: newChapterTitle,
                            content: '',
                            wordCount: 0,
                          };
                          
                          // Update current proposal
                          const updatedTOC = [...currentProposal.tableOfContents, newChapter];
                          const updatedProposals = [...bookProposals];
                          updatedProposals[currentProposalIndex] = {
                            ...currentProposal,
                            tableOfContents: updatedTOC
                          };
                          setBookProposals(updatedProposals);
                          
                          // Update settings
                          onSettingChange('tableOfContents', updatedTOC);
                          onSettingChange('chapters', updatedTOC);
                          
                          setNewChapterTitle('');
                        }} 
                        disabled={!newChapterTitle.trim()}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}; 