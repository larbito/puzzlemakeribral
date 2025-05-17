const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

// Configure OpenAI API key from environment
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Middleware to check if OpenAI API key is configured
 */
const checkApiKey = (req, res, next) => {
  if (!OPENAI_API_KEY) {
    console.error('OpenAI API key is missing');
    return res.status(500).json({
      error: 'OpenAI API key not configured',
      details: 'Please set OPENAI_API_KEY in your environment variables'
    });
  }
  next();
};

router.use(checkApiKey);

/**
 * Enhance a prompt with GPT-4
 * POST /api/openai/enhance-prompt
 */
router.post('/enhance-prompt', express.json(), async (req, res) => {
  try {
    console.log('Enhance prompt request received');
    const { prompt, context } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const systemPrompt = context || 'You are a helpful assistant that enhances user prompts for generating image content.';
    
    console.log('Calling OpenAI API to enhance prompt');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Enhance this book cover prompt with more detailed visual descriptions: "${prompt}"` }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return res.status(response.status).json({
        error: 'Failed to enhance prompt with OpenAI',
        details: errorData
      });
    }

    const data = await response.json();
    const enhancedPrompt = data.choices[0]?.message?.content?.trim();
    
    if (!enhancedPrompt) {
      return res.status(500).json({ error: 'No enhanced prompt received from OpenAI' });
    }

    console.log('Prompt enhanced successfully');
    res.json({ enhancedPrompt });
  } catch (error) {
    console.error('Error enhancing prompt:', error);
    res.status(500).json({ 
      error: 'Failed to enhance prompt',
      details: error.message
    });
  }
});

/**
 * Extract a prompt from an image using GPT-4 Vision
 * POST /api/openai/extract-prompt
 */
router.post('/extract-prompt', express.json(), async (req, res) => {
  try {
    console.log('Extract prompt from image request received');
    const { imageUrl, context } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    const systemPrompt = context || 'You are a helpful assistant that analyses images and produces detailed descriptions.';
    
    console.log('Calling OpenAI API to extract prompt from image');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: [
              { type: 'text', text: 'Create a detailed description of this book cover image that could be used as a prompt to generate a similar cover.' },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.5
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return res.status(response.status).json({
        error: 'Failed to extract prompt from image with OpenAI',
        details: errorData
      });
    }

    const data = await response.json();
    const extractedPrompt = data.choices[0]?.message?.content?.trim();
    
    if (!extractedPrompt) {
      return res.status(500).json({ error: 'No extracted prompt received from OpenAI' });
    }

    console.log('Prompt extracted successfully');
    res.json({ extractedPrompt });
  } catch (error) {
    console.error('Error extracting prompt:', error);
    res.status(500).json({ 
      error: 'Failed to extract prompt from image',
      details: error.message
    });
  }
});

module.exports = router; 