import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { BookGeneratorSettings } from '../AIBookGenerator';
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
  Sparkles, 
  Loader2,
  BookOpen,
  CheckCircle,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { Textarea } from '@/components/ui/textarea';

// Simplified book proposal interface
interface BookProposal {
  title: string;
  subtitle: string;
  description: string;
}

// Generate a mock book proposal based on the input
const generateMockProposal = (
  bookSummary: string,
  tone: string,
  audience: string
): BookProposal => {
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

// Generate a full book proposal with API call or fallback
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
          includeTableOfContents: false // We don't need TOC generation anymore
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Book proposal API response:', data);
      
      if (data.success && data.proposal) {
        return {
          title: data.proposal.title,
          subtitle: data.proposal.subtitle,
          description: data.proposal.description
        };
      }
    } catch (error) {
      console.error('API error, using fallback:', error);
    }
    
    // Fallback mock data if API doesn't return expected format
    return generateMockProposal(bookSummary, tone, audience);
  } catch (error) {
    console.error('Error generating book proposal:', error);
    // Return fallback data on error
    return generateMockProposal(bookSummary, tone, audience);
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
  const [summaryText, setSummaryText] = useState(settings.bookSummary || '');
  const [bookProposals, setBookProposals] = useState<BookProposal[]>([]);
  const [currentProposalIndex, setCurrentProposalIndex] = useState(0);
  const { toast } = useToast();
  const [conceptGenerated, setConceptGenerated] = useState(false);

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
            setConceptGenerated(true);
            
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

  // Update summary text
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
    
    setIsGenerating(true);
    
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
      
      // Save to localStorage for debugging
      try {
        localStorage.setItem('lastGeneratedProposal', JSON.stringify(proposal));
        localStorage.setItem('bookProposals', JSON.stringify(newProposals));
        localStorage.setItem('currentProposalIndex', String(newProposals.length - 1));
      } catch (err) {
        console.error('Error saving to localStorage:', err);
      }
      
      toast({
        title: 'Book concept generated',
        description: 'Your book concept has been created based on your summary.',
      });
      
      // Show the proposal UI
      setConceptGenerated(true);
    } catch (error) {
      console.error('Error generating proposal:', error);
      
      // Even on complete failure, generate something for the user
      const mockProposal = generateMockProposal(summaryText, settings.tone, settings.targetAudience);
      
      const newProposals = [...bookProposals, mockProposal];
      setBookProposals(newProposals);
      setCurrentProposalIndex(newProposals.length - 1);
      
      onSettingChange('title', mockProposal.title);
      onSettingChange('subtitle', mockProposal.subtitle);
      
      setConceptGenerated(true);
      
      toast({
        title: 'Using offline mode',
        description: 'Generated a book concept using local processing.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 relative" style={{ pointerEvents: 'auto' }}>
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold">Book Concept</h2>
          <p className="text-muted-foreground">Define the overall concept and focus of your book</p>
        </div>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <BookText className="h-5 w-5 text-primary" /> Book Summary
          </h3>
          <Separator className="mb-4" />
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="bookSummary">Summary of Your Book</Label>
              <Textarea
                id="bookSummary"
                value={summaryText}
                onChange={handleSummaryChange}
                placeholder="Enter a detailed summary of what your book will be about. For example: 'A comprehensive guide to sustainable gardening in urban environments, covering container gardening, vertical gardens, and rooftop farming techniques.'"
                className="h-32"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Be specific to get the best results. Include key topics, themes, and purpose.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tone">Tone of the Book</Label>
                <Select
                  value={settings.tone}
                  onValueChange={(value) => onSettingChange('tone', value)}
                >
                  <SelectTrigger id="tone">
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    {toneOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Select
                  value={settings.targetAudience}
                  onValueChange={(value) => onSettingChange('targetAudience', value)}
                >
                  <SelectTrigger id="targetAudience">
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    {audienceOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="pt-4">
              <Button
                onClick={handleGenerateProposal}
                disabled={isGenerating || !summaryText.trim() || !settings.tone || !settings.targetAudience}
                className="w-full md:w-auto"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Book Concept
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {conceptGenerated && currentProposal && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" /> Generated Book Concept
            </h3>
            <Separator className="mb-4" />
            
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-xl mb-1">{currentProposal.title}</h4>
                  <h5 className="text-muted-foreground mb-4">{currentProposal.subtitle}</h5>
                  
                  <ScrollArea className="h-48">
                    <div className="whitespace-pre-wrap">
                      {currentProposal.description}
                    </div>
                  </ScrollArea>
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Concept ready for content generation</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={handleGenerateProposal}
                      disabled={isGenerating}
                    >
                      Generate New Concept
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="text-sm text-muted-foreground px-1">
        <p>
          In the next step, AI will generate complete book content based on your concept and target page count.
        </p>
      </div>
    </div>
  );
}; 