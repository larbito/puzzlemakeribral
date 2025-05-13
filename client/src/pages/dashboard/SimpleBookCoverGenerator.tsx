import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BookOpenCheck, Download, Calculator, Image as ImageIcon } from 'lucide-react';

// KDP Book cover generator component
const SimpleBookCoverGenerator = () => {
  // State
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [coverUrl, setCoverUrl] = useState('');
  const [error, setError] = useState('');
  const [trimSize, setTrimSize] = useState('6x9');
  const [pageCount, setPageCount] = useState(100);
  const [paperType, setPaperType] = useState('white');

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

  // Calculate spine width based on page count and paper type
  const calculateSpineWidth = (pages: number, paper: string): number => {
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
    
    const fullWidth = selectedTrim.width + (bleed * 2);
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

  // Handle trim size change
  const handleTrimSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log('Changing trim size to:', e.target.value);
    setTrimSize(e.target.value);
  };

  // Handle paper type change
  const handlePaperTypeChange = (type: string) => {
    console.log('Changing paper type to:', type);
    setPaperType(type);
  };

  // Handle page count change
  const handlePageCountChange = (value: number) => {
    console.log('Changing page count to:', value);
    if (value >= 24 && value <= 800) {
      setPageCount(value);
    }
  };

  // Handle prompt change
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    console.log('Updating prompt:', e.target.value);
    setPrompt(e.target.value);
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with:', { prompt, trimSize, paperType, pageCount });
    
    try {
      await handleGenerate();
    } catch (err) {
      console.error('Error in form submission:', err);
      setError('Form submission error. Please try again.');
    }
  };

  // Generate function
  const handleGenerate = async () => {
    if (prompt.trim().length < 5) {
      setError("Please enter at least 5 characters in your description");
      return;
    }

    console.log('Starting generation process...');
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
      // Enhanced prompt with specs
      const enhancedPrompt = `Professional book cover design for Amazon KDP: ${prompt}. High resolution 300 DPI.`;
      console.log('Sending request with prompt:', enhancedPrompt);
      
      const formData = new FormData();
      formData.append('prompt', enhancedPrompt);
      formData.append('width', (parseFloat(dimensions.width) * 300).toString());
      formData.append('height', (parseFloat(dimensions.height) * 300).toString());
      formData.append('negative_prompt', 'text, watermark, low quality, distorted');
      
      console.log('Making API request...');
      const response = await fetch('https://puzzlemakeribral-production.up.railway.app/api/ideogram/generate', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to generate cover');
      }

      const data = await response.json();
      console.log('Received response:', data);
      
      if (data.url) {
        setCoverUrl(data.url);
      } else {
        setError('No image URL returned');
      }
    } catch (err: any) {
      console.error("Error during generation:", err);
      setError(err.message || "Failed to generate cover");
    } finally {
      setIsGenerating(false);
    }
  };

  // Calculate current dimensions
  const dimensions = calculateFinalDimensions();

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <BookOpenCheck className="h-8 w-8 text-primary" />
          KDP Book Cover Generator
        </h1>
        <p className="text-muted-foreground mt-2">
          Create professional book covers optimized for Amazon KDP specifications
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel: KDP Cover Setup */}
        <div className="space-y-6">
          <Card className="border-primary/10">
            <CardHeader className="border-b border-primary/10 bg-gradient-to-r from-primary/5 to-secondary/5">
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                Cover Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Cover Description */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Cover Description
                  </label>
                  <div className="relative">
                    <textarea
                      value={prompt}
                      onChange={handlePromptChange}
                      className="w-full min-h-[120px] rounded-lg border border-primary/20 bg-card p-4 text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-y"
                      placeholder="Describe your ideal book cover in detail. Include mood, style, main elements, colors, etc."
                    />
                    <div className="absolute bottom-3 right-3 text-xs bg-primary/10 px-2 py-1 rounded-full">
                      {prompt.length} chars
                    </div>
                  </div>
                </div>

                {/* KDP Specifications */}
                <div className="space-y-4">
                  {/* Trim Size */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Trim Size
                    </label>
                    <select
                      value={trimSize}
                      onChange={handleTrimSizeChange}
                      className="w-full rounded-md border border-primary/20 bg-card p-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                    >
                      {trimSizeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Paper Type */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Paper Type
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {paperTypeOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handlePaperTypeChange(option.value)}
                          className={`px-4 py-2 rounded-md text-sm transition-colors ${
                            paperType === option.value 
                              ? "bg-primary text-primary-foreground font-medium" 
                              : "bg-card hover:bg-primary/10"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Page Count */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Page Count
                    </label>
                    <div className="flex gap-4 items-center">
                      <input
                        type="range"
                        min="24"
                        max="800"
                        value={pageCount}
                        onChange={(e) => handlePageCountChange(parseInt(e.target.value))}
                        className="flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-primary/20"
                      />
                      <input
                        type="number"
                        min="24"
                        max="800"
                        value={pageCount}
                        onChange={(e) => handlePageCountChange(parseInt(e.target.value))}
                        className="w-20 rounded-md border border-primary/20 bg-card p-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Calculated Specifications */}
                  {dimensions && (
                    <div className="rounded-lg border border-primary/10 bg-primary/5 p-4">
                      <h4 className="text-sm font-medium mb-3">
                        Final Specifications
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Size with bleed:</span>
                          <div className="font-medium mt-1">{dimensions.width}" × {dimensions.height}"</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Spine width:</span>
                          <div className="font-medium mt-1">{dimensions.spineWidth}"</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Resolution:</span>
                          <div className="font-medium mt-1">{dimensions.pixels} px</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">DPI:</span>
                          <div className="font-medium mt-1">{dimensions.dpi}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Generate Button */}
                <Button
                  type="submit"
                  disabled={isGenerating || prompt.trim().length < 5}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                      Generating...
                    </>
                  ) : (
                    'Generate Cover'
                  )}
                </Button>

                {/* Error Display */}
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4 text-sm">
                    {error}
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Cover Preview */}
        <div className="space-y-6">
          <Card className="border-primary/10">
            <CardHeader className="border-b border-primary/10 bg-gradient-to-r from-secondary/5 to-primary/5">
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                Cover Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center min-h-[500px] rounded-lg bg-card/50">
                {coverUrl ? (
                  <div className="relative group">
                    <img 
                      src={coverUrl} 
                      alt="Generated Book Cover"
                      className="max-w-full max-h-[500px] rounded-lg shadow-lg transition-transform group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                      <a 
                        href={coverUrl} 
                        download="kdp-book-cover.png"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-md px-4 py-2 flex items-center gap-2 text-sm shadow-lg"
                      >
                        <Download className="h-4 w-4" />
                        Download Cover
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">
                      Your generated book cover will appear here
                    </p>
                    <p className="text-xs mt-2 opacity-70">
                      Fill in the specifications and click Generate
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cover Details */}
          {coverUrl && (
            <Card className="border-primary/10">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Trim Size:</span>
                    <div className="font-medium mt-1">
                      {trimSizeOptions.find(t => t.value === trimSize)?.label}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Paper Type:</span>
                    <div className="font-medium mt-1">
                      {paperTypeOptions.find(p => p.value === paperType)?.label}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Page Count:</span>
                    <div className="font-medium mt-1">{pageCount} pages</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <div className="font-medium mt-1 text-green-500">
                      Ready to Download
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleBookCoverGenerator; 