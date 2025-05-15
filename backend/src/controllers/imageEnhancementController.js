const Replicate = require('replicate');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Initialize Replicate with the API token from environment variables
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN || '';

// Real-ESRGAN upscaler model
const ENHANCEMENT_MODEL = "cjwbw/real-esrgan:d0ee3d708c9b911f122a4ad90046c5d26a0293b99476d697f6bb7f2e251ce2d4";

/**
 * Enhance image quality using Real-ESRGAN upscaler via Replicate API
 */
exports.enhanceImage = async (req, res) => {
  try {
    console.log('Image enhancement endpoint called');
    
    // Ensure we have the required data
    if (!req.file && !req.body.imageUrl) {
      console.error('No image file or URL was provided in the request');
      return res.status(400).json({ error: 'No image provided' });
    }
    
    // Validate Replicate API token
    if (!REPLICATE_API_TOKEN) {
      console.error('REPLICATE_API_TOKEN is not configured');
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'Replicate API token is not configured'
      });
    }
    
    try {
      let imageData;
      
      // Handle both file upload and URL input
      if (req.file) {
        // Get the image data from uploaded file
        const imageBuffer = req.file.buffer;
        console.log(`Processing uploaded image: ${req.file.originalname}, Size: ${imageBuffer.length / 1024} KB`);
        
        // Convert to base64
        const base64Image = imageBuffer.toString('base64');
        imageData = `data:image/png;base64,${base64Image}`;
      } else if (req.body.imageUrl) {
        // Use provided URL directly
        console.log(`Processing image from URL: ${req.body.imageUrl.substring(0, 100)}...`);
        imageData = req.body.imageUrl;
      }
      
      // Get optional parameters with defaults
      const scale = parseInt(req.body.scale) || 8; // Default to 8x upscaling
      console.log(`Enhancing image with scale factor: ${scale}x`);
      
      // Create Replicate instance
      const replicate = new Replicate({ auth: REPLICATE_API_TOKEN });
      
      // Make the API call with appropriate parameters
      const prediction = await replicate.predictions.create({
        version: ENHANCEMENT_MODEL,
        input: { 
          image: imageData,
          scale: scale,
          face_enhance: true // Enable face enhancement
        }
      });
      
      console.log('Enhancement prediction created:', prediction.id);
      
      // Wait for the prediction to complete
      let outputUrl = '';
      let retries = 0;
      const maxRetries = 30; // More retries for enhancement as it can take longer
      
      while (retries < maxRetries) {
        const result = await replicate.predictions.get(prediction.id);
        console.log(`Enhancement status (retry ${retries}):`, result.status);
        
        if (result.status === 'succeeded') {
          outputUrl = result.output;
          console.log('Image enhancement succeeded. Output URL:', outputUrl);
          break;
        } else if (result.status === 'failed') {
          console.error('Enhancement failed:', result.error);
          throw new Error(`Enhancement failed: ${result.error || 'Unknown error'}`);
        }
        
        // Wait before checking again
        await new Promise(resolve => setTimeout(resolve, 1000));
        retries++;
      }
      
      if (!outputUrl) {
        throw new Error(`Enhancement timed out after ${maxRetries} retries`);
      }
      
      // Return success response with the image URL
      return res.status(200).json({
        imageUrl: outputUrl,
        success: true
      });
    } catch (error) {
      console.error('Error in image enhancement process:', error);
      return res.status(500).json({
        error: 'Image enhancement failed',
        details: error.message || 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Internal server error during image enhancement:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message || 'An unexpected error occurred'
    });
  }
}; 