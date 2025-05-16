const fs = require('fs');
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');
const util = require('util');
const fetch = require('node-fetch');
const FormData = require('form-data');
const multer = require('multer');
const sharp = require('sharp');

// Promisify exec for cleaner async/await syntax
const execPromise = util.promisify(exec);

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create temp directory if it doesn't exist
    const tempDir = path.join(os.tmpdir(), 'vectorizer-uploads');
    fs.mkdirSync(tempDir, { recursive: true });
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${uuidv4()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Environment variables for API keys
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
const RAPIDAPI_HOST = 'raster-to-svg-vector-conversion-api-jpg-png-to-svg.p.rapidapi.com';

/**
 * Controller function for vectorizing images using external API
 */
const vectorizeImage = async (req, res) => {
  let workDir; // Define workDir at the function level so it's available in the finally block
  
  try {
    console.log('Starting vectorization process with external API');
    
    // req.file is available due to multer
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    // Create a unique working directory in the system temp folder
    workDir = path.join(os.tmpdir(), `vectorize-${uuidv4()}`);
    await fs.promises.mkdir(workDir, { recursive: true });
    
    // Input and output file paths
    const inputPath = path.join(workDir, 'input.png');
    const outputPath = path.join(workDir, 'output.svg');
    
    console.log(`Working directory: ${workDir}`);
    console.log(`Input path: ${inputPath}`);
    console.log(`Output path: ${outputPath}`);
    
    // Copy the uploaded file to the working directory
    await fs.promises.copyFile(req.file.path, inputPath);
    
    // Resize the image to a reasonable size for API processing
    const processedPath = path.join(workDir, 'processed.png');
    await sharp(inputPath)
      .resize(800, 800, { fit: 'inside' })
      .toFile(processedPath);
    
    // Check if RapidAPI key is available
    if (!RAPIDAPI_KEY) {
      console.error('RAPIDAPI_KEY is not set in environment');
      return res.status(500).json({ error: 'API key not configured' });
    }
    
    // Convert image to SVG using external API
    try {
      console.log('Calling RapidAPI vectorization service...');
      
      // Read the image as a buffer
      const imageBuffer = await fs.promises.readFile(processedPath);
      
      // Create form data - Node.js compatible way
      const formData = new FormData();
      formData.append('file', imageBuffer, {
        filename: 'image.png',
        contentType: 'image/png'
      });
      
      console.log('Sending request to RapidAPI with form data');
      
      // Make API request to RapidAPI
      const response = await fetch('https://raster-to-svg-vector-conversion-api-jpg-png-to-svg.p.rapidapi.com/', {
        method: 'POST',
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': RAPIDAPI_HOST,
          // Content-Type header is set automatically by FormData
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      
      // Get the SVG from the response
      const responseData = await response.json();
      
      if (!responseData.svg_base64) {
        throw new Error('API did not return SVG data');
      }
      
      // Decode the base64 SVG
      const svgContent = Buffer.from(responseData.svg_base64, 'base64').toString('utf-8');
      
      // Save the SVG to a file
      await fs.promises.writeFile(outputPath, svgContent);
      
      // Return the SVG as base64 for display
      return res.json({
        success: true,
        svgUrl: `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`
      });
    } catch (apiError) {
      console.error('API vectorization failed:', apiError);
      return res.status(500).json({ 
        error: `Vectorization failed: ${apiError.message || 'Unknown API error'}` 
      });
    }
  } catch (error) {
    console.error('Error in vectorization process:', error);
    return res.status(500).json({ 
      error: `Vectorization process failed: ${error.message || 'Unknown error'}` 
    });
  } finally {
    // Clean up the temporary directory and uploaded file
    try {
      if (workDir) {
        console.log(`Cleaning up temporary files...`);
        await fs.promises.rm(workDir, { recursive: true, force: true });
      }
      if (req.file && req.file.path) {
        await fs.promises.unlink(req.file.path);
      }
      console.log(`Cleaned up working directory and uploaded file`);
    } catch (cleanupError) {
      console.error('Error cleaning up:', cleanupError);
    }
  }
};

/**
 * Process form data using multer middleware
 */
const processFormData = upload.single('image');

module.exports = {
  vectorizeImage,
  processFormData
}; 