import React, { useState, useEffect, useRef } from "react";
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { 
  Book, 
  ImageIcon, 
  Loader2, 
  Download, 
  RefreshCw, 
  Save, 
  ZoomIn, 
  ZoomOut,
  Sparkles,
  Info,
  X,
  Upload,
  Palette,
  Brush,
  ImageOff,
  FileText
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  generateBookCover, 
  createFullBookCover, 
  extractColorsFromImage,
  type ExtractedColors 
} from "@/services/ideogramService";

// Trim size options for Amazon KDP
const trimSizeOptions = [
  { value: "5x8", label: "5\" x 8\" (12.7 x 20.32 cm)", dimensions: { width: 5, height: 8 } },
  { value: "5.25x8", label: "5.25\" x 8\" (13.34 x 20.32 cm)", dimensions: { width: 5.25, height: 8 } },
  { value: "5.5x8.5", label: "5.5\" x 8.5\" (13.97 x 21.59 cm)", dimensions: { width: 5.5, height: 8.5 } },
  { value: "6x9", label: "6\" x 9\" (15.24 x 22.86 cm)", dimensions: { width: 6, height: 9 } },
  { value: "7x10", label: "7\" x 10\" (17.78 x 25.4 cm)", dimensions: { width: 7, height: 10 } },
  { value: "8x10", label: "8\" x 10\" (20.32 x 25.4 cm)", dimensions: { width: 8, height: 10 } },
  { value: "8.5x11", label: "8.5\" x 11\" (21.59 x 27.94 cm)", dimensions: { width: 8.5, height: 11 } },
];

// Book style options
const styleOptions = [
  { value: "realistic", label: "Realistic" },
  { value: "illustration", label: "Illustration" },
  { value: "minimalist", label: "Minimalist" },
  { value: "fantasy", label: "Fantasy" },
  { value: "vintage", label: "Vintage" },
  { value: "scifi", label: "Sci-Fi" },
  { value: "abstract", label: "Abstract" },
  { value: "photographic", label: "Photographic" },
];

// Book cover history storage key
const BOOK_COVER_HISTORY_KEY = 'book-cover-history';

// Interface for book cover history items
interface BookCoverHistoryItem {
  id: string;
  imageUrl: string;
  fullCoverUrl?: string; // New field for the full wrap-around cover
  frontCoverUrl?: string; // New field for just the front cover
  bookTitle: string;
  authorName: string;
  prompt: string;
  style: string;
  trimSize: string;
  pageCount: number;
  paperColor: string;
  bookType: string;
  spineText?: string; // New field for spine text
  spineColor?: string; // New field for spine color
  colors?: string[]; // New field for extracted colors
  interiorPreviewUrls?: string[]; // New field for interior preview URLs
  dimensions: {
    widthInches: number;
    heightInches: number;
    widthPixels: number;
    heightPixels: number;
    spineWidth: number;
  };
  createdAt: string;
}

const BookCoverGenerator = () => {
  // State for form inputs
  const [bookType, setBookType] = useState("paperback");
  const [trimSize, setTrimSize] = useState("6x9");
  const [pageCount, setPageCount] = useState(120);
  const [paperColor, setPaperColor] = useState("white");
  const [bookTitle, setBookTitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("realistic");
  const [showGuides, setShowGuides] = useState(true);
  
  // New state for spine settings
  const [spineText, setSpineText] = useState("");
  const [spineColor, setSpineColor] = useState("");
  const [selectedColorIndex, setSelectedColorIndex] = useState<number>(-1);
  
  // State for interior preview images
  const [interiorPreviews, setInteriorPreviews] = useState<File[]>([]);
  
  // State for generated images
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [frontCoverUrl, setFrontCoverUrl] = useState<string | null>(null);
  const [fullCoverUrl, setFullCoverUrl] = useState<string | null>(null);
  const [extractedColors, setExtractedColors] = useState<ExtractedColors>({ colors: [], dominantColor: "" });
  
  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingFullCover, setIsCreatingFullCover] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeTab, setActiveTab] = useState("front-cover");
  
  // References
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for calculated dimensions
  const [dimensions, setDimensions] = useState({
    widthInches: 0,
    heightInches: 0,
    widthPixels: 0,
    heightPixels: 0,
    spineWidth: 0
  });
  
  // State for history
  const [history, setHistory] = useState<BookCoverHistoryItem[]>([]);
  
  // Load history on component mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(BOOK_COVER_HISTORY_KEY);
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error('Error loading book cover history:', error);
    }
  }, []);

  // Calculate dimensions based on inputs
  useEffect(() => {
    // Find the selected trim size dimensions
    const selectedTrimSize = trimSizeOptions.find(option => option.value === trimSize);
    
    if (selectedTrimSize) {
      const { width, height } = selectedTrimSize.dimensions;
      
      // Calculate spine width based on page count and paper color
      let spineWidth = 0;
      if (paperColor === "white" || paperColor === "cream") {
        spineWidth = pageCount * 0.002252;
      } else {
        spineWidth = pageCount * 0.002347;
      }
      
      // Calculate total dimensions with bleed (0.125" on all sides)
      const bleed = 0.25; // 0.125" on both sides (left + right or top + bottom)
      const totalWidthInches = width + width + spineWidth + bleed;
      const totalHeightInches = height + bleed;
      
      // Convert to pixels at 300 DPI
      const dpi = 300;
      const widthPixels = Math.round(totalWidthInches * dpi);
      const heightPixels = Math.round(totalHeightInches * dpi);
      
      setDimensions({
        widthInches: totalWidthInches,
        heightInches: totalHeightInches,
        widthPixels,
        heightPixels,
        spineWidth
      });
    }
  }, [trimSize, pageCount, paperColor, bookType]);

  // Effect to extract colors when front cover is generated
  useEffect(() => {
    const extractColors = async () => {
      if (frontCoverUrl) {
        try {
          // Show loading indicator
          toast.loading("Analyzing cover colors...", { id: "extract-colors" });
          
          const colors = await extractColorsFromImage(frontCoverUrl);
          setExtractedColors(colors);
          
          // If no spine color is selected yet, use the dominant color
          if (!spineColor) {
            setSpineColor(colors.dominantColor);
          }
          
          // Dismiss loading indicator on success
          toast.dismiss("extract-colors");
        } catch (error) {
          console.error("Error extracting colors:", error);
          toast.error("Couldn't extract colors. Using default color.", { id: "extract-colors" });
        }
      }
    };
    
    extractColors();
  }, [frontCoverUrl, spineColor]);

  // Debug effect to check interiorPreviews
  useEffect(() => {
    console.log("Interior previews updated:", interiorPreviews.length, "files");
  }, [interiorPreviews]);

  // Handler for interior preview upload
  const handleInteriorPreviewUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("File input change event triggered");
    if (e.target.files && e.target.files.length > 0) {
      console.log(`Selected ${e.target.files.length} files`);
      
      const newFiles = Array.from(e.target.files);
      
      // Check max files (max 6)
      if (interiorPreviews.length + newFiles.length > 6) {
        toast.error("Maximum 6 interior preview images allowed");
        return;
      }
      
      // Check file sizes (max 2MB each)
      const oversizedFiles = newFiles.filter(file => file.size > 2 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        toast.error("Some files exceed the 2MB limit and will be skipped");
      }
      
      // Filter out oversized files
      const validFiles = newFiles.filter(file => file.size <= 2 * 1024 * 1024);
      console.log(`Adding ${validFiles.length} valid files`);
      
      // Add new files to existing previews
      setInteriorPreviews(prev => [...prev, ...validFiles]);
      toast.success(`Added ${validFiles.length} interior preview images`);
      
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      console.log("No files selected or file input is null");
    }
  };
  
  // Handler to remove an interior preview
  const handleRemovePreview = (index: number) => {
    setInteriorPreviews(prev => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };
  
  // Handler for spine color selection
  const handleSpineColorSelect = (color: string, index: number) => {
    setSpineColor(color);
    setSelectedColorIndex(index);
  };

  // Generate a prompt based on user inputs
  const generateFormattedPrompt = () => {
    // Create a prompt focused on the cover description only
    let basePrompt = `A professional book cover design. ${prompt}. Print-ready design for a ${trimSize.replace('x', '" x ')}″ ${bookType} book, with clean layout and clear readable fonts.`;
    
    // Add style information if selected
    if (style && style !== "realistic") {
      basePrompt += ` Style: ${style}.`;
    }
    
    return basePrompt;
  };
  
  // Save to history
  const saveToHistory = (
    frontImageUrl: string, 
    fullCoverUrl: string | null = null,
    colors: string[] = []
  ): BookCoverHistoryItem => {
    try {
      // Convert null to undefined for the interface
      const fullCoverUrlForHistory: string | undefined = fullCoverUrl || undefined;
      
      const newItem: BookCoverHistoryItem = {
        id: Math.random().toString(36).substring(2) + Date.now().toString(36),
        imageUrl: fullCoverUrl || frontImageUrl, // Use full cover as primary image if available
        frontCoverUrl: frontImageUrl,
        fullCoverUrl: fullCoverUrlForHistory,
        bookTitle: "Book Title", // Use default value
        authorName: "Author Name", // Use default value
        prompt,
        style,
        trimSize,
        pageCount,
        paperColor,
        bookType,
        spineText,
        spineColor,
        colors,
        dimensions,
        createdAt: new Date().toISOString()
      };
      
      const updatedHistory = [newItem, ...history].slice(0, 20); // Keep only 20 most recent items
      setHistory(updatedHistory);
      localStorage.setItem(BOOK_COVER_HISTORY_KEY, JSON.stringify(updatedHistory));
      
      return newItem;
    } catch (error) {
      console.error('Error saving to history:', error);
      toast.error('Failed to save design to history');
      throw error;
    }
  };
  
  // Handle download
  const handleDownload = async () => {
    const imageToDownload = activeTab === "full-cover" ? fullCoverUrl : frontCoverUrl;
    
    if (!imageToDownload) {
      toast.error(`No ${activeTab === "full-cover" ? "full cover" : "front cover"} to download`);
      return;
    }
    
    setIsDownloading(true);
    
    try {
      // Create a descriptive filename using date instead of title
      const coverType = activeTab === "full-cover" ? "full-cover" : "front-cover";
      const filename = `book-cover-${trimSize}-${coverType}-${Date.now()}`;
      
      // Create link element and trigger download
      const link = document.createElement('a');
      
      // If it's a data URL, use it directly
      if (imageToDownload.startsWith('data:')) {
        link.href = imageToDownload;
      } else {
        // For URLs, fetch the image as a blob
        const response = await fetch(imageToDownload);
        const blob = await response.blob();
        link.href = URL.createObjectURL(blob);
      }
      
      link.download = `${filename}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`${activeTab === "full-cover" ? "Full cover" : "Front cover"} downloaded successfully`);
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error('Failed to download cover');
    } finally {
      setIsDownloading(false);
    }
  };

  // Generate full cover from front cover
  const handleCreateFullCover = async () => {
    if (!frontCoverUrl) {
      toast.error("Please generate a front cover first");
      return;
    }
    
    // Always use default values since fields have been removed
    const titleToUse = "Book Title";
    const authorToUse = "Author Name";
    
    setIsCreatingFullCover(true);
    
    try {
      console.log("Creating full cover...");
      console.log("Using interior previews:", interiorPreviews.length, "files");
      
      // If spine is too narrow for text, warn the user
      if (spineText && dimensions.spineWidth < 0.1) {
        toast.warning("Note: Spine is too narrow for text. Text will not appear.");
      }
      
      const fullCoverImage = await createFullBookCover({
        frontCoverUrl,
        title: titleToUse,
        author: authorToUse,
        spineText: dimensions.spineWidth >= 0.1 ? spineText : undefined, // Only use spine text if book is thick enough
        spineColor,
        dimensions,
        interiorPreviewImages: interiorPreviews,
        showGuides
      });
      
      setFullCoverUrl(fullCoverImage);
      
      // Save both front and full cover to history
      saveToHistory(
        frontCoverUrl, 
        fullCoverImage,
        extractedColors.colors
      );
      
      toast.success("Full book cover created successfully!");
      
      // Switch to full cover tab
      setActiveTab("full-cover");
    } catch (error) {
      console.error("Error creating full cover:", error);
      toast.error("Failed to create full book cover. Please try again.");
      
      // Try to provide more helpful error information if available
      if (error instanceof Error) {
        const errorMessage = error.message;
        if (errorMessage.includes("CORS")) {
          toast.error("CORS issue detected. Try using a different image or refreshing.");
        } else if (errorMessage.includes("load")) {
          toast.error("Failed to load images. Try generating a new front cover.");
        }
      }
    } finally {
      setIsCreatingFullCover(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Debug form submission
    console.log("=== FORM SUBMISSION STARTED ===");
    console.log("Form data:", {
      prompt,
      style,
      trimSize,
      pageCount,
      paperColor,
      bookType,
      dimensions
    });
    
    // Validation - only require the prompt
    if (!prompt.trim()) {
      toast.error("Cover description is required");
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Generate the final prompt
      const formattedPrompt = generateFormattedPrompt();
      console.log("Formatted prompt:", formattedPrompt);
      console.log("Dimensions:", dimensions);
      
      // Call the API to generate the image
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount <= maxRetries) {
        try {
          console.log(`Attempt ${retryCount + 1} to generate book cover`);
          const imageUrl = await generateBookCover({
            prompt: formattedPrompt,
            style,
            width: dimensions.widthPixels / 2, // Only generate the front cover now
            height: dimensions.heightPixels
          });
          
          if (imageUrl) {
            console.log("Successfully generated front cover image:", imageUrl);
            setGeneratedImage(imageUrl);
            setFrontCoverUrl(imageUrl);
            
            toast.success("Front cover generated successfully!");
            break; // Exit the loop on success
          } else {
            throw new Error("Empty image URL returned");
          }
        } catch (error) {
          console.error(`Error attempt ${retryCount + 1}:`, error);
          retryCount++;
          
          if (retryCount > maxRetries) {
            // Only show error after all retries have failed
            toast.error("Failed to generate cover after multiple attempts. Try a different prompt.");
            
            // Create a placeholder image as absolute last resort
            const placeholderUrl = `https://placehold.co/${dimensions.widthPixels / 2}x${dimensions.heightPixels}/252A37/FFFFFF?text=${encodeURIComponent('Could not generate cover')}`;
            setGeneratedImage(placeholderUrl);
            setFrontCoverUrl(placeholderUrl);
          } else {
            // Show retry message
            toast.info(`Retrying... (${retryCount}/${maxRetries})`);
            // Wait a moment before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate book cover");
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Handle regeneration
  const handleRegenerate = () => {
    if (isGenerating) return;
    
    // Reset the full cover if regenerating
    setFullCoverUrl(null);
    
    // Use existing inputs to regenerate
    handleSubmit(new Event('submit') as any);
  };
  
  // Handle updating settings from history item
  const loadFromHistory = (item: BookCoverHistoryItem) => {
    // Don't load title/author since fields have been removed
    setPrompt(item.prompt);
    setStyle(item.style);
    setTrimSize(item.trimSize);
    setPageCount(item.pageCount);
    setPaperColor(item.paperColor);
    setBookType(item.bookType);
    
    // Set new fields
    if (item.spineText) setSpineText(item.spineText);
    if (item.spineColor) setSpineColor(item.spineColor);
    if (item.frontCoverUrl) {
      setGeneratedImage(item.frontCoverUrl);
      setFrontCoverUrl(item.frontCoverUrl);
    } else {
      setGeneratedImage(item.imageUrl);
      setFrontCoverUrl(item.imageUrl);
    }
    
    if (item.fullCoverUrl) {
      setFullCoverUrl(item.fullCoverUrl);
      setActiveTab("full-cover");
    } else {
      setActiveTab("front-cover");
    }
    
    if (item.colors && item.colors.length > 0) {
      setExtractedColors({
        colors: item.colors,
        dominantColor: item.colors[0]
      });
    }
    
    // Clear interior previews since we can't store those
    setInteriorPreviews([]);
    
    toast.info("Settings loaded from history");
  };

  return (
    <PageLayout
      title="Book Cover Generator"
      description="Create professional print-ready book covers for Amazon KDP with AI"
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left side - Form */}
        <div className="w-full lg:w-1/3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Book className="mr-2 h-5 w-5 text-primary" />
                Book Specifications
              </CardTitle>
              <CardDescription>
                Enter the specifications for your book cover
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Book type */}
                <div className="space-y-2">
                  <Label htmlFor="book-type">Book Type</Label>
                  <Select 
                    value={bookType} 
                    onValueChange={setBookType}
                  >
                    <SelectTrigger id="book-type">
                      <SelectValue placeholder="Select book type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paperback">Paperback</SelectItem>
                      <SelectItem value="hardcover">Hardcover</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Trim size */}
                <div className="space-y-2">
                  <Label htmlFor="trim-size">Trim Size</Label>
                  <Select 
                    value={trimSize} 
                    onValueChange={setTrimSize}
                  >
                    <SelectTrigger id="trim-size">
                      <SelectValue placeholder="Select trim size" />
                    </SelectTrigger>
                    <SelectContent>
                      {trimSizeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Page count */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="page-count">Page Count</Label>
                    <span className="text-sm text-muted-foreground">{pageCount} pages</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      id="page-count"
                      type="number"
                      min="24"
                      max="800"
                      value={pageCount}
                      onChange={(e) => setPageCount(parseInt(e.target.value) || 24)}
                      className="w-24"
                    />
                    <Slider
                      min={24}
                      max={800}
                      step={1}
                      value={[pageCount]}
                      onValueChange={(value) => setPageCount(value[0])}
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">KDP accepts between 24 and 800 pages</p>
                </div>
                
                {/* Paper color */}
                <div className="space-y-2">
                  <Label htmlFor="paper-color">Paper Color</Label>
                  <Select 
                    value={paperColor} 
                    onValueChange={setPaperColor}
                  >
                    <SelectTrigger id="paper-color">
                      <SelectValue placeholder="Select paper color" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="white">White</SelectItem>
                      <SelectItem value="cream">Cream</SelectItem>
                      <SelectItem value="color">Color</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Spine text - only show if page count is sufficient */}
                {pageCount >= 100 && (
                  <div className="space-y-2">
                    <Label htmlFor="spine-text">Spine Text (Optional)</Label>
                    <Input
                      id="spine-text"
                      value={spineText}
                      onChange={(e) => setSpineText(e.target.value)}
                      placeholder="Text to appear on the spine"
                      maxLength={50}
                    />
                    <p className="text-xs text-muted-foreground">
                      Max 50 characters, vertical on spine
                    </p>
                  </div>
                )}
                
                {/* Calculated dimensions info */}
                <div className="rounded-lg bg-primary/5 p-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Final Size (with bleed):</span>
                    <span className="font-medium">{dimensions.widthInches.toFixed(2)}″ × {dimensions.heightInches.toFixed(2)}″</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Spine Width:</span>
                    <span className="font-medium">{dimensions.spineWidth.toFixed(3)}″</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Resolution:</span>
                    <span className="font-medium">{dimensions.widthPixels} × {dimensions.heightPixels} px</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>DPI:</span>
                    <span className="font-medium">300</span>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  {/* Cover description */}
                  <div className="space-y-2 mb-4 relative z-10">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="cover-description">Cover Description</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>Describe what you want on your book cover. Focus on the front cover design - the spine and back cover will be automatically generated.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Textarea
                      id="cover-description"
                      value={prompt}
                      onChange={(e) => {
                        console.log("Textarea changed:", e.target.value);
                        setPrompt(e.target.value);
                      }}
                      placeholder="Describe your book cover design. Focus on imagery, colors, style, and mood."
                      className="min-h-[120px] relative z-20"
                    />
                  </div>
                  
                  {/* Show guides toggle */}
                  <div className="flex items-center space-x-2 mb-6">
                    <Switch
                      id="show-guides"
                      checked={showGuides}
                      onCheckedChange={setShowGuides}
                    />
                    <Label htmlFor="show-guides">Show trim and spine guides</Label>
                  </div>
                  
                  {/* Generate button */}
                  <Button 
                    type="submit" 
                    className="w-full relative z-10"
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Book Cover
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          
          {/* Interior Preview Images Section - Only show after front cover is generated */}
          {frontCoverUrl && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base">
                  <FileText className="mr-2 h-4 w-4 text-primary" />
                  Interior Preview Images
                </CardTitle>
                <CardDescription>
                  Add up to 6 interior pages to show on back cover
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File input for preview images */}
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    {interiorPreviews.map((file, index) => (
                      <div 
                        key={index} 
                        className="relative aspect-[4/5] border rounded-md overflow-hidden group"
                      >
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePreview(index)}
                          className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Remove image"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    
                    {interiorPreviews.length < 6 && (
                      <div className="aspect-[4/5] border border-dashed rounded-md flex flex-col items-center justify-center p-2 cursor-pointer hover:bg-muted/50 transition-colors">
                        <input
                          type="file"
                          id="interior-preview-upload"
                          ref={fileInputRef}
                          onChange={handleInteriorPreviewUpload}
                          className="hidden"
                          accept="image/jpeg,image/png,image/webp"
                          multiple
                        />
                        <label 
                          htmlFor="interior-preview-upload"
                          className="w-full h-full flex flex-col items-center justify-center cursor-pointer"
                        >
                          <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                          <span className="text-xs text-center text-muted-foreground">Add Image</span>
                        </label>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Max 6 images, 2MB each (JPG, PNG, WebP)</p>
                </div>
                
                {/* Spine color selection */}
                {extractedColors.colors.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <Label className="text-sm">Spine Color</Label>
                    <div className="flex flex-wrap gap-2">
                      {extractedColors.colors.map((color, index) => (
                        <button
                          key={index}
                          type="button"
                          className={`h-8 w-8 rounded-full transition-all ${selectedColorIndex === index ? 'ring-2 ring-primary ring-offset-2' : 'ring-1 ring-muted'}`}
                          style={{ backgroundColor: color }}
                          onClick={() => handleSpineColorSelect(color, index)}
                          aria-label={`Select color ${color}`}
                        />
                      ))}
                      
                      {/* Custom color option */}
                      <div className="relative">
                        <input
                          type="color"
                          value={spineColor}
                          onChange={(e) => {
                            setSpineColor(e.target.value);
                            setSelectedColorIndex(-1);
                          }}
                          className="opacity-0 absolute inset-0 w-8 h-8 cursor-pointer"
                        />
                        <div className="h-8 w-8 rounded-full border flex items-center justify-center">
                          <Palette className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Create Full Cover button */}
                <Button 
                  type="button"
                  className="w-full"
                  disabled={isCreatingFullCover || !frontCoverUrl}
                  onClick={handleCreateFullCover}
                >
                  {isCreatingFullCover ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Full Cover...
                    </>
                  ) : (
                    <>
                      <Book className="mr-2 h-4 w-4" />
                      Create Full Cover
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Right side - Preview */}
        <div className="w-full lg:w-2/3 space-y-4">
          <Card className="h-full">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <ImageIcon className="mr-2 h-5 w-5 text-primary" />
                  Book Cover Preview
                </div>
                
                {generatedImage && (
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleDownload}
                      disabled={isDownloading}
                    >
                      {isDownloading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      Download Cover
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleRegenerate}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Regenerate
                    </Button>
                  </div>
                )}
              </CardTitle>
              
              {/* Tabs for Front Cover and Full Cover */}
              {frontCoverUrl && (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-2">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="front-cover">Front Cover Only</TabsTrigger>
                    <TabsTrigger 
                      value="full-cover"
                      disabled={!fullCoverUrl}
                    >
                      Full Cover (Front, Spine, Back)
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            </CardHeader>
            <CardContent className="flex justify-center items-center bg-gray-50 dark:bg-gray-900/20 min-h-[600px] rounded-lg relative">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-center">Generating your book cover...</p>
                  <p className="text-sm text-muted-foreground text-center">This may take 15-30 seconds</p>
                </div>
              ) : isCreatingFullCover ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-center">Creating full cover layout...</p>
                  <p className="text-sm text-muted-foreground text-center">Combining front cover, spine, and back</p>
                </div>
              ) : !frontCoverUrl ? (
                <div className="text-center p-8 max-w-lg">
                  <Book className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-xl font-medium mb-2">Your book cover will appear here</p>
                  <p className="text-sm text-muted-foreground mb-6">
                    Fill in the book specifications and click "Generate Book Cover" to create a print-ready cover for Amazon KDP.
                  </p>
                  <div className="bg-muted/30 p-4 rounded-lg max-w-md mx-auto">
                    <h3 className="font-medium text-sm mb-2">Cover will include:</h3>
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                      <li>Front cover with your title and author name</li>
                      <li>Back cover with space for description</li> 
                      <li>Spine with correct width based on page count</li>
                      <li>All required bleeds and margins for KDP</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="relative inline-block">
                  <div 
                    className="border border-gray-300 shadow-sm rounded-lg overflow-hidden"
                    style={{
                      transform: `scale(${zoomLevel})`,
                      transformOrigin: 'center',
                      transition: 'transform 0.2s ease'
                    }}
                  >
                    {/* Show the appropriate image based on active tab */}
                    {activeTab === "front-cover" && frontCoverUrl && (
                      <img 
                        src={frontCoverUrl} 
                        alt="Generated book cover front" 
                        className="max-w-full max-h-[600px] object-contain"
                      />
                    )}
                    
                    {activeTab === "full-cover" && fullCoverUrl && (
                      <img 
                        src={fullCoverUrl} 
                        alt="Generated full book cover" 
                        className="max-w-full max-h-[600px] object-contain"
                      />
                    )}
                    
                    {activeTab === "full-cover" && !fullCoverUrl && (
                      <div className="p-8 text-center">
                        <ImageOff className="mx-auto h-12 w-12 text-muted-foreground/30 mb-2" />
                        <p className="text-lg font-medium mb-2">Full cover not generated yet</p>
                        <p className="text-sm text-muted-foreground mb-4">
                          Click "Create Full Cover" to generate the complete book cover with spine and back.
                        </p>
                        <Button 
                          onClick={handleCreateFullCover}
                          disabled={isCreatingFullCover}
                        >
                          {isCreatingFullCover ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Book className="mr-2 h-4 w-4" />
                          )}
                          Create Full Cover
                        </Button>
                      </div>
                    )}
                    
                    {showGuides && activeTab === "front-cover" && (
                      <div className="absolute inset-0 pointer-events-none border-2 border-red-500/50 border-dashed" style={{ margin: '2%' }} />
                    )}
                  </div>
                  
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
            </CardContent>
          </Card>
          
          {/* Recent history */}
          {history.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <Book className="w-4 h-4 mr-2 text-primary" />
                Recent Book Covers
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {history.slice(0, 8).map((item) => (
                  <div 
                    key={item.id}
                    className="border rounded-lg overflow-hidden cursor-pointer hover:border-primary transition-all"
                    onClick={() => loadFromHistory(item)}
                  >
                    <div className="aspect-[1.4/1] relative">
                      <img 
                        src={item.imageUrl} 
                        alt={item.bookTitle}
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium truncate">{item.bookTitle}</p>
                      <p className="text-xs text-muted-foreground">{item.trimSize} {item.bookType}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default BookCoverGenerator; 