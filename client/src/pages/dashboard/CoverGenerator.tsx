import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Wand2, Sparkles, BookOpen, Palette, Cpu } from 'lucide-react';
import { toast } from 'sonner';

// Available visual styles
const VISUAL_STYLES = [
  { value: 'flat-vector', label: 'Flat Vector' },
  { value: 'watercolor', label: 'Watercolor' },
  { value: 'fantasy', label: 'Fantasy Illustration' },
  { value: 'retro', label: 'Retro 80s' },
  { value: 'digital-painting', label: 'Digital Painting' },
  { value: 'storybook', label: 'Storybook' },
  { value: 'hand-drawn', label: 'Hand-Drawn' },
  { value: 'digital-art', label: 'Digital Art' },
];

// Available AI models
const AI_MODELS = [
  { value: 'dalle', label: 'DALL-E 3' },
  { value: 'ideogram', label: 'Ideogram' },
];

interface CoverGeneratorState {
  rawPrompt: string;
  selectedStyle: string;
  selectedModel: string;
  enhancedPrompt: string;
  generatedImageUrl: string | null;
  isEnhancing: boolean;
  isGenerating: boolean;
}

const CoverGenerator: React.FC = () => {
  const [state, setState] = useState<CoverGeneratorState>({
    rawPrompt: '',
    selectedStyle: 'flat-vector',
    selectedModel: 'dalle',
    enhancedPrompt: '',
    generatedImageUrl: null,
    isEnhancing: false,
    isGenerating: false,
  });

  // Helper function to get the correct API URL
  const getApiUrl = () => {
    return process.env.NODE_ENV === 'production' 
      ? window.location.origin.includes('vercel.app') 
        ? 'https://puzzlemakeribral-production.up.railway.app'
        : window.location.origin
      : 'http://localhost:3000';
  };

  // Enhance prompt using GPT-4
  const handleEnhancePrompt = async () => {
    if (!state.rawPrompt.trim()) {
      toast.error('Please enter a prompt first');
      return;
    }

    setState(prev => ({ ...prev, isEnhancing: true }));

    try {
      const response = await fetch(`${getApiUrl()}/api/enhance-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw_prompt: state.rawPrompt,
          style: state.selectedStyle,
          model: state.selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to enhance prompt');
      }

      const data = await response.json();
      
      setState(prev => ({
        ...prev,
        enhancedPrompt: data.enhanced_prompt,
        isEnhancing: false,
      }));

      toast.success('Prompt enhanced successfully!');
    } catch (error) {
      console.error('Error enhancing prompt:', error);
      toast.error('Failed to enhance prompt. Please try again.');
      setState(prev => ({ ...prev, isEnhancing: false }));
    }
  };

  // Generate cover image
  const handleGenerateImage = async () => {
    if (!state.enhancedPrompt.trim()) {
      toast.error('Please enhance the prompt first');
      return;
    }

    setState(prev => ({ ...prev, isGenerating: true }));

    try {
      const response = await fetch(`${getApiUrl()}/api/generate-cover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: state.enhancedPrompt,
          model: state.selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate cover');
      }

      const data = await response.json();
      
      setState(prev => ({
        ...prev,
        generatedImageUrl: data.image_url,
        isGenerating: false,
      }));

      toast.success('Cover generated successfully!');
    } catch (error) {
      console.error('Error generating cover:', error);
      toast.error('Failed to generate cover. Please try again.');
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  // Download generated image
  const handleDownload = () => {
    if (!state.generatedImageUrl) {
      toast.error('No image to download');
      return;
    }

    // Create download link
    const link = document.createElement('a');
    link.href = state.generatedImageUrl;
    link.download = `generated-cover-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Image downloaded successfully!');
  };

  return (
    <div className="container mx-auto py-8 px-6 max-w-7xl">
      {/* Header */}
      <div className="text-center mb-12">
        <motion.h1 
          className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          AI Cover Generator
        </motion.h1>
        <motion.p 
          className="text-zinc-400 text-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Transform your ideas into professional book covers with AI
        </motion.p>
      </div>

      {/* Feature overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <motion.div 
          className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-full bg-emerald-900/30 p-3">
              <Sparkles className="h-6 w-6 text-emerald-400" />
            </div>
            <h3 className="font-semibold text-white">AI Enhancement</h3>
          </div>
          <p className="text-zinc-400 text-sm">Transform simple ideas into detailed, optimized prompts</p>
        </motion.div>
        
        <motion.div 
          className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-full bg-emerald-900/30 p-3">
              <Palette className="h-6 w-6 text-emerald-400" />
            </div>
            <h3 className="font-semibold text-white">Style Control</h3>
          </div>
          <p className="text-zinc-400 text-sm">Choose from multiple artistic styles and visual approaches</p>
        </motion.div>
        
        <motion.div 
          className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-full bg-emerald-900/30 p-3">
              <Cpu className="h-6 w-6 text-emerald-400" />
            </div>
            <h3 className="font-semibold text-white">Dual AI Models</h3>
          </div>
          <p className="text-zinc-400 text-sm">Generate with DALL-E 3 or Ideogram for different results</p>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <motion.div 
          className="bg-zinc-900/80 rounded-lg border border-zinc-800 p-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-emerald-400" />
            Cover Concept
          </h2>
          
          {/* User Input */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="rawPrompt">Describe your book cover idea</Label>
              <Textarea
                id="rawPrompt"
                placeholder="e.g., A lion reading a book under a tree at sunset"
                className="min-h-[120px] bg-zinc-800/50 border-zinc-700 focus:border-emerald-500 resize-none"
                value={state.rawPrompt}
                onChange={(e) => setState(prev => ({ ...prev, rawPrompt: e.target.value }))}
              />
              <p className="text-xs text-zinc-500">
                Describe your vision in simple terms - AI will enhance it into a detailed prompt
              </p>
            </div>

            {/* Style Selection */}
            <div className="space-y-2">
              <Label>Visual Style</Label>
              <Select
                value={state.selectedStyle}
                onValueChange={(value) => setState(prev => ({ ...prev, selectedStyle: value }))}
              >
                <SelectTrigger className="bg-zinc-800/50 border-zinc-700">
                  <SelectValue placeholder="Select visual style" />
                </SelectTrigger>
                <SelectContent>
                  {VISUAL_STYLES.map((style) => (
                    <SelectItem key={style.value} value={style.value}>
                      {style.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
              <Label>AI Model</Label>
              <Select
                value={state.selectedModel}
                onValueChange={(value) => setState(prev => ({ ...prev, selectedModel: value }))}
              >
                <SelectTrigger className="bg-zinc-800/50 border-zinc-700">
                  <SelectValue placeholder="Select AI model" />
                </SelectTrigger>
                <SelectContent>
                  {AI_MODELS.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleEnhancePrompt}
                disabled={state.isEnhancing || !state.rawPrompt.trim()}
                className="w-full bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400"
              >
                {state.isEnhancing ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span> Enhancing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Wand2 className="h-4 w-4" />
                    Enhance Prompt
                  </span>
                )}
              </Button>

              <Button
                onClick={handleGenerateImage}
                disabled={state.isGenerating || !state.enhancedPrompt.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-500 hover:from-blue-500 hover:to-purple-400"
              >
                {state.isGenerating ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span> Generating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Generate Cover
                  </span>
                )}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Output Section */}
        <motion.div 
          className="bg-zinc-900/80 rounded-lg border border-zinc-800 p-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-400" />
            Generated Result
          </h2>

          {/* Enhanced Prompt Display */}
          {state.enhancedPrompt && (
            <div className="space-y-4 mb-6">
              <Label>Enhanced Prompt</Label>
              <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-lg p-4">
                <p className="text-sm text-emerald-300 leading-relaxed">
                  {state.enhancedPrompt}
                </p>
              </div>
            </div>
          )}

          {/* Generated Image Display */}
          <div className="space-y-4">
            <Label>Generated Cover</Label>
            <div className="bg-zinc-800/50 border-2 border-dashed border-zinc-700 rounded-lg min-h-[400px] flex items-center justify-center">
              {state.generatedImageUrl ? (
                <div className="relative w-full max-w-md">
                  <img
                    src={state.generatedImageUrl}
                    alt="Generated book cover"
                    className="w-full h-auto rounded-lg shadow-lg"
                  />
                  <Button
                    onClick={handleDownload}
                    className="absolute top-2 right-2 bg-emerald-600 hover:bg-emerald-500"
                    size="sm"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center text-zinc-500">
                  <BookOpen className="h-16 w-16 mx-auto mb-4 text-zinc-600" />
                  <p>Your generated cover will appear here</p>
                  <p className="text-sm mt-2">
                    {!state.enhancedPrompt 
                      ? "Start by enhancing your prompt" 
                      : "Click 'Generate Cover' to create your image"
                    }
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Download Button */}
          {state.generatedImageUrl && (
            <Button
              onClick={handleDownload}
              className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Cover
            </Button>
          )}
        </motion.div>
      </div>

      {/* Tips Section */}
      <motion.div 
        className="mt-12 bg-amber-950/30 border border-amber-900/50 rounded-lg p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <h3 className="text-lg font-semibold text-amber-300 mb-4">💡 Pro Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-amber-400">
          <ul className="space-y-2">
            <li>• Be specific about characters, settings, and mood</li>
            <li>• Mention the genre or target audience</li>
            <li>• Include color preferences or lighting</li>
          </ul>
          <ul className="space-y-2">
            <li>• Choose the style that matches your book's tone</li>
            <li>• DALL-E excels at realistic and detailed art</li>
            <li>• Ideogram works well for graphic design styles</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
};

export default CoverGenerator; 