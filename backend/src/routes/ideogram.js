const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const multer = require('multer');
const upload = multer();

router.post('/generate', async (req, res) => {
  try {
    const { prompt, style, aspect_ratio, negative_prompt, seed } = req.body;
    
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
        aspect_ratio,
        negative_prompt,
        seed
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to generate image');
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Ideogram API error:', error);
    res.status(500).json({ error: error.message });
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