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

import './BookCoverCreator.css';

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

  // Calculate spine width based on page count
  const calculateSpineWidth = () => {
    const pagesPerInch = paperColor === 'white' ? 434 : 370;
    return (pageCount / pagesPerInch).toFixed(2);
  };

  // Calculate final dimensions with bleed
  const calculateDimensions = () => {
    const [width, height] = trimSize.split('x').map(Number);
    return {
      width: width + 0.25,
      height: height + 0.25,
      spineWidth: calculateSpineWidth()
    };
  };

  const dimensions = calculateDimensions();

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
      } else {
        alert('You can only upload up to 6 images.');
      }
    }
  };

  // Remove uploaded image
  const removeImage = (index: number) => {
    const newImages = [...uploadedImages];
    newImages.splice(index, 1);
    setUploadedImages(newImages);
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
                    <SelectItem value="6x9">6" x 9"</SelectItem>
                    <SelectItem value="5.5x8.5">5.5" x 8.5"</SelectItem>
                    <SelectItem value="5x8">5" x 8"</SelectItem>
                    <SelectItem value="8x10">8" x 10"</SelectItem>
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
                <Textarea
                  id="coverDescription"
                  value={coverDescription}
                  onChange={(e) => setCoverDescription(e.target.value)}
                  placeholder="Describe your book cover concept..."
                  rows={4}
                />
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

              <Button className="generate-button">Generate Front Cover</Button>
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
                  <Label htmlFor="imageUpload">Upload up to 6 images (JPG, PNG, WebP - max 2MB each)</Label>
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
                <div className="preview-placeholder">
                  <p>Generate a cover to see the preview</p>
                </div>
                <div className="zoom-controls">
                  <button className={zoom === '100' ? 'active' : ''} onClick={() => setZoom('100')}>100%</button>
                  <button className={zoom === '150' ? 'active' : ''} onClick={() => setZoom('150')}>150%</button>
                  <button className={zoom === 'fit' ? 'active' : ''} onClick={() => setZoom('fit')}>Fit</button>
                </div>
              </div>
              <div className="action-buttons">
                <Button variant="outline" className="regenerate-button">Regenerate</Button>
                <Button className="create-full-button">Create Full Cover</Button>
                <Button variant="secondary" className="download-button">Download Cover</Button>
              </div>
            </TabsContent>
            <TabsContent value="full" className="preview-content">
              <div className="preview-container">
                <div className="preview-placeholder">
                  <p>Generate a full cover to see the preview</p>
                </div>
                <div className="zoom-controls">
                  <button className={zoom === '100' ? 'active' : ''} onClick={() => setZoom('100')}>100%</button>
                  <button className={zoom === '150' ? 'active' : ''} onClick={() => setZoom('150')}>150%</button>
                  <button className={zoom === 'fit' ? 'active' : ''} onClick={() => setZoom('fit')}>Fit</button>
                </div>
              </div>
              <div className="action-buttons">
                <Button variant="outline" className="regenerate-button">Regenerate</Button>
                <Button className="download-button">Download Full Cover</Button>
                <Button variant="secondary" className="download-pdf-button">Download as PDF</Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageLayout>
  );
};

export default BookCoverCreator; 