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
      title="T-Shirt Design Generator"
      description="Create professional t-shirt designs using AI. Optimized for print-on-demand platforms like Amazon Merch."
    >
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-background/95 border rounded-lg p-1">
          <TabsTrigger 
            value="design" 
            className="relative z-10 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Design Generator
          </TabsTrigger>
          <TabsTrigger 
            value="upload" 
            className="relative z-10 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Upload className="w-4 h-4 mr-2" />
            Image to Prompt
          </TabsTrigger>
          <TabsTrigger 
            value="gallery" 
            className="relative z-10 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Grid className="w-4 h-4 mr-2" />
            Design Gallery
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="relative z-10 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <History className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Design Generator Tab - Main T-shirt design studio */}
        <TabsContent value="design" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Panel - Prompt Input */}
            <Card className="lg:col-span-4 border-2 relative">
              {isGenerating && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
                  <div className="flex flex-col items-center gap-2 p-4 bg-background/80 rounded-lg shadow-lg">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="font-medium">Generating your design...</p>
                    <p className="text-xs text-muted-foreground">This may take 10-15 seconds</p>
                  </div>
                </div>
              )}
              <CardHeader className="p-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Prompt Settings
                </CardTitle>
                <CardDescription>
                  Describe what you want to see on your t-shirt
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* Main Prompt */}
                <div className="space-y-2">
                  <Label htmlFor="prompt" className="font-medium">Describe your t-shirt design</Label>
                  <Textarea
                    id="prompt"
                    placeholder="e.g., A vintage-style cat wearing sunglasses riding a skateboard"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="min-h-[80px] resize-y"
                    maxLength={MAX_PROMPT_LENGTH}
                    required
                  />
                  <div className="text-xs text-muted-foreground flex justify-between">
                    <span>Be specific about style, colors, and mood</span>
                    <span>{customPrompt.length}/{MAX_PROMPT_LENGTH}</span>
                  </div>
                </div>

                {/* Negative Prompt */}
                <div className="space-y-2">
                  <Label htmlFor="negative-prompt" className="font-medium">Exclude elements</Label>
                  <Textarea
                    id="negative-prompt"
                    placeholder="e.g., No background, no human, no text"
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    className="min-h-[60px] resize-y"
                  />
                  <div className="text-xs text-muted-foreground">
                    Specify what you don't want in the design
                  </div>
                </div>
                
                {/* Style Dropdown */}
                <div className="space-y-2">
                  <Label htmlFor="style" className="font-medium">Select Style</Label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger id="style">
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      {styleOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                          <span className="text-xs text-muted-foreground ml-2">
                            {option.description}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Design Type Toggle */}
                <div className="space-y-2">
                  <Label className="font-medium">Design Type</Label>
                  <div className="flex gap-2">
                    {designTypeOptions.map(option => (
                      <Button
                        key={option.value}
                        variant={designType === option.value ? "default" : "outline"}
                        size="sm"
                        className="flex-1"
                        onClick={() => setDesignType(option.value)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
                
                {/* Color Limit */}
                <div className="space-y-2">
                  <Label htmlFor="color-limit" className="font-medium">Limit number of colors</Label>
                  <Select value={colorLimit} onValueChange={setColorLimit}>
                    <SelectTrigger id="color-limit">
                      <SelectValue placeholder="Select color limit" />
                    </SelectTrigger>
                    <SelectContent>
                      {colorLimitOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                          <span className="text-xs text-muted-foreground ml-2">
                            {option.description}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Creativity Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="creativity" className="font-medium">Creativity Level</Label>
                    <span className="text-sm">{creativityLevel[0]}%</span>
                  </div>
                  <Slider
                    id="creativity"
                    value={creativityLevel}
                    onValueChange={setCreativityLevel}
                    max={100}
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Predictable</span>
                    <span>Experimental</span>
                  </div>
                </div>
                
                {/* Generate Button */}
                <Button 
                  onClick={handleGenerateImage}
                  disabled={!customPrompt.trim() || isGenerating}
                  className="w-full h-12 text-lg relative mt-4"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  {isGenerating ? 'Generating...' : 'Generate Design'}
                </Button>
                
                {/* Example Prompts */}
                <div className="pt-4">
                  <Label className="text-sm font-medium">Prompt Examples</Label>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    {[
                      "Funny Christmas cat in ugly sweater, vintage style",
                      "Retro sun and waves for summer, minimalist",
                      "Mountain landscape silhouette with stars, geometric"
                    ].map((example, idx) => (
                      <Button 
                        key={idx}
                        variant="outline" 
                        size="sm"
                        className="justify-start h-auto py-1 px-2 text-xs"
                        onClick={() => setCustomPrompt(example)}
                      >
                        <Copy className="w-3 h-3 mr-2" />
                        {example}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Middle Panel - Design Preview */}
            <Card className="lg:col-span-5 border-2">
              <CardHeader className="p-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Shirt className="w-5 h-5 text-primary" />
                  Design Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Design Canvas */}
                  <div className="relative border rounded-lg overflow-hidden bg-gray-50 min-h-[400px] flex flex-col items-center justify-center">
                    {!generatedDesign && (
                      <div className="text-center p-8">
                        <Shirt className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-muted-foreground">Your design will appear here</p>
                        <p className="text-xs text-muted-foreground mt-1">Enter your prompt and click Generate</p>
                      </div>
                    )}
                    <canvas 
                      ref={canvasRef}
                      className="max-w-full"
                      style={{
                        transform: `scale(${zoomLevel})`,
                        transformOrigin: 'center'
                      }}
                    />
                    
                    {/* Zoom controls */}
                    {generatedDesign && (
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-background/80 p-1 rounded-md">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.1))}
                          className="h-8 w-8"
                        >
                          <ZoomOut className="h-4 w-4" />
                        </Button>
                        <span className="text-xs w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setZoomLevel(prev => Math.min(2, prev + 0.1))}
                          className="h-8 w-8"
                        >
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Control buttons */}
                  {generatedDesign && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSafeZone(!showSafeZone)}
                        className="flex-grow"
                      >
                        {showSafeZone ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
                        {showSafeZone ? "Hide Safe Zone" : "Show Safe Zone"}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(resolution)}
                        className="flex-grow"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      
                      <Button
                        onClick={() => setShowCompliance(!showCompliance)}
                        variant={showCompliance ? "default" : "outline"}
                        size="sm"
                        className="flex-grow"
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Compliance
                      </Button>
                    </div>
                  )}
                  
                  {/* Compliance checker section */}
                  {showCompliance && (
                    <div className="border rounded-lg p-3 bg-background/50">
                      <h3 className="text-sm font-medium mb-2 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        Compliance Check
                      </h3>
                      
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
                      
                      <div className="text-xs text-muted-foreground mt-2">
                        This check helps identify potential issues for print-on-demand services.
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Right Panel - Settings */}
            <Card className="lg:col-span-3 border-2">
              <CardHeader className="p-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-primary" />
                  Settings & Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* Canvas Size Info */}
                <div className="border rounded-lg p-3 bg-background/50 space-y-2">
                  <h3 className="text-sm font-medium">Canvas Size</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">4500 × 5400 px</span>
                    <Badge variant="outline" className="text-xs">Amazon Merch Size</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    300 DPI, optimal for print-on-demand
                  </div>
                </div>
                
                {/* Background Toggle */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="transparentBg" className="font-medium">Transparent Background</Label>
                    <Switch 
                      id="transparentBg" 
                      checked={transparentBg} 
                      onCheckedChange={setTransparentBg} 
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Recommended for DTG printing
                  </div>
                </div>
                
                {/* Safe Mode Toggle */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="safeMode" className="font-medium">Safe Mode</Label>
                    <Switch 
                      id="safeMode" 
                      checked={safeMode} 
                      onCheckedChange={setSafeMode} 
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Filters inappropriate content
                  </div>
                </div>
                
                {/* Format Selection */}
                <div className="space-y-2">
                  <Label htmlFor="resolution" className="font-medium">Export Format</Label>
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
                
                {/* Seed Field */}
                <div className="space-y-2">
                  <Label htmlFor="seed" className="font-medium">
                    Seed (Optional)
                  </Label>
                  <Input
                    id="seed"
                    placeholder="e.g., 42069"
                    value={seedValue}
                    onChange={(e) => {
                      // Only allow numbers
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setSeedValue(value);
                    }}
                  />
                  <div className="text-xs text-muted-foreground">
                    Generate repeatable results
                  </div>
                </div>
                
                {/* T-shirt Mockup */}
                <div className="space-y-2 mt-4">
                  <h3 className="text-sm font-medium">T-shirt Mockup</h3>
                  
                  {/* Mockup selection */}
                  <div className="grid grid-cols-4 gap-2">
                    {mockupOptions.map(option => (
                      <Button
                        key={option.value}
                        variant={mockupBackground === option.value ? "default" : "outline"}
                        size="sm"
                        className="p-1 h-auto text-xs"
                        disabled={option.proOnly}
                        onClick={() => setMockupBackground(option.value)}
                      >
                        {option.label}
                        {option.proOnly && <Lock className="w-3 h-3 ml-1" />}
                      </Button>
                    ))}
                  </div>
                  
                  {/* Mockup preview */}
                  <div className="border rounded-lg overflow-hidden bg-gray-50 aspect-[3/4] relative">
                    {!generatedDesign && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Shirt className="w-12 h-12 text-muted-foreground/50" />
                      </div>
                    )}
                    <canvas 
                      ref={mockupCanvasRef}
                      className="w-full h-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Upload/Image to Prompt Tab */}
        <TabsContent value="upload" className="mt-6">
          <Card className="border-2 relative">
            {isGenerating && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <p>Analyzing image...</p>
                </div>
              </div>
            )}
            <CardHeader>
              <CardTitle>Generate Prompt from Image</CardTitle>
              <CardDescription>
                Upload an image to get a prompt that will create a similar t-shirt design
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image Upload Section */}
                <div className="space-y-4">
                  <div 
                    className={cn(
                      "border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors",
                      imagePreview ? "border-primary" : "border-border",
                      "min-h-[300px] flex items-center justify-center"
                    )}
                  >
                    <input
                      id="image-upload"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    {!imagePreview ? (
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
                    ) : (
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
                </div>

                {/* Generated Prompt Section */}
                <div className="space-y-4">
                  <Button
                    onClick={handleGeneratePrompt}
                    disabled={!selectedImage || isGenerating}
                    className="w-full relative"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    {isGenerating ? 'Analyzing...' : 'Generate Prompt'}
                  </Button>
                  {generatedPrompt && (
                    <div className="space-y-2">
                      <Label htmlFor="generated-prompt">Generated Prompt</Label>
                      <Textarea
                        id="generated-prompt"
                        value={generatedPrompt}
                        readOnly
                        className="min-h-[200px]"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(generatedPrompt);
                            toast.success('Prompt copied to clipboard');
                          }}
                          className="flex-1"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Prompt
                        </Button>
                        <Button
                          onClick={() => {
                            setCustomPrompt(generatedPrompt);
                            setCurrentTab("design");
                          }}
                          className="flex-1"
                        >
                          <Wand2 className="w-4 h-4 mr-2" />
                          Use Prompt
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gallery Tab */}
        <TabsContent value="gallery" className="mt-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Your Generated Designs</CardTitle>
              <CardDescription>
                View and manage your recent designs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generatedImages.length === 0 ? (
                <div className="text-center py-12">
                  <Shirt className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No designs yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start by creating your first t-shirt design
                  </p>
                  <Button onClick={() => setCurrentTab("design")}>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Create Design
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {generatedImages.map((image) => (
                    <Card key={image.id} className="group overflow-hidden border">
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
                              onClick={() => {
                                downloadImage(image.url, 'png', `tshirt-design-${image.id}`);
                              }}
                              className="h-8 w-8 text-white"
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
                              className="h-8 w-8 text-white"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={() => {
                                handleDeleteImage(image.id);
                              }}
                              className="h-8 w-8 text-white"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="truncate text-xs mb-1">
                          {image.prompt.length > 60 
                            ? `${image.prompt.substring(0, 60)}...` 
                            : image.prompt}
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-muted-foreground">
                            {formatDate(image.timestamp.toISOString())}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setCustomPrompt(image.prompt);
                              setGeneratedDesign(image.url);
                              setCurrentTab("design");
                            }}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Design History</CardTitle>
              <CardDescription>
                View all your saved designs across sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No history yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your design history will be saved here
                  </p>
                  <Button onClick={() => setCurrentTab("design")}>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Create Design
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {history.map((item) => (
                    <Card key={item.id} className="group overflow-hidden border">
                      <CardContent className="p-3">
                        <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-2 border border-border">
                          <img
                            src={item.imageUrl}
                            alt={`Design ${item.id}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={() => {
                                downloadImage(item.imageUrl, 'png', `tshirt-${item.id}`);
                              }}
                              className="h-8 w-8 text-white"
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
                              className="h-8 w-8 text-white"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={() => {
                                deleteFromHistory(item.id);
                                setHistory(prev => prev.filter(h => h.id !== item.id));
                              }}
                              className="h-8 w-8 text-white"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="truncate text-xs mb-1">
                          {item.prompt.length > 60 
                            ? `${item.prompt.substring(0, 60)}...` 
                            : item.prompt}
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-muted-foreground">
                            {formatDate(item.createdAt)}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setCustomPrompt(item.prompt);
                              setGeneratedDesign(item.imageUrl);
                              setCurrentTab("design");
                            }}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}; 