import { getAuth } from 'firebase/auth';

// API base URL - ensure it's used consistently across all services
const API_URL = process.env.NODE_ENV === 'production' 
  ? window.location.origin.includes('vercel.app') 
    ? 'https://puzzlemakeribral-production.up.railway.app'
    : window.location.origin
  : 'http://localhost:3000';

// Debug logging for API URL
console.log('API_URL in api.ts configured as:', API_URL);

async function getAuthHeaders() {
  const auth = getAuth();
  const token = await auth.currentUser?.getIdToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function generateImage(prompt: string, style?: string, format: string = 'png') {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/generate-image`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ prompt, style, format }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate image');
  }

  return response.json();
}

export async function uploadFile(file: File, storage: 's3' | 'cloudinary' = 's3') {
  const headers = await getAuthHeaders();
  const base64 = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      resolve(base64String.split(',')[1]);
    };
    reader.readAsDataURL(file);
  });

  const response = await fetch(`${API_URL}/api/files/upload`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      file: {
        name: file.name,
        type: file.type,
        data: base64,
      },
      storage,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload file');
  }

  return response.json();
}

export async function downloadFile(key: string, storage: 's3' | 'cloudinary' = 's3') {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/files/download/${key}?storage=${storage}`, {
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to download file');
  }

  if (storage === 'cloudinary') {
    return response.json();
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = key.split('/').pop() || 'download';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export async function verifyAuth() {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/auth/verify`, {
    method: 'POST',
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to verify authentication');
  }

  return response.json();
}

export async function getCurrentUser() {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/auth/user`, {
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get user data');
  }

  return response.json();
}

/**
 * Interface for the book cover generation request
 */
export interface GenerateBookCoverParams {
  prompt: string;
  style?: string;
  width: number;
  height: number;
}

/**
 * Generate a book cover using the Ideogram API (via our proxy)
 */
export async function generateBookCover({
  prompt,
  style = "realistic",
  width,
  height
}: GenerateBookCoverParams): Promise<string> {
  try {
    // Create an enhanced prompt with professional context
    const enhancedPrompt = `Print-ready book cover design: ${prompt}. Professional quality, high resolution.`;
    
    // Create form data for the request
    const formData = new FormData();
    formData.append('prompt', enhancedPrompt);
    formData.append('aspect_ratio', '3:4'); // Use a portrait aspect ratio for book covers
    formData.append('rendering_speed', 'STANDARD'); // Higher quality
    
    if (style && style !== "realistic") {
      formData.append('style_type', style.toUpperCase());
    }

    formData.append('negative_prompt', 'text overlays, watermark, signature, blurry, low quality, distorted');
    
    // Make the API call to our backend proxy
    const response = await fetch(`${API_URL}/api/ideogram/generate`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.url) {
      throw new Error("No image URL returned from API");
    }

    return data.url;
  } catch (error) {
    console.error("Error generating book cover:", error);
    throw error;
  }
}

/**
 * Download an image via our proxy to avoid CORS issues
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
    const proxyUrl = `${API_URL}/api/ideogram/proxy-image?url=${encodeURIComponent(imageUrl)}&filename=${encodeURIComponent(filename)}`;
    
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
 * Create a proxied URL for any external image to avoid CORS issues
 */
export function getProxiedImageUrl(imageUrl: string): string {
  // Don't proxy data URLs and blob URLs
  if (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
    return imageUrl;
  }
  
  // For external URLs, use our proxy
  return `${API_URL}/api/ideogram/proxy-image?url=${encodeURIComponent(imageUrl)}`;
}

/**
 * Canvas utilities for rendering the book cover
 */

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