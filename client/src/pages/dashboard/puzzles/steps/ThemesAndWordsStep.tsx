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
import { Sparkles, ListChecks, Plus, Trash2, CloudLightning, AlertCircle, Edit } from 'lucide-react';
import { WordSearchSettings } from '../WordSearch';
import wordSearchApi from '@/lib/services/wordSearchApi';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';

interface ThemeData {
  id: string;
  name: string;
  words: string[];
}

interface ThemesAndWordsStepProps {
  settings: WordSearchSettings;
  onSettingChange: (key: keyof WordSearchSettings, value: any) => void;
}

export const ThemesAndWordsStep: React.FC<ThemesAndWordsStepProps> = ({
  settings,
  onSettingChange,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentThemeId, setCurrentThemeId] = useState<string | null>(null);
  const [currentThemeName, setCurrentThemeName] = useState('');
  const [currentThemeWords, setCurrentThemeWords] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [themeError, setThemeError] = useState('');
  const [themes, setThemes] = useState<ThemeData[]>([]);
  const [themeIdeas] = useState<string[]>([
    'Animals', 'Space', 'Ocean', 'Sports', 'Food', 'Countries', 
    'Music', 'Movies', 'Science', 'History', 'Holidays', 'Travel'
  ]);

  // Load themes from settings on initial render
  React.useEffect(() => {
    try {
      // If we have custom words in the format for multiple themes
      if (settings.customWords && settings.customWords.startsWith('[')) {
        const savedThemes = JSON.parse(settings.customWords);
        if (Array.isArray(savedThemes)) {
          setThemes(savedThemes);
        }
      }
    } catch (error) {
      console.error('Error parsing saved themes:', error);
    }
  }, []);

  // Update settings.customWords whenever themes change
  React.useEffect(() => {
    if (themes.length > 0) {
      onSettingChange('customWords', JSON.stringify(themes));
    }
  }, [themes, onSettingChange]);

  const handleGenerateWords = async (themePrompt: string) => {
    if (!themePrompt) {
      setThemeError('Please enter a theme first');
      return;
    }

    setIsGenerating(true);
    setThemeError('');
    
    try {
      const words = await wordSearchApi.generateWordsFromTheme(
        themePrompt,
        settings.wordsPerPuzzle,
        settings.aiPrompt
      );
      
      setCurrentThemeWords(words.join(', '));
    } catch (error) {
      console.error('Error generating words:', error);
      setThemeError('Failed to generate words. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddTheme = () => {
    if (!currentThemeName.trim()) {
      setThemeError('Please enter a theme name');
      return;
    }

    if (!currentThemeWords.trim()) {
      setThemeError('Please enter or generate some words for this theme');
      return;
    }

    const words = currentThemeWords
      .split(',')
      .map(word => word.trim())
      .filter(word => word.length > 0);

    if (words.length < 5) {
      setThemeError('Please add at least 5 words for this theme');
      return;
    }

    if (isEditing && currentThemeId) {
      // Update existing theme
      setThemes(prevThemes => 
        prevThemes.map(theme => 
          theme.id === currentThemeId 
            ? { ...theme, name: currentThemeName, words } 
            : theme
        )
      );
    } else {
      // Add new theme
      const newTheme: ThemeData = {
        id: Date.now().toString(),
        name: currentThemeName,
        words
      };
      
      setThemes(prevThemes => [...prevThemes, newTheme]);
    }

    // Reset form
    setCurrentThemeName('');
    setCurrentThemeWords('');
    setCurrentThemeId(null);
    setIsEditing(false);
    setDialogOpen(false);
    setThemeError('');
  };

  const handleEditTheme = (theme: ThemeData) => {
    setCurrentThemeId(theme.id);
    setCurrentThemeName(theme.name);
    setCurrentThemeWords(theme.words.join(', '));
    setIsEditing(true);
    setDialogOpen(true);
  };

  const handleDeleteTheme = (themeId: string) => {
    setThemes(prevThemes => prevThemes.filter(theme => theme.id !== themeId));
  };

  const handleIncludeThemeFacts = (checked: boolean | 'indeterminate') => {
    onSettingChange('includeThemeFacts', checked === 'indeterminate' ? false : checked);
  };

  const handleOpenNewThemeDialog = () => {
    setCurrentThemeId(null);
    setCurrentThemeName('');
    setCurrentThemeWords('');
    setIsEditing(false);
    setThemeError('');
    setDialogOpen(true);
  };

  const useThemeIdea = (theme: string) => {
    setCurrentThemeName(theme);
    // Auto-generate words when selecting a theme idea
    handleGenerateWords(theme);
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

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">My Themes</h3>
            <Button 
              variant="default"
              onClick={handleOpenNewThemeDialog} 
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Theme
            </Button>
          </div>
          <Separator />

          {themes.length === 0 ? (
            <div className="bg-secondary/10 p-6 rounded-md text-center">
              <h4 className="font-medium mb-2">No themes added yet</h4>
              <p className="text-muted-foreground mb-4">
                Add themes to create puzzles with different word categories
              </p>
              <Button 
                variant="default"
                onClick={handleOpenNewThemeDialog}
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Theme
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {themes.map((theme) => (
                <Card key={theme.id} className="relative overflow-hidden border border-primary/20 hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-lg">{theme.name}</h4>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7" 
                          onClick={() => handleEditTheme(theme)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50" 
                          onClick={() => handleDeleteTheme(theme.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Badge variant="outline" className="mb-3 bg-primary/5">
                      {theme.words.length} words
                    </Badge>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-hidden">
                      {theme.words.map((word, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {word}
                        </Badge>
                      ))}
                      {theme.words.length > 12 && (
                        <Badge variant="outline" className="text-xs">
                          +{theme.words.length - 12} more
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Edit Theme' : 'Add New Theme'}</DialogTitle>
              <DialogDescription>
                {isEditing 
                  ? 'Edit your theme and its associated words' 
                  : 'Create a new theme with words for your word search puzzle'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="themeName">Theme Name</Label>
                  <div className="flex gap-1 overflow-x-auto pb-2 max-w-[60%]">
                    {themeIdeas.slice(0, 4).map(idea => (
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
                  id="themeName"
                  value={currentThemeName}
                  onChange={(e) => setCurrentThemeName(e.target.value)}
                  placeholder="e.g., Animals, Space, Countries"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="themeWords">Theme Words</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateWords(currentThemeName)}
                    disabled={isGenerating || !currentThemeName}
                    className="text-xs"
                  >
                    {isGenerating ? (
                      <>
                        <CloudLightning className="mr-1 h-3 w-3 animate-pulse" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-1 h-3 w-3" />
                        Generate Words
                      </>
                    )}
                  </Button>
                </div>
                <Textarea
                  id="themeWords"
                  value={currentThemeWords}
                  onChange={(e) => setCurrentThemeWords(e.target.value)}
                  placeholder="Enter specific words separated by commas..."
                  className="w-full resize-y min-h-[150px]"
                />
                <p className="text-xs text-muted-foreground">
                  For best results, use 8-15 words that fit within your chosen grid size
                </p>
              </div>

              {themeError && (
                <div className="bg-red-50 text-red-500 p-3 rounded-md flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{themeError}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="default"
                onClick={handleAddTheme}
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
              >
                {isEditing ? 'Update Theme' : 'Add Theme'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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