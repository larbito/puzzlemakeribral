import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Sparkles, ListChecks, Plus, Trash2, CloudLightning } from 'lucide-react';
import { WordSearchSettings } from '../WordSearch';
import wordSearchApi from '@/lib/services/wordSearchApi';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface ThemesAndWordsStepProps {
  settings: WordSearchSettings;
  onSettingChange: (key: keyof WordSearchSettings, value: any) => void;
}

export const ThemesAndWordsStep: React.FC<ThemesAndWordsStepProps> = ({
  settings,
  onSettingChange,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiWords, setAiWords] = useState<string[]>([]);
  const [themeIdeas] = useState<string[]>([
    'Animals', 'Space', 'Ocean', 'Sports', 'Food', 'Countries', 
    'Music', 'Movies', 'Science', 'History', 'Holidays', 'Travel'
  ]);

  const handleGenerateWords = async () => {
    if (!settings.theme) {
      alert('Please enter a theme first');
      return;
    }

    setIsGenerating(true);
    try {
      const words = await wordSearchApi.generateWordsFromTheme(
        settings.theme,
        settings.wordsPerPuzzle,
        settings.aiPrompt
      );
      setAiWords(words);
      
      // Add the AI-generated words to custom words
      const existingWords = settings.customWords.trim() ? 
        settings.customWords.split(',').map(w => w.trim()) : 
        [];
      
      const allWords = [...existingWords, ...words].filter(Boolean);
      onSettingChange('customWords', allWords.join(', '));
    } catch (error) {
      console.error('Error generating words:', error);
      alert('Failed to generate words. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const useThemeIdea = (theme: string) => {
    onSettingChange('theme', theme);
  };
  
  const handleIncludeThemeFacts = (checked: boolean | 'indeterminate') => {
    onSettingChange('includeThemeFacts', checked === 'indeterminate' ? false : checked);
  };

  return (
    <Card className="w-full border-0 shadow-none">
      <CardContent className="p-0">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <ListChecks className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Themes & Word Lists</h2>
        </div>

        <Tabs defaultValue="ai" className="w-full">
          <TabsList className="mb-6 w-full grid grid-cols-2">
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> AI Word Generation
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <ListChecks className="h-4 w-4" /> Manual Word Entry
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">AI-Generated Words</h3>
              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="theme">Theme</Label>
                    <div className="flex gap-1 overflow-x-auto pb-2 max-w-[70%]">
                      {themeIdeas.slice(0, 6).map(idea => (
                        <Button 
                          key={idea} 
                          variant="outline" 
                          size="sm" 
                          className="text-xs h-6 px-2 whitespace-nowrap"
                          onClick={() => useThemeIdea(idea)}
                        >
                          {idea}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Input
                    id="theme"
                    value={settings.theme}
                    onChange={(e) => onSettingChange('theme', e.target.value)}
                    placeholder="e.g., Animals, Space, Countries"
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter a theme for your word search puzzles
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aiPrompt">
                    <div className="flex items-center">
                      Custom AI Instructions (Optional)
                      <Sparkles className="h-4 w-4 ml-1 text-yellow-500" />
                    </div>
                  </Label>
                  <Textarea
                    id="aiPrompt"
                    value={settings.aiPrompt}
                    onChange={(e) => onSettingChange('aiPrompt', e.target.value)}
                    placeholder="Add custom instructions for the AI word generator..."
                    className="w-full resize-y min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Example: "Create educational words related to astronomy for children ages 8-12."
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={handleGenerateWords}
                    disabled={isGenerating || !settings.theme}
                    className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 w-full relative z-10"
                  >
                    {isGenerating ? (
                      <>
                        <CloudLightning className="mr-2 h-4 w-4 animate-pulse" />
                        Generating Words...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Words from Theme
                      </>
                    )}
                  </Button>
                </div>

                {aiWords.length > 0 && (
                  <div className="bg-secondary/10 p-4 rounded-md">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">Generated Words</h4>
                      <Badge variant="outline" className="bg-primary/10">
                        {aiWords.length} words
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {aiWords.map((word, index) => (
                        <Badge key={index} variant="secondary">
                          {word}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Manual Word Entry</h3>
              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="customWords">Custom Words</Label>
                    <div className="text-xs text-muted-foreground">Separate with commas</div>
                  </div>
                  <Textarea
                    id="customWords"
                    value={settings.customWords}
                    onChange={(e) => onSettingChange('customWords', e.target.value)}
                    placeholder="Enter specific words separated by commas..."
                    className="w-full resize-y min-h-[200px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    For best results, use 8-15 words per puzzle and ensure they fit within your chosen grid size.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-8 pt-6 border-t">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Additional Options</h3>
            <Separator />

            <div className="flex items-center space-x-2">
              <div 
                className="flex items-center space-x-2 cursor-pointer" 
                onClick={() => onSettingChange('includeThemeFacts', !settings.includeThemeFacts)}
              >
                <Checkbox
                  id="includeThemeFacts"
                  checked={settings.includeThemeFacts}
                  onCheckedChange={handleIncludeThemeFacts}
                />
                <span>Include fun facts about each theme</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground pl-6">
              AI will generate interesting facts related to your theme to display with each puzzle
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 