import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Book,
  ImageIcon,
  Loader2,
  Download,
  RefreshCw,
  Sparkles,
  Info,
  X,
  Upload,
  Palette,
  FileText
} from "lucide-react";

// Import our new utility functions
import {
  trimSizeOptions,
  paperColorOptions,
  bookTypeOptions,
  calculateCoverDimensions,
  getSpineColorSuggestions,
  type CoverDimensions
} from "@/lib/coverUtils";

// Import API functions
import {
  generateBookCover,
  downloadImage,
  loadImage,
  getProxiedImageUrl
} from "@/lib/api";

// Component interfaces
interface InteriorPreview {
  file: File;
  url: string;
}

const NewBookCoverGenerator = () => {
  // Form state
  const [bookType, setBookType] = useState("paperback");
  const [trimSize, setTrimSize] = useState("6x9");
  const [pageCount, setPageCount] = useState(120);
  const [paperColor, setPaperColor] = useState("white");
  const [prompt, setPrompt] = useState("");
  const [spineText, setSpineText] = useState("");
  const [spineColor, setSpineColor] = useState("#333333");
  const [showGuides, setShowGuides] = useState(true);
  const [showInteriorPreviews, setShowInteriorPreviews] = useState(true);
  
  // Generated content state
  const [frontCoverUrl, setFrontCoverUrl] = useState<string | null>(null);
  const [fullCoverUrl, setFullCoverUrl] = useState<string | null>(null);
  const [spineColorOptions, setSpineColorOptions] = useState<string[]>([]);
  const [interiorPreviews, setInteriorPreviews] = useState<InteriorPreview[]>([]);
  
  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingFullCover, setIsCreatingFullCover] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState("front-cover");
  const [dimensions, setDimensions] = useState<CoverDimensions | null>(null);
  
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Calculate cover dimensions whenever relevant inputs change
  useEffect(() => {
    try {
      const newDimensions = calculateCoverDimensions(trimSize, pageCount, paperColor);
      setDimensions(newDimensions);
    } catch (error) {
      console.error("Error calculating dimensions:", error);
      toast.error("Error calculating cover dimensions. Please check your inputs.");
    }
  }, [trimSize, pageCount, paperColor]);
  
  // Extract spine colors when front cover is generated
  useEffect(() => {
    const extractColors = async () => {
      if (frontCoverUrl) {
        try {
          const colors = await getSpineColorSuggestions(frontCoverUrl);
          setSpineColorOptions(colors);
          
          // Set default spine color to the first suggestion
          if (colors.length > 0 && !spineColor) {
            setSpineColor(colors[0]);
          }
        } catch (error) {
          console.error("Error extracting colors:", error);
        }
      }
    };
    
    extractColors();
  }, [frontCoverUrl, spineColor]);
  
  // Rest of the component (handlers, JSX) will be added next...
  
  return (
    <PageLayout
      title="Book Cover Generator"
      description="Create professional print-ready book covers for Amazon KDP with AI"
    >
      <div className="text-center font-bold text-lg my-4 text-white bg-green-600 py-2 rounded-md">
        🎉 NEW VERSION: Completely rebuilt for reliability
      </div>
      
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
              <form className="space-y-4">
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
                      {bookTypeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
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
                      {paperColorOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
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
                {dimensions && (
                  <div className="rounded-lg bg-primary/5 p-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Final Size (with bleed):</span>
                      <span className="font-medium">
                        {dimensions.totalWidthInches.toFixed(2)}″ × {dimensions.totalHeightInches.toFixed(2)}″
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Spine Width:</span>
                      <span className="font-medium">{dimensions.spineWidth.toFixed(3)}″</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Resolution:</span>
                      <span className="font-medium">{dimensions.pixelWidth} × {dimensions.pixelHeight} px</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>DPI:</span>
                      <span className="font-medium">{dimensions.dpi}</span>
                    </div>
                  </div>
                )}
                
                <div className="border-t pt-4">
                  {/* Cover description */}
                  <div className="space-y-2 mb-4">
                    <Label htmlFor="cover-description">Cover Description</Label>
                    <Textarea
                      id="cover-description"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe your book cover design. Focus on imagery, colors, style, and mood."
                      className="min-h-[120px]"
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
                  <button 
                    type="button" 
                    className="w-full relative z-10 px-4 py-2 font-medium text-white bg-teal-500 rounded-lg hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                    disabled={isGenerating || !prompt.trim()}
                    onClick={handleGenerateCover}
                  >
                    {isGenerating ? (
                      <>
                        <span className="mr-2">⏳</span>
                        Generating...
                      </>
                    ) : (
                      <>
                        <span className="mr-2">✨</span>
                        Generate Book Cover
                      </>
                    )}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        
          {/* Interior Preview Images - only show when front cover exists */}
          {frontCoverUrl && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center">
                    <FileText className="mr-2 h-4 w-4 text-primary" />
                    Interior Preview Images
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Show on Back Cover</span>
                    <Switch
                      checked={showInteriorPreviews}
                      onCheckedChange={setShowInteriorPreviews}
                      aria-label="Show interior previews"
                    />
                  </div>
                </CardTitle>
                <CardDescription>
                  Add up to 6 interior pages to show on back cover
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {showInteriorPreviews && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      {interiorPreviews.map((preview, index) => (
                        <div 
                          key={index} 
                          className="relative aspect-[4/5] border rounded-md overflow-hidden group"
                        >
                          <img 
                            src={preview.url} 
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
                        <div 
                          className="aspect-[4/5] border border-dashed rounded-md flex flex-col items-center justify-center p-2 cursor-pointer hover:bg-muted/50 transition-colors"
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                        >
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
                            <span className="text-xs text-center text-muted-foreground mt-1">or drag & drop</span>
                          </label>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Max 6 images, 2MB each (JPG, PNG, WebP)</p>
                  </div>
                )}
                
                {/* Create Full Cover button */}
                <button 
                  type="button"
                  className="w-full px-4 py-2 font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  disabled={isCreatingFullCover || !frontCoverUrl}
                  onClick={handleCreateFullCover}
                >
                  {isCreatingFullCover ? (
                    <>
                      <span className="mr-2">⏳</span>
                      Creating Full Cover...
                    </>
                  ) : fullCoverUrl ? (
                    <>
                      <span className="mr-2">🔄</span>
                      Recreate Full Cover
                    </>
                  ) : (
                    <>
                      <span className="mr-2">📕</span>
                      Create Full Cover
                    </>
                  )}
                </button>
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
                
                {/* Action buttons */}
                {(frontCoverUrl || fullCoverUrl) && (
                  <div className="flex items-center gap-2">
                    <button 
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      disabled={isDownloading || (!frontCoverUrl && !fullCoverUrl)}
                      onClick={handleDownload}
                    >
                      {isDownloading ? (
                        <span className="mr-1">⏳</span>
                      ) : (
                        <span className="mr-1">⬇️</span>
                      )}
                      Download Cover
                    </button>
                    
                    {frontCoverUrl && (
                      <button 
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        disabled={isGenerating}
                        onClick={handleGenerateCover}
                      >
                        {isGenerating ? (
                          <span className="mr-1">⏳</span>
                        ) : (
                          <span className="mr-1">🔄</span>
                        )}
                        Regenerate
                      </button>
                    )}
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
                      disabled={!fullCoverUrl && !isCreatingFullCover}
                    >
                      {isCreatingFullCover 
                        ? "Creating..." 
                        : "Full Cover (Front, Spine, Back)"}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            </CardHeader>
            
            <CardContent className="flex justify-center items-center bg-gray-50 dark:bg-gray-900/20 min-h-[600px] rounded-lg relative">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                  <p className="text-center">Generating your book cover...</p>
                  <p className="text-sm text-muted-foreground text-center">This may take 15-30 seconds</p>
                </div>
              ) : isCreatingFullCover ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
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
                </div>
              ) : (
                <div className="relative">
                  {/* Show the appropriate image based on active tab */}
                  {activeTab === "front-cover" && frontCoverUrl && (
                    <img 
                      src={frontCoverUrl} 
                      alt="Generated book cover front" 
                      className="max-w-full max-h-[600px] object-contain rounded shadow"
                    />
                  )}
                  
                  {activeTab === "full-cover" && fullCoverUrl && (
                    <img 
                      src={fullCoverUrl} 
                      alt="Generated full book cover" 
                      className="max-w-full max-h-[600px] object-contain rounded shadow"
                    />
                  )}
                  
                  {activeTab === "full-cover" && !fullCoverUrl && (
                    <div className="p-8 text-center">
                      <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/30 mb-2" />
                      <p className="text-lg font-medium mb-2">Full cover not generated yet</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Click "Create Full Cover" to generate the complete book cover with spine and back.
                      </p>
                      <Button 
                        onClick={handleCreateFullCover}
                      >
                        <Book className="mr-2 h-4 w-4" />
                        Create Full Cover
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default NewBookCoverGenerator; 