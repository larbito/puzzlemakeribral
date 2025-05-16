import React, { useState, useRef } from 'react';
import { Loader2, Upload, Download, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Slider
} from '@/components/ui/slider';

// Use the correct production URL
const BACKEND_URL = process.env.NODE_ENV === 'production' 
  ? 'https://puzzle-craft-forge-production.up.railway.app' 
  : 'http://localhost:3000';

const VectorizerSimple = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [threshold, setThreshold] = useState<number>(128);

  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle form submission with direct upload
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageFile) {
      toast.error('Please select an image first');
      return;
    }
    
    setLoading(true);
    console.log('Submitting form directly');
    
    // The form will submit directly to the backend API
    // No need for JavaScript fetch handling
    if (formRef.current) {
      formRef.current.submit();
      
      // Reset loading state after a delay
      setTimeout(() => {
        setLoading(false);
        toast.success('Form submitted successfully', {
          description: 'Check the new tab for your vectorized image'
        });
      }, 1000);
    }
  };
  
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-2">PNG to SVG Vectorizer</h1>
      <p className="text-muted-foreground mb-3">
        Convert raster images to scalable vector graphics - <a href="/test-circle.png" download className="text-primary hover:underline">Download Test Image</a>
      </p>
      
      <Card>
        <CardHeader>
          <CardTitle>Direct Form Submission</CardTitle>
          <CardDescription>
            Upload an image to convert to SVG using a direct form
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form 
            ref={formRef}
            action={`${BACKEND_URL}/api/vectorize/direct`}
            method="POST"
            encType="multipart/form-data"
            target="_blank"
            onSubmit={handleSubmit}
          >
            <div className="mb-4">
              <Label htmlFor="imageFile" className="block mb-2">Select Image</Label>
              <Input
                ref={fileInputRef}
                id="imageFile"
                name="image"
                type="file"
                accept="image/png,image/jpeg"
                onChange={handleImageChange}
                required
              />
            </div>
            
            {previewUrl && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Preview:</p>
                <div className="bg-gray-100 p-4 rounded">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-[300px] mx-auto"
                  />
                </div>
              </div>
            )}
            
            <div className="mb-4">
              <Label htmlFor="threshold" className="block mb-2">Threshold: {threshold}</Label>
              <Slider
                id="threshold"
                min={0}
                max={255}
                step={1}
                value={[threshold]}
                onValueChange={(value) => setThreshold(value[0])}
              />
            </div>
            
            {/* Hidden options field */}
            <input
              type="hidden"
              name="options"
              value={JSON.stringify({
                threshold: threshold,
                steps: 1,
                background: '#ffffff',
                fillStrategy: 'dominant'
              })}
            />
            
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !imageFile}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Vectorize Image
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            The result will open in a new tab. Note that processing may take a few seconds.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default VectorizerSimple; 