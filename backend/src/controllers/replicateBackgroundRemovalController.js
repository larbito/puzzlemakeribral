const Replicate = require('replicate');
const { Buffer } = require('buffer');
const fs = require('fs');
const path = require('path');

// Initialize Replicate with the API token from environment variables
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN || '';

// Background removal model
const BACKGROUND_REMOVAL_MODEL = "ilkerc/rembg:0165a68e45a525a527d7edc2de4d161a0fd11a6729904ebd1fe0d317b6d428d2";

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
      
      // Step 3: Remove the background using Replicate's rembg model
      console.log('Removing background with Replicate...');
      const bgRemovalOutput = await replicate.run(
        BACKGROUND_REMOVAL_MODEL,
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