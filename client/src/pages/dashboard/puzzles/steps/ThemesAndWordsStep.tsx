import React, { useState, useEffect } from 'react';
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
import { Sparkles, ListChecks, Plus, Trash2, CloudLightning, AlertCircle, Edit, Layers, BookOpen, FileText } from 'lucide-react';
import { WordSearchSettings } from '../WordSearch';
import wordSearchApi from '@/lib/services/wordSearchApi';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Import our new Modal component
import { Modal, ModalHeader, ModalFooter } from '@/components/ui/modal';

interface ThemeData {
  id: string;
  name: string;
  words: string[];
  pageCount: number; // Number of pages dedicated to this theme
  difficulty?: string; // Optional difficulty level for this theme
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
  const [currentThemePageCount, setCurrentThemePageCount] = useState<number>(5);
  const [currentThemeDifficulty, setCurrentThemeDifficulty] = useState<string>('medium');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [themeError, setThemeError] = useState('');
  const [themes, setThemes] = useState<ThemeData[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [activeTab, setActiveTab] = useState<string>('themes');
  
  const [themeIdeas] = useState<string[]>([
    'Animals', 'Space', 'Ocean', 'Sports', 'Food', 'Countries', 
    'Music', 'Movies', 'Science', 'History', 'Holidays', 'Travel',
    'Nature', 'Technology', 'Careers', 'Mythology', 'Astronomy'
  ]);

  const difficultyOptions = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' }
  ];

  // Load themes from settings on initial render
  useEffect(() => {
    try {
      // If we have custom words in the format for multiple themes
      if (settings.customWords && settings.customWords.startsWith('[')) {
        const savedThemes = JSON.parse(settings.customWords);
        if (Array.isArray(savedThemes)) {
          // Ensure all themes have pageCount property
          const updatedThemes = savedThemes.map(theme => ({
            ...theme,
            pageCount: theme.pageCount || 5,
            difficulty: theme.difficulty || 'medium'
          }));
          setThemes(updatedThemes);
          calculateTotalPages(updatedThemes);
        }
      }
    } catch (error) {
      console.error('Error parsing saved themes:', error);
    }
  }, []);

  // Update settings.customWords whenever themes change
  useEffect(() => {
    if (themes.length > 0) {
      onSettingChange('customWords', JSON.stringify(themes));
      calculateTotalPages(themes);
    }
  }, [themes, onSettingChange]);

  const calculateTotalPages = (themesList: ThemeData[]) => {
    const total = themesList.reduce((sum, theme) => sum + (theme.pageCount || 0), 0);
    setTotalPages(total);
    // Also update the quantity setting to match the total pages
    onSettingChange('quantity', total);
  };

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
            ? { 
                ...theme, 
                name: currentThemeName, 
                words,
                pageCount: currentThemePageCount,
                difficulty: currentThemeDifficulty
              } 
            : theme
        )
      );
    } else {
      // Add new theme
      const newTheme: ThemeData = {
        id: Date.now().toString(),
        name: currentThemeName,
        words,
        pageCount: currentThemePageCount,
        difficulty: currentThemeDifficulty
      };
      
      setThemes(prevThemes => [...prevThemes, newTheme]);
    }

    // Reset form
    setCurrentThemeName('');
    setCurrentThemeWords('');
    setCurrentThemeId(null);
    setCurrentThemePageCount(5);
    setCurrentThemeDifficulty('medium');
    setIsEditing(false);
    setDialogOpen(false);
    setThemeError('');
  };

  const handleEditTheme = (theme: ThemeData) => {
    setCurrentThemeId(theme.id);
    setCurrentThemeName(theme.name);
    setCurrentThemeWords(theme.words.join(', '));
    setCurrentThemePageCount(theme.pageCount || 5);
    setCurrentThemeDifficulty(theme.difficulty || 'medium');
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
    console.log("Opening theme dialog");
    // Alert to confirm button was clicked
    alert("Opening theme dialog");
    setCurrentThemeId(null);
    setCurrentThemeName('');
    setCurrentThemeWords('');
    setCurrentThemePageCount(5);
    setCurrentThemeDifficulty('medium');
    setIsEditing(false);
    setThemeError('');
    setDialogOpen(true);
  };

  const useThemeIdea = (theme: string) => {
    setCurrentThemeName(theme);
    // Auto-generate words when selecting a theme idea
    handleGenerateWords(theme);
  };

  // Update the debugButtonClick function to directly set dialogOpen
  const debugButtonClick = () => {
    console.log("Button clicked");
    alert("Button clicked - now trying to open dialog");
    // Directly set dialog state to true without going through handleOpenNewThemeDialog
    setDialogOpen(true);
    
    // Reset the form afterwards
    setCurrentThemeId(null);
    setCurrentThemeName('');
    setCurrentThemeWords('');
    setCurrentThemePageCount(5);
    setCurrentThemeDifficulty('medium');
    setIsEditing(false);
    setThemeError('');
  };

  // Add useEffect to monitor dialogOpen state
  useEffect(() => {
    console.log("Dialog state changed:", dialogOpen);
  }, [dialogOpen]);

  return (
    <div>
      <div className="mb-6">
        <Tabs defaultValue="themes" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-2 mb-6">
            <TabsTrigger value="themes" className="flex items-center gap-1">
              <ListChecks className="h-4 w-4" /> Themes
            </TabsTrigger>
            <TabsTrigger value="book" className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" /> Book Layout
            </TabsTrigger>
          </TabsList>

          <TabsContent value="themes">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">My Themes</h3>
                  <Button 
                    variant="default"
                    onClick={debugButtonClick}
                    className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Theme
                  </Button>
                </div>
                <Separator className="mb-6" />

                {themes.length === 0 ? (
                  <div className="bg-secondary/10 p-6 rounded-md text-center">
                    <h4 className="font-medium mb-2">No themes added yet</h4>
                    <p className="text-muted-foreground mb-4">
                      Add themes to create puzzles with different word categories
                    </p>
                    <Button 
                      variant="default"
                      onClick={debugButtonClick}
                      className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Theme
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {themes.map((theme) => (
                        <motion.div
                          key={theme.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Card className="relative overflow-hidden border border-primary/20 hover:border-primary/50 transition-colors h-full">
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
                              
                              <div className="flex flex-wrap gap-2 mb-3">
                                <Badge variant="outline" className="bg-primary/5">
                                  {theme.words.length} words
                                </Badge>
                                <Badge variant="outline" className="bg-primary/5">
                                  {theme.pageCount} pages
                                </Badge>
                                <Badge variant="outline" className="bg-primary/5">
                                  {theme.difficulty || 'medium'} difficulty
                                </Badge>
                              </div>
                              
                              <div className="flex flex-wrap gap-1 max-h-20 overflow-hidden">
                                {theme.words.slice(0, 8).map((word, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {word}
                                  </Badge>
                                ))}
                                {theme.words.length > 8 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{theme.words.length - 8} more
                                  </Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                    
                    <div className="bg-secondary/5 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          Book Summary
                        </h4>
                        <Badge variant="outline" className="bg-primary/10">
                          {totalPages} total pages
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Your book will contain {themes.length} themes with a total of {totalPages} puzzle pages.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="book">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Book Structure</h3>
                    <Separator className="mb-6" />

                    <div className="space-y-6">
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

                      <div className="flex items-center space-x-2">
                        <div 
                          className="flex items-center space-x-2 cursor-pointer" 
                          onClick={() => onSettingChange('includeAnswers', !settings.includeAnswers)}
                        >
                          <Checkbox
                            id="includeAnswers"
                            checked={settings.includeAnswers}
                            onCheckedChange={(checked) => 
                              onSettingChange('includeAnswers', checked === 'indeterminate' ? false : checked)
                            }
                          />
                          <span>Include answer keys</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground pl-6">
                        Add solution pages at the end of the book
                      </p>

                      <div className="flex items-center space-x-2">
                        <div 
                          className="flex items-center space-x-2 cursor-pointer" 
                          onClick={() => onSettingChange('includeCoverPage', !settings.includeCoverPage)}
                        >
                          <Checkbox
                            id="includeCoverPage"
                            checked={settings.includeCoverPage}
                            onCheckedChange={(checked) => 
                              onSettingChange('includeCoverPage', checked === 'indeterminate' ? false : checked)
                            }
                          />
                          <span>Include title page</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground pl-6">
                        Add a title page at the beginning of the book
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">Book Difficulty</h3>
                    <Separator className="mb-6" />

                    <div className="space-y-4">
                      <Label htmlFor="difficulty">Default Puzzle Difficulty</Label>
                      <Select
                        value={settings.difficulty}
                        onValueChange={(value) => onSettingChange('difficulty', value)}
                      >
                        <SelectTrigger id="difficulty" className="w-full">
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="easy">Easy - Best for children</SelectItem>
                          <SelectItem value="medium">Medium - For casual solvers</SelectItem>
                          <SelectItem value="hard">Hard - For experienced puzzlers</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        This setting affects word placement and grid complexity for themes without a specific difficulty
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Modal 
        isOpen={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        title={isEditing ? 'Edit Theme' : 'Add New Theme'}
        description={isEditing 
          ? 'Edit your theme and its associated words' 
          : 'Create a new theme with words for your word search puzzle'}
      >
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pageCount">Pages for this theme: {currentThemePageCount}</Label>
              <Slider
                id="pageCount"
                min={1}
                max={50}
                step={1}
                value={[currentThemePageCount]}
                onValueChange={(value) => setCurrentThemePageCount(value[0])}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">Number of pages to dedicate to this theme</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="themeDifficulty">Difficulty</Label>
              <Select
                value={currentThemeDifficulty}
                onValueChange={setCurrentThemeDifficulty}
              >
                <SelectTrigger id="themeDifficulty" className="w-full">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {difficultyOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Puzzle difficulty for this theme</p>
            </div>
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

        <ModalFooter>
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
        </ModalFooter>
      </Modal>

      {/* Debug display */}
      <div className="fixed bottom-4 right-4 bg-black text-white p-2 rounded-md z-[10001] text-xs">
        Dialog state: {dialogOpen ? 'OPEN' : 'CLOSED'}
      </div>
    </div>
  );
}; 