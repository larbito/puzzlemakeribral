import { toast } from "sonner";

// API base URL - ensure it's used consistently across all services
export const API_URL = process.env.NODE_ENV === 'production' 
  ? window.location.origin.includes('vercel.app') 
    ? 'https://puzzlemakeribral-production.up.railway.app'
    : window.location.origin
  : 'http://localhost:3000';

// Debug logging for API URL
console.log('API_URL in bookCoverService.ts configured as:', API_URL);

// For development/debugging - set to true to use placeholder images instead of real API
const USE_PLACEHOLDERS = false; // Set to false to use the real API service

export interface GenerateBookCoverParams {
  prompt: string;
  width: number;
  height: number;
  negative_prompt?: string;
}

export async function generateBookCover({
  prompt,
  width,
  height,
  negative_prompt
}: GenerateBookCoverParams): Promise<string | null> {
  try {
    console.log("======== BOOK COVER SERVICE START ========");
    console.log("API URL:", API_URL);
    console.log("Direct generateBookCover call with params:", { prompt, width, height });
    
    // First test the server connectivity
    try {
      console.log("Testing backend connectivity with health check");
      const healthResponse = await fetch(`${API_URL}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      console.log("Health check status:", healthResponse.status);
      const healthData = await healthResponse.text();
      console.log("Health check response:", healthData);
      
      if (!healthResponse.ok) {
        throw new Error(`Health check failed: ${healthData}`);
      }
    } catch (healthError) {
      console.error("Health check failed:", healthError);
      toast.error("Backend service is not available. Please try again later.");
      return getPlaceholderImage(prompt, width, height);
    }
    
    // If using placeholders for testing, return immediately
    if (USE_PLACEHOLDERS) {
      console.log("Using placeholder by configuration");
      return getPlaceholderImage(prompt, width, height);
    }

    console.log("Making direct API call for book cover generation");

    // Build the enhanced prompt for book cover
    const enhancedPrompt = `Book cover design: ${prompt}, high resolution, professional print-ready quality`;
    
    // Create the request payload
    const payload = {
      prompt: enhancedPrompt,
      width: width.toString(),
      height: height.toString(),
      negative_prompt: negative_prompt || 'text, watermark, signature, blurry, low quality, distorted, deformed'
    };

    console.log("Request payload:", JSON.stringify(payload));
    
    // Try both endpoints, first book-cover then ideogram
    const endpoints = [
      `/api/book-cover/generate-front`
    ];
    
    for (const endpoint of endpoints) {
      try {
        const apiUrl = `${API_URL}${endpoint}`;
        console.log(`Trying endpoint: ${apiUrl}`);
        
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        // Make the direct API call with JSON
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Origin': window.location.origin
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
          credentials: 'include'
        });
        
        clearTimeout(timeoutId);
        
        console.log(`Response status for ${endpoint}:`, response.status);
        console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`API error from ${endpoint}:`, errorText);
          let errorMessage = 'Failed to generate book cover';
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (e) {
            // If we can't parse the error as JSON, use the raw text
            errorMessage = errorText;
          }
          toast.error(errorMessage);
          continue; // Try next endpoint
        }
        
        const data = await response.json();
        console.log(`Response data from ${endpoint}:`, data);
        
        if (data && data.url) {
          console.log("Successfully extracted image URL:", data.url);
          console.log("======== BOOK COVER SERVICE END ========");
          return data.url;
        } else {
          console.error("No image URL in response:", data);
          toast.error("No image URL received from the server");
        }
      } catch (endpointError: any) {
        console.error(`Error with endpoint ${endpoint}:`, endpointError);
        toast.error(endpointError.message || "Failed to generate book cover");
        // Continue to next endpoint
      }
    }
    
    // If all endpoints fail, fall back to placeholder
    console.error("All API endpoints failed");
    console.log("Using placeholder as fallback");
    console.log("======== BOOK COVER SERVICE END (FALLBACK) ========");
    toast.error("Using placeholder image due to API failure");
    return getPlaceholderImage(prompt, width, height);
  } catch (error: any) {
    console.error("Error in generateBookCover:", error);
    console.log("======== BOOK COVER SERVICE END (ERROR) ========");
    toast.error(error.message || "An unexpected error occurred");
    return getPlaceholderImage(prompt, width, height);
  }
}

// Helper function to get placeholders
function getPlaceholderImage(prompt: string, width: number, height: number): Promise<string> {
  const words = prompt.split(' ').slice(0, 5).join('-');
  const bgColor = "3498DB";
  const fgColor = "FFFFFF";
  
  const placeholderUrl = `https://placehold.co/${width}x${height}/${bgColor}/${fgColor}?text=${encodeURIComponent('Book Cover: ' + words)}`;
  
  console.log("Generated book cover placeholder URL:", placeholderUrl);
  
  return new Promise((resolve) => {
    // Check if the URL works by creating a test image
    const testImg = new Image();
    
    testImg.onload = () => {
      setTimeout(() => {
        resolve(placeholderUrl);
      }, 500);
    };
    
    testImg.onerror = () => {
      console.error("Placeholder image failed to load, using fallback data URI");
      const fallbackDataUri = createFallbackImage(words, width, height);
      setTimeout(() => {
        resolve(fallbackDataUri);
      }, 500);
    };
    
    testImg.src = placeholderUrl;
  });
}

// Create a simple fallback image as a data URI
function createFallbackImage(text: string, width: number, height: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  }
  
  // Set background color
  ctx.fillStyle = '#3498DB';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 40px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const lines = text.split('-');
  const lineHeight = 50;
  const startY = (canvas.height - (lines.length * lineHeight)) / 2;
  
  lines.forEach((line, index) => {
    ctx.fillText(line, canvas.width / 2, startY + (index * lineHeight));
  });
  
  return canvas.toDataURL('image/png');
} 