import React, { useState, useRef } from 'react';
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
  AlertTriangle,
  Folder,
  Zap,
  InfoIcon,
  Image,
  ChevronDown,
  Wand2
} from 'lucide-react';
import { toast } from 'sonner';
import { generateImage, downloadAllImages, imageToPrompt, saveToHistory, downloadImage, removeBackground, enhanceImage, backgroundRemovalModels } from '@/services/ideogramService';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define interface for bulk item
interface BulkItem {
  id: string;
  file: File;
  imageUrl: string;
  prompt: string;
  status: 'pending' | 'analyzing' | 'ready' | 'generating' | 'completed' | 'failed';
  designUrl?: string;
  isBackgroundRemoved?: boolean;
  isEnhanced?: boolean;
  activeModel?: string | null;
}

export const BulkImageTab = () => {
  // State management
  const [bulkItems, setBulkItems] = useState<BulkItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [processingItemId, setProcessingItemId] = useState<string | null>(null);
  const [enhancingItemId, setEnhancingItemId] = useState<string | null>(null);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Constants
  const MAX_UPLOADS = 10;
  
  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Bulk file input changed');
    if (!e.target.files || e.target.files.length === 0) return;
    
    const selectedFiles = Array.from(e.target.files).slice(0, MAX_UPLOADS);
    console.log('Files selected:', selectedFiles.length);
    
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
    console.log(`Processing ${items.length} images for prompt generation`);
    
    // Process each image sequentially to avoid overwhelming the API
    for (const item of items) {
      try {
        // Update status to analyzing
        setBulkItems(prev => prev.map(i => 
          i.id === item.id ? { ...i, status: 'analyzing' } : i
        ));
        
        console.log(`Analyzing image ${item.id}: ${item.file.name}`);
        // Call OpenAI to analyze image
        const generatedPrompt = await imageToPrompt(item.file, 'tshirt');
        console.log(`Generated prompt for ${item.id}: ${generatedPrompt.substring(0, 50)}...`);
        
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
    console.log(`Updating prompt for item ${id}`);
    setBulkItems(prev => prev.map(item => 
      item.id === id ? { ...item, prompt } : item
    ));
  };
  
  // Remove specific item
  const handleRemoveItem = (id: string) => {
    console.log(`Removing item ${id}`);
    setBulkItems(prev => prev.filter(item => item.id !== id));
  };
  
  // Clear all items
  const handleClearAll = () => {
    console.log('Clearing all items');
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
    
    console.log(`Generating designs for ${itemsToGenerate.length} items`);
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
        
        console.log(`Generating design for item ${item.id} with prompt: ${item.prompt.substring(0, 30)}...`);
        // Call Ideogram API to generate design
        const imageUrl = await generateImage({
          prompt: item.prompt,
          transparentBackground: true,
          format: 'merch'
        });
        
        if (imageUrl) {
          console.log(`Generated design URL for item ${item.id}: ${imageUrl.substring(0, 50)}...`);
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
  
  // Generate a single design
  const handleGenerateSingle = async (itemId: string) => {
    // Find the item to generate
    const itemToGenerate = bulkItems.find(item => item.id === itemId);
    
    if (!itemToGenerate || !itemToGenerate.prompt.trim()) {
      toast.error('No valid prompt to generate design from.');
      return;
    }
    
    console.log(`Generating single design for item ${itemId}`);
    
    try {
      // Update status to generating
      setBulkItems(prev => prev.map(i => 
        i.id === itemId ? { ...i, status: 'generating' } : i
      ));
      
      // Show toast notification
      toast.info('Generating design...');
      
      console.log(`Generating design with prompt: ${itemToGenerate.prompt.substring(0, 30)}...`);
      // Call Ideogram API to generate design
      const imageUrl = await generateImage({
        prompt: itemToGenerate.prompt,
        transparentBackground: true,
        format: 'merch'
      });
      
      if (imageUrl) {
        console.log(`Generated design URL: ${imageUrl.substring(0, 50)}...`);
        // Update with generated design
        setBulkItems(prev => prev.map(i => 
          i.id === itemId ? { ...i, designUrl: imageUrl, status: 'completed' } : i
        ));
        
        // Save to history
        saveToHistory({
          prompt: itemToGenerate.prompt,
          imageUrl,
          thumbnail: imageUrl,
          isFavorite: false
        });
        
        toast.success('Design generated successfully!');
      } else {
        throw new Error('Failed to generate design');
      }
    } catch (error) {
      console.error(`Error generating design:`, error);
      
      // Update status to failed
      setBulkItems(prev => prev.map(i => 
        i.id === itemId ? { ...i, status: 'failed' } : i
      ));
      
      toast.error(`Failed to generate design.`);
    }
  };
  
  // Handle removing background for a single item
  const handleRemoveBackground = async (itemId: string, modelId: string | null = null) => {
    const item = bulkItems.find(item => item.id === itemId);
    if (!item || !item.designUrl) {
      toast.error('No design to process');
      return;
    }
    
    setProcessingItemId(itemId);
    
    try {
      // If reverting to original, reset to the original state
      if (modelId === 'original') {
        // Find the original item and update without background removal
        setBulkItems(prev => prev.map(i => 
          i.id === itemId ? { 
            ...i, 
            isBackgroundRemoved: false,
            activeModel: null,
            // We don't have the original URL stored, so we'd need to regenerate
            // or store the original URL separately in the data model
          } : i
        ));
        
        toast.success('Background restored for this item');
        setProcessingItemId(null);
        return;
      }
      
      // Call the background removal service with the specified model
      const processedImageUrl = await removeBackground(item.designUrl, modelId);
      
      // Get model name for the success message
      let modelName = "Standard";
      if (modelId) {
        // Safely access the model by checking if the key exists
        const modelKeys = Object.keys(backgroundRemovalModels);
        for (const key of modelKeys) {
          if (backgroundRemovalModels[key as keyof typeof backgroundRemovalModels]?.id === modelId) {
            modelName = backgroundRemovalModels[key as keyof typeof backgroundRemovalModels].name;
            break;
          }
        }
      }
      
      // Update item with processed design
      setBulkItems(prev => prev.map(i => 
        i.id === itemId ? { 
          ...i, 
          designUrl: processedImageUrl,
          isBackgroundRemoved: true,
          activeModel: modelId,
          // If it was enhanced before, now it's just background removed
          isEnhanced: false
        } : i
      ));
      
      toast.success(`Background removed successfully for item #${itemId.slice(-4)}!`, {
        description: `Using ${modelName} model`
      });
    } catch (error) {
      console.error(`Error removing background for item ${itemId}:`, error);
      toast.error('Failed to remove background');
    } finally {
      setProcessingItemId(null);
    }
  };
  
  // Select a background removal model for an item
  const selectModelForItem = (itemId: string, modelKey: string) => {
    console.log(`Selected model ${modelKey} for item ${itemId}`);
    // Get the model ID and call handleRemoveBackground with it
    const model = backgroundRemovalModels[modelKey as keyof typeof backgroundRemovalModels];
    if (model && model.id) {
      handleRemoveBackground(itemId, model.id);
    }
  };
  
  // Handle enhancing a single item
  const handleEnhanceImage = async (itemId: string) => {
    const item = bulkItems.find(item => item.id === itemId);
    if (!item || !item.designUrl) {
      toast.error('No design to enhance');
      return;
    }
    
    setEnhancingItemId(itemId);
    
    try {
      // Call the enhancement service
      const enhancedImageUrl = await enhanceImage(item.designUrl);
      
      // Update item with enhanced design
      setBulkItems(prev => prev.map(i => 
        i.id === itemId ? { 
          ...i, 
          designUrl: enhancedImageUrl,
          isEnhanced: true
        } : i
      ));
      
      toast.success('Image enhanced successfully!');
    } catch (error) {
      console.error(`Error enhancing image for item ${itemId}:`, error);
      toast.error('Failed to enhance image');
    } finally {
      setEnhancingItemId(null);
    }
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
    
    console.log(`Downloading ${itemsToDownload.length} designs`);
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
  
  // Calculate completion percentage
  const completionPercentage = counts.total === 0 
    ? 0 
    : Math.round(((counts.completed + counts.ready) / counts.total) * 100);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {bulkItems.length === 0 ? (
          <div className="text-center py-16 space-y-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Layers className="h-12 w-12 text-primary/70" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-medium">Bulk Process Images</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Upload up to {MAX_UPLOADS} images at once. Our AI will analyze each image, 
                generate prompts, and create professional t-shirt designs.
              </p>
            </div>
            
            <Button 
              size="lg"
              className="mx-auto"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-5 w-5" />
              Upload Images
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
          <>
            {/* Status dashboard */}
            <div className="bg-card border border-primary/10 rounded-lg p-4 space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <h3 className="font-medium flex items-center gap-2">
                    <Folder className="h-4 w-4 text-primary" />
                    Bulk Processing Status
                  </h3>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{counts.total} images:</span> {counts.completed} completed • {counts.ready} ready • {counts.analyzing} analyzing • {counts.failed} failed
                  </div>
                </div>
                
                <div className="flex gap-2 ml-auto">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleClearAll}
                    disabled={isProcessing || isGeneratingAll}
                    className="h-8 border-primary/20"
                  >
                    Clear All
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing || isGeneratingAll || bulkItems.length >= MAX_UPLOADS}
                    variant="outline"
                    className="h-8 border-primary/20"
                  >
                    <Upload className="mr-2 h-3 w-3" />
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
              
              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Processing progress</span>
                  <span>{completionPercentage}%</span>
                </div>
                <Progress value={completionPercentage} className="h-2" />
              </div>
              
              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button 
                  onClick={handleGenerateAll}
                  disabled={isProcessing || isGeneratingAll || counts.ready === 0}
                  variant="default"
                  className="bg-primary hover:bg-primary/90 flex-1"
                >
                  {isGeneratingAll ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating {bulkItems.length} Designs...
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
                    className="flex-1 border-primary/20"
                  >
                    {isDownloadingAll ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Preparing ZIP...
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
              
              {/* Best practices info */}
              <div className="bg-muted/30 p-2 rounded text-xs text-muted-foreground mt-2">
                <p className="flex items-start gap-1">
                  <InfoIcon className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Image processing tip:</strong> For best results, we recommend <strong>removing the background first, then enhancing</strong>. This workflow maintains the highest quality in the final images.
                  </span>
                </p>
              </div>
            </div>
            
            {/* Image items */}
            <div className="space-y-4 mt-6">
              <h3 className="text-lg font-medium ml-1">Uploaded Images</h3>
              
              {bulkItems.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-card border border-primary/10 rounded-lg overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
                    {/* Source image */}
                    <div className="relative aspect-square bg-white/50 dark:bg-gray-900/50 rounded-md overflow-hidden">
                      <img 
                        src={item.imageUrl} 
                        alt="Source image" 
                        className="w-full h-full object-contain"
                      />
                      <Button 
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7 opacity-90"
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
                        } className="text-xs font-medium">
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
                    
                    {/* Prompt editor */}
                    <div className="space-y-2 md:col-span-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`prompt-${item.id}`} className="text-xs font-medium">
                          Prompt
                        </Label>
                        <Badge variant="outline" className="text-xs">
                          {item.prompt.length}/500
                        </Badge>
                      </div>
                      <Textarea
                        id={`prompt-${item.id}`}
                        value={item.prompt}
                        onChange={(e) => handleUpdatePrompt(item.id, e.target.value)}
                        placeholder="Generated prompt will appear here. You can edit it before generating."
                        disabled={item.status === 'analyzing' || item.status === 'generating'}
                        className="resize-none h-[140px] md:h-full min-h-[140px] text-sm border-primary/20 focus:border-primary"
                      />
                    </div>
                    
                    {/* Generated design / actions */}
                    <div className="flex flex-col gap-2">
                      <div className="bg-white/50 dark:bg-gray-900/50 rounded-md overflow-hidden aspect-square border border-primary/10 flex items-center justify-center relative">
                        {item.designUrl ? (
                          <img 
                            src={item.designUrl} 
                            alt="Generated design" 
                            className="w-full h-full object-contain p-2"
                            style={{ 
                              backgroundColor: item.isBackgroundRemoved ? 'white' : 'transparent',
                              borderRadius: item.isBackgroundRemoved ? '0.25rem' : '0'
                            }}
                          />
                        ) : item.status === 'generating' ? (
                          <div className="text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground">Generating...</p>
                          </div>
                        ) : (
                          <div className="text-center p-4">
                            <ImageIcon className="h-8 w-8 text-primary/40 mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground">
                              {item.status === 'ready' 
                                ? "Ready to generate" 
                                : item.status === 'failed'
                                ? "Generation failed"
                                : "Process image first"}
                            </p>
                          </div>
                        )}
                        
                        {/* Processing indicators */}
                        {processingItemId === item.id && (
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg">
                              <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-1" />
                              <p className="text-xs">Removing background...</p>
                            </div>
                          </div>
                        )}
                        
                        {enhancingItemId === item.id && (
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg">
                              <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-1" />
                              <p className="text-xs">Enhancing image...</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Status indicators */}
                        {item.status === 'completed' && (
                          <div className="absolute top-2 left-2 flex gap-1">
                            {item.isBackgroundRemoved && (
                              <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200 px-1 py-0 h-4">
                                <Image className="h-2.5 w-2.5 mr-0.5" />
                                BG Removed
                              </Badge>
                            )}
                            {item.isEnhanced && (
                              <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 px-1 py-0 h-4">
                                <Zap className="h-2.5 w-2.5 mr-0.5" />
                                Enhanced
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-1">
                        {item.status === 'completed' && (
                          <>
                            {/* Background removal button/dropdown */}
                            {processingItemId === item.id ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={true}
                                className="text-xs p-0 h-7"
                              >
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Processing...
                              </Button>
                            ) : (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant={item.isBackgroundRemoved ? "outline" : "default"}
                                    className={`text-xs p-0 h-7 ${item.isBackgroundRemoved ? 'bg-green-50 text-green-700 border-green-200' : ''}`}
                                  >
                                    <Image className="h-3 w-3 mr-1" />
                                    {item.isBackgroundRemoved ? 'BG Removed' : 'Remove BG'}
                                    <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-56 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-xl rounded-md overflow-hidden"
                                >
                                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground border-b mb-1 bg-gray-50 dark:bg-gray-900">Background Removal Models</div>
                                  
                                  {item.isBackgroundRemoved && (
                                    <DropdownMenuItem 
                                      onClick={() => handleRemoveBackground(item.id, 'original')}
                                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 font-medium px-2 py-1.5 text-xs"
                                    >
                                      <Image className="h-3 w-3 mr-1" />
                                      <span>Restore Background</span>
                                    </DropdownMenuItem>
                                  )}
                                  
                                  <div className="py-1 px-2 text-xs2 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 mb-1 flex items-start gap-1 border-b border-blue-100 dark:border-blue-900">
                                    <InfoIcon className="h-3 w-3 mt-0.5 flex-shrink-0 text-blue-500" />
                                    <span>Try different models for best results.</span>
                                  </div>
                                  
                                  <div className="py-1 bg-white dark:bg-gray-950 max-h-[200px] overflow-y-auto">
                                    {Object.entries(backgroundRemovalModels).map(([key, model]: [string, { id: string, name: string }]) => {
                                      // Check if this is a recommended model
                                      const isRecommended = key === '851-labs/background-remover' || 
                                                        key === 'men1scus/birefnet' ||
                                                        key === 'smoretalk/rembg-enhance';
                                      
                                      return (
                                        <DropdownMenuItem 
                                          key={key}
                                          onClick={() => selectModelForItem(item.id, key)}
                                          className={`cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1.5 text-xs ${
                                            item.activeModel === model.id ? 'bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-300' : ''
                                          } ${isRecommended ? 'font-medium' : ''}`}
                                        >
                                          <Wand2 className={`mr-1 h-3 w-3 ${isRecommended ? 'text-yellow-500' : ''}`} />
                                          <span>{model.name}</span>
                                          {item.activeModel === model.id && <span className="ml-1 text-xs">(Current)</span>}
                                          {isRecommended && <span className="ml-auto text-xs2 text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 px-1 py-0 rounded font-medium">★</span>}
                                        </DropdownMenuItem>
                                      );
                                    })}
                                  </div>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                            
                            {/* Enhance button */}
                            <Button
                              size="sm"
                              variant={item.isEnhanced ? "outline" : "default"}
                              disabled={processingItemId !== null || enhancingItemId !== null}
                              className={`text-xs p-0 h-7 ${item.isEnhanced ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-blue-600 hover:bg-blue-700'}`}
                              onClick={() => handleEnhanceImage(item.id)}
                            >
                              <Zap className="h-3 w-3 mr-1" />
                              {item.isEnhanced ? 'Enhanced' : 'Enhance'}
                            </Button>
                          </>
                        )}
                      </div>
                      
                      <Button
                        size="sm"
                        variant={item.status === 'ready' ? "default" : "outline"}
                        disabled={
                          item.status === 'pending' || 
                          item.status === 'analyzing' || 
                          item.status === 'generating' || 
                          !item.prompt.trim() ||
                          isGeneratingAll
                        }
                        className="w-full"
                        onClick={() => {
                          // Individual generate handler - use the new function
                          handleGenerateSingle(item.id);
                        }}
                      >
                        {item.status === 'generating' ? (
                          <>
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            Generating...
                          </>
                        ) : item.status === 'completed' ? (
                          <>
                            <Sparkles className="mr-1 h-3 w-3" />
                            Regenerate
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-1 h-3 w-3" />
                            Generate Design
                          </>
                        )}
                      </Button>
                      
                      {item.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full border-primary/20"
                          onClick={() => {
                            if (item.designUrl) {
                              // Quick download this specific design
                              downloadImage(
                                item.designUrl, 
                                'png', 
                                `tshirt-${item.id}`
                              );
                            }
                          }}
                        >
                          <Download className="mr-1 h-3 w-3" />
                          Download PNG
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}; 