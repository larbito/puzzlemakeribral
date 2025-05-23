import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookContent, Chapter } from '../KDPBookFormatter';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { 
  Wand2, 
  Sparkles, 
  Loader2, 
  CheckCircle, 
  BookOpen,
  AlertCircle,
  ArrowDownUp
} from 'lucide-react';

interface AIEnhanceStepProps {
  bookContent: BookContent;
  onContentChange: (content: Partial<BookContent>) => void;
}

type EnhancementType = 'improve' | 'simplify' | 'formal' | 'creative' | 'grammar';
type EnhancementStatus = 'idle' | 'processing' | 'complete' | 'error';

export const AIEnhanceStep: React.FC<AIEnhanceStepProps> = ({
  bookContent,
  onContentChange
}) => {
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [enhancementType, setEnhancementType] = useState<EnhancementType>('improve');
  const [enhancementStatus, setEnhancementStatus] = useState<EnhancementStatus>('idle');
  const [originalText, setOriginalText] = useState('');
  const [enhancedText, setEnhancedText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isApplied, setIsApplied] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // API URL from environment
  const API_URL = import.meta.env.VITE_API_URL || 'https://puzzlemakeribral-production.up.railway.app';

  // Select chapter
  const handleChapterSelect = (chapterId: string) => {
    if (enhancementStatus === 'processing') {
      toast({
        title: 'Enhancement in progress',
        description: 'Please wait for the current enhancement to complete before selecting another chapter.'
      });
      return;
    }
    
    setSelectedChapterId(chapterId);
    setEnhancementStatus('idle');
    setEnhancedText('');
    setErrorMessage('');
    setIsApplied(false);
    
    // Get chapter content
    const chapter = bookContent.chapters.find(c => c.id === chapterId);
    if (chapter) {
      setOriginalText(chapter.content);
    }
  };

  // Get AI enhancement
  const enhanceText = async () => {
    if (!selectedChapterId || !originalText.trim()) {
      toast({
        title: 'No text to enhance',
        description: 'Please select a chapter with content to enhance.'
      });
      return;
    }

    setEnhancementStatus('processing');
    setErrorMessage('');
    
    try {
      // Create prompt based on enhancement type
      let prompt = '';
      
      switch (enhancementType) {
        case 'improve':
          prompt = `Improve the following text to make it more engaging, clear, and professional while maintaining the original meaning and style:\n\n${originalText}`;
          break;
        case 'simplify':
          prompt = `Simplify the following text to make it easier to understand, using simpler vocabulary and shorter sentences while preserving the meaning:\n\n${originalText}`;
          break;
        case 'formal':
          prompt = `Rewrite the following text in a more formal, academic style with sophisticated vocabulary while maintaining the original meaning:\n\n${originalText}`;
          break;
        case 'creative':
          prompt = `Rewrite the following text in a more creative, descriptive, and evocative way while maintaining the original meaning and narrative flow:\n\n${originalText}`;
          break;
        case 'grammar':
          prompt = `Correct any grammar, spelling, punctuation, and stylistic issues in the following text while preserving the original meaning and voice:\n\n${originalText}`;
          break;
      }
      
      // Simulate API call (in a real implementation, replace with actual OpenAI API call)
      // For demonstration purposes, we'll use a setTimeout
      // In production, you would use:
      // const response = await fetch(`${API_URL}/api/openai/enhance-text`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ prompt, enhancementType }),
      // });
      // const data = await response.json();
      // const enhancedContent = data.enhancedText;
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo, we'll just modify the text based on the enhancement type
      let enhancedContent = '';
      
      if (enhancementType === 'improve') {
        enhancedContent = originalText
          .replace(/\b(good|nice|bad)\b/gi, match => {
            if (match.toLowerCase() === 'good') return 'excellent';
            if (match.toLowerCase() === 'nice') return 'wonderful';
            if (match.toLowerCase() === 'bad') return 'terrible';
            return match;
          })
          .replace(/\./g, '. ') // Add space after periods
          .trim();
      } else if (enhancementType === 'simplify') {
        enhancedContent = originalText
          .replace(/\b(\w{12,})\b/g, 'simpler word') // Replace long words
          .split(/\. /).map(s => s.trim()).join('.\n\n') // Break into shorter paragraphs
          .trim();
      } else if (enhancementType === 'formal') {
        enhancedContent = originalText
          .replace(/\b(use|make|do)\b/gi, match => {
            if (match.toLowerCase() === 'use') return 'utilize';
            if (match.toLowerCase() === 'make') return 'construct';
            if (match.toLowerCase() === 'do') return 'perform';
            return match;
          })
          .trim();
      } else if (enhancementType === 'creative') {
        enhancedContent = originalText
          .replace(/\b(saw|looked|heard)\b/gi, match => {
            if (match.toLowerCase() === 'saw') return 'glimpsed';
            if (match.toLowerCase() === 'looked') return 'gazed intently';
            if (match.toLowerCase() === 'heard') return 'perceived the melodious sound of';
            return match;
          })
          .trim();
      } else if (enhancementType === 'grammar') {
        enhancedContent = originalText
          .replace(/\s+([,.!?])/g, '$1') // Fix spacing before punctuation
          .replace(/([,.!?])([a-zA-Z])/g, '$1 $2') // Add space after punctuation
          .trim();
      }
      
      setEnhancedText(enhancedContent);
      setEnhancementStatus('complete');
      
      toast({
        title: 'Enhancement complete',
        description: `Your text has been enhanced using the "${enhancementType}" style.`
      });
    } catch (error) {
      console.error('Error enhancing text:', error);
      setEnhancementStatus('error');
      setErrorMessage('There was a problem connecting to the AI service. Please try again.');
      
      toast({
        title: 'Enhancement failed',
        description: 'There was a problem enhancing your text. Please try again.',
      });
    }
  };

  // Apply enhanced text to chapter
  const applyEnhancement = () => {
    if (!selectedChapterId || !enhancedText) return;
    
    // Find the chapter and update its content
    const updatedChapters = bookContent.chapters.map(chapter => 
      chapter.id === selectedChapterId 
        ? { ...chapter, content: enhancedText } 
        : chapter
    );
    
    onContentChange({ chapters: updatedChapters });
    setIsApplied(true);
    
    toast({
      title: 'Enhancement applied',
      description: 'The enhanced text has been applied to your chapter.'
    });
  };

  // Get enhancement type label
  const getEnhancementLabel = (type: EnhancementType): string => {
    switch (type) {
      case 'improve': return 'General Improvement';
      case 'simplify': return 'Simplify Text';
      case 'formal': return 'Formal Style';
      case 'creative': return 'Creative Enhancement';
      case 'grammar': return 'Grammar Correction';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">AI Text Enhancement</h2>
        <p className="text-muted-foreground">
          Use AI to enhance your book's content with different styles and improvements
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chapter Selection */}
        <Card className="lg:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium">Select Chapter</h3>
            </div>
            <Separator className="mb-4" />
            
            <ScrollArea className="h-[300px] pr-3">
              <div className="space-y-2">
                {bookContent.chapters.map(chapter => (
                  <div
                    key={chapter.id}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-md cursor-pointer",
                      selectedChapterId === chapter.id 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-primary/10"
                    )}
                    onClick={() => handleChapterSelect(chapter.id)}
                  >
                    <BookOpen className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="font-medium truncate">{chapter.title}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <div className="mt-6 space-y-3">
              <Label htmlFor="enhancementType">Enhancement Type</Label>
              <Select 
                value={enhancementType} 
                onValueChange={(value) => setEnhancementType(value as EnhancementType)}
                disabled={enhancementStatus === 'processing'}
              >
                <SelectTrigger id="enhancementType">
                  <SelectValue placeholder="Select enhancement type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="improve">General Improvement</SelectItem>
                  <SelectItem value="simplify">Simplify Text</SelectItem>
                  <SelectItem value="formal">Formal Style</SelectItem>
                  <SelectItem value="creative">Creative Enhancement</SelectItem>
                  <SelectItem value="grammar">Grammar Correction</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                className="w-full mt-2 flex items-center gap-2"
                onClick={enhanceText}
                disabled={!selectedChapterId || enhancementStatus === 'processing' || !originalText.trim()}
              >
                {enhancementStatus === 'processing' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Enhancing...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    <span>Enhance with AI</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Text Comparison */}
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <ArrowDownUp className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium">
                {enhancementStatus === 'complete' 
                  ? `Enhanced with ${getEnhancementLabel(enhancementType)}`
                  : 'Original vs Enhanced'}
              </h3>
            </div>
            <Separator className="mb-4" />
            
            {selectedChapterId ? (
              <div className="space-y-4">
                {/* Status Messages */}
                {enhancementStatus === 'error' && (
                  <div className="flex items-center gap-2 text-destructive mb-4 p-3 rounded-md border border-destructive/50 bg-destructive/10">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm">{errorMessage || 'An error occurred during enhancement.'}</p>
                  </div>
                )}
                
                {enhancementStatus === 'complete' && isApplied && (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-4 p-3 rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950">
                    <CheckCircle className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm">Enhancement successfully applied to chapter!</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Original Text */}
                  <div className="space-y-2">
                    <Label>Original Text</Label>
                    <div className="relative">
                      <ScrollArea className="h-[400px] w-full border rounded-md p-3">
                        <div className="whitespace-pre-wrap">
                          {originalText.split('\n\n').map((paragraph, idx) => (
                            <p key={idx} className="mb-4">{paragraph}</p>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                  
                  {/* Enhanced Text */}
                  <div className="space-y-2">
                    <Label>Enhanced Text</Label>
                    <div className="relative">
                      {enhancementStatus === 'processing' ? (
                        <div className="h-[400px] border rounded-md flex items-center justify-center">
                          <div className="flex flex-col items-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                            <p className="text-muted-foreground">Enhancing your text with AI...</p>
                          </div>
                        </div>
                      ) : enhancementStatus === 'complete' ? (
                        <div className="relative">
                          <ScrollArea className="h-[400px] w-full border rounded-md p-3">
                            <div className="whitespace-pre-wrap">
                              {enhancedText.split('\n\n').map((paragraph, idx) => (
                                <p key={idx} className="mb-4">{paragraph}</p>
                              ))}
                            </div>
                          </ScrollArea>
                          
                          <Button
                            className="absolute bottom-3 right-3 flex items-center gap-2"
                            onClick={applyEnhancement}
                            disabled={isApplied}
                          >
                            <Sparkles className="h-4 w-4" />
                            {isApplied ? 'Applied' : 'Apply Changes'}
                          </Button>
                        </div>
                      ) : (
                        <div className="h-[400px] border rounded-md flex items-center justify-center text-muted-foreground">
                          <p>Enhanced text will appear here after processing</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center min-h-[400px] text-muted-foreground">
                <p>Select a chapter from the list to enhance its content with AI</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 