import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TShirtPreviewProps {
  designImage: string;
  onClose: () => void;
}

export const TShirtPreview: React.FC<TShirtPreviewProps> = ({ 
  designImage,
  onClose
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tshirtColor, setTshirtColor] = useState<"white" | "black" | "navy" | "red">("white");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);
  const [removeBackground, setRemoveBackground] = useState(true);

  // Function to update the mockup preview
  const updateMockupPreview = async () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Fixed dimensions for preview
    canvas.width = 1200;
    canvas.height = 1400;
    
    try {
      // Create fallback t-shirt mockup
      const drawTshirtMockup = () => {
        // Background color based on selected mockup background
        const bgColor = (() => {
          switch (tshirtColor) {
            case 'black': return '#222222';
            case 'navy': return '#1a2456';
            case 'red': return '#a02020';
            case 'white':
            default: return '#f8f8f8';
          }
        })();
        
        // Shadow color
        const shadowColor = bgColor === '#f8f8f8' ? '#e0e0e0' : '#111111';
        
        // T-shirt outline
        ctx.fillStyle = bgColor;
        
        // Draw t-shirt body (realistic shape)
        ctx.beginPath();
        
        // Top of shirt
        const centerX = canvas.width / 2;
        const topY = 100;
        
        // T-shirt neck
        ctx.moveTo(centerX - 120, topY);
        ctx.bezierCurveTo(centerX - 100, topY + 40, centerX - 80, topY + 80, centerX - 70, topY + 100);
        
        // Left sleeve
        ctx.lineTo(centerX - 250, topY + 180);
        ctx.lineTo(centerX - 270, topY + 320);
        ctx.lineTo(centerX - 150, topY + 260);
        
        // Left body
        ctx.lineTo(centerX - 180, canvas.height - 200);
        
        // Bottom
        ctx.lineTo(centerX + 180, canvas.height - 200);
        
        // Right body
        ctx.lineTo(centerX + 150, topY + 260);
        
        // Right sleeve
        ctx.lineTo(centerX + 270, topY + 320);
        ctx.lineTo(centerX + 250, topY + 180);
        ctx.lineTo(centerX + 70, topY + 100);
        
        // Right neck
        ctx.bezierCurveTo(centerX + 80, topY + 80, centerX + 100, topY + 40, centerX + 120, topY);
        
        ctx.closePath();
        
        // Add shadow
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = 25;
        ctx.shadowOffsetX = 8;
        ctx.shadowOffsetY = 8;
        
        // Fill the shape
        ctx.fill();
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Add texture/details
        const textColor = bgColor === '#f8f8f8' ? '#e5e5e5' : '#444444';
        ctx.strokeStyle = textColor;
        ctx.lineWidth = 2;
        
        // Add collar
        ctx.beginPath();
        ctx.moveTo(centerX - 100, topY + 10);
        ctx.quadraticCurveTo(centerX, topY + 40, centerX + 100, topY + 10);
        ctx.stroke();
        
        // Add sleeve lines
        ctx.beginPath();
        ctx.moveTo(centerX - 70, topY + 100);
        ctx.lineTo(centerX - 250, topY + 180);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(centerX + 70, topY + 100);
        ctx.lineTo(centerX + 250, topY + 180);
        ctx.stroke();
        
        // Add wrinkles for realism
        ctx.strokeStyle = textColor;
        ctx.lineWidth = 1;
        
        // Left side wrinkles
        ctx.beginPath();
        ctx.moveTo(centerX - 160, canvas.height - 400);
        ctx.quadraticCurveTo(centerX - 170, canvas.height - 350, centerX - 165, canvas.height - 300);
        ctx.stroke();
        
        // Right side wrinkles
        ctx.beginPath();
        ctx.moveTo(centerX + 160, canvas.height - 400);
        ctx.quadraticCurveTo(centerX + 170, canvas.height - 350, centerX + 165, canvas.height - 300);
        ctx.stroke();
        
        // Simulate fabric texture
        if (bgColor !== '#f8f8f8') {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
          for (let i = 0; i < canvas.width; i += 4) {
            for (let j = 0; j < canvas.height; j += 4) {
              if (Math.random() > 0.5) {
                ctx.fillRect(i, j, 2, 2);
              }
            }
          }
        }
        
        return true;
      };
      
      // Draw the t-shirt mockup
      drawTshirtMockup();
      
      // Load the design image
      const design = new Image();
      design.crossOrigin = "anonymous";
      design.src = designImage;
      
      await new Promise((resolve, reject) => {
        design.onload = resolve;
        design.onerror = reject;
      });
      
      // Remove background if enabled and design has a white background
      let processedDesign = design;
      if (removeBackground) {
        // Create a temporary canvas for background removal
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
        if (tempCtx) {
          tempCanvas.width = design.width;
          tempCanvas.height = design.height;
          
          // Draw the original image
          tempCtx.drawImage(design, 0, 0);
          
          // Get image data
          const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
          const data = imageData.data;
          
          // Replace white-ish pixels with transparency
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // If pixel is white or very light, make it transparent
            if (r > 240 && g > 240 && b > 240) {
              data[i + 3] = 0; // Set alpha to 0
            }
          }
          
          // Put the modified image data back
          tempCtx.putImageData(imageData, 0, 0);
          
          // Create a new image from the processed canvas
          const processedImg = new Image();
          processedImg.src = tempCanvas.toDataURL();
          await new Promise(resolve => {
            processedImg.onload = resolve;
          });
          
          processedDesign = processedImg;
        }
      }
      
      // Calculate design dimensions (max 12 inches on tshirt, scaled proportionally)
      const MAX_WIDTH = canvas.width * 0.35; // 12-13 inches on the mockup scale
      const designWidth = Math.min(MAX_WIDTH, processedDesign.width);
      const designHeight = (designWidth / processedDesign.width) * processedDesign.height;
      
      // Position design in center chest area
      const designX = (canvas.width - designWidth) / 2;
      const designY = canvas.height * 0.35; // Higher on the shirt for proper placement
      
      // Draw design on t-shirt
      ctx.drawImage(
        processedDesign, 
        designX, 
        designY, 
        designWidth, 
        designHeight
      );
    } catch (error) {
      console.error("Error updating mockup:", error);
      toast.error("Failed to load mockup preview");
    }
  };

  // Update mockup when component mounts or properties change
  useEffect(() => {
    updateMockupPreview();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [designImage, tshirtColor, removeBackground]);

  // Handle downloading the mockup
  const handleDownload = async () => {
    if (!canvasRef.current) return;
    
    setIsDownloading(true);
    try {
      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `tshirt-mockup-${tshirtColor}-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Mockup downloaded successfully");
    } catch (error) {
      console.error("Error downloading mockup:", error);
      toast.error("Failed to download mockup");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-auto flex flex-col">
      {/* Header */}
      <div className="sticky top-0 p-4 bg-background border-b flex items-center justify-between z-10">
        <h2 className="text-xl font-bold">T-Shirt Preview</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">
              <input 
                type="checkbox" 
                checked={removeBackground} 
                onChange={(e) => setRemoveBackground(e.target.checked)}
                className="mr-2"
              />
              Remove Background
            </label>
          </div>
          <Button onClick={handleDownload} disabled={isDownloading}>
            {isDownloading ? 'Downloading...' : 'Download Mockup'}
            <Download className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto p-6 flex flex-col items-center justify-start">
        <div className="mb-4 flex items-center justify-center space-x-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setTshirtColor('white')}
            className={cn(
              "text-xs px-4 py-2 h-auto",
              tshirtColor === 'white' && "bg-primary text-primary-foreground"
            )}
          >
            White
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setTshirtColor('black')}
            className={cn(
              "text-xs px-4 py-2 h-auto",
              tshirtColor === 'black' && "bg-primary text-primary-foreground"
            )}
          >
            Black
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setTshirtColor('navy')}
            className={cn(
              "text-xs px-4 py-2 h-auto",
              tshirtColor === 'navy' && "bg-primary text-primary-foreground"
            )}
          >
            Navy
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setTshirtColor('red')}
            className={cn(
              "text-xs px-4 py-2 h-auto",
              tshirtColor === 'red' && "bg-primary text-primary-foreground"
            )}
          >
            Red
          </Button>
        </div>
        
        <div className="relative inline-block">
          <canvas 
            ref={canvasRef}
            className="max-w-full h-auto border rounded-md shadow-sm"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'center top'
            }}
          />
          
          {/* Zoom controls */}
          <div className="absolute top-4 right-4 flex items-center gap-1 bg-background/90 p-1 rounded-lg shadow-md border">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.1))}
              className="h-8 w-8"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs w-12 text-center font-medium">{Math.round(zoomLevel * 100)}%</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setZoomLevel(prev => Math.min(2, prev + 0.1))}
              className="h-8 w-8"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TShirtPreview; 