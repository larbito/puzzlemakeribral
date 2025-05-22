import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { BookGeneratorSettings } from '../AIBookGenerator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, 
  Loader2, 
  BookCopy,
  ScrollText,
  User,
  Copyright,
  Heart,
  MessageSquareText,
  BookText,
  BookOpen,
  LibrarySquare
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';

// Mock function for AI-generated front/back matter - will replace with real API call
const generateFrontMatter = async (
  type: 'titlePage' | 'copyrightPage' | 'dedicationPage' | 'authorBio' | 'closingThoughts' | 'glossaryContent',
  settings: BookGeneratorSettings
): Promise<string> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Generate mock content based on type
  switch (type) {
    case 'titlePage':
      return `
# ${settings.title}
## ${settings.subtitle}

By [Your Name]
      `;
    
    case 'copyrightPage':
      const currentYear = new Date().getFullYear();
      return `
Copyright © ${currentYear} [Your Name]

All rights reserved. No part of this publication may be reproduced, distributed, or transmitted in any form or by any means, including photocopying, recording, or other electronic or mechanical methods, without the prior written permission of the publisher, except in the case of brief quotations embodied in critical reviews and certain other noncommercial uses permitted by copyright law.

ISBN: [Your ISBN Number]

First Edition

Published by [Your Publishing Name]
      `;
    
    case 'dedicationPage':
      return `
To my family, friends, and all those who have supported me throughout this journey.

Special thanks to [Names], who believed in this project from the beginning.
      `;
    
    case 'authorBio':
      return `
# About the Author

[Your Name] is a passionate writer and expert in [field/topic]. With [X] years of experience in [relevant experience], [he/she/they] has dedicated [his/her/their] career to helping others understand and master [topic of book].

[Your Name] holds [degrees/certifications] from [institutions] and has been featured in [publications/media]. When not writing, [he/she/they] enjoys [hobbies/interests] and resides in [location] with [family members/pets].

Connect with the author:
- Website: [your website]
- Email: [your email]
- Social media: [handles]
      `;
    
    case 'closingThoughts':
      return `
# Final Thoughts

Thank you for reading "${settings.title}". I hope the ideas and concepts presented in this book have provided you with valuable insights and practical knowledge that you can apply in your life.

I'd love to hear your thoughts about this book. Please consider leaving a review or reaching out directly with your feedback.

Until next time,

[Your Name]
      `;
    
    case 'glossaryContent':
      return `
# Glossary

**Term 1**: Definition of the first important term from the book.

**Term 2**: Definition of the second important term from the book.

**Term 3**: Definition of the third important term from the book.

**Term 4**: Definition of the fourth important term from the book.

**Term 5**: Definition of the fifth important term from the book.
      `;
    
    default:
      return '';
  }
};

interface FrontMatterStepProps {
  settings: BookGeneratorSettings;
  onSettingChange: (key: keyof BookGeneratorSettings, value: any) => void;
}

export const FrontMatterStep: React.FC<FrontMatterStepProps> = ({
  settings,
  onSettingChange,
}) => {
  const [activeTab, setActiveTab] = useState<string>('titlePage');
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerate = async (type: keyof BookGeneratorSettings) => {
    if (!isValidFrontMatterType(type)) return;
    
    setIsGenerating(type);
    
    try {
      const content = await generateFrontMatter(
        type as 'titlePage' | 'copyrightPage' | 'dedicationPage' | 'authorBio' | 'closingThoughts' | 'glossaryContent',
        settings
      );
      
      onSettingChange(type, content);
      
      toast({
        title: 'Content generated',
        description: `Generated content for ${getFrontMatterLabel(type)}`,
      });
    } catch (error) {
      console.error(`Error generating ${type}:`, error);
      toast({
        title: 'Error generating content',
        description: 'Something went wrong. Please try again.',
      });
    } finally {
      setIsGenerating(null);
    }
  };

  const isValidFrontMatterType = (
    type: string
  ): type is 'titlePage' | 'copyrightPage' | 'dedicationPage' | 'authorBio' | 'closingThoughts' | 'glossaryContent' => {
    return [
      'titlePage',
      'copyrightPage',
      'dedicationPage',
      'authorBio',
      'closingThoughts',
      'glossaryContent'
    ].includes(type);
  };

  const getFrontMatterLabel = (type: string): string => {
    const labels: Record<string, string> = {
      titlePage: 'Title Page',
      copyrightPage: 'Copyright Page',
      dedicationPage: 'Dedication Page',
      authorBio: 'Author Bio',
      closingThoughts: 'Closing Thoughts',
      glossaryContent: 'Glossary',
    };
    
    return labels[type] || type;
  };

  const getFrontMatterIcon = (type: string) => {
    switch (type) {
      case 'titlePage':
        return <BookText className="h-4 w-4" />;
      case 'copyrightPage':
        return <Copyright className="h-4 w-4" />;
      case 'dedicationPage':
        return <Heart className="h-4 w-4" />;
      case 'authorBio':
        return <User className="h-4 w-4" />;
      case 'closingThoughts':
        return <MessageSquareText className="h-4 w-4" />;
      case 'glossaryContent':
        return <LibrarySquare className="h-4 w-4" />;
      default:
        return <ScrollText className="h-4 w-4" />;
    }
  };

  const handleGenerateAll = async () => {
    const frontMatterTypes = [
      'titlePage',
      'copyrightPage',
      'dedicationPage',
      'authorBio',
      'closingThoughts',
    ];
    
    if (settings.includeGlossary) {
      frontMatterTypes.push('glossaryContent');
    }
    
    for (const type of frontMatterTypes) {
      if (isValidFrontMatterType(type)) {
        await handleGenerate(type);
      }
    }
    
    toast({
      title: 'All content generated',
      description: 'Generated all front and back matter content',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold">Front & Back Matter</h2>
          <p className="text-muted-foreground">Create title page, copyright info, and other book elements</p>
        </div>
        
        <Button
          onClick={handleGenerateAll}
          disabled={isGenerating !== null}
          className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate All Content
            </>
          )}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <BookCopy className="h-5 w-5 text-primary" /> Book Elements
            </h3>
            <Separator className="mb-4" />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Include Glossary</Label>
                  <p className="text-xs text-muted-foreground">Add a glossary of terms at the end of your book</p>
                </div>
                <Switch
                  checked={settings.includeGlossary}
                  onCheckedChange={(checked) => onSettingChange('includeGlossary', checked)}
                />
              </div>
              
              <Separator className="my-4" />
              
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {[
                    'titlePage',
                    'copyrightPage',
                    'dedicationPage',
                    'authorBio',
                    'closingThoughts',
                    ...(settings.includeGlossary ? ['glossaryContent'] : []),
                  ].map((type) => (
                    <div
                      key={type}
                      className={`p-3 rounded-md cursor-pointer transition-colors ${
                        activeTab === type
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-secondary/50'
                      }`}
                      onClick={() => setActiveTab(type)}
                    >
                      <div className="flex items-center gap-2">
                        {getFrontMatterIcon(type)}
                        <span className="font-medium">{getFrontMatterLabel(type)}</span>
                      </div>
                      <div className="text-xs mt-1 opacity-80">
                        {!!settings[type as keyof BookGeneratorSettings]
                          ? 'Content added'
                          : 'No content yet'}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            {activeTab && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    {getFrontMatterIcon(activeTab)}
                    {getFrontMatterLabel(activeTab)}
                  </h3>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerate(activeTab as keyof BookGeneratorSettings)}
                    disabled={isGenerating === activeTab}
                  >
                    {isGenerating === activeTab ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate
                      </>
                    )}
                  </Button>
                </div>
                <Separator className="mb-4" />
                
                <Tabs defaultValue="edit" className="w-full">
                  <TabsList className="w-full grid grid-cols-2 mb-4">
                    <TabsTrigger value="edit">Edit</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="edit">
                    <Textarea
                      value={settings[activeTab as keyof BookGeneratorSettings] as string || ''}
                      onChange={(e) => onSettingChange(activeTab as keyof BookGeneratorSettings, e.target.value)}
                      placeholder={`Enter content for ${getFrontMatterLabel(activeTab)}...`}
                      className="min-h-[400px] resize-y font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      You can use markdown formatting (# for headings, ** for bold, * for italic, etc.)
                    </p>
                  </TabsContent>
                  
                  <TabsContent value="preview">
                    <div className="border rounded-md p-6 min-h-[400px] bg-white">
                      {settings[activeTab as keyof BookGeneratorSettings] ? (
                        <div
                          className="prose max-w-none"
                          style={{
                            fontFamily: settings.fontFamily,
                            fontSize: `${settings.fontSize}pt`,
                            lineHeight: settings.lineSpacing,
                          }}
                          dangerouslySetInnerHTML={{ 
                            __html: (settings[activeTab as keyof BookGeneratorSettings] as string)
                              .replace(/\n\n/g, '</p><p>')
                              .replace(/\n/g, '<br />')
                              .replace(/^(.*)$/, '<p>$1</p>')
                              .replace(/<p><\/p>/g, '')
                              .replace(/## (.*?)$/gm, '<h2>$1</h2>')
                              .replace(/# (.*?)$/gm, '<h1>$1</h1>')
                              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              .replace(/\*(.*?)\*/g, '<em>$1</em>')
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <BookOpen className="h-12 w-12 text-muted-foreground opacity-30 mb-4" />
                          <p className="text-muted-foreground">
                            No content yet. Generate or enter content to see a preview.
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 