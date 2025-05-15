import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

const PromptToDesignTab: React.FC = () => {
  const [svgPreview, setSvgPreview] = useState<string | null>(null);
  const [isVectorizing, setIsVectorizing] = useState(false);

  const handleVectorize = async () => {
    if (!generatedImageUrl) {
      toast.error("Please generate an image first");
      return;
    }

    setIsVectorizing(true);
    setSvgPreview(null);

    try {
      const svgUrl = await vectorizeImage(generatedImageUrl);
      console.log("SVG created successfully");
      setSvgPreview(svgUrl);
    } catch (error) {
      console.error("Vectorization failed:", error);
    } finally {
      setIsVectorizing(false);
    }
  };

  return (
    <div>
      {/* Existing code */}
      {svgPreview && (
        <div className="mt-4 flex flex-col items-center">
          <div className="w-full max-w-md h-64 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
            <img
              src={svgPreview}
              alt="SVG Preview"
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <Button className="mt-2 bg-green-600 hover:bg-green-700" onClick={() => {
            // Download SVG file directly
            const a = document.createElement('a');
            a.href = svgPreview;
            a.download = 'vectorized-design.svg';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }}>
            Download SVG
          </Button>
        </div>
      )}
    </div>
  );
};

export default PromptToDesignTab; 