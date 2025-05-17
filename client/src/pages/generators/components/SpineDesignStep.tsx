import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertCircle,
  Palette,
  Type,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SpineDesignStepProps {
  coverState: {
    frontCoverImage: string | null;
    backCoverImage: string | null;
    spineText: string;
    spineColor: string;
    spineFont: string;
    extractedColors: string[];
  };
  setCoverState: React.Dispatch<React.SetStateAction<any>>;
}

const SPINE_FONTS = [
  { value: "helvetica", label: "Helvetica" },
  { value: "times", label: "Times New Roman" },
  { value: "garamond", label: "Garamond" },
  { value: "futura", label: "Futura" },
];

const SpineDesignStep: React.FC<SpineDesignStepProps> = ({
  coverState,
  setCoverState,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Extract colors from front cover on mount
  useEffect(() => {
    if (coverState.frontCoverImage && coverState.extractedColors.length === 0) {
      handleExtractColors();
    }
  }, [coverState.frontCoverImage]);

  // Handle spine text change
  const handleSpineTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCoverState((prev: any) => ({
      ...prev,
      spineText: e.target.value,
    }));
  };

  // Handle spine color change
  const handleSpineColorChange = (color: string) => {
    setCoverState((prev: any) => ({
      ...prev,
      spineColor: color,
    }));
  };

  // Handle spine font change
  const handleSpineFontChange = (font: string) => {
    setCoverState((prev: any) => ({
      ...prev,
      spineFont: font,
    }));
  };

  // Extract colors from front cover
  const handleExtractColors = async () => {
    if (!coverState.frontCoverImage) {
      toast.error("Please generate the front cover first");
      return;
    }

    try {
      setIsLoading(true);
      
      // Call your API to extract colors
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/book-cover/extract-colors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: coverState.frontCoverImage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to extract colors");
      }

      const data = await response.json();
      
      if (data.colors) {
        setCoverState((prev: any) => ({
          ...prev,
          extractedColors: data.colors,
          spineColor: data.colors[0] || prev.spineColor,
        }));
        toast.success("Colors extracted successfully");
      }
    } catch (error) {
      console.error("Error extracting colors:", error);
      toast.error("Failed to extract colors");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert if no covers */}
      {(!coverState.frontCoverImage || !coverState.backCoverImage) && (
        <div className="flex items-center gap-2 text-amber-500 bg-amber-500/10 p-4 rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <p>Please generate both front and back covers first.</p>
        </div>
      )}

      {/* Spine Text */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            Spine Text
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Text that will appear on the book's spine</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
        </div>
        <Input
          placeholder="Enter spine text..."
          value={coverState.spineText}
          onChange={handleSpineTextChange}
          className="bg-gray-800/30"
        />
      </div>

      {/* Spine Font */}
      <div className="space-y-4">
        <Label className="flex items-center gap-2">
          Font Style
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Choose a font for the spine text</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>
        <Select
          value={coverState.spineFont}
          onValueChange={handleSpineFontChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select font" />
          </SelectTrigger>
          <SelectContent>
            {SPINE_FONTS.map((font) => (
              <SelectItem key={font.value} value={font.value}>
                {font.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Color Palette */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            Spine Color
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Colors extracted from your cover design</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Button
            onClick={handleExtractColors}
            disabled={isLoading || !coverState.frontCoverImage}
            variant="outline"
            size="sm"
          >
            <Palette className="w-4 h-4 mr-2" />
            Extract Colors
          </Button>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {coverState.extractedColors.map((color, index) => (
            <button
              key={index}
              onClick={() => handleSpineColorChange(color)}
              className={`w-full aspect-square rounded-lg transition-all ${
                color === coverState.spineColor
                  ? "ring-2 ring-violet-500 ring-offset-2 ring-offset-gray-900"
                  : ""
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <Input
          type="color"
          value={coverState.spineColor}
          onChange={(e) => handleSpineColorChange(e.target.value)}
          className="w-full h-12"
        />
      </div>

      {/* Preview */}
      <Card className="overflow-hidden bg-gray-800/30">
        <CardContent className="p-6">
          <div
            className="w-full h-[200px] rounded-lg flex items-center justify-center"
            style={{ backgroundColor: coverState.spineColor }}
          >
            <div
              className="text-white text-xl"
              style={{ fontFamily: coverState.spineFont }}
            >
              {coverState.spineText || "Spine Preview"}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SpineDesignStep; 