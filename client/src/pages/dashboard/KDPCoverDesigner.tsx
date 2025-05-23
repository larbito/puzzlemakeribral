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
  Minus
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

const KDPCoverDesigner: React.FC = () => {
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
  });

  const [isLoading, setIsLoading] = useState<{[key: string]: boolean}>({
    calculateDimensions: false,
    generateFrontCover: false,
    generateBackCover: false,
    generateBackCoverPrompt: false,
    assembleFullCover: false,
    uploadImage: false,
    analyzeImage: false,
    downloadingCover: false
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
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit');
      return;
    }
    
    setIsLoading({...isLoading, uploadImage: true});
    
    // Create a URL for the uploaded image
    const imageUrl = URL.createObjectURL(file);
    
    // Update state with the image URL and file reference
    setState(prev => ({
      ...prev,
      frontCoverImage: imageUrl,
      originalImageUrl: imageUrl, // Store the original image URL
      uploadedFile: file // Save reference to file for later analysis
    }));
    
    // After uploading successfully
    setIsLoading({...isLoading, uploadImage: false});
    toast.success("Image uploaded successfully! Click 'Generate Prompt' to analyze it with AI.");
  };
  
  // Modify the analyzeImageWithOpenAI function to include KDP-specific instructions
  const analyzeImageWithOpenAI = async (file: File) => {
    try {
      setIsLoading({...isLoading, analyzeImage: true});
      
      // Create a URL for the uploaded image
      const imageUrl = URL.createObjectURL(file);
      
      // Convert file to data URL to send as imageUrl parameter
      const base64DataUrl = await convertFileToDataURL(file);
      
      // Use direct image analysis through OpenAI routes instead
      const analyzeResponse = await fetch('https://puzzlemakeribral-production.up.railway.app/api/openai/extract-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: base64DataUrl, // Send as imageUrl parameter
          instructions: `
            This is a book cover image. Analyze it and create a detailed prompt to generate a similar book cover.
            Focus on the visual style, colors, layout, and overall design.
            
            EXTREMELY IMPORTANT KDP REQUIREMENTS - FOLLOW EXACTLY:
            1. All text MUST be placed at least 0.25 inches (75px at 300dpi) from ALL edges
            2. Title should be large, centered, and positioned in the upper half of the cover
            3. Author name should be smaller than the title and placed in the lower third
            4. Any subtitle should be positioned between the title and author name
            5. All text must be clearly readable and properly sized for hierarchy
            
            Include specific details about:
            - The book title and author placement
            - The color scheme and aesthetic 
            - Any graphic elements or illustrations
            - The mood and style of the cover
            
            CRITICAL: ENSURE all text stays well within safe margins - 0.25" (75px) from all edges.
          `
        })
      });
      
      if (!analyzeResponse.ok) {
        throw new Error('Failed to analyze image');
      }
      
      const analyzeData = await analyzeResponse.json();
      
      // Ensure the prompt includes safe area requirements
      let extractedPrompt = analyzeData.extractedPrompt || '';
      
      // Add explicit safe area requirements if not already present
      if (!extractedPrompt.includes("0.25 inches from") && !extractedPrompt.includes("safe area")) {
        extractedPrompt = `${extractedPrompt} CRITICAL: All text must be placed at least 0.25 inches (75px) from all edges. Title should be centered and positioned well away from edges. Author name should be properly placed in lower area with safe margins.`;
      }
      
      // Update state with the enhanced prompt
      setState(prev => ({
        ...prev,
        frontCoverPrompt: extractedPrompt,
        frontCoverImage: imageUrl,
        originalImageUrl: imageUrl,
        steps: {
          ...prev.steps,
          frontCover: true
        }
      }));
      
      // Show success message
      toast.success("Image analyzed successfully! Prompt created with KDP-safe text placement.");
      
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
            <div className="flex justify-between">
              <div className="space-y-4 w-1/2 pr-6">
                <h2 className="text-xl font-semibold text-white">Book Settings</h2>
                <p className="text-zinc-400 text-sm">
                  Configure your book specifications according to KDP requirements.
                  All dimensions will be calculated based on these settings.
                </p>
                
                <div className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="bookSize" className="text-zinc-300">Book Size</Label>
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
                      <SelectTrigger id="bookSize">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        {KDP_TRIM_SIZES.map((size) => (
                          <SelectItem key={size.value} value={size.value}>
                            {size.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="pageCount">Page Count</Label>
                    <div className="flex items-center space-x-2">
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
                      />
                      <input
                        type="text"
                        value={state.bookSettings.pageCount}
                        onChange={(e) => {
                          // Allow empty string for easier editing
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
                          
                          // Only allow numeric input
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
                        className="w-20 rounded-md border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <p className="text-xs text-zinc-400">Minimum 24 pages, maximum 900 pages</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Paper Type</Label>
                    <div className="flex space-x-2">
                      {PAPER_TYPES.map((type) => (
                        <Button
                          key={type.value}
                          type="button"
                          variant={state.bookSettings.paperType === type.value ? "default" : "outline"}
                          onClick={() => 
                            setState(prev => ({
                              ...prev, 
                              bookSettings: {
                                ...prev.bookSettings,
                                paperType: type.value as 'white' | 'cream' | 'color'
                              }
                            }))
                          }
                          className={`flex-1 ${
                            state.bookSettings.paperType === type.value 
                              ? "bg-emerald-600 hover:bg-emerald-500 text-white" 
                              : "border-emerald-600/40 text-emerald-500 hover:bg-emerald-950/30 hover:text-emerald-400"
                          }`}
                        >
                          {type.value === 'white' ? '⚪ ' : type.value === 'cream' ? '🟡 ' : '🎨 '}
                          {type.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Include Bleed (0.125")</Label>
                        <p className="text-xs text-zinc-500">
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
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Include ISBN Barcode</Label>
                        <p className="text-xs text-zinc-500">
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
                      />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={calculateDimensions}
                    className="w-full mt-6 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 font-semibold text-white shadow-lg" 
                    disabled={isLoading.calculateDimensions}
                  >
                    {isLoading.calculateDimensions ? 
                      '⏳ Calculating...' : 
                      state.steps.settings ? 
                        '🔄 Recalculate Dimensions' : 
                        '📏 Calculate Cover Dimensions'
                    }
                  </Button>
                </div>
              </div>
              
              {/* Live Preview Panel */}
              <div className="w-1/2 border border-emerald-800/30 rounded-lg p-5 bg-zinc-800/50 shadow-lg">
                <h3 className="text-sm font-medium text-emerald-400 mb-4 flex items-center">
                  <span className="mr-2">📐</span> Live Dimension Preview
                </h3>
                
                <div className="relative border border-zinc-700 bg-gradient-to-br from-zinc-900 to-zinc-800 mb-6 overflow-hidden rounded-lg shadow-inner" style={{ 
                  aspectRatio: `${Math.max(1.4, state.bookSettings.dimensions.totalWidth / state.bookSettings.dimensions.totalHeight)}`,
                }}>
                  {/* Preview rendering area */}
                  <div className="absolute inset-0 flex items-center justify-center p-6">
                    {/* Dynamic preview based on settings */}
                    <div className="relative flex shadow-2xl">
                      {/* Back cover */}
                      <div 
                        className="h-full bg-white border border-zinc-400 relative shadow-md"
                        style={{ 
                          width: `${Math.floor(state.bookSettings.dimensions.width * 20)}px`,
                          height: `${Math.floor(state.bookSettings.dimensions.height * 20)}px`,
                        }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-xs font-medium">
                          Back Cover
                        </div>
                        {state.bookSettings.includeISBN && (
                          <div className="absolute bottom-3 right-3 w-16 h-8 bg-zinc-200 rounded-sm flex items-center justify-center text-[8px] text-zinc-600 border border-zinc-300">
                            ISBN
                          </div>
                        )}
                      </div>
                      
                      {/* Spine */}
                      <div 
                        className="h-full bg-emerald-100 border-t border-b border-zinc-400 flex items-center justify-center"
                        style={{ 
                          width: `${Math.max(10, Math.floor(state.bookSettings.dimensions.spineWidth * 20))}px`,
                          height: `${Math.floor(state.bookSettings.dimensions.height * 20)}px`
                        }}
                      >
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap text-[8px] text-emerald-800 font-medium">
                          Spine ({state.bookSettings.dimensions.spineWidth.toFixed(3)}")
                        </div>
                      </div>
                      
                      {/* Front cover */}
                      <div 
                        className="h-full bg-white border border-zinc-400 relative shadow-md"
                        style={{ 
                          width: `${Math.floor(state.bookSettings.dimensions.width * 20)}px`,
                          height: `${Math.floor(state.bookSettings.dimensions.height * 20)}px`,
                        }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-xs font-medium">
                          Front Cover
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Bleed indicator */}
                  {state.bookSettings.includeBleed && (
                    <div className="absolute inset-0 border-2 border-emerald-500/60 border-dashed m-2 pointer-events-none rounded">
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-zinc-900 px-2 py-0.5 text-[8px] text-emerald-400 rounded">
                        Bleed Area (0.125")
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="bg-zinc-900/60 rounded-lg p-4 shadow-inner">
                  <div className="space-y-3 text-sm divide-y divide-zinc-800">
                    <div className="flex justify-between pb-2">
                      <span className="text-emerald-400 flex items-center"><span className="mr-1">📏</span> Trim Size:</span>
                      <span className="font-semibold text-white">{state.bookSettings.bookSize.replace('x', ' × "')}"</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-emerald-400 flex items-center"><span className="mr-1">📄</span> Page Count:</span>
                      <span className="font-semibold text-white">{state.bookSettings.pageCount} pages</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-emerald-400 flex items-center"><span className="mr-1">📚</span> Spine Width:</span>
                      <span className="font-semibold text-white">{state.bookSettings.dimensions.spineWidth.toFixed(3)}"</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-emerald-400 flex items-center"><span className="mr-1">📐</span> Total Cover Size:</span>
                      <span className="font-semibold text-white">
                        {state.bookSettings.dimensions.totalWidth.toFixed(2)}" × {state.bookSettings.dimensions.totalHeight.toFixed(2)}"
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-emerald-400 flex items-center"><span className="mr-1">✂️</span> Bleed:</span>
                      <span className="font-semibold text-white">{state.bookSettings.includeBleed ? '0.125" (included)' : 'None'}</span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <span className="text-emerald-400 flex items-center"><span className="mr-1">🔍</span> Resolution:</span>
                      <span className="font-semibold text-white">300 DPI</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Navigation buttons */}
            <div className="flex justify-between pt-4 border-t border-zinc-700">
              <Button variant="outline" disabled className="border-zinc-700 text-zinc-400">
                <ArrowLeft className="mr-2 h-4 w-4" />
                ⬅️ Back
              </Button>
              
              <Button
                onClick={() => state.steps.settings && completeStep('settings', 'frontCover')}
                disabled={!state.steps.settings}
                className="bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 font-semibold shadow-md"
              >
                Continue ➡️
                <ArrowRight className="ml-2 h-4 w-4" />
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
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      toast.info("Enhancing prompt with AI...");
                      // Simulate API call to enhance prompt
                      setTimeout(() => {
                        const enhancedPrompt = state.frontCoverPrompt + 
                          ", professional book cover, high quality publishing, centered title, vivid colors, dramatic lighting";
                        setState(prev => ({
                          ...prev,
                          frontCoverPrompt: enhancedPrompt
                        }));
                        toast.success("Prompt enhanced with AI recommendations");
                      }, 1500);
                    }}
                    className="flex-1 border-emerald-900/50 text-emerald-400 hover:bg-emerald-900/20"
                  >
                    <Wand2 className="mr-2 h-4 w-4" />
                    Enhance Prompt
                  </Button>
                  
                  <Button 
                    onClick={() => {
                      setIsLoading({...isLoading, generateFrontCover: true});
                      // Simulate API call to generate front cover
                      setTimeout(() => {
                        // In a real implementation, this would be the URL from the API
                        const imageUrl = 'https://placehold.co/600x900/334155/ffffff?text=AI+Generated+Front+Cover';
                        setState(prev => ({
                          ...prev,
                          frontCoverImage: imageUrl,
                          steps: {
                            ...prev.steps,
                            frontCover: true
                          }
                        }));
                        setIsLoading({...isLoading, generateFrontCover: false});
                        toast.success("Front cover generated successfully!");
                      }, 2000);
                    }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500"
                    disabled={isLoading.generateFrontCover || !state.frontCoverPrompt}
                  >
                    {isLoading.generateFrontCover ? 'Generating...' : 'Generate Cover'}
                  </Button>
                </div>
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
                          width: `${state.bookSettings.dimensions.width * 70}px`,
                          height: `${state.bookSettings.dimensions.height * 70}px`,
                          maxWidth: '100%',
                          maxHeight: '550px',
                          aspectRatio: `${state.bookSettings.dimensions.width}/${state.bookSettings.dimensions.height}`,
                        }}>
                          <img 
                            src={state.frontCoverImage} 
                            alt="AI Generated Cover" 
                            className="w-full h-full object-cover rounded-md shadow-lg"
                            style={{
                              objectFit: 'cover',
                              aspectRatio: `${state.bookSettings.dimensions.width}/${state.bookSettings.dimensions.height}`,
                              width: '100%',
                              height: '100%'
                            }}
                          />
                          
                          {/* Safe area indicators for KDP */}
                          <div className="absolute inset-0 pointer-events-none">
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
                          
                          {/* Download button overlay */}
                          <div className="absolute top-2 left-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="bg-emerald-700/90 hover:bg-emerald-600 text-white"
                              onClick={() => handleDownloadFrontCover()}
                              disabled={isLoading.downloadingCover}
                            >
                              {isLoading.downloadingCover ? (
                                <>
                                  <span className="animate-spin mr-1">⏳</span> Downloading...
                                </>
                              ) : (
                                <>
                                  <Download className="h-3 w-3 mr-1" /> Download Cover
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-zinc-500 text-center flex flex-col items-center justify-center" style={{
                          width: `${state.bookSettings.dimensions.width * 70}px`,
                          height: `${state.bookSettings.dimensions.height * 70}px`,
                          maxWidth: '100%',
                          maxHeight: '550px'
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
                          IMPORTANT: This design maintains a 0.25" safe margin (shown by dashed lines).
                          All text is positioned within this safe area to meet KDP requirements.
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
                                Generate Prompt from Image
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
                                Regenerate Prompt
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
                                // Enhanced prompt with explicit KDP text placement instructions
                                const safeAreaPrompt = `
                                  CRITICAL KDP REQUIREMENT: 
                                  - ALL text MUST be at least 0.25 inches (${Math.round(0.25 * 300)}px) from ALL edges
                                  - Place title text large and centered in the upper half
                                  - Place author name in lower third, smaller than title
                                  - Keep ALL text elements well within the dashed safe area
                                  - Text must be readable and properly sized for hierarchy
                                `;
                                
                                // Update the generate cover API call with explicit dimension requirements
                                const dimensionsPrompt = `This MUST be a ${state.bookSettings.bookSize.replace('x', ' by ')} inch book cover with EXACT ${state.bookSettings.bookSize} dimensions and aspect ratio of ${state.bookSettings.dimensions.width}:${state.bookSettings.dimensions.height}. The image must maintain these exact proportions.`;
                                
                                // Include KDP-specific instructions
                                const modifiedPrompt = `${state.frontCoverPrompt} ${dimensionsPrompt} ${safeAreaPrompt}`;
                                
                                // Call the book cover generation API
                                const coverWidth = Math.round(state.bookSettings.dimensions.width * 300);
                                const coverHeight = Math.round(state.bookSettings.dimensions.height * 300);
                                
                                console.log(`Generating cover with dimensions: ${coverWidth}x${coverHeight} pixels (${state.bookSettings.dimensions.width}x${state.bookSettings.dimensions.height} inches)`);
                                console.log(`Aspect ratio: ${state.bookSettings.dimensions.width / state.bookSettings.dimensions.height}`);
                                
                                const response = await fetch('https://puzzlemakeribral-production.up.railway.app/api/book-cover/generate-front', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    prompt: modifiedPrompt,
                                    width: coverWidth,
                                    height: coverHeight,
                                    negative_prompt: 'text too close to edges, text outside safe area, text in margins, text cut off, text bleeding to edge, text illegible, blurry text, low quality, distorted, deformed, book mockup, 3D book, book cover mockup, book model, perspective, shadow effects, page curl, wrong aspect ratio, wrong dimensions'
                                  })
                                });
                                
                                if (!response.ok) {
                                  const errorData = await response.json();
                                  throw new Error(errorData.error || 'Failed to generate cover image');
                                }
                                
                                const data = await response.json();
                                const imageUrl = data.url;
                                
                                if (!imageUrl) {
                                  throw new Error('No image was generated');
                                }
                                
                                                                    setState(prev => ({
                                      ...prev,
                                      frontCoverImage: imageUrl,
                                      steps: {
                                        ...prev.steps,
                                        frontCover: true // Now we set frontCover to true when generating the final cover
                                      },
                                      // Preserve the original image and uploadedFile reference
                                      originalImageUrl: prev.originalImageUrl,
                                      uploadedFile: prev.uploadedFile
                                    }));
                                
                                toast.success("Front cover generated from your edited prompt!");
                              } catch (error) {
                                console.error('Error generating cover:', error);
                                toast.error(error instanceof Error ? error.message : 'Failed to generate cover. Please try again.');
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
                              Generate Cover from Prompt
                            </>
                          )}
                        </Button>
                        
                        {state.frontCoverImage && (
                          <>
                            <Button 
                              variant="outline" 
                              className="border-emerald-600/40 text-emerald-500 hover:bg-emerald-950/30"
                                                              onClick={async () => {
                                  // Generate a variation using the same prompt but with slight modifications
                                  setIsLoading({...isLoading, generateFrontCover: true});
                                  
                                  try {
                                    // Add a variation modifier to the prompt
                                    const safeAreaPrompt = `
                                      CRITICAL KDP REQUIREMENT: 
                                      - ALL text MUST be at least 0.25 inches (${Math.round(0.25 * 300)}px) from ALL edges
                                      - Place title text large and centered in the upper half
                                      - Place author name in lower third, smaller than title
                                      - Keep ALL text elements well within the dashed safe area
                                      - Text must be readable and properly sized for hierarchy
                                    `;
                                    const dimensionsPrompt = `This MUST be a ${state.bookSettings.bookSize.replace('x', ' by ')} inch book cover with EXACT ${state.bookSettings.bookSize} dimensions and aspect ratio of ${state.bookSettings.dimensions.width}:${state.bookSettings.dimensions.height}. The image must maintain these exact proportions.`;
                                    
                                    const variationPrompt = `${state.frontCoverPrompt} (alternative version, different style) ${dimensionsPrompt} ${safeAreaPrompt}`;
                                    
                                    // Calculate pixel dimensions for the cover
                                    const coverWidth = Math.round(state.bookSettings.dimensions.width * 300);
                                    const coverHeight = Math.round(state.bookSettings.dimensions.height * 300);
                                    
                                    console.log(`Generating variation with dimensions: ${coverWidth}x${coverHeight} pixels (${state.bookSettings.dimensions.width}x${state.bookSettings.dimensions.height} inches)`);
                                    console.log(`Aspect ratio: ${state.bookSettings.dimensions.width / state.bookSettings.dimensions.height}`);
                                    
                                    // Call the book cover generation API for a variation
                                    const response = await fetch('https://puzzlemakeribral-production.up.railway.app/api/book-cover/generate-front', {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                      },
                                      body: JSON.stringify({
                                        prompt: variationPrompt,
                                        width: coverWidth,
                                        height: coverHeight,
                                        negative_prompt: 'text too close to edges, text outside safe area, text in margins, text cut off, text bleeding to edge, text illegible, blurry text, low quality, distorted, deformed, wrong aspect ratio, wrong dimensions',
                                        seed: Math.floor(Math.random() * 1000000) // Use random seed for variation
                                      })
                                    });
                                    
                                    if (!response.ok) {
                                      const errorData = await response.json();
                                      throw new Error(errorData.error || 'Failed to generate cover variation');
                                    }
                                    
                                    const data = await response.json();
                                    const imageUrl = data.url;
                                    
                                    if (!imageUrl) {
                                      throw new Error('No variation was generated');
                                    }
                                    
                                    setState(prev => ({
                                      ...prev,
                                      frontCoverImage: imageUrl,
                                      // Preserve the original image and uploadedFile reference
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
                            onClick={() => handleDownloadFrontCover()}
                            disabled={isLoading.downloadingCover}
                          >
                            {isLoading.downloadingCover ? (
                              <span className="flex items-center">
                                <span className="animate-spin mr-2">⏳</span> Downloading...
                              </span>
                            ) : (
                              <>
                                <Download className="mr-2 h-4 w-4" />
                                Download Cover Image
                              </>
                            )}
                          </Button>
                          
                          <Button
                            variant="outline"
                            className="border-emerald-600/40 text-emerald-500 hover:bg-emerald-950/30 hover:text-emerald-400"
                            onClick={() => {
                              // Open the image in a new tab
                              if (state.frontCoverImage) {
                                window.open(state.frontCoverImage, '_blank');
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
                      const response = await fetch('https://puzzlemakeribral-production.up.railway.app/api/openai/enhance-prompt', {
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
                
                <div className="space-y-2 mt-4">
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
                    if (!state.backCoverPrompt) {
                      toast.error("Please generate a back cover description first");
                      return;
                    }
                    
                    setIsLoading({...isLoading, generateBackCover: true});
                    toast.info("Generating back cover design...");
                    
                    try {
                      // Modified approach to use front cover generation API for back cover
                      const response = await fetch('https://puzzlemakeribral-production.up.railway.app/api/book-cover/generate-front', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          prompt: `Professional book back cover design with: ${state.backCoverPrompt}`,
                          width: Math.round(state.bookSettings.dimensions.width * 300), // Convert inches to pixels at 300 DPI
                          height: Math.round(state.bookSettings.dimensions.height * 300),
                          negative_prompt: 'text, watermark, signature, blurry, low quality, distorted, deformed',
                          seed: Math.floor(Math.random() * 1000000) // Random seed for variation
                        })
                      });
                      
                      if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Failed to generate back cover');
                      }
                      
                      const data = await response.json();
                      const imageUrl = data.url;
                      
                      if (!imageUrl) {
                        throw new Error('No image was generated');
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
                  disabled={isLoading.generateBackCover || !state.backCoverPrompt}
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
                          const response = await fetch('https://puzzlemakeribral-production.up.railway.app/api/book-cover/generate-front', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              prompt: `Professional book back cover design with: ${state.backCoverPrompt}`,
                              width: Math.round(state.bookSettings.dimensions.width * 300),
                              height: Math.round(state.bookSettings.dimensions.height * 300),
                              negative_prompt: 'text, watermark, signature, blurry, low quality, distorted, deformed',
                              seed: Math.floor(Math.random() * 1000000) // Different seed for variation
                            })
                          });
                          
                          if (!response.ok) {
                            throw new Error('Failed to regenerate back cover');
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
                
                <div className="space-y-2 mt-4">
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
                
                <div className="space-y-2 mt-4">
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
                    <div className="absolute inset-0 pointer-events-none">
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