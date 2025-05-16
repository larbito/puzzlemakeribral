import { useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, Download, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function Vectorizer() {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [vectorizedImage, setVectorizedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [removeBackground, setRemoveBackground] = useState(false);
  const [enhanceImage, setEnhanceImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File upload handling with react-dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxFiles: 1,
    onDrop: acceptedFiles => {
      if (acceptedFiles.length > 0) {
        handleImageUpload(acceptedFiles[0]);
      }
    }
  });

  // Handle image upload
  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSourceImage(reader.result);
        setVectorizedImage(null); // Reset any previous vectorized image
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle vectorization process
  const handleVectorize = async () => {
    if (!sourceImage) {
      toast.error('Please upload an image first');
      return;
    }

    setIsLoading(true);
    toast.loading('Vectorizing image... This may take a minute');

    try {
      // Create form data to send to the backend
      const formData = new FormData();
      
      // Convert the data URL to a blob and append to form data
      const blob = await fetch(sourceImage).then(r => r.blob());
      formData.append('image', blob, 'image.png');
      
      // Add options
      formData.append('removeBackground', removeBackground.toString());
      formData.append('enhanceImage', enhanceImage.toString());

      // Send to the backend
      const response = await fetch('/api/vectorize', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Vectorization failed: ${response.statusText}`);
      }

      // Handle the SVG response
      const data = await response.json();
      if (data.svgUrl) {
        setVectorizedImage(data.svgUrl);
        toast.success('Image successfully vectorized!');
      } else {
        throw new Error('No SVG returned from server');
      }
    } catch (error) {
      console.error('Vectorization error:', error);
      toast.error(`Vectorization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
      toast.dismiss();
    }
  };

  // Handle SVG download
  const handleDownload = async () => {
    if (!vectorizedImage) return;

    try {
      const response = await fetch(vectorizedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'vectorized-image.svg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Download failed. Please try again.');
    }
  };

  return (
    <div className="container max-w-6xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Image Vectorizer</h1>
        <p className="text-muted-foreground">
          Convert your raster images (PNG, JPG) to high-quality vector SVG files
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left side - Upload and Options */}
        <div className="space-y-6">
          {/* Upload area */}
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'
            }`}
          >
            <input {...getInputProps()} ref={fileInputRef} />
            
            <div className="flex flex-col items-center justify-center space-y-3">
              <Upload className="h-10 w-10 text-muted-foreground" />
              <p className="text-lg font-medium">Drag & drop an image here</p>
              <p className="text-sm text-muted-foreground">or click to select</p>
              <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
            </div>
          </div>

          {/* Preview of source image */}
          {sourceImage && (
            <div className="border rounded-lg p-2 bg-gray-50">
              <p className="text-sm font-medium mb-2">Source Image:</p>
              <div className="relative h-48 w-full">
                <img 
                  src={sourceImage} 
                  alt="Source" 
                  className="object-contain w-full h-full" 
                />
              </div>
            </div>
          )}

          {/* Options */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-medium">Options</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="removeBackground">Remove Background</Label>
                <p className="text-xs text-muted-foreground">Isolate the subject from the background</p>
              </div>
              <Switch 
                id="removeBackground" 
                checked={removeBackground} 
                onCheckedChange={setRemoveBackground}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="enhanceImage">Enhance Image</Label>
                <p className="text-xs text-muted-foreground">Improve image quality before vectorizing</p>
              </div>
              <Switch 
                id="enhanceImage" 
                checked={enhanceImage} 
                onCheckedChange={setEnhanceImage}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleVectorize}
              disabled={!sourceImage || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Vectorize Image'
              )}
            </Button>
          </div>
        </div>

        {/* Right side - Vectorized Image Result */}
        <div className="border rounded-lg p-4 h-[600px] flex flex-col">
          <h3 className="font-medium mb-4">Vectorized Result</h3>
          
          {vectorizedImage ? (
            <>
              <div className="flex-1 relative bg-grid-pattern rounded overflow-hidden">
                <iframe 
                  src={vectorizedImage} 
                  className="absolute inset-0 w-full h-full" 
                  title="Vectorized SVG"
                />
              </div>
              <div className="mt-4">
                <Button className="w-full" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download SVG
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
              <ImageIcon className="h-16 w-16 text-muted-foreground opacity-30 mb-4" />
              <p className="text-muted-foreground">
                {sourceImage 
                  ? "Click 'Vectorize Image' to convert your image"
                  : "Upload an image to see the vector preview here"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 