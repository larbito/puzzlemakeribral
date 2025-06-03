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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  // DALL·E specific front cover generation function
  const generateDALLEFrontCover = async () => {
    setIsLoading({...isLoading, generateFrontCover: true});
    
    try {
      console.log('🎨 Generating front cover with DALL·E...');
      
      const selectedStyleObj = COVER_STYLES.find(s => s.id === state.selectedStyle);
      const stylePrompt = selectedStyleObj ? selectedStyleObj.prompt : '';
      
      // Enhanced prompt for DALL·E
      const dallePrompt = `${state.frontCoverPrompt}. ${stylePrompt}. Professional book cover design, flat 2D layout, no 3D effects, clean typography placement, print-ready design, ${state.bookSettings.bookSize} aspect ratio`;
      
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

  // Add the rest of the component here - this is just the beginning
  // I'll continue with the remaining functions and JSX...

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
      
      {/* Coming soon placeholder - we'll implement the full component */}
      <div className="bg-zinc-900/80 rounded-lg shadow-lg p-6 border border-zinc-800">
        <div className="text-center py-12">
          <Sparkles className="h-16 w-16 mx-auto mb-4 text-purple-400" />
          <h2 className="text-2xl font-semibold text-white mb-4">DALL·E Integration Coming Soon</h2>
          <p className="text-zinc-400 mb-6">
            We're building the DALL·E version of the KDP Cover Designer with all the same features.
          </p>
          <div className="space-y-2 text-sm text-zinc-500">
            <p>✅ Same KDP-compliant workflow</p>
            <p>✅ Intelligent spine color extraction</p>
            <p>✅ Full wrap cover generation</p>
            <p>✅ DALL·E 3 image generation</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DALLKDPCoverDesigner; 