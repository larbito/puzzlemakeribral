const Replicate = require('replicate');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Initialize Replicate with the API token from environment variables
// Check for either REPLICATE_API_TOKEN or REPLICATE_API_KEY
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY || '';

// Debug log for API token presence (don't log the actual token)
console.log('Replicate Background Removal Controller initialized');
console.log('Replicate API token configured:', REPLICATE_API_TOKEN ? 'Yes' : 'No');

// Define available background removal models
const BACKGROUND_REMOVAL_MODELS = {
  // Default model - high quality general purpose
  "default": "clipdrop/remove-background:0601b0e80aa98d810ec261e5bc9a4d32307429e4513aea2b4ef6e3c50e721bb8",
  
  // Best models for t-shirt designs
  "text_specialist": "men1scus/birefnet:f74986db0355b58403ed20963af156525e2891ea3c2d499bfbfb2a28cd87c5d7",
  "clean_edges": "codeplugtech/background_remover:37ff2aa89897c0de4a140a3d50969dc62b663ea467e1e2bde18008e3d3731b2b",
  "sharp_contrast": "cjwbw/rmbg-ultimatte:fc0f4fda4cf294af6e7d37ffa39c80ef5251f90bbd65542b05af5605d3b347cd",
  "complex_designs": "ilharper/rembg:553676f0d161e1ad440f4c620c9df162b38a25e30b0bb3810def8aa63d1ac37c",
  "precision_cutout": "lucataco/remove-bg:95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1"
};

/**
 * Process image for better compatibility with ML models
 * Ensures the image is in a format compatible with Replicate models
 */
async function processImageForML(imageBuffer) {
  try {
    console.log('Processing image for ML model compatibility...');
    
    // In a more complex implementation, we'd use a library like Sharp
    // to convert to RGB format and resize if needed
    
    // For now, we'll just return the buffer and use alpha_matting
    // parameters on the API side to handle potential transparency issues
    return imageBuffer;
  } catch (error) {
    console.error('Error processing image:', error);
    return imageBuffer; // Return original as fallback
  }
}

/**
 * Get model-specific parameters for optimal results with each model
 */
function getModelParameters(modelId) {
  // Default parameters that work for most models
  const defaultParams = {
    return_mask: false,
    alpha_matting: false,
    only_mask: false,
    post_process_mask: false
  };
  
  // Customize parameters based on specific model requirements
  switch (modelId) {
    case 'codeplugtech/background_remover':
      return {
        ...defaultParams,
        // Fix for "tensor a (4) must match tensor b (3)" error
        // This model has issues with alpha channels
        alpha_channel: false,
        // Add a lower resolution parameter to help with timeouts
        // This trades quality for reliability
        low_res_mode: true
      };
    case 'smoretalk/rembg-enhance':
      return {
        ...defaultParams,
        // This model works better with these settings
        alpha_matting: true,
        alpha_matting_foreground_threshold: 240,
        alpha_matting_background_threshold: 10,
        alpha_matting_erode_size: 10
      };
    case 'alexgenovese/remove-background-bria-2':
      return {
        // This model needs different parameters
        // to avoid timeouts and tensor dimension issues
        return_mask: false,
        only_mask: false,
        // Set low_res_mode to help with timeouts
        low_res_mode: true,
        // Disable features that might cause tensor issues
        alpha_matting: false
      };
    case 'lucataco/remove-bg':
      return {
        // Simplified parameters for this model
        alpha_matting: false,
        low_res_mode: true
      };
    case '851-labs/background-remover':
      return {
        // This is one of our most reliable models
        // Already optimized, just ensure consistent parameters
        ...defaultParams
      };
    case 'men1scus/birefnet':
      return {
        // One of our most reliable models
        // Minimal parameters for reliable results
        ...defaultParams
      };
    case 'pollinations/modnet':
      return {
        // Custom parameters for this portrait-focused model
        ...defaultParams,
        // Trade quality for reliability
        low_res_mode: true
      };
    default:
      return defaultParams;
  }
}

/**
 * Remove background from image using Replicate API
 */
exports.removeBackground = async (req, res) => {
  try {
    console.log('Replicate background removal endpoint called');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file ? `File received: ${req.file.originalname}` : 'No file received');
    
    // Ensure we have the required data
    if (!req.file) {
      console.error('No image file was provided in the request');
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    // Check for either API token name
    const apiToken = process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY || '';
    
    // Validate Replicate API token
    if (!apiToken) {
      console.error('Replicate API token is not configured');
      console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('REPLICATE')).join(', '));
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'Replicate API token is not configured'
      });
    }
    
    // Get model ID from request (if provided)
    const modelId = req.body.modelId || 'default';
    
    // Get the model version
    const modelVersion = BACKGROUND_REMOVAL_MODELS[modelId] || BACKGROUND_REMOVAL_MODELS.default;
    console.log(`Using background removal model: ${modelId} (${modelVersion})`);
    
    try {
      // Get the image data
      const imageBuffer = req.file.buffer;
      console.log(`Processing image: ${req.file.originalname}, Size: ${imageBuffer.length / 1024} KB`);
      
      // Process image to ensure compatibility with ML models
      const processedImageBuffer = await processImageForML(imageBuffer);
      
      // Create Replicate instance
      const replicate = new Replicate({ auth: apiToken });
      
      // Get model-specific parameters
      const modelParams = getModelParameters(modelId);
      console.log(`Using model-specific parameters:`, modelParams);
      
      // Different approach for different models
      let prediction;
      
      try {
        // First try with direct base64 approach (works for most models)
        const base64Image = processedImageBuffer.toString('base64');
        const dataUri = `data:image/png;base64,${base64Image}`;
        
        try {
          prediction = await replicate.predictions.create({
            version: modelVersion,
            input: { 
              image: dataUri,
              // Use model-specific parameters
              ...modelParams
            }
          });
          
          console.log('Prediction created with base64 method:', prediction.id);
        } catch (base64Error) {
          console.error('Base64 method failed, error:', base64Error);
          
          // Check for specific error messages
          if (base64Error.message && (
              base64Error.message.includes('Invalid version') || 
              base64Error.message.includes('not permitted'))) {
            // Try an alternative model if available
            console.log('Model version issue detected, trying alternative model...');
            const fallbackModelId = 'text_specialist'; // Our most reliable model
            const fallbackModelVersion = BACKGROUND_REMOVAL_MODELS[fallbackModelId];
            console.log(`Using fallback model: ${fallbackModelId} (${fallbackModelVersion})`);
            
            prediction = await replicate.predictions.create({
              version: fallbackModelVersion,
              input: { 
                image: dataUri,
                // Use minimal parameters for this fallback approach
                return_mask: false,
                alpha_matting: false
              }
            });
            
            console.log('Prediction created with fallback model:', prediction.id);
          } else {
            // If not a model error, try the URL approach
            // Save the uploaded image to a temporary file
            const tempImagePath = path.join(__dirname, '../../temp-upload.png');
            fs.writeFileSync(tempImagePath, processedImageBuffer);
            
            // Convert the image to URL for Replicate API
            // In a real implementation, you would upload to S3 or similar
            // For now, we'll use a simple approach
            const imageUrl = `file://${tempImagePath}`;
            
            prediction = await replicate.predictions.create({
              version: modelVersion,
              input: { 
                image: imageUrl,
                // Use model-specific parameters
                ...modelParams
              }
            });
            
            console.log('Prediction created with URL method:', prediction.id);
          }
        }
      } catch (error) {
        console.error('Error in Replicate background removal process:', error);
        return res.status(500).json({
          error: 'Background removal failed',
          details: error.message || 'Unknown error'
        });
      }
      
      // Wait for the prediction to complete
      let outputUrl = '';
      let retries = 0;
      const maxRetries = 30; // Increased from 20 to 30
      let pollInterval = 1000; // Start with 1 second
      
      while (retries < maxRetries) {
        const result = await replicate.predictions.get(prediction.id);
        console.log(`Prediction status (retry ${retries}):`, result.status);
        
        if (result.status === 'succeeded') {
          outputUrl = result.output;
          console.log('Background removal succeeded. Output URL:', outputUrl);
          break;
        } else if (result.status === 'failed') {
          console.error('Prediction failed:', result.error);
          throw new Error(`Prediction failed: ${result.error || 'Unknown error'}`);
        } else if (result.status === 'canceled') {
          console.error('Prediction canceled by the service');
          throw new Error('Background removal job was canceled by the service');
        }
        
        // Increment retry counter and implement exponential backoff
        retries++;
        
        // Use exponential backoff to increase wait time between checks
        // This helps reduce API load and gives more time for processing
        pollInterval = Math.min(pollInterval * 1.5, 5000); // Cap at 5 seconds max
        console.log(`Waiting ${pollInterval}ms before next status check (retry ${retries}/${maxRetries})...`);
        
        // Wait before checking again
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
      
      if (!outputUrl) {
        if (retries >= maxRetries) {
          console.error(`Prediction timed out after ${maxRetries} retries for model: ${modelId || 'default'}`);
          throw new Error(`Prediction timed out after ${maxRetries} retries. Please try again with another model or a smaller image.`);
        } else {
          throw new Error(`No output URL returned from background removal service`);
        }
      }
      
      // Clean up the temp file if it exists
      const tempImagePath = path.join(__dirname, '../../temp-upload.png');
      if (fs.existsSync(tempImagePath)) {
        fs.unlinkSync(tempImagePath);
      }
      
      // Return success response with the image URL
      return res.status(200).json({
        imageUrl: outputUrl,
        success: true,
        modelUsed: modelId
      });
    } catch (error) {
      console.error('Error in Replicate background removal process:', error);
      return res.status(500).json({
        error: 'Background removal failed',
        details: error.message || 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Internal server error during background removal:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message || 'An unexpected error occurred'
    });
  }
};

/**
 * Get available background removal models
 */
exports.getModels = async (req, res) => {
  try {
    // Format models for frontend display
    const models = Object.entries(BACKGROUND_REMOVAL_MODELS).map(([id, version]) => {
      // Generate a friendly name
      let friendlyName = id;
      switch (id) {
        case 'default':
          friendlyName = 'Standard Removal (Default)';
          break;
        case 'text_specialist':
          friendlyName = 'Text Specialist - Best for designs with text';
          break;
        case 'clean_edges':
          friendlyName = 'Clean Edges - Sharp, precise boundaries';
          break;
        case 'sharp_contrast':
          friendlyName = 'Sharp Contrast - High definition results';
          break;
        case 'complex_designs':
          friendlyName = 'Complex Design Handler - Best for intricate artwork';
          break;
        case 'precision_cutout':
          friendlyName = 'Precision Cutout - Professional quality extraction';
          break;
      }
      
      return {
        id,
        name: friendlyName,
        version,
        isRecommended: id === 'default' || 
                     id === 'text_specialist' ||
                     id === 'clean_edges'
      };
    });
    
    return res.status(200).json({
      models,
      success: true
    });
  } catch (error) {
    console.error('Error fetching background removal models:', error);
    return res.status(500).json({
      error: 'Failed to get background removal models',
      details: error.message || 'Unknown error'
    });
  }
};