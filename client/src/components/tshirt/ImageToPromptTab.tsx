import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Image as ImageIcon, 
  Wand2, 
  Sparkles, 
  Loader2, 
  Download, 
  FileText,
  X,
  PanelRight
} from 'lucide-react';
import { toast } from 'sonner';
import { generateImage, downloadImage, imageToPrompt, saveToHistory } from '@/services/ideogramService';

export const ImageToPromptTab = () => {
  // State management
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDesign, setGeneratedDesign] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input changed');
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 5MB.');
      return;
    }
    
    // Validate file type
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
    
    try {
      console.log('Calling generateImage with prompt:', prompt);
      // Generate design with Ideogram API
      const imageUrl = await generateImage({
        prompt,
        transparentBackground: true,
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
    if (!generatedDesign) {
      toast.error('No design to download');
      return;
    }
    
    setIsDownloading(true);
    
    try {
      // Format filename using the first few words of the prompt
      const promptWords = prompt.split(' ').slice(0, 4).join('-').toLowerCase();
      const filename = `tshirt-${promptWords}-${Date.now()}`;
      
      console.log('Downloading image with filename:', filename);
      await downloadImage(generatedDesign, format, filename);
      toast.success(`Design downloaded as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error downloading design:', error);
      toast.error('Failed to download design');
    } finally {
      setIsDownloading(false);
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

  console.log('Current state:', { 
    hasUploadedImage: !!uploadedImage, 
    hasPrompt: !!prompt, 
    hasGeneratedDesign: !!generatedDesign,
    isAnalyzing,
    isGenerating
  });

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
                  Click to browse or drag and drop<br/>JPG, PNG, or WEBP (max 5MB)
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
            {generatedDesign ? (
              <img 
                src={generatedDesign} 
                alt="Generated T-shirt design" 
                className="w-full h-full object-contain p-4"
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
          </div>
          
          {generatedDesign && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 border-primary/20 hover:bg-primary/5 hover:text-primary"
                  onClick={() => handleDownload('png')}
                  disabled={isDownloading}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download as PNG
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 border-primary/20 hover:bg-primary/5 hover:text-primary"
                  onClick={() => handleDownload('pdf')}
                  disabled={isDownloading}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Download as PDF
                </Button>
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