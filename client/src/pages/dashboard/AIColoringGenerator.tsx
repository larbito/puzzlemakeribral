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
import { Progress } from '@/components/ui/progress';
import {
  Wand2, 
  Sparkles,
  Download,
  BookOpen,
  Palette,
  Upload,
  ImageIcon,
  MessageSquare,
  PlusSquare,
  File,
  ListPlus,
  ChevronLeft,
  ChevronRight,
  Check,
  RefreshCw,
  Shuffle,
  PenLine,
  BookText,
  Settings,
  Eye,
  ArrowRight
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

interface ColoringPageOptions {
  bookTitle: string;
  authorName: string;
  subtitle: string;
  trimSize: string;
  pageCount: number;
  addBlankPages: boolean;
  showPageNumbers: boolean;
  includeBleed: boolean;
  addTitlePage: boolean;
  dpi: number;
}

// Track the current workflow step
type WorkflowStep = 
  | 'start-method'
  | 'prompt-generation' 
  | 'prompt-review' 
  | 'book-settings' 
  | 'title-page' 
  | 'generate-book' 
  | 'preview-download';

// Define the start method options
type StartMethod = 'upload-image' | 'write-prompt' | null;

export const AIColoringGenerator = () => {
  // Workflow state
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('start-method');
  const [startMethod, setStartMethod] = useState<StartMethod>(null);
  const [useMultiplePrompts, setUseMultiplePrompts] = useState(true);
  
  // Image to Prompt state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

  // Prompt to Coloring Book state
  const [coloringOptions, setColoringOptions] = useState<ColoringPageOptions>({
    bookTitle: '',
    authorName: '',
    subtitle: '',
    trimSize: '8.5x11',
    pageCount: 10,
    addBlankPages: false,
    showPageNumbers: true,
    includeBleed: true,
    addTitlePage: false,
    dpi: 300
  });
  
  const [basePrompt, setBasePrompt] = useState('');
  const [expandedPrompts, setExpandedPrompts] = useState<string[]>([]);
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  const [promptsConfirmed, setPromptsConfirmed] = useState(false);
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentGeneratingPage, setCurrentGeneratingPage] = useState(0);
  const [isCreatingPdf, setIsCreatingPdf] = useState(false);
  const [generatedPages, setGeneratedPages] = useState<string[]>([]);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  
  // Progress tracking
  const [generationProgress, setGenerationProgress] = useState(0);
  const [pdfProgress, setPdfProgress] = useState(0);
  
  // Navigation helpers
  const goToNextStep = () => {
    switch (currentStep) {
      case 'start-method':
        setCurrentStep('prompt-generation');
        break;
      case 'prompt-generation':
        setCurrentStep('prompt-review');
        break;
      case 'prompt-review':
        setCurrentStep('book-settings');
        break;
      case 'book-settings':
        if (coloringOptions.addTitlePage) {
          setCurrentStep('title-page');
        } else {
          setCurrentStep('generate-book');
        }
        break;
      case 'title-page':
        setCurrentStep('generate-book');
        break;
      case 'generate-book':
        setCurrentStep('preview-download');
        break;
      default:
        break;
    }
  };
  
  const goToPreviousStep = () => {
    switch (currentStep) {
      case 'prompt-generation':
        setCurrentStep('start-method');
        break;
      case 'prompt-review':
        setCurrentStep('prompt-generation');
        break;
      case 'book-settings':
        setCurrentStep('prompt-review');
        break;
      case 'title-page':
        setCurrentStep('book-settings');
        break;
      case 'generate-book':
        if (coloringOptions.addTitlePage) {
          setCurrentStep('title-page');
        } else {
          setCurrentStep('book-settings');
        }
        break;
      case 'preview-download':
        setCurrentStep('generate-book');
        break;
      default:
        break;
    }
  };

  // Handle selecting start method
  const handleStartMethodSelect = (method: StartMethod) => {
    setStartMethod(method);
    goToNextStep();
  };

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
      
      // Request prompt variations directly from the analyze endpoint
      formData.append('generateVariations', 'true');
      formData.append('pageCount', coloringOptions.pageCount.toString());
      
      // Make a direct API call to the backend
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? window.location.origin.includes('vercel.app') 
          ? 'https://puzzlemakeribral-production.up.railway.app'
          : window.location.origin
        : 'http://localhost:3000';
      
      console.log(`Calling analyze API at ${apiUrl}/api/ideogram/analyze`);
      const apiResponse = await fetch(`${apiUrl}/api/ideogram/analyze`, {
        method: 'POST',
        body: formData
      });
      
      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error('Error response from analyze API:', errorText);
        throw new Error(`API error: ${apiResponse.status}`);
      }
      
      const data = await apiResponse.json();
      console.log('Analyze API response:', data);
      
      // Check if the response contains an error indicating this isn't a coloring page
      if (data.prompt?.toLowerCase().includes('not a coloring') || 
          data.prompt?.toLowerCase().includes('not suitable for coloring') ||
          data.prompt?.toLowerCase().includes('t-shirt design')) {
        toast.error('The uploaded image does not appear to be a coloring book page. Please upload a line art or coloring book style image.');
        setGeneratedPrompt('');
      } else {
        // Set just the base prompt without variations initially
        setGeneratedPrompt(data.prompt);
        setBasePrompt(data.prompt);
        
        // Instead of generating 10 prompts, start with just 1 (the base prompt)
        setColoringOptions(prev => ({
          ...prev,
          pageCount: 1
        }));
        
        // Set the base prompt as the only expanded prompt (1 page)
        setExpandedPrompts([data.prompt]);
        setPromptsConfirmed(true);
        
        // Skip the old code that tried to fetch or process variations
        toast.success('Prompt generated successfully. You can add more pages in the next step.');
        
        // Always go to prompt review first
        setTimeout(() => {
          setCurrentStep('prompt-review');
        }, 1000);
      }
    } catch (error) {
      console.error('Error generating prompt from image:', error);
      toast.error(`Failed to analyze image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  // Proceed with the generated prompt to the prompt variations section
  const handleProceedWithGeneratedPrompt = () => {
    if (!generatedPrompt.trim()) {
      toast.error('No prompt available');
      return;
    }
    
    setBasePrompt(generatedPrompt);
    goToNextStep();
  };
  
  // Update base prompt when writing directly
  const handleBasePromptChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setBasePrompt(e.target.value);
  };
  
  // Handle toggling between single and multiple prompts
  const handleToggleMultiplePrompts = (useMultiple: boolean) => {
    setUseMultiplePrompts(useMultiple);
    
    // If switching to single prompt mode
    if (!useMultiple) {
      // Use the base prompt for all pages
      const singlePromptArray = Array(coloringOptions.pageCount).fill(basePrompt);
      setExpandedPrompts(singlePromptArray);
      toast.info(`Using the same prompt for all ${coloringOptions.pageCount} pages`);
    } 
    // If switching to multiple prompt mode, we'll need to generate variations
    else {
      // Keep the first prompt (base prompt) but clear the rest
      // This will show the Generate button to create new variations
      if (expandedPrompts.length > 0) {
        setExpandedPrompts([expandedPrompts[0]]);
        setColoringOptions(prev => ({
          ...prev,
          pageCount: 1
        }));
        toast.info('Switched to multiple unique prompts mode. Increase page count to generate variations.');
      }
    }
  };

  // Handle changing the page count
  const handlePageCountChange = async (newCount: number) => {
    // First, update the page count in options
    setColoringOptions({...coloringOptions, pageCount: newCount});
    
    // If reducing the count, trim the array
    if (newCount < expandedPrompts.length) {
      setExpandedPrompts(expandedPrompts.slice(0, newCount));
      toast.info(`Reduced to ${newCount} prompts`);
      return;
    } 
    
    // If increasing the count and using multiple prompts, generate more
    if (newCount > expandedPrompts.length && useMultiplePrompts) {
      const additionalCount = newCount - expandedPrompts.length;
      toast.info(`Generating ${additionalCount} additional prompts...`);
      
      // Generate additional prompts
      await handleGenerateAdditionalPrompts(additionalCount);
    } else if (newCount > expandedPrompts.length) {
      // For single prompt mode, just duplicate the base prompt
      const newPrompts = [...expandedPrompts];
      for (let i = 0; i < newCount - expandedPrompts.length; i++) {
        newPrompts.push(basePrompt);
      }
      setExpandedPrompts(newPrompts);
    }
  };
  
  // Generate additional prompts when increasing page count
  const handleGenerateAdditionalPrompts = async (count: number) => {
    if (!basePrompt.trim() || count <= 0) return;
    
    setIsGeneratingPrompts(true);
    
    try {
      // Get additional variations
      const additionalVariations = await expandPrompts(basePrompt, count);
      
      if (!additionalVariations || additionalVariations.length === 0) {
        throw new Error('Failed to generate additional prompt variations');
      }
      
      // Add the new variations to existing ones
      setExpandedPrompts(prevPrompts => [...prevPrompts, ...additionalVariations]);
      
      toast.success(`Added ${additionalVariations.length} new prompt variations`);
    } catch (error) {
      console.error('Error generating additional prompts:', error);
      toast.error('Failed to generate additional prompts');
      
      // Fallback: just duplicate the last prompt
      if (expandedPrompts.length > 0) {
        const lastPrompt = expandedPrompts[expandedPrompts.length - 1];
        const newPrompts = [...expandedPrompts];
        for (let i = 0; i < count; i++) {
          newPrompts.push(lastPrompt);
        }
        setExpandedPrompts(newPrompts);
      }
    } finally {
      setIsGeneratingPrompts(false);
    }
  };

  // Handle generating multiple prompt variations
  const handleGeneratePrompts = async () => {
    if (!basePrompt.trim()) {
      toast.error('Please enter a base prompt first');
      return;
    }

    if (coloringOptions.pageCount < 1 || coloringOptions.pageCount > 100) {
      toast.error('Page count must be between 1 and 100');
      return;
    }

    setIsGeneratingPrompts(true);
    setExpandedPrompts([]);
    setGenerationProgress(0);

    try {
      const targetPageCount = coloringOptions.pageCount;
      toast.info(`Generating ${targetPageCount} prompt variations...`, {
        id: 'generating-prompts'
      });
      
      if (useMultiplePrompts) {
        // Multiple unique prompts - pass the FULL base prompt without modification
        console.log(`Sending complete base prompt to API: "${basePrompt.substring(0, 100)}..."`, 
                    'Target page count:', targetPageCount);
        
        const variations = await expandPrompts(basePrompt, targetPageCount);
        
        if (!variations || variations.length === 0) {
          throw new Error('Failed to generate prompt variations');
        }
        
        // Log the variations for debugging
        console.log(`Received ${variations.length} prompt variations:`, 
                    variations.map(v => v.substring(0, 50) + '...'));
        
        // Check if all variations are the same
        const allSame = variations.every(v => v === variations[0]);
        if (allSame) {
          console.warn('⚠️ All returned prompt variations are identical! Using them anyway but this is likely a bug.');
          toast.warning('Warning: Generated variations are very similar. You may want to regenerate or edit them manually.');
        }
        
        setExpandedPrompts(variations);
        toast.success(`Generated ${variations.length} unique prompt variations!`, {
          id: 'generating-prompts'
        });
      } else {
        // Use the same prompt for all pages
        console.log('Using the same prompt for all pages:', basePrompt.substring(0, 100));
        setExpandedPrompts(Array(targetPageCount).fill(basePrompt));
        toast.success(`Using the same prompt for all ${targetPageCount} pages`, {
          id: 'generating-prompts'
        });
      }
      
      // No auto-proceeding - stay on this page so user can check prompts
      
    } catch (error) {
      console.error('Error generating prompt variations:', error);
      toast.error('Failed to generate prompt variations: ' + 
                 (error instanceof Error ? error.message : 'Unknown error'));
      
      // Fallback to a simple array with the base prompt repeated if all else fails
      setExpandedPrompts(Array(coloringOptions.pageCount).fill(basePrompt));
      toast.info('Using base prompt as fallback due to generation error');
    } finally {
      setIsGeneratingPrompts(false);
      setGenerationProgress(100);
    }
  };

  // Update a single expanded prompt
  const updateExpandedPrompt = (index: number, newPrompt: string) => {
    const newPrompts = [...expandedPrompts];
    newPrompts[index] = newPrompt;
    setExpandedPrompts(newPrompts);
  };
  
  // Regenerate a single prompt
  const regenerateSinglePrompt = async (index: number) => {
    if (!basePrompt.trim()) return;
    
    const singlePromptId = `prompt-${index}`;
    
    try {
      toast.info(`Regenerating prompt for page ${index + 1}...`, { id: singlePromptId });
      
      const variation = await expandPrompts(basePrompt, 1);
      
      if (!variation || variation.length === 0) {
        throw new Error('Failed to regenerate prompt');
      }
      
      updateExpandedPrompt(index, variation[0]);
      toast.success(`Regenerated prompt for page ${index + 1}`, { id: singlePromptId });
      
    } catch (error) {
      console.error(`Error regenerating prompt ${index + 1}:`, error);
      toast.error(`Failed to regenerate prompt for page ${index + 1}`, { id: singlePromptId });
    }
  };
  
  // Shuffle all prompts (regenerate all)
  const shuffleAllPrompts = async () => {
    if (!basePrompt.trim() || !useMultiplePrompts) return;
    
    try {
      toast.info(`Regenerating all prompts...`);
      await handleGeneratePrompts();
    } catch (error) {
      console.error('Error regenerating prompts:', error);
      toast.error('Failed to regenerate prompts');
    }
  };
  
  // Confirm prompts and proceed
  const confirmPrompts = () => {
    setPromptsConfirmed(true);
    goToNextStep();
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
    setGenerationProgress(0);
    setCurrentGeneratingPage(0);

    try {
      toast.info(`Generating ${expandedPrompts.length} unique coloring pages...`);
      
      // Generate pages using the expanded prompts
      const pageUrls: string[] = [];
      
      // Generate pages for each prompt variation
      for (let i = 0; i < expandedPrompts.length; i++) {
        try {
          setCurrentGeneratingPage(i + 1);
          setGenerationProgress(Math.round((i / expandedPrompts.length) * 100));
          
          const toastId = `page-${i}`;
          toast.loading(`Generating page ${i+1} of ${expandedPrompts.length}...`, {
            id: toastId,
            duration: Infinity
          });
          
          // Log the prompt being used
          console.log(`Generating coloring page ${i+1} with prompt: "${expandedPrompts[i]}"`);
          
          // Direct API call with proper error handling
          let imageUrl: string | null = null;
          
          try {
            // Call the generateColoringPage function with the current prompt
            imageUrl = await generateColoringPage(expandedPrompts[i]);
            
            if (!imageUrl) {
              throw new Error("No image URL returned from API");
            }
            
            console.log(`Successfully generated image for page ${i+1}: ${imageUrl.substring(0, 100)}...`);
            
            // Verify the image URL is valid by trying to fetch it
            try {
              const imageCheck = await fetch(imageUrl, { method: 'HEAD' });
              if (!imageCheck.ok) {
                console.error(`Image URL validation failed for page ${i+1}: ${imageCheck.status}`);
                throw new Error(`Image validation failed: ${imageCheck.status}`);
              }
            } catch (validationError) {
              console.warn(`Image validation error (continuing anyway): ${validationError}`);
            }
            
            // Add to our collection
            pageUrls.push(imageUrl);
            
            // Update UI immediately when each page is ready
            setGeneratedPages(prevPages => [...prevPages, imageUrl as string]);
            
            toast.success(`Generated page ${i+1} successfully`, {
              id: toastId
            });
          } catch (apiError) {
            console.error(`API error generating page ${i+1}:`, apiError);
            toast.error(`Error generating page ${i+1}. Retrying...`, {
              id: toastId
            });
            
            // Wait a moment before retrying
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Retry once with a simplified prompt
            try {
              console.log(`Retrying page ${i+1} with simplified prompt...`);
              const simplifiedPrompt = `Simple line art coloring page: ${expandedPrompts[i].split(',')[0]}`;
              
              imageUrl = await generateColoringPage(simplifiedPrompt);
              
              if (!imageUrl) {
                throw new Error("No image URL returned from retry");
              }
              
              console.log(`Successfully generated image on retry for page ${i+1}`);
              
              // Add to our collection
              pageUrls.push(imageUrl);
              
              // Update UI immediately when each page is ready
              setGeneratedPages(prevPages => [...prevPages, imageUrl as string]);
              
              toast.success(`Generated page ${i+1} on retry`, {
                id: toastId
              });
            } catch (retryError) {
              console.error(`Retry also failed for page ${i+1}:`, retryError);
              
              // Use a placeholder as last resort
              const placeholder = getPlaceholderImage(expandedPrompts[i]);
              pageUrls.push(placeholder);
              setGeneratedPages(prevPages => [...prevPages, placeholder]);
              
              toast.error(`Failed to generate page ${i+1}, using placeholder`, {
                id: toastId
              });
            }
          }
        } catch (pageError) {
          console.error(`Error processing page ${i+1}:`, pageError);
          // Continue with other pages
        }
      }
      
      setGenerationProgress(100);
      
      if (pageUrls.length === 0) {
        throw new Error('Failed to generate any coloring pages');
      }
      
      setActivePreviewIndex(0);
      toast.success(`Generated ${pageUrls.length} coloring pages successfully`);
      
      // Automatically proceed to preview step
      goToNextStep();
      
    } catch (error) {
      console.error('Error generating coloring book:', error);
      toast.error('Failed to generate coloring book');
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper function to get placeholder image when generation fails
  const getPlaceholderImage = (prompt: string): string => {
    // Create a text description from the prompt
    const shortPrompt = prompt.length > 30 ? prompt.substring(0, 30) + '...' : prompt;
    return `https://placehold.co/800x1100/e2e8f0/475569?text=Coloring+Page:+${encodeURIComponent(shortPrompt)}`;
  };

  // Preview navigation
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

  // Create and download PDF
  const handleCreatePdf = async () => {
    if (generatedPages.length === 0) {
      toast.error('No pages to create PDF from');
      return;
    }

    setIsCreatingPdf(true);
    setPdfProgress(0);
    
    try {
      toast.info('Creating PDF...');
      setPdfProgress(10);
      
      // Preload all images to ensure they're ready for PDF creation
      const preloadPromises = generatedPages.map((url) => 
        new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(true);
          img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
          img.src = url;
        })
      );
      
      try {
        await Promise.all(preloadPromises);
        setPdfProgress(40);
      } catch (preloadError) {
        console.warn('Some images failed to preload, but proceeding anyway', preloadError);
      }
      
      // Create the PDF
      const pdfUrlResult = await createColoringBookPDF(generatedPages, {
        trimSize: coloringOptions.trimSize,
        addBlankPages: coloringOptions.addBlankPages,
        showPageNumbers: coloringOptions.showPageNumbers,
        includeBleed: coloringOptions.includeBleed,
        bookTitle: coloringOptions.bookTitle || 'Coloring Book',
        addTitlePage: coloringOptions.addTitlePage,
        authorName: coloringOptions.authorName,
        subtitle: coloringOptions.subtitle
      });
      
      setPdfProgress(90);
      setPdfUrl(pdfUrlResult);
      setPdfProgress(100);
      toast.success('PDF created successfully!');
      
      // Auto-download the PDF if it's not a server-generated one that opens in a new tab
      if (pdfUrlResult && pdfUrlResult !== 'success') {
        const link = document.createElement('a');
        link.href = pdfUrlResult;
        link.download = `${coloringOptions.bookTitle || 'coloring-book'}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
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
      
      // Preload all images to ensure they're ready for download
      const preloadPromises = generatedPages.map((url, index) => 
        new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(true);
          img.onerror = () => {
            console.error(`Failed to load image at index ${index}: ${url}`);
            // Replace with a placeholder instead of failing
            generatedPages[index] = getPlaceholderImage(expandedPrompts[index] || `Page ${index + 1}`);
            resolve(false);
          };
          img.src = url;
        })
      );
      
      // Wait for all images to preload
      await Promise.all(preloadPromises);
      
      // Now download the ZIP with potentially fixed image URLs
      await downloadColoringPages(generatedPages, coloringOptions.bookTitle);
    } catch (error) {
      console.error('Error downloading images:', error);
      toast.error('Failed to download images');
    }
  };

  // Progress indicator component
  const StepIndicator = () => {
    const steps = [
      { name: 'Start', active: currentStep === 'start-method' },
      { name: 'Prompt', active: currentStep === 'prompt-generation' },
      { name: 'Review', active: currentStep === 'prompt-review' },
      { name: 'Settings', active: currentStep === 'book-settings' },
      { name: 'Title Page', active: currentStep === 'title-page', optional: true, show: coloringOptions.addTitlePage },
      { name: 'Generate', active: currentStep === 'generate-book' },
      { name: 'Preview', active: currentStep === 'preview-download' }
    ].filter(step => !step.optional || step.show);

    return (
      <div className="w-full flex justify-between items-center mb-8 px-4">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center">
            <div 
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step.active 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {index + 1}
            </div>
            <span className={`text-xs mt-1 ${step.active ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
              {step.name}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background relative overflow-hidden pb-16">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <div className="max-w-7xl mx-auto p-6 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-8">
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
        
        {/* Step Indicator */}
        <StepIndicator />
        
        {/* Main Content Area - Step based UI */}
        <div className="space-y-6">
          {/* STEP 1: Start Method Selection */}
          {currentStep === 'start-method' && (
            <Card className="relative overflow-hidden border border-primary/20 bg-background/40 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
              <div className="relative p-8 space-y-6">
                <h2 className="text-2xl font-bold mb-4 text-center">How would you like to start your coloring book?</h2>
                
                <div className="grid md:grid-cols-2 gap-8 mt-8">
                  {/* Upload Image Option */}
                  <div 
                    className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center cursor-pointer hover:bg-primary/5 transition-colors group hover:border-primary"
                    onClick={() => handleStartMethodSelect('upload-image')}
                  >
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <Upload className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Upload a Coloring Page</h3>
                    <p className="text-center text-muted-foreground">
                      Upload an existing coloring page or line art and we'll analyze it
                    </p>
                  </div>
                  
                  {/* Write Prompt Option */}
                  <div 
                    className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center cursor-pointer hover:bg-primary/5 transition-colors group hover:border-primary"
                    onClick={() => handleStartMethodSelect('write-prompt')}
                  >
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <PenLine className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Write a Prompt or Idea</h3>
                    <p className="text-center text-muted-foreground">
                      Describe what you want in your coloring book and we'll create it
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* STEP 2A: Upload Image and Generate Prompt */}
          {currentStep === 'prompt-generation' && startMethod === 'upload-image' && (
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
                        maxLength={250}
                      />
                      <div className="absolute bottom-2 left-4 text-xs text-muted-foreground">
                        {generatedPrompt.length}/250 characters
                      </div>
                    </div>
                    
                    {isGeneratingPrompt ? (
                      <div className="space-y-2">
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Analyzing image...</span>
                          <span className="text-primary">Please wait</span>
                        </div>
                        <Progress value={50} className="h-2" />
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                          onClick={handleGeneratePrompt}
                          disabled={!uploadedImage || isGeneratingPrompt}
                          className="flex-1 relative overflow-hidden group"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                          <span className="relative flex items-center justify-center gap-2">
                            <MessageSquare className="w-5 h-5" />
                            Generate Prompt
                          </span>
                        </Button>
                        
                        {generatedPrompt && (
                          <Button
                            onClick={handleProceedWithGeneratedPrompt}
                            className="flex-1 gap-2"
                            variant="default"
                          >
                            <ArrowRight className="w-5 h-5" />
                            Continue
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between mt-8">
                  <Button
                    onClick={() => setCurrentStep('start-method')}
                    variant="outline"
                  >
                    Back
                  </Button>
                </div>
              </div>
            </Card>
          )}
          
          {/* STEP 2B: Direct Prompt Input */}
          {currentStep === 'prompt-generation' && startMethod === 'write-prompt' && (
            <Card className="relative overflow-hidden border border-primary/20 bg-background/40 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
              <div className="relative p-8 space-y-6">
                <h2 className="text-2xl font-bold mb-4">Describe Your Coloring Book</h2>
                <p className="text-muted-foreground mb-6">
                  Be as descriptive as possible about what you want in your coloring book. For example: "Enchanted forest with magical creatures, fantasy mushrooms and hidden fairies"
                </p>
                
                <div className="space-y-4">
                  <Label className="text-lg font-semibold">Your Prompt</Label>
                  <div className="relative">
                    <Textarea
                      value={basePrompt}
                      onChange={handleBasePromptChange}
                      placeholder="Describe what you want in your coloring book..."
                      className="min-h-[200px] bg-background/50 border-primary/20 focus:border-primary/50 backdrop-blur-sm text-lg"
                      maxLength={250}
                    />
                    <div className="absolute bottom-2 left-4 text-xs text-muted-foreground">
                      {basePrompt.length}/250 characters
                    </div>
                  </div>
                  
                  <div className="flex justify-between mt-8">
                    <Button
                      onClick={() => setCurrentStep('start-method')}
                      variant="outline"
                    >
                      Back
                    </Button>
                    
                    <Button
                      onClick={goToNextStep}
                      disabled={!basePrompt.trim()}
                      className="gap-2"
                    >
                      <ArrowRight className="w-5 h-5" />
                      Continue
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}
          
          {/* STEP 3: Prompt Variations Generation */}
          {currentStep === 'prompt-review' && (
            <Card className="relative overflow-hidden border border-primary/20 bg-background/40 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
              <div className="relative p-8 space-y-6">
                <h2 className="text-2xl font-bold mb-4">Prompt Variations for Each Page</h2>
                
                <div className="space-y-6">
                  {/* Basic Settings */}
                  <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-lg font-semibold">Generate multiple unique prompts?</Label>
                        <Switch
                          checked={useMultiplePrompts}
                          onCheckedChange={handleToggleMultiplePrompts}
                        />
                      </div>
                      
                      <p className="text-muted-foreground text-sm">
                        {useMultiplePrompts 
                          ? "Each page will have a unique variation of your prompt, creating diversity in your coloring book." 
                          : "All pages will use the exact same prompt, creating consistency in your coloring book."}
                      </p>
                    </div>
                    
                    <div className="w-full md:w-48 space-y-2">
                      <Label className="font-medium">Number of Pages</Label>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={coloringOptions.pageCount}
                        onChange={(e) => {
                          const newPageCount = parseInt(e.target.value) || 1;
                          handlePageCountChange(newPageCount);
                        }}
                        className="bg-background/50 border-primary/20"
                      />
                      <p className="text-xs text-muted-foreground">Maximum: 100 pages</p>
                    </div>
                  </div>
                  
                  {/* Base Prompt Display */}
                  <div className="space-y-2 bg-muted/30 p-4 rounded-lg">
                    <Label className="font-medium">Base Prompt</Label>
                    <div className="text-sm bg-background/50 p-3 rounded border border-border">
                      {basePrompt}
                    </div>
                  </div>
                  
                  {/* Generate Button */}
                  {(!expandedPrompts.length || expandedPrompts.length !== coloringOptions.pageCount) && useMultiplePrompts ? (
                    <Button
                      onClick={handleGeneratePrompts}
                      disabled={!basePrompt.trim() || isGeneratingPrompts}
                      className="w-full h-12 relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                      <span className="relative flex items-center justify-center gap-2">
                        {isGeneratingPrompts ? (
                          <Sparkles className="w-5 h-5 animate-pulse" />
                        ) : (
                          <ListPlus className="w-5 h-5" />
                        )}
                        {expandedPrompts.length === 0 
                          ? `Generate Prompts` 
                          : `Regenerate ${coloringOptions.pageCount} Prompts`}
                      </span>
                    </Button>
                  ) : (
                    <div className="flex gap-4">
                      {useMultiplePrompts && (
                        <Button 
                          onClick={shuffleAllPrompts}
                          disabled={!useMultiplePrompts || isGeneratingPrompts}
                          variant="outline"
                          className="gap-2"
                        >
                          <Shuffle className="w-4 h-4" />
                          Shuffle All
                        </Button>
                      )}
                      
                      <Button
                        onClick={confirmPrompts}
                        className="flex-1 gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Confirm Prompts
                      </Button>
                    </div>
                  )}
                  
                  {/* Progress Indicator */}
                  {isGeneratingPrompts && (
                    <div className="space-y-2">
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Generating prompts...</span>
                        <span className="text-primary">{generationProgress}%</span>
                      </div>
                      <Progress value={generationProgress} className="h-2" />
                    </div>
                  )}
                  
                  {/* Warning if page count doesn't match prompts count in multiple mode */}
                  {expandedPrompts.length > 0 && 
                   expandedPrompts.length !== coloringOptions.pageCount && 
                   useMultiplePrompts && (
                    <div className="flex items-center gap-2 p-3 bg-yellow-100/60 border border-yellow-300 rounded-md text-yellow-800">
                      <Wand2 className="w-5 h-5 flex-shrink-0" />
                      <p className="text-sm">Page count ({coloringOptions.pageCount}) doesn't match the number of prompts ({expandedPrompts.length}). Please generate new prompts.</p>
                    </div>
                  )}
                  
                  {/* Expanded Prompts List */}
                  {expandedPrompts.length > 0 && (
                    <div className="space-y-6 mt-8">
                      <h3 className="text-xl font-semibold">Review and Edit Prompts</h3>
                      <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
                        {expandedPrompts.map((prompt, index) => (
                          <div key={index} className="space-y-2 bg-muted/20 p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <span className="bg-primary/10 text-primary font-medium rounded-full w-8 h-8 flex items-center justify-center mr-2">
                                  {index + 1}
                                </span>
                                <Label className="font-medium">Page {index + 1} Prompt</Label>
                              </div>
                              
                              {useMultiplePrompts && (
                                <Button
                                  onClick={() => regenerateSinglePrompt(index)}
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 gap-1"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                  Regenerate
                                </Button>
                              )}
                            </div>
                            
                            <Textarea
                              value={prompt}
                              onChange={(e) => updateExpandedPrompt(index, e.target.value)}
                              className="min-h-[80px] bg-background/50 border-primary/20 focus:border-primary/50 backdrop-blur-sm"
                              maxLength={250}
                            />
                            <div className="text-xs text-muted-foreground text-right">
                              {prompt.length}/250 characters
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between mt-8">
                  <Button
                    onClick={goToPreviousStep}
                    variant="outline"
                  >
                    Back
                  </Button>
                  
                  {expandedPrompts.length > 0 && expandedPrompts.length === coloringOptions.pageCount && (
                    <Button
                      onClick={confirmPrompts}
                      className="gap-2"
                    >
                      <ArrowRight className="w-5 h-5" />
                      Continue
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* STEP 4: Book Configuration */}
          {currentStep === 'book-settings' && (
            <Card className="relative overflow-hidden border border-primary/20 bg-background/40 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
              <div className="relative p-8 space-y-6">
                <h2 className="text-2xl font-bold mb-4">Book Configuration</h2>
                <p className="text-muted-foreground mb-6">
                  Configure your coloring book settings for optimal print quality and layout
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Trim Size */}
                  <div className="space-y-2">
                    <Label className="font-medium">Trim Size</Label>
                    <Select 
                      value={coloringOptions.trimSize} 
                      onValueChange={(value) => setColoringOptions({...coloringOptions, trimSize: value})}
                    >
                      <SelectTrigger className="bg-background/50 border-primary/20">
                        <SelectValue placeholder="Select trim size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6x9">6" x 9" (15.24 x 22.86 cm)</SelectItem>
                        <SelectItem value="8x10">8" x 10" (20.32 x 25.4 cm)</SelectItem>
                        <SelectItem value="8.5x11">8.5" x 11" (21.59 x 27.94 cm)</SelectItem>
                        <SelectItem value="7x10">7" x 10" (17.78 x 25.4 cm)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Standard KDP sizes available</p>
                  </div>

                  {/* Book Title */}
                  <div className="space-y-2">
                    <Label className="font-medium">Book Title</Label>
                    <Input
                      value={coloringOptions.bookTitle}
                      onChange={(e) => setColoringOptions({...coloringOptions, bookTitle: e.target.value})}
                      placeholder="My Coloring Book"
                      className="bg-background/50 border-primary/20"
                    />
                  </div>

                  {/* Add Title Page Toggle */}
                  <div className="flex items-center justify-between space-x-2">
                    <div>
                      <Label className="font-medium">Add Title Page</Label>
                      <p className="text-xs text-muted-foreground">Include a professional title/author page</p>
                    </div>
                    <Switch
                      checked={coloringOptions.addTitlePage}
                      onCheckedChange={(checked) => setColoringOptions({...coloringOptions, addTitlePage: checked})}
                    />
                  </div>

                  {/* Add Blank Pages Toggle */}
                  <div className="flex items-center justify-between space-x-2">
                    <div>
                      <Label className="font-medium">Add Blank Pages Between</Label>
                      <p className="text-xs text-muted-foreground">For better printing experience</p>
                    </div>
                    <Switch
                      checked={coloringOptions.addBlankPages}
                      onCheckedChange={(checked) => setColoringOptions({...coloringOptions, addBlankPages: checked})}
                    />
                  </div>

                  {/* Show Page Numbers Toggle */}
                  <div className="flex items-center justify-between space-x-2">
                    <div>
                      <Label className="font-medium">Show Page Numbers</Label>
                      <p className="text-xs text-muted-foreground">Add page numbers at the bottom</p>
                    </div>
                    <Switch
                      checked={coloringOptions.showPageNumbers}
                      onCheckedChange={(checked) => setColoringOptions({...coloringOptions, showPageNumbers: checked})}
                    />
                  </div>

                  {/* Include Bleed Toggle */}
                  <div className="flex items-center justify-between space-x-2">
                    <div>
                      <Label className="font-medium">Include Bleed (0.125")</Label>
                      <p className="text-xs text-muted-foreground">Required for professional printing</p>
                    </div>
                    <Switch
                      checked={coloringOptions.includeBleed}
                      onCheckedChange={(checked) => setColoringOptions({...coloringOptions, includeBleed: checked})}
                    />
                  </div>
                </div>
                
                {/* DPI Info */}
                <div className="bg-muted/30 p-4 rounded-lg mt-8">
                  <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" />
                    <h3 className="font-medium">Advanced Settings</h3>
                  </div>
                  <div className="mt-2 grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">DPI (Dots Per Inch)</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        <p className="text-sm">Fixed at 300 DPI (Print Quality)</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm">Total Pages</Label>
                      <p className="text-sm mt-1">
                        {coloringOptions.addTitlePage ? '1 title page + ' : ''}
                        {expandedPrompts.length} coloring pages
                        {coloringOptions.addBlankPages ? ` + ${expandedPrompts.length - 1} blank pages` : ''}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between mt-8">
                  <Button
                    onClick={goToPreviousStep}
                    variant="outline"
                  >
                    Back
                  </Button>
                  
                  <Button
                    onClick={goToNextStep}
                    className="gap-2"
                  >
                    <ArrowRight className="w-5 h-5" />
                    Continue
                  </Button>
                </div>
              </div>
            </Card>
          )}
          
          {/* STEP 5: Title Page Configuration */}
          {currentStep === 'title-page' && (
            <Card className="relative overflow-hidden border border-primary/20 bg-background/40 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
              <div className="relative p-8 space-y-6">
                <h2 className="text-2xl font-bold mb-4">Title Page</h2>
                <p className="text-muted-foreground mb-6">
                  Add information for your title page. This will be the first page of your coloring book.
                </p>
                
                <div className="grid grid-cols-1 gap-6 max-w-2xl mx-auto">
                  {/* Book Title (already entered in previous step) */}
                  <div className="space-y-2">
                    <Label className="font-medium">Book Title</Label>
                    <Input
                      value={coloringOptions.bookTitle}
                      onChange={(e) => setColoringOptions({...coloringOptions, bookTitle: e.target.value})}
                      placeholder="My Amazing Coloring Book"
                      className="bg-background/50 border-primary/20"
                    />
                  </div>
                  
                  {/* Author Name */}
                  <div className="space-y-2">
                    <Label className="font-medium">Author Name</Label>
                    <Input
                      value={coloringOptions.authorName}
                      onChange={(e) => setColoringOptions({...coloringOptions, authorName: e.target.value})}
                      placeholder="Your Name"
                      className="bg-background/50 border-primary/20"
                    />
                    <p className="text-xs text-muted-foreground">Optional: Leave blank if you don't want to include an author name</p>
                  </div>
                  
                  {/* Subtitle or Tagline */}
                  <div className="space-y-2">
                    <Label className="font-medium">Subtitle or Tagline</Label>
                    <Input
                      value={coloringOptions.subtitle}
                      onChange={(e) => setColoringOptions({...coloringOptions, subtitle: e.target.value})}
                      placeholder="A collection of beautiful designs to color"
                      className="bg-background/50 border-primary/20"
                    />
                    <p className="text-xs text-muted-foreground">Optional: Add a subtitle or descriptive tagline</p>
                  </div>
                </div>
                
                {/* Title Page Preview */}
                <div className="mt-8 p-8 bg-background/70 border border-primary/20 rounded-lg">
                  <div className="aspect-[1/1.4] bg-white rounded-lg shadow-md p-10 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                    <div className="h-full flex flex-col items-center justify-center gap-6">
                      <div className="text-3xl font-bold text-primary">
                        {coloringOptions.bookTitle || "My Coloring Book"}
                      </div>
                      
                      {coloringOptions.subtitle && (
                        <div className="text-lg text-muted-foreground italic">
                          {coloringOptions.subtitle}
                        </div>
                      )}
                      
                      <div className="flex-grow"></div>
                      
                      {coloringOptions.authorName && (
                        <div className="text-xl mt-auto">
                          by <span className="font-medium">{coloringOptions.authorName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between mt-8">
                  <Button
                    onClick={goToPreviousStep}
                    variant="outline"
                  >
                    Back
                  </Button>
                  
                  <Button
                    onClick={goToNextStep}
                    className="gap-2"
                  >
                    <ArrowRight className="w-5 h-5" />
                    Continue
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* STEP 6: Generate Book */}
          {currentStep === 'generate-book' && (
            <Card className="relative overflow-hidden border border-primary/20 bg-background/40 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
              <div className="relative p-8 space-y-6">
                <h2 className="text-2xl font-bold mb-4 text-center">Generate Your Coloring Book</h2>
                
                <div className="max-w-2xl mx-auto">
                  {/* Book Summary */}
                  <div className="bg-muted/30 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-4">Book Summary</h3>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Title:</span> 
                        <span className="ml-2 font-medium">{coloringOptions.bookTitle || "Coloring Book"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Pages:</span> 
                        <span className="ml-2 font-medium">{expandedPrompts.length}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Size:</span> 
                        <span className="ml-2 font-medium">{coloringOptions.trimSize}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Bleed:</span> 
                        <span className="ml-2 font-medium">{coloringOptions.includeBleed ? "Yes" : "No"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Title Page:</span> 
                        <span className="ml-2 font-medium">{coloringOptions.addTitlePage ? "Yes" : "No"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Page Numbers:</span> 
                        <span className="ml-2 font-medium">{coloringOptions.showPageNumbers ? "Yes" : "No"}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Generate Button */}
                  {!isGenerating && generatedPages.length === 0 ? (
                    <Button
                      onClick={handleGenerateBook}
                      className="w-full h-14 text-lg mt-8 relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                      <span className="relative flex items-center justify-center gap-2">
                        <Wand2 className="w-6 h-6" />
                        Generate Coloring Book
                      </span>
                    </Button>
                  ) : isGenerating ? (
                    <div className="space-y-8 mt-8">
                      <div className="space-y-2">
                        <div className="flex justify-between mb-1">
                          <span>Generating coloring pages...</span>
                          <span className="text-primary">Page {currentGeneratingPage} of {expandedPrompts.length}</span>
                        </div>
                        <Progress value={generationProgress} className="h-3" />
                      </div>
                      
                      {/* Live Preview */}
                      {generatedPages.length > 0 && (
                        <div className="mt-8">
                          <h3 className="text-lg font-medium mb-4">Live Preview</h3>
                          <div className="grid grid-cols-4 gap-4">
                            {generatedPages.map((page, index) => (
                              <div 
                                key={index}
                                className="aspect-[1/1.4] bg-white rounded-md overflow-hidden border border-border"
                              >
                                <img 
                                  src={page} 
                                  alt={`Page ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Generation complete
                    <div className="mt-8 text-center space-y-4">
                      <div className="inline-flex items-center justify-center p-2 rounded-full bg-green-100 text-green-600">
                        <Check className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-medium">Generation Complete!</h3>
                      <p className="text-muted-foreground">Your coloring book is ready to preview and download.</p>
                      <Button
                        onClick={goToNextStep}
                        className="mt-4"
                      >
                        Preview & Download
                      </Button>
                    </div>
                  )}
                </div>
                
                {!isGenerating && generatedPages.length === 0 && (
                  <div className="flex justify-between mt-8">
                    <Button
                      onClick={goToPreviousStep}
                      variant="outline"
                    >
                      Back
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* STEP 7: Preview and Download */}
          {currentStep === 'preview-download' && (
            <Card className="relative overflow-hidden border border-primary/20 bg-background/40 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
              <div className="relative p-8 space-y-6">
                <h2 className="text-2xl font-bold mb-4">Your Coloring Book Preview</h2>
                
                {/* Prompts Editing Panel */}
                <div className="bg-muted/30 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-primary" />
                      Page Prompts
                    </h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1"
                      onClick={shuffleAllPrompts}
                      disabled={!useMultiplePrompts || isGeneratingPrompts}
                    >
                      <Shuffle className="w-4 h-4" />
                      Regenerate All
                    </Button>
                  </div>
                  
                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                    {expandedPrompts.map((prompt, index) => (
                      <div key={index} className="flex flex-col sm:flex-row gap-2 items-start">
                        <div className="bg-primary/10 text-primary shrink-0 font-medium rounded-full w-8 h-8 flex items-center justify-center">
                          {index + 1}
                        </div>
                        <div className="flex-1 relative">
                          <Textarea
                            value={prompt}
                            onChange={(e) => updateExpandedPrompt(index, e.target.value)}
                            className="min-h-[60px] py-2 pr-20 resize-none bg-background/70 border-primary/20 focus:border-primary/50"
                            placeholder={`Prompt for page ${index + 1}`}
                            maxLength={250}
                          />
                          <div className="absolute right-3 bottom-2 text-xs text-muted-foreground">
                            {prompt.length}/250
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="shrink-0 mt-2 sm:mt-0 h-10 gap-1"
                          onClick={() => regenerateSinglePrompt(index)}
                          disabled={!useMultiplePrompts}
                        >
                          <RefreshCw className="w-3 h-3" />
                          Regenerate
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  {/* Apply Prompt Changes Button */}
                  <div className="mt-4 flex justify-end">
                    <Button
                      onClick={handleGenerateBook} 
                      className="gap-2"
                      disabled={isGenerating}
                    >
                      <Wand2 className="w-4 h-4" />
                      Apply Changes & Regenerate
                    </Button>
                  </div>
                </div>
                
                {/* Download Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-4 justify-end">
                  <Button 
                    variant="default" 
                    className="gap-2 w-full sm:w-auto"
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
                    className="gap-2 w-full sm:w-auto"
                    onClick={handleDownloadImages}
                    disabled={generatedPages.length === 0}
                  >
                    <Download className="w-5 h-5" />
                    Download All Images (ZIP)
                  </Button>
                </div>
                
                {/* PDF Progress */}
                {isCreatingPdf && (
                  <div className="space-y-2">
                    <div className="flex justify-between mb-1">
                      <span>Creating PDF...</span>
                      <span className="text-primary">{pdfProgress}%</span>
                    </div>
                    <Progress value={pdfProgress} className="h-2" />
                  </div>
                )}
                
                {/* Image Generation Progress */}
                {isGenerating && (
                  <div className="space-y-2">
                    <div className="flex justify-between mb-1">
                      <span>Regenerating coloring pages...</span>
                      <span className="text-primary">Page {currentGeneratingPage} of {expandedPrompts.length}</span>
                    </div>
                    <Progress value={generationProgress} className="h-2" />
                  </div>
                )}
                
                {/* Book Metadata */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-muted/30 p-4 rounded-lg text-sm">
                  <div>
                    <span className="text-muted-foreground block">Pages</span>
                    <span className="font-medium">{generatedPages.length}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Size</span>
                    <span className="font-medium">{coloringOptions.trimSize}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Format</span>
                    <span className="font-medium">PDF, PNG</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Quality</span>
                    <span className="font-medium">300 DPI</span>
                  </div>
                </div>
                
                {/* Main Preview */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                  {/* Large Preview */}
                  <div className="lg:col-span-2 aspect-[1/1.4] bg-white rounded-xl overflow-hidden shadow-md border border-primary/20 relative">
                    {generatedPages.length > 0 ? (
                      <>
                        <img 
                          src={generatedPages[activePreviewIndex]} 
                          alt={`Coloring page ${activePreviewIndex + 1}`}
                          className="w-full h-full object-contain"
                        />
                        
                        {/* Page prompt display */}
                        <div className="absolute bottom-12 left-0 right-0 text-center">
                          <div className="px-4 py-2 bg-background/80 backdrop-blur-sm mx-auto max-w-md rounded-md text-sm">
                            <span className="font-medium">Prompt: </span>
                            {expandedPrompts[activePreviewIndex] || "No prompt available"}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-muted/20 p-8 text-center gap-4">
                        <Wand2 className="w-12 h-12 text-muted-foreground/50" />
                        <p className="text-muted-foreground/70">No coloring pages generated yet. Click "Apply Changes & Regenerate" to create your coloring book.</p>
                      </div>
                    )}
                    
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
                    {generatedPages.length > 0 && (
                      <div className="absolute bottom-2 left-0 right-0 text-center">
                        <span className="px-2 py-1 bg-background/70 rounded-md text-sm font-medium">
                          Page {activePreviewIndex + 1} of {generatedPages.length}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Thumbnails Grid */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-semibold">All Pages ({generatedPages.length})</h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="gap-1"
                        onClick={() => setActivePreviewIndex(0)}
                      >
                        <Eye className="w-4 h-4" />
                        Show All
                      </Button>
                    </div>
                    
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
                
                <div className="flex justify-between mt-8">
                  <Button
                    onClick={goToPreviousStep}
                    variant="outline"
                  >
                    Back
                  </Button>
                  
                  <Button
                    onClick={() => {
                      // Reset state for new project
                      setCurrentStep('start-method');
                      setStartMethod(null);
                      setBasePrompt('');
                      setGeneratedPrompt('');
                      setUploadedImage(null);
                      setExpandedPrompts([]);
                      setPromptsConfirmed(false);
                    }}
                    className="gap-2"
                  >
                    Create Another Book
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};