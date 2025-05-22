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

/**
 * Generate a complete book with content, automatically determining chapters to match target page count
 */
export const generateCompleteBook = async (
  settings: {
    title: string;
    subtitle: string;
    bookSummary: string;
    tone: string;
    targetAudience: string;
    pageCount: number;
    bookSize: string;
    fontFamily: string;
    fontSize: number;
  }
): Promise<{
  chapters: Chapter[];
  estimatedPageCount: number;
}> => {
  // Create a controller for the fetch request with a much longer timeout (120 seconds)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout for large books
  
  try {
    console.log('Generating complete book with settings:', {
      title: settings.title,
      pageCount: settings.pageCount,
      bookSize: settings.bookSize,
      summaryLength: settings.bookSummary.length
    });
    
    const response = await fetch(`${API_BASE_URL}/api/openai/generate-complete-book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...settings
      }),
      signal: controller.signal
    });
    
    // Clear the timeout since we got a response
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    let data;
    try {
      data = await response.json();
      console.log('Book generation response successful, chapters:', data.chapters?.length || 0);
    } catch (parseError) {
      console.error('Error parsing API response:', parseError);
      throw new Error('Invalid JSON response from API');
    }
    
    if (data.success && data.chapters) {
      return {
        chapters: data.chapters.map((chapter: any, index: number) => ({
          id: (index + 1).toString(),
          title: chapter.title,
          content: chapter.content,
          wordCount: chapter.content ? chapter.content.split(/\s+/).filter((word: string) => word.length > 0).length : 0
        })),
        estimatedPageCount: data.estimatedPageCount || settings.pageCount
      };
    } else {
      console.error('API returned success: false or no chapters', data);
      throw new Error(data.error || 'Invalid response from API');
    }
  } catch (error: any) {
    // Check if it's a timeout error
    if (error.name === 'AbortError') {
      console.error('Book generation request timed out after 120 seconds');
      throw new Error('Book generation request timed out. Please try again or use a smaller page count.');
    }
    
    console.error('Error generating complete book:', error);
    throw error;
  } finally {
    clearTimeout(timeoutId); // Ensure timeout is cleared in all cases
  }
}; 