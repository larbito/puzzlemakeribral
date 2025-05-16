import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
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
} from "lucide-react";
import { TabsList, TabsTrigger, Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  calculateCoverDimensions,
  generateFrontCover,
  assembleFullCover,
  downloadCover,
} from "@/lib/bookCoverApi";

// Type for cover state
interface CoverState {
  prompt: string;
  enhancedPrompt: string;
  frontCoverImage: string | null;
  backCoverImage: string | null;
  fullWrapImage: string | null;
  interiorPages: string[];
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
  bookDetails: {
    trimSize: string;
    paperType: string;
    pageCount: number;
    hasBleed: boolean;
    spineText: string;
    spineColor: string;
  };
  promptHistory: string[];
}

// Step type
type GenerationStep =
  | "prompt"
  | "details"
  | "generate"
  | "enhance"
  | "assemble";

// KDP Full Wrap Book Cover Generator component
const KDPFullWrapGenerator = () => {
  // Main state object for cover generation
  const [coverState, setCoverState] = useState<CoverState>({
    prompt: "",
    enhancedPrompt: "",
    frontCoverImage: null,
    backCoverImage: null,
    fullWrapImage: null,
    interiorPages: [],
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
    bookDetails: {
      trimSize: "6x9",
      paperType: "white",
      pageCount: 300,
      hasBleed: true,
      spineText: "",
      spineColor: "",
    },
    promptHistory: [],
  });

  // UI state
  const [activeStep, setActiveStep] = useState<GenerationStep>("prompt");
  const [sourceTab, setSourceTab] = useState<"text" | "image">("text");
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({
    enhancePrompt: false,
    extractPrompt: false,
    generateFront: false,
    generateBack: false,
    enhanceImage: false,
    assembleWrap: false,
  });
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [dominantColors, setDominantColors] = useState<string[]>([]);

  // Trim Size options
  const trimSizeOptions = [
    { value: "5x8", label: "5″ × 8″" },
    { value: "5.25x8", label: "5.25″ × 8″" },
    { value: "6x9", label: "6″ × 9″" },
    { value: "7x10", label: "7″ × 10″" },
    { value: "8x10", label: "8″ × 10″" },
    { value: "8.5x11", label: "8.5″ × 11″" },
  ];

  // Paper type options
  const paperTypeOptions = [
    { value: "white", label: "White" },
    { value: "cream", label: "Cream" },
    { value: "color", label: "Color" },
  ];

  // API URL
  const API_URL = "https://puzzlemakeribral-production.up.railway.app";

  // Call API to calculate dimensions on initial load
  useEffect(() => {
    handleCalculateDimensions();
  }, []);

  // Calculate spine width based on page count and paper type
  const calculateSpineWidth = (pages: number, paper: string): number => {
    // For white paper: pages * 0.002252" (KDP's formula)
    // For cream paper: pages * 0.0025" (KDP's formula)
    // For color paper: pages * 0.002347" (approximate)
    const multiplier =
      paper === "cream" ? 0.0025 : paper === "color" ? 0.002347 : 0.002252;
    return pages * multiplier;
  };

  // Function to call the backend API for dimension calculation
  const handleCalculateDimensions = async () => {
    try {
      setError("");

      const response = await calculateCoverDimensions({
        trimSize: coverState.bookDetails.trimSize,
        pageCount: coverState.bookDetails.pageCount,
        paperColor: coverState.bookDetails.paperType,
        includeBleed: coverState.bookDetails.hasBleed,
      });

      // Update the state with the calculated dimensions from the API
      if (response && response.dimensions) {
        setCoverState((prevState) => ({
          ...prevState,
          dimensions: {
            ...prevState.dimensions,
            // Update with values from API
            width: response.dimensions.fullCover.widthPx,
            height: response.dimensions.fullCover.heightPx,
            spine: response.dimensions.spine.widthPx,
            totalWidthInches: response.dimensions.fullCover.width.toFixed(2),
            totalHeightInches: response.dimensions.fullCover.height.toFixed(2),
            spineWidthInches: response.dimensions.spine.width.toFixed(3),
          },
        }));
      }
    } catch (error) {
      console.error("Error calculating dimensions:", error);
      // Don't show error toast on every dimension calculation
    }
  };

  // Calculate final dimensions with bleed
  const localCoverDimensions = useMemo(() => {
    // Parse trim size
    const [widthInches, heightInches] = coverState.bookDetails.trimSize
      .split("x")
      .map(Number);

    // Add bleed (0.125" on all sides if bleed is enabled)
    const bleedInches = coverState.bookDetails.hasBleed ? 0.125 : 0;
    const spineWidthInches = calculateSpineWidth(
      coverState.bookDetails.pageCount,
      coverState.bookDetails.paperType,
    );

    // Calculate total width: front + spine + back + bleed
    const totalWidthInches =
      widthInches * 2 + spineWidthInches + bleedInches * 2;
    const totalHeightInches = heightInches + bleedInches * 2;

    // Convert to pixels at 300 DPI
    const dpi = 300;
    const widthPixels = Math.round(totalWidthInches * dpi);
    const heightPixels = Math.round(totalHeightInches * dpi);

    const dimensions = {
      width: widthPixels,
      height: heightPixels,
      spine: Math.round(spineWidthInches * dpi),
      totalWidthInches: totalWidthInches.toFixed(2),
      totalHeightInches: totalHeightInches.toFixed(2),
      spineWidthInches: spineWidthInches.toFixed(3),
      dpi,
      trimWidthInches: widthInches,
      trimHeightInches: heightInches,
    };

    // Update cover state dimensions
    setCoverState((prevState) => ({
      ...prevState,
      dimensions: dimensions,
    }));

    return dimensions;
  }, [
    coverState.bookDetails.trimSize,
    coverState.bookDetails.pageCount,
    coverState.bookDetails.paperType,
    coverState.bookDetails.hasBleed,
  ]);

  // Save prompt to history
  const saveToHistory = (prompt: string) => {
    if (!prompt || prompt.trim() === "") return;

    setCoverState((prevState) => {
      // Don't add duplicates
      if (prevState.promptHistory.includes(prompt)) {
        return prevState;
      }

      // Add to beginning of array, limit to 10 items
      const newHistory = [prompt, ...prevState.promptHistory.slice(0, 9)];
      return {
        ...prevState,
        promptHistory: newHistory,
      };
    });
  };

  // Function to update specific loading state
  const setLoadingState = (key: string, value: boolean) => {
    setIsLoading((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Function to update cover state
  const updateCoverState = (updates: Partial<CoverState>) => {
    setCoverState((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  // Update book details
  const updateBookDetails = (updates: Partial<CoverState["bookDetails"]>) => {
    setCoverState((prev) => ({
      ...prev,
      bookDetails: {
        ...prev.bookDetails,
        ...updates,
      },
    }));

    // Calculate dimensions after a short delay to allow state to update
    setTimeout(() => {
      handleCalculateDimensions();
    }, 300);
  };

  // Handle prompt input change
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateCoverState({ prompt: e.target.value });
  };

  // Handle spine text change
  const handleSpineTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateBookDetails({ spineText: e.target.value });
  };

  // Handle page count change from slider
  const handlePageCountChange = (value: number[]) => {
    updateBookDetails({ pageCount: value[0] });
  };

  // Handle page count input change
  const handlePageCountInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      if (value < 24) {
        updateBookDetails({ pageCount: 24 });
      } else if (value > 999) {
        updateBookDetails({ pageCount: 999 });
      } else {
        updateBookDetails({ pageCount: value });
      }
    }
  };

  // Handle spine color selection
  const handleSpineColorSelect = (color: string) => {
    updateBookDetails({ spineColor: color });
  };

  // Handle image for extraction upload
  const handleExtractorImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setUploadedImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle interior image upload
  const handleInteriorImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (
          typeof reader.result === "string" &&
          coverState.interiorPages.length < 3
        ) {
          updateCoverState({
            interiorPages: [...coverState.interiorPages, reader.result],
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle interior image removal
  const handleRemoveInteriorImage = (index: number) => {
    const newImages = [...coverState.interiorPages];
    newImages.splice(index, 1);
    updateCoverState({ interiorPages: newImages });
  };

  // Enhance prompt with OpenAI
  const handleEnhancePrompt = async () => {
    if (coverState.prompt.trim().length < 5) {
      setError("Please enter a longer prompt (at least 5 characters)");
      return;
    }

    try {
      setLoadingState("enhancePrompt", true);
      setError("");

      const response = await fetch(`${API_URL}/api/openai/enhance-prompt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: coverState.prompt,
          context:
            "Create a detailed book cover design prompt. Enhance with visual details, style references, mood, colors, and composition. Focus on professional book cover design elements.",
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      if (data.enhancedPrompt) {
        updateCoverState({
          enhancedPrompt: data.enhancedPrompt,
        });

        // Also update the main prompt
        updateCoverState({
          prompt: data.enhancedPrompt,
        });

        toast.success("Prompt enhanced successfully");
        saveToHistory(data.enhancedPrompt);
      } else {
        setError("No enhanced prompt returned");
      }
    } catch (err: any) {
      console.error("Error enhancing prompt:", err);
      setError(err.message || "Failed to enhance prompt");
      toast.error("Failed to enhance prompt");
    } finally {
      setLoadingState("enhancePrompt", false);
    }
  };

  // Extract prompt from image
  const handleExtractPrompt = async () => {
    if (!uploadedImage) {
      setError("Please upload an image first");
      return;
    }

    try {
      setLoadingState("extractPrompt", true);
      setError("");

      const response = await fetch(`${API_URL}/api/openai/extract-prompt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: uploadedImage,
          context:
            "Describe this book cover image in detail for generating a similar style. Focus on visual elements, style, colors, composition, and mood.",
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      if (data.extractedPrompt) {
        updateCoverState({
          prompt: data.extractedPrompt,
          enhancedPrompt: data.extractedPrompt,
        });

        toast.success("Prompt extracted successfully");
        saveToHistory(data.extractedPrompt);
        setActiveStep("details");
      } else {
        setError("No extracted prompt returned");
      }
    } catch (err: any) {
      console.error("Error extracting prompt:", err);
      setError(err.message || "Failed to extract prompt");
      toast.error("Failed to extract prompt from image");
    } finally {
      setLoadingState("extractPrompt", false);
    }
  };

  // Generate front cover
  const handleGenerateFrontCover = async () => {
    if (!coverState.prompt.trim()) {
      setError("Please enter a prompt for your book cover");
      return;
    }

    try {
      setLoadingState("generateFront", true);
      setError("");

      // Calculate front cover dimensions (2:3 ratio)
      const frontCoverWidth = Math.round(
        coverState.dimensions.trimWidthInches * coverState.dimensions.dpi,
      );
      const frontCoverHeight = Math.round(
        coverState.dimensions.trimHeightInches * coverState.dimensions.dpi,
      );

      // The expanded prompt combines the original prompt with details about the book
      const expandedPrompt = `Book cover design: ${coverState.prompt}. High quality, 300 DPI professional book cover art.`;

      // Call the API to generate the front cover
      const result = await generateFrontCover({
        prompt: expandedPrompt,
        width: frontCoverWidth,
        height: frontCoverHeight,
        negative_prompt:
          "text, words, letters, watermark, low quality, distorted",
      });

      // Update the state with the generated image URL
      if (result && result.url) {
        setCoverState((prevState) => ({
          ...prevState,
          frontCoverImage: result.url,
          // If we already have a prompt history, add this one
          promptHistory: [...prevState.promptHistory, prevState.prompt],
        }));
        toast.success("Front cover generated successfully");
      } else {
        throw new Error("No image URL returned from the API");
      }
    } catch (error) {
      console.error("Error generating front cover:", error);
      setError("Failed to generate front cover. Please try again.");
      toast.error("Error generating front cover");
    } finally {
      setLoadingState("generateFront", false);
    }
  };

  // Extract colors from image
  const extractColorsFromImage = async (imageUrl: string) => {
    try {
      const colorsResponse = await fetch(
        `${API_URL}/api/book-cover/extract-colors`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ imageUrl }),
        },
      );

      if (colorsResponse.ok) {
        const colorsData = await colorsResponse.json();
        setDominantColors(colorsData.colors || []);
        if (colorsData.colors && colorsData.colors.length > 0) {
          updateBookDetails({ spineColor: colorsData.colors[0] });
        }
      }
    } catch (error) {
      console.error("Error extracting colors:", error);
    }
  };

  // Generate back cover
  const handleGenerateBackCover = async () => {
    if (!coverState.frontCoverImage || !coverState.prompt) {
      setError("Front cover and prompt are required");
      return;
    }

    try {
      setLoadingState("generateBack", true);
      setError("");

      // First, generate a simplified variant of the prompt for back cover
      const backPromptResponse = await fetch(
        `${API_URL}/api/openai/generate-back-prompt`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            frontPrompt: coverState.prompt,
            context:
              "Create a simplified, matching back cover design prompt based on this front cover prompt. Keep the same color scheme and visual style, but make it cleaner and simpler for text overlay.",
          }),
        },
      );

      if (!backPromptResponse.ok) {
        throw new Error(`API Error: ${backPromptResponse.status}`);
      }

      const backPromptData = await backPromptResponse.json();

      if (!backPromptData.backPrompt) {
        throw new Error("No back cover prompt generated");
      }

      // Now generate the back cover with Ideogram
      const formData = new FormData();
      formData.append(
        "prompt",
        `Book back cover design: ${backPromptData.backPrompt}. Simple, clean background for text. High resolution 300 DPI.`,
      );
      formData.append(
        "width",
        (coverState.dimensions.trimWidthInches * 300).toString(),
      );
      formData.append(
        "height",
        (coverState.dimensions.trimHeightInches * 300).toString(),
      );
      formData.append(
        "negative_prompt",
        "text, words, letters, watermark, low quality, distorted",
      );

      const response = await fetch(`${API_URL}/api/ideogram/generate`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.url && !data.image_url) {
        throw new Error("No back cover image URL in response");
      }

      setCoverState((prevState) => ({
        ...prevState,
        backCoverImage: data.url || data.image_url,
      }));

      toast.success("Back cover generated successfully");
    } catch (error) {
      console.error("Error generating back cover:", error);
      setError("Failed to generate back cover");
      toast.error("Error generating back cover");
    } finally {
      setLoadingState("generateBack", false);
    }
  };

  // Enhance image with Replicate
  const handleEnhanceImage = async (target: "front" | "back") => {
    const imageUrl =
      target === "front"
        ? coverState.frontCoverImage
        : coverState.backCoverImage;

    if (!imageUrl) {
      setError(`No ${target} cover image to enhance`);
      return;
    }

    try {
      setLoadingState("enhanceImage", true);
      setError("");

      const response = await fetch(`${API_URL}/api/replicate/enhance-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      if (data.enhancedUrl) {
        // Update the appropriate image
        if (target === "front") {
          updateCoverState({ frontCoverImage: data.enhancedUrl });
        } else {
          updateCoverState({ backCoverImage: data.enhancedUrl });
        }

        toast.success(
          `${target === "front" ? "Front" : "Back"} cover enhanced successfully`,
        );
        setActiveStep("enhance");
      } else {
        setError("No enhanced image URL returned");
      }
    } catch (err: any) {
      console.error("Error enhancing image:", err);
      setError(err.message || "Failed to enhance image");
      toast.error("Failed to enhance image");
    } finally {
      setLoadingState("enhanceImage", false);
    }
  };

  // Generate full wrap cover
  const handleAssembleFullCover = async () => {
    if (!coverState.frontCoverImage || !coverState.backCoverImage) {
      setError("Both front and back covers are required");
      return;
    }

    try {
      setLoadingState("assembleWrap", true);
      setError("");

      // Call the assembleFullCover API function
      const result = await assembleFullCover({
        frontCoverUrl: coverState.frontCoverImage,
        dimensions: {
          width: coverState.dimensions.width,
          height: coverState.dimensions.height,
          spine: coverState.dimensions.spine,
          dpi: coverState.dimensions.dpi,
        },
        spineText: coverState.bookDetails.spineText,
        spineColor: coverState.bookDetails.spineColor,
      });

      if (result && result.url) {
        setCoverState((prevState) => ({
          ...prevState,
          fullWrapImage: result.url,
        }));
        toast.success("Full wrap cover assembled successfully");

        // Automatically move to the next step
        setActiveStep("assemble");
      } else {
        throw new Error("No image URL returned from the API");
      }
    } catch (error) {
      console.error("Error assembling full cover:", error);
      setError("Failed to assemble full cover. Please try again.");
      toast.error("Error assembling full cover");
    } finally {
      setLoadingState("assembleWrap", false);
    }
  };

  // Handle downloading the full wrap cover
  const handleDownloadFullCover = () => {
    if (!coverState.fullWrapImage) {
      setError("No full wrap cover to download");
      return;
    }

    try {
      downloadCover({
        url: coverState.fullWrapImage,
        format: "pdf",
        filename: "kdp-full-wrap-cover",
        width: coverState.dimensions.width,
        height: coverState.dimensions.height,
      });

      toast.success("Full wrap cover downloaded successfully");
    } catch (error) {
      console.error("Error downloading cover:", error);
      setError("Failed to download cover");
      toast.error("Error downloading cover");
    }
  };

  // Handle using a prompt from history
  const handleUseHistoryPrompt = (prompt: string) => {
    updateCoverState({ prompt });
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="h-12 w-12 rounded-full bg-black text-emerald-400 flex items-center justify-center mr-3 border border-emerald-500/30">
            <BookOpen className="h-6 w-6" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(16,185,129,0.35)]">
            Amazon KDP Full Wrap Cover Generator
          </h1>
        </div>
        <p className="text-zinc-400 max-w-2xl mx-auto">
          Generate professional full wrap book covers (front, spine, back)
          optimized for Kindle Direct Publishing
        </p>
      </div>

      {/* Steps Tracker */}
      <div className="bg-black/80 backdrop-blur-sm rounded-2xl border border-zinc-700/50 p-4 mb-8 shadow-lg">
        <div className="flex items-center justify-between">
          <div
            className={`flex flex-col items-center ${activeStep === "prompt" ? "text-emerald-500 font-medium" : "text-zinc-500"}`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 
              ${activeStep === "prompt" ? "bg-emerald-500/20 border-2 border-emerald-500" : "bg-zinc-800 border border-zinc-700"}`}
            >
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-sm text-center">Prompt</span>
          </div>

          <div
            className={`h-0.5 flex-1 mx-2 ${activeStep === "prompt" ? "bg-zinc-800" : "bg-gradient-to-r from-emerald-500 to-teal-500"}`}
          ></div>

          <div
            className={`flex flex-col items-center ${activeStep === "details" ? "text-teal-500 font-medium" : "text-zinc-500"}`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 
              ${activeStep === "details" ? "bg-teal-500/20 border-2 border-teal-500" : "bg-zinc-800 border border-zinc-700"}`}
            >
              <Ruler className="h-5 w-5" />
            </div>
            <span className="text-sm text-center">Book Details</span>
          </div>

          <div
            className={`h-0.5 flex-1 mx-2 ${activeStep === "prompt" || activeStep === "details" ? "bg-zinc-800" : "bg-gradient-to-r from-teal-500 to-teal-500"}`}
          ></div>

          <div
            className={`flex flex-col items-center ${activeStep === "generate" ? "text-teal-500 font-medium" : "text-zinc-500"}`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 
              ${activeStep === "generate" ? "bg-teal-500/20 border-2 border-teal-500" : "bg-zinc-800 border border-zinc-700"}`}
            >
              <ImageIcon className="h-5 w-5" />
            </div>
            <span className="text-sm text-center">Generate</span>
          </div>

          <div
            className={`h-0.5 flex-1 mx-2 ${activeStep === "prompt" || activeStep === "details" || activeStep === "generate" ? "bg-zinc-800" : "bg-gradient-to-r from-teal-500 to-cyan-500"}`}
          ></div>

          <div
            className={`flex flex-col items-center ${activeStep === "enhance" ? "text-cyan-500 font-medium" : "text-zinc-500"}`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 
              ${activeStep === "enhance" ? "bg-cyan-500/20 border-2 border-cyan-500" : "bg-zinc-800 border border-zinc-700"}`}
            >
              <Palette className="h-5 w-5" />
            </div>
            <span className="text-sm text-center">Enhance</span>
          </div>

          <div
            className={`h-0.5 flex-1 mx-2 ${activeStep === "prompt" || activeStep === "details" || activeStep === "generate" || activeStep === "enhance" ? "bg-zinc-800" : "bg-gradient-to-r from-cyan-500 to-cyan-500"}`}
          ></div>

          <div
            className={`flex flex-col items-center ${activeStep === "assemble" ? "text-cyan-500 font-medium" : "text-zinc-500"}`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 
              ${activeStep === "assemble" ? "bg-cyan-500/20 border-2 border-cyan-500" : "bg-zinc-800 border border-zinc-700"}`}
            >
              <Download className="h-5 w-5" />
            </div>
            <span className="text-sm text-center">Download</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Controls */}
        <div className="lg:col-span-2">
          <Card className="bg-black/80 backdrop-blur-sm border border-zinc-700/50 overflow-hidden shadow-lg">
            <CardHeader className="border-b border-zinc-700/50 bg-black">
              <CardTitle className="flex items-center text-zinc-100">
                {activeStep === "prompt" && (
                  <>
                    <Sparkles className="mr-2 h-5 w-5 text-emerald-400" />
                    <span>Step 1: Create Your Cover Prompt</span>
                  </>
                )}

                {activeStep === "details" && (
                  <>
                    <Ruler className="mr-2 h-5 w-5 text-teal-400" />
                    <span>Step 2: Specify Book Details</span>
                  </>
                )}

                {activeStep === "generate" && (
                  <>
                    <ImageIcon className="mr-2 h-5 w-5 text-teal-400" />
                    <span>Step 3: Generate Covers</span>
                  </>
                )}

                {activeStep === "enhance" && (
                  <>
                    <Palette className="mr-2 h-5 w-5 text-cyan-400" />
                    <span>Step 4: Enhance & Add Interior Pages</span>
                  </>
                )}

                {activeStep === "assemble" && (
                  <>
                    <Download className="mr-2 h-5 w-5 text-cyan-400" />
                    <span>Step 5: Download Full Wrap Cover</span>
                  </>
                )}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6">
              {/* Step 1: Prompt Section */}
              {activeStep === "prompt" && (
                <div className="space-y-6">
                  <Tabs
                    defaultValue={sourceTab}
                    onValueChange={(value) =>
                      setSourceTab(value as "text" | "image")
                    }
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger
                        value="text"
                        className="flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        Cover Idea to Prompt
                      </TabsTrigger>
                      <TabsTrigger
                        value="image"
                        className="flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Image to Prompt
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="text" className="space-y-6">
                      <div className="space-y-3">
                        <label
                          htmlFor="prompt"
                          className="text-sm font-medium text-zinc-300"
                        >
                          Describe your book cover
                        </label>
                        <div className="relative">
                          <Textarea
                            id="prompt"
                            value={coverState.prompt}
                            onChange={handlePromptChange}
                            className="w-full min-h-[150px] rounded-lg border border-zinc-700 bg-black/50 p-4 text-zinc-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors resize-y placeholder:text-zinc-600"
                            placeholder="Describe your ideal book cover in detail. Include style, mood, main elements, colors, etc."
                          />
                          <div className="absolute bottom-3 right-3 rounded-full bg-zinc-800 px-2 py-1 text-xs text-zinc-400">
                            {coverState.prompt.length} chars
                          </div>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-500">
                            Min 5 characters
                          </span>
                          <span
                            className={
                              coverState.prompt.length < 5
                                ? "text-red-400"
                                : "text-emerald-400"
                            }
                          >
                            {coverState.prompt.length < 5
                              ? "Add more details"
                              : "✓ Ready to generate"}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={handleEnhancePrompt}
                          disabled={
                            isLoading.enhancePrompt ||
                            coverState.prompt.trim().length < 5
                          }
                          className="flex-1 bg-zinc-800/70 text-zinc-300 hover:bg-emerald-500/20 hover:text-emerald-300 border-zinc-700 hover:border-emerald-600"
                        >
                          {isLoading.enhancePrompt ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Enhancing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-4 w-4" />
                              Enhance Prompt
                            </>
                          )}
                        </Button>

                        <Button
                          onClick={() => setActiveStep("details")}
                          disabled={coverState.prompt.trim().length < 5}
                          className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700"
                        >
                          Continue
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>

                      {/* Prompt History */}
                      {coverState.promptHistory.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-zinc-300 mb-2 flex items-center">
                            <RotateCw className="h-3.5 w-3.5 mr-1.5 text-zinc-500" />
                            Recent Prompts
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {coverState.promptHistory.map(
                              (historyPrompt, idx) => (
                                <button
                                  key={idx}
                                  onClick={() =>
                                    handleUseHistoryPrompt(historyPrompt)
                                  }
                                  className="text-xs px-2 py-1 rounded-md bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 border border-zinc-700/50 truncate max-w-[180px]"
                                >
                                  {historyPrompt.slice(0, 30)}
                                  {historyPrompt.length > 30 ? "..." : ""}
                                </button>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="image" className="space-y-6">
                      <div className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-700/50 rounded-lg p-8 bg-black/30">
                        {uploadedImage ? (
                          <div className="relative w-full max-w-xs">
                            <img
                              src={uploadedImage}
                              alt="Uploaded cover"
                              className="w-full h-auto rounded-lg shadow-md"
                            />
                            <button
                              onClick={() => setUploadedImage(null)}
                              className="absolute top-2 right-2 bg-red-500/80 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center cursor-pointer">
                            <UploadCloud className="h-12 w-12 text-zinc-600 mb-4" />
                            <span className="text-zinc-400 mb-2">
                              Upload book cover image
                            </span>
                            <span className="text-zinc-600 text-sm mb-4">
                              Click to browse or drop image
                            </span>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={handleExtractorImageUpload}
                            />
                            <Button
                              variant="outline"
                              className="bg-zinc-800/70 text-zinc-300 hover:bg-zinc-700 border-zinc-700"
                              size="sm"
                              onClick={(e) => {
                                const fileInput =
                                  document.querySelector<HTMLInputElement>(
                                    'input[type="file"]',
                                  );
                                if (fileInput) {
                                  fileInput.click();
                                }
                              }}
                            >
                              Select Image
                            </Button>
                          </label>
                        )}
                      </div>

                      <Button
                        onClick={handleExtractPrompt}
                        disabled={isLoading.extractPrompt || !uploadedImage}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700"
                      >
                        {isLoading.extractPrompt ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Extracting Prompt...
                          </>
                        ) : (
                          <>
                            <ImageIcon className="mr-2 h-4 w-4" />
                            Extract Prompt from Image
                          </>
                        )}
                      </Button>
                    </TabsContent>
                  </Tabs>
                </div>
              )}

              {/* Step 2: Book Details */}
              {activeStep === "details" && (
                <div className="space-y-6">
                  <div className="space-y-6 rounded-lg bg-zinc-900/50 p-4 border border-zinc-700/50">
                    <h3 className="font-medium flex items-center text-zinc-300">
                      <Ruler className="h-4 w-4 mr-2 text-teal-400" />
                      Book Specifications
                    </h3>

                    {/* Trim Size Selection */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-300">
                        Trim Size
                      </label>
                      <select
                        value={coverState.bookDetails.trimSize}
                        onChange={(e) =>
                          updateBookDetails({ trimSize: e.target.value })
                        }
                        className="w-full rounded-md border border-zinc-700 bg-black p-2 text-sm text-zinc-300 focus:border-teal-500 focus:outline-none"
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
                      <label className="text-sm font-medium text-zinc-300">
                        Paper Type
                      </label>
                      <div className="flex space-x-2">
                        {paperTypeOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() =>
                              updateBookDetails({ paperType: option.value })
                            }
                            className={`flex-1 px-3 py-2 rounded-md text-sm ${
                              coverState.bookDetails.paperType === option.value
                                ? "bg-teal-500 text-black font-medium"
                                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Page Count */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-300 flex items-center">
                        <FileText className="h-4 w-4 mr-1 text-teal-400" />
                        Page Count:{" "}
                        <span className="ml-2 text-teal-400 font-medium">
                          {coverState.bookDetails.pageCount} pages
                        </span>
                      </label>
                      <div className="flex items-center space-x-2">
                        <Slider
                          value={[coverState.bookDetails.pageCount]}
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
                          value={coverState.bookDetails.pageCount}
                          onChange={handlePageCountInput}
                          className="w-16 text-center bg-black border-zinc-700 text-zinc-300"
                        />
                      </div>
                      <p className="text-xs text-zinc-500">
                        Minimum: 24, Maximum: 999
                      </p>
                    </div>

                    {/* Bleed Option */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-300">
                        Bleed Setting
                      </label>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => updateBookDetails({ hasBleed: true })}
                          className={`flex-1 px-3 py-2 rounded-md text-sm ${
                            coverState.bookDetails.hasBleed
                              ? "bg-teal-500 text-black font-medium"
                              : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                          }`}
                        >
                          With Bleed (0.125")
                        </button>
                        <button
                          type="button"
                          onClick={() => updateBookDetails({ hasBleed: false })}
                          className={`flex-1 px-3 py-2 rounded-md text-sm ${
                            !coverState.bookDetails.hasBleed
                              ? "bg-teal-500 text-black font-medium"
                              : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                          }`}
                        >
                          No Bleed
                        </button>
                      </div>
                      <p className="text-xs text-zinc-500">
                        Most KDP books require bleed. Only choose "No Bleed" if
                        specifically instructed.
                      </p>
                    </div>

                    {/* Auto-Calculated Output Box */}
                    <div className="rounded-md bg-zinc-800/80 p-3 space-y-1">
                      <h4 className="text-sm font-medium text-teal-400">
                        Auto Size Preview
                      </h4>
                      <ul className="text-xs space-y-1 text-zinc-500">
                        <li className="flex justify-between">
                          <span>Final size with bleed:</span>
                          <span className="font-medium text-zinc-300">
                            {coverState.dimensions.totalWidthInches}" x{" "}
                            {coverState.dimensions.totalHeightInches}"
                          </span>
                        </li>
                        <li className="flex justify-between">
                          <span>Spine width:</span>
                          <span className="font-medium text-zinc-300">
                            {coverState.dimensions.spineWidthInches}"
                          </span>
                        </li>
                        <li className="flex justify-between">
                          <span>Resolution:</span>
                          <span className="font-medium text-zinc-300">
                            {coverState.dimensions.width} x{" "}
                            {coverState.dimensions.height} px
                          </span>
                        </li>
                        <li className="flex justify-between">
                          <span>DPI:</span>
                          <span className="font-medium text-zinc-300">300</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setActiveStep("prompt")}
                      className="flex-1 bg-zinc-800/70 text-zinc-300 hover:bg-zinc-700 border-zinc-700"
                    >
                      Back
                    </Button>

                    <Button
                      onClick={handleGenerateFrontCover}
                      className="flex-1 bg-gradient-to-r from-teal-600 to-teal-600 text-white hover:from-teal-700 hover:to-teal-700"
                    >
                      Generate Cover
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Generate Covers */}
              {activeStep === "generate" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Front Cover Preview */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-zinc-300 flex items-center">
                        <Sparkles className="h-4 w-4 mr-2 text-teal-400" />
                        Front Cover
                      </h3>
                      <div className="relative aspect-[2/3] bg-zinc-900/50 rounded-lg overflow-hidden border border-zinc-700/50">
                        {coverState.frontCoverImage ? (
                          <img
                            src={coverState.frontCoverImage}
                            alt="Front Cover"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-zinc-600" />
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => handleGenerateFrontCover()}
                        disabled={isLoading.generateFront}
                        className="w-full bg-zinc-800/70 text-zinc-300 hover:bg-teal-500/20 hover:text-teal-300 border-zinc-700 hover:border-teal-600"
                      >
                        <RotateCw className="mr-2 h-4 w-4" />
                        Regenerate Front
                      </Button>
                    </div>

                    {/* Back Cover Preview */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-zinc-300 flex items-center">
                        <Layout className="h-4 w-4 mr-2 text-teal-400" />
                        Back Cover
                      </h3>
                      <div className="relative aspect-[2/3] bg-zinc-900/50 rounded-lg overflow-hidden border border-zinc-700/50">
                        {coverState.backCoverImage ? (
                          <img
                            src={coverState.backCoverImage}
                            alt="Back Cover"
                            className="w-full h-full object-cover"
                          />
                        ) : isLoading.generateBack ? (
                          <div className="flex items-center justify-center h-full flex-col gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-zinc-600" />
                            <span className="text-zinc-500 text-sm">
                              Generating back cover...
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <span className="text-zinc-500 text-sm">
                              Back cover will be generated
                            </span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => handleGenerateBackCover()}
                        disabled={
                          !coverState.frontCoverImage || isLoading.generateBack
                        }
                        className="w-full bg-zinc-800/70 text-zinc-300 hover:bg-teal-500/20 hover:text-teal-300 border-zinc-700 hover:border-teal-600"
                      >
                        <RotateCw className="mr-2 h-4 w-4" />
                        Regenerate Back
                      </Button>
                    </div>
                  </div>

                  {/* Spine Settings */}
                  <div className="space-y-4 rounded-lg bg-zinc-900/50 p-4 border border-zinc-700/50">
                    <h3 className="font-medium flex items-center text-zinc-300">
                      <LucideBook className="h-4 w-4 mr-2 text-teal-400" />
                      Spine Settings
                    </h3>

                    {/* Spine Color Selection */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-300">
                        Spine Color
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {dominantColors.map((color, index) => (
                          <button
                            key={index}
                            onClick={() => handleSpineColorSelect(color)}
                            className={`w-8 h-8 rounded-full border-2 transition-transform ${
                              color === coverState.bookDetails.spineColor
                                ? "border-white shadow-lg scale-110"
                                : "border-transparent hover:scale-105"
                            }`}
                            style={{ backgroundColor: color }}
                            aria-label={`Color ${index + 1}`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-zinc-500">
                        These colors were extracted from your cover image
                      </p>
                    </div>

                    {/* Spine Text - only if page count >= 100 */}
                    {coverState.bookDetails.pageCount >= 100 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">
                          Spine Text (Optional)
                        </label>
                        <Input
                          type="text"
                          value={coverState.bookDetails.spineText}
                          onChange={handleSpineTextChange}
                          placeholder="Text to display on the spine"
                          className="w-full bg-black border-zinc-700 text-zinc-300"
                          maxLength={40}
                        />
                        <p className="text-xs text-zinc-500">
                          {coverState.bookDetails.spineText.length}/40
                          characters - For books with less than 100 pages, spine
                          text is not recommended.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setActiveStep("details")}
                      className="flex-1 bg-zinc-800/70 text-zinc-300 hover:bg-zinc-700 border-zinc-700"
                    >
                      Back
                    </Button>

                    <Button
                      onClick={() => setActiveStep("enhance")}
                      disabled={
                        !coverState.frontCoverImage ||
                        !coverState.backCoverImage
                      }
                      className="flex-1 bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-700 hover:to-cyan-700"
                    >
                      Continue to Enhance
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Enhance & Interior Pages */}
              {activeStep === "enhance" && (
                <div className="space-y-6">
                  {/* Enhance Covers Section */}
                  <div className="space-y-4 rounded-lg bg-zinc-900/50 p-4 border border-zinc-700/50">
                    <h3 className="font-medium flex items-center text-zinc-300">
                      <Palette className="h-4 w-4 mr-2 text-cyan-400" />
                      Enhance Cover Images
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-zinc-400">
                          Front Cover
                        </h4>
                        <div className="relative aspect-[2/3] bg-zinc-900/50 rounded-lg overflow-hidden border border-zinc-700/50">
                          {coverState.frontCoverImage && (
                            <img
                              src={coverState.frontCoverImage}
                              alt="Front Cover"
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => handleEnhanceImage("front")}
                          disabled={
                            isLoading.enhanceImage ||
                            !coverState.frontCoverImage
                          }
                          className="w-full bg-zinc-800/70 text-zinc-300 hover:bg-cyan-500/20 hover:text-cyan-300 border-zinc-700 hover:border-cyan-600"
                        >
                          {isLoading.enhanceImage ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Enhancing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-4 w-4" />
                              Enhance Front Cover
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-zinc-400">
                          Back Cover
                        </h4>
                        <div className="relative aspect-[2/3] bg-zinc-900/50 rounded-lg overflow-hidden border border-zinc-700/50">
                          {coverState.backCoverImage && (
                            <img
                              src={coverState.backCoverImage}
                              alt="Back Cover"
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => handleEnhanceImage("back")}
                          disabled={
                            isLoading.enhanceImage || !coverState.backCoverImage
                          }
                          className="w-full bg-zinc-800/70 text-zinc-300 hover:bg-cyan-500/20 hover:text-cyan-300 border-zinc-700 hover:border-cyan-600"
                        >
                          {isLoading.enhanceImage ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Enhancing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-4 w-4" />
                              Enhance Back Cover
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="bg-cyan-950/30 border border-cyan-800/30 rounded-md p-3 text-xs text-cyan-300 flex items-start space-x-2">
                      <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <p>
                        Enhancement uses AI upscaling to improve resolution and
                        clarity. This is optional but recommended for highest
                        quality.
                      </p>
                    </div>
                  </div>

                  {/* Interior Page Thumbnails */}
                  <div className="space-y-4 rounded-lg bg-zinc-900/50 p-4 border border-zinc-700/50">
                    <h3 className="font-medium flex items-center text-zinc-300">
                      <ImageIcon className="h-4 w-4 mr-2 text-cyan-400" />
                      Add Interior Page Previews (Optional)
                    </h3>

                    <p className="text-sm text-zinc-400">
                      Upload up to 3 interior page samples to display on the
                      back cover. These will be arranged in a grid.
                    </p>

                    <div className="grid grid-cols-3 gap-3">
                      {coverState.interiorPages.map((image, index) => (
                        <div
                          key={index}
                          className="relative group aspect-[3/4]"
                        >
                          <img
                            src={image}
                            alt={`Interior page ${index + 1}`}
                            className="w-full h-full object-cover rounded-md border border-zinc-700/50"
                          />
                          <button
                            onClick={() => handleRemoveInteriorImage(index)}
                            className="absolute top-1 right-1 bg-red-500/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Remove image"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}

                      {coverState.interiorPages.length < 3 && (
                        <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-700/50 rounded-md cursor-pointer hover:bg-zinc-800/30 transition-colors aspect-[3/4]">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleInteriorImageUpload}
                            className="hidden"
                          />
                          <PlusCircle className="h-6 w-6 text-zinc-600 mb-2" />
                          <span className="text-xs text-zinc-500 text-center px-2">
                            Add page preview
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="bg-cyan-950/30 border border-cyan-800/30 rounded-md p-3 text-xs text-cyan-300 flex items-start space-x-2">
                      <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <p>
                        Interior page previews help customers see samples of
                        your book's content. Upload clear, high-quality images.
                      </p>
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setActiveStep("generate")}
                      className="flex-1 bg-zinc-800/70 text-zinc-300 hover:bg-zinc-700 border-zinc-700"
                    >
                      Back
                    </Button>

                    <Button
                      onClick={handleAssembleFullCover}
                      disabled={
                        isLoading.assembleWrap ||
                        !coverState.frontCoverImage ||
                        !coverState.backCoverImage
                      }
                      className="flex-1 bg-gradient-to-r from-cyan-600 to-cyan-600 text-white hover:from-cyan-700 hover:to-cyan-700"
                    >
                      Generate Full Wrap
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 5: Download */}
              {activeStep === "assemble" && (
                <div className="space-y-6">
                  <div className="rounded-lg bg-zinc-900/50 p-4 border border-zinc-700/50 space-y-4">
                    <h3 className="font-medium flex items-center text-zinc-300">
                      <Download className="h-5 w-5 mr-2 text-cyan-400" />
                      Download Your Full Wrap Cover
                    </h3>

                    <p className="text-sm text-zinc-400">
                      Your full wrap cover is ready to download. This file is
                      optimized for Amazon KDP and includes all specifications
                      based on your book details.
                    </p>

                    <div className="flex justify-center p-4">
                      {coverState.fullWrapImage ? (
                        <div className="relative">
                          <img
                            src={coverState.fullWrapImage}
                            alt="Full Wrap Cover"
                            className="max-w-full max-h-[400px] rounded-md border border-zinc-700/60 shadow-lg"
                          />

                          {/* Overlay labels for front, spine, back */}
                          <div className="absolute inset-0 flex">
                            <div className="flex-1 border-r border-zinc-500/30 relative">
                              <span className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/60 text-zinc-300 text-xs rounded">
                                Back
                              </span>
                            </div>
                            <div className="w-[3%] border-r border-zinc-500/30 relative">
                              <span className="absolute top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-black/60 text-zinc-300 text-xs rounded whitespace-nowrap rotate-90">
                                Spine
                              </span>
                            </div>
                            <div className="flex-1 relative">
                              <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/60 text-zinc-300 text-xs rounded">
                                Front
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : isLoading.assembleWrap ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-3">
                          <Loader2 className="h-10 w-10 text-cyan-500 animate-spin" />
                          <p className="text-zinc-400">
                            Assembling your full wrap cover...
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-48 text-zinc-500">
                          <AlertCircle className="h-10 w-10 mb-3" />
                          <p>Failed to generate full wrap cover</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-3">
                      <a
                        href={coverState.fullWrapImage || "#"}
                        download="kdp-full-wrap-cover.jpg"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`bg-gradient-to-r from-cyan-600 to-cyan-500 text-white font-medium rounded-md px-6 py-3 flex items-center justify-center text-center ${!coverState.fullWrapImage ? "opacity-50 cursor-not-allowed" : "hover:from-cyan-700 hover:to-cyan-600"}`}
                        onClick={(e) =>
                          !coverState.fullWrapImage && e.preventDefault()
                        }
                      >
                        <Download className="h-5 w-5 mr-2" />
                        Download Full KDP Cover (PDF)
                      </a>

                      <Button
                        variant="outline"
                        onClick={() => setActiveStep("enhance")}
                        className="bg-zinc-800/70 text-zinc-300 hover:bg-zinc-700 border-zinc-700"
                      >
                        <Undo className="mr-2 h-4 w-4" />
                        Go Back to Edit
                      </Button>
                    </div>

                    <div className="bg-cyan-950/30 border border-cyan-800/30 rounded-md p-3 text-xs text-cyan-300 flex items-start space-x-2">
                      <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <p>
                        Your cover is exactly {coverState.dimensions.width} x{" "}
                        {coverState.dimensions.height} pixels at 300 DPI,
                        matching your book's specifications. Ready to upload
                        directly to Amazon KDP.
                      </p>
                    </div>
                  </div>

                  {/* Tips Section */}
                  <div className="rounded-lg bg-zinc-900/50 p-4 border border-zinc-700/50">
                    <div className="flex items-center mb-3">
                      <Lightbulb className="h-4 w-4 mr-2 text-amber-400" />
                      <h3 className="font-medium text-zinc-300">
                        Tips for KDP Upload
                      </h3>
                    </div>

                    <ul className="space-y-2 text-sm text-zinc-400">
                      <li className="flex items-start">
                        <Check className="h-4 w-4 mr-2 text-amber-400 mt-0.5 flex-shrink-0" />
                        <span>
                          Always check your cover in the KDP previewer before
                          publishing.
                        </span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-4 w-4 mr-2 text-amber-400 mt-0.5 flex-shrink-0" />
                        <span>
                          KDP may reject covers with text too close to the trim
                          edges. Keep important elements away from edges.
                        </span>
                      </li>
                      <li className="flex items-start">
                        <Check className="h-4 w-4 mr-2 text-amber-400 mt-0.5 flex-shrink-0" />
                        <span>
                          For best results, upload this cover as PDF. KDP
                          accepts JPEG but PDF maintains higher quality.
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Error display */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-4 text-sm mt-4">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Preview */}
        <div className="space-y-4">
          {/* Preview Card */}
          <Card className="bg-black/80 backdrop-blur-sm border border-zinc-700/50 overflow-hidden shadow-lg">
            <CardHeader className="border-b border-zinc-700/50 bg-black/80">
              <CardTitle className="text-center text-zinc-300">
                {coverState.fullWrapImage
                  ? "Full Wrap Cover"
                  : coverState.frontCoverImage
                    ? "Cover Preview"
                    : "Preview"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center justify-center min-h-[450px]">
              {coverState.fullWrapImage ? (
                <div className="relative group">
                  <img
                    src={coverState.fullWrapImage}
                    alt="Generated Full Wrap Cover"
                    className="max-w-full max-h-[450px] rounded-md border border-zinc-700/60 shadow-lg"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                    <a
                      href={coverState.fullWrapImage}
                      download="kdp-full-wrap-cover.jpg"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-cyan-500 hover:bg-cyan-600 text-black font-medium rounded-md px-4 py-2 flex items-center text-sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Cover
                    </a>
                  </div>
                </div>
              ) : coverState.frontCoverImage ? (
                <div className="relative">
                  <img
                    src={coverState.frontCoverImage}
                    alt="Generated Front Cover"
                    className="max-w-full max-h-[450px] rounded-md border border-zinc-700/60 shadow-lg"
                  />
                </div>
              ) : (
                <div className="w-[280px] h-[400px] rounded-md flex items-center justify-center bg-zinc-900/50 border border-dashed border-zinc-700/60 text-zinc-500 p-6 text-center">
                  <div>
                    <div className="mb-4 opacity-70">
                      <LucideBook className="h-16 w-16 mx-auto text-zinc-700" />
                    </div>
                    <p className="text-sm">
                      Your generated book cover will appear here
                    </p>
                  </div>
                </div>
              )}

              {/* Download button for completed wrap */}
              {activeStep === "assemble" && coverState.fullWrapImage && (
                <Button
                  onClick={handleDownloadFullCover}
                  className="mt-4 bg-gradient-to-r from-cyan-600 to-cyan-500 text-white font-medium rounded-md px-6 py-3 flex items-center text-sm hover:from-cyan-700 hover:to-cyan-600"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Download Full KDP Cover (PDF)
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Cover Specifications Summary */}
          <Card className="bg-black/80 backdrop-blur-sm border border-zinc-700/50 shadow-lg">
            <CardHeader className="pb-2 border-b border-zinc-700/50">
              <CardTitle className="text-sm text-zinc-300">
                Cover Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Trim Size:</span>
                  <span className="text-zinc-300">
                    {trimSizeOptions.find(
                      (opt) => opt.value === coverState.bookDetails.trimSize,
                    )?.label || coverState.bookDetails.trimSize}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Paper Type:</span>
                  <span className="text-zinc-300">
                    {paperTypeOptions.find(
                      (opt) => opt.value === coverState.bookDetails.paperType,
                    )?.label || coverState.bookDetails.paperType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Page Count:</span>
                  <span className="text-zinc-300">
                    {coverState.bookDetails.pageCount} pages
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Spine Width:</span>
                  <span className="text-zinc-300">
                    {coverState.dimensions.spineWidthInches}"
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Spine Text:</span>
                  <span className="text-zinc-300">
                    {coverState.bookDetails.pageCount >= 100 &&
                    coverState.bookDetails.spineText
                      ? "Yes"
                      : "No"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Bleed:</span>
                  <span className="text-zinc-300">
                    {coverState.bookDetails.hasBleed ? 'Yes (0.125")' : "No"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Resolution:</span>
                  <span className="text-zinc-300">
                    {coverState.dimensions.width} x{" "}
                    {coverState.dimensions.height} px
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">DPI:</span>
                  <span className="text-zinc-300">300</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Status:</span>
                  <span
                    className={`
                    ${Object.values(isLoading).some((v) => v) ? "text-amber-400" : ""} 
                    ${activeStep === "assemble" && coverState.fullWrapImage ? "text-emerald-400" : ""}
                    ${error ? "text-red-400" : ""}
                    ${!Object.values(isLoading).some((v) => v) && !coverState.frontCoverImage && !error ? "text-zinc-500" : ""}
                    ${coverState.frontCoverImage && !coverState.fullWrapImage && !Object.values(isLoading).some((v) => v) ? "text-teal-400" : ""}
                  `}
                  >
                    {Object.values(isLoading).some((v) => v)
                      ? "Processing..."
                      : activeStep === "assemble" && coverState.fullWrapImage
                        ? "Complete"
                        : coverState.frontCoverImage
                          ? "Cover Generated"
                          : error
                            ? "Error"
                            : "Ready"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default KDPFullWrapGenerator;
