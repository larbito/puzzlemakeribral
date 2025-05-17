import React, { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  Download,
  Edit3,
  FileText,
  ImageIcon,
  Info,
  Layout,
  Lightbulb,
  Loader2,
  LucideBook,
  Palette,
  PlusCircle,
  RotateCw,
  Ruler,
  Sparkles,
  Undo,
  Upload,
  UploadCloud,
  Wand2,
  X,
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
  enhanceBookCover,
  checkEnhancementStatus,
} from "@/lib/bookCoverApi";
import { normalizeUrl } from "@/lib/utils";

// API URL configuration - Remove the /api to avoid duplication
const API_URL = "https://puzzlemakeribral-production.up.railway.app";

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
  useMirroredFrontCover?: boolean;
  backCoverPrompt?: string;
}

// Step type
type GenerationStep =
  | "prompt"
  | "details"
  | "generate"
  | "enhance"
  | "assemble";

// KDP Full Wrap Book Cover Generator component
const KDPCoverWizard = () => {
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
    generateBackPrompt: false
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
    console.log("handleExtractorImageUpload called", e.target.files?.length);
    
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      console.log("File selected:", file.name, file.type, file.size);
      
      const reader = new FileReader();
      
      reader.onloadend = () => {
        console.log("File read completed");
        if (typeof reader.result === "string") {
          console.log("Setting uploaded image, length:", reader.result.length);
          setUploadedImage(reader.result);
          toast.success("Image uploaded successfully");
        }
      };
      
      reader.onerror = () => {
        console.error("Error reading file");
        toast.error("Failed to read image file");
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
      toast.loading("Analyzing image...");
      console.log("Starting to analyze image, image data length:", uploadedImage.length);

      // Call the OpenAI API for image description
      console.log("Preparing OpenAI extract-prompt request to:", `${API_URL}/api/openai/extract-prompt`);
      const response = await fetch(`${API_URL}/api/openai/extract-prompt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: uploadedImage,
          context: "Describe this book cover image in detail for generating a similar style. Focus on visual elements, style, colors, composition, and mood.",
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
        updateCoverState({
          prompt: data.extractedPrompt,
          enhancedPrompt: data.extractedPrompt,
        });

        toast.success("Prompt extracted successfully");
        saveToHistory(data.extractedPrompt);
        setActiveStep("details");
      } else {
        console.log("No extracted prompt in response, using fallback");
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
      toast.error(`Error: ${err.message || "Failed to analyze image"}`);
      toast.success("Using default prompt template as fallback");
      saveToHistory(genericPrompt);
      setActiveStep("details");
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
          handleGenerateBackCover(normalizeUrl(data.url));
          setActiveStep("generate");
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
            handleGenerateBackCover(normalizeUrl(fallbackData.url));
            setActiveStep("generate");
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
      handleGenerateBackCover(placeholderUrl);
      setActiveStep("generate");
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
  const handleGenerateBackCover = async (frontCoverUrl = coverState.frontCoverImage) => {
    console.log("[Button] Generate Back Cover clicked");
    toast.info("Generating back cover...");
    if (!frontCoverUrl) {
      setError("Please generate a front cover first");
      return;
    }

    try {
      setLoadingState("generateBack", true);
      setError("");

      console.log("Generating back cover using front cover URL:", frontCoverUrl);
      
      // First try the API if available
      try {
        console.log("Creating FormData for back cover request");
        const backCoverFormData = new FormData();
        backCoverFormData.append('frontCoverUrl', frontCoverUrl);
        backCoverFormData.append('width', (coverState.dimensions.width / 2).toString());
        backCoverFormData.append('height', coverState.dimensions.height.toString());
        
        console.log("Sending request to generate back cover with FormData");
        const response = await fetch(`${API_URL}/api/book-cover/generate-back`, {
          method: "POST",
          body: backCoverFormData,
        });
        
        console.log("Back cover API response status:", response.status);
        
        if (!response.ok) {
          console.error("Backend error:", response.status, response.statusText);
          throw new Error(`Backend error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Back cover response data:", data);
        
        if (data.status === 'success' && data.url) {
          console.log("Back cover URL found:", data.url);
          
          const backCoverUrl = normalizeUrl(data.url);
          console.log("Normalized back cover URL:", backCoverUrl);
          
          // Use fallback URL if available
          const fallbackUrl = data.fallbackUrl || null;
          console.log("Fallback URL available:", !!fallbackUrl);

          // Create a simple mirror effect if we need to use the front cover as a fallback
          const mirrorFrontCover = () => {
            console.log("Creating mirrored version of front cover as fallback");
            setCoverState((prevState) => ({
              ...prevState,
              backCoverImage: frontCoverUrl,
              // Add a flag to indicate this is a fallback, UI can use this to apply filters
              useMirroredFrontCover: true
            }));
            toast.warning("Using mirrored front cover as fallback");
          };
          
          // Try to load the image first to validate it works
          const img = new Image();
          
          // Set a timeout to handle cases where the image loading hangs
          const imageLoadTimeout = setTimeout(() => {
            console.warn("Image load timed out, using fallback");
            if (fallbackUrl) {
              setCoverState((prevState) => ({
                ...prevState,
                backCoverImage: fallbackUrl
              }));
              toast.warning("Using data URL fallback for back cover");
            } else {
              mirrorFrontCover();
            }
          }, 5000); // 5 second timeout
          
          img.onload = () => {
            clearTimeout(imageLoadTimeout);
            console.log("Back cover image loaded successfully");
            
            setCoverState((prevState) => ({
              ...prevState,
              backCoverImage: backCoverUrl,
              useMirroredFrontCover: false
            }));
            toast.success("Back cover generated successfully");
          };
          
          img.onerror = () => {
            clearTimeout(imageLoadTimeout);
            console.error("Failed to load back cover image");
            
            if (fallbackUrl) {
              console.log("Using data URL fallback");
              setCoverState((prevState) => ({
                ...prevState,
                backCoverImage: fallbackUrl,
                useMirroredFrontCover: false
              }));
              toast.warning("Using data URL fallback for back cover");
            } else {
              mirrorFrontCover();
            }
          };
          
          img.src = backCoverUrl || '';
          return;
        } else {
          console.error("Invalid response format:", data);
          throw new Error("Invalid response from server");
        }
      } catch (apiError) {
        console.error("API error generating back cover:", apiError);
        // Continue to fallback
      }

      // Fallback: use a placeholder for the back cover
      const backCoverWidth = Math.round(coverState.dimensions.trimWidthInches * coverState.dimensions.dpi);
      const backCoverHeight = Math.round(coverState.dimensions.trimHeightInches * coverState.dimensions.dpi);
      
      const placeholderBackCover = `https://placehold.co/${backCoverWidth}x${backCoverHeight}/3498DB-2980B9/FFFFFF/png?text=Back+Cover`;
      
      console.log("Using placeholder back cover:", placeholderBackCover);
      
      setCoverState((prevState) => ({
        ...prevState,
        backCoverImage: placeholderBackCover,
        useMirroredFrontCover: false
      }));

      toast.success("Using placeholder for back cover");
    } catch (error) {
      console.error("Error generating back cover:", error);
      setError("Failed to generate back cover. Using front cover as fallback.");
      
      // Use front cover as fallback
      setCoverState((prevState) => ({
        ...prevState,
        backCoverImage: frontCoverUrl,
        useMirroredFrontCover: true
      }));
      
      toast.warning("Using mirrored front cover as fallback");
    } finally {
      setLoadingState("generateBack", false);
    }
  };

  // Enhance image with AI - fixed to work directly
  const handleEnhanceImage = async (target: "front" | "back") => {
    console.log(`[Button] Enhance ${target} Cover clicked`);
    toast.info(`Enhancing ${target} cover...`);
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
      
      // Start the enhancement process
      const enhancementResult = await enhanceBookCover({
        imageUrl,
        target
      });

      // Create a toast to show progress
      const toastId = toast.loading(`Enhancing ${target} cover...`);

      // Poll for completion
      let retries = 0;
      const maxRetries = 60; // 5 minutes max (with 5s interval)
      const pollInterval = 5000; // 5 seconds

      while (retries < maxRetries) {
        try {
          const status = await checkEnhancementStatus(enhancementResult.statusEndpoint);

          if (status.status === 'completed' && status.imageUrl) {
            // Update the appropriate cover image
            setCoverState((prevState) => ({
              ...prevState,
              [target === "front" ? "frontCoverImage" : "backCoverImage"]: normalizeUrl(status.imageUrl),
            }));
            
            toast.dismiss(toastId);
            toast.success(`${target === "front" ? "Front" : "Back"} cover enhanced successfully`);
            setActiveStep("enhance");
            return;
          } else if (status.status === 'failed') {
            throw new Error(status.error || 'Enhancement failed');
          }

          // Wait before checking again
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          retries++;
        } catch (error) {
          console.error('Error checking enhancement status:', error);
          toast.dismiss(toastId);
          throw error;
        }
      }

      // If we get here, we've timed out
      throw new Error('Enhancement timed out');
    } catch (error) {
      console.error("Error enhancing image:", error);
      setError(`Failed to enhance ${target} cover. Using original image.`);
      toast.error(`Error enhancing ${target} cover`);
    } finally {
      setLoadingState("enhanceImage", false);
    }
  };

  // Assemble full wrap cover
  const handleAssembleFullCover = async () => {
    console.log("[Button] Assemble Full Wrap Cover clicked");
    toast.info("Assembling full wrap cover...");
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

      // Try client-side canvas assembly
      try {
        console.log("Using client-side canvas assembly");
        
        // Create a canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error("Could not create canvas context");
        }
        
        // Set canvas dimensions to match the full wrap cover
        canvas.width = coverState.dimensions.width;
        canvas.height = coverState.dimensions.height;
        
        // Calculate positions
        const frontCoverWidth = Math.round(coverState.dimensions.trimWidthInches * coverState.dimensions.dpi);
        const spineWidth = coverState.dimensions.spine;
        
        // Create images for front and back covers
        const frontImage = new Image();
        const backImage = new Image();
        
        // Promise for loading both images
        const imagesLoaded = new Promise((resolve, reject) => {
          let imagesLoadedCount = 0;
          
          const onLoad = () => {
            imagesLoadedCount++;
            if (imagesLoadedCount === 2) resolve(true);
          };
          
          const onError = () => {
            console.error("Error loading image for assembly");
            reject(new Error("Failed to load images for assembly"));
          };
          
          // Load front cover
          frontImage.onload = onLoad;
          frontImage.onerror = onError;
          frontImage.src = normalizeUrl(coverState.frontCoverImage) || '';
          
          // Load back cover
          backImage.onload = onLoad;
          backImage.onerror = onError;
          backImage.src = normalizeUrl(coverState.backCoverImage) || '';
        });
        
        // Wait for images to load
        console.log("Waiting for images to load...");
        await imagesLoaded;
        console.log("Images loaded successfully");
        
        // Fill background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw back cover (left side)
        ctx.drawImage(backImage, 0, 0, frontCoverWidth, canvas.height);
        
        // Draw spine (middle)
        ctx.fillStyle = coverState.bookDetails.spineColor || '#000000';
        ctx.fillRect(frontCoverWidth, 0, spineWidth, canvas.height);
        
        // Add spine text if specified
        if (coverState.bookDetails.spineText) {
          ctx.save();
          ctx.translate(frontCoverWidth + spineWidth / 2, canvas.height / 2);
          ctx.rotate(Math.PI / 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.font = `bold ${Math.min(24, spineWidth * 0.8)}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(coverState.bookDetails.spineText, 0, 0);
          ctx.restore();
        }
        
        // Draw front cover (right side)
        ctx.drawImage(
          frontImage, 
          frontCoverWidth + spineWidth, 
          0, 
          frontCoverWidth, 
          canvas.height
        );
        
        // Add labels for front and back
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(frontCoverWidth + spineWidth + frontCoverWidth - 60, canvas.height - 25, 50, 20);
        ctx.fillRect(10, canvas.height - 25, 50, 20);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        ctx.fillText('Front', frontCoverWidth + spineWidth + frontCoverWidth - 50, canvas.height - 12);
        ctx.fillText('Back', 20, canvas.height - 12);
        
        // Convert canvas to data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        
        setCoverState((prevState) => ({
          ...prevState,
          fullWrapImage: dataUrl,
        }));
        
        toast.success("Full wrap cover assembled successfully");
        setActiveStep("assemble");
        return;
      } catch (canvasError) {
        console.error("Canvas assembly error:", canvasError);
        // Continue to API fallback
      }

      // Try the backend API as fallback
      try {
        const result = await assembleFullCover({
          frontCoverUrl: coverState.frontCoverImage,
          dimensions: coverState.dimensions,
          spineText: coverState.bookDetails.spineText,
          spineColor: coverState.bookDetails.spineColor,
          interiorImagesUrls: coverState.interiorPages
        });

        if (result.fullCover) {
          setCoverState((prevState) => ({
            ...prevState,
            fullWrapImage: normalizeUrl(result.fullCover),
          }));
          
          toast.success("Full wrap cover assembled successfully");
          setActiveStep("assemble");
          return;
        }
        throw new Error("Failed to assemble full cover");
      } catch (apiError) {
        console.error("API error assembling full cover:", apiError);
        // Continue to fallback
      }

      // Fallback: create a simple placeholder
      const fullWrapWidth = coverState.dimensions.width;
      const fullWrapHeight = coverState.dimensions.height;
      const placeholderUrl = `https://placehold.co/${fullWrapWidth}x${fullWrapHeight}/3498DB-2980B9/FFFFFF/png?text=Full+Wrap+Cover`;
      
      setCoverState((prevState) => ({
        ...prevState,
        fullWrapImage: placeholderUrl,
      }));
      
      toast.warning("Using placeholder for full wrap cover");
      setActiveStep("assemble");
    } catch (err) {
      console.error("Error assembling full cover:", err);
      setError("Failed to assemble full wrap cover");
      toast.error("Error assembling full wrap cover");
    } finally {
      setLoadingState("assembleWrap", false);
    }
  };

  // Handle downloading the full wrap cover
  const handleDownloadFullCover = async () => {
    console.log("[Button] Download Full Cover clicked");
    toast.info("Downloading full wrap cover...");
    if (!coverState.fullWrapImage) {
      setError("No full wrap cover to download");
      return;
    }

    try {
      // Try to use the API download function first
      try {
        const response = await fetch(`${API_URL}/api/book-cover/download`, {
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

  // Image to Prompt Button Component
  const ImageToPromptButton = () => {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return;
      
      const file = e.target.files[0];
      setIsUploading(true);
      
      try {
        // Read file as data URL
        const reader = new FileReader();
        
        reader.onload = async (event) => {
          if (!event.target?.result) {
            toast.error("Failed to read image file");
            setIsUploading(false);
            return;
          }
          
          const imageData = event.target.result as string;
          
          toast.info("Analyzing image to generate prompt...");
          
          // Call the OpenAI API to extract a prompt from the image
          console.log("Sending image for prompt extraction");
          try {
            const response = await fetch(`${API_URL}/api/openai/extract-prompt`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                imageUrl: imageData,
                context: "Create a detailed book cover design description based on this image. Focus on capturing the style, mood, colors, and composition that would make a great book cover. Consider elements like typography, imagery, layout, and overall aesthetic."
              }),
            });
            
            if (!response.ok) {
              throw new Error(`API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.extractedPrompt) {
              // Update the prompt field with the extracted prompt
              updateCoverState({
                prompt: data.extractedPrompt,
                enhancedPrompt: data.extractedPrompt,
              });
              
              // Switch to the prompt tab
              setActiveStep("prompt");
              
              // Also set uploaded image
              setUploadedImage(imageData);
              setSourceTab("image");
              
              toast.success("Prompt generated from image!");
            } else {
              toast.error("No prompt was extracted from the image");
            }
          } catch (error) {
            console.error("Error extracting prompt from image:", error);
            toast.error("Failed to analyze image");
          }
          
          setIsUploading(false);
        };
        
        reader.onerror = () => {
          toast.error("Failed to read image file");
          setIsUploading(false);
        };
        
        reader.readAsDataURL(file);
      } catch (error) {
        console.error("Error handling image upload:", error);
        toast.error("Error uploading image");
        setIsUploading(false);
      }
    };

    const handleButtonClick = () => {
      fileInputRef.current?.click();
    };

    return (
      <>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImageUpload}
        />
        <Button
          onClick={handleButtonClick}
          className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 w-full py-4"
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing Image...
            </>
          ) : (
            <>
              <Upload className="h-5 w-5" />
              Image to Prompt
            </>
          )}
        </Button>
      </>
    );
  };

  // Generate back cover prompt based on front cover
  const handleGenerateBackPrompt = async () => {
    try {
      setLoadingState("generateBackPrompt", true);
      setError("");

      const response = await fetch(`${API_URL}/api/openai/enhance-prompt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: coverState.prompt,
          context: "Based on this front cover design prompt, create a matching back cover description. The back cover should complement the front cover's style and theme while being more subdued. Include suggestions for layout, text placement, and any imagery that would work well with the front cover design.",
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.enhancedPrompt) {
        updateCoverState({
          backCoverPrompt: data.enhancedPrompt,
        });
        toast.success("Back cover prompt generated successfully");
      } else {
        setError("No back cover prompt returned");
      }
    } catch (err: any) {
      console.error("Error generating back cover prompt:", err);
      setError(err.message || "Failed to generate back cover prompt");
      toast.error("Failed to generate back cover prompt");
    } finally {
      setLoadingState("generateBackPrompt", false);
    }
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
              <Upload className="h-5 w-5" />
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
                    <Upload className="mr-2 h-5 w-5 text-indigo-400" />
                    <span>Step 5: Download Full Wrap Cover</span>
                  </>
                )}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6">
              {/* Step 1: Prompt Section */}
              {activeStep === "prompt" && (
                <div className="space-y-6">
                  <Tabs defaultValue={sourceTab} onValueChange={(value) => setSourceTab(value as "text" | "image")}>
                    <TabsList className="grid w-full grid-cols-2 bg-zinc-900/50">
                      <TabsTrigger value="text" className="data-[state=active]:bg-indigo-600">
                        <Edit3 className="h-4 w-4 mr-2" />
                        Write Prompt
                      </TabsTrigger>
                      <TabsTrigger value="image" className="data-[state=active]:bg-indigo-600">
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Generate from Image
                      </TabsTrigger>
                    </TabsList>

                    {/* Show extracted prompt if available */}
                    {uploadedImage && coverState.prompt && (
                      <div className="mt-4 p-4 rounded-lg bg-indigo-950/20 border border-indigo-700/30">
                        <h4 className="text-sm font-medium text-indigo-300 mb-2 flex items-center">
                          <Wand2 className="h-4 w-4 mr-2" />
                          Generated Prompt
                        </h4>
                        <p className="text-sm text-zinc-300">{coverState.prompt}</p>
                        <div className="mt-3 flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleEnhancePrompt}
                            className="text-xs bg-indigo-900/50 border-indigo-700/50 hover:bg-indigo-800/50"
                          >
                            <Sparkles className="h-3 w-3 mr-1" />
                            Enhance
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Show back cover prompt if available */}
                    {coverState.backCoverPrompt && (
                      <div className="mt-4 p-4 rounded-lg bg-violet-950/20 border border-violet-700/30">
                        <h4 className="text-sm font-medium text-violet-300 mb-2 flex items-center">
                          <BookOpen className="h-4 w-4 mr-2" />
                          Back Cover Prompt
                        </h4>
                        <p className="text-sm text-zinc-300">{coverState.backCoverPrompt}</p>
                        <div className="mt-3 flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerateBackCover()}
                            disabled={isLoading.generateBack}
                            className="text-xs bg-violet-900/50 border-violet-700/50 hover:bg-violet-800/50"
                          >
                            {isLoading.generateBack ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <ImageIcon className="h-3 w-3 mr-1" />
                                Generate Back Cover
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Rest of the existing tabs content */}
                    {/* ... existing code ... */}
                  </Tabs>

                  {/* Add Generate Back Cover Prompt button after front cover is generated */}
                  {coverState.frontCoverImage && !coverState.backCoverPrompt && (
                    <div className="mt-4">
                      <Button
                        onClick={handleGenerateBackPrompt}
                        disabled={isLoading.generateBackPrompt}
                        className="w-full bg-gradient-to-r from-violet-600 to-violet-500 text-white hover:from-violet-700 hover:to-violet-600"
                      >
                        {isLoading.generateBackPrompt ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating Back Cover Prompt...
                          </>
                        ) : (
                          <>
                            <BookOpen className="mr-2 h-4 w-4" />
                            Generate Back Cover Prompt
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
                        console.log("Continue to Generate button clicked!");
                        // Force dimension calculation before proceeding
                        handleCalculateDimensions();
                        
                        // After a small delay, start the generation process
                        setTimeout(() => {
                          handleGenerateFrontCover();
                        }, 300);
                      }}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:from-indigo-700 hover:to-indigo-600 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Continue to Generate
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
                            src={normalizeUrl(coverState.frontCoverImage) || ''}
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
                          <>
                            <img
                              src={normalizeUrl(coverState.backCoverImage) || ''}
                              alt="Back Cover"
                              className={`w-full h-full object-cover ${coverState.useMirroredFrontCover ? 'transform scale-x-[-1] opacity-70 hue-rotate-180' : ''}`}
                              onError={(e) => {
                                console.error("Error loading back cover image", e);
                                // If the back cover fails to load, use the front cover with a filter as fallback
                                if (coverState.frontCoverImage) {
                                  e.currentTarget.src = normalizeUrl(coverState.frontCoverImage) || '';
                                  e.currentTarget.style.filter = "hue-rotate(180deg) opacity(0.7)";
                                  e.currentTarget.style.transform = "scaleX(-1)"; // flip horizontally
                                } else {
                                  // Show error state
                                  e.currentTarget.style.display = 'none';
                                  const errorDiv = document.createElement('div');
                                  errorDiv.className = 'flex items-center justify-center h-full';
                                  errorDiv.innerHTML = '<span class="text-red-500 text-sm">Error loading image</span>';
                                  e.currentTarget.parentNode?.appendChild(errorDiv);
                                }
                              }}
                            />
                            {coverState.useMirroredFrontCover && (
                              <div className="absolute top-2 left-2 bg-amber-500 text-white px-2 py-1 text-xs rounded-full">
                                Mirrored Fallback
                              </div>
                            )}
                            <div className="absolute bottom-2 right-2 bg-indigo-500 text-white px-2 py-1 text-xs rounded-full">
                              Back Cover
                            </div>
                          </>
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
                        {isLoading.generateBack ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <RotateCw className="mr-2 h-4 w-4" />
                            Regenerate Back
                          </>
                        )}
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
                      Back to Details
                    </Button>

                    <Button
                      onClick={() => setActiveStep("enhance")}
                      disabled={
                        !coverState.frontCoverImage ||
                        !coverState.backCoverImage ||
                        isLoading.generateFront ||
                        isLoading.generateBack
                      }
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:from-indigo-700 hover:to-indigo-600 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {isLoading.generateFront || isLoading.generateBack ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          Continue to Enhance
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </>
                      )}
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
                          {coverState.frontCoverImage ? (
                            <img
                              src={normalizeUrl(coverState.frontCoverImage) || ''}
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
                          {coverState.backCoverImage ? (
                            <img
                              src={normalizeUrl(coverState.backCoverImage) || ''}
                              alt="Back Cover"
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
                      Back to Covers
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
                      {isLoading.assembleWrap ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Assembling Cover...
                        </>
                      ) : (
                        <>
                          Generate Full Wrap
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 5: Download */}
              {activeStep === "assemble" && (
                <div className="space-y-6">
                  <div className="rounded-lg bg-zinc-900/50 p-4 border border-zinc-700/50 space-y-4">
                    <h3 className="font-medium flex items-center text-zinc-300">
                      <Upload className="h-5 w-5 mr-2 text-cyan-400" />
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
                            src={normalizeUrl(coverState.fullWrapImage) || ''}
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
                        href={normalizeUrl(coverState.fullWrapImage) || '#'}
                        download="kdp-full-wrap-cover.jpg"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-medium rounded-md px-6 py-3 flex items-center justify-center text-center ${!coverState.fullWrapImage ? "opacity-50 cursor-not-allowed" : "hover:from-indigo-700 hover:to-indigo-600"}`}
                        onClick={(e) =>
                          !coverState.fullWrapImage && e.preventDefault()
                        }
                      >
                        <Upload className="h-5 w-5 mr-2" />
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
                    src={normalizeUrl(coverState.fullWrapImage) || ''} 
                    alt="Generated Full Wrap Cover"
                    className="max-w-full max-h-[450px] rounded-md border border-zinc-700/60 shadow-lg"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                    <a 
                      href={normalizeUrl(coverState.fullWrapImage) || '#'} 
                        download="kdp-full-wrap-cover.jpg"
                        target="_blank"
                        rel="noopener noreferrer"
                      className="bg-cyan-500 hover:bg-cyan-600 text-black font-medium rounded-md px-4 py-2 flex items-center text-sm"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Download Cover
                      </a>
                    </div>
                </div>
              ) : coverState.frontCoverImage && coverState.backCoverImage ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2 bg-zinc-900/50 p-2 rounded-md">
                    <div className="relative w-[150px]">
                      <img
                        src={normalizeUrl(coverState.frontCoverImage) || ''}
                        alt="Generated Front Cover"
                        className="w-full h-auto rounded-md border border-zinc-700/60 shadow-lg"
                      />
                      <div className="absolute bottom-2 right-2 bg-indigo-500 text-white px-2 py-1 text-xs rounded-full">
                        Front
                      </div>
                    </div>
                    <div className="relative w-[150px]">
                      <img
                        src={normalizeUrl(coverState.backCoverImage) || ''}
                        alt="Generated Back Cover"
                        className="w-full h-auto rounded-md border border-zinc-700/60 shadow-lg"
                      />
                      <div className="absolute bottom-2 right-2 bg-indigo-500 text-white px-2 py-1 text-xs rounded-full">
                        Back
                      </div>
                    </div>
                  </div>
                  <div className="text-center text-sm text-zinc-400">
                    Front and back covers generated successfully. Continue to assemble the full wrap cover.
                  </div>
                </div>
              ) : coverState.frontCoverImage ? (
                <div className="relative">
                  <img
                    src={normalizeUrl(coverState.frontCoverImage) || ''}
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
                  <Upload className="h-5 w-5 mr-2" />
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

export default KDPCoverWizard;
