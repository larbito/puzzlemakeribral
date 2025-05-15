const Replicate = require('replicate');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Initialize Replicate with the API token from environment variables
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN || '';

// Real-ESRGAN upscaler model
const ENHANCEMENT_MODEL = "cjwbw/real-esrgan:d0ee3d708c9b911f122a4ad90046c5d26a0293b99476d697f6bb7f2e251ce2d4";

// In-memory cache to store ongoing enhancements
const enhancementCache = new Map();

/**
 * Proxy for ideogram images to avoid CORS issues
 */
exports.proxyIdeogramImage = async (req, res) => {
  try {
    const imageUrl = req.query.url;
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'No image URL provided' });
    }
    
    console.log(`Proxying ideogram image: ${imageUrl.substring(0, 100)}...`);
    
    try {
      // Set appropriate response headers for CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      
      // Fetch the image
      const response = await axios({
        method: 'GET',
        url: imageUrl,
        responseType: 'stream'
      });
      
      // Forward the content type
      res.setHeader('Content-Type', response.headers['content-type']);
      
      // Pipe the image data to the response
      response.data.pipe(res);
    } catch (error) {
      console.error('Error proxying image:', error);
      return res.status(500).json({
        error: 'Failed to proxy image',
        details: error.message
      });
    }
  } catch (error) {
    console.error('Error in proxyIdeogramImage:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
};

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
      const scale = parseInt(req.body.scale) || 8; // Default to 8x upscaling for highest quality
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
      
      // Start polling in the background and return prediction ID immediately
      // This prevents timeouts on the client side
      const pollingPromise = pollForCompletion(replicate, prediction.id);
      
      // Return the prediction ID to the client for status checking
      return res.status(202).json({
        success: true,
        message: 'Image enhancement initiated',
        predictionId: prediction.id,
        status: 'processing',
        statusEndpoint: `/api/check-enhancement-status/${prediction.id}`
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

/**
 * Check the status of an enhancement job
 */
exports.checkEnhancementStatus = async (req, res) => {
  try {
    const { predictionId } = req.params;
    
    if (!predictionId) {
      return res.status(400).json({ error: 'No prediction ID provided' });
    }
    
    // If we have cached result, return it immediately
    if (enhancementCache.has(predictionId)) {
      const cachedResult = enhancementCache.get(predictionId);
      if (cachedResult.status === 'succeeded') {
        return res.status(200).json({
          status: 'completed',
          imageUrl: cachedResult.output,
          success: true
        });
      } else if (cachedResult.status === 'failed') {
        return res.status(500).json({
          status: 'failed',
          error: cachedResult.error || 'Enhancement failed',
          success: false
        });
      }
    }
    
    // Check status from API
    const replicate = new Replicate({ auth: REPLICATE_API_TOKEN });
    const result = await replicate.predictions.get(predictionId);
    
    console.log(`Enhancement status check for ${predictionId}:`, result.status);
    
    if (result.status === 'succeeded') {
      // Cache the result for future requests
      enhancementCache.set(predictionId, {
        status: 'succeeded',
        output: result.output
      });
      
      return res.status(200).json({
        status: 'completed',
        imageUrl: result.output,
        success: true
      });
    } else if (result.status === 'failed') {
      // Cache the failure
      enhancementCache.set(predictionId, {
        status: 'failed',
        error: result.error
      });
      
      return res.status(500).json({
        status: 'failed',
        error: result.error || 'Enhancement failed',
        success: false
      });
    } else {
      // Still processing
      return res.status(200).json({
        status: result.status,
        progress: result.progress || 0,
        success: true
      });
    }
  } catch (error) {
    console.error('Error checking enhancement status:', error);
    return res.status(500).json({
      error: 'Failed to check enhancement status',
      details: error.message
    });
  }
};

/**
 * Poll for completion with exponential backoff
 * This runs in the background and caches results
 */
async function pollForCompletion(replicate, predictionId) {
  let retries = 0;
  const maxRetries = 60; // Increased from 30 to 60
  let backoffTime = 1000; // Start with 1 second
  const maxBackoffTime = 10000; // Max 10 seconds between retries
  
  while (retries < maxRetries) {
    try {
      const result = await replicate.predictions.get(predictionId);
      console.log(`Enhancement status (retry ${retries}):`, result.status);
      
      if (result.status === 'succeeded') {
        // Store result in cache
        enhancementCache.set(predictionId, {
          status: 'succeeded',
          output: result.output
        });
        console.log('Image enhancement succeeded. Output URL:', result.output);
        return result.output;
      } else if (result.status === 'failed') {
        // Store failure in cache
        enhancementCache.set(predictionId, {
          status: 'failed',
          error: result.error
        });
        console.error('Enhancement failed:', result.error);
        throw new Error(`Enhancement failed: ${result.error || 'Unknown error'}`);
      }
      
      // Exponential backoff with jitter
      backoffTime = Math.min(backoffTime * 1.5, maxBackoffTime);
      const jitter = Math.random() * 500; // Add up to 500ms of jitter
      const waitTime = backoffTime + jitter;
      
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, waitTime));
      retries++;
    } catch (error) {
      console.error(`Error during polling (retry ${retries}):`, error);
      // Exponential backoff on errors
      backoffTime = Math.min(backoffTime * 2, maxBackoffTime);
      await new Promise(resolve => setTimeout(resolve, backoffTime));
      retries++;
    }
  }
  
  // If we get here, we've timed out
  const timeoutError = `Enhancement timed out after ${maxRetries} retries`;
  console.error(timeoutError);
  enhancementCache.set(predictionId, {
    status: 'failed',
    error: timeoutError
  });
  
  throw new Error(timeoutError);
} 