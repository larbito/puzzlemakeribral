import { useState, useRef, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Wand2, 
  Sparkles, 
  Download, 
  BookOpen, 
  Palette, 
  Brain, 
  ChevronDown, 
  Upload, 
  ImageIcon,
  FileText,
  MessageSquare,
  PlusSquare,
  FileOutput,
  Check,
  ChevronLeft,
  ChevronRight,
  File,
  ListPlus
} from 'lucide-react';
import { 
  generateImage, 
  imageToPrompt, 
  generateColoringPage, 
  generateColoringBook, 
  createColoringBookPDF, 
  downloadColoringPages,
  expandPrompts
} from '@/services/ideogramService';
import { toast } from 'sonner';

interface GeneratedBook {
  id: string;
  pages: string[];
  title: string;
}

interface ColoringPageOptions {
  bookTitle: string;
  trimSize: string;
  pageCount: number;
  addBlankPages: boolean;
  showPageNumbers: boolean;
  includeBleed: boolean;
  dpi: number;
}

export const AIColoringGenerator = () => {
  // Image to Prompt state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

  // Prompt to Coloring Book state
  const [coloringOptions, setColoringOptions] = useState<ColoringPageOptions>({
    bookTitle: '',
    trimSize: '8.5x11',
    pageCount: 10,
    addBlankPages: false,
    showPageNumbers: true,
    includeBleed: true,
    dpi: 300
  });
  const [bookPrompt, setBookPrompt] = useState('');
  const [expandedPrompts, setExpandedPrompts] = useState<string[]>([]);
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingPdf, setIsCreatingPdf] = useState(false);
  const [generatedPages, setGeneratedPages] = useState<string[]>([]);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Handle file upload for Image to Prompt
  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Add warning about coloring book images
    toast.info('Please ensure you are uploading a coloring book style image. Other types of images may not work properly.');

    // Read and display the image
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
      setGeneratedPrompt(''); // Clear any previous prompt
    };
    reader.readAsDataURL(file);
  };

  // Navigate between preview pages
  const nextPreviewPage = () => {
    if (generatedPages.length > 0) {
      setActivePreviewIndex((prev) => (prev + 1) % generatedPages.length);
    }
  };

  const prevPreviewPage = () => {
    if (generatedPages.length > 0) {
      setActivePreviewIndex((prev) => (prev - 1 + generatedPages.length) % generatedPages.length);
    }
  };

  // Generate prompt from uploaded image
  const handleGeneratePrompt = async () => {
    if (!uploadedImage) {
      toast.error('Please upload an image first');
      return;
    }

    setIsGeneratingPrompt(true);
    try {
      // Convert data URL to blob
      const response = await fetch(uploadedImage);
      const blob = await response.blob();
      
      // Create a FormData with the blob
      const formData = new FormData();
      formData.append('image', blob, 'uploaded-image.png');
      formData.append('type', 'coloring'); // Explicitly specify this is for coloring book
      
      // Make a direct API call to the backend
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? window.location.origin.includes('vercel.app') 
          ? 'https://puzzlemakeribral-production.up.railway.app'
          : window.location.origin
        : 'http://localhost:3000';
      
      const apiResponse = await fetch(`${apiUrl}/api/ideogram/analyze`, {
        method: 'POST',
        body: formData
      });
      
      if (!apiResponse.ok) {
        throw new Error(`API error: ${apiResponse.status}`);
      }
      
      const data = await apiResponse.json();
      
      // Check if the response contains an error indicating this isn't a coloring page
      if (data.prompt?.toLowerCase().includes('not a coloring') || 
          data.prompt?.toLowerCase().includes('not suitable for coloring') ||
          data.prompt?.toLowerCase().includes('t-shirt design')) {
        toast.error('The uploaded image does not appear to be a coloring book page. Please upload a line art or coloring book style image.');
        setGeneratedPrompt('');
      } else {
        setGeneratedPrompt(data.prompt);
        toast.success('Prompt generated successfully');
      }
    } catch (error) {
      console.error('Error generating prompt:', error);
      toast.error('Failed to generate prompt. Please ensure you are uploading a coloring book style image.');
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  // Use generated prompt in the coloring book tab
  const usePromptForBook = () => {
    if (!generatedPrompt) {
      toast.error('No prompt available');
      return;
    }
    
    setBookPrompt(generatedPrompt);
    document.getElementById('prompt-to-book-tab')?.click();
    toast.success('Prompt added to coloring book generator');
  };

  // Generate a single test coloring page
  const handleGenerateTestPage = async () => {
    if (!bookPrompt.trim()) {
      toast.error('Please enter a prompt for your coloring page');
      return;
    }

    setIsGenerating(true);
    try {
      const pageUrl = await generateColoringPage(bookPrompt);
      if (pageUrl) {
        setGeneratedPages([pageUrl]);
        setActivePreviewIndex(0);
        toast.success('Test coloring page generated successfully');
      } else {
        throw new Error('Failed to generate test page');
      }
    } catch (error) {
      console.error('Error generating test page:', error);
      toast.error('Failed to generate test coloring page');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle generating multiple prompt variations
  const handleGeneratePrompts = async () => {
    if (!bookPrompt.trim()) {
      toast.error('Please enter a base prompt first');
      return;
    }

    if (coloringOptions.pageCount < 1 || coloringOptions.pageCount > 100) {
      toast.error('Page count must be between 1 and 100');
      return;
    }

    setIsGeneratingPrompts(true);
    setExpandedPrompts([]);

    try {
      toast.info(`Generating ${coloringOptions.pageCount} prompt variations...`);
      
      const variations = await expandPrompts(bookPrompt, coloringOptions.pageCount);
      
      if (!variations || variations.length === 0) {
        throw new Error('Failed to generate prompt variations');
      }
      
      setExpandedPrompts(variations);
      toast.success(`Generated ${variations.length} unique prompt variations!`);
      
    } catch (error) {
      console.error('Error generating prompt variations:', error);
      toast.error('Failed to generate prompt variations');
    } finally {
      setIsGeneratingPrompts(false);
    }
  };

  // Update expanded prompts when edited
  const updateExpandedPrompt = (index: number, newPrompt: string) => {
    const newPrompts = [...expandedPrompts];
    newPrompts[index] = newPrompt;
    setExpandedPrompts(newPrompts);
  };

  // Generate coloring book using expanded prompts
  const handleGenerateBook = async () => {
    if (expandedPrompts.length === 0) {
      toast.error('Please generate prompt variations first');
      return;
    }

    setIsGenerating(true);
    setGeneratedPages([]);
    setPdfUrl(null);

    try {
      toast.info(`Generating ${expandedPrompts.length} unique coloring pages...`);
      
      // Generate pages using the expanded prompts
      const pageUrls: string[] = [];
      
      // Generate pages for each prompt variation
      for (let i = 0; i < expandedPrompts.length; i++) {
        try {
          toast.info(`Generating page ${i+1} of ${expandedPrompts.length}...`, {
            id: `page-${i}`,
            duration: 2000
          });
          
          const pageUrl = await generateColoringPage(expandedPrompts[i]);
          if (pageUrl) {
            pageUrls.push(pageUrl);
            // Update UI immediately when each page is ready
            setGeneratedPages(prevPages => [...prevPages, pageUrl]);
          }
        } catch (pageError) {
          console.error(`Error generating page ${i+1}:`, pageError);
          // Continue with other pages
        }
      }
      
      if (pageUrls.length === 0) {
        throw new Error('Failed to generate any coloring pages');
      }
      
      setActivePreviewIndex(0);
      toast.success(`Generated ${pageUrls.length} coloring pages successfully`);
    } catch (error) {
      console.error('Error generating coloring book:', error);
      toast.error('Failed to generate coloring book');
    } finally {
      setIsGenerating(false);
    }
  };

  // Create and download PDF
  const handleCreatePdf = async () => {
    if (generatedPages.length === 0) {
      toast.error('No pages to create PDF from');
      return;
    }

    setIsCreatingPdf(true);
    try {
      toast.info('Creating PDF...');
      
      const pdfUrlResult = await createColoringBookPDF(generatedPages, {
        trimSize: coloringOptions.trimSize,
        addBlankPages: coloringOptions.addBlankPages,
        showPageNumbers: coloringOptions.showPageNumbers,
        includeBleed: coloringOptions.includeBleed,
        bookTitle: coloringOptions.bookTitle || 'Coloring Book'
      });
      
      setPdfUrl(pdfUrlResult);
      toast.success('PDF created successfully!');
      
      // Auto-download the PDF
      const link = document.createElement('a');
      link.href = pdfUrlResult;
      link.download = `${coloringOptions.bookTitle || 'coloring-book'}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error creating PDF:', error);
      toast.error('Failed to create PDF');
    } finally {
      setIsCreatingPdf(false);
    }
  };

  // Download all images as a ZIP
  const handleDownloadImages = async () => {
    if (generatedPages.length === 0) {
      toast.error('No pages to download');
      return;
    }

    try {
      toast.info('Preparing to download images...');
      await downloadColoringPages(generatedPages, coloringOptions.bookTitle);
    } catch (error) {
      console.error('Error downloading images:', error);
      toast.error('Failed to download images');
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <div className="max-w-7xl mx-auto p-6 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex p-2 mb-6 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20"
          >
            <Palette className="w-8 h-8 text-primary animate-pulse" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60"
          >
            AI Coloring Book Creator
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-muted-foreground"
          >
            Transform your imagination into magical coloring pages for kids and adults
          </motion.p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="prompt-to-book" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="image-to-prompt" className="text-lg py-3">
              <ImageIcon className="w-5 h-5 mr-2" />
              Coloring Image to Prompt
            </TabsTrigger>
            <TabsTrigger id="prompt-to-book-tab" value="prompt-to-book" className="text-lg py-3">
              <BookOpen className="w-5 h-5 mr-2" />
              Prompt to Coloring Book
            </TabsTrigger>
          </TabsList>

          {/* Image to Prompt Tab */}
          <TabsContent value="image-to-prompt" className="space-y-8">
            <Card className="relative overflow-hidden border border-primary/20 bg-background/40 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
              <div className="relative p-8 space-y-6">
                <h2 className="text-2xl font-bold mb-4">Upload a Coloring Book Style Image</h2>
                <p className="text-muted-foreground mb-6">This tool only works with coloring book style images or line art. Photos, complex artwork, or t-shirt designs are not supported.</p>
                
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Image Upload Section */}
                  <div className="space-y-4">
                    <Label className="text-lg font-semibold">Reference Image</Label>
                    <div 
                      className="border-2 border-dashed border-primary/40 rounded-lg aspect-square flex flex-col items-center justify-center p-8 hover:border-primary/60 transition-colors cursor-pointer bg-background/50"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploadedImage ? (
                        <img 
                          src={uploadedImage} 
                          alt="Uploaded reference" 
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <>
                          <Upload className="w-16 h-16 text-primary/60 mb-4" />
                          <p className="text-lg font-medium text-center">Click to upload a coloring book style image</p>
                          <p className="text-sm text-muted-foreground text-center mt-2">
                            Upload ONLY line art or coloring book style images. Photos or complex images are not supported.
                          </p>
                        </>
                      )}
                      <input 
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileUpload}
                      />
                    </div>
                    <Button 
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline" 
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadedImage ? 'Change Coloring Image' : 'Upload Coloring Image'}
                    </Button>
                  </div>

                  {/* Generated Prompt Section */}
                  <div className="space-y-4">
                    <Label className="text-lg font-semibold">Generated Prompt</Label>
                    <div className="relative">
                      <Textarea 
                        value={generatedPrompt} 
                        onChange={(e) => setGeneratedPrompt(e.target.value)}
                        placeholder="Your generated prompt will appear here..."
                        className="min-h-[260px] bg-background/50 border-primary/20 focus:border-primary/50 backdrop-blur-sm text-lg resize-none"
                      />
                      {generatedPrompt && (
                        <Button
                          size="sm"
                          className="absolute bottom-4 right-4 gap-1"
                          onClick={usePromptForBook}
                        >
                          <Check className="h-4 w-4" />
                          Use Prompt
                        </Button>
                      )}
                    </div>
                    <Button
                      onClick={handleGeneratePrompt}
                      disabled={!uploadedImage || isGeneratingPrompt}
                      className="w-full h-12 relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                      <span className="relative flex items-center justify-center gap-2">
                        {isGeneratingPrompt ? (
                          <>
                            <Sparkles className="w-5 h-5 animate-spin" />
                            Analyzing Image...
                          </>
                        ) : (
                          <>
                            <MessageSquare className="w-5 h-5" />
                            Generate Prompt
                          </>
                        )}
                      </span>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Prompt to Coloring Book Tab */}
          <TabsContent value="prompt-to-book" className="space-y-8">
            <Card className="relative overflow-hidden border border-primary/20 bg-background/40 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
              <div className="relative p-8 space-y-6">
                <h2 className="text-2xl font-bold mb-4">Create Your Coloring Book</h2>
                
                {/* Prompt Input */}
                <div className="space-y-4">
                  <Label className="text-lg font-semibold">Coloring Book Prompt</Label>
                  <Textarea
                    value={bookPrompt}
                    onChange={(e) => setBookPrompt(e.target.value)}
                    placeholder="Describe what you want in your coloring book (e.g., 'Enchanted forest with magical creatures, fantasy mushrooms and hidden fairies')"
                    className="min-h-[100px] bg-background/50 border-primary/20 focus:border-primary/50 backdrop-blur-sm text-lg"
                  />
                </div>

                {/* Book Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Trim Size */}
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Trim Size</Label>
                    <Select 
                      value={coloringOptions.trimSize} 
                      onValueChange={(value) => setColoringOptions({...coloringOptions, trimSize: value})}
                    >
                      <SelectTrigger className="h-10 bg-background/50 border-primary/20">
                        <SelectValue placeholder="Select trim size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6x9">6" x 9" (15.24 x 22.86 cm)</SelectItem>
                        <SelectItem value="8x10">8" x 10" (20.32 x 25.4 cm)</SelectItem>
                        <SelectItem value="8.5x11">8.5" x 11" (21.59 x 27.94 cm)</SelectItem>
                        <SelectItem value="7x10">7" x 10" (17.78 x 25.4 cm)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Page Count */}
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Number of Pages</Label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={coloringOptions.pageCount}
                      onChange={(e) => setColoringOptions({...coloringOptions, pageCount: parseInt(e.target.value) || 1})}
                      className="h-10 bg-background/50 border-primary/20"
                    />
                  </div>

                  {/* Book Title */}
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Book Title (Optional)</Label>
                    <Input
                      value={coloringOptions.bookTitle}
                      onChange={(e) => setColoringOptions({...coloringOptions, bookTitle: e.target.value})}
                      placeholder="My Coloring Book"
                      className="h-10 bg-background/50 border-primary/20"
                    />
                  </div>

                  {/* Add Blank Pages Toggle */}
                  <div className="flex items-center justify-between space-x-2">
                    <Label className="text-base font-medium">Add Blank Pages Between</Label>
                    <Switch
                      checked={coloringOptions.addBlankPages}
                      onCheckedChange={(checked) => setColoringOptions({...coloringOptions, addBlankPages: checked})}
                    />
                  </div>

                  {/* Show Page Numbers Toggle */}
                  <div className="flex items-center justify-between space-x-2">
                    <Label className="text-base font-medium">Show Page Numbers</Label>
                    <Switch
                      checked={coloringOptions.showPageNumbers}
                      onCheckedChange={(checked) => setColoringOptions({...coloringOptions, showPageNumbers: checked})}
                    />
                  </div>

                  {/* Include Bleed Toggle */}
                  <div className="flex items-center justify-between space-x-2">
                    <Label className="text-base font-medium">Include Bleed (0.125")</Label>
                    <Switch
                      checked={coloringOptions.includeBleed}
                      onCheckedChange={(checked) => setColoringOptions({...coloringOptions, includeBleed: checked})}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={handleGeneratePrompts}
                    disabled={!bookPrompt.trim() || isGeneratingPrompts}
                    variant="outline"
                    className="flex-1 h-12 text-base gap-2"
                  >
                    {isGeneratingPrompts ? (
                      <Sparkles className="w-5 h-5 animate-pulse" />
                    ) : (
                      <ListPlus className="w-5 h-5" />
                    )}
                    Generate Prompts
                  </Button>
                  
                  <Button
                    onClick={handleGenerateTestPage}
                    disabled={!bookPrompt.trim() || isGenerating}
                    variant="outline"
                    className="flex-1 h-12 text-base gap-2"
                  >
                    {isGenerating ? (
                      <Sparkles className="w-5 h-5 animate-pulse" />
                    ) : (
                      <PlusSquare className="w-5 h-5" />
                    )}
                    Generate Test Page
                  </Button>
                  
                  <Button
                    onClick={handleGenerateBook}
                    disabled={expandedPrompts.length === 0 || isGenerating}
                    className="flex-1 h-12 text-base relative overflow-hidden group bg-primary/90 hover:bg-primary/80 gap-2"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                    <span className="relative flex items-center justify-center gap-2">
                      {isGenerating ? (
                        <Sparkles className="w-5 h-5 animate-pulse" />
                      ) : (
                        <Wand2 className="w-5 h-5" />
                      )}
                      Generate Coloring Book
                    </span>
                  </Button>
                </div>
              </div>
            </Card>

            {/* Expanded Prompts Section - only show when prompts exist */}
            {expandedPrompts.length > 0 && (
              <Card className="relative overflow-hidden border border-primary/20 bg-background/40 backdrop-blur-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
                <div className="relative p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Generated Prompts</h2>
                    <p className="text-sm text-muted-foreground">Edit any prompt before final generation</p>
                  </div>
                  
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {expandedPrompts.map((prompt, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center">
                          <span className="bg-primary/10 text-primary font-medium rounded-full w-8 h-8 flex items-center justify-center mr-2">
                            {index + 1}
                          </span>
                          <Label className="text-base font-medium">Page {index + 1} Prompt</Label>
                        </div>
                        <Textarea
                          value={prompt}
                          onChange={(e) => updateExpandedPrompt(index, e.target.value)}
                          className="min-h-[80px] bg-background/50 border-primary/20 focus:border-primary/50 backdrop-blur-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Generated Pages Preview */}
            {generatedPages.length > 0 && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold">Your Coloring Book Preview</h2>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="default" 
                      className="gap-2"
                      onClick={handleCreatePdf}
                      disabled={isCreatingPdf || generatedPages.length === 0}
                    >
                      {isCreatingPdf ? (
                        <Sparkles className="w-5 h-5 animate-pulse" />
                      ) : (
                        <File className="w-5 h-5" />
                      )}
                      Create & Download PDF
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="gap-2"
                      onClick={handleDownloadImages}
                      disabled={generatedPages.length === 0}
                    >
                      <Download className="w-5 h-5" />
                      Download All Images
                    </Button>
                  </div>
                </div>
                
                {/* Main Preview */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Large Preview */}
                  <div className="lg:col-span-2 aspect-[1/1.4] bg-white rounded-xl overflow-hidden shadow-md border border-primary/20 relative">
                    <img 
                      src={generatedPages[activePreviewIndex]} 
                      alt={`Coloring page ${activePreviewIndex + 1}`}
                      className="w-full h-full object-contain"
                    />
                    
                    {/* Navigation Arrows */}
                    {generatedPages.length > 1 && (
                      <>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 rounded-full bg-background/80 hover:bg-background"
                          onClick={prevPreviewPage}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full bg-background/80 hover:bg-background"
                          onClick={nextPreviewPage}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    
                    {/* Page indicator */}
                    <div className="absolute bottom-2 left-0 right-0 text-center">
                      <span className="px-2 py-1 bg-background/70 rounded-md text-sm font-medium">
                        Page {activePreviewIndex + 1} of {generatedPages.length}
                      </span>
                    </div>
                  </div>
                  
                  {/* Thumbnails Grid */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">All Pages ({generatedPages.length})</h3>
                    <div className="grid grid-cols-2 gap-4 max-h-[600px] overflow-y-auto p-2">
                      {generatedPages.map((page, index) => (
                        <div 
                          key={index}
                          className={`aspect-[1/1.4] bg-white rounded-md overflow-hidden cursor-pointer border-2 transition-all ${index === activePreviewIndex ? 'border-primary scale-[1.02] shadow-lg' : 'border-transparent hover:border-primary/40'}`}
                          onClick={() => setActivePreviewIndex(index)}
                        >
                          <img 
                            src={page} 
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-1 right-1 bg-background/60 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}; 