import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BookText,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  WordSearchForm, 
  WordSearchCompletionStatus, 
  WordSearchSettings, 
  defaultWordSearchSettings 
} from './puzzles/WordSearch';
import { WordSearchPreview } from './puzzles/WordSearchPreview';

type PuzzleType = {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
};

const puzzleTypes: PuzzleType[] = [
  {
    id: 'word-search',
    name: 'Word Search',
    description: 'Create word search puzzles with custom themes and words',
    icon: BookText
  }
];

const MotionCard = motion(Card);

export const PuzzleGenerator = () => {
  // State for selection and generation
  const [selectedPuzzleType, setSelectedPuzzleType] = useState<string>('word-search');
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'generating' | 'complete' | 'error'>('idle');
  const [showPreview, setShowPreview] = useState(false);
  
  // Word Search settings
  const [wordSearchSettings, setWordSearchSettings] = useState<WordSearchSettings>(defaultWordSearchSettings);

  // Handle back to selection
  const handleBackToSelection = () => {
    setSelectedPuzzleType('word-search');
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
  const handleGeneratePuzzle = () => {
    // Validate title
    if (!wordSearchSettings.title.trim()) {
      alert('Please enter a book title');
      return;
    }
    
    setGenerationStatus('generating');
    
    // Simulate puzzle generation with a delay
    setTimeout(() => {
      const success = Math.random() > 0.1; // 90% success rate for demo
      if (success) {
        setGenerationStatus('complete');
        setShowPreview(true); // Show preview when generation is complete
      } else {
        setGenerationStatus('error');
      }
    }, 2000);
  };

  // Handle preview toggle
  const handleTogglePreview = () => {
    setShowPreview(!showPreview);
  };

  // Handle download
  const handleDownload = () => {
    if (generationStatus !== 'complete') return;
    
    alert(`Downloading "${wordSearchSettings.title}" word search book with ${wordSearchSettings.quantity} puzzles as PDF`);
    
    // Reset after download
    setGenerationStatus('idle');
    setSelectedPuzzleType('word-search');
    setShowPreview(false);
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

      {/* Status display when complete or error */}
      {(generationStatus === 'complete' || generationStatus === 'error') && !showPreview && (
        <WordSearchCompletionStatus 
          status={generationStatus as 'complete' | 'error'}
          onDownload={handleDownload}
          onTryAgain={() => setGenerationStatus('idle')}
          onViewPreview={handleTogglePreview}
        />
      )}

      {/* Preview section */}
      {showPreview && (
        <WordSearchPreview 
          settings={wordSearchSettings}
          onDownload={handleDownload}
        />
      )}

      {/* Show form if a puzzle type is selected, otherwise show selection */}
      {selectedPuzzleType === 'word-search' && !showPreview ? (
        <WordSearchForm 
          settings={wordSearchSettings}
          onSettingChange={handleWordSearchSettingChange}
          onBack={handleBackToSelection}
          onGenerate={handleGeneratePuzzle}
          generationStatus={generationStatus}
        />
      ) : showPreview ? (
        <div className="flex justify-center mt-6">
          <Button 
            onClick={() => setShowPreview(false)}
            variant="outline"
            className="bg-white/10 backdrop-blur-xl"
          >
            Back to Settings
          </Button>
        </div>
      ) : (
        // Selection screen - only show Word Search for now
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
              onClick={() => setSelectedPuzzleType(puzzleType.id)}
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