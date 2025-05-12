/**
 * Book Cover Utility Functions
 * Contains calculations and helpers for the book cover generator
 */

// KDP Trim Size Options
export const trimSizeOptions = [
  { value: "5x8", label: "5\" x 8\" (12.7 x 20.32 cm)", width: 5, height: 8 },
  { value: "5.25x8", label: "5.25\" x 8\" (13.34 x 20.32 cm)", width: 5.25, height: 8 },
  { value: "5.5x8.5", label: "5.5\" x 8.5\" (13.97 x 21.59 cm)", width: 5.5, height: 8.5 },
  { value: "6x9", label: "6\" x 9\" (15.24 x 22.86 cm)", width: 6, height: 9 },
  { value: "7x10", label: "7\" x 10\" (17.78 x 25.4 cm)", width: 7, height: 10 },
  { value: "8x10", label: "8\" x 10\" (20.32 x 25.4 cm)", width: 8, height: 10 },
  { value: "8.5x11", label: "8.5\" x 11\" (21.59 x 27.94 cm)", width: 8.5, height: 11 },
];

// Paper Color Options
export const paperColorOptions = [
  { value: "white", label: "White" },
  { value: "cream", label: "Cream" },
  { value: "color", label: "Color" },
];

// Book Type Options
export const bookTypeOptions = [
  { value: "paperback", label: "Paperback" },
  { value: "hardcover", label: "Hardcover" },
];

// Dimensions Interface
export interface CoverDimensions {
  trimWidth: number;
  trimHeight: number;
  spineWidth: number;
  totalWidthInches: number;
  totalHeightInches: number;
  pixelWidth: number;
  pixelHeight: number;
  dpi: number;
  bleed: number;
}

/**
 * Calculate cover dimensions based on KDP specs
 */
export function calculateCoverDimensions(
  trimSize: string,
  pageCount: number,
  paperColor: string
): CoverDimensions {
  // Extract width and height from trim size (e.g., "6x9" -> width=6, height=9)
  const [trimWidth, trimHeight] = trimSize.split('x').map(Number);
  
  // Set DPI and bleed
  const dpi = 300; // Amazon KDP requires 300 DPI
  const bleedInches = 0.125; // Standard bleed is 1/8 inch
  const bleedPixels = bleedInches * dpi;
  
  // Calculate spine width based on page count and paper type
  // https://kdp.amazon.com/en_US/help/topic/G201834180
  const spineWidth = pageCount * (paperColor === "color" ? 0.002347 : 0.002252);
  
  // Calculate total dimensions with bleed
  const totalWidthInches = (trimWidth * 2) + spineWidth + (bleedInches * 2);
  const totalHeightInches = trimHeight + (bleedInches * 2);
  
  // Convert to pixels at 300 DPI
  const pixelWidth = Math.round(totalWidthInches * dpi);
  const pixelHeight = Math.round(totalHeightInches * dpi);
  
  return {
    trimWidth,
    trimHeight,
    spineWidth,
    totalWidthInches,
    totalHeightInches,
    pixelWidth,
    pixelHeight,
    dpi,
    bleed: bleedInches
  };
}

/**
 * Extract dominant color from an image
 */
export async function extractDominantColor(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      
      img.onload = () => {
        try {
          // Create a canvas to analyze the image
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Set canvas size to image dimensions
          canvas.width = img.width;
          canvas.height = img.height;
          
          if (!ctx) {
            resolve("#333333"); // Default color if context can't be created
            return;
          }
          
          // Draw image to canvas
          ctx.drawImage(img, 0, 0);
          
          // Sample pixels for color analysis
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          
          // Simple color extraction
          const colorMap: {[key: string]: number} = {};
          const step = 4; // Sample every few pixels for performance
          
          for (let i = 0; i < imageData.length; i += 4 * step) {
            // Skip transparent pixels
            if (imageData[i + 3] < 128) continue;
            
            // Round color values to reduce variations
            const r = Math.round(imageData[i] / 16) * 16;
            const g = Math.round(imageData[i + 1] / 16) * 16;
            const b = Math.round(imageData[i + 2] / 16) * 16;
            
            const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            colorMap[hex] = (colorMap[hex] || 0) + 1;
          }
          
          // Sort colors by frequency
          const sortedColors = Object.entries(colorMap)
            .sort((a, b) => b[1] - a[1])
            .map(([color]) => color);
          
          // Return the most frequent color
          resolve(sortedColors[0] || "#333333");
        } catch (error) {
          console.error("Error extracting color:", error);
          resolve("#333333"); // Default color on error
        }
      };
      
      img.onerror = () => {
        console.error("Error loading image for color extraction");
        resolve("#333333"); // Default color on error
      };
      
      img.src = imageUrl;
      
      // Timeout after 5s
      setTimeout(() => {
        if (!img.complete) {
          console.warn("Color extraction timed out");
          resolve("#333333");
        }
      }, 5000);
    } catch (error) {
      console.error("Error in color extraction:", error);
      resolve("#333333");
    }
  });
}

/**
 * Create a data URL from a blob URL
 */
export async function blobUrlToDataUrl(blobUrl: string): Promise<string> {
  try {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error converting blob URL to data URL:", error);
    throw error;
  }
}

/**
 * Helper to get spine color suggestions
 */
export async function getSpineColorSuggestions(frontCoverUrl: string): Promise<string[]> {
  try {
    const dominantColor = await extractDominantColor(frontCoverUrl);
    
    // Generate variations based on the dominant color
    const colors = [dominantColor];
    
    // Add a darker shade
    const darkColor = darkenColor(dominantColor, 0.3);
    colors.push(darkColor);
    
    // Add a lighter shade
    const lightColor = lightenColor(dominantColor, 0.3);
    colors.push(lightColor);
    
    // Add black and white options
    colors.push("#000000");
    colors.push("#FFFFFF");
    
    return colors;
  } catch (error) {
    console.error("Error getting spine color suggestions:", error);
    return ["#333333", "#000000", "#FFFFFF", "#660000", "#006600"];
  }
}

/**
 * Helper to darken a color
 */
function darkenColor(hex: string, amount: number): string {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  
  r = Math.max(0, Math.floor(r * (1 - amount)));
  g = Math.max(0, Math.floor(g * (1 - amount)));
  b = Math.max(0, Math.floor(b * (1 - amount)));
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Helper to lighten a color
 */
function lightenColor(hex: string, amount: number): string {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  
  r = Math.min(255, Math.floor(r + (255 - r) * amount));
  g = Math.min(255, Math.floor(g + (255 - g) * amount));
  b = Math.min(255, Math.floor(b + (255 - b) * amount));
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
} 