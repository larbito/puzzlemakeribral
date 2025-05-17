import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Wand2,
  Sparkles,
  RotateCw,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface BackCoverStepProps {
  coverState: {
    frontPrompt: string;
    backPrompt: string;
    backCoverImage: string | null;
  };
  setCoverState: React.Dispatch<React.SetStateAction<any>>;
}

const BackCoverStep: React.FC<BackCoverStepProps> = ({
  coverState,
  setCoverState,
}) => {
  const [isLoading, setIsLoading] = useState<{
    generatePrompt: boolean;
    generateCover: boolean;
    enhanceCover: boolean;
  }>({
    generatePrompt: false,
    generateCover: false,
    enhanceCover: false,
  });

  // Handle prompt input change
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCoverState((prev: any) => ({
      ...prev,
      backPrompt: e.target.value,
    }));
  };

  // Generate back cover prompt
  const handleGeneratePrompt = async () => {
    if (!coverState.frontPrompt) {
      toast.error("Please generate the front cover first");
      return;
    }

    try {
      setIsLoading((prev) => ({ ...prev, generatePrompt: true }));
      
      // Call your API to generate back cover prompt
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/openai/generate-back-prompt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          frontPrompt: coverState.frontPrompt,
          context: "Create a complementary back cover design that maintains visual harmony with the front cover while providing a suitable background for text overlay.",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate back cover prompt");
      }

      const data = await response.json();
      
      if (data.backPrompt) {
        setCoverState((prev: any) => ({
          ...prev,
          backPrompt: data.backPrompt,
        }));
        toast.success("Back cover prompt generated successfully");
      }
    } catch (error) {
      console.error("Error generating back cover prompt:", error);
      toast.error("Failed to generate back cover prompt");
    } finally {
      setIsLoading((prev) => ({ ...prev, generatePrompt: false }));
    }
  };

  // Generate back cover
  const handleGenerateCover = async () => {
    if (!coverState.backPrompt) {
      toast.error("Please generate or write a back cover prompt first");
      return;
    }

    try {
      setIsLoading((prev) => ({ ...prev, generateCover: true }));
      
      // Call your API to generate back cover
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ideogram/generate-custom`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: coverState.backPrompt,
          width: "2400",
          height: "3600",
          rendering_speed: "DEFAULT",
          negative_prompt: "text overlays, watermark, signature, blurry, low quality, distorted"
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate back cover");
      }

      const data = await response.json();
      
      if (data.url) {
        setCoverState((prev: any) => ({
          ...prev,
          backCoverImage: data.url,
        }));
        toast.success("Back cover generated successfully");
      }
    } catch (error) {
      console.error("Error generating back cover:", error);
      toast.error("Failed to generate back cover");
    } finally {
      setIsLoading((prev) => ({ ...prev, generateCover: false }));
    }
  };

  // Enhance back cover
  const handleEnhanceCover = async () => {
    if (!coverState.backCoverImage) {
      toast.error("Please generate a back cover first");
      return;
    }

    try {
      setIsLoading((prev) => ({ ...prev, enhanceCover: true }));
      
      // Call your API to enhance back cover
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/replicate/enhance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: coverState.backCoverImage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to enhance back cover");
      }

      const data = await response.json();
      
      if (data.url) {
        setCoverState((prev: any) => ({
          ...prev,
          backCoverImage: data.url,
        }));
        toast.success("Back cover enhanced successfully");
      }
    } catch (error) {
      console.error("Error enhancing back cover:", error);
      toast.error("Failed to enhance back cover");
    } finally {
      setIsLoading((prev) => ({ ...prev, enhanceCover: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert if no front cover */}
      {!coverState.frontPrompt && (
        <div className="flex items-center gap-2 text-amber-500 bg-amber-500/10 p-4 rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <p>Please generate the front cover first to ensure design consistency.</p>
        </div>
      )}

      {/* Back Cover Prompt */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Back Cover Prompt</h3>
          <Button
            onClick={handleGeneratePrompt}
            disabled={isLoading.generatePrompt || !coverState.frontPrompt}
            variant="outline"
            size="sm"
          >
            {isLoading.generatePrompt ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Wand2 className="w-4 h-4 mr-2" />
            )}
            Generate from Front Cover
          </Button>
        </div>
        <Textarea
          placeholder="Describe your back cover design..."
          value={coverState.backPrompt}
          onChange={handlePromptChange}
          className="min-h-[150px] bg-gray-800/30"
        />
        <div className="flex gap-2">
          <Button
            onClick={handleGenerateCover}
            disabled={isLoading.generateCover || !coverState.backPrompt}
            className="flex-1 bg-violet-600 hover:bg-violet-700"
          >
            {isLoading.generateCover ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Generate Back Cover
          </Button>
          {coverState.backCoverImage && (
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
      </div>

      {/* Preview */}
      {coverState.backCoverImage && (
        <Card className="overflow-hidden bg-gray-800/30">
          <CardContent className="p-0">
            <img
              src={coverState.backCoverImage}
              alt="Generated back cover"
              className="w-full h-auto"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BackCoverStep; 