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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Download, 
  FileText, 
  Loader2, 
  ImageIcon,
  LightbulbIcon,
  PanelRight
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
    console.log('Generate button clicked with prompt:', prompt);
    
    if (!prompt.trim()) {
      toast.error('Please enter a prompt first');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Generate image with Ideogram API
      console.log('Calling generateImage with:', { prompt, transparentBg, size });
      const imageUrl = await generateImage({
        prompt,
        transparentBackground: transparentBg,
        format: size
      });
      
      if (imageUrl) {
        console.log('Generated image URL:', imageUrl);
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
    console.log('Download button clicked for format:', format);
    if (!imageUrl) {
      toast.error('No design to download');
      return;
    }
    
    setIsDownloading(true);
    
    try {
      // Format filename using the first few words of the prompt
      const promptWords = prompt.split(' ').slice(0, 4).join('-').toLowerCase();
      const filename = `tshirt-${promptWords}-${Date.now()}`;
      
      console.log('Downloading image with filename:', filename);
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
    console.log('Sample prompt selected:', sample);
    setPrompt(sample);
  };

  console.log('Current prompt value:', prompt);
  console.log('Current image URL:', imageUrl);

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
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 pt-2 relative z-[105]">
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
                  Generate Design
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
            {imageUrl ? (
              <img 
                src={imageUrl} 
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
                <p className="text-xs text-muted-foreground mt-2">Optimized for Merch by Amazon with transparent backgrounds</p>
              </div>
            )}
          </div>
          
          {imageUrl && (
            <div className="space-y-4 relative z-[105]">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 border-primary/20 hover:bg-primary/5 hover:text-primary relative z-[106]"
                  onClick={() => handleDownload('png')}
                  disabled={isDownloading}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download as PNG
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 border-primary/20 hover:bg-primary/5 hover:text-primary relative z-[106]"
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