import { SudokuService } from '../services/sudoku';

// Message types
type GenerationMessage = {
  type: 'generate';
  config: {
    difficultyMix: 'single' | 'multiple';
    difficulty: string;
    gridSize: string;
    difficultySections: Array<{ difficulty: string; count: number }>;
    includeHints: boolean;
    puzzlesPerPage: number;
    bookSize: string;
    interiorMargin: number;
    exteriorMargin: number;
    topMargin: number;
    bottomMargin: number;
    hasBleed: boolean;
    gutterMargin: number;
    numberOfPages: number;
    colorMode: string;
    includeSolutions: boolean;
    solutionPlacement: string;
    includePageNumbers: boolean;
    bookTitle: string;
    showDifficultyInTitle: boolean;
  };
};

type ProgressMessage = {
  type: 'progress';
  progress: number;
  currentBatch: number;
  totalBatches: number;
};

type CompletionMessage = {
  type: 'complete';
  puzzles: Array<{
    grid: number[][];
    solution: number[][];
    hints?: string[];
    sectionIndex: number;
    puzzleIndex: number;
    difficultyLabel: string;
  }>;
  pageCount: number;
};

type ErrorMessage = {
  type: 'error';
  error: string;
};

// Use a larger batch size for faster processing
const BATCH_SIZE = 50;
// Use a cache for already generated puzzles to avoid duplicate work
const puzzleCache: Record<string, Array<{grid: number[][]; solution: number[][]; hints?: string[]}>> = {};

// Function to validate puzzles
function isValidPuzzle(puzzle: any) {
  if (!puzzle || !puzzle.grid || !puzzle.solution) return false;
  
  // Check if grid has some values (not all zeroes)
  const hasValues = puzzle.grid.some((row: number[]) => 
    row.some((cell: number) => cell !== 0)
  );
  
  return hasValues;
}

// Handle messages from the main thread
self.onmessage = async (event: MessageEvent<GenerationMessage>) => {
  if (event.data.type === 'generate') {
    try {
      const { config } = event.data;
      // Calculate how many puzzles we need
      let totalPuzzleCount = 0;
      
      if (config.difficultyMix === 'single') {
        // Calculate based on user settings
        totalPuzzleCount = config.puzzlesPerPage * config.numberOfPages;
        // Limit to a reasonable amount to prevent browser crashes
        totalPuzzleCount = Math.min(totalPuzzleCount, 200);
        console.log(`[Worker] Generating ${totalPuzzleCount} puzzles for single difficulty (${config.difficulty})`);
      } else {
        // Calculate the total from all difficulty sections
        totalPuzzleCount = config.difficultySections.reduce((sum, section) => sum + section.count, 0);
        // Limit to a reasonable amount
        totalPuzzleCount = Math.min(totalPuzzleCount, 200); 
        console.log(`[Worker] Generating ${totalPuzzleCount} puzzles for multiple difficulties`);
      }
      
      // Calculate page count 
      const pageCount = Math.ceil(totalPuzzleCount / config.puzzlesPerPage);
      console.log(`[Worker] Calculated ${pageCount} pages needed for ${totalPuzzleCount} puzzles, ${config.puzzlesPerPage} per page`);
      
      // Generate the puzzles (generate extras to account for potential invalid puzzles)
      const extraPuzzleCount = Math.min(20, Math.floor(totalPuzzleCount * 0.1)); // Generate 10% extra puzzles, up to 20
      const puzzles = await generatePuzzles(config, totalPuzzleCount + extraPuzzleCount);
      
      // Filter out any invalid puzzles
      const validPuzzles = puzzles.filter(isValidPuzzle);
      console.log(`[Worker] Generated ${validPuzzles.length} valid puzzles out of ${puzzles.length} total`);
      
      // Make sure we have enough valid puzzles
      if (validPuzzles.length === 0) {
        throw new Error("Failed to generate any valid puzzles");
      }
      
      // Ensure we only return the requested number of puzzles
      const finalPuzzles = validPuzzles.slice(0, totalPuzzleCount);
      
      // Send the completed puzzles back to the main thread
      const completionMessage: CompletionMessage = {
        type: 'complete',
        puzzles: finalPuzzles,
        pageCount: Math.ceil(finalPuzzles.length / config.puzzlesPerPage)
      };
      
      self.postMessage(completionMessage);
    } catch (error) {
      console.error('[Worker] Error:', error);
      const errorMessage: ErrorMessage = {
        type: 'error',
        error: error instanceof Error ? error.message : String(error)
      };
      
      self.postMessage(errorMessage);
    }
  }
};

// Pre-cache common puzzle configurations
async function preloadCommonPuzzles() {
  // Pre-generate a few puzzles for each common difficulty and size
  const difficulties = ['easy', 'medium', 'hard'];
  const sizes = ['9x9', '6x6', '4x4'];
  
  for (const difficulty of difficulties) {
    for (const size of sizes) {
      const cacheKey = `${difficulty}-${size}`;
      if (!puzzleCache[cacheKey]) {
        puzzleCache[cacheKey] = [];
      }
      
      // Generate 10 puzzles of each type in the background (increased from 5)
      if (puzzleCache[cacheKey].length < 10) {
        const countToGenerate = 10 - puzzleCache[cacheKey].length;
        try {
          for (let i = 0; i < countToGenerate; i++) {
            const puzzle = SudokuService.generatePuzzle(difficulty, size);
            puzzleCache[cacheKey].push({
              grid: puzzle.grid,
              solution: puzzle.solution,
              hints: puzzle.hints
            });
            
            // Yield more frequently to prevent blocking
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        } catch (e) {
          console.error(`Error preloading puzzles for ${cacheKey}:`, e);
        }
      }
    }
  }
}

// Start preloading common puzzles as soon as the worker initializes
preloadCommonPuzzles();

// Get a puzzle either from cache or generate a new one
function getPuzzle(difficulty: string, gridSize: string, includeHints: boolean) {
  const cacheKey = `${difficulty}-${gridSize}`;
  
  // Initialize cache for this key if it doesn't exist
  if (!puzzleCache[cacheKey]) {
    puzzleCache[cacheKey] = [];
  }
  
  let puzzle;
  let attempts = 0;
  const maxAttempts = 3;
  
  // Try to get a valid puzzle with multiple attempts if needed
  while (attempts < maxAttempts) {
    attempts++;
    
    // Use a cached puzzle if available
    if (puzzleCache[cacheKey].length > 0) {
      puzzle = puzzleCache[cacheKey].pop()!;
    } else {
      // Otherwise generate a new puzzle
      puzzle = SudokuService.generatePuzzle(difficulty, gridSize);
    }
    
    // Verify this is a valid puzzle
    if (isValidPuzzle(puzzle)) {
      return {
        grid: puzzle.grid,
        solution: puzzle.solution,
        hints: includeHints ? puzzle.hints : undefined
      };
    }
  }
  
  // If we couldn't get a valid puzzle after multiple attempts, generate a fallback
  const gridSize1D = parseInt(gridSize.split('x')[0]);
  const fallbackPuzzle = SudokuService.generatePuzzle(difficulty, gridSize);
  
  return {
    grid: fallbackPuzzle.grid,
    solution: fallbackPuzzle.solution,
    hints: includeHints ? fallbackPuzzle.hints : undefined
  };
}

// More efficient puzzle generation with worker-specific optimizations
async function generatePuzzles(config: GenerationMessage['config'], maxPuzzles: number) {
  const allPuzzles: CompletionMessage['puzzles'] = [];
  
  // Parallel generation for better performance
  const generatePuzzlesBatch = async (
    difficulty: string, 
    count: number, 
    sectionIndex: number, 
    startIndex: number
  ) => {
    const difficultyLabel = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    const batchResults = [];
    
    console.log(`[Worker] Generating batch of ${count} puzzles with difficulty ${difficulty}`);
    
    // Generate puzzles in this batch
    for (let i = 0; i < count; i++) {
      try {
        const puzzle = getPuzzle(difficulty, config.gridSize, config.includeHints);
        
        // Validate the puzzle data is complete
        if (!puzzle.grid || !puzzle.solution) {
          throw new Error('Invalid puzzle generated');
        }
        
        // Ensure grid and solution are properly structured
        const validatedPuzzle = {
          grid: puzzle.grid.map(row => [...row]),
          solution: puzzle.solution.map(row => [...row]),
          hints: puzzle.hints ? [...puzzle.hints] : undefined,
          sectionIndex,
          puzzleIndex: startIndex + i,
          difficultyLabel
        };
        
        batchResults.push(validatedPuzzle);
      } catch (e) {
        console.error(`Failed to generate puzzle ${i} in batch, retrying...`, e);
        // Try one more time
        try {
          const puzzle = SudokuService.generatePuzzle(difficulty, config.gridSize);
          if (!puzzle.grid || !puzzle.solution) {
            throw new Error('Invalid puzzle generated in retry');
          }
          
          batchResults.push({
            grid: puzzle.grid.map(row => [...row]),
            solution: puzzle.solution.map(row => [...row]),
            hints: config.includeHints ? puzzle.hints : undefined,
            sectionIndex,
            puzzleIndex: startIndex + i,
            difficultyLabel
          });
        } catch (retryError) {
          console.error(`Failed to generate puzzle ${i} in batch after retry`, retryError);
          // Add a placeholder puzzle to avoid breaking the sequence
          const size = parseInt(config.gridSize.split('x')[0]);
          const emptyGrid = Array(size).fill(0).map(() => Array(size).fill(0));
          batchResults.push({
            grid: emptyGrid,
            solution: emptyGrid,
            sectionIndex,
            puzzleIndex: startIndex + i,
            difficultyLabel
          });
        }
      }
      
      // Yield to main thread occasionally to prevent blocking
      if (i % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    return batchResults;
  };
  
  try {
    if (config.difficultyMix === 'single') {
      // For single difficulty mode, respect the user's numberOfPages setting
      // but cap it to prevent browser crashes
      const actualPuzzleCount = Math.min(maxPuzzles, 200);
      
      // Report starting progress
      self.postMessage({
        type: 'progress',
        progress: 0,
        currentBatch: 0,
        totalBatches: Math.ceil(actualPuzzleCount / BATCH_SIZE)
      });
      
      // Generate in smaller batches
      for (let i = 0; i < actualPuzzleCount; i += BATCH_SIZE) {
        const batchSize = Math.min(BATCH_SIZE, actualPuzzleCount - i);
        const batch = await generatePuzzlesBatch(
          config.difficulty, 
          batchSize, 
          0, 
          i
        );
        allPuzzles.push(...batch);
        
        // Report progress
        self.postMessage({
          type: 'progress',
          progress: ((i + batchSize) / actualPuzzleCount) * 100,
          currentBatch: Math.floor(i / BATCH_SIZE) + 1,
          totalBatches: Math.ceil(actualPuzzleCount / BATCH_SIZE)
        });
      }
    } else {
      // For multiple difficulties
      let puzzleIndex = 0;
      let processedCount = 0;
      const totalBatches = Math.ceil(maxPuzzles / BATCH_SIZE);
      let batchIndex = 0;
      
      // Process each difficulty section
      for (let sectionIndex = 0; sectionIndex < config.difficultySections.length; sectionIndex++) {
        const section = config.difficultySections[sectionIndex];
        const sectionPuzzleCount = Math.min(section.count, maxPuzzles - processedCount);
        
        if (sectionPuzzleCount <= 0) continue;
        
        console.log(`[Worker] Processing section ${sectionIndex}, difficulty ${section.difficulty}, count ${sectionPuzzleCount}`);
        
        // Generate batch for this section
        const batchResults = await generatePuzzlesBatch(
          section.difficulty,
          sectionPuzzleCount,
          sectionIndex,
          puzzleIndex
        );
        allPuzzles.push(...batchResults);
        
        // Update counters
        puzzleIndex += sectionPuzzleCount;
        processedCount += sectionPuzzleCount;
        batchIndex++;
        
        // Report progress after each section
        self.postMessage({
          type: 'progress',
          progress: (processedCount / maxPuzzles) * 100,
          currentBatch: batchIndex,
          totalBatches
        });
        
        if (processedCount >= maxPuzzles) break;
      }
    }
    
    return allPuzzles;
  } catch (error) {
    console.error('Error generating puzzles:', error);
    throw error;
  }
} 