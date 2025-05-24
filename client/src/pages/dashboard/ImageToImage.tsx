import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Image as ImageIcon, 
  Wand2, 
  Download, 
  RefreshCw, 
  Eye,
  Sparkles,
  ArrowRight,
  FileImage,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ImageToImageState {
  uploadedImage: File | null;
  uploadedImageUrl: string | null;
  isAnalyzing: boolean;
  isGenerating: boolean;
  description: string;
  generatedImageUrl: string | null;
  error: string | null;
}

const ImageToImage: React.FC = () => {
  const [state, setState] = useState<ImageToImageState>({
    uploadedImage: null,
    uploadedImageUrl: null,
    isAnalyzing: false,
    isGenerating: false,
    description: '',
    generatedImageUrl: null,
    error: null
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setState(prev => ({ ...prev, error: 'File size must be less than 10MB' }));
        return;
      }

      setState(prev => ({
        ...prev,
        uploadedImage: file,
        uploadedImageUrl: URL.createObjectURL(file),
        description: '',
        generatedImageUrl: null,
        error: null
      }));
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setState(prev => ({ ...prev, error: 'File size must be less than 10MB' }));
        return;
      }

      setState(prev => ({
        ...prev,
        uploadedImage: file,
        uploadedImageUrl: URL.createObjectURL(file),
        description: '',
        generatedImageUrl: null,
        error: null
      }));
    }
  };

  const analyzeImage = async () => {
    if (!state.uploadedImage) return;

    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));

    try {
      const formData = new FormData();
      formData.append('image', state.uploadedImage);

      const response = await fetch('/api/analyze-image-detailed', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      const data = await response.json();
      setState(prev => ({ 
        ...prev, 
        description: data.description,
        isAnalyzing: false 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to analyze image',
        isAnalyzing: false 
      }));
    }
  };

  const generateSimilarImage = async () => {
    if (!state.description) return;

    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      const response = await fetch('/api/generate-similar-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: state.description
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      setState(prev => ({ 
        ...prev, 
        generatedImageUrl: data.imageUrl,
        isGenerating: false 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to generate image',
        isGenerating: false 
      }));
    }
  };

  const downloadImage = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetWorkflow = () => {
    setState({
      uploadedImage: null,
      uploadedImageUrl: null,
      isAnalyzing: false,
      isGenerating: false,
      description: '',
      generatedImageUrl: null,
      error: null
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Image to Image</h1>
                <p className="text-sm text-muted-foreground">Upload → Analyze → Generate similar images with AI</p>
              </div>
            </div>
            
            {state.uploadedImage && (
              <Button 
                variant="outline" 
                onClick={resetWorkflow}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Banner */}
        <AnimatePresence>
          {state.error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500"
            >
              {state.error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Workflow Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4 md:space-x-8">
            {[
              { step: 1, title: "Upload", icon: Upload, active: !state.uploadedImage, completed: !!state.uploadedImage },
              { step: 2, title: "Analyze", icon: Eye, active: state.uploadedImage && !state.description, completed: !!state.description },
              { step: 3, title: "Generate", icon: Wand2, active: state.description && !state.generatedImageUrl, completed: !!state.generatedImageUrl }
            ].map((item, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  item.completed ? 'bg-primary text-background' : 
                  item.active ? 'bg-primary/20 text-primary border-2 border-primary' : 
                  'bg-muted text-muted-foreground'
                }`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className={`ml-2 font-medium ${
                  item.completed || item.active ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {item.title}
                </span>
                {index < 2 && (
                  <ArrowRight className="w-5 h-5 text-muted-foreground ml-4 md:ml-8" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Image
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!state.uploadedImageUrl ? (
                <div
                  className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileImage className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Drop your image here</h3>
                  <p className="text-muted-foreground mb-4">or click to browse</p>
                  <Button variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                  <p className="text-sm text-muted-foreground mt-4">
                    Supports: JPG, PNG, GIF up to 10MB
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden">
                    <img 
                      src={state.uploadedImageUrl} 
                      alt="Uploaded" 
                      className="w-full h-64 object-cover"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={analyzeImage}
                      disabled={state.isAnalyzing}
                      className="flex-1"
                    >
                      {state.isAnalyzing ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          Analyze Image
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </CardContent>
          </Card>

          {/* Description Section */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                AI Description
                {state.description && (
                  <Badge variant="secondary" className="ml-auto">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Ready
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {state.isAnalyzing ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <RefreshCw className="w-8 h-8 text-primary mx-auto mb-2 animate-spin" />
                    <p className="text-muted-foreground">GPT-4o is analyzing your image...</p>
                  </div>
                </div>
              ) : state.description ? (
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm leading-relaxed">{state.description}</p>
                  </div>
                  <Button 
                    onClick={generateSimilarImage}
                    disabled={state.isGenerating}
                    className="w-full"
                  >
                    {state.isGenerating ? (
                      <>
                        <Zap className="w-4 h-4 mr-2 animate-pulse" />
                        Generating with DALL-E...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Generate Similar Image
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Upload an image to get AI description</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Generated Image Section */}
        <AnimatePresence>
          {(state.isGenerating || state.generatedImageUrl) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-8"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="w-5 h-5" />
                    Generated Image
                    {state.generatedImageUrl && (
                      <Badge variant="secondary" className="ml-auto">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Complete
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {state.isGenerating ? (
                    <div className="flex items-center justify-center h-64 bg-muted/20 rounded-xl">
                      <div className="text-center">
                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-muted-foreground">DALL-E is creating your image...</p>
                      </div>
                    </div>
                  ) : state.generatedImageUrl ? (
                    <div className="space-y-4">
                      <div className="relative rounded-xl overflow-hidden">
                        <img 
                          src={state.generatedImageUrl} 
                          alt="Generated" 
                          className="w-full h-auto max-h-96 object-contain mx-auto"
                        />
                      </div>
                      <div className="flex gap-2 justify-center">
                        <Button 
                          onClick={() => downloadImage(state.generatedImageUrl!, 'generated-image.png')}
                          variant="outline"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                        <Button 
                          onClick={generateSimilarImage}
                          disabled={state.isGenerating}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Generate Another
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Comparison Section */}
        <AnimatePresence>
          {state.uploadedImageUrl && state.generatedImageUrl && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-8"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-center">
                      <h3 className="font-semibold mb-2">Original</h3>
                      <img 
                        src={state.uploadedImageUrl} 
                        alt="Original" 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                    <div className="text-center">
                      <h3 className="font-semibold mb-2">AI Generated</h3>
                      <img 
                        src={state.generatedImageUrl} 
                        alt="Generated" 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ImageToImage; 