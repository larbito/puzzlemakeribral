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
    
    // Create multipart form-data request
    const form = new FormData();
    form.append('prompt', prompt);
    
    // Handle optional parameters with sensible defaults
    const aspectRatioFormatted = (aspect_ratio || '3:4').replace(':', 'x');
    form.append('aspect_ratio', aspectRatioFormatted);
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
      console.log(`aspect_ratio: ${aspectRatioFormatted}`);
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
    // Fetch the image from the source URL
    const imageResponse = await fetch(url, {
      headers: {
        // Use a standard browser user agent
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
      }
    });
    
    if (!imageResponse.ok) {
      console.error(`Failed to fetch image from source: ${imageResponse.status}`);
      return res.status(imageResponse.status).json({ 
        error: `Failed to fetch image: ${imageResponse.statusText}` 
      });
    }
    
    // Get the content type of the image
    const contentType = imageResponse.headers.get('content-type') || 'image/png';
    
    // Get the image data as a buffer
    const imageBuffer = await imageResponse.buffer();
    
    // Set appropriate headers to force download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename || 'image.png'}"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');
    
    // Send the image data
    res.send(imageBuffer);
    
    console.log(`Successfully proxied image download for: ${url}`);
  } catch (error) {
    console.error('Error proxying image:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to download image',
      type: error.name
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
    console.log('Image analysis request type:', isColoringBook ? 'coloring book' : 't-shirt design');
    console.log('Request body:', req.body);

    // Extract other request parameters
    const generateVariations = req.body.generateVariations === 'true';
    const pageCount = parseInt(req.body.pageCount) || 1;
    
    console.log(`Generating variations: ${generateVariations}, Page count: ${pageCount}`);

    // Convert the image buffer to base64
    const base64Image = req.file.buffer.toString('base64');

    // Create the appropriate prompt text based on the type
    const promptText = isColoringBook
      ? 'Analyze this image and determine if it is a coloring book style image or line art suitable for coloring. If it IS suitable for a coloring book, provide a detailed, descriptive prompt that could be used to generate a similar coloring book page. Focus on the characters, objects, scene, and composition. Describe all the key elements in detail. The prompt should describe clean line art suitable for coloring books. Make the prompt engaging and child-friendly. Do not include phrases like "coloring book page" or "suitable for a coloring book" in your description - just describe the scene itself. If the image is NOT suitable for a coloring book (e.g., a photograph, complex artwork, t-shirt design, etc.), start your response with "NOT A COLORING PAGE:" and explain why it is not suitable.'
      : 'Analyze this image and provide a detailed prompt that could be used to generate a similar t-shirt design. Focus on the style, colors, composition, and key visual elements. Make the prompt suitable for an AI image generation model.';

    // Call OpenAI's GPT-4 Vision API for image analysis
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-0125',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: promptText
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

module.exports = router; 