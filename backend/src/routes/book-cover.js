const express = require('express');
const router = express.Router();
const multer = require('multer');
const fetch = require('node-fetch');
const FormData = require('form-data');
const sharp = require('sharp');
const { Readable } = require('stream');
const archiver = require('archiver');

// Configure multer for handling form data
const upload = multer({
  limits: {
    fieldSize: 10 * 1024 * 1024 // 10MB limit
  }
});

console.log('Setting up book cover generator routes');

// Debug middleware to log request details
router.use((req, res, next) => {
  console.log('Book cover route request:', {
    method: req.method,
    path: req.path,
    headers: req.headers,
    contentType: req.get('content-type')
  });
  next();
});

/**
 * Test endpoint to verify functionality
 * GET /api/book-cover/test
 */
router.get('/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'Book cover generator API is working!',
    features: [
      'Calculate cover dimensions',
      'Generate front cover using Ideogram API',
      'Assemble full cover (front, spine, back)',
      'Download covers in various formats'
    ]
  });
});

/**
 * Calculate cover dimensions based on KDP specs
 * POST /api/book-cover/calculate-dimensions
 */
router.post('/calculate-dimensions', express.json(), async (req, res) => {
  try {
    const { 
      trimSize, 
      pageCount, 
      paperColor, 
      bookType = 'paperback',
      includeBleed = true 
    } = req.body;

    if (!trimSize || !pageCount) {
      return res.status(400).json({ error: 'Trim size and page count are required' });
    }

    // Parse the trim size (format: "5x8", "6x9", etc.)
    const [widthStr, heightStr] = trimSize.split('x');
    const trimWidth = parseFloat(widthStr);
    const trimHeight = parseFloat(heightStr);

    if (isNaN(trimWidth) || isNaN(trimHeight)) {
      return res.status(400).json({ error: 'Invalid trim size format' });
    }

    // Calculate spine width based on page count
    const pagesPerInch = paperColor === 'white' ? 434 : 370;
    const spineWidth = pageCount / pagesPerInch;

    // Add bleed (0.125" on each side)
    const bleed = includeBleed ? 0.125 : 0;
    
    // Calculate final dimensions
    const coverWidth = trimWidth + (bleed * 2);
    const coverHeight = trimHeight + (bleed * 2);
    const fullCoverWidth = (trimWidth * 2) + spineWidth + (bleed * 2);

    // Calculate pixel dimensions at 300 DPI
    const dpi = 300;
    const frontCoverPixelWidth = Math.round(coverWidth * dpi);
    const frontCoverPixelHeight = Math.round(coverHeight * dpi);
    const spinePixelWidth = Math.round(spineWidth * dpi);
    const fullCoverPixelWidth = Math.round(fullCoverWidth * dpi);
    const fullCoverPixelHeight = Math.round(coverHeight * dpi);

    res.json({
      dimensions: {
        frontCover: {
          width: coverWidth,
          height: coverHeight,
          widthPx: frontCoverPixelWidth,
          heightPx: frontCoverPixelHeight,
        },
        spine: {
          width: spineWidth,
          widthPx: spinePixelWidth,
        },
        fullCover: {
          width: fullCoverWidth,
          height: coverHeight,
          widthPx: fullCoverPixelWidth,
          heightPx: fullCoverPixelHeight,
        },
        bleed,
        dpi
      }
    });
  } catch (error) {
    console.error('Error calculating dimensions:', error);
    res.status(500).json({ error: 'Failed to calculate cover dimensions' });
  }
});

/**
 * Generate front cover using Ideogram API
 * POST /api/book-cover/generate-front
 */
router.post('/generate-front', upload.none(), async (req, res) => {
  try {
    // Check if API key is configured
    if (!process.env.IDEOGRAM_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const { 
      prompt, 
      width, 
      height, 
      negative_prompt 
    } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!width || !height) {
      return res.status(400).json({ error: 'Width and height are required' });
    }

    console.log('Generating front cover with params:', { prompt, width, height, negative_prompt });
    
    // Calculate aspect ratio
    const pixelWidth = parseInt(width);
    const pixelHeight = parseInt(height);
    
    // Ideogram API has resolution limits, so we might need to scale down and later scale up
    const maxDimension = 1024;
    let targetWidth = pixelWidth;
    let targetHeight = pixelHeight;
    
    // Scale down if needed while maintaining aspect ratio
    if (pixelWidth > maxDimension || pixelHeight > maxDimension) {
      if (pixelWidth >= pixelHeight) {
        targetWidth = maxDimension;
        targetHeight = Math.round((pixelHeight / pixelWidth) * maxDimension);
      } else {
        targetHeight = maxDimension;
        targetWidth = Math.round((pixelWidth / pixelHeight) * maxDimension);
      }
    }
    
    // Format as "WxH"
    const aspectRatio = `${targetWidth}x${targetHeight}`;
    
    // Create form data for the Ideogram API
    const form = new FormData();
    form.append('prompt', prompt);
    form.append('aspect_ratio', aspectRatio);
    form.append('rendering_speed', 'TURBO');

    if (negative_prompt) {
      form.append('negative_prompt', negative_prompt);
    }

    // Add some default parameters
    form.append('num_images', '1');
    form.append('seed', Math.floor(Math.random() * 1000000));

    console.log('Making request to Ideogram API with form data');
    
    const response = await fetch('https://api.ideogram.ai/v1/ideogram-v3/generate', {
      method: 'POST',
      headers: {
        'Api-Key': process.env.IDEOGRAM_API_KEY,
        ...form.getHeaders()
      },
      body: form
    });

    console.log('Ideogram API response status:', response.status);

    const responseText = await response.text();
    console.log('Raw response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error('Failed to parse Ideogram API response:', error);
      return res.status(500).json({ error: 'Invalid response from image generation service' });
    }

    if (!response.ok) {
      console.error('Ideogram API error:', data);
      return res.status(response.status).json({ 
        error: data.message || 'Failed to generate image',
        details: data
      });
    }

    console.log('Ideogram API response data:', data);
    
    // Extract the image URL from the response
    let imageUrl = null;
    if (data?.data?.[0]?.url) {
      imageUrl = data.data[0].url;
    }

    if (!imageUrl) {
      console.error('No image URL in response:', data);
      throw new Error('No image URL in API response');
    }

    // Return the image URL to the client
    res.json({ 
      url: imageUrl,
      width: pixelWidth,
      height: pixelHeight,
      aspectRatio,
      originalDimensions: {
        width: pixelWidth,
        height: pixelHeight
      }
    });
  } catch (error) {
    console.error('Error generating front cover:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate front cover',
      type: error.name
    });
  }
});

/**
 * Assemble full cover (front, spine, back)
 * POST /api/book-cover/assemble-full
 */
router.post('/assemble-full', upload.none(), async (req, res) => {
  try {
    const {
      frontCoverUrl,
      dimensions,
      spineText,
      spineColor,
      interiorImagesUrls = [],
      bookTitle,
      authorName
    } = req.body;

    if (!frontCoverUrl || !dimensions) {
      return res.status(400).json({ error: 'Front cover URL and dimensions are required' });
    }

    // Parse dimensions if they're passed as a string
    const dims = typeof dimensions === 'string' ? JSON.parse(dimensions) : dimensions;
    
    // Download the front cover image
    const frontCoverResponse = await fetch(frontCoverUrl);
    if (!frontCoverResponse.ok) {
      throw new Error(`Failed to download front cover image: ${frontCoverResponse.statusText}`);
    }
    const frontCoverBuffer = await frontCoverResponse.buffer();
    
    // Resize the front cover if needed to match the target dimensions
    const resizedFrontCover = await sharp(frontCoverBuffer)
      .resize({
        width: dims.frontCover.widthPx,
        height: dims.frontCover.heightPx,
        fit: 'fill'
      })
      .toBuffer();
    
    // Create a blank canvas for the full cover
    const fullCover = sharp({
      create: {
        width: dims.fullCover.widthPx,
        height: dims.fullCover.heightPx,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    });
    
    // Create the spine
    const spineBuffer = await createSpine(
      dims.spine.widthPx, 
      dims.fullCover.heightPx, 
      spineText, 
      spineColor || '#000000',
      bookTitle,
      authorName
    );
    
    // Create the back cover (either a mirrored front cover or with interior images)
    const backCoverBuffer = await createBackCover(
      dims.frontCover.widthPx,
      dims.frontCover.heightPx,
      interiorImagesUrls,
      frontCoverBuffer
    );
    
    // Composite the three parts
    const compositeImage = await fullCover.composite([
      { 
        input: backCoverBuffer, 
        left: 0, 
        top: 0 
      },
      { 
        input: spineBuffer, 
        left: dims.frontCover.widthPx, 
        top: 0 
      },
      { 
        input: resizedFrontCover, 
        left: dims.frontCover.widthPx + dims.spine.widthPx, 
        top: 0 
      }
    ]).png().toBuffer();
    
    // Return the assembled cover as a base64 encoded string
    res.json({
      fullCover: `data:image/png;base64,${compositeImage.toString('base64')}`,
      dimensions: dims
    });
  } catch (error) {
    console.error('Error assembling full cover:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to assemble full cover',
      type: error.name
    });
  }
});

/**
 * Download the cover image at specified dimensions and format
 * GET /api/book-cover/download
 */
router.get('/download', async (req, res) => {
  try {
    const { url, format = 'png', filename, width, height } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    // Decode if the URL is a base64 data URL
    let imageBuffer;
    if (url.startsWith('data:image')) {
      const base64Data = url.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else {
      // Download the image from the URL
      const imageResponse = await fetch(url);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.statusText}`);
      }
      imageBuffer = await imageResponse.buffer();
    }
    
    // Process the image with sharp
    let processedImage = sharp(imageBuffer);
    
    // Resize if dimensions are provided
    if (width && height) {
      processedImage = processedImage.resize({
        width: parseInt(width),
        height: parseInt(height),
        fit: 'fill'
      });
    }
    
    // Convert to requested format
    if (format === 'pdf') {
      // For PDF, we keep the PNG and let the browser handle PDF conversion
      // since sharp doesn't support PDF output directly
      processedImage = processedImage.png();
      res.setHeader('Content-Type', 'application/pdf');
    } else if (format === 'jpg' || format === 'jpeg') {
      processedImage = processedImage.jpeg({ quality: 95 });
      res.setHeader('Content-Type', 'image/jpeg');
    } else {
      // Default to PNG
      processedImage = processedImage.png();
      res.setHeader('Content-Type', 'image/png');
    }
    
    // Get the final buffer
    const outputBuffer = await processedImage.toBuffer();
    
    // Set appropriate headers for download
    const defaultFilename = `book-cover.${format === 'pdf' ? 'pdf' : (format === 'jpg' || format === 'jpeg' ? 'jpg' : 'png')}`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename || defaultFilename}"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');
    
    // Send the processed image
    res.send(outputBuffer);
  } catch (error) {
    console.error('Error downloading cover:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to download cover',
      type: error.name
    });
  }
});

/**
 * Helper function to create a spine image
 */
async function createSpine(width, height, spineText, spineColor, bookTitle, authorName) {
  // Create a solid color spine
  const spineImage = sharp({
    create: {
      width,
      height,
      channels: 4,
      background: parseColor(spineColor)
    }
  });
  
  // If spine text is provided, add it to the spine
  if (spineText) {
    // We would add text overlay here, but sharp doesn't support text
    // For a real implementation, consider using canvas or another library
    // This is a placeholder
    console.log('Adding spine text:', spineText);
  }
  
  return spineImage.png().toBuffer();
}

/**
 * Helper function to create a back cover
 */
async function createBackCover(width, height, interiorImagesUrls, frontCoverBuffer) {
  // If there are interior images, create a grid layout
  if (interiorImagesUrls && interiorImagesUrls.length > 0) {
    try {
      // Create a white background
      const backCover = sharp({
        create: {
          width,
          height,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        }
      });
      
      // Download all interior images
      const imageBuffers = [];
      for (const imageUrl of interiorImagesUrls) {
        try {
          // Handle both URLs and data URLs
          let imageBuffer;
          if (imageUrl.startsWith('data:image')) {
            const base64Data = imageUrl.split(',')[1];
            imageBuffer = Buffer.from(base64Data, 'base64');
          } else {
            const imageResponse = await fetch(imageUrl);
            if (!imageResponse.ok) {
              console.error(`Failed to download interior image: ${imageResponse.statusText}`);
              continue;
            }
            imageBuffer = await imageResponse.buffer();
          }
          
          imageBuffers.push(imageBuffer);
        } catch (error) {
          console.error('Error processing interior image:', error);
          // Continue with other images
        }
      }
      
      // If no images were successfully downloaded, return a mirrored front cover
      if (imageBuffers.length === 0) {
        return sharp(frontCoverBuffer)
          .flop() // Mirror horizontally
          .modulate({ saturation: 0.7 }) // Slightly desaturate
          .png()
          .toBuffer();
      }
      
      // Calculate grid dimensions based on the number of images
      const rows = imageBuffers.length <= 2 ? 1 : 2;
      const cols = imageBuffers.length === 1 ? 1 : 2;
      
      // Calculate image size in the grid
      const margin = 50; // Margin around the grid and between images
      const gridWidth = width - (margin * 2);
      const gridHeight = height - (margin * 2);
      const imageWidth = Math.floor((gridWidth - (margin * (cols - 1))) / cols);
      const imageHeight = Math.floor((gridHeight - (margin * (rows - 1))) / rows);
      
      // Resize and position each image for compositing
      const composites = [];
      for (let i = 0; i < Math.min(imageBuffers.length, rows * cols); i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        
        // Resize the image
        const resizedImage = await sharp(imageBuffers[i])
          .resize({
            width: imageWidth,
            height: imageHeight,
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 0 }
          })
          .toBuffer();
        
        // Calculate position
        const left = margin + (col * (imageWidth + margin));
        const top = margin + (row * (imageHeight + margin));
        
        composites.push({
          input: resizedImage,
          left,
          top
        });
      }
      
      // Add text "Interior Preview" at the top
      const textOverlay = await createTextOverlay("Interior Preview", width, 40);
      composites.unshift({
        input: textOverlay,
        left: 0,
        top: 10
      });
      
      // Composite all images onto the back cover
      return backCover.composite(composites).png().toBuffer();
    } catch (error) {
      console.error('Error creating back cover with interior images:', error);
      // Fallback to mirrored front cover
      return sharp(frontCoverBuffer)
        .flop() // Mirror horizontally
        .modulate({ saturation: 0.7 }) // Slightly desaturate
        .png()
        .toBuffer();
    }
  } else {
    // If no interior images, use a mirrored version of the front cover
    // but slightly desaturated
    return sharp(frontCoverBuffer)
      .flop() // Mirror horizontally
      .modulate({ saturation: 0.7 }) // Slightly desaturate
      .png()
      .toBuffer();
  }
}

/**
 * Helper function to create a text overlay
 * Note: Since sharp doesn't support text rendering, this is a workaround
 * using a solid color rectangle with alpha channel
 */
async function createTextOverlay(text, width, height) {
  // Create a semi-transparent background
  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0.1 }
    }
  }).png().toBuffer();
  
  // In a real implementation, you would use a library like canvas
  // to render text properly onto an image
}

/**
 * Helper function to parse color from string to rgba object
 */
function parseColor(color) {
  // Handle hex colors
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return { r, g, b, alpha: 1 };
  }
  
  // Handle rgb/rgba colors
  if (color.startsWith('rgb')) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3]),
        alpha: match[4] ? parseFloat(match[4]) : 1
      };
    }
  }
  
  // Default to black
  return { r: 0, g: 0, b: 0, alpha: 1 };
}

module.exports = router; 