const fetch = require('node-fetch');
const FormData = require('form-data');
const { Buffer } = require('buffer');

// Get API key from environment variables - this should be the API ID
const VECTORIZER_API_ID = process.env.VECTORIZER_API_ID || 'vkwdt19mmgyspjb';
// This should be the API Secret
const VECTORIZER_API_SECRET = process.env.VECTORIZER_API_SECRET || 'bcdostpk73s4ec6lubl3hl7gshsg3a3r85ka5i3423va7hlkhqj4';

// Log what we're using for debugging
console.log('=== VECTORIZER API CONFIGURATION ===');
console.log(`API ID: ${VECTORIZER_API_ID.substring(0, 5)}...`);
console.log(`API Secret configured: ${!!VECTORIZER_API_SECRET}`);
console.log('====================================');

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB max
const TIMEOUT_MS = 30000; // 30 second timeout

/**
 * Handles SVG vectorization using Vectorizer.AI
 */
exports.vectorizeImage = async (req, res) => {
  try {
    console.log('Backend vectorization endpoint called');
    
    // Log request information
    console.log(`Request headers: ${JSON.stringify(req.headers)}`);
    console.log(`Request content type: ${req.headers['content-type']}`);
    
    // Ensure we have the required data
    if (!req.file) {
      console.error('No image file was provided in the request');
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    const imageBuffer = req.file.buffer;
    
    // Check file size
    if (imageBuffer.length > MAX_FILE_SIZE) {
      console.error(`File too large: ${Math.round(imageBuffer.length / 1024 / 1024)}MB, max allowed: ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`);
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
      
      // Set vectorization parameters to optimize for transparent background
      formData.append('simplify', '0.3'); // Higher value = more simplification
      formData.append('colored', 'true'); // Ensure colored output
      formData.append('contour_dim_check', 'true'); // Helps with complex designs
      formData.append('precision_mode', 'true'); // Better quality for important details
      
      // These parameters help ensure the background is transparent
      formData.append('transparent', 'true'); // Request transparent output
      
      console.log('Calling Vectorizer.AI API with transparency parameters');
      console.log(`Using API ID: ${VECTORIZER_API_ID}`);
      
      // Setup a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), TIMEOUT_MS);
      });
      
      // Create auth header
      const authHeader = `Basic ${Buffer.from(`${VECTORIZER_API_ID}:${VECTORIZER_API_SECRET}`).toString('base64')}`;
      console.log(`Auth header created (first 20 chars): ${authHeader.substring(0, 20)}...`);
      
      // Make request with timeout - Use proper auth: API ID as username, API Secret as password
      console.log('Sending request to Vectorizer.AI API');
      const fetchPromise = fetch('https://vectorizer.ai/api/v1/vectorize', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': authHeader
        }
      });
      
      // Race between fetch and timeout
      console.log('Awaiting response...');
      const vectorizerResponse = await Promise.race([fetchPromise, timeoutPromise]);
      
      console.log(`Response received with status code: ${vectorizerResponse.status}`);
      console.log(`Response headers: ${JSON.stringify(Object.fromEntries(vectorizerResponse.headers.entries()))}`);
      
      if (!vectorizerResponse.ok) {
        const errorText = await vectorizerResponse.text();
        console.error(`Vectorizer.AI API error: ${vectorizerResponse.status}`, errorText);
        
        let errorMessage = 'Error from vectorization service';
        let errorDetail = errorText;
        
        try {
          // Try to parse the error as JSON for better details
          const errorData = JSON.parse(errorText);
          console.error('Parsed error:', errorData);
          
          if (errorData.error) {
            if (typeof errorData.error === 'string') {
              errorMessage = errorData.error;
            } else if (errorData.error.message) {
              errorMessage = errorData.error.message;
              errorDetail = `Error ${errorData.error.code || 'unknown'}: ${errorData.error.message}`;
            }
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          // Use the raw error text if parsing fails
        }
        
        if (vectorizerResponse.status === 413) {
          errorMessage = 'Image is too large for vectorization';
        } else if (vectorizerResponse.status === 429) {
          errorMessage = 'Rate limit exceeded';
        } else if (vectorizerResponse.status === 401 || vectorizerResponse.status === 403) {
          errorMessage = 'API authentication failed';
          console.error('Authentication failed! Check your API ID and Secret.');
        }
        
        return res.status(vectorizerResponse.status).json({
          error: errorMessage,
          details: errorDetail
        });
      }
      
      // Get SVG data
      console.log('Reading SVG data from response...');
      const svgData = await vectorizerResponse.text();
      
      // Log a preview of the SVG data
      console.log(`SVG data preview (first 100 chars): ${svgData.substring(0, 100)}...`);
      console.log(`SVG data length: ${svgData.length} bytes`);
      
      // Validate the SVG data
      if (!svgData.includes('<svg') || svgData.length < 100) {
        console.error('Invalid SVG data received');
        return res.status(500).json({
          error: 'Invalid SVG received',
          details: 'The vectorization service returned invalid data'
        });
      }
      
      // Enhance the SVG to ensure transparency is properly preserved
      console.log('Enhancing SVG for transparency...');
      let enhancedSvgData = svgData;
      
      // Add transparent background by modifying the SVG
      if (!enhancedSvgData.includes('fill="none"')) {
        enhancedSvgData = enhancedSvgData.replace(/<svg/, '<svg fill="none"');
        console.log('Added fill="none" attribute to SVG');
      }
      
      // Remove background by adding style to ensure transparency
      if (!enhancedSvgData.includes('style="background')) {
        enhancedSvgData = enhancedSvgData.replace(/<svg/, '<svg style="background-color: transparent;"');
        console.log('Added transparent background style to SVG');
      }
      
      // Also add proper viewBox if missing
      if (!enhancedSvgData.includes('viewBox') && enhancedSvgData.includes('width=') && enhancedSvgData.includes('height=')) {
        // Extract width and height
        const widthMatch = enhancedSvgData.match(/width="([^"]+)"/);
        const heightMatch = enhancedSvgData.match(/height="([^"]+)"/);
        
        if (widthMatch && heightMatch) {
          const width = widthMatch[1];
          const height = heightMatch[1];
          enhancedSvgData = enhancedSvgData.replace(/<svg/, `<svg viewBox="0 0 ${width} ${height}"`);
          console.log(`Added viewBox attribute to SVG: "0 0 ${width} ${height}"`);
        }
      }
      
      // Create a base64 data URL for the SVG
      const svgBase64 = Buffer.from(enhancedSvgData).toString('base64');
      const svgUrl = `data:image/svg+xml;base64,${svgBase64}`;
      
      console.log('Vectorization successful with transparent background');
      
      // Return success response with the SVG data for preview
      return res.status(200).json({
        svgUrl,
        // Also include raw SVG for download
        svgData: enhancedSvgData
      });
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