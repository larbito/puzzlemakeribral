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
  PenLine
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const MotionCard = motion(Card);

export type WordSearchSettings = {
  // Book settings
  title: string;
  pageSize: string;
  puzzlesPerPage: number;
  includePageNumbers: boolean;
  includeAnswers: boolean;
  
  // WordSearch specific settings
  theme: string;
  customWords: string;
  difficulty: string;
  quantity: number;
  aiPrompt: string;
};

export const defaultWordSearchSettings: WordSearchSettings = {
  // Default book settings
  title: '',
  pageSize: 'letter',
  puzzlesPerPage: 1,
  includePageNumbers: true,
  includeAnswers: true,
  
  // Default WordSearch specific settings
  theme: '',
  customWords: '',
  difficulty: 'medium',
  quantity: 20,
  aiPrompt: ''
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
  // Handlers for each input
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingChange('title', e.target.value);
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSettingChange('pageSize', e.target.value);
  };

  const handlePuzzlesPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSettingChange('puzzlesPerPage', parseInt(e.target.value));
  };

  const handlePageNumbersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingChange('includePageNumbers', e.target.checked);
  };

  const handleIncludeAnswersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingChange('includeAnswers', e.target.checked);
  };

  const handleThemeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingChange('theme', e.target.value);
  };

  const handleDifficultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSettingChange('difficulty', e.target.value);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingChange('quantity', parseInt(e.target.value));
  };

  const handleCustomWordsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onSettingChange('customWords', e.target.value);
  };

  const handleAIPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onSettingChange('aiPrompt', e.target.value);
  };

  return (
    <MotionCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative backdrop-blur-3xl border-primary/20 overflow-hidden w-full max-w-full"
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
          <CardTitle className="text-xl">Word Search Book</CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 w-full">
        {/* Book Settings Section */}
        <div className="space-y-4 w-full">
          <h3 className="text-lg font-medium">Book Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <div className="space-y-2 w-full">
              <label htmlFor="book-title" className="text-sm font-medium">Book Title</label>
              <input
                id="book-title"
                type="text"
                value={settings.title}
                onChange={handleTitleChange}
                placeholder="Enter a title for your puzzle book"
                className="w-full px-3 py-2 rounded-md bg-white/5 border border-primary/20 text-foreground"
                style={{ width: '100%', boxSizing: 'border-box' }}
                aria-label="Book Title"
              />
            </div>
            <div className="space-y-2 w-full">
              <label htmlFor="page-size" className="text-sm font-medium">Page Size</label>
              <select 
                id="page-size"
                className="w-full px-3 py-2 rounded-md bg-white/5 border border-primary/20 text-foreground"
                value={settings.pageSize}
                onChange={handlePageSizeChange}
                style={{ width: '100%', boxSizing: 'border-box' }}
                aria-label="Page Size"
              >
                <option value="letter">Letter (8.5 x 11 in)</option>
                <option value="a4">A4 (210 x 297 mm)</option>
                <option value="5x8">5 x 8 in</option>
                <option value="6x9">6 x 9 in</option>
                <option value="7x10">7 x 10 in</option>
                <option value="8x10">8 x 10 in</option>
                <option value="825x825">8.25 x 8.25 in</option>
                <option value="85x11">8.5 x 11 in</option>
              </select>
            </div>
            <div className="space-y-2 w-full">
              <label htmlFor="puzzles-per-page" className="text-sm font-medium">Puzzles Per Page</label>
              <select 
                id="puzzles-per-page"
                className="w-full px-3 py-2 rounded-md bg-white/5 border border-primary/20 text-foreground"
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
            <div className="col-span-1 sm:col-span-2 flex flex-wrap gap-6">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="include-page-numbers"
                  checked={settings.includePageNumbers}
                  onChange={handlePageNumbersChange}
                  className="h-4 w-4 rounded border-primary/20 bg-white/5"
                  aria-label="Include Page Numbers"
                />
                <label htmlFor="include-page-numbers" className="text-sm">
                  Add page numbers
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="include-answers"
                  checked={settings.includeAnswers}
                  onChange={handleIncludeAnswersChange}
                  className="h-4 w-4 rounded border-primary/20 bg-white/5"
                  aria-label="Include Answer Key"
                />
                <label htmlFor="include-answers" className="text-sm">
                  Include answer key
                </label>
              </div>
            </div>
          </div>
        </div>
        
        {/* Word Search Specific Settings */}
        <div className="space-y-4 w-full">
          <h3 className="text-lg font-medium">Word Search Settings</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <div className="space-y-2 w-full">
              <label htmlFor="theme" className="text-sm font-medium">Theme</label>
              <input
                id="theme"
                type="text"
                value={settings.theme}
                onChange={handleThemeChange}
                placeholder="e.g., Animals, Space, Sports"
                className="w-full px-3 py-2 rounded-md bg-white/5 border border-primary/20 text-foreground"
                style={{ width: '100%', boxSizing: 'border-box' }}
                aria-label="Theme"
              />
            </div>
            <div className="space-y-2 w-full">
              <label htmlFor="difficulty" className="text-sm font-medium">Difficulty Level</label>
              <select 
                id="difficulty"
                className="w-full px-3 py-2 rounded-md bg-white/5 border border-primary/20 text-foreground"
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
                className="w-full px-3 py-2 rounded-md bg-white/5 border border-primary/20 text-foreground"
                style={{ width: '100%', boxSizing: 'border-box' }}
                aria-label="Number of Puzzles"
              />
            </div>
            <div className="space-y-2 col-span-1 sm:col-span-2 w-full">
              <label htmlFor="custom-words" className="text-sm font-medium">Custom Words (Optional)</label>
              <textarea
                id="custom-words"
                value={settings.customWords}
                onChange={handleCustomWordsChange}
                placeholder="Enter words separated by commas"
                className="w-full px-3 py-2 h-[80px] rounded-md bg-white/5 border border-primary/20 text-foreground"
                style={{ width: '100%', boxSizing: 'border-box' }}
                aria-label="Custom Words"
              />
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
              className="w-full px-3 py-2 h-[100px] rounded-md bg-white/5 border border-primary/20 text-foreground"
              style={{ width: '100%', boxSizing: 'border-box' }}
              aria-label="AI Prompt"
            />
            <p className="text-xs text-muted-foreground">
              Provide additional guidance for the AI to generate your word search book. 
              Example: "Create a word search book with nature themes, including words related to forests, oceans, and mountains."
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
  onViewPreview 
}: {
  status: 'complete' | 'error',
  bookFormat?: string,
  onDownload: () => void,
  onTryAgain: () => void,
  onViewPreview?: () => void
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
                <p className="text-sm text-muted-foreground">There was a problem generating your word search book. Please try again.</p>
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