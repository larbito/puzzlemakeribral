import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
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
  RefreshCw,
  Wand,
  LightbulbIcon,
  PencilLine
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface BookConceptStepProps {
  settings: BookGeneratorSettings;
  onSettingChange: (key: keyof BookGeneratorSettings, value: any) => void;
}

export const BookConceptStep: React.FC<BookConceptStepProps> = ({
  settings,
  onSettingChange,
}) => {
  const [generating, setGenerating] = useState(false);
  const [bookIdea, setBookIdea] = useState(settings.bookSummary);
  const [generatedConcept, setGeneratedConcept] = useState('');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editText, setEditText] = useState('');
  const { toast } = useToast();

  // Generate a book concept based on the user's idea
  const generateBookConcept = async () => {
    if (!bookIdea.trim()) {
      toast({
        title: "Book idea required",
        description: "Please describe your book idea first.",
      });
      return;
    }

    try {
      setGenerating(true);
      
      // Simulate API call for now - replace with actual API call
      setTimeout(() => {
        // Example generated concept format
        const concept = `# ${bookIdea.includes('crypto') ? 'Crypto Revolution' : 'The Ultimate Guide'}: ${bookIdea.split(' ').slice(0, 3).join(' ')}...

## Book Subtitle
${bookIdea.includes('crypto') ? 'Understanding Bitcoin and AI in the New Digital Economy' : 'A Comprehensive Approach to ' + bookIdea.split(' ').slice(0, 2).join(' ')}

## Book Description
This comprehensive guide explores ${bookIdea} in detail, providing readers with both theoretical understanding and practical applications. The book is designed for ${settings.targetAudience.toLowerCase()} who want to learn about this topic in a ${settings.tone.toLowerCase()} manner.

## Book Concept
The book will take readers on a journey through the world of ${bookIdea.split(' ').slice(0, 3).join(' ')}, starting with fundamental concepts and progressively exploring more advanced topics. Each chapter builds upon the previous, ensuring a logical learning progression.

## Table of Contents
1. Introduction to ${bookIdea.split(' ').slice(0, 2).join(' ')}
2. The History and Evolution of ${bookIdea.split(' ').slice(0, 1).join(' ')}
3. Core Principles and Concepts
4. ${bookIdea.includes('crypto') ? 'Blockchain Technology Fundamentals' : 'Essential Techniques and Methods'}
5. ${bookIdea.includes('crypto') ? 'Understanding Cryptocurrencies' : 'Practical Applications'}
6. ${bookIdea.includes('crypto') ? 'The Role of AI in Digital Finance' : 'Advanced Strategies'}
7. ${bookIdea.includes('crypto') ? 'Investment Strategies and Risk Management' : 'Troubleshooting and Problem Solving'}
8. Future Trends and Developments
9. Case Studies and Real-World Examples
10. Conclusion: The Future of ${bookIdea.split(' ').slice(0, 2).join(' ')}`;

        setGeneratedConcept(concept);
        
        // Also update the settings with the generated concept data
        // In a real implementation, you would parse the response and update these fields separately
        if (bookIdea.includes('crypto')) {
          onSettingChange('title', 'Crypto Revolution: Understanding Bitcoin and AI');
          onSettingChange('subtitle', 'Exploring the Intersection of Cryptocurrency and Artificial Intelligence');
          onSettingChange('tableOfContents', [
            { id: '1', title: 'Introduction to Cryptocurrency', content: '', wordCount: 0 },
            { id: '2', title: 'The History and Evolution of Bitcoin', content: '', wordCount: 0 },
            { id: '3', title: 'Core Principles and Concepts', content: '', wordCount: 0 },
            { id: '4', title: 'Blockchain Technology Fundamentals', content: '', wordCount: 0 },
            { id: '5', title: 'Understanding Cryptocurrencies', content: '', wordCount: 0 },
            { id: '6', title: 'The Role of AI in Digital Finance', content: '', wordCount: 0 },
            { id: '7', title: 'Investment Strategies and Risk Management', content: '', wordCount: 0 },
            { id: '8', title: 'Future Trends and Developments', content: '', wordCount: 0 },
            { id: '9', title: 'Case Studies and Real-World Examples', content: '', wordCount: 0 },
            { id: '10', title: 'Conclusion: The Future of Crypto', content: '', wordCount: 0 },
          ]);
        } else {
          onSettingChange('title', `The Ultimate Guide to ${bookIdea.split(' ').slice(0, 3).join(' ')}`);
          onSettingChange('subtitle', `A Comprehensive Approach to ${bookIdea.split(' ').slice(0, 2).join(' ')}`);
          // Generate a generic table of contents based on the book idea
          onSettingChange('tableOfContents', [
            { id: '1', title: `Introduction to ${bookIdea.split(' ').slice(0, 2).join(' ')}`, content: '', wordCount: 0 },
            { id: '2', title: `The Fundamentals of ${bookIdea.split(' ').slice(0, 1).join(' ')}`, content: '', wordCount: 0 },
            { id: '3', title: 'Core Principles and Concepts', content: '', wordCount: 0 },
            { id: '4', title: 'Essential Techniques and Methods', content: '', wordCount: 0 },
            { id: '5', title: 'Practical Applications', content: '', wordCount: 0 },
            { id: '6', title: 'Advanced Strategies', content: '', wordCount: 0 },
            { id: '7', title: 'Troubleshooting and Problem Solving', content: '', wordCount: 0 },
            { id: '8', title: 'Future Trends and Developments', content: '', wordCount: 0 },
            { id: '9', title: 'Case Studies and Real-World Examples', content: '', wordCount: 0 },
            { id: '10', title: `Conclusion: Mastering ${bookIdea.split(' ').slice(0, 2).join(' ')}`, content: '', wordCount: 0 },
          ]);
        }
        
        setGenerating(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error generating book concept:', error);
      setGenerating(false);
      toast({
        title: "Generation failed",
        description: "Failed to generate book concept. Please try again.",
      });
    }
  };

  // Handle enhancing the book concept (improving it while keeping the same idea)
  const enhanceBookConcept = async () => {
    try {
      setGenerating(true);
      
      // Simulate API call - replace with actual API call
      setTimeout(() => {
        // Just make some small improvements to the existing concept
        const enhancedConcept = generatedConcept.replace(
          'This comprehensive guide',
          'This authoritative and engaging guide'
        ).replace(
          'Table of Contents',
          'Improved Table of Contents'
        );
        
        setGeneratedConcept(enhancedConcept);
        setGenerating(false);
        
        toast({
          title: "Concept enhanced",
          description: "Your book concept has been enhanced.",
        });
      }, 1500);
      
    } catch (error) {
      console.error('Error enhancing book concept:', error);
      setGenerating(false);
      toast({
        title: "Enhancement failed",
        description: "Failed to enhance book concept. Please try again.",
      });
    }
  };

  // Handle editing the concept manually
  const openEditDialog = () => {
    setEditText(generatedConcept);
    setShowEditDialog(true);
  };

  const saveEditedConcept = () => {
    setGeneratedConcept(editText);
    setShowEditDialog(false);
    
    toast({
      title: "Changes saved",
      description: "Your edits to the book concept have been saved.",
    });
  };

  // Save the book idea to the settings
  const saveBookIdea = () => {
    onSettingChange('bookSummary', bookIdea);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold">Book Concept</h2>
          <p className="text-muted-foreground">Describe your book idea and let AI generate a concept</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <LightbulbIcon className="h-5 w-5 text-primary" /> Your Book Idea
            </h3>
            <Separator className="mb-6" />
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bookIdea">Describe your book idea in detail</Label>
                <Textarea
                  id="bookIdea"
                  placeholder="E.g., I want to create a book about cryptocurrency and AI that explains how these technologies work together..."
                  className="min-h-[150px] resize-none"
                  value={bookIdea}
                  onChange={(e) => setBookIdea(e.target.value)}
                  onBlur={saveBookIdea}
                />
                <p className="text-xs text-muted-foreground">
                  The more details you provide, the better the AI can understand your vision
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tone">Tone</Label>
                  <Select
                    value={settings.tone}
                    onValueChange={(value) => onSettingChange('tone', value)}
                  >
                    <SelectTrigger id="tone">
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Serious">Serious</SelectItem>
                      <SelectItem value="Educational">Educational</SelectItem>
                      <SelectItem value="Fun">Fun</SelectItem>
                      <SelectItem value="Storytelling">Storytelling</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="targetAudience">Target Audience</Label>
                  <Select
                    value={settings.targetAudience}
                    onValueChange={(value) => onSettingChange('targetAudience', value)}
                  >
                    <SelectTrigger id="targetAudience">
                      <SelectValue placeholder="Select audience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Kids">Kids</SelectItem>
                      <SelectItem value="Teens">Teens</SelectItem>
                      <SelectItem value="Adults">Adults</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button 
                onClick={generateBookConcept} 
                disabled={generating || !bookIdea.trim()}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Concept...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Book Concept
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" /> Generated Book Concept
            </h3>
            <Separator className="mb-6" />
            
            {!generatedConcept ? (
              <div className="text-center p-6 border border-dashed rounded-md">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-3" />
                <p className="text-muted-foreground mb-1">
                  No concept generated yet
                </p>
                <p className="text-xs text-muted-foreground">
                  Describe your book idea and click "Generate Book Concept"
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                  <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                    {generatedConcept}
                  </div>
                </ScrollArea>
                
                <div className="flex gap-2 justify-end">
                  <Button 
                    variant="outline" 
                    onClick={openEditDialog}
                    disabled={generating}
                  >
                    <PencilLine className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={enhanceBookConcept}
                    disabled={generating}
                  >
                    <Wand className="h-4 w-4 mr-2" />
                    Enhance
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={generateBookConcept}
                    disabled={generating}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate
                  </Button>
                </div>
                
                <div className="flex items-center gap-1 text-sm text-green-600 mt-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Book concept generated</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Edit Book Concept</DialogTitle>
            <DialogDescription>
              Make changes to your generated book concept.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="min-h-[60vh] font-mono text-sm resize-none"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveEditedConcept}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 