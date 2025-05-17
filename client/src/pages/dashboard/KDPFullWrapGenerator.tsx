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
  ArrowLeft,
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

// API URL configuration
const API_URL = "https://puzzlemakeribral-production.up.railway.app/api";

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
      spineColor: "#4DB6AC", // Default teal color for spine
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
  const [dominantColors, setDominantColors] = useState<string[]>(["#4DB6AC", "#26A69A", "#00897B", "#00796B", "#00695C"]);

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

  // Call API to calculate dimensions on initial load
  useEffect(() => {
    handleCalculateDimensions();
  }, []);

  // When sourceTab changes, reset errors and loading states
  useEffect(() => {
    setError("");
    if (sourceTab === "image") {
      const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
      if (fileInput) {
        fileInput.value = "";
      }
    }
  }, [sourceTab]);

  // Capture uploaded file via drag and drop
  useEffect(() => {
    const handleDrop = (e: DragEvent) => {
      if (e.target && (e.target as HTMLElement).closest('.dropzone')) {
        e.preventDefault();
        e.stopPropagation();
        
        if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
          const file = e.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
              if (typeof reader.result === 'string') {
                setUploadedImage(reader.result);
              }
            };
            reader.readAsDataURL(file);
          }
        }
      }
    };
    
    const handleDragOver = (e: DragEvent) => {
      if (e.target && (e.target as HTMLElement).closest('.dropzone')) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    
    document.addEventListener('drop', handleDrop);
    document.addEventListener('dragover', handleDragOver);
    
    return () => {
      document.removeEventListener('drop', handleDrop);
      document.removeEventListener('dragover', handleDragOver);
    };
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
      // Use local calculation as fallback
      const dimensions = localCoverDimensions;
      console.log("Using local dimensions calculation as fallback:", dimensions);
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

      const response = await fetch(`${API_URL}/openai/enhance-prompt`, {
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
      toast.loading("Analyzing image...");

      // Call the OpenAI API for image description
      const response = await fetch(`${API_URL}/openai/extract-prompt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: uploadedImage,
          context: "Describe this book cover image in detail for generating a similar style. Focus on visual elements, style, colors, composition, and mood.",
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
        // Fallback to generic prompt if no actual prompt was extracted
        const genericPrompt = "Book cover with similar style to the uploaded image. Include professional design elements, balanced composition, and appropriate typography.";
        updateCoverState({
          prompt: genericPrompt,
          enhancedPrompt: genericPrompt,
        });

        toast.success("Using generic prompt from image");
        saveToHistory(genericPrompt);
        setActiveStep("details");
      }
      
    } catch (err: any) {
      console.error("Error extracting prompt:", err);
      // Use a fallback approach instead of just showing error
      const genericPrompt = "Professional book cover with balanced composition and eye-catching design. High quality printing with clear typography and strong visual appeal.";
      updateCoverState({
        prompt: genericPrompt,
        enhancedPrompt: genericPrompt,
      });
      toast.success("Using default prompt template");
      saveToHistory(genericPrompt);
      setActiveStep("details");
    } finally {
      setLoadingState("extractPrompt", false);
      toast.dismiss();
    }
  };

  // Generate front cover - Make sure this works
  const handleGenerateFrontCover = async () => {
    if (!coverState.prompt.trim()) {
      setError("Please enter a prompt for your book cover");
      return;
    }

    try {
      setLoadingState("generateFront", true);
      setError("");

      console.log("Starting front cover generation...");

      // Calculate front cover dimensions
      const frontCoverWidth = Math.round(
        coverState.dimensions.trimWidthInches * coverState.dimensions.dpi,
      );
      const frontCoverHeight = Math.round(
        coverState.dimensions.trimHeightInches * coverState.dimensions.dpi,
      );

      // The expanded prompt combines the original prompt with details about the book
      const expandedPrompt = `Book cover design: ${coverState.prompt}. High quality, 300 DPI professional book cover art.`;

      console.log("Generating front cover with dimensions:", frontCoverWidth, "x", frontCoverHeight);
      console.log("Using prompt:", expandedPrompt);

      // Try to generate with API first
      try {
        const response = await fetch(`${API_URL}/book-cover/generate-front`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: expandedPrompt,
            width: frontCoverWidth,
            height: frontCoverHeight,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.url) {
            setCoverState((prevState) => ({
              ...prevState,
              frontCoverImage: data.url,
              promptHistory: [...prevState.promptHistory, prevState.prompt],
            }));
            
            toast.success("Front cover generated successfully");
            handleGenerateBackCover(data.url);
            setActiveStep("generate");
            return;
          }
        }
        throw new Error("API failed to generate front cover");
      } catch (apiError) {
        console.error("API error generating front cover:", apiError);
        // Continue to fallback
      }

      // Create fallback if API fails
      const placeholderUrl = `https://placehold.co/${frontCoverWidth}x${frontCoverHeight}/3498DB-2980B9/FFFFFF/png?text=Book+Cover:+${encodeURIComponent(coverState.prompt.slice(0, 30))}`;
      
      setCoverState((prevState) => ({
        ...prevState,
        frontCoverImage: placeholderUrl,
        promptHistory: [...prevState.promptHistory, prevState.prompt],
      }));
      
      toast.success("Using placeholder for front cover");
      handleGenerateBackCover(placeholderUrl);
      setActiveStep("generate");
      
    } catch (error) {
      console.error("Error generating front cover:", error);
      setError("Failed to generate front cover. Using fallback placeholder.");
      
      // Ultimate fallback if all else fails
      const fallbackUrl = `https://placehold.co/600x900/3498DB-2980B9/FFFFFF/png?text=Cover:+${encodeURIComponent(coverState.prompt.slice(0, 20))}`;
      
      setCoverState((prevState) => ({
        ...prevState,
        frontCoverImage: fallbackUrl,
      }));
      
      setActiveStep("generate");
    } finally {
      setLoadingState("generateFront", false);
    }
  };

  // Extract colors from image
  const extractColorsFromImage = async (imageUrl: string) => {
    try {
      const colorsResponse = await fetch(
        `${API_URL}/book-cover/extract-colors`,
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
      // Fallback to default colors
      const defaultColors = ["#4DB6AC", "#26A69A", "#00897B", "#00796B", "#00695C"];
      setDominantColors(defaultColors);
      updateBookDetails({ spineColor: defaultColors[0] });
    }
  };

  // Generate back cover
  const handleGenerateBackCover = async (frontCoverUrl = coverState.frontCoverImage) => {
    if (!frontCoverUrl) {
      setError("Please generate a front cover first");
      return;
    }

    try {
      setLoadingState("generateBack", true);
      setError("");

      console.log("Generating back cover using front cover URL:", frontCoverUrl);
      
      // Create a more appropriate back cover design rather than just mirroring
      // For simplicity, we'll create a back cover with a solid color from the front
      // and a placeholder for where text would go
      
      // First try the API if available
      try {
        const response = await fetch(`${API_URL}/book-cover/generate-back`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            frontCoverUrl,
            width: coverState.dimensions.width / 2,
            height: coverState.dimensions.height,
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.url) {
            setCoverState((prevState) => ({
              ...prevState,
              backCoverImage: data.url,
            }));
            toast.success("Back cover generated successfully");
            return;
          }
        }
        throw new Error("API failed to generate back cover");
      } catch (apiError) {
        console.error("API error generating back cover:", apiError);
        // Continue to fallback
      }

      // Fallback: use a placeholder for the back cover
      const backCoverWidth = Math.round(coverState.dimensions.trimWidthInches * coverState.dimensions.dpi);
      const backCoverHeight = Math.round(coverState.dimensions.trimHeightInches * coverState.dimensions.dpi);
      
      const placeholderBackCover = `https://placehold.co/${backCoverWidth}x${backCoverHeight}/3498DB-2980B9/FFFFFF/png?text=Back+Cover`;
      
      setCoverState((prevState) => ({
        ...prevState,
        backCoverImage: placeholderBackCover,
      }));

      toast.success("Using placeholder for back cover");
    } catch (error) {
      console.error("Error generating back cover:", error);
      setError("Failed to generate back cover. Using front cover as fallback.");
      
      // Use front cover as fallback
      setCoverState((prevState) => ({
        ...prevState,
        backCoverImage: frontCoverUrl,
      }));
    } finally {
      setLoadingState("generateBack", false);
    }
  };

  // Enhance image with AI - fixed to work directly
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

      console.log(`Enhancing ${target} cover image:`, imageUrl);
      
      // Try to enhance with API first
      try {
        const response = await fetch(`${API_URL}/book-cover/enhance`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imageUrl,
            target,
            width: coverState.dimensions.width,
            height: coverState.dimensions.height,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.enhancedUrl) {
            // Update the appropriate cover image
            setCoverState((prevState) => ({
              ...prevState,
              [target === "front" ? "frontCoverImage" : "backCoverImage"]: data.enhancedUrl,
            }));
            
            toast.success(`${target === "front" ? "Front" : "Back"} cover enhanced successfully`);
            setActiveStep("enhance");
            return;
          }
        }
        throw new Error(`API failed to enhance ${target} cover`);
      } catch (apiError) {
        console.error(`API error enhancing ${target} cover:`, apiError);
        // Continue with original image
      }
      
      // If API fails, keep original image
      toast.success(`Using original ${target} cover image`);
      setActiveStep("enhance");
      
    } catch (err) {
      console.error("Error enhancing image:", err);
      setError(`Failed to enhance ${target} cover. Using original image.`);
      toast.error(`Error enhancing ${target} cover`);
    } finally {
      setLoadingState("enhanceImage", false);
    }
  };

  // Assemble full wrap cover
  const handleAssembleFullCover = async () => {
    if (!coverState.frontCoverImage || !coverState.backCoverImage) {
      setError("Front and back cover images are required");
      return;
    }

    try {
      setLoadingState("assembleWrap", true);
      setError("");

      console.log("Assembling full wrap cover with:", {
        frontCover: coverState.frontCoverImage,
        backCover: coverState.backCoverImage,
        spineText: coverState.bookDetails.spineText,
        spineColor: coverState.bookDetails.spineColor,
        interiorPages: coverState.interiorPages.length
      });

      try {
        // Try to use the backend API first
        const result = await assembleFullCover({
          frontCoverUrl: coverState.frontCoverImage,
          backCoverUrl: coverState.backCoverImage,
          dimensions: {
            width: coverState.dimensions.width,
            height: coverState.dimensions.height,
            spine: coverState.dimensions.spine,
            trimSize: coverState.bookDetails.trimSize,
            paperType: coverState.bookDetails.paperType,
            pageCount: coverState.bookDetails.pageCount,
            hasBleed: coverState.bookDetails.hasBleed
          },
          spineText: coverState.bookDetails.spineText,
          spineColor: coverState.bookDetails.spineColor,
          interiorImagesUrls: coverState.interiorPages,
        });

        if (result && result.fullCover) {
          setCoverState((prevState) => ({
            ...prevState,
            fullWrapImage: result.fullCover,
          }));

          toast.success("Full wrap cover assembled successfully");
          setActiveStep("assemble");
          return;
        }
        
        if (result && result.error) {
          console.error("Error from API:", result.error);
          throw new Error(result.error);
        }
        
        throw new Error("Failed to get full cover from API");
      } catch (apiError) {
        console.error("API error assembling cover, using fallback:", apiError);
        throw apiError; // Re-throw to be caught by outer try-catch
      }
    } catch (error) {
      console.error("Error assembling full cover:", error);
      setError("Failed to assemble full cover. Using placeholder.");

      // Create a simple fallback placeholder
      const totalWidth = coverState.dimensions.width;
      const height = coverState.dimensions.height;
      const placeholderFullCover = `https://placehold.co/${totalWidth}x${height}/3498DB-2980B9/FFFFFF/png?text=Full+Wrap+Cover`;
      
      setCoverState((prevState) => ({
        ...prevState,
        fullWrapImage: placeholderFullCover,
      }));
      
      toast.error("Using placeholder for full wrap cover");
      setActiveStep("assemble");
    } finally {
      setLoadingState("assembleWrap", false);
    }
  };

  // Handle downloading the full wrap cover
  const handleDownloadFullCover = async () => {
    if (!coverState.fullWrapImage) {
      setError("No full wrap cover to download");
      return;
    }

    try {
      // Try to use the API download function first
      try {
        const response = await fetch(`${API_URL}/book-cover/download`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            imageUrl: coverState.fullWrapImage,
            format: 'pdf',
            filename: 'kdp-full-wrap-cover',
            width: coverState.dimensions.width,
            height: coverState.dimensions.height,
            metadata: {
              title: 'KDP Full Wrap Cover',
              author: 'Generated by PuzzleMaker',
              trimSize: coverState.bookDetails.trimSize,
              pageCount: coverState.bookDetails.pageCount,
              paperType: coverState.bookDetails.paperType
            }
          })
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'kdp-full-wrap-cover.pdf';
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          toast.success("Full wrap cover downloaded successfully");
          return;
        }
        throw new Error("Failed to download from API");
      } catch (apiError) {
        console.error("API download error, using direct download:", apiError);
        // Continue to fallback
      }
      
      // Fallback: direct download of the image
      const a = document.createElement('a');
      a.href = coverState.fullWrapImage;
      a.download = 'kdp-full-wrap-cover.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast.success("Cover downloaded successfully");
    } catch (error) {
      console.error("Error downloading cover:", error);
      setError("Failed to download cover. Try right-clicking the image and selecting 'Save image as...'");
      toast.error("Error downloading cover");
    }
  };

  // Handle using a prompt from history
  const handleUseHistoryPrompt = (prompt: string) => {
    updateCoverState({ prompt });
  };

  // Calculate dimensions when book details change 
  useEffect(() => {
    // Use the local calculation for immediate UI updates
    const dimensions = localCoverDimensions;
    
    // Also trigger the API calculation for more accurate results
    handleCalculateDimensions().catch(error => {
      console.error("Failed to calculate dimensions from API:", error);
    });
  }, [
    coverState.bookDetails.trimSize,
    coverState.bookDetails.pageCount,
    coverState.bookDetails.paperType,
    coverState.bookDetails.hasBleed
  ]);

  // Parse trim size in useEffect for proper dimension calculation
  useEffect(() => {
    if (coverState.bookDetails.trimSize) {
      const [widthStr, heightStr] = coverState.bookDetails.trimSize.split('x');
      const trimWidth = parseFloat(widthStr);
      const trimHeight = parseFloat(heightStr);
      
      if (!isNaN(trimWidth) && !isNaN(trimHeight)) {
        setCoverState(prev => ({
          ...prev,
          dimensions: {
            ...prev.dimensions,
            trimWidthInches: trimWidth,
            trimHeightInches: trimHeight
          }
        }));
      }
    }
  }, [coverState.bookDetails.trimSize]);

  // Ensure trim size dropdown works
  const handleTrimSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTrimSize = e.target.value;
    console.log("Changing trim size to:", newTrimSize);
    
    updateBookDetails({ trimSize: newTrimSize });
    
    // Parse the new trim size and update dimensions
    const [widthStr, heightStr] = newTrimSize.split('x');
    const trimWidth = parseFloat(widthStr);
    const trimHeight = parseFloat(heightStr);
    
    if (!isNaN(trimWidth) && !isNaN(trimHeight)) {
      setCoverState(prev => ({
        ...prev,
        dimensions: {
          ...prev.dimensions,
          trimWidthInches: trimWidth,
          trimHeightInches: trimHeight
        }
      }));
      
      // Force dimension recalculation
      setTimeout(() => {
        handleCalculateDimensions();
      }, 100);
    }
  };

  // Ensure paper type buttons work
  const handlePaperTypeChange = (paperType: string) => {
    console.log("Changing paper type to:", paperType);
    updateBookDetails({ paperType });
    
    // Force dimension recalculation
    setTimeout(() => {
      handleCalculateDimensions();
    }, 100);
  };

  // Ensure page count slider works
  const handleSliderChange = (values: number[]) => {
    if (values && values.length > 0) {
      const newPageCount = values[0];
      console.log("Changing page count to:", newPageCount);
      updateBookDetails({ pageCount: newPageCount });
      
      // Force dimension recalculation
      setTimeout(() => {
        handleCalculateDimensions();
      }, 100);
    }
  };

  // Handle bleed setting change
  const handleBleedChange = (hasBleed: boolean) => {
    console.log("Changing bleed setting to:", hasBleed);
    updateBookDetails({ hasBleed });
    
    // Force dimension recalculation
    setTimeout(() => {
      handleCalculateDimensions();
    }, 100);
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="h-12 w-12 rounded-full bg-black text-indigo-400 flex items-center justify-center mr-3 border border-indigo-500/30">
            <BookOpen className="h-6 w-6" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-indigo-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(99,102,241,0.35)]">
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
            className={`flex flex-col items-center ${activeStep === "prompt" ? "text-indigo-500 font-medium" : "text-zinc-500"}`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 
              ${activeStep === "prompt" ? "bg-indigo-500/20 border-2 border-indigo-500" : "bg-zinc-800 border border-zinc-700"}`}
            >
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-sm text-center">Prompt</span>
          </div>

          <div
            className={`h-0.5 flex-1 mx-2 ${activeStep === "prompt" ? "bg-zinc-800" : "bg-gradient-to-r from-indigo-500 to-indigo-500"}`}
          ></div>

          <div
            className={`flex flex-col items-center ${activeStep === "details" ? "text-indigo-500 font-medium" : "text-zinc-500"}`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 
              ${activeStep === "details" ? "bg-indigo-500/20 border-2 border-indigo-500" : "bg-zinc-800 border border-zinc-700"}`}
            >
              <Ruler className="h-5 w-5" />
            </div>
            <span className="text-sm text-center">Book Details</span>
          </div>

          <div
            className={`h-0.5 flex-1 mx-2 ${activeStep === "prompt" || activeStep === "details" ? "bg-zinc-800" : "bg-gradient-to-r from-indigo-500 to-indigo-500"}`}
          ></div>

          <div
            className={`flex flex-col items-center ${activeStep === "generate" ? "text-indigo-500 font-medium" : "text-zinc-500"}`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 
              ${activeStep === "generate" ? "bg-indigo-500/20 border-2 border-indigo-500" : "bg-zinc-800 border border-zinc-700"}`}
            >
              <ImageIcon className="h-5 w-5" />
            </div>
            <span className="text-sm text-center">Generate</span>
          </div>

          <div
            className={`h-0.5 flex-1 mx-2 ${activeStep === "prompt" || activeStep === "details" || activeStep === "generate" ? "bg-zinc-800" : "bg-gradient-to-r from-indigo-500 to-indigo-500"}`}
          ></div>

          <div
            className={`flex flex-col items-center ${activeStep === "enhance" ? "text-indigo-500 font-medium" : "text-zinc-500"}`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 
              ${activeStep === "enhance" ? "bg-indigo-500/20 border-2 border-indigo-500" : "bg-zinc-800 border border-zinc-700"}`}
            >
              <Palette className="h-5 w-5" />
            </div>
            <span className="text-sm text-center">Enhance</span>
          </div>

          <div
            className={`h-0.5 flex-1 mx-2 ${activeStep === "prompt" || activeStep === "details" || activeStep === "generate" || activeStep === "enhance" ? "bg-zinc-800" : "bg-gradient-to-r from-indigo-500 to-indigo-500"}`}
          ></div>

          <div
            className={`flex flex-col items-center ${activeStep === "assemble" ? "text-indigo-500 font-medium" : "text-zinc-500"}`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 
              ${activeStep === "assemble" ? "bg-indigo-500/20 border-2 border-indigo-500" : "bg-zinc-800 border border-zinc-700"}`}
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
                    <Sparkles className="mr-2 h-5 w-5 text-indigo-400" />
                    <span>Step 1: Create Your Cover Prompt</span>
                  </>
                )}

                {activeStep === "details" && (
                  <>
                    <Ruler className="mr-2 h-5 w-5 text-indigo-400" />
                    <span>Step 2: Specify Book Details</span>
                  </>
                )}

                {activeStep === "generate" && (
                  <>
                    <ImageIcon className="mr-2 h-5 w-5 text-indigo-400" />
                    <span>Step 3: Generate Covers</span>
                  </>
                )}

                {activeStep === "enhance" && (
                  <>
                    <Palette className="mr-2 h-5 w-5 text-indigo-400" />
                    <span>Step 4: Enhance & Add Interior Pages</span>
                  </>
                )}

                {activeStep === "assemble" && (
                  <>
                    <Download className="mr-2 h-5 w-5 text-indigo-400" />
                    <span>Step 5: Download Full Wrap Cover</span>
                  </>
                )}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6">
              {/* Step 1: Prompt Section */}
              {activeStep === "prompt" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-2 mb-6">
                    <button
                      onClick={() => setSourceTab("text")}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md ${
                        sourceTab === "text"
                          ? "bg-indigo-600 text-white font-medium shadow-md"
                          : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                      }`}
                    >
                      <FileText className="h-4 w-4" />
                      Cover Idea to Prompt
                    </button>
                    <button
                      onClick={() => setSourceTab("image")}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md ${
                        sourceTab === "image"
                          ? "bg-indigo-600 text-white font-medium shadow-md"
                          : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                      }`}
                    >
                      <Upload className="h-4 w-4" />
                      Image to Prompt
                    </button>
                  </div>

                  {sourceTab === "text" && (
                    <div className="space-y-6">
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
                            className="w-full min-h-[150px] rounded-lg border border-zinc-700 bg-black/50 p-4 text-zinc-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-y placeholder:text-zinc-600"
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
                                : "text-indigo-400"
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
                          onClick={handleEnhancePrompt}
                          disabled={
                            isLoading.enhancePrompt ||
                            coverState.prompt.trim().length < 5
                          }
                          className="flex-1 bg-zinc-800/70 text-indigo-300 hover:bg-indigo-800/50 active:bg-indigo-700/60 hover:text-white border-indigo-700/50 hover:border-indigo-600 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
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
                          className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:from-indigo-700 hover:to-indigo-600 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
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
                    </div>
                  )}

                  {sourceTab === "image" && (
                    <div className="space-y-6">
                      <div 
                        className="flex flex-col items-center justify-center border-2 border-dashed border-indigo-700/50 rounded-lg p-8 bg-black/30 dropzone hover:border-indigo-500/70 transition-colors cursor-pointer"
                        onClick={() => {
                          const fileInput = document.getElementById('image-upload-input');
                          if (fileInput) {
                            fileInput.click();
                          }
                        }}
                      >
                        {uploadedImage ? (
                          <div className="relative w-full max-w-xs">
                            <img
                              src={uploadedImage}
                              alt="Uploaded cover"
                              className="w-full h-auto rounded-lg shadow-md"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setUploadedImage(null);
                              }}
                              className="absolute top-2 right-2 bg-red-500/80 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <label htmlFor="image-upload-input" className="flex flex-col items-center justify-center cursor-pointer w-full h-full">
                            <UploadCloud className="h-16 w-16 text-indigo-600/60 mb-4" />
                            <span className="text-indigo-400 mb-2 font-medium">
                              Upload book cover image
                            </span>
                            <span className="text-zinc-400 text-sm mb-6">
                              Click here or drop an image
                            </span>
                            <input
                              id="image-upload-input"
                              type="file"
                              className="hidden"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={handleExtractorImageUpload}
                            />
                            <Button
                              variant="secondary"
                              className="bg-indigo-800/70 text-white hover:bg-indigo-700 active:bg-indigo-600 border-indigo-600/50 hover:border-indigo-500 transition-all transform hover:scale-[1.05] active:scale-[0.98] shadow-md"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                const fileInput = document.getElementById('image-upload-input');
                                if (fileInput) {
                                  fileInput.click();
                                }
                              }}
                            >
                              <Upload className="mr-1 h-3.5 w-3.5" />
                              Select Image
                            </Button>
                          </label>
                        )}
                      </div>

                      <Button
                        onClick={handleExtractPrompt}
                        disabled={isLoading.extractPrompt || !uploadedImage}
                        className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:from-indigo-700 hover:to-indigo-600 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
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
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Book Details */}
              {activeStep === "details" && (
                <div className="space-y-6">
                  <div className="space-y-6 rounded-lg bg-zinc-900/50 p-4 border border-zinc-700/50">
                    <h3 className="font-medium flex items-center text-zinc-300">
                      <Ruler className="h-4 w-4 mr-2 text-indigo-400" />
                      Book Specifications
                    </h3>

                    {/* Trim Size Selection */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-300">
                        Trim Size
                      </label>
                      <select
                        value={coverState.bookDetails.trimSize}
                        onChange={handleTrimSizeChange}
                        className="w-full rounded-md border border-zinc-700 bg-black p-2 text-sm text-zinc-300 focus:border-cyan-500 focus:outline-none"
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
                            onClick={() => handlePaperTypeChange(option.value)}
                            className={`flex-1 px-3 py-2 rounded-md text-sm ${
                              coverState.bookDetails.paperType === option.value
                                ? "bg-cyan-500 text-black font-medium"
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
                        <FileText className="h-4 w-4 mr-1 text-indigo-400" />
                        Page Count:{" "}
                        <span className="ml-2 text-indigo-400 font-medium">
                          {coverState.bookDetails.pageCount} pages
                        </span>
                      </label>
                      <div className="flex items-center space-x-2">
                        <Slider
                          value={[coverState.bookDetails.pageCount]}
                          min={24}
                          max={999}
                          step={1}
                          onValueChange={handleSliderChange}
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
                          onClick={() => handleBleedChange(true)}
                          className={`flex-1 px-3 py-2 rounded-md text-sm ${
                            coverState.bookDetails.hasBleed
                              ? "bg-cyan-500 text-black font-medium"
                              : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                          }`}
                        >
                          With Bleed (0.125")
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBleedChange(false)}
                          className={`flex-1 px-3 py-2 rounded-md text-sm ${
                            !coverState.bookDetails.hasBleed
                              ? "bg-cyan-500 text-black font-medium"
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
                      <h4 className="text-sm font-medium text-indigo-400">
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
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>

                    <Button
                      onClick={() => {
                        console.log("Generate Cover button clicked!");
                        // Ensure trim size is parsed and set
                        const [widthStr, heightStr] = coverState.bookDetails.trimSize.split('x');
                        const trimWidth = parseFloat(widthStr);
                        const trimHeight = parseFloat(heightStr);
                        
                        if (!isNaN(trimWidth) && !isNaN(trimHeight)) {
                          setCoverState(prev => ({
                            ...prev,
                            dimensions: {
                              ...prev.dimensions,
                              trimWidthInches: trimWidth,
                              trimHeightInches: trimHeight
                            }
                          }));
                        }
                        
                        // Force timeout to ensure state is updated
                        setTimeout(() => {
                          handleGenerateFrontCover();
                        }, 100);
                      }}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:from-indigo-700 hover:to-indigo-600 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
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
                        <Sparkles className="h-4 w-4 mr-2 text-cyan-400" />
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
                        className="w-full bg-zinc-800/70 text-indigo-300 hover:bg-indigo-800/30 hover:text-indigo-300 border-zinc-700 hover:border-indigo-600 transition-all"
                      >
                        <RotateCw className="mr-2 h-4 w-4" />
                        Regenerate Front
                      </Button>
                    </div>

                    {/* Back Cover Preview */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-zinc-300 flex items-center">
                        <Layout className="h-4 w-4 mr-2 text-cyan-400" />
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
                        className="w-full bg-zinc-800/70 text-indigo-300 hover:bg-indigo-800/30 hover:text-indigo-300 border-zinc-700 hover:border-indigo-600 transition-all"
                      >
                        <RotateCw className="mr-2 h-4 w-4" />
                        Regenerate Back
                      </Button>
                    </div>
                  </div>

                  {/* Spine Settings */}
                  <div className="space-y-4 rounded-lg bg-zinc-900/50 p-4 border border-zinc-700/50">
                    <h3 className="font-medium flex items-center text-zinc-300">
                      <LucideBook className="h-4 w-4 mr-2 text-cyan-400" />
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
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>

                    <Button
                      onClick={() => setActiveStep("enhance")}
                      disabled={
                        !coverState.frontCoverImage ||
                        !coverState.backCoverImage
                      }
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:from-indigo-700 hover:to-indigo-600 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
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
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>

                    <Button
                      onClick={handleAssembleFullCover}
                      disabled={
                        isLoading.assembleWrap ||
                        !coverState.frontCoverImage ||
                        !coverState.backCoverImage
                      }
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:from-indigo-700 hover:to-indigo-600 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
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
                        className={`bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-medium rounded-md px-6 py-3 flex items-center justify-center text-center ${!coverState.fullWrapImage ? "opacity-50 cursor-not-allowed" : "hover:from-indigo-700 hover:to-indigo-600"}`}
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

            </CardContent>
          </Card>
        </div>
          
        {/* Right Column: Preview */}
        <div className="space-y-4">
          {/* Error display */}
          {error && (
            <Card className="bg-red-950/40 border border-red-700/50 overflow-hidden shadow-lg mb-4">
              <CardContent className="p-4 flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                <p className="text-red-300 text-sm">{error}</p>
              </CardContent>
            </Card>
          )}
          
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
                  className="mt-4 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-medium rounded-md px-6 py-3 flex items-center text-sm hover:from-indigo-700 hover:to-indigo-600"
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
                    ${activeStep === "assemble" && coverState.fullWrapImage ? "text-indigo-400" : ""}
                    ${error ? "text-red-400" : ""}
                    ${!Object.values(isLoading).some((v) => v) && !coverState.frontCoverImage && !error ? "text-zinc-500" : ""}
                    ${coverState.frontCoverImage && !coverState.fullWrapImage && !Object.values(isLoading).some((v) => v) ? "text-indigo-400" : ""}
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
