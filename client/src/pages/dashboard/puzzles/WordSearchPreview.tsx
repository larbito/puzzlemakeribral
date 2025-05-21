import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  ZoomIn, 
  ZoomOut,
  Sparkles,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Define types for the word search grid and pages
type WordSearchGrid = string[][];
type WordSearchPuzzle = {
  grid: WordSearchGrid;
  words: string[];
  title?: string;
  themeFact?: string;
};
type WordSearchPage = {
  pageNumber: number;
  pageType: 'cover' | 'puzzle' | 'answer' | 'toc';
  puzzles: WordSearchPuzzle[];
};

// Sample data for preview (this would be replaced with real data in production)
const generateSampleWordSearch = (
  size = 15, 
  wordsCount = 10, 
  theme = '', 
  index = 0
): WordSearchPuzzle => {
  // Create empty grid
  const grid = Array(size).fill(0).map(() => 
    Array(size).fill(0).map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26)))
  );
  
  // Generate sample words related to the theme (in a real app, this would use the AI)
  let words: string[] = [];
  
  if (theme) {
    // Simulated themed words
    const themeWords: {[key: string]: string[]} = {
      'animals': ['ELEPHANT', 'TIGER', 'GIRAFFE', 'LION', 'ZEBRA', 'MONKEY', 'HIPPO', 'RHINO', 'BEAR', 'WOLF', 'EAGLE', 'FOX'],
      'space': ['PLANET', 'STAR', 'GALAXY', 'COMET', 'ASTEROID', 'MOON', 'ORBIT', 'ROCKET', 'SATURN', 'MARS', 'VENUS', 'JUPITER'],
      'ocean': ['WHALE', 'SHARK', 'DOLPHIN', 'CORAL', 'REEF', 'WAVE', 'TIDE', 'SHELL', 'FISH', 'OCTOPUS', 'TURTLE', 'CRAB'],
      'sports': ['SOCCER', 'TENNIS', 'BASEBALL', 'FOOTBALL', 'HOCKEY', 'GOLF', 'SWIMMING', 'RUNNING', 'CYCLING', 'BASKETBALL', 'VOLLEYBALL', 'RUGBY']
    };
    
    // Use theme words if available, otherwise generic
    if (theme.toLowerCase() in themeWords) {
      words = themeWords[theme.toLowerCase()].slice(0, wordsCount);
    } else {
      words = ['PUZZLE', 'SEARCH', 'WORD', 'GAME', 'FUN', 'PLAY', 'FIND', 'HIDDEN', 'LETTERS', 'SOLVE'].slice(0, wordsCount);
    }
  } else {
    words = ['PUZZLE', 'SEARCH', 'WORD', 'GAME', 'FUN', 'PLAY', 'FIND', 'HIDDEN', 'LETTERS', 'SOLVE'].slice(0, wordsCount);
  }
  
  // For the sample, we'll just place the first word horizontally in the middle
  const word = words[0];
  const row = Math.floor(size / 2);
  const startCol = Math.floor((size - word.length) / 2);
  
  for (let i = 0; i < word.length; i++) {
    grid[row][startCol + i] = word[i];
  }
  
  // Generate puzzle title
  const puzzleTitle = theme ? `${theme} Search #${index + 1}` : `Word Search #${index + 1}`;
  
  // Generate a theme fact if we have a theme
  let themeFact = '';
  if (theme) {
    const themeFacts: {[key: string]: string[]} = {
      'animals': [
        'Elephants can communicate over long distances using sounds below the range of human hearing.',
        'Tigers have striped skin, not just striped fur.',
        'Giraffes have the same number of neck vertebrae as humans - just seven!'
      ],
      'space': [
        'One million Earths could fit inside the Sun.',
        'A year on Venus is shorter than a day on Venus.',
        'The footprints on the Moon will be there for at least 100 million years.'
      ],
      'ocean': [
        'The ocean contains 97% of Earth\'s water.',
        'Less than 5% of the ocean has been explored.',
        'The Great Barrier Reef is the largest living structure on Earth.'
      ],
      'sports': [
        'Soccer is played by over 250 million people in more than 200 countries.',
        'The first Olympic Games were held in ancient Greece in 776 BCE.',
        'Basketball was invented in 1891 by Dr. James Naismith.'
      ]
    };
    
    if (theme.toLowerCase() in themeFacts) {
      const factIndex = index % themeFacts[theme.toLowerCase()].length;
      themeFact = themeFacts[theme.toLowerCase()][factIndex];
    }
  }
  
  return {
    grid,
    words,
    title: puzzleTitle,
    themeFact
  };
};

type WordSearchSettings = {
  // Book settings
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
  difficulty: string;
  quantity: number;
  
  // Puzzle options
  gridSize: number;
  wordsPerPuzzle: number;
  
  // Output options
  includeAnswers: boolean;
  includeThemeFacts: boolean;
  includeCoverPage: boolean;
};

type WordSearchPreviewProps = {
  settings: WordSearchSettings;
  previewData?: WordSearchPage[]; // Optional real data
  onDownload: () => void;
};

export const WordSearchPreview = ({ 
  settings, 
  previewData,
  onDownload
}: WordSearchPreviewProps) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pages, setPages] = useState<WordSearchPage[]>([]);
  
  // Generate sample pages for preview
  useEffect(() => {
    // Use previewData if provided, otherwise generate sample data
    if (previewData) {
      setPages(previewData);
      return;
    }
    
    // In production, this would use real data from the API
    const samplePages: WordSearchPage[] = [];
    
    // Add cover page if enabled
    if (settings.includeCoverPage) {
      samplePages.push({
        pageNumber: 1,
        pageType: 'cover',
        puzzles: []
      });
    }
    
    // Add table of contents
    samplePages.push({
      pageNumber: samplePages.length + 1,
      pageType: 'toc',
      puzzles: []
    });
    
    // Calculate total puzzle pages needed
    const puzzlesPerPage = settings.puzzlesPerPage;
    const totalPuzzlePages = Math.ceil(settings.quantity / puzzlesPerPage);
    
    // Add puzzle pages
    for (let i = 0; i < totalPuzzlePages; i++) {
      const puzzlesOnPage: WordSearchPuzzle[] = [];
      for (let j = 0; j < puzzlesPerPage; j++) {
        const puzzleIndex = i * puzzlesPerPage + j;
        if (puzzleIndex < settings.quantity) {
          puzzlesOnPage.push(generateSampleWordSearch(
            settings.gridSize, 
            settings.wordsPerPuzzle, 
            settings.theme,
            puzzleIndex
          ));
        }
      }
      
      samplePages.push({
        pageNumber: samplePages.length + 1,
        pageType: 'puzzle',
        puzzles: puzzlesOnPage
      });
    }
    
    // Add answer pages if enabled
    if (settings.includeAnswers) {
      for (let i = 0; i < totalPuzzlePages; i++) {
        const puzzlesOnPage: WordSearchPuzzle[] = [];
        for (let j = 0; j < puzzlesPerPage; j++) {
          const puzzleIndex = i * puzzlesPerPage + j;
          if (puzzleIndex < settings.quantity) {
            puzzlesOnPage.push(generateSampleWordSearch(
              settings.gridSize, 
              settings.wordsPerPuzzle, 
              settings.theme,
              puzzleIndex
            ));
          }
        }
        
        samplePages.push({
          pageNumber: samplePages.length + 1,
          pageType: 'answer',
          puzzles: puzzlesOnPage
        });
      }
    }
    
    setPages(samplePages);
  }, [
    settings.quantity, 
    settings.puzzlesPerPage, 
    settings.theme, 
    settings.gridSize, 
    settings.wordsPerPuzzle,
    settings.includeAnswers,
    settings.includeCoverPage,
    previewData
  ]);
  
  const totalPages = pages.length;
  
  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };
  
  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };
  
  const handleZoomIn = () => {
    if (zoomLevel < 2) {
      setZoomLevel(prev => prev + 0.2);
    }
  };
  
  const handleZoomOut = () => {
    if (zoomLevel > 0.6) {
      setZoomLevel(prev => prev - 0.2);
    }
  };

  // Get current page type
  const currentPageType = pages[currentPage]?.pageType || 'puzzle';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Preview: {settings.title || "Word Search Book"}
          </h3>
          <p className="text-sm text-muted-foreground">
            Page {currentPage + 1} of {totalPages} • 
            {currentPageType === 'cover' ? ' Cover' : 
             currentPageType === 'toc' ? ' Table of Contents' : 
             currentPageType === 'answer' ? ' Answer Key' : ' Puzzle'} •
            {settings.pageSize} • 
            {settings.bleed ? ' With Bleed' : ' No Bleed'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            size="icon"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 0.6}
            className="h-8 w-8"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <span className="text-sm w-12 text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          
          <Button 
            variant="outline"
            size="icon"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 2}
            className="h-8 w-8"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <Button 
            onClick={onDownload}
            className="bg-gradient-to-r from-primary to-secondary"
          >
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>
      
      <div className="flex justify-center">
        <div className="relative">
          {/* Card size based on the page size selection with proper KDP dimensions */}
          <Card className={cn(
            "transition-all",
            settings.interiorTheme === 'light' 
              ? "bg-white text-black" 
              : "bg-gray-900 text-white",
            {
              // Actual KDP trim sizes with proper aspect ratios
              "w-[432px] h-[648px]": settings.pageSize === '6x9',    // 6" x 9"
              "w-[510px] h-[660px]": settings.pageSize === '8.5x11', // 8.5" x 11"
              "w-[300px] h-[480px]": settings.pageSize === '5x8',    // 5" x 8"
              "w-[420px] h-[600px]": settings.pageSize === '7x10',   // 7" x 10"
              "w-[480px] h-[600px]": settings.pageSize === '8x10',   // 8" x 10"
              "w-[495px] h-[495px]": settings.pageSize === '8.25x8.25', // 8.25" x 8.25"
            }
          )} style={{ transform: `scale(${zoomLevel})` }}>
            {/* Preview watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 rotate-[335deg] z-10">
              <div className="text-5xl font-bold text-gray-600 border-4 border-gray-600 py-2 px-6 rounded">
                PREVIEW
              </div>
            </div>
            
            {/* Bleed indicator if enabled */}
            {settings.bleed && (
              <div className="absolute inset-0 border-2 border-red-400 border-dashed pointer-events-none m-2 z-10" />
            )}
            
            <CardContent className={cn(
              "p-6 h-full overflow-hidden",
              settings.fontFamily === 'sans' ? "font-sans" :
              settings.fontFamily === 'serif' ? "font-serif" :
              settings.fontFamily === 'mono' ? "font-mono" :
              "font-sans" // Default fallback
            )}>
              {pages[currentPage] && (
                <div className="space-y-4 h-full flex flex-col">
                  {/* Cover page */}
                  {pages[currentPage].pageType === 'cover' && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                      <h1 className="text-4xl font-bold">{settings.title || "Word Search Book"}</h1>
                      {settings.subtitle && (
                        <h2 className="text-2xl">{settings.subtitle}</h2>
                      )}
                      
                      <div className="my-8 max-w-[60%]">
                        {/* Sample cover grid illustration */}
                        <div className="grid grid-cols-5 grid-rows-5 gap-1 mx-auto max-w-xs">
                          {Array(25).fill(0).map((_, i) => (
                            <div 
                              key={i} 
                              className={cn(
                                "w-8 h-8 flex items-center justify-center text-xl font-bold border-2",
                                i % 3 === 0 ? "bg-primary/20 border-primary/30" : 
                                i % 5 === 0 ? "bg-secondary/20 border-secondary/30" : 
                                "bg-transparent border-gray-300"
                              )}
                            >
                              {String.fromCharCode(65 + Math.floor(Math.random() * 26))}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {settings.authorName && (
                        <p className="text-xl mt-auto">by {settings.authorName}</p>
                      )}
                    </div>
                  )}
                  
                  {/* Table of Contents */}
                  {pages[currentPage].pageType === 'toc' && (
                    <div className="flex flex-col h-full">
                      <h2 className="text-2xl font-bold text-center mb-6">Table of Contents</h2>
                      <div className="flex-grow overflow-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-300">
                              <th className="text-left py-2">Puzzle</th>
                              <th className="text-right py-2">Page</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Array(settings.quantity).fill(0).map((_, i) => {
                              const pageNum = settings.includeCoverPage ? i + 3 : i + 2;
                              const puzzleTitle = settings.theme 
                                ? `${settings.theme} Search #${i + 1}` 
                                : `Word Search #${i + 1}`;
                              
                              return (
                                <tr key={i} className="border-b border-gray-100">
                                  <td className="py-1">{puzzleTitle}</td>
                                  <td className="text-right py-1">{pageNum}</td>
                                </tr>
                              );
                            })}
                            
                            {settings.includeAnswers && (
                              <tr className="border-t border-gray-300 font-medium">
                                <td className="py-2">Answer Key</td>
                                <td className="text-right py-2">
                                  {settings.includeCoverPage 
                                    ? settings.quantity + 3 
                                    : settings.quantity + 2}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {/* Puzzle pages */}
                  {pages[currentPage].pageType === 'puzzle' && (
                    <>
                      <div className={cn(
                        "grid gap-4 flex-grow",
                        {
                          "grid-cols-1": settings.puzzlesPerPage === 1,
                          "grid-cols-2": settings.puzzlesPerPage === 2,
                          "grid-cols-2 grid-rows-2": settings.puzzlesPerPage === 4,
                        }
                      )}>
                        {pages[currentPage].puzzles.map((puzzle: WordSearchPuzzle, index: number) => (
                          <div key={index} className="border rounded-md p-3 flex flex-col h-full">
                            <h3 className="text-center font-medium mb-2">
                              {puzzle.title || `Word Search #${index + 1}`}
                            </h3>
                            
                            {/* Show theme fact if enabled */}
                            {settings.includeThemeFacts && puzzle.themeFact && (
                              <div className="mb-2 text-xs p-2 bg-primary/10 rounded-md flex items-start">
                                <Info className="h-3 w-3 text-primary mr-1 mt-0.5 flex-shrink-0" />
                                <span>{puzzle.themeFact}</span>
                              </div>
                            )}
                            
                            {/* Word search grid */}
                            <div className="flex justify-center flex-grow">
                              <div className={cn(
                                "grid gap-0 border border-gray-300",
                                settings.interiorTheme === 'dark' ? "border-gray-600" : "border-gray-300"
                              )}>
                                {puzzle.grid.map((row: string[], i: number) => (
                                  <div key={i} className="flex">
                                    {row.map((cell: string, j: number) => (
                                      <div 
                                        key={j} 
                                        className={cn(
                                          "flex items-center justify-center text-xs border",
                                          settings.interiorTheme === 'dark' 
                                            ? "border-gray-700" 
                                            : "border-gray-100",
                                          // Adjust cell size based on grid size
                                          {
                                            "w-4 h-4": puzzle.grid.length > 15,
                                            "w-5 h-5": puzzle.grid.length <= 15 && puzzle.grid.length > 10,
                                            "w-6 h-6": puzzle.grid.length <= 10
                                          }
                                        )}
                                      >
                                        {cell}
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            {/* Word list */}
                            <div className="mt-3">
                              <h4 className="text-xs font-medium mb-1">Find these words:</h4>
                              <div className="flex flex-wrap gap-x-3 text-xs">
                                {puzzle.words.map((word: string, i: number) => (
                                  <span key={i} className="pb-1">{word}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  
                  {/* Answer Key pages */}
                  {pages[currentPage].pageType === 'answer' && (
                    <>
                      <h2 className="text-xl font-bold text-center mb-4">Answer Key</h2>
                      <div className={cn(
                        "grid gap-4 flex-grow",
                        {
                          "grid-cols-1": settings.puzzlesPerPage === 1,
                          "grid-cols-2": settings.puzzlesPerPage === 2,
                          "grid-cols-2 grid-rows-2": settings.puzzlesPerPage === 4,
                        }
                      )}>
                        {pages[currentPage].puzzles.map((puzzle: WordSearchPuzzle, index: number) => (
                          <div key={index} className="border rounded-md p-3 flex flex-col">
                            <h3 className="text-center text-sm font-medium mb-2">
                              {puzzle.title || `Word Search #${index + 1}`}
                            </h3>
                            
                            {/* Word search grid */}
                            <div className="flex justify-center flex-grow">
                              <div className={cn(
                                "grid gap-0 border",
                                settings.interiorTheme === 'dark' ? "border-gray-600" : "border-gray-300"
                              )}>
                                {puzzle.grid.map((row: string[], i: number) => (
                                  <div key={i} className="flex">
                                    {row.map((cell: string, j: number) => (
                                      <div 
                                        key={j} 
                                        className={cn(
                                          "flex items-center justify-center text-xs border",
                                          // Add highlighting for the first word as an example
                                          (i === Math.floor(puzzle.grid.length / 2) && 
                                           j >= Math.floor((puzzle.grid.length - puzzle.words[0].length) / 2) && 
                                           j < Math.floor((puzzle.grid.length - puzzle.words[0].length) / 2) + puzzle.words[0].length)
                                            ? "bg-primary/30 font-bold" : "",
                                          settings.interiorTheme === 'dark' 
                                            ? "border-gray-700" 
                                            : "border-gray-100",
                                          // Adjust cell size based on grid size
                                          {
                                            "w-4 h-4": puzzle.grid.length > 15,
                                            "w-5 h-5": puzzle.grid.length <= 15 && puzzle.grid.length > 10,
                                            "w-6 h-6": puzzle.grid.length <= 10
                                          }
                                        )}
                                      >
                                        {cell}
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  
                  {/* Page number */}
                  {settings.includePageNumbers && (
                    <div className="text-center text-sm mt-auto pt-2">
                      Page {pages[currentPage].pageNumber}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Navigation buttons */}
          <div className="absolute top-1/2 -left-12 -translate-y-1/2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevPage}
              disabled={currentPage === 0}
              className="bg-white/30 backdrop-blur-sm hover:bg-white/50"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="absolute top-1/2 -right-12 -translate-y-1/2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextPage}
              disabled={currentPage === totalPages - 1}
              className="bg-white/30 backdrop-blur-sm hover:bg-white/50"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}; 