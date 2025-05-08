import { toast } from "sonner";
import type { DesignHistoryItem } from "@/services/designHistory";

// For development/debugging - set to false to use real API
const USE_PLACEHOLDERS = false;

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
    // If using placeholders for testing, return immediately
    if (USE_PLACEHOLDERS) {
      console.log("Using placeholder by configuration");
      return getPlaceholderImage(prompt);
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
      const imageUrl = await generateWithProxy(enhancedPrompt, style);
      console.log("Successfully generated image");
      return imageUrl;
    } catch (error) {
      console.error("Error with image generation:", error);
      toast.error("Failed to generate design. Using placeholder instead.");
      return getPlaceholderImage(prompt);
    }
  } catch (error) {
    console.error("Error in generateImage:", error);
    toast.error("Failed to generate design. Using placeholder instead.");
    return getPlaceholderImage(prompt);
  }
}

// Generate with our Vercel proxy
async function generateWithProxy(prompt: string, style?: string): Promise<string> {
  console.log("Making API call with prompt:", prompt);

  try {
    const requestBody = {
      prompt: prompt,
      style: style !== "custom" ? style : undefined,
      aspect_ratio: "ASPECT_3_4",
      negative_prompt: "text, watermark, signature, blurry, low quality, distorted, deformed",
      seed: Math.floor(Math.random() * 1000000)
    };

    console.log("Request body:", JSON.stringify(requestBody, null, 2));

    const response = await fetch('/api/ideogram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log("Proxy response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Proxy error response:", errorData);
      throw new Error(errorData.error || `Proxy error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Proxy response data:", JSON.stringify(data, null, 2));

    if (!data || !data.url) {
      console.error("Invalid response structure:", data);
      throw new Error("Invalid response structure from proxy");
    }

    return data.url;
  } catch (error: unknown) {
    console.error("Error calling proxy:", error);
    throw error;
  }
}

// Helper function to get placeholders
function getPlaceholderImage(prompt: string): Promise<string> {
  const words = prompt.split(' ').slice(0, 5).join('-');
  const bgColor = getColorForStyle(prompt);
  const fgColor = "FFFFFF";
  const placeholderUrl = `https://dummyimage.com/1024x1365/${bgColor}/${fgColor}?text=${encodeURIComponent('T-Shirt Design: ' + words)}`;
  
  console.log("Generated placeholder URL:", placeholderUrl);
  
  return new Promise((resolve) => {
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
    // Check if the URL is a data URL
    let blob;
    if (imageUrl.startsWith('data:')) {
      // For data URLs, extract the blob directly
      const base64Data = imageUrl.split(',')[1];
      const binaryData = atob(base64Data);
      const byteArray = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        byteArray[i] = binaryData.charCodeAt(i);
      }
      blob = new Blob([byteArray], { type: 'image/png' });
    } else {
      // For regular URLs, fetch the image
      const response = await fetch(imageUrl);
      blob = await response.blob();
    }
    
    // Create a download link and trigger it
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.${format.toLowerCase()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Design downloaded as ${format}`);
  } catch (error) {
    console.error("Error downloading image:", error);
    toast.error("Failed to download image. Please try again.");
  }
}

// Re-export history-related functions
export { getDesignHistory, saveToHistory, deleteFromHistory, saveToFavorites, saveToProject } from "@/services/designHistory"; 