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
  Wand2,
  BookOpenCheck,
  PenSquare,
  AlignLeft,
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
  includeISBN?: boolean;
  // New properties to track step completion
  stepsCompleted: {
    bookSettings: boolean;
    frontCover: boolean;
    backCover: boolean;
    spineDesign: boolean;
    fullPreview: boolean;
  };
}

// Step type
type GenerationStep =
  | "bookSettings"  // Step 1: Book Settings
  | "frontCover"    // Step 2: Front Cover
  | "backCover"     // Step 3: Back Cover
  | "spineDesign"   // Step 4: Spine Design
  | "fullPreview"   // Step 5: Full Preview
  | "export";       // Step 6: Export

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
      spineColor: "#6366F1", // Changed to indigo to match new color scheme
    },
    promptHistory: [],
    includeISBN: false,
    // Initialize step completion state
    stepsCompleted: {
      bookSettings: false,
      frontCover: false,
      backCover: false,
      spineDesign: false,
      fullPreview: false
    }
  });

  // UI state
  const [activeStep, setActiveStep] = useState<GenerationStep>("bookSettings");
  const [sourceTab, setSourceTab] = useState<"text" | "image">("text");
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({
    enhancePrompt: false,
    extractPrompt: false,
    generateFront: false,
    generateBack: false,
    enhanceImage: false,
    assembleWrap: false,
    calculateDimensions: false,
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

  // Add a new state variable to track if book settings are calculated
  const [settingsComplete, setSettingsComplete] = useState<boolean>(false);

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
      setLoadingState("calculateDimensions", true);
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
          stepsCompleted: {
            ...prevState.stepsCompleted,
            bookSettings: true  // Mark the book settings step as completed
          }
        }));
        
        toast.success("Cover dimensions calculated successfully!");
      }
    } catch (error) {
      console.error("Error calculating dimensions:", error);
      setError("Failed to calculate dimensions. Please try again.");
      toast.error("Failed to calculate dimensions. Please check your inputs and try again.");
    } finally {
      setLoadingState("calculateDimensions", false);
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
        
        // Use the new step name
        setActiveStep("frontCover");
        
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
            stepsCompleted: {
              ...prevState.stepsCompleted,
              frontCover: true  // Mark the front cover step as completed
            }
          }));
          
          toast.success("Front cover generated successfully with Ideogram");
          handleGenerateBackCover(normalizeUrl(data.url));
          setActiveStep("frontCover");
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
              stepsCompleted: {
                ...prevState.stepsCompleted,
                frontCover: true  // Mark the front cover step as completed
              }
            }));
            
            toast.success("Front cover generated successfully with fallback");
            handleGenerateBackCover(normalizeUrl(fallbackData.url));
            setActiveStep("frontCover");
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
        stepsCompleted: {
          ...prevState.stepsCompleted,
          frontCover: true  // Mark the front cover step as completed
        }
      }));
      
      toast.warning("Using placeholder image due to API errors");
      handleGenerateBackCover(placeholderUrl);
      setActiveStep("frontCover");
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
              useMirroredFrontCover: false,
              stepsCompleted: {
                ...prevState.stepsCompleted,
                backCover: true  // Mark the back cover step as completed
              }
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
        useMirroredFrontCover: false,
        stepsCompleted: {
          ...prevState.stepsCompleted,
          backCover: true  // Mark the back cover step as completed
        }
      }));

      toast.success("Using placeholder for back cover");
    } catch (error) {
      console.error("Error generating back cover:", error);
      setError("Failed to generate back cover. Using front cover as fallback.");
      
      // Use front cover as fallback
      setCoverState((prevState) => ({
        ...prevState,
        backCoverImage: frontCoverUrl,
        useMirroredFrontCover: true,
        stepsCompleted: {
          ...prevState.stepsCompleted,
          backCover: true  // Mark the back cover step as completed
        }
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
            setActiveStep("spineDesign");
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
          stepsCompleted: {
            ...prevState.stepsCompleted,
            fullPreview: true  // Mark the full preview step as completed
          }
        }));
        
        toast.success("Full wrap cover assembled successfully");
        setActiveStep("fullPreview");
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
            stepsCompleted: {
              ...prevState.stepsCompleted,
              fullPreview: true  // Mark the full preview step as completed
            }
          }));
          
          toast.success("Full wrap cover assembled successfully");
          setActiveStep("fullPreview");
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
        stepsCompleted: {
          ...prevState.stepsCompleted,
          fullPreview: true  // Mark the full preview step as completed
        }
      }));
      
      toast.warning("Using placeholder for full wrap cover");
      setActiveStep("fullPreview");
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
    // Use the new step type
    if (activeStep === "frontCover") {
      // Keep focus on the current step
    }
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
              
              // Switch to the front cover tab
              setActiveStep("frontCover");
              
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
          className="flex items-center gap-2 bg-gradient-to-r from-violet-900/80 to-indigo-900/80 hover:from-violet-800/80 hover:to-indigo-800/80 text-white border border-violet-600/20 w-full py-4 transition-all"
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
              Generate from Image
            </>
          )}
        </Button>
      </>
    );
  };

  // Add the missing markStepCompleted function
  const markStepCompleted = (step: keyof CoverState["stepsCompleted"]) => {
    setCoverState(prev => ({
      ...prev,
      stepsCompleted: {
        ...prev.stepsCompleted,
        [step]: true
      }
    }));
  };

  // Add a function to handle the full preview completion
  const completeFullPreview = () => {
    markStepCompleted("fullPreview");
    setActiveStep("export");
    toast.success("Proceeding to export options");
  };

  // Add back the completeSpineDesign function
  const completeSpineDesign = () => {
    if (coverState.bookDetails.spineText || coverState.bookDetails.pageCount < 100) {
      // If spine text is set or page count is too low for text, mark as completed
      markStepCompleted("spineDesign");
      toast.success("Spine design saved");
      setActiveStep("fullPreview");
    } else {
      toast.error("Please enter spine text or choose a color");
    }
  };

  // New component to render navigation buttons between steps
  const StepNavigation = () => {
    const goToPreviousStep = () => {
      switch(activeStep) {
        case "frontCover":
          setActiveStep("bookSettings");
          break;
        case "backCover":
          setActiveStep("frontCover");
          break;
        case "spineDesign":
          setActiveStep("backCover");
          break;
        case "fullPreview":
          setActiveStep("spineDesign");
          break;
        case "export":
          setActiveStep("fullPreview");
          break;
      }
    };

    const goToNextStep = () => {
      switch(activeStep) {
        case "bookSettings":
          if (coverState.stepsCompleted.bookSettings) {
            setActiveStep("frontCover");
          } else {
            toast.error("Please calculate dimensions first");
          }
          break;
        case "frontCover":
          if (coverState.stepsCompleted.frontCover) {
            setActiveStep("backCover");
          } else {
            toast.error("Please generate a front cover first");
          }
          break;
        case "backCover":
          if (coverState.stepsCompleted.backCover) {
            setActiveStep("spineDesign");
          } else {
            toast.error("Please generate a back cover first");
          }
          break;
        case "spineDesign":
          completeSpineDesign();
          break;
        case "fullPreview":
          completeFullPreview();
          break;
      }
    };

    return (
      <div className="flex justify-between items-center pt-4 border-t border-zinc-800/50">
        <Button
          variant="outline"
          className="border-zinc-700 text-zinc-400 hover:text-zinc-300"
          onClick={goToPreviousStep}
          disabled={activeStep === "bookSettings"}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <Button
          onClick={goToNextStep}
          className={`${
            (activeStep === "bookSettings" && !coverState.stepsCompleted.bookSettings) ||
            (activeStep === "frontCover" && !coverState.stepsCompleted.frontCover) ||
            (activeStep === "backCover" && !coverState.stepsCompleted.backCover)
              ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              : "bg-violet-700 hover:bg-violet-600 text-white"
          }`}
          disabled={
            (activeStep === "bookSettings" && !coverState.stepsCompleted.bookSettings) ||
            (activeStep === "frontCover" && !coverState.stepsCompleted.frontCover) ||
            (activeStep === "backCover" && !coverState.stepsCompleted.backCover)
          }
        >
          Continue
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className="container max-w-6xl mx-auto py-6 px-4">
      {/* Header Section with new design */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 text-white flex items-center justify-center mr-3 shadow-lg shadow-indigo-500/30">
            <BookOpenCheck className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-indigo-500 bg-clip-text text-transparent drop-shadow-sm">
            KDP Cover Generator
          </h1>
        </div>
        <p className="text-zinc-400 max-w-2xl">
          Create professional book covers optimized for Kindle Direct Publishing. Start by configuring your book specifications to ensure the correct cover dimensions.
        </p>
      </div>

      {/* Steps Tracker - Redesigned with a cleaner look */}
      <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 mb-8 border border-indigo-500/10 shadow-lg">
        <div className="flex items-center justify-between">
          <div
            className={`flex flex-col items-center text-indigo-400 font-medium`}
            onClick={() => setActiveStep("bookSettings")}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 
              ${activeStep === "bookSettings" ? "bg-indigo-500/20 border-2 border-indigo-500" : "bg-zinc-800/80 border border-indigo-500/50"}`}
            >
              <AlignLeft className="h-5 w-5" />
            </div>
            <span className="text-sm">Book Settings</span>
          </div>

          <div
            className={`h-0.5 flex-1 mx-2 ${coverState.stepsCompleted.bookSettings ? "bg-gradient-to-r from-violet-500 to-indigo-500" : "bg-zinc-800"}`}
          ></div>

          <div
            className={`flex flex-col items-center ${coverState.stepsCompleted.bookSettings ? (activeStep === "frontCover" ? "text-indigo-400 font-medium" : "text-zinc-500") : "text-zinc-700 cursor-not-allowed"}`}
            onClick={() => coverState.stepsCompleted.bookSettings && setActiveStep("frontCover")}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 
              ${!coverState.stepsCompleted.bookSettings ? "bg-zinc-900/80 border border-zinc-800" : 
                activeStep === "frontCover" ? "bg-indigo-500/20 border-2 border-indigo-500" : "bg-zinc-800/80 border border-zinc-700"}`}
            >
              <PenSquare className="h-5 w-5" />
            </div>
            <span className="text-sm">Front Cover</span>
          </div>

          <div
            className={`h-0.5 flex-1 mx-2 ${!coverState.stepsCompleted.bookSettings || !coverState.stepsCompleted.frontCover ? "bg-zinc-800" : "bg-gradient-to-r from-violet-500 to-indigo-500"}`}
          ></div>

          <div
            className={`flex flex-col items-center ${!coverState.stepsCompleted.bookSettings || !coverState.stepsCompleted.frontCover ? "text-zinc-700 cursor-not-allowed" : (activeStep === "backCover" ? "text-indigo-400 font-medium" : "text-zinc-500")}`}
            onClick={() => coverState.stepsCompleted.bookSettings && coverState.stepsCompleted.frontCover && setActiveStep("backCover")}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 
              ${!coverState.stepsCompleted.bookSettings || !coverState.stepsCompleted.frontCover ? "bg-zinc-900/80 border border-zinc-800" :
                activeStep === "backCover" ? "bg-indigo-500/20 border-2 border-indigo-500" : "bg-zinc-800/80 border border-zinc-700"}`}
            >
              <Wand2 className="h-5 w-5" />
            </div>
            <span className="text-sm">Back Cover</span>
          </div>

          <div
            className={`h-0.5 flex-1 mx-2 ${!coverState.stepsCompleted.bookSettings || !coverState.stepsCompleted.frontCover || !coverState.stepsCompleted.backCover ? "bg-zinc-800" : "bg-gradient-to-r from-violet-500 to-indigo-500"}`}
          ></div>

          <div
            className={`flex flex-col items-center ${!coverState.stepsCompleted.bookSettings || !coverState.stepsCompleted.frontCover || !coverState.stepsCompleted.backCover ? "text-zinc-700 cursor-not-allowed" : (activeStep === "spineDesign" ? "text-indigo-400 font-medium" : "text-zinc-500")}`}
            onClick={() => coverState.stepsCompleted.bookSettings && coverState.stepsCompleted.frontCover && coverState.stepsCompleted.backCover && setActiveStep("spineDesign")}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 
              ${!coverState.stepsCompleted.bookSettings || !coverState.stepsCompleted.frontCover || !coverState.stepsCompleted.backCover ? "bg-zinc-900/80 border border-zinc-800" :
                activeStep === "spineDesign" ? "bg-indigo-500/20 border-2 border-indigo-500" : "bg-zinc-800/80 border border-zinc-700"}`}
            >
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-sm">Spine Design</span>
          </div>

          <div
            className={`h-0.5 flex-1 mx-2 ${!coverState.stepsCompleted.bookSettings || !coverState.stepsCompleted.frontCover || !coverState.stepsCompleted.backCover || !coverState.stepsCompleted.spineDesign ? "bg-zinc-800" : "bg-gradient-to-r from-violet-500 to-indigo-500"}`}
          ></div>

          <div
            className={`flex flex-col items-center ${!coverState.stepsCompleted.bookSettings || !coverState.stepsCompleted.frontCover || !coverState.stepsCompleted.backCover || !coverState.stepsCompleted.spineDesign ? "text-zinc-700 cursor-not-allowed" : (activeStep === "fullPreview" ? "text-indigo-400 font-medium" : "text-zinc-500")}`}
            onClick={() => coverState.stepsCompleted.bookSettings && coverState.stepsCompleted.frontCover && coverState.stepsCompleted.backCover && coverState.stepsCompleted.spineDesign && setActiveStep("fullPreview")}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 
              ${!coverState.stepsCompleted.bookSettings || !coverState.stepsCompleted.frontCover || !coverState.stepsCompleted.backCover || !coverState.stepsCompleted.spineDesign ? "bg-zinc-900/80 border border-zinc-800" :
                activeStep === "fullPreview" ? "bg-indigo-500/20 border-2 border-indigo-500" : "bg-zinc-800/80 border border-zinc-700"}`}
            >
              <Download className="h-5 w-5" />
            </div>
            <span className="text-sm">Full Preview</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Controls */}
        <div className="lg:col-span-2">
          <Card className="bg-zinc-900/50 backdrop-blur-sm border border-indigo-500/10 overflow-hidden shadow-lg">
            <CardHeader className="border-b border-zinc-800 bg-zinc-900/80">
              <CardTitle className="flex items-center text-zinc-100">
                {activeStep === "frontCover" && (
                  <>
                    <PenSquare className="mr-2 h-5 w-5 text-violet-400" />
                    <span>Step 2: Front Cover</span>
                  </>
                )}

                {activeStep === "bookSettings" && (
                  <>
                    <AlignLeft className="mr-2 h-5 w-5 text-violet-400" />
                    <span>Step 1: Book Settings</span>
                  </>
                )}

                {activeStep === "backCover" && (
                  <>
                    <Wand2 className="mr-2 h-5 w-5 text-violet-400" />
                    <span>Step 3: Back Cover</span>
                  </>
                )}

                {activeStep === "spineDesign" && (
                  <>
                    <Sparkles className="mr-2 h-5 w-5 text-violet-400" />
                    <span>Step 4: Spine Design</span>
                  </>
                )}

                {activeStep === "fullPreview" && (
                  <>
                    <Download className="mr-2 h-5 w-5 text-violet-400" />
                    <span>Step 5: Full Preview</span>
                  </>
                )}
                
                {activeStep === "export" && (
                  <>
                    <Download className="mr-2 h-5 w-5 text-violet-400" />
                    <span>Step 6: Export</span>
                  </>
                )}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6">
              {/* Step 1: Book Settings Section */}
              {activeStep === "bookSettings" && (
                <div className="space-y-6">
                  {/* Book Settings content here */}
                </div>
              )}

              {/* Step 2: Front Cover Section */}
              {activeStep === "frontCover" && (
                <div className="space-y-6">
                  {/* Front Cover content here */}
                </div>
              )}

              {/* Step 3: Back Cover Section */}
              {activeStep === "backCover" && (
                <div className="space-y-6">
                  {/* Back Cover content here */}
                </div>
              )}

              {/* Step 4: Spine Design Section */}
              {activeStep === "spineDesign" && (
                <div className="space-y-6">
                  {/* Spine Design content here */}
                </div>
              )}

              {/* Step 5: Full Preview Section */}
              {activeStep === "fullPreview" && (
                <div className="space-y-6">
                  {/* Full Preview content here */}
                </div>
              )}

              {/* Step 6: Export Section */}
              {activeStep === "export" && (
                <div className="space-y-6">
                  {/* Export content here */}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
          
        {/* Right Column: Preview */}
        <div className="space-y-4">
          {/* Error display */}
          {error && (
            <Card className="bg-rose-950/40 border border-rose-700/30 overflow-hidden shadow-lg mb-4">
              <CardContent className="p-4 flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0" />
                <p className="text-rose-300 text-sm">{error}</p>
              </CardContent>
            </Card>
          )}
          
          {/* Preview Card */}
          <Card className="bg-gradient-to-b from-zinc-900/60 to-black/60 backdrop-blur-sm border border-indigo-500/10 overflow-hidden shadow-lg">
            <CardHeader className="border-b border-zinc-800 bg-black/40 pb-3">
              <CardTitle className="text-center text-zinc-300 text-sm font-medium">
                {coverState.fullWrapImage
                  ? "Full Wrap Cover Preview"
                  : coverState.frontCoverImage
                    ? "Cover Preview"
                    : "Preview"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 flex flex-col items-center justify-center min-h-[450px]">
              {coverState.fullWrapImage ? (
                <div className="relative group">
                  <img 
                    src={normalizeUrl(coverState.fullWrapImage) || ''} 
                    alt="Generated Full Wrap Cover"
                    className="max-w-full max-h-[450px] rounded-md border border-indigo-600/20 shadow-lg"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                    <a 
                      href={normalizeUrl(coverState.fullWrapImage) || '#'} 
                        download="kdp-full-wrap-cover.jpg"
                        target="_blank"
                        rel="noopener noreferrer"
                      className="bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-md px-4 py-2 flex items-center text-sm transition-colors"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Cover
                      </a>
                    </div>
                </div>
              ) : coverState.frontCoverImage && coverState.backCoverImage ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-3 bg-zinc-900/30 p-3 rounded-lg">
                    <div className="relative w-[150px]">
                      <img
                        src={normalizeUrl(coverState.frontCoverImage) || ''}
                        alt="Generated Front Cover"
                        className="w-full h-auto rounded-md border border-indigo-600/20 shadow-lg"
                      />
                      <div className="absolute bottom-2 right-2 bg-violet-600 text-white px-2 py-1 text-xs rounded-full">
                        Front
                      </div>
                    </div>
                    <div className="relative w-[150px]">
                      <img
                        src={normalizeUrl(coverState.backCoverImage) || ''}
                        alt="Generated Back Cover"
                        className="w-full h-auto rounded-md border border-indigo-600/20 shadow-lg"
                      />
                      <div className="absolute bottom-2 right-2 bg-violet-600 text-white px-2 py-1 text-xs rounded-full">
                        Back
                      </div>
                    </div>
                  </div>
                  <div className="text-center text-sm text-zinc-400">
                    Front and back covers generated. Continue to create the full wrap cover.
                  </div>
                </div>
              ) : coverState.frontCoverImage ? (
                <div className="relative">
                  <img
                    src={normalizeUrl(coverState.frontCoverImage) || ''}
                    alt="Generated Front Cover"
                    className="max-w-full max-h-[450px] rounded-md border border-indigo-600/20 shadow-lg"
                  />
                </div>
              ) : (
                <div className="w-[280px] h-[400px] rounded-md flex items-center justify-center bg-gradient-to-b from-zinc-900/30 to-black/30 border border-dashed border-indigo-500/20 text-zinc-500 p-6 text-center">
                  <div>
                    <div className="mb-4 opacity-70">
                      <BookOpenCheck className="h-16 w-16 mx-auto text-indigo-800/30" />
                    </div>
                    <p className="text-sm">
                      Your generated book cover will appear here
                    </p>
                  </div>
                </div>
              )}

              {/* Download button for completed wrap */}
              {activeStep === "fullPreview" && coverState.fullWrapImage && (
                <Button
                  onClick={handleDownloadFullCover}
                  className="mt-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium rounded-md px-6 py-2.5 flex items-center text-sm hover:from-violet-700 hover:to-indigo-700 transition-all"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Download Full KDP Cover
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Cover Specifications Summary */}
          <Card className="bg-black/40 backdrop-blur-sm border border-indigo-500/10 shadow-lg">
            <CardHeader className="pb-2 border-b border-zinc-800 bg-black/20">
              <CardTitle className="text-sm text-zinc-300 flex items-center">
                <Ruler className="h-4 w-4 mr-2 text-violet-400" />
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
                  <span className="text-zinc-500">Has Spine Text:</span>
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
                    {coverState.dimensions.width} × {coverState.dimensions.height} px
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Status:</span>
                  <span
                    className={`
                    ${Object.values(isLoading).some((v) => v) ? "text-amber-400" : ""} 
                    ${activeStep === "fullPreview" && coverState.fullWrapImage ? "text-violet-400" : ""}
                    ${error ? "text-rose-400" : ""}
                    ${!Object.values(isLoading).some((v) => v) && !coverState.frontCoverImage && !error ? "text-zinc-500" : ""}
                    ${coverState.frontCoverImage && !coverState.fullWrapImage && !Object.values(isLoading).some((v) => v) ? "text-violet-400" : ""}
                  `}
                  >
                    {Object.values(isLoading).some((v) => v)
                      ? "Processing..."
                      : activeStep === "fullPreview" && coverState.fullWrapImage
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
