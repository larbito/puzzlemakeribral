import { toast } from 'sonner';

// Use Railway API URL instead of local proxy (without the /api suffix)
const API_URL = 'https://puzzlemakeribral-production.up.railway.app';

/**
 * Calculate the dimensions for a book cover based on KDP specifications
 */
export async function calculateCoverDimensions({
  trimSize,
  pageCount,
  paperColor,
  bookType = 'paperback',
  includeBleed = true
}: {
  trimSize: string;
  pageCount: number;
  paperColor: string;
  bookType?: 'paperback' | 'hardcover';
  includeBleed?: boolean;
}) {
  try {
    console.log('Calculating dimensions with:', { trimSize, pageCount, paperColor, bookType, includeBleed });
    console.log('API URL:', API_URL);
    
    const response = await fetch(`${API_URL}/api/book-cover/calculate-dimensions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trimSize,
        pageCount,
        paperColor,
        bookType,
        includeBleed
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      
      let errorMessage = 'Failed to calculate dimensions';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // If JSON parsing fails, use the error text
        errorMessage = errorText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Dimension calculation response:', data);
    return data;
  } catch (error) {
    console.error('Error calculating cover dimensions:', error);
    // Don't show error toast for every dimension calculation failure
    // Instead, return a basic calculated dimension object
    return {
      dimensions: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generate a front cover using the AI image generator
 */
export async function generateFrontCover({
  prompt,
  width,
  height,
  negative_prompt,
  model = 'ideogram', // Default to ideogram if not specified
  seed // Optional seed for variations
}: {
  prompt: string;
  width: number;
  height: number;
  negative_prompt?: string;
  model?: string; // 'ideogram' or 'dalle'
  seed?: number; // Optional seed for variations
}) {
  try {
    console.log('----------------------------------------------------');
    console.log('Starting front cover generation with params:', { prompt, width, height, negative_prompt, model, seed });
    console.log('API URL for generation:', `${API_URL}/api/book-cover/generate-front`);
    console.log('----------------------------------------------------');
    
    // Define the safe area for Amazon KDP covers (0.25" from edges)
    const safeAreaInset = 0.25 * 300; // 0.25 inches at 300 DPI

    // Add KDP-specific instructions to prompt
    let enhancedPrompt = prompt;
    
    // Add flat image instructions if not already present
    if (!prompt.toLowerCase().includes('flat image') && !prompt.toLowerCase().includes('flat illustration')) {
      enhancedPrompt = "Create a flat image design for a book cover: " + prompt;
    }
    
    // Add KDP-specific safe area instructions
    if (!prompt.toLowerCase().includes('safe area') && !prompt.toLowerCase().includes('margins')) {
      enhancedPrompt += `. IMPORTANT: Keep all important text and elements at least 0.25 inches (${safeAreaInset}px) from all edges. Place text in the center area of the cover, not close to the edges. Ensure text is clearly legible with good contrast against the background.`;
    }
    
    // Add text sizing instructions
    if (!prompt.toLowerCase().includes('text size')) {
      enhancedPrompt += " Make all text properly sized and well-proportioned - title should be large and prominent, subtitle smaller but clear.";
    }
    
    // Add default negative prompt against book mockups if not provided
    let enhancedNegativePrompt = negative_prompt || '';
    if (!enhancedNegativePrompt.includes('book mockup')) {
      enhancedNegativePrompt += ', book mockup, 3D book, book cover mockup, book model, perspective, shadow effects, page curl';
    }
    
    // Add specifics against tiny, illegible or cut-off text
    if (!enhancedNegativePrompt.includes('illegible text')) {
      enhancedNegativePrompt += ', tiny text, illegible text, cut-off text, text too close to edge, blurry text, distorted text';
    }
    
    // Create JSON payload instead of FormData with proper type
    const payload: {
      prompt: string;
      width: string;
      height: string;
      negative_prompt: string;
      model: string;
      seed?: number;
    } = {
      prompt: enhancedPrompt,
      width: width.toString(),
      height: height.toString(),
      negative_prompt: enhancedNegativePrompt,
      model: model // Add model parameter
    };
    
    // Add seed if provided
    if (seed !== undefined) {
      payload.seed = seed;
    }

    console.log('Sending request to backend with payload:', payload);
    const response = await fetch(`${API_URL}/api/book-cover/generate-front`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    console.log('Response received:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error from backend:', error);
      throw new Error(error.error || 'Failed to generate cover');
    }

    const data = await response.json();
    
    if (!data.url) {
      console.error('No URL returned from backend:', data);
      throw new Error('No image URL returned');
    }
    
    console.log('Successfully generated front cover:', data.url.substring(0, 100) + '...');
    return {
      url: data.url,
      width: data.width || width,
      height: data.height || height
    };
  } catch (error) {
    console.error('Error in generateFrontCover:', error);
    throw error;
  }
}

/**
 * Assemble a full cover (front, spine, back)
 */
export async function assembleFullCover({
  frontCoverUrl,
  dimensions,
  spineText,
  spineColor,
  interiorImagesUrls,
  bookTitle,
  authorName
}: {
  frontCoverUrl: string;
  dimensions: any;
  spineText?: string;
  spineColor?: string;
  interiorImagesUrls?: string[];
  bookTitle?: string;
  authorName?: string;
}) {
  try {
    const formData = new FormData();
    formData.append('frontCoverUrl', frontCoverUrl);
    formData.append('dimensions', JSON.stringify(dimensions));
    
    if (spineText) formData.append('spineText', spineText);
    if (spineColor) formData.append('spineColor', spineColor);
    if (bookTitle) formData.append('bookTitle', bookTitle);
    if (authorName) formData.append('authorName', authorName);
    
    if (interiorImagesUrls?.length) {
      interiorImagesUrls.forEach(url => {
        formData.append('interiorImagesUrls', url);
      });
    }

    const response = await fetch(`${API_URL}/api/book-cover/assemble-full`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error assembling full cover:', errorText);
      
      // Try to parse the error
      let errorMessage = 'Failed to assemble full cover';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // If JSON parsing fails, use the error text
        errorMessage = errorText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error('Error assembling full cover:', error);
    
    // Return a fallback placeholder
    const width = dimensions?.width || 1800;
    const height = dimensions?.height || 900;
    return {
      fullCover: `https://placehold.co/${width}x${height}/3498DB-2980B9/FFFFFF/png?text=Full+Cover+Placeholder`,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generate a download URL for a cover
 */
export function getDownloadUrl({
  url,
  format = 'png',
  filename,
  width,
  height
}: {
  url: string;
  format?: 'png' | 'jpg' | 'pdf';
  filename?: string;
  width?: number;
  height?: number;
}) {
  const params = new URLSearchParams({
    url: url,
    format: format
  });
  
  if (filename) params.append('filename', filename);
  if (width) params.append('width', width.toString());
  if (height) params.append('height', height.toString());
  
  return `${API_URL}/api/book-cover/download?${params.toString()}`;
}

/**
 * Download a cover image directly
 */
export function downloadCover({
  url,
  format = 'png',
  filename = 'book-cover',
  width,
  height
}: {
  url: string;
  format?: 'png' | 'jpg' | 'pdf';
  filename?: string;
  width?: number;
  height?: number;
}) {
  try {
    const downloadUrl = getDownloadUrl({ url, format, filename, width, height });
    
    // Create a hidden anchor element and trigger the download
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${filename}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading cover:', error);
    
    // Fallback to direct download
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${format === 'pdf' ? 'jpg' : format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

/**
 * Enhance a book cover image using Real-ESRGAN
 */
export async function enhanceBookCover({
  imageUrl,
  target
}: {
  imageUrl: string;
  target: 'front' | 'back';
}) {
  try {
    console.log(`Enhancing ${target} cover:`, imageUrl);
    
    // Create form data for the request
    const formData = new FormData();
    formData.append('imageUrl', imageUrl);
    formData.append('target', target);
    
    // Start the enhancement process
    const response = await fetch(`${API_URL}/api/book-cover/enhance`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error enhancing cover:', errorText);
      throw new Error(errorText);
    }

    const data = await response.json();
    
    if (!data.success || !data.predictionId) {
      throw new Error('Enhancement failed to start');
    }

    // Return the prediction ID and status endpoint for polling
    return {
      predictionId: data.predictionId,
      statusEndpoint: data.statusEndpoint,
      status: data.status
    };
  } catch (error) {
    console.error('Error enhancing book cover:', error);
    throw error;
  }
}

/**
 * Check the status of an enhancement job
 */
export async function checkEnhancementStatus(statusEndpoint: string) {
  try {
    const response = await fetch(`${API_URL}${statusEndpoint}`);
    
    if (!response.ok) {
      throw new Error(`Failed to check status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking enhancement status:', error);
    throw error;
  }
}

/**
 * Enhance a prompt using OpenAI
 */
export async function enhancePrompt({
  prompt,
  context
}: {
  prompt: string;
  context?: string;
}): Promise<{ enhancedPrompt: string }> {
  try {
    console.log('Enhancing prompt:', prompt);
    
    const response = await fetch(`${API_URL}/api/openai/enhance-prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        context
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to enhance prompt');
    }

    const data = await response.json();
    
    if (!data.enhancedPrompt) {
      throw new Error('No enhanced prompt was generated');
    }

    return {
      enhancedPrompt: data.enhancedPrompt
    };
  } catch (error) {
    console.error('Error enhancing prompt:', error);
    throw error;
  }
} 