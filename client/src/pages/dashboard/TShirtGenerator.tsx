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
  HelpCircle
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
} from "@/services/ideogramService";
import type { DesignHistoryItem } from "@/services/designHistory";

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

export function TShirtGenerator() {
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
    <div className="container py-6 space-y-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Shirt className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">T-Shirt Design Generator</h1>
        </div>
        <p className="text-muted-foreground">
          Create print-ready t-shirt designs with AI. Perfect for Merch by Amazon, Printify, Printful and more.
        </p>
      </div>

      <Tabs defaultValue="design" className="w-full" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="design" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span>Design</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span>History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="design">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Panel - Input Controls */}
            <Card className="backdrop-blur-3xl border-primary/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-transparent" />
              <div className="absolute inset-0 bg-grid-white/[0.02]" />
              
              <CardHeader>
                <CardTitle>Design Input</CardTitle>
                <CardDescription>
                  Describe your t-shirt design and customize options
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6 relative">
                {/* Prompt Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="prompt" className="flex items-center gap-2">
                      Describe your T-shirt idea
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-80">
                            <p>Be specific about style, subject, colors, mood, etc. for best results.</p>
                            <p className="mt-2">Example: "A minimalist design of a mountain landscape at sunset with pine trees silhouette"</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <span className={cn(
                      "text-xs",
                      prompt.length > MAX_PROMPT_LENGTH * 0.8 ? "text-yellow-400" : "text-muted-foreground",
                      prompt.length >= MAX_PROMPT_LENGTH && "text-red-400"
                    )}>
                      {prompt.length}/{MAX_PROMPT_LENGTH}
                    </span>
                  </div>
                  <Textarea
                    id="prompt"
                    placeholder="Example: A funny astronaut cat drinking coffee"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value.slice(0, MAX_PROMPT_LENGTH))}
                    className="h-32 resize-none"
                  />
                </div>

                {/* Style Selector */}
                <div className="space-y-2">
                  <Label htmlFor="style">Style</Label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a style" />
                    </SelectTrigger>
                    <SelectContent>
                      {styleOptions.map((style) => (
                        <SelectItem key={style.value} value={style.value}>
                          <span className="flex items-center gap-2">
                            {style.label}
                            <span className="text-xs text-muted-foreground">
                              {style.description}
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Color Scheme */}
                <div className="space-y-2">
                  <Label>Color Scheme</Label>
                  <div className="flex flex-wrap gap-2">
                    {colorSchemeOptions.map((scheme) => (
                      <Button
                        key={scheme.value}
                        type="button"
                        variant={colorScheme === scheme.value ? "default" : "outline"}
                        className="rounded-full px-4 py-2 h-auto"
                        onClick={() => setColorScheme(scheme.value)}
                      >
                        <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: scheme.color }}></span>
                        {scheme.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Resolution Output Format */}
                <div className="space-y-2">
                  <Label htmlFor="resolution">Output Format</Label>
                  <Select value={resolution} onValueChange={setResolution}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select resolution" />
                    </SelectTrigger>
                    <SelectContent>
                      {resolutionOptions.map((res) => (
                        <SelectItem key={res.value} value={res.value}>
                          <span className="flex items-center gap-2">
                            {res.label}
                            {res.proOnly && (
                              <Badge variant="outline" className="ml-2 bg-primary/10 text-primary">
                                <Crown className="h-3 w-3 mr-1" />
                                Pro
                              </Badge>
                            )}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Background Setting */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="transparent-bg">Transparent Background</Label>
                    <p className="text-sm text-muted-foreground">Ideal for print-on-demand</p>
                  </div>
                  <Switch
                    id="transparent-bg"
                    checked={transparentBg}
                    onCheckedChange={setTransparentBg}
                  />
                </div>

                {/* Safe Prompt Mode */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="safe-mode">Commercial-Safe Mode</Label>
                      <Badge variant="outline" className="bg-primary/10 text-primary">
                        <Crown className="h-3 w-3 mr-1" />
                        Pro
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Filter prompts for marketplace compliance</p>
                  </div>
                  <Switch
                    id="safe-mode"
                    checked={safeMode}
                    onCheckedChange={setSafeMode}
                  />
                </div>
              </CardContent>
              
              <CardFooter className="relative">
                <Button 
                  onClick={handleGenerate} 
                  disabled={!prompt.trim() || loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Design...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Design
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* Right Panel - Output Preview */}
            <Card className="backdrop-blur-3xl border-primary/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />
              <div className="absolute inset-0 bg-grid-white/[0.02]" />
              
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>
                  Your generated t-shirt design
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex flex-col items-center justify-center">
                {generatedDesign ? (
                  <>
                    <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden flex items-center justify-center bg-white border-4 border-primary">
                      <canvas 
                        ref={canvasRef} 
                        className="w-full h-full object-contain"
                        style={{ maxHeight: "100%", maxWidth: "100%" }}
                      />
                    </div>
                    <div className="mt-4 w-full overflow-hidden text-xs text-muted-foreground">
                      <p className="font-semibold">Debug: Image URL</p>
                      <div className="bg-black/10 p-2 rounded-md mt-1 break-all">
                        {generatedDesign.substring(0, 100) + '...'}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden flex items-center justify-center bg-background/50 border border-dashed border-muted-foreground/20">
                    {loading ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-muted-foreground text-sm">Crafting your design...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <Shirt className="h-16 w-16 text-muted-foreground/40" />
                        <p className="text-muted-foreground">Enter a prompt and generate your design</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
              
              {generatedDesign && (
                <CardFooter className="flex flex-col gap-4 relative">
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <Button onClick={() => handleDownload(resolution)}>
                      <Download className="mr-2 h-4 w-4" />
                      Download {resolution.toUpperCase()}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleSaveToProject}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Save to Project
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full">
                    <Button
                      variant="outline"
                      onClick={handleRegenerate}
                      className="flex-1"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerate
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleSaveToFavorites}
                      className="aspect-square p-2"
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card className="backdrop-blur-3xl border-primary/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-primary/5" />
            <div className="absolute inset-0 bg-grid-white/[0.02]" />
            
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Design History
              </CardTitle>
              <CardDescription>
                Your previously generated t-shirt designs
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {history.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {history.map((design) => (
                    <Card key={design.id} className="overflow-hidden group hover:border-primary/50 transition-all duration-200">
                      <div className="p-3 aspect-[4/5] bg-background/50">
                        <img
                          src={design.thumbnail}
                          alt={design.prompt}
                          className="w-full h-full object-contain rounded-md"
                        />
                      </div>
                      <CardContent className="p-3">
                        <p className="text-sm line-clamp-2 h-10">{design.prompt}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs">
                              {design.style}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {design.format}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">{formatDate(design.createdAt)}</span>
                        </div>
                      </CardContent>
                      <CardFooter className="p-3 pt-0 flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 h-8"
                          onClick={() => handleReusePrompt(design.prompt)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Reuse
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 h-8"
                          onClick={() => handleDeleteFromHistory(design.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <ImageIcon className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">No design history yet</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setActiveTab("design")}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Create your first design
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tips Section */}
      <Card className="backdrop-blur-3xl border-primary/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-accent/5" />
        <div className="absolute inset-0 bg-grid-white/[0.02]" />
        
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <InfoIcon className="h-5 w-5" />
            Selling Tips
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium">What Sells Well</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Niche-specific designs</li>
                <li>• Funny quotes and sayings</li>
                <li>• Profession-related humor</li>
                <li>• Simple, clean aesthetics</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Best Practices</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Use transparent backgrounds</li>
                <li>• Keep text readable and large</li>
                <li>• Test multiple variations</li>
                <li>• Avoid trademarked content</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Popular Platforms</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Merch by Amazon</li>
                <li>• Printful + Etsy</li>
                <li>• Redbubble</li>
                <li>• Teespring / Spring</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 