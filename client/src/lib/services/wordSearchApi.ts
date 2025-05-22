/**
 * Word Search Puzzle API Service
 * 
 * Handles API calls to the Word Search puzzle generator backend
 */

import { WordSearchSettings } from '@/pages/dashboard/puzzles/WordSearch';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const WORD_SEARCH_API = `${API_BASE_URL}/api/word-search`;

type GenerateResponse = {
  jobId: string;
  message: string;
};

type GenerateWordsResponse = {
  words: string[];
};

type JobStatus = 'pending' | 'generating' | 'completed' | 'failed';

type StatusResponse = {
  jobId: string;
  status: JobStatus;
  progress: number;
  downloadUrl: string | null;
  error?: string;
};

type DownloadResponse = {
  downloadUrl: string;
};

interface ThemeData {
  id: string;
  name: string;
  words: string[];
}

/**
 * Generate a word search puzzle book
 * @param settings The settings for the puzzle book
 * @returns JobId for tracking the generation progress
 */
export const generateWordSearch = async (settings: WordSearchSettings): Promise<string> => {
  try {
    // Convert word directions to the format expected by the backend
    const directions = {
      horizontal: settings.directions.horizontal,
      vertical: settings.directions.vertical,
      diagonal: settings.directions.diagonal,
      backward: settings.directions.backward
    };
    
    // Parse themes if customWords is in JSON format
    let themes: ThemeData[] = [];
    try {
      if (settings.customWords.startsWith('[')) {
        themes = JSON.parse(settings.customWords);
      }
    } catch (error) {
      console.error('Error parsing themes from customWords:', error);
    }
    
    // If themes were parsed successfully, use them; otherwise, use the legacy format
    const requestData = {
      title: settings.title,
      subtitle: settings.subtitle,
      authorName: settings.authorName,
      pageSize: settings.pageSize,
      bleed: settings.bleed,
      includePageNumbers: settings.includePageNumbers,
      interiorTheme: settings.interiorTheme,
      fontFamily: settings.fontFamily,
      puzzlesPerPage: settings.puzzlesPerPage,
      theme: settings.theme,
      difficulty: settings.difficulty,
      quantity: settings.quantity,
      gridSize: settings.gridSize,
      wordsPerPuzzle: settings.wordsPerPuzzle,
      directions,
      includeAnswers: settings.includeAnswers,
      includeThemeFacts: settings.includeThemeFacts,
      includeCoverPage: settings.includeCoverPage,
      aiPrompt: settings.aiPrompt,
      // If we have themes, send them; otherwise, fall back to customWords
      ...(themes.length > 0 
        ? { themes } 
        : { customWords: settings.customWords })
    };
    
    const response = await axios.post<GenerateResponse>(
      `${WORD_SEARCH_API}/generate`, 
      requestData
    );
    
    return response.data.jobId;
  } catch (error) {
    console.error('Error generating word search puzzle:', error);
    throw error;
  }
};

/**
 * Generate a list of words from a theme using AI
 * @param theme The theme for the words
 * @param count The number of words to generate
 * @param prompt Custom prompt for the AI
 * @returns List of generated words
 */
export const generateWordsFromTheme = async (
  theme: string, 
  count: number = 20, 
  prompt: string = ''
): Promise<string[]> => {
  try {
    const response = await axios.post<GenerateWordsResponse>(`${WORD_SEARCH_API}/generate-words`, {
      theme,
      count,
      prompt
    });
    
    return response.data.words;
  } catch (error) {
    console.error('Error generating words from theme:', error);
    throw error;
  }
};

/**
 * Check the status of a generation job
 * @param jobId The ID of the job to check
 * @returns Status information for the job
 */
export const checkGenerationStatus = async (jobId: string): Promise<StatusResponse> => {
  try {
    const response = await axios.get<StatusResponse>(`${WORD_SEARCH_API}/status/${jobId}`);
    return response.data;
  } catch (error) {
    console.error('Error checking generation status:', error);
    throw error;
  }
};

/**
 * Get the download URL for a completed job
 * @param jobId The ID of the completed job
 * @returns Download URL for the generated PDF
 */
export const getDownloadUrl = async (jobId: string): Promise<string> => {
  try {
    const response = await axios.get<DownloadResponse>(`${WORD_SEARCH_API}/download/${jobId}`);
    return `${API_BASE_URL}${response.data.downloadUrl}`;
  } catch (error) {
    console.error('Error getting download URL:', error);
    throw error;
  }
};

/**
 * Poll the status of a generation job until it completes or fails
 * @param jobId The ID of the job to poll
 * @param onProgress Callback for progress updates
 * @returns Status response when the job completes or fails
 */
export const pollGenerationStatus = async (
  jobId: string,
  onProgress: (progress: number) => void
): Promise<StatusResponse> => {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const status = await checkGenerationStatus(jobId);
        onProgress(status.progress);
        
        if (status.status === 'completed' || status.status === 'failed') {
          resolve(status);
        } else {
          setTimeout(poll, 2000); // Poll every 2 seconds
        }
      } catch (error) {
        reject(error);
      }
    };
    
    poll();
  });
};

export default {
  generateWordSearch,
  generateWordsFromTheme,
  checkGenerationStatus,
  getDownloadUrl,
  pollGenerationStatus
}; 