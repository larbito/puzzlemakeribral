import React, { useState, useEffect, useRef } from "react";
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
  Settings2,
  AlertTriangle,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  CheckCircle,
  Grid,
  Layers
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
import { Slider } from "@/components/ui/slider";
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

// Enhanced style options with more choices
const styleOptions = [
  { value: "vintage", label: "Vintage", description: "Vintage-style design with retro elements" },
  { value: "bold-text", label: "Bold Text", description: "Typography-focused designs with strong statements" },
  { value: "minimalist", label: "Minimalist", description: "Clean, simple designs with limited elements" },
  { value: "cartoon", label: "Cartoon / Mascot", description: "Fun characters and cartoon-style graphics" },
  { value: "psychedelic", label: "Psychedelic", description: "Vibrant, trippy designs with bold colors" },
  { value: "kawaii", label: "Kawaii", description: "Cute, adorable Japanese-inspired design" },
  { value: "retro", label: "90s Retro", description: "Nostalgic 90s style graphics and patterns" },
  { value: "illustrated", label: "Illustrated", description: "Detailed drawings and artistic illustrations" },
  { value: "custom", label: "Custom", description: "Your own unique style direction" }
];

// Color scheme options with enhanced descriptions
const colorSchemeOptions = [
  { value: "black-white", label: "Black & White", color: "#000000", description: "Simple, classic, and cost-effective" },
  { value: "colorful", label: "Colorful", color: "#FF5733", description: "Vibrant multi-color designs" },
  { value: "neon", label: "Neon", color: "#39FF14", description: "Bright, glowing neon elements" },
  { value: "pastel", label: "Pastel", color: "#FFD1DC", description: "Soft, muted color palette" },
  { value: "monochrome", label: "Monochrome", color: "#808080", description: "Single color variations" }
];

// Resolution options with additional information
const resolutionOptions = [
  { value: "png", label: "4500×5400 PNG", default: true, description: "Standard high-res PNG with transparency" },
  { value: "svg", label: "SVG Vector", proOnly: true, description: "Scalable vector format (Premium)" },
  { value: "jpg", label: "JPG Image", description: "Compressed format without transparency" }
];

// Color limit options
const colorLimitOptions = [
  { value: "2", label: "2 Colors", description: "Lowest printing cost" },
  { value: "3", label: "3 Colors", description: "Balanced cost and design" },
  { value: "full", label: "Full Color", description: "No limit, highest quality" }
];

// Design type options
const designTypeOptions = [
  { value: "illustration", label: "Illustration Only" },
  { value: "text", label: "Text Only" },
  { value: "both", label: "Both Text & Illustration" }
];

// Mockup background options
const mockupOptions = [
  { value: "black", label: "Black T-shirt" },
  { value: "white", label: "White T-shirt" },
  { value: "navy", label: "Navy T-shirt" },
  { value: "hoodie", label: "Hoodie", proOnly: true }
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
  // File upload state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Prompt state
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  
  // Style and settings state
  const [style, setStyle] = useState("illustrated");
  const [colorScheme, setColorScheme] = useState("colorful");
  const [designType, setDesignType] = useState("both");
  const [colorLimit, setColorLimit] = useState("full");
  const [creativityLevel, setCreativityLevel] = useState([50]);
  const [resolution, setResolution] = useState("png");
  const [transparentBg, setTransparentBg] = useState(true);
  const [safeMode, setSafeMode] = useState(true);
  const [showSafeZone, setShowSafeZone] = useState(true);
  const [seedValue, setSeedValue] = useState("");
  const [mockupBackground, setMockupBackground] = useState("white");

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState("design");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showCompliance, setShowCompliance] = useState(false);

  // Results state
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [generatedDesign, setGeneratedDesign] = useState<string | null>(null);
  const [history, setHistory] = useState<DesignHistoryItem[]>([]);
  const [complianceIssues, setComplianceIssues] = useState<string[]>([]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mockupCanvasRef = useRef<HTMLCanvasElement>(null);

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
          
          // Draw safe zone if enabled
          if (showSafeZone) {
            // Draw the safe zone (15" × 18" print boundary)
            ctx.strokeStyle = 'rgba(0, 120, 255, 0.7)';
            ctx.lineWidth = 2;
            
            // Calculate safe zone dimensions (80% of canvas)
            const safeZoneWidth = canvas.width * 0.8;
            const safeZoneHeight = canvas.height * 0.8;
            const safeZoneX = (canvas.width - safeZoneWidth) / 2;
            const safeZoneY = (canvas.height - safeZoneHeight) / 2;
            
            ctx.strokeRect(safeZoneX, safeZoneY, safeZoneWidth, safeZoneHeight);
            
            // Add label
            ctx.fillStyle = 'rgba(0, 120, 255, 0.9)';
            ctx.font = '14px Arial';
            ctx.fillText('Safe Print Area (15" × 18")', safeZoneX + 10, safeZoneY + 20);
          }
          
          console.log("Image drawn on canvas");
          
          // Also update the mockup preview
          updateMockupPreview(img);
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
          ctx.fillText(`T-Shirt: ${prompt || customPrompt}`, canvas.width / 2, canvas.height / 2);
          
          console.log("Fallback image drawn on canvas");
        };
        
        // Set the source to start loading
        img.src = generatedDesign;
      }
    }
  }, [generatedDesign, prompt, customPrompt, showSafeZone]);

  // Function to update the mockup preview
  const updateMockupPreview = (designImage: HTMLImageElement) => {
    if (!mockupCanvasRef.current) return;
    
    const canvas = mockupCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set canvas dimensions
    canvas.width = 800;
    canvas.height = 900;
    
    // Load t-shirt template based on selected background
    const tshirtImg = new Image();
    tshirtImg.onload = () => {
      // Draw t-shirt template
      ctx.drawImage(tshirtImg, 0, 0, canvas.width, canvas.height);
      
      // Calculate design dimensions (40% of tshirt width)
      const designWidth = canvas.width * 0.4;
      const designHeight = (designWidth / designImage.width) * designImage.height;
      
      // Position in center chest area (about 30% from top)
      const designX = (canvas.width - designWidth) / 2;
      const designY = canvas.height * 0.3;
      
      // Draw design on t-shirt
      ctx.drawImage(
        designImage, 
        designX, 
        designY, 
        designWidth, 
        designHeight
      );
    };
    
    // Set source based on selected mockup background
    switch (mockupBackground) {
      case 'black':
        tshirtImg.src = '/mockups/black-tshirt-template.png';
        break;
      case 'navy':
        tshirtImg.src = '/mockups/navy-tshirt-template.png';
        break;
      case 'hoodie':
        tshirtImg.src = '/mockups/hoodie-template.png';
        break;
      case 'white':
      default:
        tshirtImg.src = '/mockups/white-tshirt-template.png';
        break;
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File is too large. Maximum size is 5MB.");
        return;
      }
      
      setSelectedImage(file);
      
      // Create and set preview URL
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          setImagePreview(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Generate prompt from uploaded image
  const handleGeneratePrompt = async () => {
    console.log('handleGeneratePrompt called with state:', {
      selectedImage: !!selectedImage,
      isGenerating
    });
    if (!selectedImage) return;
    
    setIsGenerating(true);
    try {
      // Call API to analyze image and generate prompt
      const generatedPromptText = await imageToPrompt(selectedImage);
      setGeneratedPrompt(generatedPromptText);
      toast.success("Prompt generated successfully!");
      
      // Auto-populate the design prompt
      setCustomPrompt(generatedPromptText);
      
      // Switch to design tab
      setCurrentTab("design");
    } catch (error) {
      console.error('Error generating prompt:', error);
      toast.error("Failed to generate prompt");
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate image from prompt
  const handleGenerateImage = async () => {
    const activePrompt = customPrompt.trim() || prompt.trim();
    console.log('handleGenerateImage called with state:', {
      prompt: activePrompt,
      isGenerating
    });
    
    if (!activePrompt) {
      toast.error('Please enter a prompt first');
      return;
    }

    setIsGenerating(true);
    
    try {
      console.log('Generating image with prompt:', activePrompt);
      
      // Add values to enhanced parameters object
      const enhancedParams: any = {
        prompt: activePrompt,
        style,
        colorScheme,
        transparentBackground: transparentBg,
        safeMode,
        format: resolution
      };
      
      // Add new parameters if they have values
      if (negativePrompt) {
        enhancedParams.negativePrompt = negativePrompt;
      }
      
      if (seedValue) {
        enhancedParams.seed = parseInt(seedValue);
      }
      
      if (designType !== 'both') {
        enhancedParams.designType = designType;
      }
      
      if (colorLimit !== 'full') {
        enhancedParams.colorLimit = parseInt(colorLimit);
      }
      
      if (creativityLevel[0] !== 50) {
        enhancedParams.creativity = creativityLevel[0];
      }
      
      const imageUrl = await generateImage(enhancedParams);

      if (imageUrl) {
        const newImage: GeneratedImage = {
          id: Date.now().toString(),
          url: imageUrl,
          prompt: activePrompt,
          timestamp: new Date()
        };
        setGeneratedImages(prev => [newImage, ...prev]);
        setGeneratedDesign(imageUrl);
        
        // Add to history
        const newDesign = saveToHistory({
          prompt: activePrompt,
          thumbnail: imageUrl,
          imageUrl,
          style,
          colorScheme,
          format: resolution.toUpperCase()
        });
        setHistory(prev => [newDesign, ...prev]);
        
        // Run compliance check
        checkCompliance(activePrompt, imageUrl);
        
        toast.success("Design generated successfully!");
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

  // Handle image download
  const handleDownload = async (format: string) => {
    if (!generatedDesign) return;
    
    try {
      // Format filename using the first few words of the prompt
      const activePrompt = customPrompt || prompt;
      const promptWords = activePrompt.split(' ').slice(0, 4).join('-').toLowerCase();
      const filename = `tshirt-${promptWords}-${Date.now()}`;
      
      await downloadImage(generatedDesign, format, filename);
    } catch (error) {
      console.error("Error in handleDownload:", error);
      toast.error(`Failed to download as ${format}`);
    }
  };
  
  // Check for compliance issues
  const checkCompliance = (promptText: string, imageUrl: string) => {
    const issues: string[] = [];
    
    // Check for potential trademark issues in prompt
    const trademarkKeywords = ['nike', 'adidas', 'disney', 'marvel', 'nfl', 'nba', 'trademarked', 'copyright'];
    
    trademarkKeywords.forEach(keyword => {
      if (promptText.toLowerCase().includes(keyword)) {
        issues.push(`Potential trademark issue: Contains "${keyword}"`);
      }
    });
    
    // Validate image dimensions
    if (imageUrl) {
      const img = new Image();
      img.onload = () => {
        // Check if dimensions match required size
        if (img.width !== 4500 || img.height !== 5400) {
          issues.push(`Image size is ${img.width}x${img.height}px. Required: 4500x5400px`);
        }
        
        // Update state with all issues
        setComplianceIssues(issues);
      };
      img.src = imageUrl;
    }
    
    // Update issues found so far
    setComplianceIssues(issues);
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
    setCurrentTab("design");
    // Scroll to top of the page
    window.scrollTo(0, 0);
  };

  // Debug effect to log state changes
  useEffect(() => {
    console.log("State update - customPrompt:", customPrompt, "isGenerating:", isGenerating);
  }, [customPrompt, isGenerating]);

  // Debug logging for state changes
  useEffect(() => {
    console.log('State values updated:', {
      selectedImage: !!selectedImage,
      isGenerating,
      customPrompt: customPrompt.trim(),
      currentTab
    });
  }, [selectedImage, isGenerating, customPrompt, currentTab]);

  // Add debug log before render
  console.log('RENDER STATE:', { customPrompt, isGenerating });

  return (
    <PageLayout
      title="T-Shirt Design Creator"
      description="Create stunning t-shirt designs with AI. Perfect for print-on-demand and merch."
    >
      <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden">
        {/* Header with tabs */}
        <div className="border-b pb-2 mb-4">
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-4 bg-background/95 border rounded-lg p-1">
              <TabsTrigger value="design" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Wand2 className="w-4 h-4 mr-2" />
                Create
              </TabsTrigger>
              <TabsTrigger value="upload" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="gallery" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Grid className="w-4 h-4 mr-2" />
                Gallery
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <History className="w-4 h-4 mr-2" />
                History
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Design Generator Tab - Main T-shirt design studio with new layout */}
        <TabsContent value="design" className="flex-1 overflow-hidden">
          <div className="flex h-full gap-0 relative">
            {/* Left Sidebar - Collapsible */}
            <div className="w-80 border-r h-full flex flex-col overflow-hidden transition-all duration-300">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Design Controls
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {/* Prompt Section */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-foreground/80">Describe your design</h4>
                  <Textarea
                    placeholder="e.g., A vintage-style cat wearing sunglasses riding a skateboard"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="min-h-[100px] resize-none"
                    maxLength={MAX_PROMPT_LENGTH}
                  />
                  <div className="text-xs text-muted-foreground flex justify-between">
                    <span>Be specific about style and details</span>
                    <span>{customPrompt.length}/{MAX_PROMPT_LENGTH}</span>
                  </div>
                </div>
                
                {/* Negative Prompt */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="negative-prompt" className="text-sm">Exclude elements</Label>
                    <Badge variant="outline" className="text-xs">Optional</Badge>
                  </div>
                  <Textarea
                    id="negative-prompt"
                    placeholder="e.g., No text, no logos, no background"
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    className="min-h-[60px] resize-none"
                  />
                </div>
                
                {/* Quick Settings */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-foreground/80">Quick Settings</h4>
                  
                  {/* Style Picker */}
                  <div>
                    <Label htmlFor="style" className="text-xs mb-1 block">Design Style</Label>
                    <Select value={style} onValueChange={setStyle}>
                      <SelectTrigger id="style" className="w-full">
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
                  
                  {/* Design Type */}
                  <div>
                    <Label className="text-xs mb-1 block">Design Type</Label>
                    <div className="flex gap-1">
                      {designTypeOptions.map(option => (
                        <Button
                          key={option.value}
                          variant={designType === option.value ? "default" : "outline"}
                          size="sm"
                          className="flex-1 text-xs h-8 px-2"
                          onClick={() => setDesignType(option.value)}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Color Limit */}
                  <div>
                    <Label htmlFor="color-limit" className="text-xs mb-1 block">Color Limit</Label>
                    <Select value={colorLimit} onValueChange={setColorLimit}>
                      <SelectTrigger id="color-limit">
                        <SelectValue placeholder="Select color limit" />
                      </SelectTrigger>
                      <SelectContent>
                        {colorLimitOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Advanced Controls */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-foreground/80">Advanced</h4>
                  </div>
                  
                  {/* Creativity Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="creativity" className="text-xs">Creativity</Label>
                      <span className="text-xs font-medium">{creativityLevel[0]}%</span>
                    </div>
                    <Slider
                      id="creativity"
                      value={creativityLevel}
                      onValueChange={setCreativityLevel}
                      max={100}
                      step={5}
                      className="py-1"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Predictable</span>
                      <span>Experimental</span>
                    </div>
                  </div>
                  
                  {/* Seed Value */}
                  <div className="pt-1">
                    <Label htmlFor="seed" className="text-xs mb-1 block">
                      Seed (Optional)
                    </Label>
                    <Input
                      id="seed"
                      placeholder="Random seed"
                      value={seedValue}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setSeedValue(value);
                      }}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                
                {/* Generate Button */}
                <Button 
                  onClick={handleGenerateImage}
                  disabled={!customPrompt.trim() || isGenerating}
                  className="w-full h-10 relative mt-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Design
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Main Content - Design Preview Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Canvas area */}
              <div className="flex-1 relative flex items-center justify-center bg-gray-50 dark:bg-gray-900/20">
                {isGenerating && (
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="flex flex-col items-center gap-2 p-6 bg-background/95 rounded-lg shadow-lg border">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="font-medium">Creating your design</p>
                      <p className="text-xs text-muted-foreground">This may take 10-15 seconds</p>
                    </div>
                  </div>
                )}
                
                {!generatedDesign ? (
                  <div className="text-center p-8">
                    <Shirt className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground font-medium">Your design will appear here</p>
                    <p className="text-xs text-muted-foreground/70 mt-2 max-w-md">
                      Enter your prompt on the left and click Generate. The AI will create a design based on your description.
                    </p>
                  </div>
                ) : (
                  <div className="relative inline-block">
                    <canvas 
                      ref={canvasRef}
                      className="max-w-full max-h-full"
                      style={{
                        transform: `scale(${zoomLevel})`,
                        transformOrigin: 'center'
                      }}
                    />
                    
                    {/* Zoom controls */}
                    <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-background/90 p-1 rounded-lg shadow-md border">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.1))}
                        className="h-8 w-8"
                      >
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                      <span className="text-xs w-12 text-center font-medium">{Math.round(zoomLevel * 100)}%</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setZoomLevel(prev => Math.min(2, prev + 0.1))}
                        className="h-8 w-8"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Control bar */}
              {generatedDesign && (
                <div className="p-4 border-t flex justify-between items-center">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSafeZone(!showSafeZone)}
                    >
                      {showSafeZone ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
                      {showSafeZone ? "Hide Safe Zone" : "Show Safe Zone"}
                    </Button>
                    
                    <Button
                      variant={showCompliance ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowCompliance(!showCompliance)}
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Compliance Check
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline" 
                      size="sm"
                      onClick={handleRegenerate}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerate
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSaveToFavorites}
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      Favorite
                    </Button>
                    
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleDownload(resolution)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Compliance panel - shown conditionally */}
              {showCompliance && generatedDesign && (
                <div className="p-4 border-t bg-background/50">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500" />
                      Compliance Check
                    </h3>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowCompliance(false)}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </Button>
                  </div>
                  
                  {complianceIssues.length > 0 ? (
                    <ul className="space-y-1">
                      {complianceIssues.map((issue, idx) => (
                        <li key={idx} className="text-xs flex items-start gap-1 text-red-500">
                          <span className="mt-0.5">⚠️</span> {issue}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex items-center gap-1 text-green-500 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      <span>Design passed all compliance checks</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Sidebar - Mockup Preview */}
            <div className="w-64 border-l h-full flex flex-col overflow-hidden transition-all duration-300">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Shirt className="w-4 h-4 text-primary" />
                  Mockup Preview
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Mockup Controls */}
                <div className="space-y-3">
                  <Label className="text-xs mb-1 block">Product Type</Label>
                  <div className="grid grid-cols-2 gap-1">
                    {mockupOptions.map(option => (
                      <Button
                        key={option.value}
                        variant={mockupBackground === option.value ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs"
                        disabled={option.proOnly}
                        onClick={() => setMockupBackground(option.value)}
                      >
                        {option.label}
                        {option.proOnly && <Lock className="w-3 h-3 ml-1" />}
                      </Button>
                    ))}
                  </div>
                </div>
                
                {/* Mockup Preview Canvas */}
                <div className="border rounded-lg overflow-hidden bg-gray-50 aspect-[3/4] relative">
                  {!generatedDesign && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Shirt className="w-12 h-12 text-muted-foreground/30" />
                    </div>
                  )}
                  <canvas 
                    ref={mockupCanvasRef}
                    className="w-full h-full"
                  />
                </div>
                
                {/* Export Options */}
                <div className="space-y-3 pt-2">
                  <Label htmlFor="resolution" className="text-xs mb-1 block">Export Format</Label>
                  <Select value={resolution} onValueChange={setResolution}>
                    <SelectTrigger id="resolution">
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
                
                {/* Other Settings */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="transparentBg" className="text-xs">Transparent Background</Label>
                    <Switch 
                      id="transparentBg" 
                      checked={transparentBg} 
                      onCheckedChange={setTransparentBg} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="safeMode" className="text-xs">Safe Mode</Label>
                    <Switch 
                      id="safeMode" 
                      checked={safeMode} 
                      onCheckedChange={setSafeMode} 
                    />
                  </div>
                </div>
                
                {/* Canvas Size Info */}
                <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-900/20 space-y-1">
                  <h3 className="text-xs font-medium">Canvas Size</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-xs">4500 × 5400 px</span>
                    <Badge variant="outline" className="text-[10px]">Print Ready</Badge>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    300 DPI, optimal for print-on-demand
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Upload tab content will go here */}
        <TabsContent value="upload" className="h-full overflow-auto">
          <div className="max-w-4xl mx-auto p-4">
            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Upload className="w-5 h-5 text-primary" />
                  Generate from Image
                </CardTitle>
                <CardDescription>
                  Upload an existing design or inspiration image to generate a similar t-shirt design
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Image Upload Section */}
                  <div className="space-y-4">
                    <div 
                      className={cn(
                        "border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/30 transition-colors cursor-pointer",
                        imagePreview ? "border-primary" : "border-border",
                        "min-h-[300px] flex flex-col items-center justify-center"
                      )}
                      onClick={() => document.getElementById('image-upload')?.click()}
                    >
                      <input
                        type="file"
                        id="image-upload"
                        className="hidden"
                        onChange={handleFileChange}
                        accept="image/*"
                      />
                      
                      {imagePreview ? (
                        <div className="space-y-3 w-full">
                          <div className="relative w-full aspect-square overflow-hidden rounded-md border">
                            <img 
                              src={imagePreview} 
                              alt="Preview" 
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mx-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedImage(null);
                              setImagePreview(null);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove Image
                          </Button>
                        </div>
                      ) : (
                        <>
                          <ImageIcon className="w-10 h-10 text-muted-foreground/50 mb-2" />
                          <p className="text-muted-foreground mb-1">Click to upload an image</p>
                          <p className="text-xs text-muted-foreground">PNG, JPG or GIF, max 5MB</p>
                          <Button variant="outline" size="sm" className="mt-4">
                            <Upload className="w-4 h-4 mr-2" />
                            Select File
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Generated Prompt Section */}
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4 min-h-[300px] flex flex-col">
                      <h3 className="text-sm font-medium mb-2">Generated Prompt</h3>
                      
                      {!imagePreview ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                          <MessageSquare className="w-10 h-10 text-muted-foreground/50 mb-2" />
                          <p className="text-muted-foreground mb-1">Upload an image first</p>
                          <p className="text-xs text-muted-foreground">AI will generate a similar design</p>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col">
                          <div className="flex-1">
                            <Textarea
                              value={generatedPrompt}
                              onChange={(e) => setGeneratedPrompt(e.target.value)}
                              placeholder="Your generated prompt will appear here..."
                              className="min-h-[180px] resize-none"
                              readOnly={!generatedPrompt}
                            />
                          </div>
                          
                          <div className="flex gap-2 mt-4">
                            {generatedPrompt ? (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    navigator.clipboard.writeText(generatedPrompt);
                                    toast.success("Prompt copied to clipboard");
                                  }}
                                  className="text-xs flex-1"
                                >
                                  <Copy className="w-3 h-3 mr-2" />
                                  Copy
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setCustomPrompt(generatedPrompt);
                                    setCurrentTab("design");
                                  }}
                                  className="text-xs flex-1"
                                >
                                  <Sparkles className="w-3 h-3 mr-2" />
                                  Use Prompt
                                </Button>
                              </>
                            ) : (
                              <Button 
                                onClick={handleGeneratePrompt} 
                                disabled={!selectedImage || isGenerating}
                                className="w-full"
                              >
                                {isGenerating ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Analyzing...
                                  </>
                                ) : (
                                  <>
                                    <Wand2 className="w-4 h-4 mr-2" />
                                    Generate Prompt
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Gallery tab content will go here */}
        <TabsContent value="gallery" className="h-full overflow-auto">
          <div className="p-4 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Grid className="w-5 h-5 text-primary" />
                Design Gallery
              </h2>
            </div>
            
            {generatedImages.length === 0 ? (
              <div className="text-center py-16 max-w-md mx-auto">
                <Shirt className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-xl font-medium mb-2">No designs yet</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Start by creating your first t-shirt design or uploading an image
                </p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={() => setCurrentTab("design")}>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Create Design
                  </Button>
                  <Button variant="outline" onClick={() => setCurrentTab("upload")}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {generatedImages.map((image) => (
                  <Card key={image.id} className="group overflow-hidden border hover:border-primary/50 transition-all">
                    <div className="relative aspect-square rounded-t-lg overflow-hidden">
                      <img
                        src={image.url}
                        alt={`Design ${image.id}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => {
                            downloadImage(image.url, 'png', `tshirt-design-${image.id}`);
                          }}
                          className="h-9 w-9 rounded-full text-white hover:bg-white/20"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => {
                            navigator.clipboard.writeText(image.prompt);
                            toast.success('Prompt copied to clipboard');
                          }}
                          className="h-9 w-9 rounded-full text-white hover:bg-white/20"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => {
                            setCustomPrompt(image.prompt);
                            setGeneratedDesign(image.url);
                            setCurrentTab("design");
                          }}
                          className="h-9 w-9 rounded-full text-white hover:bg-white/20"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <CardContent className="p-3">
                      <div className="truncate text-sm font-medium mb-1">
                        {image.prompt.length > 40 
                          ? `${image.prompt.substring(0, 40)}...` 
                          : image.prompt}
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-muted-foreground">
                          {formatDate(image.timestamp.toISOString())}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleDeleteImage(image.id)}
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* History tab content will go here */}
        <TabsContent value="history" className="h-full overflow-auto">
          <div className="p-4 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Design History
              </h2>
            </div>
            
            {history.length === 0 ? (
              <div className="text-center py-16 max-w-md mx-auto">
                <History className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-xl font-medium mb-2">Your history is empty</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  When you create designs, they'll be saved here automatically
                </p>
                <Button onClick={() => setCurrentTab("design")}>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Create Your First Design
                </Button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <InfoIcon className="w-4 h-4 mr-2" />
                    <span>Your history is saved locally on this device</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {history.map((item) => (
                    <Card key={item.id} className="group overflow-hidden border hover:border-primary/50 transition-all">
                      <div className="relative aspect-square rounded-t-lg overflow-hidden">
                        <img
                          src={item.imageUrl}
                          alt={`Design ${item.id}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => {
                              downloadImage(item.imageUrl, 'png', `tshirt-${item.id}`);
                            }}
                            className="h-9 w-9 rounded-full text-white hover:bg-white/20"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => {
                              navigator.clipboard.writeText(item.prompt);
                              toast.success('Prompt copied to clipboard');
                            }}
                            className="h-9 w-9 rounded-full text-white hover:bg-white/20"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => {
                              setCustomPrompt(item.prompt);
                              setGeneratedDesign(item.imageUrl);
                              setCurrentTab("design");
                            }}
                            className="h-9 w-9 rounded-full text-white hover:bg-white/20"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <CardContent className="p-3">
                        <div className="truncate text-sm font-medium mb-1">
                          {item.prompt.length > 40 
                            ? `${item.prompt.substring(0, 40)}...` 
                            : item.prompt}
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-muted-foreground">
                            {formatDate(item.createdAt)}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              deleteFromHistory(item.id);
                              setHistory(prev => prev.filter(h => h.id !== item.id));
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        </TabsContent>
      </div>
    </PageLayout>
  );
}; 