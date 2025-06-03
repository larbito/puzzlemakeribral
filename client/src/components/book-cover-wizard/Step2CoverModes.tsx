import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  PencilRuler, 
  Sparkles, 
  RefreshCcw, 
  Eye,
  FileImage,
  Wand2,
  Loader2,
  CheckCircle2,
  Brain
} from 'lucide-react';
import { toast } from 'sonner';
import { BookSettings, CoverData } from '../../pages/dashboard/BookCoverWizard';
import { getDALLESize } from '../../utils/book-cover/dimensionUtils';
import { 
  analyzeImageWithAI, 
  enhancePrompt, 
  generateFrontCover,
  fileToBase64 
} from '../../utils/book-cover/apiHelpers';

interface Step2CoverModesProps {
  bookSettings: BookSettings;
  coverData: CoverData;
  updateCoverData: (data: Partial<CoverData>) => void;
  setLoading: (loading: boolean, message?: string) => void;
  onNext: () => void;
}

const GENRES = [
  { id: 'literary', name: 'Literary Fiction', emoji: '📖' },
  { id: 'thriller', name: 'Thriller/Mystery', emoji: '🔍' },
  { id: 'romance', name: 'Romance', emoji: '❤️' },
  { id: 'fantasy', name: 'Fantasy', emoji: '🐉' },
  { id: 'scifi', name: 'Science Fiction', emoji: '🚀' },
  { id: 'children', name: 'Children\'s', emoji: '🧸' },
  { id: 'nonfiction', name: 'Non-Fiction', emoji: '📊' },
  { id: 'memoir', name: 'Memoir', emoji: '✍️' },
];

const Step2CoverModes: React.FC<Step2CoverModesProps> = ({
  bookSettings,
  coverData,
  updateCoverData,
  setLoading,
  onNext,
}) => {
  const [activeMode, setActiveMode] = useState<'upload' | 'prompt'>('upload');
  const [selectedGenre, setSelectedGenre] = useState('literary');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analyzedPrompt, setAnalyzedPrompt] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [enhancedPrompt, setEnhancedPrompt] = useState('');

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, etc.)');
      return;
    }

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File size must be less than 20MB');
      return;
    }

    setUploadedFile(file);
    
    try {
      setLoading(true, 'Analyzing image with AI...');
      
      const result = await analyzeImageWithAI(file);
      setAnalyzedPrompt((result as any).prompt || (result as any).description || '');
      
      toast.success('Image analyzed successfully!');
    } catch (error) {
      console.error('Image analysis error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to analyze image');
    } finally {
      setLoading(false);
    }
  };

  // Handle drag and drop
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setUploadedFile(file);
        handleFileUpload({ target: { files: [file] } } as any);
      } else {
        toast.error('Please drop an image file');
      }
    }
  };

  // Enhance user prompt
  const handleEnhancePrompt = async () => {
    if (!userPrompt.trim()) {
      toast.error('Please enter a prompt first');
      return;
    }

    try {
      setLoading(true, 'Enhancing prompt with GPT-4...');
      
      const result = await enhancePrompt(
        userPrompt, 
        selectedGenre,
        'Create a professional book cover design'
      );
      
      setEnhancedPrompt((result as any).enhancedPrompt || (result as any).prompt || userPrompt);
      toast.success('Prompt enhanced!');
    } catch (error) {
      console.error('Prompt enhancement error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to enhance prompt');
    } finally {
      setLoading(false);
    }
  };

  // Generate front cover
  const handleGenerateCover = async (promptToUse: string) => {
    if (!promptToUse.trim()) {
      toast.error('Please provide a prompt for cover generation');
      return;
    }

    try {
      setLoading(true, 'Generating front cover with DALL·E...');
      
      const dalleSize = getDALLESize(
        bookSettings.dimensions.frontWidth,
        bookSettings.dimensions.frontHeight
      );
      
      const result = await generateFrontCover(promptToUse, dalleSize, 'hd', 'vivid');
      
      updateCoverData({
        frontCoverImage: (result as any).url,
        frontCoverPrompt: promptToUse,
      });
      
      toast.success('Front cover generated successfully!');
    } catch (error) {
      console.error('Cover generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate cover');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = Boolean(coverData.frontCoverImage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Front Cover Creation</h2>
        <p className="text-zinc-400">
          Upload an image for AI analysis or write a custom prompt
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-400">
                <Wand2 className="h-5 w-5" />
                Choose Your Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeMode} onValueChange={(value) => setActiveMode(value as 'upload' | 'prompt')}>
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-zinc-800">
                  <TabsTrigger value="upload" className="data-[state=active]:bg-zinc-700">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload & Analyze
                  </TabsTrigger>
                  <TabsTrigger value="prompt" className="data-[state=active]:bg-zinc-700">
                    <PencilRuler className="h-4 w-4 mr-2" />
                    Write Prompt
                  </TabsTrigger>
                </TabsList>

                {/* Upload Mode */}
                <TabsContent value="upload" className="space-y-6">
                  <div
                    className="border-2 border-dashed border-zinc-600 rounded-xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    <input
                      id="file-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    
                    <div className="space-y-4">
                      <div className="mx-auto w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
                        {uploadedFile ? (
                          <CheckCircle2 className="h-8 w-8 text-green-400" />
                        ) : (
                          <Upload className="h-8 w-8 text-zinc-400" />
                        )}
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium text-white mb-2">
                          {uploadedFile ? 'Image Uploaded!' : 'Upload Your Cover Image'}
                        </h3>
                        <p className="text-sm text-zinc-400">
                          Drag & drop or click to browse • PNG, JPG • Max 20MB
                        </p>
                        {uploadedFile && (
                          <p className="text-sm text-green-400 mt-2">
                            📁 {uploadedFile.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {analyzedPrompt && (
                    <div className="space-y-4">
                      <Label className="text-white font-medium">AI Analysis Result</Label>
                      <Textarea
                        value={analyzedPrompt}
                        onChange={(e) => setAnalyzedPrompt(e.target.value)}
                        rows={4}
                        className="bg-zinc-800 border-zinc-700"
                        placeholder="AI will analyze your image and describe it here..."
                      />
                      
                      <Button
                        onClick={() => handleGenerateCover(analyzedPrompt)}
                        disabled={!analyzedPrompt.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-500"
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Cover from Analysis
                      </Button>
                    </div>
                  )}
                </TabsContent>

                {/* Prompt Mode */}
                <TabsContent value="prompt" className="space-y-6">
                  <div className="space-y-4">
                    <Label className="text-white font-medium">Select Genre/Style</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {GENRES.map((genre) => (
                        <button
                          key={genre.id}
                          onClick={() => setSelectedGenre(genre.id)}
                          className={`p-3 rounded-lg border transition-all ${
                            selectedGenre === genre.id
                              ? 'border-blue-500 bg-blue-950/30'
                              : 'border-zinc-700 bg-zinc-800 hover:border-blue-600'
                          }`}
                        >
                          <div className="text-center">
                            <div className="text-xl mb-1">{genre.emoji}</div>
                            <div className="text-xs text-zinc-300">{genre.name}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-white font-medium">Your Prompt</Label>
                    <Textarea
                      value={userPrompt}
                      onChange={(e) => setUserPrompt(e.target.value)}
                      rows={4}
                      className="bg-zinc-800 border-zinc-700"
                      placeholder="Describe your ideal book cover... (e.g., 'A mystical forest with glowing fireflies, elegant title typography, dark fantasy atmosphere')"
                    />
                    
                    <Button
                      onClick={handleEnhancePrompt}
                      disabled={!userPrompt.trim()}
                      variant="outline"
                      className="w-full border-zinc-600 hover:bg-zinc-800"
                    >
                      <Brain className="mr-2 h-4 w-4" />
                      Enhance with AI
                    </Button>
                  </div>

                  {enhancedPrompt && (
                    <div className="space-y-4">
                      <Label className="text-white font-medium">Enhanced Prompt</Label>
                      <Textarea
                        value={enhancedPrompt}
                        onChange={(e) => setEnhancedPrompt(e.target.value)}
                        rows={4}
                        className="bg-zinc-800 border-zinc-700"
                      />
                      
                      <Button
                        onClick={() => handleGenerateCover(enhancedPrompt)}
                        disabled={!enhancedPrompt.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-500"
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Cover
                      </Button>
                    </div>
                  )}

                  {userPrompt && !enhancedPrompt && (
                    <Button
                      onClick={() => handleGenerateCover(userPrompt)}
                      disabled={!userPrompt.trim()}
                      className="w-full bg-blue-600 hover:bg-blue-500"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Cover (Original Prompt)
                    </Button>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Preview Sidebar */}
        <div className="space-y-6">
          {/* Cover Preview */}
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-green-400 text-lg">Front Cover Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {coverData.frontCoverImage ? (
                <div className="space-y-4">
                  <div className="aspect-[2/3] bg-zinc-800 rounded-lg overflow-hidden">
                    <img
                      src={coverData.frontCoverImage}
                      alt="Generated front cover"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        const promptToUse = enhancedPrompt || analyzedPrompt || userPrompt;
                        if (promptToUse) handleGenerateCover(promptToUse);
                      }}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-zinc-600"
                    >
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      Regenerate
                    </Button>
                  </div>
                  
                  <div className="text-xs text-zinc-400">
                    <strong>Dimensions:</strong> {bookSettings.dimensions.frontWidth}" × {bookSettings.dimensions.frontHeight}"
                  </div>
                </div>
              ) : (
                <div className="aspect-[2/3] bg-zinc-800 rounded-lg flex items-center justify-center">
                  <div className="text-center text-zinc-500">
                    <FileImage className="h-12 w-12 mx-auto mb-2" />
                    <p>Cover will appear here</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress Status */}
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardContent className="p-6">
              <div className="text-center">
                {canProceed ? (
                  <div className="space-y-3">
                    <CheckCircle2 className="h-8 w-8 text-green-400 mx-auto" />
                    <div>
                      <div className="text-green-400 font-medium">Front Cover Ready</div>
                      <div className="text-sm text-zinc-400 mt-1">
                        Continue to create back cover
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Sparkles className="h-8 w-8 text-zinc-400 mx-auto" />
                    <div>
                      <div className="text-zinc-400 font-medium">Generate Cover</div>
                      <div className="text-sm text-zinc-500 mt-1">
                        Upload an image or write a prompt
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Continue Button */}
      {canProceed && (
        <div className="flex justify-center pt-6">
          <Button
            onClick={onNext}
            size="lg"
            className="bg-blue-600 hover:bg-blue-500 px-8"
          >
            Continue to Back Cover
          </Button>
        </div>
      )}
    </div>
  );
};

export default Step2CoverModes; 