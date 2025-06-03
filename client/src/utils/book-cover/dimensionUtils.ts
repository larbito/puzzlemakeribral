// Dimension calculation utilities for KDP book covers

export interface Dimensions {
  frontWidth: number;
  frontHeight: number;
  spineWidth: number;
  fullWrapWidth: number;
  fullWrapHeight: number;
}

// KDP supported trim sizes
export const KDP_TRIM_SIZES = [
  { value: '5x8', label: '5" × 8"', width: 5, height: 8 },
  { value: '5.25x8', label: '5.25" × 8"', width: 5.25, height: 8 },
  { value: '5.5x8.5', label: '5.5" × 8.5"', width: 5.5, height: 8.5 },
  { value: '6x9', label: '6" × 9"', width: 6, height: 9, popular: true },
  { value: '7x10', label: '7" × 10"', width: 7, height: 10 },
  { value: '8x10', label: '8" × 10"', width: 8, height: 10 },
  { value: '8.5x11', label: '8.5" × 11"', width: 8.5, height: 11 },
];

// Paper type multipliers for spine width calculation
export const PAPER_MULTIPLIERS = {
  white: 0.002252,
  cream: 0.0025,
  color: 0.002347,
};

// Standard bleed size in inches
export const BLEED_SIZE = 0.125;

/**
 * Parse trim size string (e.g., "6x9") into width and height
 */
export const parseTrimSize = (trimSize: string): { width: number; height: number } => {
  const trimData = KDP_TRIM_SIZES.find(size => size.value === trimSize);
  if (trimData) {
    return { width: trimData.width, height: trimData.height };
  }
  
  // Fallback: parse the string directly
  const [width, height] = trimSize.split('x').map(Number);
  return { width: width || 6, height: height || 9 };
};

/**
 * Calculate spine width based on page count and paper type
 */
export const calculateSpineWidth = (
  pageCount: number, 
  paperType: 'white' | 'cream' | 'color'
): number => {
  const multiplier = PAPER_MULTIPLIERS[paperType];
  return pageCount * multiplier;
};

/**
 * Calculate all book dimensions
 */
export const calculateDimensions = (
  trimSize: string,
  pageCount: number,
  paperType: 'white' | 'cream' | 'color',
  includeBleed: boolean = true
): Dimensions => {
  const { width, height } = parseTrimSize(trimSize);
  const spineWidth = calculateSpineWidth(pageCount, paperType);
  
  const bleedOffset = includeBleed ? BLEED_SIZE * 2 : 0;
  
  return {
    frontWidth: width,
    frontHeight: height,
    spineWidth,
    fullWrapWidth: (width * 2) + spineWidth + bleedOffset,
    fullWrapHeight: height + bleedOffset,
  };
};

/**
 * Convert inches to pixels for display
 */
export const inchesToPixels = (inches: number, dpi: number = 300): number => {
  return Math.round(inches * dpi);
};

/**
 * Convert pixels to inches
 */
export const pixelsToInches = (pixels: number, dpi: number = 300): number => {
  return pixels / dpi;
};

/**
 * Get DALL·E image size based on book dimensions
 */
export const getDALLESize = (width: number, height: number): string => {
  const ratio = width / height;
  
  // DALL·E 3 supports: 1024x1024 (1:1), 1024x1792 (9:16 portrait), 1792x1024 (16:9 landscape)
  if (ratio > 1.1) {
    return '1792x1024'; // Landscape
  } else if (ratio < 0.9) {
    return '1024x1792'; // Portrait
  } else {
    return '1024x1024'; // Square
  }
};

/**
 * Format dimensions for display
 */
export const formatDimensions = (dimensions: Dimensions): string => {
  return `${dimensions.frontWidth}" × ${dimensions.frontHeight}" (Spine: ${dimensions.spineWidth.toFixed(3)}")`;
};

/**
 * Validate if spine is wide enough for text
 */
export const isSpineTextviable = (spineWidth: number): boolean => {
  return spineWidth >= 0.25; // Minimum 0.25" for readable text
};

/**
 * Get recommendations based on trim size
 */
export const getTrimSizeRecommendation = (trimSize: string): string => {
  const recommendations: Record<string, string> = {
    '5x8': 'Perfect for romance novels and poetry',
    '5.25x8': 'Great for novellas and short story collections',
    '5.5x8.5': 'Ideal for fiction and memoirs',
    '6x9': 'Most popular - perfect for novels and non-fiction',
    '7x10': 'Excellent for textbooks and workbooks',
    '8x10': 'Great for manuals and illustrated books',
    '8.5x11': 'Perfect for large format books and technical manuals',
  };
  
  return recommendations[trimSize] || 'Standard paperback dimensions';
}; 