const Jimp = require('jimp');
const potrace = require('potrace');
const { Buffer } = require('buffer');
const fs = require('fs');
const path = require('path');

/**
 * Vectorize an image using local processing with Potrace
 * This avoids the need for external APIs and their associated costs
 */
exports.vectorizeImage = async (req, res) => {
  try {
    console.log('Local vectorization endpoint called');
    
    // Log request information 
    console.log(`Request content type: ${req.headers['content-type']}`);
    
    // Ensure we have the required data
    if (!req.file) {
      console.error('No image file was provided in the request');
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    const imageBuffer = req.file.buffer;
    console.log(`Processing image: ${req.file.originalname}, Size: ${imageBuffer.length / 1024} KB`);
    
    try {
      // Handle image with multiple Jimp versions (more compatible)
      console.log('Processing image with Jimp...');
      
      // Save buffer to temp file as a workaround for Jimp compatibility issues
      const tempImagePath = path.join(__dirname, '../../temp-image.png');
      fs.writeFileSync(tempImagePath, imageBuffer);
      console.log('Saved temp image file');
      
      // Load the image using different methods to support different Jimp versions
      let image;
      try {
        // Try modern version
        console.log('Trying Jimp.read() method...');
        image = await Jimp.read(tempImagePath);
        console.log('Image loaded with Jimp.read()');
      } catch (err) {
        console.error('Error with Jimp.read():', err.message);
        // Try constructor
        try {
          console.log('Trying new Jimp() constructor...');
          image = new Jimp(tempImagePath);
          console.log('Image loaded with new Jimp()');
        } catch (err2) {
          console.error('Error with new Jimp():', err2.message);
          throw new Error('Failed to load image with Jimp - all methods failed');
        }
      }
      
      // Get image dimensions
      const width = image.bitmap.width;
      const height = image.bitmap.height;
      console.log(`Image dimensions: ${width}x${height}`);
      
      // Image preprocessing to improve vectorization
      console.log('Preprocessing image...');
      
      // For t-shirt design, we may want to ensure the background is transparent
      // Scan for black background and make it transparent
      console.log('Scanning for black background pixels...');
      image.scan(0, 0, width, height, (x, y, idx) => {
        // Check if pixel is black or very dark
        const r = image.bitmap.data[idx];
        const g = image.bitmap.data[idx + 1];
        const b = image.bitmap.data[idx + 2];
        
        // If the pixel is very dark (close to black), make it transparent
        if (r < 30 && g < 30 && b < 30) {
          image.bitmap.data[idx + 3] = 0; // Set alpha to 0 (transparent)
        }
      });
      
      // Write the processed image to temp file for Potrace
      console.log('Saving preprocessed image...');
      const processedImagePath = path.join(__dirname, '../../temp-processed.png');
      await image.writeAsync(processedImagePath);
      
      // Use the file directly with Potrace
      console.log('Tracing image with Potrace...');
      
      // Options for Potrace vectorization
      const potraceOptions = {
        threshold: 180, // Threshold for black and white conversion (higher = more details)
        turdSize: 5,    // Suppress speckles of this size
        optTolerance: 0.2, // Optimization tolerance
        optCurve: true,  // Use curves
        fillColor: null, // For transparent SVG background
        background: null // For transparent SVG background
      };
      
      // Use Potrace to convert to SVG
      const svgData = await new Promise((resolve, reject) => {
        potrace.trace(processedImagePath, potraceOptions, (err, svg) => {
          // Clean up temp files
          try {
            if (fs.existsSync(tempImagePath)) fs.unlinkSync(tempImagePath);
            if (fs.existsSync(processedImagePath)) fs.unlinkSync(processedImagePath);
          } catch (cleanupErr) {
            console.warn('Error cleaning up temp files:', cleanupErr.message);
          }
          
          if (err) {
            console.error('Potrace error:', err);
            reject(err);
          } else {
            resolve(svg);
          }
        });
      });
      
      console.log('Raw SVG generated, enhancing for transparency...');
      
      // Enhance the SVG to ensure transparency
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
      
      // Create a base64 data URL for the SVG
      const svgBase64 = Buffer.from(enhancedSvgData).toString('base64');
      const svgUrl = `data:image/svg+xml;base64,${svgBase64}`;
      
      console.log('Local vectorization successful with transparent background');
      
      // Return success response with the SVG data
      return res.status(200).json({
        svgUrl,
        svgData: enhancedSvgData
      });
    } catch (error) {
      console.error('Error in local vectorization process:', error);
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