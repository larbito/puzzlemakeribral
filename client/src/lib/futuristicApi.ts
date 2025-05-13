import { getAuth } from 'firebase/auth';

// API base URL - ensure it's used consistently across all services
const API_URL = process.env.NODE_ENV === 'production' 
  ? window.location.origin.includes('vercel.app') 
    ? 'https://puzzlemakeribral-production.up.railway.app'
    : window.location.origin
  : 'http://localhost:3000';

// Debug logging for API URL
console.log('API_URL in futuristicApi.ts configured as:', API_URL);

// Common headers with authentication
async function getAuthHeaders() {
  const auth = getAuth();
  const token = await auth.currentUser?.getIdToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Interface for cover generation parameters
 */
export interface GenerateCoverParams {
  prompt: string;
  style?: string;
  genre?: string;
  width: number;
  height: number;
  mood?: string;
  enhancePrompt?: boolean;
}

/**
 * Interface for full cover parameters
 */
export interface FullCoverParams {
  frontCoverUrl: string;
  trimSize: string;
  pageCount: number;
  paperType: string;
  bindingType: string;
  spineText?: string;
  spineColor?: string;
  backText?: string;
  font?: string;
  interiorPreviewUrls?: string[];
}

/**
 * Standard error response interface
 */
interface ErrorResponse {
  error: boolean;
  message: string;
  code?: string;
}

/**
 * Enhanced AI image generation with multiple model options
 */
export async function generateCoverImage(params: GenerateCoverParams): Promise<string> {
  try {
    const headers = await getAuthHeaders();
    
    // Prepare API request 
    const response = await fetch(`${API_URL}/api/v2/generate-cover`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params)
    });
    
    if (!response.ok) {
      const errorData: ErrorResponse = await response.json();
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.imageUrl) {
      throw new Error("No image URL returned from API");
    }
    
    return data.imageUrl;
  } catch (error) {
    console.error("Error generating cover image:", error);
    throw error;
  }
}

/**
 * Generate full book cover (front, spine, back)
 */
export async function generateFullCover(params: FullCoverParams): Promise<string> {
  try {
    const headers = await getAuthHeaders();
    
    // Prepare API request
    const response = await fetch(`${API_URL}/api/v2/generate-full-cover`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params)
    });
    
    if (!response.ok) {
      const errorData: ErrorResponse = await response.json();
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.imageUrl) {
      throw new Error("No image URL returned from API");
    }
    
    return data.imageUrl;
  } catch (error) {
    console.error("Error generating full cover:", error);
    throw error;
  }
}

/**
 * Download any image URL via a proxy to avoid CORS issues
 */
export async function downloadImage(imageUrl: string, filename: string): Promise<void> {
  try {
    // For data URLs, download directly
    if (imageUrl.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    
    // For external URLs, use our proxy to avoid CORS issues
    const proxyUrl = `${API_URL}/api/v2/proxy/image?url=${encodeURIComponent(imageUrl)}&filename=${encodeURIComponent(filename)}`;
    
    // Create a link and trigger download
    const link = document.createElement('a');
    link.href = proxyUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error downloading image:", error);
    throw error;
  }
}

/**
 * Get a proxied URL for any external image to avoid CORS issues
 */
export function getProxiedImageUrl(imageUrl: string): string {
  // Don't proxy data URLs and blob URLs
  if (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
    return imageUrl;
  }
  
  // For external URLs, use our proxy
  return `${API_URL}/api/v2/proxy/image?url=${encodeURIComponent(imageUrl)}`;
}

/**
 * Create a temporary image element from a URL
 */
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    
    // Use proxied URL to avoid CORS issues
    img.src = getProxiedImageUrl(url);
  });
}

/**
 * Get AI-generated text suggestions for book title/description based on cover
 */
export async function getCoverTextSuggestions(imageUrl: string, genre?: string): Promise<string[]> {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_URL}/api/v2/suggest-text`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        imageUrl,
        genre: genre || 'fiction'
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.suggestions || [];
  } catch (error) {
    console.error("Error getting text suggestions:", error);
    return [];
  }
}

/**
 * Add text overlay to an image with specified font and position
 */
export async function addTextToImage(
  imageUrl: string, 
  text: string, 
  options: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    position?: 'top' | 'center' | 'bottom';
    x?: number;
    y?: number;
  } = {}
): Promise<string> {
  try {
    // Load the image into a canvas
    const img = await loadImage(imageUrl);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error("Could not create canvas context");
    }
    
    // Set canvas dimensions
    canvas.width = img.width;
    canvas.height = img.height;
    
    // Draw the image
    ctx.drawImage(img, 0, 0);
    
    // Configure text style
    const fontSize = options.fontSize || Math.floor(img.height / 20);
    ctx.font = `${fontSize}px ${options.fontFamily || 'Arial'}`;
    ctx.fillStyle = options.color || 'white';
    ctx.textAlign = 'center';
    
    // Calculate text position
    const x = options.x !== undefined ? options.x : img.width / 2;
    let y;
    
    switch (options.position) {
      case 'top':
        y = fontSize * 1.5;
        break;
      case 'bottom':
        y = img.height - fontSize;
        break;
      case 'center':
      default:
        y = img.height / 2;
        break;
    }
    
    if (options.y !== undefined) {
      y = options.y;
    }
    
    // Add text to image
    ctx.fillText(text, x, y);
    
    // Return data URL
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error("Error adding text to image:", error);
    throw error;
  }
}

/**
 * Upload an image to the server
 */
export async function uploadImage(file: File): Promise<string> {
  try {
    const headers = await getAuthHeaders();
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        resolve(base64String.split(',')[1]);
      };
      reader.readAsDataURL(file);
    });

    const response = await fetch(`${API_URL}/api/v2/upload-image`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        data: base64
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload image');
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
}

/**
 * Generate a canvas with cover guides (trim, bleed, spine)
 */
export async function generateCoverGuide(
  dimensions: {
    width: number;
    height: number;
    spineWidth?: number;
    bleed?: number;
  },
  showSpine: boolean = true
): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error("Could not create canvas context");
  }
  
  const { width, height, spineWidth = 0, bleed = 0 } = dimensions;
  
  // Set canvas dimensions
  canvas.width = width;
  canvas.height = height;
  
  // Draw transparent background
  ctx.clearRect(0, 0, width, height);
  
  // Draw outer bleed area
  ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
  ctx.fillRect(0, 0, width, height);
  
  // Draw safe area
  const safeAreaWidth = width - (bleed * 2);
  const safeAreaHeight = height - (bleed * 2);
  ctx.clearRect(bleed, bleed, safeAreaWidth, safeAreaHeight);
  
  // Draw spine guide if needed
  if (showSpine && spineWidth > 0) {
    const halfWidth = width / 2;
    
    // Left of spine
    ctx.beginPath();
    ctx.moveTo(halfWidth - spineWidth/2, 0);
    ctx.lineTo(halfWidth - spineWidth/2, height);
    ctx.strokeStyle = 'rgba(0, 0, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Right of spine
    ctx.beginPath();
    ctx.moveTo(halfWidth + spineWidth/2, 0);
    ctx.lineTo(halfWidth + spineWidth/2, height);
    ctx.strokeStyle = 'rgba(0, 0, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  
  // Add trim marks
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.lineWidth = 1;
  
  // Top-left
  ctx.beginPath();
  ctx.moveTo(0, bleed);
  ctx.lineTo(bleed/2, bleed);
  ctx.moveTo(bleed, 0);
  ctx.lineTo(bleed, bleed/2);
  ctx.stroke();
  
  // Top-right
  ctx.beginPath();
  ctx.moveTo(width, bleed);
  ctx.lineTo(width - bleed/2, bleed);
  ctx.moveTo(width - bleed, 0);
  ctx.lineTo(width - bleed, bleed/2);
  ctx.stroke();
  
  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(0, height - bleed);
  ctx.lineTo(bleed/2, height - bleed);
  ctx.moveTo(bleed, height);
  ctx.lineTo(bleed, height - bleed/2);
  ctx.stroke();
  
  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(width, height - bleed);
  ctx.lineTo(width - bleed/2, height - bleed);
  ctx.moveTo(width - bleed, height);
  ctx.lineTo(width - bleed, height - bleed/2);
  ctx.stroke();
  
  return canvas.toDataURL('image/png');
} 