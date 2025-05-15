const Replicate = require('replicate');
const { Buffer } = require('buffer');
const fs = require('fs');
const path = require('path');

// Initialize Replicate with the API token from environment variables
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN || '';

// Default background removal model
const DEFAULT_BACKGROUND_REMOVAL_MODEL = "replicate/rembg:99375fd7b66f8a9fd65dad75a79d8889f4157370b798a5d5a98e6ed41e302664";

// Available background removal models
const BACKGROUND_REMOVAL_MODELS = {
  "men1scus/birefnet:f74986db0355b58403ed20963af156525e2891ea3c2d499bfbfb2a28cd87c5d7": "Pro Edge Detection",
  "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003": "High Definition",
  "lucataco/remove-bg:95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1": "Perfect Cutout",
  "851-labs/background-remover:a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc": "Precision Focus",
  "smoretalk/rembg-enhance:4067ee2a58f6c161d434a9c077cfa012820b8e076efa2772aa171e26557da919": "Enhanced Detail"
};

/**
 * Remove background from image using Replicate API's REMBG model
 */
exports.removeBackground = async (req, res) => {
  try {
    console.log('Replicate background removal endpoint called');
    
    // Log request information 
    console.log(`Request content type: ${req.headers['content-type']}`);
    
    // Ensure we have the required data
    if (!req.file) {
      console.error('No image file was provided in the request');
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    // Validate Replicate API token
    if (!REPLICATE_API_TOKEN) {
      console.error('REPLICATE_API_TOKEN is not configured');
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'Replicate API token is not configured'
      });
    }
    
    // Check if specific model was requested
    const requestedModelId = req.body.modelId;
    
    // Determine which model to use
    let modelToUse = DEFAULT_BACKGROUND_REMOVAL_MODEL;
    
    if (requestedModelId && BACKGROUND_REMOVAL_MODELS[requestedModelId]) {
      console.log(`Using requested model: ${requestedModelId} (${BACKGROUND_REMOVAL_MODELS[requestedModelId]})`);
      modelToUse = requestedModelId;
    } else if (requestedModelId) {
      console.warn(`Requested model ${requestedModelId} not found, using default model`);
    } else {
      console.log(`Using default model: ${DEFAULT_BACKGROUND_REMOVAL_MODEL}`);
    }
    
    const replicate = new Replicate({ auth: REPLICATE_API_TOKEN });
    
    const imageBuffer = req.file.buffer;
    console.log(`Processing image: ${req.file.originalname}, Size: ${imageBuffer.length / 1024} KB`);
    
    try {
      // Step 1: Save the uploaded image to a temporary file
      const tempImagePath = path.join(__dirname, '../../temp-upload.png');
      fs.writeFileSync(tempImagePath, imageBuffer);
      
      // Step 2: Convert the image to base64 for Replicate API
      const base64Image = imageBuffer.toString('base64');
      const dataUri = `data:image/png;base64,${base64Image}`;
      
      // Step 3: Remove the background using Replicate's chosen model
      console.log(`Removing background with Replicate using model: ${modelToUse}`);
      const bgRemovalOutput = await replicate.run(
        modelToUse,
        {
          input: {
            image: dataUri
          }
        }
      );
      
      console.log('Background removal completed');
      console.log('Background removal output URL:', bgRemovalOutput);
      
      // Clean up the temp file
      if (fs.existsSync(tempImagePath)) {
        fs.unlinkSync(tempImagePath);
      }
      
      // Return success response with the image URL
      return res.status(200).json({
        imageUrl: bgRemovalOutput,
        success: true
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