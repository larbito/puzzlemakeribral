const Replicate = require('replicate');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Initialize Replicate with the API token from environment variables
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN || '';

// Define available background removal models
const BACKGROUND_REMOVAL_MODELS = {
  // Default model - changed to codeplugtech/background_remover
  "default": "codeplugtech/background_remover:37ff2aa89897c0de4a140a3d50969dc62b663ea467e1e2bde18008e3d3731b2b",
  
  // Additional models
  "men1scus/birefnet": "men1scus/birefnet:f74986db0355b58403ed20963af156525e2891ea3c2d499bfbfb2a28cd87c5d7",
  "lucataco/remove-bg": "lucataco/remove-bg:95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1",
  "alexgenovese/remove-background-bria-2": "alexgenovese/remove-background-bria-2:8a67c9d842f7c06fef1b6bcf44bfdccb48b6cca3b420843e705d4a64e04f8974",
  "851-labs/background-remover": "851-labs/background-remover:a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc",
  "smoretalk/rembg-enhance": "smoretalk/rembg-enhance:4067ee2a58f6c161d434a9c077cfa012820b8e076efa2772aa171e26557da919",
  "codeplugtech/background_remover": "codeplugtech/background_remover:37ff2aa89897c0de4a140a3d50969dc62b663ea467e1e2bde18008e3d3731b2b",
  // Fast Remove model removed as it's not working properly
  "pollinations/modnet": "pollinations/modnet:da7d45f3b836795f945f221fc0b01a6d3ab7f5e163f13208948ad436001e2255"
};

/**
 * Remove background from image using Replicate API
 */
exports.removeBackground = async (req, res) => {
  try {
    console.log('Replicate background removal endpoint called');
    
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
    
    // Get model ID from request (if provided)
    const modelId = req.body.modelId || 'default';
    
    // Get the model version
    const modelVersion = BACKGROUND_REMOVAL_MODELS[modelId] || BACKGROUND_REMOVAL_MODELS.default;
    console.log(`Using background removal model: ${modelId} (${modelVersion})`);
    
    try {
      // Get the image data
      const imageBuffer = req.file.buffer;
      console.log(`Processing image: ${req.file.originalname}, Size: ${imageBuffer.length / 1024} KB`);
      
      // Save the uploaded image to a temporary file
      const tempImagePath = path.join(__dirname, '../../temp-upload.png');
      fs.writeFileSync(tempImagePath, imageBuffer);
      
      // Convert the image to base64 for Replicate API
      const base64Image = imageBuffer.toString('base64');
      const dataUri = `data:image/png;base64,${base64Image}`;
      
      // Create Replicate instance
      const replicate = new Replicate({ auth: REPLICATE_API_TOKEN });
      
      // Make the API call with a simple structure
      const prediction = await replicate.predictions.create({
        version: modelVersion,
        input: { image: dataUri }
      });
      
      console.log('Prediction created:', prediction.id);
      
      // Wait for the prediction to complete
      let outputUrl = '';
      let retries = 0;
      const maxRetries = 20;
      
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
        }
        
        // Wait before checking again
        await new Promise(resolve => setTimeout(resolve, 1000));
        retries++;
      }
      
      if (!outputUrl) {
        throw new Error(`Prediction timed out after ${maxRetries} retries`);
      }
      
      // Clean up the temp file
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
        case 'men1scus/birefnet':
          friendlyName = 'Pro Edge Detection';
          break;
        case 'lucataco/remove-bg':
          friendlyName = 'Perfect Cutout';
          break;
        case 'alexgenovese/remove-background-bria-2':
          friendlyName = 'Bria AI Precision';
          break;
        case '851-labs/background-remover':
          friendlyName = 'Precision Focus';
          break;
        case 'smoretalk/rembg-enhance':
          friendlyName = 'Enhanced Detail';
          break;
        case 'codeplugtech/background_remover':
          friendlyName = 'Clean Edges';
          break;
        case 'pollinations/modnet':
          friendlyName = 'Portrait Specialist';
          break;
      }
      
      return {
        id,
        name: friendlyName,
        version,
        isRecommended: id === 'codeplugtech/background_remover' || 
                     id === '851-labs/background-remover' || 
                     id === 'men1scus/birefnet'
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