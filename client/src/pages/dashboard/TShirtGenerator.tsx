import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Shirt,
  InfoIcon,
  Download,
  Heart,
  RefreshCw,
  Trash2,
  History,
  Copy,
  Crown,
  Check,
  Loader2,
  ImageIcon,
  Plus,
  Lock,
  HelpCircle,
  Upload,
  Wand2,
  Save,
  MessageSquare,
  Settings2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  generateImage, 
  downloadImage, 
  getDesignHistory, 
  saveToHistory, 
  deleteFromHistory, 
  saveToFavorites as saveToFavoritesService,
  saveToProject as saveToProjectService,
  imageToPrompt
} from "@/services/ideogramService";
import type { DesignHistoryItem } from "@/services/designHistory";
import { PageLayout } from '@/components/layout/PageLayout';

// Style options with icons
const styleOptions = [
  { value: "retro", label: "Retro", description: "Vintage, nostalgic, 80s-90s inspired designs" },
  { value: "minimalist", label: "Minimalist", description: "Clean, simple designs with limited elements" },
  { value: "vaporwave", label: "Vaporwave", description: "Retro-futuristic aesthetic with neon colors" },
  { value: "bold-text", label: "Bold Text", description: "Typography-focused designs with strong statements" },
  { value: "illustrated", label: "Illustrated", description: "Detailed drawings and artistic illustrations" },
  { value: "custom", label: "Custom", description: "Your own unique style direction" }
];

// Color scheme options
const colorSchemeOptions = [
  { value: "black-white", label: "Black & White", color: "#000000" },
  { value: "colorful", label: "Colorful", color: "#FF5733" },
  { value: "neon", label: "Neon", color: "#39FF14" },
  { value: "pastel", label: "Pastel", color: "#FFD1DC" },
  { value: "monochrome", label: "Monochrome", color: "#808080" }
];

// Resolution options
const resolutionOptions = [
  { value: "png", label: "4500×5400 PNG", default: true },
  { value: "svg", label: "SVG Vector", proOnly: true },
  { value: "jpg", label: "JPG Image" }
];

// Format the date for display
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMins / 60);
  const diffDays = Math.round(diffHours / 24);

  if (diffMins < 1) {
    return "Just now";
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: Date;
}

export const TShirtGenerator = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("illustrated");
  const [colorScheme, setColorScheme] = useState("colorful");
  const [resolution, setResolution] = useState("png");
  const [transparentBg, setTransparentBg] = useState(true);
  const [safeMode, setSafeMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [generatedDesign, setGeneratedDesign] = useState<string | null>(null);
  const [history, setHistory] = useState<DesignHistoryItem[]>([]);
  const [currentTab, setCurrentTab] = useState("image-to-prompt");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const MAX_PROMPT_LENGTH = 500;

  // Load history on component mount
  useEffect(() => {
    const savedHistory = getDesignHistory();
    setHistory(savedHistory);
  }, []);

  // Debug effect to log when generatedDesign changes
  useEffect(() => {
    console.log("generatedDesign state updated:", generatedDesign);
  }, [generatedDesign]);

  // Draw the image on canvas when generatedDesign changes
  useEffect(() => {
    if (generatedDesign && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Create a new image
        const img = new Image();
        
        // When image loads, draw it on canvas
        img.onload = () => {
          console.log("Drawing image on canvas");
          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Set canvas dimensions to match image aspect ratio
          const aspectRatio = img.height / img.width;
          canvas.width = 1024;
          canvas.height = 1024 * aspectRatio;
          
          // Draw image
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          console.log("Image drawn on canvas");
        };
        
        // If image fails to load, draw a fallback
        img.onerror = () => {
          console.error("Failed to load image on canvas");
          
          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Set background
          ctx.fillStyle = '#252A37';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw text
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 40px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`T-Shirt: ${prompt}`, canvas.width / 2, canvas.height / 2);
          
          console.log("Fallback image drawn on canvas");
        };
        
        // Set the source to start loading
        img.src = generatedDesign;
      }
    }
  }, [generatedDesign, prompt]);

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      try {
        setIsGenerating(true);
        const generatedPrompt = await imageToPrompt(file);
        setPrompt(generatedPrompt);
        toast.success("Prompt generated from image!");
      } catch (error) {
        console.error("Error generating prompt from image:", error);
        toast.error("Failed to generate prompt from image");
      } finally {
        setIsGenerating(false);
      }
    }
  };

  // Generate prompt from image
  const handleGeneratePrompt = async () => {
    if (!selectedImage) return;
    setIsGenerating(true);
    try {
      // Generate a random placeholder prompt for now
      const promptPrefixes = ["A creative t-shirt design", "A modern t-shirt graphic", "A cool illustration", "A stylish artwork"];
      const promptElements = ["geometric patterns", "abstract shapes", "colorful splashes", "minimal line art", "bold typography"];
      const promptStyles = ["urban streetwear style", "retro vintage appeal", "modern minimalist aesthetic", "bold graphic design"];
      
      const prefix = promptPrefixes[Math.floor(Math.random() * promptPrefixes.length)];
      const element = promptElements[Math.floor(Math.random() * promptElements.length)];
      const style = promptStyles[Math.floor(Math.random() * promptStyles.length)];
      
      const mockPrompt = `${prefix} featuring ${element} with ${style}`;
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      setGeneratedPrompt(mockPrompt);
      toast.success("Prompt generated successfully!");
    } catch (error) {
      console.error('Error generating prompt:', error);
      toast.error("Failed to generate prompt");
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate image from prompt
  const handleGenerateImage = async () => {
    if (!customPrompt) {
      toast.error('Please enter a prompt first');
      return;
    }

    setIsGenerating(true);
    try {
      console.log('Generating image with prompt:', customPrompt);
      const imageUrl = await generateImage({
        prompt: customPrompt,
        style,
        colorScheme,
        transparentBackground: transparentBg,
        safeMode,
        format: resolution
      });

      if (imageUrl) {
        const newImage: GeneratedImage = {
          id: Date.now().toString(),
          url: imageUrl,
          prompt: customPrompt,
          timestamp: new Date()
        };
        setGeneratedImages(prev => [newImage, ...prev]);
        
        // Add to history
        const newDesign = saveToHistory({
          prompt: customPrompt,
          thumbnail: imageUrl,
          imageUrl,
          style,
          colorScheme,
          format: resolution.toUpperCase()
        });
        setHistory(prev => [newDesign, ...prev]);
        toast.success("Image generated successfully!");
      } else {
        throw new Error('No image returned from API');
      }
    } catch (error: any) {
      console.error('Error generating image:', error);
      toast.error(error.message || "Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  };

  // Delete generated image
  const handleDeleteImage = (id: string) => {
    setGeneratedImages(prev => prev.filter(img => img.id !== id));
  };

  // Handle generation
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt first");
      return;
    }
    
    setLoading(true);
    setGeneratedDesign(null); // Clear previous design
    
    try {
      console.log("Starting image generation with prompt:", prompt);
      const imageUrl = await generateImage({
        prompt,
        style,
        colorScheme,
        transparentBackground: transparentBg,
        safeMode,
        format: resolution
      });
      
      console.log("Image generation complete, received URL:", imageUrl);
      
      if (imageUrl) {
        // Test if image loads correctly
        const imgTest = new Image();
        imgTest.onload = () => {
          console.log("Test image loaded successfully:", imageUrl);
          setGeneratedDesign(imageUrl);
          
          // Add to history
          const newDesign = saveToHistory({
            prompt,
            thumbnail: imageUrl,
            imageUrl,
            style,
            colorScheme,
            format: resolution.toUpperCase()
          });
          
          setHistory(prev => [newDesign, ...prev]);
          toast.success("Design generated successfully!");
        };
        
        imgTest.onerror = (error) => {
          console.error("Test image failed to load:", error);
          toast.error("Generated image could not be loaded");
          
          // Create a direct data URI as fallback
          const canvas = document.createElement('canvas');
          canvas.width = 1024;
          canvas.height = 1365;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#252A37';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 40px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`T-Shirt: ${prompt}`, canvas.width/2, canvas.height/2);
            
            const dataUrl = canvas.toDataURL('image/png');
            console.log("Created fallback data URL");
            setGeneratedDesign(dataUrl);
          }
        };
        
        imgTest.src = imageUrl;
      }
    } catch (error) {
      console.error("Error in handleGenerate:", error);
      toast.error("Failed to generate design");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (format: string) => {
    if (!generatedDesign) return;
    
    try {
      // Format filename using the first few words of the prompt
      const promptWords = prompt.split(' ').slice(0, 4).join('-').toLowerCase();
      const filename = `tshirt-${promptWords}-${Date.now()}`;
      
      await downloadImage(generatedDesign, format, filename);
    } catch (error) {
      console.error("Error in handleDownload:", error);
      toast.error(`Failed to download as ${format}`);
    }
  };

  const handleSaveToFavorites = () => {
    if (!generatedDesign) return;
    
    try {
      // Assuming the current design is the first in history
      if (history.length > 0) {
        saveToFavoritesService(history[0].id);
      }
    } catch (error) {
      console.error("Error in handleSaveToFavorites:", error);
      toast.error("Failed to save to favorites");
    }
  };

  const handleSaveToProject = () => {
    if (!generatedDesign || history.length === 0) return;
    
    try {
      // Assuming the current design is the first in history
      saveToProjectService(history[0]);
    } catch (error) {
      console.error("Error in handleSaveToProject:", error);
      toast.error("Failed to save to project");
    }
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  const handleDeleteFromHistory = (id: string) => {
    try {
      const updatedHistory = deleteFromHistory(id);
      setHistory(updatedHistory);
      toast.success("Design removed from history");
    } catch (error) {
      console.error("Error in handleDeleteFromHistory:", error);
      toast.error("Failed to delete from history");
    }
  };

  const handleReusePrompt = (existingPrompt: string) => {
    setPrompt(existingPrompt);
    setCurrentTab("image-to-prompt");
    // Scroll to top of the page
    window.scrollTo(0, 0);
  };

  // Add a console.log in the render for debugging
  console.log('RENDER: customPrompt=', customPrompt, 'isGenerating=', isGenerating);

  return (
    <PageLayout
      title="T-Shirt Design Generator"
      description="Create unique t-shirt designs using AI. Upload images to get prompts or generate new designs from prompts."
    >
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-background/95 border rounded-lg p-1">
          <TabsTrigger 
            value="image-to-prompt" 
            className="relative z-10 text-lg font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Upload className="w-5 h-5 mr-2" />
            Image to Prompt
          </TabsTrigger>
          <TabsTrigger 
            value="prompt-to-image" 
            className="relative z-10 text-lg font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Wand2 className="w-5 h-5 mr-2" />
            Prompt to Image
          </TabsTrigger>
        </TabsList>

        <TabsContent value="image-to-prompt" className="mt-6 space-y-4">
          <Card className="border-2 relative">
            {isGenerating && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <p>Generating prompt...</p>
                </div>
              </div>
            )}
            <CardHeader>
              <CardTitle>Generate Prompt from Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image Upload Section */}
                <div className="space-y-4">
                  <div 
                    className="border-2 border-dashed border-primary/20 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer relative"
                    onClick={() => document.getElementById('image-upload')?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.currentTarget.classList.add('border-primary');
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.currentTarget.classList.remove('border-primary');
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.currentTarget.classList.remove('border-primary');
                      
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        const file = e.dataTransfer.files[0];
                        if (file.type.startsWith('image/')) {
                          // Create a synthetic event object with the file
                          const syntheticEvent = {
                            target: {
                              files: e.dataTransfer.files
                            }
                          } as unknown as React.ChangeEvent<HTMLInputElement>;
                          
                          handleImageUpload(syntheticEvent);
                        } else {
                          toast.error("Please upload an image file");
                        }
                      }
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer block w-full h-full">
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-primary/60" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          SVG, PNG, JPG or GIF (max. 5MB)
                        </p>
                      </div>
                    </label>
                  </div>
                  {imagePreview && (
                    <div className="relative aspect-square rounded-lg overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setSelectedImage(null);
                          setImagePreview(null);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Generated Prompt Section */}
                <div className="space-y-4">
                  <Button
                    onClick={handleGeneratePrompt}
                    disabled={!selectedImage || isGenerating}
                    className="w-full relative"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    {isGenerating ? 'Generating...' : 'Generate Prompt'}
                  </Button>
                  {generatedPrompt && (
                    <div className="space-y-2">
                      <Textarea
                        value={generatedPrompt}
                        readOnly
                        className="min-h-[200px]"
                      />
                      <Button
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedPrompt);
                          toast.success('Prompt copied to clipboard');
                        }}
                        className="w-full"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Prompt
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prompt-to-image" className="mt-6 space-y-4">
          <Card className="border-2 relative">
            {isGenerating && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <p>Generating image...</p>
                </div>
              </div>
            )}
            <CardHeader>
              <CardTitle>Generate Image from Prompt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prompt-input">Enter your prompt</Label>
                  <Textarea
                    placeholder="Enter your prompt here..."
                    value={customPrompt}
                    onChange={e => setCustomPrompt(e.target.value)}
                    className="min-h-[100px] relative z-20 bg-background"
                    id="prompt-input"
                    aria-label="Prompt input"
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="style">Style</Label>
                    <Select value={style} onValueChange={setStyle}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select style" />
                      </SelectTrigger>
                      <SelectContent>
                        {styleOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="colorScheme">Color Scheme</Label>
                    <Select value={colorScheme} onValueChange={setColorScheme}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select color scheme" />
                      </SelectTrigger>
                      <SelectContent>
                        {colorSchemeOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="resolution">Export Format</Label>
                    <Select value={resolution} onValueChange={setResolution}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        {resolutionOptions.map(option => (
                          <SelectItem 
                            key={option.value} 
                            value={option.value}
                            disabled={option.proOnly}
                          >
                            {option.label} {option.proOnly && <Lock className="inline w-3 h-3 ml-1" />}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="transparentBg">Transparent Background</Label>
                      <Switch 
                        id="transparentBg" 
                        checked={transparentBg} 
                        onCheckedChange={setTransparentBg} 
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="safeMode">Safe Mode</Label>
                      <Switch 
                        id="safeMode" 
                        checked={safeMode} 
                        onCheckedChange={setSafeMode} 
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleGenerateImage}
                    disabled={!customPrompt || isGenerating}
                    className="flex-1"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    {isGenerating ? 'Generating...' : 'Generate Image'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setCustomPrompt('')}
                    disabled={isGenerating}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              {/* Generated Images Gallery */}
              {generatedImages.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Generated Images</h3>
                    {generatedImages.length > 1 && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          if (confirm("Are you sure you want to clear all generated images?")) {
                            setGeneratedImages([]);
                            toast.success("Gallery cleared");
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear All
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {generatedImages.map((image) => (
                      <Card key={image.id} className="group overflow-hidden">
                        <CardContent className="p-3">
                          <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-2 border border-border">
                            <img
                              src={image.url}
                              alt={`Generated design ${image.id}`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button 
                                size="icon" 
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  downloadImage(image.url, 'png', `tshirt-design-${image.id}`);
                                }}
                              >
                                <Download className="w-4 h-4 text-white" />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(image.prompt);
                                  toast.success('Prompt copied to clipboard');
                                }}
                              >
                                <Copy className="w-4 h-4 text-white" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteImage(image.id);
                                  toast.success('Design deleted');
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-white" />
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground line-clamp-2 break-words">
                              {image.prompt}
                            </p>
                            <p className="text-xs text-muted-foreground/70">
                              {new Date(image.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Additional Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Button 
          variant="ghost" 
          className="p-0 h-auto"
          onClick={() => {
            if (history.length > 0) {
              toast.success("Showing design history");
            } else {
              toast.info("No design history available yet");
            }
          }}
        >
          <Card className="w-full hover:border-primary transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <History className="w-6 h-6 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Design History</h3>
                  <p className="text-sm text-muted-foreground">View and manage your previous designs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Button>

        <Button 
          variant="ghost" 
          className="p-0 h-auto"
          onClick={() => {
            toast.success("Prompt library coming soon!");
          }}
        >
          <Card className="w-full hover:border-primary transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Prompt Library</h3>
                  <p className="text-sm text-muted-foreground">Access pre-made prompts and templates</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Button>

        <Button 
          variant="ghost" 
          className="p-0 h-auto"
          onClick={() => {
            const settingsDialog = document.getElementById('design-settings-dialog');
            if (settingsDialog) {
              // If we had a dialog, we'd open it here
              toast.success("Design settings coming soon!");
            } else {
              toast.success("Design settings coming soon!");
            }
          }}
        >
          <Card className="w-full hover:border-primary transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Settings2 className="w-6 h-6 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Design Settings</h3>
                  <p className="text-sm text-muted-foreground">Customize generation parameters</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Button>
      </div>
    </PageLayout>
  );
}; 