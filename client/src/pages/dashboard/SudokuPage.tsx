import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Grid, Download, Sparkles, Eye, FileType, Archive } from 'lucide-react';
import { SudokuService, type SudokuPuzzle } from '@/lib/services/sudoku';
import { PDFViewer, PDFDownloadLink, Document, Page, View, Text, StyleSheet, Font } from '@react-pdf/renderer';
import { toast } from 'sonner';
import { SudokuKDPSettings, type SudokuKDPConfig, type DifficultySection } from '@/components/kdp/SudokuKDPSettings';
import { SudokuGrid } from '@/components/sudoku/SudokuGrid';
import SudokuPDFGrid from '@/components/sudoku/SudokuPDFGrid';
import { PDFPreview } from '@/components/preview/PDFPreview';
import type { ComponentType } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Progress } from '@/components/ui/progress';

// Register fonts
Font.register({
  family: 'Inter',
  src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2'
});

// Create styles for PDF document
const pdfStyles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: '30pt',
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
  },
  pageContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    fontFamily: 'Helvetica-Bold',
  },
  puzzleWrapper: {
    marginBottom: 30,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  puzzleTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    fontFamily: 'Helvetica-Bold',
  },
  puzzleSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'Helvetica',
  },
  gridContainer: {
    width: '80%', // Controls the size of the grid
    alignSelf: 'center',
    aspectRatio: 1, // Make grid containers square
  },
  pageNumber: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Helvetica',
    color: '#666666',
  },
  solutionsHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: 'Helvetica-Bold',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Helvetica',
    color: '#666666',
  },
});

interface PuzzleWithMetadata extends SudokuPuzzle {
  sectionIndex: number;
  puzzleIndex: number;
  difficultyLabel: string;
}

// At the top of the file, add these constants for optimization
const MAX_PUZZLES_PER_BATCH = 20;
const BATCH_GENERATION_DELAY = 50; // ms

// Update the generatePuzzles function to work in batches with async/await
const generatePuzzles = async (config: SudokuKDPConfig, onProgress?: (progress: number) => void): Promise<PuzzleWithMetadata[]> => {
  const allPuzzles: PuzzleWithMetadata[] = [];
  
  if (config.difficultyMix === 'single') {
    // Single difficulty mode
    const totalPuzzles = Math.min(config.numberOfPages, 200); // Limit to 200 max
    const totalBatches = Math.ceil(totalPuzzles / MAX_PUZZLES_PER_BATCH);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      // Calculate batch size
      const batchSize = Math.min(MAX_PUZZLES_PER_BATCH, totalPuzzles - (batchIndex * MAX_PUZZLES_PER_BATCH));
      
      // Generate batch
      for (let i = 0; i < batchSize; i++) {
        const puzzleIndex = batchIndex * MAX_PUZZLES_PER_BATCH + i;
        const puzzle = SudokuService.generatePuzzle(config.difficulty, config.gridSize);
        allPuzzles.push({
          ...puzzle,
          sectionIndex: 0,
          puzzleIndex,
          difficultyLabel: config.difficulty.charAt(0).toUpperCase() + config.difficulty.slice(1)
        });
      }
      
      // Report progress
      if (onProgress) {
        onProgress(((batchIndex + 1) / totalBatches) * 100);
      }
      
      // Add small delay to prevent UI freezing
      await new Promise(resolve => setTimeout(resolve, BATCH_GENERATION_DELAY));
    }
  } else {
    // Multiple difficulty mode
    let sectionIndex = 0;
    let puzzleIndex = 0;
    let totalPuzzles = 0;
    let processedPuzzles = 0;
    
    // Calculate total puzzles
    for (const section of config.difficultySections) {
      totalPuzzles += section.count;
    }
    
    // Limit total puzzles to prevent browser crash
    totalPuzzles = Math.min(totalPuzzles, 200);
    
    for (const section of config.difficultySections) {
      const difficultyLabel = section.difficulty.charAt(0).toUpperCase() + section.difficulty.slice(1);
      const sectionPuzzleCount = Math.min(section.count, totalPuzzles - processedPuzzles);
      const totalBatches = Math.ceil(sectionPuzzleCount / MAX_PUZZLES_PER_BATCH);
      
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        // Calculate batch size
        const batchSize = Math.min(MAX_PUZZLES_PER_BATCH, sectionPuzzleCount - (batchIndex * MAX_PUZZLES_PER_BATCH));
        
        // Generate batch
        for (let i = 0; i < batchSize; i++) {
          const puzzle = SudokuService.generatePuzzle(section.difficulty, config.gridSize);
          allPuzzles.push({
            ...puzzle,
            sectionIndex,
            puzzleIndex,
            difficultyLabel
          });
          puzzleIndex++;
          processedPuzzles++;
        }
        
        // Report progress
        if (onProgress) {
          onProgress((processedPuzzles / totalPuzzles) * 100);
        }
        
        // Add small delay to prevent UI freezing
        await new Promise(resolve => setTimeout(resolve, BATCH_GENERATION_DELAY));
      }
      
      sectionIndex++;
      
      if (processedPuzzles >= totalPuzzles) {
        break;
      }
    }
  }
  
  return allPuzzles;
};

// In the generatePuzzles function, add validation to avoid empty puzzles
function isValidPuzzle(puzzle: any) {
  if (!puzzle || !puzzle.grid || !puzzle.solution) return false;
  
  // Check if grid has some values (not all zeroes)
  const hasValues = puzzle.grid.some((row: number[]) => 
    row.some((cell: number) => cell !== 0)
  );
  
  return hasValues;
}

// Add a utility function to manually create a placeholder puzzle for testing if needed
const createPlaceholderPuzzle = () => {
  // Create a simple 9x9 grid with some values
  const grid = Array(9).fill(0).map(() => Array(9).fill(0));
  const solution = Array(9).fill(0).map(() => Array(9).fill(0));
  
  // Add some numbers
  for (let i = 0; i < 9; i++) {
    grid[i][i] = i+1;
    for (let j = 0; j < 9; j++) {
      solution[i][j] = ((i * 3 + Math.floor(i/3) + j) % 9) + 1;
    }
  }
  
  return {
    grid,
    solution,
    hints: ["This is a placeholder puzzle"],
    sectionIndex: 0,
    puzzleIndex: 0,
    difficultyLabel: "Medium"
  };
};

export const SudokuPage = () => {
  const [kdpConfig, setKDPConfig] = useState<SudokuKDPConfig>({
    // KDP settings
    bookSize: '6x9',
    interiorMargin: 0.25,
    exteriorMargin: 0.25,
    topMargin: 0.25,
    bottomMargin: 0.25,
    hasBleed: false,
    gutterMargin: 0.125,
    numberOfPages: 100,
    colorMode: 'bw',
    // Sudoku specific settings
    gridSize: '9x9',
    difficultyMix: 'single',
    difficulty: 'medium',
    difficultySections: [
      { difficulty: 'easy', count: 30 },
      { difficulty: 'medium', count: 30 },
      { difficulty: 'hard', count: 30 }
    ],
    puzzlesPerPage: 1,
    includeSolutions: true,
    solutionPlacement: 'afterEach',
    includeHints: false,
    includePageNumbers: true,
    bookTitle: 'Sudoku Puzzle Book',
    showDifficultyInTitle: true,
    puzzleNumberingStyle: 'sequential',
    puzzleNumberingPrefix: 'Puzzle',
    // Add the missing styling properties
    gridStyle: 'classic',
    gridLineColor: 'black',
    alternateBoxShading: false,
    numberFont: 'sans',
  });

  const [currentPuzzle, setCurrentPuzzle] = useState<SudokuPuzzle | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  
  // Updated state variables for progress tracking and export options
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedPuzzles, setGeneratedPuzzles] = useState<PuzzleWithMetadata[]>([]);
  const [isPDFGenerating, setIsPDFGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'png'>('pdf');
  
  // Reference to worker
  const workerRef = useRef<Worker | null>(null);
  
  // Canvas references for PNG export
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  
  // Add a state to track the active view
  const [activeView, setActiveView] = useState<'settings' | 'preview'>('settings');
  
  // Handle messages from the main thread
  useEffect(() => {
    // Create worker
    workerRef.current = new Worker(new URL('../../lib/workers/sudokuWorker.ts', import.meta.url), { type: 'module' });
    
    // Set up message handler
    const worker = workerRef.current;
    worker.onmessage = (event) => {
      const message = event.data;
      
      switch (message.type) {
        case 'progress':
          setGenerationProgress(message.progress);
          break;
        case 'complete':
          console.log("Received puzzles from worker:", message.puzzles.length, "pageCount:", message.pageCount);
          if (message.puzzles.length === 0) {
            console.error('No puzzles were generated');
            toast.error('Failed to generate puzzles. Please try again.');
            setIsPDFGenerating(false);
          } else {
            // Filter out any invalid puzzles
            const validPuzzles = message.puzzles.filter(isValidPuzzle);
            
            if (validPuzzles.length === 0) {
              toast.error('Failed to generate valid puzzles. Please try again.');
              setIsPDFGenerating(false);
              return;
            }
            
            // Update state with generated puzzles
            setGeneratedPuzzles(validPuzzles);
            // Ensure we're showing the preview and setting isPDFGenerating to false
            setShowPDFPreview(true);
            setIsPDFGenerating(false);
            toast.success(`Generated ${validPuzzles.length} puzzles successfully!`);
          }
          break;
        case 'error':
          console.error('Worker error:', message.error);
          toast.error('Failed to generate puzzles: ' + message.error);
          setIsPDFGenerating(false);
          break;
      }
    };
    
    // Clean up worker on unmount
    return () => {
      if (worker) {
        worker.terminate();
      }
    };
  }, []);

  // Puzzle generation handler
  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const puzzle = SudokuService.generatePuzzle(kdpConfig.difficulty, kdpConfig.gridSize);
      setCurrentPuzzle({
        grid: puzzle.grid,
        solution: puzzle.solution,
        hints: kdpConfig.includeHints ? puzzle.hints : undefined
      });
      toast.success('Puzzle generated successfully!');
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate puzzle. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Modify the handleViewPDF function to add more logging and ensure it works
  const handleViewPDF = async () => {
    if (!workerRef.current) {
      console.error("Web worker not initialized");
      toast.error("Error: Web worker not initialized. Please refresh the page.");
      return;
    }
    
    console.log("Starting PDF generation");
    setIsPDFGenerating(true);
    setGenerationProgress(0);
    setExportFormat('pdf');
    setShowPDFPreview(true);
    setGeneratedPuzzles([]);
    
    try {
      toast.info('Generating puzzles... This might take a moment.', {
        duration: 3000,
      });
      
      console.log("Sending config to worker:", JSON.stringify({
        difficultyMix: kdpConfig.difficultyMix,
        difficulty: kdpConfig.difficulty,
        gridSize: kdpConfig.gridSize,
        puzzlesPerPage: kdpConfig.puzzlesPerPage,
        numberOfPages: kdpConfig.numberOfPages,
        difficultySections: kdpConfig.difficultySections
      }));
      
      // Use web worker for generation
      workerRef.current.postMessage({
        type: 'generate',
        config: kdpConfig
      });
      
      // For testing if worker fails - comment out in production
      /*
      setTimeout(() => {
        // Generate a test puzzle if worker is taking too long
        if (isPDFGenerating) {
          console.log("Generating fallback puzzle for testing");
          const placeholderPuzzle = createPlaceholderPuzzle();
          setGeneratedPuzzles([placeholderPuzzle]);
          setShowPDFPreview(true);
          setIsPDFGenerating(false);
          toast.success("Generated test puzzle");
        }
      }, 5000);
      */
      
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF. Please try again.');
      setIsPDFGenerating(false);
    }
  };
  
  // Improved PNG export function
  const handleExportPNG = async () => {
    if (!generatedPuzzles.length) {
      toast.error('No puzzles to export. Please generate puzzles first.');
      return;
    }
    
    setIsExporting(true);
    
    try {
      const zip = new JSZip();
      
      // Create folders in the zip
      const puzzlesFolder = zip.folder("puzzles");
      const solutionsFolder = kdpConfig.includeSolutions ? zip.folder("solutions") : null;
      
      // Function to create a canvas from a Sudoku grid
      const renderGridToCanvas = (grid: number[][], gridSize: number, isSolution: boolean) => {
        // Create a new canvas element
        const canvas = document.createElement('canvas');
        
        // Set canvas size based on grid size (larger for better quality)
        const cellSize = 40;
        const borderSize = 2;
        const canvasSize = (gridSize * cellSize) + (borderSize * 2);
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        
        // Get 2D context
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        
        // Calculate box size (for 3x3 sections in 9x9 grid)
        const boxSize = Math.sqrt(gridSize);
        
        // Fill background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvasSize, canvasSize);
        
        // Set line styling based on grid style preferences
        const mainLineColor = kdpConfig.gridLineColor === 'black' ? '#000000' : 
                              kdpConfig.gridLineColor === 'gray' ? '#666666' : '#0a2463';
        const thinLineWidth = kdpConfig.gridStyle === 'minimal' ? 0.5 : 1;
        const thickLineWidth = kdpConfig.gridStyle === 'minimal' ? 1 : 2;
        
        // Draw grid lines
        ctx.strokeStyle = mainLineColor;
        
        // Draw cells and numbers
        for (let row = 0; row < gridSize; row++) {
          for (let col = 0; col < gridSize; col++) {
            const x = (col * cellSize) + borderSize;
            const y = (row * cellSize) + borderSize;
            
            // Apply alternate box shading if enabled
            if (kdpConfig.alternateBoxShading) {
              const boxRow = Math.floor(row / boxSize);
              const boxCol = Math.floor(col / boxSize);
              if ((boxRow + boxCol) % 2 === 0) {
                ctx.fillStyle = '#f5f5f5'; // Light gray for shaded boxes
                ctx.fillRect(x, y, cellSize, cellSize);
              }
            }
            
            // Draw cell borders
            ctx.lineWidth = thinLineWidth;
            ctx.strokeRect(x, y, cellSize, cellSize);
            
            // Draw cell value if not 0
            const value = grid[row][col];
            if (value !== 0) {
              // Choose font based on settings
              const fontFamily = kdpConfig.numberFont === 'serif' ? 'Times New Roman' :
                                 kdpConfig.numberFont === 'mono' ? 'Courier New' : 'Arial';
              
              // Make solution numbers bold
              ctx.font = `${isSolution ? 'bold ' : ''}${Math.floor(cellSize * 0.6)}px ${fontFamily}`;
              ctx.fillStyle = 'black';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(value.toString(), x + (cellSize / 2), y + (cellSize / 2));
            }
          }
        }
        
        // Draw box borders (thicker lines)
        ctx.lineWidth = thickLineWidth;
        
        // Vertical thick lines
        for (let i = 0; i <= gridSize; i++) {
          if (i % boxSize === 0) {
            ctx.beginPath();
            ctx.moveTo(borderSize + (i * cellSize), borderSize);
            ctx.lineTo(borderSize + (i * cellSize), canvasSize - borderSize);
            ctx.stroke();
          }
        }
        
        // Horizontal thick lines
        for (let i = 0; i <= gridSize; i++) {
          if (i % boxSize === 0) {
            ctx.beginPath();
            ctx.moveTo(borderSize, borderSize + (i * cellSize));
            ctx.lineTo(canvasSize - borderSize, borderSize + (i * cellSize));
            ctx.stroke();
          }
        }
        
        return canvas;
      };
      
      // Process all puzzles and add to ZIP
      const promises = [];
      
      for (let i = 0; i < generatedPuzzles.length; i++) {
        const puzzle = generatedPuzzles[i];
        const gridSize = parseInt(kdpConfig.gridSize.split('x')[0]);
        
        // Generate puzzle title for filename
        const puzzleTitle = getPuzzleTitle(puzzle).replace(/\s+/g, '-').toLowerCase();
        
        // Generate the puzzle canvas
        const puzzleCanvas = renderGridToCanvas(puzzle.grid, gridSize, false);
        
        if (puzzleCanvas) {
          // Convert canvas to blob and add to zip
          promises.push(new Promise<void>((resolve) => {
            puzzleCanvas.toBlob((blob) => {
              if (blob && puzzlesFolder) {
                puzzlesFolder.file(`${puzzleTitle}.png`, blob);
              }
              resolve();
            }, 'image/png');
          }));
          
          // Generate solution if needed
          if (kdpConfig.includeSolutions && solutionsFolder) {
            const solutionCanvas = renderGridToCanvas(puzzle.solution, gridSize, true);
            
            if (solutionCanvas) {
              promises.push(new Promise<void>((resolve) => {
                solutionCanvas.toBlob((blob) => {
                  if (blob && solutionsFolder) {
                    solutionsFolder.file(`${puzzleTitle}-solution.png`, blob);
                  }
                  resolve();
                }, 'image/png');
              }));
            }
          }
        }
        
        // Update progress indicator for every 10 puzzles
        if (i % 10 === 0) {
          setGenerationProgress(Math.floor((i / generatedPuzzles.length) * 100));
          // Give UI time to update
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
      
      // Wait for all canvas conversions to complete
      await Promise.all(promises);
      
      // For single puzzle, extract and download directly
      if (generatedPuzzles.length === 1) {
        const puzzleTitle = getPuzzleTitle(generatedPuzzles[0]).replace(/\s+/g, '-').toLowerCase();
        const puzzleFile = await puzzlesFolder?.file(`${puzzleTitle}.png`)?.async('blob');
        
        if (puzzleFile) {
          saveAs(puzzleFile, `${puzzleTitle}.png`);
        }
        
        if (kdpConfig.includeSolutions && solutionsFolder) {
          const solutionFile = await solutionsFolder?.file(`${puzzleTitle}-solution.png`)?.async('blob');
          
          if (solutionFile) {
            saveAs(solutionFile, `${puzzleTitle}-solution.png`);
          }
        }
      } else {
        // Generate the zip file for multiple puzzles
        const zipContent = await zip.generateAsync({ type: 'blob' });
        saveAs(zipContent, `${kdpConfig.bookTitle.replace(/\s+/g, '-').toLowerCase()}-puzzles.zip`);
      }
      
      toast.success(
        generatedPuzzles.length === 1 
          ? 'PNG export completed!'
          : `${generatedPuzzles.length} puzzles exported as PNG files in a ZIP archive`
      );
    } catch (error) {
      console.error('PNG export error:', error);
      toast.error('Failed to export as PNG. Please try again.');
    } finally {
      setIsExporting(false);
      setGenerationProgress(0);
    }
  };

  // Add this function to get puzzle title based on numbering style
  const getPuzzleTitle = (puzzle: PuzzleWithMetadata) => {
    const { puzzleIndex, sectionIndex, difficultyLabel } = puzzle;
    
    switch (kdpConfig.puzzleNumberingStyle) {
      case 'sequential':
        return `${kdpConfig.puzzleNumberingPrefix} ${puzzleIndex + 1}`;
      
      case 'bySection':
        // Use first letter of difficulty as prefix
        const prefix = difficultyLabel.charAt(0).toUpperCase();
        
        // Count how many puzzles are in previous sections to number correctly within section
        let sectionStartIndex = 0;
        if (kdpConfig.difficultyMix === 'multiple') {
          for (let i = 0; i < sectionIndex; i++) {
            sectionStartIndex += kdpConfig.difficultySections[i].count;
          }
        }
        
        // Calculate the index within the current section
        const indexInSection = puzzleIndex - sectionStartIndex + 1;
        return `${prefix}${indexInSection}`;
      
      case 'customPrefix':
        return `${kdpConfig.puzzleNumberingPrefix} ${puzzleIndex + 1}`;
      
      default:
        return `Puzzle ${puzzleIndex + 1}`;
    }
  };

  // Update the PDFDoc code to ensure it works even with minimal puzzles
  const PDFDoc = generatedPuzzles.length > 0 ? (() => {
    console.log(`Creating PDF with ${generatedPuzzles.length} puzzles, ${kdpConfig.puzzlesPerPage} per page`);
    
    // Filter out invalid puzzles
    const validPuzzles = generatedPuzzles.filter(isValidPuzzle);
    console.log(`After filtering: ${validPuzzles.length} valid puzzles`);
    
    // Use only valid puzzles
    const allPuzzles = validPuzzles;
    
    // Group puzzles by page
    const puzzlesPerPage = kdpConfig.puzzlesPerPage;
    const puzzlePages: PuzzleWithMetadata[][] = [];
    
    // Only add pages with puzzles
    for (let i = 0; i < allPuzzles.length; i += puzzlesPerPage) {
      const pageGroup = allPuzzles.slice(i, i + puzzlesPerPage);
      if (pageGroup.length > 0) {
        puzzlePages.push(pageGroup);
      }
    }
    
    console.log(`Organized into ${puzzlePages.length} pages of puzzles`);
    
    // Calculate page dimensions based on book size (in inches)
    const [width, height] = kdpConfig.bookSize.split('x').map(Number);
    
    // Convert inches to points (72 points per inch for PDF)
    const pageWidth = width * 72;
    const pageHeight = height * 72;
    
    // Calculate margins in points
    const margins = {
      top: kdpConfig.topMargin * 72,
      bottom: kdpConfig.bottomMargin * 72,
      inner: kdpConfig.interiorMargin * 72,
      outer: kdpConfig.exteriorMargin * 72,
      gutter: kdpConfig.gutterMargin * 72,
    };

    // Calculate bleed in points (0.125 inches)
    const bleed = kdpConfig.hasBleed ? 9 : 0; // 0.125 * 72 = 9 points

    // Adjust puzzle wrapper width based on puzzles per page
    const getWrapperWidth = () => {
      switch(kdpConfig.puzzlesPerPage) {
        case 1: return '90%';
        case 2: return '90%';
        case 4: return '45%';
        case 6: return '30%';
        default: return '90%';
      }
    };

    // Get puzzle layout based on number of puzzles per page
    const getPuzzleLayout = (puzzles: PuzzleWithMetadata[], isSolution: boolean = false) => {
      switch(kdpConfig.puzzlesPerPage) {
        case 1: // Single puzzle layout
          return (
            <View style={pdfStyles.pageContent}>
              {puzzles.map((puzzle, puzzleIndex) => (
                <View key={puzzleIndex} style={[pdfStyles.puzzleWrapper, { 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  padding: '20pt 0',
                }]}>
                  <Text style={[pdfStyles.puzzleTitle, { fontSize: 26 }]}>
                    {getPuzzleTitle(puzzle)}
                  </Text>
                  <Text style={[pdfStyles.puzzleSubtitle, { 
                    fontSize: 18, 
                    marginBottom: 20,
                    marginTop: 5,
                  }]}>
                    {puzzle.difficultyLabel} Level
                  </Text>
                  <View style={[pdfStyles.gridContainer, { 
                    width: '70%', 
                    height: 400,
                    marginTop: 10,
                    marginBottom: 30,
                  }]}>
                    <SudokuPDFGrid
                      grid={isSolution ? puzzle.solution : puzzle.grid}
                      size={kdpConfig.gridSize}
                      hints={!isSolution && kdpConfig.includeHints ? puzzle.hints : undefined}
                      showSolution={isSolution}
                      isSinglePuzzle={true}
                      gridStyle={kdpConfig.gridStyle}
                      gridLineColor={kdpConfig.gridLineColor}
                      alternateBoxShading={kdpConfig.alternateBoxShading}
                      numberFont={kdpConfig.numberFont}
                    />
                  </View>
                </View>
              ))}
            </View>
          );
          
        case 2: // Two puzzles stacked vertically
          return (
            <View style={pdfStyles.pageContent}>
              {puzzles.map((puzzle, puzzleIndex) => (
                <View key={puzzleIndex} style={[pdfStyles.puzzleWrapper, { 
                  marginBottom: puzzleIndex === 0 ? 25 : 0,
                  marginTop: puzzleIndex === 0 ? 0 : 5,
                }]}>
                  <Text style={[pdfStyles.puzzleTitle, { marginBottom: 3 }]}>
                    {getPuzzleTitle(puzzle)}
                  </Text>
                  <Text style={[pdfStyles.puzzleSubtitle, { marginBottom: 8 }]}>
                    {puzzle.difficultyLabel} Level
                  </Text>
                  <View style={[pdfStyles.gridContainer, { width: '65%', height: 190 }]}>
                    <SudokuPDFGrid
                      grid={isSolution ? puzzle.solution : puzzle.grid}
                      size={kdpConfig.gridSize}
                      hints={!isSolution && kdpConfig.includeHints ? puzzle.hints : undefined}
                      showSolution={isSolution}
                      gridStyle={kdpConfig.gridStyle}
                      gridLineColor={kdpConfig.gridLineColor}
                      alternateBoxShading={kdpConfig.alternateBoxShading}
                      numberFont={kdpConfig.numberFont}
                    />
                  </View>
                </View>
              ))}
            </View>
          );
          
        case 4: // Four puzzles in 2x2 grid
          // Group puzzles into rows
          const rows = [];
          for (let i = 0; i < puzzles.length; i += 2) {
            const rowPuzzles = puzzles.slice(i, i + 2);
            rows.push(rowPuzzles);
          }
          
          return (
            <View style={pdfStyles.pageContent}>
              {rows.map((rowPuzzles, rowIndex) => (
                <View key={rowIndex} style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between',
                  marginBottom: rowIndex < rows.length - 1 ? 30 : 0,
                  width: '100%',
                }}>
                  {rowPuzzles.map((puzzle, puzzleIndex) => (
                    <View key={puzzleIndex} style={{ width: '48%' }}>
                      <Text style={[pdfStyles.puzzleTitle, { fontSize: 18 }]}>
                        {getPuzzleTitle(puzzle)}
                      </Text>
                      <Text style={[pdfStyles.puzzleSubtitle, { fontSize: 14, marginBottom: 10 }]}>
                        {puzzle.difficultyLabel} Level
                      </Text>
                      <View style={{ width: '100%', height: 180 }}>
                        <SudokuPDFGrid
                          grid={isSolution ? puzzle.solution : puzzle.grid}
                          size={kdpConfig.gridSize}
                          hints={!isSolution && kdpConfig.includeHints ? puzzle.hints : undefined}
                          showSolution={isSolution}
                          gridStyle={kdpConfig.gridStyle}
                          gridLineColor={kdpConfig.gridLineColor}
                          alternateBoxShading={kdpConfig.alternateBoxShading}
                          numberFont={kdpConfig.numberFont}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          );
          
        case 9: // Nine puzzles in 3x3 grid
          // Group puzzles into rows
          const gridRows = [];
          for (let i = 0; i < puzzles.length; i += 3) {
            const rowPuzzles = puzzles.slice(i, i + 3);
            gridRows.push(rowPuzzles);
          }
          
          return (
            <View style={pdfStyles.pageContent}>
              {gridRows.map((rowPuzzles, rowIndex) => (
                <View key={rowIndex} style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between',
                  marginBottom: rowIndex < gridRows.length - 1 ? 20 : 0,
                  width: '100%',
                }}>
                  {rowPuzzles.map((puzzle, puzzleIndex) => (
                    <View key={puzzleIndex} style={{ width: '32%' }}>
                      <Text style={[pdfStyles.puzzleTitle, { fontSize: 14 }]}>
                        {getPuzzleTitle(puzzle)}
                      </Text>
                      <Text style={[pdfStyles.puzzleSubtitle, { fontSize: 12, marginBottom: 5 }]}>
                        {puzzle.difficultyLabel} Level
                      </Text>
                      <View style={{ width: '100%', height: 100 }}>
                        <SudokuPDFGrid
                          grid={isSolution ? puzzle.solution : puzzle.grid}
                          size={kdpConfig.gridSize}
                          hints={!isSolution && kdpConfig.includeHints ? puzzle.hints : undefined}
                          showSolution={isSolution}
                          gridStyle={kdpConfig.gridStyle}
                          gridLineColor={kdpConfig.gridLineColor}
                          alternateBoxShading={kdpConfig.alternateBoxShading}
                          numberFont={kdpConfig.numberFont}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          );
          
        default:
          return null;
      }
    };

    // Create difficulty sections for multi-difficulty books
    const getPageTitle = (puzzles: PuzzleWithMetadata[], pageIndex: number) => {
      if (!puzzles || puzzles.length === 0) return '';

      if (kdpConfig.difficultyMix === 'multiple') {
        // Find the section this page belongs to
        const difficultyLabel = puzzles[0].difficultyLabel;
        
        return `${kdpConfig.bookTitle}${kdpConfig.showDifficultyInTitle ? ` - ${difficultyLabel}` : ''}`;
      } else {
        // Single difficulty
        return `${kdpConfig.bookTitle}${kdpConfig.showDifficultyInTitle ? ` - ${puzzles[0].difficultyLabel}` : ''}`;
      }
    };

    // Get section header for multi-difficulty books
    const getSectionHeader = (puzzles: PuzzleWithMetadata[], pageIndex: number) => {
      if (!puzzles || puzzles.length === 0 || kdpConfig.difficultyMix === 'single') return null;
      
      // Check if this is the first page of a section
      const sectionIndex = puzzles[0].sectionIndex;
      const prevPageSectionIndex = pageIndex > 0 && puzzlePages[pageIndex-1] && puzzlePages[pageIndex-1][0] 
        ? puzzlePages[pageIndex-1][0].sectionIndex 
        : -1;
      
      if (sectionIndex !== prevPageSectionIndex) {
        return (
          <Text style={pdfStyles.sectionTitle}>
            {puzzles[0].difficultyLabel} Level Puzzles
          </Text>
        );
      }
      
      return null;
    };

    // Create the PDF Document with all specified pages
    const pages: React.ReactNode[] = [];
    const solutionPages: React.ReactNode[] = [];
    
    // Group puzzles by difficulty for better organization
    const puzzlesByDifficulty: Record<string, PuzzleWithMetadata[]> = {};

    // Group puzzles by difficulty
    allPuzzles.forEach(puzzle => {
      if (!puzzlesByDifficulty[puzzle.difficultyLabel]) {
        puzzlesByDifficulty[puzzle.difficultyLabel] = [];
      }
      puzzlesByDifficulty[puzzle.difficultyLabel].push(puzzle);
    });

    // First create all puzzle pages
    puzzlePages.forEach((pagePuzzles, pageIndex) => {
      // Determine the difficulty of this page
      const pageDifficulty = pagePuzzles[0]?.difficultyLabel || 'Unknown';
      
      // Check if this is the first page of this difficulty
      const isFirstPageOfDifficulty = pageIndex === 0 || 
        (pageIndex > 0 && puzzlePages[pageIndex-1][0]?.difficultyLabel !== pageDifficulty);

      // Puzzle Page
      pages.push(
        <Page
          key={`puzzle-${pageIndex}`}
          size={[pageWidth + (bleed * 2), pageHeight + (bleed * 2)]}
          style={pdfStyles.page}
        >
          {/* Show section header only on the first page of each difficulty */}
          {isFirstPageOfDifficulty && (
            <Text style={pdfStyles.sectionTitle}>
              {pageDifficulty} Level Puzzles
            </Text>
          )}
          
          {/* Render puzzles in appropriate layout */}
          {getPuzzleLayout(pagePuzzles)}

          {/* Page number */}
          {kdpConfig.includePageNumbers && (
            <Text style={pdfStyles.pageNumber}>
              Page {pageIndex + 1}
            </Text>
          )}
        </Page>
      );

      // If solution placement is "afterEach", add solution page right after each puzzle page
      if (kdpConfig.includeSolutions && kdpConfig.solutionPlacement === 'afterEach') {
        solutionPages.push(
          <Page 
            key={`solution-after-${pageIndex}`}
            size={[pageWidth + (bleed * 2), pageHeight + (bleed * 2)]}
            style={pdfStyles.page}
          >
            <Text style={pdfStyles.solutionsHeader}>
              Solutions - {getPageTitle(pagePuzzles, pageIndex)}
            </Text>
            
            {/* Render solutions with the same layout as puzzles */}
            {getPuzzleLayout(pagePuzzles, true)}

            {/* Page number */}
            {kdpConfig.includePageNumbers && (
              <Text style={pdfStyles.pageNumber}>
                Solution Page {pageIndex + 1}
              </Text>
            )}
          </Page>
        );
      }
    });

    // Handle solution pages at the end of each difficulty level
    if (kdpConfig.includeSolutions && kdpConfig.solutionPlacement === 'endOfLevel') {
      if (kdpConfig.difficultyMix === 'multiple') {
        // Group puzzles by difficulty section
        const sections = kdpConfig.difficultySections;
        
        let startIndex = 0;
        sections.forEach((section, sectionIndex) => {
          const difficultyLabel = section.difficulty.charAt(0).toUpperCase() + section.difficulty.slice(1);
          const sectionPuzzles = allPuzzles.filter(p => p.sectionIndex === sectionIndex);
          const sectionPuzzlePages = Math.ceil(sectionPuzzles.length / kdpConfig.puzzlesPerPage);
          
          for (let pageIndex = 0; pageIndex < sectionPuzzlePages; pageIndex++) {
            const startPuzzleIndex = pageIndex * kdpConfig.puzzlesPerPage;
            const pagePuzzles = sectionPuzzles.slice(
              startPuzzleIndex, 
              startPuzzleIndex + kdpConfig.puzzlesPerPage
            );
            
            // Calculate left/right margins based on page being odd/even
            const isEvenPage = (startIndex + pageIndex + 1) % 2 === 0;
            const pageMargins = {
              top: margins.top,
              bottom: margins.bottom,
              left: isEvenPage ? margins.outer : margins.inner,
              right: isEvenPage ? margins.inner : margins.outer,
            };

            // Only add solution pages at the end of the section
            if (pageIndex === sectionPuzzlePages - 1) {
              solutionPages.push(
                <Page 
                  key={`solution-section-${sectionIndex}`}
                  size={[pageWidth + (bleed * 2), pageHeight + (bleed * 2)]}
                  style={pdfStyles.page}
                >
                  <Text style={pdfStyles.solutionsHeader}>{difficultyLabel} Level Solutions</Text>
                  
                  <Text style={pdfStyles.puzzleSubtitle}>
                    Solutions for puzzles {startIndex + 1}-{startIndex + sectionPuzzles.length}
                  </Text>
                </Page>
              );
              
              // Add specific solution pages for this section
              for (let solPageIndex = 0; solPageIndex < sectionPuzzlePages; solPageIndex++) {
                const startSolPuzzleIndex = solPageIndex * kdpConfig.puzzlesPerPage;
                const solPagePuzzles = sectionPuzzles.slice(
                  startSolPuzzleIndex, 
                  startSolPuzzleIndex + kdpConfig.puzzlesPerPage
                );
                
                solutionPages.push(
                  <Page 
                    key={`solution-section-${sectionIndex}-page-${solPageIndex}`}
                    size={[pageWidth + (bleed * 2), pageHeight + (bleed * 2)]}
                    style={pdfStyles.page}
                  >
                    <Text style={pdfStyles.subtitle}>
                      Puzzles {startIndex + startSolPuzzleIndex + 1} to {Math.min(startIndex + startSolPuzzleIndex + kdpConfig.puzzlesPerPage, startIndex + sectionPuzzles.length)}
                    </Text>
                    
                    {/* Render solutions */}
                    {getPuzzleLayout(solPagePuzzles, true)}

                    {/* Optional page numbers for solutions */}
                    {kdpConfig.includePageNumbers && (
                      <Text style={pdfStyles.pageNumber}>
                        Solution Page {solPageIndex + 1}
                      </Text>
                    )}
                  </Page>
                );
              }
            }
          }
          
          startIndex += sectionPuzzles.length;
        });
      } else {
        // Single difficulty - just add solutions at the end
        solutionPages.push(
          <Page 
            key="solution-all"
            size={[pageWidth + (bleed * 2), pageHeight + (bleed * 2)]}
            style={pdfStyles.page}
          >
            <Text style={pdfStyles.solutionsHeader}>Solutions</Text>
            <Text style={pdfStyles.subtitle}>All Puzzles</Text>
          </Page>
        );
        
        puzzlePages.forEach((pagePuzzles, pageIndex) => {
          // Calculate left/right margins based on page being odd/even
          const isEvenPage = (pageIndex + 1) % 2 === 0;
          const pageMargins = {
            top: margins.top,
            bottom: margins.bottom,
            left: isEvenPage ? margins.outer : margins.inner,
            right: isEvenPage ? margins.inner : margins.outer,
          };
          
          solutionPages.push(
            <Page 
              key={`solution-page-${pageIndex}`}
              size={[pageWidth + (bleed * 2), pageHeight + (bleed * 2)]}
              style={pdfStyles.page}
            >
              <Text style={pdfStyles.subtitle}>Puzzle {pageIndex + 1}</Text>
              
              {/* Render solutions with the same layout as puzzles */}
              {getPuzzleLayout(pagePuzzles, true)}

              {/* Optional page numbers for solutions */}
              {kdpConfig.includePageNumbers && (
                <Text style={pdfStyles.pageNumber}>
                  Solution Page {pageIndex + 1}
                </Text>
              )}
            </Page>
          );
        });
      }
    }

    // Handle solution pages at the end of the book
    if (kdpConfig.includeSolutions && kdpConfig.solutionPlacement === 'endOfBook') {
      solutionPages.push(
        <Page 
          key="solution-cover"
          size={[pageWidth + (bleed * 2), pageHeight + (bleed * 2)]}
          style={pdfStyles.page}
        >
          <Text style={pdfStyles.solutionsHeader}>Solutions</Text>
          <Text style={pdfStyles.subtitle}>All Puzzles</Text>
        </Page>
      );
      
      puzzlePages.forEach((pagePuzzles, pageIndex) => {
        // Calculate left/right margins based on page being odd/even
        const isEvenPage = (pageIndex + 1) % 2 === 0;
        const pageMargins = {
          top: margins.top,
          bottom: margins.bottom,
          left: isEvenPage ? margins.outer : margins.inner,
          right: isEvenPage ? margins.inner : margins.outer,
        };
        
        solutionPages.push(
          <Page 
            key={`solution-end-${pageIndex}`}
            size={[pageWidth + (bleed * 2), pageHeight + (bleed * 2)]}
            style={pdfStyles.page}
          >
            <Text style={pdfStyles.subtitle}>
              Solution for {pagePuzzles.map(puzzle => getPuzzleTitle(puzzle)).join(', ')}
            </Text>
            
            {/* Render solutions with the same layout as puzzles */}
            {getPuzzleLayout(pagePuzzles, true)}

            {/* Optional page numbers for solutions */}
            {kdpConfig.includePageNumbers && (
              <Text style={pdfStyles.pageNumber}>
                Solution Page {pageIndex + 1}
              </Text>
            )}
          </Page>
        );
      });
    }

    // Combine all pages based on solution placement strategy
    let allPages;
    if (kdpConfig.includeSolutions) {
      if (kdpConfig.solutionPlacement === 'afterEach') {
        // Solutions are already interleaved with puzzles
        allPages = pages;
      } else {
        // Add solutions at the end
        allPages = [...pages, ...solutionPages];
      }
    } else {
      // No solutions
      allPages = pages;
    }

    return (
      <Document>
        {allPages}
      </Document>
    );
  })() : null;

  // Add an effect to log state changes instead of in JSX
  useEffect(() => {
    console.log("State updated:", {
      activeView,
      generatedPuzzles: generatedPuzzles.length,
      isPDFGenerating,
      showPDFPreview,
      hasPDFDoc: !!PDFDoc
    });
  }, [activeView, generatedPuzzles.length, isPDFGenerating, showPDFPreview, PDFDoc]);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/50 via-background to-background relative overflow-hidden p-6">
      {/* Enhanced animated background elements */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-2xl animate-pulse delay-700" />
        
        {/* Particle grid background */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGZpbGw9IiMxYTFhMWEiIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMzAgMzBoMzB2MzBIMzB6TTAgMzBoMzB2MzBIMHoiIGZpbGwtb3BhY2l0eT0iLjAyIiBmaWxsPSIjZmZmIi8+PHBhdGggZD0iTTMwIDBIMHYzMGgzMHpNNjAgMEgzMHYzMGgzMHoiIGZpbGwtb3BhY2l0eT0iLjAyIiBmaWxsPSIjZmZmIi8+PC9nPjwvc3ZnPg==')] opacity-10" />
        
        {/* Floating grid patterns */}
        <div className="absolute top-1/4 left-1/4 w-16 h-16 border border-emerald-500/20 rounded-lg opacity-20 animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-16 h-16 border border-emerald-500/20 rounded-lg opacity-20 animate-float-delayed" />
        <div className="absolute top-1/2 left-1/3 w-6 h-6 border border-emerald-500/20 rounded opacity-20 animate-float" />
        <div className="absolute bottom-1/3 right-1/5 w-8 h-8 border border-emerald-500/20 rounded-full opacity-20 animate-float-delayed" />
        
        {/* Subtle grid lines */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Clean Header with Floating Emojis */}
        <div className="text-center mb-20 relative">
          {/* Floating emojis background - Remove overflow:hidden and expand container */}
          <div className="absolute inset-x-[-100px] inset-y-[-100px] pointer-events-none">
            {/* Puzzle piece emoji - adjusted positioning to stay in bounds */}
            <div className="absolute top-[20%] right-[30%] animate-float-emoji-1">
              <span className="text-4xl opacity-40">🧩</span>
            </div>
            <div className="absolute bottom-[20%] left-[20%] animate-float-emoji-2">
              <span className="text-3xl opacity-40">🧩</span>
            </div>
            
            {/* Number emojis - adjusted positioning to stay in bounds */}
            <div className="absolute top-[40%] left-[25%] animate-float-emoji-3">
              <span className="text-3xl opacity-30">1️⃣</span>
            </div>
            <div className="absolute bottom-[30%] right-[20%] animate-float-emoji-4">
              <span className="text-3xl opacity-30">5️⃣</span>
            </div>
            <div className="absolute top-[60%] left-[35%] animate-float-emoji-5">
              <span className="text-3xl opacity-30">9️⃣</span>
            </div>
            
            {/* Book and game emojis - adjusted positioning to stay in bounds */}
            <div className="absolute top-[45%] right-[25%] animate-float-emoji-6">
              <span className="text-3xl opacity-30">📚</span>
            </div>
            <div className="absolute top-[15%] left-[35%] animate-float-emoji-7">
              <span className="text-3xl opacity-30">🎮</span>
            </div>
            <div className="absolute bottom-[15%] right-[35%] animate-float-emoji-8">
              <span className="text-2xl opacity-30">🎯</span>
            </div>
            
            {/* Subtle glow effects */}
            <div className="absolute -top-20 left-1/2 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 right-1/3 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl"></div>
          </div>
          
          {/* Logo Container with subtle glow */}
          <div className="relative mb-8 inline-block">
            <div className="relative bg-emerald-900/60 backdrop-blur-sm p-1 rounded-full border border-emerald-500/30 overflow-hidden">
              <div className="relative z-10 bg-emerald-900/50 p-4 rounded-full flex items-center justify-center">
                <Grid className="w-12 h-12 text-emerald-400" style={{ filter: 'drop-shadow(0 0 8px rgba(52, 211, 153, 0.5))' }} />
              </div>
            </div>
          </div>
          
          {/* Modern Title Section */}
          <div className="relative">
            {/* Badge with subtle animation */}
            <div className="absolute -top-6 -right-6 animate-float">
              <div className="relative bg-emerald-900/60 px-4 py-1.5 rounded-full text-emerald-400 text-sm font-medium border border-emerald-500/30 backdrop-blur-sm">
                <span className="flex items-center">
                  KDP Ready <span className="ml-1.5">✨</span>
                </span>
              </div>
            </div>
            
            {/* Simple, elegant title */}
            <h1 className="text-7xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-green-300 to-emerald-500 drop-shadow-md">
              <span>Sudoku Generator</span>
              <span className="ml-4 text-5xl inline-block animate-bounce-slow">🧩</span>
            </h1>
            
            {/* Subtitle with gradient underline */}
            <div className="relative">
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 font-light">
                Create professional KDP-ready Sudoku puzzle books with customizable settings
              </p>
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent"></div>
            </div>
          </div>
        </div>
        
        {/* Feature Pills - clean and modern */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <div className="bg-emerald-900/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium border border-emerald-500/20 text-emerald-400 flex items-center space-x-2">
            <span className="text-lg">🖨️</span>
            <span>Print-Ready PDFs</span>
          </div>
          
          <div className="bg-emerald-900/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium border border-emerald-500/20 text-emerald-400 flex items-center space-x-2">
            <span className="text-lg">📏</span>
            <span>Multiple Layouts (1-9 puzzles/page)</span>
          </div>
          
          <div className="bg-emerald-900/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium border border-emerald-500/20 text-emerald-400 flex items-center space-x-2">
            <span className="text-lg">🔄</span>
            <span>Batch Generation</span>
          </div>
          
          <div className="bg-emerald-900/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium border border-emerald-500/20 text-emerald-400 flex items-center space-x-2">
            <span className="text-lg">📊</span>
            <span>Multiple Difficulty Levels</span>
          </div>
          
          <div className="bg-emerald-900/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium border border-emerald-500/20 text-emerald-400 flex items-center space-x-2">
            <span className="text-lg">💾</span>
            <span>PNG Export Support</span>
          </div>
        </div>

        {/* Fix for style linter error - completely replace the jsx global style tag */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes pulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 0.8; }
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          
          @keyframes bounce-slow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
          }
          
          @keyframes float-emoji-1 {
            0%, 100% { transform: translate(0, 0); }
            25% { transform: translate(15px, -15px); }
            50% { transform: translate(25px, 0); }
            75% { transform: translate(15px, 15px); }
          }
          
          @keyframes float-emoji-2 {
            0%, 100% { transform: translate(0, 0); }
            25% { transform: translate(-10px, 15px); }
            50% { transform: translate(-25px, 0); }
            75% { transform: translate(-10px, -15px); }
          }
          
          @keyframes float-emoji-3 {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            33% { transform: translate(10px, 15px) rotate(5deg); }
            66% { transform: translate(-10px, 20px) rotate(-5deg); }
          }
          
          @keyframes float-emoji-4 {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            33% { transform: translate(-15px, -10px) rotate(-5deg); }
            66% { transform: translate(15px, -15px) rotate(5deg); }
          }
          
          @keyframes float-emoji-5 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(-20px, 10px) scale(1.1); }
          }
          
          @keyframes float-emoji-6 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(20px, -15px) scale(1.1); }
          }
          
          @keyframes float-emoji-7 {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            25% { transform: translate(15px, 10px) rotate(10deg); }
            75% { transform: translate(-15px, 15px) rotate(-10deg); }
          }
          
          @keyframes float-emoji-8 {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            33% { transform: translate(20px, -10px) rotate(15deg); }
            66% { transform: translate(-10px, -20px) rotate(-15deg); }
          }
          
          .animate-pulse {
            animation: pulse 4s ease-in-out infinite;
          }
          
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
          
          .animate-bounce-slow {
            animation: bounce-slow 3s ease-in-out infinite;
          }
          
          .animate-float-emoji-1 {
            animation: float-emoji-1 20s ease-in-out infinite;
          }
          
          .animate-float-emoji-2 {
            animation: float-emoji-2 18s ease-in-out infinite;
          }
          
          .animate-float-emoji-3 {
            animation: float-emoji-3 15s ease-in-out infinite;
          }
          
          .animate-float-emoji-4 {
            animation: float-emoji-4 22s ease-in-out infinite;
          }
          
          .animate-float-emoji-5 {
            animation: float-emoji-5 17s ease-in-out infinite;
          }
          
          .animate-float-emoji-6 {
            animation: float-emoji-6 25s ease-in-out infinite;
          }
          
          .animate-float-emoji-7 {
            animation: float-emoji-7 19s ease-in-out infinite;
          }
          
          .animate-float-emoji-8 {
            animation: float-emoji-8 23s ease-in-out infinite;
          }
          
          .delay-700 {
            animation-delay: 700ms;
          }
          
          .delay-1000 {
            animation-delay: 1000ms;
          }
        ` }} />

        {/* Enhanced Tab Navigation - with subtle glow effect */}
        <div className="flex justify-center mb-12">
          <div className="bg-background/30 p-1 rounded-full backdrop-blur-md shadow-lg border border-emerald-500/20 relative">
            {/* Glowing background for active tab */}
            <div className={`absolute top-0 left-0 h-full rounded-full transition-all duration-300 ${
              activeView === 'settings' 
                ? 'w-[50%] translate-x-0 bg-emerald-500/5 blur animate-pulse' 
                : 'w-[50%] translate-x-full bg-emerald-500/5 blur animate-pulse'
            }`}></div>
            
            <div className="flex space-x-1 relative z-10">
              <Button
                onClick={() => setActiveView('settings')}
                variant={activeView === 'settings' ? 'default' : 'ghost'}
                className={`rounded-full px-6 transition-all duration-300 ${
                  activeView === 'settings' 
                    ? 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30 border border-emerald-500/30 shadow-emerald-glow' 
                    : 'text-muted-foreground hover:bg-emerald-500/10'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 mr-2">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </Button>
              <Button
                onClick={() => setActiveView('preview')}
                variant={activeView === 'preview' ? 'default' : 'ghost'}
                className={`rounded-full px-6 transition-all duration-300 ${
                  activeView === 'preview' 
                    ? 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30 border border-emerald-500/30 shadow-emerald-glow' 
                    : 'text-muted-foreground hover:bg-emerald-500/10'
                }`}
                disabled={isPDFGenerating}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 mr-2">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview
                {isPDFGenerating && (
                  <div className="ml-2 relative flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-emerald-500/30 blur-sm animate-pulse"></div>
                    <span className="relative z-10 bg-emerald-900/60 text-emerald-400 text-xs px-2 py-1 rounded-full border border-emerald-500/30">
                      {Math.round(generationProgress)}%
                    </span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Settings View - content remains the same */}
        {activeView === 'settings' && (
          <div className="flex flex-col space-y-8 animate-in fade-in duration-300">
            {/* Section 1: Settings */}
            <div className="bg-background/40 backdrop-blur-md p-8 rounded-2xl border border-emerald-500/20 shadow-lg relative overflow-hidden">
              <div className="absolute -right-20 -top-20 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <div className="flex items-center mb-6">
                  <div className="bg-emerald-500/10 p-2 rounded-full mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6 text-emerald-400">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-500">Configure Settings</h2>
                    <p className="text-muted-foreground">Customize your puzzle book settings below</p>
                  </div>
                </div>

                <SudokuKDPSettings
                  config={kdpConfig}
                  onChange={(newConfig) => {
                    // Reset generated puzzles when config changes
                    setGeneratedPuzzles([]);
                    setKDPConfig(newConfig);
                  }}
                />
              </div>
            </div>

            {/* Section 2: Generation Controls - Updated styling */}
            <div className="bg-background/40 backdrop-blur-md p-8 rounded-2xl border border-emerald-500/20 shadow-lg relative overflow-hidden">
              <div className="absolute -left-20 -bottom-20 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <div className="flex items-center mb-6">
                  <div className="bg-emerald-500/10 p-2 rounded-full mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6 text-emerald-400">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-500">Generate Puzzles</h2>
                    <p className="text-muted-foreground">Generate your Sudoku puzzles based on the settings above</p>
                  </div>
                </div>

                <Button 
                  className="w-full h-16 gap-2 text-lg font-medium group relative overflow-hidden" 
                  onClick={() => {
                    handleViewPDF();
                    setActiveView('preview');
                  }}
                  disabled={isGenerating || isPDFGenerating}
                >
                  <span className="relative z-10 flex items-center">
                    {isPDFGenerating ? (
                      <>
                        <Sparkles className="w-6 h-6 animate-pulse mr-2" />
                        Generating... {Math.round(generationProgress)}%
                      </>
                    ) : (
                      <>
                        <span className="mr-3 text-xl">🚀</span>
                        Generate Puzzles
                      </>
                    )}
                  </span>
                  {!isPDFGenerating && (
                    <span className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-400 opacity-80 group-hover:opacity-100 transition-opacity duration-300"></span>
                  )}
                </Button>
                
                {/* High Performance Note - Updated styling */}
                <div className="mt-6 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-sm">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-2xl">⚡</div>
                    <div>
                      <p className="font-medium text-emerald-400">High Performance Mode</p>
                      <p className="text-muted-foreground">This generator can handle up to 1,000 puzzles efficiently. Download as PDF or PNG.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PDF Features section */}
            <div className="bg-background/40 backdrop-blur-md p-8 rounded-2xl border border-emerald-500/20 shadow-lg relative overflow-hidden">
              <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <div className="flex items-center mb-6">
                  <div className="bg-emerald-500/10 p-2 rounded-full mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6 text-emerald-400">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-500">PDF Generator Features</h2>
                    <p className="text-muted-foreground">Everything you need to create professional Sudoku books</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-background/30 backdrop-blur-sm p-5 rounded-xl border border-emerald-500/10">
                    <div className="text-3xl mb-2">📏</div>
                    <h3 className="text-lg font-medium text-emerald-400 mb-1">Multiple Layouts</h3>
                    <p className="text-sm text-muted-foreground">Choose from 1, 2, 4, or 9 puzzles per page layouts</p>
                  </div>
                  <div className="bg-background/30 backdrop-blur-sm p-5 rounded-xl border border-emerald-500/10">
                    <div className="text-3xl mb-2">⚙️</div>
                    <h3 className="text-lg font-medium text-emerald-400 mb-1">Custom Difficulties</h3>
                    <p className="text-sm text-muted-foreground">Easy, Medium, Hard, or custom difficulty mix</p>
                  </div>
                  <div className="bg-background/30 backdrop-blur-sm p-5 rounded-xl border border-emerald-500/10">
                    <div className="text-3xl mb-2">📚</div>
                    <h3 className="text-lg font-medium text-emerald-400 mb-1">Solution Options</h3>
                    <p className="text-sm text-muted-foreground">Include solutions after each puzzle or at the end</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-background/30 backdrop-blur-sm p-5 rounded-xl border border-emerald-500/10">
                    <div className="text-3xl mb-2">📱</div>
                    <h3 className="text-lg font-medium text-emerald-400 mb-1">Sizing & Format</h3>
                    <p className="text-sm text-muted-foreground">KDP-ready formats with bleed settings & proper margins</p>
                  </div>
                  <div className="bg-background/30 backdrop-blur-sm p-5 rounded-xl border border-emerald-500/10">
                    <div className="text-3xl mb-2">💾</div>
                    <h3 className="text-lg font-medium text-emerald-400 mb-1">Export Options</h3>
                    <p className="text-sm text-muted-foreground">Download as PDF or PNG for flexibility</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview View - Maintain existing functionality with updated styling */}
        {activeView === 'preview' && (
          <div className="animate-in fade-in duration-300">
            <div className="bg-background/40 backdrop-blur-md p-8 rounded-2xl border border-emerald-500/20 shadow-lg relative overflow-hidden">
              <div className="absolute -right-20 -top-20 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl"></div>
              <div className="absolute -left-20 -bottom-20 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="bg-emerald-500/10 p-2 rounded-full mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6 text-emerald-400">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-500">Puzzle Preview</h2>
                      <p className="text-muted-foreground">{generatedPuzzles.length > 0 ? `${generatedPuzzles.length} puzzles generated` : "No puzzles generated yet"}</p>
                    </div>
                  </div>
                  
                  {/* Download buttons in header - simplified conditional check */}
                  {generatedPuzzles.length > 0 && (
                    <div className="flex gap-2">
                      {PDFDoc && (
                        <PDFDownloadLink
                          document={PDFDoc}
                          fileName={`${kdpConfig.bookTitle.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`}
                        >
                          {({ loading, error }) => (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="border-emerald-500/20 hover:bg-emerald-500/10"
                              disabled={loading || !!error}
                            >
                              <Download className="w-4 h-4 mr-1 text-emerald-400" />
                              {loading ? 'Preparing...' : 'PDF'}
                            </Button>
                          )}
                        </PDFDownloadLink>
                      )}
                      
                      <Button 
                        variant="outline"
                        size="sm"
                        className="border-emerald-500/20 hover:bg-emerald-500/10"
                        onClick={handleExportPNG}
                        disabled={isExporting || !generatedPuzzles.length}
                      >
                        <FileType className="w-4 h-4 mr-1 text-emerald-400" />
                        {isExporting ? 'Exporting...' : 'PNG'}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Enlarged PDF preview area with styling updates */}
                <div className="w-full h-[75vh] bg-background/30 rounded-xl shadow-lg overflow-hidden border border-emerald-500/20">
                  {isPDFGenerating ? (
                    <div className="h-full grid place-items-center">
                      <div className="text-center space-y-6 w-full max-w-md px-8 py-12 bg-background/70 backdrop-blur-md rounded-xl border border-emerald-500/20 shadow-lg">
                        <Sparkles className="w-12 h-12 text-emerald-400 animate-pulse mx-auto" />
                        <p className="text-xl font-medium text-emerald-300">Generating Your Puzzles</p>
                        <div className="space-y-2">
                          <div className="h-3 w-full bg-background/50 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-400 to-green-300 transition-all duration-300" 
                              style={{ width: `${generationProgress}%` }}
                            ></div>
                          </div>
                          <p className="text-sm text-emerald-300/80">{Math.round(generationProgress)}% complete</p>
                        </div>
                        <p className="text-xs text-muted-foreground pt-2">This may take a moment depending on your settings</p>
                      </div>
                    </div>
                  ) : generatedPuzzles.length > 0 ? (
                    PDFDoc ? (
                      <PDFViewer width="100%" height="100%">
                        {PDFDoc}
                      </PDFViewer>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                          <div className="inline-block rounded-full p-3 bg-emerald-500/10 mb-3">
                            <svg className="animate-spin h-8 w-8 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                          <p className="text-emerald-400 text-lg">Building PDF preview...</p>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="h-full grid place-items-center">
                      <div className="text-center space-y-5">
                        <div className="p-6 rounded-full bg-emerald-500/10 mx-auto">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-12 h-12 text-emerald-400/60">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-xl font-medium mb-2 text-emerald-300">No Puzzles Generated Yet</h3>
                          <p className="text-base text-muted-foreground max-w-md mx-auto px-4 mb-4">
                            Return to Settings and click "Generate Puzzles" to create your Sudoku book
                          </p>
                          <Button 
                            className="backdrop-blur-sm bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
                            onClick={() => setActiveView('settings')}
                          >
                            Go to Settings
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Bottom download buttons with styling updates */}
                {generatedPuzzles.length > 0 && (
                  <div className="mt-6 flex gap-4">
                    {PDFDoc && (
                      <PDFDownloadLink
                        document={PDFDoc}
                        fileName={`${kdpConfig.bookTitle.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`}
                      >
                        {({ loading, error }) => (
                          <Button 
                            className="flex-1 gap-2 bg-gradient-to-r from-emerald-500 to-green-400 text-white hover:opacity-90" 
                            disabled={loading || !!error}
                          >
                            <Download className="w-5 h-5" />
                            {loading ? 'Preparing PDF...' : error ? 'Error - Try Again' : 'Download PDF'}
                          </Button>
                        )}
                      </PDFDownloadLink>
                    )}
                    
                    <Button 
                      className="flex-1 gap-2 backdrop-blur-sm bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
                      onClick={handleExportPNG}
                      disabled={isExporting || !generatedPuzzles.length}
                    >
                      {isExporting ? (
                        <Sparkles className="w-5 h-5 animate-pulse" />
                      ) : (
                        <FileType className="w-5 h-5" />
                      )}
                      {isExporting ? 'Exporting...' : 'Download as PNG'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer - added animated credit */}
      <div className="mt-10 text-center text-xs text-muted-foreground">
        <p className="mb-2">
          <span className="inline-block animate-pulse">✨</span> Sudoku Generator | Craft the perfect puzzle books with ease
        </p>
      </div>
    </div>
  );
}; 