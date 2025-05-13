import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BookOpenCheck, Download, Sparkles } from 'lucide-react';

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

    // Get dimensions based on selected size
    const { width, height } = sizePresets[size as keyof typeof sizePresets];

    try {
      // Enhanced prompt with style
      const enhancedPrompt = `Professional book cover design for Amazon KDP in ${style} style: ${promptToUse}. High resolution 300 DPI.`;
      
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
        style
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
      const { width, height } = sizePresets[size as keyof typeof sizePresets];
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
            Amazon KDP Book Cover Generator
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
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Size:</span>
                  <span>{sizePresets[size as keyof typeof sizePresets].label}</span>
                </div>
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