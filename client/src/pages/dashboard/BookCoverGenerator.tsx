import React, { useState, useEffect } from "react";
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
  Info
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { generateBookCover } from "@/services/ideogramService";

// Trim size options for Amazon KDP
const trimSizeOptions = [
  { value: "5x8", label: "5" × 8" (12.7 × 20.32 cm)", dimensions: { width: 5, height: 8 } },
  { value: "5.25x8", label: "5.25" × 8" (13.34 × 20.32 cm)", dimensions: { width: 5.25, height: 8 } },
  { value: "5.5x8.5", label: "5.5" × 8.5" (13.97 × 21.59 cm)", dimensions: { width: 5.5, height: 8.5 } },
  { value: "6x9", label: "6" × 9" (15.24 × 22.86 cm)", dimensions: { width: 6, height: 9 } },
  { value: "7x10", label: "7" × 10" (17.78 × 25.4 cm)", dimensions: { width: 7, height: 10 } },
  { value: "8x10", label: "8" × 10" (20.32 × 25.4 cm)", dimensions: { width: 8, height: 10 } },
  { value: "8.5x11", label: "8.5" × 11" (21.59 × 27.94 cm)", dimensions: { width: 8.5, height: 11 } },
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
  bookTitle: string;
  authorName: string;
  prompt: string;
  style: string;
  trimSize: string;
  pageCount: number;
  paperColor: string;
  bookType: string;
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
  
  // State for generated image
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  
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

  // Generate a prompt based on user inputs
  const generateFormattedPrompt = () => {
    let basePrompt = `A professional book cover for a book titled "${bookTitle}" by ${authorName}, showing the full layout: back cover on the left, spine in the center, and front cover on the right. ${prompt}. Print-ready design for a ${trimSize.replace('x', '" × ')}″ ${bookType} book, with clean layout and clear readable fonts.`;
    
    // Add style information if selected
    if (style && style !== "realistic") {
      basePrompt += ` Style: ${style}.`;
    }
    
    return basePrompt;
  };
  
  // Save to history
  const saveToHistory = (imageUrl: string) => {
    try {
      const newItem: BookCoverHistoryItem = {
        id: Math.random().toString(36).substring(2) + Date.now().toString(36),
        imageUrl,
        bookTitle,
        authorName,
        prompt,
        style,
        trimSize,
        pageCount,
        paperColor,
        bookType,
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
    if (!generatedImage) {
      toast.error('No image to download');
      return;
    }
    
    setIsDownloading(true);
    
    try {
      // Create a descriptive filename
      const safeTitle = bookTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const filename = `${safeTitle}-${trimSize}-${Date.now()}`;
      
      // Create link element and trigger download
      const link = document.createElement('a');
      
      // If it's a data URL, use it directly
      if (generatedImage.startsWith('data:')) {
        link.href = generatedImage;
      } else {
        // For URLs, fetch the image as a blob
        const response = await fetch(generatedImage);
        const blob = await response.blob();
        link.href = URL.createObjectURL(blob);
      }
      
      link.download = `${filename}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Book cover downloaded successfully');
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error('Failed to download book cover');
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!bookTitle.trim()) {
      toast.error("Book title is required");
      return;
    }
    
    if (!authorName.trim()) {
      toast.error("Author name is required");
      return;
    }
    
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
      const imageUrl = await generateBookCover({
        prompt: formattedPrompt,
        style,
        width: dimensions.widthPixels,
        height: dimensions.heightPixels
      });
      
      if (imageUrl) {
        setGeneratedImage(imageUrl);
        
        // Save to history
        saveToHistory(imageUrl);
        
        toast.success("Book cover generated successfully!");
      } else {
        toast.error("Failed to generate book cover image");
      }
    } catch (error) {
      console.error("Error generating book cover:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate book cover");
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Handle regeneration
  const handleRegenerate = () => {
    if (isGenerating) return;
    
    // Use existing inputs to regenerate
    handleSubmit(new Event('submit') as any);
  };
  
  // Handle updating settings from history item
  const loadFromHistory = (item: BookCoverHistoryItem) => {
    setBookTitle(item.bookTitle);
    setAuthorName(item.authorName);
    setPrompt(item.prompt);
    setStyle(item.style);
    setTrimSize(item.trimSize);
    setPageCount(item.pageCount);
    setPaperColor(item.paperColor);
    setBookType(item.bookType);
    setGeneratedImage(item.imageUrl);
    
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
                  <CardTitle className="text-base mb-4">Book Content</CardTitle>
                  
                  {/* Book title */}
                  <div className="space-y-2 mb-4">
                    <Label htmlFor="book-title">Book Title</Label>
                    <Input
                      id="book-title"
                      value={bookTitle}
                      onChange={(e) => setBookTitle(e.target.value)}
                      placeholder="Enter your book title"
                    />
                  </div>
                  
                  {/* Author name */}
                  <div className="space-y-2 mb-4">
                    <Label htmlFor="author-name">Author Name</Label>
                    <Input
                      id="author-name"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="Enter author name"
                    />
                  </div>
                  
                  {/* Cover description */}
                  <div className="space-y-2 mb-4">
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
                            <p>Describe what you want on your full book cover. Remember this includes the front cover, spine, and back cover.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Textarea
                      id="cover-description"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe your book cover in detail (front, spine, and back). Be specific about imagery, colors, and mood."
                      className="min-h-[120px]"
                    />
                  </div>
                  
                  {/* Style */}
                  <div className="space-y-2 mb-6">
                    <Label htmlFor="cover-style">Cover Style</Label>
                    <Select 
                      value={style} 
                      onValueChange={setStyle}
                    >
                      <SelectTrigger id="cover-style">
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
                    className="w-full"
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
        </div>
        
        {/* Right side - Preview */}
        <div className="w-full lg:w-2/3 space-y-4">
          <Card className="h-full">
            <CardHeader>
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
            </CardHeader>
            <CardContent className="flex justify-center items-center bg-gray-50 dark:bg-gray-900/20 min-h-[600px] rounded-lg relative">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-center">Generating your book cover...</p>
                  <p className="text-sm text-muted-foreground text-center">This may take 15-30 seconds</p>
                </div>
              ) : !generatedImage ? (
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
                    <img 
                      src={generatedImage} 
                      alt="Generated book cover" 
                      className="max-w-full max-h-[600px] object-contain"
                    />
                    
                    {showGuides && (
                      <div className="absolute inset-0 pointer-events-none">
                        {/* Spine guide */}
                        <div 
                          className="absolute top-0 bottom-0 border-l-2 border-r-2 border-blue-500/50 border-dashed" 
                          style={{
                            left: `calc(50% - ${(dimensions.spineWidth / dimensions.widthInches * 100) / 2}%)`,
                            right: `calc(50% - ${(dimensions.spineWidth / dimensions.widthInches * 100) / 2}%)`,
                          }}
                        />
                        
                        {/* Trim lines */}
                        <div className="absolute inset-0 border-2 border-red-500/50 border-dashed" style={{ margin: '2%' }} />
                        
                        {/* Center line */}
                        <div className="absolute left-1/2 top-0 bottom-0 border-l border-blue-500/30" style={{ transform: 'translateX(-50%)' }} />
                      </div>
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