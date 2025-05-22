// OpenAI API Integration

import { Chapter } from '../pages/dashboard/AIBookGenerator';

// API URL - Railway deployment
const API_BASE_URL = 'https://puzzlemakeribral-production.up.railway.app';

// For development testing (if needed)
// const API_BASE_URL = 'http://localhost:3000';

/**
 * Generate a table of contents based on book concept
 */
export const generateTableOfContents = async (
  bookSummary: string,
  tone: string,
  audience: string
): Promise<Chapter[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/generate-toc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bookSummary,
        tone,
        audience,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform API response to match our Chapter interface
    return data.chapters.map((chapter: any, index: number) => ({
      id: (index + 1).toString(),
      title: chapter.title || `Chapter ${index + 1}`,
      content: '',
      wordCount: 0,
    }));
  } catch (error) {
    console.error('Error generating table of contents:', error);
    throw error;
  }
};

/**
 * Generate content for a specific chapter
 */
export const generateChapterContent = async (
  chapterTitle: string,
  bookSummary: string,
  tone: string,
  audience: string
): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/generate-chapter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chapterTitle,
        bookSummary,
        tone,
        audience,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error(`Error generating content for chapter "${chapterTitle}":`, error);
    throw error;
  }
}; 