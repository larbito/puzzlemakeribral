import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Puzzle as PuzzleIcon, 
  Grid, 
  BookText, 
  FileDown, 
  Settings as SettingsIcon,
  AlertCircle,
  CheckCircle,
  Loader2,
  ChevronRight,
  SquareDot,
  ScanText,
  ArrowLeft,
  Sparkles,
  PenLine
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type PuzzleType = {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
};

const puzzleTypes: PuzzleType[] = [
  {
    id: 'sudoku',
    name: 'Sudoku Puzzles',
    description: 'Generate classic sudoku puzzles of varying difficulty levels',
    icon: Grid
  },
  {
    id: 'word-search',
    name: 'Word Search',
    description: 'Create word search puzzles with custom themes and words',
    icon: BookText
  },
  {
    id: 'crossword',
    name: 'Crossword',
    description: 'Generate crossword puzzles with custom clues and answers',
    icon: PuzzleIcon
  },
  {
    id: 'maze',
    name: 'Maze',
    description: 'Create intricate maze puzzles with adjustable complexity',
    icon: PuzzleIcon
  },
  {
    id: 'dot-to-dot',
    name: 'Connect the Dots',
    description: 'Create connect-the-dots puzzles that reveal hidden images',
    icon: SquareDot
  },
  {
    id: 'word-scramble',
    name: 'Word Scramble',
    description: 'Generate word scramble puzzles with jumbled letters to unscramble',
    icon: ScanText
  }
];

const MotionCard = motion(Card);

export const PuzzleGenerator = () => {
  // State for multi-step workflow
  const [selectedPuzzleType, setSelectedPuzzleType] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'generating' | 'complete' | 'error'>('idle');
  
  // Book-specific settings (common across all puzzle types)
  const [bookSettings, setBookSettings] = useState({
    title: '',
    pageSize: 'letter',
    puzzlesPerPage: 1,
    includePageNumbers: true,
    addBookCover: true,
    bookFormat: 'pdf'
  });

  // Puzzle-specific settings
  const [puzzleSettings, setPuzzleSettings] = useState({
    // Sudoku settings
    sudokuDifficulty: 'medium',
    sudokuQuantity: 30,
    sudokuShowHints: false,
    
    // Word search settings
    wordSearchTheme: '',
    wordSearchCustomWords: '',
    wordSearchDifficulty: 'medium',
    wordSearchQuantity: 20,
    
    // Crossword settings
    crosswordTheme: '',
    crosswordDifficulty: 'medium',
    crosswordQuantity: 15,
    
    // Maze settings
    mazeDifficulty: 'medium',
    mazeQuantity: 25,
    mazeStyle: 'square',
    
    // Connect the dots settings
    dotsTheme: '',
    dotsQuantity: 20,
    dotsComplexity: 'medium',
    
    // Word scramble settings
    scrambleTheme: '',
    scrambleDifficulty: 'medium',
    scrambleQuantity: 25,
    
    // Common settings
    aiPrompt: '',
    includeAnswers: true,
  });

  // Handle back to selection
  const handleBackToSelection = () => {
    setSelectedPuzzleType(null);
    setGenerationStatus('idle');
  };

  // Handle form input changes for book settings
  const handleBookSettingChange = (key: string, value: any) => {
    setBookSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle form input changes for puzzle settings
  const handlePuzzleSettingChange = (key: string, value: any) => {
    setPuzzleSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handlePuzzleTypeSelect = (puzzleId: string) => {
    setSelectedPuzzleType(puzzleId);
  };

  const handleGeneratePuzzles = () => {
    if (!selectedPuzzleType) {
      alert('Please select a puzzle type first');
      return;
    }
    
    // Validate required fields
    if (!bookSettings.title.trim()) {
      alert('Please enter a book title');
      return;
    }
    
    setGenerationStatus('generating');
    
    // Simulate puzzle generation with a delay
    setTimeout(() => {
      const success = Math.random() > 0.1; // 90% success rate for demo
      if (success) {
        setGenerationStatus('complete');
      } else {
        setGenerationStatus('error');
      }
    }, 2000);
  };

  const handleDownload = () => {
    if (generationStatus !== 'complete') return;
    
    const selectedPuzzle = puzzleTypes.find(p => p.id === selectedPuzzleType);
    const puzzleName = selectedPuzzle ? selectedPuzzle.name : selectedPuzzleType;
    
    alert(`Downloading "${bookSettings.title}" puzzle book with ${getSelectedPuzzleQuantity()} ${puzzleName} puzzles in ${bookSettings.bookFormat.toUpperCase()} format`);
    
    // Reset after download
    setGenerationStatus('idle');
  };

  // Helper to get the quantity based on the selected puzzle type
  const getSelectedPuzzleQuantity = () => {
    switch(selectedPuzzleType) {
      case 'sudoku':
        return puzzleSettings.sudokuQuantity;
      case 'word-search':
        return puzzleSettings.wordSearchQuantity;
      case 'crossword':
        return puzzleSettings.crosswordQuantity;
      case 'maze':
        return puzzleSettings.mazeQuantity;
      case 'dot-to-dot':
        return puzzleSettings.dotsQuantity;
      case 'word-scramble':
        return puzzleSettings.scrambleQuantity;
      default:
        return 0;
    }
  };

  // Render the appropriate settings form based on selected puzzle type
  const renderPuzzleSettingsForm = () => {
    if (!selectedPuzzleType) return null;
    
    const selectedPuzzle = puzzleTypes.find(p => p.id === selectedPuzzleType);
    if (!selectedPuzzle) return null;
    
    return (
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative backdrop-blur-3xl border-primary/20 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-transparent" />
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackToSelection}
            className="mr-2 h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary text-white">
              <selectedPuzzle.icon className="h-5 w-5" />
            </div>
            <CardTitle className="text-xl">{selectedPuzzle.name} Book</CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Book Settings Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Book Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Book Title</label>
                <input
                  type="text"
                  value={bookSettings.title}
                  onChange={(e) => handleBookSettingChange('title', e.target.value)}
                  placeholder="Enter a title for your puzzle book"
                  className="w-full px-3 py-2 rounded-md bg-white/5 border border-primary/20 text-foreground"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Page Size</label>
                <select 
                  className="w-full px-3 py-2 rounded-md bg-white/5 border border-primary/20 text-foreground"
                  value={bookSettings.pageSize}
                  onChange={(e) => handleBookSettingChange('pageSize', e.target.value)}
                >
                  <option value="letter">Letter (8.5 x 11 in)</option>
                  <option value="a4">A4 (210 x 297 mm)</option>
                  <option value="a5">A5 (148 x 210 mm)</option>
                  <option value="6x9">KDP 6 x 9 in</option>
                  <option value="8x10">KDP 8 x 10 in</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Book Format</label>
                <select 
                  className="w-full px-3 py-2 rounded-md bg-white/5 border border-primary/20 text-foreground"
                  value={bookSettings.bookFormat}
                  onChange={(e) => handleBookSettingChange('bookFormat', e.target.value)}
                >
                  <option value="pdf">PDF Book</option>
                  <option value="printable">Printable Sheets</option>
                  <option value="kdp">KDP Ready</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Puzzles Per Page</label>
                <select 
                  className="w-full px-3 py-2 rounded-md bg-white/5 border border-primary/20 text-foreground"
                  value={bookSettings.puzzlesPerPage}
                  onChange={(e) => handleBookSettingChange('puzzlesPerPage', parseInt(e.target.value))}
                >
                  <option value="1">1 per page</option>
                  <option value="2">2 per page</option>
                  <option value="4">4 per page</option>
                </select>
              </div>
              <div className="col-span-2 flex space-x-6">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="include-page-numbers"
                    checked={bookSettings.includePageNumbers}
                    onChange={(e) => handleBookSettingChange('includePageNumbers', e.target.checked)}
                    className="h-4 w-4 rounded border-primary/20 bg-white/5"
                  />
                  <label htmlFor="include-page-numbers" className="text-sm">
                    Add page numbers
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="add-book-cover"
                    checked={bookSettings.addBookCover}
                    onChange={(e) => handleBookSettingChange('addBookCover', e.target.checked)}
                    className="h-4 w-4 rounded border-primary/20 bg-white/5"
                  />
                  <label htmlFor="add-book-cover" className="text-sm">
                    Generate book cover
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="include-answers"
                    checked={puzzleSettings.includeAnswers}
                    onChange={(e) => handlePuzzleSettingChange('includeAnswers', e.target.checked)}
                    className="h-4 w-4 rounded border-primary/20 bg-white/5"
                  />
                  <label htmlFor="include-answers" className="text-sm">
                    Include answer key
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          {/* Puzzle Specific Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Puzzle Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedPuzzleType === 'sudoku' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Difficulty Level</label>
                    <select 
                      className="w-full px-3 py-2 rounded-md bg-white/5 border border-primary/20 text-foreground"
                      value={puzzleSettings.sudokuDifficulty}
                      onChange={(e) => handlePuzzleSettingChange('sudokuDifficulty', e.target.value)}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                      <option value="expert">Expert</option>
                      <option value="mixed">Mixed Levels</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Number of Puzzles</label>
                    <input
                      type="number"
                      min="5"
                      max="100"
                      value={puzzleSettings.sudokuQuantity}
                      onChange={(e) => handlePuzzleSettingChange('sudokuQuantity', parseInt(e.target.value))}
                      className="w-full px-3 py-2 rounded-md bg-white/5 border border-primary/20 text-foreground"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="show-hints"
                        checked={puzzleSettings.sudokuShowHints}
                        onChange={(e) => handlePuzzleSettingChange('sudokuShowHints', e.target.checked)}
                        className="h-4 w-4 rounded border-primary/20 bg-white/5"
                      />
                      <label htmlFor="show-hints" className="text-sm">
                        Include starter hints
                      </label>
                    </div>
                  </div>
                </>
              )}
              
              {selectedPuzzleType === 'word-search' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Theme</label>
                    <input
                      type="text"
                      value={puzzleSettings.wordSearchTheme}
                      onChange={(e) => handlePuzzleSettingChange('wordSearchTheme', e.target.value)}
                      placeholder="e.g., Animals, Space, Sports"
                      className="w-full px-3 py-2 rounded-md bg-white/5 border border-primary/20 text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Difficulty Level</label>
                    <select 
                      className="w-full px-3 py-2 rounded-md bg-white/5 border border-primary/20 text-foreground"
                      value={puzzleSettings.wordSearchDifficulty}
                      onChange={(e) => handlePuzzleSettingChange('wordSearchDifficulty', e.target.value)}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                      <option value="mixed">Mixed Levels</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Number of Puzzles</label>
                    <input
                      type="number"
                      min="5"
                      max="100"
                      value={puzzleSettings.wordSearchQuantity}
                      onChange={(e) => handlePuzzleSettingChange('wordSearchQuantity', parseInt(e.target.value))}
                      className="w-full px-3 py-2 rounded-md bg-white/5 border border-primary/20 text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Custom Words (Optional)</label>
                    <textarea
                      value={puzzleSettings.wordSearchCustomWords}
                      onChange={(e) => handlePuzzleSettingChange('wordSearchCustomWords', e.target.value)}
                      placeholder="Enter words separated by commas"
                      className="w-full px-3 py-2 h-[80px] rounded-md bg-white/5 border border-primary/20 text-foreground"
                    />
                  </div>
                </>
              )}
              
              {selectedPuzzleType === 'crossword' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Theme</label>
                    <input
                      type="text"
                      value={puzzleSettings.crosswordTheme}
                      onChange={(e) => handlePuzzleSettingChange('crosswordTheme', e.target.value)}
                      placeholder="e.g., Movies, Geography, Music"
                      className="w-full px-3 py-2 rounded-md bg-white/5 border border-primary/20 text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Difficulty Level</label>
                    <select 
                      className="w-full px-3 py-2 rounded-md bg-white/5 border border-primary/20 text-foreground"
                      value={puzzleSettings.crosswordDifficulty}
                      onChange={(e) => handlePuzzleSettingChange('crosswordDifficulty', e.target.value)}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                      <option value="mixed">Mixed Levels</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Number of Puzzles</label>
                    <input
                      type="number"
                      min="5"
                      max="50"
                      value={puzzleSettings.crosswordQuantity}
                      onChange={(e) => handlePuzzleSettingChange('crosswordQuantity', parseInt(e.target.value))}
                      className="w-full px-3 py-2 rounded-md bg-white/5 border border-primary/20 text-foreground"
                    />
                  </div>
                </>
              )}
              
              {selectedPuzzleType === 'maze' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Maze Style</label>
                    <select 
                      className="w-full px-3 py-2 rounded-md bg-white/5 border border-primary/20 text-foreground"
                      value={puzzleSettings.mazeStyle}
                      onChange={(e) => handlePuzzleSettingChange('mazeStyle', e.target.value)}
                    >
                      <option value="square">Square Grid</option>
                      <option value="circular">Circular</option>
                      <option value="hex">Hexagonal</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Difficulty Level</label>
                    <select 
                      className="w-full px-3 py-2 rounded-md bg-white/5 border border-primary/20 text-foreground"
                      value={puzzleSettings.mazeDifficulty}
                      onChange={(e) => handlePuzzleSettingChange('mazeDifficulty', e.target.value)}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                      <option value="extreme">Extreme</option>
                      <option value="mixed">Mixed Levels</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Number of Puzzles</label>
                    <input
                      type="number"
                      min="5"
                      max="100"
                      value={puzzleSettings.mazeQuantity}
                      onChange={(e) => handlePuzzleSettingChange('mazeQuantity', parseInt(e.target.value))}
                      className="w-full px-3 py-2 rounded-md bg-white/5 border border-primary/20 text-foreground"
                    />
                  </div>
                </>
              )}
              
              {selectedPuzzleType === 'dot-to-dot' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Theme</label>
                    <input
                      type="text"
                      value={puzzleSettings.dotsTheme}
                      onChange={(e) => handlePuzzleSettingChange('dotsTheme', e.target.value)}
                      placeholder="e.g., Animals, Vehicles, Nature"
                      className="w-full px-3 py-2 rounded-md bg-white/5 border border-primary/20 text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Complexity Level</label>
                    <select 
                      className="w-full px-3 py-2 rounded-md bg-white/5 border border-primary/20 text-foreground"
                      value={puzzleSettings.dotsComplexity}
                      onChange={(e) => handlePuzzleSettingChange('dotsComplexity', e.target.value)}
                    >
                      <option value="simple">Simple (fewer dots)</option>
                      <option value="medium">Medium</option>
                      <option value="complex">Complex (many dots)</option>
                      <option value="mixed">Mixed Levels</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Number of Puzzles</label>
                    <input
                      type="number"
                      min="5"
                      max="50"
                      value={puzzleSettings.dotsQuantity}
                      onChange={(e) => handlePuzzleSettingChange('dotsQuantity', parseInt(e.target.value))}
                      className="w-full px-3 py-2 rounded-md bg-white/5 border border-primary/20 text-foreground"
                    />
                  </div>
                </>
              )}
              
              {selectedPuzzleType === 'word-scramble' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Theme</label>
                    <input
                      type="text"
                      value={puzzleSettings.scrambleTheme}
                      onChange={(e) => handlePuzzleSettingChange('scrambleTheme', e.target.value)}
                      placeholder="e.g., Food, Countries, Movies"
                      className="w-full px-3 py-2 rounded-md bg-white/5 border border-primary/20 text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Difficulty Level</label>
                    <select 
                      className="w-full px-3 py-2 rounded-md bg-white/5 border border-primary/20 text-foreground"
                      value={puzzleSettings.scrambleDifficulty}
                      onChange={(e) => handlePuzzleSettingChange('scrambleDifficulty', e.target.value)}
                    >
                      <option value="easy">Easy (shorter words)</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard (longer words)</option>
                      <option value="mixed">Mixed Levels</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Number of Puzzles</label>
                    <input
                      type="number"
                      min="5"
                      max="100"
                      value={puzzleSettings.scrambleQuantity}
                      onChange={(e) => handlePuzzleSettingChange('scrambleQuantity', parseInt(e.target.value))}
                      className="w-full px-3 py-2 rounded-md bg-white/5 border border-primary/20 text-foreground"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* AI Prompt Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI-Powered Generation
            </h3>
            <div className="space-y-2">
              <label className="text-sm font-medium">Custom AI Prompt (Optional)</label>
              <textarea
                value={puzzleSettings.aiPrompt}
                onChange={(e) => handlePuzzleSettingChange('aiPrompt', e.target.value)}
                placeholder={`Add specific instructions for ${selectedPuzzle.name.toLowerCase()} generation...`}
                className="w-full px-3 py-2 h-[100px] rounded-md bg-white/5 border border-primary/20 text-foreground"
              />
              <p className="text-xs text-muted-foreground">
                Provide additional guidance for the AI to generate your puzzle book. 
                Example: "Create a word search book with nature themes, including words related to forests, oceans, and mountains."
              </p>
            </div>
          </div>
          
          {/* Generate Button */}
          <div className="flex justify-end">
            <Button 
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
              onClick={handleGeneratePuzzles}
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
                  Generate {selectedPuzzle.name} Book
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </MotionCard>
    );
  };

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Puzzle Book Generator</h2>
          <p className="text-muted-foreground">Create custom puzzle collections for print or digital books</p>
        </div>
      </div>

      {/* Status display when generating or complete */}
      {generationStatus !== 'idle' && generationStatus !== 'generating' && (
        <MotionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative backdrop-blur-3xl border-primary/20 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-transparent" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              {generationStatus === 'complete' && (
                <>
                  <div className="rounded-full bg-green-100 p-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-green-600">Book Generation Complete!</h3>
                    <p className="text-sm text-muted-foreground">Your puzzle book is ready to download</p>
                  </div>
                  <Button 
                    onClick={handleDownload}
                    className="bg-gradient-to-r from-primary to-secondary"
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Download {bookSettings.bookFormat.toUpperCase()}
                  </Button>
                </>
              )}
              
              {generationStatus === 'error' && (
                <>
                  <div className="rounded-full bg-red-100 p-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-red-600">Generation Error</h3>
                    <p className="text-sm text-muted-foreground">There was a problem generating your puzzles. Please try again.</p>
                  </div>
                  <Button 
                    onClick={() => setGenerationStatus('idle')}
                    variant="outline"
                  >
                    Try Again
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </MotionCard>
      )}

      {/* Show settings form if a puzzle type is selected, otherwise show puzzle type selection */}
      {selectedPuzzleType ? (
        renderPuzzleSettingsForm()
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {puzzleTypes.map((puzzleType) => (
            <MotionCard
              key={puzzleType.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "relative cursor-pointer overflow-hidden hover:shadow-lg border-2 border-transparent hover:border-primary/20"
              )}
              onClick={() => handlePuzzleTypeSelect(puzzleType.id)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-transparent opacity-50" />
              
              <CardHeader className="flex flex-row items-start space-y-0 pb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-white/5 backdrop-blur-xl">
                      <puzzleType.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{puzzleType.name}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <CardDescription className="min-h-[40px]">{puzzleType.description}</CardDescription>
              </CardContent>
            </MotionCard>
          ))}
        </div>
      )}
    </div>
  );
}; 