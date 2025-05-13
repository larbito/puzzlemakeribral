import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BookOpenCheck, Download, Sparkles, Info } from 'lucide-react';

// KDP Book cover generator component
const SimpleBookCoverGenerator = () => {
  // State
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [coverUrl, setCoverUrl] = useState('');
  const [error, setError] = useState('');
  const [style, setStyle] = useState('realistic');
  const [size, setSize] = useState('standard');
  const [coverType, setCoverType] = useState('front');
  
  // KDP-specific state
  const [trimSize, setTrimSize] = useState('6x9');
  const [pageCount, setPageCount] = useState(200);
  const [paperType, setPaperType] = useState('white');
  const [spineText, setSpineText] = useState('');

  // Available style options
  const styleOptions = [
    { value: 'realistic', label: 'Realistic' },
    { value: 'artistic', label: 'Artistic' },
    { value: 'vintage', label: 'Vintage' },
    { value: 'minimalist', label: 'Minimalist' },
    { value: 'fantasy', label: 'Fantasy' }
  ];

  // Size presets (width x height)
  const sizePresets = {
    standard: { width: 1500, height: 2100, label: 'Standard (1500×2100)' },
    large: { width: 2000, height: 3000, label: 'Large (2000×3000)' },
    square: { width: 2000, height: 2000, label: 'Square (2000×2000)' },
    wide: { width: 2400, height: 1800, label: 'Wide (2400×1800)' }
  };

  // Cover type options
  const coverTypes = [
    { value: 'front', label: 'Front Cover Only' },
    { value: 'full', label: 'Full Cover (Front, Spine, Back)' }
  ];
  
  // KDP trim size options (width x height in inches)
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
    { value: '8.5x11', label: '8.5" x 11"', width: 8.5, height: 11 },
  ];
  
  // Paper type options
  const paperTypeOptions = [
    { value: 'white', label: 'White' },
    { value: 'cream', label: 'Cream' },
    { value: 'color', label: 'Color' },
  ];

  // Example prompts
  const examplePrompts = [
    'A mysterious fantasy novel cover with a glowing amulet in a dark forest',
    'A bright children\'s book cover featuring friendly cartoon animals in a garden',
    'A sleek minimalist book cover for a science fiction story about time travel',
    'A vintage-style mystery thriller cover with bold typography and a silhouette',
    'A romantic novel cover with a beach sunset and two silhouettes'
  ];

  // Calculate spine width and final dimensions for full covers
  const bookSpecs = useMemo(() => {
    // Get selected trim size
    const selectedTrim = trimSizeOptions.find(option => option.value === trimSize) || trimSizeOptions[4]; // Default to 6x9
    
    // Calculate spine width (in inches)
    // Using KDP formulas: https://kdp.amazon.com/en_US/help/topic/G201857950
    const pagesPerInch = paperType === 'white' ? 434 : 370; // White paper = 434 pages/inch, Cream = 370 pages/inch
    const spineWidth = pageCount / pagesPerInch;
    
    // Add bleed (0.125" on all sides per KDP specs)
    const bleedAmount = 0.125; 
    
    // Calculate dimensions with bleed
    const coverWidthWithBleed = selectedTrim.width * 2 + spineWidth + (bleedAmount * 2);
    const coverHeightWithBleed = selectedTrim.height + (bleedAmount * 2);
    
    // Pixel dimensions at 300 DPI
    const pixelWidth = Math.round(coverWidthWithBleed * 300);
    const pixelHeight = Math.round(coverHeightWithBleed * 300);
    
    return {
      trimSize: selectedTrim,
      spineWidthInches: spineWidth.toFixed(3),
      finalWidthInches: coverWidthWithBleed.toFixed(2),
      finalHeightInches: coverHeightWithBleed.toFixed(2),
      pixelWidth,
      pixelHeight,
      showSpineText: pageCount >= 100,
    };
  }, [trimSize, pageCount, paperType]);

  // API URL
  const API_URL = 'https://puzzlemakeribral-production.up.railway.app';

  // Function to handle prompt input change
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
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
  
  // Minimal generate function with basic fetch
  const handleGenerate = async (manualPrompt?: string) => {
    const promptToUse = manualPrompt || prompt;
    
    if (promptToUse.trim().length < 5) {
      alert("Please enter at least 5 characters");
      return;
    }

    console.log('Starting generation process');
    setIsGenerating(true);
    setError('');

    try {
      // Get dimensions based on cover type and specifications
      let width, height, enhancedPrompt;
      
      if (coverType === 'full') {
        // Use calculated dimensions for full cover
        width = bookSpecs.pixelWidth;
        height = bookSpecs.pixelHeight;
        
        // Enhanced prompt with full cover details
        enhancedPrompt = `Professional full book cover (front, spine, back) for Amazon KDP in ${style} style: ${promptToUse}. Trim size: ${bookSpecs.trimSize.label}, spine width: ${bookSpecs.spineWidthInches} inches. ${spineText ? `Spine text: "${spineText}".` : ''} High resolution 300 DPI.`;
      } else {
        // For front cover only, use the size presets
        const sizePreset = sizePresets[size as keyof typeof sizePresets];
        width = sizePreset.width;
        height = sizePreset.height;
        
        // Enhanced prompt for front cover only
        enhancedPrompt = `Professional book cover design for Amazon KDP in ${style} style: ${promptToUse}. High resolution 300 DPI.`;
      }
      
      // Basic FormData approach that works with the API
      const formData = new FormData();
      formData.append('prompt', enhancedPrompt);
      formData.append('width', width.toString());
      formData.append('height', height.toString());
      formData.append('negative_prompt', 'text, watermark, low quality, distorted');

      // Log form data for debugging
      console.log("Form data created:", {
        prompt: enhancedPrompt,
        width,
        height,
        style,
        coverType,
        ...(coverType === 'full' ? {
          trimSize: bookSpecs.trimSize.label,
          pageCount,
          paperType,
          spineText,
        } : {})
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
        setCoverUrl(`https://placehold.co/${width}x${height}/4ade80/FFFFFF?text=Placeholder+Cover`);
        setError('No image URL returned - using placeholder');
      }
    } catch (err: any) {
      console.error("Error during generation:", err);
      setError(err.message || "Failed to generate cover");
      
      let width, height;
      if (coverType === 'full') {
        width = bookSpecs.pixelWidth;
        height = bookSpecs.pixelHeight;
      } else {
        const sizePreset = sizePresets[size as keyof typeof sizePresets];
        width = sizePreset.width;
        height = sizePreset.height;
      }
      
      setCoverUrl(`https://placehold.co/${width}x${height}/ff5555/FFFFFF?text=Error:+Generation+Failed`);
    } finally {
      console.log('Generation process completed');
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-b border-primary/10 z-50">
        <div className="container max-w-7xl mx-auto py-4 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <BookOpenCheck className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                KDP Cover Generator
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {coverUrl && (
                <a 
                  href={coverUrl} 
                  download="kdp-book-cover.png"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-full flex items-center text-sm transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Cover
                </a>
              )}
              <Button
                onClick={() => handleGenerate()}
                disabled={isGenerating || prompt.trim().length < 5}
                className="bg-primary hover:bg-primary/90"
              >
                {isGenerating ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Cover
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-7xl mx-auto pt-24 pb-8 px-4">
        <div className="flex gap-6">
          {/* Left Panel - Controls */}
          <div className="w-[400px] space-y-4">
            {/* Cover Type Toggle */}
            <Card className="overflow-hidden">
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Cover Type</h3>
                  <div className="bg-primary/10 rounded-full px-2 py-1 text-xs text-primary">
                    {coverType === 'full' ? 'Full Wrap' : 'Front Only'}
                  </div>
                </div>
                <div className="bg-muted rounded-lg p-1 grid grid-cols-2 gap-1">
                  {coverTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setCoverType(type.value)}
                      className={`rounded-md px-3 py-2 text-sm transition-all ${
                        coverType === type.value 
                          ? "bg-primary text-background font-medium" 
                          : "hover:bg-primary/10"
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Book Specifications */}
            {coverType === 'full' && (
              <Card className="overflow-hidden">
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Book Specifications</h3>
                    <div className="bg-primary/10 rounded-full p-1">
                      <Info className="h-4 w-4 text-primary" />
                    </div>
                  </div>

                  {/* Trim Size */}
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Trim Size</label>
                    <select
                      value={trimSize}
                      onChange={(e) => setTrimSize(e.target.value)}
                      className="w-full rounded-md border border-primary/20 bg-muted p-2 text-sm"
                    >
                      {trimSizeOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Page Count */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-sm text-muted-foreground">Page Count</label>
                      <span className="text-xs bg-primary/10 rounded-full px-2 py-1 text-primary">
                        {pageCount} pages
                      </span>
                    </div>
                    <input
                      type="range"
                      min="24"
                      max="800"
                      value={pageCount}
                      onChange={(e) => setPageCount(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* Paper Type */}
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Paper Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {paperTypeOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setPaperType(option.value)}
                          className={`px-3 py-2 rounded-md text-sm ${
                            paperType === option.value 
                              ? "bg-primary text-background" 
                              : "bg-muted hover:bg-primary/10"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Spine Text */}
                  {bookSpecs.showSpineText && (
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Spine Text</label>
                      <input
                        type="text"
                        value={spineText}
                        onChange={(e) => setSpineText(e.target.value)}
                        placeholder="Title and author for spine"
                        className="w-full rounded-md border border-primary/20 bg-muted p-2 text-sm"
                      />
                    </div>
                  )}

                  {/* Calculated Specs */}
                  <div className="bg-primary/5 rounded-lg p-3 space-y-2">
                    <h4 className="text-xs font-medium">Final Specifications</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-muted-foreground">Dimensions:</div>
                      <div className="text-right">{bookSpecs.finalWidthInches}" × {bookSpecs.finalHeightInches}"</div>
                      <div className="text-muted-foreground">Spine Width:</div>
                      <div className="text-right">{bookSpecs.spineWidthInches}"</div>
                      <div className="text-muted-foreground">Resolution:</div>
                      <div className="text-right">{bookSpecs.pixelWidth} × {bookSpecs.pixelHeight}px</div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Style Selection */}
            <Card className="overflow-hidden">
              <div className="p-4 space-y-3">
                <h3 className="text-sm font-medium">Cover Style</h3>
                <div className="grid grid-cols-2 gap-2">
                  {styleOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setStyle(option.value)}
                      className={`px-3 py-2 rounded-md text-sm ${
                        style === option.value 
                          ? "bg-primary text-background" 
                          : "bg-muted hover:bg-primary/10"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Size Selection (Front Cover Only) */}
            {coverType === 'front' && (
              <Card className="overflow-hidden">
                <div className="p-4 space-y-3">
                  <h3 className="text-sm font-medium">Cover Size</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(sizePresets).map(([key, preset]) => (
                      <button
                        key={key}
                        onClick={() => setSize(key)}
                        className={`px-3 py-2 rounded-md text-sm ${
                          size === key 
                            ? "bg-primary text-background" 
                            : "bg-muted hover:bg-primary/10"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Center Panel - Preview and Prompt */}
          <div className="flex-1 space-y-4">
            {/* Error Display */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-4 text-sm">
                {error}
              </div>
            )}

            {/* Preview Area */}
            <Card className="overflow-hidden bg-muted/50">
              <div className="aspect-[3/4] relative flex items-center justify-center p-6">
                {coverUrl ? (
                  <img 
                    src={coverUrl} 
                    alt="Generated Book Cover"
                    className="max-h-full rounded-lg shadow-xl transition-transform hover:scale-[1.02]"
                  />
                ) : (
                  <div className="text-center space-y-4 text-muted-foreground">
                    <div className="text-6xl">📚</div>
                    <p className="text-sm">Your cover will appear here</p>
                  </div>
                )}
                {isGenerating && (
                  <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto"></div>
                      <p className="text-sm font-medium">Creating your cover...</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Prompt Input */}
            <Card className="overflow-hidden">
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Describe Your Cover</h3>
                  <div className="text-xs text-muted-foreground">
                    {prompt.length} characters
                  </div>
                </div>
                <textarea
                  value={prompt}
                  onChange={handlePromptChange}
                  placeholder="Describe your ideal book cover in detail. Include style, mood, main elements, colors, etc."
                  className="w-full h-32 rounded-lg border border-primary/20 bg-muted p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    Min 5 characters required
                  </span>
                  <Button
                    onClick={() => handleGenerate()}
                    disabled={isGenerating || prompt.length < 5}
                    size="sm"
                  >
                    Generate
                  </Button>
                </div>
              </div>
            </Card>

            {/* Example Prompts */}
            <Card className="overflow-hidden">
              <div className="p-4 space-y-3">
                <h3 className="text-sm font-medium">Example Prompts</h3>
                <div className="space-y-2">
                  {examplePrompts.map((example, index) => (
                    <button
                      key={index}
                      onClick={() => applyExamplePrompt(example)}
                      className="w-full text-left p-3 rounded-md bg-muted hover:bg-primary/10 text-sm transition-colors"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: hsl(var(--primary) / 0.2);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--primary) / 0.3);
        }
        
        /* Range input styling */
        input[type="range"] {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          background: hsl(var(--primary) / 0.2);
          border-radius: 3px;
          outline: none;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          background: hsl(var(--primary));
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
};

export default SimpleBookCoverGenerator; 