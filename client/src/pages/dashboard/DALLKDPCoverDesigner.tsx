// DALL·E KDP Cover Designer - Uses DALL·E instead of Ideogram
import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Upload, 
  Wand2, 
  PencilRuler, 
  Eye, 
  Download,
  Info,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Lock,
  Undo2,
  Book,
  FileType,
  LayoutPanelTop,
  Check,
  RefreshCcw,
  AlertTriangle,
  Plus,
  Minus,
  Settings,
  FileText,
  Palette,
  Scissors,
  BarChart3,
  Maximize,
  Monitor,
  Loader2,
  Ruler,
  Sparkles,
  EyeOff,
  Trash2,
  ImageIcon,
  Brain
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Define the main types we'll use
type Step = 'settings' | 'frontCover' | 'backCover' | 'spine' | 'preview' | 'export';

interface BookSettings {
  bookSize: string;
  pageCount: number;
  paperType: 'white' | 'cream' | 'color';
  includeBleed: boolean;
  includeISBN: boolean;
  // Calculated dimensions
  dimensions: {
    width: number;
    height: number;
    spineWidth: number;
    totalWidth: number;
    totalHeight: number;
  };
}

interface CoverDesignerState {
  steps: {
    settings: boolean;
    frontCover: boolean;
    backCover: boolean;
    spine: boolean;
    preview: boolean;
    export: boolean;
  };
  activeStep: Step;
  bookSettings: BookSettings;
  frontCoverPrompt: string;
  frontCoverImage: string | null;
  originalImageUrl: string | null; // URL for the original uploaded image
  backCoverPrompt: string;
  backCoverImage: string | null;
  interiorImages: string[];
  spineText: string;
  spineColor: string;
  spineFont: string;
  fullCoverImage: string | null;
  uploadedFile?: File;
  selectedStyle: string; // Book genre style
  showGuidelines: boolean; // Toggle for safety margins display
  // New back cover options
  includeBackText: boolean; // Toggle for adding custom text
  backCustomText: string; // User's custom text for back cover
  includeInteriorImages: boolean; // Toggle for adding interior images
  generatedBackPrompt: string; // The GPT-4 generated prompt for back cover
  extractedColors: string[]; // Colors extracted from front/back covers for spine
}

// KDP supported trim sizes
const KDP_TRIM_SIZES = [
  { value: '5x8', label: '5" × 8"' },
  { value: '5.25x8', label: '5.25" × 8"' },
  { value: '5.5x8.5', label: '5.5" × 8.5"' },
  { value: '6x9', label: '6" × 9"' },
  { value: '7x10', label: '7" × 10"' },
  { value: '8x10', label: '8" × 10"' },
  { value: '8.5x11', label: '8.5" × 11"' },
];

// Paper type options
const PAPER_TYPES = [
  { value: 'white', label: 'White' },
  { value: 'cream', label: 'Cream' },
  { value: 'color', label: 'Color' },
];

// Available spine fonts
const SPINE_FONTS = [
  { value: 'helvetica', label: 'Helvetica' },
  { value: 'times', label: 'Times New Roman' },
  { value: 'georgia', label: 'Georgia' },
  { value: 'garamond', label: 'Garamond' },
  { value: 'futura', label: 'Futura' },
];

// Cover styles optimized for DALL·E
const COVER_STYLES = [
  { id: 'literary', name: 'Literary Fiction', emoji: '📖', prompt: 'elegant literary fiction book cover design, sophisticated, minimalist typography, subtle imagery, understated color palette, high-concept design, professional book cover' },
  { id: 'thriller', name: 'Thriller/Mystery', emoji: '🔍', prompt: 'suspenseful thriller book cover, dramatic shadows, high contrast, bold title typography, moody atmosphere, tension-building visual elements, mystery book cover' },
  { id: 'romance', name: 'Romance', emoji: '❤️', prompt: 'romantic book cover design, emotionally evocative, soft color palette, elegant typography, relationship-focused imagery, heartfelt visual elements, romance novel cover' },
  { id: 'fantasy', name: 'Fantasy', emoji: '🐉', prompt: 'fantasy book cover design, magical elements, rich detailed illustration, epic scenery, mystical symbols, otherworldly atmosphere, fantasy novel cover' },
  { id: 'nonfiction', name: 'Non-Fiction', emoji: '📊', prompt: 'professional non-fiction book cover, clean layout, informative design, authoritative typography, subject-appropriate imagery, organized visual hierarchy' },
  { id: 'scifi', name: 'Science Fiction', emoji: '🚀', prompt: 'science fiction book cover design, futuristic elements, technological aesthetics, innovative typography, cosmic imagery, forward-looking visual style, sci-fi cover' },
  { id: 'children', name: 'Children\'s', emoji: '🧸', prompt: 'children\'s book cover design, playful illustrations, bright cheerful colors, fun typography, age-appropriate imagery, engaging visual elements, kids book cover' },
  { id: 'horror', name: 'Horror', emoji: '👻', prompt: 'horror book cover design, unsettling imagery, dark atmosphere, eerie elements, foreboding typography, suspenseful visual composition, horror novel cover' },
  { id: 'memoir', name: 'Memoir/Biography', emoji: '✍️', prompt: 'memoir or biography book cover design, personal imagery, authentic feel, balanced typography, narrative-focused layout, meaningful visual elements' },
  { id: 'historical', name: 'Historical', emoji: '⏳', prompt: 'historical book cover design, period-appropriate imagery, classic typography, aged texture, era-specific visual elements, authentic historical aesthetic' },
  { id: 'ya', name: 'Young Adult', emoji: '🌟', prompt: 'young adult book cover design, contemporary style, relatable imagery, dynamic typography, teen-appropriate visual elements, emotionally resonant design' },
  { id: 'textbook', name: 'Textbook/Academic', emoji: '🎓', prompt: 'academic or textbook cover design, organized layout, clear typography, educational imagery, professional appearance, subject-focused visual elements' },
];

const DALLKDPCoverDesigner: React.FC = () => {
  // Helper function to get the correct API URL
  const getApiUrl = () => {
    return process.env.NODE_ENV === 'production' 
      ? window.location.origin.includes('vercel.app') 
        ? 'https://puzzlemakeribral-production.up.railway.app'
        : window.location.origin
      : 'http://localhost:3000';
  };

  // Initialize state
  const [state, setState] = useState<CoverDesignerState>({
    steps: {
      settings: false,
      frontCover: false,
      backCover: false,
      spine: false,
      preview: false,
      export: false
    },
    activeStep: 'settings',
    bookSettings: {
      bookSize: '6x9',
      pageCount: 300,
      paperType: 'white',
      includeBleed: true,
      includeISBN: true,
      dimensions: {
        width: 0,
        height: 0,
        spineWidth: 0,
        totalWidth: 0,
        totalHeight: 0
      }
    },
    frontCoverPrompt: '',
    frontCoverImage: null,
    originalImageUrl: null,
    backCoverPrompt: '',
    backCoverImage: null,
    interiorImages: [],
    spineText: '',
    spineColor: '#3B82F6',
    spineFont: 'helvetica',
    fullCoverImage: null,
    selectedStyle: 'literary',
    showGuidelines: false,
    includeBackText: false,
    backCustomText: '',
    includeInteriorImages: false,
    generatedBackPrompt: '',
    extractedColors: [],
  });

  const [activeTab, setActiveTab] = useState<'styles' | 'measurements'>('styles');

  const [isLoading, setIsLoading] = useState<{[key: string]: boolean}>({
    uploadImage: false,
    analyzeImage: false,
    generatePrompt: false,
    generateFrontCover: false,
    generateBackCover: false,
    assembleCover: false,
    enhancePrompt: false,
    generateSmartPrompt: false
  });

  // Function to complete a step and advance to the next one
  const completeStep = (step: Step, nextStep: Step) => {
    setState(prev => ({
      ...prev,
      steps: {
        ...prev.steps,
        [step]: true
      },
      activeStep: nextStep
    }));
    toast.success(`${step.charAt(0).toUpperCase() + step.slice(1)} completed!`);
  };

  // Function to navigate to a previously completed step
  const goToStep = (step: Step) => {
    if (state.steps[step as Step] || step === 'settings') {
      setState(prev => ({
        ...prev,
        activeStep: step
      }));
    } else {
      toast.error('Please complete the previous step first');
    }
  };

  // Function to extract colors from front and back covers for spine
  const extractColorsFromCovers = async () => {
    if (!state.frontCoverImage) {
      console.log('No front cover image available for color extraction');
      return;
    }

    try {
      console.log('🎨 Extracting colors from covers for spine selection...');
      
      const requestBody = {
        frontCoverUrl: state.frontCoverImage,
        ...(state.backCoverImage && { backCoverUrl: state.backCoverImage })
      };
      
      const response = await fetch(`${getApiUrl()}/api/book-cover/extract-colors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      if (response.ok) {
        const data = await response.json();
        setState(prev => ({
          ...prev,
          extractedColors: data.colors || []
        }));
        console.log('✅ Colors extracted:', data.colors?.length || 0);
      }
    } catch (error) {
      console.error('❌ Error extracting colors:', error);
    }
  };

  // Auto-trigger color extraction when spine step is reached
  useEffect(() => {
    if (state.activeStep === 'spine' && state.extractedColors.length === 0) {
      extractColorsFromCovers();
    }
  }, [state.activeStep]);

  // Calculate spine width based on page count and paper type
  useEffect(() => {
    const { pageCount, paperType } = state.bookSettings;
    let multiplier = 0.002252; // white paper
    
    if (paperType === 'cream') {
      multiplier = 0.0025;
    } else if (paperType === 'color') {
      multiplier = 0.002347;
    }
    
    const spineWidth = pageCount * multiplier;
    
    setState(prev => ({
      ...prev,
      bookSettings: {
        ...prev.bookSettings,
        dimensions: {
          ...prev.bookSettings.dimensions,
          spineWidth
        }
      }
    }));
  }, [state.bookSettings.pageCount, state.bookSettings.paperType]);

  // Calculate book dimensions when book size changes
  useEffect(() => {
    const { bookSize } = state.bookSettings;
    const [width, height] = bookSize.split('x').map(Number);
    
    setState(prev => ({
      ...prev,
      bookSettings: {
        ...prev.bookSettings,
        dimensions: {
          ...prev.bookSettings.dimensions,
          width,
          height,
          totalWidth: width * 2 + prev.bookSettings.dimensions.spineWidth + (prev.bookSettings.includeBleed ? 0.25 : 0),
          totalHeight: height + (prev.bookSettings.includeBleed ? 0.25 : 0)
        }
      }
    }));
    
    console.log(`Book dimensions set to: ${width}x${height} inches`);
  }, [state.bookSettings.bookSize, state.bookSettings.includeBleed]);

  // Helper function to enhance user prompts for better DALL·E results
  const enhanceUserPrompt = (userPrompt: string) => {
    // Remove common problematic words
    let enhanced = userPrompt
      .replace(/generate\s+a?\s+cover\s+(for\s+)?/gi, '')
      .replace(/create\s+a?\s+cover\s+(for\s+)?/gi, '')
      .replace(/make\s+a?\s+cover\s+(for\s+)?/gi, '')
      .replace(/design\s+a?\s+cover\s+(for\s+)?/gi, '')
      .replace(/book\s+cover/gi, 'illustration')
      .trim();
    
    // If the prompt is very basic, make it more descriptive
    if (enhanced.length < 50) {
      enhanced = `${enhanced.toLowerCase()}, beautiful illustration, engaging composition, vibrant colors, eye-catching design`;
    }
    
    // Focus on flat artwork, not book covers
    enhanced = `Flat artwork showing ${enhanced}. Title text at the top, author name at the bottom, clean typography, balanced layout`;
    
    return enhanced;
  };

  // DALL·E specific front cover generation function
  const generateDALLEFrontCover = async () => {
    setIsLoading({...isLoading, generateFrontCover: true});
    
    try {
      console.log('🎨 Generating front cover with DALL·E...');
      
      const selectedStyleObj = COVER_STYLES.find(s => s.id === state.selectedStyle);
      const stylePrompt = selectedStyleObj ? selectedStyleObj.prompt : '';
      
      // Enhanced user prompt + style + flat 2D instructions
      const enhancedUserPrompt = enhanceUserPrompt(state.frontCoverPrompt);
      const dallePrompt = `${enhancedUserPrompt}. ${stylePrompt}. IMPORTANT: Flat 2D illustration only, absolutely no 3D elements, no perspective view, no depth, no shadows, no physical book, no props, no pencils, no objects around the artwork, clean flat digital art, vector style, straight-on view, no mockup, print-ready flat design`;
      
      const response = await fetch(`${getApiUrl()}/api/book-cover/generate-dalle-cover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: dallePrompt,
          size: '1024x1024', // DALL·E 3 default size
          quality: 'hd',
          style: 'vivid',
          bookSize: state.bookSettings.bookSize
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate cover with DALL·E');
      }
      
      const data = await response.json();
      
      setState(prev => ({
        ...prev,
        frontCoverImage: data.url,
        steps: {
          ...prev.steps,
          frontCover: true
        }
      }));
      
      toast.success("Front cover generated with DALL·E!");
      
    } catch (error) {
      console.error('DALL·E cover generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate cover with DALL·E');
    } finally {
      setIsLoading({...isLoading, generateFrontCover: false});
    }
  };

  // DALL·E specific back cover generation function
  const generateDALLEBackCover = async () => {
    setIsLoading({...isLoading, generateBackCover: true});
    
    try {
      console.log('🎨 Generating back cover with DALL·E...');
      
      const requestBody = {
        frontCoverPrompt: state.frontCoverPrompt,
        includeBackText: state.includeBackText,
        backCustomText: state.backCustomText,
        includeInteriorImages: state.includeInteriorImages,
        interiorImages: state.interiorImages.filter(img => img),
        generatedBackPrompt: state.generatedBackPrompt,
        size: '1024x1024',
        quality: 'hd',
        style: 'vivid'
      };
      
      const response = await fetch(`${getApiUrl()}/api/book-cover/generate-dalle-back`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate back cover with DALL·E');
      }
      
      const data = await response.json();
      
      setState(prev => ({
        ...prev,
        backCoverImage: data.url,
        steps: {
          ...prev.steps,
          backCover: true
        }
      }));
      
      toast.success("Back cover generated with DALL·E!");
      
    } catch (error) {
      console.error('DALL·E back cover generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate back cover with DALL·E');
    } finally {
      setIsLoading({...isLoading, generateBackCover: false});
    }
  };

  // Generate back cover prompt preview function
  const generateBackPromptPreview = async () => {
    setIsLoading({...isLoading, generateSmartPrompt: true});
    
    try {
      console.log('🧠 Generating back cover prompt preview...');
      
      const requestBody = {
        frontPrompt: state.frontCoverPrompt,
        includeBackText: state.includeBackText,
        backCustomText: state.backCustomText,
        includeInteriorImages: state.includeInteriorImages,
        interiorImagesCount: state.interiorImages.filter(img => img).length
      };
      
      const response = await fetch(`${getApiUrl()}/api/book-cover/generate-back-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate prompt preview');
      }
      
      const data = await response.json();
      
      setState(prev => ({
        ...prev,
        generatedBackPrompt: data.enhancedPrompt
      }));
      
      toast.success("Prompt generated! You can edit it before creating the image.");
      
    } catch (error) {
      console.error('Prompt generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate prompt preview');
    } finally {
      setIsLoading({...isLoading, generateSmartPrompt: false});
    }
  };

  // Generate full cover function
  const generateFullCover = async () => {
    setIsLoading({...isLoading, assembleCover: true});
    
    try {
      console.log('🎨 Generating full wrap cover...');
      
      if (!state.frontCoverImage) {
        throw new Error('Front cover is required');
      }
      
      const requestBody = {
        frontCoverUrl: state.frontCoverImage,
        backCoverUrl: state.backCoverImage,
        trimSize: state.bookSettings.bookSize,
        paperType: state.bookSettings.paperType,
        pageCount: state.bookSettings.pageCount,
        spineColor: state.spineColor,
        spineText: state.spineText,
        addSpineText: !!state.spineText,
        interiorImages: state.interiorImages.filter(img => img)
      };
      
      const response = await fetch(`${getApiUrl()}/api/book-cover/generate-full-wrap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate full cover');
      }
      
      const data = await response.json();
      
      setState(prev => ({
        ...prev,
        fullCoverImage: data.url,
        steps: {
          ...prev.steps,
          preview: true
        }
      }));
      
      toast.success("Full wrap cover generated successfully!");
      
    } catch (error) {
      console.error('Full cover generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate full wrap cover');
    } finally {
      setIsLoading({...isLoading, assembleCover: false});
    }
  };

  // Download function for covers
  const downloadCoverWithExactDimensions = async (imageUrl: string, filename: string) => {
    try {
      // For data URLs, create download directly
      if (imageUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      
      // For regular URLs, fetch and download
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download image');
    }
  };

  // Main render method
  const renderStep = () => {
    switch (state.activeStep) {
      case 'settings':
        return (
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-400">
                <Settings className="h-6 w-6" />
                Book Settings
              </CardTitle>
              <CardDescription>Configure your book specifications for KDP publishing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Book Size (Trim Size)</Label>
                  <Select 
                    value={state.bookSettings.bookSize} 
                    onValueChange={(value) => setState(prev => ({
                      ...prev,
                      bookSettings: { ...prev.bookSettings, bookSize: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {KDP_TRIM_SIZES.map(size => (
                        <SelectItem key={size.value} value={size.value}>
                          {size.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Paper Type</Label>
                  <Select 
                    value={state.bookSettings.paperType} 
                    onValueChange={(value: 'white' | 'cream' | 'color') => setState(prev => ({
                      ...prev,
                      bookSettings: { ...prev.bookSettings, paperType: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAPER_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Page Count: {state.bookSettings.pageCount}</Label>
                  <Slider
                    value={[state.bookSettings.pageCount]}
                    onValueChange={(value) => setState(prev => ({
                      ...prev,
                      bookSettings: { ...prev.bookSettings, pageCount: value[0] }
                    }))}
                    max={999}
                    min={24}
                    step={1}
                    className="w-full"
                  />
                  <div className="text-xs text-zinc-400">
                    Spine width: {(state.bookSettings.pageCount * 0.002252).toFixed(3)}"
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="includeBleed"
                      checked={state.bookSettings.includeBleed}
                      onCheckedChange={(checked) => setState(prev => ({
                        ...prev,
                        bookSettings: { ...prev.bookSettings, includeBleed: checked }
                      }))}
                    />
                    <Label htmlFor="includeBleed">Include Bleed (0.125")</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="includeISBN"
                      checked={state.bookSettings.includeISBN}
                      onCheckedChange={(checked) => setState(prev => ({
                        ...prev,
                        bookSettings: { ...prev.bookSettings, includeISBN: checked }
                      }))}
                    />
                    <Label htmlFor="includeISBN">Reserve space for ISBN</Label>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={() => completeStep('settings', 'frontCover')}
                className="w-full bg-purple-600 hover:bg-purple-500"
              >
                Continue to Front Cover
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        );
        
      case 'frontCover':
        return (
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-400">
                <Sparkles className="h-6 w-6" />
                Front Cover Design (DALL·E)
              </CardTitle>
              <CardDescription>Create your front cover using DALL·E 3 AI generation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Cover Style</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {COVER_STYLES.slice(0, 8).map((style) => (
                      <Button
                        key={style.id}
                        variant={state.selectedStyle === style.id ? "default" : "outline"}
                        className={`h-16 p-3 ${state.selectedStyle === style.id ? 'bg-purple-600' : ''}`}
                        onClick={() => setState(prev => ({ ...prev, selectedStyle: style.id }))}
                      >
                        <div className="text-center">
                          <div className="text-lg mb-1">{style.emoji}</div>
                          <div className="text-xs">{style.name}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Cover Description</Label>
                  <Textarea
                    placeholder="Describe your book cover... (e.g., 'A mystical fantasy cover with a dragon silhouette against a starry sky, title in elegant golden letters')"
                    value={state.frontCoverPrompt}
                    onChange={(e) => setState(prev => ({ ...prev, frontCoverPrompt: e.target.value }))}
                    rows={4}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    onClick={generateDALLEFrontCover}
                    disabled={!state.frontCoverPrompt.trim() || isLoading.generateFrontCover}
                    className="bg-purple-600 hover:bg-purple-500 flex-1"
                  >
                    {isLoading.generateFrontCover ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating with DALL·E...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Cover
                      </>
                    )}
                  </Button>
                  
                  {state.frontCoverImage && (
                    <Button 
                      onClick={generateDALLEFrontCover}
                      variant="outline"
                      disabled={isLoading.generateFrontCover}
                    >
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      Regenerate
                    </Button>
                  )}
                </div>
                
                {state.frontCoverImage && (
                  <div className="space-y-4">
                    <div className="relative bg-zinc-800 rounded-lg p-4">
                      <img 
                        src={state.frontCoverImage} 
                        alt="Generated front cover"
                        className="w-full max-w-sm mx-auto rounded-lg shadow-lg"
                      />
                    </div>
                    
                    <Button 
                      onClick={() => completeStep('frontCover', 'backCover')}
                      className="w-full bg-purple-600 hover:bg-purple-500"
                    >
                      Continue to Back Cover
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
        
      case 'backCover':
        return (
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-400">
                <FileText className="h-6 w-6" />
                Back Cover Design (DALL·E)
              </CardTitle>
              <CardDescription>Design your back cover with custom content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="includeBackText"
                    checked={state.includeBackText}
                    onCheckedChange={(checked) => setState(prev => ({ ...prev, includeBackText: checked }))}
                  />
                  <Label htmlFor="includeBackText">Add Custom Text</Label>
                </div>
                
                {state.includeBackText && (
                  <div className="space-y-2">
                    <Label>Back Cover Text</Label>
                    <Textarea
                      placeholder="Enter your back cover text (book description, reviews, author bio, etc.)"
                      value={state.backCustomText}
                      onChange={(e) => setState(prev => ({ ...prev, backCustomText: e.target.value }))}
                      rows={6}
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="includeInteriorImages"
                    checked={state.includeInteriorImages}
                    onCheckedChange={(checked) => setState(prev => ({ ...prev, includeInteriorImages: checked }))}
                  />
                  <Label htmlFor="includeInteriorImages">Add Interior Images</Label>
                </div>
                
                {state.includeInteriorImages && (
                  <div className="space-y-2">
                    <Label>Interior Images (up to 4)</Label>
                    <div className="grid grid-cols-2 gap-4">
                      {[0, 1, 2, 3].map((index) => (
                        <div key={index} className="space-y-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (e) => {
                                  const newImages = [...state.interiorImages];
                                  newImages[index] = e.target?.result as string;
                                  setState(prev => ({ ...prev, interiorImages: newImages }));
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="bg-zinc-800 border-zinc-700"
                          />
                          {state.interiorImages[index] && (
                            <img 
                              src={state.interiorImages[index]} 
                              alt={`Interior ${index + 1}`}
                              className="w-full h-20 object-cover rounded"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {(state.includeBackText || state.includeInteriorImages) && (
                  <>
                    <Button 
                      onClick={generateBackPromptPreview}
                      disabled={isLoading.generateSmartPrompt}
                      variant="outline"
                      className="w-full"
                    >
                      {isLoading.generateSmartPrompt ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating Prompt...
                        </>
                      ) : (
                        <>
                          <Brain className="mr-2 h-4 w-4" />
                          Generate Prompt
                        </>
                      )}
                    </Button>
                    
                    {state.generatedBackPrompt && (
                      <div className="space-y-2">
                        <Label>Generated Prompt (editable)</Label>
                        <Textarea
                          value={state.generatedBackPrompt}
                          onChange={(e) => setState(prev => ({ ...prev, generatedBackPrompt: e.target.value }))}
                          rows={4}
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>
                    )}
                    
                    <Button 
                      onClick={generateDALLEBackCover}
                      disabled={isLoading.generateBackCover || !state.generatedBackPrompt}
                      className="w-full bg-purple-600 hover:bg-purple-500"
                    >
                      {isLoading.generateBackCover ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating with DALL·E...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate Back Cover
                        </>
                      )}
                    </Button>
                  </>
                )}
                
                {state.backCoverImage && (
                  <div className="space-y-4">
                    <div className="relative bg-zinc-800 rounded-lg p-4">
                      <img 
                        src={state.backCoverImage} 
                        alt="Generated back cover"
                        className="w-full max-w-sm mx-auto rounded-lg shadow-lg"
                      />
                    </div>
                    
                    <Button 
                      onClick={() => completeStep('backCover', 'spine')}
                      className="w-full bg-purple-600 hover:bg-purple-500"
                    >
                      Continue to Spine Design
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
        
      case 'spine':
        return (
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-400">
                <Ruler className="h-6 w-6" />
                Spine Design
              </CardTitle>
              <CardDescription>Design the spine of your book</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Spine Text (optional)</Label>
                  <Input
                    placeholder="Book title and author name"
                    value={state.spineText}
                    onChange={(e) => setState(prev => ({ ...prev, spineText: e.target.value }))}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Spine Color</Label>
                  {state.extractedColors.length > 0 ? (
                    <>
                      <p className="text-xs text-emerald-400 mb-2">
                        🎨 Colors extracted from your front and back covers:
                      </p>
                      <div className="grid grid-cols-5 gap-2">
                        {state.extractedColors.map((color, index) => (
                          <div
                            key={color}
                            className={`w-full aspect-square rounded-md cursor-pointer transition-all hover:scale-105 ${
                              state.spineColor === color ? 'ring-2 ring-purple-400 ring-offset-2 ring-offset-zinc-900' : ''
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setState(prev => ({ ...prev, spineColor: color }))}
                            title={color}
                          />
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-zinc-400">
                      🔄 Extracting colors from your covers...
                    </div>
                  )}
                </div>
                
                <Button 
                  onClick={() => {
                    setState(prev => ({
                      ...prev,
                      steps: {
                        ...prev.steps,
                        spine: true
                      }
                    }));
                    toast.success("Spine design saved successfully!");
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-500"
                >
                  Continue to Preview
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
        
      case 'preview':
        return (
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-400">
                <Eye className="h-6 w-6" />
                Preview & Generate Full Cover
              </CardTitle>
              <CardDescription>Review your covers and generate the final wrap</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {state.frontCoverImage && (
                  <div className="space-y-2">
                    <Label>Front Cover</Label>
                    <img 
                      src={state.frontCoverImage} 
                      alt="Front cover"
                      className="w-full rounded-lg shadow-lg"
                    />
                  </div>
                )}
                
                {state.backCoverImage && (
                  <div className="space-y-2">
                    <Label>Back Cover</Label>
                    <img 
                      src={state.backCoverImage} 
                      alt="Back cover"
                      className="w-full rounded-lg shadow-lg"
                    />
                  </div>
                )}
              </div>
              
              <Button 
                onClick={generateFullCover}
                disabled={isLoading.assembleCover || !state.frontCoverImage}
                className="w-full bg-purple-600 hover:bg-purple-500"
              >
                {isLoading.assembleCover ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Full Cover...
                  </>
                ) : (
                  <>
                    <Maximize className="mr-2 h-4 w-4" />
                    Generate Full Wrap Cover
                  </>
                )}
              </Button>
              
              {state.fullCoverImage && (
                <div className="space-y-4">
                  <div className="bg-zinc-800 rounded-lg p-4">
                    <img 
                      src={state.fullCoverImage} 
                      alt="Full wrap cover"
                      className="w-full rounded-lg shadow-lg"
                    />
                  </div>
                  
                  <Button 
                    onClick={() => completeStep('preview', 'export')}
                    className="w-full bg-purple-600 hover:bg-purple-500"
                  >
                    Continue to Export
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
        
      case 'export':
        return (
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-400">
                <Download className="h-6 w-6" />
                Export Your Covers
              </CardTitle>
              <CardDescription>Download your DALL·E generated covers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {state.frontCoverImage && (
                  <Button 
                    onClick={() => downloadCoverWithExactDimensions(
                      state.frontCoverImage!, 
                      `dalle-front-cover-${Date.now()}.png`
                    )}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Front Cover
                  </Button>
                )}
                
                {state.backCoverImage && (
                  <Button 
                    onClick={() => downloadCoverWithExactDimensions(
                      state.backCoverImage!, 
                      `dalle-back-cover-${Date.now()}.png`
                    )}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Back Cover
                  </Button>
                )}
                
                {state.fullCoverImage && (
                  <Button 
                    onClick={() => downloadCoverWithExactDimensions(
                      state.fullCoverImage!, 
                      `dalle-full-cover-${Date.now()}.png`
                    )}
                    className="w-full bg-purple-600 hover:bg-purple-500"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Full Cover
                  </Button>
                )}
              </div>
              
              {state.fullCoverImage && (
                <div className="bg-zinc-800 rounded-lg p-4">
                  <img 
                    src={state.fullCoverImage} 
                    alt="Final full cover"
                    className="w-full rounded-lg shadow-lg"
                  />
                </div>
              )}
              
              <div className="text-center">
                <Button 
                  onClick={() => {
                    setState(prev => ({
                      ...prev,
                      steps: {
                        ...prev.steps,
                        export: true
                      }
                    }));
                    toast.success("Project completed! Your DALL·E covers are ready for KDP.");
                  }}
                  className="bg-green-600 hover:bg-green-500"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Project Complete
                </Button>
              </div>
            </CardContent>
          </Card>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
          DALL·E Book Cover Generator
        </h1>
        <p className="text-zinc-400 text-lg">
          Create professional Amazon KDP-compliant book covers with DALL·E AI
        </p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <Badge variant="secondary" className="bg-purple-900/20 text-purple-300">
            Powered by DALL·E 3
          </Badge>
          <Badge variant="secondary" className="bg-emerald-900/20 text-emerald-300">
            KDP Ready
          </Badge>
        </div>
      </div>

      {/* Feature overview */}
      <div className="flex flex-col lg:flex-row mb-12 gap-8">
        <div className="flex items-start gap-4 rounded-xl bg-zinc-900/50 border border-zinc-800 p-5">
          <div className="rounded-full bg-purple-900/30 p-3">
            <Sparkles className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-1">DALL·E Book Cover Generator</h3>
            <p className="text-zinc-400">Advanced AI-powered tool using OpenAI's DALL·E for high-quality, artistic book covers</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-full bg-purple-900/30 p-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
            </div>
            <h3 className="font-semibold text-white">DALL·E 3 Powered</h3>
          </div>
          <p className="text-zinc-400 text-sm">High-quality artistic generation</p>
        </div>
        
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-full bg-purple-900/30 p-2">
              <FileType className="h-5 w-5 text-purple-400" />
            </div>
            <h3 className="font-semibold text-white">KDP Ready</h3>
          </div>
          <p className="text-zinc-400 text-sm">Export in PDF or PNG format</p>
        </div>
        
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-full bg-purple-900/30 p-2">
              <LayoutPanelTop className="h-5 w-5 text-purple-400" />
            </div>
            <h3 className="font-semibold text-white">Full Wrap</h3>
          </div>
          <p className="text-zinc-400 text-sm">Front, back cover and spine</p>
        </div>
      </div>

      {/* Main title */}
      <h1 className="text-3xl font-bold mb-2 text-white">DALL·E KDP Cover Designer</h1>
      <p className="text-zinc-400 mb-8">
        Create professional, print-ready covers for Kindle Direct Publishing using OpenAI's DALL·E technology.
      </p>
      
      {/* Simple Getting Started Interface */}
      <div className="bg-zinc-900/80 rounded-lg shadow-lg p-6 border border-zinc-800">
        <div className="text-center py-12">
          <Sparkles className="h-16 w-16 mx-auto mb-4 text-purple-400" />
          <h2 className="text-2xl font-semibold text-white mb-4">Ready to Create with DALL·E!</h2>
          <p className="text-zinc-400 mb-6">
            The DALL·E KDP Cover Designer is ready to use. We're implementing the step-by-step interface.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
            <Button className="bg-purple-600 hover:bg-purple-500">
              <BookOpen className="mr-2 h-4 w-4" />
              Start Front Cover
            </Button>
            <Button variant="outline" className="border-purple-600 text-purple-400 hover:bg-purple-600/10">
              <Settings className="mr-2 h-4 w-4" />
              Configure Settings
            </Button>
          </div>
          <div className="mt-8 space-y-2 text-sm text-zinc-500">
            <p>✅ DALL·E 3 integration active</p>
            <p>✅ Same workflow as Ideogram version</p>
            <p>✅ Intelligent spine color extraction</p>
            <p>✅ Full wrap cover generation</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        {renderStep()}
      </div>
    </div>
  );
};

export default DALLKDPCoverDesigner; 