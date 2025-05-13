import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BookOpenCheck, Download, Calculator, ChevronDown, LayoutTemplate } from 'lucide-react';
import ToggleSwitch from '@/components/ui/toggleSwitch';
import { generateFullWrapCover, generateFrontCover } from '@/lib/bookCoverApi';

// KDP Book cover generator component
const SimpleBookCoverGenerator = () => {
  // State
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [coverUrl, setCoverUrl] = useState('');
  const [error, setError] = useState('');
  
  // We keep these states in the code but they're no longer exposed in the UI
  const [style, setStyle] = useState('realistic');
  const [coverType, setCoverType] = useState('front');
  
  // KDP specification state
  const [trimSize, setTrimSize] = useState('6x9');
  const [pageCount, setPageCount] = useState(100);
  const [paperType, setPaperType] = useState('white');
  const [showFullWrap, setShowFullWrap] = useState(false);
  const [spineText, setSpineText] = useState('');

  // Ref for the range input
  const rangeInputRef = useRef<HTMLInputElement>(null);

  // Create a direct reference to the slider element
  const sliderRef = useRef<HTMLInputElement>(null);

  // KDP trim size options
  const trimSizeOptions = [
    { value: '5x8', label: '5" x 8"', width: 5, height: 8 },
    { value: '5.06x7.81', label: '5.06" x 7.81"', width: 5.06, height: 7.81 },
    { value: '5.25x8', label: '5.25" x 8"', width: 5.25, height: 8 },
    { value: '5.5x8.5', label: '5.5" x 8.5"', width: 5.5, height: 8.5 },
    { value: '6x9', label: '6" x 9"', width: 6, height: 9 },
    { value: '6.14x9.21', label: '6.14" x 9.21"', width: 6.14, height: 9.21 },
    { value: '6.69x9.61', label: '6.69" x 9.61"', width: 6.69, height: 9.61 },
    { value: '7x10', label: '7" x 10"', width: 7, height: 10 },
    { value: '7.44x9.69', label: '7.44" x 9.69"', width: 7.44, height: 9.69 },
    { value: '7.5x9.25', label: '7.5" x 9.25"', width: 7.5, height: 9.25 },
    { value: '8x10', label: '8" x 10"', width: 8, height: 10 },
    { value: '8.25x6', label: '8.25" x 6"', width: 8.25, height: 6 },
    { value: '8.25x8.25', label: '8.25" x 8.25"', width: 8.25, height: 8.25 },
    { value: '8.5x8.5', label: '8.5" x 8.5"', width: 8.5, height: 8.5 },
    { value: '8.5x11', label: '8.5" x 11"', width: 8.5, height: 11 }
  ];

  // Paper type options
  const paperTypeOptions = [
    { value: 'white', label: 'White' },
    { value: 'cream', label: 'Cream' },
    { value: 'color', label: 'Color' }
  ];

  // Example prompts
  const examplePrompts = [
    'A mysterious fantasy novel cover with a glowing amulet in a dark forest',
    'A bright children\'s book cover featuring friendly cartoon animals in a garden',
    'A sleek minimalist book cover for a science fiction story about time travel',
    'A vintage-style mystery thriller cover with bold typography and a silhouette',
    'A romantic novel cover with a beach sunset and two silhouettes'
  ];

  // API URL
  const API_URL = 'https://puzzlemakeribral-production.up.railway.app';

  // Function to handle prompt input change
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };
  
  // Function to handle trim size change
  const handleTrimSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log('Changing trim size to:', e.target.value);
    setTrimSize(e.target.value);
  };

  // Function to handle paper type change
  const handlePaperTypeChange = (type: string) => {
    console.log('Changing paper type to:', type);
    // Force update to ensure UI changes
    // Handle blur correctly to avoid TypeScript error
    if (document.activeElement && 'blur' in document.activeElement) {
      (document.activeElement as HTMLElement).blur();
    }
    setPaperType(type);
  };

  // Update the slider appearance whenever page count changes
  useEffect(() => {
    if (sliderRef.current) {
      const percentage = ((pageCount - 24) / (800 - 24)) * 100;
      sliderRef.current.style.background = `linear-gradient(to right, #22c55e 0%, #22c55e ${percentage}%, #2e2e3d ${percentage}%, #2e2e3d 100%)`;
      sliderRef.current.value = pageCount.toString();
    }
  }, [pageCount]);

  // Function to directly update page count
  const updatePageCount = useCallback((newCount: number) => {
    // Enforce limits
    if (newCount < 24) newCount = 24;
    if (newCount > 800) newCount = 800;
    
    console.log('Setting page count to:', newCount);
    
    // Update state
    setPageCount(newCount);
  }, []);

  // Handle slider change with direct update
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCount = parseInt(e.target.value);
    updatePageCount(newCount);
  };

  // Handle input change with direct update
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCount = parseInt(e.target.value);
    if (!isNaN(newCount)) {
      updatePageCount(newCount);
    }
  };

  // Add a global function to trigger generation for debugging
  useEffect(() => {
    // @ts-ignore - add to window for debugging
    window.generateBookCover = (testPrompt?: string) => {
      const promptToUse = testPrompt || prompt;
      if (promptToUse.trim().length < 5) {
        console.log('Prompt too short, need at least 5 characters');
        return;
      }
      
      console.log(`Manually triggering generation with prompt: ${promptToUse}`);
      setPrompt(promptToUse);
      handleGenerate(promptToUse);
    };
    
    return () => {
      // @ts-ignore - cleanup
      delete window.generateBookCover;
    };
  }, [prompt]);

  // Apply example prompt
  const applyExamplePrompt = (example: string) => {
    setPrompt(example);
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      console.log('Form submitted');
      await handleGenerate();
    } catch (err) {
      console.error('Error in form submission:', err);
      setError('Form submission error. Check console.');
    }
  };
  
  // Calculate spine width based on page count and paper type
  const calculateSpineWidth = (pages: number, paper: string): number => {
    // KDP spine width calculation formulas
    const ppi = {
      white: 0.002252,
      cream: 0.0025,
      color: 0.002252
    };
    return pages * (ppi[paper as keyof typeof ppi]);
  };

  // Calculate final dimensions including bleed
  const calculateFinalDimensions = () => {
    const selectedTrim = trimSizeOptions.find(t => t.value === trimSize);
    if (!selectedTrim) return null;

    const bleed = 0.125; // 0.125" bleed on each side
    const spineWidth = calculateSpineWidth(pageCount, paperType);
    
    // For full cover (front + spine + back)
    const fullWidth = coverType === 'full' 
      ? (selectedTrim.width * 2) + spineWidth + (bleed * 2)
      : selectedTrim.width + (bleed * 2);
    
    const fullHeight = selectedTrim.height + (bleed * 2);

    // Calculate pixels at 300 DPI
    const pixelWidth = Math.ceil(fullWidth * 300);
    const pixelHeight = Math.ceil(fullHeight * 300);

    return {
      width: fullWidth.toFixed(3),
      height: fullHeight.toFixed(3),
      spineWidth: spineWidth.toFixed(3),
      pixels: `${pixelWidth} x ${pixelHeight}`,
      dpi: 300
    };
  };

  // The generate function - preserving existing API logic
  const handleGenerate = async (manualPrompt?: string) => {
    const promptToUse = manualPrompt || prompt;
    
    if (promptToUse.trim().length < 5) {
      alert("Please enter at least 5 characters");
      return;
    }

    console.log('Starting generation process');
    setIsGenerating(true);
    setError('');

    // Calculate dimensions based on KDP specs
    const dimensions = calculateFinalDimensions();
    if (!dimensions) {
      setError('Invalid trim size selected');
      setIsGenerating(false);
      return;
    }

    try {
      // Enhanced prompt with style
      const enhancedPrompt = `Professional book cover design for Amazon KDP in ${style} style: ${promptToUse}. High resolution 300 DPI.`;
      
      if (showFullWrap) {
        // Use the new full wrap generation API
        console.log('Generating full wrap cover...');
        const result = await generateFullWrapCover({
          prompt: enhancedPrompt,
          negative_prompt: 'text, watermark, low quality, distorted',
          trimSize,
          pageCount,
          paperType,
          spineText: spineText || undefined,
          bookTitle: promptToUse.split(' ').slice(0, 5).join(' '), // Use first few words as book title
          authorName: 'Author Name', // Placeholder author name
        });
        
        // Use the full wrap cover URL
        console.log('Full wrap cover generated:', result);
        setCoverUrl(result.fullCoverUrl);
      } else {
        // Use the front cover only API
        console.log('Generating front cover only...');
        const width = Math.ceil(parseFloat(dimensions.width) * 300);
        const height = Math.ceil(parseFloat(dimensions.height) * 300);
        
        const result = await generateFrontCover({
          prompt: enhancedPrompt,
          width,
          height,
          negative_prompt: 'text, watermark, low quality, distorted'
        });
        
        // Set the image URL
        console.log('Front cover generated:', result);
        setCoverUrl(result.url);
      }
    } catch (err: any) {
      console.error("Error during generation:", err);
      setError(err.message || "Failed to generate cover");
      const dimensions = calculateFinalDimensions();
      if (dimensions) {
        setCoverUrl(`https://placehold.co/${parseFloat(dimensions.width) * 300}x${parseFloat(dimensions.height) * 300}/ff5555/FFFFFF?text=Error:+Generation+Failed`);
      }
    } finally {
      console.log('Generation process completed');
      setIsGenerating(false);
    }
  };

  // Calculate current dimensions
  const dimensions = calculateFinalDimensions();
  
  // Get the selected trim size label
  const selectedTrimSize = trimSizeOptions.find(t => t.value === trimSize)?.label || '';
  
  // Get the selected paper type label
  const selectedPaperType = paperTypeOptions.find(p => p.value === paperType)?.label || '';

  return (
    <div className="relative container mx-auto py-8 px-4 sm:px-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-7">
          <Card className="bg-card/50 backdrop-blur-sm border border-primary/10">
            <CardHeader className="border-b border-primary/10 bg-gradient-to-r from-secondary/5 to-primary/5">
              <CardTitle className="flex items-center">
                <BookOpenCheck className="h-5 w-5 mr-2 text-green-500" /> KDP Book Cover Generator
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit}>
                {/* Main Panel */}
                <div className="mb-4">
                  {/* Prompt Input */}
                  <label htmlFor="prompt" className="block text-sm font-medium mb-2">
                    Describe your book cover
                  </label>
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={handlePromptChange}
                    placeholder="Example: A fantasy novel cover with a castle on a hill, stormy sky, and a sword in the foreground"
                    rows={4}
                    className="w-full rounded-md border border-primary/20 bg-muted p-4 text-sm text-foreground focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
                  />
                </div>

                {/* Example Prompts */}
                <div className="mb-6">
                  <p className="text-xs text-muted-foreground mb-2">Example prompts (click to use):</p>
                  <div className="flex flex-wrap gap-2">
                    {examplePrompts.map((example, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => applyExamplePrompt(example)}
                        className="text-xs bg-muted hover:bg-primary/10 text-primary px-2 py-1 rounded-full transition-colors"
                      >
                        {example.substring(0, 20)}...
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggle for Full Wrap */}
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Cover Type:</span>
                    <div className="flex items-center space-x-2">
                      <ToggleSwitch 
                        label="Full Wrap"
                        checked={showFullWrap}
                        onChange={setShowFullWrap}
                      />
                    </div>
                  </div>
                  
                  {showFullWrap && (
                    <div className="mt-4">
                      <label htmlFor="spineText" className="block text-sm font-medium mb-2">
                        Spine Text (Optional)
                      </label>
                      <input
                        id="spineText"
                        type="text"
                        value={spineText}
                        onChange={(e) => setSpineText(e.target.value)}
                        placeholder="Text for the spine (book title, author name)"
                        className="w-full rounded-md border border-primary/20 bg-muted p-3 text-sm text-foreground focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Note: Spine text will only appear if the book has 100+ pages
                      </p>
                    </div>
                  )}
                </div>

                {/* KDP Specifications */}
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">KDP Specifications</h3>
                    <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded-full">
                      KDP Compatible
                    </span>
                  </div>
                  
                  {/* Trim Size */}
                  <div className="mt-4">
                    <label htmlFor="trimSize" className="block text-sm font-medium mb-2">
                      Book Trim Size
                    </label>
                    <select
                      id="trimSize"
                      value={trimSize}
                      onChange={handleTrimSizeChange}
                      className="w-full rounded-md border border-primary/20 bg-muted p-3 text-sm text-foreground focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
                    >
                      {trimSizeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Paper Type Buttons */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">
                      Paper Type
                    </label>
                    <div className="flex space-x-4">
                      {paperTypeOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={`flex-1 py-2 px-3 text-sm rounded-md transition-all ${
                            paperType === option.value
                              ? 'bg-green-500 text-white font-medium shadow-sm'
                              : 'bg-muted text-foreground hover:bg-primary/10'
                          }`}
                          onClick={() => handlePaperTypeChange(option.value)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Page Count Slider */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">
                      Page Count: {pageCount}
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        ref={sliderRef}
                        type="range"
                        min="24"
                        max="800"
                        value={pageCount}
                        onChange={handleSliderChange}
                        className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer range-lg"
                      />
                      <input
                        id="pageCountInput"
                        type="number"
                        min="24"
                        max="800"
                        value={pageCount}
                        onChange={handleInputChange}
                        onBlur={(e) => {
                          const val = parseInt(e.target.value);
                          if (isNaN(val) || val < 24) {
                            updatePageCount(24);
                          } else if (val > 800) {
                            updatePageCount(800);
                          }
                        }}
                        onClick={(e) => e.currentTarget.select()}
                        className="w-20 rounded-md border border-primary/20 bg-muted p-2 text-sm text-foreground focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Auto-Calculated Dimensions */}
                  {dimensions && (
                    <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
                      <h4 className="text-sm font-medium text-foreground mb-2">
                        Auto-Calculated Dimensions
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Final size with bleed:</span>
                          <div className="font-medium">{dimensions.width}" x {dimensions.height}"</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Spine width:</span>
                          <div className="font-medium">{dimensions.spineWidth}"</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Resolution:</span>
                          <div className="font-medium">{dimensions.pixels} px</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">DPI:</span>
                          <div className="font-medium">{dimensions.dpi}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Generate Button */}
                <Button 
                  type="submit" 
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-white/20 border-t-white rounded-full"></div>
                      Generating your {showFullWrap ? 'full wrap' : 'cover'}...
                    </>
                  ) : (
                    <>Generate {showFullWrap ? 'Full Wrap Cover' : 'Front Cover'}</>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-5">
          {/* Error display */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-4 text-sm">
              {error}
            </div>
          )}
          
          {/* Image preview */}
          <Card className="bg-card/50 backdrop-blur-sm border border-primary/10 overflow-hidden">
            <CardHeader className="border-b border-primary/10 bg-gradient-to-r from-secondary/5 to-primary/5">
              <CardTitle className="text-center">
                Generated Cover
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center justify-center min-h-[450px]">
              {coverUrl ? (
                <div className="relative">
                  <img 
                    src={coverUrl} 
                    alt="Generated Book Cover"
                    className="max-w-full max-h-[450px] rounded-md border border-primary/20 shadow-lg"
                  />
                  
                  <a 
                    href={coverUrl} 
                    download={`kdp-book-${showFullWrap ? 'full-wrap' : 'front'}.png`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md px-4 py-2 flex items-center text-sm justify-center w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Cover
                  </a>
                </div>
              ) :
                <div className="w-[280px] h-[400px] rounded-md flex items-center justify-center bg-muted border border-dashed border-primary/20 text-muted-foreground p-6 text-center">
                  <div>
                    <div className="text-4xl mb-4 opacity-70">📚</div>
                    <p className="text-sm">Your generated book cover will appear here</p>
                  </div>
                </div>
              }
            </CardContent>
          </Card>

          {/* Cover Specifications Summary */}
          <Card className="bg-card/50 backdrop-blur-sm border border-primary/10 mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Cover Specifications</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="grid grid-cols-2 gap-y-2">
                <div className="text-muted-foreground">Trim Size:</div>
                <div>{selectedTrimSize}</div>
                
                <div className="text-muted-foreground">Paper Type:</div>
                <div>{selectedPaperType}</div>
                
                <div className="text-muted-foreground">Page Count:</div>
                <div>{pageCount} pages</div>
                
                <div className="text-muted-foreground">Cover Type:</div>
                <div>{showFullWrap ? 'Full Wrap' : 'Front Only'}</div>
                
                <div className="text-muted-foreground">Print Quality:</div>
                <div>300 DPI (Print Ready)</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SimpleBookCoverGenerator; 