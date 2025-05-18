import React, { useState, useEffect } from "react";
import {
  Book,
  Layers,
  Copy,
  Sliders,
  Info,
  ChevronRight,
  Check,
  Maximize2,
  FileText,
  Palette,
  Settings2,
  ExternalLink,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// Trim size options
const TRIM_SIZES = [
  { value: "5x8", label: "5″ × 8″", popular: true },
  { value: "5.25x8", label: "5.25″ × 8″", popular: false },
  { value: "5.5x8.5", label: "5.5″ × 8.5″", popular: true },
  { value: "6x9", label: "6″ × 9″", popular: true },
  { value: "7x10", label: "7″ × 10″", popular: false },
  { value: "8x10", label: "8″ × 10″", popular: false },
  { value: "8.5x11", label: "8.5″ × 11″", popular: true },
];

// Paper type options
const PAPER_TYPES = [
  { 
    value: "white", 
    label: "White", 
    description: "Bright, high contrast, ideal for most books",
    colorClass: "bg-gray-50"
  },
  { 
    value: "cream", 
    label: "Cream", 
    description: "Soft, easier on eyes, popular for fiction",
    colorClass: "bg-amber-50"
  },
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
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [showCustomSize, setShowCustomSize] = useState(false);

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
    <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center">
            <Settings2 className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Book Settings</h2>
            <p className="text-sm text-gray-400">Configure your book specifications</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
          onClick={() => setShowGuidelines(!showGuidelines)}
        >
          <HelpCircle className="h-4 w-4 mr-2" />
          KDP Guidelines
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Settings Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Main Settings */}
          <div className="lg:col-span-7 space-y-6">
            {/* Trim Size Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Maximize2 className="h-4 w-4 text-cyan-400" />
                <h3 className="text-lg font-medium text-white">Trim Size</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {TRIM_SIZES.filter(s => s.popular).map((size) => (
                      <button
                        key={size.value}
                        onClick={() => handleTrimSizeChange(size.value)}
                        className={cn(
                          "relative px-3 py-4 rounded-xl transition-all duration-300 border border-gray-800 overflow-hidden group",
                          bookSettings.trimSize === size.value
                            ? "bg-gradient-to-br from-cyan-900/50 to-cyan-800/20 border-cyan-600"
                            : "hover:bg-gray-800/50 hover:border-gray-700"
                        )}
                      >
                        {bookSettings.trimSize === size.value && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center">
                            <Check className="h-3 w-3 text-black" />
                          </div>
                        )}
                        <div className="text-center">
                          <span className="block font-mono text-lg text-white">{size.label}</span>
                          <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                            {size.value === "5x8" ? "Pocket" : 
                             size.value === "6x9" ? "Standard" : 
                             size.value === "8.5x11" ? "Letter" : ""}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => setShowCustomSize(!showCustomSize)}
                      className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center"
                    >
                      {showCustomSize ? "Hide custom sizes" : "More sizes"}
                      <ChevronRight className={cn(
                        "h-4 w-4 ml-1 transition-transform", 
                        showCustomSize && "rotate-90"
                      )} />
                    </button>
                    
                    {bookSettings.trimSize && (
                      <div className="text-sm text-gray-400">
                        Selected: <span className="text-white font-medium">
                          {TRIM_SIZES.find(s => s.value === bookSettings.trimSize)?.label || bookSettings.trimSize}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {showCustomSize && (
                    <div className="bg-gray-800/30 rounded-xl p-4 mt-2 border border-gray-800 grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {TRIM_SIZES.filter(s => !s.popular).map((size) => (
                        <button
                          key={size.value}
                          onClick={() => handleTrimSizeChange(size.value)}
                          className={cn(
                            "px-2 py-2 rounded-lg transition-all border",
                            bookSettings.trimSize === size.value
                              ? "bg-cyan-900/30 border-cyan-700/50 text-white"
                              : "border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white"
                          )}
                        >
                          {size.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Page Count Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-cyan-400" />
                <h3 className="text-lg font-medium text-white">Page Count</h3>
              </div>
              
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    type="number"
                    min="24"
                    max="828"
                    value={bookSettings.pageCount}
                    onChange={handlePageCountChange}
                    className="h-14 bg-gray-800/30 border-gray-700 text-white rounded-xl pl-4 pr-16"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    pages
                  </div>
                </div>
                
                <div className="flex justify-between items-center bg-gray-800/30 rounded-lg px-3 py-2 text-xs text-gray-400">
                  <span>Min: 24 pages</span>
                  <span>Max: 828 pages</span>
                </div>
                
                <div className="grid grid-cols-5 gap-2">
                  {[75, 150, 250, 350, 450].map((count) => (
                    <button
                      key={count}
                      onClick={() => setBookSettings((prev: any) => ({ ...prev, pageCount: count }))}
                      className={cn(
                        "py-2 rounded-lg transition-all text-sm",
                        bookSettings.pageCount === count
                          ? "bg-cyan-900/30 text-cyan-100 border border-cyan-700/50"
                          : "bg-gray-800/50 text-gray-300 hover:bg-gray-800 hover:text-white border border-gray-800"
                      )}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Paper Type Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-cyan-400" />
                <h3 className="text-lg font-medium text-white">Paper Type</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PAPER_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => handlePaperTypeChange(type.value)}
                    className={cn(
                      "flex items-start p-4 rounded-xl border transition-all duration-200 text-left",
                      bookSettings.paperType === type.value
                        ? "bg-gradient-to-br from-cyan-900/40 to-cyan-800/10 border-cyan-700"
                        : "border-gray-800 hover:border-gray-700 bg-gray-800/20 hover:bg-gray-800/30"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg mr-3 flex-shrink-0 border border-gray-700",
                      type.colorClass
                    )} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-white">{type.label}</span>
                        {bookSettings.paperType === type.value && (
                          <Check className="h-4 w-4 text-cyan-400" />
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {type.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Right Column - Additional Options and Preview */}
          <div className="lg:col-span-5 space-y-6">
            {/* Options */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-cyan-400" />
                <h3 className="text-lg font-medium text-white">Additional Options</h3>
              </div>
              
              <div className="space-y-3 bg-gray-800/30 rounded-xl p-4 border border-gray-800">
                <div className="flex items-start justify-between py-2">
                  <div className="space-y-1">
                    <Label className="text-white">Include Bleed</Label>
                    <p className="text-xs text-gray-400">
                      Add 0.125" margin for edge-to-edge designs
                    </p>
                  </div>
                  <Switch
                    checked={bookSettings.hasBleed}
                    onCheckedChange={handleBleedChange}
                    className="data-[state=checked]:bg-cyan-600"
                  />
                </div>
                
                <Separator className="bg-gray-700/50" />
                
                <div className="flex items-start justify-between py-2">
                  <div className="space-y-1">
                    <Label className="text-white">Include ISBN Barcode</Label>
                    <p className="text-xs text-gray-400">
                      Reserve space for ISBN on back cover
                    </p>
                  </div>
                  <Switch
                    checked={bookSettings.hasISBN}
                    onCheckedChange={handleISBNChange}
                    className="data-[state=checked]:bg-cyan-600"
                  />
                </div>
              </div>
            </div>
            
            {/* Cover Dimensions Preview */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Book className="h-4 w-4 text-cyan-400" />
                <h3 className="text-lg font-medium text-white">Cover Dimensions</h3>
              </div>
              
              <div className="relative overflow-hidden bg-gradient-to-r from-gray-800/70 to-gray-800/40 rounded-xl border border-gray-700 p-5">
                <div className="absolute -bottom-14 -right-14 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Total Width:</span>
                        <Badge variant="outline" className="text-cyan-400 border-cyan-900/50 bg-cyan-950/30">
                          {bookSettings.dimensions.totalWidthInches}"
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Total Height:</span>
                        <Badge variant="outline" className="text-cyan-400 border-cyan-900/50 bg-cyan-950/30">
                          {bookSettings.dimensions.totalHeightInches}"
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Spine Width:</span>
                        <Badge variant="outline" className="text-cyan-400 border-cyan-900/50 bg-cyan-950/30">
                          {bookSettings.dimensions.spineWidthInches}"
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Resolution:</span>
                        <Badge variant="outline" className="text-cyan-400 border-cyan-900/50 bg-cyan-950/30">
                          {bookSettings.dimensions.dpi} DPI
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="relative bg-gray-900/70 rounded-lg p-3 flex items-center">
                      <div className="w-14 h-20 bg-gradient-to-br from-cyan-900/40 to-cyan-800/20 rounded-sm border border-cyan-950 flex-shrink-0 mr-3" />
                      <div className="text-sm text-gray-300">
                        Your cover will be generated based on these dimensions and settings. <span className="text-cyan-400">Preview</span> will be available in the next steps.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Help */}
            <div className="rounded-xl p-3 bg-yellow-500/10 border border-yellow-700/30">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <h3 className="text-sm font-medium text-yellow-400">Quick Help</h3>
              </div>
              <p className="text-xs text-gray-300">
                Ensure your chosen trim size matches your interior file. The most popular trim size for novels is 6" × 9".
              </p>
            </div>
          </div>
        </div>
        
        {/* Guidelines Section - Hidden by default */}
        {showGuidelines && (
          <div className="mt-4">
            <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-cyan-400" />
                  <h3 className="text-lg font-medium text-white">Amazon KDP Guidelines</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-gray-300 hover:text-white border-gray-700 hover:border-gray-600 bg-gray-800/50"
                  onClick={() => setShowGuidelines(false)}
                >
                  Close
                </Button>
              </div>
              
              <ScrollArea className="h-[350px] pr-4">
                <div className="space-y-6 p-1">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-cyan-400">Trim Size Requirements</h4>
                    <p className="text-sm text-gray-300">
                      KDP accepts specific trim sizes. Common sizes include 5" × 8", 5.5" × 8.5", 6" × 9", and 8.5" × 11".
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-cyan-400">Page Count Limitations</h4>
                    <p className="text-sm text-gray-300">
                      • Minimum: 24 pages for paperback books, 75 pages for hardcover books<br />
                      • Maximum: Typically 828 pages, but varies based on trim size and paper type
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-cyan-400">Spine Width Calculation</h4>
                    <p className="text-sm text-gray-300">
                      Spine width depends on page count and paper type:
                    </p>
                    <div className="bg-gray-800/70 rounded-lg p-3 text-sm font-mono">
                      <div className="text-gray-300 mb-1">White paper: <span className="text-cyan-400">Page count × 0.002252" = Spine width</span></div>
                      <div className="text-gray-300">Cream paper: <span className="text-cyan-400">Page count × 0.0025" = Spine width</span></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-cyan-400">Bleed Requirements</h4>
                    <p className="text-sm text-gray-300">
                      If your design extends to the edge of the page, include a 0.125" bleed on all sides.
                      The total cover width calculation:
                    </p>
                    <div className="bg-gray-800/70 rounded-lg p-3 text-sm font-mono text-gray-300">
                      Back Cover Width + Spine Width + Front Cover Width + <span className="text-cyan-400">0.25" (if bleed)</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-cyan-400">Resolution Requirements</h4>
                    <p className="text-sm text-gray-300">
                      Cover images should be at least 300 DPI (dots per inch) for best printing quality.
                    </p>
                  </div>
                  
                  <div className="mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-gray-300 hover:text-white border-gray-700 hover:border-gray-600 bg-gray-800/50"
                      onClick={() => window.open("https://kdp.amazon.com/en_US/help/topic/G201857950", "_blank")}
                    >
                      <ExternalLink className="h-3 w-3 mr-2" />
                      View Official KDP Guidelines
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookSettingsStep; 