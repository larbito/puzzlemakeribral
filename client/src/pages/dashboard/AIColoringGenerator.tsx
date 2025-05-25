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
import { Slider } from '@/components/ui/slider';
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
  ArrowRight,
  Zap,
  Lightbulb,
  Save,
  Trash2,
  Plus,
  GripVertical,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';

// KDP Book Sizes (industry standard)
const KDP_BOOK_SIZES = [
  { label: "8.5\" × 11\" (US Letter)", value: "8.5x11", width: 8.5, height: 11, popular: true },
  { label: "8\" × 10\" (Square-ish)", value: "8x10", width: 8, height: 10, popular: true },
  { label: "7.5\" × 9.25\" (Compact)", value: "7.5x9.25", width: 7.5, height: 9.25, popular: false },
  { label: "7\" × 10\" (Standard)", value: "7x10", width: 7, height: 10, popular: true },
  { label: "6\" × 9\" (Trade)", value: "6x9", width: 6, height: 9, popular: false },
  { label: "8\" × 8\" (Square)", value: "8x8", width: 8, height: 8, popular: true },
];

// AI Model Options
const AI_MODELS = [
  { 
    id: 'ideogram', 
    name: 'Creative Engine', 
    description: 'Optimized for detailed coloring book illustrations',
    icon: Lightbulb,
    color: 'from-purple-500 to-pink-500'
  },
  { 
    id: 'dalle', 
    name: 'Artistic AI', 
    description: 'Advanced AI for creative and artistic designs',
    icon: Zap,
    color: 'from-blue-500 to-cyan-500'
  }
];

// Complexity levels for image generation
const COMPLEXITY_LEVELS = [
  {
    value: 'low',
    label: 'Low',
    description: 'Simple objects, basic shapes, minimal detail',
    promptModifier: 'simple, basic shapes, minimal details, large areas for coloring'
  },
  {
    value: 'medium',
    label: 'Medium',
    description: 'Moderate detail, balanced complexity',
    promptModifier: 'moderate detail, balanced complexity, suitable for children and adults'
  },
  {
    value: 'high',
    label: 'High',
    description: 'Detailed environments, multiple elements, intricate patterns',
    promptModifier: 'detailed environment, multiple elements, intricate patterns, complex scenes'
  }
];

interface ColoringBookOptions {
  bookTitle: string;
  authorName: string;
  subtitle: string;
  bookSize: string;
  pageCount: number;
  addTitlePage: boolean;
  addBlankPages: boolean;
  showPageNumbers: boolean;
  includeBleed: boolean;
  safeArea: boolean;
  dpi: number;
  aiModel: string;
  complexity: string;
}

interface Scene {
  id: string;
  title: string;
  description: string;
  prompt: string;
  imageUrl?: string;
  isGenerating?: boolean;
}

// Workflow steps
type WorkflowStep = 
  | 'book-settings'     // Step 1: Book size, title, AI model selection
  | 'story-input'       // Step 2: Story concept and scene count
  | 'scene-generation'  // Step 3: AI generates scene descriptions
  | 'scene-review'      // Step 4: Review and edit scenes
  | 'image-generation'  // Step 5: Generate coloring page images
  | 'preview-export';   // Step 6: Preview and export book

export const AIColoringGenerator = () => {
  // Workflow state
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('book-settings');
  
  // Book settings (Step 1)
  const [bookOptions, setBookOptions] = useState<ColoringBookOptions>({
    bookTitle: '',
    authorName: '',
    subtitle: '',
    bookSize: '8.5x11',
    pageCount: 10,
    addTitlePage: true,
    addBlankPages: false,
    showPageNumbers: true,
    includeBleed: true,
    safeArea: true,
    dpi: 300,
    aiModel: 'ideogram',
    complexity: 'medium'
  });

  // Story input (Step 2)
  const [storyInput, setStoryInput] = useState('');
  const [isGeneratingScenes, setIsGeneratingScenes] = useState(false);

  // Scene management (Steps 3-4)
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [editingScene, setEditingScene] = useState<string | null>(null);

  // Image generation (Step 5)
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentGeneratingPage, setCurrentGeneratingPage] = useState(0);

  // Preview and export (Step 6)
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isCreatingPdf, setIsCreatingPdf] = useState(false);

  // Get API URL
  const getApiUrl = () => {
    return process.env.NODE_ENV === 'production' 
      ? 'https://puzzlemakeribral-production.up.railway.app'
      : 'http://localhost:3000';
  };

  // Navigation helpers
  const goToNextStep = () => {
    const stepOrder: WorkflowStep[] = ['book-settings', 'story-input', 'scene-generation', 'scene-review', 'image-generation', 'preview-export'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const goToPreviousStep = () => {
    const stepOrder: WorkflowStep[] = ['book-settings', 'story-input', 'scene-generation', 'scene-review', 'image-generation', 'preview-export'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  // Step 1: Validate book settings and proceed
  const handleBookSettingsContinue = () => {
    if (!bookOptions.bookTitle.trim()) {
      toast.error('Please enter a book title');
      return;
    }
    if (!bookOptions.authorName.trim()) {
      toast.error('Please enter an author name');
      return;
    }
    if (bookOptions.pageCount < 1 || bookOptions.pageCount > 300) {
      toast.error('Page count must be between 1 and 300');
      return;
    }
    goToNextStep();
  };

  // Step 2: Validate story input and proceed
  const handleStoryInputContinue = () => {
    if (!storyInput.trim()) {
      toast.error('Please enter your story concept');
      return;
    }
    if (storyInput.trim().length < 20) {
      toast.error('Please provide a more detailed story concept (at least 20 characters)');
      return;
    }
    goToNextStep();
  };

  // Enhanced prompt generation with complexity and batch processing
  const generateScenesWithComplexity = async () => {
    setIsGeneratingScenes(true);
    try {
      console.log('Generating scenes for story:', storyInput);
      console.log('Page count:', bookOptions.pageCount);
      console.log('Complexity level:', bookOptions.complexity);

      const complexity = COMPLEXITY_LEVELS.find(c => c.value === bookOptions.complexity);
      const complexityModifier = complexity?.promptModifier || 'moderate detail';

      let allScenes: Scene[] = [];
      const batchSize = bookOptions.pageCount > 50 ? 25 : bookOptions.pageCount;
      const totalBatches = Math.ceil(bookOptions.pageCount / batchSize);

      for (let batch = 0; batch < totalBatches; batch++) {
        const startPage = batch * batchSize + 1;
        const endPage = Math.min((batch + 1) * batchSize, bookOptions.pageCount);
        const batchPageCount = endPage - startPage + 1;

        console.log(`Generating batch ${batch + 1}/${totalBatches}: pages ${startPage}-${endPage}`);

        const response = await fetch(`${getApiUrl()}/api/openai/generate-coloring-scenes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            storyInput: storyInput.trim(),
            pageCount: batchPageCount,
            bookTitle: bookOptions.bookTitle,
            targetAudience: 'children and adults',
            artStyle: 'coloring book line art',
            complexity: bookOptions.complexity,
            complexityModifier: complexityModifier,
            batchInfo: {
              current: batch + 1,
              total: totalBatches,
              startPage: startPage,
              endPage: endPage
            }
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.scenes) {
          const batchScenes: Scene[] = data.scenes.map((scene: any, index: number) => ({
            id: `scene-${startPage + index}`,
            title: scene.title || `Scene ${startPage + index}`,
            description: scene.description || '',
            prompt: `${scene.prompt || scene.description}, ${complexityModifier}, black and white line art, clean outlines, suitable for coloring`
          }));
          
          allScenes = [...allScenes, ...batchScenes];
        } else {
          throw new Error(data.error || 'Invalid response format');
        }

        // Add delay between batches to avoid rate limiting
        if (batch < totalBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      setScenes(allScenes);
      toast.success(`Generated ${allScenes.length} scenes successfully!`);
      goToNextStep(); // Automatically proceed to scene review
    } catch (error) {
      console.error('Error generating scenes:', error);
      toast.error(`Failed to generate scenes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingScenes(false);
    }
  };

  // Step 4: Edit scene
  const updateScene = (sceneId: string, updates: Partial<Scene>) => {
    setScenes(prev => prev.map(scene => 
      scene.id === sceneId ? { ...scene, ...updates } : scene
    ));
  };

  // Step 4: Add new scene
  const addNewScene = () => {
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      title: `Scene ${scenes.length + 1}`,
      description: 'A new coloring page scene',
      prompt: 'Simple line art coloring page, black and white outlines, suitable for coloring'
    };
    setScenes(prev => [...prev, newScene]);
  };

  // Step 4: Delete scene
  const deleteScene = (sceneId: string) => {
    setScenes(prev => prev.filter(scene => scene.id !== sceneId));
  };

  // Step 4: Reorder scenes
  const moveScene = (sceneId: string, direction: 'up' | 'down') => {
    setScenes(prev => {
      const index = prev.findIndex(scene => scene.id === sceneId);
      if (index === -1) return prev;
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const newScenes = [...prev];
      [newScenes[index], newScenes[newIndex]] = [newScenes[newIndex], newScenes[index]];
      return newScenes;
    });
  };

  // Step 4: Regenerate single scene
  const regenerateScene = async (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene) return;

    try {
      updateScene(sceneId, { isGenerating: true });
      
      const complexity = COMPLEXITY_LEVELS.find(c => c.value === bookOptions.complexity);
      const complexityModifier = complexity?.promptModifier || 'moderate detail';
      
      const response = await fetch(`${getApiUrl()}/api/openai/regenerate-scene`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storyInput: storyInput.trim(),
          sceneTitle: scene.title,
          sceneDescription: scene.description,
          artStyle: 'coloring book line art',
          complexity: bookOptions.complexity,
          complexityModifier: complexityModifier
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate scene');
      }

      const data = await response.json();
      
      if (data.success && data.scene) {
        updateScene(sceneId, {
          title: data.scene.title || scene.title,
          description: data.scene.description || scene.description,
          prompt: `${data.scene.prompt || data.scene.description}, ${complexityModifier}, black and white line art, clean outlines, suitable for coloring`,
          isGenerating: false
        });
        toast.success('Scene regenerated successfully!');
      } else {
        throw new Error(data.error || 'Invalid response format');
      }
    } catch (error) {
      console.error('Error regenerating scene:', error);
      toast.error(`Failed to regenerate scene: ${error instanceof Error ? error.message : 'Unknown error'}`);
      updateScene(sceneId, { isGenerating: false });
    }
  };

  // Step 5: Generate coloring page images
  const generateColoringImages = async () => {
    setIsGeneratingImages(true);
    setGenerationProgress(0);
    setCurrentGeneratingPage(0);

    try {
      const selectedBookSize = KDP_BOOK_SIZES.find(size => size.value === bookOptions.bookSize);
      const aspectRatio = selectedBookSize ? `${selectedBookSize.width}:${selectedBookSize.height}` : '8.5:11';

      for (let i = 0; i < scenes.length; i++) {
        setCurrentGeneratingPage(i + 1);
        const scene = scenes[i];

        try {
          console.log(`Generating image ${i + 1}/${scenes.length} for scene:`, scene.title);

          const endpoint = bookOptions.aiModel === 'dalle' 
            ? `${getApiUrl()}/api/generate-coloring-dalle`
            : `${getApiUrl()}/api/ideogram/generate-coloring`;

          const requestBody = bookOptions.aiModel === 'dalle' 
            ? {
                prompt: scene.prompt,
                bookSize: bookOptions.bookSize,
                safeArea: bookOptions.safeArea,
                style: 'coloring book line art'
              }
            : {
                prompt: scene.prompt,
                aspect_ratio: aspectRatio,
                style_type: 'DESIGN',
                magic_prompt_option: 'AUTO'
              };

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
            throw new Error(`Failed to generate image for scene ${i + 1}`);
          }

          const data = await response.json();
          let imageUrl = '';

          if (bookOptions.aiModel === 'dalle') {
            imageUrl = data.imageUrl || data.images?.[0]?.url || '';
          } else {
            imageUrl = data.images?.[0]?.url || data.url || '';
          }

          if (imageUrl) {
            updateScene(scene.id, { imageUrl });
            console.log(`Generated image for scene ${i + 1}:`, imageUrl);
          } else {
            throw new Error(`No image URL returned for scene ${i + 1}`);
          }
        } catch (error) {
          console.error(`Error generating image for scene ${i + 1}:`, error);
          toast.error(`Failed to generate image for scene ${i + 1}: ${scene.title}`);
        }

        // Update progress
        setGenerationProgress(((i + 1) / scenes.length) * 100);
        
        // Add delay to avoid rate limiting
        if (i < scenes.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      toast.success('All coloring page images generated successfully!');
      goToNextStep();
    } catch (error) {
      console.error('Error in image generation process:', error);
      toast.error('Image generation process failed');
    } finally {
      setIsGeneratingImages(false);
    }
  };

  // Step 6: Create PDF with enhanced settings
  const createPDF = async () => {
    setIsCreatingPdf(true);
    try {
      const imageUrls = scenes.map(scene => scene.imageUrl).filter(Boolean);
      
      if (imageUrls.length === 0) {
        throw new Error('No images available to create PDF');
      }

      const selectedBookSize = KDP_BOOK_SIZES.find(size => size.value === bookOptions.bookSize);

      const response = await fetch(`${getApiUrl()}/api/coloring/create-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: imageUrls,
          bookOptions: {
            ...bookOptions,
            width: selectedBookSize?.width || 8.5,
            height: selectedBookSize?.height || 11
          },
          scenes: scenes.map(scene => ({
            title: scene.title,
            description: scene.description
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create PDF');
      }

      const data = await response.json();
      
      if (data.pdfUrl) {
        setPdfUrl(data.pdfUrl);
        toast.success('PDF created successfully!');
      } else {
        throw new Error(data.error || 'No PDF URL returned');
      }
    } catch (error) {
      console.error('Error creating PDF:', error);
      toast.error(`Failed to create PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreatingPdf(false);
    }
  };

  // Download images as ZIP
  const downloadImages = async () => {
    try {
      const imageUrls = scenes.map(scene => scene.imageUrl).filter(Boolean);
      
      if (imageUrls.length === 0) {
        toast.error('No images available to download');
        return;
      }

      const response = await fetch(`${getApiUrl()}/api/coloring/download-images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: imageUrls,
          bookTitle: bookOptions.bookTitle,
          scenes: scenes.map(scene => ({
            title: scene.title,
            filename: `${scene.id}-${scene.title.toLowerCase().replace(/\s+/g, '-')}.jpg`
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to download images');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${bookOptions.bookTitle.toLowerCase().replace(/\s+/g, '-')}-coloring-pages.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Images downloaded successfully!');
    } catch (error) {
      console.error('Error downloading images:', error);
      toast.error(`Failed to download images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Progress indicator component
  const StepIndicator = () => {
    const steps = [
      { name: 'Book Setup', step: 'book-settings' },
      { name: 'Story Input', step: 'story-input' },
      { name: 'Scene Generation', step: 'scene-generation' },
      { name: 'Review Scenes', step: 'scene-review' },
      { name: 'Generate Images', step: 'image-generation' },
      { name: 'Preview & Export', step: 'preview-export' }
    ];

    return (
      <div className="w-full flex justify-between items-center mb-8 px-4">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center">
            <div 
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep === step.step
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {index + 1}
            </div>
            <span className={`text-xs mt-1 ${
              currentStep === step.step ? 'text-primary font-medium' : 'text-muted-foreground'
            }`}>
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
            Create professional coloring books with AI-powered scene generation and KDP-ready formatting
          </motion.p>
        </div>

        {/* Step Indicator */}
        <StepIndicator />
        
        {/* Main Content Area - Step based UI */}
        <div className="space-y-6">
          {/* STEP 1: Book Settings */}
          {currentStep === 'book-settings' && (
            <Card className="relative overflow-hidden border border-primary/20 bg-background/40 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
              <div className="relative p-8 space-y-6">
                <h2 className="text-2xl font-bold mb-6 text-center">Book Settings & Configuration</h2>
                
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Basic Book Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-4">Book Information</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bookTitle">Book Title *</Label>
                      <Input
                        id="bookTitle"
                        value={bookOptions.bookTitle}
                        onChange={(e) => setBookOptions(prev => ({ ...prev, bookTitle: e.target.value }))}
                        placeholder="Enter your book title"
                        className="bg-background/50 border-primary/20 focus:border-primary/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="authorName">Author Name *</Label>
                      <Input
                        id="authorName"
                        value={bookOptions.authorName}
                        onChange={(e) => setBookOptions(prev => ({ ...prev, authorName: e.target.value }))}
                        placeholder="Enter author name"
                        className="bg-background/50 border-primary/20 focus:border-primary/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subtitle">Subtitle (Optional)</Label>
                      <Input
                        id="subtitle"
                        value={bookOptions.subtitle}
                        onChange={(e) => setBookOptions(prev => ({ ...prev, subtitle: e.target.value }))}
                        placeholder="Enter subtitle"
                        className="bg-background/50 border-primary/20 focus:border-primary/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pageCount">Number of Pages</Label>
                      <div className="flex items-center space-x-4">
                        <Input
                          id="pageCount"
                          type="number"
                          min="1"
                          max="300"
                          value={bookOptions.pageCount}
                          onChange={(e) => setBookOptions(prev => ({ ...prev, pageCount: parseInt(e.target.value) || 10 }))}
                          className="bg-background/50 border-primary/20 focus:border-primary/50"
                        />
                        <span className="text-sm text-muted-foreground">1-300 pages</span>
                      </div>
                    </div>
                  </div>

                  {/* Technical Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-4">Technical Settings</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bookSize">KDP Book Size</Label>
                      <Select
                        value={bookOptions.bookSize}
                        onValueChange={(value) => setBookOptions(prev => ({ ...prev, bookSize: value }))}
                      >
                        <SelectTrigger className="bg-background/50 border-primary/20 focus:border-primary/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {KDP_BOOK_SIZES.map((size) => (
                            <SelectItem key={size.value} value={size.value}>
                              <div className="flex items-center justify-between w-full">
                                <span>{size.label}</span>
                                {size.popular && (
                                  <span className="ml-2 px-2 py-1 text-xs bg-primary/20 text-primary rounded">
                                    Popular
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>AI Model Selection</Label>
                      <div className="grid grid-cols-2 gap-4">
                        {AI_MODELS.map((model) => {
                          const IconComponent = model.icon;
                          return (
                            <div
                              key={model.id}
                              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                bookOptions.aiModel === model.id
                                  ? 'border-primary bg-primary/5'
                                  : 'border-muted hover:border-primary/50'
                              }`}
                              onClick={() => setBookOptions(prev => ({ ...prev, aiModel: model.id }))}
                            >
                              <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${model.color} p-2 mb-2`}>
                                <IconComponent className="w-4 h-4 text-white" />
                              </div>
                              <h4 className="font-medium">{model.name}</h4>
                              <p className="text-xs text-muted-foreground mt-1">{model.description}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* NEW: Image Complexity Selector */}
                    <div className="space-y-2">
                      <Label>Image Complexity</Label>
                      <Select
                        value={bookOptions.complexity}
                        onValueChange={(value) => setBookOptions(prev => ({ ...prev, complexity: value }))}
                      >
                        <SelectTrigger className="bg-background/50 border-primary/20 focus:border-primary/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COMPLEXITY_LEVELS.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              <div className="flex flex-col">
                                <span className="font-medium">{level.label}</span>
                                <span className="text-xs text-muted-foreground">{level.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {COMPLEXITY_LEVELS.find(l => l.value === bookOptions.complexity)?.description}
                      </p>
                    </div>

                    {/* KDP Options */}
                    <div className="space-y-3">
                      <Label>KDP Options</Label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Include Title Page</span>
                          <Switch
                            checked={bookOptions.addTitlePage}
                            onCheckedChange={(checked) => setBookOptions(prev => ({ ...prev, addTitlePage: checked }))}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Add Blank Pages for Notes</span>
                          <Switch
                            checked={bookOptions.addBlankPages}
                            onCheckedChange={(checked) => setBookOptions(prev => ({ ...prev, addBlankPages: checked }))}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Show Page Numbers</span>
                          <Switch
                            checked={bookOptions.showPageNumbers}
                            onCheckedChange={(checked) => setBookOptions(prev => ({ ...prev, showPageNumbers: checked }))}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Include Bleed Area</span>
                          <Switch
                            checked={bookOptions.includeBleed}
                            onCheckedChange={(checked) => setBookOptions(prev => ({ ...prev, includeBleed: checked }))}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Safe Area Guidelines</span>
                          <Switch
                            checked={bookOptions.safeArea}
                            onCheckedChange={(checked) => setBookOptions(prev => ({ ...prev, safeArea: checked }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6">
                  <Button 
                    onClick={handleBookSettingsContinue}
                    className="px-8"
                  >
                    Continue to Story Input
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* STEP 2: Story Input */}
          {currentStep === 'story-input' && (
            <Card className="relative overflow-hidden border border-primary/20 bg-background/40 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
              <div className="relative p-8 space-y-6">
                <h2 className="text-2xl font-bold mb-6 text-center">Story Concept & Theme</h2>
                
                <div className="max-w-3xl mx-auto space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="storyInput">Describe Your Coloring Book Story</Label>
                    <p className="text-sm text-muted-foreground">
                      Describe the story, theme, or concept for your coloring book. For example: "The life of a curious rabbit exploring a magical jungle" or "A space adventure with friendly aliens visiting different planets".
                    </p>
                    <Textarea
                      id="storyInput"
                      value={storyInput}
                      onChange={(e) => setStoryInput(e.target.value)}
                      placeholder="Example: The adventures of a friendly dragon who helps children in a medieval village. The dragon learns about friendship, courage, and helping others while exploring castles, forests, and magical places..."
                      className="min-h-[200px] bg-background/50 border-primary/20 focus:border-primary/50 backdrop-blur-sm text-lg resize-none"
                      maxLength={1000}
                    />
                    <div className="text-xs text-muted-foreground text-right">
                      {storyInput.length}/1000 characters
                    </div>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <h3 className="font-medium mb-2 flex items-center">
                      <Lightbulb className="w-4 h-4 mr-2 text-primary" />
                      AI Scene Generation
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Our AI will analyze your story concept and automatically generate <strong>{bookOptions.pageCount} unique scenes</strong> that follow your theme. Each scene will be designed as a coloring page with <strong>{COMPLEXITY_LEVELS.find(c => c.value === bookOptions.complexity)?.label.toLowerCase()}</strong> complexity suitable for both children and adults.
                    </p>
                    {bookOptions.pageCount > 50 && (
                      <p className="text-xs text-amber-600 mt-2 flex items-center">
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Large batch detected: Scenes will be generated in multiple batches to ensure quality.
                      </p>
                    )}
                  </div>

                  <div className="flex justify-between pt-6">
                    <Button 
                      variant="outline"
                      onClick={goToPreviousStep}
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Back to Settings
                    </Button>
                    <Button 
                      onClick={handleStoryInputContinue}
                      className="px-8"
                    >
                      Generate Scenes
                      <Sparkles className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* STEP 3: Scene Generation */}
          {currentStep === 'scene-generation' && (
            <Card className="relative overflow-hidden border border-primary/20 bg-background/40 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
              <div className="relative p-8 space-y-6">
                <h2 className="text-2xl font-bold mb-6 text-center">AI Scene Generation</h2>
                
                <div className="max-w-3xl mx-auto space-y-6 text-center">
                  <div className="space-y-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                    </div>
                    <h3 className="text-lg font-medium">Creating Your Story Scenes</h3>
                    <p className="text-muted-foreground">
                      Our AI is analyzing your story concept and generating {bookOptions.pageCount} unique scenes for your coloring book. This may take a moment...
                    </p>
                  </div>

                  <div className="bg-background/50 border border-primary/20 rounded-lg p-6">
                    <h4 className="font-medium mb-2">Story Concept:</h4>
                    <p className="text-muted-foreground italic">"{storyInput}"</p>
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Pages:</span> {bookOptions.pageCount}
                      </div>
                      <div>
                        <span className="font-medium">AI Model:</span> {AI_MODELS.find(m => m.id === bookOptions.aiModel)?.name}
                      </div>
                      <div>
                        <span className="font-medium">Complexity:</span> {COMPLEXITY_LEVELS.find(c => c.value === bookOptions.complexity)?.label}
                      </div>
                      <div>
                        <span className="font-medium">Batches:</span> {bookOptions.pageCount > 50 ? Math.ceil(bookOptions.pageCount / 25) : 1}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center space-x-4">
                    <Button 
                      variant="outline"
                      onClick={goToPreviousStep}
                      disabled={isGeneratingScenes}
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Back to Story Input
                    </Button>
                    <Button 
                      onClick={generateScenesWithComplexity}
                      disabled={isGeneratingScenes}
                      className="px-8"
                    >
                      {isGeneratingScenes ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Generating Scenes...
                        </>
                      ) : (
                        <>
                          Generate {bookOptions.pageCount} Scenes
                          <Wand2 className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* STEP 4: Scene Review - Enhanced with reordering, adding, deleting */}
          {currentStep === 'scene-review' && (
            <Card className="relative overflow-hidden border border-primary/20 bg-background/40 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
              <div className="relative p-8 space-y-6">
                <h2 className="text-2xl font-bold mb-6 text-center">Review & Edit Scenes</h2>
                
                <div className="max-w-6xl mx-auto space-y-6">
                  <div className="text-center mb-6">
                    <p className="text-muted-foreground">
                      Review the generated scenes for your coloring book. You can edit titles, descriptions, and prompts, or regenerate individual scenes.
                    </p>
                    <div className="mt-2 text-sm text-primary font-medium">
                      {scenes.length} scenes ready for "{storyInput.substring(0, 50)}..."
                    </div>
                  </div>

                  {/* Scene Management Controls */}
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addNewScene}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Scene
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setScenes([])}
                        disabled={scenes.length === 0}
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Clear All
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total scenes: {scenes.length}
                    </div>
                  </div>
                  
                  <div className="grid gap-6">
                    {scenes.map((scene, index) => (
                      <Card key={scene.id} className="p-6 border border-primary/10">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium">{index + 1}</span>
                            </div>
                            <h3 className="text-lg font-semibold">Scene {index + 1}</h3>
                          </div>
                          <div className="flex space-x-2">
                            {/* Reorder buttons */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveScene(scene.id, 'up')}
                              disabled={index === 0}
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveScene(scene.id, 'down')}
                              disabled={index === scenes.length - 1}
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                            
                            {/* Action buttons */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingScene(editingScene === scene.id ? null : scene.id)}
                              disabled={scene.isGenerating}
                            >
                              <PenLine className="w-4 h-4 mr-2" />
                              {editingScene === scene.id ? 'Cancel' : 'Edit'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => regenerateScene(scene.id)}
                              disabled={scene.isGenerating}
                            >
                              {scene.isGenerating ? (
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Shuffle className="w-4 h-4 mr-2" />
                              )}
                              {scene.isGenerating ? 'Regenerating...' : 'Regenerate'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteScene(scene.id)}
                              disabled={scene.isGenerating}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {editingScene === scene.id ? (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor={`title-${scene.id}`}>Scene Title</Label>
                              <Input
                                id={`title-${scene.id}`}
                                value={scene.title}
                                onChange={(e) => updateScene(scene.id, { title: e.target.value })}
                                className="bg-background/50 border-primary/20 focus:border-primary/50"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`description-${scene.id}`}>Description</Label>
                              <Textarea
                                id={`description-${scene.id}`}
                                value={scene.description}
                                onChange={(e) => updateScene(scene.id, { description: e.target.value })}
                                className="bg-background/50 border-primary/20 focus:border-primary/50 min-h-[80px]"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`prompt-${scene.id}`}>AI Generation Prompt</Label>
                              <Textarea
                                id={`prompt-${scene.id}`}
                                value={scene.prompt}
                                onChange={(e) => updateScene(scene.id, { prompt: e.target.value })}
                                className="bg-background/50 border-primary/20 focus:border-primary/50 min-h-[100px]"
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" onClick={() => setEditingScene(null)}>
                                Cancel
                              </Button>
                              <Button onClick={() => setEditingScene(null)}>
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-medium text-primary">{scene.title}</h4>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {scene.description}
                              </p>
                            </div>
                            <div className="bg-muted/30 p-3 rounded-lg">
                              <p className="text-xs text-muted-foreground mb-1">AI Generation Prompt:</p>
                              <p className="text-sm font-mono">{scene.prompt}</p>
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                  
                  <div className="flex justify-between pt-6">
                    <Button
                      variant="outline"
                      onClick={goToPreviousStep}
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Back to Scene Generation
                    </Button>
                    <Button
                      onClick={goToNextStep}
                      className="px-8"
                      disabled={scenes.length === 0}
                    >
                      Generate Coloring Pages
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* STEP 5: Image Generation */}
          {currentStep === 'image-generation' && (
            <Card className="relative overflow-hidden border border-primary/20 bg-background/40 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
              <div className="relative p-8 space-y-6">
                <h2 className="text-2xl font-bold mb-6 text-center">Generating Coloring Pages</h2>
                
                <div className="max-w-4xl mx-auto space-y-6">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <ImageIcon className="w-8 h-8 text-primary animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-2">Creating Your Coloring Book</h3>
                      <p className="text-muted-foreground">
                        Generating {scenes.length} coloring pages using {AI_MODELS.find(m => m.id === bookOptions.aiModel)?.name}...
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        {isGeneratingImages ? `Page ${currentGeneratingPage} of ${scenes.length}` : 'Ready to generate'}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(generationProgress)}% complete
                      </span>
                    </div>
                    <Progress value={generationProgress} className="w-full" />
                  </div>

                  {isGeneratingImages && (
                    <div className="bg-background/50 border border-primary/20 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <RefreshCw className="w-5 h-5 text-primary animate-spin" />
                        <div>
                          <p className="font-medium">
                            Generating: {scenes[currentGeneratingPage - 1]?.title || 'Scene'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            This may take a few moments per page...
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Generated Images Preview */}
                  {scenes.some(scene => scene.imageUrl) && (
                    <div className="space-y-4">
                      <h4 className="font-medium">Generated Pages:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {scenes.map((scene, index) => (
                          <div key={scene.id} className="space-y-2">
                            <div className="aspect-square bg-muted rounded-lg overflow-hidden border border-primary/20">
                              {scene.imageUrl ? (
                                <img 
                                  src={scene.imageUrl} 
                                  alt={scene.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  {scene.isGenerating ? (
                                    <RefreshCw className="w-6 h-6 text-primary animate-spin" />
                                  ) : (
                                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                  )}
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-center text-muted-foreground">
                              {index + 1}. {scene.title}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-center space-x-4">
                    <Button
                      variant="outline"
                      onClick={goToPreviousStep}
                      disabled={isGeneratingImages}
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Back to Review
                    </Button>
                    {!isGeneratingImages ? (
                      <Button 
                        onClick={generateColoringImages}
                        className="px-8"
                      >
                        Start Generation
                        <Wand2 className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <Button disabled className="px-8">
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Generating Images...
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* STEP 6: Preview & Export */}
          {currentStep === 'preview-export' && (
            <Card className="relative overflow-hidden border border-primary/20 bg-background/40 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
              <div className="relative p-8 space-y-6">
                <h2 className="text-2xl font-bold mb-6 text-center">Preview & Export</h2>
                
                <div className="max-w-6xl mx-auto space-y-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium text-green-600 mb-2">Coloring Book Complete!</h3>
                    <p className="text-muted-foreground">
                      Your {scenes.length}-page coloring book "{bookOptions.bookTitle}" is ready for download.
                    </p>
                  </div>

                  {/* Book Information Summary */}
                  <div className="bg-background/50 border border-primary/20 rounded-lg p-6">
                    <h4 className="font-medium mb-4">Book Details</h4>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Title:</span> {bookOptions.bookTitle}
                      </div>
                      <div>
                        <span className="font-medium">Author:</span> {bookOptions.authorName}
                      </div>
                      <div>
                        <span className="font-medium">Pages:</span> {scenes.length} coloring pages
                      </div>
                      <div>
                        <span className="font-medium">Size:</span> {KDP_BOOK_SIZES.find(size => size.value === bookOptions.bookSize)?.label}
                      </div>
                      <div>
                        <span className="font-medium">AI Model:</span> {AI_MODELS.find(m => m.id === bookOptions.aiModel)?.name}
                      </div>
                      <div>
                        <span className="font-medium">Complexity:</span> {COMPLEXITY_LEVELS.find(c => c.value === bookOptions.complexity)?.label}
                      </div>
                      <div>
                        <span className="font-medium">DPI:</span> {bookOptions.dpi}
                      </div>
                      <div>
                        <span className="font-medium">Bleed:</span> {bookOptions.includeBleed ? 'Yes' : 'No'}
                      </div>
                      <div>
                        <span className="font-medium">Page Numbers:</span> {bookOptions.showPageNumbers ? 'Yes' : 'No'}
                      </div>
                      <div>
                        <span className="font-medium">Title Page:</span> {bookOptions.addTitlePage ? 'Yes' : 'No'}
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-medium">Story:</span> {storyInput.substring(0, 100)}{storyInput.length > 100 ? '...' : ''}
                      </div>
                    </div>
                  </div>

                  {/* Image Gallery */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Coloring Pages Preview</h4>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActivePreviewIndex(Math.max(0, activePreviewIndex - 1))}
                          disabled={activePreviewIndex === 0}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="px-3 py-1 text-sm bg-muted rounded">
                          {activePreviewIndex + 1} of {scenes.length}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActivePreviewIndex(Math.min(scenes.length - 1, activePreviewIndex + 1))}
                          disabled={activePreviewIndex === scenes.length - 1}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Main Preview */}
                    <div className="bg-background border border-primary/20 rounded-lg p-4">
                      <div className="aspect-[3/4] max-w-md mx-auto bg-white rounded-lg overflow-hidden shadow-lg">
                        {scenes[activePreviewIndex]?.imageUrl ? (
                          <img 
                            src={scenes[activePreviewIndex].imageUrl} 
                            alt={scenes[activePreviewIndex].title}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <ImageIcon className="w-16 h-16" />
                          </div>
                        )}
                      </div>
                      <div className="text-center mt-4">
                        <h5 className="font-medium">{scenes[activePreviewIndex]?.title}</h5>
                        <p className="text-sm text-muted-foreground mt-1">
                          {scenes[activePreviewIndex]?.description}
                        </p>
                      </div>
                    </div>

                    {/* Thumbnail Grid */}
                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                      {scenes.map((scene, index) => (
                        <button
                          key={scene.id}
                          onClick={() => setActivePreviewIndex(index)}
                          className={`aspect-square bg-muted rounded-lg overflow-hidden border-2 transition-colors ${
                            activePreviewIndex === index ? 'border-primary' : 'border-transparent hover:border-primary/50'
                          }`}
                        >
                          {scene.imageUrl ? (
                            <img 
                              src={scene.imageUrl} 
                              alt={scene.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Export Options */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Download Options</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <File className="w-6 h-6 text-primary" />
                          <div>
                            <h5 className="font-medium">PDF Coloring Book</h5>
                            <p className="text-sm text-muted-foreground">
                              Complete book ready for printing
                            </p>
                          </div>
                        </div>
                        <Button 
                          onClick={createPDF} 
                          disabled={isCreatingPdf}
                          className="w-full"
                        >
                          {isCreatingPdf ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Creating PDF...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4 mr-2" />
                              Download PDF
                            </>
                          )}
                        </Button>
                      </Card>

                      <Card className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <ImageIcon className="w-6 h-6 text-primary" />
                          <div>
                            <h5 className="font-medium">Individual Images</h5>
                            <p className="text-sm text-muted-foreground">
                              ZIP file with all coloring pages
                            </p>
                          </div>
                        </div>
                        <Button 
                          onClick={downloadImages} 
                          variant="outline"
                          className="w-full"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download ZIP
                        </Button>
                      </Card>
                    </div>
                  </div>

                  <div className="flex justify-center space-x-4 pt-6 border-t border-primary/20">
                    <Button
                      variant="outline"
                      onClick={goToPreviousStep}
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Back to Generation
                    </Button>
                    <Button
                      onClick={() => window.location.reload()}
                      className="px-8"
                    >
                      Create New Book
                      <PlusSquare className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}; 