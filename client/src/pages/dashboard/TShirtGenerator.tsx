import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  MessageSquare,
  Settings2,
  AlertTriangle,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  CheckCircle,
  Grid,
  Layers,
  Edit,
  Palette,
  Clock,
  X,
  DownloadCloud,
  ChevronLeft,
  ChevronRight
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
  downloadAllImages,
  getDesignHistory, 
  saveToHistory, 
  deleteFromHistory, 
  saveToFavorites as saveToFavoritesService,
  saveToProject as saveToProjectService,
  imageToPrompt
} from "@/services/ideogramService";
import type { DesignHistoryItem } from "@/services/designHistory";
import { HISTORY_STORAGE_KEY } from "@/services/designHistory";
import { PageLayout } from '@/components/layout/PageLayout';

// CSS utility for the grid pattern background
const gridPatternStyle = {
  backgroundSize: '40px 40px',
  backgroundImage: `
    linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
  `,
  backgroundPosition: '0 0'
};

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

// Resolution options
const resolutionOptions = [
  { value: "small", label: "Small (1024×1024)" },
  { value: "medium", label: "Medium (2048×2048)" },
  { value: "large", label: "Large (4096×4096)" }
];

// Number of designs to generate
const designCountOptions = [
  { value: "1", label: "1 Design" },
  { value: "2", label: "2 Designs" },
  { value: "4", label: "4 Designs" }
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

// Update the GeneratedImage interface
interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: Date;
  colors?: string[];
  hasTransparency?: boolean;
  isFavorite?: boolean;
  createdAt?: string;
}

// Update the DesignHistoryItem type to include colors
declare module "@/services/designHistory" {
  interface DesignHistoryItem {
    id: string;
    prompt: string;
    thumbnail: string;
    imageUrl: string;
    style: string;
    colorScheme?: string;
    format: string;
    createdAt: string;
    isFavorite?: boolean;
    colors?: string[]; // Add colors property
  }
}

export const TShirtGenerator = () => {
  // Prompt state
  const [prompt, setPrompt] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  
  // Settings state
  const [resolution, setResolution] = useState("medium");
  const [designCount, setDesignCount] = useState("1");
  const [transparentBg, setTransparentBg] = useState(true);
  const [showSafeZone, setShowSafeZone] = useState(false);
  
  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [currentTab, setCurrentTab] = useState("design");
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // History filters and display options
  const [historyFilter, setHistoryFilter] = useState("all");
  const [historySort, setHistorySort] = useState("newest");
  const [historyView, setHistoryView] = useState("grid");
  
  // Results state
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [currentDesigns, setCurrentDesigns] = useState<GeneratedImage[]>([]);
  const [history, setHistory] = useState<DesignHistoryItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  const MAX_PROMPT_LENGTH = 500;

  // Load history on component mount
  useEffect(() => {
    const savedHistory = getDesignHistory();
    setHistory(savedHistory);
  }, []);

  // Draw the image on canvas when generatedDesign changes
  useEffect(() => {
    if (selectedImage && canvasRef.current) {
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
        img.src = selectedImage.url;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedImage, showSafeZone, prompt]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File is too large. Maximum size is 5MB.");
        return;
      }
      
      setSelectedImage({
        id: Date.now().toString(),
        url: URL.createObjectURL(file),
        prompt: "",
        timestamp: new Date()
      });
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
      // Convert URL to File object for the API call
      const response = await fetch(selectedImage.url);
      const blob = await response.blob();
      const file = new File([blob], "uploaded-image.png", { type: blob.type });
      
      // Call API to analyze image and generate prompt
      const generatedPromptText = await imageToPrompt(file);
      setPrompt(generatedPromptText);
      toast.success("Prompt generated successfully!");
      
      // Auto-populate the design prompt
      if (selectedImage) {
        setSelectedImage({
          ...selectedImage,
          prompt: generatedPromptText
        });
      }
      
      // Switch to design tab
      setCurrentTab("design");
    } catch (error) {
      console.error('Error generating prompt:', error);
      toast.error("Failed to generate prompt");
    } finally {
      setIsGenerating(false);
    }
  };

  // Extract dominant colors from an image
  const extractColors = async (imageUrl: string): Promise<string[]> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        
        if (!ctx) {
          resolve([]);
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        
        // Simple color extraction - more sophisticated algorithms could be used
        const colorMap: {[key: string]: number} = {};
        const step = 4; // Sample every few pixels for performance
        
        for (let i = 0; i < imageData.length; i += 4 * step) {
          // Skip transparent pixels
          if (imageData[i + 3] < 128) continue;
          
          // Convert to hex and round to reduce color variations
          const r = Math.round(imageData[i] / 16) * 16;
          const g = Math.round(imageData[i + 1] / 16) * 16;
          const b = Math.round(imageData[i + 2] / 16) * 16;
          
          const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
          colorMap[hex] = (colorMap[hex] || 0) + 1;
        }
        
        // Sort colors by frequency and get top colors
        const sortedColors = Object.entries(colorMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([color]) => color);
          
        resolve(sortedColors);
      };
      
      img.onerror = () => resolve([]);
      img.src = imageUrl;
    });
  };

  // Generate image from prompt
  const handleGenerateImage = async (): Promise<void> => {
    console.log('Generating image with prompt:', prompt.trim());
    
    if (!prompt.trim()) {
      toast.error('Please enter a prompt first');
      return;
    }

    setIsGenerating(true);
    setCurrentDesigns([]); // Clear current designs
    
    try {
      console.log('Starting image generation with params:', {
        prompt,
        count: parseInt(designCount),
        format: resolution,
        transparentBackground: transparentBg
      });
      
      const count = parseInt(designCount);
      const newImages: GeneratedImage[] = [];
      
      // Show immediate feedback
      const toastId = toast.loading(`Generating ${count} design${count > 1 ? 's' : ''}...`);
      
      // Generate designs in parallel rather than sequentially
      const designPromises = Array.from({ length: count }, async (_, i) => {
        try {
          console.log(`Starting generation of design ${i+1}/${count}`);
          
          // Add values to parameters object
          const params: any = {
            prompt,
            format: resolution,
            transparentBackground: transparentBg
          };
          
          const imageUrl = await generateImage(params);
          
          if (imageUrl) {
            console.log(`Design ${i+1} generated successfully:`, imageUrl);
            
            // Extract colors from the generated image
            const colors = await extractColors(imageUrl);
            
            const newImage: GeneratedImage = {
              id: Date.now().toString() + i,
              url: imageUrl,
              prompt,
              timestamp: new Date(),
              colors
            };
            
            // Add to history with required fields
            const newDesign = saveToHistory({
              prompt,
              thumbnail: imageUrl,
              imageUrl,
              format: resolution.toUpperCase(),
              style: "custom" // Add required style field
            });
            
            // Update the history item with colors
            newDesign.colors = colors;
            
            return newImage;
          } else {
            console.error(`Design ${i+1} failed: Empty image URL`);
            throw new Error('Empty image URL returned');
          }
        } catch (error) {
          console.error(`Error generating design ${i+1}:`, error);
          return null; // Return null for failed generations
        }
      });
      
      // Wait for all designs to be generated
      const results = await Promise.all(designPromises);
      
      // Filter out failed generations
      const successfulImages = results.filter(Boolean) as GeneratedImage[];
      
      // Update state with new designs
      if (successfulImages.length > 0) {
        // Update history with successful designs
        setHistory(prev => [...successfulImages.map(img => {
          // Create history items from the successful images
          const historyItem = saveToHistory({
            prompt,
            thumbnail: img.url,
            imageUrl: img.url,
            format: resolution.toUpperCase(),
            style: "custom"
          });
          historyItem.colors = img.colors;
          return historyItem;
        }), ...prev]);
        
        // Update current designs and selected image
        setCurrentDesigns(successfulImages);
        setGeneratedImages(prev => [...successfulImages, ...prev]);
        setSelectedImage(successfulImages[0]);
        
        // Dismiss loading toast and show success
        toast.dismiss(toastId);
        toast.success(`${successfulImages.length} design${successfulImages.length > 1 ? 's' : ''} generated successfully!`);
      } else {
        toast.dismiss(toastId);
        throw new Error('No designs were successfully generated');
      }
    } catch (error: any) {
      console.error('Error generating images:', error);
      toast.error(error.message || "Failed to generate images");
    } finally {
      setIsGenerating(false);
    }
  };

  // Delete generated image
  const handleDeleteImage = (id: string) => {
    setGeneratedImages(prev => prev.filter(img => img.id !== id));
    if (selectedImage?.id === id) {
      setSelectedImage(null);
    }
  };

  // Handle image download
  const handleDownload = async (imageUrl: string) => {
    if (!imageUrl) {
      toast.error("No image to download");
      return;
    }
    
    if (isDownloading) {
      return; // Prevent multiple downloads
    }
    
    // Show a loading toast that we can update
    const toastId = toast.loading("Preparing download...");
    setIsDownloading(true);
    
    try {
      console.log("Downloading image from URL:", imageUrl);
      
      // Format filename using the first few words of the prompt
      const promptWords = prompt.split(' ').slice(0, 4).join('-').toLowerCase();
      const filename = `tshirt-${promptWords}-${Date.now()}`;
      
      await downloadImage(imageUrl, 'png', filename);
      
      // Update the toast
      toast.dismiss(toastId);
      toast.success("Image downloaded successfully");
    } catch (error) {
      console.error("Error in handleDownload:", error);
      
      // Update the toast
      toast.dismiss(toastId);
      toast.error("Failed to download image. Check console for details.");
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle downloading all images at once
  const handleDownloadAll = async () => {
    if (currentDesigns.length === 0) {
      toast.error("No designs to download");
      return;
    }
    
    if (isDownloadingAll) {
      return; // Prevent multiple batch downloads
    }
    
    setIsDownloadingAll(true);
    
    try {
      // Format images for batch download
      const imagesToDownload = currentDesigns.map(design => ({
        url: design.url,
        prompt: design.prompt || prompt
      }));
      
      // Call the batch download function
      await downloadAllImages(imagesToDownload);
    } catch (error) {
      console.error("Error in handleDownloadAll:", error);
      toast.error("Failed to download all images. Please try again.");
    } finally {
      setIsDownloadingAll(false);
    }
  };

  // Handle regeneration
  const handleRegenerate = () => {
    if (isRegenerating) return;
    
    if (isEditing) {
      setIsEditing(false);
    }
    
    setIsRegenerating(true);
    
    // Use a timeout to ensure UI responsiveness
    setTimeout(() => {
      handleGenerateImage()
        .finally(() => {
          setIsRegenerating(false);
        });
    }, 10);
  };

  // Handle deleting from history
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

  // Handle reusing a prompt
  const handleReusePrompt = (existingPrompt: string) => {
    setPrompt(existingPrompt);
    setCurrentTab("design");
    // Scroll to top of the page
    window.scrollTo(0, 0);
  };
  
  // Handle copying color hex code
  const handleCopyColor = (color: string) => {
    navigator.clipboard.writeText(color);
    toast.success(`Copied ${color} to clipboard`);
  };
  
  // Handle editing prompt
  const handleEditPrompt = () => {
    setIsEditing(true);
    // Focus the text area after state update
    setTimeout(() => {
      if (promptRef.current) {
        promptRef.current.focus();
      }
    }, 0);
  };
  
  // Simplify the handleSelectImage function since we no longer need to check for transparency
  const handleSelectImage = (image: GeneratedImage) => {
    setSelectedImage(image);
  };

  // Debug effect to log state changes
  useEffect(() => {
    console.log("State update - prompt:", prompt, "isGenerating:", isGenerating);
  }, [prompt, isGenerating]);

  // Debug logging for state changes
  useEffect(() => {
    console.log('State values updated:', {
      selectedImage: !!selectedImage,
      isGenerating,
      prompt: prompt.trim(),
      currentTab
    });
  }, [selectedImage, isGenerating, prompt, currentTab]);

  // Add debug log before render
  console.log('RENDER STATE:', { prompt, isGenerating });

  // Create mock-up templates directory if it doesn't exist
  useEffect(() => {
    const createMockupDir = async () => {
      try {
        // Attempt to create the directory structure
        console.log('Setting up mockup templates');
      } catch (error) {
        console.error('Error creating mockup directory:', error);
      }
    };
    
    createMockupDir();
  }, []);

  // Create filtered, sorted history list
  const filteredHistory = React.useMemo(() => {
    // Apply filters
    let result = [...history];
    
    // Filter by criteria
    if (historyFilter === "favorites") {
      result = result.filter(item => item.isFavorite);
    } else if (historyFilter === "recent") {
      // Last 7 days
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      result = result.filter(item => new Date(item.createdAt) >= oneWeekAgo);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return historySort === "newest" ? dateB - dateA : dateA - dateB;
    });
    
    return result;
  }, [history, historyFilter, historySort]);

  return (
    <PageLayout
      title="T-Shirt Design Creator"
      description="Create stunning t-shirt designs with AI. Perfect for print-on-demand and merch."
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <Button 
            variant={currentTab === "design" ? "default" : "outline"} 
            size="sm"
            className="flex items-center gap-2"
            onClick={() => setCurrentTab("design")}
          >
            <Sparkles className="w-4 h-4" />
            Design Creator
          </Button>
        </div>
        <Button 
          variant="default" 
          size="sm"
          className="bg-primary text-white"
          onClick={() => setCurrentTab("design")}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Create Design
        </Button>
      </div>
      
      <div className="flex flex-col h-full overflow-hidden">
        {/* Main tabs */}
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full h-full flex flex-col">
          <div className="border-b pb-2 mb-2">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 bg-background/95 border rounded-lg p-1 z-10">
              <TabsTrigger value="design" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground z-10">
                <Sparkles className="w-4 h-4 mr-2" />
                Design Creator
              </TabsTrigger>
              <TabsTrigger value="image-to-prompt" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground z-10">
                <ImageIcon className="w-4 h-4 mr-2" />
                Image to Prompt
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground z-10">
                <History className="w-4 h-4 mr-2" />
                Design History
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Design Creator Tab */}
          <TabsContent value="design" className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col md:flex-row gap-4 p-3 z-10">
            {/* Left Panel - Controls */}
            <div className="w-full md:w-1/3 flex flex-col space-y-6 z-10">
              {/* Prompt Section */}
              <Card className="shadow-sm z-20 relative">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Sparkles className="w-4 h-4 mr-2 text-primary" />
                    Design Prompt
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 z-20">
                  {isEditing || currentDesigns.length === 0 ? (
                    <>
                      <form 
                        onSubmit={(e) => { 
                          e.preventDefault();
                          if (prompt.trim()) handleGenerateImage();
                        }}
                        className="relative z-30"
                      >
                        <Textarea
                          ref={promptRef}
                          placeholder="Describe your t-shirt design... (e.g., A cute cat wearing sunglasses)"
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          className="min-h-[120px] resize-none focus:ring-2 focus:ring-primary focus:border-primary z-30"
                          maxLength={MAX_PROMPT_LENGTH}
                          required
                          autoFocus
                        />
                        <div className="text-xs text-muted-foreground flex justify-between mt-2">
                          <span>Be specific about what you want in your design</span>
                          <span>{prompt.length}/{MAX_PROMPT_LENGTH}</span>
                        </div>
                        
                        {/* Settings section */}
                        <div className="space-y-4 pt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="resolution" className="text-xs">Image Size</Label>
                              <Select value={resolution} onValueChange={(value) => {
                                console.log("Setting resolution to:", value);
                                setResolution(value);
                              }}>
                                <SelectTrigger id="resolution" className="z-50">
                                  <SelectValue placeholder="Select size" />
                                </SelectTrigger>
                                <SelectContent position="popper" className="z-50">
                                  {resolutionOptions.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="designCount" className="text-xs">Number of Designs</Label>
                              <Select value={designCount} onValueChange={(value) => {
                                console.log("Setting design count to:", value);
                                setDesignCount(value);
                              }}>
                                <SelectTrigger id="designCount" className="z-50">
                                  <SelectValue placeholder="How many designs" />
                                </SelectTrigger>
                                <SelectContent position="popper" className="z-50">
                                  {designCountOptions.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                        
                        <Button 
                          type="submit"
                          disabled={!prompt.trim() || isGenerating}
                          className="w-full mt-6"
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              {currentDesigns.length > 0 ? "Generate New Designs" : "Generate Designs"}
                            </>
                          )}
                        </Button>
                      </form>
                    </>
                  ) : (
                    <>
                      <div className="space-y-3">
                        <div className="p-3 bg-muted/30 rounded-md relative">
                          <p className="pr-8">{prompt}</p>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-2 right-2 h-6 w-6"
                            onClick={handleEditPrompt}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Settings section */}
                      <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="resolution" className="text-xs">Image Size</Label>
                            <Select value={resolution} onValueChange={(value) => {
                              console.log("Setting resolution to:", value);
                              setResolution(value);
                            }}>
                              <SelectTrigger id="resolution" className="z-50">
                                <SelectValue placeholder="Select size" />
                              </SelectTrigger>
                              <SelectContent position="popper" className="z-50">
                                {resolutionOptions.map(option => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="designCount" className="text-xs">Number of Designs</Label>
                            <Select value={designCount} onValueChange={(value) => {
                              console.log("Setting design count to:", value);
                              setDesignCount(value);
                            }}>
                              <SelectTrigger id="designCount" className="z-50">
                                <SelectValue placeholder="How many designs" />
                              </SelectTrigger>
                              <SelectContent position="popper" className="z-50">
                                {designCountOptions.map(option => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={handleGenerateImage}
                        disabled={!prompt.trim() || isGenerating}
                        className="w-full mt-4"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            {currentDesigns.length > 0 ? "Generate New Designs" : "Generate Designs"}
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
              
              {/* Color Palette */}
              {selectedImage && selectedImage.colors && selectedImage.colors.length > 0 && (
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                      <Palette className="w-4 h-4 mr-2 text-primary" />
                      Color Palette
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedImage.colors.map((color, index) => (
                        <TooltipProvider key={index}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                className="h-8 w-8 rounded-full border shadow-sm flex items-center justify-center"
                                style={{ backgroundColor: color }}
                                onClick={() => handleCopyColor(color)}
                              >
                                <span className="sr-only">Copy {color}</span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              <p>Click to copy: {color}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Click any color to copy its hex code</p>
                  </CardContent>
                </Card>
              )}
              
              {/* Recent History Preview */}
              {history.length > 0 && (
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-primary" />
                      Recent Designs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2">
                      {history.slice(0, 6).map((item) => (
                        <div 
                          key={item.id} 
                          className="aspect-square rounded-md border overflow-hidden cursor-pointer hover:border-primary transition-all"
                          onClick={() => {
                            handleReusePrompt(item.prompt);
                          }}
                        >
                          <img 
                            src={item.imageUrl} 
                            alt={item.prompt}
                            className="w-full h-full object-cover" 
                          />
                        </div>
                      ))}
                    </div>
                    {history.length > 6 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full mt-2 text-xs"
                        onClick={() => setCurrentTab("history")}
                      >
                        View All Designs
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Right Panel - Preview */}
            <div className="w-full md:w-2/3 flex flex-col space-y-4">
              {/* Preview Area */}
              <Card className="flex-1 shadow-sm overflow-hidden flex flex-col">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <div className="flex items-center">
                      <Shirt className="w-4 h-4 mr-2 text-primary" />
                      Design Preview
                    </div>
                    {selectedImage && (
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => handleRegenerate()}
                          disabled={isGenerating || isRegenerating}
                          className="relative"
                        >
                          {isRegenerating ? (
                            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3.5 h-3.5 mr-1" />
                          )}
                          Regenerate
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownload(selectedImage.url)}
                          disabled={isGenerating || isDownloading}
                          className="relative"
                        >
                          {isDownloading ? (
                            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5 mr-1" />
                          )}
                          Download
                        </Button>
                        {currentDesigns.length > 1 && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleDownloadAll}
                            disabled={isGenerating || isDownloadingAll || currentDesigns.length === 0}
                            className="relative"
                          >
                            {isDownloadingAll ? (
                              <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                            ) : (
                              <DownloadCloud className="w-3.5 h-3.5 mr-1" />
                            )}
                            Download All
                          </Button>
                        )}
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                
                <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900/20 relative">
                  {isGenerating ? (
                    <div className="flex flex-col items-center gap-2 p-6">
                      <Loader2 className="w-10 h-10 animate-spin text-primary" />
                      <p className="font-medium">Creating your T-shirt designs</p>
                      <p className="text-sm text-muted-foreground">This may take 10-20 seconds...</p>
                    </div>
                  ) : !selectedImage ? (
                    <div className="text-center p-8 max-w-lg">
                      <Shirt className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                      <p className="text-xl font-medium mb-2">Create your T-shirt design</p>
                      <p className="text-sm text-muted-foreground mb-6">
                        Enter your prompt, customize your settings, and click Generate to create unique T-shirt designs with AI.
                      </p>
                    </div>
                  ) : (
                    <div className="relative inline-block">
                      {/* Display the image directly */}
                      <img 
                        src={selectedImage.url}
                        alt={selectedImage.prompt}
                        className="max-w-full max-h-[40vh] object-contain mb-4"
                        style={{
                          transform: `scale(${zoomLevel})`,
                          transformOrigin: 'center'
                        }}
                      />
                      
                      {/* Debug/hidden canvas for processing */}
                      <canvas 
                        ref={canvasRef}
                        className="hidden"
                      />
                      
                      {/* Zoom controls */}
                      <div className="absolute top-4 right-4 flex items-center gap-1 bg-background/90 p-1 rounded-lg shadow-md border">
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
              </Card>
              
              {/* Generated Designs Grid */}
              {currentDesigns.length > 0 && (
                <>
                  {historyView === "grid" ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 mb-6">
                      {currentDesigns.map((design) => (
                        <div 
                          key={design.id} 
                          className={cn(
                            "aspect-square rounded-lg border-2 overflow-hidden cursor-pointer hover:shadow-md transition-all",
                            selectedImage?.id === design.id ? "border-primary" : "border-transparent"
                          )}
                          onClick={() => handleSelectImage(design)}
                        >
                          <img 
                            src={design.url} 
                            alt={design.prompt}
                            className="w-full h-full object-cover" 
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3 mb-6">
                      {currentDesigns.map((design, index) => (
                        <motion.div
                          key={design.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.03 }}
                        >
                          <Card className="group overflow-hidden border hover:border-primary/50 transition-all duration-300 hover:shadow-sm bg-background/90 backdrop-blur-sm">
                            <div className="flex flex-col sm:flex-row">
                              <div className="relative w-full sm:w-32 h-32 sm:h-auto">
                                <img
                                  src={design.url}
                                  alt={`Design ${design.id}`}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="absolute top-2 right-2 h-7 w-7 bg-black/30 backdrop-blur-sm text-white hover:bg-white/20 rounded-full"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    saveToFavoritesService(design.id);
                                    const updatedHistory = history.map(historyItem => 
                                      historyItem.id === design.id 
                                        ? { ...historyItem, isFavorite: !historyItem.isFavorite } 
                                        : historyItem
                                    );
                                    setHistory(updatedHistory);
                                    toast.success(design.isFavorite ? 'Removed from favorites' : 'Added to favorites');
                                  }}
                                >
                                  <Heart className={`w-4 h-4 ${design.isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                                </Button>
                              </div>
                              
                              <div className="flex-1 p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h3 className="font-medium line-clamp-1">{design.prompt}</h3>
                                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                      <Badge variant="outline" className="text-xs px-2 py-0 h-5 bg-primary/5">
                                        {design.createdAt ? formatDate(design.createdAt) : new Date(design.timestamp).toLocaleDateString()}
                                      </Badge>
                                    </div>
                                  </div>
                                  
                                  <div className="flex gap-1">
                                    <Button 
                                      size="icon" 
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownload(design.url);
                                      }}
                                      className="h-8 w-8"
                                    >
                                      <Download className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      size="icon" 
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleReusePrompt(design.prompt);
                                        setCurrentTab("design");
                                      }}
                                      className="h-8 w-8"
                                    >
                                      <RefreshCw className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive hover:text-destructive/80"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteFromHistory(design.id);
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                                
                                {/* Color chips */}
                                {design.colors && design.colors.length > 0 && (
                                  <div className="flex gap-1 mt-2">
                                    {design.colors.slice(0, 5).map((color, index) => (
                                      <TooltipProvider key={index}>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <motion.div 
                                              className="w-4 h-4 rounded-full cursor-pointer shadow-sm transform hover:scale-110 transition-transform"
                                              style={{ backgroundColor: color }}
                                              onClick={(e) => {
                                                e.stopPropagation(); 
                                                handleCopyColor(color);
                                              }}
                                              whileHover={{ scale: 1.2 }}
                                              transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                            />
                                          </TooltipTrigger>
                                          <TooltipContent side="bottom" className="text-xs">
                                            <p>Copy: {color}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                  
                  {/* Batch actions row */}
                  {currentDesigns.length > 1 && (
                    <div className="flex justify-end gap-2 mt-3 mb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadAll}
                        disabled={isDownloadingAll}
                        className="text-sm"
                      >
                        {isDownloadingAll ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            <DownloadCloud className="w-3.5 h-3.5 mr-1.5" />
                            Download All {currentDesigns.length} Designs
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>
          
          {/* Image to Prompt Tab */}
          <TabsContent value="image-to-prompt" className="flex-1 overflow-y-auto overflow-x-hidden p-3 z-10">
            <div className="max-w-3xl mx-auto">
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <ImageIcon className="w-4 h-4 mr-2 text-primary" />
                    Image to Prompt Converter
                  </CardTitle>
                  <CardDescription>
                    Upload an existing T-shirt design image to automatically generate a descriptive prompt
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* File Drop Area */}
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer relative">
                    <input
                      type="file"
                      id="image-upload"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                      accept="image/*"
                    />
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <p className="font-medium">Click to upload or drag and drop</p>
                      <p className="text-sm text-muted-foreground">
                        PNG, JPG or GIF (max. 5MB)
                      </p>
                    </div>
                  </div>
                  
                  {/* Preview Area */}
                  {selectedImage && (
                    <div className="border rounded-lg p-4 space-y-4">
                      <div className="aspect-square max-h-[300px] rounded overflow-hidden mx-auto">
                        <img 
                          src={selectedImage.url} 
                          alt="Uploaded design" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-medium">Image Preview</h3>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setSelectedImage(null)}
                            className="text-destructive"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          <Button
                            onClick={handleGeneratePrompt}
                            disabled={isGenerating || !selectedImage}
                            className="w-full"
                          >
                            {isGenerating ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Analyzing image...
                              </>
                            ) : (
                              <>
                                <Wand2 className="w-4 h-4 mr-2" />
                                Generate Prompt from Image
                              </>
                            )}
                          </Button>
                          
                          {prompt && (
                            <div className="mt-4 space-y-2">
                              <h4 className="font-medium">Generated Prompt:</h4>
                              <div className="p-3 bg-muted/30 rounded-md">
                                <p>{prompt}</p>
                              </div>
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    navigator.clipboard.writeText(prompt);
                                    toast.success("Prompt copied to clipboard");
                                  }}
                                >
                                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                                  Copy
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => {
                                    setCurrentTab("design");
                                    // The prompt is already set from the handleGeneratePrompt function
                                  }}
                                >
                                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                                  Use This Prompt
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* History Tab */}
          <TabsContent value="history" className="flex-1 overflow-auto p-3 bg-gradient-to-b from-background to-background/50">
            <div className="w-full max-w-[1400px] mx-auto">
              {/* Header section with background */}
              <div className="relative overflow-hidden rounded-xl mb-5 bg-gradient-to-r from-primary/20 via-primary/10 to-background border shadow-md">
                <div className="absolute inset-0 opacity-5" style={gridPatternStyle}></div>
                <div className="relative z-10 px-5 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-3xl font-bold flex items-center gap-3 mb-1">
                      <div className="bg-primary/20 p-2.5 rounded-lg">
                        <History className="w-6 h-6 text-primary" />
                      </div>
                      <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                        Design History
                      </span>
                    </h2>
                    <p className="text-muted-foreground max-w-lg">
                      Browse and manage your previously generated T-shirt designs. 
                      Click on any design to view details or reuse the prompt.
                    </p>
                  </div>
                  
                  {history.length > 0 && (
                    <div className="flex flex-wrap gap-2 sm:self-start">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCurrentTab("design")}
                        className="flex items-center gap-2 bg-background/90 backdrop-blur-sm"
                      >
                        <Plus className="w-4 h-4" />
                        New Design
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const confirmed = window.confirm("Clear all design history? This cannot be undone.");
                          if (confirmed) {
                            localStorage.setItem(HISTORY_STORAGE_KEY, "[]");
                            setHistory([]);
                            toast.success("Design history cleared");
                          }
                        }}
                        className="text-destructive border-destructive/30 hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Clear History
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              {history.length === 0 ? (
                <div className="text-center py-20 max-w-md mx-auto bg-background/50 backdrop-blur-sm rounded-xl border border-primary/10 shadow-lg">
                  <div className="bg-primary/5 w-20 h-20 flex items-center justify-center rounded-full mx-auto mb-6">
                    <History className="w-10 h-10 text-primary/40" />
                  </div>
                  <h3 className="text-xl font-medium mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">Your design journey begins here</h3>
                  <p className="text-sm text-muted-foreground mb-8 max-w-xs mx-auto">
                    As you create designs, they'll be automatically saved to your personal collection
                  </p>
                  <Button 
                    onClick={() => setCurrentTab("design")}
                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-md"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create Your First Design
                  </Button>
                </div>
              ) : (
                <>
                  {/* Filter and sort controls */}
                  <div className="mb-4 flex flex-wrap items-center gap-3 p-3 rounded-lg bg-background/90 backdrop-blur-sm border shadow-sm">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="history-filter" className="text-sm font-medium">Filter:</Label>
                      <Select value={historyFilter} onValueChange={setHistoryFilter}>
                        <SelectTrigger id="history-filter" className="w-[150px] h-9 text-sm">
                          <SelectValue placeholder="All designs" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All designs</SelectItem>
                          <SelectItem value="favorites">Favorites</SelectItem>
                          <SelectItem value="recent">Last 7 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Label htmlFor="history-layout" className="text-sm font-medium">View:</Label>
                      <Select value={historyView} onValueChange={setHistoryView}>
                        <SelectTrigger id="history-layout" className="w-[120px] h-9 text-sm">
                          <SelectValue placeholder="Grid view" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="grid">Grid view</SelectItem>
                          <SelectItem value="list">List view</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-auto">
                      <Label htmlFor="history-sort" className="text-sm font-medium">Sort by:</Label>
                      <Select value={historySort} onValueChange={setHistorySort}>
                        <SelectTrigger id="history-sort" className="w-[150px] h-9 text-sm">
                          <SelectValue placeholder="Newest first" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Newest first</SelectItem>
                          <SelectItem value="oldest">Oldest first</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Design count and export options */}
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm text-muted-foreground">
                      Showing <span className="font-medium text-foreground">{filteredHistory.length}</span> designs
                    </p>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => {
                        // Check if there are designs to export
                        if (history.length === 0) {
                          toast.error("No designs to export");
                          return;
                        }
                        
                        // Convert history items to format needed for downloadAllImages function
                        const imagesToDownload = history.map(item => ({
                          url: item.imageUrl,
                          prompt: item.prompt
                        }));
                        
                        // Call downloadAllImages with toast notifications
                        toast.promise(
                          downloadAllImages(imagesToDownload),
                          {
                            loading: `Preparing ${history.length} designs for download...`,
                            success: `Successfully exported ${history.length} designs`,
                            error: "Failed to export designs. Please try again."
                          }
                        );
                      }}
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      Export All
                    </Button>
                  </div>
                
                  {/* Main grid of designs */}
                  {historyView === "grid" ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 mb-6">
                      {filteredHistory.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.03 }}
                        >
                          <Card className="group overflow-hidden border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 bg-background/90 backdrop-blur-sm h-full flex flex-col">
                            <div className="relative aspect-square rounded-t-lg overflow-hidden">
                              <img
                                src={item.imageUrl}
                                alt={`Design ${item.id}`}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                loading="lazy"
                              />
                              
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                                <motion.div 
                                  className="flex items-center gap-2 mt-12"
                                  initial={{ y: 20, opacity: 0 }}
                                  whileInView={{ y: 0, opacity: 1 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <Button 
                                    size="icon" 
                                    variant="secondary"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownload(item.imageUrl);
                                    }}
                                    className="h-9 w-9 rounded-full backdrop-blur-md bg-white/10 text-white hover:bg-white/20 shadow-lg"
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    size="icon" 
                                    variant="secondary"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(item.prompt);
                                      toast.success('Prompt copied to clipboard');
                                    }}
                                    className="h-9 w-9 rounded-full backdrop-blur-md bg-white/10 text-white hover:bg-white/20 shadow-lg"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    size="icon" 
                                    variant="secondary"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReusePrompt(item.prompt);
                                      setCurrentTab("design");
                                    }}
                                    className="h-9 w-9 rounded-full backdrop-blur-md bg-white/10 text-white hover:bg-white/20 shadow-lg"
                                  >
                                    <RefreshCw className="w-4 h-4" />
                                  </Button>
                                </motion.div>
                              </div>
                              
                              {/* Favorite button */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 h-7 w-7 bg-black/30 backdrop-blur-sm text-white hover:bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  saveToFavoritesService(item.id);
                                  const updatedHistory = history.map(historyItem => 
                                    historyItem.id === item.id 
                                      ? { ...historyItem, isFavorite: !historyItem.isFavorite } 
                                      : historyItem
                                  );
                                  setHistory(updatedHistory);
                                  toast.success(item.isFavorite ? 'Removed from favorites' : 'Added to favorites');
                                }}
                              >
                                <Heart className={`w-4 h-4 ${item.isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                              </Button>
                            </div>
                            
                            <CardContent className="p-3 flex-1 flex flex-col">
                              <div className="truncate text-sm font-medium mb-2">
                                {item.prompt.length > 40 
                                  ? `${item.prompt.substring(0, 40)}...` 
                                  : item.prompt}
                              </div>
                              
                              <div className="mt-auto flex justify-between items-center">
                                <Badge variant="outline" className="text-xs px-2 py-0 h-5 bg-primary/5">
                                  {formatDate(item.createdAt)}
                                </Badge>
                                
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteFromHistory(item.id);
                                  }}
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive transition-colors" />
                                </Button>
                              </div>
                              
                              {/* Color chips */}
                              {item.colors && item.colors.length > 0 && (
                                <div className="flex gap-1 mt-2">
                                  {item.colors.slice(0, 5).map((color, index) => (
                                    <TooltipProvider key={index}>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <motion.div 
                                            className="w-4 h-4 rounded-full cursor-pointer shadow-sm transform hover:scale-110 transition-transform"
                                            style={{ backgroundColor: color }}
                                            onClick={(e) => {
                                              e.stopPropagation(); 
                                              handleCopyColor(color);
                                            }}
                                            whileHover={{ scale: 1.2 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                          />
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" className="text-xs">
                                          <p>Copy: {color}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  ))}
                                </div>
                              )}
                              
                              {/* Style badge */}
                              {item.style && (
                                <div className="mt-2">
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-primary/5">
                                    {item.style}
                                  </Badge>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3 mb-6">
                      {filteredHistory.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.03 }}
                        >
                          <Card className="group overflow-hidden border hover:border-primary/50 transition-all duration-300 hover:shadow-sm bg-background/90 backdrop-blur-sm">
                            <div className="flex flex-col sm:flex-row">
                              <div className="relative w-full sm:w-32 h-32 sm:h-auto">
                                <img
                                  src={item.imageUrl}
                                  alt={`Design ${item.id}`}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="absolute top-2 right-2 h-7 w-7 bg-black/30 backdrop-blur-sm text-white hover:bg-white/20 rounded-full"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    saveToFavoritesService(item.id);
                                    const updatedHistory = history.map(historyItem => 
                                      historyItem.id === item.id 
                                        ? { ...historyItem, isFavorite: !historyItem.isFavorite } 
                                        : historyItem
                                    );
                                    setHistory(updatedHistory);
                                    toast.success(item.isFavorite ? 'Removed from favorites' : 'Added to favorites');
                                  }}
                                >
                                  <Heart className={`w-4 h-4 ${item.isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                                </Button>
                              </div>
                              
                              <div className="flex-1 p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h3 className="font-medium line-clamp-1">{item.prompt}</h3>
                                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                      <Badge variant="outline" className="text-xs px-2 py-0 h-5 bg-primary/5">
                                        {formatDate(item.createdAt)}
                                      </Badge>
                                    </div>
                                  </div>
                                  
                                  <div className="flex gap-1">
                                    <Button 
                                      size="icon" 
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownload(item.imageUrl);
                                      }}
                                      className="h-8 w-8"
                                    >
                                      <Download className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      size="icon" 
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(item.prompt);
                                        toast.success('Prompt copied to clipboard');
                                      }}
                                      className="h-8 w-8"
                                    >
                                      <Copy className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      size="icon" 
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleReusePrompt(item.prompt);
                                        setCurrentTab("design");
                                      }}
                                      className="h-8 w-8"
                                    >
                                      <RefreshCw className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive hover:text-destructive/80"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteFromHistory(item.id);
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                                
                                {/* Color chips */}
                                {item.colors && item.colors.length > 0 && (
                                  <div className="flex gap-1 mt-2">
                                    {item.colors.slice(0, 5).map((color, index) => (
                                      <TooltipProvider key={index}>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <motion.div 
                                              className="w-4 h-4 rounded-full cursor-pointer shadow-sm transform hover:scale-110 transition-transform"
                                              style={{ backgroundColor: color }}
                                              onClick={(e) => {
                                                e.stopPropagation(); 
                                                handleCopyColor(color);
                                              }}
                                              whileHover={{ scale: 1.2 }}
                                              transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                            />
                                          </TooltipTrigger>
                                          <TooltipContent side="bottom" className="text-xs">
                                            <p>Copy: {color}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                  
                  {/* Pagination */}
                  {filteredHistory.length > 24 && (
                    <div className="flex justify-center mt-2 mb-4">
                      <div className="flex items-center space-x-2 bg-background/90 backdrop-blur-sm p-1 rounded-lg border shadow-sm">
                        <Button variant="outline" size="icon" className="h-8 w-8">
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 w-8 bg-primary/10">1</Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8">2</Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8">3</Button>
                        <span className="text-sm text-muted-foreground">...</span>
                        <Button variant="ghost" size="sm" className="h-8 w-8">{Math.ceil(filteredHistory.length / 24)}</Button>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}; 