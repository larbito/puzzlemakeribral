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
import ColorThief from 'colorthief';
import { toast } from 'sonner';

import './BookCoverCreator.css';

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

const BookCoverCreator = () => {
  // State variables for book specifications
  const [bookType, setBookType] = useState('paperback');
  const [trimSize, setTrimSize] = useState('6x9');
  const [pageCount, setPageCount] = useState(100);
  const [paperColor, setPaperColor] = useState('white');
  const [spineText, setSpineText] = useState('');
  const [coverDescription, setCoverDescription] = useState('');
  const [showTrimLines, setShowTrimLines] = useState(false);
  const [addInteriorImages, setAddInteriorImages] = useState(false);
  const [spineColor, setSpineColor] = useState('');
  const [dominantColors, setDominantColors] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('front');
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imageResolution, setImageResolution] = useState({ width: 1875, height: 2775 });
  const [zoom, setZoom] = useState('fit');
  
  // Additional states for enhanced functionality
  const [isGenerating, setIsGenerating] = useState(false);
  const [frontCoverGenerated, setFrontCoverGenerated] = useState(false);
  const [fullCoverGenerated, setFullCoverGenerated] = useState(false);

  // Find the current trim size dimensions
  const getCurrentTrimSize = () => {
    return KDP_TRIM_SIZES.find(size => size.value === trimSize) || KDP_TRIM_SIZES[4]; // Default to 6x9
  };

  // Calculate spine width based on page count
  const calculateSpineWidth = () => {
    const pagesPerInch = paperColor === 'white' ? 434 : 370;
    return (pageCount / pagesPerInch).toFixed(2);
  };

  // Calculate final dimensions with bleed
  const calculateDimensions = () => {
    const currentSize = getCurrentTrimSize();
    return {
      width: currentSize.width + 0.25,
      height: currentSize.height + 0.25,
      spineWidth: calculateSpineWidth()
    };
  };

  const dimensions = calculateDimensions();

  // Calculate resolution based on trim size
  useEffect(() => {
    const currentSize = getCurrentTrimSize();
    setImageResolution({
      width: Math.round(currentSize.width * 300), // 300 DPI
      height: Math.round(currentSize.height * 300)
    });
  }, [trimSize]);

  // Extract dominant colors from the cover image
  useEffect(() => {
    // Placeholder for extracting colors from generated image
    // This would be replaced with actual logic once we have image generation
    setDominantColors(['#2E7D32', '#388E3C', '#43A047', '#4CAF50', '#66BB6A', '#81C784']);
  }, []);

  // Handle file upload for interior images
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (uploadedImages.length + newFiles.length <= 6) {
        setUploadedImages([...uploadedImages, ...newFiles]);
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
    toast.info('Image removed');
  };

  // Handle generate front cover button click
  const handleGenerateFrontCover = () => {
    if (coverDescription.length < 10) {
      toast.error('Please enter a more detailed description for your cover');
      return;
    }
    
    setIsGenerating(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      setIsGenerating(false);
      setFrontCoverGenerated(true);
      toast.success('Front cover generated successfully!');
    }, 2000);
  };

  // Handle create full cover button click
  const handleCreateFullCover = () => {
    if (!frontCoverGenerated) {
      toast.error('Please generate a front cover first');
      return;
    }
    
    setIsGenerating(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      setIsGenerating(false);
      setFullCoverGenerated(true);
      setActiveTab('full');
      toast.success('Full cover assembled successfully!');
    }, 2000);
  };

  // Handle download cover
  const handleDownloadCover = () => {
    if (activeTab === 'full' && !fullCoverGenerated) {
      toast.error('Please create the full cover first');
      return;
    }

    if (activeTab === 'front' && !frontCoverGenerated) {
      toast.error('Please generate the front cover first');
      return;
    }
    
    toast.success(`${activeTab === 'full' ? 'Full' : 'Front'} cover downloaded successfully!`);
  };

  return (
    <PageLayout
      title="Book Cover Creator"
      description="Create professional print-ready book covers for Amazon KDP using AI"
    >
      <div className="book-cover-creator">
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
                    <SelectItem value="color">Color</SelectItem>
                  </SelectContent>
                </Select>
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

              <div className="auto-size-preview">
                <h3>Auto Size Preview</h3>
                <div className="size-info">
                  <p>Final Size with Bleed: {dimensions.width}" x {dimensions.height}"</p>
                  <p>Spine Width: {dimensions.spineWidth}"</p>
                  <p>Resolution: {imageResolution.width} x {imageResolution.height} px</p>
                  <p>DPI: 300</p>
                  <p>Print Quality: {imageResolution.width >= 1875 && imageResolution.height >= 2775 ? 'Perfect for KDP' : 'Too low'}</p>
                </div>
              </div>

              <div className="form-group">
                <Label htmlFor="coverDescription">AI Prompt</Label>
                <div className="textarea-wrapper">
                  <Textarea
                    id="coverDescription"
                    value={coverDescription}
                    onChange={(e) => {
                      if (e.target.value.length <= MAX_PROMPT_CHARS) {
                        setCoverDescription(e.target.value);
                      }
                    }}
                    placeholder="Describe your book cover concept..."
                    rows={4}
                  />
                  <div className="character-count">
                    {coverDescription.length}/{MAX_PROMPT_CHARS}
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

              <Button 
                className="generate-button" 
                onClick={handleGenerateFrontCover}
                disabled={isGenerating || coverDescription.length < 10}
              >
                {isGenerating ? '🔄 Generating...' : '🎨 Generate Front Cover'}
              </Button>
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
                  <Label htmlFor="imageUpload">🖼️ Add Interior Pages to Back (up to 6 images)</Label>
                  <Input
                    id="imageUpload"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={handleFileUpload}
                    multiple
                    disabled={uploadedImages.length >= 6}
                  />
                  <div className="uploaded-images">
                    {uploadedImages.map((file, index) => (
                      <div key={index} className="image-thumbnail">
                        <img src={URL.createObjectURL(file)} alt={`Uploaded ${index + 1}`} />
                        <button className="remove-image" onClick={() => removeImage(index)}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

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
                    {/* This would be replaced with the actual generated image */}
                    <div style={{ width: '100%', height: '100%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <p>Front Cover Preview</p>
                    </div>
                    {showTrimLines && (
                      <div className="trim-guides">
                        {/* Trim guides would be rendered here */}
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
                  disabled={isGenerating || !frontCoverGenerated}
                >
                  🧩 Assemble Full Cover
                </Button>
                <Button 
                  variant="secondary" 
                  className="download-button" 
                  onClick={handleDownloadCover}
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
                    {/* This would be replaced with the actual generated full cover image */}
                    <div style={{ width: '100%', height: '100%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <p>Full Cover Preview</p>
                    </div>
                    {showTrimLines && (
                      <div className="trim-guides">
                        {/* Trim guides would be rendered here */}
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
                  ♻️ Regenerate
                </Button>
                <Button 
                  className="download-button"
                  onClick={handleDownloadCover}
                  disabled={!fullCoverGenerated}
                >
                  ⬇️ Download Full Cover
                </Button>
                <Button 
                  variant="secondary" 
                  className="download-pdf-button"
                  onClick={handleDownloadCover}
                  disabled={!fullCoverGenerated}
                >
                  📄 Download as PDF
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageLayout>
  );
};

export default BookCoverCreator; 