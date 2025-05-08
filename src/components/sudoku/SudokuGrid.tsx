import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface SudokuGridProps {
  grid: number[][];
  size: '9x9' | '6x6' | '4x4';
  showSolution?: boolean;
  hints?: string[];
  className?: string;
}

export const SudokuGrid = ({ grid, size, showSolution, hints, className }: SudokuGridProps) => {
  const gridSize = parseInt(size.split('x')[0]);
  const boxSize = Math.sqrt(gridSize);
  
  const cellSize = useMemo(() => {
    // Calculate cell size based on grid size to fit KDP dimensions
    const sizes = {
      '9x9': 32, // For 9x9 grid
      '6x6': 48, // For 6x6 grid
      '4x4': 64, // For 4x4 grid
    };
    return sizes[size] || 32;
  }, [size]);

  return (
    <div 
      className={cn(
        "relative print:shadow-none rounded-lg overflow-hidden aspect-square",
        className
      )}
      style={{
        width: `${cellSize * gridSize}px`,
      }}
    >
      <div className="absolute inset-0 grid"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`,
          gap: '1px',
          backgroundColor: '#000',
          padding: '1px',
        }}
      >
        {grid.map((row, i) => (
          row.map((cell, j) => {
            const boxRow = Math.floor(i / boxSize);
            const boxCol = Math.floor(j / boxSize);
            const isEvenBox = (boxRow + boxCol) % 2 === 0;
            
            return (
              <div
                key={`${i}-${j}`}
                className={cn(
                  "flex items-center justify-center bg-white font-mono text-2xl transition-colors",
                  isEvenBox ? "bg-opacity-100" : "bg-opacity-95",
                )}
              >
                {cell !== 0 && cell}
              </div>
            );
          })
        ))}
      </div>

      {/* Grid lines */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #000 1px, transparent 1px),
            linear-gradient(to bottom, #000 1px, transparent 1px)
          `,
          backgroundSize: `${cellSize * boxSize}px ${cellSize * boxSize}px`,
          border: '2px solid #000',
        }}
      />

      {/* Hints overlay */}
      {hints && (
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <div className="bg-white/90 p-4 rounded-lg shadow-lg text-sm max-w-[80%]">
            {hints.map((hint, i) => (
              <p key={i} className="mb-2">{hint}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 