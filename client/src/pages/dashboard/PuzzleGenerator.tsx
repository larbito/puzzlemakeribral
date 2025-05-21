import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookText,
  Grid3X3,
  GitFork,
  Key,
  Hash,
  Shuffle,
  ArrowLeft
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  WordSearchForm, 
  WordSearchStatus, 
  WordSearchSettings, 
  defaultWordSearchSettings 
} from './puzzles/WordSearch';
import { WordSearchPreview } from './puzzles/WordSearchPreview';
import wordSearchApi from '@/lib/services/wordSearchApi';

type PuzzleType = {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  comingSoon?: boolean;
};

const puzzleTypes: PuzzleType[] = [
  {
    id: 'word-search',
    name: 'Word Search',
    description: 'Create word search puzzles with custom themes and words',
    icon: BookText
  },
  {
    id: 'sudoku',
    name: 'Sudoku',
    description: 'Generate sudoku puzzles with varying levels of difficulty',
    icon: Grid3X3
  },
  {
    id: 'mazes',
    name: 'Mazes',
    description: 'Create challenging maze puzzles of different shapes and sizes',
    icon: GitFork
  },
  {
    id: 'cryptograms',
    name: 'Cryptograms',
    description: 'Generate encoded messages for players to decipher',
    icon: Key
  },
  {
    id: 'crossword',
    name: 'Crossword',
    description: 'Custom crossword puzzles with your own words and clues',
    icon: Hash,
    comingSoon: true
  },
  {
    id: 'word-scramble',
    name: 'Word Scramble',
    description: 'Create word jumbles and letter scramble puzzles',
    icon: Shuffle
  }
];

const MotionCard = motion(Card);

export const PuzzleGenerator = () => {
  // State for selection and generation
  const [selectedPuzzleType, setSelectedPuzzleType] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'generating' | 'complete' | 'error'>('idle');
  const [showPreview, setShowPreview] = useState(false);
  
  // Word Search settings
  const [wordSearchSettings, setWordSearchSettings] = useState<WordSearchSettings>(defaultWordSearchSettings);

  // Add state for download URL and error messages
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string>('');

  // Handle back to selection
  const handleBackToSelection = () => {
    setSelectedPuzzleType(null);
    setGenerationStatus('idle');
    setShowPreview(false);
  };

  // Handle setting changes for WordSearch
  const handleWordSearchSettingChange = (key: keyof WordSearchSettings, value: any) => {
    setWordSearchSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle puzzle generation
  const handleGeneratePuzzle = async () => {
    // Validate title
    if (!wordSearchSettings.title.trim()) {
      alert('Please enter a book title');
      return;
    }
    
    setGenerationStatus('generating');
    
    try {
      // Call API to generate the puzzle book
      const jobId = await wordSearchApi.generateWordSearch(wordSearchSettings);
      
      // Poll for job status
      const result = await wordSearchApi.pollGenerationStatus(jobId, (progress) => {
        // Update progress indicator if needed
        console.log(`Generation progress: ${progress}%`);
      });
      
      // Check final status
      if (result.status === 'completed' && result.downloadUrl) {
        // Store download URL
        setDownloadUrl(result.downloadUrl);
        setGenerationStatus('complete');
        setShowPreview(true); // Show preview when generation is complete
      } else {
        setGenerationError(result.error || 'Failed to generate puzzle book');
        setGenerationStatus('error');
      }
    } catch (error) {
      console.error('Error generating puzzle book:', error);
      setGenerationError('An unexpected error occurred. Please try again.');
      setGenerationStatus('error');
    }
  };

  // Handle preview toggle
  const handleTogglePreview = () => {
    setShowPreview(!showPreview);
  };

  // Handle download
  const handleDownload = () => {
    if (generationStatus !== 'complete' || !downloadUrl) return;
    
    // Open the download URL in a new tab
    window.open(downloadUrl, '_blank');
    
    // Reset after a moment so user can see the download started
    setTimeout(() => {
      setGenerationStatus('idle');
      setSelectedPuzzleType(null);
      setShowPreview(false);
    }, 3000);
  };

  // Handle puzzle type selection
  const handleSelectPuzzleType = (puzzleId: string) => {
    const puzzleType = puzzleTypes.find(p => p.id === puzzleId);
    
    if (puzzleType?.comingSoon) {
      alert(`${puzzleType.name} puzzles are coming soon! Check back later.`);
      return;
    }
    
    setSelectedPuzzleType(puzzleId);
  };

  // Render the content based on selection state
  const renderContent = () => {
    // Show the preview if active
    if (showPreview) {
      return (
        <>
          <WordSearchPreview 
            settings={wordSearchSettings}
            onDownload={handleDownload}
          />
          <div className="flex justify-center mt-6">
            <Button 
              onClick={() => setShowPreview(false)}
              variant="outline"
              className="bg-white/10 backdrop-blur-xl"
            >
              Back to Settings
            </Button>
          </div>
        </>
      );
    }
    
    // Show completion status if applicable
    if ((generationStatus === 'complete' || generationStatus === 'error') && !showPreview) {
      return (
        <WordSearchStatus
          status={generationStatus === 'complete' ? 'complete' : 'error'}
          onDownload={handleDownload}
          onTryAgain={() => setGenerationStatus('idle')}
          onViewPreview={handleTogglePreview}
          error={generationError}
        />
      );
    }
    
    // If a puzzle type is selected, show the corresponding form
    if (selectedPuzzleType) {
      switch (selectedPuzzleType) {
        case 'word-search':
          return (
            <WordSearchForm 
              settings={wordSearchSettings}
              onSettingChange={handleWordSearchSettingChange}
              onBack={handleBackToSelection}
              onGenerate={handleGeneratePuzzle}
              generationStatus={generationStatus}
            />
          );
        case 'sudoku':
        case 'mazes':
        case 'cryptograms':
        case 'word-scramble':
          return (
            <div className="flex flex-col items-center justify-center gap-4 p-8 bg-white/5 backdrop-blur-xl rounded-xl">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">{puzzleTypes.find(p => p.id === selectedPuzzleType)?.name} Generator</h3>
                <p className="text-muted-foreground">This puzzle type is under development.</p>
              </div>
              <Button onClick={handleBackToSelection} variant="default">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Puzzle Selection
              </Button>
            </div>
          );
        default:
          return null;
      }
    }
    
    // If no puzzle type is selected, show the selection screen
    return (
      <>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Which puzzle book do you want to make?</h2>
          <p className="text-muted-foreground">Select a puzzle type to get started</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {puzzleTypes.map((puzzleType) => (
            <MotionCard
              key={puzzleType.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "relative cursor-pointer overflow-hidden hover:shadow-lg border-2 border-transparent hover:border-primary/20",
                puzzleType.comingSoon ? "opacity-80" : ""
              )}
              onClick={() => handleSelectPuzzleType(puzzleType.id)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-transparent opacity-50" />
              
              <CardHeader className="flex flex-row items-start space-y-0 pb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-white/5 backdrop-blur-xl">
                      <puzzleType.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl">{puzzleType.name}</CardTitle>
                      {puzzleType.comingSoon && (
                        <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600 border border-yellow-500/30">
                          Coming Soon
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <CardDescription className="min-h-[40px]">{puzzleType.description}</CardDescription>
              </CardContent>
            </MotionCard>
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="space-y-8 p-8">
      {/* Header - Only shown when a puzzle is selected */}
      {selectedPuzzleType && (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Puzzle Book Generator</h2>
            <p className="text-muted-foreground">Create custom puzzle collections for print or digital books</p>
          </div>
        </div>
      )}

      {/* Main content */}
      {renderContent()}
    </div>
  );
}; 