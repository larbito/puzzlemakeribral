const fetch = require('node-fetch');
const FormData = require('form-data');
const { Buffer } = require('buffer');

// Get API key from environment variables - this should be the API ID
const VECTORIZER_API_ID = process.env.VECTORIZER_API_ID || 'vkwdt19mmgyspjb';
// This should be the API Secret
const VECTORIZER_API_SECRET = process.env.VECTORIZER_API_SECRET || 'bcdostpk73s4ec6lubl3hl7gshsg3a3r85ka5i3423va7hlkhqj4';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB max
const TIMEOUT_MS = 30000; // 30 second timeout

/**
 * Handles SVG vectorization using Vectorizer.AI
 */
exports.vectorizeImage = async (req, res) => {
  try {
    console.log('Backend vectorization endpoint called');
    
    // Ensure we have the required data
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    const imageBuffer = req.file.buffer;
    
    // Check file size
    if (imageBuffer.length > MAX_FILE_SIZE) {
      return res.status(413).json({
        error: 'File too large',
        details: `Maximum file size is ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`
      });
    }
    
    console.log(`Processing image: ${req.file.originalname}, Size: ${imageBuffer.length / 1024} KB`);
    
    try {
      // Prepare API request to Vectorizer.AI
      const formData = new FormData();
      formData.append('image', imageBuffer, {
        filename: req.file.originalname || 'image.png',
        contentType: req.file.mimetype || 'image/png'
      });
      
      // Set more aggressive simplification parameters to avoid crashing
      formData.append('simplify', '0.3'); // Higher value = more simplification
      
      console.log('Calling Vectorizer.AI API');
      console.log(`Using API ID: ${VECTORIZER_API_ID}`);
      
      // Setup a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), TIMEOUT_MS);
      });
      
      // Make request with timeout - Use proper auth: API ID as username, API Secret as password
      const fetchPromise = fetch('https://vectorizer.ai/api/v1/vectorize', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Basic ${Buffer.from(`${VECTORIZER_API_ID}:${VECTORIZER_API_SECRET}`).toString('base64')}`
        }
      });
      
      // Race between fetch and timeout
      const vectorizerResponse = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (!vectorizerResponse.ok) {
        const errorText = await vectorizerResponse.text();
        console.error(`Vectorizer.AI API error: ${vectorizerResponse.status}`, errorText);
        
        let errorMessage = 'Error from vectorization service';
        if (vectorizerResponse.status === 413) {
          errorMessage = 'Image is too large for vectorization';
        } else if (vectorizerResponse.status === 429) {
          errorMessage = 'Rate limit exceeded';
        } else if (vectorizerResponse.status === 401 || vectorizerResponse.status === 403) {
          errorMessage = 'API authentication failed';
        }
        
        return res.status(vectorizerResponse.status).json({
          error: errorMessage,
          details: errorText
        });
      }
      
      // Get SVG data
      const svgData = await vectorizerResponse.text();
      
      // Validate the SVG data
      if (!svgData.includes('<svg') || svgData.length < 100) {
        return res.status(500).json({
          error: 'Invalid SVG received',
          details: 'The vectorization service returned invalid data'
        });
      }
      
      // Create a base64 data URL for the SVG
      const svgBase64 = Buffer.from(svgData).toString('base64');
      const svgUrl = `data:image/svg+xml;base64,${svgBase64}`;
      
      console.log('Vectorization successful');
      
      // Return success response
      return res.status(200).json({ svgUrl });
    } catch (error) {
      console.error('Error in vectorization process:', error);
      
      // Check for timeout
      if (error.message === 'Request timed out') {
        return res.status(504).json({
          error: 'Vectorization timed out',
          details: 'The image may be too complex or the server is under heavy load'
        });
      }
      
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