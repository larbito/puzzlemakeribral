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
    console.log('Starting API calls to:', API_URL);
    
    try {
      // First check if the API is healthy
      console.log('Checking API health...');
      const healthCheck = await fetch(`${API_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const healthData = await healthCheck.json();
      console.log('Health check response:', healthData);
      
      if (!healthCheck.ok) {
        throw new Error('API server is not responding. Please try again later.');
      }
      
      // Check if API has Ideogram key configured
      const hasApiKey = healthData.ideogramApiKeyConfigured === true;
      console.log('API has Ideogram key configured:', hasApiKey);
      if (!hasApiKey) {
        console.warn('⚠️ Ideogram API key is not configured on the server');
        setError('Warning: Ideogram API key is not configured on the server. A placeholder will be used.');
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
      console.log('Sending generation request with params:', {
        prompt: prompt,
        width: dimensions.dimensions.frontCover.widthPx,
        height: dimensions.dimensions.frontCover.heightPx
      });
      
      const generateResponse = await fetch(`${API_URL}/api/book-cover/generate-front`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': window.location.origin,
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          prompt: prompt,
          width: dimensions.dimensions.frontCover.widthPx,
          height: dimensions.dimensions.frontCover.heightPx,
          negative_prompt: 'text, watermark, signature, blurry, low quality'
        }),
        credentials: 'include'
      });
      
      console.log('Generate response status:', generateResponse.status);
      console.log('Generate response headers:', Object.fromEntries([...generateResponse.headers]));
      
      const responseText = await generateResponse.text();
      console.log('Raw response:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed response data:', data);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        throw new Error('Invalid response format from server');
      }
      
      if (!generateResponse.ok) {
        throw new Error(data.error || 'Failed to generate cover');
      }
      
      if (data.imageUrl) {
        setCoverImage(data.imageUrl);
        toast.success('Cover generated successfully!');
      } else {
        console.warn('No imageUrl in response, using placeholder');
        // Use placeholder if no image URL is returned
        const placeholderUrl = `https://placehold.co/${dimensions.dimensions.frontCover.widthPx}x${dimensions.dimensions.frontCover.heightPx}/4ade80/FFFFFF?text=Cover+Placeholder`;
        setCoverImage(placeholderUrl);
        toast.warning('Using placeholder image - API key may not be configured');
        setError('No image URL returned from API - using placeholder');
      }
    } catch (err: any) {
      console.error('Error generating cover:', err);
      setError(err.message || 'Something went wrong');
      toast.error(err.message || 'Failed to generate cover');
    } finally {
      setLoading(false);
    }
  };
  
  // Add test function to diagnose API
  const testApiConnection = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Check API health
      const healthResponse = await fetch(`${API_URL}/health`, {
        method: 'GET'
      });
      
      const healthText = await healthResponse.text();
      let healthData;
      
      try {
        healthData = JSON.parse(healthText);
      } catch (e) {
        healthData = { text: healthText };
      }
      
      // Display API status
      console.log('API Health Check:', healthData);
      
      const diagReport = `
API Connection Test:
- Status: ${healthResponse.status}
- API URL: ${API_URL}
- API Key Configured: ${healthData.ideogramApiKeyConfigured === true ? 'Yes' : 'No'}
- Environment: ${healthData.environment || 'Unknown'}
- Timestamp: ${healthData.timestamp || new Date().toISOString()}
      `;
      
      setError(diagReport);
      toast.info('API connection test completed');
    } catch (err: any) {
      console.error('API test failed:', err);
      setError(`API Test Error: ${err.message || 'Connection failed'}`);
      toast.error('API connection test failed');
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
            
            {/* API Test Button */}
            <button
              onClick={testApiConnection}
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-medium ${
                loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-purple-500 hover:bg-purple-600'
              }`}
            >
              Test API Connection
            </button>
            
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