/**
 * Futuristic Book Cover Utility Functions
 * Enhanced algorithms for AI-powered cover generation
 */

// Advanced trim size options with metadata
export const trimSizeOptions = [
  { 
    value: "5x8", 
    label: "5\" x 8\" (12.7 x 20.32 cm)", 
    width: 5, 
    height: 8,
    popular: true,
    genres: ["fiction", "mystery", "romance"]
  },
  { 
    value: "5.25x8", 
    label: "5.25\" x 8\" (13.34 x 20.32 cm)", 
    width: 5.25, 
    height: 8,
    popular: false,
    genres: ["fiction", "fantasy", "sci-fi"]
  },
  { 
    value: "5.5x8.5", 
    label: "5.5\" x 8.5\" (13.97 x 21.59 cm)", 
    width: 5.5, 
    height: 8.5,
    popular: true,
    genres: ["fiction", "non-fiction", "business"]
  },
  { 
    value: "6x9", 
    label: "6\" x 9\" (15.24 x 22.86 cm)", 
    width: 6, 
    height: 9,
    popular: true,
    genres: ["non-fiction", "academic", "self-help"]
  },
  { 
    value: "7x10", 
    label: "7\" x 10\" (17.78 x 25.4 cm)", 
    width: 7, 
    height: 10,
    popular: false,
    genres: ["textbook", "workbook", "art"]
  },
  { 
    value: "8x10", 
    label: "8\" x 10\" (20.32 x 25.4 cm)", 
    width: 8, 
    height: 10,
    popular: false,
    genres: ["children", "photography", "art"]
  },
  { 
    value: "8.5x11", 
    label: "8.5\" x 11\" (21.59 x 27.94 cm)", 
    width: 8.5, 
    height: 11,
    popular: false,
    genres: ["workbook", "textbook", "manual"]
  },
];

// Enhanced paper types with texture information
export const paperTypeOptions = [
  { value: "white", label: "White", description: "Brightest white, high contrast for vivid colors" },
  { value: "cream", label: "Cream", description: "Warm tone, easier on the eyes for longer reads" },
  { value: "premium", label: "Premium White", description: "Enhanced brightness with slight texture" },
  { value: "recycled", label: "Recycled", description: "Eco-friendly with natural texture and subtle flecks" }
];

// Binding types with enhanced metadata
export const bindingTypeOptions = [
  { 
    value: "perfect", 
    label: "Perfect Bound", 
    minPages: 24, 
    maxPages: 800,
    description: "Standard paperback binding with glued spine"
  },
  { 
    value: "casewrap", 
    label: "Case Wrap Hardcover", 
    minPages: 24, 
    maxPages: 800,
    description: "Durable hardcover with printed cover directly on the board"
  },
  { 
    value: "dust", 
    label: "Dust Jacket Hardcover", 
    minPages: 24, 
    maxPages: 800,
    description: "Classic hardcover with removable dust jacket"
  },
  { 
    value: "spiral", 
    label: "Spiral Bound", 
    minPages: 20, 
    maxPages: 470,
    description: "Lay-flat binding ideal for workbooks and manuals"
  },
  { 
    value: "saddle", 
    label: "Saddle Stitch", 
    minPages: 8, 
    maxPages: 92,
    description: "Stapled binding for thin books and booklets"
  }
];

// Advanced finish options
export const finishOptions = [
  { value: "matte", label: "Matte", description: "Soft, non-reflective finish with premium feel" },
  { value: "glossy", label: "Glossy", description: "Vibrant, reflective finish that makes colors pop" },
  { value: "soft-touch", label: "Soft-Touch", description: "Velvety texture with fingerprint resistance" },
  { value: "textured", label: "Textured", description: "Subtle embossed pattern for a unique tactile experience" },
  { value: "metallic", label: "Metallic", description: "Reflective finish with subtle metallic sheen" }
];

// Interface for cover dimensions
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
  safeZone: number;
  spineTextMaxLength: number;
}

// AI style presets
export const aiStylePresets = [
  { value: "realistic", label: "Realistic Photography", description: "Photorealistic imagery with depth and detail" },
  { value: "cinematic", label: "Cinematic", description: "Dramatic lighting and composition like a movie poster" },
  { value: "fantasy", label: "High Fantasy", description: "Magical, dramatic imagery with rich details" },
  { value: "minimalist", label: "Minimalist", description: "Clean, modern design with simple forms" },
  { value: "abstract", label: "Abstract", description: "Non-representational artistic composition" },
  { value: "retro", label: "Retro", description: "Vintage-inspired with nostalgic elements" },
  { value: "cyberpunk", label: "Cyberpunk", description: "Futuristic neon aesthetic with urban dystopia elements" },
  { value: "watercolor", label: "Watercolor", description: "Soft, flowing artistic style with watercolor effects" },
  { value: "3d-render", label: "3D Render", description: "Computer-generated 3D imagery with depth and textures" },
];

// Enhanced font suggestions based on genre
export const fontSuggestions = {
  fiction: ["Merriweather", "Crimson Text", "Playfair Display", "Libre Baskerville"],
  fantasy: ["Cinzel", "Luminari", "Morpheus", "Dragon Hunter"],
  scifi: ["Orbitron", "Exo", "Anurati", "Rajdhani", "Audiowide"],
  thriller: ["Bebas Neue", "Staatliches", "Anton", "Oswald"],
  romance: ["Parisienne", "Playfair Display", "Cormorant", "Libre Caslon Text"],
  children: ["Comic Neue", "Baloo 2", "Patrick Hand", "Sniglet"],
  nonfiction: ["Roboto", "Open Sans", "Montserrat", "Lato"],
  academic: ["Libre Baskerville", "PT Serif", "Lora", "Spectral"],
  business: ["Inter", "Poppins", "Work Sans", "Nunito Sans"]
};

/**
 * Calculate cover dimensions based on advanced specs
 */
export function calculateCoverDimensions(
  trimSize: string,
  pageCount: number,
  paperType: string,
  bindingType: string
): CoverDimensions {
  // Extract width and height from trim size
  const [trimWidth, trimHeight] = trimSize.split('x').map(Number);
  
  // Set DPI and bleed
  const dpi = 300; // Standard print DPI
  const bleedInches = 0.125; // Standard bleed is 1/8 inch
  const safeZoneInches = 0.25; // Safe zone from trim edge
  
  // Calculate spine width based on page count and paper type
  // Advanced formula with paper thickness consideration
  let pagesPerInch;
  
  switch (paperType) {
    case "white":
      pagesPerInch = 444; // 0.00225 inches per page
      break;
    case "cream":
      pagesPerInch = 426; // 0.00235 inches per page
      break;
    case "premium":
      pagesPerInch = 400; // 0.0025 inches per page
      break;
    case "recycled":
      pagesPerInch = 380; // 0.00263 inches per page
      break;
    default:
      pagesPerInch = 444;
  }
  
  // Adjust spine width based on binding type
  let spineWidth = pageCount / pagesPerInch;
  
  if (bindingType === "perfect" || bindingType === "saddle") {
    // Standard calculation
  } else if (bindingType === "casewrap" || bindingType === "dust") {
    // Hardcover needs slightly thicker spine
    spineWidth = spineWidth * 1.1;
  } else if (bindingType === "spiral") {
    // Spiral binding adds thickness
    spineWidth = spineWidth * 1.2 + 0.125;
  }
  
  // Calculate total dimensions with bleed
  const totalWidthInches = bindingType === "saddle" 
    ? trimWidth + (bleedInches * 2) // Saddle stitch doesn't have a spine in the cover
    : (trimWidth * 2) + spineWidth + (bleedInches * 2);
    
  const totalHeightInches = trimHeight + (bleedInches * 2);
  
  // Convert to pixels at specified DPI
  const pixelWidth = Math.round(totalWidthInches * dpi);
  const pixelHeight = Math.round(totalHeightInches * dpi);
  
  // Calculate maximum spine text length based on spine dimensions
  // A general rule is about 20 characters per inch for vertical text
  const spineTextMaxLength = Math.floor((trimHeight - 1) * 20);
  
  return {
    trimWidth,
    trimHeight,
    spineWidth,
    totalWidthInches,
    totalHeightInches,
    pixelWidth,
    pixelHeight,
    dpi,
    bleed: bleedInches,
    safeZone: safeZoneInches,
    spineTextMaxLength
  };
}

/**
 * Extract color palette from an image
 * Returns an array of colors representing the dominant palette
 */
export async function extractColorPalette(imageUrl: string, colorCount: number = 5): Promise<string[]> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      
      img.onload = () => {
        try {
          // Create a canvas to analyze the image
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Set canvas size (can be smaller for performance)
          const analyzeSize = 100;
          const ratio = Math.min(analyzeSize / img.width, analyzeSize / img.height);
          canvas.width = img.width * ratio;
          canvas.height = img.height * ratio;
          
          if (!ctx) {
            resolve(["#333333"]); // Default color if context can't be created
            return;
          }
          
          // Draw image to canvas
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Sample pixels for color analysis
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          
          // Color quantization for palette extraction
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
          
          // Return the requested number of colors
          resolve(sortedColors.slice(0, colorCount));
        } catch (error) {
          console.error("Error extracting color palette:", error);
          resolve(["#333333"]); // Default color on error
        }
      };
      
      img.onerror = () => {
        console.error("Error loading image for color extraction");
        resolve(["#333333"]); // Default color on error
      };
      
      img.src = imageUrl;
      
      // Timeout after 5s
      setTimeout(() => {
        if (!img.complete) {
          console.warn("Color extraction timed out");
          resolve(["#333333"]);
        }
      }, 5000);
    } catch (error) {
      console.error("Error in color extraction:", error);
      resolve(["#333333"]);
    }
  });
}

/**
 * Generate complementary color palette based on a base color
 */
export function generateColorPalette(baseColor: string): string[] {
  // Convert hex to RGB
  const r = parseInt(baseColor.slice(1, 3), 16);
  const g = parseInt(baseColor.slice(3, 5), 16);
  const b = parseInt(baseColor.slice(5, 7), 16);
  
  // Convert RGB to HSL
  const [h, s, l] = rgbToHsl(r, g, b);
  
  // Generate complementary and analogous colors
  const palette = [
    baseColor,
    hslToHex(h, s, l * 0.7), // Darker shade
    hslToHex(h, s * 0.8, l * 1.1), // Lighter shade
    hslToHex((h + 180) % 360, s, l), // Complementary
    hslToHex((h + 30) % 360, s, l), // Analogous 1
    hslToHex((h - 30 + 360) % 360, s, l) // Analogous 2
  ];
  
  return palette;
}

/**
 * Convert RGB to HSL
 */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    
    h /= 6;
  }
  
  return [h * 360, s, l];
}

/**
 * Convert HSL to Hex
 */
function hslToHex(h: number, s: number, l: number): string {
  h /= 360;
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Get recommended trim sizes based on genre
 */
export function getRecommendedTrimSizes(genre: string): string[] {
  return trimSizeOptions
    .filter(size => size.genres.includes(genre.toLowerCase()))
    .map(size => size.value);
}

/**
 * Get font suggestions based on genre and cover style
 */
export function getFontSuggestions(genre: string, style?: string): string[] {
  const genreFonts = fontSuggestions[genre as keyof typeof fontSuggestions] || fontSuggestions.fiction;
  
  // Adjust suggestions based on style if provided
  if (style === "minimalist") {
    return [...genreFonts, "Montserrat", "Helvetica Neue", "Avenir"];
  } else if (style === "retro") {
    return [...genreFonts, "Special Elite", "Courier Prime", "Abril Fatface"];
  } else if (style === "cyberpunk") {
    return ["Orbitron", "Rajdhani", "Share Tech Mono", "Blender Pro", ...genreFonts.slice(0, 2)];
  }
  
  return genreFonts;
}

/**
 * Generate AI prompt enhancements based on genre, style and description
 */
export function enhancePrompt(
  userPrompt: string, 
  genre: string, 
  style: string,
  mood?: string
): string {
  const genreTerms: Record<string, string[]> = {
    fiction: ["narrative", "character-driven", "evocative"],
    fantasy: ["magical", "mythical", "epic", "enchanted", "otherworldly"],
    scifi: ["futuristic", "technological", "cosmic", "otherworldly", "advanced"],
    thriller: ["suspenseful", "mysterious", "dramatic", "tense", "atmospheric"],
    horror: ["dark", "eerie", "foreboding", "sinister", "macabre"],
    romance: ["intimate", "emotional", "passionate", "tender", "heartfelt"],
    children: ["playful", "whimsical", "colorful", "cheerful", "imaginative"],
    nonfiction: ["informative", "clear", "structured", "authoritative"],
    business: ["professional", "polished", "sophisticated", "modern"]
  };
  
  const styleTerms: Record<string, string[]> = {
    realistic: ["photorealistic", "detailed", "lifelike", "natural lighting"],
    cinematic: ["dramatic lighting", "movie poster style", "cinematic composition"],
    fantasy: ["magical", "ethereal", "fantasy art", "dreamlike quality"],
    minimalist: ["clean lines", "simple composition", "negative space", "minimal elements"],
    abstract: ["non-representational", "geometric", "expressionist", "artistic"],
    retro: ["vintage aesthetic", "nostalgic", "retro color palette", "period-appropriate"],
    cyberpunk: ["neon accents", "high tech", "dystopian", "urban futurism"],
    watercolor: ["soft edges", "translucent colors", "artistic brushwork", "gentle textures"],
    "3d-render": ["3D modeling", "realistic textures", "volumetric lighting", "digital render"]
  };
  
  const moodEnhancers = mood ? [mood, `${mood} atmosphere`, `${mood} mood`] : [];
  
  // Get relevant enhancement terms
  const relevantGenreTerms = genreTerms[genre] || genreTerms.fiction;
  const relevantStyleTerms = styleTerms[style] || styleTerms.realistic;
  
  // Sample a few terms from each category to avoid overwhelming the prompt
  const selectedGenreTerms = relevantGenreTerms.slice(0, 2);
  const selectedStyleTerms = relevantStyleTerms.slice(0, 2);
  
  // Combine everything into an enhanced prompt
  const enhancers = [
    ...selectedGenreTerms,
    ...selectedStyleTerms,
    ...moodEnhancers,
    "professional book cover design",
    "high-resolution",
    "premium quality"
  ];
  
  // Shuffle and select a subset of enhancers
  const shuffled = enhancers.sort(() => 0.5 - Math.random());
  const selectedEnhancers = shuffled.slice(0, 5);
  
  return `${userPrompt}. ${selectedEnhancers.join(", ")}.`;
} 