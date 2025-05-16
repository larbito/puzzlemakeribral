const vectorizer = require('vectorizer');
const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');

/**
 * Controller for handling image vectorization using the vectorizer library
 */
const vectorizerController = {
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
      
      // Get options from vectorizer
      try {
        const options = await vectorizer.inspectImage(req.file.buffer);

        return res.status(200).json({
          status: 'success',
          message: 'Image inspection successful',
          options
        });
      } catch (error) {
        console.error('Vectorizer inspection error:', error);

        // Fallback to potrace if vectorizer fails
        return res.status(200).json({
          status: 'success',
          message: 'Using default options (vectorizer inspection failed)',
          options: [{
            threshold: 128,
            steps: 1,
            background: '#ffffff',
            fillStrategy: 'dominant'
          }]
        });
      }
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
      // Check if file exists
      if (!req.file) {
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

      console.log('Vectorizing image with options:', options);

      try {
        // Parse the image using vectorizer
        const svgContent = await vectorizer.parseImage(req.file.buffer, options);

        return res.status(200).json({
          status: 'success',
          message: 'Image vectorized successfully',
          svg: svgContent
        });
      } catch (vectorizerError) {
        console.error('Vectorizer error:', vectorizerError);
        
        // If vectorizer fails, use potrace as fallback
        try {
          console.log('Falling back to potrace for basic vectorization');
          const potrace = require('potrace');
          const svgData = await new Promise((resolve, reject) => {
            potrace.trace(req.file.buffer, {
              threshold: options.threshold || 128,
              turdSize: 5,
              optTolerance: 0.2,
              optCurve: true
            }, (err, svg) => {
              if (err) reject(err);
              else resolve(svg);
            });
          });

          return res.status(200).json({
            status: 'success',
            message: 'Image vectorized with potrace (fallback)',
            svg: svgData
          });
        } catch (potraceError) {
          console.error('Potrace fallback failed:', potraceError);
          throw potraceError;
        }
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