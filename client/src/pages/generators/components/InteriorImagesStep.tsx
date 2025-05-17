import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  Upload,
  X,
  Image,
  Info,
  FileImage,
} from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface InteriorImagesStepProps {
  coverState: {
    interiorImages: string[];
  };
  setCoverState: React.Dispatch<React.SetStateAction<any>>;
}

const MAX_IMAGES = 4;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const InteriorImagesStep: React.FC<InteriorImagesStepProps> = ({
  coverState,
  setCoverState,
}) => {
  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error("File size must be less than 5MB");
        return;
      }

      // Check if we've reached the maximum number of images
      if (coverState.interiorImages.length >= MAX_IMAGES) {
        toast.error(`Maximum ${MAX_IMAGES} images allowed`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setCoverState((prev: any) => ({
            ...prev,
            interiorImages: [...prev.interiorImages, reader.result],
          }));
          toast.success("Image uploaded successfully");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle image removal
  const handleRemoveImage = (index: number) => {
    setCoverState((prev: any) => ({
      ...prev,
      interiorImages: prev.interiorImages.filter((_: any, i: number) => i !== index),
    }));
    toast.success("Image removed");
  };

  return (
    <div className="space-y-6">
      {/* Info Alert */}
      <div className="flex items-center gap-2 text-blue-500 bg-blue-500/10 p-4 rounded-lg">
        <Info className="w-5 h-5" />
        <p>Upload up to 4 interior pages to be displayed on the back cover (optional).</p>
      </div>

      {/* Upload Area */}
      <div className="space-y-4">
        <Label className="flex items-center gap-2">
          Interior Pages
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p>These images will appear in the lower area of the back cover</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>

        {coverState.interiorImages.length < MAX_IMAGES && (
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
              "border-gray-600 hover:border-violet-500"
            )}
          >
            <div className="space-y-4">
              <FileImage className="w-12 h-12 mx-auto text-gray-400" />
              <div className="text-sm text-gray-400">
                Drag and drop an image here, or click to select
              </div>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="interior-image-upload"
              />
              <Button
                onClick={() => document.getElementById("interior-image-upload")?.click()}
                variant="outline"
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Image
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Image Grid */}
      {coverState.interiorImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {coverState.interiorImages.map((image, index) => (
            <Card key={index} className="relative overflow-hidden bg-gray-800/30">
              <Button
                onClick={() => handleRemoveImage(index)}
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 z-10 w-8 h-8"
              >
                <X className="w-4 h-4" />
              </Button>
              <CardContent className="p-0">
                <img
                  src={image}
                  alt={`Interior page ${index + 1}`}
                  className="w-full h-48 object-cover"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {coverState.interiorImages.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          <Image className="w-12 h-12 mx-auto mb-4" />
          <p>No interior images uploaded yet</p>
        </div>
      )}

      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>{coverState.interiorImages.length} of {MAX_IMAGES} images uploaded</span>
        <span>{MAX_IMAGES - coverState.interiorImages.length} slots remaining</span>
      </div>
    </div>
  );
};

export default InteriorImagesStep; 