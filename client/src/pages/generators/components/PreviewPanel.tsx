import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileImage } from "lucide-react";

interface PreviewPanelProps {
  coverState: {
    frontCoverImage: string | null;
    backCoverImage: string | null;
    spineText: string;
    spineColor: string;
    spineFont: string;
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

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  coverState,
  bookSettings,
  showSafeZones,
}) => {
  // Function to render safe zones overlay
  const renderSafeZones = () => {
    if (!showSafeZones) return null;

    const safeMargin = 0.125 * bookSettings.dimensions.dpi; // 0.125 inches in pixels

    return (
      <div className="absolute inset-0 pointer-events-none">
        {/* Trim Lines */}
        <div className="absolute inset-0 border-2 border-red-500/50" />
        
        {/* Safe Zone */}
        <div
          className="absolute border-2 border-blue-500/50"
          style={{
            top: safeMargin,
            right: safeMargin,
            bottom: safeMargin,
            left: safeMargin,
          }}
        />
        
        {/* Spine Lines */}
        {bookSettings.dimensions.spine > 0 && (
          <>
            <div
              className="absolute top-0 bottom-0 border-l-2 border-yellow-500/50"
              style={{
                left: bookSettings.dimensions.width / 3,
              }}
            />
            <div
              className="absolute top-0 bottom-0 border-l-2 border-yellow-500/50"
              style={{
                left: (bookSettings.dimensions.width * 2) / 3,
              }}
            />
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Dimensions Info */}
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
        <div>
          <span>Total Width: </span>
          <span className="font-medium">{bookSettings.dimensions.totalWidthInches}"</span>
        </div>
        <div>
          <span>Total Height: </span>
          <span className="font-medium">{bookSettings.dimensions.totalHeightInches}"</span>
        </div>
        <div>
          <span>Spine Width: </span>
          <span className="font-medium">{bookSettings.dimensions.spineWidthInches}"</span>
        </div>
        <div>
          <span>Resolution: </span>
          <span className="font-medium">{bookSettings.dimensions.dpi} DPI</span>
        </div>
      </div>

      {/* Cover Preview */}
      <div className="relative">
        {coverState.fullWrapImage ? (
          <Card className="overflow-hidden bg-gray-800/30">
            <CardContent className="p-0 relative">
              <img
                src={coverState.fullWrapImage}
                alt="Full wrap preview"
                className="w-full h-auto"
              />
              {renderSafeZones()}
            </CardContent>
          </Card>
        ) : (
          <div className="aspect-[2.5/1] bg-gray-800/30 rounded-lg flex flex-col items-center justify-center text-gray-400">
            <FileImage className="w-12 h-12 mb-2" />
            <p>Preview will appear here</p>
          </div>
        )}
      </div>

      {/* Individual Covers */}
      <div className="grid grid-cols-2 gap-4">
        {/* Front Cover */}
        <Card className="overflow-hidden bg-gray-800/30">
          <CardContent className="p-0 relative">
            {coverState.frontCoverImage ? (
              <>
                <img
                  src={coverState.frontCoverImage}
                  alt="Front cover"
                  className="w-full h-auto"
                />
                {showSafeZones && (
                  <div className="absolute inset-0 border-2 border-blue-500/50 m-4 pointer-events-none" />
                )}
              </>
            ) : (
              <div className="aspect-[2/3] flex flex-col items-center justify-center text-gray-400">
                <FileImage className="w-8 h-8 mb-2" />
                <p className="text-sm">Front Cover</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Back Cover */}
        <Card className="overflow-hidden bg-gray-800/30">
          <CardContent className="p-0 relative">
            {coverState.backCoverImage ? (
              <>
                <img
                  src={coverState.backCoverImage}
                  alt="Back cover"
                  className="w-full h-auto"
                />
                {showSafeZones && (
                  <div className="absolute inset-0 border-2 border-blue-500/50 m-4 pointer-events-none" />
                )}
              </>
            ) : (
              <div className="aspect-[2/3] flex flex-col items-center justify-center text-gray-400">
                <FileImage className="w-8 h-8 mb-2" />
                <p className="text-sm">Back Cover</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PreviewPanel; 