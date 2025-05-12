import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import ToggleSwitch from '../../components/ui/toggleSwitch';
import UploadField from '../../components/ui/uploadField';
import { Card } from '@/components/ui/card';
import ColorThief from 'colorthief';

import './AIBookCoverGenerator.css';

const AIBookCoverGenerator = () => {
  const [bookType, setBookType] = useState('paperback');
  const [trimSize, setTrimSize] = useState('6x9');
  const [pageCount, setPageCount] = useState(100);
  const [paperColor, setPaperColor] = useState('white');
  const [spineText, setSpineText] = useState('');
  const [coverDescription, setCoverDescription] = useState('');
  const [showGuides, setShowGuides] = useState(false);
  const [addInteriorImages, setAddInteriorImages] = useState(false);
  const [spineColor, setSpineColor] = useState('');
  const [dominantColors, setDominantColors] = useState<string[]>([]);
  const [showRuler, setShowRuler] = useState(false);
  const [imageResolution, setImageResolution] = useState({ width: 1875, height: 2775 });

  useEffect(() => {
    // Placeholder for color extraction logic
    const extractColors = () => {
      // Example colors
      setDominantColors(['#FF5733', '#33FF57', '#3357FF', '#FF33A1']);
    };

    extractColors();
  }, []);

  return (
    <PageLayout
      title="AI Book Cover Generator"
      description="Create stunning book covers with AI technology"
    >
      <div className="ai-book-cover-generator">
        <div className="left-panel">
          <Card className="specifications">
            <h2 className="section-title">Book Specifications</h2>
            <Select
              value={bookType}
              onValueChange={setBookType}
            >
              <option value="Paperback">Paperback</option>
              <option value="Hardcover">Hardcover</option>
            </Select>
            <Select
              value={trimSize}
              onValueChange={setTrimSize}
            >
              <option value="6x9">6x9</option>
              <option value="5.5x8.5">5.5x8.5</option>
            </Select>
            <Slider
              value={[pageCount]}
              onValueChange={(value) => setPageCount(value[0])}
              min={24}
              max={800}
            />
            <p>Page Count: {pageCount}</p>
            <Select
              value={paperColor}
              onValueChange={setPaperColor}
            >
              <option value="White">White</option>
              <option value="Cream">Cream</option>
              <option value="Color">Color</option>
            </Select>
            {pageCount >= 100 && (
              <div className="input-wrapper">
                <label>Spine Text (optional)</label>
                <Input
                  value={spineText}
                  onChange={(e) => setSpineText(e.target.value)}
                  placeholder="Enter spine text..."
                />
              </div>
            )}
            <div className="auto-calculation">
              <p>Final Dimensions with Bleed:</p>
              <p>Width x Height: 6.25" x 9.25"</p>
              <p>Spine Width: 0.5"</p>
              <p>Resolution: {imageResolution.width} x {imageResolution.height} pixels</p>
              <p>DPI: 300</p>
              <p>Estimated Print Quality: {imageResolution.width >= 1875 && imageResolution.height >= 2775 ? 'Perfect for KDP' : 'Too low'}</p>
            </div>
            <div className="textarea-wrapper">
              <label>Cover Description</label>
              <Textarea
                value={coverDescription}
                onChange={(e) => setCoverDescription(e.target.value)}
                placeholder="Describe your book cover..."
              />
            </div>
            <ToggleSwitch
              label="Show trim and spine guides"
              checked={showGuides}
              onChange={setShowGuides}
            />
            <ToggleSwitch
              label="Show Ruler Overlay"
              checked={showRuler}
              onChange={setShowRuler}
            />
            <Button className="generate-button">Generate Book Cover</Button>
          </Card>

          <Card className="interior-preview">
            <h2 className="section-title">Interior Preview Images</h2>
            <ToggleSwitch
              label="Add Interior Images to Back Cover"
              checked={addInteriorImages}
              onChange={setAddInteriorImages}
            />
            {addInteriorImages && (
              <UploadField
                label="Add up to 6 preview images"
                maxFiles={6}
              />
            )}
            <Button className="create-full-cover-button">Create Full Cover</Button>
          </Card>

          <Card className="spine-color-picker">
            <h2 className="section-title">Choose Spine Color</h2>
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
          </Card>
        </div>

        <div className="right-panel">
          {/* Right panel content will go here */}
        </div>
      </div>
    </PageLayout>
  );
};

export default AIBookCoverGenerator; 