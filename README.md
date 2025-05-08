# Puzzle Craft Forge

An app for generating beautiful designs.

Updated: Force new deployment.

A professional-grade puzzle generator for Kindle Direct Publishing (KDP) and other publishing platforms.

## Features

- **Multiple Puzzle Types**
  - Sudoku puzzles with various grid sizes (4x4, 6x6, 9x9)
  - Word search puzzles (coming soon)
  - More puzzle types in development!

- **KDP-Ready PDFs**
  - Proper dimensions for KDP publishing
  - Bleed settings for professional printing
  - Margin controls for binding
  - Customizable page layouts (1, 2, 4, or 9 puzzles per page)

- **Advanced Sudoku Options**
  - Multiple difficulty levels (Easy, Medium, Hard, Expert)
  - Mixed difficulty books with customizable sections
  - Solutions included with flexible placement options
  - Custom puzzle numbering styles (Sequential, By Section, Custom Prefix)
  - Grid styling customization (line colors, alternate box shading, number fonts)
  - Optional hints for easier puzzles

- **Export Options**
  - Download as PDF for print publishing
  - Export as PNG images for digital use or custom layouts
  - Batch export to ZIP archives for multiple puzzles

- **Performance Optimized**
  - Web worker implementation for non-blocking UI
  - Batch processing for large puzzle books
  - Preview generation with real-time progress indicators

## Sudoku Generator Features

### Puzzle Generation

The Sudoku generator creates puzzles with these options:
- Grid sizes: 4x4, 6x6, and 9x9
- Difficulty levels: Easy, Medium, Hard, Expert
- Custom difficulty mixes with section-by-section control
- Layout options: 1, 2, 4, or 9 puzzles per page

### Styling & Formatting

Customize your puzzles with:
- **Grid Styles**: Classic (bold box lines), Modern (rounded corners), or Minimal (thin lines)
- **Line Colors**: Black, Gray, or Dark Blue
- **Box Shading**: Optional alternate box shading for visual distinction
- **Number Fonts**: Sans-serif, Serif, or Monospace fonts
- **Puzzle Numbering**: Sequential (1, 2, 3...), By Section (E1, E2..., M1, M2...), or Custom Prefix

### Export Options

- **PDF Export**: KDP-ready books with proper dimensions and formatting
- **PNG Export**: High-quality PNG images of individual puzzles and solutions
- **Batch Export**: ZIP archives for multiple puzzles

## Getting Started

1. Select your puzzle type (currently Sudoku)
2. Configure your options (layout, difficulty, styling, etc.)
3. Generate your puzzles
4. Preview and make adjustments as needed
5. Download in your preferred format

## Development

To run this project locally:

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
