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
    
    try {
      // Simulate a short delay for UX feedback
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Create form data for the request - similar to the working T-shirt generator
      const formData = new FormData();
      formData.append('prompt', enhancedPrompt);
      formData.append('width', width.toString());
      formData.append('height', height.toString());
      
      if (negative_prompt) {
        formData.append('negative_prompt', negative_prompt);
      } else {
        formData.append('negative_prompt', 'text, watermark, signature, blurry, low quality, distorted, deformed');
      }
      
      // Log the form data entries for debugging
      console.log("Form data entries:");
      for (const [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
      }
      
      // Use the ideogram/generate-custom endpoint that works for the T-shirt service
      const apiUrl = `${API_URL}/api/ideogram/generate-custom`;
      console.log("Full API URL:", apiUrl);
      
      // Make the API call using FormData instead of JSON
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData // Send FormData directly
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
      
      // Extract the image URL - T-shirt service returns { url: "..." }
      if (data && data.url) {
        console.log("Successfully extracted image URL:", data.url);
        return data.url;
      } else {
        console.error("No image URL found in response:", data);
        return getPlaceholderImage(prompt, width, height);
      }
    } catch (apiError) {
      console.error("Error calling Ideogram API:", apiError);
      
      // Try the book-cover/generate-front endpoint as fallback
      console.log("Trying book-cover endpoint as fallback");
      try {
        const payload = {
          prompt,
          width: width.toString(),
          height: height.toString(),
          negative_prompt
        };
        
        const fallbackApiUrl = `${API_URL}/api/book-cover/generate-front`;
        console.log("Fallback API URL:", fallbackApiUrl);
        
        const fallbackResponse = await fetch(fallbackApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload),
          credentials: 'omit'
        });
        
        if (!fallbackResponse.ok) {
          throw new Error(`Fallback API error: ${fallbackResponse.status}`);
        }
        
        const fallbackData = await fallbackResponse.json();
        console.log("Fallback API response data:", fallbackData);
        
        if (fallbackData.url) {
          console.log("Successfully extracted image URL from fallback:", fallbackData.url);
          
          // Check if it's a placeholder response
          if (fallbackData.message && fallbackData.message.includes('placeholder')) {
            console.log("Backend returned a placeholder:", fallbackData.message);
            toast.warning("Using a placeholder image - API key might be configured but has another issue");
          }
          
          return fallbackData.url;
        }
      } catch (fallbackError) {
        console.error("Fallback API error:", fallbackError);
      }
      
      // If both attempts fail, return a placeholder
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