import { toast } from "sonner";
import type { DesignHistoryItem } from "@/services/designHistory";

// API base URL - ensure it's always the production URL when deployed
const API_URL = 'https://puzzlemakeribral-production.up.railway.app';

// For development/debugging - set to true to use placeholder images instead of real API
const USE_PLACEHOLDERS = true; // Set to true if you want to test with placeholders

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
function getPlaceholderImage(prompt: string, type: 'tshirt' | 'bookcover' = 'tshirt', width = 1024, height = 1365): Promise<string> {
  const words = prompt.split(' ').slice(0, 5).join('-');
  const bgColor = getColorForStyle(prompt);
  const fgColor = "FFFFFF";
  
  // Different text based on type
  const typeText = type === 'bookcover' ? 'Book Cover: ' : 'T-Shirt: ';
  
  // Use the provided dimensions if it's a book cover
  const dimensions = type === 'bookcover' ? `${width}x${height}` : '1024x1365';
  
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

export async function imageToPrompt(imageFile: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);

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
    // Return a mock prompt for now
    return "A creative t-shirt design featuring a modern abstract pattern with vibrant colors suitable for streetwear";
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

export async function generateBookCover({
  prompt,
  style = "realistic",
  width,
  height
}: GenerateBookCoverParams): Promise<string | null> {
  try {
    console.log("Generating book cover with prompt:", prompt);
    
    // For testing UI interactivity
    if (USE_PLACEHOLDERS) {
      console.log("Using placeholder by configuration");
      return getPlaceholderImage(prompt, 'bookcover', width, height);
    }

    // Build the enhanced prompt with additional context
    let enhancedPrompt = `Print-ready book cover design: ${prompt}`;
    
    // Handle style
    if (style && style !== "realistic") {
      enhancedPrompt += `, ${style} style`;
    }
    
    console.log("Enhanced prompt for book cover:", enhancedPrompt);
    console.log("Dimensions:", width, "x", height);

    try {
      // Create form data for the request
      const formData = new FormData();
      formData.append('prompt', enhancedPrompt);
      // Note: We're using the standard generate endpoint which doesn't support custom dimensions
      // So we'll use a predefined aspect ratio instead
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
      
      // Use the known working endpoint instead of the custom one
      const fullUrl = `${API_URL}/api/ideogram/generate`;
      console.log("Making book cover generation request to:", fullUrl);

      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        const response = await fetch(fullUrl, {
          method: 'POST',
          body: formData,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        console.log("Book cover response status:", response.status);

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
        console.log("Book cover API response data:", data);

        if (!data.url) {
          console.error("Could not extract image URL from response:", data);
          throw new Error("Could not extract image URL from API response");
        }

        return data.url;
      } catch (fetchError: unknown) {
        console.error("Fetch error:", fetchError);
        // If it's a timeout error, provide specific messaging
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('API request timed out. Server might be overloaded or unreachable.');
        }
        throw fetchError;
      }
    } catch (error: unknown) {
      console.error("Error calling book cover API:", error);
      
      // Generate a placeholder instead
      console.log("Falling back to placeholder image due to API error");
      return getPlaceholderImage(prompt, 'bookcover', width, height);
    }
  } catch (error) {
    console.error("Error in generateBookCover:", error);
    
    // Ensure we always return something
    console.log("Using placeholder for book cover due to error");
    return getPlaceholderImage(prompt, 'bookcover', width, height);
  }
} 