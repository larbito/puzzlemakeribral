const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const crypto = require('crypto');

// Check for PhotoRoom API key in environment variables
const PHOTOROOM_API_KEY = process.env.PHOTOROOM_API_KEY || '';

// Debug log for API token presence (don't log the actual token)
console.log('PhotoRoom Background Removal Controller initialized');
console.log('PhotoRoom API key configured:', PHOTOROOM_API_KEY ? 'Yes' : 'No');
// Log just to verify what key is being used (first few characters only for security)
if (PHOTOROOM_API_KEY) {
  console.log('PhotoRoom API key starts with:', PHOTOROOM_API_KEY.substring(0, 8) + '...');
}

// Create images directory if it doesn't exist
const imagesDir = path.join(__dirname, '../../images');
if (!fs.existsSync(imagesDir)) {
  try {
    fs.mkdirSync(imagesDir, { recursive: true });
    console.log('Created images directory at:', imagesDir);
  } catch (error) {
    console.error('Failed to create images directory:', error.message);
  }
}

/**
 * Remove background from image using PhotoRoom API
 */
exports.removeBackground = async (req, res) => {
  try {
    console.log('PhotoRoom background removal endpoint called');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file ? `File received: ${req.file.originalname}` : 'No file received');
    
    // Add CORS headers to all responses
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Cache-Control, Pragma, Expires, Origin, X-Enhanced-Image, x-enhanced');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
      return res.status(200).send();
    }
    
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

    // Check if this is an enhanced image 
    const isEnhanced = req.body.isEnhanced === 'true';
    console.log('Processing enhanced image:', isEnhanced);

    // Get preserve quality flag
    const preserveQuality = req.body.preserveQuality === 'true';
    console.log('Preserve quality:', preserveQuality);
    
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

      // If this is an enhanced image, we'll add special parameters to help with black backgrounds
      if (isEnhanced) {
        console.log('Adding special parameters for enhanced image with possible black background');
        // PhotoRoom doesn't have official parameters for this, but we can try to optimize
        // the request based on what we know about the image
        
        // For future API enhancements, this is where you'd add special handling parameters
        // formData.append('bg_color', 'black'); // Example of a future parameter
      }
      
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
      
      // Generate a unique filename
      const uniqueId = crypto.randomBytes(8).toString('hex');
      const fileName = `photoroom-result-${uniqueId}.png`;
      const filePath = path.join(imagesDir, fileName);
      
      // Save the processed image to a file with unique name
      console.log('Saving processed image to:', filePath);
      try {
        // Use writeFile with promises for better error handling
        await fs.promises.writeFile(filePath, Buffer.from(response.data));
        
        // Double-check that the file was saved successfully
        const fileStats = await fs.promises.stat(filePath);
        console.log(`File saved successfully. Size: ${fileStats.size} bytes`);
        
        if (fileStats.size === 0) {
          console.error('File was saved but is empty');
          throw new Error('File was saved but is empty');
        }
      } catch (fileError) {
        console.error('Error saving file:', fileError);
        
        // Try an alternative approach if the first method fails
        try {
          console.log('Trying alternative file saving method...');
          fs.writeFileSync(filePath, Buffer.from(response.data));
          console.log('File saved using synchronous method');
        } catch (fallbackError) {
          console.error('Both file saving methods failed:', fallbackError);
          return res.status(500).json({
            error: 'Failed to save processed image',
            details: fallbackError.message
          });
        }
      }
      
      // Create a proper URL based on the environment
      // Get the Railway public URL in production, or use localhost for development
      const baseUrl = process.env.API_URL || 
        (process.env.RAILWAY_PUBLIC_DOMAIN 
          ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` 
          : 'http://localhost:3001');
      console.log('Using base URL for image:', baseUrl);
      
      // Ensure URL doesn't have double slashes
      const outputUrl = `${baseUrl}/images/${fileName}`.replace(/([^:]\/)\/+/g, "$1");
      console.log('Generated image URL:', outputUrl);
      
      // Return additional debug info in development
      const responseData = {
        imageUrl: outputUrl,
        success: true,
        isEnhanced: isEnhanced
      };
      
      if (process.env.NODE_ENV !== 'production') {
        responseData.debug = {
          filePath,
          fileExists: fs.existsSync(filePath),
          baseUrl,
          timestamp: Date.now()
        };
      }
      
      // Return success response with the image URL
      return res.status(200).json(responseData);
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