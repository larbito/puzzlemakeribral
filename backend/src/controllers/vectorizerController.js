// Importing required libraries
const potrace = require('potrace');
const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');

// Try to load vectorizer, but don't fail if it's not available
let vectorizer = null;
try {
  vectorizer = require('vectorizer');
  console.log('Vectorizer library loaded successfully');
} catch (err) {
  console.log('Vectorizer library not available, falling back to potrace only');
}

/**
 * Controller for handling image vectorization using the vectorizer library
 */
const vectorizerController = {
  /**
   * Simple test endpoint to verify file upload works
   * @param {Object} req - Express request object with image file in req.file
   * @param {Object} res - Express response object
   */
  testUpload: async (req, res) => {
    console.log('Test upload endpoint called');
    try {
      if (!req.file) {
        return res.status(400).json({
          status: 'error',
          message: 'No file received'
        });
      }
      
      return res.status(200).json({
        status: 'success',
        message: 'File received successfully',
        file: {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        }
      });
    } catch (error) {
      console.error('Error in test upload:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  },

  /**
   * Inspect image to get vectorization options
   * @param {Object} req - Express request object with image file in req.file
   * @param {Object} res - Express response object
   */
  inspectImage: async (req, res) => {
    try {
      // Check if file exists
      if (!req.file) {
        return res.status(400).json({
          status: 'error',
          message: 'No image file uploaded'
        });
      }

      console.log('Inspecting image for vectorization options');
      
      // Check if the image is valid first
      try {
        const image = await Jimp.read(req.file.buffer);
        console.log(`Image dimensions: ${image.getWidth()}x${image.getHeight()}`);
      } catch (jimpError) {
        console.error('Error reading image with Jimp:', jimpError);
        return res.status(400).json({
          status: 'error',
          message: 'Invalid image format or corrupted image file'
        });
      }
      
      // If vectorizer is available, try to use it
      if (vectorizer) {
        try {
          const options = await vectorizer.inspectImage(req.file.buffer);
          return res.status(200).json({
            status: 'success',
            message: 'Image inspection successful',
            options
          });
        } catch (error) {
          console.error('Vectorizer inspection error:', error);
        }
      }
      
      // Fallback to basic options if vectorizer fails or isn't available
      console.log('Using default vectorization options');
      return res.status(200).json({
        status: 'success',
        message: 'Using default options for vectorization',
        options: [{
          threshold: 128,
          steps: 1,
          background: '#ffffff',
          fillStrategy: 'dominant'
        }]
      });
    } catch (error) {
      console.error('Error in inspectImage:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to inspect image',
        error: error.message
      });
    }
  },

  /**
   * Convert an image to SVG vector
   * @param {Object} req - Express request object with image file in req.file and options in req.body
   * @param {Object} res - Express response object
   */
  vectorizeImage: async (req, res) => {
    try {
      console.log('vectorizeImage called with body:', Object.keys(req.body));
      console.log('Files received:', req.file ? 'Yes' : 'No');
      if (req.file) {
        console.log('File details:', req.file.originalname, req.file.mimetype, req.file.size);
      }
      
      // Check if file exists
      if (!req.file) {
        console.log('No file was received in the request');
        return res.status(400).json({
          status: 'error',
          message: 'No image file uploaded'
        });
      }

      const options = req.body.options || {
        threshold: 128,
        steps: 1,
        background: '#ffffff',
        fillStrategy: 'dominant'
      };

      // Parse options if they came as a string (from form data)
      if (typeof options === 'string') {
        try {
          options = JSON.parse(options);
        } catch (e) {
          console.log('Could not parse options string, using default options');
          options = {
            threshold: 128,
            steps: 1,
            background: '#ffffff',
            fillStrategy: 'dominant'
          };
        }
      }
      
      console.log('Vectorizing image with options:', options);
      
      // Check if the image is valid
      try {
        const image = await Jimp.read(req.file.buffer);
        console.log(`Processing image: ${image.getWidth()}x${image.getHeight()}`);
      } catch (jimpError) {
        console.error('Error reading image with Jimp:', jimpError);
        return res.status(400).json({
          status: 'error',
          message: 'Invalid image format or corrupted image file'
        });
      }

      // Try vectorizer if available
      if (vectorizer) {
        try {
          console.log('Attempting to vectorize with vectorizer library');
          const svgContent = await vectorizer.parseImage(req.file.buffer, options);
          return res.status(200).json({
            status: 'success',
            message: 'Image vectorized successfully with vectorizer',
            svg: svgContent
          });
        } catch (vectorizerError) {
          console.error('Vectorizer error:', vectorizerError);
        }
      }
      
      // Fallback to potrace
      try {
        console.log('Vectorizing with potrace');
        const svgData = await new Promise((resolve, reject) => {
          potrace.trace(req.file.buffer, {
            threshold: options.threshold || 128,
            turdSize: 5,
            optTolerance: 0.2,
            optCurve: true,
            color: options.background || '#ffffff'
          }, (err, svg) => {
            if (err) reject(err);
            else resolve(svg);
          });
        });

        return res.status(200).json({
          status: 'success',
          message: 'Image vectorized with potrace',
          svg: svgData
        });
      } catch (potraceError) {
        console.error('Potrace vectorization failed:', potraceError);
        return res.status(500).json({
          status: 'error',
          message: 'Vectorization failed with all available methods',
          error: potraceError.message
        });
      }
    } catch (error) {
      console.error('Error in vectorizeImage:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to vectorize image',
        error: error.message
      });
    }
  }
};

module.exports = vectorizerController; 