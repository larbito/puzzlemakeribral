import { toast } from "sonner";
import type { DesignHistoryItem } from "@/services/designHistory";

// API base URL - ensure it's used consistently
const API_URL = process.env.NODE_ENV === 'production' 
  ? window.location.origin.includes('vercel.app') 
    ? 'https://puzzlemakeribral-production.up.railway.app'
    : window.location.origin
  : 'http://localhost:3000';

// Debug logging for API URL
console.log('API_URL configured as:', API_URL);
console.log('Current environment:', process.env.NODE_ENV || 'not set');
console.log('Window location origin:', window.location.origin);

// For development/debugging - set to false to use the real API service
const USE_PLACEHOLDERS = false; // Set to false to use the real API service

// Add debug logging for API URL and environment
console.log('API_URL:', API_URL);
console.log('Window location:', window.location.href);
console.log('Window origin:', window.location.origin);

export interface GenerateImageParams {
  prompt: string;
  style?: string; 
  colorScheme?: string;
  transparentBackground?: boolean;
  safeMode?: boolean;
  format?: string;
}

export async function generateImage({
  prompt,
  style = "illustrated",
  colorScheme = "colorful",
  transparentBackground = true,
  safeMode = true,
  format = "png"
}: GenerateImageParams): Promise<string | null> {
  try {
    // For testing UI interactivity
    console.log("Generating image with prompt:", prompt);
    
    // If using placeholders for testing, return immediately
    if (USE_PLACEHOLDERS) {
      console.log("Using placeholder by configuration");
      return getPlaceholderImage(prompt, 'tshirt');
    }

    // Build the prompt with style and color scheme preferences
    let enhancedPrompt = `t-shirt design: ${prompt}`;
    
    if (style && style !== "custom") {
      enhancedPrompt += `, ${style} style`;
    }
    
    if (colorScheme && colorScheme !== "custom") {
      enhancedPrompt += `, ${colorScheme} colors`;
    }
    
    if (transparentBackground) {
      enhancedPrompt += ", transparent background, isolated on white";
    }

    console.log("Enhanced prompt:", enhancedPrompt);

    try {
      // Simulate async delay to test interactivity
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      try {
        const imageUrl = await generateWithProxy(enhancedPrompt, style);
        console.log("Successfully generated image");
        return imageUrl;
      } catch (error) {
        console.error("Error with image generation from proxy:", error);
        
        // Fallback to placeholder for demo/testing
        console.log("Using placeholder as fallback");
        return getPlaceholderImage(prompt, 'tshirt');
      }
    } catch (error) {
      console.error("Error in generateImage:", error);
      
      // Always return a placeholder for demo purposes
      console.log("Using placeholder due to error");
      return getPlaceholderImage(prompt, 'tshirt');
    }
  } catch (error) {
    console.error("Error in generateImage outer block:", error);
    
    // Ensure we always return something
    console.log("Using placeholder in catch block");
    return getPlaceholderImage(prompt, 'tshirt');
  }
}

// Generate with our backend proxy
async function generateWithProxy(prompt: string, style?: string): Promise<string> {
  console.log("Making API call with prompt:", prompt);
  console.log("API URL being used:", API_URL);
  console.log("Full endpoint URL:", `${API_URL}/api/ideogram/generate`);

  try {
    // Create form data for the request
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('aspect_ratio', '3:4');
    formData.append('rendering_speed', 'TURBO');
    
    if (style && style !== "custom") {
      formData.append('style_type', style.toUpperCase());
    }

    formData.append('negative_prompt', 'text, watermark, signature, blurry, low quality, distorted, deformed');

    // Log the form data entries for debugging
    console.log("Form data entries:");
    for (const [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }
    
    const fullUrl = `${API_URL}/api/ideogram/generate`;
    console.log("Making request to:", fullUrl);

    const response = await fetch(fullUrl, {
      method: 'POST',
      body: formData // Send the FormData object directly
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Raw error response:", errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || 'Failed to parse error response' };
      }
      
      console.error("API error response:", errorData);
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("API response data:", data);

    if (!data.url) {
      console.error("Could not extract image URL from response:", data);
      throw new Error("Could not extract image URL from API response");
    }

    return data.url;
  } catch (error: unknown) {
    console.error("Error calling API:", error);
    if (error instanceof Error) {
      throw new Error(`API call failed: ${error.message}`);
    }
    throw error;
  }
}

// Helper function to get placeholders
function getPlaceholderImage(prompt: string, type: 'tshirt' | 'bookcover' | 'coloring' = 'tshirt', width = 1024, height = 1365): Promise<string> {
  const words = prompt.split(' ').slice(0, 5).join('-');
  const bgColor = getColorForStyle(prompt);
  const fgColor = "FFFFFF";
  
  // Different text based on type
  const typeText = type === 'bookcover' ? 'Book Cover: ' : 
                  type === 'coloring' ? 'Coloring Page: ' : 'T-Shirt: ';
  
  // Use the provided dimensions if it's a book cover
  const dimensions = type === 'bookcover' || type === 'coloring' ? `${width}x${height}` : '1024x1365';
  
  // Use a different placeholder service that allows CORS
  // Instead of dummyimage.com, use a data URI which is guaranteed to work
  const placeholderUrl = `https://placehold.co/${dimensions}/${bgColor}/${fgColor}?text=${encodeURIComponent(typeText + words)}`;
  
  console.log(`Generated ${type} placeholder URL:`, placeholderUrl);
  
  return new Promise((resolve) => {
    // Check if the URL works by creating a test image
    const testImg = new Image();
    
    // Set up event handlers
    testImg.onload = () => {
      // Image loaded successfully, resolve with the URL
      setTimeout(() => {
        resolve(placeholderUrl);
      }, 500);
    };
    
    testImg.onerror = () => {
      // Image failed to load, fall back to a base64 data URI
      console.error("Placeholder image failed to load, using fallback data URI");
      const fallbackDataUri = createFallbackImage(words, bgColor, typeText, width, height);
      setTimeout(() => {
        resolve(fallbackDataUri);
      }, 500);
    };
    
    // Attempt to load the image
    testImg.src = placeholderUrl;
  });
}

// Create a simple fallback image as a data URI
function createFallbackImage(text: string, bgColor: string, typeText: string, width = 1024, height = 1365): string {
  // Create a canvas to draw the fallback image
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    // If canvas context isn't available, return an empty data URI
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  }
  
  // Set background color
  ctx.fillStyle = `#${bgColor}`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 40px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Break long text into multiple lines
  const words = text.split(' ');
  let lines = [];
  let currentLine = typeText;
  
  // Add first line
  lines.push(currentLine);
  currentLine = '';
  
  // Split remaining words into lines
  for (const word of words) {
    const testLine = currentLine + ' ' + word;
    if (testLine.length > 20) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  // Add the last line if it's not empty
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }
  
  // Draw the lines of text
  const lineHeight = 50;
  const startY = canvas.height / 2 - (lines.length * lineHeight) / 2;
  
  lines.forEach((line, index) => {
    ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
  });
  
  // Convert canvas to data URL
  return canvas.toDataURL('image/png');
}

// Helper function to select background colors based on prompt style
function getColorForStyle(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('retro') || lowerPrompt.includes('vintage')) {
    return "F5A623";
  } else if (lowerPrompt.includes('minimalist')) {
    return "444444";
  } else if (lowerPrompt.includes('cyberpunk') || lowerPrompt.includes('neon')) {
    return "9013FE";
  } else if (lowerPrompt.includes('nature')) {
    return "2D8C3C";
  } else if (lowerPrompt.includes('ocean')) {
    return "1E88E5";
  } else if (lowerPrompt.includes('sunset')) {
    return "FF5733";
  } else {
    return "252A37";
  }
}

export async function downloadImage(imageUrl: string, format: string, filename: string = "tshirt-design"): Promise<void> {
  try {
    console.log("Starting download of image:", imageUrl.substring(0, 100) + "...");
    
    // For data URLs (which is what our background removal function returns)
    if (imageUrl.startsWith('data:')) {
      console.log("Handling data URL download");
      // Create a direct download link for data URLs
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `${filename}.${format.toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Design downloaded as ${format}`);
      return;
    }
    
    // For regular URLs, use our backend proxy to avoid CORS issues
    try {
      console.log("Using backend proxy to download image");
      
      // Create a temporary download indicator
      toast.loading("Processing download...");
      
      // Use our own backend proxy endpoint
      const proxyEndpoint = `${API_URL}/api/ideogram/proxy-image`;
      const encodedUrl = encodeURIComponent(imageUrl);
      
      // Direct download approach - create a link to our backend proxy
      const downloadUrl = `${proxyEndpoint}?url=${encodedUrl}&filename=${encodeURIComponent(filename)}.${format.toLowerCase()}`;
      
      // Open the download in a hidden iframe to trigger the download
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = downloadUrl;
      document.body.appendChild(iframe);
      
      // Set a timeout to remove the iframe after download should have started
      setTimeout(() => {
        document.body.removeChild(iframe);
        toast.dismiss();
        toast.success(`Design download initiated`);
      }, 3000);
      
    } catch (proxyError) {
      console.error("Backend proxy download failed:", proxyError);
      toast.dismiss();
      
      // Fallback to client-side conversion
      try {
        console.log("Attempting client-side conversion as fallback");
        
        // Create a canvas element
        const canvas = document.createElement('canvas');
        const img = new Image();
        
        // Set up a promise to handle the async image loading
        const downloadPromise = new Promise<void>((resolve, reject) => {
          img.onload = () => {
            // Set canvas dimensions to match the image
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Draw the image on the canvas
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error("Could not get canvas context"));
              return;
            }
            
            ctx.drawImage(img, 0, 0);
            
            try {
              // Convert the canvas to a data URL
              const dataUrl = canvas.toDataURL('image/png');
              
              // Create a download link
              const link = document.createElement('a');
              link.href = dataUrl;
              link.download = `${filename}.${format.toLowerCase()}`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              
              resolve();
            } catch (canvasError) {
              console.error("Error converting canvas to data URL:", canvasError);
              reject(canvasError);
            }
          };
          
          img.onerror = (error) => {
            console.error("Error loading image:", error);
            reject(new Error("Failed to load image"));
          };
          
          // Add a proxy to try to avoid CORS issues
          img.crossOrigin = "anonymous";
          img.src = `https://corsproxy.io/?${encodeURIComponent(imageUrl)}`;
        });
        
        await downloadPromise;
        toast.success(`Design downloaded as ${format}`);
      } catch (fallbackError) {
        console.error("All download methods failed:", fallbackError);
        toast.error("Could not download image. Please try a different design.");
      }
    }
  } catch (error) {
    console.error("Error downloading image:", error);
    toast.error("Failed to download image. Please try again.");
  }
}

// New function to download multiple images at once
export async function downloadAllImages(images: { url: string, prompt: string }[]): Promise<void> {
  if (!images || images.length === 0) {
    toast.error("No images to download");
    return;
  }
  
  // Show a loading toast for the batch download
  const toastId = toast.loading(`Preparing to download ${images.length} images as a zip file...`);
  
  try {
    // Call the backend batch-download endpoint that creates a zip file
    console.log("Using batch download endpoint for", images.length, "images");
    console.log("API URL:", API_URL);
    
    const batchEndpoint = `${API_URL}/api/ideogram/batch-download`;
    console.log("Full endpoint URL:", batchEndpoint);
    
    // Format the request body
    const requestBody = JSON.stringify({ images });
    console.log("Request body size:", new Blob([requestBody]).size, "bytes");
    
    // Use the Fetch API to make a direct request to our backend
    const response = await fetch(batchEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/zip',
      },
      body: requestBody,
    });
    
    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      // Try to read the error message from the response
      let errorMessage = `Server responded with status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // If response isn't JSON, try to get text
        try {
          const textError = await response.text();
          if (textError) errorMessage = textError;
        } catch {
          // Ignore if we can't read the response
        }
      }
      
      throw new Error(errorMessage);
    }
    
    // Get content type from response
    const contentType = response.headers.get('content-type');
    console.log("Response content type:", contentType);
    
    if (!contentType || !contentType.includes('application/zip')) {
      console.warn("Expected application/zip content type but got:", contentType);
      // Continue anyway since some servers might not set the correct content type
    }
    
    // Get response as a blob
    const blob = await response.blob();
    console.log("Response blob size:", blob.size, "bytes");
    
    if (blob.size === 0) {
      throw new Error("Received empty response from server");
    }
    
    // Create a download link for the blob
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `tshirt-designs-${Date.now()}.zip`;
    
    // Trigger the download
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    }, 100);
    
    // Show success message
    toast.dismiss(toastId);
    toast.success(`Downloaded ${images.length} images as a zip file`);
  } catch (error) {
    console.error("Error in batch download:", error);
    toast.dismiss(toastId);
    toast.error(`Failed to download images: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Re-export history-related functions
export { getDesignHistory, saveToHistory, deleteFromHistory, saveToFavorites, saveToProject } from "@/services/designHistory";

export async function imageToPrompt(imageFile: File, type: 'tshirt' | 'coloring' = 'tshirt'): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('type', type);

    const response = await fetch(`${API_URL}/api/ideogram/analyze`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();
    return data.prompt;
  } catch (error) {
    console.error("Error analyzing image:", error);
    // Return a generic prompt based on the type
    if (type === 'coloring') {
      return "A cute cartoon scene with animals in a forest setting, perfect for a children's coloring book";
    } else {
      return "A creative t-shirt design featuring a modern abstract pattern with vibrant colors suitable for streetwear";
    }
  }
}

// Update the removeBackground function to handle CORS issues
export async function removeBackground(imageUrl: string): Promise<string> {
  try {
    console.log("Starting background removal for image:", imageUrl.substring(0, 100) + "...");
    
    // CORS workaround: If the URL is from an external source, try to use a CORS proxy
    // or fall back to client-side only processing
    const processedUrl = imageUrl.startsWith('http') && !imageUrl.includes(window.location.hostname) 
      ? `https://corsproxy.io/?${encodeURIComponent(imageUrl)}` // Use CORS proxy
      : imageUrl;
      
    console.log("Using URL for processing:", processedUrl.substring(0, 100) + "...");
    
    // For a real implementation, make an API call to a background removal service
    // For now, we'll implement a simple canvas-based approach
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous"; // This is important for CORS
      
      img.onload = () => {
        try {
          console.log("Image loaded, dimensions:", img.width, "x", img.height);
          // Create canvas to process the image
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) {
            console.error("Could not create canvas context");
            reject(new Error("Could not create canvas context"));
            return;
          }
          
          // Draw the original image
          ctx.drawImage(img, 0, 0);
          
          try {
            // Get image data - this might fail due to CORS
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            console.log("Processing", data.length/4, "pixels");
            
            // Check if the image already has transparency
            let hasTransparency = false;
            for (let i = 3; i < data.length; i += 4) {
              if (data[i] < 250) {
                hasTransparency = true;
                break;
              }
            }
            
            if (hasTransparency) {
              console.log("Image already has transparency");
              resolve(imageUrl); // Return the original URL if already transparent
              return;
            }
            
            // Simple background removal - remove white-ish pixels
            let hasRemovedPixels = false;
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              
              // If pixel is white or very light, make it transparent
              if (r > 240 && g > 240 && b > 240) {
                data[i + 3] = 0; // Set alpha to 0
                hasRemovedPixels = true;
              }
            }
            
            console.log("Background removal completed, hasRemovedPixels:", hasRemovedPixels);
            
            if (!hasRemovedPixels) {
              console.log("No white pixels found to remove");
              reject(new Error("No white background detected in the image"));
              return;
            }
            
            // Put the modified image data back
            ctx.putImageData(imageData, 0, 0);
            
            // Convert to data URL (PNG with transparency)
            const transparentImageUrl = canvas.toDataURL('image/png');
            console.log("Generated transparent image");
            
            // Resolve with the data URL
            resolve(transparentImageUrl);
          } catch (corsError) {
            console.error("CORS error when processing image data:", corsError);
            
            // CORS issue fallback: draw the image to canvas and return that as a data URL
            // This won't remove the background but will at least return an image
            console.log("Falling back to client-side image conversion without background removal");
            
            // Try to just convert the image to a data URL
            try {
              const dataUrl = canvas.toDataURL('image/png');
              toast.warning("Could not remove background due to CORS restrictions. Try downloading the image first and then uploading it.");
              resolve(dataUrl);
            } catch (fallbackError) {
              console.error("Fallback also failed:", fallbackError);
              reject(new Error("Unable to process image due to CORS restrictions"));
            }
          }
        } catch (error) {
          console.error("Error processing image in canvas:", error);
          reject(error);
        }
      };
      
      img.onerror = (error) => {
        console.error("Error loading image:", error);
        reject(new Error("Failed to load image for background removal. This may be due to CORS restrictions."));
      };
      
      // Add a timeout to catch hanging loads
      const timeout = setTimeout(() => {
        console.error("Image load timed out");
        reject(new Error("Timed out while loading image"));
      }, 10000); // 10 second timeout
      
      // Fix the timeout issue with a different approach
      const originalOnload = img.onload;
      img.onload = (event) => {
        clearTimeout(timeout);
        if (originalOnload) {
          originalOnload.call(img, event);
        }
      };
      
      console.log("Starting image load");
      img.src = processedUrl;
    });
  } catch (error) {
    console.error("Error in removeBackground:", error);
    throw new Error(`Background removal failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// In a real implementation, you'd make an API call like this:
/*
export async function removeBackgroundWithAPI(imageUrl: string): Promise<string> {
  try {
    // First convert URL to File/Blob if it's not already
    const response = await fetch(imageUrl);
    const imageBlob = await response.blob();
    
    const formData = new FormData();
    formData.append('image', imageBlob);
    
    const apiResponse = await fetch(`${API_URL}/api/ideogram/remove-background`, {
      method: 'POST',
      body: formData
    });
    
    if (!apiResponse.ok) {
      throw new Error(`API error: ${apiResponse.status}`);
    }
    
    const data = await apiResponse.json();
    return data.url; // URL to the image with background removed
  } catch (error) {
    console.error("Error removing background:", error);
    throw error;
  }
}
*/

// The imageToPrompt function already exists above, don't duplicate it 

export interface GenerateBookCoverParams {
  prompt: string;
  style?: string;
  width: number;
  height: number;
}

export interface ExtractedColors {
  colors: string[];
  dominantColor: string;
}

// Extract dominant colors from an image
export async function extractColorsFromImage(imageUrl: string): Promise<ExtractedColors> {
  try {
    // Use our proxy for ideogram URLs
    const proxiedUrl = forceProxyForIdeogramUrl(imageUrl);
    
    return new Promise((resolve, reject) => {
      try {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        
        // Add a timeout to prevent hanging
        const timeout = setTimeout(() => {
          console.warn("Color extraction timed out");
          resolve({ colors: [], dominantColor: "#333333" });
        }, 5000);
        
        // Set up the onload handler
        img.onload = function() {
          clearTimeout(timeout);
          
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            
            if (!ctx) {
              resolve({ colors: [], dominantColor: "#333333" });
              return;
            }
            
            ctx.drawImage(img, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            console.log("Image data retrieved, processing", imageData.length / 4, "pixels");
            
            // Simple color extraction - more sophisticated algorithms could be used
            const colorMap: {[key: string]: number} = {};
            const step = 4; // Sample every few pixels for performance
            
            for (let i = 0; i < imageData.length; i += 4 * step) {
              // Skip transparent pixels
              if (imageData[i + 3] < 128) continue;
              
              // Convert to hex and round to reduce color variations
              const r = Math.round(imageData[i] / 16) * 16;
              const g = Math.round(imageData[i + 1] / 16) * 16;
              const b = Math.round(imageData[i + 2] / 16) * 16;
              
              const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
              colorMap[hex] = (colorMap[hex] || 0) + 1;
            }
            
            // Sort colors by frequency and get top colors
            const sortedColors = Object.entries(colorMap)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 6)
              .map(([color]) => color);
            
            console.log("Extracted colors:", sortedColors);
            
            // Determine dominant color (first color from the extracted set)
            const dominantColor = sortedColors.length > 0 ? sortedColors[0] : "#333333";
            console.log("Dominant color:", dominantColor);
            
            resolve({ 
              colors: sortedColors,
              dominantColor
            });
          } catch (error) {
            console.error("Error processing image for color extraction:", error);
            resolve({ colors: [], dominantColor: "#333333" });
          }
        };
        
        img.onerror = (error) => {
          clearTimeout(timeout);
          console.error("Error loading image for color extraction:", error);
          resolve({ colors: [], dominantColor: "#333333" });
        };
        
        console.log("Starting to load image for color extraction");
        img.src = proxiedUrl;
      } catch (error) {
        console.error("Error in color extraction:", error);
        resolve({ colors: [], dominantColor: "#333333" });
      }
    });
  } catch (error) {
    console.error("Error in extractColorsFromImage:", error);
    return { colors: [], dominantColor: "#333333" };
  }
}

export interface CreateFullBookCoverParams {
  frontCoverUrl: string;
  title: string;
  author: string;
  spineText?: string;
  spineColor?: string;
  dimensions: {
    widthInches: number;
    heightInches: number;
    widthPixels: number;
    heightPixels: number;
    spineWidth: number;
  };
  interiorPreviewImages?: File[];
  showGuides?: boolean;
}

export async function createFullBookCover({
  frontCoverUrl,
  title,
  author,
  spineText,
  spineColor,
  dimensions,
  interiorPreviewImages = [],
  showGuides = true
}: CreateFullBookCoverParams): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("Creating full book cover layout");
      console.log("Front cover URL:", frontCoverUrl ? frontCoverUrl.substring(0, 50) + "..." : "undefined");
      console.log("Spine color:", spineColor);
      console.log("Dimensions:", dimensions);
      console.log("Interior previews:", interiorPreviewImages.length);
      
      // Check if front cover URL is valid
      if (!frontCoverUrl) {
        reject(new Error("Front cover URL is required"));
        return;
      }

      // Use our proxy endpoint for loading the front cover
      const proxyUrl = `${API_URL}/api/ideogram/proxy-image?url=${encodeURIComponent(frontCoverUrl)}`;
      
      // Create a new image element
      const frontCoverImg = new Image();
      frontCoverImg.crossOrigin = "anonymous"; // Enable CORS
      
      // Create a canvas with the total cover dimensions
      const canvas = document.createElement('canvas');
      canvas.width = dimensions.widthPixels;
      canvas.height = dimensions.heightPixels;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Could not create canvas context"));
        return;
      }
      
      // Calculate regions for each part of the cover
      const DPI = 300;
      
      // Add 0.125" bleed on each side
      const bleedInches = 0.125;
      const bleedPixels = bleedInches * DPI;
      
      // Convert spine width to pixels
      const spineWidthPixels = Math.round(dimensions.spineWidth * DPI);
      
      // Calculate trim size width and height in pixels
      const trimWidthInches = (dimensions.widthInches - (bleedInches * 2) - dimensions.spineWidth) / 2;
      const trimHeightInches = dimensions.heightInches - (bleedInches * 2);
      
      const trimWidthPixels = Math.round(trimWidthInches * DPI);
      const trimHeightPixels = Math.round(trimHeightInches * DPI);
      
      // Calculate regions
      const leftCoverX = 0;
      const spineX = leftCoverX + trimWidthPixels + bleedPixels;
      const rightCoverX = spineX + spineWidthPixels;
      
      // Set white background for the whole canvas
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      try {
        // Load the front cover through our proxy
        await new Promise((resolve, reject) => {
          frontCoverImg.onload = resolve;
          frontCoverImg.onerror = () => reject(new Error("Failed to load front cover image"));
          frontCoverImg.src = proxyUrl;
        });
        
        console.log("Front cover image loaded successfully");
        
        // Draw the front cover (right side)
        ctx.drawImage(
          frontCoverImg, 
          rightCoverX, // x position
          0,          // y position
          trimWidthPixels + bleedPixels, // width
          canvas.height  // height
        );
        
        // Extract colors from the front cover for the spine
        let extractedColors: ExtractedColors = { colors: [], dominantColor: "#333333" };
        
        try {
          extractedColors = await extractColorsFromImage(frontCoverUrl);
          console.log("Extracted colors:", extractedColors.colors);
        } catch (colorError) {
          console.error("Error extracting colors:", colorError);
          // Continue with default color
        }
        
        // Use provided spine color or the dominant color
        const finalSpineColor = spineColor || extractedColors.dominantColor || "#333333";
        console.log("Using spine color:", finalSpineColor);
        
        // Draw the spine
        ctx.fillStyle = finalSpineColor;
        ctx.fillRect(spineX, 0, spineWidthPixels, canvas.height);
        
        // Add spine text if provided and spine is thick enough
        if (spineText && dimensions.spineWidth >= 0.1) {
          // Draw the spine text vertically
          ctx.save();
          
          // Text style
          ctx.fillStyle = "#FFFFFF"; // White text
          ctx.font = `bold ${Math.min(spineWidthPixels * 0.8, 36)}px Arial`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          
          // Rotate and position for vertical text
          ctx.translate(spineX + spineWidthPixels / 2, canvas.height / 2);
          ctx.rotate(-Math.PI / 2); // Rotate 90 degrees counter-clockwise
          
          // Draw the text
          ctx.fillText(spineText, 0, 0);
          
          // Restore canvas context
          ctx.restore();
        }
        
        // Create the back cover (left side) - blurred version of front cover
        console.log("Creating back cover (blurred version)");
        
        // Create a temporary canvas for the blur effect
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = trimWidthPixels + bleedPixels;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        if (!tempCtx) {
          throw new Error("Could not create temporary canvas context");
        }
        
        // Draw the front cover on the temporary canvas
        tempCtx.drawImage(frontCoverImg, 0, 0, tempCanvas.width, tempCanvas.height);
        
        // Apply a blur effect (if supported)
        try {
          tempCtx.filter = 'blur(15px) brightness(0.8)';
          tempCtx.drawImage(tempCanvas, 0, 0);
        } catch (error) {
          console.warn("Blur filter not supported:", error);
          // If blur filter is not supported, just darken the image
          tempCtx.fillStyle = "rgba(0, 0, 0, 0.3)";
          tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        }
        
        // Draw the blurred image as the back cover
        ctx.drawImage(tempCanvas, leftCoverX, 0);
        
        // Add title and author to back cover
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 40px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        
        // Add a semi-transparent background for text readability
        const textBgY = canvas.height - 180;
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(leftCoverX, textBgY, trimWidthPixels + bleedPixels, 160);
        
        // Add title and author
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 40px Arial";
        ctx.fillText(title, leftCoverX + (trimWidthPixels + bleedPixels) / 2, textBgY + 40);
        
        ctx.font = "30px Arial";
        ctx.fillText(author, leftCoverX + (trimWidthPixels + bleedPixels) / 2, textBgY + 100);
        
        // Add trim guidelines if requested
        if (showGuides) {
          // Draw guides for front cover
          ctx.strokeStyle = "rgba(255, 0, 0, 0.6)";
          ctx.setLineDash([10, 10]);
          ctx.lineWidth = 2;
          ctx.strokeRect(
            rightCoverX + bleedPixels, 
            bleedPixels, 
            trimWidthPixels - bleedPixels * 2, 
            trimHeightPixels
          );
          
          // Draw guides for back cover
          ctx.strokeRect(
            leftCoverX + bleedPixels, 
            bleedPixels, 
            trimWidthPixels - bleedPixels * 2, 
            trimHeightPixels
          );
          
          // Draw spine guides
          ctx.strokeStyle = "rgba(0, 0, 255, 0.6)";
          ctx.strokeRect(spineX, 0, spineWidthPixels, canvas.height);
        }
        
        // Finalize and return the complete cover
        console.log("Full book cover created successfully");
        const finalImageUrl = canvas.toDataURL('image/png');
        
        resolve(finalImageUrl);
      } catch (error) {
        console.error("Error creating full cover:", error);
        reject(error);
      }
    } catch (error) {
      console.error("Error in createFullBookCover:", error);
      reject(error);
    }
  });
}

export async function generateBookCover({
  prompt,
  style = "realistic",
  width,
  height
}: GenerateBookCoverParams): Promise<string | null> {
  try {
    console.log("Generating book cover with prompt:", prompt);
    
    // Build the enhanced prompt with additional context
    let enhancedPrompt = `Print-ready book cover design: ${prompt}`;
    
    // Handle style
    if (style && style !== "realistic") {
      enhancedPrompt += `, ${style} style`;
    }
    
    console.log("Enhanced prompt for book cover:", enhancedPrompt);
    console.log("Dimensions:", width, "x", height);

    try {
      // For testing/development - check if we should use placeholder
      if (USE_PLACEHOLDERS) {
        console.log("Using placeholder for book cover by configuration");
        return getPlaceholderImage(prompt, 'bookcover', width, height);
      }
      
      // Create form data for the request
      const formData = new FormData();
      formData.append('prompt', enhancedPrompt);
      
      // Use aspect ratio for now since it's proven to work
      formData.append('aspect_ratio', '3:4'); // Use a portrait aspect ratio for book covers
      formData.append('rendering_speed', 'STANDARD'); // Higher quality
      
      if (style && style !== "realistic") {
        formData.append('style_type', style.toUpperCase());
      }

      formData.append('negative_prompt', 'text overlays, watermark, signature, blurry, low quality, distorted');

      // Log the form data entries for debugging
      console.log("Form data entries for book cover:");
      for (const [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
      }
      
      // Use the standard endpoint that we know works
      const fullUrl = `${API_URL}/api/ideogram/generate`;
      console.log("Making book cover generation request to:", fullUrl);

      // Make the API call
      const response = await fetch(fullUrl, {
        method: 'POST',
        body: formData
      });

      console.log("Book cover response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Raw error response:", errorText);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Book cover API response data:", data);

      if (!data.url) {
        console.error("Could not extract image URL from response:", data);
        throw new Error("Could not extract image URL from API response");
      }

      return data.url;
    } catch (error) {
      console.error("Error calling book cover API:", error);
      
      // Fallback to placeholder for demo/testing
      console.log("Using placeholder as fallback for book cover");
      return getPlaceholderImage(prompt, 'bookcover', width, height);
    }
  } catch (error) {
    console.error("Error in generateBookCover:", error);
    
    // Always return a placeholder in case of any errors
    console.log("Using placeholder in final catch block for book cover");
    return getPlaceholderImage(prompt, 'bookcover', width, height);
  }
} 

console.log('BookCoverGenerator rendered');
console.log('Download clicked');
console.log('Regenerate clicked');
console.log('Create Full Cover clicked'); 

/**
 * Interface for coloring book generation parameters
 */
export interface GenerateColoringBookParams {
  prompt: string;
  pageCount: number;
  trimSize: string;
  addBlankPages: boolean;
  showPageNumbers: boolean;
  includeBleed: boolean;
  bookTitle?: string;
}

/**
 * Generate a coloring page using the Ideogram API
 * This reuses the existing image generation functionality
 */
export async function generateColoringPage(prompt: string): Promise<string | null> {
  try {
    console.log("[generateColoringPage] Starting with prompt:", prompt);
    
    // For testing UI interactivity only - we want real images now
    if (USE_PLACEHOLDERS) {
      console.log("[generateColoringPage] Using placeholder by configuration");
      return getPlaceholderImage(prompt, 'coloring');
    }

    // Build an enhanced prompt specifically for coloring books
    const enhancedPrompt = `clean line drawing coloring page: ${prompt}, black and white outlines, no shading, no text, no watermarks, no signatures, suitable for coloring books, high contrast, clean vector style`;
    
    const negative_prompt = "color, shading, grayscale, text, words, watermark, signature, grainy, blurry, realistic, photorealistic, busy, cluttered";

    // Log the API URL being used for easy debugging
    console.log("[generateColoringPage] Using API URL:", API_URL);
    console.log("[generateColoringPage] Enhanced prompt:", enhancedPrompt);
    
    try {
      // Create form data for the request
      const formData = new FormData();
      formData.append('prompt', enhancedPrompt);
      formData.append('aspect_ratio', '3:4'); // Portrait mode for coloring books
      formData.append('negative_prompt', negative_prompt);
      formData.append('style', 'LINE_ART'); // Use LINE_ART style for coloring pages
      
      const endpoint = `${API_URL}/api/ideogram/generate`;
      console.log("[generateColoringPage] Making request to:", endpoint);

      // Add a timeout of 30 seconds for the API call
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          body: formData,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        console.log("[generateColoringPage] Response status:", response.status);
        
        if (!response.ok) {
          let errorMessage = `API error: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (parseError) {
            console.error("[generateColoringPage] Error parsing error response:", parseError);
          }
          throw new Error(errorMessage);
        }
        
        // Get the response as text first for better error logging
        const responseText = await response.text();
        
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error("[generateColoringPage] Error parsing JSON response:", parseError);
          console.log("[generateColoringPage] Raw response:", responseText.substring(0, 500));
          throw new Error("Could not parse API response");
        }
        
        console.log("[generateColoringPage] Response data:", data);
        
        if (!data.url) {
          console.error("[generateColoringPage] No image URL in response:", data);
          throw new Error("No image URL in API response");
        }
        
        console.log("[generateColoringPage] Successfully generated image:", data.url);
        return data.url;
      } catch (fetchError: unknown) {
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('API request timed out after 30 seconds');
        }
        throw fetchError;
      }
    } catch (error) {
      console.error("[generateColoringPage] Error:", error);
      
      // Try again with a more basic prompt
      try {
        console.log("[generateColoringPage] Retrying with simpler prompt");
        
        const simplePrompt = `coloring page: ${prompt}, line art style, black and white only`;
        
        const simpleFormData = new FormData();
        simpleFormData.append('prompt', simplePrompt);
        simpleFormData.append('aspect_ratio', '3:4');
        simpleFormData.append('negative_prompt', negative_prompt);
        
        const response = await fetch(`${API_URL}/api/ideogram/generate`, {
          method: 'POST',
          body: simpleFormData
        });
        
        if (!response.ok) {
          throw new Error(`Retry failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.url) {
          throw new Error("No image URL in retry response");
        }
        
        console.log("[generateColoringPage] Retry succeeded with URL:", data.url);
        return data.url;
      } catch (retryError) {
        console.error("[generateColoringPage] Retry failed:", retryError);
        
        // All attempts failed, use a placeholder
        console.log("[generateColoringPage] All attempts failed, using placeholder");
        return getPlaceholderImage(prompt, 'coloring');
      }
    }
  } catch (error) {
    console.error("[generateColoringPage] Unexpected error:", error);
    return getPlaceholderImage(prompt, 'coloring');
  }
}

/**
 * Generate a complete coloring book with multiple pages
 */
export async function generateColoringBook({
  prompt,
  pageCount,
  trimSize,
  addBlankPages,
  showPageNumbers,
  includeBleed,
  bookTitle
}: GenerateColoringBookParams): Promise<string[]> {
  try {
    const generatedPages: string[] = [];
    
    // Generate each page
    for (let i = 0; i < pageCount; i++) {
      // Add some randomization to the prompt for variety
      const pagePrompt = `${prompt} ${i % 2 === 0 ? 'variation' : 'design'} ${i+1}`;
      
      try {
        const pageUrl = await generateColoringPage(pagePrompt);
        if (pageUrl) {
          generatedPages.push(pageUrl);
        }
      } catch (pageError) {
        console.error(`Error generating page ${i+1}:`, pageError);
        // Continue with other pages
      }
      
      // For testing/demo, limit to 3 pages if we're using placeholders
      if (USE_PLACEHOLDERS && generatedPages.length >= 3) {
        break;
      }
    }
    
    return generatedPages;
  } catch (error) {
    console.error("Error generating coloring book:", error);
    throw error;
  }
}

/**
 * Create a PDF from generated coloring pages
 */
export async function createColoringBookPDF(
  pageUrls: string[],
  options: {
    trimSize: string;
    addBlankPages: boolean;
    showPageNumbers: boolean;
    includeBleed: boolean;
    bookTitle?: string;
    addTitlePage?: boolean;
    authorName?: string;
    subtitle?: string;
  }
): Promise<string> {
  try {
    console.log("Creating PDF with options:", options);
    console.log("Author name provided:", options.authorName);
    console.log("Number of pages:", pageUrls.length);
    console.log("Using API URL for PDF generation:", API_URL);
    
    // For client-side only implementation, return a mock PDF URL
    if (USE_PLACEHOLDERS || !API_URL) {
      toast.success("PDF would be generated on the server in production");
      return "https://placehold.co/600x400/f1f1f1/000000?text=Coloring+Book+PDF&font=playfair";
    }

    const toastId = toast.loading("Creating PDF. Opening in new tab...");

    try {
      // Add more explicit logging for debugging
      console.log("Title page enabled:", options.addTitlePage);
      console.log("Title:", options.bookTitle);
      console.log("Author:", options.authorName);
      console.log("Subtitle:", options.subtitle);
      
      // Direct method - open in new tab
      const encodedData = encodeURIComponent(JSON.stringify({
        pageUrls,
        ...options,
        // Ensure authorName is included even if it's empty string (different from undefined)
        authorName: options.authorName || '',
        subtitle: options.subtitle || ''
      }));
      
      // Open a new tab with the PDF URL
      window.open(
        `${API_URL}/api/coloring-book/create-pdf?data=${encodedData}`,
        '_blank'
      );
      
      toast.dismiss(toastId);
      toast.success("PDF opened in new tab");
      return "success";
    } catch (error) {
      console.error("Error creating PDF:", error);
      toast.dismiss(toastId);
      toast.error("Failed to create PDF. Please try again.");
      throw error;
    }
  } catch (error) {
    console.error("Error in createColoringBookPDF:", error);
    toast.error(`Failed to create PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

/**
 * Download all coloring pages as a ZIP file
 */
export async function downloadColoringPages(
  pageUrls: string[],
  bookTitle?: string
): Promise<void> {
  try {
    if (pageUrls.length === 0) {
      toast.error("No pages to download");
      return;
    }
    
    // Debug logging for API URL
    console.log("Using API URL for downloads:", API_URL);
    console.log("Image URLs to be downloaded:", pageUrls);
    
    // For single images, use the existing download function
    if (pageUrls.length === 1) {
      await downloadImage(pageUrls[0], 'png', 'coloring-page');
      return;
    }
    
    const toastId = toast.loading("Preparing to download images as ZIP...");
    
    try {
      // Preprocess the URLs to ensure they are accessible - add proxying if needed
      const processedUrls = pageUrls.map(url => {
        // If it's an Ideogram URL, make sure it goes through our proxy
        if (url.includes('ideogram.ai')) {
          return `${API_URL}/api/ideogram/proxy-image?url=${encodeURIComponent(url)}`;
        }
        // If it's already a placeholder, return as is
        if (url.includes('placehold.co')) {
          return url;
        }
        // Otherwise return the original URL with a timestamp to prevent caching issues
        return `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
      });
      
      console.log("Processed URLs for download:", processedUrls);
      
      // Encode the data as a query parameter
      const encodedData = encodeURIComponent(JSON.stringify({
        pageUrls: processedUrls, 
        bookTitle: bookTitle || 'coloring-pages',
        highQuality: true // Request high quality images
      }));
      
      // Create a direct download link
      const downloadUrl = `${API_URL}/api/coloring-book/download-zip?data=${encodedData}`;
      console.log("ZIP download URL:", downloadUrl);
      
      // Create a link element and trigger a download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${bookTitle || 'coloring-pages'}.zip`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
      
      toast.dismiss(toastId);
      toast.success("ZIP download started");
    } catch (error) {
      console.error("Download failed:", error);
      toast.dismiss(toastId);
      toast.error("Failed to download ZIP file. Please try again later.");
    }
  } catch (error) {
    console.error("Error downloading coloring pages:", error);
    toast.error("Failed to download pages");
  }
}

export async function expandPrompts(basePrompt: string, pageCount: number): Promise<string[]> {
  try {
    console.log(`Expanding prompt: ${basePrompt} into ${pageCount} variations`);
    
    // For testing/development, use placeholders if configured
    if (USE_PLACEHOLDERS) {
      console.log("Using placeholder prompts");
      const placeholderPrompts = [];
      for (let i = 0; i < pageCount; i++) {
        placeholderPrompts.push(`${basePrompt} - variation ${i + 1}`);
      }
      return placeholderPrompts;
    }
    
    const response = await fetch(`${API_URL}/api/coloring-book/expand-prompts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        basePrompt,
        pageCount
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error expanding prompts:", errorData);
      throw new Error(errorData.error || `API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Expanded prompts:", data);
    
    if (!data.promptVariations || !Array.isArray(data.promptVariations)) {
      console.error("Invalid response format:", data);
      throw new Error("Invalid response format from prompt expansion API");
    }
    
    return data.promptVariations;
  } catch (error) {
    console.error("Error in expandPrompts:", error);
    // Return basic variations as fallback
    const fallbackPrompts = [];
    for (let i = 0; i < pageCount; i++) {
      fallbackPrompts.push(`${basePrompt} - variation ${i + 1}`);
    }
    return fallbackPrompts;
  }
}

// Force any ideogram.ai URL through our proxy
export function forceProxyForIdeogramUrl(url: string): string {
  // Basic validation to prevent errors
  if (!url || typeof url !== 'string') {
    console.error("Invalid URL provided to proxy", url);
    return url || '';
  }
  
  try {
    // If it's already a data URL or blob URL, return as is
    if (url.startsWith('data:') || url.startsWith('blob:')) {
      return url;
    }
    
    // If it's an ideogram.ai URL, proxy it
    if (url.includes('ideogram.ai')) {
      return `${API_URL}/api/ideogram/proxy-image?url=${encodeURIComponent(url)}`;
    }
    
    // Otherwise return the original URL
    return url;
  } catch (error) {
    console.error("Error in proxy function:", error);
    return url;
  }
} 