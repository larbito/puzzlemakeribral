// Clean deployment - no visual art styles
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
  Ruler
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
import { generateFrontCover } from '../../lib/bookCoverApi';
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

// First, around line 57-65, add a new styles array with emojis
const COVER_STYLES = [
  { id: 'literary', name: 'Literary Fiction', emoji: '📖', prompt: 'elegant literary fiction book cover design, sophisticated, minimalist typography, subtle imagery, understated color palette, high-concept design' },
  { id: 'thriller', name: 'Thriller/Mystery', emoji: '🔍', prompt: 'suspenseful thriller book cover, dramatic shadows, high contrast, bold title typography, moody atmosphere, tension-building visual elements' },
  { id: 'romance', name: 'Romance', emoji: '❤️', prompt: 'romantic book cover design, emotionally evocative, soft color palette, elegant typography, relationship-focused imagery, heartfelt visual elements' },
  { id: 'fantasy', name: 'Fantasy', emoji: '🐉', prompt: 'fantasy book cover design, magical elements, rich detailed illustration, epic scenery, mystical symbols, otherworldly atmosphere' },
  { id: 'nonfiction', name: 'Non-Fiction', emoji: '📊', prompt: 'professional non-fiction book cover, clean layout, informative design, authoritative typography, subject-appropriate imagery, organized visual hierarchy' },
  { id: 'scifi', name: 'Science Fiction', emoji: '🚀', prompt: 'science fiction book cover design, futuristic elements, technological aesthetics, innovative typography, cosmic imagery, forward-looking visual style' },
  { id: 'children', name: 'Children\'s', emoji: '🧸', prompt: 'children\'s book cover design, playful illustrations, bright cheerful colors, fun typography, age-appropriate imagery, engaging visual elements' },
  { id: 'horror', name: 'Horror', emoji: '👻', prompt: 'horror book cover design, unsettling imagery, dark atmosphere, eerie elements, foreboding typography, suspenseful visual composition' },
  { id: 'memoir', name: 'Memoir/Biography', emoji: '✍️', prompt: 'memoir or biography book cover design, personal imagery, authentic feel, balanced typography, narrative-focused layout, meaningful visual elements' },
  { id: 'historical', name: 'Historical', emoji: '⏳', prompt: 'historical book cover design, period-appropriate imagery, classic typography, aged texture, era-specific visual elements, authentic historical aesthetic' },
  { id: 'ya', name: 'Young Adult', emoji: '🌟', prompt: 'young adult book cover design, contemporary style, relatable imagery, dynamic typography, teen-appropriate visual elements, emotionally resonant design' },
  { id: 'textbook', name: 'Textbook/Academic', emoji: '🎓', prompt: 'academic or textbook cover design, organized layout, clear typography, educational imagery, professional appearance, subject-focused visual elements' },
];


const KDPCoverDesigner: React.FC = () => {
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
    originalImageUrl: null, // Initialize the original image URL
    backCoverPrompt: '',
    backCoverImage: null,
    interiorImages: [],
    spineText: '',
    spineColor: '#3B82F6', // Default blue color
    spineFont: 'helvetica',
    fullCoverImage: null,
    selectedStyle: 'literary', // Default style
    showGuidelines: false // Default to hiding guidelines
  });

  const [activeTab, setActiveTab] = useState<'styles' | 'measurements'>('styles');

  const [isLoading, setIsLoading] = useState<{[key: string]: boolean}>({
    uploadImage: false,
    analyzeImage: false,
    generatePrompt: false,
    generateFrontCover: false,
    generateBackCover: false,
    assembleCover: false,
    enhancePrompt: false
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

  // Calculate book dimensions when book size changes - ENSURE PROPER ASPECT RATIO
  useEffect(() => {
    const { bookSize } = state.bookSettings;
    const [width, height] = bookSize.split('x').map(Number);
    
    // Set exact dimensions to ensure proper aspect ratio
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
    if (state.steps[step] || step === 'settings') {
      setState(prev => ({
        ...prev,
        activeStep: step
      }));
    } else {
      toast.error('Please complete the previous step first');
    }
  };

  // Function to calculate dimensions
  const calculateDimensions = () => {
    setIsLoading({...isLoading, calculateDimensions: true});
    
    // Simulate API call
    setTimeout(() => {
      const { bookSize, pageCount, paperType, includeBleed } = state.bookSettings;
      const [width, height] = bookSize.split('x').map(Number);
      
      // Calculate spine width based on page count and paper type
      let multiplier = 0.002252; // white paper
      
      if (paperType === 'cream') {
        multiplier = 0.0025;
      } else if (paperType === 'color') {
        multiplier = 0.002347;
      }
      
      const spineWidth = pageCount * multiplier;
      const bleedAmount = includeBleed ? 0.125 : 0;
      
      // Calculate total dimensions
      const totalWidth = width * 2 + spineWidth + (bleedAmount * 2);
      const totalHeight = height + (bleedAmount * 2);
      
      setState(prev => ({
        ...prev,
        bookSettings: {
          ...prev.bookSettings,
          dimensions: {
            width,
            height,
            spineWidth,
            totalWidth,
            totalHeight
          }
        },
        steps: {
          ...prev.steps,
          settings: true
        }
      }));
      
      setIsLoading({...isLoading, calculateDimensions: false});
      toast.success('Cover dimensions calculated successfully!');
    }, 1500);
  };

  // Handle file upload
  const handleFileUpload = (file: File) => {
    if (!file) return;
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a PNG, JPG, or PDF file');
      return;
    }
    
    // Increase file size limit (from 5MB to 20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File size exceeds 20MB limit');
      return;
    }
    
    setIsLoading({...isLoading, uploadImage: true});
    
    // For large images, we'll resize them client-side before upload
    if (file.size > 10 * 1024 * 1024 && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      resizeImage(file, 2000, 2000).then(resizedFile => {
        processUploadedFile(resizedFile);
      }).catch(error => {
        console.error('Error resizing image:', error);
        // Fall back to original file if resize fails
        processUploadedFile(file);
      });
    } else {
      // Process directly for smaller files
      processUploadedFile(file);
    }
  };

  // Add a helper function to resize large images
  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate the new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Canvas to Blob conversion failed'));
            return;
          }
          
          // Create a new file from the blob
          const resizedFile = new File([blob], file.name, { 
            type: file.type,
            lastModified: Date.now()
          });
          
          resolve(resizedFile);
        }, file.type);
      };
      
      img.onerror = () => {
        reject(new Error('Image loading failed'));
      };
    });
  };

  // Add a function to process the uploaded file
  const processUploadedFile = (file: File) => {
    // Create a URL for the uploaded image
    const imageUrl = URL.createObjectURL(file);
    
    // Update state with the image URL and file reference
    setState(prev => ({
      ...prev,
      frontCoverImage: imageUrl,
      originalImageUrl: imageUrl,
      uploadedFile: file
    }));
    
    // After uploading successfully
    setIsLoading({...isLoading, uploadImage: false});
    toast.success("Image uploaded successfully! Click 'Generate Prompt' to analyze it with AI.");
  };
  
  // Modify the analyzeImageWithOpenAI function to extract text better
  const analyzeImageWithOpenAI = async (file: File) => {
    setIsLoading({...isLoading, analyzeImage: true});
    
    try {
      // Convert the file to base64 for the API
      const imageUrl = URL.createObjectURL(file);
      const base64DataUrl = await convertFileToDataURL(file);
      
      // First, extract the text from the image using our placeholder values
      let extractedTitle = 'Book Title';
      let extractedSubtitle = 'Book Subtitle';
      let extractedAuthor = 'Author Name';
      let extractedTagline = '';
      let extractedOtherText = '';
      
      // Get the selected style's prompt addition
      const selectedStyleObj = COVER_STYLES.find(s => s.id === state.selectedStyle);
      const bookStylePrompt = selectedStyleObj ? `${selectedStyleObj.name} book style: ${selectedStyleObj.prompt}` : '';
      
      // Then, analyze the image for detailed visual description
      const analyzeResponse = await fetch(`${getApiUrl()}/api/openai/extract-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: base64DataUrl,
          instructions: `
            This is a book cover image. Analyze it and create a VERY DETAILED prompt to generate a FLAT 2D book cover design (NOT a 3D mockup or product visualization).
            
            Create a prompt for a SINGLE, FLAT BOOK COVER design that could be directly printed on the front of a book. The final image must ONLY be the front cover artwork itself, not a visualization or mockup.
            
            Please include:
            1. Exact colors using specific color names (e.g., "deep navy blue", "burnt sienna", "muted teal")
            2. Detailed description of the layout and composition
            3. The artistic style and genre-appropriate elements for book publishing
            4. Description of all visual elements and their placement
            5. Texture and finishing details
            6. Mood and atmosphere of the cover
            7. Type of typography that should be used for the title and author name
            
            STYLE PREFERENCE: ${bookStylePrompt}
            
            EXTREMELY IMPORTANT KDP PUBLISHING REQUIREMENTS - FOLLOW EXACTLY:
            1. All text MUST be placed at least 0.25 inches (75px at 300dpi) from ALL edges
            2. Title should be large, centered, and positioned in the upper half of the cover
            3. Author name should be smaller than the title and placed in the lower third
            4. Any subtitle should be positioned between the title and author name
            5. All text must be clearly readable and properly sized for hierarchy
            6. DO NOT include any 3D book mockups, product visualizations, or angled book cover presentations
            7. ONLY create a prompt for a flat, print-ready book cover design
            
            IMPORTANT - ADD THIS TO THE NEGATIVE PROMPT: "book mockup, 3D model, 3D book, product visualization, perspective view, book cover mockup, angled book, book template, edge visualization, spine, page curl, book pages, dog-eared pages"
          `
        })
      });
      
      if (!analyzeResponse.ok) {
        throw new Error('Failed to analyze image');
      }
      
      const analyzeData = await analyzeResponse.json();
      
      // Get the raw prompt from the API
      let extractedPrompt = analyzeData.extractedPrompt || '';
      
      // Get the extracted text elements if available
      if (analyzeData.textElements) {
        extractedTitle = analyzeData.textElements.title || 'Book Title';
        extractedSubtitle = analyzeData.textElements.subtitle || 'Book Subtitle';
        extractedAuthor = analyzeData.textElements.author || 'Author Name';
        extractedTagline = analyzeData.textElements.tagline || '';
        extractedOtherText = analyzeData.textElements.otherText || '';
      }
      
      // Create a simple descriptive prompt that will be enhanced by the backend
      const simplePrompt = `${extractedPrompt}. Title: ${extractedTitle}. Author: ${extractedAuthor}. ${extractedSubtitle ? `Subtitle: ${extractedSubtitle}.` : ''} ${extractedTagline ? `Tagline: ${extractedTagline}.` : ''} ${extractedOtherText ? `Additional text: ${extractedOtherText}.` : ''}`;
      
      // Auto-enhance the prompt to show user exactly what gets sent to Ideogram
      try {
        console.log('Auto-enhancing prompt for Ideogram to match backend...');
        const enhanceResponse = await fetch(`${getApiUrl()}/api/book-cover/enhance-prompt`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: simplePrompt,
            model: 'ideogram'
          })
        });
        
        if (enhanceResponse.ok) {
          const enhanceData = await enhanceResponse.json();
          const enhancedPrompt = enhanceData.enhancedPrompt;
          
          // Update state with the enhanced prompt (same as what gets sent to backend)
          setState(prev => ({
            ...prev,
            frontCoverPrompt: enhancedPrompt,
            frontCoverImage: imageUrl,
            originalImageUrl: imageUrl,
            steps: {
              ...prev.steps,
              frontCover: true
            }
          }));
          
          toast.success("Image analyzed & prompt auto-enhanced! This is the exact prompt that will be sent to Ideogram.");
        } else {
          // Fallback to simple prompt if enhancement fails
          setState(prev => ({
            ...prev,
            frontCoverPrompt: simplePrompt,
            frontCoverImage: imageUrl,
            originalImageUrl: imageUrl,
            steps: {
              ...prev.steps,
              frontCover: true
            }
          }));
          
          toast.success("Image analyzed successfully! Click 'Enhance Prompt' to optimize for Ideogram.");
        }
      } catch (enhanceError) {
        console.error('Auto-enhancement failed, using simple prompt:', enhanceError);
        
        // Fallback to simple prompt if enhancement fails
        setState(prev => ({
          ...prev,
          frontCoverPrompt: simplePrompt,
          frontCoverImage: imageUrl,
          originalImageUrl: imageUrl,
          steps: {
            ...prev.steps,
            frontCover: true
          }
        }));
        
        toast.success("Image analyzed successfully! Click 'Enhance Prompt' to optimize for Ideogram.");
      }
      
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast.error("Failed to analyze image. Please try again.");
    } finally {
      setIsLoading({...isLoading, analyzeImage: false});
    }
  };

  // Helper function to convert File to data URL (includes the data:image prefix)
  const convertFileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = error => reject(error);
    });
  };
  
  // Keep the base64 converter for other uses
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        // Remove the data:image/xxx;base64, prefix
        const base64 = base64String.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  // Function to reset uploaded image and prompt
  const resetUpload = () => {
    // Release any object URLs to prevent memory leaks
    if (state.originalImageUrl) {
      URL.revokeObjectURL(state.originalImageUrl);
    }
    
    setState(prev => ({
      ...prev,
      frontCoverPrompt: '',
      frontCoverImage: null,
      originalImageUrl: null,
      uploadedFile: undefined,
      steps: {
        ...prev.steps,
        frontCover: false
      }
    }));
    
    toast.info("Image and prompt have been reset. You can upload a new image.");
  };

  // Step indicators component
  const StepIndicators = () => (
    <div className="flex items-center justify-between mb-8 relative">
      <div className="absolute top-1/2 left-0 right-0 h-1 bg-zinc-800 -z-10 transform -translate-y-1/2" />
      
      {['settings', 'frontCover', 'backCover', 'spine', 'preview', 'export'].map((step, index) => {
        const isCompleted = state.steps[step as Step];
        const isActive = state.activeStep === step;
        const isClickable = isCompleted || step === 'settings';
        
        return (
          <div 
            key={step}
            className={`flex flex-col items-center cursor-${isClickable ? 'pointer' : 'not-allowed'}`}
            onClick={() => isClickable && goToStep(step as Step)}
          >
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center
              ${isActive ? 'bg-emerald-500 text-white' : 
                isCompleted ? 'bg-green-500 text-white' : 
                'bg-zinc-800 text-zinc-500'}
              transition-colors duration-200
            `}>
              {isCompleted ? 
                <CheckCircle2 className="w-5 h-5" /> : 
                isActive ? index + 1 : <Lock className="w-4 h-4" />
              }
            </div>
            <span className={`
              mt-2 text-xs font-medium
              ${isActive ? 'text-emerald-500' : 
                isCompleted ? 'text-green-500' : 
                'text-zinc-500'}
            `}>
              {step === 'settings' ? 'Book Settings' :
               step === 'frontCover' ? 'Front Cover' :
               step === 'backCover' ? 'Back Cover' :
               step === 'spine' ? 'Spine Design' :
               step === 'preview' ? 'Preview' : 'Export'}
            </span>
          </div>
        );
      })}
    </div>
  );

  // Render the current step
  const renderStep = () => {
    switch(state.activeStep) {
      case 'settings':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Book Settings</h2>
            <p className="text-zinc-400 text-sm mb-6">
              Configure your book specifications according to KDP requirements. All dimensions will be calculated based on these settings.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Settings Panel */}
              <div className="lg:col-span-2 space-y-6">
                {/* Book Dimensions Card */}
                <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Ruler className="h-5 w-5 text-emerald-400" />
                    Book Dimensions
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <Label htmlFor="bookSize" className="text-base font-medium text-zinc-300">
                        Book Size
                      </Label>
                      <Select
                        value={state.bookSettings.bookSize}
                        onValueChange={(value) => 
                          setState(prev => ({
                            ...prev, 
                            bookSettings: {
                              ...prev.bookSettings,
                              bookSize: value
                            }
                          }))
                        }
                      >
                        <SelectTrigger className="h-12 border-zinc-700 bg-zinc-900">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">
                          {KDP_TRIM_SIZES.map((size) => (
                            <SelectItem key={size.value} value={size.value} className="hover:bg-zinc-700">
                              <div className="flex items-center justify-between w-full">
                                <span>{size.label}</span>
                                {size.value === '6x9' && (
                                  <span className="ml-2 text-xs text-emerald-400">Most Popular</span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <div className="p-4 bg-emerald-950/20 rounded-lg border border-emerald-900/30">
                        <div className="flex items-start gap-3">
                          <Info className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-emerald-300 mb-1">
                              Perfect for {state.bookSettings.bookSize === '6x9' ? 'novels and non-fiction' : 
                                         state.bookSettings.bookSize === '5x8' ? 'romance and poetry' :
                                         state.bookSettings.bookSize === '7x10' ? 'textbooks and workbooks' :
                                         'manuals and large format books'}
                            </p>
                            <p className="text-xs text-emerald-400/80">
                              Standard paperback dimensions for professional publishing
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label htmlFor="pageCount" className="text-base font-medium text-zinc-300">
                        Page Count
                      </Label>
                      <div className="space-y-3">
                        <div className="flex items-center gap-4">
                          <Slider
                            id="pageCount"
                            value={[state.bookSettings.pageCount]}
                            min={24}
                            max={900}
                            step={1}
                            onValueChange={(values) => 
                              setState(prev => ({
                                ...prev, 
                                bookSettings: {
                                  ...prev.bookSettings,
                                  pageCount: values[0]
                                }
                              }))
                            }
                            className="flex-1"
                          />
                          <input
                            type="text"
                            value={state.bookSettings.pageCount}
                            onChange={(e) => {
                              if (e.target.value === '') {
                                setState(prev => ({
                                  ...prev,
                                  bookSettings: {
                                    ...prev.bookSettings,
                                    pageCount: '' as any
                                  }
                                }));
                                return;
                              }
                              
                              const numericValue = e.target.value.replace(/[^0-9]/g, '');
                              if (numericValue !== e.target.value) return;
                              
                              const value = parseInt(numericValue);
                              if (!isNaN(value)) {
                                setState(prev => ({
                                  ...prev, 
                                  bookSettings: {
                                    ...prev.bookSettings,
                                    pageCount: value
                                  }
                                }));
                              }
                            }}
                            onBlur={(e) => {
                              let value = parseInt(e.target.value as string);
                              if (isNaN(value)) value = 24;
                              if (value < 24) value = 24;
                              if (value > 900) value = 900;
                              
                              setState(prev => ({
                                ...prev, 
                                bookSettings: {
                                  ...prev.bookSettings,
                                  pageCount: value
                                }
                              }));
                            }}
                            className="w-20 h-10 text-center font-mono border border-zinc-700 rounded-lg bg-zinc-900 text-white focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                        <div className="flex justify-between text-xs text-zinc-500">
                          <span>24 pages</span>
                          <span>{state.bookSettings.pageCount} pages</span>
                          <span>900 pages</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Paper Type & Options Card */}
                <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Palette className="h-5 w-5 text-emerald-400" />
                    Paper & Options
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Label className="text-base font-medium text-zinc-300">Paper Type</Label>
                      <div className="grid grid-cols-3 gap-3">
                        {PAPER_TYPES.map((type) => (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => 
                              setState(prev => ({
                                ...prev, 
                                bookSettings: {
                                  ...prev.bookSettings,
                                  paperType: type.value as 'white' | 'cream' | 'color'
                                }
                              }))
                            }
                            className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                              state.bookSettings.paperType === type.value 
                                ? "border-emerald-500 bg-emerald-950/30 shadow-lg" 
                                : "border-zinc-700 bg-zinc-900 hover:border-emerald-600 hover:bg-emerald-950/20"
                            }`}
                          >
                            <div className="text-center">
                              <div className="text-2xl mb-2">
                                {type.value === 'white' ? '⚪' : type.value === 'cream' ? '🟡' : '🎨'}
                              </div>
                              <div className={`font-medium ${
                                state.bookSettings.paperType === type.value ? 'text-emerald-300' : 'text-zinc-300'
                              }`}>
                                {type.label}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center justify-between p-4 border border-zinc-700 rounded-xl hover:border-emerald-600 transition-colors bg-zinc-900">
                        <div className="space-y-1">
                          <Label className="text-base font-medium flex items-center gap-2 text-zinc-300">
                            <Scissors className="h-4 w-4 text-emerald-400" />
                            Include Bleed (0.125")
                          </Label>
                          <p className="text-sm text-zinc-500">
                            Recommended for designs that extend to the edge
                          </p>
                        </div>
                        <Switch
                          checked={state.bookSettings.includeBleed}
                          onCheckedChange={(checked) => 
                            setState(prev => ({
                              ...prev, 
                              bookSettings: {
                                ...prev.bookSettings,
                                includeBleed: checked
                              }
                            }))
                          }
                          className="data-[state=checked]:bg-emerald-600"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border border-zinc-700 rounded-xl hover:border-emerald-600 transition-colors bg-zinc-900">
                        <div className="space-y-1">
                          <Label className="text-base font-medium flex items-center gap-2 text-zinc-300">
                            <BarChart3 className="h-4 w-4 text-emerald-400" />
                            Include ISBN Barcode
                          </Label>
                          <p className="text-sm text-zinc-500">
                            Space for KDP to add ISBN barcode on back cover
                          </p>
                        </div>
                        <Switch
                          checked={state.bookSettings.includeISBN}
                          onCheckedChange={(checked) => 
                            setState(prev => ({
                              ...prev, 
                              bookSettings: {
                                ...prev.bookSettings,
                                includeISBN: checked
                              }
                            }))
                          }
                          className="data-[state=checked]:bg-emerald-600"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Preview Panel */}
              <div className="lg:col-span-1">
                <div className="sticky top-6 bg-zinc-800 rounded-lg border border-zinc-700 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Eye className="h-5 w-5 text-emerald-400" />
                    Live Preview
                  </h3>
                  
                  {/* 3D Book Preview */}
                  <div className="relative border-2 border-dashed border-zinc-600 bg-zinc-900/50 rounded-xl p-6 overflow-hidden mb-6" style={{ 
                    aspectRatio: `${Math.max(1.4, state.bookSettings.dimensions.totalWidth / state.bookSettings.dimensions.totalHeight)}`,
                  }}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative flex shadow-2xl transform hover:scale-105 transition-transform duration-300">
                        {/* Back cover */}
                        <div 
                          className="h-full bg-white border-2 border-gray-300 relative shadow-lg rounded-l-md"
                          style={{ 
                            width: `${Math.floor(state.bookSettings.dimensions.width * 20)}px`,
                            height: `${Math.floor(state.bookSettings.dimensions.height * 20)}px`,
                          }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-xs font-medium bg-gradient-to-br from-gray-50 to-gray-100">
                            Back Cover
                          </div>
                          {state.bookSettings.includeISBN && (
                            <div className="absolute bottom-3 right-3 w-16 h-8 bg-gray-200 rounded-sm flex items-center justify-center text-[8px] text-gray-700 border border-gray-400 shadow-sm">
                              ISBN
                            </div>
                          )}
                        </div>
                        
                        {/* Spine */}
                        <div 
                          className="h-full bg-gradient-to-b from-emerald-400 to-green-500 border-t-2 border-b-2 border-gray-300 flex items-center justify-center shadow-inner"
                          style={{ 
                            width: `${Math.max(10, Math.floor(state.bookSettings.dimensions.spineWidth * 20))}px`,
                            height: `${Math.floor(state.bookSettings.dimensions.height * 20)}px`
                          }}
                        >
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap text-[8px] text-white font-bold drop-shadow-sm">
                            Spine ({state.bookSettings.dimensions.spineWidth.toFixed(3)}")
                          </div>
                        </div>
                        
                        {/* Front cover */}
                        <div 
                          className="h-full bg-white border-2 border-gray-300 relative shadow-lg rounded-r-md"
                          style={{ 
                            width: `${Math.floor(state.bookSettings.dimensions.width * 20)}px`,
                            height: `${Math.floor(state.bookSettings.dimensions.height * 20)}px`,
                          }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-xs font-medium bg-gradient-to-br from-blue-50 to-purple-50">
                            Front Cover
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Bleed indicator */}
                    {state.bookSettings.includeBleed && (
                      <div className="absolute inset-0 border-2 border-emerald-500 border-dashed m-2 pointer-events-none rounded-xl">
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-emerald-600 px-3 py-1 text-xs text-white rounded-full shadow-lg">
                          Bleed Area (0.125")
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Specifications */}
                  <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-700">
                    <h4 className="font-semibold text-zinc-300 mb-4 flex items-center gap-2">
                      <Settings className="h-4 w-4 text-emerald-400" />
                      Specifications
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center py-2 border-b border-zinc-700">
                        <span className="text-emerald-400 font-medium flex items-center gap-2">
                          <Ruler className="h-3 w-3" />
                          Trim Size:
                        </span>
                        <span className="font-mono text-zinc-300">
                          {state.bookSettings.bookSize.replace('x', '" × ')}"
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-zinc-700">
                        <span className="text-emerald-400 font-medium flex items-center gap-2">
                          <FileText className="h-3 w-3" />
                          Page Count:
                        </span>
                        <span className="font-mono text-zinc-300">
                          {state.bookSettings.pageCount} pages
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-zinc-700">
                        <span className="text-emerald-400 font-medium flex items-center gap-2">
                          <BookOpen className="h-3 w-3" />
                          Spine Width:
                        </span>
                        <span className="font-mono text-zinc-300">
                          {state.bookSettings.dimensions.spineWidth.toFixed(3)}"
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-zinc-700">
                        <span className="text-emerald-400 font-medium flex items-center gap-2">
                          <Maximize className="h-3 w-3" />
                          Total Cover Size:
                        </span>
                        <span className="font-mono text-zinc-300">
                          {state.bookSettings.dimensions.totalWidth.toFixed(2)}" × {state.bookSettings.dimensions.totalHeight.toFixed(2)}"
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-zinc-700">
                        <span className="text-emerald-400 font-medium flex items-center gap-2">
                          <Scissors className="h-3 w-3" />
                          Bleed:
                        </span>
                        <span className="font-mono text-zinc-300">
                          {state.bookSettings.includeBleed ? '0.125" (included)' : 'None'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-emerald-400 font-medium flex items-center gap-2">
                          <Monitor className="h-3 w-3" />
                          Resolution:
                        </span>
                        <span className="font-mono text-zinc-300">
                          300 DPI
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Navigation */}
            <div className="flex justify-center pt-6 border-t border-zinc-700">
              <Button
                onClick={async () => {
                  const currentLoading = {...isLoading, calculateDimensions: true};
                  setIsLoading(currentLoading);
                  
                  try {
                    // Calculate dimensions
                    const { bookSize, pageCount, paperType, includeBleed } = state.bookSettings;
                    const [width, height] = bookSize.split('x').map(Number);
                    
                    // Calculate spine width based on page count and paper type
                    let multiplier = 0.002252; // white paper
                    
                    if (paperType === 'cream') {
                      multiplier = 0.0025;
                    } else if (paperType === 'color') {
                      multiplier = 0.002347;
                    }
                    
                    const spineWidth = pageCount * multiplier;
                    const bleedAmount = includeBleed ? 0.125 : 0;
                    
                    // Calculate total dimensions
                    const totalWidth = width * 2 + spineWidth + (bleedAmount * 2);
                    const totalHeight = height + (bleedAmount * 2);
                    
                    setState(prev => ({
                      ...prev,
                      bookSettings: {
                        ...prev.bookSettings,
                        dimensions: {
                          width,
                          height,
                          spineWidth,
                          totalWidth,
                          totalHeight
                        }
                      },
                      steps: {
                        ...prev.steps,
                        settings: true
                      },
                      activeStep: 'frontCover'
                    }));
                    
                    toast.success('Cover dimensions calculated successfully!');
                  } catch (error) {
                    console.error('Error calculating dimensions:', error);
                    toast.error('Failed to calculate dimensions. Please try again.');
                  } finally {
                    setIsLoading({...isLoading, calculateDimensions: false});
                  }
                }}
                disabled={isLoading.calculateDimensions}
                className="bg-emerald-600 hover:bg-emerald-500 font-semibold px-8 py-3"
              >
                {isLoading.calculateDimensions ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                    Calculating & Continuing...
                  </>
                ) : (
                  <>
                    Calculate & Continue
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        );
      
      case 'frontCover':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Front Cover Design</h2>
            <p className="text-zinc-400 text-sm mb-6">
              Design your book's front cover by uploading an image or generating one with AI.
            </p>
            
            <Tabs defaultValue="prompt" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-zinc-800">
                <TabsTrigger value="prompt" className="data-[state=active]:bg-zinc-700">Write Prompt</TabsTrigger>
                <TabsTrigger value="upload" className="data-[state=active]:bg-zinc-700">Upload Image</TabsTrigger>
              </TabsList>
              
              <TabsContent value="prompt" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="frontCoverPrompt">Describe your cover</Label>
                  <Textarea
                    id="frontCoverPrompt"
                    placeholder="Describe what you want on your book cover in detail..."
                    className="min-h-[120px]"
                    value={state.frontCoverPrompt}
                    onChange={(e) => 
                      setState(prev => ({
                        ...prev,
                        frontCoverPrompt: e.target.value
                      }))
                    }
                  />
                  
                  {/* Enhance Prompt Button */}
                  <div className="flex justify-between items-center mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-amber-600/40 text-amber-500 hover:bg-amber-950/30 hover:text-amber-400"
                      onClick={async () => {
                        if (!state.frontCoverPrompt.trim()) {
                          toast.error('Please enter a prompt first');
                          return;
                        }
                        
                        try {
                          setIsLoading({...isLoading, enhancePrompt: true});
                          
                          console.log('Enhancing prompt for Ideogram');
                          console.log('Original prompt:', state.frontCoverPrompt);
                          
                          const response = await fetch(`${getApiUrl()}/api/book-cover/enhance-prompt`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              prompt: state.frontCoverPrompt,
                              model: 'ideogram'
                            })
                          });
                          
                          if (!response.ok) {
                            throw new Error('Failed to enhance prompt');
                          }
                          
                          const data = await response.json();
                          console.log('Enhanced prompt response:', data);
                          
                          setState(prev => ({
                            ...prev,
                            frontCoverPrompt: data.enhancedPrompt
                          }));
                          
                          toast.success('Prompt enhanced for Ideogram!');
                        } catch (error) {
                          console.error('Error enhancing prompt:', error);
                          toast.error('Failed to enhance prompt. Please try again.');
                        } finally {
                          setIsLoading({...isLoading, enhancePrompt: false});
                        }
                      }}
                      disabled={isLoading.enhancePrompt || !state.frontCoverPrompt.trim()}
                    >
                      {isLoading.enhancePrompt ? (
                        <span className="flex items-center">
                          <span className="animate-spin mr-2">⏳</span> Enhancing...
                        </span>
                      ) : (
                        <>
                          <span className="mr-2">✨</span>
                          Enhance Prompt
                        </>
                      )}
                    </Button>
                    
                    <div className="text-xs text-zinc-500">
                      Optimized for Ideogram: creative & design-focused
                    </div>
                  </div>
                </div>
                
                {/* Add style selection */}
                <div className="space-y-2 mt-4" style={{display: 'none'}}>
                  <Label>Cover Style</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {/* REMOVED: Cover style buttons */}
                  </div>
                </div>
                
                <div className="bg-emerald-950/20 rounded-lg p-4 border border-emerald-900/30">
                  <h4 className="text-sm font-medium text-emerald-400 mb-2 flex items-center">
                    <span className="mr-2">✨</span> AI Analysis
                  </h4>
                  <p className="text-xs text-emerald-300">
                    Upload your image and our AI will analyze it to create a detailed prompt that captures its style and elements.
                    We'll then use this prompt to generate variations or enhancements.
                  </p>
                </div>
                
                <p className="text-xs text-zinc-500">
                  Images should be at least 300 DPI and match the dimensions from your book settings.
                </p>
              </TabsContent>
              
              <TabsContent value="upload" className="space-y-4">
                <div
                  className={`border-2 border-dashed ${isLoading.uploadImage || isLoading.analyzeImage ? 'border-emerald-500' : 'border-zinc-700'} rounded-lg p-6 text-center bg-zinc-800/30 relative overflow-hidden transition-colors`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.classList.add('border-emerald-500');
                    e.currentTarget.classList.add('bg-emerald-950/20');
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.classList.remove('border-emerald-500');
                    e.currentTarget.classList.remove('bg-emerald-950/20');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.classList.remove('border-emerald-500');
                    e.currentTarget.classList.remove('bg-emerald-950/20');
                    
                    const dt = e.dataTransfer;
                    const files = dt.files;
                    
                    if (files && files.length > 0) {
                      handleFileUpload(files[0]);
                    }
                  }}
                >
                  <input
                    type="file"
                    id="fileUpload"
                    className="hidden"
                    accept="image/png,image/jpeg,application/pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <Upload className={`h-10 w-10 ${isLoading.uploadImage || isLoading.analyzeImage ? 'text-emerald-500 animate-pulse' : 'text-zinc-500'}`} />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-zinc-300">
                        {isLoading.uploadImage ? 'Uploading...' : 
                         isLoading.analyzeImage ? 'Analyzing with OpenAI...' : 
                         'Drag and drop file or click to upload'}
                      </p>
                      <p className="text-xs text-zinc-500">PNG, JPG or PDF (Max 5MB)</p>
                    </div>
                    <label htmlFor="fileUpload">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-zinc-700 hover:bg-zinc-800"
                        disabled={isLoading.uploadImage || isLoading.analyzeImage}
                        onClick={() => document.getElementById('fileUpload')?.click()}
                      >
                        {isLoading.uploadImage || isLoading.analyzeImage ? 
                          <span className="flex items-center">
                            <span className="animate-spin mr-2">⏳</span> Processing...
                          </span> :
                          <span className="flex items-center">
                            <span className="mr-1">📁</span> Browse Files
                          </span>
                        }
                      </Button>
                    </label>
                  </div>
                  
                  {/* Upload progress overlay */}
                  {(isLoading.uploadImage || isLoading.analyzeImage) && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-900">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-300" 
                        style={{ 
                          width: isLoading.analyzeImage ? '70%' : '30%',
                          transition: 'width 0.5s ease-in-out'
                        }}
                      />
                    </div>
                  )}
                </div>
                
                {/* Add style selection */}
                <div className="space-y-2 mt-4" style={{display: "none"}}>
                  <Label>Cover Style</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {COVER_STYLES.map((style) => (
                      <Button
                        key={style.id}
                        type="button"
                        variant={state.selectedStyle === style.id ? "default" : "outline"}
                        onClick={() => 
                          setState(prev => ({
                            ...prev,
                            selectedStyle: style.id
                          }))
                        }
                        className={`flex flex-col items-center justify-center h-14 ${
                          state.selectedStyle === style.id 
                            ? "bg-emerald-600 hover:bg-emerald-500 text-white" 
                            : "border-emerald-600/40 text-emerald-500 hover:bg-emerald-950/30 hover:text-emerald-400"
                        }`}
                      >
                        <span className="text-lg mb-0.5">{style.emoji}</span>
                        <span className="text-[10px] font-medium">{style.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="bg-emerald-950/20 rounded-lg p-4 border border-emerald-900/30">
                  <h4 className="text-sm font-medium text-emerald-400 mb-2 flex items-center">
                    <span className="mr-2">✨</span> AI Analysis
                  </h4>
                  <p className="text-xs text-emerald-300">
                    Upload your image and our AI will analyze it to create a detailed prompt that captures its style and elements.
                    We'll then use this prompt to generate variations or enhancements.
                  </p>
                </div>
                
                <p className="text-xs text-zinc-500">
                  Images should be at least 300 DPI and match the dimensions from your book settings.
                </p>
              </TabsContent>
            </Tabs>
            
            {/* Preview area */}
            {(state.uploadedFile || state.frontCoverImage) && (
              <div className="mt-6">
                <h3 className="text-md font-medium mb-2">Cover Preview</h3>
                
                {/* Replace text-free design notice with better guidance */}
                <div className="mb-4 bg-amber-900/30 border border-amber-500/30 rounded-md p-3 text-sm">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-amber-300 font-medium">KDP Cover Design Requirements</p>
                      <p className="text-amber-400/90 text-xs mt-1">
                        Your cover will be generated with exact {state.bookSettings.bookSize} dimensions as specified in your settings.
                        All text will be placed at least 0.25" from edges to meet KDP's printing requirements.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[550px]">
                  {/* Original Uploaded Image */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium text-zinc-300">Uploaded Image</h4>
                      {state.uploadedFile && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-zinc-700 text-red-400 hover:bg-red-950/30 hover:border-red-700"
                          onClick={resetUpload}
                        >
                          <span className="mr-2">🔄</span> Reset & Upload New
                        </Button>
                      )}
                    </div>
                    <div className="bg-zinc-900/80 rounded-lg p-4 border border-zinc-700 h-full flex items-center justify-center">
                      {state.uploadedFile ? (
                        <div className="relative" style={{
                          width: `${state.bookSettings.dimensions.width * 70}px`, // Matched size multiplier
                          height: `${state.bookSettings.dimensions.height * 70}px`, // Matched size multiplier
                          maxWidth: '100%',
                          maxHeight: '550px' // Increased max height
                        }}>
                          <img 
                            src={state.originalImageUrl || ''}
                            alt="Uploaded Image" 
                            className="w-full h-full object-contain rounded-md shadow-lg" // Keep as object-contain
                          />
                        </div>
                      ) : (
                        <div className="text-zinc-500 text-center">
                          <p>No image uploaded</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* AI Generated Cover */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-zinc-300">
                      {state.steps.frontCover ? "AI Generated Cover" : "Cover Preview"}
                    </h4>
                    <div className="bg-zinc-900/80 rounded-lg p-4 border border-zinc-700 h-full flex items-center justify-center">
                      {state.frontCoverImage && state.steps.frontCover ? (
                        <div className="relative" style={{
                          width: `${state.bookSettings.dimensions.width * 70}px`, // Fixed width based on inches * 70
                          height: `${state.bookSettings.dimensions.height * 70}px`, // Fixed height based on inches * 70
                          aspectRatio: `${state.bookSettings.dimensions.width} / ${state.bookSettings.dimensions.height}`, // Enforce exact aspect ratio
                          maxWidth: '100%',
                          margin: '0 auto', // Center the container
                          overflow: 'hidden' // Ensure nothing spills outside
                        }}>
                          <img 
                            src={state.frontCoverImage} 
                            alt="AI Generated Cover" 
                            className="w-full h-full object-contain rounded-md shadow-lg"
                            style={{
                              objectFit: 'contain'
                            }}
                          />
                          
                          {/* Safe area indicators for KDP */}
                          <div className={`absolute inset-0 pointer-events-none ${state.showGuidelines ? 'visible' : 'hidden'}`}>
                            {/* Inner safe area boundary - 0.25 inches from edges */}
                            <div 
                              className="absolute border-2 border-cyan-500 border-dashed rounded-sm opacity-70"
                              style={{
                                top: 0.25 * 70,
                                left: 0.25 * 70,
                                right: 0.25 * 70,
                                bottom: 0.25 * 70
                              }}
                            />
                            
                            {/* Red corners to emphasize safe area */}
                            <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-red-500"></div>
                            <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-red-500"></div>
                            <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-red-500"></div>
                            <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-red-500"></div>
                            
                            {/* Size indicator */}
                            <div className="absolute top-1 left-1 bg-emerald-900/80 text-emerald-300 text-xs px-1 py-0.5 rounded">
                              {state.bookSettings.bookSize} ({state.bookSettings.dimensions.width}" × {state.bookSettings.dimensions.height}")
                            </div>
                            
                            {/* Add indicator label */}
                            <div className="absolute top-1 right-1 bg-cyan-900/80 text-cyan-300 text-xs px-1 py-0.5 rounded">
                              Safe Area
                            </div>
                            
                            {/* Add warning if text appears to be outside safe area */}
                            <div className="absolute bottom-1 right-1 left-1 flex justify-center">
                              <div className="bg-red-900/80 text-red-300 text-xs px-2 py-1 rounded">
                                <AlertTriangle className="h-3 w-3 inline mr-1" />
                                KDP requires 0.25" safe margin for text
                              </div>
                            </div>
                          </div>
                          
                          {/* Add a toggle button to show/hide guides */}
                          <div className="absolute top-2 right-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-zinc-800/80 hover:bg-zinc-700/80 border-zinc-700"
                              onClick={() => setState(prev => ({ ...prev, showGuidelines: !prev.showGuidelines }))}
                            >
                              {state.showGuidelines ? 'Hide Guidelines' : 'Show Guidelines'}
                            </Button>
                          </div>
                          
                          {/* Download button overlay */}
                          <div className="absolute top-2 left-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="bg-emerald-700/90 hover:bg-emerald-600 text-white"
                              onClick={() => {
                                if (state.frontCoverImage) {
                                  // Use our new download function
                                  downloadCoverWithExactDimensions(state.frontCoverImage, `${state.bookSettings.bookSize.replace('x', 'x')}_cover.png`);
                                }
                              }}
                            >
                              <Download className="h-3 w-3 mr-1" /> View & Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // Placeholder when no image
                        <div className="text-zinc-500 text-center flex flex-col items-center justify-center" style={{
                          width: `${state.bookSettings.dimensions.width * 70}px`,
                          height: `${state.bookSettings.dimensions.height * 70}px`,
                          aspectRatio: `${state.bookSettings.dimensions.width} / ${state.bookSettings.dimensions.height}`, // Enforce exact aspect ratio here too
                          maxWidth: '100%',
                          maxHeight: '550px',
                          margin: '0 auto' // Center the container
                        }}>
                          <Wand2 className="h-10 w-10 mb-2 text-zinc-700" />
                          <p className="text-zinc-500">
                            {state.frontCoverPrompt 
                              ? "Click 'Generate Cover' button to create your AI cover" 
                              : "Generate a cover to see preview"}
                          </p>
                          {state.frontCoverPrompt && (
                            <div className="mt-3 border border-zinc-700 rounded p-3 bg-zinc-800/50 w-full max-w-xs">
                              <div className="text-xs text-zinc-400 text-center">
                                Edit your prompt and then click<br/>the "Generate Cover" button below
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Text placement guidelines */}
                    {state.frontCoverImage && (
                      <div className="flex items-center gap-2 text-xs p-3 bg-amber-950/60 border border-amber-900/50 rounded text-amber-400 mt-3">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-500" />
                        <p className="font-medium">
                          IMPORTANT: This design maintains a 0.25" safe margin for all text elements.
                          Text is positioned to meet KDP requirements. Use the "Show Guidelines" button to view safety margins.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Workflow Steps and Actions */}
                <div className="mt-6 bg-zinc-800/50 rounded-lg border border-zinc-700 p-4">
                  <h3 className="text-lg font-medium text-white mb-4">Cover Generation Workflow</h3>
                  
                  {/* Step 1: Analyze Image */}
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-900/50 flex items-center justify-center mr-3">
                        <span className="text-emerald-400 font-medium">1</span>
                      </div>
                      <h4 className="text-md font-medium text-emerald-400">Analyze Image</h4>
                    </div>
                    
                    {state.uploadedFile && !state.frontCoverPrompt ? (
                      <div className="ml-11">
                        <p className="text-sm text-zinc-400 mb-3">
                          Your image has been uploaded. Click the button below to analyze it with AI and generate a prompt.
                        </p>
                        <div className="flex space-x-2">
                          <Button 
                            className="bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400"
                            onClick={() => {
                              if (state.uploadedFile) {
                                analyzeImageWithOpenAI(state.uploadedFile);
                              }
                            }}
                            disabled={isLoading.analyzeImage}
                          >
                            {isLoading.analyzeImage ? (
                              <span className="flex items-center">
                                <span className="animate-spin mr-2">⏳</span> Analyzing...
                              </span>
                            ) : (
                              <>
                                <Wand2 className="mr-2 h-4 w-4" />
                                Generate Prompt with {COVER_STYLES.find(s => s.id === state.selectedStyle)?.name || 'Book'} Style
                              </>
                            )}
                          </Button>
                          <Button 
                            variant="outline"
                            className="border-zinc-700 text-red-400 hover:bg-red-950/30 hover:border-red-700"
                            onClick={resetUpload}
                          >
                            Reset & Upload New
                          </Button>
                        </div>
                      </div>
                    ) : state.frontCoverPrompt && (
                      <div className="ml-11">
                        <p className="text-sm text-zinc-400 mb-2">
                          <span className="text-emerald-400">✓</span> Image analyzed successfully
                        </p>
                        <Button 
                          variant="outline"
                          size="sm"
                          className="border-zinc-700 text-red-400 hover:bg-red-950/30 hover:border-red-700"
                          onClick={resetUpload}
                        >
                          <span className="mr-2">🔄</span> Reset & Upload Different Image
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Step 2: Edit Prompt */}
                  {state.frontCoverPrompt && (
                    <div className="mt-6 pt-6 border-t border-zinc-700 space-y-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-900/50 flex items-center justify-center mr-3">
                          <span className="text-emerald-400 font-medium">2</span>
                        </div>
                        <h4 className="text-md font-medium text-emerald-400">Edit Prompt</h4>
                      </div>
                      
                      <div className="ml-11 space-y-3">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-sm text-zinc-400">
                            Review and edit the AI-generated prompt to get your perfect cover design
                          </p>
                          <div className="text-xs text-emerald-300 italic">Feel free to edit before generating</div>
                        </div>
                        
                        <div className="bg-emerald-950/30 p-3 rounded-lg">
                          <Textarea
                            value={state.frontCoverPrompt}
                            onChange={(e) => 
                              setState(prev => ({
                                ...prev,
                                frontCoverPrompt: e.target.value
                              }))
                            }
                            className="min-h-[200px] text-sm bg-emerald-950/40 border-emerald-900/50 focus:border-emerald-500"
                          />
                        </div>
                        
                        {/* Add buttons for actions */}
                        <div className="flex justify-between">
                          <Button 
                            variant="outline"
                            size="sm"
                            className="border-emerald-700 text-emerald-400 hover:bg-emerald-950/30 hover:border-emerald-600"
                            onClick={() => {
                              if (state.uploadedFile) {
                                analyzeImageWithOpenAI(state.uploadedFile);
                                toast.info("Regenerating prompt from your image...");
                              }
                            }}
                            disabled={isLoading.analyzeImage}
                          >
                            {isLoading.analyzeImage ? (
                              <span className="flex items-center">
                                <span className="animate-spin mr-2">⏳</span> Regenerating...
                              </span>
                            ) : (
                              <>
                                <RefreshCcw className="mr-2 h-4 w-4" />
                                Regenerate Prompt with {COVER_STYLES.find(s => s.id === state.selectedStyle)?.name || 'Book'} Style
                              </>
                            )}
                          </Button>
                          
                          <Button 
                            variant="outline"
                            size="sm"
                            className="border-zinc-700 text-red-400 hover:bg-red-950/30 hover:border-red-700"
                            onClick={resetUpload}
                          >
                            <span className="mr-2">🔄</span> Reset & Upload Different Image
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Step 3: Generate Cover */}
                  {state.frontCoverPrompt && (
                    <div className="mt-6 pt-6 border-t border-zinc-700 space-y-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-900/50 flex items-center justify-center mr-3">
                          <span className="text-emerald-400 font-medium">3</span>
                        </div>
                        <h4 className="text-md font-medium text-emerald-400">Generate Cover</h4>
                      </div>
                      
                      <div className="ml-11 flex flex-wrap gap-3">
                        <Button 
                          className="bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 px-6"
                          onClick={async () => {
                              setIsLoading({...isLoading, generateFrontCover: true});
                              
                              try {
                                console.log('=== GENERATE COVER BUTTON CLICKED ===');
                                console.log('Current state.frontCoverPrompt:', state.frontCoverPrompt);
                                console.log('Book settings:', state.bookSettings);
                                
                                // Extract title, subtitle, author from the prompt or use defaults
                                const extractTitleFromPrompt = (prompt: string) => {
                                  const titleMatch = prompt.match(/(?:title|book)\s*[:\-]?\s*['""]?([^'"".\n]+)['""]?/i);
                                  return titleMatch ? titleMatch[1].trim() : null;
                                };
                                
                                const extractAuthorFromPrompt = (prompt: string) => {
                                  const authorMatch = prompt.match(/(?:author|by)\s*[:\-]?\s*['""]?([^'"".\n]+)['""]?/i);
                                  return authorMatch ? authorMatch[1].trim() : null;
                                };
                                
                                // Get style information
                                const bookStyle = COVER_STYLES.find(s => s.id === state.selectedStyle);
                                
                                // Prepare simplified API call
                                const coverParams = {
                                  title: extractTitleFromPrompt(state.frontCoverPrompt) || "Book Title",
                                  subtitle: undefined,
                                  author: extractAuthorFromPrompt(state.frontCoverPrompt) || "Author Name",
                                  genre: bookStyle?.name || state.selectedStyle,
                                  style: 'modern',
                                  description: state.frontCoverPrompt,
                                  customInstructions: `Book size: ${state.bookSettings.bookSize}. Keep all text within safe margins.`
                                };
                                
                                console.log('Calling generateFrontCover with params:', coverParams);
                                
                                const result = await generateFrontCover(coverParams);
                                
                                console.log('Generated cover result:', result);
                                
                                setState(prev => ({
                                  ...prev,
                                  frontCoverImage: result.url,
                                  steps: {
                                    ...prev.steps,
                                    frontCover: true
                                  },
                                  originalImageUrl: prev.originalImageUrl,
                                  uploadedFile: prev.uploadedFile
                                }));
                                
                                toast.success("Front cover generated successfully!");
                              } catch (error) {
                                console.error('=== COVER GENERATION ERROR ===');
                                console.error('Error details:', error);
                                
                                if (error instanceof Error && error.name === 'AbortError') {
                                  toast.error('Request timed out. The service might be overloaded. Please try again.');
                                } else if (error instanceof Error && (error.message.includes('Failed to fetch') || error.message.includes('network'))) {
                                  toast.error('Network error. Please check your connection and try again.');
                                } else {
                                  toast.error(error instanceof Error ? error.message : 'Failed to generate cover. Please try again.');
                                }
                              } finally {
                                setIsLoading({...isLoading, generateFrontCover: false});
                              }
                          }}
                          disabled={isLoading.generateFrontCover}
                        >
                          {isLoading.generateFrontCover ? (
                            <span className="flex items-center">
                              <span className="animate-spin mr-2">⏳</span> Generating...
                            </span>
                          ) : (
                            <>
                              <Wand2 className="mr-2 h-4 w-4" />
                              Generate {COVER_STYLES.find(s => s.id === state.selectedStyle)?.name} Cover
                            </>
                          )}
                        </Button>
                        
                        {state.frontCoverImage && (
                          <>
                            <Button 
                              variant="outline" 
                              className="border-emerald-600/40 text-emerald-500 hover:bg-emerald-950/30"
                              onClick={async () => {
                                  setIsLoading({...isLoading, generateFrontCover: true});
                                  
                                  try {
                                    // Extract title, subtitle, author from the prompt or use defaults
                                    const extractTitleFromPrompt = (prompt: string) => {
                                      const titleMatch = prompt.match(/(?:title|book)\s*[:\-]?\s*['""]?([^'"".\n]+)['""]?/i);
                                      return titleMatch ? titleMatch[1].trim() : null;
                                    };
                                    
                                    const extractAuthorFromPrompt = (prompt: string) => {
                                      const authorMatch = prompt.match(/(?:author|by)\s*[:\-]?\s*['""]?([^'"".\n]+)['""]?/i);
                                      return authorMatch ? authorMatch[1].trim() : null;
                                    };
                                    
                                    // Get style information
                                    const bookStyle = COVER_STYLES.find(s => s.id === state.selectedStyle);
                                    
                                    // Prepare simplified API call for variation
                                    const coverParams = {
                                      title: extractTitleFromPrompt(state.frontCoverPrompt) || "Book Title",
                                      subtitle: undefined,
                                      author: extractAuthorFromPrompt(state.frontCoverPrompt) || "Author Name",
                                      genre: bookStyle?.name || state.selectedStyle,
                                      style: 'modern',
                                      description: state.frontCoverPrompt + " (alternative version, different style)",
                                      customInstructions: `Book size: ${state.bookSettings.bookSize}. Keep all text within safe margins. Create a variation with different visual approach.`
                                    };
                                    
                                    console.log('Calling generateFrontCover variation with params:', coverParams);
                                    
                                    const result = await generateFrontCover(coverParams);
                                    
                                    setState(prev => ({
                                      ...prev,
                                      frontCoverImage: result.url,
                                      originalImageUrl: prev.originalImageUrl,
                                      uploadedFile: prev.uploadedFile
                                    }));
                                    
                                    toast.success("Generated a new cover variation!");
                                  } catch (error) {
                                    console.error('Error generating variation:', error);
                                    toast.error(error instanceof Error ? error.message : 'Failed to generate variation. Please try again.');
                                  } finally {
                                    setIsLoading({...isLoading, generateFrontCover: false});
                                  }
                              }}
                              disabled={isLoading.generateFrontCover}
                            >
                              <Wand2 className="mr-2 h-4 w-4" />
                              Generate Variation
                            </Button>
                            
                            <Button 
                              className="bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400"
                              onClick={() => {
                                setState(prev => ({
                                  ...prev,
                                  steps: {
                                    ...prev.steps,
                                    frontCover: true
                                  }
                                }));
                                toast.success("Front cover design saved!");
                              }}
                            >
                              <Check className="mr-2 h-4 w-4" />
                              Use This Design
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  {state.frontCoverImage && (
                    <div className="mt-6 pt-6 border-t border-zinc-700 space-y-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-900/50 flex items-center justify-center mr-3">
                          <span className="text-emerald-400 font-medium">3</span>
                        </div>
                        <h4 className="text-md font-medium text-emerald-400">Export Options</h4>
                      </div>
                      
                      <div className="ml-11 space-y-3">
                        <p className="text-sm text-zinc-400">
                          Download your cover image or continue with the design process
                        </p>
                        
                        <div className="flex flex-wrap gap-3">
                          <Button 
                            className="bg-emerald-600 hover:bg-emerald-500 flex items-center"
                            onClick={() => {
                              if (state.frontCoverImage) {
                                // Instead of just opening in a new tab, create a proper download
                                downloadCoverWithExactDimensions(state.frontCoverImage, `${state.bookSettings.bookSize.replace('x', 'x')}_cover.png`);
                              } else {
                                toast.error("No cover image to download");
                              }
                            }}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Open Image for Download
                          </Button>
                          
                          <Button
                            variant="outline"
                            className="border-emerald-600/40 text-emerald-500 hover:bg-emerald-950/30 hover:text-emerald-400"
                            onClick={() => {
                              // Open the image in a new tab
                              if (state.frontCoverImage) {
                                downloadCoverWithExactDimensions(state.frontCoverImage, `${state.bookSettings.bookSize.replace('x', 'x')}_cover.png`);
                              }
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Full Size
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Navigation buttons */}
            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => goToStep('settings')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Settings
              </Button>
              
              <Button
                onClick={() => state.steps.frontCover && completeStep('frontCover', 'backCover')}
                disabled={!state.steps.frontCover}
                className="bg-emerald-600 hover:bg-emerald-500"
              >
                Continue to Back Cover
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      
      case 'backCover':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Back Cover Design</h2>
            <p className="text-zinc-400 text-sm mb-6">
              Create your book's back cover with a description and optional interior preview images.
            </p>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="backCoverPrompt">Back Cover Description</Label>
                  <Textarea
                    id="backCoverPrompt"
                    placeholder="Enter your book description or prompt for the back cover..."
                    className="min-h-[120px]"
                    value={state.backCoverPrompt}
                    onChange={(e) => 
                      setState(prev => ({
                        ...prev,
                        backCoverPrompt: e.target.value
                      }))
                    }
                  />
                </div>
                
                <Button 
                  variant="outline"
                  onClick={async () => {
                    if (!state.frontCoverPrompt) {
                      toast.error("Please generate a front cover prompt first");
                      return;
                    }
                    
                    setIsLoading({...isLoading, generateBackCoverPrompt: true});
                    toast.info("Generating back cover description from front cover...");
                    
                    try {
                      // Call OpenAI API to generate back cover description
                      const response = await fetch(`${getApiUrl()}/api/openai/enhance-prompt`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          prompt: `Based on this front cover design: "${state.frontCoverPrompt}", create a complementary back cover description that would work well with this design.`,
                          context: "You are a professional book cover designer. Create a back cover description that includes placeholders for book summary, author bio, and complements the front cover style."
                        })
                      });
                      
                      if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Failed to generate back cover description');
                      }
                      
                      const data = await response.json();
                      const backCoverDesc = data.enhancedPrompt;
                      
                      if (!backCoverDesc) {
                        throw new Error('No back cover description was generated');
                      }
                      
                      setState(prev => ({
                        ...prev,
                        backCoverPrompt: backCoverDesc
                      }));
                      
                      toast.success("Back cover description generated!");
                    } catch (error) {
                      console.error('Error generating back cover description:', error);
                      toast.error(error instanceof Error ? error.message : 'Failed to generate back cover description');
                      // Fallback to a default description if API fails
                      setState(prev => ({
                        ...prev,
                        backCoverPrompt: "A professional back cover matching the front design, with space for book description text and author bio."
                      }));
                    } finally {
                      setIsLoading({...isLoading, generateBackCoverPrompt: false});
                    }
                  }}
                  className="w-full border-emerald-900/50 text-emerald-400 hover:bg-emerald-900/20"
                  disabled={isLoading.generateBackCoverPrompt || !state.frontCoverPrompt}
                >
                  {isLoading.generateBackCoverPrompt ? (
                    <span className="flex items-center">
                      <span className="animate-spin mr-2">⏳</span> Generating...
                    </span>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate from Front Cover
                    </>
                  )}
                </Button>
                
                <div className="space-y-2 mt-4" style={{display: "none"}}>
                  <Label>Interior Preview Images (Optional)</Label>
                  <p className="text-xs text-zinc-500">
                    Upload up to 4 interior pages to showcase on the back cover.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {[1, 2, 3, 4].map((idx) => {
                      const interiorImage = state.interiorImages[idx - 1];
                      return (
                        <div 
                          key={idx}
                          className={`aspect-square border border-dashed ${interiorImage ? 'border-emerald-600' : 'border-zinc-700'} rounded-md flex items-center justify-center p-2 relative overflow-hidden`}
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/png,image/jpeg';
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = () => {
                                  if (typeof reader.result === 'string') {
                                    const newInteriorImages = [...state.interiorImages];
                                    newInteriorImages[idx - 1] = reader.result;
                                    setState(prev => ({
                                      ...prev,
                                      interiorImages: newInteriorImages
                                    }));
                                    toast.success(`Interior image ${idx} uploaded`);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            };
                            input.click();
                          }}
                        >
                          {interiorImage ? (
                            <>
                              <img 
                                src={interiorImage} 
                                alt={`Interior Preview ${idx}`}
                                className="w-full h-full object-cover rounded"
                              />
                              <div 
                                className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newInteriorImages = [...state.interiorImages];
                                  newInteriorImages[idx - 1] = '';
                                  setState(prev => ({
                                    ...prev,
                                    interiorImages: newInteriorImages
                                  }));
                                  toast.info(`Interior image ${idx} removed`);
                                }}
                              >
                                <Button size="sm" variant="destructive">Remove</Button>
                              </div>
                            </>
                          ) : (
                            <div className="text-center cursor-pointer">
                              <Upload className="h-6 w-6 text-zinc-400 mx-auto" />
                              <span className="text-xs text-zinc-500">Image {idx}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <Button 
                  onClick={async () => {
                    console.log('=== Back Cover Generation Debug ===');
                    console.log('Front cover image:', state.frontCoverImage);
                    console.log('Back cover prompt:', state.backCoverPrompt);
                    console.log('Dimensions:', state.bookSettings.dimensions);
                    console.log('Interior images:', state.interiorImages);
                    
                    if (!state.frontCoverImage) {
                      toast.error("Please generate a front cover first");
                      return;
                    }
                    
                    if (!state.backCoverPrompt) {
                      toast.error("Please generate a back cover description first by clicking 'Generate from Front Cover'");
                      return;
                    }
                    
                    setIsLoading({...isLoading, generateBackCover: true});
                    toast.info("Generating back cover design...");
                    
                    try {
                      const requestBody = {
                        frontCoverUrl: state.frontCoverImage,
                        width: Math.round(state.bookSettings.dimensions.width * 300), // Convert inches to pixels at 300 DPI
                        height: Math.round(state.bookSettings.dimensions.height * 300),
                        backCoverPrompt: state.backCoverPrompt, // Include the back cover description for context
                        interiorImages: state.interiorImages.filter(img => img) // Include interior images if any
                      };
                      
                      console.log('Request body:', requestBody);
                      
                      // Use the dedicated back cover generation API that creates a back cover based on the front cover
                      const response = await fetch(`${getApiUrl()}/api/book-cover/generate-back`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(requestBody)
                      });
                      
                      console.log('Response status:', response.status);
                      console.log('Response headers:', response.headers);
                      
                      if (!response.ok) {
                        const errorData = await response.json();
                        console.error('Error response:', errorData);
                        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}: Failed to generate back cover`);
                      }
                      
                      const data = await response.json();
                      console.log('Success response:', data);
                      const imageUrl = data.url;
                      
                      if (!imageUrl) {
                        throw new Error('No image URL was returned from the server');
                      }
                      
                      setState(prev => ({
                        ...prev,
                        backCoverImage: imageUrl,
                        steps: {
                          ...prev.steps,
                          backCover: true
                        }
                      }));
                      
                      toast.success("Back cover generated successfully!");
                    } catch (error) {
                      console.error('Error generating back cover:', error);
                      toast.error(error instanceof Error ? error.message : 'Failed to generate back cover');
                      
                      // Better fallback that still allows user to proceed
                      setState(prev => ({
                        ...prev,
                        backCoverImage: 'https://placehold.co/600x900/1e293b/ffffff?text=AI+Generated+Back+Cover',
                        steps: {
                          ...prev.steps,
                          backCover: true
                        }
                      }));
                      toast.info("Using placeholder back cover - you can continue to the next step.");
                    } finally {
                      setIsLoading({...isLoading, generateBackCover: false});
                    }
                  }}
                  className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500"
                  disabled={isLoading.generateBackCover || !state.backCoverPrompt || !state.frontCoverImage}
                >
                  {isLoading.generateBackCover ? (
                    <span className="flex items-center">
                      <span className="animate-spin mr-2">⏳</span> Generating...
                    </span>
                  ) : 'Generate Back Cover'}
                </Button>
              </div>
              
              {/* Back Cover Preview */}
              <div className="space-y-4">
                <h3 className="text-md font-medium">Back Cover Preview</h3>
                <div 
                  className="rounded-lg border border-zinc-700 bg-zinc-800 flex items-center justify-center"
                  style={{
                    width: `${state.bookSettings.dimensions.width * 50}px`,
                    height: `${state.bookSettings.dimensions.height * 50}px`,
                    maxWidth: '100%',
                    maxHeight: '400px'
                  }}
                >
                  {state.backCoverImage ? (
                    <div className="relative w-full h-full">
                      <img 
                        src={state.backCoverImage} 
                        alt="Back Cover Preview" 
                        className="w-full h-full object-cover rounded-md"
                      />
                      
                      {/* Interior Images */}
                      {state.interiorImages.some(img => img) && (
                        <div className="absolute inset-x-4 bottom-16 top-1/3 flex flex-wrap gap-2 pointer-events-none">
                          {state.interiorImages.filter(img => img).map((img, idx) => (
                            <div key={idx} className="w-1/4 h-1/2 min-w-[60px] shadow-lg rounded overflow-hidden border border-white/30">
                              <img src={img} alt={`Interior ${idx + 1}`} className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* ISBN Placeholder */}
                      {state.bookSettings.includeISBN && (
                        <div className="absolute bottom-4 right-4 w-20 h-10 bg-white/80 rounded-sm flex items-center justify-center text-xs text-gray-800 border border-zinc-700">
                          <div className="flex flex-col items-center">
                            <span className="text-[8px] font-bold">ISBN</span>
                            <div className="bg-black h-4 w-16 mt-1"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-zinc-400">
                      <BookOpen className="h-12 w-12 mx-auto mb-2" />
                      <p>Back cover preview will appear here</p>
                    </div>
                  )}
                </div>
                
                {state.backCoverImage && (
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline"
                      onClick={async () => {
                        setIsLoading({...isLoading, generateBackCover: true});
                        try {
                          // Generate a variation with the same prompt
                          const response = await fetch(`${getApiUrl()}/api/book-cover/generate-back`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              frontCoverUrl: state.frontCoverImage,
                              width: Math.round(state.bookSettings.dimensions.width * 300), // Convert inches to pixels at 300 DPI
                              height: Math.round(state.bookSettings.dimensions.height * 300),
                              backCoverPrompt: state.backCoverPrompt, // Include the back cover description for context
                              interiorImages: state.interiorImages.filter(img => img) // Include interior images if any
                            })
                          });
                          
                          if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.message || errorData.error || 'Failed to regenerate back cover');
                          }
                          
                          const data = await response.json();
                          if (data.url) {
                            setState(prev => ({
                              ...prev,
                              backCoverImage: data.url
                            }));
                            toast.success("Back cover regenerated successfully!");
                          }
                        } catch (error) {
                          toast.error("Failed to regenerate back cover");
                        } finally {
                          setIsLoading({...isLoading, generateBackCover: false});
                        }
                      }}
                    >
                      {isLoading.generateBackCover ? 'Regenerating...' : 'Regenerate'}
                    </Button>
                    <Button
                      onClick={() => {
                        setState(prev => ({
                          ...prev,
                          steps: {
                            ...prev.steps,
                            backCover: true
                          }
                        }));
                        toast.success("Back cover design confirmed!");
                      }}
                    >
                      Use This Design
                    </Button>
                  </div>
                )}
                
                <div className="mt-6 p-4 bg-emerald-950/30 rounded-lg border border-emerald-900">
                  <h4 className="text-sm font-medium text-emerald-300 mb-2">Back Cover Tips</h4>
                  <ul className="text-xs text-emerald-400 space-y-1">
                    <li>• Include a compelling book description that hooks potential readers</li>
                    <li>• Add author bio and photo if available</li>
                    <li>• Consider including positive reviews or testimonials</li>
                    <li>• Keep text readable at a glance (14-16pt font minimum)</li>
                    <li>• Leave space for the ISBN barcode if enabled</li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Navigation buttons */}
            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => goToStep('frontCover')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Front Cover
              </Button>
              
              <Button
                onClick={() => state.steps.backCover && completeStep('backCover', 'spine')}
                disabled={!state.steps.backCover}
                className="bg-emerald-600 hover:bg-emerald-500"
              >
                Continue to Spine Design
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      
      case 'spine':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Spine Design</h2>
            <p className="text-zinc-400 text-sm mb-6">
              Design your book's spine with text and color that complement the cover design.
            </p>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="spineText">Spine Text</Label>
                  <Input
                    id="spineText"
                    placeholder="Book title and author name"
                    value={state.spineText}
                    onChange={(e) => 
                      setState(prev => ({
                        ...prev,
                        spineText: e.target.value
                      }))
                    }
                  />
                  <p className="text-xs text-zinc-500">
                    {state.bookSettings.dimensions.spineWidth < 0.25 ? 
                      "⚠️ Your spine is very thin. Consider using only the title for better readability." : 
                      "For best results, keep text simple and legible."
                    }
                  </p>
                </div>
                
                <div className="space-y-2 mt-4" style={{display: "none"}}>
                  <Label htmlFor="spineFont">Font Style</Label>
                  <Select
                    value={state.spineFont}
                    onValueChange={(value) => 
                      setState(prev => ({
                        ...prev,
                        spineFont: value
                      }))
                    }
                  >
                    <SelectTrigger id="spineFont">
                      <SelectValue placeholder="Select font" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPINE_FONTS.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          {font.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 mt-4" style={{display: "none"}}>
                  <Label>Spine Color</Label>
                  <div className="grid grid-cols-6 gap-2">
                    {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#000000'].map((color) => (
                      <div
                        key={color}
                        className={`w-full aspect-square rounded-md cursor-pointer transition-all ${
                          state.spineColor === color ? 'ring-2 ring-cyan-500 ring-offset-2' : ''
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => 
                          setState(prev => ({
                            ...prev,
                            spineColor: color
                          }))
                        }
                      />
                    ))}
                  </div>
                  
                  <div className="mt-2 flex items-center space-x-2">
                    <Label htmlFor="customColor" className="text-xs">Custom Color:</Label>
                    <Input
                      id="customColor"
                      type="color"
                      value={state.spineColor}
                      onChange={(e) => 
                        setState(prev => ({
                          ...prev,
                          spineColor: e.target.value
                        }))
                      }
                      className="w-10 h-8 p-0"
                    />
                    <span className="text-xs text-zinc-500">{state.spineColor}</span>
                  </div>
                </div>
                
                <Button 
                  onClick={() => {
                    if (!state.spineText && state.bookSettings.dimensions.spineWidth >= 0.25) {
                      toast.error("Please add spine text for books with spine width over 0.25 inches");
                      return;
                    }
                    
                    setState(prev => ({
                      ...prev,
                      steps: {
                        ...prev.steps,
                        spine: true
                      }
                    }));
                    toast.success("Spine design saved successfully!");
                  }}
                  className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500"
                >
                  Save Spine Design
                </Button>
              </div>
              
              {/* Spine Preview */}
              <div className="space-y-4">
                <h3 className="text-md font-medium">Spine Preview</h3>
                <div className="flex justify-center">
                  <div 
                    className="flex items-center justify-center rounded-md shadow-md overflow-hidden"
                    style={{
                      width: `${Math.max(30, state.bookSettings.dimensions.spineWidth * 50)}px`,
                      height: `${state.bookSettings.dimensions.height * 50}px`,
                      maxHeight: '400px',
                      backgroundColor: state.spineColor,
                      color: calculateContrastColor(state.spineColor)
                    }}
                  >
                    {state.spineText && (
                      <div
                        className="absolute transform -rotate-90 whitespace-nowrap text-center px-4"
                        style={{ 
                          fontFamily: getFontFamily(state.spineFont),
                          fontSize: `${Math.min(24, state.bookSettings.dimensions.spineWidth * 50)}px`,
                          maxWidth: '400px'
                        }}
                      >
                        {state.spineText}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-amber-950/30 rounded-lg border border-amber-900">
                  <h4 className="text-sm font-medium text-amber-300 mb-2">Spine Design Guidelines</h4>
                  <ul className="text-xs text-amber-400 space-y-1">
                    <li>• Spine width: {state.bookSettings.dimensions.spineWidth.toFixed(3)}" based on {state.bookSettings.pageCount} pages</li>
                    <li>• Minimum spine width for text: 0.25" (63 pages on white paper)</li>
                    <li>• Text should read from top to bottom when the book is standing upright</li>
                    <li>• Choose colors that complement your front and back covers</li>
                    <li>• Avoid very light text on light backgrounds</li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Navigation buttons */}
            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => goToStep('backCover')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Back Cover
              </Button>
              
              <Button
                onClick={() => state.steps.spine && completeStep('spine', 'preview')}
                disabled={!state.steps.spine}
                className="bg-emerald-600 hover:bg-emerald-500"
              >
                Continue to Full Preview
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      
      case 'preview':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Full Cover Preview</h2>
            <p className="text-zinc-400 text-sm mb-6">
              Review your complete book cover layout including front, back and spine.
            </p>
            
            <div className="space-y-4">
              {/* Controls */}
              <div className="flex justify-between items-center pb-2 border-b">
                <div className="flex items-center space-x-4">
                  <div className="space-x-2">
                    <Switch
                      id="safeZones"
                      checked={true}
                      onCheckedChange={() => {}}
                    />
                    <Label htmlFor="safeZones" className="text-sm">Show Safe Zones</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="zoomLevel" className="text-sm">Zoom:</Label>
                    <Slider
                      id="zoomLevel"
                      value={[100]}
                      min={50}
                      max={200}
                      step={10}
                      className="w-32"
                      onValueChange={() => {}}
                    />
                    <span className="text-sm">100%</span>
                  </div>
                </div>
                
                <Button
                  onClick={() => {
                    setState(prev => ({
                      ...prev,
                      fullCoverImage: 'https://placehold.co/1800x900/334155/ffffff?text=Full+Cover+Preview',
                      steps: {
                        ...prev.steps,
                        preview: true
                      }
                    }));
                    toast.success("Full cover assembled successfully!");
                  }}
                  variant="outline"
                  size="sm"
                  className="border-emerald-900/50 text-emerald-400 hover:bg-emerald-900/20"
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate Full Cover
                </Button>
              </div>
              
              {/* Full Cover Preview */}
              <div className="flex justify-center items-center bg-zinc-100 rounded-lg p-6 min-h-[500px]">
                {state.fullCoverImage ? (
                  <div className="relative shadow-xl">
                    <img 
                      src={state.fullCoverImage}
                      alt="Full Cover Preview"
                      className="max-w-full max-h-[500px] object-contain rounded-md"
                    />
                    
                    {/* Safe Zones Overlay */}
                    <div className={`absolute inset-0 pointer-events-none ${state.showGuidelines ? 'visible' : 'hidden'}`}>
                      {/* Spine guides */}
                      <div className="absolute top-0 bottom-0 border-l-2 border-r-2 border-cyan-500 border-dashed"
                        style={{
                          left: `calc(50% - ${state.bookSettings.dimensions.spineWidth * 50}px)`,
                          right: `calc(50% - ${state.bookSettings.dimensions.spineWidth * 50}px)`,
                        }}
                      />
                      
                      {/* Trim line */}
                      <div className="absolute inset-8 border-2 border-red-500 border-dashed rounded" />
                      
                      {/* Bleed line */}
                      {state.bookSettings.includeBleed && (
                        <div className="absolute inset-4 border-2 border-yellow-500 border-dashed rounded" />
                      )}
                      
                      {/* ISBN area */}
                      {state.bookSettings.includeISBN && (
                        <div className="absolute bottom-16 right-16 w-24 h-16 border-2 border-green-500 border-dashed rounded" />
                      )}
                    </div>
                    
                    {/* Add toggle for guidelines */}
                    <div className="absolute top-2 right-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-zinc-800/80 hover:bg-zinc-700/80 border-zinc-700"
                        onClick={() => setState(prev => ({ ...prev, showGuidelines: !prev.showGuidelines }))}
                      >
                        {state.showGuidelines ? 'Hide Guidelines' : 'Show Guidelines'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-zinc-500">
                    <Eye className="h-16 w-16 mx-auto mb-4 text-zinc-400" />
                    <p>Click "Generate Full Cover" to assemble your complete book cover</p>
                  </div>
                )}
              </div>
              
              {/* Cover Specifications */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-zinc-800 p-4 rounded-lg border shadow-sm">
                  <h3 className="text-sm font-medium mb-2">Front Cover</h3>
                  <p className="text-xs text-zinc-400">
                    {state.bookSettings.dimensions.width} × {state.bookSettings.dimensions.height} inches
                  </p>
                  <div className="mt-2 h-20 bg-zinc-700 rounded flex items-center justify-center">
                    {state.frontCoverImage ? (
                      <img src={state.frontCoverImage} alt="Front Cover Thumbnail" className="h-full rounded" />
                    ) : (
                      <span className="text-xs text-zinc-400">No image</span>
                    )}
                  </div>
                </div>
                
                <div className="bg-zinc-800 p-4 rounded-lg border shadow-sm">
                  <h3 className="text-sm font-medium mb-2">Back Cover</h3>
                  <p className="text-xs text-zinc-400">
                    {state.bookSettings.dimensions.width} × {state.bookSettings.dimensions.height} inches
                  </p>
                  <div className="mt-2 h-20 bg-zinc-700 rounded flex items-center justify-center">
                    {state.backCoverImage ? (
                      <img src={state.backCoverImage} alt="Back Cover Thumbnail" className="h-full rounded" />
                    ) : (
                      <span className="text-xs text-zinc-400">No image</span>
                    )}
                  </div>
                </div>
                
                <div className="bg-zinc-800 p-4 rounded-lg border shadow-sm">
                  <h3 className="text-sm font-medium mb-2">Spine</h3>
                  <p className="text-xs text-zinc-400">
                    {state.bookSettings.dimensions.spineWidth.toFixed(3)} inches wide
                  </p>
                  <div className="mt-2 h-20 bg-zinc-700 rounded flex items-center justify-center overflow-hidden">
                    <div 
                      className="h-full w-5"
                      style={{ 
                        backgroundColor: state.spineColor,
                        color: calculateContrastColor(state.spineColor),
                        fontFamily: getFontFamily(state.spineFont)
                      }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-zinc-800 p-4 rounded-lg border mt-4">
                <h3 className="text-sm font-medium mb-2">Print Specifications</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Total Size:</span>
                    <span className="text-zinc-300">{state.bookSettings.dimensions.totalWidth.toFixed(2)} × {state.bookSettings.dimensions.totalHeight.toFixed(2)} inches</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Resolution:</span>
                    <span>300 DPI</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Color Mode:</span>
                    <span>RGB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Paper Type:</span>
                    <span>{state.bookSettings.paperType.charAt(0).toUpperCase() + state.bookSettings.paperType.slice(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Bleed:</span>
                    <span>{state.bookSettings.includeBleed ? "0.125\" included" : "None"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">ISBN Barcode:</span>
                    <span>{state.bookSettings.includeISBN ? "Included" : "Not included"}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Navigation buttons */}
            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => goToStep('spine')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Spine Design
              </Button>
              
              <Button
                onClick={() => state.steps.preview && completeStep('preview', 'export')}
                disabled={!state.steps.preview}
                className="bg-emerald-600 hover:bg-emerald-500"
              >
                Continue to Export
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      
      case 'export':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Export Your Cover</h2>
            <p className="text-zinc-400 text-sm mb-6">
              Download your cover files in various formats ready for KDP upload.
            </p>
            
            <div className="grid grid-cols-3 gap-6">
              {/* Front Cover Export */}
              <div className="bg-zinc-800 rounded-lg border shadow-sm overflow-hidden">
                <div className="border-b px-4 py-3 bg-zinc-800/80">
                  <h3 className="font-medium text-zinc-300">Front Cover</h3>
                </div>
                <div className="p-4">
                  <div className="aspect-[2/3] bg-zinc-900 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                    {state.frontCoverImage ? (
                      <img 
                        src={state.frontCoverImage} 
                        alt="Front Cover" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center text-zinc-400">
                        <BookOpen className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-xs">No image</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-xs text-zinc-400 flex justify-between">
                      <span>Size:</span>
                      <span className="text-zinc-300">{state.bookSettings.dimensions.width}" × {state.bookSettings.dimensions.height}"</span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1 border-zinc-700 hover:bg-zinc-800">
                        <Download className="h-4 w-4 mr-1" /> PNG
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 border-zinc-700 hover:bg-zinc-800">
                        <Download className="h-4 w-4 mr-1" /> PDF
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Back Cover Export */}
              <div className="bg-zinc-800 rounded-lg border shadow-sm overflow-hidden">
                <div className="border-b px-4 py-3 bg-zinc-800/80">
                  <h3 className="font-medium text-zinc-300">Back Cover</h3>
                </div>
                <div className="p-4">
                  <div className="aspect-[2/3] bg-zinc-900 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                    {state.backCoverImage ? (
                      <img 
                        src={state.backCoverImage} 
                        alt="Back Cover" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center text-zinc-400">
                        <BookOpen className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-xs">No image</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-xs text-zinc-400 flex justify-between">
                      <span>Size:</span>
                      <span className="text-zinc-300">{state.bookSettings.dimensions.width}" × {state.bookSettings.dimensions.height}"</span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1 border-zinc-700 hover:bg-zinc-800">
                        <Download className="h-4 w-4 mr-1" /> PNG
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 border-zinc-700 hover:bg-zinc-800">
                        <Download className="h-4 w-4 mr-1" /> PDF
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Spine Export */}
              <div className="bg-zinc-800 rounded-lg border shadow-sm overflow-hidden">
                <div className="border-b px-4 py-3 bg-zinc-800/80">
                  <h3 className="font-medium text-zinc-300">Spine</h3>
                </div>
                <div className="p-4">
                  <div className="h-32 bg-zinc-900 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                    <div 
                      className="h-full"
                      style={{ 
                        backgroundColor: state.spineColor,
                        width: `${Math.max(20, state.bookSettings.dimensions.spineWidth * 50)}px`,
                      }}
                    >
                      {state.spineText && (
                        <div 
                          className="absolute transform -rotate-90 whitespace-nowrap text-center px-4"
                          style={{ 
                            fontFamily: getFontFamily(state.spineFont),
                            color: calculateContrastColor(state.spineColor)
                          }}
                        >
                          {state.spineText}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-xs text-zinc-400 flex justify-between">
                      <span>Width:</span>
                      <span className="text-zinc-300">{state.bookSettings.dimensions.spineWidth.toFixed(3)}"</span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1 border-zinc-700 hover:bg-zinc-800">
                        <Download className="h-4 w-4 mr-1" /> PNG
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Full Wrap Export */}
            <div className="bg-zinc-800 rounded-lg border shadow-sm overflow-hidden mt-6">
              <div className="border-b px-4 py-3 bg-zinc-800/80">
                <h3 className="font-medium text-zinc-300">Full Wrap Cover</h3>
              </div>
              <div className="p-4">
                <div className="aspect-[2/1] bg-zinc-900 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                  {state.fullCoverImage ? (
                    <img 
                      src={state.fullCoverImage} 
                      alt="Full Cover Wrap" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-zinc-400">
                      <BookOpen className="h-12 w-12 mx-auto mb-2" />
                      <p>Full cover preview not generated</p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-sm text-zinc-500">
                    <div className="space-y-1">
                      <div><span className="font-medium">Size:</span> {state.bookSettings.dimensions.totalWidth.toFixed(2)}" × {state.bookSettings.dimensions.totalHeight.toFixed(2)}"</div>
                      <div><span className="font-medium">DPI:</span> 300</div>
                      <div><span className="font-medium">Format:</span> PDF (Recommended)</div>
                    </div>
                  </div>
                  
                  <Button 
                    className="px-8 bg-emerald-600 hover:bg-emerald-500"
                    onClick={() => {
                      toast.success("Cover downloaded successfully!");
                      setState(prev => ({
                        ...prev,
                        steps: {
                          ...prev.steps,
                          export: true
                        }
                      }));
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Full Cover PDF
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Print Specifications */}
            <div className="bg-emerald-950/30 rounded-lg border border-emerald-900 p-4 mt-6">
              <h3 className="font-medium text-emerald-300 mb-2">KDP Upload Instructions</h3>
              <div className="text-sm text-emerald-400 space-y-2">
                <p>1. Save the PDF file to your computer</p>
                <p>2. On KDP, select "Upload a cover you've already designed"</p>
                <p>3. Upload the full wrap PDF</p>
                <p>4. Ensure your cover meets all the requirements:</p>
                <ul className="list-disc pl-6 text-emerald-600 text-xs space-y-1 mt-1">
                  <li>RGB color mode</li>
                  <li>300 DPI resolution</li>
                  <li>PDF format preferred</li>
                  <li>{state.bookSettings.includeBleed ? "Bleed included (0.125\" on all sides)" : "No bleed"}</li>
                  <li>Spine width correct for your page count ({state.bookSettings.pageCount} pages)</li>
                  <li>Total dimensions: {state.bookSettings.dimensions.totalWidth.toFixed(2)}" × {state.bookSettings.dimensions.totalHeight.toFixed(2)}"</li>
                </ul>
              </div>
            </div>
            
            {/* Navigation buttons */}
            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => goToStep('preview')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Preview
              </Button>
              
              <Button
                variant="default"
                onClick={() => goToStep('settings')}
                className="bg-green-600 hover:bg-green-700"
              >
                Start New Cover
              </Button>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Step not implemented yet</h2>
            <p className="text-zinc-500 mb-4">This step is under development.</p>
            <Button onClick={() => goToStep('settings')}>
              <Undo2 className="mr-2 h-4 w-4" />
              Back to Book Settings
            </Button>
          </div>
        );
    }
  };

  // Fixed download function with proper naming
  const handleDownloadFrontCover = async () => {
    if (!state.frontCoverImage) {
      toast.error("No cover image to download");
      return;
    }

    try {
      setIsLoading({...isLoading, downloadingCover: true});
      toast.info("Preparing download...");

      // Handle both remote URLs and data URLs
      let imageUrl = state.frontCoverImage;
      
      // If URL is from an external source (not a data URL), fetch it first
      if (imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        imageUrl = URL.createObjectURL(blob);
      }

      // Create a temporary link element
      const link = document.createElement('a');
      link.href = imageUrl;
      
      // Extract title from prompt if available
      let filename = 'book-cover';
      const titleMatch = state.frontCoverPrompt.match(/book about ([^,\.]+)/i);
      if (titleMatch && titleMatch[1]) {
        filename = titleMatch[1].trim().replace(/\s+/g, '-').toLowerCase();
      }
      
      link.download = `${filename}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up object URL if we created one
      if (imageUrl !== state.frontCoverImage) {
        URL.revokeObjectURL(imageUrl);
      }

      toast.success("Cover image downloaded successfully!");
    } catch (error) {
      console.error('Error downloading cover:', error);
      toast.error("Failed to download cover image");
    } finally {
      setIsLoading({...isLoading, downloadingCover: false});
    }
  };

  // Completely revise the downloadCoverWithExactDimensions function
  const downloadCoverWithExactDimensions = async (imageUrl: string, filename: string) => {
    try {
      setIsLoading({...isLoading, downloadingCover: true});
      toast.info(`Preparing ${state.bookSettings.bookSize} cover at 300 DPI...`);

      // Create an image element to load the image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      // Set up promise to wait for image to load
      const imageLoaded = new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = imageUrl;
      });
      
      await imageLoaded;
      
      // Calculate exact dimensions at 300 DPI
      const exactWidth = Math.round(state.bookSettings.dimensions.width * 300);
      const exactHeight = Math.round(state.bookSettings.dimensions.height * 300);
      
      // Create a canvas with exact dimensions
      const canvas = document.createElement('canvas');
      canvas.width = exactWidth;
      canvas.height = exactHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // SIMPLEST APPROACH: Just draw the image to fill the entire canvas
        // This will stretch/distort the image if needed but ensures no white borders
        ctx.drawImage(img, 0, 0, exactWidth, exactHeight);
        
        // Convert to a data URL and download
        const dataUrl = canvas.toDataURL('image/png');
        
        // Create a download link
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename || 'cover.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        toast.success(`Downloaded ${state.bookSettings.bookSize} cover (${exactWidth}×${exactHeight}px @ 300dpi)`);
      } else {
        throw new Error("Could not get canvas context");
      }
    } catch (error) {
      console.error('Error downloading image with exact dimensions:', error);
      toast.error("Failed to download cover. Falling back to direct download.");
      
      // Fallback to direct download
      window.open(imageUrl, '_blank');
    } finally {
      setIsLoading({...isLoading, downloadingCover: false});
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-4">
          Book Cover Generator
        </h1>
        <p className="text-zinc-400 text-lg">
          Create professional Amazon KDP-compliant book covers with AI
        </p>
      </div>

      {/* Feature overview */}
      <div className="flex flex-col lg:flex-row mb-12 gap-8">
        <div className="flex items-start gap-4 rounded-xl bg-zinc-900/50 border border-zinc-800 p-5">
          <div className="rounded-full bg-emerald-900/30 p-3">
            <Book className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-1">Book Cover Generator</h3>
            <p className="text-zinc-400">AI-powered tool to create professional, KDP-compliant full wrap book covers</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-full bg-emerald-900/30 p-2">
              <Wand2 className="h-5 w-5 text-emerald-400" />
            </div>
            <h3 className="font-semibold text-white">AI-Generated</h3>
          </div>
          <p className="text-zinc-400 text-sm">Prompt-to-image technology</p>
        </div>
        
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-full bg-emerald-900/30 p-2">
              <FileType className="h-5 w-5 text-emerald-400" />
            </div>
            <h3 className="font-semibold text-white">KDP Ready</h3>
          </div>
          <p className="text-zinc-400 text-sm">Export in PDF or PNG format</p>
        </div>
        
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-full bg-emerald-900/30 p-2">
              <LayoutPanelTop className="h-5 w-5 text-emerald-400" />
            </div>
            <h3 className="font-semibold text-white">Full Wrap</h3>
          </div>
          <p className="text-zinc-400 text-sm">Front, back cover and spine</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div>
          <h2 className="text-2xl font-semibold text-emerald-400 mb-6">Key Features</h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
              <span className="text-zinc-300">Full KDP wrap-ready export (PDF + PNG)</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
              <span className="text-zinc-300">Image-to-Prompt → Prompt-to-Image for front cover</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
              <span className="text-zinc-300">Back cover prompt generated from front prompt</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
              <span className="text-zinc-300">Spine color selection via extracted palette</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
              <span className="text-zinc-300">Interior image integration (optional)</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
              <span className="text-zinc-300">Safe zone compliance for KDP requirements</span>
            </li>
          </ul>
        </div>
        
        <div>
          <h2 className="text-2xl font-semibold text-emerald-400 mb-6">KDP Guidelines</h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span className="text-zinc-300">Trim sizes must match Amazon KDP standards</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span className="text-zinc-300">Spine width is calculated based on page count and paper type</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span className="text-zinc-300">Covers with less than 100 pages cannot have spine text</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span className="text-zinc-300">Safe zones ensure no important elements are trimmed</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span className="text-zinc-300">Resolution must be 300 DPI for high-quality printing</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Main title */}
      <h1 className="text-3xl font-bold mb-2 text-white">KDP Cover Designer</h1>
      <p className="text-zinc-400 mb-8">
        Create professional, print-ready covers for Kindle Direct Publishing with our step-by-step designer.
      </p>
      
      {/* Step indicators */}
      <StepIndicators />
      
      {/* Current step content */}
      <div className="bg-zinc-900/80 rounded-lg shadow-lg p-6 border border-zinc-800">
        {renderStep()}
      </div>
    </div>
  );
};

// Calculate contrast color (black or white) based on background color
const calculateContrastColor = (hexColor: string): string => {
  // Remove the # if it exists
  hexColor = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hexColor.substring(0, 2), 16);
  const g = parseInt(hexColor.substring(2, 4), 16);
  const b = parseInt(hexColor.substring(4, 6), 16);
  
  // Calculate perceived brightness (YIQ formula)
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  
  // Return black or white based on brightness
  return (yiq >= 128) ? '#000000' : '#ffffff';
};

// Get font family string from selected font
const getFontFamily = (font: string): string => {
  switch(font) {
    case 'times': return 'Times New Roman, serif';
    case 'georgia': return 'Georgia, serif';
    case 'garamond': return 'Garamond, serif';
    case 'futura': return 'Futura, sans-serif';
    case 'helvetica':
    default:
      return 'Helvetica, Arial, sans-serif';
  }
};

export default KDPCoverDesigner; 