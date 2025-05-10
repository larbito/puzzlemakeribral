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
  const [activeTab, setActiveTab] = useState("design");
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
      // TODO: Implement API call to generate prompt from image
      const mockPrompt = "A creative t-shirt design featuring a modern abstract pattern with vibrant colors suitable for streetwear";
      setGeneratedPrompt(mockPrompt);
    } catch (error) {
      console.error('Error generating prompt:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate image from prompt
  const handleGenerateImage = async () => {
    if (!customPrompt) return;
    setIsGenerating(true);
    try {
      // TODO: Implement API call to generate image from prompt
      const mockImage: GeneratedImage = {
        id: Date.now().toString(),
        url: 'https://via.placeholder.com/400x400',
        prompt: customPrompt,
        timestamp: new Date()
      };
      setGeneratedImages(prev => [mockImage, ...prev]);
    } catch (error) {
      console.error('Error generating image:', error);
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
    setActiveTab("design");
    // Scroll to top of the page
    window.scrollTo(0, 0);
  };

  return (
    <PageLayout
      title="T-Shirt Design Generator"
      description="Create unique t-shirt designs using AI. Upload images to get prompts or generate new designs from prompts."
    >
      <Tabs defaultValue="image-to-prompt" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="image-to-prompt">Image to Prompt</TabsTrigger>
          <TabsTrigger value="prompt-to-image">Prompt to Image</TabsTrigger>
        </TabsList>

        {/* Image to Prompt Tab */}
        <TabsContent value="image-to-prompt">
          <Card>
            <CardHeader>
              <CardTitle>Generate Prompt from Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image Upload Section */}
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-primary/20 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-primary/60" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload or drag and drop
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
                    className="w-full"
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
                        onClick={() => navigator.clipboard.writeText(generatedPrompt)}
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

        {/* Prompt to Image Tab */}
        <TabsContent value="prompt-to-image">
          <Card>
            <CardHeader>
              <CardTitle>Generate Image from Prompt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Textarea
                  placeholder="Enter your prompt here..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleGenerateImage}
                    disabled={!customPrompt || isGenerating}
                    className="flex-1"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    {isGenerating ? 'Generating...' : 'Generate Image'}
                  </Button>
                  <Button variant="outline" onClick={() => setCustomPrompt('')}>
                    Clear
                  </Button>
                </div>
              </div>

              {/* Generated Images Gallery */}
              {generatedImages.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Generated Images</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {generatedImages.map((image) => (
                      <Card key={image.id} className="group">
                        <CardContent className="p-4">
                          <div className="relative aspect-square rounded-lg overflow-hidden mb-4">
                            <img
                              src={image.url}
                              alt={`Generated design ${image.id}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button size="icon" variant="ghost">
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button size="icon" variant="ghost">
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDeleteImage(image.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {image.prompt}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {image.timestamp.toLocaleString()}
                          </p>
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
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <History className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Design History</h3>
                <p className="text-sm text-muted-foreground">View and manage your previous designs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Prompt Library</h3>
                <p className="text-sm text-muted-foreground">Access pre-made prompts and templates</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Settings2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Design Settings</h3>
                <p className="text-sm text-muted-foreground">Customize generation parameters</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}; 