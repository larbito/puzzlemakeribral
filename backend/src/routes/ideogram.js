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

// Use multer to handle multipart form data
router.post('/generate', upload.none(), async (req, res) => {
  console.log('Received generate request');
  console.log('Content-Type:', req.get('content-type'));
  console.log('Request body after multer:', req.body);
  
  try {
    // Check if API key is configured
    if (!process.env.IDEOGRAM_API_KEY) {
      console.error('Ideogram API key is not configured');
      return res.status(500).json({ error: 'API key not configured' });
    }

    const { prompt, style, aspect_ratio = '3:4', negative_prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log('Generating image with params:', { prompt, style, aspect_ratio, negative_prompt });
    
    // Create form data for the new API
    const form = new FormData();
    form.append('prompt', prompt);
    form.append('aspect_ratio', aspect_ratio.replace(':', 'x')); // Convert 3:4 to 3x4 format
    form.append('rendering_speed', 'TURBO');

    if (negative_prompt) {
      form.append('negative_prompt', negative_prompt);
    }

    if (style) {
      form.append('style_type', style.toUpperCase());
    }

    // Add some default parameters
    form.append('num_images', '1');
    form.append('seed', Math.floor(Math.random() * 1000000));

    console.log('Making request to Ideogram API with form data');
    
    const response = await fetch('https://api.ideogram.ai/v1/ideogram-v3/generate', {
      method: 'POST',
      headers: {
        'Api-Key': process.env.IDEOGRAM_API_KEY,
        ...form.getHeaders()
      },
      body: form
    });

    console.log('Ideogram API response status:', response.status);

    const responseText = await response.text();
    console.log('Raw response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error('Failed to parse Ideogram API response:', error);
      return res.status(500).json({ error: 'Invalid response from image generation service' });
    }

    if (!response.ok) {
      console.error('Ideogram API error:', data);
      return res.status(response.status).json({ 
        error: data.message || 'Failed to generate image',
        details: data
      });
    }

    console.log('Ideogram API response data:', data);
    
    // Extract the image URL from the response
    let imageUrl = null;
    if (data?.data?.[0]?.url) {
      imageUrl = data.data[0].url;
    }

    if (!imageUrl) {
      console.error('No image URL in response:', data);
      throw new Error('No image URL in API response');
    }

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

    // Convert the image buffer to base64
    const base64Image = req.file.buffer.toString('base64');

    // Call OpenAI's GPT-4 Vision API for image analysis
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this image and provide a detailed prompt that could be used to generate a similar t-shirt design. Focus on the style, colors, composition, and key visual elements. Make the prompt suitable for an AI image generation model.'
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
        max_tokens: 300
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to analyze image');
    }

    const data = await response.json();
    const prompt = data.choices[0].message.content;

    res.json({ prompt });
  } catch (error) {
    console.error('Image analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// New endpoint: Batch download multiple images as a zip file
router.post('/batch-download', express.json(), async (req, res) => {
  let images;
  
  // Check if the content type is form data or JSON
  const contentType = req.get('content-type') || '';
  
  if (contentType.includes('application/json')) {
    // If it's JSON, use req.body.images directly
    images = req.body.images;
  } else if (contentType.includes('application/x-www-form-urlencoded')) {
    // If it's form data, parse the JSON string
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
  
  if (!images || !Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ error: 'Valid images array is required' });
  }
  
  console.log(`Batch downloading ${images.length} images as zip`);
  
  // Create a zip archive
  const archive = archiver('zip', {
    zlib: { level: 5 } // Compression level (1-9)
  });
  
  // Set the response headers for zip download
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="tshirt-designs-${Date.now()}.zip"`);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache');
  
  // Pipe the archive to the response
  archive.pipe(res);
  
  let failedImages = 0;
  
  // Add each image to the zip file
  for (let i = 0; i < images.length; i++) {
    const { url, prompt } = images[i];
    const uniqueId = crypto.randomBytes(4).toString('hex');
    
    try {
      console.log(`Fetching image ${i+1}/${images.length}: ${url.substring(0, 50)}...`);
      
      // Generate a filename based on the prompt or index
      const filename = prompt 
        ? `tshirt-${prompt.split(' ').slice(0, 3).join('-').toLowerCase()}-${uniqueId}.png`
        : `tshirt-design-${i+1}-${uniqueId}.png`;
      
      // Fetch the image
      const imageResponse = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
        }
      });
      
      if (!imageResponse.ok) {
        console.error(`Failed to fetch image ${i+1}: ${imageResponse.status}`);
        failedImages++;
        continue; // Skip this image and continue with others
      }
      
      // Get the image buffer
      const imageBuffer = await imageResponse.buffer();
      
      // Create a readable stream from the buffer
      const stream = new Readable();
      stream.push(imageBuffer);
      stream.push(null); // Signal the end of the stream
      
      // Add the stream to the archive with a filename
      archive.append(stream, { name: filename });
      
      console.log(`Added image ${i+1} to zip as ${filename}`);
    } catch (error) {
      console.error(`Error processing image ${i+1}:`, error);
      failedImages++;
    }
  }
  
  // Finalize the archive
  try {
    await archive.finalize();
    console.log(`Zip archive created with ${images.length - failedImages} images`);
  } catch (error) {
    console.error('Error finalizing zip archive:', error);
    // The response might already be partially sent, so we can't send a new error response
    // Just log the error and let the client handle any incomplete downloads
  }
});

module.exports = router; 