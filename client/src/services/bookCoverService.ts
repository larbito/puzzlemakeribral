import { toast } from "sonner";

// API base URL - ensure it's always the production URL when deployed
const API_URL = 'https://puzzlemakeribral-production.up.railway.app';

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
    console.log("Direct generateBookCover call with params:", { prompt, width, height });
    
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

    // Use the book-cover/generate-front endpoint that we know exists
    const apiUrl = `${API_URL}/api/book-cover/generate-front`;
    console.log("Full API URL:", apiUrl);
    
    try {
      // Make the direct API call with JSON
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
        credentials: 'omit'
      });
      
      console.log("Direct API response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error response text:", errorText);
        throw new Error(`API error: ${response.status} - ${errorText.substring(0, 100)}`);
      }
      
      const data = await response.json();
      console.log("Direct API response data:", data);
      
      if (data && data.url) {
        console.log("Successfully extracted image URL:", data.url);
        
        // Check if it's a placeholder response
        if (data.message && data.message.includes('placeholder')) {
          console.log("Backend returned a placeholder:", data.message);
          toast.warning("Using a placeholder image - API key might be configured but has another issue");
        }
        
        return data.url;
      } else {
        console.error("No image URL found in response:", data);
        return getPlaceholderImage(prompt, width, height);
      }
    } catch (apiError) {
      console.error("Error calling API:", apiError);
      return getPlaceholderImage(prompt, width, height);
    }
  } catch (error) {
    console.error("Error in generateBookCover:", error);
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