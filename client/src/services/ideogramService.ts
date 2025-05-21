import { toast } from "sonner";
import type { DesignHistoryItem } from "@/services/designHistory";

// Configuration
// Use current domain in development, Railway URL in production
export const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://puzzlemakeribral-production.up.railway.app'
  : window.location.origin;

// Allow real API calls to the backend
export const USE_PLACEHOLDERS = false;
export const PLACEHOLDER_IMAGE_URL = 'https://placehold.co/512x512/f1f1f1/000000?text=Coloring+Page+Placeholder&font=playfair';

// Debug logging for API URL
console.log('API_URL:', API_URL);
console.log('Current environment:', process.env.NODE_ENV || 'not set');
console.log('Window location origin:', window.location.origin);
console.log('Using placeholders for development:', USE_PLACEHOLDERS);

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
      // Send real API request
        const imageUrl = await generateWithProxy(enhancedPrompt, style);
      console.log("Successfully generated image:", imageUrl);
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
      body: formData, // Send the FormData object directly
      mode: 'cors', // Enable CORS
      headers: {
        'Accept': 'application/json',
      }
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
    // Add a delay to simulate API call
      setTimeout(() => {
        resolve(placeholderUrl);
    }, 1500);
  });
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
    if (USE_PLACEHOLDERS) {
      toast.success(`Design downloaded as ${format.toUpperCase()}`);
      
      // Create a link to download the image
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `${filename}.${format.toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    
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
      const toastId = toast.loading("Processing download...");
      
      // Use our own backend proxy endpoint
      const proxyEndpoint = `${API_URL}/api/ideogram/proxy-image`;
      const encodedUrl = encodeURIComponent(imageUrl);
      
      // Direct download approach - create a link to our backend proxy
      const downloadUrl = `${proxyEndpoint}?url=${encodedUrl}&filename=${encodeURIComponent(filename)}.${format.toLowerCase()}`;
      
      // Open the download in a new window to trigger the download
      window.open(downloadUrl, '_blank');
      
      // Dismiss the toast after a short delay to ensure window.open has processed
      setTimeout(() => {
        toast.dismiss(toastId);
        toast.success(`Design download initiated`);
      }, 1000);
    } catch (error) {
      console.error("Error downloading image:", error);
      // Dismiss any existing download toasts to prevent stuck notifications
      toast.dismiss();
      toast.error("Failed to download image. Please try again.");
    }
  } catch (error) {
    console.error("Error downloading image:", error);
    // Dismiss any existing download toasts to prevent stuck notifications
    toast.dismiss();
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
    
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
    
    // Get response as a blob
    const blob = await response.blob();
    console.log("Response blob size:", blob.size, "bytes");
    
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
export { getDesignHistory, saveToHistory, deleteFromHistory, saveToFavorites } from "@/services/designHistory";

export async function imageToPrompt(imageFile: File, type: 'tshirt' | 'coloring' = 'tshirt'): Promise<string> {
  // If we're using placeholders, return mock data
  if (USE_PLACEHOLDERS) {
    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Return a mock prompt based on the filename
    const filename = imageFile.name.toLowerCase();
    
    if (filename.includes('cat') || filename.includes('kitten')) {
      return "A cute cartoon cat with sunglasses and a bowtie, minimalist style with pastel colors";
    } else if (filename.includes('dog') || filename.includes('puppy')) {
      return "Playful cartoon dog with a tennis ball, bright vibrant colors, simple background";
    } else if (filename.includes('mountain') || filename.includes('nature')) {
      return "Abstract geometric mountain landscape at sunset, minimalist design with purple and orange gradients";
    } else {
      return "Creative t-shirt design with abstract patterns in blue and teal colors, modern minimalist style";
    }
  }
  
  try {
    console.log("Starting image-to-prompt analysis for file:", imageFile.name);
    
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('type', type);

    console.log("Making API request to analyze image:", `${API_URL}/api/ideogram/analyze`);

    const response = await fetch(`${API_URL}/api/ideogram/analyze`, {
      method: 'POST',
      body: formData,
      mode: 'cors'
    });

    console.log("Response status from analyze API:", response.status);

    if (!response.ok) {
      let errorMessage = `API error: ${response.status}`;
      try {
      const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // If JSON parsing fails, try to get text
        const errorText = await response.text();
        if (errorText) errorMessage = errorText;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("Received prompt from API:", data.prompt);
    return data.prompt;
  } catch (error) {
    console.error("Error analyzing image:", error);
    toast.error("Failed to analyze image. Generating generic prompt instead.");
    
    // Return a generic prompt based on the type
    if (type === 'coloring') {
      return "A cute cartoon scene with animals in a forest setting, perfect for a children's coloring book";
    } else {
      return "A creative t-shirt design featuring a modern abstract pattern with vibrant colors suitable for streetwear";
    }
  }
}

// Simplified background removal model - just one model now with PhotoRoom
export const backgroundRemovalModels = {
  "photoroom": {
    id: "photoroom",
    name: "PhotoRoom Background Removal"
  }
};

// Simplified getBackgroundRemovalModels function - returns just the PhotoRoom model
export async function getBackgroundRemovalModels(): Promise<{id: string, name: string}[]> {
  // Return only the PhotoRoom model
  return Object.values(backgroundRemovalModels);
}

// Updated removeBackground function that doesn't need modelId parameter
export async function removeBackground(imageUrl: string): Promise<string> {
  try {
    console.log("========== BACKGROUND REMOVAL DEBUG ==========");
    console.log("Starting background removal for image:", imageUrl.substring(0, 100) + "...");
    console.log("Current API_URL:", API_URL);
    console.log("Using PhotoRoom API for background removal");
    
    // Create a toast to indicate processing is in progress
    const toastId = toast.loading("Removing background...");
    
    try {
      let imageBlob: Blob;
      
      // Process the image while preserving as much of the original quality as possible
      try {
        console.log("Preparing image for processing...");
        // Match enhancement scale - use 1200 for standard and 2400 for enhanced images
        // This is higher than before (800) to preserve enhanced image quality
        imageBlob = await resizeImageForVectorization(imageUrl, 2400); // Much higher max width to preserve enhanced quality
        console.log(`Image prepared for processing, size: ${Math.round(imageBlob.size / 1024)} KB`);
      } catch (resizeError) {
        console.error("Error resizing image:", resizeError);
        
        // Fallback to direct fetch if resizing fails
        console.log("Falling back to direct image fetch...");
        if (imageUrl.startsWith('data:')) {
          // Convert data URL to blob
          const response = await fetch(imageUrl);
          imageBlob = await response.blob();
        } else {
          // For regular URLs, proxy through our backend to avoid CORS issues
          const proxyUrl = `${API_URL}/api/ideogram/proxy-image?url=${encodeURIComponent(imageUrl)}`;
          const response = await fetch(proxyUrl);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`);
          }
          
          imageBlob = await response.blob();
        }
      }
      
      // Increase max size limit to accommodate enhanced images (from 5MB to 20MB)
      const MAX_SIZE = 20 * 1024 * 1024;
      if (imageBlob.size > MAX_SIZE) {
        toast.dismiss(toastId);
        toast.error(`Image is too large (${Math.round(imageBlob.size / 1024 / 1024)}MB). Maximum size is 20MB.`);
        throw new Error(`Image is too large (${Math.round(imageBlob.size / 1024 / 1024)}MB). Maximum size is 20MB.`);
      }
      
      // Now send the image to our backend background removal endpoint
      const formData = new FormData();
      formData.append('image', imageBlob, 'image.png');
      
      // Add flag to indicate this is a high-resolution image that should maintain quality
      formData.append('preserveQuality', 'true');
      
      console.log("Submitting image to background removal service");
      
      // Use the background removal endpoint
      const bgRemovalEndpoint = `${API_URL}/api/vectorize/remove-background`;
      
      console.log("Background removal endpoint URL:", bgRemovalEndpoint);
      console.log("Form data contents:");
      for (const pair of formData.entries()) {
        console.log(`- ${pair[0]}: ${pair[1] instanceof File ? `File (${pair[1].size} bytes)` : pair[1]}`);
      }
      
      console.log("Making fetch request to background removal endpoint...");
      const response = await fetch(bgRemovalEndpoint, {
        method: 'POST',
        body: formData,
        mode: 'cors',
        // Add more detailed error handling
        headers: {
          'Accept': 'application/json',
        }
      });
      
      console.log("Background removal response received. Status code:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Background removal API error: ${response.status}`, errorText);
        console.error("Request details:", {
          endpoint: bgRemovalEndpoint,
          imageSize: imageBlob.size
        });
        
        let errorMessage = "Failed to remove background";
        try {
          // Try to parse error as JSON
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
          console.error("Parsed error data:", errorData);
        } catch {
          // If can't parse JSON, use raw text
          if (errorText) {
            errorMessage = errorText;
            console.error("Raw error text:", errorText);
          }
        }
        
        if (response.status === 413) {
          errorMessage = "Image is too large. Please try a smaller image or reduce the design complexity.";
        } else if (response.status === 504 || response.status === 502) {
          errorMessage = "Process timed out. The image may be too complex or the server is overloaded.";
        }
        
        toast.dismiss(toastId);
        toast.error(errorMessage);
        throw new Error(`${errorMessage} (Status: ${response.status})`);
      }
      
      console.log("Parsing response...");
      const data = await response.json();
      console.log("Response data:", data);
      
      if (!data.imageUrl) {
        console.error("No image URL found in response data:", data);
        throw new Error("No image URL found in response");
      }
      
      console.log("Background removal successful");
      
      // Preview the image immediately before saving it
      // This ensures the user can see the result with transparency
      const imgPreview = document.createElement('img');
      imgPreview.src = data.imageUrl;
      imgPreview.style.display = 'none';
      document.body.appendChild(imgPreview);
      console.log("Image preview element created");
      
      // Make sure image loads before we show it to ensure transparency is visible
      await new Promise((resolve) => {
        imgPreview.onload = () => {
          console.log("Image loaded successfully");
          document.body.removeChild(imgPreview);
          resolve(true);
        };
        imgPreview.onerror = (e) => {
          console.error("Error loading image preview:", e);
          document.body.removeChild(imgPreview);
          resolve(false);
        };
        
        // Timeout just in case
        setTimeout(() => {
          if (document.body.contains(imgPreview)) {
            console.warn("Preview load timed out");
            document.body.removeChild(imgPreview);
          }
          resolve(false);
        }, 3000);
      });
      
      // Dismiss the toast and show success
      toast.dismiss(toastId);
      toast.success("Background removed successfully!", {
        duration: 4000,
        description: "Using PhotoRoom background removal"
      });
      
      console.log("========== BACKGROUND REMOVAL COMPLETE ==========");
      return data.imageUrl;
    } catch (fetchError: any) {
      // Clean up the timeout if there was an error
      console.error("Error in background removal process:", fetchError);
      toast.dismiss(toastId);
      
      // If we haven't already shown an error toast
      if (fetchError instanceof Error && 
          !fetchError.message.includes("too large") && 
          !fetchError.message.includes("timed out")) {
        toast.error(`Failed to remove background: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
      }
      
      console.log("========== BACKGROUND REMOVAL FAILED ==========");
      throw fetchError;
    }
  } catch (error) {
    console.error("Error in removeBackground:", error);
    throw error;
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
  let attempts = 0;
  const maxAttempts = 3;
  const delayBetweenRetries = 2000; // 2 seconds
  
  // Verify we have a valid prompt
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    console.error('Invalid prompt provided:', prompt);
    return null;
  }
  
  // Pass the full, rich prompt through - don't strip away details
  // Only do minimal cleaning to ensure it works well with Ideogram
  const finalPrompt = prompt.trim();
  
  console.log(`Generating coloring page with prompt: "${finalPrompt}"`);
  
  while (attempts < maxAttempts) {
    attempts++;
    console.log(`Attempt ${attempts}/${maxAttempts}`);
    
    try {
      // For testing/development, return placeholder if configured
      if (USE_PLACEHOLDERS) {
        console.log('Using placeholder image');
        return PLACEHOLDER_IMAGE_URL;
      }

      // Create a very simple FormData with minimal parameters to match what the backend expects
      const formData = new FormData();
      
      // Add the most essential parameters only
      formData.append('prompt', `Coloring book page with clean line art, white background, black outlines: ${finalPrompt}`);
      formData.append('negative_prompt', 'color, shading, watermark, text, grayscale');
      
      console.log(`Sending request to ${API_URL}/api/ideogram/generate`);
      console.log('Using prompt:', finalPrompt);
      
      // Add detailed error logging
      try {
        const response = await fetch(`${API_URL}/api/ideogram/generate`, {
          method: 'POST',
          body: formData
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        // Get the raw response text for debugging
        const responseText = await response.text();
        console.log('Response preview:', responseText.substring(0, 200));
        
        // Try to parse the JSON
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse response as JSON:', parseError);
          throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
        }
        
        // Handle error response
        if (!response.ok) {
          console.error('API error response:', data);
          if (attempts < maxAttempts) {
            console.log(`Retrying after ${delayBetweenRetries}ms...`);
            await new Promise(resolve => setTimeout(resolve, delayBetweenRetries));
            continue;
          }
          throw new Error(data.error || `API error: ${response.status}`);
        }
        
        console.log('Image generation successful:', data);
        
        // Check for URL in multiple possible locations in the response
        const imageUrl = data.url || (data.data && data.data[0] && data.data[0].url) || 
                        (data.images && data.images[0] && data.images[0].url);
        
        if (!imageUrl) {
          console.error('No image URL found in response:', data);
          if (attempts < maxAttempts) {
            console.log(`Retrying after ${delayBetweenRetries}ms...`);
            await new Promise(resolve => setTimeout(resolve, delayBetweenRetries));
            continue;
          }
          throw new Error('No image URL found in response');
        }
        
        return imageUrl;
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        if (attempts < maxAttempts) {
          console.log(`Retrying after ${delayBetweenRetries}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayBetweenRetries));
          continue;
        }
        throw fetchError;
      }
    } catch (error) {
      console.error(`Error in attempt ${attempts}/${maxAttempts}:`, error);
      
      if (attempts < maxAttempts) {
        console.log(`Retrying after ${delayBetweenRetries}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayBetweenRetries));
        continue;
      }
      
      throw error;
    }
  }
  
  console.error(`Failed after ${maxAttempts} attempts`);
  // If all attempts fail, use a placeholder
  toast.error("Failed to generate image. Using placeholder instead.");
  return PLACEHOLDER_IMAGE_URL;
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
  // Validate parameters
  if (!prompt) {
    throw new Error('Prompt is required');
  }
  
  if (pageCount < 1 || pageCount > 50) {
    throw new Error('Page count must be between 1 and 50');
  }
  
  console.log(`Generating ${pageCount}-page coloring book with base prompt: "${prompt}"`);
  console.log(`Settings: trimSize=${trimSize}, addBlankPages=${addBlankPages}, showPageNumbers=${showPageNumbers}`);
  
  try {
    // Generate multiple variations of the prompt using our improved expansion
    const promptVariations = await expandPrompts(prompt, pageCount);
    console.log(`Generated ${promptVariations.length} prompt variations`);
    
    if (promptVariations.length === 0) {
      throw new Error('Failed to generate prompt variations');
    }
    
    // Display expanded prompts (for debugging and transparency)
    console.log("Full prompt variations:", promptVariations);
    
    // Generate each coloring page from the prompt variations
    const results: string[] = [];
    let current = 0;
    const total = promptVariations.length;
    
    // Generate pages in series to maintain consistency and avoid rate limiting
    for (const variationPrompt of promptVariations) {
      current++;
      console.log(`Generating page ${current}/${total}`);
      console.log(`Using prompt: "${variationPrompt}"`);
      
      try {
        // Generate the coloring page
        const imageUrl = await generateColoringPage(variationPrompt);
        
        if (!imageUrl) {
          console.error(`Failed to generate image for prompt: "${variationPrompt}"`);
          // Add a placeholder or dummy image if we couldn't generate one
          if (USE_PLACEHOLDERS) {
            results.push(PLACEHOLDER_IMAGE_URL);
          }
          continue;
        }
        
        // Add the successfully generated image
        results.push(imageUrl);
        console.log(`Successfully generated page ${current}/${total}`);
      } catch (error) {
        console.error(`Error generating page ${current}/${total}:`, error);
        // Add a placeholder for failed generations to maintain page count
        if (USE_PLACEHOLDERS) {
          results.push(PLACEHOLDER_IMAGE_URL);
        }
      }
    }
    
    // Add blank pages if requested (to make the page count a multiple of 4 for printing)
    if (addBlankPages) {
      const remainder = results.length % 4;
      if (remainder > 0) {
        const blankPagesToAdd = 4 - remainder;
        console.log(`Adding ${blankPagesToAdd} blank pages to make total a multiple of 4`);
        
        for (let i = 0; i < blankPagesToAdd; i++) {
          results.push('blank');
        }
      }
    }
    
    console.log(`Generated ${results.length} total pages (${results.filter(url => url !== 'blank').length} content pages)`);
    return results;
  } catch (error) {
    console.error('Error generating coloring book:', error);
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
    // Validate pageCount (ensure it's at least 1)
    if (!pageCount || pageCount < 1) {
      console.warn(`Invalid pageCount provided: ${pageCount}, defaulting to 1`);
      pageCount = 1;
    }
    
    console.log(`======== EXPAND PROMPTS ========`);
    console.log(`Expanding prompt: "${basePrompt}" into ${pageCount} variations`);
    console.log(`API URL: ${API_URL}`);
    
    // For testing/development, use placeholders if configured
    if (USE_PLACEHOLDERS) {
      console.log("Using placeholder prompts");
      const placeholderPrompts = [];
      for (let i = 0; i < pageCount; i++) {
        placeholderPrompts.push(`${basePrompt} - variation ${i + 1}`);
      }
      return placeholderPrompts;
    }
    
    // Minimal cleaning of the base prompt - only remove common prefixes at the beginning
    // This preserves the full structure and detail of the original prompt
    let cleanedPrompt = basePrompt.trim();
    const prefixesToRemove = [
      'This image is suitable for a coloring book:',
      'Prompt for a Coloring Book Page:',
      'Create a coloring book page with',
      'Create a coloring book image of'
    ];
    
    // Only remove prefixes at the beginning
    for (const prefix of prefixesToRemove) {
      if (cleanedPrompt.toLowerCase().startsWith(prefix.toLowerCase())) {
        cleanedPrompt = cleanedPrompt.substring(prefix.length).trim();
        break; // Only remove one prefix
      }
    }
    
    console.log(`Cleaned prompt for API: "${cleanedPrompt}"`);
    console.log(`Making API request to ${API_URL}/api/coloring-book/expand-prompts`);
    console.log(`Request body: ${JSON.stringify({ basePrompt: cleanedPrompt, pageCount })}`);
    
    const response = await fetch(`${API_URL}/api/coloring-book/expand-prompts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        basePrompt: cleanedPrompt,
        pageCount
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response from expand-prompts API:", errorText);
      try {
        const errorData = JSON.parse(errorText);
        console.error("Parsed error data:", errorData);
        throw new Error(errorData.error || `API error: ${response.status}`);
      } catch (parseError) {
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
    }
    
    const data = await response.json();
    console.log("API response for prompt expansion:", data);
    
    if (!data.promptVariations || !Array.isArray(data.promptVariations)) {
      console.error("Invalid response format:", data);
      throw new Error("Invalid response format from prompt expansion API");
    }
    
    // Check if we actually got variations
    if (data.promptVariations.length === 0) {
      console.error("API returned empty variations array");
      throw new Error("API returned empty variations array");
    }
    
    // Minimal processing to ensure formatting is consistent
    // We want to preserve the rich detail and structure from the backend
    const processedPrompts = data.promptVariations.map((prompt: string, index: number) => {
      if (!prompt || typeof prompt !== 'string') {
        console.warn(`Invalid prompt at index ${index}:`, prompt);
        return cleanedPrompt; // Fallback to cleaned base prompt
      }
      
      let processedPrompt = prompt.trim();
      
      // Log each prompt for debugging/visualization
      console.log(`Prompt ${index + 1}: "${processedPrompt}"`);
      return processedPrompt;
    }).filter(Boolean);
    
    console.log(`Successfully generated ${processedPrompts.length} variations`);
    console.log(`======== END EXPAND PROMPTS ========`);
    
    return processedPrompts;
  } catch (error) {
    console.error("Error in expandPrompts:", error);
    
    // Show a detailed error to help troubleshoot
    toast.error(`Failed to generate prompt variations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
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

/**
 * Get available image enhancement models
 * @returns Object with model information
 */
export async function getEnhancementModels(): Promise<{ models: Record<string, any>, defaultModel: string }> {
  try {
    const response = await fetch(`${API_URL}/api/image-enhancement/models`, {
      method: 'GET',
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch enhancement models: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      models: data.models || {},
      defaultModel: data.defaultModel || 'text-upscaler'
    };
  } catch (error) {
    console.error("Error fetching enhancement models:", error);
    return {
      models: {
        'text-upscaler': {
          name: 'Text Upscaler',
          description: 'Specialized for text clarity',
          model: 'text-upscaler'
        }
      },
      defaultModel: 'text-upscaler'
    };
  }
}

/**
 * Enhance image quality using selected upscaler model
 * @param imageUrl URL of the image to enhance
 * @param model Optional model ID to use for enhancement
 * @returns URL to the enhanced image
 */
export async function enhanceImage(imageUrl: string, model?: string): Promise<string> {
  try {
    console.log("========== IMAGE ENHANCEMENT DEBUG ==========");
    console.log("Starting image enhancement for:", imageUrl.substring(0, 100) + "...");
    console.log("Current API_URL:", API_URL);
    console.log("Selected model:", model || "default");
    
    // Create a toast to indicate processing is in progress
    const toastId = toast.loading("Enhancing image quality...");
    
    try {
      let imageBlob: Blob;
      
      // Resize the image for faster processing if needed
      try {
        console.log("Preparing image for enhancement...");
        // For enhancement, we want to keep a larger size for better results
        imageBlob = await resizeImageForVectorization(imageUrl, 1200); 
        console.log(`Image prepared for enhancement, size: ${Math.round(imageBlob.size / 1024)} KB`);
      } catch (resizeError) {
        console.error("Error preparing image:", resizeError);
        
        // Fallback to direct fetch if resizing fails
        console.log("Falling back to direct image fetch...");
        if (imageUrl.startsWith('data:')) {
          // Convert data URL to blob
          const response = await fetch(imageUrl);
          imageBlob = await response.blob();
        } else {
          // For regular URLs, proxy through our backend to avoid CORS issues
          const proxyUrl = `${API_URL}/api/ideogram/proxy-image?url=${encodeURIComponent(imageUrl)}`;
          const response = await fetch(proxyUrl);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`);
          }
          
          imageBlob = await response.blob();
        }
      }
      
      // Check if image is too large (> 10MB) for enhancement
      const MAX_SIZE = 10 * 1024 * 1024;
      if (imageBlob.size > MAX_SIZE) {
        toast.dismiss(toastId);
        toast.error(`Image is too large (${Math.round(imageBlob.size / 1024 / 1024)}MB). Maximum size is 10MB.`);
        throw new Error(`Image is too large (${Math.round(imageBlob.size / 1024 / 1024)}MB). Maximum size is 10MB.`);
      }
      
      // Now send the image to our backend enhancement endpoint
      const formData = new FormData();
      formData.append('image', imageBlob, 'image.png');
      
      // Add optional parameters
      formData.append('scale', '4'); // Default to 4x upscaling for better balance between quality and performance
      
      // Add model selection if provided
      if (model) {
        formData.append('model', model);
      }
      
      console.log("Submitting image to enhancement service");
      
      // Use the new enhancement endpoint
      const enhancementEndpoint = `${API_URL}/api/image-enhancement/enhance`;
      
      console.log("Enhancement endpoint URL:", enhancementEndpoint);
      console.log("Form data contents:");
      for (const pair of formData.entries()) {
        console.log(`- ${pair[0]}: ${pair[1] instanceof File ? `File (${pair[1].size} bytes)` : pair[1]}`);
      }
      
      console.log("Making fetch request to enhancement endpoint...");
      const response = await fetch(enhancementEndpoint, {
        method: 'POST',
        body: formData,
        mode: 'cors'
      });
      
      console.log("Enhancement request initiated. Status code:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Enhancement API error: ${response.status}`, errorText);
        
        let errorMessage = "Failed to enhance image";
        try {
          // Try to parse error as JSON
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
          console.error("Parsed error data:", errorData);
        } catch {
          // If can't parse JSON, use raw text
          if (errorText) {
            errorMessage = errorText;
            console.error("Raw error text:", errorText);
          }
        }
        
        if (response.status === 413) {
          errorMessage = "Image is too large. Please try a smaller image.";
        } else if (response.status === 504 || response.status === 502) {
          errorMessage = "Process timed out. The image may be too complex or the server is overloaded.";
        }
        
        toast.dismiss(toastId);
        toast.error(errorMessage);
        throw new Error(`${errorMessage} (Status: ${response.status})`);
      }
      
      console.log("Parsing initial response...");
      const initialData = await response.json();
      console.log("Initial response data:", initialData);
      
      if (!initialData.predictionId) {
        console.error("No prediction ID found in response:", initialData);
        throw new Error("No prediction ID found in response");
      }
      
      // Now we need to poll for completion
      const predictionId = initialData.predictionId;
      const statusEndpoint = initialData.statusEndpoint || `/api/image-enhancement/status/${predictionId}`;
      
      console.log(`Enhancement job initiated with prediction ID: ${predictionId}`);
      console.log(`Will check status at: ${statusEndpoint}`);
      
      // Update toast to indicate we're now processing
      toast.dismiss(toastId);
      let processingToastId = toast.loading("Processing image enhancement...", {
        duration: Infinity,
        description: "This may take up to 60 seconds for high-quality results."
      });
      
      // Poll for completion
      let isComplete = false;
      let enhancedImageUrl = "";
      let attempts = 0;
      const maxAttempts = 30;
      let pollInterval = 2000; // Start with 2 seconds, will increase with backoff
      
      while (!isComplete && attempts < maxAttempts) {
        attempts++;
        
        try {
          console.log(`Checking enhancement status (attempt ${attempts}/${maxAttempts})...`);
          const statusResponse = await fetch(`${API_URL}${statusEndpoint}`);
          
          if (!statusResponse.ok) {
            console.error(`Status check failed:`, statusResponse.status);
            if (attempts >= maxAttempts) {
              throw new Error(`Failed to check enhancement status: ${statusResponse.status}`);
            }
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, pollInterval));
            // Increase poll interval with backoff
            pollInterval = Math.min(pollInterval * 1.5, 10000);
            continue;
          }
          
          const statusData = await statusResponse.json();
          console.log(`Status check result:`, statusData);
          
          if (statusData.status === 'completed') {
            isComplete = true;
            enhancedImageUrl = statusData.imageUrl;
            console.log(`Enhancement completed with URL: ${enhancedImageUrl}`);
            break;
          } else if (statusData.status === 'failed') {
            throw new Error(`Enhancement failed: ${statusData.error || 'Unknown error'}`);
          }
          
          // If still processing, wait before checking again
          console.log(`Still processing (${statusData.status}), waiting ${pollInterval}ms before next check...`);
          // Update toast with progress if available
          if (statusData.progress) {
            toast.dismiss(processingToastId);
            const progress = Math.round(statusData.progress * 100);
            processingToastId = toast.loading(`Enhancing image: ${progress}% complete`, {
              duration: Infinity,
              description: "Please wait while we enhance your image."
            });
          }
          
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          
          // Increase poll interval with backoff
          pollInterval = Math.min(pollInterval * 1.5, 10000);
        } catch (pollError) {
          console.error(`Error polling for status:`, pollError);
          if (attempts >= maxAttempts) {
            throw pollError;
          }
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          // Increase poll interval with backoff
          pollInterval = Math.min(pollInterval * 1.5, 10000);
        }
      }
      
      if (!isComplete || !enhancedImageUrl) {
        toast.dismiss(processingToastId);
        toast.error("Enhancement timed out. Please try again with a smaller image.");
        throw new Error("Enhancement timed out after maximum attempts");
      }
      
      // Dismiss the toast and show success
      toast.dismiss(processingToastId);
      toast.success("Image enhanced successfully!", {
        duration: 4000,
        description: "Image quality has been significantly improved."
      });
      
      console.log("========== IMAGE ENHANCEMENT COMPLETE ==========");
      return enhancedImageUrl;
    } catch (fetchError: any) {
      // Clean up any toast if there was an error
      toast.dismiss();
      
      // Show an error toast if one hasn't been shown already
      if (fetchError instanceof Error && 
          !fetchError.message.includes("too large") && 
          !fetchError.message.includes("timed out")) {
        toast.error(`Failed to enhance image: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
      }
      
      console.log("========== IMAGE ENHANCEMENT FAILED ==========");
      throw fetchError;
    }
  } catch (error) {
    console.error("Error in enhanceImage:", error);
    throw error;
  }
}

/**
 * Resizes an image for vectorization or enhancement operations
 * @param imageUrl URL of the image to resize
 * @param maxWidth Maximum width of the resized image
 * @returns Blob of the resized image
 */
async function resizeImageForVectorization(imageUrl: string, maxWidth: number = 1200): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    try {
      // Create an image element to load the source
      const img = new Image();
      img.crossOrigin = 'anonymous';

      // Set up a timeout in case image loading takes too long
      const timeoutId = setTimeout(() => {
        console.warn('Image loading timed out during resize');
        reject(new Error('Image loading timed out'));
      }, 15000);

      img.onload = () => {
        clearTimeout(timeoutId);
        
        try {
          // Determine new dimensions while maintaining aspect ratio
          let newWidth = img.width;
          let newHeight = img.height;
          
          if (img.width > maxWidth) {
            newWidth = maxWidth;
            newHeight = (img.height * maxWidth) / img.width;
          }
          
          // Create a canvas to resize the image
          const canvas = document.createElement('canvas');
          canvas.width = newWidth;
          canvas.height = newHeight;
          
          // Draw the image to the canvas with resizing
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          // Draw the image with high quality settings
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, newWidth, newHeight);
          
          // Convert to blob with high quality
          canvas.toBlob(
            (blob) => {
              if (blob) {
                console.log(`Image resized from ${img.width}x${img.height} to ${newWidth}x${newHeight}`);
                resolve(blob);
              } else {
                reject(new Error('Failed to convert canvas to blob'));
              }
            },
            'image/png',
            0.95 // High quality
          );
        } catch (error) {
          reject(error);
        }
      };

      // Handle image loading error
      img.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error('Failed to load image for resizing'));
      };

      // Set the source to start loading the image
      if (imageUrl.startsWith('data:')) {
        // Data URL can be used directly
        img.src = imageUrl;
      } else {
        // Use the proxy to load images from other domains
        const proxiedUrl = forceProxyForIdeogramUrl(imageUrl);
        img.src = proxiedUrl;
      }
    } catch (error) {
      reject(error);
    }
  });
} 