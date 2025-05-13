import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BookOpenCheck, Download, Calculator } from 'lucide-react';

// KDP Book cover generator component
const SimpleBookCoverGenerator = () => {
  // Remove unused state
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCover, setGeneratedCover] = useState<string | null>(null);

  // Fixed values for calculations
  const TRIM_SIZE = { width: 6, height: 9 };
  const PAGE_COUNT = 100;
  const PAPER_TYPE = "White";

  // Calculate dimensions based on fixed values
  const coverWidth = TRIM_SIZE.width;
  const coverHeight = TRIM_SIZE.height;
  
  const handleGenerateCover = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate-cover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          subtitle,
          author,
          trimSize: `${TRIM_SIZE.width}x${TRIM_SIZE.height}`,
          paperType: PAPER_TYPE,
          pageCount: PAGE_COUNT,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate cover");
      }

      const data = await response.json();
      setGeneratedCover(data.imageUrl);
    } catch (error) {
      console.error("Error generating cover:", error);
      // Handle error appropriately
    } finally {
      setIsGenerating(false);
    }
  };

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
    // Implementation needed
  };
  
  // Add a global function to trigger generation for debugging
  useEffect(() => {
    // @ts-ignore - add to window for debugging
    window.generateBookCover = (testPrompt?: string) => {
      const promptToUse = testPrompt || title;
      if (promptToUse.trim().length < 5) {
        console.log('Prompt too short, need at least 5 characters');
        return;
      }
      
      console.log(`Manually triggering generation with prompt: ${promptToUse}`);
      setTitle(promptToUse);
      handleGenerateCover();
    };
    
    return () => {
      // @ts-ignore - cleanup
      delete window.generateBookCover;
    };
  }, [title]);

  // Apply example prompt
  const applyExamplePrompt = (example: string) => {
    setTitle(example);
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      console.log('Form submitted');
      await handleGenerateCover();
    } catch (err) {
      console.error('Error in form submission:', err);
      // Handle error appropriately
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
    const bleed = 0.125; // 0.125" bleed on each side
    const spineWidth = calculateSpineWidth(PAGE_COUNT, PAPER_TYPE);
    
    // For full cover (front + spine + back)
    const fullWidth = coverWidth + (bleed * 2);
    const fullHeight = coverHeight + (bleed * 2);

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

  // Calculate current dimensions
  const dimensions = calculateFinalDimensions();
  
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
                  <label htmlFor="title" className="text-sm font-medium text-foreground">
                    Title
                  </label>
                  <div className="relative">
                    <textarea
                      id="title"
                      value={title}
                      onChange={handlePromptChange}
                      className="w-full min-h-[150px] rounded-lg border border-primary/20 bg-muted p-4 text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-y"
                      placeholder="Enter the title of your book"
                    />
                    <div className="absolute bottom-3 right-3 rounded-full bg-primary/10 px-2 py-1 text-xs">
                      {title.length} chars
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Min 5 characters</span>
                    <span className={title.length < 5 ? "text-red-400" : "text-primary"}>
                      {title.length < 5 ? 'Add more details' : '✓ Ready to generate'}
                    </span>
                  </div>
                </div>
                
                {/* Book Specification Section */}
                <div className="space-y-4">
                  {/* Trim Size - Static Display */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Book Trim Size
                    </label>
                    <div className="w-full rounded-md border border-primary/20 bg-muted/50 p-2 text-sm text-foreground">
                      6" x 9"
                    </div>
                  </div>

                  {/* Paper Type - Static Display */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Paper Type
                    </label>
                    <div className="w-full rounded-md border border-primary/20 bg-muted/50 p-2 text-sm text-foreground">
                      White
                    </div>
                  </div>

                  {/* Page Count - Static Display */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Page Count
                    </label>
                    <div className="w-full rounded-md border border-primary/20 bg-muted/50 p-2 text-sm text-foreground">
                      100 pages
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
                  disabled={isGenerating || title.trim().length < 5}
                  className={`w-full ${
                    isGenerating || title.trim().length < 5 
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
          {/* Error handling logic needed */}
          
          {/* Image preview */}
          <Card className="bg-card/50 backdrop-blur-sm border border-primary/10 overflow-hidden">
            <CardHeader className="border-b border-primary/10 bg-gradient-to-r from-secondary/5 to-primary/5">
              <CardTitle className="text-center">
                Generated Cover
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center justify-center min-h-[450px]">
              {generatedCover ? (
                <div className="relative">
                  <img 
                    src={generatedCover} 
                    alt="Generated Book Cover"
                    className="max-w-full max-h-[450px] rounded-md border border-primary/20 shadow-lg"
                  />
                  
                  <a 
                    href={generatedCover} 
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
                  <span>6" x 9"</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paper Type:</span>
                  <span>White</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Page Count:</span>
                  <span>100 pages</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Spine Width:</span>
                  <span>{dimensions?.spineWidth}" thick</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={`
                    ${isGenerating ? "text-amber-400" : ""} 
                    ${!isGenerating && generatedCover ? "text-primary" : ""}
                    ${!isGenerating && !generatedCover ? "text-muted-foreground" : ""}
                  `}>
                    {isGenerating ? 'Generating...' : (generatedCover ? 'Generated' : 'Ready')}
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