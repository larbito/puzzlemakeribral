const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const FormData = require('form-data');
const multer = require('multer');
const upload = multer();

console.log('Setting up ideogram routes');

// Debug middleware for this router
router.use((req, res, next) => {
  console.log('Ideogram route request:', {
    method: req.method,
    path: req.path,
    url: req.url,
    baseUrl: req.baseUrl,
    originalUrl: req.originalUrl,
    headers: req.headers,
    body: req.body
  });
  next();
});

router.post('/generate', async (req, res) => {
  console.log('Received generate request');
  
  try {
    console.log('Request body:', req.body);
    
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
      type: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

module.exports = router; 