import React, { useState, useEffect } from 'react';

// KDP Book cover generator component
const SimpleBookCoverGenerator = () => {
  // State
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [coverUrl, setCoverUrl] = useState('');
  const [error, setError] = useState('');
  const [style, setStyle] = useState('realistic');
  const [size, setSize] = useState('standard');
  const [coverType, setCoverType] = useState('front');

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

  // Cover type options
  const coverTypes = [
    { value: 'front', label: 'Front Cover Only' },
    { value: 'full', label: 'Full Cover (Front, Spine, Back)' }
  ];

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
      const enhancedPrompt = `Professional book cover design for Amazon KDP in ${style} style: ${promptToUse}. High resolution 300 DPI.`;
      
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
    <div className="kdp-generator" style={{ 
      padding: '24px', 
      maxWidth: '1200px', 
      margin: '0 auto',
      color: 'white'
    }}>
      {/* Header Section */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: '700', 
          marginBottom: '12px',
          background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Amazon KDP Book Cover Generator
        </h1>
        <p style={{ fontSize: '16px', color: '#a1a1aa', maxWidth: '700px', margin: '0 auto' }}>
          Generate professional book covers optimized for Kindle Direct Publishing
        </p>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)', 
        gap: '32px',
        alignItems: 'start'
      }}>
        {/* Left Column: Controls */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '24px',
          backgroundColor: '#1e1e2d',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Cover Type Selection */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500', 
                fontSize: '15px',
                color: '#e4e4e7'
              }}>
                Cover Type
              </label>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '8px',
                backgroundColor: '#161622',
                padding: '4px',
                borderRadius: '8px'
              }}>
                {coverTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setCoverType(type.value)}
                    style={{
                      padding: '10px',
                      backgroundColor: coverType === type.value ? '#8b5cf6' : 'transparent',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: coverType === type.value ? '500' : 'normal',
                      transition: 'all 0.2s'
                    }}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          
            {/* Prompt Input */}
            <div>
              <label htmlFor="prompt" style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500',
                fontSize: '15px',
                color: '#e4e4e7'
              }}>
                Describe your book cover
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={handlePromptChange}
                style={{
                  width: '100%',
                  padding: '16px',
                  minHeight: '140px',
                  backgroundColor: '#161622',
                  color: 'white',
                  border: '1px solid #2e2e40',
                  borderRadius: '8px',
                  resize: 'vertical',
                  fontSize: '15px',
                  lineHeight: '1.5',
                  transition: 'border-color 0.2s'
                }}
                placeholder="Describe your ideal book cover in detail. Include style, mood, main elements, colors, etc."
              />
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginTop: '8px', 
                fontSize: '14px',
                color: '#94a3b8'
              }}>
                <span>Characters: {prompt.length}</span>
                <span style={{ 
                  color: prompt.length < 5 ? '#ef4444' : '#10b981',
                  fontWeight: '500'
                }}>
                  {prompt.length < 5 ? 'Add more details (min 5 characters)' : '✓ Ready to generate'}
                </span>
              </div>
            </div>
            
            {/* Style options */}
            <div>
              <label htmlFor="style" style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500',
                fontSize: '15px',
                color: '#e4e4e7'
              }}>
                Cover Style
              </label>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '8px'
              }}>
                {styleOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStyle(option.value)}
                    style={{
                      padding: '10px 14px',
                      backgroundColor: style === option.value ? '#8b5cf6' : '#161622',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: style === option.value ? '500' : 'normal',
                      transition: 'all 0.2s'
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Size selection */}
            <div>
              <label htmlFor="size" style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500',
                fontSize: '15px',
                color: '#e4e4e7'
              }}>
                Cover Size
              </label>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
                gap: '8px'
              }}>
                {Object.entries(sizePresets).map(([key, preset]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSize(key)}
                    style={{
                      padding: '10px',
                      backgroundColor: size === key ? '#8b5cf6' : '#161622',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: size === key ? '500' : 'normal',
                      transition: 'all 0.2s'
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Generate Button */}
            <button
              type="submit"
              disabled={isGenerating || prompt.trim().length < 5}
              style={{
                padding: '16px 24px',
                backgroundColor: isGenerating || prompt.trim().length < 5 ? '#4b5563' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isGenerating || prompt.trim().length < 5 ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                marginTop: '8px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.2s',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
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
          <div>
            <h3 style={{ 
              fontSize: '15px', 
              marginBottom: '12px', 
              fontWeight: '500',
              color: '#e4e4e7'
            }}>
              Example Prompts
            </h3>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '8px', 
              maxHeight: '200px', 
              overflowY: 'auto',
              padding: '4px'
            }}>
              {examplePrompts.map((example, index) => (
                <button
                  key={index}
                  onClick={() => applyExamplePrompt(example)}
                  className="example-prompt-button"
                  style={{
                    padding: '12px',
                    backgroundColor: '#161622',
                    color: '#d1d5db',
                    border: '1px solid #2e2e40',
                    borderRadius: '8px',
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

        {/* Right Column: Preview */}
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {/* Error display */}
          {error && (
            <div style={{ 
              width: '100%',
              backgroundColor: 'rgba(220, 38, 38, 0.15)', 
              border: '1px solid #ef4444',
              padding: '12px',
              borderRadius: '8px'
            }}>
              <p style={{ color: '#fca5a5', margin: 0 }}>{error}</p>
            </div>
          )}
          
          {/* Image preview container */}
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            backgroundColor: '#1e1e2d',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            {/* Preview header */}
            <div style={{
              width: '100%',
              backgroundColor: '#161622',
              padding: '12px 16px',
              borderBottom: '1px solid #2e2e40'
            }}>
              <h2 style={{ 
                fontSize: '16px', 
                fontWeight: '600',
                margin: 0,
                textAlign: 'center'
              }}>
                {coverUrl ? 'Generated Cover' : 'Cover Preview'}
              </h2>
            </div>
            
            {/* Preview content */}
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              minHeight: '450px',
              width: '100%'
            }}>
              {coverUrl ? (
                <img 
                  src={coverUrl} 
                  alt="Generated Book Cover"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '450px',
                    border: '1px solid #2e2e40',
                    borderRadius: '6px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)'
                  }}
                />
              ) : (
                <div style={{
                  width: '280px',
                  height: '400px',
                  backgroundColor: '#161622',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9ca3af',
                  fontSize: '14px',
                  textAlign: 'center',
                  padding: '20px',
                  border: '1px dashed #2e2e40'
                }}>
                  <div>
                    <div style={{ 
                      marginBottom: '12px', 
                      opacity: 0.7, 
                      fontSize: '32px',
                      textAlign: 'center'
                    }}>
                      📚
                    </div>
                    <p>Your generated book cover will appear here</p>
                  </div>
                </div>
              )}
              
              {/* Download button */}
              {coverUrl && (
                <div style={{ marginTop: '20px', width: '100%', textAlign: 'center' }}>
                  <a 
                    href={coverUrl} 
                    download="kdp-book-cover.png"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block',
                      padding: '12px 20px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '8px',
                      fontWeight: '600',
                      fontSize: '14px',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.2s'
                    }}
                  >
                    Download Cover
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Selected options summary */}
          <div style={{
            width: '100%',
            backgroundColor: '#1e1e2d',
            padding: '16px',
            borderRadius: '12px',
            fontSize: '14px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
          }}>
            <h3 style={{ 
              fontSize: '16px', 
              margin: '0 0 12px 0', 
              fontWeight: '600',
              color: '#e4e4e7',
              borderBottom: '1px solid #2e2e40',
              paddingBottom: '8px'
            }}>
              Selected Options
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Cover Type:</span>
                <span>{coverTypes.find(type => type.value === coverType)?.label || 'Front Cover'}</span>
              </div>
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
                <span style={{
                  color: isGenerating ? '#f59e0b' : (coverUrl ? '#10b981' : '#94a3b8')
                }}>
                  {isGenerating ? 'Generating...' : (coverUrl ? 'Generated' : 'Ready')}
                </span>
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
            background-color: #262636;
            border-color: #3e3e50;
          }
          
          /* Scrollbar styling */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          
          ::-webkit-scrollbar-track {
            background: #161622;
            border-radius: 8px;
          }
          
          ::-webkit-scrollbar-thumb {
            background: #3e3e50;
            border-radius: 8px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: #4b4b60;
          }
        `}
      </style>
    </div>
  );
};

export default SimpleBookCoverGenerator; 