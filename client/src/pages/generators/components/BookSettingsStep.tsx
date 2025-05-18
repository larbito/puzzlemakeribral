import React, { useState } from "react";
import { 
  BookOpen, 
  Ruler, 
  FileText, 
  Info, 
  AlertCircle,
  ExternalLink,
  Check
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Trim size options
const TRIM_SIZES = [
  { value: "5x8", label: "5″ × 8″" },
  { value: "5.25x8", label: "5.25″ × 8″" },
  { value: "5.5x8.5", label: "5.5″ × 8.5″" },
  { value: "6x9", label: "6″ × 9″" },
  { value: "7x10", label: "7″ × 10″" },
  { value: "8x10", label: "8″ × 10″" },
  { value: "8.5x11", label: "8.5″ × 11″" },
];

// Paper type options
const PAPER_TYPES = [
  { value: "white", label: "White" },
  { value: "cream", label: "Cream" },
];

// Custom sizes for more flexibility
const CUSTOM_SIZE_PRESETS = [
  { width: 5, height: 8 },
  { width: 6, height: 9 },
  { width: 8, height: 10 },
  { width: 8.5, height: 11 },
];

interface BookSettingsStepProps {
  bookSettings: any;
  setBookSettings: React.Dispatch<React.SetStateAction<any>>;
}

const BookSettingsStep: React.FC<BookSettingsStepProps> = ({
  bookSettings,
  setBookSettings,
}) => {
  const [useCustomSize, setUseCustomSize] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  // Handle trim size change
  const handleTrimSizeChange = (value: string) => {
    setBookSettings((prev: any) => ({
      ...prev,
      trimSize: value,
    }));
  };

  // Handle page count change
  const handlePageCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setBookSettings((prev: any) => ({
        ...prev,
        pageCount: value,
      }));
    }
  };

  // Handle paper type change
  const handlePaperTypeChange = (value: string) => {
    setBookSettings((prev: any) => ({
      ...prev,
      paperType: value,
    }));
  };

  // Handle bleed switch
  const handleBleedChange = (checked: boolean) => {
    setBookSettings((prev: any) => ({
      ...prev,
      hasBleed: checked,
    }));
  };

  // Handle ISBN switch
  const handleISBNChange = (checked: boolean) => {
    setBookSettings((prev: any) => ({
      ...prev,
      hasISBN: checked,
    }));
  };

  // Handle custom size change
  const handleCustomWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0) {
      // Update custom dimensions
    }
  };

  const handleCustomHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0) {
      // Update custom dimensions
    }
  };

  // Apply custom size preset
  const applyCustomSizePreset = (width: number, height: number) => {
    // Apply custom size preset
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Basic Settings
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Ruler className="w-4 h-4" />
            Advanced
          </TabsTrigger>
          <TabsTrigger value="guidelines" className="flex items-center gap-2">
            <Info className="w-4 h-4" />
            KDP Guidelines
          </TabsTrigger>
        </TabsList>

        {/* Basic Settings Tab */}
        <TabsContent value="basic" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Trim Size Card */}
            <Card className="border border-violet-200/10 shadow-md backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-medium">Trim Size</CardTitle>
                    <CardDescription>Choose your book dimensions</CardDescription>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-violet-500/10 flex items-center justify-center">
                    <Ruler className="h-4 w-4 text-violet-500" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Select 
                    value={bookSettings.trimSize} 
                    onValueChange={handleTrimSizeChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select trim size" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRIM_SIZES.map((size) => (
                        <SelectItem key={size.value} value={size.value}>
                          {size.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="grid grid-cols-5 gap-1">
                    {TRIM_SIZES.slice(0, 5).map((size) => (
                      <button
                        key={size.value}
                        onClick={() => handleTrimSizeChange(size.value)}
                        className={cn(
                          "p-2 text-xs font-medium rounded-md transition-colors border border-violet-500/20",
                          bookSettings.trimSize === size.value
                            ? "bg-violet-600 text-white shadow-sm"
                            : "bg-violet-600/10 hover:bg-violet-600/20 text-violet-100"
                        )}
                      >
                        {size.label}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Page Count Card */}
            <Card className="border border-violet-200/10 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-medium">Page Count</CardTitle>
                    <CardDescription>Number of interior pages</CardDescription>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-violet-500/10 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-violet-500" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Input
                    type="number"
                    min="24"
                    max="828"
                    value={bookSettings.pageCount}
                    onChange={handlePageCountChange}
                    className="w-full"
                  />
                  
                  <div className="flex justify-between items-center text-xs text-violet-300/80">
                    <span>Min: 24 pages</span>
                    <span>Max: 828 pages</span>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2">
                    {[100, 200, 300, 400].map((count) => (
                      <button
                        key={count}
                        onClick={() => setBookSettings((prev: any) => ({ ...prev, pageCount: count }))}
                        className={cn(
                          "py-1 px-2 text-xs rounded-md transition-colors",
                          bookSettings.pageCount === count
                            ? "bg-violet-600 text-white"
                            : "bg-violet-600/10 hover:bg-violet-600/20 text-violet-100"
                        )}
                      >
                        {count} pages
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Paper Type and Options Card */}
          <Card className="border border-violet-200/10 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">Additional Options</CardTitle>
              <CardDescription>Configure paper type and other settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Paper Type */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Paper Type</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {PAPER_TYPES.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => handlePaperTypeChange(type.value)}
                        className={cn(
                          "flex items-center justify-center p-3 rounded-lg border transition-all",
                          bookSettings.paperType === type.value
                            ? "bg-violet-600 border-violet-500 text-white shadow-md"
                            : "bg-violet-600/5 border-violet-500/20 hover:bg-violet-600/10"
                        )}
                      >
                        <div className="text-center">
                          {bookSettings.paperType === type.value && (
                            <Check className="w-4 h-4 mx-auto mb-1" />
                          )}
                          <span className="text-sm font-medium">{type.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Include Bleed</Label>
                      <p className="text-xs text-muted-foreground">
                        Add 0.125" margin on all sides
                      </p>
                    </div>
                    <Switch
                      checked={bookSettings.hasBleed}
                      onCheckedChange={handleBleedChange}
                      className="data-[state=checked]:bg-violet-600"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Include ISBN Barcode</Label>
                      <p className="text-xs text-muted-foreground">
                        Add space for ISBN on back cover
                      </p>
                    </div>
                    <Switch
                      checked={bookSettings.hasISBN}
                      onCheckedChange={handleISBNChange}
                      className="data-[state=checked]:bg-violet-600"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cover Dimensions Card */}
          <Card className="border border-violet-200/10 shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-violet-600/20 to-purple-600/20 p-0.5"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Cover Dimensions</CardTitle>
              <CardDescription>Based on your selections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Width:</span>
                    <span className="font-mono font-medium">{bookSettings.dimensions.totalWidthInches}"</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Height:</span>
                    <span className="font-mono font-medium">{bookSettings.dimensions.totalHeightInches}"</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Spine Width:</span>
                    <span className="font-mono font-medium">{bookSettings.dimensions.spineWidthInches}"</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Resolution:</span>
                    <span className="font-mono font-medium">{bookSettings.dimensions.dpi} DPI</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <Card className="border border-violet-200/10 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Custom Trim Size</CardTitle>
              <CardDescription>Specify exact dimensions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="custom-width">Width (inches)</Label>
                  <Input
                    id="custom-width"
                    type="number"
                    min="4"
                    max="12"
                    step="0.125"
                    placeholder="Width"
                    onChange={handleCustomWidthChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-height">Height (inches)</Label>
                  <Input
                    id="custom-height"
                    type="number"
                    min="6"
                    max="12"
                    step="0.125"
                    placeholder="Height"
                    onChange={handleCustomHeightChange}
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-sm mb-2 block">Common Custom Sizes</Label>
                <div className="grid grid-cols-2 gap-2">
                  {CUSTOM_SIZE_PRESETS.map((size, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => applyCustomSizePreset(size.width, size.height)}
                      className="justify-start text-left"
                    >
                      {size.width}" × {size.height}"
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border border-violet-200/10 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Advanced Cover Settings</CardTitle>
              <CardDescription>Fine-tune your cover specifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">High DPI (450 DPI)</Label>
                  <p className="text-xs text-muted-foreground">
                    Generate higher resolution covers
                  </p>
                </div>
                <Switch className="data-[state=checked]:bg-violet-600" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Show Safety Margins</Label>
                  <p className="text-xs text-muted-foreground">
                    Display text and critical element margins
                  </p>
                </div>
                <Switch defaultChecked className="data-[state=checked]:bg-violet-600" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* KDP Guidelines Tab */}
        <TabsContent value="guidelines" className="space-y-4">
          <Card className="border border-violet-200/10 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Amazon KDP Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[350px] pr-4">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-amber-400">Trim Size</h3>
                    <p className="text-sm text-muted-foreground">
                      KDP accepts specific trim sizes. Common sizes include 5" x 8", 5.5" x 8.5", 6" x 9", and 8.5" x 11".
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-amber-400">Minimum Page Count</h3>
                    <p className="text-sm text-muted-foreground">
                      Paperback books require a minimum of 24 pages, and hardcover books require at least 75 pages.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-amber-400">Maximum Page Count</h3>
                    <p className="text-sm text-muted-foreground">
                      Maximum page count depends on trim size and paper type but is typically 828 pages for paperbacks.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-amber-400">Spine Width Calculation</h3>
                    <p className="text-sm text-muted-foreground">
                      Spine width is calculated based on page count and paper type:
                    </p>
                    <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                      <li>White paper: Page count × 0.002252" = Spine width</li>
                      <li>Cream paper: Page count × 0.0025" = Spine width</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-amber-400">Bleed Requirements</h3>
                    <p className="text-sm text-muted-foreground">
                      If your design extends to the edge of the page, include a 0.125" bleed on all sides.
                      The total cover width will be:
                    </p>
                    <pre className="text-xs bg-violet-900/20 p-2 rounded font-mono">
                      Back Cover Width + Spine Width + Front Cover Width + 0.25" (if bleed)
                    </pre>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-amber-400">Resolution Requirements</h3>
                    <p className="text-sm text-muted-foreground">
                      Cover images should be at least 300 DPI (dots per inch) for best printing quality.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-amber-400">File Format</h3>
                    <p className="text-sm text-muted-foreground">
                      KDP accepts PDF files for print-ready covers. The PDF should be a single page with the back cover, spine, and front cover in that order from left to right.
                    </p>
                  </div>
                  
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => window.open("https://kdp.amazon.com/en_US/help/topic/G201857950", "_blank")}
                    >
                      Read Full KDP Guidelines
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BookSettingsStep; 