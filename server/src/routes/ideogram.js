import express from 'express';
import { verifyToken } from './auth.js';

const router = express.Router();

// Generate images using Ideogram API
router.post('/generate', verifyToken, async (req, res) => {
  try {
    const { prompt, style, aspectRatio } = req.body;

    // Call Ideogram API
    const response = await fetch('https://api.ideogram.ai/api/v1/images', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.IDEOGRAM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        style: style || 'general',
        aspect_ratio: aspectRatio || '1:1',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate image');
    }

    const data = await response.json();

    // Store the generation in history (implement database storage here)
    
    res.json(data);
  } catch (error) {
    console.error('Ideogram API error:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

// Get generation history
router.get('/history', verifyToken, async (req, res) => {
  try {
    // Implement fetching history from database
    res.json({ history: [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

export default router; 