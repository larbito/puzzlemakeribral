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
import { useSearchParams, useLocation } from "react-router-dom";

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

// Update the interface to handle bulk uploads and designs
interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: Date;
  colors?: string[];
  hasTransparency?: boolean;
  isFavorite?: boolean;
  createdAt?: string;
  status?: 'generating' | 'completed' | 'failed';
  sourceImage?: string;
}

interface ImageToPrompt {
  id: string;
  imageUrl: string;
  prompt: string;
  status: 'processing' | 'completed' | 'failed';
  designUrl?: string;
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

// Export the interface for the component props
export interface TShirtGeneratorProps {
  initialMode?: string; // Optional initialMode prop
}

export const TShirtGenerator: React.FC<TShirtGeneratorProps> = ({ initialMode }) => {
  const [searchParams] = useSearchParams();
  
  // Prompt state
  const [prompt, setPrompt] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  
  // Settings state
  const [resolution, setResolution] = useState("large"); // Default to large for Amazon Merch
  const [designCount, setDesignCount] = useState("1");
  const [transparentBg, setTransparentBg] = useState(true);
  const [showSafeZone, setShowSafeZone] = useState(false);
  
  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [currentTab, setCurrentTab] = useState("design"); // design, upload, bulk
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeMode, setActiveMode] = useState(initialMode || "prompt"); // Use initialMode if provided, otherwise default to "prompt"
  
  // Upload state
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [bulkItems, setBulkItems] = useState<ImageToPrompt[]>([]);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  
  // History filters and display options
  const [historyFilter, setHistoryFilter] = useState("all");
  const [historySort, setHistorySort] = useState("newest");
  const [historyView, setHistoryView] = useState("grid");
  
  // Results state
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [currentDesigns, setCurrentDesigns] = useState<GeneratedImage[]>([]);
  const [history, setHistory] = useState<DesignHistoryItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  
  // Dimensions for Amazon Merch by default (4500 x 5400 px)
  const [width, setWidth] = useState(4500);
  const [height, setHeight] = useState(5400);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkInputRef = useRef<HTMLInputElement>(null);

  const MAX_PROMPT_LENGTH = 500;
  const MAX_BULK_UPLOADS = 10;

  // Resolution presets for t-shirt designs
  const sizePresets = [
    { label: "Merch by Amazon", width: 4500, height: 5400 },
    { label: "Standard", width: 2000, height: 2400 },
    { label: "Square", width: 4500, height: 4500 },
    { label: "Wide", width: 5400, height: 3600 },
    { label: "Custom", width: null, height: null }
  ];

  // Load history on component mount
  useEffect(() => {
    const savedHistory = getDesignHistory();
    setHistory(savedHistory);
  }, []);

  // Check for mode parameter in URL if initialMode is not provided
  useEffect(() => {
    if (!initialMode) {
      const modeParam = searchParams.get('mode');
      if (modeParam && ['prompt', 'image', 'bulk'].includes(modeParam)) {
        setActiveMode(modeParam);
      }
    }
  }, [searchParams, initialMode]);

  // Handle mode change (tab switching)
  const handleModeChange = (mode: string) => {
    setActiveMode(mode);
    // Reset states when changing modes
    setUploadedImage(null);
    setUploadedImages([]);
    setBulkItems([]);
    setUploadPreview(null);
    setSelectedImage(null);
    setCurrentDesigns([]);
  };

  // Handle single file upload for Image to Prompt mode
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File is too large. Maximum size is 5MB.");
        return;
      }
      
      setUploadedImage(file);
      setUploadPreview(URL.createObjectURL(file));
    }
  };

  // Handle bulk file uploads
  const handleBulkFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Limit to MAX_BULK_UPLOADS files
      const filesToProcess = Array.from(e.target.files).slice(0, MAX_BULK_UPLOADS);
      
      if (filesToProcess.length > MAX_BULK_UPLOADS) {
        toast.warning(`You can only upload up to ${MAX_BULK_UPLOADS} images at once. Only the first ${MAX_BULK_UPLOADS} will be processed.`);
      }
      
      // Validate file sizes
      const validFiles = filesToProcess.filter(file => {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`File ${file.name} is too large and will be skipped.`);
          return false;
        }
        return true;
      });
      
      setUploadedImages(validFiles);
      
      // Create preview items for the bulk processing
      const newBulkItems: ImageToPrompt[] = validFiles.map((file) => ({
        id: Date.now() + Math.random().toString(36).substring(2, 9),
        imageUrl: URL.createObjectURL(file),
        prompt: "",
        status: 'processing'
      }));
      
      setBulkItems(newBulkItems);
      
      // If we have images, immediately start generating prompts
      if (newBulkItems.length > 0) {
        processImagesForPrompts(validFiles, newBulkItems);
      }
    }
  };

  // Process bulk images to generate prompts
  const processImagesForPrompts = async (files: File[], items: ImageToPrompt[]) => {
    setIsProcessingBulk(true);
    const updatedItems = [...items];
    
    try {
      // Process each image sequentially to avoid rate limiting
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const item = updatedItems[i];
        
        try {
          // Call the API to analyze image and generate prompt
          const generatedPrompt = await imageToPrompt(file, 'tshirt');
          
          // Update the item with the generated prompt
          updatedItems[i] = {
            ...item,
            prompt: generatedPrompt,
            status: 'completed'
          };
          
          // Update the state after each item is processed
          setBulkItems([...updatedItems]);
          
        } catch (error) {
          console.error(`Error processing image ${i}:`, error);
          updatedItems[i] = {
            ...item,
            status: 'failed',
            prompt: "Failed to generate prompt"
          };
          setBulkItems([...updatedItems]);
        }
      }
    } catch (error) {
      console.error("Error in bulk processing:", error);
      toast.error("Failed to process some images. Please try again.");
    } finally {
      setIsProcessingBulk(false);
    }
  };

  // Generate designs for all processed bulk items
  const handleGenerateBulkDesigns = async () => {
    // Filter only items with valid prompts
    const itemsToProcess = bulkItems.filter(item => 
      item.status === 'completed' && item.prompt.trim().length > 0
    );
    
    if (itemsToProcess.length === 0) {
      toast.error("No valid prompts to generate designs from.");
      return;
    }
    
    setIsGenerating(true);
    const updatedItems = [...bulkItems];
    const newDesigns: GeneratedImage[] = [];
    
    try {
      toast.info(`Generating ${itemsToProcess.length} designs. This may take a minute...`);
      
      // Process each prompt sequentially
      for (let i = 0; i < itemsToProcess.length; i++) {
        const item = itemsToProcess[i];
        
        try {
          // Generate the design
          const imageUrl = await generateImage({
            prompt: item.prompt,
            transparentBackground: transparentBg,
            format: resolution
          });
          
          if (imageUrl) {
            // Extract colors
            const colors = await extractColors(imageUrl);
            
            // Create a new generated image
            const newDesign: GeneratedImage = {
              id: Date.now().toString() + i,
              url: imageUrl,
              prompt: item.prompt,
              timestamp: new Date(),
              colors,
              sourceImage: item.imageUrl
            };
            
            // Add to design array
            newDesigns.push(newDesign);
            
            // Update bulk item
            const itemIndex = updatedItems.findIndex(i => i.id === item.id);
            if (itemIndex !== -1) {
              updatedItems[itemIndex] = {
                ...updatedItems[itemIndex],
                designUrl: imageUrl,
                status: 'completed'
              };
            }
            
            // Add to history
            saveToHistory({
              prompt: item.prompt,
              thumbnail: imageUrl,
              imageUrl,
              format: resolution.toUpperCase(),
              style: "custom"
            });
          }
        } catch (error) {
          console.error(`Error generating design for item ${i}:`, error);
          // Mark as failed
          const itemIndex = updatedItems.findIndex(i => i.id === item.id);
          if (itemIndex !== -1) {
            updatedItems[itemIndex] = {
              ...updatedItems[itemIndex],
              status: 'failed'
            };
          }
        }
        
        // Update the UI with progress
        setBulkItems([...updatedItems]);
      }
      
      // Set all new designs
      setGeneratedImages(prev => [...newDesigns, ...prev]);
      setCurrentDesigns(newDesigns);
      toast.success(`Successfully generated ${newDesigns.length} designs out of ${itemsToProcess.length} attempts.`);
      
    } catch (error) {
      console.error("Error in bulk design generation:", error);
      toast.error("Failed to generate some designs. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Update the prompt for a specific bulk item
  const handleUpdateBulkPrompt = (id: string, newPrompt: string) => {
    const updatedItems = bulkItems.map(item => 
      item.id === id ? { ...item, prompt: newPrompt } : item
    );
    setBulkItems(updatedItems);
  };

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
      <div className="container mx-auto py-6 max-w-7xl bg-background">
        <div className="grid grid-cols-1 gap-8">
          {/* Mode Tabs */}
          <Card className="w-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Mode</CardTitle>
              <CardDescription>Select how you want to create your t-shirt designs</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs 
                value={activeMode} 
                onValueChange={handleModeChange} 
                className="w-full"
              >
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="prompt" className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    <span className="hidden sm:inline">Prompt to Design</span>
                    <span className="sm:hidden">Text</span>
                  </TabsTrigger>
                  <TabsTrigger value="image" className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Image to Design</span>
                    <span className="sm:hidden">Single Image</span>
                  </TabsTrigger>
                  <TabsTrigger value="bulk" className="flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    <span className="hidden sm:inline">Bulk Image to Designs</span>
                    <span className="sm:hidden">Multi-Image</span>
                  </TabsTrigger>
                </TabsList>

                {/* Tab Content */}
                <TabsContent value="prompt" className="mt-0">
                  <div className="space-y-4">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h3 className="text-md font-medium mb-2">Prompt to Design</h3>
                      <p className="text-sm text-muted-foreground">
                        Enter a text prompt describing your perfect t-shirt design, and our AI will generate it.
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="image" className="mt-0">
                  <div className="space-y-4">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h3 className="text-md font-medium mb-2">Image to Design</h3>
                      <p className="text-sm text-muted-foreground">
                        Upload an image and our AI will analyze it to create a t-shirt design prompt, which you can edit before generating.
                      </p>
                    </div>

                    {!uploadedImage ? (
                      <div 
                        className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer relative"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Upload className="w-8 h-8 text-muted-foreground" />
                          <h3 className="text-lg font-medium">Upload an image</h3>
                          <p className="text-sm text-muted-foreground max-w-md">
                            Drag and drop your image here, or click to browse. Supported formats: JPG, PNG, WEBP.
                          </p>
                          <Button variant="outline" className="mt-2">
                            Select Image
                          </Button>
                        </div>
                        <input 
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={handleFileUpload}
                        />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Image preview */}
                          <div className="relative aspect-square rounded-md overflow-hidden bg-muted/50">
                            {uploadPreview && (
                              <img 
                                src={uploadPreview} 
                                alt="Uploaded image" 
                                className="w-full h-full object-contain"
                              />
                            )}
                            <Button 
                              variant="destructive" 
                              size="icon" 
                              className="absolute top-2 right-2"
                              onClick={() => {
                                setUploadedImage(null);
                                setUploadPreview(null);
                                setPrompt("");
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Prompt box */}
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="generated-prompt">Generated Prompt</Label>
                              <div className="relative">
                                <Textarea 
                                  id="generated-prompt"
                                  value={prompt}
                                  onChange={(e) => setPrompt(e.target.value)}
                                  placeholder="Click 'Generate Prompt' to analyze the image..."
                                  className="min-h-[150px]"
                                />
                                <div className="absolute bottom-2 right-2">
                                  <Badge variant="outline">
                                    {prompt.length}/{MAX_PROMPT_LENGTH}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-between">
                              <Button
                                variant="secondary"
                                onClick={handleGeneratePrompt}
                                disabled={isGenerating || !uploadedImage}
                                className="gap-2"
                              >
                                {isGenerating ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Wand2 className="w-4 h-4" />
                                )}
                                {isGenerating ? "Analyzing..." : "Generate Prompt"}
                              </Button>
                              <Button
                                onClick={handleGenerateImage}
                                disabled={isGenerating || !prompt.trim()}
                                className="gap-2"
                              >
                                {isGenerating ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Sparkles className="w-4 h-4" />
                                )}
                                {isGenerating ? "Generating..." : "Generate Design"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="bulk" className="mt-0">
                  <div className="space-y-4">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h3 className="text-md font-medium mb-2">Bulk Image to Designs</h3>
                      <p className="text-sm text-muted-foreground">
                        Upload up to 10 images at once. Our AI will analyze each one, create prompts, and generate designs for you to download.
                      </p>
                    </div>

                    {bulkItems.length === 0 ? (
                      <div 
                        className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer relative"
                        onClick={() => bulkInputRef.current?.click()}
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Layers className="w-8 h-8 text-muted-foreground" />
                          <h3 className="text-lg font-medium">Upload multiple images</h3>
                          <p className="text-sm text-muted-foreground max-w-md">
                            Upload up to {MAX_BULK_UPLOADS} images at once. Each image will be processed to generate a unique t-shirt design.
                          </p>
                          <Button variant="outline" className="mt-2">
                            Select Images
                          </Button>
                        </div>
                        <input 
                          type="file"
                          ref={bulkInputRef}
                          className="hidden"
                          accept="image/*"
                          multiple
                          onChange={handleBulkFileUpload}
                        />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium">Processing {bulkItems.length} images</h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setUploadedImages([]);
                              setBulkItems([]);
                            }}
                          >
                            Clear All
                          </Button>
                        </div>

                        {/* Status and generate button */}
                        <div className="bg-muted/50 rounded-lg p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant={isProcessingBulk ? "secondary" : "outline"}>
                                {isProcessingBulk ? (
                                  <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Processing</>
                                ) : (
                                  <><CheckCircle className="w-3 h-3 mr-1" /> Ready</>
                                )}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {bulkItems.filter(item => item.status === 'completed').length} of {bulkItems.length} prompts generated
                              </span>
                            </div>
                          </div>
                          <Button
                            onClick={handleGenerateBulkDesigns}
                            disabled={isGenerating || isProcessingBulk || bulkItems.filter(item => item.status === 'completed').length === 0}
                            className="gap-2"
                          >
                            {isGenerating ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Sparkles className="w-4 h-4" />
                            )}
                            {isGenerating ? "Generating..." : "Generate All Designs"}
                          </Button>
                        </div>

                        {/* Bulk items list */}
                        <div className="space-y-4">
                          {bulkItems.map((item) => (
                            <div key={item.id} className="border rounded-lg p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                              {/* Image preview */}
                              <div className="aspect-square rounded-md overflow-hidden bg-muted/50">
                                <img 
                                  src={item.imageUrl} 
                                  alt="Source image" 
                                  className="w-full h-full object-contain"
                                />
                              </div>

                              {/* Prompt input */}
                              <div className="md:col-span-2">
                                <div className="space-y-2">
                                  <Label className="flex items-center justify-between">
                                    <span>Generated Prompt</span>
                                    <Badge variant={
                                      item.status === 'processing' ? 'secondary' : 
                                      item.status === 'completed' ? 'default' : 'destructive'
                                    }>
                                      {item.status === 'processing' ? (
                                        <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Processing</>
                                      ) : item.status === 'completed' ? (
                                        <><CheckCircle className="w-3 h-3 mr-1" /> Ready</>
                                      ) : (
                                        <><AlertTriangle className="w-3 h-3 mr-1" /> Failed</>
                                      )}
                                    </Badge>
                                  </Label>
                                  <Textarea 
                                    value={item.prompt}
                                    onChange={(e) => handleUpdateBulkPrompt(item.id, e.target.value)}
                                    placeholder={item.status === 'processing' ? "Analyzing image..." : "Edit prompt here..."}
                                    disabled={item.status === 'processing'}
                                    className="min-h-[100px]"
                                  />
                                </div>
                              </div>

                              {/* Result preview */}
                              <div className="flex flex-col justify-between">
                                <div className="aspect-square rounded-md overflow-hidden bg-muted/50 relative">
                                  {item.designUrl ? (
                                    <img 
                                      src={item.designUrl} 
                                      alt="Generated design" 
                                      className="w-full h-full object-contain"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      {item.status === 'completed' ? (
                                        <div className="text-center p-2">
                                          <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground" />
                                          <p className="text-xs text-muted-foreground mt-1">Ready to generate</p>
                                        </div>
                                      ) : item.status === 'processing' ? (
                                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                                      ) : (
                                        <AlertTriangle className="w-8 h-8 text-destructive/50" />
                                      )}
                                    </div>
                                  )}
                                </div>
                                
                                {/* Actions */}
                                <div className="flex justify-end mt-2 gap-2">
                                  {item.designUrl && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => downloadImage(item.designUrl!, 'png', `t-shirt-design-${item.id}`)}
                                      className="gap-1"
                                    >
                                      <Download className="w-3 h-3" />
                                      <span>Download</span>
                                    </Button>
                                  )}
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                      // Remove this item from bulk items
                                      setBulkItems(bulkItems.filter(i => i.id !== item.id));
                                    }}
                                    className="gap-1"
                                  >
                                    <X className="w-3 h-3" />
                                    <span>Remove</span>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Prompt Input Section (for Prompt mode) */}
          {activeMode === "prompt" && (
            <Card className="w-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">Design Details</CardTitle>
                <CardDescription>Describe what you want in your t-shirt design</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Prompt input */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="prompt-input">Design Prompt</Label>
                      <div className="relative">
                        <Textarea
                          id="prompt-input"
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder="Describe your t-shirt design... (e.g., A cute cartoon cat wearing sunglasses and a baseball cap, minimalist line art)"
                          className="min-h-[150px] resize-none"
                          maxLength={MAX_PROMPT_LENGTH}
                        />
                        <div className="absolute bottom-2 right-2">
                          <Badge variant="outline">
                            {prompt.length}/{MAX_PROMPT_LENGTH}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Be specific about what you want - include style, colors, and composition details.
                      </p>
                    </div>

                    <Button
                      onClick={handleGenerateImage}
                      disabled={isGenerating || !prompt.trim()}
                      className="w-full"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating Design...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Design
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Settings panel */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="size-preset">Design Size</Label>
                      <Select 
                        defaultValue="merch-by-amazon" 
                        onValueChange={(value) => {
                          const preset = sizePresets.find(preset => preset.label.toLowerCase().replace(/\s+/g, '-') === value);
                          if (preset && preset.width && preset.height) {
                            setWidth(preset.width);
                            setHeight(preset.height);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select size preset" />
                        </SelectTrigger>
                        <SelectContent>
                          {sizePresets.map(preset => (
                            <SelectItem 
                              key={preset.label.toLowerCase().replace(/\s+/g, '-')}
                              value={preset.label.toLowerCase().replace(/\s+/g, '-')}
                            >
                              {preset.label} {preset.width && preset.height && `(${preset.width}×${preset.height}px)`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="num-designs">Number of Designs</Label>
                      <Select value={designCount} onValueChange={setDesignCount}>
                        <SelectTrigger id="num-designs">
                          <SelectValue placeholder="How many designs?" />
                        </SelectTrigger>
                        <SelectContent>
                          {designCountOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="style">Design Style</Label>
                      <Select defaultValue="realistic">
                        <SelectTrigger id="style">
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

                    <div className="flex items-center justify-between">
                      <Label htmlFor="transparent-bg" className="cursor-pointer">
                        Transparent Background
                      </Label>
                      <Switch 
                        id="transparent-bg" 
                        checked={transparentBg} 
                        onCheckedChange={setTransparentBg} 
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Image to Prompt to Design mode */}
          {activeMode === "image" && uploadedImage && uploadPreview && (
            <Card className="w-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">Image Analysis</CardTitle>
                <CardDescription>Edit the AI-generated prompt before creating your design</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Image preview */}
                  <div className="aspect-square bg-muted/30 rounded-md overflow-hidden relative">
                    <img 
                      src={uploadPreview} 
                      alt="Uploaded image" 
                      className="w-full h-full object-contain" 
                    />
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setUploadedImage(null);
                        setUploadPreview(null);
                        setPrompt("");
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Generated prompt */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="image-prompt">Generated Prompt</Label>
                        <Badge variant={prompt ? "default" : "outline"}>
                          {prompt ? "Ready to edit" : "Waiting for analysis"}
                        </Badge>
                      </div>
                      <div className="relative">
                        <Textarea
                          id="image-prompt"
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder={isGenerating ? "Analyzing image..." : "AI-generated prompt will appear here..."}
                          className="min-h-[150px] resize-none"
                          maxLength={MAX_PROMPT_LENGTH}
                          disabled={isGenerating}
                        />
                        <div className="absolute bottom-2 right-2">
                          <Badge variant="outline">
                            {prompt.length}/{MAX_PROMPT_LENGTH}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Feel free to edit the AI-generated prompt to better match your vision.
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-4">
                      <Button
                        variant="secondary"
                        onClick={handleGeneratePrompt}
                        disabled={isGenerating || !uploadedImage}
                        className="flex-1"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Analyzing Image...
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-4 h-4 mr-2" />
                            Generate Prompt
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handleGenerateImage}
                        disabled={isGenerating || !prompt.trim()}
                        className="flex-1"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating Design...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generate Design
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Settings accordion */}
                    <div className="pt-2">
                      <Card className="bg-muted/30">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-md flex items-center">
                            <Settings2 className="w-4 h-4 mr-2" />
                            Design Settings
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 pb-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="image-size-preset">Size Preset</Label>
                              <Select 
                                defaultValue="merch-by-amazon" 
                                onValueChange={(value) => {
                                  const preset = sizePresets.find(preset => preset.label.toLowerCase().replace(/\s+/g, '-') === value);
                                  if (preset && preset.width && preset.height) {
                                    setWidth(preset.width);
                                    setHeight(preset.height);
                                  }
                                }}
                              >
                                <SelectTrigger id="image-size-preset">
                                  <SelectValue placeholder="Select size" />
                                </SelectTrigger>
                                <SelectContent>
                                  {sizePresets.map(preset => (
                                    <SelectItem 
                                      key={preset.label.toLowerCase().replace(/\s+/g, '-')}
                                      value={preset.label.toLowerCase().replace(/\s+/g, '-')}
                                    >
                                      {preset.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <Label htmlFor="transparent-bg-image" className="cursor-pointer">
                                Transparent Background
                              </Label>
                              <Switch 
                                id="transparent-bg-image" 
                                checked={transparentBg} 
                                onCheckedChange={setTransparentBg} 
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bulk Image to Designs mode - Results panel for bulk items */}
          {activeMode === "bulk" && bulkItems.length > 0 && (
            <Card className="w-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">Bulk Processing Status</CardTitle>
                <CardDescription>
                  {isProcessingBulk 
                    ? `Analyzing ${bulkItems.length} images...` 
                    : `${bulkItems.filter(item => item.status === 'completed').length} of ${bulkItems.length} prompts ready`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Processing status bar */}
                <div className="bg-muted/50 rounded-lg p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={isProcessingBulk ? "secondary" : "outline"}>
                        {isProcessingBulk ? (
                          <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Processing</>
                        ) : (
                          <><CheckCircle className="w-3 h-3 mr-1" /> Ready</>
                        )}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {bulkItems.filter(item => item.status === 'completed').length} of {bulkItems.length} prompts generated
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setUploadedImages([]);
                        setBulkItems([]);
                      }}
                      disabled={isGenerating || isProcessingBulk}
                    >
                      Clear All
                    </Button>
                    <Button
                      onClick={handleGenerateBulkDesigns}
                      disabled={
                        isGenerating || 
                        isProcessingBulk || 
                        bulkItems.filter(item => item.status === 'completed').length === 0
                      }
                      className="gap-1"
                    >
                      {isGenerating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      {isGenerating ? "Generating..." : "Generate All Designs"}
                    </Button>
                  </div>
                </div>

                {/* Bulk items with editing capabilities */}
                <div className="space-y-4">
                  {bulkItems.map((item) => (
                    <Card key={item.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-0">
                          {/* Image preview */}
                          <div className="aspect-square bg-muted/30 relative">
                            <img 
                              src={item.imageUrl} 
                              alt="Source image" 
                              className="w-full h-full object-contain"
                            />
                            <div className="absolute top-2 right-2">
                              <Button
                                variant="destructive"
                                size="icon"
                                className="h-7 w-7 rounded-full"
                                onClick={() => {
                                  setBulkItems(bulkItems.filter(i => i.id !== item.id));
                                }}
                                disabled={isGenerating || isProcessingBulk}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Prompt input */}
                          <div className="md:col-span-2 p-4 border-t md:border-t-0 md:border-l border-r">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label>Generated Prompt</Label>
                                <Badge variant={
                                  item.status === 'processing' ? 'secondary' : 
                                  item.status === 'completed' ? 'default' : 'destructive'
                                }>
                                  {item.status === 'processing' ? (
                                    <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Processing</>
                                  ) : item.status === 'completed' ? (
                                    <><CheckCircle className="w-3 h-3 mr-1" /> Ready</>
                                  ) : (
                                    <><AlertTriangle className="w-3 h-3 mr-1" /> Failed</>
                                  )}
                                </Badge>
                              </div>
                              <Textarea 
                                value={item.prompt}
                                onChange={(e) => handleUpdateBulkPrompt(item.id, e.target.value)}
                                placeholder={item.status === 'processing' ? "Analyzing image..." : "Edit prompt here..."}
                                disabled={item.status === 'processing' || isGenerating}
                                className="min-h-[120px] resize-none"
                              />
                            </div>
                          </div>

                          {/* Result preview */}
                          <div className="aspect-square bg-muted/30 border-t md:border-t-0 md:border-l relative">
                            {item.designUrl ? (
                              <div className="relative h-full">
                                <img 
                                  src={item.designUrl} 
                                  alt="Generated design" 
                                  className="w-full h-full object-contain"
                                />
                                <div className="absolute bottom-2 right-2">
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => downloadImage(item.designUrl!, 'png', `t-shirt-design-${item.id}`)}
                                    className="h-8 rounded-full shadow-lg"
                                  >
                                    <Download className="w-3.5 h-3.5 mr-1" />
                                    <span className="text-xs">Download</span>
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                {isGenerating && item.status === 'completed' ? (
                                  <div className="text-center">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground mt-2">Generating...</p>
                                  </div>
                                ) : item.status === 'completed' ? (
                                  <div className="text-center p-2">
                                    <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground mt-1">Ready to generate</p>
                                  </div>
                                ) : item.status === 'processing' ? (
                                  <div className="text-center">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground mt-2">Analyzing image...</p>
                                  </div>
                                ) : (
                                  <div className="text-center">
                                    <AlertTriangle className="w-8 h-8 text-destructive/50 mx-auto" />
                                    <p className="text-xs text-muted-foreground mt-2">Analysis failed</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Bulk download action if we have generated designs */}
                {bulkItems.some(item => item.designUrl) && (
                  <div className="flex justify-end pt-2">
                    <Button 
                      onClick={() => {
                        // Get all successfully generated designs
                        const designs = bulkItems
                          .filter(item => item.designUrl)
                          .map(item => ({
                            url: item.designUrl!,
                            prompt: item.prompt
                          }));
                          
                        if (designs.length > 0) {
                          downloadAllImages(designs);
                        }
                      }}
                      disabled={isDownloadingAll}
                      className="gap-2"
                    >
                      {isDownloadingAll ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <DownloadCloud className="w-4 h-4" />
                      )}
                      Download All Designs ({bulkItems.filter(item => item.designUrl).length})
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Results section - showing for all modes */}
          {(currentDesigns.length > 0 || selectedImage) && (
            <Card className="w-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex justify-between items-center">
                  <span>Design Preview</span>
                  <div className="flex gap-2">
                    {selectedImage && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(selectedImage.url)}
                          disabled={isDownloading}
                          className="gap-1"
                        >
                          {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                          Download
                        </Button>
                        {currentDesigns.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownloadAll}
                            disabled={isDownloadingAll}
                            className="gap-1"
                          >
                            {isDownloadingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <DownloadCloud className="w-4 h-4" />}
                            Download All
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Main preview */}
                  {selectedImage ? (
                    <div className="aspect-square bg-muted/30 rounded-md flex items-center justify-center relative overflow-hidden">
                      <img 
                        src={selectedImage.url} 
                        alt={selectedImage.prompt || "T-shirt design"} 
                        className="max-w-full max-h-full object-contain"
                        style={{
                          transform: `scale(${zoomLevel})`,
                          transformOrigin: 'center'
                        }}
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
                      
                      {/* Debug/hidden canvas for processing */}
                      <canvas 
                        ref={canvasRef}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="aspect-square bg-muted/30 rounded-md flex items-center justify-center">
                      <div className="text-center p-6">
                        <Shirt className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No design selected</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Design grid */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">
                      Generated Designs {currentDesigns.length > 0 && `(${currentDesigns.length})`}
                    </h3>
                    
                    {isGenerating ? (
                      <div className="aspect-square bg-muted/30 rounded-md flex flex-col items-center justify-center">
                        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                        <p className="font-medium">Generating designs...</p>
                        <p className="text-sm text-muted-foreground mt-1">This may take 15-30 seconds</p>
                      </div>
                    ) : currentDesigns.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3">
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
                              alt={design.prompt || "T-shirt design"}
                              className="w-full h-full object-cover" 
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="aspect-square bg-muted/30 rounded-md flex items-center justify-center">
                        <div className="text-center p-6">
                          <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">Generate some designs to see them here</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageLayout>
  );
}; 