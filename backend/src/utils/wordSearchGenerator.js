/**
 * WordSearchGenerator - Utility for generating word search puzzles
 * 
 * This module provides functionality to create word search puzzles
 * with different difficulty levels, grid sizes, and word directions.
 */

const MAX_ATTEMPTS = 100;
const DIRECTIONS = {
  HORIZONTAL: { x: 1, y: 0 },
  VERTICAL: { x: 0, y: 1 },
  DIAGONAL_DOWN: { x: 1, y: 1 },
  DIAGONAL_UP: { x: 1, y: -1 },
  HORIZONTAL_BACK: { x: -1, y: 0 },
  VERTICAL_BACK: { x: 0, y: -1 },
  DIAGONAL_DOWN_BACK: { x: -1, y: 1 },
  DIAGONAL_UP_BACK: { x: -1, y: -1 }
};

/**
 * Create a word search puzzle
 * @param {Object} options - The options for the word search
 * @param {string[]} options.words - Array of words to include
 * @param {number} options.gridSize - Size of the grid (width/height)
 * @param {Object} options.directions - Allowed directions for words
 * @param {string} options.difficulty - Difficulty level (easy, medium, hard)
 * @returns {Object} The puzzle grid and word positions
 */
function createWordSearch(options) {
  const { 
    words = [],
    gridSize = 15, 
    directions = {
      horizontal: true,
      vertical: true,
      diagonal: true,
      backward: false
    },
    difficulty = 'medium'
  } = options;

  // Initialize the grid with empty cells
  const grid = Array(gridSize).fill().map(() => Array(gridSize).fill(''));
  const wordPositions = [];
  const usedWords = [];
  
  // Filter words that are too long for the grid
  const validWords = words
    .filter(word => word.length <= gridSize)
    .map(word => word.toUpperCase())
    .filter((word, index, self) => self.indexOf(word) === index) // Remove duplicates
    .sort((a, b) => b.length - a.length); // Start with longer words
  
  // Get allowed directions based on options
  const allowedDirections = [];
  if (directions.horizontal) {
    allowedDirections.push(DIRECTIONS.HORIZONTAL);
    if (directions.backward) allowedDirections.push(DIRECTIONS.HORIZONTAL_BACK);
  }
  if (directions.vertical) {
    allowedDirections.push(DIRECTIONS.VERTICAL);
    if (directions.backward) allowedDirections.push(DIRECTIONS.VERTICAL_BACK);
  }
  if (directions.diagonal) {
    allowedDirections.push(DIRECTIONS.DIAGONAL_DOWN);
    allowedDirections.push(DIRECTIONS.DIAGONAL_UP);
    if (directions.backward) {
      allowedDirections.push(DIRECTIONS.DIAGONAL_DOWN_BACK);
      allowedDirections.push(DIRECTIONS.DIAGONAL_UP_BACK);
    }
  }
  
  // Place each word in the grid
  for (const word of validWords) {
    if (usedWords.length >= options.maxWords) break;
    
    let placed = false;
    let attempts = 0;
    
    // Try to place the word until successful or max attempts reached
    while (!placed && attempts < MAX_ATTEMPTS) {
      attempts++;
      
      // Select a random direction from allowed directions
      const direction = allowedDirections[Math.floor(Math.random() * allowedDirections.length)];
      
      // Calculate maximum valid starting position based on word length and direction
      const maxX = gridSize - (direction.x > 0 ? word.length - 1 : (direction.x < 0 ? 0 : 0));
      const maxY = gridSize - (direction.y > 0 ? word.length - 1 : (direction.y < 0 ? 0 : 0));
      const minX = direction.x < 0 ? word.length - 1 : 0;
      const minY = direction.y < 0 ? word.length - 1 : 0;
      
      // Select random starting position
      const startX = minX + Math.floor(Math.random() * (maxX - minX + 1));
      const startY = minY + Math.floor(Math.random() * (maxY - minY + 1));
      
      // Check if word can be placed at this position
      if (canPlaceWord(grid, word, startX, startY, direction, difficulty)) {
        // Place the word
        const wordPosition = {
          word,
          positions: []
        };
        
        for (let i = 0; i < word.length; i++) {
          const x = startX + i * direction.x;
          const y = startY + i * direction.y;
          grid[y][x] = word[i];
          wordPosition.positions.push({ x, y });
        }
        
        wordPositions.push(wordPosition);
        usedWords.push(word);
        placed = true;
      }
    }
  }
  
  // Fill remaining empty cells with random letters
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (grid[y][x] === '') {
        grid[y][x] = getRandomLetter();
      }
    }
  }
  
  return {
    grid,
    wordPositions,
    usedWords
  };
}

/**
 * Check if a word can be placed at the specified position and direction
 * @param {Array} grid - The current grid
 * @param {string} word - The word to place
 * @param {number} startX - Starting X position
 * @param {number} startY - Starting Y position
 * @param {Object} direction - Direction to place the word
 * @param {string} difficulty - Difficulty level (affects word overlap)
 * @returns {boolean} Whether the word can be placed
 */
function canPlaceWord(grid, word, startX, startY, direction, difficulty) {
  const allowOverlap = difficulty !== 'easy';
  
  for (let i = 0; i < word.length; i++) {
    const x = startX + i * direction.x;
    const y = startY + i * direction.y;
    
    // Check if position is within grid bounds
    if (x < 0 || x >= grid[0].length || y < 0 || y >= grid.length) {
      return false;
    }
    
    // Check if cell is empty or contains the same letter (for overlap)
    const currentLetter = grid[y][x];
    if (currentLetter !== '' && currentLetter !== word[i]) {
      return false;
    }
    
    // For easy difficulty, don't allow any overlap
    if (difficulty === 'easy' && currentLetter !== '') {
      return false;
    }
    
    // For medium difficulty, limit overlaps
    if (difficulty === 'medium' && currentLetter !== '' && Math.random() > 0.3) {
      return false;
    }
  }
  
  return true;
}

/**
 * Get a random letter
 * @returns {string} A random uppercase letter
 */
function getRandomLetter() {
  return String.fromCharCode(65 + Math.floor(Math.random() * 26));
}

/**
 * Generate multiple word search puzzles based on themes and settings
 * @param {Object} settings - Settings for generating the puzzles
 * @returns {Array} Array of word search puzzles
 */
function generatePuzzleBook(settings) {
  const {
    quantity = 20,
    theme = '',
    words = [],
    customWords = '',
    gridSize = 15,
    wordsPerPuzzle = 10,
    directions = {
      horizontal: true,
      vertical: true,
      diagonal: true,
      backward: false
    },
    difficulty = 'medium'
  } = settings;
  
  // Process custom words if provided
  let allWords = [...words];
  if (customWords) {
    const customWordList = customWords
      .split(',')
      .map(word => word.trim())
      .filter(word => word.length > 0 && word.length <= gridSize);
    
    allWords = [...allWords, ...customWordList];
  }
  
  // Generate puzzles
  const puzzles = [];
  for (let i = 0; i < quantity; i++) {
    puzzles.push(
      createWordSearch({
        words: allWords,
        gridSize,
        directions,
        difficulty,
        maxWords: wordsPerPuzzle
      })
    );
  }
  
  return puzzles;
}

module.exports = {
  createWordSearch,
  generatePuzzleBook
}; 