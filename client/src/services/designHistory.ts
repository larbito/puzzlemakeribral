import { toast } from 'sonner';

export interface DesignHistoryItem {
  id: string;
  prompt: string;
  imageUrl: string;
  thumbnail: string;
  createdAt: string;
  isFavorite: boolean;
}

// Storage key
const STORAGE_KEY = 'tshirt-design-history';

/**
 * Get all design history items from local storage
 */
export function getDesignHistory(): DesignHistoryItem[] {
  try {
    const historyJSON = localStorage.getItem(STORAGE_KEY);
    if (!historyJSON) return [];
    
    const history = JSON.parse(historyJSON);
    if (!Array.isArray(history)) return [];
    
    return history;
  } catch (error) {
    console.error('Error getting design history:', error);
    return [];
  }
}

/**
 * Save a design to history
 */
export function saveToHistory(design: Omit<DesignHistoryItem, 'id' | 'createdAt'>): DesignHistoryItem {
  try {
    const history = getDesignHistory();
    
    // Create a new design with id and timestamp
    const newDesign: DesignHistoryItem = {
      ...design,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    };
    
    // Add to the beginning of the array
    const updatedHistory = [newDesign, ...history];
    
    // Save to local storage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
    
    return newDesign;
  } catch (error) {
    console.error('Error saving to history:', error);
    toast.error('Failed to save design to history');
    throw error;
  }
}

/**
 * Delete a design from history
 */
export function deleteFromHistory(id: string): DesignHistoryItem[] {
  try {
    const history = getDesignHistory();
    const updatedHistory = history.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
    return updatedHistory;
  } catch (error) {
    console.error('Error deleting from history:', error);
    toast.error('Failed to delete design');
    throw error;
  }
}

/**
 * Toggle favorite status of a design
 */
export function saveToFavorites(id: string): DesignHistoryItem {
  try {
    const history = getDesignHistory();
    
    // Find the item and toggle its favorite status
    const updatedHistory = history.map(item => {
      if (item.id === id) {
        return { ...item, isFavorite: !item.isFavorite };
      }
      return item;
    });
    
    // Save updated history
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
    
    // Return the updated item
    const updatedItem = updatedHistory.find(item => item.id === id);
    if (!updatedItem) {
      throw new Error('Item not found after update');
    }
    
    return updatedItem;
  } catch (error) {
    console.error('Error toggling favorite status:', error);
    toast.error('Failed to update favorite status');
    throw error;
  }
} 