import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';

// Add type definitions for styling options
type GridStyle = 'classic' | 'modern' | 'minimal';
type GridLineColor = 'black' | 'gray' | 'dark-blue';
type NumberFont = 'sans' | 'serif' | 'mono';

interface SudokuPDFGridProps {
  grid: number[][];
  size: string;
  hints?: string[];
  showSolution?: boolean;
  isSinglePuzzle?: boolean;
  // Add styling options
  gridStyle?: GridStyle;
  gridLineColor?: GridLineColor;
  alternateBoxShading?: boolean;
  numberFont?: NumberFont;
}

const SudokuPDFGrid: React.FC<SudokuPDFGridProps> = ({ 
  grid, 
  size, 
  hints,
  showSolution = false,
  isSinglePuzzle = false,
  // Default values for styling options
  gridStyle = 'classic',
  gridLineColor = 'black',
  alternateBoxShading = false,
  numberFont = 'sans'
}) => {
  const gridSize = parseInt(size.split('x')[0]);
  const boxSize = Math.sqrt(gridSize);
  
  // Convert grid styling options to PDF styles
  const getLineColor = () => {
    switch (gridLineColor) {
      case 'gray': return '#666666';
      case 'dark-blue': return '#0a2463';
      default: return '#000000';
    }
  };
  
  const getBorderWidth = () => {
    switch (gridStyle) {
      case 'minimal': return '0.5pt';
      case 'modern': return '1pt';
      default: return '2pt'; // classic
    }
  };
  
  const getInnerBorderWidth = () => {
    switch (gridStyle) {
      case 'minimal': return '0.25pt';
      case 'modern': return '0.5pt';
      default: return '0.5pt'; // classic
    }
  };
  
  const getFontFamily = () => {
    switch (numberFont) {
      case 'serif': return 'Times-Roman';
      case 'mono': return 'Courier';
      default: return 'Helvetica'; // sans
    }
  };
  
  // Create styles with dynamic values based on props
  const styles = StyleSheet.create({
    grid: {
      display: 'flex',
      flexDirection: 'column',
      border: `${getBorderWidth()} solid ${getLineColor()}`,
      width: '100%',
      height: '100%',
      aspectRatio: 1, // Ensure grid is square
      ...(gridStyle === 'modern' ? { borderRadius: '4pt' } : {})
    },
    row: {
      flexDirection: 'row',
      flex: 1,
      borderBottom: `${getInnerBorderWidth()} solid ${getLineColor()}`,
    },
    boxBottomBorder: {
      borderBottom: `${getBorderWidth()} solid ${getLineColor()}`,
    },
    cell: {
      flex: 1,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      borderRight: `${getInnerBorderWidth()} solid ${getLineColor()}`,
      aspectRatio: 1, // Ensure cells are square
    },
    boxRightBorder: {
      borderRight: `${getBorderWidth()} solid ${getLineColor()}`,
    },
    cellValue: {
      // Adjust font size based on grid size and layout
      fontSize: isSinglePuzzle 
        ? (gridSize === 9 ? 20 : gridSize === 6 ? 22 : 24) 
        : (gridSize === 9 ? 16 : gridSize === 6 ? 18 : 20),
      fontFamily: getFontFamily(),
      fontWeight: showSolution ? 'bold' : 'normal',
    },
    shadedCell: {
      backgroundColor: '#f5f5f5', // Light gray background for shaded cells
    },
    hints: {
      marginTop: 10,
      fontSize: 8,
    }
  });

  // Make sure grid exists and has the right structure
  if (!grid || !Array.isArray(grid) || grid.length === 0 || !Array.isArray(grid[0])) {
    console.error("Invalid grid data:", grid);
    return (
      <View style={styles.grid}>
        <Text>Invalid grid data</Text>
      </View>
    );
  }

  // Function to determine if a cell should be shaded
  const shouldShadeCell = (rowIndex: number, cellIndex: number) => {
    if (!alternateBoxShading) return false;
    
    const boxRow = Math.floor(rowIndex / boxSize);
    const boxCol = Math.floor(cellIndex / boxSize);
    
    // Shade alternate boxes (checkerboard pattern)
    return (boxRow + boxCol) % 2 === 0;
  };

  return (
    <View style={styles.grid}>
      {grid.map((row, rowIndex) => (
        <View 
          key={rowIndex}
          style={[
            styles.row,
            (rowIndex + 1) % boxSize === 0 && rowIndex < gridSize - 1 ? styles.boxBottomBorder : {}
          ]}
        >
          {row.map((cell, cellIndex) => (
            <View
              key={cellIndex}
              style={[
                styles.cell,
                (cellIndex + 1) % boxSize === 0 && cellIndex < gridSize - 1 ? styles.boxRightBorder : {},
                shouldShadeCell(rowIndex, cellIndex) ? styles.shadedCell : {}
              ]}
            >
              <Text style={styles.cellValue}>
                {cell !== 0 ? cell.toString() : ''}
              </Text>
            </View>
          ))}
        </View>
      ))}
      
      {hints && hints.length > 0 && (
        <View style={styles.hints}>
          {hints.map((hint, index) => (
            <Text key={index} style={{ fontSize: 8, marginBottom: 2, fontFamily: getFontFamily() }}>• {hint}</Text>
          ))}
        </View>
      )}
    </View>
  );
};

export default SudokuPDFGrid; 