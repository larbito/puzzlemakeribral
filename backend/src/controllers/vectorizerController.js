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
   * Direct HTML response for file uploads
   * @param {Object} req - Express request object with image file in req.file
   * @param {Object} res - Express response object
   */
  vectorizeDirectHTML: async (req, res) => {
    try {
      console.log('vectorizeDirectHTML called with body:', Object.keys(req.body));
      console.log('Files received:', req.file ? 'Yes' : 'No');
      if (req.file) {
        console.log('File details:', req.file.originalname, req.file.mimetype, req.file.size);
      }
      
      // Check if file exists
      if (!req.file) {
        return res.status(400).send(`
          <html>
            <head><title>Error</title></head>
            <body>
              <h1>Error: No image file uploaded</h1>
              <p>Please go back and select an image file.</p>
            </body>
          </html>
        `);
      }

      let options = req.body.options || {
        threshold: 128,
        steps: 1,
        background: '#ffffff',
        fillStrategy: 'dominant'
      };

      // Parse options if they came as a string
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
      
      // Check if the image is valid
      try {
        const image = await Jimp.read(req.file.buffer);
        console.log(`Processing image: ${image.getWidth()}x${image.getHeight()}`);
      } catch (jimpError) {
        console.error('Error reading image with Jimp:', jimpError);
        return res.status(400).send(`
          <html>
            <head><title>Error</title></head>
            <body>
              <h1>Error: Invalid image format</h1>
              <p>The uploaded file could not be processed as an image.</p>
            </body>
          </html>
        `);
      }

      // Process with potrace
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

        // Send HTML response with the SVG embedded
        return res.status(200).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Vectorized Image</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; text-align: center; }
                .container { max-width: 800px; margin: 0 auto; }
                .svg-container { border: 1px solid #ccc; padding: 20px; margin: 20px 0; }
                .buttons { margin: 20px 0; }
                button { padding: 10px 15px; margin: 0 5px; cursor: pointer; }
                #svgCode { margin-top: 20px; text-align: left; padding: 10px; background: #f5f5f5; overflow: auto; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Vectorized Image</h1>
                <div class="svg-container">${svgData}</div>
                <div class="buttons">
                  <button onclick="downloadSVG()">Download SVG</button>
                  <button onclick="showCode()">Show SVG Code</button>
                </div>
                <pre id="svgCode" style="display: none;">${svgData.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
              </div>
              
              <script>
                function downloadSVG() {
                  const svg = document.querySelector('svg').outerHTML;
                  const blob = new Blob([svg], { type: 'image/svg+xml' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'vectorized-image-${Date.now()}.svg';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }
                
                function showCode() {
                  const codeBlock = document.getElementById('svgCode');
                  if (codeBlock.style.display === 'none') {
                    codeBlock.style.display = 'block';
                  } else {
                    codeBlock.style.display = 'none';
                  }
                }
              </script>
            </body>
          </html>
        `);
      } catch (potraceError) {
        console.error('Potrace vectorization failed:', potraceError);
        return res.status(500).send(`
          <html>
            <head><title>Error</title></head>
            <body>
              <h1>Error: Vectorization failed</h1>
              <p>${potraceError.message}</p>
            </body>
          </html>
        `);
      }
    } catch (error) {
      console.error('Error in vectorizeDirectHTML:', error);
      return res.status(500).send(`
        <html>
          <head><title>Error</title></head>
          <body>
            <h1>Unexpected Error</h1>
            <p>${error.message}</p>
          </body>
        </html>
      `);
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