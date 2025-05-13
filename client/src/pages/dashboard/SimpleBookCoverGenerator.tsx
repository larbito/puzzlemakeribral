import React, { useState } from 'react';

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

  // Minimal generate function with basic fetch
  const handleGenerate = async () => {
    if (prompt.trim().length < 5) {
      alert("Please enter at least 5 characters");
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      // Basic FormData approach that works in T-shirt generator
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('width', '1500');
      formData.append('height', '2100');
      formData.append('negative_prompt', 'text, watermark, low quality');

      // Make the API call using the same endpoint as T-shirt generator
      const response = await fetch(`${API_URL}/api/ideogram/generate`, {
        method: 'POST',
        body: formData
      });

      // Process response
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log("API Response:", data);

      // Set the image URL or use placeholder
      if (data.imageUrl) {
        setCoverUrl(data.imageUrl);
      } else {
        setCoverUrl('https://placehold.co/1500x2100/4ade80/FFFFFF?text=Placeholder+Cover');
        setError('No image URL returned - using placeholder');
      }
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || "Failed to generate cover");
      setCoverUrl('https://placehold.co/1500x2100/ff5555/FFFFFF?text=Error:+Generation+Failed');
    } finally {
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
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
        
        {/* Basic button */}
        <button
          onClick={handleGenerate}
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
      </div>
    </div>
  );
};

export default SimpleBookCoverGenerator; 