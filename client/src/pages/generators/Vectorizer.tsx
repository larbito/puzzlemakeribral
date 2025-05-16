import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, Upload, Download, Image as ImageIcon, FileImage, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Slider
} from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Vectorizer = () => {
  const navigate = useNavigate();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [inspectLoading, setInspectLoading] = useState<boolean>(false);
  const [options, setOptions] = useState<any[]>([]);
  const [selectedOption, setSelectedOption] = useState<any>({
    threshold: 128,
    steps: 1,
    background: '#ffffff',
    fillStrategy: 'dominant'
  });
  const [activeTab, setActiveTab] = useState<string>('upload');
  const [uploadMethod, setUploadMethod] = useState<'drag' | 'form'>('drag');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
        console.log("Preview created for file:", file.name, file.type, file.size);
      };
      reader.readAsDataURL(file);

      // Clear previous results
      setSvg(null);
      setOptions([]);
      setSelectedOption({
        threshold: 128,
        steps: 1,
        background: '#ffffff',
        fillStrategy: 'dominant'
      });
      
      // Auto-inspect the image
      inspectImage(file);
    }
  };

  const inspectImage = async (file: File) => {
    setInspectLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      // Use absolute URL for production deployment
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? 'https://puzzle-craft-forge-production.up.railway.app/api/vectorize/inspect'
        : '/api/vectorize/inspect';
        
      const response = await axios.post(
        apiUrl,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      if (response.data.status === 'success' && response.data.options) {
        setOptions(response.data.options);
        if (response.data.options.length > 0) {
          setSelectedOption(response.data.options[0]);
        }
        toast.success('Image inspection successful', {
          description: 'Ready to vectorize with suggested options.',
        });
      } else {
        toast.info('Image inspection notice', {
          description: response.data.message || 'Using default options.',
        });
      }
    } catch (error) {
      console.error('Error inspecting image:', error);
      toast.error('Image inspection failed', {
        description: 'Using default options for vectorization.',
      });
    } finally {
      setInspectLoading(false);
    }
  };

  const vectorizeImage = async () => {
    if (!imageFile) {
      toast.error('Please select an image first');
      return;
    }
    
    setLoading(true);
    console.log('Starting vectorization process');
    console.log('Image file:', imageFile.name, imageFile.type, imageFile.size, 'bytes');
    console.log('Options:', selectedOption);
    
    try {
      // Create a new Form for direct submission in production
      if (process.env.NODE_ENV === 'production') {
        // Create a form element and submit directly
        const formElement = document.createElement('form');
        formElement.method = 'POST';
        formElement.action = 'https://puzzle-craft-forge-production.up.railway.app/api/vectorize/direct';
        formElement.enctype = 'multipart/form-data';
        formElement.target = '_blank'; // Open result in new tab
        
        // Create the file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.name = 'image';
        fileInput.style.display = 'none';
        
        // Use the File object directly
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(imageFile);
        fileInput.files = dataTransfer.files;
        
        // Create options input
        const optionsInput = document.createElement('input');
        optionsInput.type = 'hidden';
        optionsInput.name = 'options';
        optionsInput.value = JSON.stringify(selectedOption);
        
        // Add inputs to form
        formElement.appendChild(fileInput);
        formElement.appendChild(optionsInput);
        
        // Add form to body, submit, and remove
        document.body.appendChild(formElement);
        
        // Create a fancy toast with a button
        toast("Direct vectorization activated", {
          description: "Your file is being processed directly. Check the new tab for results.",
          action: {
            label: "Submit",
            onClick: () => formElement.submit()
          },
          duration: 10000
        });
        
        setTimeout(() => {
          document.body.removeChild(formElement);
          setLoading(false);
        }, 3000);
        
        return;
      }
      
      // For local development, use axios
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('options', JSON.stringify(selectedOption));
      
      const response = await axios.post(
        '/api/vectorize',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000 // 60 seconds timeout
        }
      );
      
      if (response.data.status === 'success' && response.data.svg) {
        setSvg(response.data.svg);
        setActiveTab('result');
        toast.success('Vectorization successful', {
          description: 'Your image has been converted to SVG.',
        });
      } else {
        toast.error('Vectorization failed', {
          description: response.data.message || 'An error occurred during vectorization.',
        });
      }
    } catch (error) {
      console.error('Error vectorizing image:', error);
      toast.error('Vectorization failed', {
        description: 'An error occurred during the conversion process.',
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadSvg = () => {
    if (!svg) return;
    
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vectorized-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-2">PNG to SVG Vectorizer</h1>
      <p className="text-muted-foreground mb-3">
        Convert raster images to scalable vector graphics
      </p>
      <div className="flex justify-end my-3">
        <Button 
          variant="outline" 
          onClick={() => window.open('/direct-upload.html', '_blank')}
          className="text-sm"
        >
          Alternative Upload Form ↗
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="upload">1. Upload & Configure</TabsTrigger>
          <TabsTrigger value="result" disabled={!svg}>2. Results</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image Upload Card */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Image</CardTitle>
                <CardDescription>
                  Select a PNG image to convert to SVG
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex items-center justify-center space-x-2 mb-3">
                    <button
                      type="button"
                      className={`px-3 py-1 rounded ${uploadMethod === 'drag' ? 'bg-primary text-white' : 'bg-gray-200'}`}
                      onClick={() => setUploadMethod('drag')}
                    >
                      Drag & Drop
                    </button>
                    <button
                      type="button"
                      className={`px-3 py-1 rounded ${uploadMethod === 'form' ? 'bg-primary text-white' : 'bg-gray-200'}`}
                      onClick={() => setUploadMethod('form')}
                    >
                      Upload Form
                    </button>
                  </div>
                  
                  {uploadMethod === 'drag' ? (
                    <div
                      className={`border-2 border-dashed rounded-lg p-4 text-center ${
                        previewUrl ? 'border-primary' : 'border-muted-foreground'
                      }`}
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.currentTarget.classList.add('border-primary');
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!previewUrl) {
                          e.currentTarget.classList.remove('border-primary');
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // Handle dropped files
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          const file = e.dataTransfer.files[0];
                          if (file.type.match(/image\/(png|jpeg|jpg)/)) {
                            setImageFile(file);
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setPreviewUrl(reader.result as string);
                              console.log("Preview created for dropped file:", file.name, file.type, file.size);
                            };
                            reader.readAsDataURL(file);
                            
                            // Reset states and inspect new image
                            setSvg(null);
                            setOptions([]);
                            setSelectedOption({
                              threshold: 128,
                              steps: 1,
                              background: '#ffffff',
                              fillStrategy: 'dominant'
                            });
                            
                            inspectImage(file);
                          } else {
                            toast.error("Please upload a PNG or JPG image");
                          }
                        }
                      }}
                      style={{ minHeight: '250px', cursor: 'pointer' }}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        className="hidden"
                        accept="image/png,image/jpeg"
                        aria-label="Upload image"
                      />
                      
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="max-h-64 mx-auto"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full">
                          <FileImage className="w-12 h-12 mb-2 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            Click to upload or drag and drop<br />
                            PNG or JPG (max 10MB)
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <form 
                      className="space-y-4 p-4 border border-muted rounded-lg"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formElement = e.currentTarget as HTMLFormElement;
                        const fileInput = formElement.querySelector('input[type="file"]') as HTMLInputElement;
                        
                        if (fileInput?.files?.[0]) {
                          const file = fileInput.files[0];
                          setImageFile(file);
                          
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setPreviewUrl(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                          
                          setSvg(null);
                          setOptions([]);
                          setSelectedOption({
                            threshold: 128,
                            steps: 1,
                            background: '#ffffff',
                            fillStrategy: 'dominant'
                          });
                          
                          inspectImage(file);
                        } else {
                          toast.error("Please select a file");
                        }
                      }}
                    >
                      <div>
                        <Label htmlFor="directFileUpload">Select image file:</Label>
                        <Input
                          id="directFileUpload"
                          type="file"
                          name="image"
                          accept="image/png,image/jpeg"
                          className="mt-1"
                          required
                        />
                      </div>
                      
                      {previewUrl && (
                        <div className="mt-4">
                          <p className="text-sm font-medium mb-2">Preview:</p>
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="max-h-48 mx-auto"
                          />
                        </div>
                      )}
                      
                      <Button type="submit" variant="secondary" className="w-full">
                        Upload Image
                      </Button>
                    </form>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" /> Change Image
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => inspectImage(imageFile!)}
                  disabled={!imageFile || inspectLoading}
                >
                  {inspectLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  {inspectLoading ? 'Analyzing...' : 'Re-analyze'}
                </Button>
              </CardFooter>
            </Card>
            
            {/* Options Card */}
            <Card>
              <CardHeader>
                <CardTitle>Vectorization Options</CardTitle>
                <CardDescription>
                  Customize how your image is converted
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="threshold" className="mb-2 block">Threshold: {selectedOption.threshold}</Label>
                    <Slider
                      id="threshold"
                      min={0}
                      max={255}
                      step={1}
                      value={[selectedOption.threshold]}
                      onValueChange={(value) => setSelectedOption({...selectedOption, threshold: value[0]})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="steps" className="mb-2 block">Color Steps: {selectedOption.steps}</Label>
                    <Slider
                      id="steps"
                      min={1}
                      max={10}
                      step={1}
                      value={[selectedOption.steps]}
                      onValueChange={(value) => setSelectedOption({...selectedOption, steps: value[0]})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="background" className="mb-2 block">Background Color</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="background"
                        type="color"
                        value={selectedOption.background}
                        onChange={(e) => setSelectedOption({...selectedOption, background: e.target.value})}
                        className="w-12 h-10"
                      />
                      <Input
                        type="text"
                        value={selectedOption.background}
                        onChange={(e) => setSelectedOption({...selectedOption, background: e.target.value})}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="fillStrategy" className="mb-2 block">Fill Strategy</Label>
                    <Select 
                      value={selectedOption.fillStrategy} 
                      onValueChange={(value) => setSelectedOption({...selectedOption, fillStrategy: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a strategy" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dominant">Dominant Color</SelectItem>
                        <SelectItem value="median">Median Color</SelectItem>
                        <SelectItem value="mean">Mean Color</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={vectorizeImage} 
                  disabled={!imageFile || loading}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ImageIcon className="mr-2 h-4 w-4" />
                  )}
                  {loading ? 'Converting...' : 'Vectorize Image'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="result">
          <div className="grid grid-cols-1 gap-6">
            {/* Result Card */}
            <Card>
              <CardHeader>
                <CardTitle>Vectorized Result</CardTitle>
                <CardDescription>
                  Your image has been converted to SVG
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 bg-muted/20 min-h-[400px] flex items-center justify-center">
                  {svg ? (
                    <div 
                      className="max-w-full max-h-[400px] overflow-auto"
                      dangerouslySetInnerHTML={{ __html: svg }}
                    />
                  ) : (
                    <p className="text-muted-foreground text-center">No SVG generated yet</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('upload')}
                >
                  Back to Editor
                </Button>
                
                <Button onClick={downloadSvg} disabled={!svg}>
                  <Download className="mr-2 h-4 w-4" />
                  Download SVG
                </Button>
              </CardFooter>
            </Card>
            
            {/* Preview Comparison Card */}
            {previewUrl && svg && (
              <Card>
                <CardHeader>
                  <CardTitle>Before & After</CardTitle>
                  <CardDescription>
                    Compare original image with vectorized result
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border rounded-lg p-2">
                      <p className="text-sm font-medium mb-2">Original</p>
                      <img 
                        src={previewUrl} 
                        alt="Original" 
                        className="max-h-48 mx-auto"
                      />
                    </div>
                    <div className="border rounded-lg p-2">
                      <p className="text-sm font-medium mb-2">Vectorized</p>
                      <div 
                        className="max-h-48 mx-auto"
                        dangerouslySetInnerHTML={{ __html: svg }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Vectorizer; 