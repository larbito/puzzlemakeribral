const Replicate = require('replicate');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Initialize Replicate with the API token from environment variables
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN || '';

// Model info - updated to a current version
const BACKGROUND_REMOVAL_MODEL = "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003";

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
      
      // Log the model being used
      console.log(`Using background removal model: ${BACKGROUND_REMOVAL_MODEL}`);
      
      // Make the API call with a simple structure
      const prediction = await replicate.predictions.create({
        version: BACKGROUND_REMOVAL_MODEL,
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