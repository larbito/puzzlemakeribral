import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Download, 
  FileText, 
  Loader2, 
  ImageIcon 
} from 'lucide-react';
import { toast } from 'sonner';
import { generateImage, downloadImage, saveToHistory } from '@/services/ideogramService';

export const PromptToDesignTab = () => {
  // State management
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [variationCount, setVariationCount] = useState('1');
  const [size, setSize] = useState('merch');
  const [transparentBg, setTransparentBg] = useState(true);
  
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
    if (!prompt.trim()) {
      toast.error('Please enter a prompt first');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Generate image with Ideogram API
      const imageUrl = await generateImage({
        prompt,
        transparentBackground: transparentBg,
        format: size
      });
      
      if (imageUrl) {
        setImageUrl(imageUrl);
        
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
  
  // Handle downloading the image
  const handleDownload = async (format = 'png') => {
    if (!imageUrl) {
      toast.error('No design to download');
      return;
    }
    
    setIsDownloading(true);
    
    try {
      // Format filename using the first few words of the prompt
      const promptWords = prompt.split(' ').slice(0, 4).join('-').toLowerCase();
      const filename = `tshirt-${promptWords}-${Date.now()}`;
      
      await downloadImage(imageUrl, format, filename);
      toast.success(`Design downloaded as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error downloading design:', error);
      toast.error('Failed to download design');
    } finally {
      setIsDownloading(false);
    }
  };

  // Use a sample prompt
  const useSamplePrompt = (sample: string) => {
    setPrompt(sample);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Design with Text Prompt</CardTitle>
          <CardDescription>
            Enter a detailed description of your t-shirt design, and our AI will create it for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left column - Prompt and settings */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">Design Description</Label>
                <Textarea
                  id="prompt"
                  placeholder="Describe your t-shirt design in detail... (e.g., 'A cute cartoon cat with sunglasses, minimalist style with blue accent colors')"
                  className="min-h-[150px]"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
                <div className="text-xs text-muted-foreground flex justify-between">
                  <span>Be specific about style, colors, and layout for best results.</span>
                  <Badge variant="outline">{prompt.length}/500</Badge>
                </div>
              </div>
              
              {/* Sample prompts */}
              <div className="space-y-2">
                <Label>Try these samples:</Label>
                <div className="flex flex-wrap gap-2">
                  {samplePrompts.map((sample, index) => (
                    <Button 
                      key={index} 
                      variant="outline" 
                      size="sm" 
                      onClick={() => useSamplePrompt(sample)}
                    >
                      {sample.slice(0, 20)}...
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="size">Output Size</Label>
                  <Select 
                    value={size} 
                    onValueChange={setSize}
                  >
                    <SelectTrigger id="size">
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
                
                <div className="space-y-2">
                  <Label htmlFor="variationCount">Variations</Label>
                  <Select 
                    value={variationCount} 
                    onValueChange={setVariationCount}
                  >
                    <SelectTrigger id="variationCount">
                      <SelectValue placeholder="How many?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Design</SelectItem>
                      <SelectItem value="2">2 Designs</SelectItem>
                      <SelectItem value="3">3 Designs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="transparent" 
                    checked={transparentBg} 
                    onCheckedChange={setTransparentBg} 
                  />
                  <Label htmlFor="transparent" className="cursor-pointer">
                    Transparent Background
                  </Label>
                </div>
                
                <Button 
                  onClick={handleGenerateDesign} 
                  disabled={isGenerating || !prompt.trim()}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Design
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {/* Right column - Preview */}
            <div className="space-y-4">
              <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden flex items-center justify-center relative">
                {imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt="Generated T-shirt design" 
                    className="max-w-full max-h-full object-contain"
                  />
                ) : isGenerating ? (
                  <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-muted-foreground">Creating your design...</p>
                    <p className="text-xs text-muted-foreground mt-1">This may take 15-30 seconds</p>
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <ImageIcon className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">Your design preview will appear here</p>
                    <p className="text-xs text-muted-foreground mt-1">Optimized for Merch by Amazon</p>
                  </div>
                )}
              </div>
              
              {imageUrl && (
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 