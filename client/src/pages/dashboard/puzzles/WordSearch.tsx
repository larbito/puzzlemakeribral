import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { 
  Button,
  buttonVariants
} from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { 
  BookText, 
  FileDown, 
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowLeft,
  Sparkles,
  PenLine,
  User,
  Palette,
  Type,
  Settings,
  Grid3X3,
  Pencil,
  FileOutput,
  HelpCircle,
  Info,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import wordSearchApi from '@/lib/services/wordSearchApi';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';

// Animate card component
const MotionCard = motion(Card);

// Types
export type WordSearchSettings = {
  // Book details
  title: string;
  subtitle: string;
  authorName: string;
  pageSize: string;
  bleed: boolean;
  includePageNumbers: boolean;
  interiorTheme: 'light' | 'dark';
  fontFamily: string;
  
  // WordSearch specific settings
  puzzlesPerPage: number;
  theme: string;
  customWords: string;
  difficulty: string;
  quantity: number;
  aiPrompt: string;
  
  // Puzzle options
  gridSize: number;
  wordsPerPuzzle: number;
  directions: {
    horizontal: boolean;
    vertical: boolean;
    diagonal: boolean;
    backward: boolean;
  };
  
  // Output options
  includeAnswers: boolean;
  includeThemeFacts: boolean;
  includeCoverPage: boolean;
};

export const defaultWordSearchSettings: WordSearchSettings = {
  // Default book settings
  title: '',
  subtitle: '',
  authorName: '',
  pageSize: '6x9',
  bleed: false,
  includePageNumbers: true,
  interiorTheme: 'light',
  fontFamily: 'sans',
  
  // Default WordSearch specific settings
  puzzlesPerPage: 1,
  theme: '',
  customWords: '',
  difficulty: 'medium',
  quantity: 20,
  aiPrompt: '',
  
  // Default puzzle options
  gridSize: 15,
  wordsPerPuzzle: 10,
  directions: {
    horizontal: true,
    vertical: true,
    diagonal: true,
    backward: false
  },
  
  // Default output options
  includeAnswers: true,
  includeThemeFacts: false,
  includeCoverPage: true
};

interface BookFormProps {
  settings: WordSearchSettings;
  onSettingChange: (key: keyof WordSearchSettings, value: any) => void;
}

// Book Details Form
const BookDetailsForm: React.FC<BookFormProps> = ({ settings, onSettingChange }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="title">Book Title <span className="text-red-500">*</span></Label>
          <Input
            id="title"
            value={settings.title}
            onChange={(e) => onSettingChange('title', e.target.value)}
            placeholder="My Word Search Collection"
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="subtitle">Subtitle (Optional)</Label>
          <Input
            id="subtitle"
            value={settings.subtitle}
            onChange={(e) => onSettingChange('subtitle', e.target.value)}
            placeholder="Fun puzzles for all ages"
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="authorName">Author Name</Label>
          <Input
            id="authorName"
            value={settings.authorName}
            onChange={(e) => onSettingChange('authorName', e.target.value)}
            placeholder="Your Name"
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="pageSize">Book Size</Label>
          <Select
            value={settings.pageSize}
            onValueChange={(value) => onSettingChange('pageSize', value)}
          >
            <SelectTrigger id="pageSize" className="w-full">
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="6x9">6" x 9" (Standard)</SelectItem>
              <SelectItem value="8.5x11">8.5" x 11" (Letter)</SelectItem>
              <SelectItem value="5x8">5" x 8" (Small)</SelectItem>
              <SelectItem value="7x10">7" x 10" (Medium)</SelectItem>
              <SelectItem value="8x10">8" x 10" (Large)</SelectItem>
              <SelectItem value="8.25x8.25">8.25" x 8.25" (Square)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="interiorTheme">Interior Theme</Label>
          <Select
            value={settings.interiorTheme}
            onValueChange={(value) => onSettingChange('interiorTheme', value as 'light' | 'dark')}
          >
            <SelectTrigger id="interiorTheme" className="w-full">
              <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="light">Light (Black on White)</SelectItem>
              <SelectItem value="dark">Dark (White on Black)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="fontFamily">Font Style</Label>
          <Select
            value={settings.fontFamily}
            onValueChange={(value) => onSettingChange('fontFamily', value)}
          >
            <SelectTrigger id="fontFamily" className="w-full">
              <SelectValue placeholder="Select font" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="sans">Sans-serif (Modern)</SelectItem>
              <SelectItem value="serif">Serif (Traditional)</SelectItem>
              <SelectItem value="mono">Monospace (Clear)</SelectItem>
              <SelectItem value="handwritten">Handwritten (Casual)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-6">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="includePageNumbers"
            checked={settings.includePageNumbers}
            onCheckedChange={(checked: boolean | 'indeterminate') => onSettingChange('includePageNumbers', checked === 'indeterminate' ? false : checked)}
          />
          <Label 
            htmlFor="includePageNumbers" 
            className="cursor-pointer"
            onClick={() => onSettingChange('includePageNumbers', !settings.includePageNumbers)}
          >Add page numbers</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <div 
            className="flex items-center space-x-2 cursor-pointer" 
            onClick={() => onSettingChange('bleed', !settings.bleed)}
          >
            <Checkbox
              id="bleed"
              checked={settings.bleed}
              onCheckedChange={(checked: boolean | 'indeterminate') => {
                const newValue = checked === 'indeterminate' ? false : checked;
                onSettingChange('bleed', newValue);
              }}
            />
            <span>Include bleed (0.125" margin)</span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">A bleed extends the printed area beyond the final trim size to ensure no white edges when the book is cut to its final size.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="includeCoverPage"
            checked={settings.includeCoverPage}
            onCheckedChange={(checked: boolean | 'indeterminate') => onSettingChange('includeCoverPage', checked === 'indeterminate' ? false : checked)}
          />
          <Label 
            htmlFor="includeCoverPage" 
            className="cursor-pointer"
            onClick={() => onSettingChange('includeCoverPage', !settings.includeCoverPage)}
          >Include cover page</Label>
        </div>
      </div>
    </div>
  );
};

interface PuzzleFormProps {
  settings: WordSearchSettings;
  onSettingChange: (key: keyof WordSearchSettings, value: any) => void;
}

// Puzzle Content Form
const PuzzleContentForm: React.FC<PuzzleFormProps> = ({ settings, onSettingChange }) => {
  const handleDirectionChange = (direction: keyof typeof settings.directions) => {
    onSettingChange('directions', {
      ...settings.directions,
      [direction]: !settings.directions[direction]
    });
  };
  
  const [themeIdeas, setThemeIdeas] = useState<string[]>([
    'Animals', 'Space', 'Ocean', 'Sports', 'Food', 'Countries', 
    'Music', 'Movies', 'Science', 'History', 'Holidays'
  ]);
  
  const useThemeIdea = (theme: string) => {
    onSettingChange('theme', theme);
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="theme">Theme</Label>
            <div className="flex gap-1">
              {themeIdeas.slice(0, 5).map(idea => (
                <Button 
                  key={idea} 
                  variant="outline" 
                  size="sm" 
                  className="text-xs h-6 px-2"
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
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="difficulty">Difficulty Level</Label>
          <Select
            value={settings.difficulty}
            onValueChange={(value) => onSettingChange('difficulty', value)}
          >
            <SelectTrigger id="difficulty" className="w-full">
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
              <SelectItem value="mixed">Mixed Levels</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="gridSize">Grid Size</Label>
          <Select
            value={String(settings.gridSize)}
            onValueChange={(value) => onSettingChange('gridSize', parseInt(value))}
          >
            <SelectTrigger id="gridSize" className="w-full">
              <SelectValue placeholder="Select grid size" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="10">10 x 10 (Small)</SelectItem>
              <SelectItem value="15">15 x 15 (Medium)</SelectItem>
              <SelectItem value="20">20 x 20 (Large)</SelectItem>
              <SelectItem value="25">25 x 25 (Extra Large)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="quantity">Number of Puzzles</Label>
          <div className="flex items-center gap-4">
            <Input
              id="quantity"
              type="number"
              min="5"
              max="100"
              value={settings.quantity}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value >= 5 && value <= 100) {
                  onSettingChange('quantity', value);
                }
              }}
              className="w-24"
            />
            <Slider
              value={[settings.quantity]}
              min={5}
              max={100}
              step={1}
              onValueChange={(value) => onSettingChange('quantity', value[0])}
              className="flex-1"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="wordsPerPuzzle">Words Per Puzzle</Label>
          <Select
            value={String(settings.wordsPerPuzzle)}
            onValueChange={(value) => onSettingChange('wordsPerPuzzle', parseInt(value))}
          >
            <SelectTrigger id="wordsPerPuzzle" className="w-full">
              <SelectValue placeholder="Select number of words" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="8">8 words</SelectItem>
              <SelectItem value="10">10 words</SelectItem>
              <SelectItem value="12">12 words</SelectItem>
              <SelectItem value="15">15 words</SelectItem>
              <SelectItem value="20">20 words</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="puzzlesPerPage">Puzzles Per Page</Label>
          <Select
            value={String(settings.puzzlesPerPage)}
            onValueChange={(value) => onSettingChange('puzzlesPerPage', parseInt(value))}
          >
            <SelectTrigger id="puzzlesPerPage" className="w-full">
              <SelectValue placeholder="Select puzzles per page" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="1">1 per page</SelectItem>
              <SelectItem value="2">2 per page</SelectItem>
              <SelectItem value="4">4 per page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Word Directions</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="horizontal"
              checked={settings.directions.horizontal}
              onCheckedChange={() => handleDirectionChange('horizontal')}
            />
            <Label 
              htmlFor="horizontal" 
              className="cursor-pointer"
              onClick={() => handleDirectionChange('horizontal')}
            >Horizontal →</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="vertical"
              checked={settings.directions.vertical}
              onCheckedChange={() => handleDirectionChange('vertical')}
            />
            <Label 
              htmlFor="vertical" 
              className="cursor-pointer"
              onClick={() => handleDirectionChange('vertical')}
            >Vertical ↓</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="diagonal"
              checked={settings.directions.diagonal}
              onCheckedChange={() => handleDirectionChange('diagonal')}
            />
            <Label 
              htmlFor="diagonal" 
              className="cursor-pointer"
              onClick={() => handleDirectionChange('diagonal')}
            >Diagonal ↘</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="backward"
              checked={settings.directions.backward}
              onCheckedChange={() => handleDirectionChange('backward')}
            />
            <Label 
              htmlFor="backward" 
              className="cursor-pointer"
              onClick={() => handleDirectionChange('backward')}
            >Backward ←</Label>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="customWords">Custom Words (Optional)</Label>
          <div className="text-xs text-muted-foreground">Separate with commas</div>
        </div>
        <Textarea
          id="customWords"
          value={settings.customWords}
          onChange={(e) => onSettingChange('customWords', e.target.value)}
          placeholder="Enter specific words separated by commas..."
          className="w-full resize-y min-h-[100px]"
        />
        <div className="text-xs text-muted-foreground">
          Words will be combined with AI-generated words if theme is provided.
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="aiPrompt">
            <div className="flex items-center">
              AI Prompt (Optional)
              <Sparkles className="h-4 w-4 ml-1 text-yellow-500" />
            </div>
          </Label>
        </div>
        <Textarea
          id="aiPrompt"
          value={settings.aiPrompt}
          onChange={(e) => onSettingChange('aiPrompt', e.target.value)}
          placeholder="Add custom instructions for the AI word generator..."
          className="w-full resize-y min-h-[100px]"
        />
        <div className="text-xs text-muted-foreground">
          Provide additional guidance for the AI to generate your word list. 
          Example: "Create educational words related to astronomy for children ages 8-12."
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Additional Options</Label>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeAnswers"
              checked={settings.includeAnswers}
              onCheckedChange={(checked: boolean | 'indeterminate') => onSettingChange('includeAnswers', checked === 'indeterminate' ? false : checked)}
            />
            <Label 
              htmlFor="includeAnswers" 
              className="cursor-pointer"
              onClick={() => onSettingChange('includeAnswers', !settings.includeAnswers)}
            >Include answer key</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeThemeFacts"
              checked={settings.includeThemeFacts}
              onCheckedChange={(checked: boolean | 'indeterminate') => onSettingChange('includeThemeFacts', checked === 'indeterminate' ? false : checked)}
            />
            <Label 
              htmlFor="includeThemeFacts" 
              className="cursor-pointer"
              onClick={() => onSettingChange('includeThemeFacts', !settings.includeThemeFacts)}
            >Add fun facts about themes</Label>
          </div>
        </div>
      </div>
    </div>
  );
};

export type WordSearchFormProps = {
  settings: WordSearchSettings;
  onSettingChange: (key: keyof WordSearchSettings, value: any) => void;
  onBack: () => void;
  onGenerate: () => void;
  generationStatus: 'idle' | 'generating' | 'complete' | 'error';
};

export const WordSearchForm = ({ 
  settings, 
  onSettingChange, 
  onBack, 
  onGenerate, 
  generationStatus
}: WordSearchFormProps) => {
  const [activeTab, setActiveTab] = useState('book-details');
  
  const isFormValid = settings.title.trim() !== '';
  
  return (
    <MotionCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full overflow-hidden relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-transparent" />
      
      <CardHeader className="flex flex-row items-center space-y-0 pb-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="mr-2 h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary text-white">
            <BookText className="h-5 w-5" />
          </div>
          <CardTitle className="text-xl">Word Search Puzzle Book</CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Tabs defaultValue="book-details" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-6 w-full md:w-auto">
            <TabsTrigger value="book-details" className="flex items-center gap-2">
              <PenLine className="h-4 w-4" /> Book Details
            </TabsTrigger>
            <TabsTrigger value="puzzle-content" className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4" /> Puzzle Content
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="book-details" className="space-y-4">
            <BookDetailsForm 
              settings={settings} 
              onSettingChange={onSettingChange} 
            />
          </TabsContent>
          
          <TabsContent value="puzzle-content" className="space-y-4">
            <PuzzleContentForm
              settings={settings}
              onSettingChange={onSettingChange}
            />
          </TabsContent>
        </Tabs>
        
        <div className="flex items-center justify-between pt-4 mt-6 border-t">
          <div className="flex items-center text-muted-foreground">
            {activeTab === 'book-details' ? (
              <div className="flex items-center">
                <Info className="h-4 w-4 mr-2" />
                <span className="text-sm">Set book details before generating</span>
              </div>
            ) : (
              <div className="flex items-center">
                <Info className="h-4 w-4 mr-2" />
                <span className="text-sm">Configure puzzle settings to your needs</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            {activeTab === 'book-details' ? (
              <Button
                type="button"
                onClick={() => setActiveTab('puzzle-content')}
                variant="outline"
                className="flex items-center gap-2 relative z-10"
              >
                Next <ArrowLeft className="h-4 w-4 rotate-180" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => setActiveTab('book-details')}
                variant="outline"
                className="flex items-center gap-2 relative z-10"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            )}
            
            <Button
              onClick={onGenerate}
              disabled={!isFormValid || generationStatus === 'generating'}
              className={cn(
                "bg-gradient-to-r from-primary to-secondary hover:opacity-90",
                !isFormValid && "opacity-70 cursor-not-allowed"
              )}
            >
              {generationStatus === 'generating' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Puzzle Book
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </MotionCard>
  );
};

interface StatusProps {
  status: 'complete' | 'error';
  progress?: number;
  error?: string;
  downloadUrl?: string | null;
  onTryAgain: () => void;
  onViewPreview?: () => void;
  onDownload: () => void;
}

export const WordSearchStatus: React.FC<StatusProps> = ({
  status,
  progress = 100,
  error = '',
  onTryAgain,
  onViewPreview,
  onDownload
}) => {
  return (
    <MotionCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-transparent" />
      
      <CardContent className="pt-6">
        {status === 'complete' ? (
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="rounded-full bg-green-100 p-3 flex-shrink-0">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-medium text-green-600">Your puzzle book is ready!</h3>
              <p className="text-muted-foreground mb-2">Download your PDF or view a preview</p>
              
              <Progress 
                value={progress} 
                className="h-2 bg-gray-100" 
              />
            </div>
            
            <div className="flex gap-2 flex-col md:flex-row">
              {onViewPreview && (
                <Button 
                  onClick={onViewPreview}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </Button>
              )}
              
              <Button 
                onClick={onDownload}
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="rounded-full bg-red-100 p-3 flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-medium text-red-600">Generation Error</h3>
              <p className="text-muted-foreground">{error || "There was a problem generating your puzzle book"}</p>
            </div>
            
            <Button 
              onClick={onTryAgain}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </MotionCard>
  );
};

export default WordSearchForm; 