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
  ScanText
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type PuzzleType = {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  timeEstimate: string;
};

const puzzleTypes: PuzzleType[] = [
  {
    id: 'sudoku',
    name: 'Sudoku Puzzles',
    description: 'Generate classic sudoku puzzles of varying difficulty levels',
    icon: Grid,
    difficulty: 'intermediate',
    timeEstimate: '~30 sec'
  },
  {
    id: 'word-search',
    name: 'Word Search',
    description: 'Create word search puzzles with custom themes and words',
    icon: BookText,
    difficulty: 'beginner',
    timeEstimate: '~20 sec'
  },
  {
    id: 'crossword',
    name: 'Crossword',
    description: 'Generate crossword puzzles with custom clues and answers',
    icon: PuzzleIcon,
    difficulty: 'advanced',
    timeEstimate: '~1 min'
  },
  {
    id: 'maze',
    name: 'Maze',
    description: 'Create intricate maze puzzles with adjustable complexity',
    icon: PuzzleIcon, 
    difficulty: 'beginner',
    timeEstimate: '~15 sec'
  },
  {
    id: 'dot-to-dot',
    name: 'Connect the Dots',
    description: 'Create connect-the-dots puzzles that reveal hidden images',
    icon: SquareDot,
    difficulty: 'beginner',
    timeEstimate: '~25 sec'
  },
  {
    id: 'word-scramble',
    name: 'Word Scramble',
    description: 'Generate word scramble puzzles with jumbled letters to unscramble',
    icon: ScanText,
    difficulty: 'intermediate',
    timeEstimate: '~20 sec'
  }
];

const MotionCard = motion(Card);

export const PuzzleGenerator = () => {
  const [selectedPuzzleType, setSelectedPuzzleType] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'generating' | 'complete' | 'error'>('idle');
  const [showSettings, setShowSettings] = useState(false);
  
  // Enhanced settings for book creation
  const [settings, setSettings] = useState({
    quantity: 10,
    difficulty: 'medium',
    includeAnswers: true,
    pageSize: 'letter',
    puzzlesPerPage: 1,
    includePageNumbers: true,
    addBookCover: true,
    bookFormat: 'pdf'
  });

  const handlePuzzleTypeSelect = (puzzleId: string) => {
    setSelectedPuzzleType(puzzleId);
  };

  const handleGeneratePuzzles = () => {
    if (!selectedPuzzleType) {
      alert('Please select a puzzle type first');
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
    
    alert(`Downloading puzzle book with ${settings.quantity} ${puzzleName} puzzles in ${settings.bookFormat.toUpperCase()} format`);
    
    // Reset after download
    setGenerationStatus('idle');
    setSelectedPuzzleType(null);
  };

  const handleSettingsChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="space-y-8 p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Puzzle Book Generator</h2>
          <p className="text-muted-foreground">Create custom puzzle collections for print or digital books</p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            className="bg-white/5 backdrop-blur-xl hover:bg-white/10"
            onClick={() => setShowSettings(!showSettings)}
          >
            <SettingsIcon className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button 
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            onClick={handleGeneratePuzzles}
            disabled={!selectedPuzzleType || generationStatus === 'generating'}
          >
            {generationStatus === 'generating' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <PuzzleIcon className="mr-2 h-4 w-4" />
                Generate Puzzle Book
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <MotionCard
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative backdrop-blur-3xl border-primary/20 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-transparent" />
          <CardHeader>
            <CardTitle className="text-xl">Book Settings</CardTitle>
            <CardDescription>Configure your puzzle book generation preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Puzzles Quantity</label>
                <select 
                  className="w-full px-3 py-2 rounded-md bg-white/5 border border-primary/20 text-foreground"
                  value={settings.quantity}
                  onChange={(e) => handleSettingsChange('quantity', parseInt(e.target.value))}
                >
                  {[5, 10, 20, 30, 50, 100].map(num => (
                    <option key={num} value={num}>{num} puzzles</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Difficulty</label>
                <select 
                  className="w-full px-3 py-2 rounded-md bg-white/5 border border-primary/20 text-foreground"
                  value={settings.difficulty}
                  onChange={(e) => handleSettingsChange('difficulty', e.target.value)}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Page Size</label>
                <select 
                  className="w-full px-3 py-2 rounded-md bg-white/5 border border-primary/20 text-foreground"
                  value={settings.pageSize}
                  onChange={(e) => handleSettingsChange('pageSize', e.target.value)}
                >
                  <option value="letter">Letter (8.5 x 11 in)</option>
                  <option value="a4">A4 (210 x 297 mm)</option>
                  <option value="a5">A5 (148 x 210 mm)</option>
                  <option value="6x9">KDP 6 x 9 in</option>
                  <option value="8x10">KDP 8 x 10 in</option>
                  <option value="custom">Custom Size</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Book Format</label>
                <select 
                  className="w-full px-3 py-2 rounded-md bg-white/5 border border-primary/20 text-foreground"
                  value={settings.bookFormat}
                  onChange={(e) => handleSettingsChange('bookFormat', e.target.value)}
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
                  value={settings.puzzlesPerPage}
                  onChange={(e) => handleSettingsChange('puzzlesPerPage', parseInt(e.target.value))}
                >
                  <option value="1">1 per page</option>
                  <option value="2">2 per page</option>
                  <option value="4">4 per page</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Include Answers</label>
                <div className="flex items-center space-x-2 h-[42px]">
                  <input
                    type="checkbox"
                    id="include-answers"
                    checked={settings.includeAnswers}
                    onChange={(e) => handleSettingsChange('includeAnswers', e.target.checked)}
                    className="h-5 w-5 rounded border-primary/20 bg-white/5"
                  />
                  <label htmlFor="include-answers" className="text-sm text-muted-foreground">
                    Include answer key at the end
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Page Numbers</label>
                <div className="flex items-center space-x-2 h-[42px]">
                  <input
                    type="checkbox"
                    id="include-page-numbers"
                    checked={settings.includePageNumbers}
                    onChange={(e) => handleSettingsChange('includePageNumbers', e.target.checked)}
                    className="h-5 w-5 rounded border-primary/20 bg-white/5"
                  />
                  <label htmlFor="include-page-numbers" className="text-sm text-muted-foreground">
                    Add page numbers
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Book Cover</label>
                <div className="flex items-center space-x-2 h-[42px]">
                  <input
                    type="checkbox"
                    id="add-book-cover"
                    checked={settings.addBookCover}
                    onChange={(e) => handleSettingsChange('addBookCover', e.target.checked)}
                    className="h-5 w-5 rounded border-primary/20 bg-white/5"
                  />
                  <label htmlFor="add-book-cover" className="text-sm text-muted-foreground">
                    Generate book cover
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </MotionCard>
      )}

      {/* Status display when generating or complete */}
      {generationStatus !== 'idle' && (
        <MotionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative backdrop-blur-3xl border-primary/20 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-transparent" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              {generationStatus === 'generating' && (
                <>
                  <div className="rounded-full bg-primary/10 p-2">
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  </div>
                  <div>
                    <h3 className="font-medium">Creating Your Puzzle Book</h3>
                    <p className="text-sm text-muted-foreground">
                      Generating {settings.quantity} {selectedPuzzleType && puzzleTypes.find(p => p.id === selectedPuzzleType)?.name.toLowerCase()} puzzles and formatting your book...
                    </p>
                  </div>
                </>
              )}
              
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
                    Download {settings.bookFormat.toUpperCase()}
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

      {/* Puzzle Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {puzzleTypes.map((puzzleType) => (
          <MotionCard
            key={puzzleType.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "relative cursor-pointer overflow-hidden hover:shadow-lg border-2",
              selectedPuzzleType === puzzleType.id
                ? "border-primary bg-primary/5"
                : "border-transparent hover:border-primary/20"
            )}
            onClick={() => handlePuzzleTypeSelect(puzzleType.id)}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-transparent opacity-50" />
            
            <CardHeader className="flex flex-row items-start space-y-0 pb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "p-2 rounded-lg",
                    selectedPuzzleType === puzzleType.id 
                      ? "bg-primary text-white" 
                      : "bg-white/5 backdrop-blur-xl"
                  )}>
                    <puzzleType.icon className={cn(
                      "h-5 w-5",
                      selectedPuzzleType === puzzleType.id 
                        ? "text-white" 
                        : "text-primary"
                    )} />
                  </div>
                  <CardTitle className="text-xl">{puzzleType.name}</CardTitle>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={cn(
                    "text-xs px-2 py-1 rounded",
                    puzzleType.difficulty === 'beginner' && "bg-green-100 text-green-700",
                    puzzleType.difficulty === 'intermediate' && "bg-amber-100 text-amber-700",
                    puzzleType.difficulty === 'advanced' && "bg-red-100 text-red-700"
                  )}>
                    {puzzleType.difficulty}
                  </span>
                  <span className="text-xs text-muted-foreground">{puzzleType.timeEstimate}</span>
                </div>
              </div>
              
              <div className={cn(
                "h-6 w-6 rounded-full border-2 flex items-center justify-center",
                selectedPuzzleType === puzzleType.id 
                  ? "border-primary bg-primary text-white" 
                  : "border-muted-foreground"
              )}>
                {selectedPuzzleType === puzzleType.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="h-2 w-2 rounded-full bg-white"
                  />
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <CardDescription className="min-h-[40px]">{puzzleType.description}</CardDescription>
              
              <div className="flex justify-end mt-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs text-primary hover:text-primary hover:bg-primary/5"
                  onClick={(e) => {
                    e.stopPropagation();
                    alert(`View ${puzzleType.name} examples`);
                  }}
                >
                  View Examples
                  <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </MotionCard>
        ))}
      </div>
    </div>
  );
}; 