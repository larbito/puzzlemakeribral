import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
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
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { getDesignHistory, deleteFromHistory, saveToFavorites } from '@/services/ideogramService';
import type { DesignHistoryItem } from '@/services/designHistory';
import { downloadImage } from '@/services/ideogramService';

export const DesignHistoryPanel = () => {
  // State management
  const [history, setHistory] = useState<DesignHistoryItem[]>([]);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  
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
    try {
      await downloadImage(item.imageUrl, format, `tshirt-${item.id}`);
      toast.success(`Downloaded as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error downloading design:', error);
      toast.error('Failed to download design');
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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Design History</CardTitle>
            <CardDescription>
              Your previously generated t-shirt designs
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Tabs 
              value={filter} 
              onValueChange={(value) => setFilter(value as 'all' | 'favorites')}
              className="mr-2"
            >
              <TabsList className="h-8">
                <TabsTrigger value="all" className="text-xs px-3 h-7">All</TabsTrigger>
                <TabsTrigger value="favorites" className="text-xs px-3 h-7">Favorites</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setView('grid')}
              disabled={view === 'grid'}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setView('list')}
              disabled={view === 'list'}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isHistoryEmpty ? (
          <div className="text-center py-10">
            <Sparkles className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-1">No designs yet</h3>
            <p className="text-sm text-muted-foreground">
              Generate your first t-shirt design to see it here.
            </p>
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredHistory.map((item) => (
              <div key={item.id} className="group relative aspect-square bg-muted rounded-md overflow-hidden">
                {/* Design thumbnail */}
                <img 
                  src={item.thumbnail} 
                  alt={item.prompt} 
                  className="w-full h-full object-contain"
                />
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                  <div className="text-xs text-white/90 line-clamp-3 mb-2">
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
                        className="h-7 w-7 bg-white/10 hover:bg-white/20"
                        onClick={() => handleToggleFavorite(item.id)}
                      >
                        <Heart 
                          className={`h-3 w-3 ${item.isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} 
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 bg-white/10 hover:bg-white/20"
                        onClick={() => handleDownload(item)}
                      >
                        <Download className="h-3 w-3 text-white" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 bg-white/10 hover:bg-white/20"
                        onClick={() => handleDelete(item.id)}
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
          <div className="space-y-2">
            {filteredHistory.map((item) => (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-md overflow-hidden bg-muted">
                    <img 
                      src={item.thumbnail} 
                      alt={item.prompt} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate max-w-[300px]">
                      {item.prompt}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDate(item.createdAt)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  {item.isFavorite && (
                    <Badge variant="outline" className="mr-2 bg-primary/10 text-primary">
                      Favorite
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleToggleFavorite(item.id)}
                  >
                    <Heart 
                      className={`h-3 w-3 ${item.isFavorite ? 'fill-red-500 text-red-500' : ''}`} 
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleDownload(item)}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 