import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TabsList, TabsTrigger, Tabs, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  ImageIcon,
  Upload,
  X,
  Loader2,
  Wand2,
  Sparkles,
  UploadCloud,
  RotateCw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FrontCoverStepProps {
  coverState: {
    frontPrompt: string;
    frontCoverImage: string | null;
  };
  setCoverState: React.Dispatch<React.SetStateAction<any>>;
}

const FrontCoverStep: React.FC<FrontCoverStepProps> = ({
  coverState,
  setCoverState,
}) => {
  const [isLoading, setIsLoading] = useState<{
    extractPrompt: boolean;
    generateCover: boolean;
    enhanceCover: boolean;
  }>({
    extractPrompt: false,
    generateCover: false,
    enhanceCover: false,
  });
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"text" | "image">("text");

  // Handle prompt input change
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCoverState((prev: any) => ({
      ...prev,
      frontPrompt: e.target.value,
    }));
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setUploadedImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Extract prompt from image
  const handleExtractPrompt = async () => {
    if (!uploadedImage) {
      toast.error("Please upload an image first");
      return;
    }

    try {
      setIsLoading((prev) => ({ ...prev, extractPrompt: true }));
      
      // Call your API to extract prompt from image
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/openai/extract-prompt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: uploadedImage,
          context: "Create a detailed book cover design description based on this image. Focus on capturing the style, mood, colors, composition, and key visual elements that would make a great book cover.",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to extract prompt from image");
      }

      const data = await response.json();
      
      if (data.extractedPrompt) {
        setCoverState((prev: any) => ({
          ...prev,
          frontPrompt: data.extractedPrompt,
        }));
        setActiveTab("text");
        toast.success("Prompt extracted successfully");
      }
    } catch (error) {
      console.error("Error extracting prompt:", error);
      toast.error("Failed to extract prompt from image");
    } finally {
      setIsLoading((prev) => ({ ...prev, extractPrompt: false }));
    }
  };

  // Generate front cover
  const handleGenerateCover = async () => {
    if (!coverState.frontPrompt) {
      toast.error("Please enter a prompt first");
      return;
    }

    try {
      setIsLoading((prev) => ({ ...prev, generateCover: true }));
      
      // Call your API to generate cover
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ideogram/generate-custom`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: coverState.frontPrompt,
          width: "2400",
          height: "3600",
          rendering_speed: "DEFAULT",
          negative_prompt: "text overlays, watermark, signature, blurry, low quality, distorted"
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate cover");
      }

      const data = await response.json();
      
      if (data.url) {
        setCoverState((prev: any) => ({
          ...prev,
          frontCoverImage: data.url,
        }));
        toast.success("Cover generated successfully");
      }
    } catch (error) {
      console.error("Error generating cover:", error);
      toast.error("Failed to generate cover");
    } finally {
      setIsLoading((prev) => ({ ...prev, generateCover: false }));
    }
  };

  // Enhance cover
  const handleEnhanceCover = async () => {
    if (!coverState.frontCoverImage) {
      toast.error("Please generate a cover first");
      return;
    }

    try {
      setIsLoading((prev) => ({ ...prev, enhanceCover: true }));
      
      // Call your API to enhance cover
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/replicate/enhance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: coverState.frontCoverImage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to enhance cover");
      }

      const data = await response.json();
      
      if (data.url) {
        setCoverState((prev: any) => ({
          ...prev,
          frontCoverImage: data.url,
        }));
        toast.success("Cover enhanced successfully");
      }
    } catch (error) {
      console.error("Error enhancing cover:", error);
      toast.error("Failed to enhance cover");
    } finally {
      setIsLoading((prev) => ({ ...prev, enhanceCover: false }));
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "text" | "image")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="text" className="flex items-center gap-2">
            <Wand2 className="w-4 h-4" />
            Write Prompt
          </TabsTrigger>
          <TabsTrigger value="image" className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Upload Reference
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="space-y-4">
          <Textarea
            placeholder="Describe your ideal book cover..."
            value={coverState.frontPrompt}
            onChange={handlePromptChange}
            className="min-h-[150px] bg-gray-800/30"
          />
          <div className="flex gap-2">
            <Button
              onClick={handleGenerateCover}
              disabled={isLoading.generateCover}
              className="flex-1 bg-violet-600 hover:bg-violet-700"
            >
              {isLoading.generateCover ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Generate Cover
            </Button>
            {coverState.frontCoverImage && (
              <Button
                onClick={handleEnhanceCover}
                disabled={isLoading.enhanceCover}
                variant="outline"
              >
                {isLoading.enhanceCover ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <RotateCw className="w-4 h-4 mr-2" />
                )}
                Enhance
              </Button>
            )}
          </div>
        </TabsContent>

        <TabsContent value="image" className="space-y-4">
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
              uploadedImage ? "border-violet-500 bg-violet-500/5" : "border-gray-600 hover:border-violet-500"
            )}
          >
            {uploadedImage ? (
              <div className="space-y-4">
                <img
                  src={uploadedImage}
                  alt="Reference"
                  className="max-h-[200px] mx-auto rounded-lg"
                />
                <Button
                  onClick={() => setUploadedImage(null)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Remove Image
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <UploadCloud className="w-12 h-12 mx-auto text-gray-400" />
                <div className="text-sm text-gray-400">
                  Drag and drop an image here, or click to select
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <Button
                  onClick={() => document.getElementById("image-upload")?.click()}
                  variant="outline"
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Image
                </Button>
              </div>
            )}
          </div>

          {uploadedImage && (
            <Button
              onClick={handleExtractPrompt}
              disabled={isLoading.extractPrompt}
              className="w-full bg-violet-600 hover:bg-violet-700"
            >
              {isLoading.extractPrompt ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Wand2 className="w-4 h-4 mr-2" />
              )}
              Generate Prompt from Image
            </Button>
          )}
        </TabsContent>
      </Tabs>

      {/* Preview */}
      {coverState.frontCoverImage && (
        <Card className="overflow-hidden bg-gray-800/30">
          <CardContent className="p-0">
            <img
              src={coverState.frontCoverImage}
              alt="Generated cover"
              className="w-full h-auto"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FrontCoverStep; 