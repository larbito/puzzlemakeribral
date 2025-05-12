import React, { useState, useCallback, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

import {
  trimSizeOptions,
  paperTypeOptions,
  bindingTypeOptions,
  aiStylePresets,
  calculateCoverDimensions,
  type CoverDimensions
} from '@/lib/futuristicCoverUtils';

import {
  generateCoverImage,
  generateFullCover,
  downloadImage,
  type GenerateCoverParams,
  type FullCoverParams
} from '@/lib/futuristicApi';

import {
  Book,
  ImagePlus,
  Download,
  RefreshCw,
  Settings,
  Type,
  Palette,
  Layers,
  ArrowRight,
  Sparkles
} from 'lucide-react';

import './BookCoverCreator.css';

const BookCoverCreator = () => {
  // State management
  const [activeTab, setActiveTab] = useState('design');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [fullCover, setFullCover] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    prompt: '',
    style: aiStylePresets[0].value,
    trimSize: trimSizeOptions[0].value,
    pageCount: 200,
    paperType: paperTypeOptions[0].value,
    bindingType: bindingTypeOptions[0].value,
    spineText: '',
    backText: '',
  });

  // Dimensions calculation
  const [dimensions, setDimensions] = useState<CoverDimensions | null>(null);

  useEffect(() => {
    const dims = calculateCoverDimensions(
      formData.trimSize,
      formData.pageCount,
      formData.paperType,
      formData.bindingType
    );
    setDimensions(dims);
  }, [formData.trimSize, formData.pageCount, formData.paperType, formData.bindingType]);

  // Generate cover handler
  const handleGenerateCover = async () => {
    if (!dimensions) return;

    try {
      setLoading(true);
      setProgress(20);

      const params: GenerateCoverParams = {
        prompt: formData.prompt,
        style: formData.style,
        width: dimensions.pixelWidth,
        height: dimensions.pixelHeight,
        enhancePrompt: true
      };

      const imageUrl = await generateCoverImage(params);
      setCoverImage(imageUrl);
      setProgress(60);

      if (formData.bindingType !== 'saddle') {
        const fullParams: FullCoverParams = {
          frontCoverUrl: imageUrl,
          trimSize: formData.trimSize,
          pageCount: formData.pageCount,
          paperType: formData.paperType,
          bindingType: formData.bindingType,
          spineText: formData.spineText,
          backText: formData.backText
        };

        const fullCoverUrl = await generateFullCover(fullParams);
        setFullCover(fullCoverUrl);
      }

      setProgress(100);
      toast.success('Cover generated successfully!');
      setActiveTab('preview');
    } catch (error) {
      toast.error('Failed to generate cover. Please try again.');
      console.error('Error generating cover:', error);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  // Download handler
  const handleDownload = async () => {
    try {
      if (fullCover) {
        await downloadImage(fullCover, 'full-cover.png');
      } else if (coverImage) {
        await downloadImage(coverImage, 'front-cover.png');
      }
      toast.success('Cover downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download cover.');
      console.error('Error downloading cover:', error);
    }
  };

  return (
    <PageLayout
      title="Book Cover Creator"
      description="Create professional book covers with AI"
    >
      <div className="cover-creator">
        <div className="header">
          <div className="title-section">
            <Book className="icon" />
            <h1>Book Cover Creator</h1>
          </div>
          <p className="subtitle">Design stunning book covers with advanced AI technology</p>
        </div>

        <Card className="main-content">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="design">
                <Palette className="w-4 h-4 mr-2" />
                Design
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="text">
                <Type className="w-4 h-4 mr-2" />
                Text
              </TabsTrigger>
              <TabsTrigger value="preview">
                <Layers className="w-4 h-4 mr-2" />
                Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="design" className="space-y-4">
              <div className="form-group">
                <Label>Cover Concept</Label>
                <Textarea
                  placeholder="Describe your book cover concept..."
                  value={formData.prompt}
                  onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                />
              </div>

              <div className="form-group">
                <Label>Style</Label>
                <Select
                  value={formData.style}
                  onValueChange={(value) => setFormData({ ...formData, style: value })}
                >
                  {aiStylePresets.map((style) => (
                    <option key={style.value} value={style.value}>
                      {style.label}
                    </option>
                  ))}
                </Select>
              </div>

              <Button
                onClick={handleGenerateCover}
                disabled={loading || !formData.prompt}
                className="w-full"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Cover
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="form-group">
                <Label>Trim Size</Label>
                <Select
                  value={formData.trimSize}
                  onValueChange={(value) => setFormData({ ...formData, trimSize: value })}
                >
                  {trimSizeOptions.map((size) => (
                    <option key={size.value} value={size.value}>
                      {size.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="form-group">
                <Label>Page Count</Label>
                <Input
                  type="number"
                  min="24"
                  max="800"
                  value={formData.pageCount}
                  onChange={(e) => setFormData({ ...formData, pageCount: parseInt(e.target.value) })}
                />
              </div>

              <div className="form-group">
                <Label>Paper Type</Label>
                <Select
                  value={formData.paperType}
                  onValueChange={(value) => setFormData({ ...formData, paperType: value })}
                >
                  {paperTypeOptions.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="form-group">
                <Label>Binding Type</Label>
                <Select
                  value={formData.bindingType}
                  onValueChange={(value) => setFormData({ ...formData, bindingType: value })}
                >
                  {bindingTypeOptions.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="text" className="space-y-4">
              <div className="form-group">
                <Label>Spine Text</Label>
                <Input
                  placeholder="Enter spine text..."
                  value={formData.spineText}
                  onChange={(e) => setFormData({ ...formData, spineText: e.target.value })}
                  disabled={formData.bindingType === 'saddle'}
                />
              </div>

              <div className="form-group">
                <Label>Back Cover Text</Label>
                <Textarea
                  placeholder="Enter back cover text..."
                  value={formData.backText}
                  onChange={(e) => setFormData({ ...formData, backText: e.target.value })}
                  disabled={formData.bindingType === 'saddle'}
                />
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <div className="preview-container">
                {loading ? (
                  <div className="loading-state">
                    <RefreshCw className="w-8 h-8 animate-spin" />
                    <Progress value={progress} className="w-64" />
                    <p>Generating your cover...</p>
                  </div>
                ) : coverImage ? (
                  <div className="preview-content">
                    <img
                      src={fullCover || coverImage}
                      alt="Generated book cover"
                      className="preview-image"
                    />
                    <div className="preview-actions">
                      <Button onClick={handleGenerateCover} variant="outline">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Regenerate
                      </Button>
                      <Button onClick={handleDownload}>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state">
                    <ImagePlus className="w-12 h-12" />
                    <p>Your cover preview will appear here</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {loading && (
          <div className="progress-bar">
            <Progress value={progress} className="w-full" />
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default BookCoverCreator; 