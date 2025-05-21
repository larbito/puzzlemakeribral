/**
 * PDF Generator for Word Search Puzzles
 * 
 * This utility creates KDP-compatible PDFs for Word Search puzzle books
 * with proper margins, page sizes, and bleed settings.
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Amazon KDP trim sizes in points (1 inch = 72 points)
const KDP_TRIM_SIZES = {
  '5x8': { width: 5 * 72, height: 8 * 72 },
  '6x9': { width: 6 * 72, height: 9 * 72 },
  '7x10': { width: 7 * 72, height: 10 * 72 },
  '8x10': { width: 8 * 72, height: 10 * 72 },
  '8.5x11': { width: 8.5 * 72, height: 11 * 72 },
  '8.25x8.25': { width: 8.25 * 72, height: 8.25 * 72 }
};

// Bleed size in points (0.125 inches = 9 points)
const BLEED_SIZE = 9;

// Margin sizes in points
const MARGINS = {
  inner: 0.5 * 72,  // 0.5 inch inner margin
  outer: 0.5 * 72,  // 0.5 inch outer margin
  top: 0.5 * 72,    // 0.5 inch top margin
  bottom: 0.5 * 72  // 0.5 inch bottom margin
};

/**
 * Create a Word Search puzzle book PDF
 * @param {Object} options - The book options
 * @param {Array} puzzles - The generated word search puzzles
 * @returns {Promise<string>} Path to the generated PDF file
 */
async function createWordSearchPDF(options, puzzles) {
  const {
    title = 'Word Search Puzzle Book',
    subtitle = '',
    authorName = '',
    pageSize = '6x9',
    bleed = false,
    includeCoverPage = true,
    includePageNumbers = true,
    includeAnswers = true,
    includeThemeFacts = false,
    interiorTheme = 'light',
    fontFamily = 'sans',
    puzzlesPerPage = 1,
    theme = ''
  } = options;
  
  // Generate random filename
  const filename = `wordsearch_${uuidv4()}.pdf`;
  const outputPath = path.join(__dirname, '..', '..', 'static', filename);
  
  // Create PDF with correct dimensions and bleed
  const trimSize = KDP_TRIM_SIZES[pageSize] || KDP_TRIM_SIZES['6x9'];
  const pageWidth = bleed ? trimSize.width + (BLEED_SIZE * 2) : trimSize.width;
  const pageHeight = bleed ? trimSize.height + (BLEED_SIZE * 2) : trimSize.height;
  
  const doc = new PDFDocument({
    size: [pageWidth, pageHeight],
    margin: 0,
    info: {
      Title: title,
      Author: authorName,
      Subject: 'Word Search Puzzle Book',
      Keywords: `word search, puzzle, ${theme}`,
      CreationDate: new Date()
    }
  });
  
  // Write to file
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);
  
  // Set font family
  setFontFamily(doc, fontFamily);
  
  // Set theme colors
  const colors = interiorTheme === 'light' 
    ? { text: '#000000', background: '#FFFFFF', grid: '#DDDDDD' }
    : { text: '#FFFFFF', background: '#222222', grid: '#444444' };
  
  // Add pages with proper margins and bleeds
  let currentPage = 0;
  
  // If including cover page, add it
  if (includeCoverPage) {
    addCoverPage(doc, {
      title,
      subtitle,
      authorName,
      theme,
      pageWidth,
      pageHeight,
      bleed,
      colors
    });
    currentPage++;
  }
  
  // Add table of contents
  addTableOfContents(doc, {
    puzzles, 
    pageWidth,
    pageHeight,
    bleed,
    margins: MARGINS,
    colors,
    includeCoverPage,
    includeAnswers
  });
  currentPage++;
  
  // Calculate effective page area accounting for bleed and margins
  const effectiveWidth = pageWidth - (bleed ? BLEED_SIZE * 2 : 0) - MARGINS.inner - MARGINS.outer;
  const effectiveHeight = pageHeight - (bleed ? BLEED_SIZE * 2 : 0) - MARGINS.top - MARGINS.bottom;
  
  // Add puzzle pages
  for (let i = 0; i < puzzles.length; i += puzzlesPerPage) {
    // Calculate puzzle area based on puzzles per page
    let puzzleWidth, puzzleHeight;
    if (puzzlesPerPage === 1) {
      puzzleWidth = effectiveWidth;
      puzzleHeight = effectiveHeight;
    } else if (puzzlesPerPage === 2) {
      puzzleWidth = effectiveWidth;
      puzzleHeight = effectiveHeight / 2;
    } else if (puzzlesPerPage === 4) {
      puzzleWidth = effectiveWidth / 2;
      puzzleHeight = effectiveHeight / 2;
    }
    
    // Add new page if not the first page
    if (i > 0 || currentPage > 0) {
      doc.addPage({
        size: [pageWidth, pageHeight],
        margin: 0
      });
    }
    
    // Add puzzles to current page
    for (let j = 0; j < puzzlesPerPage; j++) {
      const puzzleIndex = i + j;
      if (puzzleIndex < puzzles.length) {
        const puzzle = puzzles[puzzleIndex];
        
        // Calculate position for this puzzle
        let x, y;
        if (puzzlesPerPage === 1) {
          x = MARGINS.inner + (bleed ? BLEED_SIZE : 0);
          y = MARGINS.top + (bleed ? BLEED_SIZE : 0);
        } else if (puzzlesPerPage === 2) {
          x = MARGINS.inner + (bleed ? BLEED_SIZE : 0);
          y = MARGINS.top + (bleed ? BLEED_SIZE : 0) + (j * puzzleHeight);
        } else if (puzzlesPerPage === 4) {
          x = MARGINS.inner + (bleed ? BLEED_SIZE : 0) + ((j % 2) * puzzleWidth);
          y = MARGINS.top + (bleed ? BLEED_SIZE : 0) + (Math.floor(j / 2) * puzzleHeight);
        }
        
        // Draw puzzle
        drawPuzzle(doc, {
          puzzle,
          x,
          y,
          width: puzzleWidth,
          height: puzzleHeight,
          colors,
          index: puzzleIndex,
          theme,
          includeThemeFacts
        });
      }
    }
    
    // Add page number if enabled
    if (includePageNumbers) {
      const pageNumberY = pageHeight - MARGINS.bottom / 2 - (bleed ? BLEED_SIZE : 0);
      doc.font('Helvetica')
         .fillColor(colors.text)
         .fontSize(10)
         .text(`Page ${currentPage + 1}`, pageWidth / 2, pageNumberY, {
           align: 'center'
         });
    }
    
    currentPage++;
  }
  
  // Add answer key pages if enabled
  if (includeAnswers) {
    // Add answer key title page
    doc.addPage({
      size: [pageWidth, pageHeight],
      margin: 0
    });
    
    const titleX = pageWidth / 2;
    const titleY = MARGINS.top + (bleed ? BLEED_SIZE : 0) + 20;
    
    doc.font('Helvetica-Bold')
       .fillColor(colors.text)
       .fontSize(24)
       .text('Answer Key', titleX, titleY, {
         align: 'center'
       });
    
    if (includePageNumbers) {
      const pageNumberY = pageHeight - MARGINS.bottom / 2 - (bleed ? BLEED_SIZE : 0);
      doc.font('Helvetica')
         .fillColor(colors.text)
         .fontSize(10)
         .text(`Page ${currentPage + 1}`, pageWidth / 2, pageNumberY, {
           align: 'center'
         });
    }
    
    currentPage++;
    
    // Add answer pages
    for (let i = 0; i < puzzles.length; i += puzzlesPerPage) {
      // Add new page
      doc.addPage({
        size: [pageWidth, pageHeight],
        margin: 0
      });
      
      // Calculate puzzle area based on puzzles per page
      let puzzleWidth, puzzleHeight;
      if (puzzlesPerPage === 1) {
        puzzleWidth = effectiveWidth;
        puzzleHeight = effectiveHeight;
      } else if (puzzlesPerPage === 2) {
        puzzleWidth = effectiveWidth;
        puzzleHeight = effectiveHeight / 2;
      } else if (puzzlesPerPage === 4) {
        puzzleWidth = effectiveWidth / 2;
        puzzleHeight = effectiveHeight / 2;
      }
      
      // Add solution puzzles to current page
      for (let j = 0; j < puzzlesPerPage; j++) {
        const puzzleIndex = i + j;
        if (puzzleIndex < puzzles.length) {
          const puzzle = puzzles[puzzleIndex];
          
          // Calculate position for this puzzle
          let x, y;
          if (puzzlesPerPage === 1) {
            x = MARGINS.inner + (bleed ? BLEED_SIZE : 0);
            y = MARGINS.top + (bleed ? BLEED_SIZE : 0);
          } else if (puzzlesPerPage === 2) {
            x = MARGINS.inner + (bleed ? BLEED_SIZE : 0);
            y = MARGINS.top + (bleed ? BLEED_SIZE : 0) + (j * puzzleHeight);
          } else if (puzzlesPerPage === 4) {
            x = MARGINS.inner + (bleed ? BLEED_SIZE : 0) + ((j % 2) * puzzleWidth);
            y = MARGINS.top + (bleed ? BLEED_SIZE : 0) + (Math.floor(j / 2) * puzzleHeight);
          }
          
          // Draw solution
          drawSolution(doc, {
            puzzle,
            x,
            y,
            width: puzzleWidth,
            height: puzzleHeight,
            colors,
            index: puzzleIndex,
            theme
          });
        }
      }
      
      // Add page number if enabled
      if (includePageNumbers) {
        const pageNumberY = pageHeight - MARGINS.bottom / 2 - (bleed ? BLEED_SIZE : 0);
        doc.font('Helvetica')
           .fillColor(colors.text)
           .fontSize(10)
           .text(`Page ${currentPage + 1}`, pageWidth / 2, pageNumberY, {
             align: 'center'
           });
      }
      
      currentPage++;
    }
  }
  
  // Finalize the PDF
  doc.end();
  
  // Return a Promise that resolves when the PDF is created
  return new Promise((resolve, reject) => {
    stream.on('finish', () => {
      resolve(`/static/${filename}`);
    });
    stream.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Set font family for the document
 * @param {PDFDocument} doc - The PDF document
 * @param {string} fontFamily - The font family to use
 */
function setFontFamily(doc, fontFamily) {
  // Font families: sans, serif, mono, handwritten
  const fontMap = {
    'sans': {
      regular: 'Helvetica',
      bold: 'Helvetica-Bold',
      italic: 'Helvetica-Oblique',
      boldItalic: 'Helvetica-BoldOblique'
    },
    'serif': {
      regular: 'Times-Roman',
      bold: 'Times-Bold',
      italic: 'Times-Italic',
      boldItalic: 'Times-BoldItalic'
    },
    'mono': {
      regular: 'Courier',
      bold: 'Courier-Bold',
      italic: 'Courier-Oblique',
      boldItalic: 'Courier-BoldOblique'
    },
    // For handwritten we just use standard fonts since custom fonts would need to be embedded
    'handwritten': {
      regular: 'Times-Roman',
      bold: 'Times-Bold',
      italic: 'Times-Italic',
      boldItalic: 'Times-BoldItalic'
    }
  };
  
  const fonts = fontMap[fontFamily] || fontMap['sans'];
  
  // Set the default font
  doc.font(fonts.regular);
}

/**
 * Add cover page to the document
 * @param {PDFDocument} doc - The PDF document
 * @param {Object} options - Cover page options
 */
function addCoverPage(doc, options) {
  const {
    title,
    subtitle,
    authorName,
    theme,
    pageWidth,
    pageHeight,
    bleed,
    colors
  } = options;
  
  // Fill background color
  doc.rect(0, 0, pageWidth, pageHeight)
     .fill(colors.background);
  
  // Draw title
  const titleX = pageWidth / 2;
  const titleY = (pageHeight / 4) + (bleed ? BLEED_SIZE : 0);
  
  doc.font('Helvetica-Bold')
     .fillColor(colors.text)
     .fontSize(36)
     .text(title, titleX, titleY, {
       align: 'center',
       width: pageWidth - (MARGINS.inner + MARGINS.outer) - (bleed ? BLEED_SIZE * 2 : 0)
     });
  
  // Draw subtitle if present
  if (subtitle) {
    const subtitleY = titleY + 50;
    doc.font('Helvetica')
       .fillColor(colors.text)
       .fontSize(24)
       .text(subtitle, titleX, subtitleY, {
         align: 'center',
         width: pageWidth - (MARGINS.inner + MARGINS.outer) - (bleed ? BLEED_SIZE * 2 : 0)
       });
  }
  
  // Draw a sample word search pattern for decoration
  const gridSize = 10;
  const cellSize = 20;
  const gridWidth = gridSize * cellSize;
  const gridHeight = gridSize * cellSize;
  const gridX = (pageWidth - gridWidth) / 2;
  const gridY = pageHeight / 2;
  
  // Draw cells
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const cellX = gridX + (x * cellSize);
      const cellY = gridY + (y * cellSize);
      
      // Randomly highlight some cells for style
      const isHighlighted = Math.random() > 0.8;
      if (isHighlighted) {
        doc.rect(cellX, cellY, cellSize, cellSize)
           .fillOpacity(0.3)
           .fillAndStroke('#4080FF', colors.grid);
      } else {
        doc.rect(cellX, cellY, cellSize, cellSize)
           .stroke(colors.grid);
      }
      
      // Add random letters
      const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      doc.font('Helvetica-Bold')
         .fillColor(colors.text)
         .fillOpacity(1)
         .fontSize(12)
         .text(letter, cellX + cellSize/2, cellY + 5, {
           align: 'center',
           width: 1
         });
    }
  }
  
  // Draw author name if present
  if (authorName) {
    const authorY = pageHeight - (pageHeight / 6) - (bleed ? BLEED_SIZE : 0);
    doc.font('Helvetica')
       .fillColor(colors.text)
       .fontSize(18)
       .text(`by ${authorName}`, titleX, authorY, {
         align: 'center',
         width: pageWidth - (MARGINS.inner + MARGINS.outer) - (bleed ? BLEED_SIZE * 2 : 0)
       });
  }
}

/**
 * Add table of contents to the document
 * @param {PDFDocument} doc - The PDF document
 * @param {Object} options - Table of contents options
 */
function addTableOfContents(doc, options) {
  const {
    puzzles,
    pageWidth,
    pageHeight,
    bleed,
    margins,
    colors,
    includeCoverPage,
    includeAnswers
  } = options;
  
  // Fill background color
  doc.rect(0, 0, pageWidth, pageHeight)
     .fill(colors.background);
  
  // Draw title
  const titleX = pageWidth / 2;
  const titleY = margins.top + (bleed ? BLEED_SIZE : 0);
  
  doc.font('Helvetica-Bold')
     .fillColor(colors.text)
     .fontSize(24)
     .text('Table of Contents', titleX, titleY, {
       align: 'center'
     });
  
  // Effective content area
  const contentX = margins.inner + (bleed ? BLEED_SIZE : 0);
  const contentY = titleY + 60;
  const contentWidth = pageWidth - margins.inner - margins.outer - (bleed ? BLEED_SIZE * 2 : 0);
  const contentHeight = pageHeight - contentY - margins.bottom - (bleed ? BLEED_SIZE : 0);
  
  // Draw table headers
  doc.font('Helvetica-Bold')
     .fontSize(12)
     .text('Puzzle', contentX, contentY, {
       width: contentWidth * 0.7,
       continued: true
     })
     .text('Page', {
       align: 'right',
       width: contentWidth * 0.3
     });
  
  // Draw divider line
  const lineY = contentY + 20;
  doc.moveTo(contentX, lineY)
     .lineTo(contentX + contentWidth, lineY)
     .strokeColor(colors.text)
     .stroke();
  
  // Draw puzzle entries
  let entryY = lineY + 15;
  const startPageNum = includeCoverPage ? 3 : 2; // Cover page + Table of contents = 2 pages
  
  for (let i = 0; i < puzzles.length; i++) {
    const pageNum = startPageNum + Math.floor(i / puzzlesPerPage);
    
    // Skip if we run out of space
    if (entryY > contentY + contentHeight - 20) {
      break;
    }
    
    doc.font('Helvetica')
       .fontSize(11)
       .text(`Word Search #${i + 1}`, contentX, entryY, {
         width: contentWidth * 0.7,
         continued: true
       })
       .text(`${pageNum}`, {
         align: 'right',
         width: contentWidth * 0.3
       });
    
    entryY += 20;
  }
  
  // Add answer key section if enabled
  if (includeAnswers) {
    const answerKeyY = entryY + 10;
    
    doc.moveTo(contentX, answerKeyY)
       .lineTo(contentX + contentWidth, answerKeyY)
       .strokeColor(colors.text)
       .stroke();
    
    const answerPageNum = startPageNum + Math.ceil(puzzles.length / puzzlesPerPage);
    
    doc.font('Helvetica-Bold')
       .fontSize(11)
       .text('Answer Key', contentX, answerKeyY + 15, {
         width: contentWidth * 0.7,
         continued: true
       })
       .text(`${answerPageNum}`, {
         align: 'right',
         width: contentWidth * 0.3
       });
  }
}

/**
 * Draw a word search puzzle on the document
 * @param {PDFDocument} doc - The PDF document
 * @param {Object} options - Puzzle drawing options
 */
function drawPuzzle(doc, options) {
  const {
    puzzle,
    x,
    y,
    width,
    height,
    colors,
    index,
    theme,
    includeThemeFacts
  } = options;
  
  const { grid, usedWords } = puzzle;
  
  // Calculate margins and sizes
  const titleHeight = 30;
  const wordsHeight = 60;
  const contentHeight = height - titleHeight - wordsHeight;
  const puzzleSize = Math.min(width, contentHeight);
  
  // Puzzle title
  const puzzleTitle = theme 
    ? `${theme.charAt(0).toUpperCase() + theme.slice(1)} Search #${index + 1}`
    : `Word Search #${index + 1}`;
  
  doc.font('Helvetica-Bold')
     .fillColor(colors.text)
     .fontSize(14)
     .text(puzzleTitle, x, y, {
       width: width,
       align: 'center'
     });
  
  // Draw the puzzle grid
  const gridSize = grid.length;
  const cellSize = puzzleSize / gridSize;
  const gridX = x + (width - puzzleSize) / 2;
  const gridY = y + titleHeight;
  
  // Draw grid background if dark theme
  if (colors.background !== '#FFFFFF') {
    doc.rect(gridX, gridY, puzzleSize, puzzleSize)
       .fill(colors.background);
  }
  
  // Draw cells
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const cellX = gridX + (j * cellSize);
      const cellY = gridY + (i * cellSize);
      
      // Draw cell border
      doc.rect(cellX, cellY, cellSize, cellSize)
         .strokeColor(colors.grid)
         .stroke();
      
      // Add letter
      const letter = grid[i][j];
      const fontSize = cellSize * 0.6;
      doc.font('Helvetica-Bold')
         .fillColor(colors.text)
         .fontSize(fontSize)
         .text(letter, cellX + cellSize/2, cellY + (cellSize - fontSize)/2, {
           align: 'center',
           width: 1
         });
    }
  }
  
  // Draw word list
  const wordsY = gridY + puzzleSize + 10;
  const wordsPerRow = 4;
  const wordWidth = width / wordsPerRow;
  
  doc.font('Helvetica-Bold')
     .fillColor(colors.text)
     .fontSize(10)
     .text('Find these words:', x, wordsY);
  
  doc.font('Helvetica')
     .fontSize(9);
  
  for (let i = 0; i < usedWords.length; i++) {
    const rowIndex = Math.floor(i / wordsPerRow);
    const colIndex = i % wordsPerRow;
    const wordX = x + (colIndex * wordWidth);
    const wordY = wordsY + 15 + (rowIndex * 15);
    
    doc.text(usedWords[i], wordX, wordY);
  }
}

/**
 * Draw a word search solution on the document
 * @param {PDFDocument} doc - The PDF document
 * @param {Object} options - Solution drawing options
 */
function drawSolution(doc, options) {
  const {
    puzzle,
    x,
    y,
    width,
    height,
    colors,
    index,
    theme
  } = options;
  
  const { grid, wordPositions } = puzzle;
  
  // Calculate margins and sizes
  const titleHeight = 30;
  const contentHeight = height - titleHeight;
  const puzzleSize = Math.min(width, contentHeight);
  
  // Puzzle title
  const puzzleTitle = theme 
    ? `${theme.charAt(0).toUpperCase() + theme.slice(1)} Search #${index + 1}`
    : `Word Search #${index + 1}`;
  
  doc.font('Helvetica-Bold')
     .fillColor(colors.text)
     .fontSize(14)
     .text(puzzleTitle, x, y, {
       width: width,
       align: 'center'
     });
  
  // Draw the puzzle grid
  const gridSize = grid.length;
  const cellSize = puzzleSize / gridSize;
  const gridX = x + (width - puzzleSize) / 2;
  const gridY = y + titleHeight;
  
  // Draw grid background if dark theme
  if (colors.background !== '#FFFFFF') {
    doc.rect(gridX, gridY, puzzleSize, puzzleSize)
       .fill(colors.background);
  }
  
  // Create a map of highlighted cells for solutions
  const highlightedCells = {};
  wordPositions.forEach(wp => {
    wp.positions.forEach(pos => {
      if (!highlightedCells[`${pos.y}-${pos.x}`]) {
        highlightedCells[`${pos.y}-${pos.x}`] = true;
      }
    });
  });
  
  // Draw cells
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const cellX = gridX + (j * cellSize);
      const cellY = gridY + (i * cellSize);
      
      // Draw cell background for highlighted cells
      if (highlightedCells[`${i}-${j}`]) {
        doc.rect(cellX, cellY, cellSize, cellSize)
           .fillColor('#4080FF')
           .fillOpacity(0.3)
           .fill();
      }
      
      // Draw cell border
      doc.rect(cellX, cellY, cellSize, cellSize)
         .strokeColor(colors.grid)
         .stroke();
      
      // Add letter
      const letter = grid[i][j];
      const fontSize = cellSize * 0.6;
      doc.font(highlightedCells[`${i}-${j}`] ? 'Helvetica-Bold' : 'Helvetica')
         .fillColor(colors.text)
         .fillOpacity(1)
         .fontSize(fontSize)
         .text(letter, cellX + cellSize/2, cellY + (cellSize - fontSize)/2, {
           align: 'center',
           width: 1
         });
    }
  }
}

module.exports = {
  createWordSearchPDF
}; 