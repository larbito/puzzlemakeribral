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
  Image as ImageIcon, 
  Wand2, 
  Sparkles, 
  Loader2, 
  Download, 
  FileText,
  X
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
    
    setUploadedImage(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };
  
  // Handle image analysis with OpenAI to generate prompt
  const handleAnalyzeImage = async () => {
    if (!uploadedImage) {
      toast.error('Please upload an image first');
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      // Call OpenAI to analyze image
      const generatedPrompt = await imageToPrompt(uploadedImage, 'tshirt');
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
    if (!prompt.trim()) {
      toast.error('Please generate or enter a prompt first');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Generate design with Ideogram API
      const imageUrl = await generateImage({
        prompt,
        transparentBackground: true,
        format: 'merch'
      });
      
      if (imageUrl) {
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
    if (!generatedDesign) {
      toast.error('No design to download');
      return;
    }
    
    setIsDownloading(true);
    
    try {
      // Format filename using the first few words of the prompt
      const promptWords = prompt.split(' ').slice(0, 4).join('-').toLowerCase();
      const filename = `tshirt-${promptWords}-${Date.now()}`;
      
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
    setUploadedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Image to T-Shirt Design</CardTitle>
          <CardDescription>
            Upload an image and our AI will analyze it to create a prompt, which you can edit before generating your t-shirt design.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left column - Image upload */}
            <div className="space-y-4">
              {!imagePreview ? (
                <div 
                  className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-1">Upload an image</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Click to browse or drag and drop. JPG, PNG, or WEBP.
                  </p>
                  <Button variant="outline" size="sm">
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
                <div className="relative rounded-md overflow-hidden aspect-square bg-gray-100 dark:bg-gray-800">
                  <img 
                    src={imagePreview} 
                    alt="Uploaded image" 
                    className="w-full h-full object-contain"
                  />
                  <Button 
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={handleClearImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {imagePreview && (
                <div className="pt-2">
                  <Button 
                    onClick={handleAnalyzeImage}
                    disabled={!uploadedImage || isAnalyzing}
                    className="w-full"
                    variant="secondary"
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
            
            {/* Right column - Prompt and generated design */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="generated-prompt">Generated Prompt</Label>
                <Textarea
                  id="generated-prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={isAnalyzing ? "Analyzing image..." : "Generated prompt will appear here. You can edit it before generating your design."}
                  className="min-h-[100px]"
                  disabled={isAnalyzing}
                />
                <div className="text-xs text-muted-foreground flex justify-between">
                  <span>Feel free to edit the prompt to refine your design.</span>
                  <Badge variant="outline">{prompt.length}/500</Badge>
                </div>
              </div>
              
              <Button 
                onClick={handleGenerateDesign}
                disabled={!prompt.trim() || isGenerating}
                className="w-full"
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
              
              {/* Design preview */}
              {(isGenerating || generatedDesign) && (
                <div className="pt-4 space-y-4">
                  <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden flex items-center justify-center">
                    {generatedDesign ? (
                      <img 
                        src={generatedDesign} 
                        alt="Generated T-shirt design" 
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <div className="text-center">
                        <Loader2 className="h-10 w-10 animate-spin mx-auto mb-2 text-primary" />
                        <p className="text-muted-foreground">Creating your design...</p>
                        <p className="text-xs text-muted-foreground mt-1">This may take 15-30 seconds</p>
                      </div>
                    )}
                  </div>
                  
                  {generatedDesign && (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handleDownload('png')}
                        disabled={isDownloading}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        PNG
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handleDownload('pdf')}
                        disabled={isDownloading}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        PDF
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 