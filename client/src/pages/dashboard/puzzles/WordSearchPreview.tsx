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
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Define types for the word search grid and pages
type WordSearchGrid = string[][];
type WordSearchPuzzle = {
  grid: WordSearchGrid;
  words: string[];
};
type WordSearchPage = {
  pageNumber: number;
  puzzles: WordSearchPuzzle[];
};

// Sample data for preview (this would be replaced with real data in production)
const generateSampleWordSearch = (size = 10, words = ['PUZZLE', 'SEARCH', 'WORD', 'GAME', 'FUN']): WordSearchPuzzle => {
  // Create empty grid
  const grid = Array(size).fill(0).map(() => 
    Array(size).fill(0).map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26)))
  );
  
  // For the sample, we'll just place one word horizontally in the middle
  const word = words[0];
  const row = Math.floor(size / 2);
  const startCol = Math.floor((size - word.length) / 2);
  
  for (let i = 0; i < word.length; i++) {
    grid[row][startCol + i] = word[i];
  }
  
  return {
    grid,
    words
  };
};

type WordSearchSettings = {
  title: string;
  quantity: number;
  pageSize: string;
  puzzlesPerPage: number;
  theme: string;
  difficulty: string;
  includeAnswers: boolean;
  includePageNumbers: boolean;
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
    const totalPages = Math.ceil(settings.quantity / settings.puzzlesPerPage);
    
    for (let i = 0; i < totalPages; i++) {
      const puzzlesOnPage: WordSearchPuzzle[] = [];
      for (let j = 0; j < settings.puzzlesPerPage; j++) {
        const puzzleIndex = i * settings.puzzlesPerPage + j;
        if (puzzleIndex < settings.quantity) {
          puzzlesOnPage.push(generateSampleWordSearch());
        }
      }
      samplePages.push({
        pageNumber: i + 1,
        puzzles: puzzlesOnPage
      });
    }
    
    setPages(samplePages);
  }, [settings.quantity, settings.puzzlesPerPage, previewData]);
  
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
            Page {currentPage + 1} of {totalPages} • {settings.pageSize} • 
            {settings.puzzlesPerPage} {settings.puzzlesPerPage === 1 ? 'puzzle' : 'puzzles'} per page
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
          <Card className={cn(
            "transition-all bg-white text-black",
            {
              "w-[612px] h-[792px]": settings.pageSize === 'letter',
              "w-[595px] h-[842px]": settings.pageSize === 'a4',
              "w-[420px] h-[595px]": settings.pageSize === 'a5',
              "w-[432px] h-[648px]": settings.pageSize === '6x9',
              "w-[576px] h-[720px]": settings.pageSize === '8x10',
            }
          )} style={{ transform: `scale(${zoomLevel})` }}>
            {/* Preview watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 rotate-[335deg] z-10">
              <div className="text-5xl font-bold text-gray-600 border-4 border-gray-600 py-2 px-6 rounded">
                PREVIEW
              </div>
            </div>
            <CardContent className="p-8 h-full">
              {pages[currentPage] && (
                <div className="space-y-8 h-full flex flex-col">
                  {/* Book title on the first page */}
                  {currentPage === 0 && (
                    <div className="text-center mb-8">
                      <h1 className="text-3xl font-bold">{settings.title || "Word Search Book"}</h1>
                      <p className="text-md">{settings.theme ? `Theme: ${settings.theme}` : "Fun Word Search Puzzles"}</p>
                    </div>
                  )}
                  
                  {/* Puzzles on the page */}
                  <div className={cn(
                    "grid gap-4 flex-grow",
                    {
                      "grid-cols-1": settings.puzzlesPerPage === 1,
                      "grid-cols-2": settings.puzzlesPerPage === 2,
                      "grid-cols-2 grid-rows-2": settings.puzzlesPerPage === 4,
                    }
                  )}>
                    {pages[currentPage].puzzles.map((puzzle: WordSearchPuzzle, index: number) => (
                      <div key={index} className="border rounded-md p-4 flex flex-col">
                        <h2 className="text-center text-lg font-medium mb-2">
                          Word Search #{currentPage * settings.puzzlesPerPage + index + 1}
                        </h2>
                        
                        {/* Word search grid */}
                        <div className="flex justify-center flex-grow">
                          <div className="grid gap-0 border border-gray-300">
                            {puzzle.grid.map((row: string[], i: number) => (
                              <div key={i} className="flex">
                                {row.map((cell: string, j: number) => (
                                  <div 
                                    key={j} 
                                    className="w-6 h-6 flex items-center justify-center text-sm border border-gray-100"
                                  >
                                    {cell}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Word list */}
                        <div className="mt-4">
                          <h3 className="text-sm font-medium mb-1">Find these words:</h3>
                          <div className="flex flex-wrap gap-x-4 text-sm">
                            {puzzle.words.map((word: string, i: number) => (
                              <span key={i}>{word}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Page number */}
                  {settings.includePageNumbers && (
                    <div className="text-center text-sm">
                      Page {currentPage + 1}
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