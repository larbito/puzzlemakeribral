import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  ImageIcon, 
  Wand2, 
  Sparkles, 
  Loader2, 
  Download, 
  FileText,
  X,
  PanelRight,
  Code,
  Image,
  Zap,
  InfoIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { generateImage, downloadImage, imageToPrompt, saveToHistory, removeBackground, enhanceImage } from '@/services/ideogramService';
import { cn } from '@/lib/utils';

export const ImageToPromptTab = () => {
  // State management
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDesign, setGeneratedDesign] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [processedDesign, setProcessedDesign] = useState<string | null>(null);
  const [enhancedDesign, setEnhancedDesign] = useState<string | null>(null);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input changed');
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Only validate file type, not size
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed.');
      return;
    }
    
    console.log('File selected:', file.name, 'Size:', (file.size / 1024).toFixed(2), 'KB');
    setUploadedImage(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };
  
  // Handle image analysis with OpenAI to generate prompt
  const handleAnalyzeImage = async () => {
    console.log('Analyze image button clicked');
    if (!uploadedImage) {
      toast.error('Please upload an image first');
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      console.log('Calling imageToPrompt with file:', uploadedImage.name);
      // Call OpenAI to analyze image
      const generatedPrompt = await imageToPrompt(uploadedImage, 'tshirt');
      console.log('Generated prompt:', generatedPrompt);
      setPrompt(generatedPrompt);
      toast.success('Prompt generated from image!');
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast.error('Failed to analyze image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Generate design from prompt
  const handleGenerateDesign = async () => {
    console.log('Generate design button clicked');
    if (!prompt.trim()) {
      toast.error('Please generate or enter a prompt first');
      return;
    }
    
    setIsGenerating(true);
    // Reset processed design when generating a new design
    setProcessedDesign(null);
    setEnhancedDesign(null);
    
    try {
      console.log('Calling generateImage with prompt:', prompt);
      // Generate design with Ideogram API
      const imageUrl = await generateImage({
        prompt,
        format: 'merch'
      });
      
      if (imageUrl) {
        console.log('Generated design URL:', imageUrl);
        setGeneratedDesign(imageUrl);
        
        // Save to history
        saveToHistory({
          prompt,
          imageUrl,
          thumbnail: imageUrl,
          isFavorite: false
        });
        
        toast.success('T-shirt design generated successfully!');
      } else {
        throw new Error('Failed to generate image');
      }
    } catch (error) {
      console.error('Error generating design:', error);
      toast.error('Failed to generate design. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Handle downloading the design
  const handleDownload = async (format = 'png') => {
    console.log('Download button clicked for format:', format);
    if (!generatedDesign && !processedDesign && !enhancedDesign) {
      toast.error('No design to download');
      return;
    }
    
    setIsDownloading(true);
    const toastId = toast.loading('Processing download...');
    
    try {
      // Format filename using the first few words of the prompt
      const promptWords = prompt.split(' ').slice(0, 4).join('-').toLowerCase();
      const filename = `tshirt-${promptWords}-${Date.now()}`;
      
      // Use the best available image with priority order:
      // 1. Image with background removed and enhanced
      // 2. Image with only background removed
      // 3. Image with only enhancement 
      // 4. Original generated image
      let imageToDownload = enhancedDesign || processedDesign || generatedDesign;
      
      console.log('Downloading image with filename:', filename);
      await downloadImage(imageToDownload!, format, filename);
      
      // Dismiss toast after a short delay
      setTimeout(() => {
        toast.dismiss(toastId);
        toast.success(`Design downloaded as ${format.toUpperCase()}`);
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
  const handleRemoveBackground = async () => {
    // Always use the best available image
    const imageToProcess = enhancedDesign || generatedDesign;
    
    if (!imageToProcess) {
      toast.error('No design to process');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Call the background removal service
      const processedImageUrl = await removeBackground(imageToProcess);
      
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
      
      // Save the processed image URL
      setProcessedDesign(processedImageUrl);
      
      // If we previously enhanced, we need to clear the enhanced flag since
      // the background removal was done on the non-enhanced or already enhanced version
      if (enhancedDesign && imageToProcess === enhancedDesign) {
        // We're removing background from an enhanced image 
        // Set enhanced design to null to reflect that our current image is only background removed
        setEnhancedDesign(null);
      }
      
      toast.success('Background removed successfully!', {
        duration: 4000,
        description: 'Your design now has a transparent background'
      });
    } catch (error) {
      console.error('Error removing background:', error);
      toast.error('Failed to remove background');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle enhancing image
  const handleEnhanceImage = async () => {
    // Use processed image if available, otherwise the original
    const imageToEnhance = processedDesign || generatedDesign;
    
    if (!imageToEnhance) {
      toast.error('No design to enhance');
      return;
    }
    
    setIsEnhancing(true);
    
    try {
      // Call the enhancement service
      const enhancedImageUrl = await enhanceImage(imageToEnhance);
      
      // Save the enhanced image URL
      setEnhancedDesign(enhancedImageUrl);
      
      toast.success('Image enhanced successfully!', {
        duration: 4000,
        description: 'Your design quality has been improved'
      });
    } catch (error) {
      console.error('Error enhancing image:', error);
      toast.error('Failed to enhance image');
    } finally {
      setIsEnhancing(false);
    }
  };
  
  // Clear uploaded image
  const handleClearImage = () => {
    console.log('Clear image button clicked');
    setUploadedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Get the current display image
  const getCurrentDisplayImage = () => {
    if (processedDesign && enhancedDesign) {
      return enhancedDesign; // Both background removed and enhanced
    } else if (processedDesign) {
      return processedDesign; // Just background removed
    } else if (enhancedDesign) {
      return enhancedDesign; // Just enhanced
    } else {
      return generatedDesign; // Original
    }
  };
  
  // Check if design has been processed
  const isDesignProcessed = processedDesign !== null;
  const isDesignEnhanced = enhancedDesign !== null;

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left column - Image upload */}
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">1</span>
              Upload Your Image
            </h3>
            
            {!imagePreview ? (
              <div 
                className="border-2 border-dashed border-primary/20 rounded-lg p-8 text-center cursor-pointer hover:bg-primary/5 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-8 w-8 text-primary/60" />
                </div>
                <h3 className="text-lg font-medium mb-2">Upload an image</h3>
                <p className="text-muted-foreground mb-4">
                  Click to browse or drag and drop<br/>JPG, PNG, or other image files
                </p>
                <Button variant="outline" size="sm" className="border-primary/20">
                  Select Image
                </Button>
                <input 
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-lg overflow-hidden aspect-square bg-white dark:bg-gray-800 border border-primary/20">
                  <img 
                    src={imagePreview} 
                    alt="Uploaded image" 
                    className="w-full h-full object-contain"
                  />
                  <Button 
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 opacity-90"
                    onClick={handleClearImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <Button 
                  onClick={handleAnalyzeImage}
                  disabled={!uploadedImage || isAnalyzing}
                  className="w-full"
                  variant={isAnalyzing ? "outline" : "default"}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing Image...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate Prompt from Image
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">2</span>
              Edit Generated Prompt
            </h3>
            <div className="space-y-2">
              <Textarea
                id="generated-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={isAnalyzing ? "Analyzing image..." : "Generated prompt will appear here. You can edit it before generating your design."}
                className="min-h-[180px] resize-none border-primary/20 focus:border-primary"
                disabled={isAnalyzing}
              />
              <div className="text-xs text-muted-foreground flex justify-between">
                <span>Feel free to edit the prompt to refine your design.</span>
                <Badge variant="outline" className="ml-auto">{prompt.length}/500</Badge>
              </div>
            </div>
            
            <Button 
              onClick={handleGenerateDesign}
              disabled={!prompt.trim() || isGenerating}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Design...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate T-Shirt Design
                </>
              )}
            </Button>
          </div>
        </div>
        
        {/* Right column - Design preview */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">3</span>
            Preview & Download
          </h3>
          
          <div className="border border-primary/20 rounded-xl overflow-hidden bg-white/50 dark:bg-gray-900/50 aspect-square shadow-sm">
            {getCurrentDisplayImage() ? (
              // Show the best available image
              <img 
                src={getCurrentDisplayImage()} 
                alt="T-shirt design" 
                className="w-full h-full object-contain p-4"
                style={{ 
                  backgroundColor: isDesignProcessed ? 'white' : 'transparent',
                  borderRadius: isDesignProcessed ? '0.5rem' : '0'
                }}
              />
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
                <p className="text-xs text-muted-foreground mt-2">
                  {imagePreview 
                    ? "Click 'Generate T-Shirt Design' when ready" 
                    : "Upload an image to get started"}
                </p>
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
          
          {generatedDesign && (
            <div className="space-y-4">
              {/* Image Status Indicator */}
              <div className="flex items-center gap-2 text-xs mb-1">
                <div className="flex items-center">
                  <span className="font-medium mr-1">Status:</span>
                  <div className="flex gap-1">
                    {isDesignEnhanced && (
                      <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200 flex items-center">
                        <Zap className="w-3 h-3 mr-1" /> Enhanced
                      </span>
                    )}
                    {isDesignProcessed && (
                      <span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded border border-green-200 flex items-center">
                        <Image className="w-3 h-3 mr-1" /> Background Removed
                      </span>
                    )}
                    {!isDesignEnhanced && !isDesignProcessed && (
                      <span className="px-1.5 py-0.5 bg-gray-50 text-gray-700 rounded border border-gray-200">
                        Original
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {/* Background Removal Button */}
                <Button 
                  variant={isDesignProcessed ? "outline" : "default"}
                  className={`${isDesignProcessed ? 'bg-green-50 text-green-700 border-green-200' : ''}`}
                  onClick={handleRemoveBackground}
                  disabled={isProcessing || isEnhancing || !generatedDesign}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Removing Background...
                    </>
                  ) : (
                    <>
                      <Image className="mr-2 h-4 w-4" />
                      {isDesignProcessed ? "Re-Remove Background" : "Remove Background"}
                    </>
                  )}
                </Button>
                
                {/* Enhance Button */}
                <Button
                  variant={isDesignEnhanced ? "outline" : "default"}
                  className={`${isDesignEnhanced ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-blue-600 hover:bg-blue-700'}`}
                  onClick={handleEnhanceImage}
                  disabled={isProcessing || isEnhancing || !generatedDesign}
                >
                  {isEnhancing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enhancing...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      {isDesignEnhanced ? "Re-Enhance" : "Enhance Image"}
                    </>
                  )}
                </Button>
              </div>
              
              <Button 
                variant="default"
                className={`w-full ${
                  isDesignProcessed || isDesignEnhanced
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                } text-white font-medium`}
                onClick={() => handleDownload('png')}
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
                    <strong>All operations</strong> use the current state of your image. For best results, we recommend <strong>removing the background first, then enhancing</strong>. This workflow maintains the highest quality in the final image.
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