// API helper functions for book cover generation

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Get API URL based on environment
const getApiUrl = (): string => {
  return process.env.NODE_ENV === 'production' 
    ? window.location.origin.includes('vercel.app') 
      ? 'https://puzzlemakeribral-production.up.railway.app'
      : window.location.origin
    : 'http://localhost:3000';
};

// Generic API call wrapper
const apiCall = async <T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> => {
  const url = `${getApiUrl()}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: Request failed`);
  }
  
  return response.json();
};

// Calculate book dimensions
export const calculateBookDimensions = async (
  trimSize: string,
  pageCount: number,
  paperType: 'white' | 'cream' | 'color',
  includeBleed: boolean
) => {
  return apiCall('/api/book-cover/calculate-dimensions', {
    method: 'POST',
    body: JSON.stringify({
      trimSize,
      pageCount,
      paperType,
      includeBleed,
    }),
  });
};

// Analyze uploaded image with OpenAI Vision
export const analyzeImageWithAI = async (imageFile: File) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  
  const response = await fetch(`${getApiUrl()}/api/book-cover/analyze-image`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to analyze image');
  }
  
  return response.json();
};

// Enhance user prompt with GPT-4
export const enhancePrompt = async (
  userPrompt: string,
  genre?: string,
  additionalInstructions?: string
) => {
  return apiCall('/api/book-cover/enhance-prompt', {
    method: 'POST',
    body: JSON.stringify({
      userPrompt,
      genre,
      additionalInstructions,
    }),
  });
};

// Generate front cover with DALL·E
export const generateFrontCover = async (
  prompt: string,
  size: string = '1024x1792',
  quality: string = 'hd',
  style: string = 'vivid'
) => {
  return apiCall('/api/book-cover/generate-dalle-cover', {
    method: 'POST',
    body: JSON.stringify({
      prompt,
      size,
      quality,
      style,
    }),
  });
};

// Generate back cover prompt based on front cover
export const generateBackCoverPrompt = async (
  frontPrompt: string,
  includeText: boolean = false,
  customText?: string,
  includeInteriorImages: boolean = false,
  interiorImagesCount: number = 0
) => {
  return apiCall('/api/book-cover/generate-back-prompt', {
    method: 'POST',
    body: JSON.stringify({
      frontPrompt,
      includeBackText: includeText,
      backCustomText: customText,
      includeInteriorImages,
      interiorImagesCount,
    }),
  });
};

// Generate back cover with DALL·E
export const generateBackCover = async (
  frontPrompt: string,
  backPrompt: string,
  includeText: boolean = false,
  customText?: string,
  includeInteriorImages: boolean = false,
  interiorImages: string[] = [],
  size: string = '1024x1792',
  quality: string = 'hd',
  style: string = 'vivid'
) => {
  return apiCall('/api/book-cover/generate-dalle-back', {
    method: 'POST',
    body: JSON.stringify({
      frontCoverPrompt: frontPrompt,
      generatedBackPrompt: backPrompt,
      includeBackText: includeText,
      backCustomText: customText,
      includeInteriorImages,
      interiorImages,
      size,
      quality,
      style,
    }),
  });
};

// Extract colors from front and back covers
export const extractColors = async (
  frontCoverUrl: string,
  backCoverUrl?: string
) => {
  return apiCall('/api/book-cover/extract-colors', {
    method: 'POST',
    body: JSON.stringify({
      frontCoverUrl,
      backCoverUrl,
    }),
  });
};

// Assemble full wrap cover
export const assembleFullCover = async (
  frontCoverUrl: string,
  backCoverUrl: string,
  trimSize: string,
  paperType: 'white' | 'cream' | 'color',
  pageCount: number,
  spineColor: string,
  spineText?: string,
  spineFont: string = 'helvetica',
  interiorImages: string[] = []
) => {
  return apiCall('/api/book-cover/generate-full-wrap', {
    method: 'POST',
    body: JSON.stringify({
      frontCoverUrl,
      backCoverUrl,
      trimSize,
      paperType,
      pageCount,
      spineColor,
      spineText,
      spineFont,
      addSpineText: Boolean(spineText),
      interiorImages,
    }),
  });
};

// File upload helper
export const uploadFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${getApiUrl()}/api/upload`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error('Failed to upload file');
  }
  
  const data = await response.json();
  return data.url;
};

// Convert file to base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Download helper
export const downloadImage = async (url: string, filename: string) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Download failed:', error);
    throw new Error('Failed to download image');
  }
}; 