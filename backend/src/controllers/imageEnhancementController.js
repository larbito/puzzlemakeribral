const Replicate = require('replicate');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Initialize Replicate with the API token from environment variables
// NOTE: We're using Replicate for image enhancement and PhotoRoom for background removal
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY || '';

// Debug log for API token presence (don't log the actual token)
console.log('Replicate API Token available:', !!REPLICATE_API_TOKEN);

// Define available enhancement models
const ENHANCEMENT_MODELS = {
  // Text-optimized models
  "text-upscaler": "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b",
  "controlnet-hq": "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
  "codeformer": "tencentarc/gfpgan:9283608cc6b7be6b65a8e44983db012355fde4132009bf99d976b2f0896856a3"
};

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
 * Enhance image quality using selected upscaler model via Replicate API
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
      const scale = parseInt(req.body.scale) || 4; // Default to 4x upscaling for better balance between quality and performance
      
      // Check if we need to preserve transparency
      const preserveTransparency = req.body.preserveTransparency === 'true';
      console.log(`Preserve transparency flag:`, preserveTransparency);
      
      // Get selected model or use default
      const selectedModel = req.body.model || "text-upscaler";
      if (!ENHANCEMENT_MODELS[selectedModel]) {
        console.log(`Invalid model ${selectedModel}, using default text-upscaler instead`);
      }
      
      console.log(`Enhancing image with scale factor: ${scale}x using model: ${selectedModel}`);
      
      // Create Replicate instance
      const replicate = new Replicate({ auth: REPLICATE_API_TOKEN });
      
      // Prepare the appropriate input parameters based on the model
      let modelInput = {};
      
      // Different models expect different input parameters
      switch(selectedModel) {
        case "text-upscaler":
          // Real-ESRGAN expects image and scale
          modelInput = {
            image: imageData,
            scale: scale,
            face_enhance: true // Enable face enhancement for better results
          };
          
          // If preserving transparency, add specific parameters
          if (preserveTransparency) {
            console.log('Adding special parameters for transparent image processing');
            modelInput.face_enhance = false; // Face enhancement can cause issues with transparency
            // Note: Real-ESRGAN doesn't have an explicit transparency preservation parameter,
            // but it generally handles PNG transparency well by default
          }
          break;
        case "controlnet-hq":
          // SDXL has different parameters
          modelInput = {
            prompt: preserveTransparency ? 
              "Enhance this image with high quality upscaling, preserve transparency and all details" :
              "Enhance this image with high quality upscaling, preserve all details",
            image: imageData,
            num_inference_steps: 30
          };
          break;
        case "codeformer":
          // GFPGAN face restoration model
          modelInput = {
            img: imageData,
            version: "v1.4",
            scale: scale
          };
          break;
        default:
          // Default Real-ESRGAN parameters
          modelInput = {
            image: imageData,
            scale: scale
          };
      }
      
      // Make the API call with appropriate parameters
      const prediction = await replicate.predictions.create({
        version: ENHANCEMENT_MODELS[selectedModel] || ENHANCEMENT_MODELS["text-upscaler"],
        input: modelInput
      });
      
      console.log('Enhancement prediction created:', prediction.id);
      
      // Store information about transparency preservation for later use
      if (preserveTransparency) {
        enhancementCache.set(`${prediction.id}_transparency`, true);
      }
      
      // Start polling in the background and return prediction ID immediately
      // This prevents timeouts on the client side
      const pollingPromise = pollForCompletion(replicate, prediction.id, preserveTransparency);
      
      // Return the prediction ID to the client for status checking
      return res.status(202).json({
        success: true,
        message: 'Image enhancement initiated',
        predictionId: prediction.id,
        status: 'processing',
        model: selectedModel,
        statusEndpoint: `/api/image-enhancement/status/${prediction.id}`,
        preserveTransparency: preserveTransparency
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
 * Helper function to poll for prediction completion until it succeeds or fails
 * This runs in the background and caches results
 */
async function pollForCompletion(replicate, predictionId, preserveTransparency) {
  let retries = 0;
  const maxRetries = 60; // Increased from 30 to 60
  const initialBackoff = 1000; // Start with 1 second interval
  let currentBackoff = initialBackoff;
  
  // Record start time for logging
  const startTime = Date.now();
  
  console.log('Starting background polling for prediction:', predictionId);
  
  while (retries < maxRetries) {
    try {
      retries++;
      const elapsedTime = Math.round((Date.now() - startTime) / 1000);
      console.log(`Enhancement status (retry ${retries}/${maxRetries}, elapsed: ${elapsedTime}s): checking...`);
      
      const prediction = await replicate.predictions.get(predictionId);
      const status = prediction.status;
      
      // Log the progress if available
      if (prediction.metrics && prediction.metrics.predict_time) {
        console.log(`Processing time so far: ${prediction.metrics.predict_time}s`);
      }
      
      if (status === 'succeeded') {
        console.log(`Enhancement successful for ${predictionId} (after ${retries} attempts, ${elapsedTime}s)`);
        
        // For images with transparency, we need to ensure the output preserves it
        let outputUrl = prediction.output;
        
        if (preserveTransparency) {
          console.log('Preserving transparency in enhanced output');
          // The URL is already set up to preserve transparency if input was PNG
        }
        
        // Cache the successful result
        enhancementCache.set(predictionId, {
          status: 'succeeded',
          output: outputUrl,
          completedAt: new Date().toISOString(),
          preservedTransparency: preserveTransparency
        });
        console.log('Enhancement result cached:', predictionId);
        
        return {
          success: true,
          output: outputUrl
        };
      } else if (status === 'failed') {
        console.error(`Enhancement failed for ${predictionId} (after ${retries} attempts, ${elapsedTime}s)`, prediction.error);
        
        // Cache the failed result
        enhancementCache.set(predictionId, {
          status: 'failed',
          error: prediction.error || 'Enhancement failed without specific error',
          completedAt: new Date().toISOString()
        });
        
        return {
          success: false,
          error: prediction.error || 'Enhancement failed without specific error'
        };
      } else if (status === 'canceled') {
        console.log(`Enhancement canceled for ${predictionId}`);
        
        // Cache the cancellation
        enhancementCache.set(predictionId, {
          status: 'failed',
          error: 'Enhancement was canceled',
          completedAt: new Date().toISOString()
        });
        
        return {
          success: false,
          error: 'Enhancement was canceled'
        };
      }
      
      // If the prediction is still processing, wait and try again
      console.log(`Enhancement status for ${predictionId}: ${status} (attempt ${retries}/${maxRetries})`);
      
      // Store intermediate status in cache
      enhancementCache.set(predictionId, {
        status: status,
        progress: prediction.progress || 0,
        updatedAt: new Date().toISOString()
      });
      
      await new Promise(resolve => setTimeout(resolve, currentBackoff));
      // Exponential backoff with jitter (up to 10s max)
      currentBackoff = Math.min(
        currentBackoff * (1.5 + Math.random() * 0.5),
        10000
      );
    } catch (error) {
      console.error(`Error polling enhancement status (attempt ${retries}/${maxRetries}):`, error);
      
      await new Promise(resolve => setTimeout(resolve, currentBackoff));
      // Exponential backoff with jitter for errors too
      currentBackoff = Math.min(
        currentBackoff * (1.5 + Math.random() * 0.5),
        10000
      );
    }
  }
  
  // If we've reached the maximum number of retries, consider it a failure
  console.error(`Enhancement polling timed out after ${maxRetries} attempts`);
  
  // Cache the timeout failure
  enhancementCache.set(predictionId, {
    status: 'failed',
    error: 'Enhancement timed out',
    completedAt: new Date().toISOString()
  });
  
  return {
    success: false,
    error: 'Enhancement timed out'
  };
}

/**
 * Get available enhancement models
 */
exports.getAvailableModels = async (req, res) => {
  try {
    const modelInfo = {
      "text-upscaler": {
        name: "Real-ESRGAN",
        description: "Standard image upscaler that works well with most designs, especially text and line art",
        model: "text-upscaler"
      },
      "controlnet-hq": {
        name: "SDXL Enhancer",
        description: "AI-powered image enhancement that maintains crisp details and vibrant colors",
        model: "controlnet-hq"
      },
      "codeformer": {
        name: "GFPGAN",
        description: "Specialized in enhancing faces and portraits while maintaining natural details",
        model: "codeformer"
      }
    };
    
    return res.status(200).json({
      success: true,
      models: modelInfo,
      defaultModel: "text-upscaler"
    });
  } catch (error) {
    console.error('Error getting available models:', error);
    return res.status(500).json({
      error: 'Failed to get available models',
      details: error.message
    });
  }
}; 