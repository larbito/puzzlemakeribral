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
  Check
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
  backCoverPrompt: string;
  backCoverImage: string | null;
  interiorImages: string[];
  spineText: string;
  spineColor: string;
  spineFont: string;
  fullCoverImage: string | null;
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
    assembleFullCover: false
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
    
    // Set initial dimensions 
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
                      <Input
                        type="number"
                        value={state.bookSettings.pageCount}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (!isNaN(value) && value >= 24 && value <= 900) {
                            setState(prev => ({
                              ...prev, 
                              bookSettings: {
                                ...prev.bookSettings,
                                pageCount: value
                              }
                            }));
                          }
                        }}
                        className="w-20"
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
                          className="flex-1"
                        >
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
                    className="w-full mt-6 bg-emerald-600 hover:bg-emerald-500" 
                    disabled={isLoading.calculateDimensions}
                  >
                    {isLoading.calculateDimensions ? 
                      'Calculating...' : 
                      state.steps.settings ? 
                        'Recalculate Dimensions' : 
                        'Calculate Cover Dimensions'
                    }
                  </Button>
                </div>
              </div>
              
              {/* Live Preview Panel */}
              <div className="w-1/2 border border-zinc-700 rounded-lg p-4 bg-zinc-800/50">
                <h3 className="text-sm font-medium text-zinc-300 mb-4">Live Dimension Preview</h3>
                
                <div className="aspect-[1.4] relative border border-zinc-700 bg-zinc-900 mb-4 overflow-hidden">
                  {/* Preview rendering area */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {/* Dynamic preview based on settings */}
                    <div className="relative h-3/4 flex">
                      {/* Back cover */}
                      <div className="h-full aspect-[2/3] bg-zinc-100 border border-zinc-300 relative">
                        <div className="absolute inset-0 flex items-center justify-center text-zinc-400 text-xs font-medium">
                          Back Cover
                        </div>
                        {state.bookSettings.includeISBN && (
                          <div className="absolute bottom-3 right-3 w-16 h-8 bg-zinc-300 rounded-sm flex items-center justify-center text-[8px] text-zinc-600">
                            ISBN
                          </div>
                        )}
                      </div>
                      
                      {/* Spine */}
                      <div 
                        className="h-full bg-cyan-100 border-t border-b border-zinc-300 flex items-center justify-center"
                        style={{ 
                          width: `${Math.max(10, state.bookSettings.dimensions.spineWidth * 40)}px`
                        }}
                      >
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap text-[8px] text-zinc-600">
                          Spine ({state.bookSettings.dimensions.spineWidth.toFixed(3)}")
                        </div>
                      </div>
                      
                      {/* Front cover */}
                      <div className="h-full aspect-[2/3] bg-zinc-100 border border-zinc-300 relative">
                        <div className="absolute inset-0 flex items-center justify-center text-zinc-400 text-xs font-medium">
                          Front Cover
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Bleed indicator */}
                  {state.bookSettings.includeBleed && (
                    <div className="absolute inset-0 border-2 border-red-300 border-dashed m-2 pointer-events-none">
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-1 text-[8px] text-red-500">
                        Bleed Area (0.125")
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Trim Size:</span>
                    <span className="font-medium text-zinc-300">{state.bookSettings.bookSize.replace('x', ' × "')}"</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Page Count:</span>
                    <span className="font-medium text-zinc-300">{state.bookSettings.pageCount} pages</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Spine Width:</span>
                    <span className="font-medium text-zinc-300">{state.bookSettings.dimensions.spineWidth.toFixed(3)}"</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Total Cover Size:</span>
                    <span className="font-medium text-zinc-300">
                      {state.bookSettings.dimensions.totalWidth.toFixed(2)}" × {state.bookSettings.dimensions.totalHeight.toFixed(2)}"
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Bleed:</span>
                    <span className="font-medium text-zinc-300">{state.bookSettings.includeBleed ? '0.125" (included)' : 'None'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Resolution:</span>
                    <span className="font-medium text-zinc-300">300 DPI</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-zinc-700">
                  <div className="flex items-center space-x-2 text-xs text-emerald-400">
                    <Info className="w-4 h-4" />
                    <span>These dimensions are based on KDP printing requirements.</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Navigation buttons */}
            <div className="flex justify-between pt-4 border-t border-zinc-700">
              <Button variant="outline" disabled className="border-zinc-700 text-zinc-400">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              
              <Button
                onClick={() => state.steps.settings && goToStep('frontCover')}
                disabled={!state.steps.settings}
                className="bg-emerald-600 hover:bg-emerald-500"
              >
                Continue
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
                <div className="border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center bg-zinc-800/30">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Upload className="h-8 w-8 text-zinc-500" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-zinc-300">Drag and drop file or click to upload</p>
                      <p className="text-xs text-zinc-500">PNG, JPG or PDF (Max 5MB)</p>
                    </div>
                    <Button variant="outline" size="sm" className="border-zinc-700 hover:bg-zinc-800">
                      Browse Files
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-zinc-500">
                  Images should be at least 300 DPI and match the dimensions from your book settings.
                </p>
              </TabsContent>
            </Tabs>
            
            {/* Preview area */}
            {state.frontCoverImage && (
              <div className="mt-6">
                <h3 className="text-md font-medium mb-2">Cover Preview</h3>
                <div className="flex justify-center bg-zinc-100 rounded-lg p-4 border border-zinc-200">
                  <div className="relative" style={{
                    width: `${state.bookSettings.dimensions.width * 100}px`,
                    height: `${state.bookSettings.dimensions.height * 100}px`,
                    maxWidth: '100%',
                    maxHeight: '400px'
                  }}>
                    <img 
                      src={state.frontCoverImage} 
                      alt="Front Cover Preview" 
                      className="w-full h-full object-cover rounded-md shadow-lg"
                    />
                    
                    {/* Overlay with book title demo */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                      <div className="bg-black/30 backdrop-blur-sm px-4 py-2 rounded-lg">
                        <h2 className="text-xl font-bold text-white">YOUR BOOK TITLE</h2>
                        <p className="text-sm text-white/80">Author Name</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end mt-4">
                  <Button variant="outline" className="mr-2">
                    Regenerate
                  </Button>
                  <Button>
                    Use This Design
                  </Button>
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
                onClick={() => state.steps.frontCover && goToStep('backCover')}
                disabled={!state.steps.frontCover}
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
                  onClick={() => {
                    // Simulate getting prompt from front cover
                    setState(prev => ({
                      ...prev,
                      backCoverPrompt: "Generated from your front cover style: " + 
                        "A professional back cover matching the front design, with space for book description text and author bio."
                    }));
                    toast.success("Generated prompt based on front cover style");
                  }}
                  className="w-full border-emerald-900/50 text-emerald-400 hover:bg-emerald-900/20"
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate from Front Cover
                </Button>
                
                <div className="space-y-2 mt-4">
                  <Label>Interior Preview Images (Optional)</Label>
                  <p className="text-xs text-zinc-500">
                    Upload up to 4 interior pages to showcase on the back cover.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {[1, 2, 3, 4].map((idx) => (
                      <div 
                        key={idx}
                        className="aspect-square border border-dashed border-zinc-700 rounded-md flex items-center justify-center p-2"
                      >
                        <div className="text-center">
                          <Upload className="h-6 w-6 text-zinc-400 mx-auto" />
                          <span className="text-xs text-zinc-500">Image {idx}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Button 
                  onClick={() => {
                    setIsLoading({...isLoading, generateBackCover: true});
                    // Simulate API call to generate back cover
                    setTimeout(() => {
                      // In a real implementation, this would be the URL from the API
                      const imageUrl = 'https://placehold.co/600x900/1e293b/ffffff?text=AI+Generated+Back+Cover';
                      setState(prev => ({
                        ...prev,
                        backCoverImage: imageUrl,
                        steps: {
                          ...prev.steps,
                          backCover: true
                        }
                      }));
                      setIsLoading({...isLoading, generateBackCover: false});
                      toast.success("Back cover generated successfully!");
                    }, 2000);
                  }}
                  className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500"
                  disabled={isLoading.generateBackCover || !state.backCoverPrompt}
                >
                  {isLoading.generateBackCover ? 'Generating...' : 'Generate Back Cover'}
                </Button>
              </div>
              
              {/* Back Cover Preview */}
              <div className="space-y-4">
                <h3 className="text-md font-medium">Back Cover Preview</h3>
                <div 
                  className="rounded-lg border border-zinc-700 bg-zinc-800 flex items-center justify-center"
                  style={{
                    width: '100%',
                    height: '400px'
                  }}
                >
                  {state.backCoverImage ? (
                    <div className="relative w-full h-full">
                      <img 
                        src={state.backCoverImage} 
                        alt="Back Cover Preview" 
                        className="w-full h-full object-cover rounded-md"
                      />
                      
                      {/* ISBN Placeholder */}
                      {state.bookSettings.includeISBN && (
                        <div className="absolute bottom-4 right-4 w-20 h-10 bg-white/80 rounded-sm flex items-center justify-center text-xs text-gray-800 border border-zinc-700">
                          ISBN Barcode
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
                    <Button variant="outline">
                      Regenerate
                    </Button>
                    <Button>
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
                onClick={() => state.steps.backCover && goToStep('spine')}
                disabled={!state.steps.backCover}
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
                      width: `${Math.max(30, state.bookSettings.dimensions.spineWidth * 100)}px`,
                      height: '400px',
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
                onClick={() => state.steps.spine && goToStep('preview')}
                disabled={!state.steps.spine}
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
                onClick={() => state.steps.preview && goToStep('export')}
                disabled={!state.steps.preview}
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
                        width: `${Math.max(20, state.bookSettings.dimensions.spineWidth * 100)}px`,
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