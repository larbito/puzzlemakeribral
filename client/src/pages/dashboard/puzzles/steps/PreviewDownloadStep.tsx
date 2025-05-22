import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  FileDown,
  Eye,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  BookOpen,
  List
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { WordSearchSettings } from '../WordSearch';
import { cn } from '@/lib/utils';
import { WordSearchPreview } from '../WordSearchPreview';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ThemeData {
  id: string;
  name: string;
  words: string[];
}

interface PreviewDownloadStepProps {
  settings: WordSearchSettings;
  onGeneratePuzzle: () => void;
  generationStatus: 'idle' | 'generating' | 'complete' | 'error';
  downloadUrl: string | null;
  generationError: string;
  onTryAgain: () => void;
  onDownload: () => void;
}

const MotionCard = motion(Card);

export const PreviewDownloadStep: React.FC<PreviewDownloadStepProps> = ({
  settings,
  onGeneratePuzzle,
  generationStatus,
  downloadUrl,
  generationError,
  onTryAgain,
  onDownload,
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [themes, setThemes] = useState<ThemeData[]>([]);

  // Parse themes from customWords if in JSON format
  useEffect(() => {
    try {
      if (settings.customWords && settings.customWords.startsWith('[')) {
        const parsedThemes = JSON.parse(settings.customWords);
        if (Array.isArray(parsedThemes)) {
          setThemes(parsedThemes);
        }
      }
    } catch (error) {
      console.error('Error parsing themes:', error);
    }
  }, [settings.customWords]);

  // Simulate progress updates
  useEffect(() => {
    if (generationStatus === 'generating') {
      const interval = setInterval(() => {
        setGenerationProgress(prev => {
          const nextProgress = prev + Math.random() * 10;
          return nextProgress > 95 ? 95 : nextProgress;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    } else if (generationStatus === 'complete') {
      setGenerationProgress(100);
    } else {
      setGenerationProgress(0);
    }
  }, [generationStatus]);

  // Function to get a word count summary for all themes
  const getTotalWordCount = () => {
    if (themes.length === 0) {
      return settings.customWords ? 
        settings.customWords.split(',').filter(w => w.trim().length > 0).length : 
        0;
    }
    
    return themes.reduce((total, theme) => total + theme.words.length, 0);
  };

  return (
    <Card className="w-full border-0 shadow-none">
      <CardContent className="p-0">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileDown className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Preview & Download</h2>
        </div>

        {/* Book Summary */}
        {(generationStatus === 'idle' || generationStatus === 'error') && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Book Summary</h3>
              <Separator />

              <div className="bg-secondary/10 p-6 rounded-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-lg">{settings.title || 'Untitled Book'}</h4>
                    {settings.subtitle && <p className="text-muted-foreground">{settings.subtitle}</p>}
                    {settings.authorName && <p className="mt-1">By {settings.authorName}</p>}
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="bg-primary/5">
                        {themes.length > 0 ? `${themes.length} themes` : 'Single theme'}
                      </Badge>
                      <Badge variant="outline" className="bg-primary/5">
                        {settings.quantity} puzzles
                      </Badge>
                      <Badge variant="outline" className="bg-primary/5">
                        {settings.pageSize} format
                      </Badge>
                      <Badge variant="outline" className="bg-primary/5">
                        {settings.gridSize}x{settings.gridSize} grid
                      </Badge>
                      <Badge variant="outline" className="bg-primary/5">
                        {settings.difficulty} difficulty
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      {settings.directions.horizontal && (
                        <Badge variant="secondary">Horizontal</Badge>
                      )}
                      {settings.directions.vertical && (
                        <Badge variant="secondary">Vertical</Badge>
                      )}
                      {settings.directions.diagonal && (
                        <Badge variant="secondary">Diagonal</Badge>
                      )}
                      {settings.directions.backward && (
                        <Badge variant="secondary">Backward</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Theme Summary */}
                {themes.length > 0 && (
                  <div className="mt-6 pt-4 border-t">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Themes Summary</h4>
                      <Badge variant="outline" className="bg-primary/5">
                        {getTotalWordCount()} total words
                      </Badge>
                    </div>
                    <ScrollArea className="h-[160px] rounded-md border p-4">
                      <div className="space-y-3">
                        {themes.map((theme) => (
                          <div key={theme.id} className="bg-white/20 rounded-md p-3">
                            <div className="flex justify-between mb-2">
                              <h5 className="font-medium">{theme.name}</h5>
                              <Badge variant="secondary" className="text-xs">
                                {theme.words.length} words
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {theme.words.slice(0, 8).map((word, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs bg-white/50">
                                  {word}
                                </Badge>
                              ))}
                              {theme.words.length > 8 && (
                                <Badge variant="outline" className="text-xs">
                                  +{theme.words.length - 8} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                <div className="mt-6 pt-4 border-t">
                  <h4 className="font-medium mb-2">Book Features</h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      {settings.includeCoverPage ? 'Includes title page' : 'No title page'}
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      {settings.includePageNumbers ? 'Includes page numbers' : 'No page numbers'}
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      {settings.includeAnswers ? 'Includes answer keys' : 'No answer keys'}
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      {settings.includeThemeFacts ? 'Includes theme facts' : 'No theme facts'}
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      {settings.interiorTheme === 'light' ? 'Light interior' : 'Dark interior'}
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      {settings.bleed ? 'Includes bleed margin' : 'Standard margin'}
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {generationStatus === 'error' && (
              <div className="bg-red-50 p-4 rounded-md flex items-start mb-6">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-500">Generation Failed</h4>
                  <p className="text-sm text-red-600">{generationError || 'An unexpected error occurred. Please try again.'}</p>
                </div>
              </div>
            )}

            <div className="mt-8 space-y-4">
              <Button
                onClick={onGeneratePuzzle}
                disabled={generationStatus === 'generating'}
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 relative z-10 w-full py-6 text-lg"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Generate Puzzle Book
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Generating your book may take 1-2 minutes depending on size
              </p>
            </div>
          </div>
        )}

        {/* Generation in Progress */}
        {generationStatus === 'generating' && (
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden border-2 border-primary/10"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-transparent" />
            
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="rounded-full bg-primary/10 p-4">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
                
                <div>
                  <h3 className="text-xl font-medium">Generating Your Puzzle Book</h3>
                  <p className="text-muted-foreground mb-4">Please wait while we create your puzzles and PDF</p>
                  
                  <div className="max-w-md mx-auto space-y-2">
                    <Progress 
                      value={generationProgress} 
                      className="h-2" 
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Creating puzzles...</span>
                      <span>{Math.round(generationProgress)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </MotionCard>
        )}

        {/* Generation Complete */}
        {generationStatus === 'complete' && !showPreview && (
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden border-2 border-green-100"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-primary/5 to-transparent" />
            
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="rounded-full bg-green-100 p-3 flex-shrink-0">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-medium text-green-600">Your puzzle book is ready!</h3>
                  <p className="text-muted-foreground mb-4">You can now download or preview your book</p>
                  
                  <Progress 
                    value={100} 
                    className="h-2 bg-gray-100 mb-4" 
                  />
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                    <Button 
                      onClick={() => setShowPreview(true)}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Preview Book
                    </Button>
                    
                    <Button 
                      onClick={onDownload}
                      className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download PDF
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </MotionCard>
        )}

        {/* Preview */}
        {generationStatus === 'complete' && showPreview && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(false)}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Back to Download
              </Button>
              
              <Button 
                onClick={onDownload}
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </div>
            
            <div className="border rounded-md">
              <WordSearchPreview 
                settings={settings} 
                onDownload={onDownload}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 