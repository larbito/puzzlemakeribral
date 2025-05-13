import React, { useState, useEffect } from 'react';

// Book cover generator with enhanced options
const SimpleBookCoverGenerator = () => {
  // State
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [coverUrl, setCoverUrl] = useState('');
  const [error, setError] = useState('');
  const [style, setStyle] = useState('realistic');
  const [size, setSize] = useState('standard');

  // Available style options
  const styleOptions = [
    { value: 'realistic', label: 'Realistic' },
    { value: 'artistic', label: 'Artistic' },
    { value: 'vintage', label: 'Vintage' },
    { value: 'minimalist', label: 'Minimalist' },
    { value: 'fantasy', label: 'Fantasy' }
  ];

  // Size presets (width x height)
  const sizePresets = {
    standard: { width: 1500, height: 2100, label: 'Standard (1500×2100)' },
    large: { width: 2000, height: 3000, label: 'Large (2000×3000)' },
    square: { width: 2000, height: 2000, label: 'Square (2000×2000)' },
    wide: { width: 2400, height: 1800, label: 'Wide (2400×1800)' }
  };

  // Example prompts
  const examplePrompts = [
    'A mysterious fantasy novel cover with a glowing amulet in a dark forest',
    'A bright children\'s book cover featuring friendly cartoon animals in a garden',
    'A sleek minimalist book cover for a science fiction story about time travel',
    'A vintage-style mystery thriller cover with bold typography and a silhouette',
    'A romantic novel cover with a beach sunset and two silhouettes'
  ];

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

  // Apply example prompt
  const applyExamplePrompt = (example: string) => {
    setPrompt(example);
  };

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

    // Get dimensions based on selected size
    const { width, height } = sizePresets[size as keyof typeof sizePresets];

    try {
      // Enhanced prompt with style
      const enhancedPrompt = `Book cover design in ${style} style: ${promptToUse}`;
      
      // Basic FormData approach that works with the API
      const formData = new FormData();
      formData.append('prompt', enhancedPrompt);
      formData.append('width', width.toString());
      formData.append('height', height.toString());
      formData.append('negative_prompt', 'text, watermark, low quality, distorted');

      // Log form data for debugging
      console.log("Form data created:", {
        prompt: enhancedPrompt,
        width,
        height,
        style
      });
      
      console.log(`Sending request to ${API_URL}/api/ideogram/generate`);
      
      // Make the API call using the ideogram endpoint
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

      // Set the image URL using the 'url' property from the API response
      if (data.url) {
        console.log(`Image URL received: ${data.url.substring(0, 60)}...`);
        setCoverUrl(data.url);
      } else {
        console.log('No URL found in response, using placeholder');
        setCoverUrl(`https://placehold.co/${width}x${height}/4ade80/FFFFFF?text=Placeholder+Cover`);
        setError('No image URL returned - using placeholder');
      }
    } catch (err: any) {
      console.error("Error during generation:", err);
      setError(err.message || "Failed to generate cover");
      const { width, height } = sizePresets[size as keyof typeof sizePresets];
      setCoverUrl(`https://placehold.co/${width}x${height}/ff5555/FFFFFF?text=Error:+Generation+Failed`);
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
      <h1 style={{ fontSize: '28px', marginBottom: '10px' }}>Book Cover Generator</h1>
      <p style={{ fontSize: '16px', marginBottom: '20px', color: '#a1a1aa' }}>
        Create stunning book covers with AI - just describe what you want
      </p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        {/* Left side: Form and controls */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '20px' }}>
          {/* Left column: Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Text input */}
              <div>
                <label htmlFor="prompt" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
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
                    borderRadius: '6px',
                    resize: 'vertical'
                  }}
                  placeholder="Enter a detailed description of your book cover..."
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '14px' }}>
                  <span>Characters: {prompt.length}</span>
                  <span style={{ color: prompt.length < 5 ? '#ef4444' : '#10b981' }}>
                    {prompt.length < 5 ? 'Add more details (min 5 characters)' : 'Ready to generate'}
                  </span>
                </div>
              </div>
              
              {/* Style options */}
              <div>
                <label htmlFor="style" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                  Cover Style:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {styleOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStyle(option.value)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: style === option.value ? '#8b5cf6' : '#374151',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Size selection */}
              <div>
                <label htmlFor="size" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                  Cover Size:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {Object.entries(sizePresets).map(([key, preset]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSize(key)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: size === key ? '#8b5cf6' : '#374151',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Submit button */}
              <button
                type="submit"
                disabled={isGenerating || prompt.trim().length < 5}
                style={{
                  padding: '14px 24px',
                  backgroundColor: isGenerating || prompt.trim().length < 5 ? '#4b5563' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isGenerating || prompt.trim().length < 5 ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 500,
                  marginTop: '10px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {isGenerating ? 'Generating...' : 'Generate Cover'}
                {isGenerating && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '4px',
                    width: '100%',
                    backgroundColor: '#22d3ee',
                    animation: 'loadingAnimation 2s infinite linear',
                  }} />
                )}
              </button>
            </form>

            {/* Example prompts */}
            <div style={{ marginTop: '20px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '10px', fontWeight: 500 }}>Example Prompts</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {examplePrompts.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => applyExamplePrompt(example)}
                    className="example-prompt-button"
                    style={{
                      padding: '10px',
                      backgroundColor: '#1f2937',
                      color: '#d1d5db',
                      border: '1px solid #374151',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      textAlign: 'left',
                      transition: 'all 0.2s'
                    }}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right column: Preview */}
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: '15px' 
          }}>
            {/* Error display */}
            {error && (
              <div style={{ 
                width: '100%',
                backgroundColor: 'rgba(220, 38, 38, 0.2)', 
                border: '1px solid #ef4444',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '15px'
              }}>
                <p style={{ color: '#fca5a5', margin: 0 }}>{error}</p>
              </div>
            )}
            
            {/* Image preview */}
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              maxWidth: '500px',
              padding: '20px',
              backgroundColor: '#1e1e2d',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              minHeight: '400px'
            }}>
              <h2 style={{ fontSize: '18px', marginBottom: '16px', textAlign: 'center' }}>
                {coverUrl ? 'Generated Cover' : 'Cover Preview'}
              </h2>
              
              {coverUrl ? (
                <img 
                  src={coverUrl} 
                  alt="Generated Book Cover"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '500px',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)'
                  }}
                />
              ) : (
                <div style={{
                  width: '280px',
                  height: '400px',
                  backgroundColor: '#2d3748',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9ca3af',
                  fontSize: '14px',
                  textAlign: 'center',
                  padding: '20px'
                }}>
                  <p>Your generated book cover will appear here</p>
                </div>
              )}
              
              {/* Download button */}
              {coverUrl && (
                <div style={{ marginTop: '15px', width: '100%', textAlign: 'center' }}>
                  <a 
                    href={coverUrl} 
                    download="book-cover.png"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block',
                      padding: '10px 16px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      fontWeight: 500,
                      fontSize: '14px'
                    }}
                  >
                    Download Cover
                  </a>
                </div>
              )}
            </div>

            {/* Selected options summary */}
            <div style={{
              width: '100%',
              backgroundColor: '#1e293b',
              padding: '12px',
              borderRadius: '6px',
              fontSize: '14px',
              marginTop: 'auto'
            }}>
              <h3 style={{ fontSize: '16px', marginTop: 0, marginBottom: '8px' }}>Selected Options</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Style:</span>
                  <span>{styleOptions.find(opt => opt.value === style)?.label || style}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Size:</span>
                  <span>{sizePresets[size as keyof typeof sizePresets].label}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Status:</span>
                  <span>{isGenerating ? 'Generating...' : (coverUrl ? 'Generated' : 'Ready')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add a style tag for animations */}
      <style>
        {`
          @keyframes loadingAnimation {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          
          .example-prompt-button:hover {
            background-color: #2d3748;
            border-color: #4b5563;
          }
        `}
      </style>
    </div>
  );
};

export default SimpleBookCoverGenerator; 