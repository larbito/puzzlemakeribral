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
  Loader2
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
    generatedImage: '',
    isEnhancing: false,
    isGenerating: false
  });

  // Model 2 State - Image to Prompt
  const [model2State, setModel2State] = useState({
    uploadedImage: null as File | null,
    uploadedImageUrl: '',
    extractedPrompt: '',
    editedPrompt: '',
    generatedImage: '',
    isExtracting: false,
    isGenerating: false
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

  const generateImageFromPrompt = async () => {
    if (!model1State.enhancedPrompt.trim()) {
      toast.error('Please enhance your prompt first');
      return;
    }

    setModel1State(prev => ({ ...prev, isGenerating: true }));

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
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      
      setModel1State(prev => ({
        ...prev,
        generatedImage: data.data?.[0]?.url || data.imageUrl,
        isGenerating: false
      }));

      toast.success('Image generated successfully!');
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Failed to generate image');
      setModel1State(prev => ({ ...prev, isGenerating: false }));
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
        generatedImage: ''
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

  const generateImageFromExtractedPrompt = async () => {
    if (!model2State.editedPrompt.trim()) {
      toast.error('Please extract and edit the prompt first');
      return;
    }

    setModel2State(prev => ({ ...prev, isGenerating: true }));

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
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      
      setModel2State(prev => ({
        ...prev,
        generatedImage: data.data?.[0]?.url || data.imageUrl,
        isGenerating: false
      }));

      toast.success('Image generated successfully!');
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Failed to generate image');
      setModel2State(prev => ({ ...prev, isGenerating: false }));
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
          Prompt-to-Image Generator
        </h1>
        <p className="text-zinc-400 text-lg">
          Transform your ideas into stunning images with AI-powered enhancement and generation
        </p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <Badge variant="secondary" className="bg-blue-900/20 text-blue-300">
            GPT-4 Enhanced
          </Badge>
          <Badge variant="secondary" className="bg-purple-900/20 text-purple-300">
            DALL·E 3
          </Badge>
        </div>
      </div>

      {/* Model 1: Prompt Enhancement */}
      <Card className="bg-zinc-900/50 border-zinc-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-blue-400" />
            Model 1: Prompt Enhancement
          </CardTitle>
          <p className="text-sm text-zinc-400">
            Enter a simple prompt, enhance it with GPT-4, then generate an image with DALL·E 3
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

          {/* Generate Image Button */}
          {model1State.enhancedPrompt && (
            <Button
              onClick={generateImageFromPrompt}
              disabled={model1State.isGenerating}
              className="w-full bg-purple-600 hover:bg-purple-500"
            >
              {model1State.isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Image...
                </>
              ) : (
                <>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Generate Image
                </>
              )}
            </Button>
          )}

          {/* Generated Image */}
          {model1State.generatedImage && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Generated Image</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => downloadImage(model1State.generatedImage, 'enhanced-prompt-image.png')}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
              <div className="bg-zinc-800 rounded-lg p-4">
                <img
                  src={model1State.generatedImage}
                  alt="Generated from enhanced prompt"
                  className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Model 2: Image to Prompt */}
      <Card className="bg-zinc-900/50 border-zinc-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-green-400" />
            Model 2: Image to Prompt
          </CardTitle>
          <p className="text-sm text-zinc-400">
            Upload an image, extract a prompt with GPT-4 Vision, edit it, then generate a new image
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

          {/* Generate Image from Extracted Prompt Button */}
          {model2State.editedPrompt && (
            <Button
              onClick={generateImageFromExtractedPrompt}
              disabled={model2State.isGenerating}
              className="w-full bg-purple-600 hover:bg-purple-500"
            >
              {model2State.isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Image...
                </>
              ) : (
                <>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Generate Image from Prompt
                </>
              )}
            </Button>
          )}

          {/* Generated Image */}
          {model2State.generatedImage && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Generated Image</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => downloadImage(model2State.generatedImage, 'extracted-prompt-image.png')}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
              <div className="bg-zinc-800 rounded-lg p-4">
                <img
                  src={model2State.generatedImage}
                  alt="Generated from extracted prompt"
                  className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 