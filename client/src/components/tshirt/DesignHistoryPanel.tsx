import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Grid3X3, 
  List, 
  Download, 
  Heart, 
  Trash2,
  Sparkles,
  RefreshCw,
  History,
  StarIcon,
  ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { getDesignHistory, deleteFromHistory, saveToFavorites, downloadImage, generateImage } from '@/services/ideogramService';
import type { DesignHistoryItem } from '@/services/designHistory';

export const DesignHistoryPanel = () => {
  // State management
  const [history, setHistory] = useState<DesignHistoryItem[]>([]);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Load history on mount
  useEffect(() => {
    const loadHistory = () => {
      const savedHistory = getDesignHistory();
      setHistory(savedHistory);
    };
    
    loadHistory();
    
    // Set up interval to refresh history every 30 seconds
    const intervalId = setInterval(loadHistory, 30000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  // Handle favorites
  const handleToggleFavorite = (id: string) => {
    try {
      const updatedItem = saveToFavorites(id);
      
      // Update the item in history
      setHistory(prev => 
        prev.map(item => 
          item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
        )
      );
      
      toast.success(updatedItem.isFavorite 
        ? 'Added to favorites' 
        : 'Removed from favorites'
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorites');
    }
  };
  
  // Handle delete
  const handleDelete = (id: string) => {
    try {
      deleteFromHistory(id);
      setHistory(prev => prev.filter(item => item.id !== id));
      toast.success('Design removed from history');
    } catch (error) {
      console.error('Error deleting design:', error);
      toast.error('Failed to delete design');
    }
  };
  
  // Handle download
  const handleDownload = async (item: DesignHistoryItem, format = 'png') => {
    console.log('Downloading design:', item.id);
    setIsDownloading(true);
    
    try {
      // Format filename using id for uniqueness
      const filename = `tshirt-${item.id.substring(0, 8)}`;
      console.log('Downloading with filename:', filename);
      
      await downloadImage(item.imageUrl, format, filename);
      toast.success(`Downloaded as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error downloading design:', error);
      toast.error('Failed to download design');
    } finally {
      setIsDownloading(false);
    }
  };
  
  // Add a function to regenerate design
  const handleRegenerate = async (item: DesignHistoryItem) => {
    console.log('Regenerating design for item:', item.id);
    
    try {
      // Show loading toast
      const toastId = toast.loading('Regenerating design...');
      
      // Generate new design with same prompt
      const newImageUrl = await generateImage({
        prompt: item.prompt,
        transparentBackground: true,
        format: 'merch'
      });
      
      if (!newImageUrl) {
        throw new Error('Failed to regenerate design');
      }
      
      // Update the item in history
      const updatedItem = {
        ...item,
        imageUrl: newImageUrl,
        thumbnail: newImageUrl,
        createdAt: new Date().toISOString()
      };
      
      // Update locally 
      setHistory(prev => 
        prev.map(historyItem => 
          historyItem.id === item.id ? updatedItem : historyItem
        )
      );
      
      // Update in storage
      const savedHistory = getDesignHistory();
      const updatedHistory = savedHistory.map(historyItem => 
        historyItem.id === item.id ? updatedItem : historyItem
      );
      
      // Update history in localStorage
      localStorage.setItem('designHistory', JSON.stringify(updatedHistory));
      
      toast.dismiss(toastId);
      toast.success('Design regenerated successfully');
    } catch (error) {
      console.error('Error regenerating design:', error);
      toast.error('Failed to regenerate design');
    }
  };
  
  // Filter history based on current filter
  const filteredHistory = history.filter(item => {
    if (filter === 'favorites') {
      return item.isFavorite;
    }
    return true;
  });
  
  // Check if history is empty
  const isHistoryEmpty = filteredHistory.length === 0;

  return (
    <div className="border border-primary/10 rounded-lg bg-card overflow-hidden relative z-[200]" style={{ pointerEvents: 'auto' }}>
      <div className="px-6 py-5 border-b border-primary/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Design History</h2>
            <p className="text-sm text-muted-foreground">Your previously generated designs</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-auto">
          <Tabs 
            value={filter} 
            onValueChange={(value) => setFilter(value as 'all' | 'favorites')}
            className="mr-2"
          >
            <TabsList className="h-8 bg-muted/50">
              <TabsTrigger value="all" className="text-xs px-3 h-7 data-[state=active]:bg-primary/10">
                All Designs
              </TabsTrigger>
              <TabsTrigger value="favorites" className="text-xs px-3 h-7 data-[state=active]:bg-primary/10">
                <StarIcon className="h-3 w-3 mr-1" />
                Favorites
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8 border-primary/20"
            onClick={() => setView('grid')}
            disabled={view === 'grid'}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8 border-primary/20"
            onClick={() => setView('list')}
            disabled={view === 'list'}
          >
            <List className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-primary/20"
            onClick={() => {
              const savedHistory = getDesignHistory();
              setHistory(savedHistory);
              toast.success('History refreshed');
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="p-6">
        {isHistoryEmpty ? (
          <div className="text-center py-16 space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <ImageIcon className="h-10 w-10 text-primary/50" />
            </div>
            <h3 className="text-lg font-medium">No designs yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Generate your first t-shirt design to see it here. Your designs will be automatically saved to this history panel.
            </p>
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredHistory.map((item) => (
              <div key={item.id} className="group relative aspect-square bg-white/50 dark:bg-gray-900/50 rounded-md overflow-hidden border border-primary/10">
                {/* Design thumbnail */}
                <img 
                  src={item.thumbnail} 
                  alt={item.prompt} 
                  className="w-full h-full object-contain p-2"
                />
                
                {/* Favorite badge */}
                {item.isFavorite && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary text-xs px-1.5 py-0">
                      <StarIcon className="h-3 w-3 mr-1 fill-primary" />
                      Favorite
                    </Badge>
                  </div>
                )}
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-3 flex flex-col justify-between">
                  <div className="text-xs text-white/90 line-clamp-3 font-medium">
                    {item.prompt}
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <div className="text-xs text-white/70 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDate(item.createdAt)}
                    </div>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 bg-white/10 hover:bg-white/20 relative z-[201] pointer-events-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Favorite button clicked for item:', item.id);
                          handleToggleFavorite(item.id);
                        }}
                      >
                        <Heart 
                          className={`h-3 w-3 ${item.isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} 
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 bg-white/10 hover:bg-white/20 relative z-[201] pointer-events-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Download button clicked for item:', item.id);
                          handleDownload(item);
                        }}
                        disabled={isDownloading}
                      >
                        <Download className="h-3 w-3 text-white" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 bg-white/10 hover:bg-white/20 relative z-[201] pointer-events-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Regenerate button clicked for item:', item.id);
                          handleRegenerate(item);
                        }}
                      >
                        <RefreshCw className="h-3 w-3 text-white" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 bg-white/10 hover:bg-white/20 relative z-[201] pointer-events-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Delete button clicked for item:', item.id);
                          handleDelete(item.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-white" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredHistory.map((item) => (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-3 hover:bg-primary/5 rounded-md transition-colors border border-transparent hover:border-primary/10"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-md overflow-hidden bg-white/50 dark:bg-gray-900/50 border border-primary/10 flex-shrink-0">
                    <img 
                      src={item.thumbnail} 
                      alt={item.prompt} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate max-w-md">
                      {item.prompt}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDate(item.createdAt)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {item.isFavorite && (
                    <Badge variant="outline" className="mr-2 bg-primary/10 text-primary">
                      <StarIcon className="h-3 w-3 mr-1 fill-primary" />
                      Favorite
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 relative z-[201]"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Favorite button clicked for item:', item.id);
                      handleToggleFavorite(item.id);
                    }}
                  >
                    <Heart 
                      className={`h-4 w-4 ${item.isFavorite ? 'fill-red-500 text-red-500' : ''}`} 
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 relative z-[201]"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Download button clicked for item:', item.id);
                      handleDownload(item);
                    }}
                    disabled={isDownloading}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 relative z-[201]"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Regenerate button clicked for item:', item.id);
                      handleRegenerate(item);
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 relative z-[201]"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Delete button clicked for item:', item.id);
                      handleDelete(item.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 