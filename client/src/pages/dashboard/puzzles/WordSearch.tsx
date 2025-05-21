import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Type
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import wordSearchApi from '@/lib/services/wordSearchApi';

const MotionCard = motion(Card);

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
  // Handlers for book detail inputs
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingChange('title', e.target.value);
  };

  const handleSubtitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingChange('subtitle', e.target.value);
  };

  const handleAuthorNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingChange('authorName', e.target.value);
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSettingChange('pageSize', e.target.value);
  };

  const handleBleedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingChange('bleed', !settings.bleed);
  };

  const handlePageNumbersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingChange('includePageNumbers', !settings.includePageNumbers);
  };

  const handleInteriorThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSettingChange('interiorTheme', e.target.value as 'light' | 'dark');
  };

  const handleFontFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSettingChange('fontFamily', e.target.value);
  };

  // Handlers for puzzle settings
  const handlePuzzlesPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSettingChange('puzzlesPerPage', parseInt(e.target.value));
  };

  const handleThemeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingChange('theme', e.target.value);
  };

  const handleCustomWordsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onSettingChange('customWords', e.target.value);
  };

  const handleDifficultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSettingChange('difficulty', e.target.value);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 5 && value <= 100) {
      onSettingChange('quantity', value);
    }
  };

  const handleGridSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSettingChange('gridSize', parseInt(e.target.value));
  };

  const handleWordsPerPuzzleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSettingChange('wordsPerPuzzle', parseInt(e.target.value));
  };

  const handleDirectionChange = (direction: keyof typeof settings.directions) => {
    onSettingChange('directions', {
      ...settings.directions,
      [direction]: !settings.directions[direction]
    });
  };

  // Handlers for output options
  const handleIncludeAnswersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingChange('includeAnswers', !settings.includeAnswers);
  };

  const handleIncludeThemeFactsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingChange('includeThemeFacts', !settings.includeThemeFacts);
  };

  const handleIncludeCoverPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingChange('includeCoverPage', !settings.includeCoverPage);
  };

  const handleAIPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onSettingChange('aiPrompt', e.target.value);
  };

  return (
    <MotionCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative backdrop-blur-3xl border-primary/20 overflow-hidden w-full max-w-full bg-card"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-transparent" />
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
          <CardTitle className="text-xl">Word Search Book</CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 w-full">
        {/* Book Information Section */}
        <div className="space-y-4 w-full">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <PenLine className="h-4 w-4 text-primary" />
            Book Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <div className="space-y-2 w-full">
              <label htmlFor="book-title" className="text-sm font-medium">Book Title</label>
              <input
                id="book-title"
                type="text"
                value={settings.title}
                onChange={handleTitleChange}
                placeholder="Enter a title for your puzzle book"
                className="w-full px-3 py-2 rounded-md bg-background border border-input hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                style={{ width: '100%', boxSizing: 'border-box' }}
                aria-label="Book Title"
              />
            </div>
            <div className="space-y-2 w-full">
              <label htmlFor="book-subtitle" className="text-sm font-medium">Subtitle (Optional)</label>
              <input
                id="book-subtitle"
                type="text"
                value={settings.subtitle}
                onChange={handleSubtitleChange}
                placeholder="Add a subtitle"
                className="w-full px-3 py-2 rounded-md bg-background border border-input hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                style={{ width: '100%', boxSizing: 'border-box' }}
                aria-label="Book Subtitle"
              />
            </div>
            <div className="space-y-2 w-full">
              <label htmlFor="author-name" className="text-sm font-medium">Author Name</label>
              <input
                id="author-name"
                type="text"
                value={settings.authorName}
                onChange={handleAuthorNameChange}
                placeholder="Enter author name"
                className="w-full px-3 py-2 rounded-md bg-background border border-input hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                style={{ width: '100%', boxSizing: 'border-box' }}
                aria-label="Author Name"
              />
            </div>
            <div className="space-y-2 w-full">
              <label htmlFor="page-size" className="text-sm font-medium">Page Size</label>
              <select 
                id="page-size"
                className="w-full px-3 py-2 rounded-md bg-background border border-input hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                value={settings.pageSize}
                onChange={handlePageSizeChange}
                style={{ width: '100%', boxSizing: 'border-box' }}
                aria-label="Page Size"
              >
                <option value="6x9">6 x 9 in (KDP Standard)</option>
                <option value="8.5x11">8.5 x 11 in (Letter)</option>
                <option value="5x8">5 x 8 in (Small)</option>
                <option value="7x10">7 x 10 in (Medium)</option>
                <option value="8x10">8 x 10 in (Large)</option>
                <option value="8.25x8.25">8.25 x 8.25 in (Square)</option>
              </select>
            </div>
            <div className="space-y-2 w-full">
              <label htmlFor="interior-theme" className="text-sm font-medium">Interior Theme</label>
              <select 
                id="interior-theme"
                className="w-full px-3 py-2 rounded-md bg-background border border-input hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                value={settings.interiorTheme}
                onChange={handleInteriorThemeChange}
                style={{ width: '100%', boxSizing: 'border-box' }}
                aria-label="Interior Theme"
              >
                <option value="light">Light (Black on White)</option>
                <option value="dark">Dark (White on Black)</option>
              </select>
            </div>
            <div className="space-y-2 w-full">
              <label htmlFor="font-family" className="text-sm font-medium">Font Style</label>
              <select 
                id="font-family"
                className="w-full px-3 py-2 rounded-md bg-background border border-input hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                value={settings.fontFamily}
                onChange={handleFontFamilyChange}
                style={{ width: '100%', boxSizing: 'border-box' }}
                aria-label="Font Style"
              >
                <option value="sans">Sans-serif (Modern)</option>
                <option value="serif">Serif (Traditional)</option>
                <option value="mono">Monospace (Clear)</option>
                <option value="handwritten">Handwritten (Casual)</option>
              </select>
            </div>
            <div className="col-span-1 sm:col-span-2 flex flex-wrap gap-6">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="include-page-numbers"
                  checked={settings.includePageNumbers}
                  onChange={handlePageNumbersChange}
                  className="h-4 w-4 rounded border-input bg-background hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary"
                  aria-label="Include Page Numbers"
                />
                <label htmlFor="include-page-numbers" className="text-sm">
                  Add page numbers
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="include-bleed"
                  checked={settings.bleed}
                  onChange={handleBleedChange}
                  className="h-4 w-4 rounded border-input bg-background hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary"
                  aria-label="Include Bleed"
                />
                <label htmlFor="include-bleed" className="text-sm">
                  Include bleed (0.125" margin)
                </label>
              </div>
            </div>
          </div>
        </div>
        
        {/* Word Search Settings */}
        <div className="space-y-4 w-full">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <BookText className="h-4 w-4 text-primary" />
            Puzzle Settings
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <div className="space-y-2 w-full">
              <label htmlFor="theme" className="text-sm font-medium">Theme</label>
              <input
                id="theme"
                type="text"
                value={settings.theme}
                onChange={handleThemeChange}
                placeholder="e.g., Animals, Space, Sports"
                className="w-full px-3 py-2 rounded-md bg-background border border-input hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                style={{ width: '100%', boxSizing: 'border-box' }}
                aria-label="Theme"
              />
            </div>
            <div className="space-y-2 w-full">
              <label htmlFor="difficulty" className="text-sm font-medium">Difficulty Level</label>
              <select 
                id="difficulty"
                className="w-full px-3 py-2 rounded-md bg-background border border-input hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                value={settings.difficulty}
                onChange={handleDifficultyChange}
                style={{ width: '100%', boxSizing: 'border-box' }}
                aria-label="Difficulty Level"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="mixed">Mixed Levels</option>
              </select>
            </div>
            <div className="space-y-2 w-full">
              <label htmlFor="quantity" className="text-sm font-medium">Number of Puzzles</label>
              <input
                id="quantity"
                type="number"
                min="5"
                max="100"
                value={settings.quantity}
                onChange={handleQuantityChange}
                className="w-full px-3 py-2 rounded-md bg-background border border-input hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                style={{ width: '100%', boxSizing: 'border-box' }}
                aria-label="Number of Puzzles"
              />
            </div>
            <div className="space-y-2 w-full">
              <label htmlFor="words-per-puzzle" className="text-sm font-medium">Words Per Puzzle</label>
              <select 
                id="words-per-puzzle"
                className="w-full px-3 py-2 rounded-md bg-background border border-input hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                value={settings.wordsPerPuzzle}
                onChange={handleWordsPerPuzzleChange}
                style={{ width: '100%', boxSizing: 'border-box' }}
                aria-label="Words Per Puzzle"
              >
                <option value="8">8 words</option>
                <option value="10">10 words</option>
                <option value="12">12 words</option>
                <option value="15">15 words</option>
                <option value="20">20 words</option>
              </select>
            </div>
            <div className="space-y-2 w-full">
              <label htmlFor="grid-size" className="text-sm font-medium">Grid Size</label>
              <select 
                id="grid-size"
                className="w-full px-3 py-2 rounded-md bg-background border border-input hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                value={settings.gridSize}
                onChange={handleGridSizeChange}
                style={{ width: '100%', boxSizing: 'border-box' }}
                aria-label="Grid Size"
              >
                <option value="10">10 x 10 (Small)</option>
                <option value="15">15 x 15 (Medium)</option>
                <option value="20">20 x 20 (Large)</option>
                <option value="25">25 x 25 (Extra Large)</option>
              </select>
            </div>
            <div className="space-y-2 w-full">
              <label htmlFor="puzzles-per-page" className="text-sm font-medium">Puzzles Per Page</label>
              <select 
                id="puzzles-per-page"
                className="w-full px-3 py-2 rounded-md bg-background border border-input hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                value={settings.puzzlesPerPage}
                onChange={handlePuzzlesPerPageChange}
                style={{ width: '100%', boxSizing: 'border-box' }}
                aria-label="Puzzles Per Page"
              >
                <option value="1">1 per page</option>
                <option value="2">2 per page</option>
                <option value="4">4 per page</option>
              </select>
            </div>
            <div className="space-y-2 col-span-1 sm:col-span-2 w-full">
              <label className="text-sm font-medium">Word Directions</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="direction-horizontal"
                    checked={settings.directions.horizontal}
                    onChange={() => handleDirectionChange('horizontal')}
                    className="h-4 w-4 rounded border-input bg-background hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary"
                    aria-label="Horizontal Direction"
                  />
                  <label htmlFor="direction-horizontal" className="text-sm">
                    Horizontal →
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="direction-vertical"
                    checked={settings.directions.vertical}
                    onChange={() => handleDirectionChange('vertical')}
                    className="h-4 w-4 rounded border-input bg-background hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary"
                    aria-label="Vertical Direction"
                  />
                  <label htmlFor="direction-vertical" className="text-sm">
                    Vertical ↓
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="direction-diagonal"
                    checked={settings.directions.diagonal}
                    onChange={() => handleDirectionChange('diagonal')}
                    className="h-4 w-4 rounded border-input bg-background hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary"
                    aria-label="Diagonal Direction"
                  />
                  <label htmlFor="direction-diagonal" className="text-sm">
                    Diagonal ↘
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="direction-backward"
                    checked={settings.directions.backward}
                    onChange={() => handleDirectionChange('backward')}
                    className="h-4 w-4 rounded border-input bg-background hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary"
                    aria-label="Backward Direction"
                  />
                  <label htmlFor="direction-backward" className="text-sm">
                    Backward ←
                  </label>
                </div>
              </div>
            </div>
            <div className="space-y-2 col-span-1 sm:col-span-2 w-full">
              <label htmlFor="custom-words" className="text-sm font-medium">Custom Words (Optional)</label>
              <textarea
                id="custom-words"
                value={settings.customWords}
                onChange={handleCustomWordsChange}
                placeholder="Enter words separated by commas"
                className="w-full px-3 py-2 h-[80px] rounded-md bg-background border border-input hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                style={{ width: '100%', boxSizing: 'border-box' }}
                aria-label="Custom Words"
              />
            </div>
          </div>
        </div>
        
        {/* Output Options */}
        <div className="space-y-4 w-full">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <FileDown className="h-4 w-4 text-primary" />
            Output Options
          </h3>
          <div className="grid grid-cols-1 gap-4 w-full">
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="include-answers"
                  checked={settings.includeAnswers}
                  onChange={handleIncludeAnswersChange}
                  className="h-4 w-4 rounded border-input bg-background hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary"
                  aria-label="Include Answer Key"
                />
                <label htmlFor="include-answers" className="text-sm">
                  Include answer key
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="include-theme-facts"
                  checked={settings.includeThemeFacts}
                  onChange={handleIncludeThemeFactsChange}
                  className="h-4 w-4 rounded border-input bg-background hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary"
                  aria-label="Include Theme Facts"
                />
                <label htmlFor="include-theme-facts" className="text-sm">
                  Add fun facts about themes
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="include-cover-page"
                  checked={settings.includeCoverPage}
                  onChange={handleIncludeCoverPageChange}
                  className="h-4 w-4 rounded border-input bg-background hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary"
                  aria-label="Include Cover Page"
                />
                <label htmlFor="include-cover-page" className="text-sm">
                  Generate cover page
                </label>
              </div>
            </div>
          </div>
        </div>
        
        {/* AI Prompt Section */}
        <div className="space-y-4 w-full">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI-Powered Generation
          </h3>
          <div className="space-y-2 w-full">
            <label htmlFor="ai-prompt" className="text-sm font-medium">Custom AI Prompt (Optional)</label>
            <textarea
              id="ai-prompt"
              value={settings.aiPrompt}
              onChange={handleAIPromptChange}
              placeholder="Add specific instructions for word search generation..."
              className="w-full px-3 py-2 h-[100px] rounded-md bg-background border border-input hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
              style={{ width: '100%', boxSizing: 'border-box' }}
              aria-label="AI Prompt"
            />
            <p className="text-xs text-muted-foreground">
              Provide additional guidance for the AI to generate your word search book. 
              Example: "Create a word search book with nature themes, including words related to forests, oceans, and mountains. Suitable for children aged 8-12."
            </p>
          </div>
        </div>
        
        {/* Generate Button */}
        <div className="flex justify-end w-full">
          <Button 
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            onClick={onGenerate}
            disabled={generationStatus === 'generating'}
          >
            {generationStatus === 'generating' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <PenLine className="mr-2 h-4 w-4" />
                Generate Word Search PDF
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </MotionCard>
  );
};

export const WordSearchCompletionStatus = ({ 
  status, 
  bookFormat = 'PDF', 
  onDownload, 
  onTryAgain,
  onViewPreview,
  progress = 100,
  error = ''
}: {
  status: 'complete' | 'error',
  bookFormat?: string,
  onDownload: () => void,
  onTryAgain: () => void,
  onViewPreview?: () => void,
  progress?: number,
  error?: string
}) => {
  return (
    <MotionCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative backdrop-blur-3xl border-primary/20 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-transparent" />
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          {status === 'complete' && (
            <>
              <div className="rounded-full bg-green-100 p-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-green-600">Book Generation Complete!</h3>
                <p className="text-sm text-muted-foreground">Your word search book is ready to download</p>
                {progress < 100 && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {onViewPreview && (
                  <Button 
                    onClick={onViewPreview}
                    variant="outline"
                  >
                    <PenLine className="mr-2 h-4 w-4" />
                    View Preview
                  </Button>
                )}
                <Button 
                  onClick={onDownload}
                  className="bg-gradient-to-r from-primary to-secondary"
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  Download {bookFormat}
                </Button>
              </div>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="rounded-full bg-red-100 p-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-red-600">Generation Error</h3>
                <p className="text-sm text-muted-foreground">
                  {error || "There was a problem generating your word search book. Please try again."}
                </p>
              </div>
              <Button 
                onClick={onTryAgain}
                variant="outline"
              >
                Try Again
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </MotionCard>
  );
}; 