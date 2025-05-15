import React, { useState } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Download, 
  Loader2, 
  ImageIcon,
  LightbulbIcon,
  PanelRight,
  Image,
  ChevronDown,
  Wand2,
  Zap,
  InfoIcon,
  CheckIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  generateImage, 
  downloadImage, 
  saveToHistory, 
  removeBackground,
  enhanceImage,
  backgroundRemovalModels
} from '@/services/ideogramService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const PromptToDesignTab = () => {
  // Core state variables
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  
  // Simplified image state management
  const [images, setImages] = useState<Array<{
    id: number;
    originalUrl: string;  // Original Ideogram output (never changes)
    baseUrl: string;      // Current working version (source of truth)
    isEnhanced: boolean;  // Whether the image has been enhanced
    isBackgroundRemoved: boolean; // Whether background has been removed
  }>>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeModel, setActiveModel] = useState<string | null>(null);

  // Configuration state
  const [variationCount, setVariationCount] = useState('1');
  const [size, setSize] = useState('merch');

  // Size presets mapping
  const sizePresets = {
    'merch': { width: 4500, height: 5400, label: 'Merch by Amazon (4500×5400)' },
    'standard': { width: 2000, height: 2400, label: 'Standard (2000×2400)' },
    'square': { width: 4500, height: 4500, label: 'Square (4500×4500)' },
    'custom': { width: null, height: null, label: 'Custom Size' }
  };

  // Sample prompts for inspiration
  const samplePrompts = [
    "A cat astronaut floating in space with stars background",
    "Vintage motorcycle with roses in the background",
    "Abstract geometric mountain landscape at sunset",
    "Cute cartoon dinosaur with skateboard"
  ];

  // Get current image data
  const getCurrentImage = () => images[currentIndex] || null;
  
  // Utility to update current image
  const updateCurrentImage = (updates: Partial<typeof images[0]>) => {
    const updatedImages = [...images];
    updatedImages[currentIndex] = {
      ...updatedImages[currentIndex],
      ...updates
    };
    setImages(updatedImages);
  };

  // Handle generating the design
  const handleGenerateDesign = async () => {
    console.log('Generate button clicked with prompt:', prompt);
    
    if (!prompt.trim()) {
      toast.error('Please enter a prompt first');
      return;
    }

    setIsGenerating(true);
    
    // Reset all state for a new design generation
    setImages([]);
    setCurrentIndex(0);
    setActiveModel(null);
    
    try {
      // Convert variationCount to number
      const count = parseInt(variationCount, 10);
      
      // Generate multiple images based on the chosen variation count
      const generatedImages: typeof images = [];
      const toastId = toast.loading(`Generating ${count} design${count > 1 ? 's' : ''}...`);
      
      for (let i = 0; i < count; i++) {
        // Generate image with Ideogram API
        console.log(`Generating design ${i+1} of ${count} with:`, { prompt, size });
        const imageUrl = await generateImage({
          prompt,
          format: size
        });
        
        if (imageUrl) {
          console.log(`Generated image ${i+1} URL:`, imageUrl);
          
          // Add to our images array with proper structure
          generatedImages.push({
            id: i,
            originalUrl: imageUrl,
            baseUrl: imageUrl, // Initially, base = original
            isEnhanced: false,
            isBackgroundRemoved: false
          });
          
          // Save to history
          saveToHistory({
            prompt,
            imageUrl,
            thumbnail: imageUrl,
            isFavorite: false
          });
        }
      }
      
      if (generatedImages.length > 0) {
        setImages(generatedImages);
        setCurrentIndex(0);
        toast.dismiss(toastId);
        toast.success(`${generatedImages.length} T-shirt design${generatedImages.length > 1 ? 's' : ''} generated successfully!`);
      } else {
        throw new Error('Failed to generate any images');
      }
    } catch (error) {
      console.error('Error generating design:', error);
      toast.error('Failed to generate design. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Handle downloading the image
  const handleDownload = async () => {
    const currentImage = getCurrentImage();
    if (!currentImage) {
      toast.error('No design to download');
      return;
    }
    
    console.log('Download button clicked for image:', currentImage.baseUrl.substring(0, 100));
    setIsDownloading(true);
    const toastId = toast.loading(`Processing download...`);
    
    try {
      // Format filename using the first few words of the prompt
      const promptWords = prompt.split(' ').slice(0, 4).join('-').toLowerCase();
      const filename = `tshirt-${promptWords}-${Date.now()}`;
      
      // Always download the current baseUrl (source of truth)
      console.log('Downloading image with filename:', filename);
      await downloadImage(currentImage.baseUrl, 'png', filename);
      
      // Ensure toast is dismissed before showing success
      setTimeout(() => {
        toast.dismiss(toastId);
        toast.success(`Design downloaded as PNG`);
      }, 1000);
    } catch (error) {
      console.error('Error downloading design:', error);
      toast.dismiss(toastId);
      toast.error('Failed to download design');
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle removing background
  const handleRemoveBackground = async (modelId: string | null = null) => {
    const currentImage = getCurrentImage();
    if (!currentImage) {
      toast.error('No design to process');
      return;
    }
    
    console.log('Starting background removal process');
    console.log('Current image state:', currentImage);
    
    setIsProcessing(true);
    setActiveModel(modelId);
    
    try {
      // If reverting to original, reset to the original image
      if (modelId === 'original') {
        updateCurrentImage({
          baseUrl: currentImage.originalUrl,
          isBackgroundRemoved: false,
          // Keep enhanced status if it was enhanced
          // We're just restoring the background
        });
        
        toast.success('Restored background');
        setIsProcessing(false);
        setActiveModel(null);
        return;
      }
      
      // Make the API call with the current baseUrl
      console.log('Sending image to background removal API:', currentImage.baseUrl.substring(0, 100));
      const processedImageUrl = await removeBackground(currentImage.baseUrl, modelId);
      
      // Preview the image immediately before saving it
      // This ensures the user can see the result with transparency
      const imgPreview = document.createElement('img');
      imgPreview.src = processedImageUrl;
      imgPreview.style.display = 'none';
      document.body.appendChild(imgPreview);
      
      // Make sure image loads before we show it to ensure transparency is visible
      await new Promise((resolve) => {
        imgPreview.onload = () => {
          document.body.removeChild(imgPreview);
          resolve(true);
        };
        imgPreview.onerror = () => {
          document.body.removeChild(imgPreview);
          resolve(false);
        };
        
        // Timeout just in case
        setTimeout(() => {
          if (document.body.contains(imgPreview)) {
            console.warn("Preview load timed out");
            document.body.removeChild(imgPreview);
          }
          resolve(false);
        }, 3000);
      });
      
      // Update the base image URL with the background-removed version
      updateCurrentImage({
        baseUrl: processedImageUrl,
        isBackgroundRemoved: true
      });
      
      // Show success message with model info
      let modelName = "Standard";
      if (modelId) {
        // Safely access the model by checking if the key exists
        const modelKeys = Object.keys(backgroundRemovalModels);
        for (const key of modelKeys) {
          if (backgroundRemovalModels[key as keyof typeof backgroundRemovalModels].id === modelId) {
            modelName = backgroundRemovalModels[key as keyof typeof backgroundRemovalModels].name;
            break;
          }
        }
      }
      
      toast.success(`Background removed successfully!`, {
        duration: 4000,
        description: `Using ${modelName} model`
      });
    } catch (error) {
      console.error('Error removing background:', error);
      toast.error('Failed to remove background');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle enhancing the image
  const handleEnhanceImage = async () => {
    const currentImage = getCurrentImage();
    if (!currentImage) {
      toast.error('No design to enhance');
      return;
    }
    
    // Use the current baseUrl as the source
    console.log('Enhancing current base image:', currentImage.baseUrl.substring(0, 100));
    setIsEnhancing(true);
    
    try {
      // Call the enhancement service
      const enhancedImageUrl = await enhanceImage(currentImage.baseUrl);
      console.log('Enhancement successful, new image URL:', enhancedImageUrl.substring(0, 100));
      
      // Update the base image with the enhanced version
      updateCurrentImage({
        baseUrl: enhancedImageUrl,
        isEnhanced: true
      });
      
      toast.success('Image enhanced successfully!');
    } catch (error) {
      console.error('Error enhancing image:', error);
      toast.error('Failed to enhance image');
    } finally {
      setIsEnhancing(false);
    }
  };

  // Reset image to original (clear all processing)
  const resetToOriginal = () => {
    const currentImage = getCurrentImage();
    if (!currentImage) return;
    
    updateCurrentImage({
      baseUrl: currentImage.originalUrl,
      isEnhanced: false,
      isBackgroundRemoved: false
    });
    
    toast.success('Reset to original image');
  };

  // Change the currently displayed design
  const navigateDesign = (direction: 'prev' | 'next') => {
    if (images.length <= 1) return;
    
    if (direction === 'prev') {
      setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
    } else {
      setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
    }
  };

  // Use a sample prompt
  const useSamplePrompt = (sample: string) => {
    console.log('Sample prompt selected:', sample);
    setPrompt(sample);
  };

  // Select a background removal model
  const selectModel = (modelKey: string) => {
    console.log('Selected model:', modelKey);
    // Use type assertion to safely access the model
    const model = backgroundRemovalModels[modelKey as keyof typeof backgroundRemovalModels];
    handleRemoveBackground(model.id);
  };

  // Get current image processing states
  const currentImage = getCurrentImage();
  const isCurrentImageEnhanced = currentImage?.isEnhanced || false;
  const isCurrentImageProcessed = currentImage?.isBackgroundRemoved || false;

  console.log('Current prompt value:', prompt);
  console.log('Current images state:', images);
  
  return (
    <div className="space-y-6 relative z-[103]" style={{ pointerEvents: 'auto' }}>
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left column - Prompt and settings */}
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                1
              </span>
              Describe Your Design
            </h3>
            <div className="space-y-2 relative z-[105]">
              <Textarea
                id="prompt"
                placeholder="Describe your t-shirt design in detail... (e.g., 'A cute cartoon cat with sunglasses, minimalist style with blue accent colors')"
                className="min-h-[180px] resize-none border-primary/20 focus:border-primary relative z-[105]"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <div className="text-xs text-muted-foreground flex justify-between">
                <span>Be specific about style, colors, and layout for best results.</span>
                <Badge variant="outline" className="ml-auto">
                  {prompt.length}/500
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Inspiration section */}
          <div className="border border-primary/10 rounded-lg p-4 bg-primary/5 relative z-[104]">
            <div className="flex items-center gap-2 mb-3 text-primary">
              <LightbulbIcon className="h-4 w-4" />
              <h4 className="font-medium">Need inspiration?</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {samplePrompts.map((sample, index) => (
                <Button 
                  key={index} 
                  variant="outline" 
                  size="sm" 
                  onClick={() => useSamplePrompt(sample)}
                  className="bg-white dark:bg-gray-800 border-primary/20 hover:border-primary relative z-[106]"
                >
                  {sample.slice(0, 20)}...
                </Button>
              ))}
            </div>
          </div>
          
          {/* Settings section */}
          <div className="space-y-3 relative z-[104]">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                2
              </span>
              Customize Settings
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2 relative z-[105]">
                <Label htmlFor="size" className="text-sm font-medium">Output Size</Label>
                <Select 
                  value={size} 
                  onValueChange={setSize}
                >
                  <SelectTrigger id="size" className="border-primary/20 focus:border-primary">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(sizePresets).map(([key, preset]) => (
                      <SelectItem key={key} value={key}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 relative z-[105]">
                <Label htmlFor="variationCount" className="text-sm font-medium">Variations</Label>
                <Select 
                  value={variationCount} 
                  onValueChange={setVariationCount}
                >
                  <SelectTrigger id="variationCount" className="border-primary/20 focus:border-primary">
                    <SelectValue placeholder="How many?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Design</SelectItem>
                    <SelectItem value="2">2 Designs</SelectItem>
                    <SelectItem value="3">3 Designs</SelectItem>
                    <SelectItem value="4">4 Designs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button 
              onClick={handleGenerateDesign} 
              disabled={isGenerating || !prompt.trim()}
              className="w-full mt-4 bg-primary hover:bg-primary/90 relative z-[106]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Design{parseInt(variationCount) > 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
        
        {/* Right column - Preview */}
        <div className="space-y-6 relative z-[104]">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              3
            </span>
            Preview & Download
          </h3>
          <div className="border border-primary/20 rounded-xl overflow-hidden bg-white/50 dark:bg-gray-900/50 aspect-square shadow-sm">
            {images.length > 0 ? (
              <div className="relative w-full h-full">
                <img 
                  src={currentImage?.baseUrl} 
                  alt="Generated T-shirt design" 
                  className="w-full h-full object-contain p-4"
                  style={{ 
                    backgroundColor: isCurrentImageProcessed ? 'white' : 'transparent',
                    borderRadius: isCurrentImageProcessed ? '0.5rem' : '0'
                  }}
                />
                
                {/* Navigation buttons for multiple designs */}
                {images.length > 1 && (
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateDesign('prev')}
                      className="bg-white/80 dark:bg-gray-800/80 h-8 w-8 p-0 rounded-full"
                    >
                      &lt;
                    </Button>
                    <span className="bg-white/80 dark:bg-gray-800/80 px-3 py-1 rounded-full text-xs">
                      {currentIndex + 1} / {images.length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateDesign('next')}
                      className="bg-white/80 dark:bg-gray-800/80 h-8 w-8 p-0 rounded-full"
                    >
                      &gt;
                    </Button>
                  </div>
                )}
                
                {/* Show loading overlay when processing */}
                {(isProcessing || isEnhancing) && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                      <p className="text-sm">{isProcessing ? "Removing background..." : "Enhancing image..."}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : isGenerating ? (
              <div className="h-full flex flex-col items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Creating your design...</p>
                <p className="text-xs text-muted-foreground mt-2">This may take 15-30 seconds</p>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-4 text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <ImageIcon className="h-10 w-10 text-primary/50" />
                </div>
                <p className="text-muted-foreground font-medium">Your design preview will appear here</p>
                <p className="text-xs text-muted-foreground mt-2">Generate a design to get started</p>
              </div>
            )}
          </div>
          
          {images.length > 0 && (
            <div className="space-y-4 relative z-[105]">
              {/* Image Status Indicator */}
              <div className="flex items-center gap-2 text-xs mb-1">
                <div className="flex items-center">
                  <span className="font-medium mr-1">Status:</span>
                  <div className="flex gap-1">
                    {isCurrentImageEnhanced && (
                      <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200 flex items-center">
                        <Zap className="w-3 h-3 mr-1" /> Enhanced
                      </span>
                    )}
                    {isCurrentImageProcessed && (
                      <span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded border border-green-200 flex items-center">
                        <Image className="w-3 h-3 mr-1" /> Background Removed
                      </span>
                    )}
                    {!isCurrentImageEnhanced && !isCurrentImageProcessed && (
                      <span className="px-1.5 py-0.5 bg-gray-50 text-gray-700 rounded border border-gray-200">
                        Original
                      </span>
                    )}
                  </div>
                </div>
                
                {(isCurrentImageEnhanced || isCurrentImageProcessed) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="ml-auto h-6 text-xs text-muted-foreground"
                    onClick={resetToOriginal}
                  >
                    Reset to Original
                  </Button>
                )}
              </div>
              
              {/* First Row: Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                {/* Background Removal Button/Dropdown */}
                {isProcessing ? (
                  <Button
                    variant="outline"
                    className="border-primary/20 relative z-[106]"
                    disabled={true}
                  >
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Removing Background...
                  </Button>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className={`border-primary/20 hover:bg-primary/5 relative z-[106] w-full flex justify-between ${isCurrentImageProcessed ? 'bg-green-50 hover:bg-green-100 text-green-700' : ''}`}
                      >
                        <div className="flex items-center">
                          <Image className="mr-2 h-4 w-4" />
                          <span>{isCurrentImageProcessed ? 'Try Another Model' : 'Remove Background'}</span>
                        </div>
                        <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="end" 
                      className="w-60 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-xl rounded-md overflow-hidden"
                      style={{ backdropFilter: 'blur(16px)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
                    >
                      <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground border-b mb-1 bg-gray-50 dark:bg-gray-900">Background Removal Models</div>
                      
                      {isCurrentImageProcessed && (
                        <DropdownMenuItem 
                          onClick={() => handleRemoveBackground('original')}
                          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 font-medium px-3 py-2 bg-white dark:bg-gray-950"
                        >
                          <Image className="mr-2 h-4 w-4" />
                          <span>Restore Background</span>
                        </DropdownMenuItem>
                      )}
                      
                      <div className="py-1.5 px-3 text-xs bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 mb-1 flex items-start gap-2 border-b border-blue-100 dark:border-blue-900">
                        <InfoIcon className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-blue-500" />
                        <span>For best results, try "Precision Focus" or "Pro Edge Detection" models.</span>
                      </div>
                      
                      <div className="py-1 bg-white dark:bg-gray-950 max-h-[300px] overflow-y-auto">
                        {Object.entries(backgroundRemovalModels).map(([key, model]: [string, { id: string, name: string }]) => {
                          // Check if this is a recommended model
                          const isRecommended = key === '851-labs/background-remover' || 
                                             key === 'men1scus/birefnet' ||
                                             key === 'codeplugtech/background_remover';
                          
                          return (
                            <DropdownMenuItem 
                              key={key}
                              onClick={() => selectModel(key)}
                              className={`cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-2 ${
                                activeModel === model.id ? 'bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-300' : ''
                              } ${isRecommended ? 'font-medium' : ''}`}
                            >
                              <Wand2 className={`mr-2 h-4 w-4 ${isRecommended ? 'text-yellow-500' : ''}`} />
                              <span>{model.name}</span>
                              {activeModel === model.id && <span className="ml-1 text-xs">(Current)</span>}
                              {isRecommended && <span className="ml-auto text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 px-1.5 py-0.5 rounded font-medium">★ Recommended</span>}
                            </DropdownMenuItem>
                          );
                        })}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                
                {/* Enhance Image Button */}
                <Button
                  variant={isCurrentImageEnhanced ? "outline" : "default"}
                  className={`${isCurrentImageEnhanced ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-blue-600 hover:bg-blue-700'} relative z-[106]`}
                  onClick={handleEnhanceImage}
                  disabled={isEnhancing || isProcessing}
                >
                  {isEnhancing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enhancing...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      {isCurrentImageEnhanced ? 'Re-Enhance' : 'Enhance Image'}
                    </>
                  )}
                </Button>
              </div>
              
              {/* Download Button */}
              <Button
                variant="default"
                className={`w-full ${
                  isCurrentImageProcessed || isCurrentImageEnhanced
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                } text-white font-medium`}
                onClick={handleDownload}
                disabled={isDownloading || isProcessing || isEnhancing}
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download Image
                  </>
                )}
              </Button>
              
              <div className="bg-muted/30 p-2 rounded text-xs text-muted-foreground">
                <p className="flex items-start gap-1">
                  <InfoIcon className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>All operations</strong> use the current state of your image. For best results, enhance first, then remove background.
                    {(isCurrentImageEnhanced || isCurrentImageProcessed) && 
                      " Your design has been " + 
                      (isCurrentImageProcessed && isCurrentImageEnhanced ? "enhanced with background removed" : 
                       isCurrentImageProcessed ? "processed with background removal" : 
                       "enhanced")}
                  </span>
                </p>
              </div>
              
              <div className="text-xs text-muted-foreground">
                <p className="flex items-center gap-1">
                  <PanelRight className="h-3 w-3" />
                  Your design will be saved to the history panel below.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 