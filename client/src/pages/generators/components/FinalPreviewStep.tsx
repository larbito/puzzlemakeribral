import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  Download,
  Eye,
  EyeOff,
  FileImage,
  FilePdf,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FinalPreviewStepProps {
  coverState: {
    frontCoverImage: string | null;
    backCoverImage: string | null;
    spineText: string;
    spineColor: string;
    spineFont: string;
    interiorImages: string[];
    fullWrapImage: string | null;
  };
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
  showSafeZones: boolean;
}

const FinalPreviewStep: React.FC<FinalPreviewStepProps> = ({
  coverState,
  bookSettings,
  showSafeZones,
}) => {
  const [isLoading, setIsLoading] = useState<{
    assemble: boolean;
    downloadFront: boolean;
    downloadBack: boolean;
    downloadFull: boolean;
  }>({
    assemble: false,
    downloadFront: false,
    downloadBack: false,
    downloadFull: false,
  });

  // Validation checks
  const validations = {
    frontCover: !!coverState.frontCoverImage,
    backCover: !!coverState.backCoverImage,
    spineText: coverState.spineText.length > 0,
    dimensions: bookSettings.dimensions.width > 0 && bookSettings.dimensions.height > 0,
  };

  const isValid = Object.values(validations).every(Boolean);

  // Handle assemble full wrap
  const handleAssembleWrap = async () => {
    if (!isValid) {
      toast.error("Please complete all required steps first");
      return;
    }

    try {
      setIsLoading((prev) => ({ ...prev, assemble: true }));
      
      // Call your API to assemble the full wrap
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/book-cover/assemble`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          frontCoverUrl: coverState.frontCoverImage,
          backCoverUrl: coverState.backCoverImage,
          spineText: coverState.spineText,
          spineColor: coverState.spineColor,
          spineFont: coverState.spineFont,
          dimensions: bookSettings.dimensions,
          interiorImages: coverState.interiorImages,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to assemble full wrap");
      }

      const data = await response.json();
      
      if (data.url) {
        // Update the full wrap image in the parent state
        // This would need to be handled by the parent component
        toast.success("Full wrap assembled successfully");
      }
    } catch (error) {
      console.error("Error assembling full wrap:", error);
      toast.error("Failed to assemble full wrap");
    } finally {
      setIsLoading((prev) => ({ ...prev, assemble: false }));
    }
  };

  // Handle downloads
  const handleDownload = async (type: "front" | "back" | "full") => {
    const loadingKey = `download${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof typeof isLoading;
    
    try {
      setIsLoading((prev) => ({ ...prev, [loadingKey]: true }));
      
      let url;
      let filename;
      
      switch (type) {
        case "front":
          url = coverState.frontCoverImage;
          filename = "front-cover";
          break;
        case "back":
          url = coverState.backCoverImage;
          filename = "back-cover";
          break;
        case "full":
          url = coverState.fullWrapImage;
          filename = "full-wrap";
          break;
      }

      if (!url) {
        throw new Error("Image not available");
      }

      // Call your API to download the image
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/book-cover/download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          filename,
          format: "pdf",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to download cover");
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${filename}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} cover downloaded successfully`);
    } catch (error) {
      console.error(`Error downloading ${type} cover:`, error);
      toast.error(`Failed to download ${type} cover`);
    } finally {
      setIsLoading((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Validation Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(validations).map(([key, isValid]) => (
          <div
            key={key}
            className={cn(
              "flex items-center justify-between p-4 rounded-lg",
              isValid ? "bg-green-500/10" : "bg-red-500/10"
            )}
          >
            <span className="capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
            {isValid ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
          </div>
        ))}
      </div>

      {/* Preview Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch
            checked={showSafeZones}
            onCheckedChange={(checked) => setShowSafeZones(checked)}
          />
          <Label>Show Safe Zones</Label>
        </div>
        <Button
          onClick={handleAssembleWrap}
          disabled={!isValid || isLoading.assemble}
          className="bg-violet-600 hover:bg-violet-700"
        >
          {isLoading.assemble ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Eye className="w-4 h-4 mr-2" />
          )}
          Preview Full Wrap
        </Button>
      </div>

      {/* Preview */}
      {coverState.fullWrapImage ? (
        <Card className="overflow-hidden bg-gray-800/30">
          <CardContent className="p-0">
            <img
              src={coverState.fullWrapImage}
              alt="Full wrap preview"
              className="w-full h-auto"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="text-center text-gray-400 py-12">
          <FileImage className="w-12 h-12 mx-auto mb-4" />
          <p>Generate a preview to see your full wrap cover</p>
        </div>
      )}

      {/* Download Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          onClick={() => handleDownload("front")}
          disabled={!coverState.frontCoverImage || isLoading.downloadFront}
          variant="outline"
        >
          {isLoading.downloadFront ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Front Cover (PNG)
        </Button>
        <Button
          onClick={() => handleDownload("back")}
          disabled={!coverState.backCoverImage || isLoading.downloadBack}
          variant="outline"
        >
          {isLoading.downloadBack ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Back Cover (PNG)
        </Button>
        <Button
          onClick={() => handleDownload("full")}
          disabled={!coverState.fullWrapImage || isLoading.downloadFull}
          className="bg-violet-600 hover:bg-violet-700"
        >
          {isLoading.downloadFull ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <FilePdf className="w-4 h-4 mr-2" />
          )}
          Full Wrap (PDF)
        </Button>
      </div>
    </div>
  );
};

export default FinalPreviewStep; 