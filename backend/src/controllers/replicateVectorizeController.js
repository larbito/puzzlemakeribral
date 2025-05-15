const Replicate = require('replicate');
const { Buffer } = require('buffer');
const fs = require('fs');
const path = require('path');

// Initialize Replicate with the API token from environment variables
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN || '';

// Background removal model
const BACKGROUND_REMOVAL_MODEL = "ilkerc/rembg:0165a68e45a525a527d7edc2de4d161a0fd11a6729904ebd1fe0d317b6d428d2";

// SVG converter model
const SVG_CONVERTER_MODEL = "cjwbw/vectorizer:435e23d5ce33dcba2618f9e5969193c2f7af48ad0b028731f1633e678f5cbf40";

/**
 * Vectorize an image using Replicate API for background removal and vectorization
 */
exports.vectorizeImage = async (req, res) => {
  try {
    console.log('Replicate vectorization endpoint called');
    
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
      
      // Step 4: Now convert the transparent PNG to SVG using vectorizer model
      console.log('Converting to SVG with Replicate...');
      const svgOutput = await replicate.run(
        SVG_CONVERTER_MODEL,
        {
          input: {
            image: bgRemovalOutput,
            detail: 1, // Higher detail for better quality
            mode: "pen",
            colors: "true", // Preserve colors
            style: "color"
          }
        }
      );
      
      console.log('SVG conversion completed');
      console.log('SVG output from Replicate:', svgOutput);
      
      // Step 5: Get the SVG data and clean it up
      let svgData;
      if (typeof svgOutput === 'string' && svgOutput.includes('<svg')) {
        // If the model returned the SVG string directly
        svgData = svgOutput;
      } else if (svgOutput && svgOutput.svg) {
        // If the model returned an object with an svg property
        svgData = svgOutput.svg;
      } else if (svgOutput && svgOutput.url) {
        // If the model returned a URL to the SVG, fetch it
        console.log('Fetching SVG from URL:', svgOutput.url);
        const svgResponse = await fetch(svgOutput.url);
        svgData = await svgResponse.text();
      } else {
        throw new Error('Unexpected format in SVG conversion output');
      }
      
      // Enhancement: Ensure the SVG has a transparent background
      if (!svgData.includes('fill="none"')) {
        svgData = svgData.replace(/<svg/, '<svg fill="none"');
      }
      
      if (!svgData.includes('style="background')) {
        svgData = svgData.replace(/<svg/, '<svg style="background-color: transparent;"');
      }
      
      // Clean up the temp file
      if (fs.existsSync(tempImagePath)) {
        fs.unlinkSync(tempImagePath);
      }
      
      // Create a base64 data URL for the SVG
      const svgBase64 = Buffer.from(svgData).toString('base64');
      const svgUrl = `data:image/svg+xml;base64,${svgBase64}`;
      
      console.log('Replicate vectorization successful');
      
      // Return success response with the SVG data
      return res.status(200).json({
        svgUrl,
        svgData
      });
    } catch (error) {
      console.error('Error in Replicate vectorization process:', error);
      return res.status(500).json({
        error: 'Vectorization failed',
        details: error.message || 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Internal server error during vectorization:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message || 'An unexpected error occurred'
    });
  }
}; 