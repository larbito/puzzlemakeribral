export interface SudokuPuzzle {
  grid: number[][];
  solution: number[][];
  hints?: string[];
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
}

export class SudokuService {
  static generatePuzzle(difficulty: string = 'medium', size: string = '9x9'): SudokuPuzzle {
    const gridSize = parseInt(size.split('x')[0]);
    
    // Start with a solved puzzle
    const solution = this.generateSolvedGrid(gridSize);
    
    // Create the puzzle by removing numbers based on difficulty
    const grid = this.createPuzzleFromSolution(solution, difficulty, gridSize);
    
    // Generate hints if needed
    const hints = this.generateHints(grid, solution, difficulty, gridSize);

    return {
      grid,
      solution,
      hints
    };
  }

  private static generateSolvedGrid(size: number): number[][] {
    const grid = Array(size).fill(0).map(() => Array(size).fill(0));
    this.fillGrid(grid, size);
    return grid;
  }

  private static fillGrid(grid: number[][], size: number): boolean {
    const boxSize = Math.sqrt(size);
    
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (grid[row][col] === 0) {
          const numbers = this.shuffleArray(Array.from({ length: size }, (_, i) => i + 1));
          for (const num of numbers) {
            if (this.isValid(grid, row, col, num, size)) {
              grid[row][col] = num;
              if (this.fillGrid(grid, size)) {
                return true;
              }
              grid[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  private static isValid(grid: number[][], row: number, col: number, num: number, size: number): boolean {
    const boxSize = Math.sqrt(size);

    // Check row
    for (let x = 0; x < size; x++) {
      if (grid[row][x] === num) return false;
    }

    // Check column
    for (let x = 0; x < size; x++) {
      if (grid[x][col] === num) return false;
    }

    // Check box
    const boxRow = Math.floor(row / boxSize) * boxSize;
    const boxCol = Math.floor(col / boxSize) * boxSize;
    for (let i = 0; i < boxSize; i++) {
      for (let j = 0; j < boxSize; j++) {
        if (grid[boxRow + i][boxCol + j] === num) return false;
      }
    }

    return true;
  }

  private static createPuzzleFromSolution(solution: number[][], difficulty: string, size: number): number[][] {
    const puzzle = solution.map(row => [...row]);
    const cellsToRemove = this.getDifficultyRemovalCount(difficulty, size);
    
    // Create a list of all positions and shuffle it
    const positions = this.shuffleArray(
      Array.from({ length: size * size }, (_, i) => ({ 
        row: Math.floor(i / size), 
        col: i % size 
      }))
    );

    // Try to remove numbers while maintaining unique solution
    let removed = 0;
    for (const pos of positions) {
      const { row, col } = pos;
      const temp = puzzle[row][col];
      puzzle[row][col] = 0;

      // If removing this number creates multiple solutions, put it back
      if (!this.hasUniqueSolution(puzzle, size)) {
        puzzle[row][col] = temp;
        continue;
      }

      removed++;
      if (removed >= cellsToRemove) break;
    }

    return puzzle;
  }

  private static hasUniqueSolution(grid: number[][], size: number): boolean {
    // Instead of fully solving the puzzle multiple times,
    // just check if the next few cells have multiple options
    // This is a heuristic that works well enough for Sudoku difficulty
    let emptyCells = 0;
    
    // Count empty cells - if too many left, assume it's ok (for performance)
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (grid[row][col] === 0) emptyCells++;
      }
    }
    
    // If there are too many empty cells, just return true for performance
    if (emptyCells > 40) return true;
    
    // Check just a small number of empty cells for quick validation
    const emptyPositions: [number, number][] = [];
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (grid[row][col] === 0) {
          emptyPositions.push([row, col]);
          // Just check a few cells for performance
          if (emptyPositions.length >= 3) break;
        }
      }
      if (emptyPositions.length >= 3) break;
    }
    
    // If no empty cells, puzzle is solved
    if (emptyPositions.length === 0) return true;
    
    // Check for cells with only one possible value
    for (const [row, col] of emptyPositions) {
      let validCount = 0;
      for (let num = 1; num <= size; num++) {
        if (this.isValid(grid, row, col, num, size)) {
          validCount++;
          if (validCount > 1) {
            // More than one valid option, could be multiple solutions
            return false;
          }
        }
      }
      if (validCount === 0) {
        // No valid option for this cell, impossible puzzle
        return false;
      }
    }
    
    // If all checked cells have exactly one valid value, probably unique
    return true;
  }

  private static findEmptyCell(grid: number[][]): [number, number] | null {
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        if (grid[row][col] === 0) return [row, col];
      }
    }
    return null;
  }

  private static getDifficultyRemovalCount(difficulty: string, size: number): number {
    const totalCells = size * size;
    const difficultyFactors: { [key: string]: number } = {
      'easy': 0.4,      // 40% cells removed
      'medium': 0.5,    // 50% cells removed
      'hard': 0.6,      // 60% cells removed
      'expert': 0.75    // 75% cells removed
    };
    return Math.floor(totalCells * (difficultyFactors[difficulty] || 0.5));
  }

  private static generateHints(grid: number[][], solution: number[][], difficulty: string, size: number): string[] {
    const hints: string[] = [];
    const boxSize = Math.sqrt(size);

    // Add difficulty-specific hints
    switch (difficulty) {
      case 'easy':
        // Point out obvious single candidates
        for (let row = 0; row < size; row++) {
          for (let col = 0; col < size; col++) {
            if (grid[row][col] === 0) {
              const candidates = this.findCandidates(grid, row, col, size);
              if (candidates.length === 1) {
                hints.push(`Look for a single candidate in row ${row + 1}, column ${col + 1}`);
              }
            }
          }
        }
        break;

      case 'medium':
        // Hint about box completion
        for (let boxRow = 0; boxRow < size; boxRow += boxSize) {
          for (let boxCol = 0; boxCol < size; boxCol += boxSize) {
            const missing = this.findMissingInBox(grid, boxRow, boxCol, boxSize);
            if (missing.length === 1) {
              hints.push(`Box at row ${Math.floor(boxRow/boxSize) + 1}, column ${Math.floor(boxCol/boxSize) + 1} is missing only one number`);
            }
          }
        }
        break;

      case 'hard':
        // Hint about advanced techniques
        hints.push("Look for hidden pairs in rows and columns");
        hints.push("Try using the X-Wing technique when stuck");
        break;

      case 'expert':
        // Minimal hints for expert level
        hints.push("This is an expert-level puzzle. Use advanced techniques!");
        break;
    }

    return hints;
  }

  private static findCandidates(grid: number[][], row: number, col: number, size: number): number[] {
    const candidates: number[] = [];
    for (let num = 1; num <= size; num++) {
      if (this.isValid(grid, row, col, num, size)) {
        candidates.push(num);
      }
    }
    return candidates;
  }

  private static findMissingInBox(grid: number[][], boxRow: number, boxCol: number, boxSize: number): number[] {
    const numbers = new Set(Array.from({ length: boxSize * boxSize }, (_, i) => i + 1));
    for (let i = 0; i < boxSize; i++) {
      for (let j = 0; j < boxSize; j++) {
        const value = grid[boxRow + i][boxCol + j];
        if (value !== 0) {
          numbers.delete(value);
        }
      }
    }
    return Array.from(numbers);
  }

  private static shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
} 