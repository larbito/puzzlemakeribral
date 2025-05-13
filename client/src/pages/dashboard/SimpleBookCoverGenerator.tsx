import React, { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Download, Sparkles, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Constants
const API_URL = import.meta.env.VITE_API_URL || 'https://puzzlemakeribral-production.up.railway.app';

// Simple book cover generator with minimal dependencies
const SimpleBookCoverGenerator = () => {
  // State
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [error, setError] = useState('');
  
  // Generate book cover function - using the approach from T-shirt generator
  const generateCover = async () => {
    if (prompt.trim().length < 5) {
      toast.error('Please enter at least 5 characters for your prompt');
      return;
    }
    
    setIsGenerating(true);
    setError('');
    console.log('Starting cover generation with prompt:', prompt);
    
    try {
      // Check if API is healthy
      console.log('Checking API health...');
      const healthResponse = await fetch(`${API_URL}/health`);
      
      if (!healthResponse.ok) {
        throw new Error('API server is not responding. Please try again later.');
      }
      
      // Calculate dimensions first
      console.log('Calculating cover dimensions...');
      const dimensionsResponse = await fetch(`${API_URL}/api/book-cover/calculate-dimensions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trimSize: '6x9',
          pageCount: 100,
          bookType: 'paperback',
          includeBleed: true
        })
      });
      
      if (!dimensionsResponse.ok) {
        throw new Error('Failed to calculate dimensions');
      }
      
      const dimensions = await dimensionsResponse.json();
      console.log('Dimensions calculated:', dimensions);
      
      // Similar to T-shirt generator, use FormData for the API call
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('width', dimensions.dimensions.frontCover.widthPx.toString());
      formData.append('height', dimensions.dimensions.frontCover.heightPx.toString());
      formData.append('negative_prompt', 'text, watermark, signature, blurry, low quality, distorted, deformed');
      
      console.log('Sending generation request to Ideogram API endpoint...');
      
      // Use ideogram endpoint similar to T-shirt generator
      const generateResponse = await fetch(`${API_URL}/api/ideogram/generate`, {
        method: 'POST',
        body: formData
      });
      
      console.log('Response status:', generateResponse.status);
      
      if (!generateResponse.ok) {
        const errorText = await generateResponse.text();
        console.error('Error response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText };
        }
        
        throw new Error(errorData.error || `API Error: ${generateResponse.status}`);
      }
      
      // Parse the successful response
      const data = await generateResponse.json();
      console.log('Generation successful:', data);
      
      if (data.imageUrl) {
        setCoverImage(data.imageUrl);
        toast.success('Cover generated successfully!');
      } else {
        console.warn('No image URL in response, using placeholder');
        // If no image URL is returned, use a placeholder
        const placeholderUrl = `https://placehold.co/${dimensions.dimensions.frontCover.widthPx}x${dimensions.dimensions.frontCover.heightPx}/4ade80/FFFFFF?text=Cover+Placeholder`;
        setCoverImage(placeholderUrl);
        toast.warning('Using placeholder - API key may not be configured');
      }
    } catch (err: any) {
      console.error('Error generating cover:', err);
      setError(err.message || 'Failed to generate cover');
      toast.error(err.message || 'Failed to generate cover');
      
      // Set a placeholder on error
      setCoverImage('https://placehold.co/600x800/ff5555/FFFFFF?text=Error:+' + encodeURIComponent(err.message || 'Generation+Failed'));
    } finally {
      setIsGenerating(false);
    }
  };

  // Download the generated cover
  const handleDownload = async (imageUrl: string) => {
    if (!imageUrl) return;
    
    setIsDownloading(true);
    try {
      // Create a direct download link
      const link = document.createElement('a');
      
      // If it's a data URL, download directly
      if (imageUrl.startsWith('data:')) {
        link.href = imageUrl;
      } else {
        // Otherwise use our proxy endpoint like the T-shirt generator
        link.href = `${API_URL}/api/ideogram/proxy-image?url=${encodeURIComponent(imageUrl)}&filename=book-cover.png`;
      }
      
      link.download = 'book-cover.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Cover downloaded successfully!');
    } catch (err: any) {
      console.error('Error downloading cover:', err);
      toast.error('Failed to download cover');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-green-400 mb-6">Book Cover Generator</h1>
        <p className="mb-8 text-gray-300">Create professional book covers using AI with direct API integration.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Panel - Controls */}
          <div className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Design Your Cover
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="coverPrompt" className="text-gray-300 mb-2 block">Describe your book cover</Label>
                  <textarea
                    id="coverPrompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white min-h-[150px]"
                    placeholder="Describe what you want on your book cover... (min 5 characters)"
                  />
                  {prompt.trim().length > 0 && prompt.trim().length < 5 && (
                    <p className="text-red-400 mt-1 text-sm">Please enter at least 5 characters</p>
                  )}
                  <p className="text-gray-500 mt-2 text-sm">
                    {prompt.length}/500 characters
                  </p>
                </div>
                
                <Button 
                  onClick={generateCover}
                  disabled={isGenerating || prompt.trim().length < 5}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Cover
                    </>
                  )}
                </Button>
                
                {error && (
                  <div className="p-4 bg-red-900/50 border border-red-800 rounded-lg">
                    <h3 className="font-medium text-red-400">Error</h3>
                    <p className="text-sm">{error}</p>
                  </div>
                )}
                
                <div className="text-xs text-gray-500 mt-4">
                  <h4 className="font-medium text-gray-400">API Information:</h4>
                  <p>API URL: {API_URL}</p>
                  <p>Using Ideogram integration</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right Panel - Preview */}
          <div>
            <Card className="bg-gray-800 border-gray-700 overflow-hidden h-full flex flex-col">
              <CardHeader className="border-b border-gray-700">
                <CardTitle className="text-white flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Cover Preview
                  </span>
                  
                  {coverImage && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(coverImage)}
                      disabled={isDownloading}
                    >
                      {isDownloading ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-1" />
                      )}
                      Download
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              
              <div className="flex-1 flex items-center justify-center bg-gray-900 p-6">
                {isGenerating ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-12 h-12 animate-spin text-green-400" />
                    <p className="font-medium">Creating your book cover</p>
                    <p className="text-sm text-gray-400">This may take 10-20 seconds...</p>
                  </div>
                ) : coverImage ? (
                  <div className="relative">
                    <img 
                      src={coverImage}
                      alt="Generated Book Cover"
                      className="max-w-full max-h-[500px] object-contain shadow-lg rounded"
                    />
                  </div>
                ) : (
                  <div className="text-center max-w-md">
                    <BookOpen className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                    <p className="text-xl font-medium mb-2">Create your book cover</p>
                    <p className="text-sm text-gray-400">
                      Enter your prompt on the left and click "Generate Cover" to create a unique book cover with AI.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleBookCoverGenerator; 