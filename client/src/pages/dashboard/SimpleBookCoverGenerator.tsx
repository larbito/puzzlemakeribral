import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
    <div className="container max-w-6xl mx-auto py-8 px-4">
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mr-3 animate-pulse-glow">
            <BookOpenCheck className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-text-shimmer">
            Amazon KDP Book Cover Creator
          </h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Generate professional book covers optimized for Kindle Direct Publishing
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Controls */}
        <div className="lg:col-span-2">
          <Card className="bg-card/50 backdrop-blur-sm border border-primary/10 overflow-hidden">
            <CardHeader className="border-b border-primary/10 bg-gradient-to-r from-primary/5 to-secondary/5">
              <CardTitle className="flex items-center">
                <Sparkles className="mr-2 h-5 w-5 text-primary" />
                <span>Create Your Book Cover</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Cover Type Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Cover Type
                  </label>
                  <div className="bg-muted rounded-lg p-1 grid grid-cols-2 gap-1">
                    {coverTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setCoverType(type.value)}
                        className={`rounded-md px-3 py-2 text-sm transition-all ${
                          coverType === type.value 
                            ? "bg-primary text-background font-medium" 
                            : "hover:bg-primary/10 text-foreground"
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Book Specifications - only show when full cover is selected */}
                {coverType === 'full' && (
                  <div className="space-y-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium">Book Specifications</h3>
                      <div className="bg-secondary/20 rounded-full p-1">
                        <Info className="h-3.5 w-3.5 text-secondary" />
                      </div>
                    </div>
                    
                    {/* Trim Size */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Trim Size
                      </label>
                      <select
                        value={trimSize}
                        onChange={(e) => setTrimSize(e.target.value)}
                        className="w-full rounded-md border border-primary/20 bg-muted p-2 text-sm text-foreground focus:border-primary"
                      >
                        {trimSizeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Page Count */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <label className="text-sm font-medium text-foreground">
                          Page Count
                        </label>
                        <span className="text-xs text-muted-foreground">
                          {pageCount} pages
                        </span>
                      </div>
                      <div className="flex gap-4 items-center">
                        <input
                          type="range"
                          min="24"
                          max="800"
                          value={pageCount}
                          onChange={(e) => setPageCount(parseInt(e.target.value))}
                          className="flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-muted"
                        />
                        <input 
                          type="number"
                          min="24"
                          max="800"
                          value={pageCount}
                          onChange={(e) => setPageCount(Math.min(800, Math.max(24, parseInt(e.target.value) || 24)))}
                          className="w-16 p-1 text-sm text-center rounded border border-primary/20 bg-muted"
                        />
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
                            onClick={() => setPaperType(option.value)}
                            className={`flex-1 px-3 py-2 rounded-md text-sm ${
                              paperType === option.value 
                                ? "bg-primary text-background font-medium" 
                                : "bg-muted hover:bg-primary/10 text-foreground"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Spine Text - only show if page count is 100 or more */}
                    {bookSpecs.showSpineText && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Spine Text (optional)
                        </label>
                        <input
                          type="text"
                          value={spineText}
                          onChange={(e) => setSpineText(e.target.value)}
                          placeholder="Title and author for spine"
                          className="w-full rounded-md border border-primary/20 bg-muted p-2 text-sm text-foreground focus:border-primary"
                        />
                      </div>
                    )}
                    
                    {/* Auto-calculated output box */}
                    <div className="mt-3 p-3 border border-secondary/20 rounded-md bg-secondary/5">
                      <h4 className="text-xs font-medium text-foreground mb-2">
                        Auto Size Preview
                      </h4>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div className="text-muted-foreground">Final size with bleed:</div>
                        <div className="text-right">{bookSpecs.finalWidthInches}" x {bookSpecs.finalHeightInches}"</div>
                        
                        <div className="text-muted-foreground">Spine width:</div>
                        <div className="text-right">{bookSpecs.spineWidthInches}"</div>
                        
                        <div className="text-muted-foreground">Resolution:</div>
                        <div className="text-right">{bookSpecs.pixelWidth} x {bookSpecs.pixelHeight} px</div>
                        
                        <div className="text-muted-foreground">DPI:</div>
                        <div className="text-right">300</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Prompt Input */}
                <div className="space-y-2">
                  <label htmlFor="prompt" className="text-sm font-medium text-foreground">
                    Describe your book cover
                  </label>
                  <div className="relative">
                    <textarea
                      id="prompt"
                      value={prompt}
                      onChange={handlePromptChange}
                      className="w-full min-h-[150px] rounded-lg border border-primary/20 bg-muted p-4 text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-y"
                      placeholder="Describe your ideal book cover in detail. Include style, mood, main elements, colors, etc."
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
                
                {/* Style options */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Cover Style
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {styleOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setStyle(option.value)}
                        className={`px-4 py-2 rounded-md text-sm ${
                          style === option.value 
                            ? "bg-primary text-background font-medium" 
                            : "bg-muted hover:bg-primary/10 text-foreground"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Size selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Cover Size
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(sizePresets).map(([key, preset]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSize(key)}
                        className={`px-3 py-2 rounded-md text-sm ${
                          size === key 
                            ? "bg-primary text-background font-medium" 
                            : "bg-muted hover:bg-primary/10 text-foreground"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
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
              </form>

              {/* Example prompts */}
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
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Preview */}
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
                {coverUrl ? 'Generated Cover' : 'Cover Preview'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center justify-center min-h-[450px]">
              {coverUrl ? (
                <div className="relative group">
                  <img 
                    src={coverUrl} 
                    alt="Generated Book Cover"
                    className="max-w-full max-h-[450px] rounded-md border border-primary/20 shadow-lg"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                    <a 
                      href={coverUrl} 
                      download="kdp-book-cover.png"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-primary hover:bg-primary/90 text-background font-medium rounded-md px-4 py-2 flex items-center text-sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Cover
                    </a>
                  </div>
                </div>
              ) : (
                <div className="w-[280px] h-[400px] rounded-md flex items-center justify-center bg-muted border border-dashed border-primary/20 text-muted-foreground p-6 text-center">
                  <div>
                    <div className="text-4xl mb-4 opacity-70">📚</div>
                    <p className="text-sm">Your generated book cover will appear here</p>
                  </div>
                </div>
              )}
              
              {/* Download button (visible when not hovering) */}
              {coverUrl && (
                <a 
                  href={coverUrl} 
                  download="kdp-book-cover.png"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 bg-primary hover:bg-primary/90 text-background font-medium rounded-md px-4 py-2 flex items-center text-sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Cover
                </a>
              )}
            </CardContent>
          </Card>

          {/* Selected options summary */}
          <Card className="bg-card/50 backdrop-blur-sm border border-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Selected Options</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cover Type:</span>
                  <span>{coverTypes.find(type => type.value === coverType)?.label || 'Front Cover'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Style:</span>
                  <span>{styleOptions.find(opt => opt.value === style)?.label || style}</span>
                </div>
                
                {coverType === 'front' && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size:</span>
                    <span>{sizePresets[size as keyof typeof sizePresets].label}</span>
                  </div>
                )}
                
                {coverType === 'full' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Trim Size:</span>
                      <span>{trimSizeOptions.find(opt => opt.value === trimSize)?.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pages:</span>
                      <span>{pageCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Paper:</span>
                      <span>{paperTypeOptions.find(opt => opt.value === paperType)?.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Final Size:</span>
                      <span>{bookSpecs.finalWidthInches}" × {bookSpecs.finalHeightInches}"</span>
                    </div>
                  </>
                )}
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={`
                    ${isGenerating ? "text-amber-400" : ""} 
                    ${!isGenerating && coverUrl ? "text-primary" : ""}
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

      {/* Add a style tag for animations */}
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
        `}
      </style>
    </div>
  );
};

export default SimpleBookCoverGenerator; 