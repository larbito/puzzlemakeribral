const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const multer = require('multer');
const upload = multer();

router.post('/generate', async (req, res) => {
  try {
    console.log('Received request headers:', req.headers);
    console.log('Received request body:', req.body);

    // Check if API key is configured
    if (!process.env.IDEOGRAM_API_KEY) {
      console.error('Ideogram API key is not configured');
      return res.status(500).json({ error: 'API key not configured' });
    }

    const { prompt, style, aspect_ratio, negative_prompt, seed } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log('Generating image with params:', { prompt, style, aspect_ratio, negative_prompt, seed });
    
    const response = await fetch("https://api.ideogram.ai/api/v1/images/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.IDEOGRAM_API_KEY}`
      },
      body: JSON.stringify({
        prompt,
        model: "ideogram-1.0",
        style,
        aspect_ratio: aspect_ratio || "ASPECT_3_4",
        negative_prompt: negative_prompt || "text, watermark, signature, blurry, low quality, distorted, deformed",
        seed: seed || Math.floor(Math.random() * 1000000)
      })
    });

    let data;
    try {
      data = await response.json();
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

    console.log('Ideogram API response:', data);
    res.json(data);
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