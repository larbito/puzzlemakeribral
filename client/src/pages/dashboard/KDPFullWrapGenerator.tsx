import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { 
  BookOpen, 
  Download, 
  Sparkles, 
  Ruler, 
  FileText, 
  Image as ImageIcon,
  Upload, 
  X,
  PlusCircle,
  Loader2
} from 'lucide-react';

// KDP Full Wrap Book Cover Generator component
const KDPFullWrapGenerator = () => {
  // State for form inputs
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [coverUrl, setCoverUrl] = useState('');
  const [error, setError] = useState('');
  const [trimSize, setTrimSize] = useState('6x9');
  const [paperType, setPaperType] = useState('white');
  const [pageCount, setPageCount] = useState(300);
  const [spineText, setSpineText] = useState('');
  const [spineColor, setSpineColor] = useState('');
  const [dominantColors, setDominantColors] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [generationStep, setGenerationStep] = useState<'form' | 'spine-options' | 'complete'>('form');

  // Trim Size options
  const trimSizeOptions = [
    { value: '5x8', label: '5″ × 8″' },
    { value: '5.25x8', label: '5.25″ × 8″' },
    { value: '6x9', label: '6″ × 9″' },
    { value: '7x10', label: '7″ × 10″' },
    { value: '8x10', label: '8″ × 10″' },
    { value: '8.5x11', label: '8.5″ × 11″' }
  ];

  // Paper type options
  const paperTypeOptions = [
    { value: 'white', label: 'White' },
    { value: 'cream', label: 'Cream' },
    { value: 'color', label: 'Color' }
  ];

  // API URL
  const API_URL = 'https://puzzlemakeribral-production.up.railway.app';

  // Calculate spine width based on page count and paper type
  const calculateSpineWidth = (pages: number, paper: string): number => {
    // For white paper: pages * 0.002252" (KDP's formula)
    // For cream paper: pages * 0.0025" (KDP's formula)
    // For color paper: pages * 0.002347" (approximate)
    const multiplier = paper === 'cream' ? 0.0025 : paper === 'color' ? 0.002347 : 0.002252;
    return pages * multiplier;
  };

  // Calculate final dimensions with bleed
  const coverDimensions = useMemo(() => {
    // Parse trim size
    const [widthInches, heightInches] = trimSize.split('x').map(Number);
    
    // Add bleed (0.125" on all sides)
    const bleedInches = 0.125;
    const spineWidthInches = calculateSpineWidth(pageCount, paperType);
    
    // Calculate total width: front + spine + back + bleed
    const totalWidthInches = (widthInches * 2) + spineWidthInches + (bleedInches * 2);
    const totalHeightInches = heightInches + (bleedInches * 2);
    
    // Convert to pixels at 300 DPI
    const dpi = 300;
    const widthPixels = Math.round(totalWidthInches * dpi);
    const heightPixels = Math.round(totalHeightInches * dpi);
    
    return {
      width: widthPixels,
      height: heightPixels,
      totalWidthInches: totalWidthInches.toFixed(2),
      totalHeightInches: totalHeightInches.toFixed(2),
      spineWidthInches: spineWidthInches.toFixed(3),
      dpi,
      trimWidthInches: widthInches,
      trimHeightInches: heightInches
    };
  }, [trimSize, pageCount, paperType]);

  // Function to handle prompt input change
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  // Handle spine text change
  const handleSpineTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSpineText(e.target.value);
  };

  // Handle page count change
  const handlePageCountChange = (value: number[]) => {
    setPageCount(value[0]);
  };

  // Handle page count input change
  const handlePageCountInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      if (value < 24) {
        setPageCount(24);
      } else if (value > 999) {
        setPageCount(999);
      } else {
        setPageCount(value);
      }
    }
  };

  // Handle spine color selection
  const handleSpineColorSelect = (color: string) => {
    setSpineColor(color);
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string' && uploadedImages.length < 5) {
          setUploadedImages([...uploadedImages, reader.result]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle image removal
  const handleRemoveImage = (index: number) => {
    const newImages = [...uploadedImages];
    newImages.splice(index, 1);
    setUploadedImages(newImages);
  };

  // Generate book cover
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (prompt.trim().length < 5) {
      setError("Please enter a longer prompt (at least 5 characters)");
      return;
    }

    try {
      setIsGenerating(true);
      setError('');

      // Step 1: Generate the front cover
      const formData = new FormData();
      formData.append('prompt', `Professional book cover design: ${prompt}. High resolution 300 DPI.`);
      formData.append('width', (coverDimensions.trimWidthInches * 300).toString());
      formData.append('height', (coverDimensions.trimHeightInches * 300).toString());
      formData.append('negative_prompt', 'text, watermark, low quality, distorted');

      const response = await fetch(`${API_URL}/api/ideogram/generate`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.url) {
        // Set the cover URL
        setCoverUrl(data.url);
        
        // Extract dominant colors from the generated image
        const colorsResponse = await fetch(`${API_URL}/api/book-cover/extract-colors`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageUrl: data.url })
        });
        
        if (colorsResponse.ok) {
          const colorsData = await colorsResponse.json();
          setDominantColors(colorsData.colors || []);
          if (colorsData.colors && colorsData.colors.length > 0) {
            setSpineColor(colorsData.colors[0]);
          }
        }
        
        // Move to spine options step
        setGenerationStep('spine-options');
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

  // Generate full wrap cover
  const handleGenerateFullWrap = async () => {
    if (!coverUrl) {
      setError("Front cover hasn't been generated yet");
      return;
    }

    try {
      setIsGenerating(true);
      setError('');

      const fullWrapData = {
        frontCoverUrl: coverUrl,
        trimSize,
        paperType,
        pageCount,
        spineColor,
        spineText: pageCount >= 100 ? spineText : '',
        addSpineText: pageCount >= 100 && spineText.length > 0,
        interiorImages: uploadedImages
      };

      const response = await fetch(`${API_URL}/api/book-cover/generate-full-wrap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fullWrapData)
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.url) {
        setCoverUrl(data.url);
        setGenerationStep('complete');
      } else {
        setError('No full wrap image URL returned');
      }
    } catch (err: any) {
      console.error("Error during full wrap generation:", err);
      setError(err.message || "Failed to generate full wrap cover");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mr-3 animate-pulse-glow">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-text-shimmer">
            Amazon KDP Full Wrap Cover Generator
          </h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Generate professional full wrap book covers (front, spine, back) optimized for Kindle Direct Publishing
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Controls */}
        <div className="lg:col-span-2">
          <Card className="bg-card/50 backdrop-blur-sm border border-primary/10 overflow-hidden">
            <CardHeader className="border-b border-primary/10 bg-gradient-to-r from-primary/5 to-secondary/5">
              <CardTitle className="flex items-center">
                <Sparkles className="mr-2 h-5 w-5 text-primary" />
                <span>Create Your Full Wrap Cover</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {generationStep === 'form' && (
                <form onSubmit={handleGenerate} className="space-y-6">
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
                        className="w-full min-h-[150px] rounded-lg border border-primary/20 bg-background p-4 text-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-y"
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
                  
                  {/* Book Specifications */}
                  <div className="space-y-6 rounded-lg bg-background/50 p-4 border border-primary/10">
                    <h3 className="font-medium flex items-center text-sm">
                      <Ruler className="h-4 w-4 mr-2 text-primary" />
                      Book Specifications
                    </h3>
                    
                    {/* Trim Size Selection */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Trim Size
                      </label>
                      <select 
                        value={trimSize} 
                        onChange={(e) => setTrimSize(e.target.value)}
                        className="w-full rounded-md border border-primary/20 bg-background p-2 text-sm text-foreground focus:border-primary focus:outline-none"
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
                      <label className="text-sm font-medium text-foreground">
                        Paper Type
                      </label>
                      <div className="flex space-x-2">
                        {paperTypeOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setPaperType(option.value)}
                            className={`flex-1 px-3 py-2 rounded-md text-sm ${
                              paperType === option.value 
                                ? "bg-primary text-background font-medium" 
                                : "bg-background hover:bg-primary/10 text-foreground"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Page Count */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground flex items-center">
                        <FileText className="h-4 w-4 mr-1 text-primary" />
                        Page Count: <span className="ml-2 text-primary font-medium">{pageCount} pages</span>
                      </label>
                      <div className="flex items-center space-x-2">
                        <Slider
                          value={[pageCount]}
                          min={24}
                          max={999}
                          step={1}
                          onValueChange={handlePageCountChange}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          min={24}
                          max={999}
                          value={pageCount}
                          onChange={handlePageCountInput}
                          className="w-16 text-center"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Minimum: 24, Maximum: 999
                      </p>
                    </div>

                    {/* Auto-Calculated Output Box */}
                    <div className="rounded-md bg-primary/5 p-3 space-y-1">
                      <h4 className="text-sm font-medium text-primary">Auto Size Preview</h4>
                      <ul className="text-xs space-y-1 text-muted-foreground">
                        <li className="flex justify-between">
                          <span>Final size with bleed:</span> 
                          <span className="font-medium text-foreground">{coverDimensions.totalWidthInches}" x {coverDimensions.totalHeightInches}"</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Spine width:</span> 
                          <span className="font-medium text-foreground">{coverDimensions.spineWidthInches}"</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Resolution:</span> 
                          <span className="font-medium text-foreground">{coverDimensions.width} x {coverDimensions.height} px</span>
                        </li>
                        <li className="flex justify-between">
                          <span>DPI:</span> 
                          <span className="font-medium text-foreground">300</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  {/* Generate Button */}
                  <Button
                    type="submit"
                    disabled={isGenerating || prompt.trim().length < 5}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Front Cover...
                      </>
                    ) : (
                      <>Generate Cover</>
                    )}
                  </Button>
                </form>
              )}

              {generationStep === 'spine-options' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Front Cover Generated!</h3>
                    <p className="text-sm text-muted-foreground">
                      Now let's customize the spine and back cover to complete your full wrap.
                    </p>
                  </div>

                  {/* Spine Color Selection */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Choose Spine Color</h4>
                    <div className="flex flex-wrap gap-2">
                      {dominantColors.map((color, index) => (
                        <button
                          key={index}
                          onClick={() => handleSpineColorSelect(color)}
                          className={`w-10 h-10 rounded-full border-2 ${
                            color === spineColor 
                              ? 'border-white shadow-lg' 
                              : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                          aria-label={`Color ${index + 1}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Spine Text Input - only if page count >= 100 */}
                  {pageCount >= 100 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Spine Text (Optional)
                      </label>
                      <Input
                        type="text"
                        value={spineText}
                        onChange={handleSpineTextChange}
                        placeholder="Text to display on the spine"
                        className="w-full"
                        maxLength={40}
                      />
                      <p className="text-xs text-muted-foreground">
                        {spineText.length}/40 characters
                      </p>
                    </div>
                  )}

                  {/* Back Cover Images */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Back Cover Images (Optional)</h4>
                    <div className="grid grid-cols-5 gap-2">
                      {uploadedImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={image} 
                            alt={`Uploaded ${index}`} 
                            className="w-full h-20 object-cover rounded-md"
                          />
                          <button
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Remove image"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {uploadedImages.length < 5 && (
                        <label className="w-full h-20 flex items-center justify-center border-2 border-dashed border-muted-foreground/40 rounded-md cursor-pointer hover:bg-accent/10 transition-colors">
                          <input 
                            type="file" 
                            accept="image/jpeg,image/png,image/webp" 
                            onChange={handleImageUpload} 
                            className="hidden" 
                          />
                          <PlusCircle className="h-5 w-5 text-muted-foreground" />
                        </label>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Upload up to 5 images for the back cover (jpg, png, webp)
                    </p>
                  </div>

                  {/* Generate Full Wrap Button */}
                  <Button
                    onClick={handleGenerateFullWrap}
                    disabled={isGenerating || !spineColor}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Full Wrap...
                      </>
                    ) : (
                      <>Generate Full Wrap Cover</>
                    )}
                  </Button>
                </div>
              )}
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
          
          {/* Preview Card */}
          <Card className="bg-card/50 backdrop-blur-sm border border-primary/10 overflow-hidden">
            <CardHeader className="border-b border-primary/10 bg-gradient-to-r from-secondary/5 to-primary/5">
              <CardTitle className="text-center">
                {coverUrl ? (
                  generationStep === 'complete' ? 'Full Wrap Cover' : 'Front Cover Preview'
                ) : 'Cover Preview'}
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
                  {generationStep === 'complete' && (
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                      <a 
                        href={coverUrl} 
                        download="kdp-full-wrap-cover.jpg"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-primary hover:bg-primary/90 text-background font-medium rounded-md px-4 py-2 flex items-center text-sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Cover
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-[280px] h-[400px] rounded-md flex items-center justify-center bg-muted border border-dashed border-primary/20 text-muted-foreground p-6 text-center">
                  <div>
                    <div className="text-4xl mb-4 opacity-70">📚</div>
                    <p className="text-sm">Your generated book cover will appear here</p>
                  </div>
                </div>
              )}
              
              {/* Download button */}
              {generationStep === 'complete' && coverUrl && (
                <a 
                  href={coverUrl} 
                  download="kdp-full-wrap-cover.jpg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 bg-primary hover:bg-primary/90 text-background font-medium rounded-md px-4 py-2 flex items-center text-sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Full KDP Cover
                </a>
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
                  <span>{trimSizeOptions.find(opt => opt.value === trimSize)?.label || trimSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paper Type:</span>
                  <span>{paperTypeOptions.find(opt => opt.value === paperType)?.label || paperType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Page Count:</span>
                  <span>{pageCount} pages</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Spine Width:</span>
                  <span>{coverDimensions.spineWidthInches}"</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Spine Text:</span>
                  <span>{pageCount >= 100 && spineText ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resolution:</span>
                  <span>{coverDimensions.width} x {coverDimensions.height} px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">DPI:</span>
                  <span>300</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={`
                    ${isGenerating ? "text-amber-400" : ""} 
                    ${generationStep === 'complete' ? "text-emerald-400" : ""}
                    ${error ? "text-red-400" : ""}
                    ${!isGenerating && !coverUrl && !error ? "text-muted-foreground" : ""}
                  `}>
                    {isGenerating ? 'Generating...' : (
                      generationStep === 'complete' ? 'Complete' : (
                        generationStep === 'spine-options' ? 'Front Cover Ready' : (
                          error ? 'Error' : 'Ready'
                        )
                      )
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Styles for animations */}
      <style jsx>{`
        @keyframes text-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        
        .animate-text-shimmer {
          background-size: 200% auto;
          animation: text-shimmer 5s infinite linear;
        }
      `}</style>
    </div>
  );
};

export default KDPFullWrapGenerator; 