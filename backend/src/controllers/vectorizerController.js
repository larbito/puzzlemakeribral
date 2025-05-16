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
const { checkInkscape, checkCommandFormat } = require('../utils/inkscapeCheck');

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

// Environment variables for API keys should be set in your Railway environment
const REPLICATE_API_KEY = process.env.REPLICATE_API_TOKEN || '';

// Max image dimensions for processing
const MAX_IMAGE_SIZE = 1500; // Max width or height in pixels
const INKSCAPE_TIMEOUT = 120000; // 120 second timeout for Inkscape

/**
 * Resize image if it exceeds maximum dimensions
 * @param {string} inputPath Path to input image file
 * @param {string} outputPath Path to save resized image
 * @returns {Promise<boolean>} True if image was resized
 */
async function resizeImageIfNeeded(inputPath, outputPath) {
  try {
    // Get image metadata
    const metadata = await sharp(inputPath).metadata();
    console.log(`Original image dimensions: ${metadata.width}x${metadata.height}`);

    // Check if resizing is needed
    if (metadata.width > MAX_IMAGE_SIZE || metadata.height > MAX_IMAGE_SIZE) {
      console.log(`Image exceeds maximum dimensions, resizing...`);
      
      // Calculate new dimensions (preserve aspect ratio)
      let newWidth, newHeight;
      if (metadata.width > metadata.height) {
        newWidth = MAX_IMAGE_SIZE;
        newHeight = Math.round((metadata.height / metadata.width) * MAX_IMAGE_SIZE);
      } else {
        newHeight = MAX_IMAGE_SIZE;
        newWidth = Math.round((metadata.width / metadata.height) * MAX_IMAGE_SIZE);
      }
      
      // Resize the image
      await sharp(inputPath)
        .resize(newWidth, newHeight)
        .toFile(outputPath);
      
      console.log(`Image resized to ${newWidth}x${newHeight}`);
      return true;
    } else {
      // No resizing needed, copy the file
      await fs.promises.copyFile(inputPath, outputPath);
      return false;
    }
  } catch (error) {
    console.error('Error resizing image:', error);
    // If resize fails, copy the original file
    await fs.promises.copyFile(inputPath, outputPath);
    return false;
  }
}

/**
 * Controller function for vectorizing images
 */
const vectorizeImage = async (req, res) => {
  try {
    console.log('Starting vectorization process');
    
    // req.file is available due to multer
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    const removeBackgroundOption = req.body.removeBackground === 'true';
    const enhanceImageOption = req.body.enhanceImage === 'true';
    
    // Create a unique working directory in the system temp folder
    const workDir = path.join(os.tmpdir(), `vectorize-${uuidv4()}`);
    await fs.promises.mkdir(workDir, { recursive: true });
    
    // Input and output file paths
    const originalPath = path.join(workDir, 'original.png');
    const inputPath = path.join(workDir, 'input.png');
    let processedPath = inputPath; // Track the current processed file path
    const outputPath = path.join(workDir, 'output.svg');
    
    console.log(`Working directory: ${workDir}`);
    console.log(`Original path: ${originalPath}`);
    console.log(`Input path: ${inputPath}`);
    console.log(`Output path: ${outputPath}`);
    
    // Copy the uploaded file to the working directory
    await fs.promises.copyFile(req.file.path, originalPath);
    
    // Resize image if needed
    console.log('Checking if image needs resizing...');
    await resizeImageIfNeeded(originalPath, inputPath);
    
    // Background removal if requested
    if (removeBackgroundOption) {
      try {
        console.log('Removing background with Replicate API...');
        const nobgPath = path.join(workDir, 'nobg.png');
        
        // Use Replicate API for background removal
        const success = await removeBackground(inputPath, nobgPath);
        
        if (success) {
          processedPath = nobgPath;
          console.log('Background removal completed successfully');
        } else {
          console.error('Background removal failed, using original image');
        }
      } catch (error) {
        console.error('Background removal failed:', error);
        // Continue with original image if background removal fails
      }
    }
    
    // Image enhancement if requested
    if (enhanceImageOption) {
      try {
        console.log('Enhancing image quality with Replicate API...');
        const enhancedPath = path.join(workDir, 'enhanced.png');
        
        // Use Replicate API for image enhancement
        const success = await enhanceImage(processedPath, enhancedPath);
        
        if (success) {
          processedPath = enhancedPath;
          console.log('Image enhancement completed successfully');
        } else {
          console.error('Image enhancement failed, using current processed image');
        }
      } catch (error) {
        console.error('Image enhancement failed:', error);
        // Continue with the current processed image if enhancement fails
      }
    }
    
    // Execute Inkscape CLI to convert the image to SVG
    try {
      console.log('Running Inkscape for vectorization...');
      
      // Verify Inkscape is installed and get version
      const inkscapeCheck = await checkInkscape();
      if (!inkscapeCheck.installed) {
        console.error('Inkscape is not installed:', inkscapeCheck.error);
        return res.status(500).json({ error: 'Inkscape is not installed or not in PATH' });
      }
      
      console.log(`Inkscape version detected: ${inkscapeCheck.version}`);
      
      // Check which command format is supported
      const formatCheck = await checkCommandFormat();
      console.log('Command format check:', formatCheck);
      
      let inkscapeCommand;
      
      // Use the appropriate command format based on the installed version
      if (formatCheck.modern) {
        // Modern Inkscape 1.0+ command format
        inkscapeCommand = `inkscape-headless --export-filename="${outputPath}" --export-type=svg --export-plain-svg "${processedPath}"`;
      } else if (formatCheck.legacy) {
        // Legacy Inkscape < 1.0 command format
        inkscapeCommand = `inkscape-headless -f "${processedPath}" -l "${outputPath}" --export-plain-svg`;
      } else {
        // If neither format is detected, try modern format as default
        inkscapeCommand = `inkscape-headless --export-filename="${outputPath}" --export-type=svg --export-plain-svg "${processedPath}"`;
      }
      
      console.log(`Executing command with ${INKSCAPE_TIMEOUT}ms timeout: ${inkscapeCommand}`);
      try {
        const { stdout, stderr } = await executeWithTimeout(inkscapeCommand, INKSCAPE_TIMEOUT);
        console.log('Inkscape stdout:', stdout);
        if (stderr) console.error('Inkscape stderr:', stderr);
      } catch (timeoutError) {
        console.error('Inkscape command timed out or failed:', timeoutError);
        throw new Error(`Inkscape command timed out after ${INKSCAPE_TIMEOUT/1000} seconds`);
      }
      
      // Check if the output file was created
      const fileExists = fs.existsSync(outputPath);
      console.log(`Output file exists: ${fileExists}`);
      
      if (!fileExists) {
        throw new Error('Inkscape did not generate an output file');
      }
      
      // Read the generated SVG
      const svgContent = await fs.promises.readFile(outputPath, 'utf8');
      
      // Return the SVG as base64
      return res.json({
        success: true,
        svgUrl: `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`
      });
    } catch (error) {
      console.error('Inkscape vectorization failed:', error);
      
      // Try legacy Inkscape command format if the modern format failed
      try {
        console.log('Trying legacy Inkscape command format...');
        const legacyCommand = `inkscape-headless -f "${processedPath}" -l "${outputPath}" --export-plain-svg`;
        
        console.log(`Executing legacy command with ${INKSCAPE_TIMEOUT}ms timeout: ${legacyCommand}`);
        try {
          const { stdout, stderr } = await executeWithTimeout(legacyCommand, INKSCAPE_TIMEOUT);
          console.log('Legacy Inkscape stdout:', stdout);
          if (stderr) console.error('Legacy Inkscape stderr:', stderr);
        } catch (timeoutError) {
          console.error('Legacy Inkscape command timed out or failed:', timeoutError);
          throw new Error(`Legacy Inkscape command timed out after ${INKSCAPE_TIMEOUT/1000} seconds`);
        }
        
        // Check if the output file was created
        const fileExists = fs.existsSync(outputPath);
        console.log(`Legacy output file exists: ${fileExists}`);
        
        if (!fileExists) {
          throw new Error('Legacy Inkscape command did not generate an output file');
        }
        
        // Read the generated SVG
        const svgContent = await fs.promises.readFile(outputPath, 'utf8');
        
        // Return the SVG as base64
        return res.json({
          success: true,
          svgUrl: `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`
        });
      } catch (legacyError) {
        console.error('Legacy Inkscape command also failed:', legacyError);
        return res.status(500).json({ 
          error: `Vectorization failed: ${error.message || 'Unknown error'}` 
        });
      }
    } finally {
      // Clean up the temporary directory and uploaded file
      try {
        console.log(`Cleaning up temporary files...`);
        await fs.promises.rm(workDir, { recursive: true, force: true });
        await fs.promises.unlink(req.file.path);
        console.log(`Cleaned up working directory and uploaded file`);
      } catch (cleanupError) {
        console.error('Error cleaning up:', cleanupError);
      }
    }
  } catch (error) {
    console.error('Error in vectorization process:', error);
    return res.status(500).json({ 
      error: `Vectorization process failed: ${error.message || 'Unknown error'}` 
    });
  }
};

/**
 * Process form data using multer middleware
 */
const processFormData = upload.single('image');

/**
 * Remove background from an image using Replicate API
 * @param {string} imagePath Path to the source image file
 * @param {string} outputPath Path where the background-removed image should be saved
 */
async function removeBackground(imagePath, outputPath) {
  try {
    console.log('Starting background removal with Replicate API');
    
    // Check if API key is configured
    if (!REPLICATE_API_KEY) {
      console.error('REPLICATE_API_KEY is not set in environment');
      return false;
    }
    
    // Read the image file
    const imageBuffer = await fs.promises.readFile(imagePath);
    
    // Convert the image to base64
    const base64Image = imageBuffer.toString('base64');
    
    // API call to Replicate for prediction
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: '3b2e70fc971228bf16f71c3d63c2f0a11766fe00d0a02bb4dde2aac3fbbbf04a',
        input: {
          image: `data:image/png;base64,${base64Image}`
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Replicate API error: ${response.status} - ${errorText}`);
    }
    
    // Get the prediction ID and poll for completion
    const prediction = await response.json();
    const predictionId = prediction.id;
    
    console.log(`Background removal prediction started with ID: ${predictionId}`);
    
    // Poll for completion
    let isComplete = false;
    let resultUrl = '';
    let attempts = 0;
    const maxAttempts = 30;
    
    while (!isComplete && attempts < maxAttempts) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between polls
      
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: {
          'Authorization': `Token ${REPLICATE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!statusResponse.ok) {
        throw new Error(`Failed to check prediction status: ${statusResponse.status}`);
      }
      
      const statusData = await statusResponse.json();
      
      if (statusData.status === 'succeeded') {
        isComplete = true;
        resultUrl = statusData.output;
        console.log('Background removal completed successfully');
        break;
      } else if (statusData.status === 'failed') {
        throw new Error(`Background removal failed: ${statusData.error || 'Unknown error'}`);
      }
      
      console.log(`Waiting for background removal to complete (attempt ${attempts}/${maxAttempts})...`);
    }
    
    if (!isComplete || !resultUrl) {
      throw new Error('Background removal timed out');
    }
    
    // Download the result
    const resultResponse = await fetch(resultUrl);
    
    if (!resultResponse.ok) {
      throw new Error(`Failed to download background removal result: ${resultResponse.status}`);
    }
    
    const resultBuffer = await resultResponse.arrayBuffer();
    
    // Save the result to the output path
    await fs.promises.writeFile(outputPath, Buffer.from(resultBuffer));
    
    return true;
  } catch (error) {
    console.error('Error in removeBackground:', error);
    return false;
  }
}

/**
 * Enhance image quality using Real-ESRGAN upscaler on Replicate
 * @param {string} imagePath Path to the source image file
 * @param {string} outputPath Path where the enhanced image should be saved
 */
async function enhanceImage(imagePath, outputPath) {
  try {
    console.log('Starting image enhancement with Replicate API');
    
    // Check if API key is configured
    if (!REPLICATE_API_KEY) {
      console.error('REPLICATE_API_KEY is not set in environment');
      return false;
    }
    
    // Read the image file
    const imageBuffer = await fs.promises.readFile(imagePath);
    
    // Convert the image to base64
    const base64Image = imageBuffer.toString('base64');
    
    // API call to Replicate for prediction
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: '42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b',
        input: {
          image: `data:image/png;base64,${base64Image}`,
          scale: 2, // Scale factor (2x, 3x, 4x)
          face_enhance: true // Enhanced face details
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Replicate API error: ${response.status} - ${errorText}`);
    }
    
    // Get the prediction ID and poll for completion
    const prediction = await response.json();
    const predictionId = prediction.id;
    
    console.log(`Image enhancement prediction started with ID: ${predictionId}`);
    
    // Poll for completion
    let isComplete = false;
    let resultUrl = '';
    let attempts = 0;
    const maxAttempts = 30;
    
    while (!isComplete && attempts < maxAttempts) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between polls
      
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: {
          'Authorization': `Token ${REPLICATE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!statusResponse.ok) {
        throw new Error(`Failed to check prediction status: ${statusResponse.status}`);
      }
      
      const statusData = await statusResponse.json();
      
      if (statusData.status === 'succeeded') {
        isComplete = true;
        resultUrl = statusData.output;
        console.log('Image enhancement completed successfully');
        break;
      } else if (statusData.status === 'failed') {
        throw new Error(`Image enhancement failed: ${statusData.error || 'Unknown error'}`);
      }
      
      console.log(`Waiting for image enhancement to complete (attempt ${attempts}/${maxAttempts})...`);
    }
    
    if (!isComplete || !resultUrl) {
      throw new Error('Image enhancement timed out');
    }
    
    // Download the result
    const resultResponse = await fetch(resultUrl);
    
    if (!resultResponse.ok) {
      throw new Error(`Failed to download enhanced image: ${resultResponse.status}`);
    }
    
    const resultBuffer = await resultResponse.arrayBuffer();
    
    // Save the result to the output path
    await fs.promises.writeFile(outputPath, Buffer.from(resultBuffer));
    
    return true;
  } catch (error) {
    console.error('Error in enhanceImage:', error);
    return false;
  }
}

// Execute Inkscape CLI with timeout
async function executeWithTimeout(command, timeout) {
  return new Promise((resolve, reject) => {
    const process = exec(command, { timeout }, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stdout, stderr });
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

module.exports = {
  vectorizeImage,
  processFormData
}; 