import React, { useState } from 'react';
import { toast } from 'sonner';

// Constants
const API_URL = import.meta.env.VITE_API_URL || 'https://puzzlemakeribral-production.up.railway.app';

// Simple book cover generator with minimal dependencies
const SimpleBookCoverGenerator = () => {
  // State
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [coverImage, setCoverImage] = useState('');
  const [error, setError] = useState('');
  
  // Simplified API call
  const generateCover = async () => {
    if (prompt.trim().length < 5) {
      setError('Please enter at least 5 characters');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // First check if the API is healthy
      const healthCheck = await fetch(`${API_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!healthCheck.ok) {
        throw new Error('API server is not responding. Please try again later.');
      }
      
      // Calculate dimensions first
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
      
      // Then generate the cover
      const generateResponse = await fetch(`${API_URL}/api/book-cover/generate-front`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          width: dimensions.dimensions.frontCover.widthPx,
          height: dimensions.dimensions.frontCover.heightPx,
          negative_prompt: 'text, watermark, signature, blurry, low quality'
        })
      });
      
      if (!generateResponse.ok) {
        const errorData = await generateResponse.json();
        throw new Error(errorData.error || 'Failed to generate cover');
      }
      
      const data = await generateResponse.json();
      console.log('Generated cover:', data);
      
      if (data.imageUrl) {
        setCoverImage(data.imageUrl);
        toast.success('Cover generated successfully!');
      } else {
        throw new Error('No image URL returned');
      }
    } catch (err: any) {
      console.error('Error generating cover:', err);
      setError(err.message || 'Something went wrong');
      toast.error(err.message || 'Failed to generate cover');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-green-400 mb-6">Simple Book Cover Generator</h1>
        <p className="mb-8 text-gray-300">Generate AI book covers with minimal UI and direct API calls.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block mb-2 font-medium">Describe your book cover</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                rows={6}
                placeholder="Describe what you want on your book cover... (min 5 characters)"
              />
              {prompt.trim().length > 0 && prompt.trim().length < 5 && (
                <p className="text-red-400 mt-1">Please enter at least 5 characters</p>
              )}
            </div>
            
            {/* Use regular HTML button */}
            <button
              onClick={generateCover}
              disabled={loading || prompt.trim().length < 5}
              className={`w-full py-3 px-4 rounded-lg font-medium ${
                loading || prompt.trim().length < 5
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {loading ? 'Generating...' : 'Generate Cover'}
            </button>
            
            {/* Fallback link approach */}
            <a 
              href="#generate"
              onClick={(e) => {
                e.preventDefault();
                if (!loading && prompt.trim().length >= 5) {
                  generateCover();
                }
              }}
              className={`block w-full py-3 px-4 rounded-lg font-medium text-center ${
                loading || prompt.trim().length < 5
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600'
              }`}
            >
              Alternate: Generate Cover
            </a>
            
            {/* Direct form with native browser behavior */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!loading && prompt.trim().length >= 5) {
                  generateCover();
                }
              }}
            >
              <input type="hidden" name="prompt" value={prompt} />
              <button
                type="submit"
                disabled={loading || prompt.trim().length < 5}
                className={`w-full py-3 px-4 rounded-lg font-medium ${
                  loading || prompt.trim().length < 5
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                Form Submit: Generate Cover
              </button>
            </form>
            
            {error && (
              <div className="p-4 bg-red-900/50 border border-red-800 rounded-lg">
                <h3 className="font-medium text-red-400">Error</h3>
                <p>{error}</p>
              </div>
            )}
            
            {/* Debug information */}
            <div className="p-4 bg-gray-800 rounded-lg text-xs">
              <h3 className="font-medium mb-2">Debug Info:</h3>
              <p>API URL: {API_URL}</p>
              <p>Prompt Length: {prompt.length}</p>
              <p>Loading State: {loading ? 'True' : 'False'}</p>
              <p>Has Result: {coverImage ? 'Yes' : 'No'}</p>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            {coverImage ? (
              <div className="relative">
                <img 
                  src={coverImage} 
                  alt="Generated Book Cover" 
                  className="w-full h-auto"
                />
                <a
                  href={coverImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
                >
                  Download
                </a>
              </div>
            ) : (
              <div className="flex items-center justify-center h-96 text-gray-500">
                <div className="text-center">
                  <div className="text-5xl mb-4">📚</div>
                  <p>Your generated cover will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleBookCoverGenerator; 