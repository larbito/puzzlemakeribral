const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

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

module.exports = router; 