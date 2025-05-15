import React, { useState, useRef } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Layers, 
  Loader2, 
  Image as ImageIcon, 
  Sparkles, 
  Download, 
  X,
  Check,
  DownloadCloud,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { generateImage, downloadAllImages, imageToPrompt, saveToHistory } from '@/services/ideogramService';

// Define interface for bulk item
interface BulkItem {
  id: string;
  file: File;
  imageUrl: string;
  prompt: string;
  status: 'pending' | 'analyzing' | 'ready' | 'generating' | 'completed' | 'failed';
  designUrl?: string;
}

export const BulkImageTab = () => {
  // State management
  const [bulkItems, setBulkItems] = useState<BulkItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Constants
  const MAX_UPLOADS = 10;
  
  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const selectedFiles = Array.from(e.target.files).slice(0, MAX_UPLOADS);
    
    if (selectedFiles.length > MAX_UPLOADS) {
      toast.warning(`Maximum of ${MAX_UPLOADS} images allowed. Only the first ${MAX_UPLOADS} will be processed.`);
    }
    
    // Check existing items count
    if (bulkItems.length + selectedFiles.length > MAX_UPLOADS) {
      toast.error(`You can only upload up to ${MAX_UPLOADS} images in total.`);
      return;
    }
    
    // Validate files (size and type)
    const validFiles = selectedFiles.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File "${file.name}" exceeds the 5MB limit and will be skipped.`);
        return false;
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`File "${file.name}" is not an image and will be skipped.`);
        return false;
      }
      return true;
    });
    
    // Create new bulk items
    const newItems: BulkItem[] = validFiles.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      imageUrl: URL.createObjectURL(file),
      prompt: '',
      status: 'pending'
    }));
    
    setBulkItems(prev => [...prev, ...newItems]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Process the images to generate prompts
    await processImages(newItems);
  };
  
  // Process images to generate prompts
  const processImages = async (items: BulkItem[]) => {
    if (items.length === 0) return;
    
    setIsProcessing(true);
    
    // Show toast notification
    toast.info(`Analyzing ${items.length} images...`);
    
    // Process each image sequentially to avoid overwhelming the API
    for (const item of items) {
      try {
        // Update status to analyzing
        setBulkItems(prev => prev.map(i => 
          i.id === item.id ? { ...i, status: 'analyzing' } : i
        ));
        
        // Call OpenAI to analyze image
        const generatedPrompt = await imageToPrompt(item.file, 'tshirt');
        
        // Update the prompt and status
        setBulkItems(prev => prev.map(i => 
          i.id === item.id ? { ...i, prompt: generatedPrompt, status: 'ready' } : i
        ));
      } catch (error) {
        console.error(`Error analyzing image ${item.id}:`, error);
        
        // Update status to failed
        setBulkItems(prev => prev.map(i => 
          i.id === item.id ? { ...i, status: 'failed' } : i
        ));
        
        toast.error(`Failed to analyze one of the images.`);
      }
    }
    
    setIsProcessing(false);
    toast.success(`Analysis complete for ${items.length} images.`);
  };
  
  // Update prompt for a specific item
  const handleUpdatePrompt = (id: string, prompt: string) => {
    setBulkItems(prev => prev.map(item => 
      item.id === id ? { ...item, prompt } : item
    ));
  };
  
  // Remove specific item
  const handleRemoveItem = (id: string) => {
    setBulkItems(prev => prev.filter(item => item.id !== id));
  };
  
  // Clear all items
  const handleClearAll = () => {
    setBulkItems([]);
  };
  
  // Generate designs for all ready items
  const handleGenerateAll = async () => {
    // Get all items with valid prompts
    const itemsToGenerate = bulkItems.filter(item => 
      (item.status === 'ready' || item.status === 'failed') && item.prompt.trim().length > 0
    );
    
    if (itemsToGenerate.length === 0) {
      toast.error('No valid prompts to generate designs from.');
      return;
    }
    
    setIsGeneratingAll(true);
    
    // Show toast notification
    toast.info(`Generating ${itemsToGenerate.length} designs...`);
    
    // Generate designs sequentially
    for (const item of itemsToGenerate) {
      try {
        // Update status to generating
        setBulkItems(prev => prev.map(i => 
          i.id === item.id ? { ...i, status: 'generating' } : i
        ));
        
        // Call Ideogram API to generate design
        const imageUrl = await generateImage({
          prompt: item.prompt,
          transparentBackground: true,
          format: 'merch'
        });
        
        if (imageUrl) {
          // Update with generated design
          setBulkItems(prev => prev.map(i => 
            i.id === item.id ? { ...i, designUrl: imageUrl, status: 'completed' } : i
          ));
          
          // Save to history
          saveToHistory({
            prompt: item.prompt,
            imageUrl,
            thumbnail: imageUrl,
            isFavorite: false
          });
        } else {
          throw new Error('Failed to generate design');
        }
      } catch (error) {
        console.error(`Error generating design for item ${item.id}:`, error);
        
        // Update status to failed
        setBulkItems(prev => prev.map(i => 
          i.id === item.id ? { ...i, status: 'failed' } : i
        ));
        
        toast.error(`Failed to generate one of the designs.`);
      }
    }
    
    setIsGeneratingAll(false);
    
    // Count successful generations
    const successCount = bulkItems.filter(item => item.status === 'completed').length;
    toast.success(`Generated ${successCount} designs successfully.`);
  };
  
  // Download all generated designs
  const handleDownloadAll = async () => {
    // Get all items with generated designs
    const itemsToDownload = bulkItems.filter(item => 
      item.status === 'completed' && item.designUrl
    );
    
    if (itemsToDownload.length === 0) {
      toast.error('No designs to download.');
      return;
    }
    
    setIsDownloadingAll(true);
    
    try {
      // Format items for download
      const downloadItems = itemsToDownload.map(item => ({
        url: item.designUrl!,
        prompt: item.prompt
      }));
      
      // Call service to download all as zip
      await downloadAllImages(downloadItems);
      toast.success(`Downloaded ${itemsToDownload.length} designs as ZIP.`);
    } catch (error) {
      console.error('Error downloading designs:', error);
      toast.error('Failed to download designs.');
    } finally {
      setIsDownloadingAll(false);
    }
  };
  
  // Get counts by status
  const getStatusCounts = () => {
    const total = bulkItems.length;
    const ready = bulkItems.filter(i => i.status === 'ready').length;
    const analyzing = bulkItems.filter(i => i.status === 'analyzing' || i.status === 'pending').length;
    const completed = bulkItems.filter(i => i.status === 'completed').length;
    const failed = bulkItems.filter(i => i.status === 'failed').length;
    
    return { total, ready, analyzing, completed, failed };
  };
  
  const counts = getStatusCounts();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bulk Image Processing</CardTitle>
          <CardDescription>
            Upload up to 10 images at once. Our AI will analyze each image, generate prompts, and create t-shirt designs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Upload section */}
          {bulkItems.length === 0 ? (
            <div 
              className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Layers className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-1">Upload Images in Bulk</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload up to {MAX_UPLOADS} images at once for batch processing.
              </p>
              <Button variant="outline" size="sm">
                Select Images
              </Button>
              <input 
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Status bar */}
              <div className="bg-muted p-4 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">
                    {counts.total} images: {counts.completed} completed • {counts.ready} ready • {counts.analyzing} analyzing • {counts.failed} failed
                  </span>
                  <div className="w-full h-2 bg-muted-foreground/20 rounded-full overflow-hidden">
                    {/* Progress bar segments */}
                    <div className="flex h-full">
                      <div className="bg-green-500 h-full" style={{ width: `${(counts.completed / Math.max(counts.total, 1)) * 100}%` }}></div>
                      <div className="bg-blue-500 h-full" style={{ width: `${(counts.ready / Math.max(counts.total, 1)) * 100}%` }}></div>
                      <div className="bg-yellow-500 h-full" style={{ width: `${(counts.analyzing / Math.max(counts.total, 1)) * 100}%` }}></div>
                      <div className="bg-red-500 h-full" style={{ width: `${(counts.failed / Math.max(counts.total, 1)) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleClearAll}
                    disabled={isProcessing || isGeneratingAll}
                  >
                    Clear All
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing || isGeneratingAll || bulkItems.length >= MAX_UPLOADS}
                    variant="outline"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Add More
                  </Button>
                  <input 
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                  />
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex justify-between items-center">
                <Button 
                  onClick={handleGenerateAll}
                  disabled={isProcessing || isGeneratingAll || counts.ready === 0}
                  variant="default"
                >
                  {isGeneratingAll ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate All Designs
                    </>
                  )}
                </Button>
                
                {counts.completed > 0 && (
                  <Button 
                    onClick={handleDownloadAll}
                    disabled={isDownloadingAll}
                    variant="outline"
                  >
                    {isDownloadingAll ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Preparing...
                      </>
                    ) : (
                      <>
                        <DownloadCloud className="mr-2 h-4 w-4" />
                        Download All ({counts.completed})
                      </>
                    )}
                  </Button>
                )}
              </div>
              
              {/* List of images */}
              <div className="space-y-4 mt-4">
                {bulkItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
                      {/* Source image */}
                      <div className="relative aspect-square bg-muted rounded-md overflow-hidden">
                        <img 
                          src={item.imageUrl} 
                          alt="Source image" 
                          className="w-full h-full object-contain"
                        />
                        <Button 
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-7 w-7"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={isProcessing || isGeneratingAll}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        
                        {/* Status badge */}
                        <div className="absolute bottom-2 left-2">
                          <Badge variant={
                            item.status === 'completed' ? 'default' :
                            item.status === 'ready' ? 'secondary' :
                            item.status === 'failed' ? 'destructive' :
                            'outline'
                          }>
                            {item.status === 'pending' && 'Pending'}
                            {item.status === 'analyzing' && (
                              <span className="flex items-center gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Analyzing
                              </span>
                            )}
                            {item.status === 'ready' && (
                              <span className="flex items-center gap-1">
                                <Check className="h-3 w-3" />
                                Ready
                              </span>
                            )}
                            {item.status === 'generating' && (
                              <span className="flex items-center gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Generating
                              </span>
                            )}
                            {item.status === 'completed' && (
                              <span className="flex items-center gap-1">
                                <Check className="h-3 w-3" />
                                Completed
                              </span>
                            )}
                            {item.status === 'failed' && (
                              <span className="flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Failed
                              </span>
                            )}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Prompt */}
                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor={`prompt-${item.id}`}>Generated Prompt</Label>
                        <Textarea
                          id={`prompt-${item.id}`}
                          value={item.prompt}
                          onChange={(e) => handleUpdatePrompt(item.id, e.target.value)}
                          placeholder={item.status === 'analyzing' ? "Analyzing image..." : "Edit prompt here..."}
                          className="min-h-[100px]"
                          disabled={item.status === 'analyzing' || item.status === 'generating'}
                        />
                        <div className="text-xs text-muted-foreground">
                          Edit the prompt to refine your design if needed.
                        </div>
                      </div>
                      
                      {/* Generated design */}
                      <div className="relative aspect-square bg-muted rounded-md overflow-hidden flex items-center justify-center">
                        {item.status === 'completed' && item.designUrl ? (
                          <img 
                            src={item.designUrl} 
                            alt="Generated design" 
                            className="w-full h-full object-contain"
                          />
                        ) : item.status === 'generating' ? (
                          <div className="text-center">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                            <p className="text-xs text-muted-foreground">Generating...</p>
                          </div>
                        ) : item.status === 'failed' ? (
                          <div className="text-center">
                            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-destructive" />
                            <p className="text-xs text-muted-foreground">Failed</p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">Preview</p>
                          </div>
                        )}
                        
                        {/* Download button for completed designs */}
                        {item.status === 'completed' && item.designUrl && (
                          <div className="absolute bottom-2 right-2">
                            <Button 
                              size="sm" 
                              className="h-8 rounded-full"
                              onClick={() => {
                                // Use the service to download individual design
                                downloadAllImages([{url: item.designUrl!, prompt: item.prompt}]);
                              }}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              <span className="text-xs">Download</span>
                            </Button>
                          </div>
                        )}
                        
                        {/* Generate button for ready items */}
                        {(item.status === 'ready' || item.status === 'failed') && item.prompt.trim() && !isGeneratingAll && (
                          <div className="absolute bottom-2 right-2">
                            <Button 
                              size="sm" 
                              className="h-8 rounded-full"
                              onClick={async () => {
                                try {
                                  setBulkItems(prev => prev.map(i => 
                                    i.id === item.id ? { ...i, status: 'generating' } : i
                                  ));
                                  
                                  const imageUrl = await generateImage({
                                    prompt: item.prompt,
                                    transparentBackground: true,
                                    format: 'merch'
                                  });
                                  
                                  if (imageUrl) {
                                    setBulkItems(prev => prev.map(i => 
                                      i.id === item.id ? { ...i, designUrl: imageUrl, status: 'completed' } : i
                                    ));
                                    
                                    // Save to history
                                    saveToHistory({
                                      prompt: item.prompt,
                                      imageUrl,
                                      thumbnail: imageUrl,
                                      isFavorite: false
                                    });
                                    
                                    toast.success('Design generated successfully!');
                                  }
                                } catch (error) {
                                  console.error('Error generating design:', error);
                                  setBulkItems(prev => prev.map(i => 
                                    i.id === item.id ? { ...i, status: 'failed' } : i
                                  ));
                                  toast.error('Failed to generate design');
                                }
                              }}
                            >
                              <Sparkles className="h-3 w-3 mr-1" />
                              <span className="text-xs">Generate</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 