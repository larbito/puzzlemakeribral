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
 * Generate only the chapter titles/outline for a book (faster than full generation)
 */
export const generateBookOutline = async (
  settings: {
    title: string;
    subtitle: string;
    bookSummary: string;
    tone: string;
    targetAudience: string;
    chapterCount: number;
  }
): Promise<string[]> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for outline only
    
    // Make a simplified request just for chapter titles
    const requestBody = {
      prompt: `Create an outline for a book titled "${settings.title || 'Untitled'}" about ${settings.bookSummary}. 
      The book should have exactly ${settings.chapterCount} chapters (including introduction and conclusion).
      The tone is ${settings.tone} and the target audience is ${settings.targetAudience}.
      Return ONLY an array of chapter titles in JSON format.`,
      outlineOnly: true
    };
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/openai/generate-book-outline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.chapters && Array.isArray(data.chapters)) {
        return data.chapters;
      }
      
      // Fallback if API doesn't return expected format
      return generateFallbackOutline(settings.chapterCount);
    } catch (error) {
      console.error('Error generating book outline:', error);
      clearTimeout(timeoutId);
      
      // Generate a fallback outline locally
      return generateFallbackOutline(settings.chapterCount);
    }
  } catch (error) {
    console.error('Error in generateBookOutline:', error);
    return generateFallbackOutline(settings.chapterCount);
  }
};

/**
 * Generate content for a single chapter (for chunked generation)
 */
export const generateSingleChapter = async (
  params: {
    bookTitle: string;
    bookSummary: string;
    chapterTitle: string;
    chapterIndex: number;
    totalChapters: number;
    tone: string;
    targetAudience: string;
    targetWordCount: number;
  }
): Promise<string> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout per chapter
    
    const response = await fetch(`${API_BASE_URL}/api/openai/generate-chapter-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: params.bookTitle,
        bookSummary: params.bookSummary,
        chapterTitle: params.chapterTitle,
        chapterNumber: params.chapterIndex + 1,
        totalChapters: params.totalChapters,
        tone: params.tone,
        targetAudience: params.targetAudience,
        targetWordCount: params.targetWordCount
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.content) {
      return data.content;
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error(`Error generating content for chapter "${params.chapterTitle}":`, error);
    // Return placeholder content if generation fails
    return `# ${params.chapterTitle}\n\nContent generation failed. Please edit this chapter manually.\n\nThis chapter is part of your book about: ${params.bookSummary.substring(0, 100)}...`;
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
  // Create a controller for the fetch request with a longer timeout (300 seconds)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout for very large books
  
  try {
    console.log('Generating complete book with settings:', {
      title: settings.title,
      pageCount: settings.pageCount,
      bookSize: settings.bookSize,
      summaryLength: settings.bookSummary.length
    });
    
    // Check if this is a large book request and add optimization flag
    const isLargeBook = settings.pageCount > 150;
    
    const response = await fetch(`${API_BASE_URL}/api/openai/generate-complete-book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...settings,
        optimizeForLargeBook: isLargeBook // Tell the backend to use faster settings for large books
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
      console.error('Book generation request timed out after 5 minutes');
      throw new Error('Book generation request timed out. Please try the chapter-by-chapter approach.');
    }
    
    console.error('Error generating complete book:', error);
    throw error;
  } finally {
    clearTimeout(timeoutId); // Ensure timeout is cleared in all cases
  }
};

// Helper function to generate a fallback outline when API calls fail
function generateFallbackOutline(chapterCount: number): string[] {
  const outline = [];
  
  // Add introduction
  outline.push('Introduction');
  
  // Add main chapters
  for (let i = 1; i <= chapterCount - 2; i++) {
    outline.push(`Chapter ${i}: Key Topic ${i}`);
  }
  
  // Add conclusion
  outline.push('Conclusion');
  
  return outline;
} 