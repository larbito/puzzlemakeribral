import express from 'express';
import fetch from 'node-fetch';
import { v2 as cloudinary } from 'cloudinary';
import logger from '../utils/logger.js';

const router = express.Router();

// Validate request body
const validateRequest = (req, res, next) => {
  const { prompt, style, format } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }
  req.body.style = style || 'general';
  req.body.format = format || 'png';
  next();
};

// Generate image using Ideogram API
router.post('/', validateRequest, async (req, res) => {
  try {
    const { prompt, style, format } = req.body;
    
    logger.info('Generating image', { prompt, style, format });

    // Call Ideogram API
    const response = await fetch('https://api.ideogram.ai/api/v1/images', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.IDEOGRAM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        style,
        aspect_ratio: '1:1', // Can be made configurable
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('Ideogram API error', { error, status: response.status });
      throw new Error(`Ideogram API error: ${error}`);
    }

    const data = await response.json();
    
    // If configured, upload to cloud storage
    if (process.env.UPLOAD_TO_CLOUD === 'true') {
      try {
        const uploadResult = await cloudinary.uploader.upload(data.image_url, {
          folder: 'puzzle-craft-forge/generated',
          resource_type: 'image'
        });
        
        logger.info('Image uploaded to Cloudinary', { 
          publicId: uploadResult.public_id 
        });

        return res.json({
          url: uploadResult.secure_url,
          original_url: data.image_url
        });
      } catch (uploadError) {
        logger.error('Failed to upload to Cloudinary', { error: uploadError });
        // Fall back to original URL if upload fails
        return res.json({ url: data.image_url });
      }
    }

    // Return the direct URL if cloud upload is not configured
    res.json({ url: data.image_url });
  } catch (error) {
    logger.error('Failed to generate image', { 
      error: error.message,
      stack: error.stack 
    });
    
    res.status(500).json({ 
      error: 'Failed to generate image',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router; 