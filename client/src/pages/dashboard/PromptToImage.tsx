import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Wand2, 
  Upload, 
  Image as ImageIcon, 
  Sparkles, 
  ArrowRight,
  Copy,
  Download,
  Loader2,
  Zap,
  Brain
} from 'lucide-react';
import { toast } from 'sonner';

// Get API URL from environment
const getApiUrl = () => {
  return process.env.REACT_APP_API_URL || process.env.VITE_API_URL || 'https://puzzlemakeribral-production.up.railway.app';
};

export const PromptToImage: React.FC = () => {
  // Model 1 State - Prompt Enhancement
  const [model1State, setModel1State] = useState({
    originalPrompt: '',
    enhancedPrompt: '',
    dalleImage: '',
    ideogramImage: '',
    isEnhancing: false,
    isGeneratingDalle: false,
    isGeneratingIdeogram: false
  });

  // Model 2 State - Image to Prompt
  const [model2State, setModel2State] = useState({
    uploadedImage: null as File | null,
    uploadedImageUrl: '',
    extractedPrompt: '',
    editedPrompt: '',
    dalleImage: '',
    ideogramImage: '',
    isExtracting: false,
    isGeneratingDalle: false,
    isGeneratingIdeogram: false
  });

  // Model 1 Functions
  const enhancePrompt = async () => {
    if (!model1State.originalPrompt.trim()) {
      toast.error('Please enter a prompt to enhance');
      return;
    }

    setModel1State(prev => ({ ...prev, isEnhancing: true }));

    try {
      const response = await fetch(`${getApiUrl()}/api/openai/enhance-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: model1State.originalPrompt,
          context: 'You are an expert at writing detailed prompts for DALL·E 3. Take the user\'s simple prompt and enhance it with rich visual details, artistic style, composition, lighting, and mood while keeping the core concept intact. Return only the enhanced prompt, no explanations.'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to enhance prompt');
      }

      const data = await response.json();
      const enhancedPrompt = data.enhancedPrompt;

      setModel1State(prev => ({
        ...prev,
        enhancedPrompt,
        isEnhancing: false
      }));

      toast.success('Prompt enhanced successfully!');
    } catch (error) {
      console.error('Error enhancing prompt:', error);
      toast.error('Failed to enhance prompt');
      setModel1State(prev => ({ ...prev, isEnhancing: false }));
    }
  };

  const generateImageWithDalle = async () => {
    if (!model1State.enhancedPrompt.trim()) {
      toast.error('Please enhance your prompt first');
      return;
    }

    setModel1State(prev => ({ ...prev, isGeneratingDalle: true }));

    try {
      const response = await fetch(`${getApiUrl()}/api/openai/generate-image-dalle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: model1State.enhancedPrompt,
          size: '1024x1024'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate image with DALL-E');
      }

      const data = await response.json();
      
      setModel1State(prev => ({
        ...prev,
        dalleImage: data.imageUrl,
        isGeneratingDalle: false
      }));

      toast.success('Image generated with DALL-E successfully!');
    } catch (error) {
      console.error('Error generating image with DALL-E:', error);
      toast.error('Failed to generate image with DALL-E');
      setModel1State(prev => ({ ...prev, isGeneratingDalle: false }));
    }
  };

  const generateImageWithIdeogram = async () => {
    if (!model1State.enhancedPrompt.trim()) {
      toast.error('Please enhance your prompt first');
      return;
    }

    setModel1State(prev => ({ ...prev, isGeneratingIdeogram: true }));

    try {
      const response = await fetch(`${getApiUrl()}/api/ideogram/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: model1State.enhancedPrompt,
          aspect_ratio: 'ASPECT_1_1'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate image with Ideogram');
      }

      const data = await response.json();
      
      setModel1State(prev => ({
        ...prev,
        ideogramImage: data.data?.[0]?.url || data.imageUrl,
        isGeneratingIdeogram: false
      }));

      toast.success('Image generated with Ideogram successfully!');
    } catch (error) {
      console.error('Error generating image with Ideogram:', error);
      toast.error('Failed to generate image with Ideogram');
      setModel1State(prev => ({ ...prev, isGeneratingIdeogram: false }));
    }
  };

  // Model 2 Functions
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setModel2State(prev => ({
        ...prev,
        uploadedImage: file,
        uploadedImageUrl: URL.createObjectURL(file),
        extractedPrompt: '',
        editedPrompt: '',
        dalleImage: '',
        ideogramImage: ''
      }));
    }
  };

  const extractPromptFromImage = async () => {
    if (!model2State.uploadedImage) {
      toast.error('Please upload an image first');
      return;
    }

    setModel2State(prev => ({ ...prev, isExtracting: true }));

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Image = reader.result?.toString().split(',')[1];
        const mimeType = model2State.uploadedImage?.type;

        const response = await fetch(`${getApiUrl()}/api/openai/extract-prompt`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageUrl: `data:${mimeType};base64,${base64Image}`
          })
        });

        if (!response.ok) {
          throw new Error('Failed to extract prompt from image');
        }

        const data = await response.json();
        
        setModel2State(prev => ({
          ...prev,
          extractedPrompt: data.extractedPrompt || data.prompt,
          editedPrompt: data.extractedPrompt || data.prompt,
          isExtracting: false
        }));

        toast.success('Prompt extracted successfully!');
      };

      reader.readAsDataURL(model2State.uploadedImage);
    } catch (error) {
      console.error('Error extracting prompt:', error);
      toast.error('Failed to extract prompt from image');
      setModel2State(prev => ({ ...prev, isExtracting: false }));
    }
  };

  const generateImageFromExtractedPromptDalle = async () => {
    if (!model2State.editedPrompt.trim()) {
      toast.error('Please extract and edit the prompt first');
      return;
    }

    setModel2State(prev => ({ ...prev, isGeneratingDalle: true }));

    try {
      const response = await fetch(`${getApiUrl()}/api/openai/generate-image-dalle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: model2State.editedPrompt,
          size: '1024x1024'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate image with DALL-E');
      }

      const data = await response.json();
      
      setModel2State(prev => ({
        ...prev,
        dalleImage: data.imageUrl,
        isGeneratingDalle: false
      }));

      toast.success('Image generated with DALL-E successfully!');
    } catch (error) {
      console.error('Error generating image with DALL-E:', error);
      toast.error('Failed to generate image with DALL-E');
      setModel2State(prev => ({ ...prev, isGeneratingDalle: false }));
    }
  };

  const generateImageFromExtractedPromptIdeogram = async () => {
    if (!model2State.editedPrompt.trim()) {
      toast.error('Please extract and edit the prompt first');
      return;
    }

    setModel2State(prev => ({ ...prev, isGeneratingIdeogram: true }));

    try {
      const response = await fetch(`${getApiUrl()}/api/ideogram/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: model2State.editedPrompt,
          aspect_ratio: 'ASPECT_1_1'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate image with Ideogram');
      }

      const data = await response.json();
      
      setModel2State(prev => ({
        ...prev,
        ideogramImage: data.data?.[0]?.url || data.imageUrl,
        isGeneratingIdeogram: false
      }));

      toast.success('Image generated with Ideogram successfully!');
    } catch (error) {
      console.error('Error generating image with Ideogram:', error);
      toast.error('Failed to generate image with Ideogram');
      setModel2State(prev => ({ ...prev, isGeneratingIdeogram: false }));
    }
  };

  // Utility functions
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const downloadImage = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
          AI Image Studio
        </h1>
        <p className="text-zinc-400 text-lg">
          Transform your ideas into stunning images with dual AI-powered generation
        </p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <Badge variant="secondary" className="bg-blue-900/20 text-blue-300">
            GPT-4 Enhanced
          </Badge>
          <Badge variant="secondary" className="bg-purple-900/20 text-purple-300">
            DALL·E 3
          </Badge>
          <Badge variant="secondary" className="bg-green-900/20 text-green-300">
            Ideogram AI
          </Badge>
        </div>
      </div>

      {/* Model 1: Prompt Enhancement */}
      <Card className="bg-zinc-900/50 border-zinc-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-blue-400" />
            Model 1: Prompt Enhancement Studio
          </CardTitle>
          <p className="text-sm text-zinc-400">
            Enter a simple prompt, enhance it with GPT-4, then generate images with both DALL·E and Ideogram
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Original Prompt Input */}
          <div className="space-y-2">
            <Label htmlFor="original-prompt">Original Prompt</Label>
            <Textarea
              id="original-prompt"
              placeholder="Enter your original prompt here... (e.g., 'a cat sitting on a chair')"
              value={model1State.originalPrompt}
              onChange={(e) => setModel1State(prev => ({ ...prev, originalPrompt: e.target.value }))}
              className="min-h-[100px] bg-zinc-800 border-zinc-600"
            />
          </div>

          {/* Enhance Button */}
          <Button
            onClick={enhancePrompt}
            disabled={model1State.isEnhancing || !model1State.originalPrompt.trim()}
            className="w-full bg-blue-600 hover:bg-blue-500"
          >
            {model1State.isEnhancing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enhancing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Enhance Prompt
              </>
            )}
          </Button>

          {/* Enhanced Prompt */}
          {model1State.enhancedPrompt && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="enhanced-prompt">Enhanced Prompt</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(model1State.enhancedPrompt)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                id="enhanced-prompt"
                value={model1State.enhancedPrompt}
                onChange={(e) => setModel1State(prev => ({ ...prev, enhancedPrompt: e.target.value }))}
                className="min-h-[120px] bg-zinc-800 border-zinc-600"
              />
            </div>
          )}

          {/* Generate Image Buttons */}
          {model1State.enhancedPrompt && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={generateImageWithDalle}
                disabled={model1State.isGeneratingDalle}
                className="bg-purple-600 hover:bg-purple-500"
              >
                {model1State.isGeneratingDalle ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    AI Artist Pro (DALL-E)
                  </>
                )}
              </Button>

              <Button
                onClick={generateImageWithIdeogram}
                disabled={model1State.isGeneratingIdeogram}
                className="bg-green-600 hover:bg-green-500"
              >
                {model1State.isGeneratingIdeogram ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    AI Artist Ultra (Ideogram)
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Generated Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* DALL-E Generated Image */}
            {model1State.dalleImage && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>AI Artist Pro (DALL-E) Result</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadImage(model1State.dalleImage, 'dalle-generated-image.png')}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                <div className="bg-zinc-800 rounded-lg p-4">
                  <img
                    src={model1State.dalleImage}
                    alt="Generated with DALL-E"
                    className="w-full rounded-lg shadow-lg"
                  />
                </div>
              </div>
            )}

            {/* Ideogram Generated Image */}
            {model1State.ideogramImage && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>AI Artist Ultra (Ideogram) Result</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadImage(model1State.ideogramImage, 'ideogram-generated-image.png')}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                <div className="bg-zinc-800 rounded-lg p-4">
                  <img
                    src={model1State.ideogramImage}
                    alt="Generated with Ideogram"
                    className="w-full rounded-lg shadow-lg"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Model 2: Image to Prompt */}
      <Card className="bg-zinc-900/50 border-zinc-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-green-400" />
            Model 2: Image Analysis Studio
          </CardTitle>
          <p className="text-sm text-zinc-400">
            Upload an image, extract a prompt with GPT-4 Vision, edit it, then generate new images with both AI artists
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="image-upload">Upload Image</Label>
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="bg-zinc-800 border-zinc-600"
            />
          </div>

          {/* Uploaded Image Preview */}
          {model2State.uploadedImageUrl && (
            <div className="space-y-2">
              <Label>Uploaded Image</Label>
              <div className="bg-zinc-800 rounded-lg p-4">
                <img
                  src={model2State.uploadedImageUrl}
                  alt="Uploaded image"
                  className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                />
              </div>
            </div>
          )}

          {/* Extract Prompt Button */}
          {model2State.uploadedImage && (
            <Button
              onClick={extractPromptFromImage}
              disabled={model2State.isExtracting}
              className="w-full bg-green-600 hover:bg-green-500"
            >
              {model2State.isExtracting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Extracting Prompt...
                </>
              ) : (
                <>
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Extract Prompt from Image
                </>
              )}
            </Button>
          )}

          {/* Extracted/Editable Prompt */}
          {model2State.extractedPrompt && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="extracted-prompt">Extracted Prompt (Editable)</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(model2State.editedPrompt)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                id="extracted-prompt"
                value={model2State.editedPrompt}
                onChange={(e) => setModel2State(prev => ({ ...prev, editedPrompt: e.target.value }))}
                className="min-h-[120px] bg-zinc-800 border-zinc-600"
                placeholder="Edit the extracted prompt here..."
              />
            </div>
          )}

          {/* Generate Image from Extracted Prompt Buttons */}
          {model2State.editedPrompt && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={generateImageFromExtractedPromptDalle}
                disabled={model2State.isGeneratingDalle}
                className="bg-purple-600 hover:bg-purple-500"
              >
                {model2State.isGeneratingDalle ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    AI Artist Pro (DALL-E)
                  </>
                )}
              </Button>

              <Button
                onClick={generateImageFromExtractedPromptIdeogram}
                disabled={model2State.isGeneratingIdeogram}
                className="bg-green-600 hover:bg-green-500"
              >
                {model2State.isGeneratingIdeogram ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    AI Artist Ultra (Ideogram)
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Generated Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* DALL-E Generated Image */}
            {model2State.dalleImage && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>AI Artist Pro (DALL-E) Result</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadImage(model2State.dalleImage, 'dalle-extracted-image.png')}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                <div className="bg-zinc-800 rounded-lg p-4">
                  <img
                    src={model2State.dalleImage}
                    alt="Generated from extracted prompt with DALL-E"
                    className="w-full rounded-lg shadow-lg"
                  />
                </div>
              </div>
            )}

            {/* Ideogram Generated Image */}
            {model2State.ideogramImage && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>AI Artist Ultra (Ideogram) Result</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadImage(model2State.ideogramImage, 'ideogram-extracted-image.png')}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                <div className="bg-zinc-800 rounded-lg p-4">
                  <img
                    src={model2State.ideogramImage}
                    alt="Generated from extracted prompt with Ideogram"
                    className="w-full rounded-lg shadow-lg"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 