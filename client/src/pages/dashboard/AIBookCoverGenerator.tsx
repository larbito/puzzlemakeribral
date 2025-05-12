import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  calculateCoverDimensions,
  generateFrontCover,
  assembleFullCover,
  downloadCover
} from '@/lib/bookCoverApi';
import { generateBookCover } from '@/services/bookCoverService';
import './AIBookCoverGenerator.css';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Import API_URL from bookCoverService to use in debug info
import { API_URL } from '@/services/bookCoverService';

const MAX_PROMPT_CHARS = 500;

// KDP supported trim sizes
const KDP_TRIM_SIZES = [
  { label: '5" x 8"', value: '5x8', width: 5, height: 8 },
  { label: '5.06" x 7.81"', value: '5.06x7.81', width: 5.06, height: 7.81 },
  { label: '5.25" x 8"', value: '5.25x8', width: 5.25, height: 8 },
  { label: '5.5" x 8.5"', value: '5.5x8.5', width: 5.5, height: 8.5 },
  { label: '6" x 9"', value: '6x9', width: 6, height: 9 },
  { label: '6.14" x 9.21"', value: '6.14x9.21', width: 6.14, height: 9.21 },
  { label: '6.69" x 9.61"', value: '6.69x9.61', width: 6.69, height: 9.61 },
  { label: '7" x 10"', value: '7x10', width: 7, height: 10 },
  { label: '7.44" x 9.69"', value: '7.44x9.69', width: 7.44, height: 9.69 },
  { label: '7.5" x 9.25"', value: '7.5x9.25', width: 7.5, height: 9.25 },
  { label: '8" x 10"', value: '8x10', width: 8, height: 10 },
  { label: '8.25" x 6"', value: '8.25x6', width: 8.25, height: 6 },
  { label: '8.25" x 8.25"', value: '8.25x8.25', width: 8.25, height: 8.25 },
  { label: '8.5" x 8.5"', value: '8.5x8.5', width: 8.5, height: 8.5 },
  { label: '8.5" x 11"', value: '8.5x11', width: 8.5, height: 11 }
];

const AIBookCoverGenerator = () => {
  // State variables for book specifications
  const [bookType, setBookType] = useState('paperback');
  const [trimSize, setTrimSize] = useState('6x9');
  const [pageCount, setPageCount] = useState(100);
  const [paperColor, setPaperColor] = useState('white');
  const [spineText, setSpineText] = useState('');
  const [bookTitle, setBookTitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [coverDescription, setCoverDescription] = useState('');
  const [showTrimLines, setShowTrimLines] = useState(false);
  const [addInteriorImages, setAddInteriorImages] = useState(false);
  const [spineColor, setSpineColor] = useState('#000000');
  const [dominantColors, setDominantColors] = useState<string[]>(['#2E7D32', '#388E3C', '#43A047', '#4CAF50', '#66BB6A', '#81C784']);
  const [activeTab, setActiveTab] = useState('front');
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [dimensions, setDimensions] = useState<any>(null);
  const [frontCoverUrl, setFrontCoverUrl] = useState('');
  const [fullCoverUrl, setFullCoverUrl] = useState('');
  const [zoom, setZoom] = useState('fit');
  
  // Additional states for enhanced functionality
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isAssembling, setIsAssembling] = useState(false);
  const [frontCoverGenerated, setFrontCoverGenerated] = useState(false);
  const [fullCoverGenerated, setFullCoverGenerated] = useState(false);

  // Add debug state
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  // Add debug logging for button state
  useEffect(() => {
    console.log('Button state:', {
      isGenerating,
      descriptionLength: coverDescription.length,
      trimmedLength: coverDescription.trim().length,
      isDisabled: isGenerating || coverDescription.trim().length < 5
    });
  }, [isGenerating, coverDescription]);

  // Calculate dimensions when specifications change
  useEffect(() => {
    calculateDimensions();
  }, [trimSize, pageCount, paperColor, bookType]);

  // Calculate cover dimensions based on specifications
  const calculateDimensions = async () => {
    setIsCalculating(true);
    try {
      const result = await calculateCoverDimensions({
        trimSize,
        pageCount,
        paperColor,
        bookType: bookType as 'paperback' | 'hardcover'
      });
      
      setDimensions(result.dimensions);
      console.log('Calculated dimensions:', result.dimensions);
    } catch (error) {
      console.error('Error calculating dimensions:', error);
      toast.error('Failed to calculate dimensions');
    } finally {
      setIsCalculating(false);
    }
  };

  // Handle file upload for interior images
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (uploadedImages.length + newFiles.length <= 6) {
        setUploadedImages([...uploadedImages, ...newFiles]);
        
        // Create URLs for the uploaded images
        const newUrls = newFiles.map(file => URL.createObjectURL(file));
        setUploadedImageUrls([...uploadedImageUrls, ...newUrls]);
        
        toast.success(`${newFiles.length} image${newFiles.length > 1 ? 's' : ''} added successfully`);
      } else {
        toast.error('You can only upload up to 6 images.');
      }
    }
  };

  // Remove uploaded image
  const removeImage = (index: number) => {
    const newImages = [...uploadedImages];
    newImages.splice(index, 1);
    setUploadedImages(newImages);
    
    const newUrls = [...uploadedImageUrls];
    URL.revokeObjectURL(newUrls[index]); // Revoke the URL to free up memory
    newUrls.splice(index, 1);
    setUploadedImageUrls(newUrls);
    
    toast.info('Image removed');
  };

  // Handle generate front cover button click
  const handleGenerateFrontCover = async () => {
    // Add very clear logging to identify this exact function execution
    console.log("======== GENERATE BUTTON CLICKED ========");
    console.log(`Timestamp: ${new Date().toISOString()}`);
    
    try {
      // Log the click handler state
      console.log("Button clicked with prompt:", coverDescription);
      console.log("Prompt length:", coverDescription.length, "Trimmed length:", coverDescription.trim().length);
      console.log("Button state:", {
        isGenerating,
        descriptionLength: coverDescription.length,
        trimmedLength: coverDescription.trim().length,
        isDisabled: isGenerating || coverDescription.trim().length < 5
      });
      
      // Clear previous debug info
      setDebugInfo(null);
      
      if (coverDescription.trim().length < 5) {
        console.log("ERROR: Prompt too short");
        toast.error('Please enter a more detailed description for your cover');
        return;
      }
      
      // Set generating state immediately to provide feedback
      console.log("Setting isGenerating to true");
      setIsGenerating(true);
      toast.loading('Generating your book cover...', { id: 'cover-generation' });
      
      console.log('Starting cover generation with prompt:', coverDescription);
      
      // Try to calculate dimensions if not already done
      if (!dimensions) {
        console.log("No dimensions yet, calculating...");
        try {
          await calculateDimensions();
          console.log("Dimensions calculated successfully:", dimensions);
        } catch (error) {
          console.error('Failed to calculate dimensions:', error);
          toast.error('Please make sure book specifications are valid');
          setIsGenerating(false);
          return;
        }
      } else {
        console.log("Using existing dimensions:", dimensions);
      }
      
      console.log('Using dimensions for generation:', dimensions?.frontCover);
      
      // Add a direct DOM event to test if the button might be capturing events incorrectly
      console.log("Calling generateBookCover service...");
      
      const imageUrl = await generateBookCover({
        prompt: coverDescription,
        width: dimensions.frontCover.widthPx,
        height: dimensions.frontCover.heightPx,
        negative_prompt: 'text, watermark, signature, blurry, low quality, distorted, deformed'
      });
      
      console.log('Generation result:', imageUrl);
      
      if (!imageUrl) {
        console.error("ERROR: No image URL returned");
        throw new Error('No image URL returned from the service');
      }
      
      console.log("Setting frontCoverUrl and frontCoverGenerated");
      setFrontCoverUrl(imageUrl);
      setFrontCoverGenerated(true);
      
      // Dismiss the loading toast and show success
      console.log("Dismissing loading toast");
      toast.dismiss('cover-generation');

      // Check if the URL contains "placehold.co" which indicates a placeholder
      if (imageUrl.includes('placehold.co')) {
        console.log("Detected placeholder image URL");
        // Remove any previous warning toasts
        toast.dismiss('api-key-warning');
        
        // Show warning with details about setting up the API key
        toast.warning(
          'Using a placeholder image. To generate real AI images, ensure the IDEOGRAM_API_KEY is properly configured on your Railway backend.',
          { id: 'api-key-warning', duration: 6000 }
        );
        
        // Set debug info
        setDebugInfo(`Using placeholder image: ${imageUrl}\n\nThis indicates that the IDEOGRAM_API_KEY environment variable is not properly configured on your Railway deployment.`);
      } else {
        console.log("Generated real image successfully");
        toast.success('Front cover generated successfully!');
        setDebugInfo(null);
      }
      
      // Extract dominant colors from the generated image
      setDominantColors(['#2E7D32', '#388E3C', '#43A047', '#4CAF50', '#66BB6A', '#81C784']);
      console.log("Generation completed successfully");
    } catch (error: any) {
      console.error('Error generating front cover:', error);
      toast.dismiss('cover-generation');
      toast.error(`Failed to generate front cover: ${error.message || 'Unknown error'}`);
      
      // Set detailed debug info
      setDebugInfo(`Generation Error: ${error.message || 'Unknown error'}\n\nAPI URL: ${API_URL}\n\nPlease check the browser console for more details.`);
    } finally {
      console.log("Setting isGenerating back to false");
      setIsGenerating(false);
      console.log("======== GENERATE FUNCTION COMPLETED ========");
    }
  };

  // Handle create full cover button click
  const handleCreateFullCover = async () => {
    if (!frontCoverGenerated) {
      toast.error('Please generate a front cover first');
      return;
    }
    
    setIsAssembling(true);
    
    try {
      const result = await assembleFullCover({
        frontCoverUrl,
        dimensions,
        spineText,
        spineColor,
        interiorImagesUrls: uploadedImageUrls,
        bookTitle,
        authorName
      });
      
      setFullCoverUrl(result.fullCover);
      setFullCoverGenerated(true);
      setActiveTab('full');
      toast.success('Full cover assembled successfully!');
    } catch (error) {
      console.error('Error assembling full cover:', error);
      toast.error('Failed to assemble full cover');
    } finally {
      setIsAssembling(false);
    }
  };

  // Handle download cover
  const handleDownloadCover = (format: 'png' | 'jpg' | 'pdf' = 'png') => {
    if (activeTab === 'full' && !fullCoverGenerated) {
      toast.error('Please create the full cover first');
      return;
    }

    if (activeTab === 'front' && !frontCoverGenerated) {
      toast.error('Please generate the front cover first');
      return;
    }
    
    try {
      const url = activeTab === 'full' ? fullCoverUrl : frontCoverUrl;
      const filename = `book-cover-${trimSize.replace('x', '-')}-${bookType}`;
      
      downloadCover({
        url,
        format,
        filename,
        width: activeTab === 'full' ? dimensions.fullCover.widthPx : dimensions.frontCover.widthPx,
        height: activeTab === 'full' ? dimensions.fullCover.heightPx : dimensions.frontCover.heightPx
      });
      
      toast.success(`${activeTab === 'full' ? 'Full' : 'Front'} cover downloaded as ${format.toUpperCase()}!`);
    } catch (error) {
      console.error('Error downloading cover:', error);
      toast.error('Failed to download cover');
    }
  };

  // Add direct DOM button handler as a backup to ensure we have a clickable element
  useEffect(() => {
    // After component mount, add a direct click handler to the button
    const generateButton = document.getElementById('generate-cover-button');
    if (generateButton) {
      console.log("Adding direct click handler to button element");
      generateButton.addEventListener('click', (e) => {
        console.log("Direct DOM click event fired on generate button");
      });
      
      // Add a debug method to the window to force click the button
      (window as any).forceClickGenerateButton = () => {
        console.log("Force clicking generate button from console");
        generateButton.click();
      };
      
      console.log("You can use window.forceClickGenerateButton() in the console to trigger a click");
    }
    
    return () => {
      // Clean up event listener on unmount
      const button = document.getElementById('generate-cover-button');
      if (button) {
        button.removeEventListener('click', () => {});
      }
      // Remove the debug method
      delete (window as any).forceClickGenerateButton;
    };
  }, []);

  return (
    <PageLayout
      title="AI Book Cover Generator"
      description="Create professional print-ready book covers for Amazon KDP using AI"
    >
      <div className="book-cover-generator">
        {/* Left Panel */}
        <div className="left-panel">
          <Card className="book-specs">
            <CardHeader>
              <CardTitle>Book Specifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="form-group">
                <Label htmlFor="bookType">Book Type</Label>
                <Select value={bookType} onValueChange={setBookType}>
                  <SelectTrigger id="bookType">
                    <SelectValue placeholder="Select book type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paperback">Paperback</SelectItem>
                    <SelectItem value="hardcover">Hardcover</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="form-group">
                <Label htmlFor="trimSize">Trim Size</Label>
                <Select value={trimSize} onValueChange={setTrimSize}>
                  <SelectTrigger id="trimSize">
                    <SelectValue placeholder="Select trim size" />
                  </SelectTrigger>
                  <SelectContent>
                    {KDP_TRIM_SIZES.map((size) => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="form-group">
                <Label htmlFor="pageCount">Page Count: {pageCount}</Label>
                <Slider
                  id="pageCount"
                  value={[pageCount]}
                  onValueChange={(value) => setPageCount(value[0])}
                  min={24}
                  max={800}
                  step={1}
                />
              </div>

              <div className="form-group">
                <Label htmlFor="paperColor">Paper Color</Label>
                <Select value={paperColor} onValueChange={setPaperColor}>
                  <SelectTrigger id="paperColor">
                    <SelectValue placeholder="Select paper color" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="white">White</SelectItem>
                    <SelectItem value="cream">Cream</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="form-group">
                <Label htmlFor="bookTitle">Book Title</Label>
                <Input
                  id="bookTitle"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  placeholder="Enter book title..."
                />
              </div>

              <div className="form-group">
                <Label htmlFor="authorName">Author Name</Label>
                <Input
                  id="authorName"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Enter author name..."
                />
              </div>

              {pageCount >= 100 && (
                <div className="form-group">
                  <Label htmlFor="spineText">Spine Text (optional)</Label>
                  <Input
                    id="spineText"
                    value={spineText}
                    onChange={(e) => setSpineText(e.target.value)}
                    placeholder="Enter spine text..."
                  />
                </div>
              )}

              {dimensions && (
                <div className="auto-size-preview">
                  <h3>Auto Size Preview</h3>
                  <div className="size-info">
                    <p>Final Size with Bleed: {dimensions.frontCover.width.toFixed(2)}" x {dimensions.frontCover.height.toFixed(2)}"</p>
                    <p>Spine Width: {dimensions.spine.width.toFixed(2)}"</p>
                    <p>Resolution: {dimensions.frontCover.widthPx} x {dimensions.frontCover.heightPx} px</p>
                    <p>DPI: {dimensions.dpi}</p>
                    <p>Print Quality: {dimensions.frontCover.widthPx >= 1500 ? 'Perfect for KDP' : 'Too low'}</p>
                  </div>
                </div>
              )}

              <div className="form-group">
                <Label htmlFor="coverDescription">AI Prompt</Label>
                <div className="textarea-wrapper">
                  <Textarea
                    id="coverDescription"
                    value={coverDescription}
                    onChange={(e) => {
                      const newText = e.target.value;
                      console.log("Prompt length:", newText.length, "Trimmed length:", newText.trim().length);
                      if (newText.length <= MAX_PROMPT_CHARS) {
                        setCoverDescription(newText);
                      } else {
                        setCoverDescription(newText.slice(0, MAX_PROMPT_CHARS));
                        toast.info(`Text limited to ${MAX_PROMPT_CHARS} characters`);
                      }
                    }}
                    onPaste={(e) => {
                      e.persist();
                      const pastedText = e.clipboardData.getData('text');
                      const currentText = coverDescription;
                      const cursorPosition = e.currentTarget.selectionStart || 0;
                      const textBeforeCursor = currentText.slice(0, cursorPosition);
                      const textAfterCursor = currentText.slice(cursorPosition);
                      const newText = textBeforeCursor + pastedText + textAfterCursor;
                      
                      if (newText.length <= MAX_PROMPT_CHARS) {
                        // Let the default paste happen
                      } else {
                        e.preventDefault();
                        const allowedText = newText.slice(0, MAX_PROMPT_CHARS);
                        setCoverDescription(allowedText);
                        toast.info(`Text limited to ${MAX_PROMPT_CHARS} characters`);
                      }
                    }}
                    placeholder="Describe your book cover concept... (paste or type your description)"
                    rows={4}
                  />
                  <div className="character-count">
                    {coverDescription.length}/{MAX_PROMPT_CHARS}
                    {coverDescription.trim().length < 5 && coverDescription.trim().length > 0 && (
                      <span className="min-length-warning">
                        (Need {5 - coverDescription.trim().length} more characters)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-group toggle-group">
                <div className="toggle-with-label">
                  <Label htmlFor="showTrimLines">Show Trim Lines</Label>
                  <Switch
                    id="showTrimLines"
                    checked={showTrimLines}
                    onCheckedChange={setShowTrimLines}
                  />
                </div>
              </div>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div style={{ width: '100%' }}>
                      {/* Super simple native HTML button - guaranteed to be clickable */}
                      <button 
                        id="generate-cover-button"
                        onClick={(e) => {
                          e.preventDefault();
                          console.log("Button native click handler fired");
                          if (!isGenerating && coverDescription.trim().length >= 5) {
                            handleGenerateFrontCover();
                          }
                        }}
                        disabled={isGenerating || coverDescription.trim().length < 5}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: 
                            isGenerating ? '#a0a0a0' : 
                            coverDescription.trim().length < 5 ? '#d4d4d4' : 
                            '#4ade80',
                          color: 'white',
                          fontWeight: 'bold',
                          cursor: isGenerating || coverDescription.trim().length < 5 ? 'not-allowed' : 'pointer',
                          fontSize: '16px',
                          textAlign: 'center',
                          marginTop: '16px',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                        }}
                      >
                        {isGenerating ? (
                          '🔄 Generating...'
                        ) : coverDescription.trim().length < 5 ? (
                          '✏️ Enter at least 5 characters'
                        ) : (
                          '🎨 Generate Front Cover'
                        )}
                      </button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isGenerating ? (
                      "Please wait while your cover is being generated..."
                    ) : coverDescription.trim().length < 5 ? (
                      "Please enter a more detailed description for your cover (at least 5 characters)"
                    ) : (
                      "Click to generate your book cover"
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardContent>
          </Card>

          <Card className="interior-images">
            <CardHeader>
              <CardTitle>Interior Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="form-group toggle-group">
                <div className="toggle-with-label">
                  <Label htmlFor="addInteriorImages">Add Interior Preview Images to Back Cover</Label>
                  <Switch
                    id="addInteriorImages"
                    checked={addInteriorImages}
                    onCheckedChange={setAddInteriorImages}
                  />
                </div>
              </div>

              {addInteriorImages && (
                <div className="uploader-container">
                  <div className="upload-instructions">
                    <div className="upload-icon">🖼️</div>
                    <div className="upload-text">
                      <h4>Add Interior Pages to Back Cover</h4>
                      <p>Select up to 6 images (JPG, PNG, WebP - max 2MB each)</p>
                    </div>
                  </div>
                  
                  <div className="file-upload-button">
                    <label htmlFor="imageUpload" className="custom-file-upload">
                      📁 Choose Files
                    </label>
                    <Input
                      id="imageUpload"
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      onChange={handleFileUpload}
                      multiple
                      disabled={uploadedImages.length >= 6}
                      className="hidden-input"
                    />
                    <span className="file-count">{uploadedImages.length}/6 images</span>
                  </div>
                  
                  {uploadedImages.length > 0 && (
                    <div className="uploaded-images">
                      {uploadedImages.map((file, index) => (
                        <div key={index} className="image-thumbnail">
                          <img src={uploadedImageUrls[index]} alt={`Uploaded ${index + 1}`} />
                          <button 
                            className="remove-image" 
                            onClick={() => removeImage(index)}
                            title="Remove image"
                          >×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {frontCoverGenerated && (
            <Card className="spine-color">
              <CardHeader>
                <CardTitle>Choose Spine Color</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="color-swatches">
                  {dominantColors.map((color) => (
                    <div
                      key={color}
                      className={`color-swatch ${spineColor === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSpineColor(color)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Debug info panel */}
          {debugInfo && (
            <Card className="debug-info">
              <CardHeader>
                <CardTitle>Debug Information</CardTitle>
              </CardHeader>
              <CardContent>
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>{debugInfo}</pre>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel */}
        <div className="right-panel">
          <Tabs defaultValue="front" className="preview-tabs">
            <TabsList>
              <TabsTrigger value="front" onClick={() => setActiveTab('front')}>Front Cover Only</TabsTrigger>
              <TabsTrigger value="full" onClick={() => setActiveTab('full')}>Full Cover</TabsTrigger>
            </TabsList>
            <TabsContent value="front" className="preview-content">
              <div className="preview-container">
                {frontCoverGenerated ? (
                  <div className="preview-image-container">
                    <motion.img 
                      src={frontCoverUrl} 
                      alt="Front Cover Preview"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      className={`preview-image zoom-${zoom}`}
                    />
                    {showTrimLines && dimensions && (
                      <div className="trim-guides">
                        <div className="trim-line top"></div>
                        <div className="trim-line right"></div>
                        <div className="trim-line bottom"></div>
                        <div className="trim-line left"></div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="preview-placeholder">
                    <p>Generate a cover to see the preview</p>
                  </div>
                )}
                <div className="zoom-controls">
                  <button className={zoom === '100' ? 'active' : ''} onClick={() => setZoom('100')}>100%</button>
                  <button className={zoom === '150' ? 'active' : ''} onClick={() => setZoom('150')}>150%</button>
                  <button className={zoom === 'fit' ? 'active' : ''} onClick={() => setZoom('fit')}>Fit</button>
                </div>
              </div>
              <div className="action-buttons">
                <Button 
                  variant="outline" 
                  className="regenerate-button" 
                  onClick={handleGenerateFrontCover}
                  disabled={isGenerating || !frontCoverGenerated}
                >
                  ♻️ Regenerate
                </Button>
                <Button 
                  className="create-full-button" 
                  onClick={handleCreateFullCover}
                  disabled={isAssembling || !frontCoverGenerated}
                >
                  {isAssembling ? '🔄 Assembling...' : '🧩 Assemble Full Cover'}
                </Button>
                <Button 
                  variant="secondary" 
                  className="download-button" 
                  onClick={() => handleDownloadCover('png')}
                  disabled={!frontCoverGenerated}
                >
                  ⬇️ Download Cover
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="full" className="preview-content">
              <div className="preview-container">
                {fullCoverGenerated ? (
                  <div className="preview-image-container">
                    <motion.img 
                      src={fullCoverUrl} 
                      alt="Full Cover Preview"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      className={`preview-image zoom-${zoom}`}
                    />
                    {showTrimLines && dimensions && (
                      <div className="trim-guides full">
                        <div className="trim-line top"></div>
                        <div className="trim-line right"></div>
                        <div className="trim-line bottom"></div>
                        <div className="trim-line left"></div>
                        <div className="spine-line left" style={{ left: `${dimensions.frontCover.widthPx}px` }}></div>
                        <div className="spine-line right" style={{ left: `${dimensions.frontCover.widthPx + dimensions.spine.widthPx}px` }}></div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="preview-placeholder">
                    <p>Generate a full cover to see the preview</p>
                  </div>
                )}
                <div className="zoom-controls">
                  <button className={zoom === '100' ? 'active' : ''} onClick={() => setZoom('100')}>100%</button>
                  <button className={zoom === '150' ? 'active' : ''} onClick={() => setZoom('150')}>150%</button>
                  <button className={zoom === 'fit' ? 'active' : ''} onClick={() => setZoom('fit')}>Fit</button>
                </div>
              </div>
              <div className="action-buttons">
                <Button 
                  variant="outline" 
                  className="regenerate-button"
                  onClick={handleGenerateFrontCover} 
                  disabled={isGenerating}
                >
                  ♻️ Regenerate Cover
                </Button>
                <Button 
                  className="download-button"
                  onClick={() => handleDownloadCover('png')}
                  disabled={!fullCoverGenerated}
                >
                  ⬇️ Download PNG
                </Button>
                <Button 
                  variant="secondary" 
                  className="download-pdf-button"
                  onClick={() => handleDownloadCover('pdf')}
                  disabled={!fullCoverGenerated}
                >
                  📄 Download PDF
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageLayout>
  );
};

export default AIBookCoverGenerator; 