import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  List,
  ChevronLeft,
  ChevronRight,
  FileEdit,
  Mail
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { WordSearchSettings } from '../WordSearch';
import { cn } from '@/lib/utils';
import { WordSearchPreview } from '../WordSearchPreview';
import wordSearchApi from '@/lib/services/wordSearchApi';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface ThemeData {
  id: string;
  name: string;
  words: string[];
  pageCount: number;
  difficulty?: string;
}

interface PreviewDownloadStepProps {
  settings: WordSearchSettings;
  onSettingChange: (key: keyof WordSearchSettings, value: any) => void;
  onGeneratePuzzle?: () => Promise<void>;
  generationStatus?: 'idle' | 'generating' | 'complete' | 'error';
  downloadUrl?: string | null;
  generationError?: string;
  onTryAgain?: () => void;
  onDownload?: () => void;
}

// Simulated preview data for page navigation
interface PreviewPage {
  id: string;
  type: 'cover' | 'title' | 'puzzle' | 'solution';
  themeId?: string;
  themeName?: string;
  puzzleNumber?: number;
  previewImage?: string;
}

// Book mockup component
const BookPreview: React.FC<{ 
  settings: WordSearchSettings;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pages: PreviewPage[];
}> = ({ settings, currentPage, totalPages, onPageChange, pages }) => {
  const currentPageData = pages[currentPage];
  
  return (
    <div className="flex flex-col items-center justify-center">
      {/* Book Navigation */}
      <div className="flex items-center justify-between w-full mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onPageChange(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
          className="flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        
        <span className="text-sm">
          Page {currentPage + 1} of {totalPages}
        </span>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
          disabled={currentPage === totalPages - 1}
          className="flex items-center gap-1"
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Book Page Preview */}
      <div 
        className={`relative w-full max-w-md aspect-[${settings.pageSize === '6x9' ? '6/9' : settings.pageSize === '8.5x11' ? '8.5/11' : '1/1.4'} bg-white shadow-lg rounded-md overflow-hidden border`}
      >
        <div className={`absolute inset-0 ${settings.interiorTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} p-6`}>
          {currentPageData.type === 'cover' && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <h1 className="text-2xl font-bold mb-2">{settings.title}</h1>
              {settings.subtitle && <p className="text-sm mb-4 italic">{settings.subtitle}</p>}
              <p className="mt-auto">By {settings.authorName}</p>
            </div>
          )}
          
          {currentPageData.type === 'title' && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <h1 className="text-2xl font-bold mb-2">{settings.title}</h1>
              {settings.subtitle && <p className="text-sm mb-4 italic">{settings.subtitle}</p>}
              <p className="mt-4">By {settings.authorName}</p>
              <div className="mt-auto text-xs opacity-70">
                Copyright © {new Date().getFullYear()} {settings.authorName}
              </div>
            </div>
          )}
          
          {currentPageData.type === 'puzzle' && (
            <div className="h-full flex flex-col">
              <h2 className="text-lg font-medium text-center mb-4">
                {currentPageData.themeName}
              </h2>
              
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-2 mb-2 text-xs">
                    Puzzle {currentPageData.puzzleNumber}
                  </div>
                  <div className="text-xs">
                    Preview of puzzle layout
                  </div>
                </div>
              </div>
              
              {settings.includePageNumbers && (
                <div className="text-center text-xs mt-auto">
                  {currentPage + 1}
                </div>
              )}
            </div>
          )}
          
          {currentPageData.type === 'solution' && (
            <div className="h-full flex flex-col">
              <h2 className="text-lg font-medium text-center mb-4">
                Solutions: {currentPageData.themeName}
              </h2>
              
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-2 mb-2 text-xs">
                    Solution {currentPageData.puzzleNumber}
                  </div>
                </div>
              </div>
              
              {settings.includePageNumbers && (
                <div className="text-center text-xs mt-auto">
                  {currentPage + 1}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const PreviewDownloadStep: React.FC<PreviewDownloadStepProps> = ({
  settings,
  onSettingChange,
  onGeneratePuzzle,
  generationStatus: injectedStatus,
  downloadUrl: injectedUrl,
  generationError: injectedError,
  onTryAgain,
  onDownload,
}) => {
  const [localGenerationStatus, setLocalGenerationStatus] = useState<'idle' | 'generating' | 'complete' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [localDownloadUrl, setLocalDownloadUrl] = useState<string | null>(null);
  const [localErrorMessage, setLocalErrorMessage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [email, setEmail] = useState('');
  const [sendEmail, setSendEmail] = useState(false);
  const [showThanks, setShowThanks] = useState(false);
  
  // Use injected props if available, otherwise use local state
  const effectiveStatus = injectedStatus || localGenerationStatus;
  const effectiveDownloadUrl = injectedUrl || localDownloadUrl;
  const effectiveError = injectedError || localErrorMessage;
  
  // Parse themes from settings
  const [themes, setThemes] = useState<ThemeData[]>([]);
  const [totalPuzzleCount, setTotalPuzzleCount] = useState(0);
  
  // Generate simulated preview pages
  const [previewPages, setPreviewPages] = useState<PreviewPage[]>([]);
  
  useEffect(() => {
    try {
      if (settings.customWords && settings.customWords.startsWith('[')) {
        const parsedThemes = JSON.parse(settings.customWords);
        if (Array.isArray(parsedThemes)) {
          setThemes(parsedThemes);
          
          // Calculate total pages
          const total = parsedThemes.reduce((sum, theme) => sum + (theme.pageCount || 0), 0);
          setTotalPuzzleCount(total);
          
          // Generate preview pages
          const pages: PreviewPage[] = [];
          
          // Cover page
          if (settings.includeCoverPage) {
            pages.push({
              id: 'cover',
              type: 'cover'
            });
          }
          
          // Title page
          pages.push({
            id: 'title',
            type: 'title'
          });
          
          // Add puzzle pages for each theme
          let puzzleCounter = 1;
          parsedThemes.forEach(theme => {
            for (let i = 0; i < theme.pageCount; i++) {
              pages.push({
                id: `puzzle-${theme.id}-${i}`,
                type: 'puzzle',
                themeId: theme.id,
                themeName: theme.name,
                puzzleNumber: puzzleCounter++
              });
            }
          });
          
          // Add solution pages if enabled
          if (settings.includeAnswers) {
            puzzleCounter = 1;
            parsedThemes.forEach(theme => {
              for (let i = 0; i < theme.pageCount; i++) {
                pages.push({
                  id: `solution-${theme.id}-${i}`,
                  type: 'solution',
                  themeId: theme.id,
                  themeName: theme.name,
                  puzzleNumber: puzzleCounter++
                });
              }
            });
          }
          
          setPreviewPages(pages);
        }
      }
    } catch (error) {
      console.error('Error parsing themes:', error);
    }
  }, [settings.customWords, settings.includeAnswers, settings.includeCoverPage]);
  
  const handlePreview = () => {
    setShowPreview(true);
    setCurrentPage(0);
  };
  
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };
  
  const handleGenerate = async () => {
    if (onGeneratePuzzle) {
      // Use the injected method if available
      onGeneratePuzzle();
      return;
    }
    
    setLocalGenerationStatus('generating');
    setProgress(0);
    setLocalErrorMessage(null);
    setLocalDownloadUrl(null);
    
    try {
      // Start the generation process
      const jobId = await wordSearchApi.generateWordSearch(settings);
      
      // Set up progress polling
      const pollInterval = setInterval(async () => {
        try {
          const status = await wordSearchApi.checkGenerationStatus(jobId);
          setProgress(status.progress);
          
          if (status.status === 'completed') {
            clearInterval(pollInterval);
            setLocalGenerationStatus('complete');
            setLocalDownloadUrl(status.downloadUrl);
          } else if (status.status === 'failed') {
            clearInterval(pollInterval);
            setLocalGenerationStatus('error');
            setLocalErrorMessage(status.error || 'Generation failed for unknown reasons');
          }
        } catch (error) {
          console.error('Error checking generation status:', error);
          clearInterval(pollInterval);
          setLocalGenerationStatus('error');
          setLocalErrorMessage('Error checking generation status');
        }
      }, 2000);
      
      // Simulate progress updates (in real implementation, this would come from the API)
      const simulateProgress = () => {
        setProgress(prev => {
          if (prev < 95) {
            const increment = Math.random() * 5 + 1;
            return Math.min(95, prev + increment);
          }
          return prev;
        });
      };
      
      // Simulation for demo purposes
      const progressSimulator = setInterval(simulateProgress, 1000);
      
      // Simulate completion after some time (for demo)
      setTimeout(() => {
        clearInterval(progressSimulator);
        clearInterval(pollInterval);
        setProgress(100);
        setLocalGenerationStatus('complete');
        setLocalDownloadUrl('/sample-wordsearch-book.pdf'); // Demo URL
      }, 8000);
      
    } catch (error) {
      console.error('Error starting generation:', error);
      setLocalGenerationStatus('error');
      setLocalErrorMessage('Failed to start puzzle book generation');
    }
  };
  
  const handleEmailDelivery = () => {
    // Simulate email delivery
    setShowThanks(true);
    
    // Reset after a few seconds
    setTimeout(() => {
      setShowThanks(false);
    }, 3000);
  };

  const MotionCard = motion(Card);
  
  return (
    <div className="space-y-8">
      <Tabs defaultValue="preview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="preview" className="flex items-center gap-1">
            <Eye className="h-4 w-4" /> Book Preview
          </TabsTrigger>
          <TabsTrigger value="download" className="flex items-center gap-1">
            <Download className="h-4 w-4" /> Generate & Download
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="preview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" /> 
                    Book Contents
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total Pages:</span>
                      <Badge variant="outline">{previewPages.length}</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Puzzles:</span>
                      <Badge variant="outline">{totalPuzzleCount}</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Themes:</span>
                      <Badge variant="outline">{themes.length}</Badge>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Themes in this book:</h4>
                      <ScrollArea className="h-[200px] rounded-md border p-2">
                        <div className="space-y-2 pr-2">
                          {themes.map((theme) => (
                            <div key={theme.id} className="text-sm flex justify-between items-center">
                              <span>{theme.name}</span>
                              <Badge variant="secondary" className="ml-auto">
                                {theme.pageCount} puzzles
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                    
                    <Button 
                      className="w-full mt-4 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                      onClick={handlePreview}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Preview Book
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardContent className="pt-6 h-full flex flex-col">
                  {!showPreview ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                      <BookOpen className="h-16 w-16 text-muted-foreground" />
                      <h3 className="text-lg font-medium">Book Preview</h3>
                      <p className="text-muted-foreground max-w-md">
                        Click the "Preview Book" button to see how your word search book will look
                      </p>
                    </div>
                  ) : (
                    <div className="h-full">
                      <BookPreview 
                        settings={settings}
                        currentPage={currentPage}
                        totalPages={previewPages.length}
                        onPageChange={handlePageChange}
                        pages={previewPages}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="download">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              {/* Book Summary */}
              {(effectiveStatus === 'idle' || effectiveStatus === 'error') && (
                <div className="space-y-6">
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <List className="h-5 w-5 text-primary" /> 
                        Book Summary
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium">Title</h4>
                            <p className="text-sm text-muted-foreground">{settings.title}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium">Author</h4>
                            <p className="text-sm text-muted-foreground">{settings.authorName}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium">Book Size</h4>
                            <p className="text-sm text-muted-foreground">{settings.pageSize}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium">Puzzles</h4>
                            <p className="text-sm text-muted-foreground">{totalPuzzleCount} puzzles, {themes.length} themes</p>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Grid Settings</h4>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div className="flex justify-between">
                              <span>Grid Size:</span>
                              <span>{settings.gridSize}×{settings.gridSize}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Words Per Puzzle:</span>
                              <span>{settings.wordsPerPuzzle}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Puzzles Per Page:</span>
                              <span>{settings.puzzlesPerPage}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-primary/5 rounded-md p-3">
                          <p className="text-sm">
                            Your word search book is ready to be generated. Once complete, you'll be able to download a
                            KDP-ready PDF file that you can upload directly to Amazon.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {effectiveStatus === 'error' && (
                    <Card className="border-red-200 bg-red-50">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <h3 className="font-medium text-red-700">Generation Error</h3>
                            <p className="text-sm text-red-600">{effectiveError || 'An error occurred during puzzle book generation.'}</p>
                            <Button 
                              variant="outline" 
                              className="mt-3 border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800"
                              onClick={onTryAgain}
                            >
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Try Again
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email (optional)</Label>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="sendEmail"
                          checked={sendEmail}
                          onCheckedChange={(checked) => 
                            setSendEmail(checked === 'indeterminate' ? false : checked)
                          }
                        />
                        <Label htmlFor="sendEmail" className="text-sm">Send my puzzle book to my email when ready</Label>
                      </div>
                      
                      {sendEmail && (
                        <Input
                          id="email"
                          type="email"
                          placeholder="your.email@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="mt-2"
                        />
                      )}
                    </div>
                    
                    <Button 
                      className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                      onClick={onGeneratePuzzle}
                      disabled={themes.length === 0}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Puzzle Book
                    </Button>
                  </div>
                </div>
              )}

              {/* Generation in Progress */}
              {effectiveStatus === 'generating' && (
                <MotionCard
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden border-2 border-primary/10"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-primary/20">
                          <Loader2 className="h-5 w-5 text-primary animate-spin" />
                        </div>
                        <h3 className="text-lg font-medium">Generating Your Book</h3>
                      </div>
                      <Badge variant="outline" className="bg-primary/5">
                        {Math.round(progress)}%
                      </Badge>
                    </div>
                    
                    <Progress value={progress} className="h-2 mb-4" />
                    
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        We're creating your word search puzzles. This might take a few minutes, depending on the number of puzzles and settings.
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Creating puzzles...</span>
                          {progress < 30 ? (
                            <Badge variant="outline" className="bg-primary/5 animate-pulse">
                              In progress
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" /> Complete
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span>Generating solutions...</span>
                          {progress < 60 ? (
                            <Badge variant="outline" className={progress < 30 ? 'bg-muted' : 'bg-primary/5 animate-pulse'}>
                              {progress < 30 ? 'Waiting' : 'In progress'}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" /> Complete
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span>Building PDF...</span>
                          {progress < 80 ? (
                            <Badge variant="outline" className={progress < 60 ? 'bg-muted' : 'bg-primary/5 animate-pulse'}>
                              {progress < 60 ? 'Waiting' : 'In progress'}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" /> Complete
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </MotionCard>
              )}

              {/* Generation Complete */}
              {effectiveStatus === 'complete' && (
                <MotionCard
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden border-2 border-green-100"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 rounded-full bg-green-100">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <h3 className="text-lg font-medium text-green-800">Your Book is Ready!</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="bg-green-50 rounded-md p-4 text-green-800 text-sm">
                        Your word search puzzle book has been successfully generated and is ready to download. The PDF file is optimized for KDP publishing.
                      </div>
                      
                      <div className="flex flex-col gap-3">
                        <Button 
                          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                          disabled={!effectiveDownloadUrl}
                          onClick={onDownload}
                        >
                          <FileDown className="h-5 w-5" />
                          Download PDF
                        </Button>
                        
                        {sendEmail && !showThanks && (
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={handleEmailDelivery}
                          >
                            <Mail className="mr-2 h-4 w-4" />
                            Send to {email || 'my email'}
                          </Button>
                        )}
                        
                        {showThanks && (
                          <div className="text-center text-green-600 text-sm py-2">
                            <CheckCircle className="h-4 w-4 inline mr-1" /> 
                            Email sent successfully!
                          </div>
                        )}
                        
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setLocalGenerationStatus('idle')}
                        >
                          <Sparkles className="mr-2 h-4 w-4" />
                          Create Another Book
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </MotionCard>
              )}
            </div>
            
            <div className="hidden lg:block">
              <Card className="sticky top-20">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <FileEdit className="h-5 w-5 text-primary" /> 
                    KDP Publishing Tips
                  </h3>
                  
                  <div className="space-y-4 text-sm">
                    <p>
                      Your word search book is formatted to meet Amazon KDP requirements for puzzle books. Here are some tips for a successful publishing experience:
                    </p>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">Book Cover</h4>
                      <p className="text-muted-foreground">
                        Remember to create a cover image for your book. KDP requires a cover with at least 300 DPI resolution.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">KDP Categories</h4>
                      <p className="text-muted-foreground">
                        When uploading, categorize your book under "Games & Activities" and "Word Search Puzzles" for better discoverability.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">Book Description</h4>
                      <p className="text-muted-foreground">
                        Include the number of puzzles, themes, and difficulty levels in your book description to attract your target audience.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">Pricing</h4>
                      <p className="text-muted-foreground">
                        Word search puzzle books typically sell between $6.99-$9.99. Consider your page count and content when pricing.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 