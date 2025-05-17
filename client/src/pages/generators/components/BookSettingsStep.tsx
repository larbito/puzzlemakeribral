import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BookSettingsStepProps {
  bookSettings: {
    dimensions: {
      width: number;
      height: number;
      spine: number;
      totalWidthInches: string;
      totalHeightInches: string;
      spineWidthInches: string;
      dpi: number;
    };
  };
  setBookSettings: React.Dispatch<React.SetStateAction<any>>;
}

// Common KDP trim sizes in inches
const TRIM_SIZES = [
  { value: "5x8", label: "5″ x 8″ (12.7 x 20.32 cm)" },
  { value: "5.25x8", label: "5.25″ x 8″ (13.34 x 20.32 cm)" },
  { value: "5.5x8.5", label: "5.5″ x 8.5″ (13.97 x 21.59 cm)" },
  { value: "6x9", label: "6″ x 9″ (15.24 x 22.86 cm)" },
  { value: "6.14x9.21", label: "6.14″ x 9.21″ (15.6 x 23.39 cm)" },
  { value: "7x10", label: "7″ x 10″ (17.78 x 25.4 cm)" },
  { value: "8x10", label: "8″ x 10″ (20.32 x 25.4 cm)" },
  { value: "8.5x11", label: "8.5″ x 11″ (21.59 x 27.94 cm)" },
];

const PAPER_TYPES = [
  { value: "white", label: "White Paper" },
  { value: "cream", label: "Cream Paper" },
];

const BookSettingsStep: React.FC<BookSettingsStepProps> = ({
  bookSettings,
  setBookSettings,
}) => {
  const [customSize, setCustomSize] = useState(false);
  const [pageCount, setPageCount] = useState(100);
  const [paperType, setPaperType] = useState(PAPER_TYPES[0].value);
  const [hasBleed, setHasBleed] = useState(true);
  const [hasISBN, setHasISBN] = useState(true);

  // Calculate spine width based on page count and paper type
  const calculateSpineWidth = (pages: number, paper: string): number => {
    // These are approximate values based on KDP's guidelines
    const pagesPerInch = paper === "white" ? 434 : 370;
    return pages / pagesPerInch;
  };

  // Update dimensions when settings change
  useEffect(() => {
    const spineWidth = calculateSpineWidth(pageCount, paperType);
    const bleedMargin = hasBleed ? 0.125 : 0; // 0.125 inches bleed

    let width = 6; // Default width
    let height = 9; // Default height

    // Parse selected trim size
    if (!customSize) {
      const selectedSize = TRIM_SIZES.find((size) => size.value === (bookSettings.dimensions.width / 300).toString());
      if (selectedSize) {
        const [w, h] = selectedSize.value.split("x").map(Number);
        width = w;
        height = h;
      }
    }

    // Add bleed to dimensions if enabled
    const totalWidth = width + (bleedMargin * 2);
    const totalHeight = height + (bleedMargin * 2);

    setBookSettings((prev: any) => ({
      ...prev,
      dimensions: {
        ...prev.dimensions,
        width: totalWidth * 300, // Convert to pixels at 300 DPI
        height: totalHeight * 300,
        spine: spineWidth * 300,
        totalWidthInches: totalWidth.toFixed(3),
        totalHeightInches: totalHeight.toFixed(3),
        spineWidthInches: spineWidth.toFixed(3),
        dpi: 300,
      },
    }));
  }, [customSize, pageCount, paperType, hasBleed, bookSettings.dimensions.width]);

  return (
    <div className="space-y-6">
      {/* Trim Size */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            Trim Size
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>The final size of your printed book</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <div className="flex items-center gap-2">
            <Label>Custom Size</Label>
            <Switch
              checked={customSize}
              onCheckedChange={setCustomSize}
            />
          </div>
        </div>

        {customSize ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Width (inches)</Label>
              <Input
                type="number"
                min="4"
                max="8.5"
                step="0.125"
                value={bookSettings.dimensions.width / 300}
                onChange={(e) => setBookSettings((prev: any) => ({
                  ...prev,
                  dimensions: {
                    ...prev.dimensions,
                    width: parseFloat(e.target.value) * 300,
                  },
                }))}
                className="bg-gray-800/30"
              />
            </div>
            <div className="space-y-2">
              <Label>Height (inches)</Label>
              <Input
                type="number"
                min="6"
                max="11"
                step="0.125"
                value={bookSettings.dimensions.height / 300}
                onChange={(e) => setBookSettings((prev: any) => ({
                  ...prev,
                  dimensions: {
                    ...prev.dimensions,
                    height: parseFloat(e.target.value) * 300,
                  },
                }))}
                className="bg-gray-800/30"
              />
            </div>
          </div>
        ) : (
          <Select
            value={bookSettings.dimensions.width.toString()}
            onValueChange={(value) => setBookSettings((prev: any) => ({
              ...prev,
              dimensions: {
                ...prev.dimensions,
                width: value,
              },
            }))}
          >
            <SelectTrigger>
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
        )}
      </div>

      {/* Page Count */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          Page Count
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Total number of pages in your book</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>
        <Input
          type="number"
          min="24"
          max="828"
          value={pageCount}
          onChange={(e) => setPageCount(parseInt(e.target.value))}
          className="bg-gray-800/30"
        />
      </div>

      {/* Paper Type */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          Paper Type
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Affects spine width calculation</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>
        <Select value={paperType} onValueChange={setPaperType}>
          <SelectTrigger>
            <SelectValue placeholder="Select paper type" />
          </SelectTrigger>
          <SelectContent>
            {PAPER_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Options */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            Include Bleed
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add 0.125" margin for trimming</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Switch
            checked={hasBleed}
            onCheckedChange={setHasBleed}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            Include ISBN
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add space for ISBN barcode</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Switch
            checked={hasISBN}
            onCheckedChange={setHasISBN}
          />
        </div>
      </div>

      {/* Calculated Dimensions */}
      <Card className="bg-gray-800/30">
        <CardContent className="p-6 space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Total Width: </span>
              <span className="font-medium">{bookSettings.dimensions.totalWidthInches}"</span>
            </div>
            <div>
              <span className="text-gray-400">Total Height: </span>
              <span className="font-medium">{bookSettings.dimensions.totalHeightInches}"</span>
            </div>
            <div>
              <span className="text-gray-400">Spine Width: </span>
              <span className="font-medium">{bookSettings.dimensions.spineWidthInches}"</span>
            </div>
            <div>
              <span className="text-gray-400">Resolution: </span>
              <span className="font-medium">{bookSettings.dimensions.dpi} DPI</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookSettingsStep; 