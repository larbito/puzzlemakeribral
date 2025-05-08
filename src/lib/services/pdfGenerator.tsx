// This is the main PDF generator component for Sudoku puzzles
// Updated to use .tsx extension for proper React/JSX support

import { Font, Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import type { Style } from '@react-pdf/types';
import { SudokuPuzzle } from './sudoku';
import { SudokuKDPConfig } from '../../components/kdp/SudokuKDPSettings';
import SudokuPDFGrid from '../../components/sudoku/SudokuPDFGrid';
import { Fragment } from 'react';

// Register fonts
Font.register({
  family: 'Inter',
  src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2'
});

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 0,
  },
  puzzleContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  puzzleWrapper: {
    width: '45%',
    marginBottom: 20,
  },
  puzzlesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 30,
  },
  pageNumber: {
    position: 'absolute',
    bottom: '0.5in',
    right: '0.5in',
    fontSize: 10,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 30,
    textAlign: 'center',
    color: '#666666',
    fontFamily: 'Inter',
  },
});

interface PDFGeneratorOptions {
  puzzles: SudokuPuzzle[];
  config: SudokuKDPConfig;
}

const generatePuzzles = (count: number, puzzle: SudokuPuzzle): SudokuPuzzle[] => {
  return Array(count).fill(null).map(() => ({
    ...puzzle,
    grid: [...puzzle.grid.map(row => [...row])],
    solution: [...puzzle.solution.map(row => [...row])],
    hints: puzzle.hints ? [...puzzle.hints] : undefined,
  }));
};

interface PageStyleProps {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

const SudokuDocument = ({ puzzles, config }: PDFGeneratorOptions) => {
  const { bookSize, hasBleed, puzzlesPerPage, numberOfPages } = config;
  const [width, height] = bookSize.split('x').map(Number);
  
  // Convert inches to points (72 points per inch)
  const pageWidth = width * 72;
  const pageHeight = height * 72;
  
  // Calculate margins in points
  const margins = {
    top: config.topMargin * 72,
    bottom: config.bottomMargin * 72,
    inner: config.interiorMargin * 72,
    outer: config.exteriorMargin * 72,
    gutter: config.gutterMargin * 72,
  };

  // Calculate bleed in points (0.125 inches)
  const bleed = hasBleed ? 9 : 0; // 0.125 * 72 = 9 points

  // Generate enough puzzles to fill the requested number of pages
  const totalPuzzlesNeeded = numberOfPages * puzzlesPerPage;
  const allPuzzles = generatePuzzles(totalPuzzlesNeeded, puzzles[0]);

  // Group puzzles by page
  const puzzlePages = Array.from({ length: numberOfPages }, (_, pageIndex) => {
    const startIndex = pageIndex * puzzlesPerPage;
    return allPuzzles.slice(startIndex, startIndex + puzzlesPerPage);
  });

  const getPageStyle = (margins: PageStyleProps): Style => ({
    ...styles.page,
    padding: `${margins.top}pt ${margins.right}pt ${margins.bottom}pt ${margins.left}pt`,
  });

  return (
    <Document>
      {puzzlePages.map((pagePuzzles, pageIndex) => {
        const isEvenPage = (pageIndex + 1) % 2 === 0;
        const pageMargins = {
          top: margins.top,
          bottom: margins.bottom,
          left: isEvenPage ? margins.outer : margins.inner,
          right: isEvenPage ? margins.inner : margins.outer,
        };

        return (
          <Fragment key={pageIndex}>
            {/* Puzzle Page */}
            <Page 
              size={[pageWidth + (bleed * 2), pageHeight + (bleed * 2)]}
              style={getPageStyle(pageMargins)}
            >
              <View style={styles.puzzleContainer}>
                <Text style={styles.title}>Sudoku Puzzles - Page {pageIndex + 1}</Text>
                <Text style={styles.subtitle}>
                  {config.gridSize} Grid - {config.difficulty.charAt(0).toUpperCase() + config.difficulty.slice(1)} Difficulty
                </Text>
                
                <View style={styles.puzzlesRow}>
                  {pagePuzzles.map((puzzle, puzzleIndex) => (
                    <View key={puzzleIndex} style={styles.puzzleWrapper}>
                      <SudokuPDFGrid
                        grid={puzzle.grid}
                        size={config.gridSize}
                        hints={config.includeHints ? puzzle.hints : undefined}
                      />
                    </View>
                  ))}
                </View>

                {config.includePageNumbers && (
                  <Text style={styles.pageNumber}>{pageIndex + 1}</Text>
                )}
              </View>
            </Page>

            {/* Solution Page (if enabled) */}
            {config.includeSolutions && (
              <Page 
                size={[pageWidth + (bleed * 2), pageHeight + (bleed * 2)]}
                style={getPageStyle(pageMargins)}
              >
                <View style={styles.puzzleContainer}>
                  <Text style={styles.title}>Solutions - Page {pageIndex + 1}</Text>
                  
                  <View style={styles.puzzlesRow}>
                    {pagePuzzles.map((puzzle, puzzleIndex) => (
                      <View key={puzzleIndex} style={styles.puzzleWrapper}>
                        <SudokuPDFGrid
                          grid={puzzle.solution}
                          size={config.gridSize}
                          showSolution
                        />
                      </View>
                    ))}
                  </View>

                  {config.includePageNumbers && (
                    <Text style={styles.pageNumber}>S{pageIndex + 1}</Text>
                  )}
                </View>
              </Page>
            )}
          </Fragment>
        );
      })}
    </Document>
  );
};

export const generateSudokuPDF = (options: PDFGeneratorOptions) => () => <SudokuDocument {...options} />; 