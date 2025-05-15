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
  Wand2
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  generateImage, 
  downloadImage, 
  saveToHistory, 
  removeBackground,
  backgroundRemovalModels
} from '@/services/ideogramService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const PromptToDesignTab = () => {
  // State management
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedUrls, setProcessedUrls] = useState<Record<number, string>>({});
  const [variationCount, setVariationCount] = useState('1');
  const [size, setSize] = useState('merch');
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  
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

  // Handle generating the design
  const handleGenerateDesign = async () => {
    console.log('Generate button clicked with prompt:', prompt);
    
    if (!prompt.trim()) {
      toast.error('Please enter a prompt first');
      return;
    }

    setIsGenerating(true);
    setImageUrls([]);
    setProcessedUrls({});
    
    try {
      // Convert variationCount to number
      const count = parseInt(variationCount, 10);
      
      // Generate multiple images based on the chosen variation count
      const generatedUrls: string[] = [];
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
          generatedUrls.push(imageUrl);
          
          // Save to history
          saveToHistory({
            prompt,
            imageUrl,
            thumbnail: imageUrl,
            isFavorite: false
          });
        }
      }
      
      if (generatedUrls.length > 0) {
        setImageUrls(generatedUrls);
        setCurrentIndex(0);
        toast.dismiss(toastId);
        toast.success(`${generatedUrls.length} T-shirt design${generatedUrls.length > 1 ? 's' : ''} generated successfully!`);
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
    const currentUrl = processedUrls[currentIndex] || imageUrls[currentIndex];
    console.log('Download button clicked for image:', currentUrl);
    if (!currentUrl) {
      toast.error('No design to download');
      return;
    }
    
    setIsDownloading(true);
    const toastId = toast.loading(`Processing download...`);
    
    try {
      // Format filename using the first few words of the prompt
      const promptWords = prompt.split(' ').slice(0, 4).join('-').toLowerCase();
      const filename = `tshirt-${promptWords}-${Date.now()}`;
      
      console.log('Downloading image with filename:', filename);
      await downloadImage(currentUrl, 'png', filename);
      
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
    const currentUrl = imageUrls[currentIndex];
    if (!currentUrl) {
      toast.error('No design to process');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Call the background removal service with the selected model
      const processedImageUrl = await removeBackground(currentUrl, modelId);
      
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
            document.body.removeChild(imgPreview);
          }
          resolve(false);
        }, 3000);
      });
      
      // Save the processed URL for this index
      setProcessedUrls(prev => ({
        ...prev,
        [currentIndex]: processedImageUrl
      }));
      
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

  // Change the currently displayed design
  const navigateDesign = (direction: 'prev' | 'next') => {
    if (imageUrls.length <= 1) return;
    
    if (direction === 'prev') {
      setCurrentIndex(prev => (prev === 0 ? imageUrls.length - 1 : prev - 1));
    } else {
      setCurrentIndex(prev => (prev === imageUrls.length - 1 ? 0 : prev + 1));
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
    setSelectedModel(model.id);
    handleRemoveBackground(model.id);
  };

  // Check if the current design has background removed
  const isCurrentDesignProcessed = processedUrls[currentIndex] !== undefined;

  console.log('Current prompt value:', prompt);
  console.log('Current image URLs:', imageUrls);
  console.log('Processed URLs:', processedUrls);

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
            {imageUrls.length > 0 ? (
              <div className="relative w-full h-full">
                <img 
                  src={isCurrentDesignProcessed ? processedUrls[currentIndex] : imageUrls[currentIndex]} 
                  alt="Generated T-shirt design" 
                  className="w-full h-full object-contain p-4"
                />
                
                {/* Navigation buttons for multiple designs */}
                {imageUrls.length > 1 && (
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
                      {currentIndex + 1} / {imageUrls.length}
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
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                      <p className="text-sm">Removing background...</p>
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
          
          {imageUrls.length > 0 && (
            <div className="space-y-4 relative z-[105]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="border-primary/20 hover:bg-primary/5 hover:text-primary relative z-[106]"
                  onClick={handleDownload}
                  disabled={isDownloading}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PNG
                </Button>
                
                {isCurrentDesignProcessed ? (
                  <Button
                    variant="outline"
                    className="border-primary/20 bg-green-50 hover:bg-green-100 text-green-700 relative z-[106]"
                    onClick={handleDownload}
                    disabled={isDownloading}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Transparent PNG
                  </Button>
                ) : isProcessing ? (
                  <Button
                    variant="outline"
                    className="border-primary/20 hover:bg-primary/5 hover:text-primary relative z-[106]"
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
                        className="border-primary/20 hover:bg-primary/5 hover:text-primary relative z-[106] w-full flex justify-between"
                      >
                        <div className="flex items-center">
                          <Image className="mr-2 h-4 w-4" />
                          <span>Remove Background</span>
                        </div>
                        <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      {Object.entries(backgroundRemovalModels).map(([key, model]) => (
                        <DropdownMenuItem 
                          key={key}
                          onClick={() => selectModel(key)}
                          className="cursor-pointer"
                        >
                          <Wand2 className="mr-2 h-4 w-4" />
                          <span>{model.name}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              
              {!isCurrentDesignProcessed && !isProcessing && (
                <div className="bg-muted/30 p-2 rounded text-xs text-muted-foreground">
                  <p className="flex items-center gap-1">
                    <Image className="h-3 w-3" />
                    Click "Remove Background" to choose from multiple AI models
                  </p>
                </div>
              )}
              
              <div className="text-xs text-muted-foreground">
                <p className="flex items-center gap-1">
                  <PanelRight className="h-3 w-3" />
                  Your design will be saved to the history panel below.
                  {isCurrentDesignProcessed && (
                    <span className="ml-1 text-green-600">Transparent background ready!</span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 