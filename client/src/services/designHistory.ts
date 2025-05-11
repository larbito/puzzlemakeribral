import { toast } from "sonner";

// Type definitions
export interface DesignHistoryItem {
  id: string;
  prompt: string;
  thumbnail: string;
  imageUrl: string;
  style: string;
  colorScheme?: string;
  format: string;
  createdAt: string;
  isFavorite?: boolean;
}

// Local storage key
export const HISTORY_STORAGE_KEY = 'tshirt-design-history';
const MAX_HISTORY_ITEMS = 50;

// Get design history from local storage
export function getDesignHistory(): DesignHistoryItem[] {
  try {
    const historyString = localStorage.getItem(HISTORY_STORAGE_KEY);
    return historyString ? JSON.parse(historyString) : [];
  } catch (error) {
    console.error('Error reading design history:', error);
    return [];
  }
}

// Save design to history
export function saveToHistory(design: Omit<DesignHistoryItem, 'id' | 'createdAt'>): DesignHistoryItem {
  try {
    const history = getDesignHistory();
    
    const newDesign: DesignHistoryItem = {
      ...design,
      id: generateId(),
      createdAt: new Date().toISOString(),
      isFavorite: false
    };

    // Add to beginning of array and limit size
    const updatedHistory = [newDesign, ...history].slice(0, MAX_HISTORY_ITEMS);
    
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
    return newDesign;
  } catch (error) {
    console.error('Error saving to history:', error);
    throw error;
  }
}

// Delete design from history
export function deleteFromHistory(id: string): DesignHistoryItem[] {
  try {
    const history = getDesignHistory();
    const updatedHistory = history.filter(item => item.id !== id);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
    return updatedHistory;
  } catch (error) {
    console.error('Error deleting from history:', error);
    throw error;
  }
}

// Save design to favorites
export function saveToFavorites(id: string): void {
  try {
    const history = getDesignHistory();
    const updatedHistory = history.map(item => 
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    );
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('Error saving to favorites:', error);
    throw error;
  }
}

// Save design to project (placeholder for future implementation)
export function saveToProject(design: DesignHistoryItem): void {
  // This is a placeholder for future implementation
  // Could integrate with a backend API to save to user's projects
  console.log('Saving design to project:', design);
  // Implement actual project saving logic here
}

// Helper function to generate unique IDs
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
} 