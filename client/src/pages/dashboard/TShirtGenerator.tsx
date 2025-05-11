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
  X
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
  imageToPrompt,
  removeBackground
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
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const [currentTab, setCurrentTab] = useState("design");
  const [zoomLevel, setZoomLevel] = useState(1);
  
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

  // New function for handling background removal
  const handleRemoveBackground = async () => {
    if (!selectedImage) {
      toast.error("No image selected");
      return;
    }
    
    // Show a loading toast that we can update
    const toastId = toast.loading("Removing background...");
    setIsRemovingBackground(true);
    
    try {
      console.log("Removing background from:", selectedImage.url);
      
      // Remove background using the service function
      const transparentImageUrl = await removeBackground(selectedImage.url);
      
      // Create a new image object with the transparent version
      const updatedImage = {
        ...selectedImage,
        url: transparentImageUrl,
        hasTransparency: true
      };
      
      // Update states
      setSelectedImage(updatedImage);
      
      // Update current designs array
      setCurrentDesigns(prev => 
        prev.map(img => img.id === updatedImage.id ? updatedImage : img)
      );
      
      // Update generated images array
      setGeneratedImages(prev => 
        prev.map(img => img.id === updatedImage.id ? updatedImage : img)
      );
      
      // Update the toast
      toast.dismiss(toastId);
      toast.success("Background removed successfully");
    } catch (error) {
      console.error("Error removing background:", error);
      
      // Update the toast
      toast.dismiss(toastId);
      toast.error(error instanceof Error ? error.message : "Failed to remove background");
    } finally {
      setIsRemovingBackground(false);
    }
  };

  return (
    <PageLayout
      title="T-Shirt Design Creator"
      description="Create stunning t-shirt designs with AI. Perfect for print-on-demand and merch."
    >
      <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden">
        {/* Main tabs */}
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full h-full flex flex-col">
          <div className="border-b pb-2 mb-4">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-background/95 border rounded-lg p-1 z-10">
              <TabsTrigger value="design" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground z-10">
                <Sparkles className="w-4 h-4 mr-2" />
                Design Creator
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground z-10">
                <History className="w-4 h-4 mr-2" />
                Design History
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Design Creator Tab */}
          <TabsContent value="design" className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col md:flex-row gap-6 p-4 z-10">
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

                          <div className="flex items-center justify-between">
                            <Label htmlFor="transparentBg" className="text-sm flex items-center gap-1">
                              <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              Remove Background
                            </Label>
                            <Switch 
                              id="transparentBg" 
                              checked={transparentBg} 
                              onCheckedChange={(checked) => {
                                console.log("Setting transparentBg to:", checked);
                                setTransparentBg(checked);
                              }}
                              className="z-30"
                            />
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

                        <div className="flex items-center justify-between">
                          <Label htmlFor="transparentBg" className="text-sm flex items-center gap-1">
                            <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            Remove Background
                          </Label>
                          <Switch 
                            id="transparentBg" 
                            checked={transparentBg} 
                            onCheckedChange={(checked) => {
                              console.log("Setting transparentBg to:", checked);
                              setTransparentBg(checked);
                            }}
                            className="z-30"
                          />
                        </div>
                      </div>
                      
                      <Button 
                        onClick={handleGenerateImage}
                        disabled={!prompt.trim() || isGenerating}
                        className="w-full"
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
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleRemoveBackground}
                          disabled={isGenerating || isRemovingBackground || (selectedImage.hasTransparency === true)}
                          className="relative"
                        >
                          {isRemovingBackground ? (
                            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                          ) : (
                            <ImageIcon className="w-3.5 h-3.5 mr-1" />
                          )}
                          Remove Background
                        </Button>
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
              )}
            </div>
          </TabsContent>
          
          {/* History Tab */}
          <TabsContent value="history" className="flex-1 overflow-auto p-4">
            <div className="max-w-6xl mx-auto">
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
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create Your First Design
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
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
                              onClick={() => handleDownload(item.imageUrl)}
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
                              onClick={() => handleReusePrompt(item.prompt)}
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
                              onClick={() => handleDeleteFromHistory(item.id)}
                            >
                              <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>
                          
                          {/* Color chips */}
                          {item.colors && item.colors.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {item.colors.slice(0, 5).map((color, index) => (
                                <div 
                                  key={index}
                                  className="w-3 h-3 rounded-full cursor-pointer"
                                  style={{ backgroundColor: color }}
                                  onClick={() => handleCopyColor(color)}
                                  title={color}
                                />
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}; 