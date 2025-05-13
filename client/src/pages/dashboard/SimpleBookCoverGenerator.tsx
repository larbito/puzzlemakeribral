import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BookOpenCheck, Download, Calculator, ChevronDown } from 'lucide-react';

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

  // Ref for the range input
  const rangeInputRef = useRef<HTMLInputElement>(null);

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
    document.activeElement?.blur(); // Remove focus from current element
    setPaperType(type);
  };

  // Function to handle page count change from slider
  const handlePageCountSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCount = parseInt(e.target.value);
    console.log('Changing page count from slider to:', newCount);
    
    // Force update to UI
    e.target.style.background = `linear-gradient(to right, #22c55e 0%, #22c55e ${(newCount-24)/(800-24)*100}%, #2e2e3d ${(newCount-24)/(800-24)*100}%, #2e2e3d 100%)`;
    
    // Update the state
    setPageCount(newCount);
  };

  // Function to handle page count change from input
  const handlePageCountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newCount = parseInt(e.target.value);
    
    // Enforce min/max constraints
    if (isNaN(newCount)) return;
    if (newCount < 24) newCount = 24;
    if (newCount > 800) newCount = 800;
    
    console.log('Changing page count from input to:', newCount);
    setPageCount(newCount);
    
    // Update the range slider if it exists
    if (rangeInputRef.current) {
      rangeInputRef.current.value = newCount.toString();
      rangeInputRef.current.style.background = `linear-gradient(to right, #22c55e 0%, #22c55e ${(newCount-24)/(800-24)*100}%, #2e2e3d ${(newCount-24)/(800-24)*100}%, #2e2e3d 100%)`;
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
      // Enhanced prompt with style - keeping the API call structure the same
      const enhancedPrompt = `Professional book cover design for Amazon KDP in ${style} style: ${promptToUse}. High resolution 300 DPI.`;
      
      // Basic FormData approach that works with the API
      const formData = new FormData();
      formData.append('prompt', enhancedPrompt);
      formData.append('width', (parseFloat(dimensions.width) * 300).toString());
      formData.append('height', (parseFloat(dimensions.height) * 300).toString());
      formData.append('negative_prompt', 'text, watermark, low quality, distorted');

      // Log form data for debugging
      console.log("Form data created:", {
        prompt: enhancedPrompt,
        width: dimensions.width,
        height: dimensions.height,
        style,
        spineWidth: dimensions.spineWidth
      });
      
      console.log(`Sending request to ${API_URL}/api/ideogram/generate`);
      
      // Make the API call using the ideogram endpoint
      const response = await fetch(`${API_URL}/api/ideogram/generate`, {
        method: 'POST',
        body: formData
      });

      console.log(`Response status: ${response.status}`);
      
      // Process response
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error response: ${errorText}`);
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log("API Response data:", data);

      // Set the image URL using the 'url' property from the API response
      if (data.url) {
        console.log(`Image URL received: ${data.url.substring(0, 60)}...`);
        setCoverUrl(data.url);
      } else {
        console.log('No URL found in response, using placeholder');
        setCoverUrl(`https://placehold.co/${dimensions.width}x${dimensions.height}/4ade80/FFFFFF?text=Placeholder+Cover`);
        setError('No image URL returned - using placeholder');
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
    <div className="container max-w-6xl mx-auto py-8 px-4">
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mr-3 animate-pulse-glow">
            <BookOpenCheck className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-text-shimmer">
            Amazon KDP Book Cover Generator
          </h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Generate professional book covers optimized for Kindle Direct Publishing
        </p>
      </div>
      
      {/* Two Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: KDP Cover Setup */}
        <div>
          <Card className="bg-card/50 backdrop-blur-sm border border-primary/10 overflow-hidden h-full">
            <CardHeader className="border-b border-primary/10 bg-gradient-to-r from-primary/5 to-secondary/5">
              <CardTitle className="flex items-center">
                <Calculator className="mr-2 h-5 w-5 text-primary" />
                <span>Book Cover Details (KDP Compliant)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Prompt Input */}
                <div className="space-y-2">
                  <label htmlFor="prompt" className="text-sm font-medium text-foreground">
                    Describe your cover
                  </label>
                  <div className="relative">
                    <textarea
                      id="prompt"
                      value={prompt}
                      onChange={handlePromptChange}
                      className="w-full min-h-[150px] rounded-lg border border-primary/20 bg-muted p-4 text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-y"
                      placeholder="Describe your ideal book cover in detail. Include mood, main elements, colors, etc."
                    />
                    <div className="absolute bottom-3 right-3 rounded-full bg-primary/10 px-2 py-1 text-xs">
                      {prompt.length} chars
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Min 5 characters</span>
                    <span className={prompt.length < 5 ? "text-red-400" : "text-primary"}>
                      {prompt.length < 5 ? 'Add more details' : '✓ Ready to generate'}
                    </span>
                  </div>
                </div>
                
                {/* Book Specification Section */}
                <div className="space-y-4">
                  {/* Trim Size */}
                  <div className="space-y-2">
                    <label htmlFor="trimSize" className="text-sm font-medium text-foreground">
                      Book Trim Size
                    </label>
                    <div className="relative">
                      <select
                        id="trimSize"
                        value={trimSize}
                        onChange={handleTrimSizeChange}
                        className="w-full appearance-none rounded-md border border-primary/20 bg-muted p-2 pr-8 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
                      >
                        {trimSizeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none text-foreground/70" />
                    </div>
                  </div>

                  {/* Paper Type */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Paper Type
                    </label>
                    <div className="flex gap-2">
                      {paperTypeOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handlePaperTypeChange(option.value)}
                          className={`px-4 py-2 rounded-md text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                            paperType === option.value 
                              ? "bg-green-500 hover:bg-green-600 text-white font-medium shadow-lg" 
                              : "bg-muted hover:bg-muted/80 text-foreground hover:text-foreground/80"
                          } transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Page Count */}
                  <div className="space-y-2">
                    <label htmlFor="pageCount" className="text-sm font-medium text-foreground flex justify-between">
                      <span>Page Count</span>
                      <span className="text-green-500 font-medium">{pageCount} pages</span>
                    </label>
                    <div className="flex gap-4 items-center">
                      <input
                        id="pageCountSlider"
                        ref={rangeInputRef}
                        type="range"
                        min="24"
                        max="800"
                        step="1"
                        value={pageCount}
                        onChange={handlePageCountSliderChange}
                        onClick={(e) => e.currentTarget.focus()}
                        className="flex-1 h-3 rounded-lg appearance-none cursor-pointer bg-muted accent-green-500 focus:outline-none"
                        style={{
                          background: `linear-gradient(to right, #22c55e 0%, #22c55e ${(pageCount-24)/(800-24)*100}%, #2e2e3d ${(pageCount-24)/(800-24)*100}%, #2e2e3d 100%)`
                        }}
                      />
                      <input
                        id="pageCountInput"
                        type="number"
                        min="24"
                        max="800"
                        value={pageCount}
                        onChange={handlePageCountInputChange}
                        onBlur={(e) => {
                          // Extra validation on blur
                          let val = parseInt(e.target.value);
                          if (isNaN(val) || val < 24) val = 24;
                          if (val > 800) val = 800;
                          setPageCount(val);
                        }}
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
                  disabled={isGenerating || prompt.trim().length < 5}
                  className={`w-full ${
                    isGenerating || prompt.trim().length < 5 
                      ? "opacity-70" 
                      : "animate-pulse-glow"
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                      Generating...
                    </>
                  ) : (
                    <>Generate Cover</>
                  )}
                </Button>
                
                {/* Example Prompts Section */}
                <div className="mt-6 pt-6 border-t border-primary/10">
                  <h3 className="text-sm font-medium text-foreground mb-3 flex items-center">
                    <span className="mr-2">📝</span> Example Prompts
                  </h3>
                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2">
                    {examplePrompts.map((example, index) => (
                      <button
                        key={index}
                        onClick={() => applyExamplePrompt(example)}
                        className="w-full text-left px-4 py-3 rounded-md bg-muted hover:bg-primary/10 transition-colors text-sm"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Generated Cover Preview */}
        <div className="space-y-4">
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
                    download="kdp-book-cover.png"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md px-4 py-2 flex items-center text-sm justify-center w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Cover
                  </a>
                </div>
              ) : (
                <div className="w-[280px] h-[400px] rounded-md flex items-center justify-center bg-muted border border-dashed border-primary/20 text-muted-foreground p-6 text-center">
                  <div>
                    <div className="text-4xl mb-4 opacity-70">📚</div>
                    <p className="text-sm">Your generated book cover will appear here</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cover Specifications Summary */}
          <Card className="bg-card/50 backdrop-blur-sm border border-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Cover Specifications</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trim Size:</span>
                  <span>{selectedTrimSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paper Type:</span>
                  <span>{selectedPaperType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Page Count:</span>
                  <span>{pageCount} pages</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Spine Width:</span>
                  <span>{dimensions?.spineWidth}" thick</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={`
                    ${isGenerating ? "text-amber-400" : ""} 
                    ${!isGenerating && coverUrl ? "text-green-500" : ""}
                    ${!isGenerating && !coverUrl ? "text-muted-foreground" : ""}
                  `}>
                    {isGenerating ? 'Generating...' : (coverUrl ? 'Generated' : 'Ready')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add a style tag for animations and custom element styling */}
      <style>
        {`
          @keyframes text-shimmer {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
          
          .animate-text-shimmer {
            background-size: 200% auto;
            animation: text-shimmer 5s infinite linear;
          }
          
          /* Custom range slider styling */
          input[type=range] {
            -webkit-appearance: none;
            appearance: none;
            height: 10px;
            border-radius: 5px;
            outline: none;
          }
          
          input[type=range]:focus {
            outline: none;
          }
          
          input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #22c55e;
            cursor: pointer;
            border: none;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            transition: all 0.2s ease-in-out;
          }
          
          input[type=range]::-webkit-slider-thumb:hover {
            background: #16a34a;
            box-shadow: 0 1px 5px rgba(0,0,0,0.5);
            transform: scale(1.1);
          }
          
          input[type=range]::-moz-range-thumb {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #22c55e;
            cursor: pointer;
            border: none;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            transition: all 0.2s ease-in-out;
          }
          
          input[type=range]::-moz-range-thumb:hover {
            background: #16a34a;
            box-shadow: 0 1px 5px rgba(0,0,0,0.5);
          }
          
          input[type=range]::-ms-thumb {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #22c55e;
            cursor: pointer;
            border: none;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          }
          
          /* Track styling */
          input[type=range]::-webkit-slider-runnable-track {
            width: 100%;
            height: 10px;
            cursor: pointer;
            border-radius: 5px;
          }
          
          input[type=range]::-moz-range-track {
            width: 100%;
            height: 10px;
            cursor: pointer;
            border-radius: 5px;
          }
          
          input[type=range]::-ms-track {
            width: 100%;
            height: 10px;
            cursor: pointer;
            border-radius: 5px;
          }
          
          /* Number input styling */
          input[type=number] {
            appearance: textfield;
          }
          
          input[type=number]::-webkit-inner-spin-button, 
          input[type=number]::-webkit-outer-spin-button { 
            -webkit-appearance: none;
            margin: 0;
          }
          
          /* Fix select element in Firefox */
          select {
            -moz-appearance: none;
            text-indent: 0.01px;
            text-overflow: '';
          }
          
          /* Enhance paper type buttons */
          button[type=button] {
            user-select: none;
            -webkit-tap-highlight-color: transparent;
          }
        `}
      </style>
    </div>
  );
};

export default SimpleBookCoverGenerator; 