import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Upload, 
  Download, 
  Wand2, 
  Sparkles, 
  BookOpen, 
  Eye, 
  Settings,
  Image as ImageIcon,
  FileText,
  Ruler,
  Layers
} from 'lucide-react';
import { toast } from 'sonner';

// KDP Trim Sizes (width x height in inches)
const TRIM_SIZES = [
  { value: '5x8', label: '5" × 8"', width: 5, height: 8 },
  { value: '5.25x8', label: '5.25" × 8"', width: 5.25, height: 8 },
  { value: '5.5x8.5', label: '5.5" × 8.5"', width: 5.5, height: 8.5 },
  { value: '6x9', label: '6" × 9"', width: 6, height: 9 },
  { value: '6.14x9.21', label: '6.14" × 9.21"', width: 6.14, height: 9.21 },
  { value: '6.69x9.61', label: '6.69" × 9.61"', width: 6.69, height: 9.61 },
  { value: '7x10', label: '7" × 10"', width: 7, height: 10 },
  { value: '7.44x9.69', label: '7.44" × 9.69"', width: 7.44, height: 9.69 },
  { value: '7.5x9.25', label: '7.5" × 9.25"', width: 7.5, height: 9.25 },
  { value: '8x10', label: '8" × 10"', width: 8, height: 10 },
  { value: '8.25x11', label: '8.25" × 11"', width: 8.25, height: 11 },
  { value: '8.5x11', label: '8.5" × 11"', width: 8.5, height: 11 },
];

// Visual Styles
const VISUAL_STYLES = [
  { value: 'flat-vector', label: 'Flat Vector', description: 'Clean, geometric design' },
  { value: 'watercolor', label: 'Watercolor', description: 'Soft, flowing paint effects' },
  { value: 'digital-painting', label: 'Digital Painting', description: 'Realistic digital art' },
  { value: 'fantasy', label: 'Fantasy Illustration', description: 'Magical, ethereal style' },
  { value: 'retro', label: 'Retro 80s', description: 'Vintage aesthetic' },
  { value: 'cartoon', label: 'Cartoon', description: 'Playful, animated style' },
  { value: 'storybook', label: 'Storybook', description: 'Classic children\'s book art' },
  { value: 'photography', label: 'Photography', description: 'Realistic photo style' },
];

// AI Models
const AI_MODELS = [
  { value: 'dalle', label: 'DALL-E 3', description: 'Best for realistic and detailed art' },
  { value: 'ideogram', label: 'Ideogram', description: 'Excellent for text and graphic design' },
];

interface KDPSettings {
  trimSize: string;
  pageCount: number;
  bleed: boolean;
}

interface CoverGeneratorState {
  // Workflow selection
  activeTab: 'upload' | 'prompt';
  
  // Image upload workflow
  uploadedImage: File | null;
  uploadedImageUrl: string | null;
  analyzedPrompt: string;
  isAnalyzing: boolean;
  
  // Text prompt workflow
  rawPrompt: string;
  enhancedPrompt: string;
  isEnhancing: boolean;
  
  // Common settings
  selectedStyle: string;
  selectedModel: string;
  kdpSettings: KDPSettings;
  
  // Generation
  generatedImageUrl: string | null;
  isGenerating: boolean;
  
  // Preview
  showKDPFrame: boolean;
}

const CoverGenerator: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [state, setState] = useState<CoverGeneratorState>({
    activeTab: 'upload',
    uploadedImage: null,
    uploadedImageUrl: null,
    analyzedPrompt: '',
    isAnalyzing: false,
    rawPrompt: '',
    enhancedPrompt: '',
    isEnhancing: false,
    selectedStyle: 'flat-vector',
    selectedModel: 'dalle',
    kdpSettings: {
      trimSize: '6x9',
      pageCount: 100,
      bleed: true,
    },
    generatedImageUrl: null,
    isGenerating: false,
    showKDPFrame: true,
  });

  // Helper function to get API URL
  const getApiUrl = () => {
    return process.env.NODE_ENV === 'production' 
      ? window.location.origin.includes('vercel.app') 
        ? 'https://puzzlemakeribral-production.up.railway.app'
        : window.location.origin
      : 'http://localhost:3000';
  };

  // Calculate spine width using KDP formula
  const calculateSpineWidth = (): number => {
    const { pageCount } = state.kdpSettings;
    // KDP formula: (page count × 0.0025") for cream paper
    return pageCount * 0.0025;
  };

  // Get current trim size dimensions
  const getCurrentTrimSize = () => {
    return TRIM_SIZES.find(size => size.value === state.kdpSettings.trimSize) || TRIM_SIZES[3];
  };

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('Image must be less than 10MB');
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setState(prev => ({
      ...prev,
      uploadedImage: file,
      uploadedImageUrl: imageUrl,
      analyzedPrompt: '',
    }));
  };

  // Analyze uploaded image with GPT-4 Vision
  const handleAnalyzeImage = async () => {
    if (!state.uploadedImage) {
      toast.error('Please upload an image first');
      return;
    }

    setState(prev => ({ ...prev, isAnalyzing: true }));

    try {
      const formData = new FormData();
      formData.append('image', state.uploadedImage);
      formData.append('style', state.selectedStyle);
      formData.append('model', state.selectedModel);

      const response = await fetch(`${getApiUrl()}/api/analyze-image`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      const data = await response.json();
      
      setState(prev => ({
        ...prev,
        analyzedPrompt: data.prompt,
        isAnalyzing: false,
      }));

      toast.success('Image analyzed successfully!');
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast.error('Failed to analyze image. Please try again.');
      setState(prev => ({ ...prev, isAnalyzing: false }));
    }
  };

  // Enhance text prompt with GPT-4
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
          kdp_settings: state.kdpSettings,
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
    const promptToUse = state.activeTab === 'upload' ? state.analyzedPrompt : state.enhancedPrompt;
    
    if (!promptToUse.trim()) {
      toast.error(state.activeTab === 'upload' ? 'Please analyze the image first' : 'Please enhance the prompt first');
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
          prompt: promptToUse,
          model: state.selectedModel,
          style: state.selectedStyle,
          kdp_settings: state.kdpSettings,
          spine_width: calculateSpineWidth(),
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

    const trimSize = getCurrentTrimSize();
    const filename = `kdp-cover-${trimSize.value}-${Date.now()}.png`;
    
    const link = document.createElement('a');
    link.href = state.generatedImageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Cover downloaded successfully!');
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
          KDP AI Cover Generator
        </motion.h1>
        <motion.p 
          className="text-zinc-400 text-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Create professional KDP book covers with AI - Upload images or write prompts
        </motion.p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Input & Settings */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Workflow Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Tabs value={state.activeTab} onValueChange={(value) => setState(prev => ({ ...prev, activeTab: value as 'upload' | 'prompt' }))}>
              <TabsList className="grid w-full grid-cols-2 bg-zinc-900/50">
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Image → Prompt → Image
                </TabsTrigger>
                <TabsTrigger value="prompt" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Prompt → Enhanced → Image
                </TabsTrigger>
              </TabsList>

              {/* Image Upload Workflow */}
              <TabsContent value="upload" className="space-y-6">
                <div className="bg-zinc-900/80 rounded-lg border border-zinc-800 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Upload className="h-5 w-5 text-emerald-400" />
                    Upload Cover Image
                  </h3>
                  
                  {/* Image Upload */}
                  <div className="space-y-4">
                    <div
                      className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center cursor-pointer hover:border-emerald-500 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {state.uploadedImageUrl ? (
                        <div className="space-y-4">
                          <img
                            src={state.uploadedImageUrl}
                            alt="Uploaded cover"
                            className="max-h-48 mx-auto rounded-lg"
                          />
                          <p className="text-emerald-400">Image uploaded successfully!</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <ImageIcon className="h-12 w-12 mx-auto text-zinc-500" />
                          <div>
                            <p className="text-zinc-300">Click to upload a cover image</p>
                            <p className="text-sm text-zinc-500">JPG, PNG up to 10MB</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />

                    {/* Analyze Button */}
                    <Button
                      onClick={handleAnalyzeImage}
                      disabled={state.isAnalyzing || !state.uploadedImage}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400"
                    >
                      {state.isAnalyzing ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin">⏳</span> Analyzing Image...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Analyze with GPT-4 Vision
                        </span>
                      )}
                    </Button>

                    {/* Analyzed Prompt Display */}
                    {state.analyzedPrompt && (
                      <div className="space-y-2">
                        <Label>Extracted Prompt</Label>
                        <div className="bg-purple-950/30 border border-purple-900/50 rounded-lg p-4">
                          <p className="text-sm text-purple-300 leading-relaxed">
                            {state.analyzedPrompt}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Text Prompt Workflow */}
              <TabsContent value="prompt" className="space-y-6">
                <div className="bg-zinc-900/80 rounded-lg border border-zinc-800 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-emerald-400" />
                    Create from Text Prompt
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Text Input */}
                    <div className="space-y-2">
                      <Label htmlFor="rawPrompt">Describe your book cover idea</Label>
                      <Textarea
                        id="rawPrompt"
                        placeholder="e.g., A majestic dragon soaring over a medieval castle at sunset, fantasy book cover"
                        className="min-h-[120px] bg-zinc-800/50 border-zinc-700 focus:border-emerald-500 resize-none"
                        value={state.rawPrompt}
                        onChange={(e) => setState(prev => ({ ...prev, rawPrompt: e.target.value }))}
                      />
                      <p className="text-xs text-zinc-500">
                        Describe your vision - AI will enhance it into a detailed, KDP-optimized prompt
                      </p>
                    </div>

                    {/* Enhance Button */}
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
                          Enhance with GPT-4
                        </span>
                      )}
                    </Button>

                    {/* Enhanced Prompt Display */}
                    {state.enhancedPrompt && (
                      <div className="space-y-2">
                        <Label>Enhanced Prompt</Label>
                        <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-lg p-4">
                          <p className="text-sm text-emerald-300 leading-relaxed">
                            {state.enhancedPrompt}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* Common Settings */}
          <motion.div
            className="bg-zinc-900/80 rounded-lg border border-zinc-800 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-emerald-400" />
              Generation Settings
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <div>
                          <div className="font-medium">{style.label}</div>
                          <div className="text-xs text-zinc-500">{style.description}</div>
                        </div>
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
                        <div>
                          <div className="font-medium">{model.label}</div>
                          <div className="text-xs text-zinc-500">{model.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>

          {/* KDP Settings */}
          <motion.div
            className="bg-zinc-900/80 rounded-lg border border-zinc-800 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Ruler className="h-5 w-5 text-emerald-400" />
              KDP Book Settings
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Trim Size */}
              <div className="space-y-2">
                <Label>Trim Size</Label>
                <Select
                  value={state.kdpSettings.trimSize}
                  onValueChange={(value) => setState(prev => ({ 
                    ...prev, 
                    kdpSettings: { ...prev.kdpSettings, trimSize: value }
                  }))}
                >
                  <SelectTrigger className="bg-zinc-800/50 border-zinc-700">
                    <SelectValue placeholder="Select trim size" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIM_SIZES.map((size) => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Page Count */}
              <div className="space-y-2">
                <Label>Page Count</Label>
                <Input
                  type="number"
                  min="24"
                  max="828"
                  value={state.kdpSettings.pageCount}
                  onChange={(e) => setState(prev => ({ 
                    ...prev, 
                    kdpSettings: { ...prev.kdpSettings, pageCount: parseInt(e.target.value) || 100 }
                  }))}
                  className="bg-zinc-800/50 border-zinc-700"
                />
                <p className="text-xs text-zinc-500">
                  Spine width: {calculateSpineWidth().toFixed(3)}"
                </p>
              </div>

              {/* Bleed */}
              <div className="space-y-2">
                <Label>Include Bleed</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    checked={state.kdpSettings.bleed}
                    onCheckedChange={(checked) => setState(prev => ({ 
                      ...prev, 
                      kdpSettings: { ...prev.kdpSettings, bleed: checked }
                    }))}
                  />
                  <span className="text-sm text-zinc-400">
                    {state.kdpSettings.bleed ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Generate Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Button
              onClick={handleGenerateImage}
              disabled={state.isGenerating || (state.activeTab === 'upload' ? !state.analyzedPrompt : !state.enhancedPrompt)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-500 hover:from-blue-500 hover:to-purple-400 h-12 text-lg"
            >
              {state.isGenerating ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span> Generating KDP Cover...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Generate KDP Cover
                </span>
              )}
            </Button>
          </motion.div>
        </div>

        {/* Right Column - Preview & Output */}
        <div className="space-y-6">
          
          {/* Preview Controls */}
          <motion.div
            className="bg-zinc-900/80 rounded-lg border border-zinc-800 p-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm">Preview Options</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={state.showKDPFrame}
                  onCheckedChange={(checked) => setState(prev => ({ ...prev, showKDPFrame: checked }))}
                />
                <span className="text-xs text-zinc-400">KDP Frame</span>
              </div>
            </div>
            <p className="text-xs text-zinc-500">
              Current: {getCurrentTrimSize().label} • Spine: {calculateSpineWidth().toFixed(3)}"
            </p>
          </motion.div>

          {/* Generated Cover Preview */}
          <motion.div
            className="bg-zinc-900/80 rounded-lg border border-zinc-800 p-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-emerald-400" />
              Generated Cover
            </h3>
            
            <div className="space-y-4">
              {/* Image Preview */}
              <div className="bg-zinc-800/50 border-2 border-dashed border-zinc-700 rounded-lg min-h-[400px] flex items-center justify-center relative">
                {state.generatedImageUrl ? (
                  <div className="relative w-full max-w-sm">
                    {/* KDP Frame Overlay */}
                    {state.showKDPFrame && (
                      <div className="absolute inset-0 pointer-events-none z-10">
                        <div className="w-full h-full border-2 border-emerald-400/50 rounded-lg">
                          {/* Spine guide */}
                          <div 
                            className="absolute top-0 left-1/2 transform -translate-x-1/2 h-full bg-emerald-400/20 border-x border-emerald-400/50"
                            style={{ width: `${calculateSpineWidth() * 20}px` }}
                          />
                          {/* Safe zone guides */}
                          <div className="absolute inset-4 border border-dashed border-yellow-400/30" />
                        </div>
                      </div>
                    )}
                    
                    <img
                      src={state.generatedImageUrl}
                      alt="Generated KDP cover"
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
                    <p>Your KDP cover will appear here</p>
                    <p className="text-sm mt-2">
                      {state.activeTab === 'upload' 
                        ? !state.analyzedPrompt 
                          ? "Upload and analyze an image to start"
                          : "Click 'Generate KDP Cover' to create"
                        : !state.enhancedPrompt
                          ? "Enter and enhance a prompt to start" 
                          : "Click 'Generate KDP Cover' to create"
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Download Button */}
              {state.generatedImageUrl && (
                <Button
                  onClick={handleDownload}
                  className="w-full bg-emerald-600 hover:bg-emerald-500"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download KDP Cover
                </Button>
              )}
            </div>
          </motion.div>

          {/* KDP Info */}
          <motion.div
            className="bg-amber-950/30 border border-amber-900/50 rounded-lg p-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <h4 className="text-sm font-semibold text-amber-300 mb-2 flex items-center gap-2">
              <Layers className="h-4 w-4" />
              KDP Requirements
            </h4>
            <div className="text-xs text-amber-400 space-y-1">
              <p>• Cover includes front, spine, and back</p>
              <p>• Generated at 300 DPI for print quality</p>
              <p>• Bleed area {state.kdpSettings.bleed ? 'included' : 'excluded'}</p>
              <p>• Text-safe zones marked with guides</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CoverGenerator; 