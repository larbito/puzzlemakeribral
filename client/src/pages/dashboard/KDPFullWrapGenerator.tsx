import React, { useState, useEffect, useMemo, useRef } from "react";
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
} from "lucide-react";
import { TabsList, TabsTrigger, Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

// API URL configuration - Remove the /api to avoid duplication
const API_URL = "https://puzzlemakeribral-production.up.railway.app";

// Type for cover state
interface CoverState {
  prompt: string;
  enhancedPrompt: string;
  backCoverPrompt: string;
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
  useMirroredFrontCover?: boolean;
}

// Step type
type GenerationStep =
  | "prompt"
  | "front_cover"
  | "back_prompt"
  | "back_cover"
  | "enhance"
  | "assemble";

// KDP Full Wrap Book Cover Generator component
const KDPFullWrapGenerator = () => {
  // Main state object for cover generation
  const [coverState, setCoverState] = useState<CoverState>({
    prompt: "",
    enhancedPrompt: "",
    backCoverPrompt: "",
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
      spineColor: "#6366F1", // Changed to indigo to match new color scheme
    },
    promptHistory: [],
  });

  // UI state
  const [activeStep, setActiveStep] = useState<GenerationStep>("prompt");
  const [sourceTab, setSourceTab] = useState<"text" | "image">("image");
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({
    enhancePrompt: false,
    extractPrompt: false,
    generateFront: false,
    generateBack: false,
    enhanceImage: false,
    assembleWrap: false,
    generateBackPrompt: false
  });
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [dominantColors, setDominantColors] = useState<string[]>(["#6366F1", "#4F46E5", "#4338CA", "#3730A3", "#312E81"]);

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
    console.log("handleExtractorImageUpload called", e.target.files?.length);
    
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      console.log("File selected:", file.name, file.type, file.size);
      
      // Show loading toast
      toast.loading("Reading image file...");
      
      const reader = new FileReader();
      
      reader.onloadend = () => {
        console.log("File read completed");
        if (typeof reader.result === "string") {
          console.log("Setting uploaded image, length:", reader.result.length);
          
          // Set the uploaded image
          setUploadedImage(reader.result);
          
          // Clear any previous errors
          setError("");
          
          // Success notification
          toast.success("Image uploaded successfully");
          
          // Focus the "Generate Cover from Image" button for better UX
          setTimeout(() => {
            const generateButton = document.querySelector('[data-image-analyze-button="true"]');
            if (generateButton) {
              (generateButton as HTMLButtonElement).focus();
            }
          }, 100);
        }
        
        // Dismiss loading toast
        toast.dismiss();
      };
      
      reader.onerror = () => {
        console.error("Error reading file");
        toast.error("Failed to read image file");
        toast.dismiss();
      };
      
      console.log("Starting to read file as data URL");
      reader.readAsDataURL(file);
    } else {
      console.log("No files selected or file selection canceled");
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

      console.log("Using JSON format for OpenAI enhance-prompt request");
      
      const response = await fetch(`${API_URL}/api/openai/enhance-prompt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: coverState.prompt,
          context: "Create a detailed book cover design prompt. Enhance with visual details, style references, mood, colors, and composition. Focus on professional book cover design elements.",
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
    console.log("handleExtractPrompt called, uploadedImage exists:", !!uploadedImage);
    
    if (!uploadedImage) {
      setError("Please upload an image first");
      toast.error("Please upload an image first");
      return;
    }

    try {
      setLoadingState("extractPrompt", true);
      setError("");
      toast.loading("Analyzing image to create prompt...");
      console.log("Starting to analyze image, image data length:", uploadedImage.length);

      // Call the OpenAI API for image description
      console.log("Preparing OpenAI extract-prompt request");
      const response = await fetch(`${API_URL}/api/openai/extract-prompt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: uploadedImage,
          context: "Create a detailed book cover design description based on this image. Focus on capturing the style, mood, colors, composition, and key visual elements that would make a great book cover. Consider aspects like typography placement, imagery arrangement, and overall aesthetic.",
        }),
      });

      console.log("API response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error response text:", errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("API response data:", data);
      
      if (data.extractedPrompt) {
        console.log("Extracted prompt:", data.extractedPrompt);
        
        // Update cover state with the extracted prompt
        updateCoverState({
          prompt: data.extractedPrompt,
          enhancedPrompt: data.extractedPrompt,
        });

        // Clear any previous errors
        setError("");
        
        // Save to prompt history
        saveToHistory(data.extractedPrompt);
        
        // Switch to text tab to show the generated prompt for editing
        setSourceTab("text");
        
        // Success notification
        toast.success("Prompt generated! You can now edit it before creating your cover.");
      } else {
        console.log("No extracted prompt in response");
        setError("Failed to generate prompt from image");
        toast.error("Failed to generate prompt from image");
      }
      
    } catch (err: any) {
      console.error("Error extracting prompt:", err);
      setError(err.message || "Failed to analyze image");
      toast.error("Error analyzing image");
    } finally {
      setLoadingState("extractPrompt", false);
      toast.dismiss();
    }
  };

  // Generate front cover - Make sure this works
  const handleGenerateFrontCover = async () => {
    console.log("[Button] Generate Front Cover clicked");
    toast.info("Generating front cover...");
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

      // Create a prompt that specifically avoids 3D book mockups and focuses on flat, professional cover art
      const expandedPrompt = `${coverState.prompt}. Create a flat, professional book cover design - NOT a 3D mockup. The image should be a straight-on view of just the cover art itself without any book perspective, spine, or 3D rendering. High quality 300 DPI with detailed artwork. No 3D effects, no physical book mockup.`;

      console.log("Generating front cover with dimensions:", frontCoverWidth, "x", frontCoverHeight);
      console.log("Using prompt:", expandedPrompt);
      console.log("API URL being called:", `${API_URL}/api/ideogram/generate-custom`);

      // Try directly with the Ideogram API endpoint
      try {
        // First try with the correct Ideogram API endpoint
        console.log("Using JSON format for Ideogram API request");
        const response = await fetch(`${API_URL}/api/ideogram/generate-custom`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: expandedPrompt,
            width: frontCoverWidth.toString(),
            height: frontCoverHeight.toString(),
            rendering_speed: "DEFAULT",
            negative_prompt: "text overlays, watermark, signature, blurry, low quality, distorted"
          }),
        });

        console.log("Ideogram API response status:", response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Ideogram API error response:", errorText);
          throw new Error(`Ideogram API error: ${response.status}`);
        }

        const data = await response.json();
        console.log("Ideogram API response data:", data);

        if (data.url) {
          setCoverState((prevState: CoverState) => ({
            ...prevState,
            frontCoverImage: normalizeUrl(data.url),
            promptHistory: [...prevState.promptHistory, prevState.prompt],
          }));
          
          toast.success("Front cover generated successfully with Ideogram");
          setActiveStep("front_cover");
          return;
        }
        throw new Error("Ideogram API failed to generate front cover");
      } catch (ideogramError) {
        console.error("Ideogram API error:", ideogramError);
        
        // Try fallback to book-cover endpoint
        try {
          console.log("Trying fallback to book-cover endpoint");
          console.log("Using JSON format for fallback API request");
          const fallbackResponse = await fetch(`${API_URL}/api/book-cover/generate-front`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompt: expandedPrompt,
              width: frontCoverWidth.toString(),
              height: frontCoverHeight.toString(),
              negative_prompt: "text overlays, watermark, signature, blurry, low quality, distorted"
            }),
          });

          console.log("Fallback API response status:", fallbackResponse.status);
          
          if (!fallbackResponse.ok) {
            const errorText = await fallbackResponse.text();
            console.error("Fallback API error response:", errorText);
            throw new Error(`Fallback API error: ${fallbackResponse.status}`);
          }

          const fallbackData = await fallbackResponse.json();
          console.log("Fallback API response data:", fallbackData);

          if (fallbackData.url) {
            setCoverState((prevState: CoverState) => ({
              ...prevState,
              frontCoverImage: normalizeUrl(fallbackData.url),
              promptHistory: [...prevState.promptHistory, prevState.prompt],
            }));
            
            toast.success("Front cover generated successfully with fallback");
            setActiveStep("front_cover");
            return;
          }
          throw new Error("Fallback API failed to generate front cover");
        } catch (fallbackError) {
          console.error("Fallback API error:", fallbackError);
          // Continue to placeholder
        }
      }

      // Fallback: use a placeholder
      const placeholderUrl = `https://placehold.co/${frontCoverWidth}x${frontCoverHeight}/3498DB-2980B9/FFFFFF/png?text=Book+Cover`;
      setCoverState((prevState: CoverState) => ({
        ...prevState,
        frontCoverImage: placeholderUrl,
        promptHistory: [...prevState.promptHistory, prevState.prompt],
      }));
      
      toast.warning("Using placeholder image due to API errors");
      setActiveStep("front_cover");
    } catch (err) {
      console.error("Error generating front cover:", err);
      setError("Failed to generate front cover");
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
      // Fallback to default colors
      const defaultColors = ["#4DB6AC", "#26A69A", "#00897B", "#00796B", "#00695C"];
      setDominantColors(defaultColors);
      updateBookDetails({ spineColor: defaultColors[0] });
    }
  };

  // Generate back cover
  const handleGenerateBackCover = async () => {
    console.log("[Button] Generate Back Cover clicked");
    toast.info("Generating back cover...");
    
    if (!coverState.backCoverPrompt) {
      setError("Please generate a back cover prompt first");
      return;
    }

    try {
      setLoadingState("generateBack", true);
      setError("");

      console.log("Generating back cover using prompt:", coverState.backCoverPrompt);
      
      // Calculate back cover dimensions
      const backCoverWidth = Math.round(coverState.dimensions.trimWidthInches * coverState.dimensions.dpi);
      const backCoverHeight = Math.round(coverState.dimensions.trimHeightInches * coverState.dimensions.dpi);

      // Create a prompt that specifically focuses on the back cover design
      const expandedPrompt = `${coverState.backCoverPrompt}. Create a flat, professional book back cover design - NOT a 3D mockup. The image should be a straight-on view suitable for text overlay. High quality 300 DPI with detailed artwork. No 3D effects, no physical book mockup.`;

      // First try with the Ideogram API
      try {
        console.log("Using JSON format for Ideogram API request");
        const response = await fetch(`${API_URL}/api/ideogram/generate-custom`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: expandedPrompt,
            width: backCoverWidth.toString(),
            height: backCoverHeight.toString(),
            rendering_speed: "DEFAULT",
            negative_prompt: "text overlays, watermark, signature, blurry, low quality, distorted"
          }),
        });

        console.log("Ideogram API response status:", response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Ideogram API error response:", errorText);
          throw new Error(`Ideogram API error: ${response.status}`);
        }

        const data = await response.json();
        console.log("Ideogram API response data:", data);

        if (data.url) {
          setCoverState((prevState) => ({
            ...prevState,
            backCoverImage: normalizeUrl(data.url),
            promptHistory: [...prevState.promptHistory, prevState.backCoverPrompt],
          }));
          
          toast.success("Back cover generated successfully");
          setActiveStep("back_cover");
          return;
        }
        throw new Error("Ideogram API failed to generate back cover");
      } catch (ideogramError) {
        console.error("Ideogram API error:", ideogramError);
        
        // Try fallback to book-cover endpoint
        try {
          console.log("Trying fallback to book-cover endpoint");
          const fallbackResponse = await fetch(`${API_URL}/api/book-cover/generate-back`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompt: expandedPrompt,
              width: backCoverWidth.toString(),
              height: backCoverHeight.toString(),
              negative_prompt: "text overlays, watermark, signature, blurry, low quality, distorted"
            }),
          });

          if (!fallbackResponse.ok) {
            const errorText = await fallbackResponse.text();
            console.error("Fallback API error response:", errorText);
            throw new Error(`Fallback API error: ${fallbackResponse.status}`);
          }

          const fallbackData = await fallbackResponse.json();
          console.log("Fallback API response data:", fallbackData);

          if (fallbackData.url) {
            setCoverState((prevState) => ({
              ...prevState,
              backCoverImage: normalizeUrl(fallbackData.url),
              promptHistory: [...prevState.promptHistory, prevState.backCoverPrompt],
            }));
            
            toast.success("Back cover generated successfully with fallback");
            setActiveStep("back_cover");
            return;
          }
          throw new Error("Fallback API failed to generate back cover");
        } catch (fallbackError) {
          console.error("Fallback API error:", fallbackError);
          // Continue to placeholder
        }
      }

      // Fallback: use a placeholder
      const placeholderUrl = `https://placehold.co/${backCoverWidth}x${backCoverHeight}/3498DB-2980B9/FFFFFF/png?text=Back+Cover`;
      setCoverState((prevState) => ({
        ...prevState,
        backCoverImage: placeholderUrl,
        promptHistory: [...prevState.promptHistory, prevState.backCoverPrompt],
      }));
      
      toast.warning("Using placeholder for back cover");
      setActiveStep("back_cover");
    } catch (error) {
      console.error("Error generating back cover:", error);
      setError("Failed to generate back cover");
      
      // Use a placeholder as fallback
      const placeholderWidth = Math.round(coverState.dimensions.trimWidthInches * coverState.dimensions.dpi);
      const placeholderHeight = Math.round(coverState.dimensions.trimHeightInches * coverState.dimensions.dpi);
      const placeholderUrl = `https://placehold.co/${placeholderWidth}x${placeholderHeight}/3498DB-2980B9/FFFFFF/png?text=Back+Cover`;
      setCoverState((prevState) => ({
        ...prevState,
        backCoverImage: placeholderUrl,
        promptHistory: [...prevState.promptHistory, prevState.backCoverPrompt],
      }));
      
      toast.warning("Using placeholder for back cover");
        } finally {
      setLoadingState("generateBack", false);
    }
    setActiveStep("back_cover");
  };

  // Generate back cover prompt
  const handleGenerateBackPrompt = async () => {
    console.log("[Button] Generate Back Cover Prompt clicked");
    
    if (!coverState.prompt || !coverState.frontCoverImage) {
      setError("Please generate a front cover first");
      return;
    }

    try {
      setLoadingState("generateBackPrompt", true);
      setError("");
      toast.loading("Generating back cover prompt...");

      // Create a context that includes the front cover prompt and design elements
      const context = {
        frontCoverPrompt: coverState.prompt,
        style: "Create a complementary back cover design that maintains visual harmony with the front cover while providing a suitable background for text overlay. The design should be subtle enough to not interfere with readability."
      };

      const response = await fetch(`${API_URL}/api/openai/generate-back-prompt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          context: context,
          frontPrompt: coverState.prompt
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.backPrompt) {
        updateCoverState({
          backCoverPrompt: data.backPrompt
        });
        toast.success("Back cover prompt generated successfully");
        saveToHistory(data.backPrompt);
      } else {
        // Fallback prompt generation if API fails
        const fallbackPrompt = `Create a complementary back cover design based on the front cover theme: ${coverState.prompt}. Use a subtle, elegant design that allows for text overlay while maintaining visual harmony with the front cover.`;
        updateCoverState({
          backCoverPrompt: fallbackPrompt
        });
        toast.warning("Using fallback prompt generation");
        saveToHistory(fallbackPrompt);
      }
      
      setActiveStep("back_prompt");
    } catch (err: any) {
      console.error("Error generating back cover prompt:", err);
      setError(err.message || "Failed to generate back cover prompt");
      
      // Fallback prompt generation on error
      const fallbackPrompt = `Create a complementary back cover design based on the front cover theme: ${coverState.prompt}. Use a subtle, elegant design that allows for text overlay while maintaining visual harmony with the front cover.`;
      updateCoverState({
        backCoverPrompt: fallbackPrompt
      });
      toast.warning("Using fallback prompt generation due to error");
      saveToHistory(fallbackPrompt);
      setActiveStep("back_prompt");
    } finally {
      setLoadingState("generateBackPrompt", false);
      toast.dismiss();
    }
  };

  // Handle start over functionality
  const handleStartOver = () => {
    // Reset the cover state to initial values
    setCoverState((prevState) => ({
      ...prevState,
      prompt: "",
      enhancedPrompt: "",
      backCoverPrompt: "",
      frontCoverImage: null,
      backCoverImage: null,
      fullWrapImage: null,
      // Keep the book details and dimensions
      promptHistory: prevState.promptHistory,
    }));

    // Reset UI state
    setActiveStep("prompt");
    setSourceTab("text");
    setUploadedImage(null);
    setError("");
    setIsLoading({
      enhancePrompt: false,
      extractPrompt: false,
      generateFront: false,
      generateBack: false,
      enhanceImage: false,
      assembleWrap: false,
      generateBackPrompt: false
    });

    // Clear file input if it exists
    const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
    if (fileInput) {
      fileInput.value = "";
    }

    toast.success("Started fresh cover generation");
  };

  // Enhance cover image using Real-ESRGAN
  const handleEnhanceCover = async () => {
    if (!coverState.frontCoverImage || !coverState.backCoverImage) {
      setError("Please generate both front and back covers first");
      return;
    }

    try {
      setLoadingState("enhanceImage", true);
      setError("");
      toast.loading("Enhancing cover images...");

      // Enhance front cover
      const frontEnhanceResponse = await enhanceBookCover({
        imageUrl: coverState.frontCoverImage,
        target: "front"
      });
      
      // Check enhancement status
      const frontEnhanceStatus = await checkEnhancementStatus(frontEnhanceResponse.predictionId);
      if (frontEnhanceStatus.status !== "succeeded") {
        throw new Error("Front cover enhancement failed");
      }

      // Enhance back cover
      const backEnhanceResponse = await enhanceBookCover({
        imageUrl: coverState.backCoverImage,
        target: "back"
      });
      
      // Check enhancement status
      const backEnhanceStatus = await checkEnhancementStatus(backEnhanceResponse.predictionId);
      if (backEnhanceStatus.status !== "succeeded") {
        throw new Error("Back cover enhancement failed");
      }

      // Update state with enhanced images
      updateCoverState({
        frontCoverImage: frontEnhanceStatus.output || coverState.frontCoverImage,
        backCoverImage: backEnhanceStatus.output || coverState.backCoverImage
      });

      toast.success("Cover images enhanced successfully");
      setActiveStep("enhance");
    } catch (err: any) {
      console.error("Error enhancing covers:", err);
      setError(err.message || "Failed to enhance covers");
      toast.error("Failed to enhance cover images");
    } finally {
      setLoadingState("enhanceImage", false);
      toast.dismiss();
    }
  };

  // Assemble full wrap cover
  const handleAssembleFullWrap = async () => {
    if (!coverState.frontCoverImage || !coverState.backCoverImage) {
      setError("Please generate both front and back covers first");
      return;
    }

    try {
      setLoadingState("assembleWrap", true);
      setError("");
      toast.loading("Assembling full wrap cover...");

      // Prepare interior images if available
      const interiorImagesUrls = coverState.interiorPages.length > 0 ? coverState.interiorPages : undefined;

      const response = await assembleFullCover({
        frontCoverUrl: coverState.frontCoverImage,
        dimensions: coverState.dimensions,
        spineText: coverState.bookDetails.spineText,
        spineColor: coverState.bookDetails.spineColor,
        interiorImagesUrls: interiorImagesUrls
      });

      if (response.status !== "succeeded") {
        throw new Error("Failed to assemble full wrap cover");
      }

      if (response.output) {
        updateCoverState({
          fullWrapImage: response.output
        });
        toast.success("Full wrap cover assembled successfully");
        setActiveStep("assemble");
      } else {
        throw new Error("No full wrap URL returned");
      }
    } catch (err: any) {
      console.error("Error assembling full wrap:", err);
      setError(err.message || "Failed to assemble full wrap cover");
      toast.error("Failed to assemble full wrap cover");
    } finally {
      setLoadingState("assembleWrap", false);
      toast.dismiss();
    }
  };

  // Handle download cover
  const handleDownloadCover = async () => {
    if (!coverState.fullWrapImage) {
      setError("Please assemble the full wrap cover first");
      return;
    }

    try {
      await downloadCover({
        url: coverState.fullWrapImage,
        format: "pdf",
        filename: "book-cover-wrap.pdf"
      });
      
      toast.success("Cover downloaded successfully");
    } catch (err: any) {
      console.error("Error downloading cover:", err);
      setError(err.message || "Failed to download cover");
      toast.error("Failed to download cover");
    }
  };

  return (
    <div className="container max-w-7xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Controls */}
        <div className="space-y-6">
          {/* Step 1: Describe Your Cover */}
          <Card className="relative overflow-hidden border-emerald-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent" />
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <PenSquare className="w-5 h-5" />
                Step 1: Describe Your Cover
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs defaultValue="image" value={sourceTab} onValueChange={(value) => setSourceTab(value as "text" | "image")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="text" className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4" />
                    Write Prompt
                  </TabsTrigger>
                  <TabsTrigger value="image" className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Generate from Image
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="space-y-4">
                  <Textarea
                    placeholder="Describe your book cover..."
                    value={coverState.prompt}
                    onChange={handlePromptChange}
                    className="min-h-[100px] bg-background/50"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleEnhancePrompt}
                      disabled={isLoading.enhancePrompt}
                      className="w-full bg-violet-600 hover:bg-violet-700"
                    >
                      {isLoading.enhancePrompt ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      Enhance Prompt
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="image" className="space-y-4">
                  <div className="text-sm text-muted-foreground mb-4">
                    <Info className="w-4 h-4 inline-block mr-2" />
                    Upload a reference image and our AI will analyze it to create a detailed prompt. You can then edit the prompt before generating your cover.
                  </div>
                  
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-6 text-center dropzone transition-colors",
                      uploadedImage ? "border-violet-500 bg-violet-500/5" : "border-gray-600 hover:border-violet-500"
                    )}
                  >
                    {uploadedImage ? (
                      <div className="space-y-4">
                        <img
                          src={uploadedImage}
                          alt="Uploaded reference"
                          className="max-h-[200px] mx-auto rounded-lg"
                        />
                        <Button
                          onClick={() => setUploadedImage(null)}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Remove Image
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <UploadCloud className="w-12 h-12 mx-auto text-muted-foreground" />
                        <div className="text-sm text-muted-foreground">
                          Drag and drop an image here, or click to select
                        </div>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleExtractorImageUpload}
                          className="hidden"
                          id="image-upload"
                        />
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById("image-upload")?.click()}
                          className="bg-violet-600 hover:bg-violet-700 text-white"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Image
                        </Button>
                      </div>
                    )}
                  </div>

                  {uploadedImage && (
                    <Button
                      onClick={handleExtractPrompt}
                      disabled={isLoading.extractPrompt}
                      className="w-full bg-violet-600 hover:bg-violet-700"
                      data-image-analyze-button="true"
                    >
                      {isLoading.extractPrompt ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Wand2 className="w-4 h-4 mr-2" />
                      )}
                      Generate Prompt from Image
                    </Button>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Cover Specifications */}
          <Card className="relative overflow-hidden border-emerald-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent" />
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Settings className="w-5 h-5" />
                Cover Specifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium mb-1">Trim Size:</div>
                  <div className="text-lg">{coverState.bookDetails.trimSize}</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Paper Type:</div>
                  <div className="text-lg">{coverState.bookDetails.paperType}</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Page Count:</div>
                  <div className="text-lg">{coverState.bookDetails.pageCount} pages</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Spine Width:</div>
                  <div className="text-lg">{coverState.dimensions.spineWidthInches}"</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Has Spine Text:</div>
                  <div className="text-lg">{coverState.bookDetails.spineText ? "Yes" : "No"}</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Bleed:</div>
                  <div className="text-lg">{coverState.bookDetails.hasBleed ? "Yes (0.125\")" : "No"}</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Resolution:</div>
                  <div className="text-lg">{coverState.dimensions.width} × {coverState.dimensions.height} px</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Status:</div>
                  <div className="text-lg text-emerald-500">Ready</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Preview */}
        <div className="space-y-6">
          <Card className="relative overflow-hidden border-emerald-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent" />
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Layout className="w-5 h-5" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {coverState.frontCoverImage ? (
                <div className="space-y-4">
                  <img
                    src={coverState.frontCoverImage}
                    alt="Front cover preview"
                    className="w-full rounded-lg shadow-lg"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleEnhanceCover}
                      disabled={isLoading.enhanceImage}
                      className="flex-1 bg-violet-600 hover:bg-violet-700"
                    >
                      {isLoading.enhanceImage ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      Enhance Cover
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mb-4" />
                  <p>Your generated book cover will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default KDPFullWrapGenerator;
