import { toast } from 'sonner';

// Use environment variable for API URL with a fallback
// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
// Directly use the proxy path since we're using Vite's proxy
const API_URL = '/api';

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
    
    const response = await fetch(`${API_URL}/book-cover/calculate-dimensions`, {
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
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to calculate dimensions');
    }

    const data = await response.json();
    console.log('Dimension calculation response:', data);
    return data;
  } catch (error) {
    console.error('Error calculating cover dimensions:', error);
    toast.error('Failed to calculate cover dimensions');
    throw error;
  }
}

/**
 * Generate a front cover using the AI image generator
 */
export async function generateFrontCover({
  prompt,
  width,
  height,
  negative_prompt
}: {
  prompt: string;
  width: number;
  height: number;
  negative_prompt?: string;
}) {
  try {
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('width', width.toString());
    formData.append('height', height.toString());
    
    if (negative_prompt) {
      formData.append('negative_prompt', negative_prompt);
    }

    const response = await fetch(`${API_URL}/book-cover/generate-front`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate cover');
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating front cover:', error);
    toast.error('Failed to generate front cover');
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

    const response = await fetch(`${API_URL}/book-cover/assemble-full`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to assemble full cover');
    }

    return await response.json();
  } catch (error) {
    console.error('Error assembling full cover:', error);
    toast.error('Failed to assemble full cover');
    throw error;
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
  
  return `${API_URL}/book-cover/download?${params.toString()}`;
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
  const downloadUrl = getDownloadUrl({ url, format, filename, width, height });
  
  // Create a hidden anchor element and trigger the download
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `${filename}.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
} 