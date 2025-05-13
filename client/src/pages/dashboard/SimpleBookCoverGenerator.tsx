import React, { useState, useEffect } from 'react';

// Ultra-simple book cover generator - no dependencies, just basic HTML
const SimpleBookCoverGenerator = () => {
  // State
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [coverUrl, setCoverUrl] = useState('');
  const [error, setError] = useState('');

  // API URL
  const API_URL = 'https://puzzlemakeribral-production.up.railway.app';

  // Function to handle prompt input change
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };
  
  // Add a global function to trigger generation for debugging
  useEffect(() => {
    // @ts-ignore - add to window for debugging
    window.generateBookCover = (testPrompt?: string) => {
      const promptToUse = testPrompt || prompt;
      if (promptToUse.trim().length < 5) {
        console.log('Prompt too short, need at least 5 characters');
        return;
      }
      
      console.log(`Manually triggering generation with prompt: ${promptToUse}`);
      setPrompt(promptToUse);
      handleGenerate(promptToUse);
    };
    
    return () => {
      // @ts-ignore - cleanup
      delete window.generateBookCover;
    };
  }, [prompt]);

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      console.log('Form submitted');
      await handleGenerate();
    } catch (err) {
      console.error('Error in form submission:', err);
      setError('Form submission error. Check console.');
    }
  };
  
  // Alternative click handler for direct button
  const handleDirectClick = async (e: React.MouseEvent) => {
    try {
      e.preventDefault();
      console.log('Direct button clicked');
      await handleGenerate();
    } catch (err) {
      console.error('Error in direct button click:', err);
      setError('Button click error. Check console.');
    }
  };

  // Minimal generate function with basic fetch
  const handleGenerate = async (manualPrompt?: string) => {
    const promptToUse = manualPrompt || prompt;
    
    if (promptToUse.trim().length < 5) {
      alert("Please enter at least 5 characters");
      return;
    }

    console.log('Starting generation process');
    setIsGenerating(true);
    setError('');

    try {
      // Basic FormData approach that works in T-shirt generator
      const formData = new FormData();
      formData.append('prompt', promptToUse);
      formData.append('width', '1500');
      formData.append('height', '2100');
      formData.append('negative_prompt', 'text, watermark, low quality');

      // Log form data for debugging
      console.log("Form data created:");
      for (const [key, value] of formData.entries()) {
        console.log(`- ${key}: ${value}`);
      }
      
      console.log(`Sending request to ${API_URL}/api/ideogram/generate`);
      
      // Make the API call using the same endpoint as T-shirt generator
      const response = await fetch(`${API_URL}/api/ideogram/generate`, {
        method: 'POST',
        body: formData
      });

      console.log(`Response status: ${response.status}`);
      
      // Process response
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error response: ${errorText}`);
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log("API Response data:", data);

      // Set the image URL using the 'url' property from the API response (not 'imageUrl')
      if (data.url) {
        console.log(`Image URL received: ${data.url.substring(0, 60)}...`);
        setCoverUrl(data.url);
      } else {
        console.log('No URL found in response, using placeholder');
        setCoverUrl('https://placehold.co/1500x2100/4ade80/FFFFFF?text=Placeholder+Cover');
        setError('No image URL returned - using placeholder');
      }
    } catch (err: any) {
      console.error("Error during generation:", err);
      setError(err.message || "Failed to generate cover");
      setCoverUrl('https://placehold.co/1500x2100/ff5555/FFFFFF?text=Error:+Generation+Failed');
    } finally {
      console.log('Generation process completed');
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '1200px', 
      margin: '0 auto',
      color: 'white'
    }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Ultra Simple Book Cover Generator</h1>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Basic text input */}
        <div>
          <label htmlFor="prompt" style={{ display: 'block', marginBottom: '8px' }}>
            Describe your book cover:
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={handlePromptChange}
            style={{
              width: '100%',
              padding: '12px',
              minHeight: '120px',
              backgroundColor: '#1f2937',
              color: 'white',
              border: '1px solid #374151',
              borderRadius: '6px'
            }}
            placeholder="Enter at least 5 characters to describe your book cover..."
          />
          <div style={{ marginTop: '4px', fontSize: '14px' }}>
            {prompt.length} characters
          </div>
        </div>
        
        {/* Submit button */}
        <button
          type="submit"
          disabled={isGenerating || prompt.trim().length < 5}
          style={{
            padding: '12px 24px',
            backgroundColor: isGenerating || prompt.trim().length < 5 ? '#4b5563' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isGenerating || prompt.trim().length < 5 ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {isGenerating ? 'Generating...' : 'Generate Cover'}
        </button>
        
        {/* Alternative direct button outside the form */}
        <div style={{ 
          padding: '10px',
          backgroundColor: '#1f2937',
          borderRadius: '6px',
          marginTop: '10px' 
        }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
            If the button above doesn't work, try this direct button:
          </p>
          <button
            onClick={handleDirectClick}
            disabled={isGenerating || prompt.trim().length < 5}
            style={{
              padding: '10px 20px',
              backgroundColor: isGenerating || prompt.trim().length < 5 ? '#4b5563' : '#ec4899',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isGenerating || prompt.trim().length < 5 ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            {isGenerating ? 'Generating...' : 'Direct Generate (Alternative)'}
          </button>
        </div>
        
        {/* Error display */}
        {error && (
          <div style={{ 
            backgroundColor: 'rgba(220, 38, 38, 0.2)', 
            border: '1px solid #ef4444',
            padding: '12px',
            borderRadius: '6px' 
          }}>
            <p style={{ color: '#fca5a5', margin: 0 }}>{error}</p>
          </div>
        )}
        
        {/* Image preview */}
        {coverUrl && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Generated Cover</h2>
            <img 
              src={coverUrl} 
              alt="Generated Book Cover"
              style={{
                maxWidth: '100%',
                maxHeight: '600px',
                border: '1px solid #374151',
                borderRadius: '6px'
              }}
            />
            <div style={{ marginTop: '12px' }}>
              <a 
                href={coverUrl} 
                download="book-cover.png"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '6px'
                }}
              >
                Download Cover
              </a>
            </div>
          </div>
        )}
        
        {/* Debug info */}
        <div style={{ 
          marginTop: '30px', 
          padding: '12px',
          backgroundColor: '#1f2937',
          borderRadius: '6px',
          fontSize: '14px' 
        }}>
          <h3 style={{ fontSize: '16px', marginTop: 0 }}>Debug Info</h3>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            API URL: {API_URL}
            Prompt Length: {prompt.length}
            Is Generating: {isGenerating.toString()}
            Has Image: {Boolean(coverUrl).toString()}
          </pre>
        </div>
      </form>
    </div>
  );
};

export default SimpleBookCoverGenerator; 