const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const FormData = require('form-data');
const multer = require('multer');
const archiver = require('archiver');
const { Readable } = require('stream');
const crypto = require('crypto');

// Configure multer for handling form data
const upload = multer({
  limits: {
    fieldSize: 10 * 1024 * 1024 // 10MB limit
  }
});

console.log('Setting up ideogram routes');

// Debug middleware to log request details
router.use((req, res, next) => {
  console.log('Ideogram route request:', {
    method: req.method,
    path: req.path,
    headers: req.headers,
    contentType: req.get('content-type'),
    body: req.body
  });
  next();
});

/**
 * Test endpoint to verify functionality
 * GET /api/ideogram/test
 */
router.get('/test', (req, res) => {
  const apiKey = process.env.IDEOGRAM_API_KEY;
  res.json({
    status: 'success',
    message: 'Ideogram API integration is working!',
    apiConfigured: !!apiKey,
    endpoints: [
      '/api/ideogram/generate',
      '/api/ideogram/proxy-image',
      '/api/ideogram/analyze',
      '/api/ideogram/batch-download'
    ]
  });
});

// Handle image generation with Ideogram API
router.post('/generate', upload.none(), async (req, res) => {
  try {
    console.log('Ideogram image generation request received');
    console.log('Request body:', req.body);
    
    if (!process.env.IDEOGRAM_API_KEY) {
      console.error('Missing IDEOGRAM_API_KEY environment variable');
      return res.status(500).json({ error: 'Ideogram API key not configured' });
    }
    
    const { prompt, negative_prompt, aspect_ratio, style, rendering_speed } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    console.log('Generating image with prompt:', prompt);
    console.log('Using Ideogram API key:', process.env.IDEOGRAM_API_KEY.substring(0, 5) + '...');
    
    // Map aspect ratios to valid Ideogram values
    const mapToValidIdeogramAspectRatio = (inputRatio) => {
      // Valid Ideogram ratios: '1x3', '3x1', '1x2', '2x1', '9x16', '16x9', '10x16', '16x10', '2x3', '3x2', '3x4', '4x3', '4x5', '5x4', '1x1'
      
      // Handle input formats: "3:4", "3x4", or already valid ratios
      let cleanRatio = inputRatio || '3x4';
      if (typeof cleanRatio === 'string') {
        cleanRatio = cleanRatio.replace(':', 'x');
      }
      
      // If it's already a valid Ideogram ratio, return it
      const validRatios = ['1x3', '3x1', '1x2', '2x1', '9x16', '16x9', '10x16', '16x10', '2x3', '3x2', '3x4', '4x3', '4x5', '5x4', '1x1'];
      if (validRatios.includes(cleanRatio)) {
        return cleanRatio;
      }
      
      // Map common ratios to valid Ideogram ratios
      const ratioMap = {
        '8.5x11': '3x4',    // KDP Letter size
        '8x10': '4x5',      // KDP size
        '7.5x9.25': '4x5',  // KDP size
        '7x10': '2x3',      // KDP size
        '6x9': '2x3',       // KDP Trade size
        '8x8': '1x1',       // Square KDP size
      };
      
      if (ratioMap[cleanRatio]) {
        console.log(`Mapped ${cleanRatio} to valid Ideogram ratio ${ratioMap[cleanRatio]}`);
        return ratioMap[cleanRatio];
      }
      
      // Default fallback
      console.log(`Using fallback ratio 3x4 for input: ${inputRatio}`);
      return '3x4';
    };
    
    // Create multipart form-data request
    const form = new FormData();
    form.append('prompt', prompt);
    
    // Handle optional parameters with sensible defaults and proper mapping
    const validAspectRatio = mapToValidIdeogramAspectRatio(aspect_ratio);
    form.append('aspect_ratio', validAspectRatio);
    console.log(`Using aspect ratio: ${validAspectRatio}`);
    
    form.append('rendering_speed', rendering_speed || 'TURBO');

    if (negative_prompt) {
      form.append('negative_prompt', negative_prompt);
    } else {
      // Default negative prompt for coloring books
      form.append('negative_prompt', 'color, shading, watermark, text, grayscale, low quality');
    }

    if (style) {
      form.append('style_type', style.toUpperCase());
    } else {
      // Default style for coloring books - using DESIGN instead of FLAT_ILLUSTRATION
      // Valid options are: AUTO, GENERAL, REALISTIC, DESIGN
      form.append('style_type', 'DESIGN');
    }

    // Add some default parameters
    form.append('num_images', '1');
    form.append('seed', Math.floor(Math.random() * 1000000));
    
    // Log complete form data for debugging
    console.log('Form data contents:');
    try {
      // For Node.js form-data, we can't use entries() method
      // Instead, just log the keys we know we've added
      console.log(`prompt: ${prompt}`);
      console.log(`aspect_ratio: ${validAspectRatio}`);
      console.log(`rendering_speed: ${rendering_speed || 'TURBO'}`);
      console.log(`negative_prompt: ${negative_prompt || 'color, shading, watermark, text, grayscale, low quality'}`);
      console.log(`style_type: ${style ? style.toUpperCase() : 'DESIGN'}`);
      console.log(`num_images: 1`);
      console.log(`seed: ${form.getBoundary()}`); // Just to show something unique
    } catch (logError) {
      console.error('Error logging form data:', logError);
      // Continue with the request even if logging fails
    }
    
    console.log('Making request to Ideogram API');
    const ideogramApiUrl = 'https://api.ideogram.ai/v1/ideogram-v3/generate';
    console.log('Ideogram API URL:', ideogramApiUrl);
    
    // Make the request with explicit headers
    const formHeaders = form.getHeaders ? form.getHeaders() : {};
    const response = await fetch(ideogramApiUrl, {
      method: 'POST',
      headers: {
        'Api-Key': process.env.IDEOGRAM_API_KEY,
        ...formHeaders
      },
      body: form
    });

    console.log('Ideogram API response status:', response.status);
    
    // If response status indicates an error, log more details
    if (!response.ok) {
      const responseHeaders = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      console.log('Ideogram API error response headers:', responseHeaders);
    }

    // Get the raw response text
    const responseText = await response.text();
    console.log('Ideogram API raw response preview:', responseText.substring(0, 200));

    // Try to parse the response as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error('Failed to parse Ideogram API response:', error);
      return res.status(500).json({ 
        error: 'Invalid response from image generation service',
        rawResponse: responseText.substring(0, 500)
      });
    }

    // Handle error responses
    if (!response.ok) {
      console.error('Ideogram API error:', data);
      return res.status(response.status).json({ 
        error: data.message || 'Failed to generate image',
        details: data
      });
    }

    console.log('Ideogram API response data structure:', Object.keys(data));
    
    // Extract the image URL from the response - handle multiple possible response formats
    let imageUrl = null;
    if (data?.data?.[0]?.url) {
      imageUrl = data.data[0].url;
      console.log('Found image URL in data[0].url');
    } else if (data?.images?.[0]?.url) {
      imageUrl = data.images[0].url;
      console.log('Found image URL in images[0].url');
    } else if (data?.url) {
      imageUrl = data.url;
      console.log('Found image URL in root url property');
    }

    if (!imageUrl) {
      console.error('No image URL found in response:', data);
      return res.status(500).json({ error: 'No image URL in API response' });
    }

    console.log('Successfully generated image:', imageUrl);

    // Return the image URL to the client
    res.json({ url: imageUrl });
  } catch (error) {
    console.error('Ideogram API error:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error',
      type: error.name
    });
  }
});

// New endpoint: Proxy image and serve as download to bypass CORS
router.get('/proxy-image', async (req, res) => {
  const { url, filename } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }
  
  console.log(`Proxying image download for: ${url}`);
  
  try {
    // Special handling for Replicate URLs
    const isReplicateUrl = url.includes('replicate.delivery');
    if (isReplicateUrl) {
      console.log('Detected Replicate URL, using specialized handling');
    }
    
    // Fetch the image from the source URL with appropriate timeout
    const fetchOptions = {
      headers: {
        // Use a standard browser user agent
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
      },
      timeout: 30000 // 30 second timeout
    };
    
    // For Replicate URLs, add specialized headers if needed
    if (isReplicateUrl) {
      fetchOptions.headers['Accept'] = 'image/*, */*;q=0.8';
    }
    
    console.log('Fetching image with options:', fetchOptions);
    const imageResponse = await fetch(url, fetchOptions);
    
    if (!imageResponse.ok) {
      console.error(`Failed to fetch image from source: ${imageResponse.status}`);
      return res.status(imageResponse.status).json({ 
        error: `Failed to fetch image: ${imageResponse.statusText}` 
      });
    }
    
    // Get the content type of the image
    const contentType = imageResponse.headers.get('content-type') || 'image/png';
    console.log('Content-Type from source:', contentType);
    
    // Get the image data as a buffer
    const imageBuffer = await imageResponse.arrayBuffer().then(Buffer.from);
    console.log(`Received image data: ${imageBuffer.length} bytes`);
    
    // Check if we actually got image data
    if (!imageBuffer || imageBuffer.length === 0) {
      console.error('Received empty image data');
      return res.status(500).json({ error: 'Received empty image data from source' });
    }
    
    try {
      // Try/catch around header setting to identify issues with headers
      console.log('Setting response headers');
      
      // Set Content-Type first to avoid issues with other headers
      res.setHeader('Content-Type', contentType);
      console.log('Set Content-Type:', contentType);
      
      // Set other headers one by one for debugging
      const finalFilename = filename || (isReplicateUrl ? 'enhanced-image.png' : 'image.png');
      res.setHeader('Content-Disposition', `attachment; filename="${finalFilename}"`);
      console.log('Set Content-Disposition with filename:', finalFilename);
      
      res.setHeader('Content-Length', imageBuffer.length);
      console.log('Set Content-Length:', imageBuffer.length);
      
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'no-cache');
      
      // Send the image data
      console.log('Sending image data to client');
      res.status(200).send(imageBuffer);
      
      console.log(`Successfully proxied image download for: ${url}`);
    } catch (headerError) {
      console.error('Error setting response headers:', headerError);
      
      // Try a simpler approach with minimal headers if we had issues with headers
      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="image.png"`,
        'Access-Control-Allow-Origin': '*'
      });
      
      res.end(imageBuffer);
      console.log('Sent image with simplified headers as fallback');
    }
  } catch (error) {
    console.error('Error proxying image:', error);
    
    // Handle specific error types for better debugging
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Request timed out while fetching image' });
    }
    
    if (error.code === 'ECONNRESET') {
      return res.status(502).json({ error: 'Connection reset while fetching image' });
    }
    
    res.status(500).json({ 
      error: error.message || 'Failed to download image',
      type: error.name,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
});

// Image analysis endpoint
router.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error('No image file provided');
    }

    // Check if this is a request for coloring book analysis
    const isColoringBook = req.body.type === 'coloring';
    const isKDPCover = req.body.type === 'kdp-cover';
    console.log('Image analysis request type:', isColoringBook ? 'coloring book' : isKDPCover ? 'KDP book cover' : 't-shirt design');
    console.log('Request body:', req.body);

    // Extract other request parameters
    const generateVariations = req.body.generateVariations === 'true';
    const pageCount = parseInt(req.body.pageCount) || 1;
    
    console.log(`Generating variations: ${generateVariations}, Page count: ${pageCount}`);

    // Convert the image buffer to base64
    const base64Image = req.file.buffer.toString('base64');

    // Create the appropriate prompt text based on the type
    let promptText;
    if (isColoringBook) {
      promptText = 'Analyze this image and determine if it is a coloring book style image or line art suitable for coloring. If it IS suitable for a coloring book, provide a detailed, descriptive prompt that could be used to generate a similar coloring book page. Focus on the characters, objects, scene, and composition. Describe all the key elements in detail. The prompt should describe clean line art suitable for coloring books. Make the prompt engaging and child-friendly. Do not include phrases like "coloring book page" or "suitable for a coloring book" in your description - just describe the scene itself. If the image is NOT suitable for a coloring book (e.g., a photograph, complex artwork, t-shirt design, etc.), start your response with "NOT A COLORING PAGE:" and explain why it is not suitable.';
    } else if (isKDPCover) {
      promptText = 'Analyze this book cover image and provide a detailed prompt that could be used to generate a similar KDP book cover design. Focus on the overall composition, visual style, color scheme, typography, character design, background elements, and mood. Describe the artistic style (e.g., realistic, cartoon, flat design, watercolor, etc.), the layout and positioning of elements, any characters or objects featured, the color palette used, and the overall aesthetic appeal. Make the prompt detailed enough to recreate a similar book cover design using AI image generation. Do not include phrases like "book cover" or "KDP" in your description - just describe the visual elements and artistic style of the design itself.';
    } else {
      promptText = 'Analyze this image and provide a detailed prompt that could be used to generate a similar t-shirt design. Focus on the style, colors, composition, and key visual elements. Make the prompt suitable for an AI image generation model.';
    }

    // Call OpenAI's GPT-4 Vision API for image analysis
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          // Add system message for KDP cover analysis
          ...(isKDPCover ? [{
            role: 'system',
            content: 'You are an expert KDP cover designer. You are analyzing a book cover image to create a visual prompt suitable for generating a **6x9 inch Amazon KDP front cover** using DALL·E 3 or similar AI.\n\nFocus only on:\n- Title placement\n- Visual hierarchy\n- Main character(s)\n- Scene composition\n- Color scheme\n- Artistic style\n- Mood and layout\n\nDo NOT describe it as a t-shirt or poster.\nDo NOT suggest icons or decorations.\nAvoid extra instructions, markdown, or bullet points.\n\nYour output must be a **single paragraph** prompt that can be used directly with DALL·E 3 to recreate the design.'
          }] : []),
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: isKDPCover ? 'Analyze this book cover image and create a detailed visual prompt for AI generation:' : promptText
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${req.file.mimetype};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to analyze image');
    }

    const data = await response.json();
    const basePrompt = data.choices[0].message.content;
    console.log('Generated base prompt from image:', basePrompt);
    
    // For coloring book images, also generate prompt variations if requested
    if (isColoringBook && generateVariations) {
      try {
        console.log('Generating prompt variations from base prompt:', basePrompt);
        console.log(`Using pageCount: ${pageCount} (from request parameter)`);
        
        // Instead of using a relative URL, call the expand-prompts function directly
        // This avoids any network routing issues
        // First, create a simple JSON object with our parameters
        const expansionParams = {
          basePrompt,
          pageCount
        };
        
        console.log('Expansion parameters:', expansionParams);
        
        // We'll call the expandPrompts function directly within our backend code
        // Load the coloring-book.js module
        const expandPromptsModule = require('./coloring-book');
        
        // Check if the module has an expandPrompts function we can call directly
        if (typeof expandPromptsModule.expandPrompts === 'function') {
          console.log('Found expandPrompts function, calling directly');
          try {
            // Call the function directly
            const promptVariations = await expandPromptsModule.expandPrompts(basePrompt, pageCount);
            console.log('Generated variations directly:', promptVariations.length);
            
            // Return both the base prompt and the variations
            return res.json({ 
              prompt: basePrompt,
              promptVariations
            });
          } catch (directError) {
            console.error('Error calling expandPrompts directly:', directError);
            // Fall back to HTTP method
          }
        } else {
          console.log('No direct expandPrompts function found, falling back to HTTP');
          console.log('Module exports:', Object.keys(expandPromptsModule));
        }
        
        // Fall back to HTTP method if direct call didn't work
        // Use a relative path that works in both local and deployed environments
        const expandPromptsUrl = '/api/coloring-book/expand-prompts';
        console.log(`Calling expand-prompts API at relative URL: ${expandPromptsUrl}`);
        
        // Create the full URL by getting the host from the request
        const protocol = req.secure ? 'https' : 'http';
        const host = req.get('host');
        const fullUrl = `${protocol}://${host}${expandPromptsUrl}`;
        console.log(`Full expand-prompts URL: ${fullUrl}`);
        
        // Call the expand-prompts endpoint to generate variations
        const variationsResponse = await fetch(fullUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            basePrompt,
            pageCount
          })
        });
        
        if (!variationsResponse.ok) {
          const errorText = await variationsResponse.text();
          console.error('Failed to generate prompt variations:', errorText);
          // Return just the base prompt if variations fail
          return res.json({ prompt: basePrompt });
        }
        
        const variationsData = await variationsResponse.json();
        console.log('Generated variations:', variationsData.promptVariations.length);
        
        // Return both the base prompt and the variations
        return res.json({ 
          prompt: basePrompt,
          promptVariations: variationsData.promptVariations
        });
      } catch (variationsError) {
        console.error('Error generating prompt variations:', variationsError);
        // Return just the base prompt if variations generation fails
        return res.json({ prompt: basePrompt });
      }
    }

    // Return just the base prompt for non-coloring book images or if variations not requested
    res.json({ prompt: basePrompt });
  } catch (error) {
    console.error('Image analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// New endpoint: Batch download multiple images as a zip file
router.post('/batch-download', async (req, res) => {
  console.log('Batch download request received');
  console.log('Content-Type:', req.get('content-type'));
  
  let images;
  
  // Check if the content type is form data or JSON
  const contentType = req.get('content-type') || '';
  
  try {
    if (contentType.includes('application/json')) {
      // If it's JSON, use req.body.images directly
      console.log('Processing JSON request body');
      images = req.body.images;
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      // If it's form data, parse the JSON string
      console.log('Processing form-urlencoded request body');
      try {
        images = JSON.parse(req.body.images);
      } catch (error) {
        console.error('Error parsing JSON from form data:', error);
        return res.status(400).json({ error: 'Invalid images data format' });
      }
    } else {
      console.error('Unsupported content type:', contentType);
      return res.status(400).json({ error: 'Unsupported content type' });
    }
    
    console.log('Parsed images:', images ? images.length : 'none');
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      console.error('Invalid or empty images array:', images);
      return res.status(400).json({ error: 'Valid images array is required' });
    }
    
    console.log(`Batch downloading ${images.length} images as zip`);
    
    // Create a zip archive
    const archive = archiver('zip', {
      zlib: { level: 5 } // Compression level (1-9)
    });
    
    // Listen for errors on the archive
    archive.on('error', (err) => {
      console.error('Archiver error:', err);
      // Try to send an error if the response hasn't been sent yet
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error creating zip archive' });
      }
    });
    
    // Set the response headers for zip download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="coloring-pages-${Date.now()}.zip"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');
    
    // Pipe the archive to the response
    archive.pipe(res);
    
    let failedImages = 0;
    let successfulImages = 0;
    
    // Add each image to the zip file
    for (let i = 0; i < images.length; i++) {
      const { url, prompt } = images[i];
      const uniqueId = crypto.randomBytes(4).toString('hex');
      
      try {
        console.log(`Fetching image ${i+1}/${images.length}: ${url.substring(0, 50)}...`);
        
        // Generate a filename based on the prompt or index
        const filename = prompt 
          ? `coloring-page-${prompt.split(' ').slice(0, 3).join('-').toLowerCase()}-${uniqueId}.png`.replace(/[^a-zA-Z0-9\-_.]/g, '_')
          : `coloring-page-${i+1}-${uniqueId}.png`;
        
        // Fetch the image
        const imageResponse = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
          },
          timeout: 10000 // 10 second timeout
        });
        
        if (!imageResponse.ok) {
          console.error(`Failed to fetch image ${i+1}: ${imageResponse.status}`);
          failedImages++;
          continue; // Skip this image and continue with others
        }
        
        // Get the image buffer
        const imageBuffer = await imageResponse.buffer();
        
        if (!imageBuffer || imageBuffer.length === 0) {
          console.error(`Empty image buffer for image ${i+1}`);
          failedImages++;
          continue;
        }
        
        // Create a readable stream from the buffer
        const stream = new Readable();
        stream.push(imageBuffer);
        stream.push(null); // Signal the end of the stream
        
        // Add the stream to the archive with a filename
        archive.append(stream, { name: filename });
        
        successfulImages++;
        console.log(`Added image ${i+1} to zip as ${filename}`);
      } catch (error) {
        console.error(`Error processing image ${i+1}:`, error);
        failedImages++;
      }
    }
    
    if (successfulImages === 0) {
      console.error('No images were successfully added to the archive');
      if (!res.headersSent) {
        return res.status(400).json({ error: 'Failed to process any of the provided images' });
      }
    }
    
    // Finalize the archive
    console.log('Finalizing zip archive...');
    await archive.finalize();
    console.log(`Zip archive created with ${successfulImages} images (${failedImages} failed)`);
  } catch (error) {
    console.error('Error in batch download endpoint:', error);
    // Only send a response if headers haven't been sent yet
    if (!res.headersSent) {
      res.status(500).json({ 
        error: error.message || 'Failed to download images',
        type: error.name
      });
    }
  }
});

// Endpoint for generating custom dimension images (for book covers)
router.post('/generate-custom', upload.none(), async (req, res) => {
  console.log('Received generate-custom request for book cover');
  console.log('Content-Type:', req.get('content-type'));
  console.log('Request body after multer:', req.body);
  
  try {
    // Check if API key is configured
    if (!process.env.IDEOGRAM_API_KEY) {
      console.error('Ideogram API key is not configured');
      return res.status(500).json({ error: 'API key not configured' });
    }

    const { prompt, style, width, height, negative_prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    if (!width || !height) {
      return res.status(400).json({ error: 'Width and height are required' });
    }

    console.log('Generating book cover with params:', { prompt, style, width, height, negative_prompt });
    
    // Create form data for the Ideogram API
    const form = new FormData();
    form.append('prompt', prompt);
    
    // Add custom dimensions (must be between 512 and 4096)
    const parsedWidth = parseInt(width);
    const parsedHeight = parseInt(height);
    
    // Validate dimensions
    if (parsedWidth < 512 || parsedWidth > 4096 || parsedHeight < 512 || parsedHeight > 4096) {
      return res.status(400).json({ 
        error: 'Dimensions must be between 512 and 4096 pixels',
        details: `Received: ${parsedWidth}x${parsedHeight}`
      });
    }
    
    form.append('width', parsedWidth.toString());
    form.append('height', parsedHeight.toString());
    
    // Use default rendering for better quality
    form.append('rendering_speed', 'DEFAULT');

    if (negative_prompt) {
      form.append('negative_prompt', negative_prompt);
    } else {
      // Default negative prompt for book covers
      form.append('negative_prompt', 'text overlays, watermark, signature, blurry, low quality, distorted');
    }

    if (style) {
      // Make sure style is one of the valid values: AUTO, GENERAL, REALISTIC, DESIGN
      const validStyles = ['AUTO', 'GENERAL', 'REALISTIC', 'DESIGN'];
      const styleUpper = style.toUpperCase();
      const finalStyle = validStyles.includes(styleUpper) ? styleUpper : 'REALISTIC';
      form.append('style_type', finalStyle);
      console.log(`Using style: ${finalStyle} (original: ${style})`);
    } else {
      // Default style for book covers
      form.append('style_type', 'REALISTIC');
    }

    // Add some default parameters
    form.append('num_images', '1');
    const randomSeed = Math.floor(Math.random() * 1000000);
    form.append('seed', randomSeed.toString());

    console.log('Making request to Ideogram API with custom dimensions');
    // Log form values directly rather than using entries()
    console.log('Form data:');
    console.log(`prompt: ${prompt}`);
    console.log(`width: ${parsedWidth.toString()}`);
    console.log(`height: ${parsedHeight.toString()}`);
    console.log(`rendering_speed: DEFAULT`);
    console.log(`negative_prompt: ${negative_prompt || 'text overlays, watermark, signature, blurry, low quality, distorted'}`);
    if (style) {
      const validStyles = ['AUTO', 'GENERAL', 'REALISTIC', 'DESIGN'];
      const styleUpper = style.toUpperCase();
      const finalStyle = validStyles.includes(styleUpper) ? styleUpper : 'REALISTIC';
      console.log(`style_type: ${finalStyle}`);
    } else {
      console.log(`style_type: REALISTIC`);
    }
    console.log(`num_images: 1`);
    console.log(`random seed: ${randomSeed}`);
    
    const response = await fetch('https://api.ideogram.ai/v1/ideogram-v3/generate', {
      method: 'POST',
      headers: {
        'Api-Key': process.env.IDEOGRAM_API_KEY,
        ...form.getHeaders()
      },
      body: form
    });

    console.log('Ideogram API response status for book cover:', response.status);

    const responseText = await response.text();
    console.log('Raw response for book cover:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error('Failed to parse Ideogram API response for book cover:', error);
      return res.status(500).json({ error: 'Invalid response from image generation service' });
    }

    if (!response.ok) {
      console.error('Ideogram API error for book cover:', data);
      return res.status(response.status).json({ 
        error: data.message || 'Failed to generate book cover image',
        details: data
      });
    }

    console.log('Ideogram API response data for book cover:', data);
    
    // Extract the image URL from the response
    let imageUrl = null;
    if (data?.data?.[0]?.url) {
      imageUrl = data.data[0].url;
    }

    if (!imageUrl) {
      console.error('No image URL in response for book cover:', data);
      throw new Error('No image URL in API response for book cover');
    }

    // Return the image URL to the client
    res.json({ url: imageUrl });
  } catch (error) {
    console.error('Ideogram API error for book cover:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error',
      type: error.name
    });
  }
});

/**
 * Generate coloring book pages with Ideogram API - optimized for line art
 * POST /api/ideogram/generate-coloring
 */
router.post('/generate-coloring', upload.none(), async (req, res) => {
  try {
    console.log('Ideogram coloring page generation request received');
    console.log('Request body:', req.body);
    
    if (!process.env.IDEOGRAM_API_KEY) {
      console.error('Missing IDEOGRAM_API_KEY environment variable');
      return res.status(500).json({ error: 'Ideogram API key not configured' });
    }
    
    const { prompt, aspect_ratio, style_type, magic_prompt_option } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    // Optimize prompt for coloring book generation
    let coloringPrompt = prompt.trim();
    
    // Ensure it's optimized for coloring book style
    if (!coloringPrompt.toLowerCase().includes('line art') && 
        !coloringPrompt.toLowerCase().includes('coloring')) {
      coloringPrompt = `Simple line art coloring page: ${coloringPrompt}`;
    }
    
    // Add coloring book specific instructions
    coloringPrompt += ', black and white line art, clean outlines, no shading, no color fills, perfect for coloring, simple design for children and adults';
    
    console.log('Optimized coloring prompt:', coloringPrompt);
    
    // Map KDP book sizes to valid Ideogram aspect ratios
    const mapKDPtoIdeogramAspectRatio = (inputRatio) => {
      // Valid Ideogram ratios: '1x3', '3x1', '1x2', '2x1', '9x16', '16x9', '10x16', '16x10', '2x3', '3x2', '3x4', '4x3', '4x5', '5x4', '1x1'
      
      // Handle input formats: "8.5:11", "8.5x11", or already valid ratios
      let cleanRatio = inputRatio;
      if (typeof cleanRatio === 'string') {
        cleanRatio = cleanRatio.replace(':', 'x');
      }
      
      // If it's already a valid Ideogram ratio, return it
      const validRatios = ['1x3', '3x1', '1x2', '2x1', '9x16', '16x9', '10x16', '16x10', '2x3', '3x2', '3x4', '4x3', '4x5', '5x4', '1x1'];
      if (validRatios.includes(cleanRatio)) {
        return cleanRatio;
      }
      
      // Map common KDP book sizes to closest valid Ideogram ratios
      const kdpToIdeogramMap = {
        '8.5x11': '3x4',    // 8.5:11 ≈ 0.77, 3:4 = 0.75 (closest)
        '8x10': '4x5',      // 8:10 = 0.8, 4:5 = 0.8 (exact match)
        '7.5x9.25': '4x5',  // 7.5:9.25 ≈ 0.81, 4:5 = 0.8 (closest)
        '7x10': '2x3',      // 7:10 = 0.7, 2:3 ≈ 0.67 (closest)
        '6x9': '2x3',       // 6:9 ≈ 0.67, 2:3 ≈ 0.67 (good match)
        '8x8': '1x1',       // 8:8 = 1.0, 1:1 = 1.0 (exact match)
      };
      
      // Check if we have a direct mapping
      if (kdpToIdeogramMap[cleanRatio]) {
        console.log(`Mapped KDP size ${cleanRatio} to Ideogram ratio ${kdpToIdeogramMap[cleanRatio]}`);
        return kdpToIdeogramMap[cleanRatio];
      }
      
      // If no direct mapping, try to calculate closest ratio
      try {
        const [width, height] = cleanRatio.split('x').map(n => parseFloat(n));
        const inputAspectRatio = width / height;
        
        // Calculate which valid ratio is closest
        const ratioDistances = validRatios.map(ratio => {
          const [w, h] = ratio.split('x').map(n => parseFloat(n));
          const validRatio = w / h;
          return {
            ratio: ratio,
            distance: Math.abs(inputAspectRatio - validRatio)
          };
        });
        
        // Sort by distance and return the closest
        ratioDistances.sort((a, b) => a.distance - b.distance);
        const closestRatio = ratioDistances[0].ratio;
        
        console.log(`Calculated closest Ideogram ratio for ${cleanRatio}: ${closestRatio}`);
        return closestRatio;
      } catch (error) {
        console.error('Error calculating aspect ratio:', error);
        // Default fallback for portrait coloring books
        return '3x4';
      }
    };
    
    // Apply the mapping
    const ideogramAspectRatio = mapKDPtoIdeogramAspectRatio(aspect_ratio || '3:4');
    console.log(`Using Ideogram aspect ratio: ${ideogramAspectRatio}`);
    
    // Create multipart form-data request optimized for coloring books
    const form = new FormData();
    form.append('prompt', coloringPrompt);
    
    // Use the properly mapped aspect ratio
    form.append('aspect_ratio', ideogramAspectRatio);
    
    // Use DESIGN style which is best for line art and coloring books
    form.append('style_type', style_type || 'DESIGN');
    
    // Magic prompt option
    form.append('magic_prompt_option', magic_prompt_option || 'ON');
    
    // Optimized negative prompt for coloring books
    form.append('negative_prompt', 'color, colored, shading, gradient, watermark, text, signature, complex details, photorealistic, 3D render, blurry, low quality');
    
    // Rendering speed - use TURBO for faster generation
    form.append('rendering_speed', 'TURBO');
    
    // Single image generation
    form.append('num_images', '1');
    
    // Random seed
    form.append('seed', Math.floor(Math.random() * 1000000));
    
    console.log('Making coloring request to Ideogram API');
    const ideogramApiUrl = 'https://api.ideogram.ai/v1/ideogram-v3/generate';
    
    const formHeaders = form.getHeaders ? form.getHeaders() : {};
    const response = await fetch(ideogramApiUrl, {
      method: 'POST',
      headers: {
        'Api-Key': process.env.IDEOGRAM_API_KEY,
        ...formHeaders
      },
      body: form
    });

    console.log('Ideogram API response status:', response.status);
    
    // Get the raw response text
    const responseText = await response.text();
    console.log('Ideogram API raw response preview:', responseText.substring(0, 200));

    // Try to parse the response as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error('Failed to parse Ideogram API response:', error);
      return res.status(500).json({ 
        error: 'Invalid response from coloring page generation service',
        rawResponse: responseText.substring(0, 500)
      });
    }

    // Handle error responses
    if (!response.ok) {
      console.error('Ideogram API error:', data);
      return res.status(response.status).json({ 
        error: data.message || 'Failed to generate coloring page',
        details: data
      });
    }

    console.log('Ideogram API response data structure:', Object.keys(data));
    
    // Extract the image URL from the response
    let imageUrl = null;
    if (data?.data?.[0]?.url) {
      imageUrl = data.data[0].url;
      console.log('Found coloring page URL in data[0].url');
    } else if (data?.images?.[0]?.url) {
      imageUrl = data.images[0].url;
      console.log('Found coloring page URL in images[0].url');
    } else if (data?.url) {
      imageUrl = data.url;
      console.log('Found coloring page URL in root url property');
    }

    if (!imageUrl) {
      console.error('No image URL found in coloring response:', data);
      return res.status(500).json({ error: 'No coloring page URL in API response' });
    }

    console.log('Successfully generated coloring page:', imageUrl);

    // Return in consistent format for frontend
    res.json({ 
      success: true,
      images: [{
        url: imageUrl,
        prompt: coloringPrompt,
        model: 'ideogram',
        style: style_type || 'DESIGN',
        aspect_ratio: ideogramAspectRatio
      }]
    });
  } catch (error) {
    console.error('Ideogram coloring generation error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate coloring page',
      type: error.name
    });
  }
});

module.exports = router; 