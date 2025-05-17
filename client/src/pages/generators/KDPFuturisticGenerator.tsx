import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { TabsList, TabsTrigger, Tabs, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Download,
  Sparkles,
  Ruler,
  FileText,
  ImageIcon,
  Upload,
  X,
  PlusCircle,
  Loader2,
  ChevronRight,
  Info,
  Check,
  UploadCloud,
  LucideBook,
  Palette,
  Layout,
  Undo,
  RotateCw,
  Lightbulb,
  AlertCircle,
  ArrowLeft,
  Wand2,
  BookOpenCheck,
  PenSquare,
  AlignLeft,
  Edit3,
  Settings,
  Type,
  Image,
  FileImage,
  LayoutGrid,
  Download as DownloadIcon,
  ChevronLeft,
  Eye,
} from "lucide-react";
import { cn, normalizeUrl } from "@/lib/utils";
import { toast } from "sonner";
import {
  calculateCoverDimensions,
  generateFrontCover,
  assembleFullCover,
  downloadCover,
  enhanceBookCover,
  checkEnhancementStatus,
} from "@/lib/bookCoverApi";

// API URL configuration
const API_URL = "https://puzzlemakeribral-production.up.railway.app";

// Types
interface BookSettings {
  trimSize: string;
  pageCount: number;
  hasBleed: boolean;
  hasISBN: boolean;
  paperType: string;
  dimensions: {
    width: number;
    height: number;
    spine: number;
    totalWidthInches: string;
    totalHeightInches: string;
    spineWidthInches: string;
    trimWidthInches: number;
    trimHeightInches: number;
    dpi: number;
  };
}

interface CoverState {
  frontPrompt: string;
  backPrompt: string;
  frontCoverImage: string | null;
  backCoverImage: string | null;
  spineText: string;
  spineColor: string;
  spineFont: string;
  interiorImages: string[];
  fullWrapImage: string | null;
  extractedColors: string[];
  currentStep: number;
}

// Trim size options
const TRIM_SIZES = [
  { value: "5x8", label: "5″ × 8″" },
  { value: "5.25x8", label: "5.25″ × 8″" },
  { value: "6x9", label: "6″ × 9″" },
  { value: "7x10", label: "7″ × 10″" },
  { value: "8x10", label: "8″ × 10″" },
  { value: "8.5x11", label: "8.5″ × 11″" },
];

// Font options for spine
const SPINE_FONTS = [
  { value: "helvetica", label: "Helvetica" },
  { value: "times", label: "Times New Roman" },
  { value: "garamond", label: "Garamond" },
  { value: "futura", label: "Futura" },
];

// Import step components
import BookSettingsStep from "./components/BookSettingsStep";
import FrontCoverStep from "./components/FrontCoverStep";
import BackCoverStep from "./components/BackCoverStep";
import SpineDesignStep from "./components/SpineDesignStep";
import InteriorImagesStep from "./components/InteriorImagesStep";
import FinalPreviewStep from "./components/FinalPreviewStep";
import PreviewPanel from "./components/PreviewPanel";

// Define step interface
interface Step {
  id: string;
  title: string;
  icon: React.ReactNode;
  component: React.FC<any>;
}

const STEPS: Step[] = [
  {
    id: "book-settings",
    title: "Book Settings",
    icon: <Settings className="w-4 h-4" />,
    component: BookSettingsStep,
  },
  {
    id: "front-cover",
    title: "Front Cover",
    icon: <Image className="w-4 h-4" />,
    component: FrontCoverStep,
  },
  {
    id: "back-cover",
    title: "Back Cover",
    icon: <BookOpen className="w-4 h-4" />,
    component: BackCoverStep,
  },
  {
    id: "spine-design",
    title: "Spine Design",
    icon: <Type className="w-4 h-4" />,
    component: SpineDesignStep,
  },
  {
    id: "interior-images",
    title: "Interior Images",
    icon: <ImageIcon className="w-4 h-4" />,
    component: InteriorImagesStep,
  },
  {
    id: "final-preview",
    title: "Final Preview",
    icon: <Eye className="w-4 h-4" />,
    component: FinalPreviewStep,
  },
];

const KDPFuturisticGenerator = () => {
  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [showSafeZones, setShowSafeZones] = useState(true);
  const [coverState, setCoverState] = useState<CoverState>({
    frontPrompt: "",
    backPrompt: "",
    frontCoverImage: null,
    backCoverImage: null,
    spineText: "",
    spineColor: "#6366F1",
    spineFont: "helvetica",
    interiorImages: [],
    fullWrapImage: null,
    extractedColors: [],
    currentStep: 1,
  });
  const [bookSettings, setBookSettings] = useState<BookSettings>({
    trimSize: "6x9",
    pageCount: 100,
    hasBleed: true,
    hasISBN: false,
    paperType: "white",
    dimensions: {
      width: 0,
      height: 0,
      spine: 0,
      totalWidthInches: "0",
      totalHeightInches: "0",
      spineWidthInches: "0",
      trimWidthInches: 6,
      trimHeightInches: 9,
      dpi: 300,
    },
  });

  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({
    dimensions: false,
    frontCover: false,
    backCover: false,
    enhance: false,
    assemble: false,
  });

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Effects
  useEffect(() => {
    handleCalculateDimensions();
  }, [bookSettings.trimSize, bookSettings.pageCount, bookSettings.hasBleed]);

  // Handlers
  const handleCalculateDimensions = async () => {
    try {
      setIsLoading((prev) => ({ ...prev, dimensions: true }));
      const response = await calculateCoverDimensions({
        trimSize: bookSettings.trimSize,
        pageCount: bookSettings.pageCount,
        paperColor: bookSettings.paperType,
        includeBleed: bookSettings.hasBleed,
      });

      if (response && response.dimensions) {
        setBookSettings((prev) => ({
          ...prev,
          dimensions: {
            ...prev.dimensions,
            ...response.dimensions,
          },
        }));
      }
    } catch (error) {
      console.error("Error calculating dimensions:", error);
      toast.error("Failed to calculate cover dimensions");
    } finally {
      setIsLoading((prev) => ({ ...prev, dimensions: false }));
    }
  };

  // Navigation handlers
  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (index: number) => {
    setCurrentStep(index);
  };

  // Calculate progress
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  // Get current step component
  const CurrentStepComponent = STEPS[currentStep].component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent">
            KDP Full Wrap Cover Generator
          </h1>
          <p className="text-gray-400">
            Create professional book covers for Amazon KDP with AI-powered design tools
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-400">
            <span>Step {currentStep + 1} of {STEPS.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Steps */}
          <div className="space-y-6">
            {/* Step Navigation */}
            <div className="flex gap-2">
              <Button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                variant="outline"
                size="sm"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button
                onClick={handleNext}
                disabled={currentStep === STEPS.length - 1}
                className="bg-violet-600 hover:bg-violet-700"
                size="sm"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Step Tabs */}
            <Tabs value={STEPS[currentStep].id} className="w-full">
              <TabsList className="grid grid-cols-3 lg:grid-cols-6">
                {STEPS.map((step, index) => (
                  <TabsTrigger
                    key={step.id}
                    value={step.id}
                    onClick={() => handleStepClick(index)}
                    disabled={index > currentStep + 1}
                    className="data-[state=active]:bg-violet-600"
                  >
                    {step.icon}
                    <span className="hidden lg:inline ml-2">{step.title}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Current Step Content */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CurrentStepComponent
                coverState={coverState}
                setCoverState={setCoverState}
                bookSettings={bookSettings}
                setBookSettings={setBookSettings}
                showSafeZones={showSafeZones}
                setShowSafeZones={setShowSafeZones}
              />
            </Card>
          </div>

          {/* Right Panel - Preview */}
          <div className="lg:sticky lg:top-6 space-y-6">
            <PreviewPanel
              coverState={coverState}
              bookSettings={bookSettings}
              showSafeZones={showSafeZones}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to get step icon
const getStepIcon = (step: number) => {
  switch (step) {
    case 1:
      return <Settings className="w-6 h-6" />;
    case 2:
      return <ImageIcon className="w-6 h-6" />;
    case 3:
      return <FileText className="w-6 h-6" />;
    case 4:
      return <Type className="w-6 h-6" />;
    case 5:
      return <ImageIcon className="w-6 h-6" />;
    case 6:
      return <LayoutGrid className="w-6 h-6" />;
    default:
      return null;
  }
};

// Helper function to get step title
const getStepTitle = (step: number) => {
  switch (step) {
    case 1:
      return "Book Settings";
    case 2:
      return "Front Cover Creation";
    case 3:
      return "Back Cover Generation";
    case 4:
      return "Spine Design";
    case 5:
      return "Interior Images";
    case 6:
      return "Final Preview";
    default:
      return "";
  }
};

export default KDPFuturisticGenerator; 