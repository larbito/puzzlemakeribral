const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Check for PhotoRoom API key in environment variables
const PHOTOROOM_API_KEY = process.env.PHOTOROOM_API_KEY || '';

// Debug log for API token presence (don't log the actual token)
console.log('PhotoRoom Background Removal Controller initialized');
console.log('PhotoRoom API key configured:', PHOTOROOM_API_KEY ? 'Yes' : 'No');
// Log just to verify what key is being used (first few characters only for security)
if (PHOTOROOM_API_KEY) {
  console.log('PhotoRoom API key starts with:', PHOTOROOM_API_KEY.substring(0, 8) + '...');
}

/**
 * Remove background from image using PhotoRoom API
 */
exports.removeBackground = async (req, res) => {
  try {
    console.log('PhotoRoom background removal endpoint called');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file ? `File received: ${req.file.originalname}` : 'No file received');
    
    // Ensure we have the required data
    if (!req.file) {
      console.error('No image file was provided in the request');
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    // Validate PhotoRoom API key
    if (!PHOTOROOM_API_KEY) {
      console.error('PhotoRoom API key is not configured');
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'PhotoRoom API key is not configured'
      });
    }
    
    try {
      // Get the image data
      const imageBuffer = req.file.buffer;
      console.log(`Processing image: ${req.file.originalname}, Size: ${imageBuffer.length / 1024} KB`);
      
      // Call PhotoRoom API to remove background
      const photoRoomUrl = 'https://sdk.photoroom.com/v1/segment';
      
      console.log('Calling PhotoRoom API...');
      
      // Create a FormData object to properly format the multipart/form-data request
      const formData = new FormData();
      formData.append('image_file', imageBuffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype
      });
      
      // Log headers for troubleshooting
      console.log('Using API key header: x-api-key');
      
      // Important: Use the correct header name 'x-api-key' (not Authorization or Bearer)
      const response = await axios.post(photoRoomUrl, formData, {
        headers: {
          'x-api-key': PHOTOROOM_API_KEY,
          ...formData.getHeaders() // Get the headers from FormData including Content-Type
        },
        responseType: 'arraybuffer'
      });
      
      console.log('PhotoRoom API response status:', response.status);
      
      if (response.status !== 200) {
        console.error('PhotoRoom API error:', response.status, response.statusText);
        return res.status(500).json({
          error: 'Background removal failed',
          details: 'PhotoRoom API returned non-200 response'
        });
      }
      
      // Save the processed image to a temporary file
      // This is needed to get a public URL for the processed image
      // In production, you would upload this to S3 or similar cloud storage
      const tempFilePath = path.join(__dirname, '../../temp-photoroom-result.png');
      fs.writeFileSync(tempFilePath, Buffer.from(response.data));
      
      // For demonstration purposes, we'll return a URL to this temporary file
      // In a real production environment, you should upload to a proper storage service
      
      // Create a temporary URL (this is just for demonstration)
      // In production, this would be an S3 URL or other cloud storage URL
      const baseUrl = process.env.API_URL || 'http://localhost:3001';
      const outputUrl = `${baseUrl}/temp-photoroom-result.png`;
      
      // Return success response with the image URL
      return res.status(200).json({
        imageUrl: outputUrl,
        success: true
      });
    } catch (error) {
      console.error('Error in PhotoRoom background removal process:', error);
      console.error('Error details:', error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data 
      } : 'No response details');
      
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