const express = require('express');
const router = express.Router();
const multer = require('multer');
const fetch = require('node-fetch');
const FormData = require('form-data');
const sharp = require('sharp');
const { Readable } = require('stream');
const archiver = require('archiver');
const ColorThief = require('colorthief');
const path = require('path');
const fs = require('fs');
const { enhanceImage } = require('../controllers/imageEnhancementController');

// Define static directory for storing image files
const staticDir = path.join(__dirname, '..', '..', 'static');

// Create static directory if it doesn't exist
if (!fs.existsSync(staticDir)) {
  console.log(`Creating static directory: ${staticDir}`);
  fs.mkdirSync(staticDir, { recursive: true });
}

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

// Enhanced prompt processing function for Ideogram only
function enhanceIdeogramPrompt(originalPrompt) {
  // Ideogram works well with design terminology and creative style descriptions
  
  let prompt = originalPrompt;
  
  // Enhance with design-friendly keywords
  if (!prompt.includes('style') && !prompt.includes('vector') && !prompt.includes('design')) {
    // Add design style based on content
    if (prompt.includes('teen') || prompt.includes('young') || prompt.includes('puzzle')) {
      prompt = prompt.replace(/teen/gi, 'comic-style teen');
      prompt = prompt.replace(/puzzle/gi, 'pop-art puzzle');
    }
    if (prompt.includes('fantasy') || prompt.includes('magic')) {
      prompt = prompt.replace(/fantasy/gi, 'fantasy flat vector style');
    }
    if (prompt.includes('mystery') || prompt.includes('thriller')) {
      prompt = prompt.replace(/mystery/gi, 'noir-style mystery');
    }
    if (prompt.includes('romance')) {
      prompt = prompt.replace(/romance/gi, 'elegant romantic');
    }
  }
  
  // Replace literal terms with design-friendly language
  prompt = prompt.replace(/book cover/gi, 'front cover');
  prompt = prompt.replace(/flat design/gi, 'flat vector style');
  prompt = prompt.replace(/illustration/gi, 'flat vector illustration');
  prompt = prompt.replace(/cartoon/gi, 'comic-style');
  
  // Add design terminology if missing
  if (!prompt.includes('vector') && !prompt.includes('comic') && !prompt.includes('pop-art')) {
    prompt = `Comic-style ${prompt}`;
  }
  
  // Add Ideogram specific design instructions
  const ideogramInstructions = "Use design-friendly keywords. Bold typography with generous space from edges. Fun and bold flat vector style. High-contrast color palette. Leave all text inside print-safe area. Format: 6x9 inches, KDP-compliant front cover.";
  
  if (!prompt.includes('KDP-compliant') && !prompt.includes('print-safe')) {
    prompt = `${prompt} ${ideogramInstructions}`;
  }
  
  // Clean up formatting
  prompt = prompt.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
  
  return prompt;
}

/**
 * Test endpoint to verify functionality
 * GET /api/book-cover/test
 */
router.get('/test', (req, res) => {
  res.json({ message: 'Book cover API is working!', timestamp: new Date().toISOString() });
});

/**
 * Calculate cover dimensions based on KDP specs
 * POST /api/book-cover/calculate-dimensions
 */
router.post('/calculate-dimensions', express.json(), async (req, res) => {
  try {
    console.log('Received calculate-dimensions request with body:', req.body);
    
    const { 
      trimSize, 
      pageCount, 
      paperColor, 
      bookType = 'paperback',
      includeBleed = true 
    } = req.body;

    if (!trimSize || !pageCount) {
      console.log('Missing required parameters:', { trimSize, pageCount });
      return res.status(400).json({ error: 'Trim size and page count are required' });
    }

    // Parse the trim size (format: "5x8", "6x9", etc.)
    const [widthStr, heightStr] = trimSize.split('x');
    const trimWidth = parseFloat(widthStr);
    const trimHeight = parseFloat(heightStr);

    if (isNaN(trimWidth) || isNaN(trimHeight)) {
      console.log('Invalid trim size format:', trimSize);
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

    const response = {
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
    };
    
    console.log('Sending dimensions response:', response);
    res.json(response);
  } catch (error) {
    console.error('Error calculating dimensions:', error);
    res.status(500).json({ error: 'Failed to calculate cover dimensions' });
  }
});

/**
 * Generate front cover using Ideogram only
 * POST /api/book-cover/generate-front
 */
router.post('/generate-front', async (req, res) => {
  try {
    const { 
      title, 
      subtitle, 
      author, 
      genre, 
      style, 
      description,
      prompt, // Add support for direct prompt parameter
      customInstructions,
      width,
      height,
      negative_prompt,
      seed,
      model
    } = req.body;

    // Build base prompt - prioritize direct prompt parameter for back cover generation
    let basePrompt;
    if (prompt && prompt.trim()) {
      // Use direct prompt parameter (for back cover generation)
      basePrompt = prompt.trim();
    } else if (description && description.trim()) {
      // Use provided description as base
      basePrompt = description.trim();
    } else {
      // Build from components
      const titleText = title || 'Untitled Book';
      const genreText = genre || 'fiction';
      const styleText = style || 'modern';
      
      basePrompt = `${titleText} book. ${genreText} genre. ${styleText} style.`;
      if (subtitle) basePrompt += ` Subtitle: ${subtitle}.`;
      if (author) basePrompt += ` Author: ${author}.`;
    }

    // Add custom instructions if provided
    if (customInstructions && customInstructions.trim()) {
      basePrompt += ` ${customInstructions.trim()}`;
    }

    // Apply Ideogram optimization to ALL prompts
    const optimizedPrompt = enhanceIdeogramPrompt(basePrompt);

    console.log(`Generating Ideogram cover with optimized prompt:`, optimizedPrompt);

    const imageUrl = await generateIdeogramCover(optimizedPrompt);

    res.json({ 
      success: true, 
      url: imageUrl, // Also return as 'url' for compatibility
      imageUrl,
      prompt: optimizedPrompt,
      model: 'ideogram'
    });

  } catch (error) {
    console.error('Error generating front cover:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to generate cover'
    });
  }
});

/**
 * Generate back cover based on front cover
 * POST /api/book-cover/generate-back
 */
router.post('/generate-back', upload.none(), async (req, res) => {
  try {
    console.log('=== Back Cover Generation Request ===');
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
    
    const { 
      frontCoverUrl, 
      frontCoverPrompt,
      width, 
      height, 
      backCoverPrompt, 
      interiorImages = [] 
    } = req.body;
    
    if (!frontCoverUrl) {
      console.error('Missing required parameter: frontCoverUrl');
      return res.status(400).json({ status: 'error', message: 'Missing frontCoverUrl parameter' });
    }

    // Use provided dimensions or default to standard book cover size
    const targetWidth = width || 1800;
    const targetHeight = height || 2700;
    
    console.log('Target back cover dimensions:', { width: targetWidth, height: targetHeight });
    console.log('Back cover prompt provided:', !!backCoverPrompt);
    console.log('Front cover prompt available:', !!frontCoverPrompt);

    try {
      // NEW SYSTEMATIC APPROACH: Parse front cover prompt and build back cover prompt
      if (frontCoverPrompt && frontCoverPrompt.trim()) {
        console.log('Using systematic approach: parsing front cover prompt...');
        
        // Parse the front cover prompt and build a consistent back cover prompt
        const interiorImagesCount = interiorImages.filter(img => img && img.trim()).length;
        const systematicBackPrompt = parseAndBuildBackCoverPrompt(
          frontCoverPrompt.trim(),
          backCoverPrompt || '',
          interiorImagesCount
        );
        
        console.log('Generated systematic back cover prompt:', systematicBackPrompt);
        
        // Skip AI generation and go directly to style matching to avoid text/ISBN issues
        console.log('Skipping AI generation to prevent text/ISBN issues, using style matching approach...');
      }
      
      // FALLBACK: If a custom prompt is provided (legacy approach)
      else if (backCoverPrompt && backCoverPrompt.trim()) {
        console.log('Using legacy approach: skipping AI generation to prevent text/ISBN issues...');
      }
      
      console.log('Creating back cover with same style as front cover but clean text areas...');
      
      // Download the front cover image or handle data URL
      let frontBuffer;
      if (frontCoverUrl.startsWith('data:image')) {
        console.log('Processing data URL for front cover...');
        // Handle data URL (base64 image)
        const base64Data = frontCoverUrl.split(',')[1];
        frontBuffer = Buffer.from(base64Data, 'base64');
      } else {
        console.log('Fetching front cover from URL...');
        // Handle regular HTTP URL
        const response = await fetch(frontCoverUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch front cover: ${response.status} ${response.statusText}`);
        }
        const frontCoverBuffer = await response.arrayBuffer();
        frontBuffer = Buffer.from(frontCoverBuffer);
      }
      
      // Create back cover that maintains the same visual style but with clean text areas
      let backCoverBuffer = await createStyledBackCover(
        targetWidth,
        targetHeight,
        frontBuffer,
        interiorImages.filter(img => img && img.trim()),
        frontCoverPrompt // Pass the front cover prompt for better style matching
      );
      
      // Save to a temporary file with a unique name
      const uniqueId = Date.now();
      const fileName = `back-cover-styled-${uniqueId}.jpg`;
      const filePath = path.join(staticDir, fileName);
      
      // Save the final image
      await sharp(backCoverBuffer)
        .jpeg({ quality: 95 })
        .toFile(filePath);
      
      // Return the URL to the saved file
      const backCoverUrl = `/static/${fileName}`;
      console.log('Successfully created styled back cover:', backCoverUrl);
      
      res.set('Content-Type', 'application/json');
      return res.json({ 
        status: 'success', 
        url: backCoverUrl,
        width: targetWidth,
        height: targetHeight,
        method: 'style_matched'
      });
    } catch (error) {
      console.error('Error creating back cover:', error);
      res.status(500).json({ status: 'error', message: 'Failed to create back cover', details: error.message });
    }
  } catch (error) {
    console.error('Error in back cover generation:', error);
    res.status(500).json({ status: 'error', message: 'Server error', details: error.message });
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
 * Extract dominant colors from an image
 * POST /api/book-cover/extract-colors
 */
router.post('/extract-colors', express.json(), async (req, res) => {
  try {
    console.log('Received extract-colors request');
    
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      console.error('Missing required parameter: imageUrl');
      return res.status(400).json({ error: 'Image URL is required' });
    }
    
    console.log('Fetching image from URL:', imageUrl);
    
    // Fetch the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }
    
    const imageBuffer = await imageResponse.buffer();
    
    // Save the image temporarily
    const tempImagePath = `/tmp/temp-image-${Date.now()}.jpg`;
    await sharp(imageBuffer).jpeg().toFile(tempImagePath);
    
    // Get the dominant colors (palette)
    console.log('Extracting color palette');
    const palette = await ColorThief.getPalette(tempImagePath, 6);
    
    // Convert RGB arrays to hex colors
    const colors = palette.map(color => {
      const [r, g, b] = color;
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    });
    
    console.log('Extracted colors:', colors);
    
    res.json({
      status: 'success',
      colors
    });
  } catch (error) {
    console.error('Error extracting colors:', error);
    res.status(500).json({ 
      error: 'Failed to extract colors from image',
      details: error.message
    });
  }
});

/**
 * Generate full wrap cover
 * POST /api/book-cover/generate-full-wrap
 */
router.post('/generate-full-wrap', express.json(), async (req, res) => {
  try {
    console.log('Received request to generate full wrap cover');
    
    const { 
      frontCoverUrl, 
      trimSize,
      paperType, 
      pageCount,
      spineColor,
      spineText,
      addSpineText,
      interiorImages = []
    } = req.body;
    
    if (!frontCoverUrl) {
      console.error('Missing required parameter: frontCoverUrl');
      return res.status(400).json({ error: 'Front cover URL is required' });
    }
    
    if (!trimSize || !paperType || !pageCount) {
      console.error('Missing required parameters:', { trimSize, paperType, pageCount });
      return res.status(400).json({ error: 'Trim size, paper type, and page count are required' });
    }
    
    // Parse trim size
    const [widthInches, heightInches] = trimSize.split('x').map(Number);
    
    // Calculate spine width based on page count and paper type
    let spineWidthMultiplier;
    if (paperType === 'white') {
      spineWidthMultiplier = 0.002252; // For white paper: pages * 0.002252" (KDP's formula)
    } else if (paperType === 'cream') {
      spineWidthMultiplier = 0.0025; // For cream paper: pages * 0.0025" (KDP's formula)
    } else {
      spineWidthMultiplier = 0.002347; // For color paper: pages * 0.002347" (approximate)
    }
    
    const spineWidthInches = pageCount * spineWidthMultiplier;
    
    // Add bleed (0.125" on all sides)
    const bleedInches = 0.125;
    
    // Calculate total width: front + spine + back + bleed
    const totalWidthInches = (widthInches * 2) + spineWidthInches + (bleedInches * 2);
    const totalHeightInches = heightInches + (bleedInches * 2);
    
    // Convert to pixels at 300 DPI
    const dpi = 300;
    const frontWidthPx = Math.round(widthInches * dpi);
    const frontHeightPx = Math.round(heightInches * dpi);
    const spineWidthPx = Math.round(spineWidthInches * dpi);
    const totalWidthPx = Math.round(totalWidthInches * dpi);
    const totalHeightPx = Math.round(totalHeightInches * dpi);
    
    console.log('Calculated dimensions:', {
      frontWidthPx,
      frontHeightPx,
      spineWidthPx,
      totalWidthPx,
      totalHeightPx
    });
    
    // Download the front cover image
    console.log('Downloading front cover from:', frontCoverUrl);
    const frontCoverResponse = await fetch(frontCoverUrl);
    if (!frontCoverResponse.ok) {
      throw new Error(`Failed to download front cover: ${frontCoverResponse.statusText}`);
    }
    
    const frontCoverBuffer = await frontCoverResponse.buffer();
    
    // Resize front cover if needed
    const resizedFrontCover = await sharp(frontCoverBuffer)
      .resize({
        width: frontWidthPx,
        height: frontHeightPx,
        fit: 'fill'
      })
      .toBuffer();
    
    // Create the spine
    console.log('Creating spine with:', {
      width: spineWidthPx,
      height: totalHeightPx,
      spineText: spineText || '',
      spineColor: spineColor || '#000000',
      addSpineText: !!addSpineText
    });
    
    const spineBuffer = await createSpine(
      spineWidthPx,
      totalHeightPx,
      addSpineText && spineText ? spineText : '',
      spineColor || '#000000',
      '', // Book title (using spineText instead)
      ''  // Author name (using spineText instead)
    );
    
    // Create the back cover
    console.log('Creating back cover with interior images:', interiorImages.length);
    const backCoverBuffer = await createBackCover(
      frontWidthPx,
      frontHeightPx,
      interiorImages,
      frontCoverBuffer
    );
    
    // Create a blank canvas for the full cover
    const fullCover = sharp({
      create: {
        width: totalWidthPx,
        height: totalHeightPx,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    });
    
    // Composite the three parts: back cover, spine, front cover
    console.log('Compositing full wrap cover');
    const fullCoverBuffer = await fullCover.composite([
      {
        input: backCoverBuffer,
        left: 0,
        top: 0
      },
      {
        input: spineBuffer,
        left: frontWidthPx,
        top: 0
      },
      {
        input: resizedFrontCover,
        left: frontWidthPx + spineWidthPx,
        top: 0
      }
    ]).jpeg({ quality: 100 }).toBuffer();
    
    // Save to a temporary file and return its URL
    const filename = `kdp-full-wrap-${Date.now()}.jpg`;
    const tempFilePath = `/tmp/${filename}`;
    
    await sharp(fullCoverBuffer).toFile(tempFilePath);
    
    // For a real production app, we would upload this to S3 or similar storage
    // For now, we'll return as base64 for demo purposes
    const base64Image = `data:image/jpeg;base64,${fullCoverBuffer.toString('base64')}`;
    
    res.json({
      status: 'success',
      url: base64Image,
      dimensions: {
        width: totalWidthPx,
        height: totalHeightPx,
        trimSize,
        paperType,
        pageCount,
        spineWidthInches: spineWidthInches.toFixed(3),
        totalWidthInches: totalWidthInches.toFixed(2),
        totalHeightInches: totalHeightInches.toFixed(2),
        dpi
      }
    });
  } catch (error) {
    console.error('Error generating full wrap cover:', error);
    res.status(500).json({
      error: 'Failed to generate full wrap cover',
      details: error.message
    });
  }
});

/**
 * Enhance cover image quality using Real-ESRGAN
 * POST /api/book-cover/enhance
 */
router.post('/enhance', upload.none(), async (req, res) => {
  try {
    console.log('=== Book Cover Enhancement Request ===');
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
    
    const { imageUrl, target } = req.body;
    
    if (!imageUrl) {
      console.error('Missing required parameter: imageUrl');
      return res.status(400).json({ error: 'Image URL is required' });
    }

    // Create a mock file object for the enhanceImage controller
    const mockFile = {
      buffer: await (await fetch(imageUrl)).buffer()
    };

    // Call the existing image enhancement controller
    const mockReq = {
      file: mockFile,
      body: {
        scale: 2 // Use a moderate scale factor for book covers
      }
    };

    // Create a mock response to capture the enhancement result
    const mockRes = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.data = data;
        return this;
      }
    };

    // Call the enhancement controller
    await enhanceImage(mockReq, mockRes);

    // Check if enhancement was successful
    if (mockRes.data?.success && mockRes.data?.predictionId) {
      res.json({
        success: true,
        message: 'Enhancement initiated',
        predictionId: mockRes.data.predictionId,
        status: mockRes.data.status,
        statusEndpoint: mockRes.data.statusEndpoint
      });
    } else {
      throw new Error('Enhancement failed');
    }
  } catch (error) {
    console.error('Error enhancing book cover:', error);
    res.status(500).json({ 
      error: 'Failed to enhance book cover',
      details: error.message
    });
  }
});

/**
 * Prompt enhancement endpoint
 * POST /api/book-cover/enhance-prompt
 */
router.post('/enhance-prompt', async (req, res) => {
  try {
    const { prompt, model } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    if (!model || !['dalle', 'ideogram'].includes(model)) {
      return res.status(400).json({ error: 'Valid model (dalle or ideogram) is required' });
    }
    
    let enhancedPrompt;
    
    if (model === 'dalle') {
      enhancedPrompt = enhanceDallePrompt(prompt);
    } else {
      enhancedPrompt = enhanceIdeogramPrompt(prompt);
    }
    
    res.json({ 
      originalPrompt: prompt,
      enhancedPrompt: enhancedPrompt,
      model: model,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error enhancing prompt:', error);
    res.status(500).json({ error: 'Failed to enhance prompt' });
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
      // Create a white background with target dimensions
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
      
      // If no images were successfully downloaded, return a styled mirrored front cover
      if (imageBuffers.length === 0) {
        return sharp(frontCoverBuffer)
          .resize(width, height, { fit: 'fill' }) // Ensure exact target dimensions
          .flop() // Mirror horizontally
          .modulate({ saturation: 0.8, brightness: 0.9 }) // Slightly desaturate and darken
          .composite([{
            input: {
              create: {
                width,
                height,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0.3 }
              }
            },
            blend: 'overlay'
          }])
          .jpeg({ quality: 95 })
          .toBuffer();
      }
      
      // Calculate grid dimensions based on the number of images
      const rows = imageBuffers.length <= 2 ? 1 : 2;
      const cols = imageBuffers.length === 1 ? 1 : 2;
      
      // Calculate image size in the grid
      const margin = Math.max(30, Math.floor(Math.min(width, height) * 0.05)); // Responsive margin
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
      const textOverlay = await createTextOverlay("Interior Preview", width, Math.floor(height * 0.08));
      composites.unshift({
        input: textOverlay,
        left: 0,
        top: Math.floor(height * 0.02)
      });
      
      // Composite all images onto the back cover and ensure exact dimensions
      return backCover.composite(composites)
        .resize(width, height, { fit: 'fill' })
        .jpeg({ quality: 95 })
        .toBuffer();
    } catch (error) {
      console.error('Error creating back cover with interior images:', error);
      // Fallback to styled mirrored front cover with exact dimensions
      return sharp(frontCoverBuffer)
        .resize(width, height, { fit: 'fill' })
        .flop() // Mirror horizontally
        .modulate({ saturation: 0.8, brightness: 0.9 }) // Slightly desaturate and darken
        .composite([{
          input: {
            create: {
              width,
              height,
              channels: 4,
              background: { r: 0, g: 0, b: 0, alpha: 0.3 }
            }
          },
          blend: 'overlay'
        }])
        .jpeg({ quality: 95 })
        .toBuffer();
    }
  } else {
    // If no interior images, use a styled mirrored version of the front cover
    return sharp(frontCoverBuffer)
      .resize(width, height, { fit: 'fill' }) // Ensure exact target dimensions
      .flop() // Mirror horizontally
      .modulate({ saturation: 0.8, brightness: 0.9 }) // Slightly desaturate and darken
      .composite([{
        input: {
          create: {
            width,
            height,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0.3 }
          }
        },
        blend: 'overlay'
      }])
      .jpeg({ quality: 95 })
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

// Helper function to generate cover using Ideogram
async function generateIdeogramCover(prompt) {
  console.log('Generating Ideogram cover with prompt:', prompt);
  
  const form = new FormData();
  form.append('prompt', prompt);
  form.append('aspect_ratio', '2x3'); // Standard book cover ratio
  form.append('rendering_speed', 'DEFAULT');
  form.append('style_type', 'REALISTIC');
  form.append('num_images', '1');
  form.append('seed', Math.floor(Math.random() * 1000000).toString());
  
  const response = await fetch('https://api.ideogram.ai/v1/ideogram-v3/generate', {
    method: 'POST',
    headers: {
      'Api-Key': process.env.IDEOGRAM_API_KEY,
      ...form.getHeaders()
    },
    body: form
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Ideogram API error:', errorText);
    throw new Error('Failed to generate image with Ideogram');
  }
  
  const data = await response.json();
  
  // Handle different response formats
  let imageUrl = data?.data?.[0]?.url || data?.images?.[0]?.url || data?.url;
  
  if (!imageUrl) {
    console.error('No image URL found in Ideogram response:', data);
    throw new Error('No image URL in API response');
  }
  
  return imageUrl;
}

/**
 * Helper function to create a styled back cover that matches the front cover
 * but with clean areas for text content
 */
async function createStyledBackCover(width, height, frontCoverBuffer, interiorImagesUrls, frontCoverPrompt) {
  try {
    console.log('Creating styled back cover that matches front cover...');
    
    // Parse front cover prompt for style information if available
    let styleInfo = null;
    if (frontCoverPrompt) {
      styleInfo = parseAndBuildBackCoverPrompt(frontCoverPrompt, '', 0);
      console.log('Using front cover style information for enhanced matching');
    }
    
    // First, resize the front cover to our target dimensions to get proper color sampling
    const resizedFrontCover = await sharp(frontCoverBuffer)
      .resize(width, height, { fit: 'cover' })
      .toBuffer();
    
    // Extract multiple color samples from different regions of the front cover
    const frontImage = sharp(resizedFrontCover);
    
    // Get overall image stats
    const { dominant } = await frontImage.stats();
    
    // Sample colors from different regions of the front cover
    const regionSize = 100;
    const regions = [
      { left: 0, top: 0, width: regionSize, height: regionSize }, // Top-left
      { left: width - regionSize, top: 0, width: regionSize, height: regionSize }, // Top-right
      { left: 0, top: height - regionSize, width: regionSize, height: regionSize }, // Bottom-left
      { left: width - regionSize, top: height - regionSize, width: regionSize, height: regionSize }, // Bottom-right
      { left: Math.floor(width/2) - 50, top: Math.floor(height/2) - 50, width: regionSize, height: regionSize } // Center
    ];
    
    const regionColors = [];
    for (const region of regions) {
      try {
        const { dominant: regionDominant } = await frontImage
          .extract(region)
          .stats();
        regionColors.push({
          r: Math.round(regionDominant.r),
          g: Math.round(regionDominant.g),
          b: Math.round(regionDominant.b)
        });
      } catch (error) {
        // If region extraction fails, use the overall dominant color
        regionColors.push({
          r: Math.round(dominant.r),
          g: Math.round(dominant.g),
          b: Math.round(dominant.b)
        });
      }
    }
    
    // Create a more sophisticated background that uses the actual front cover colors
    const primaryColor = regionColors[4]; // Center color
    const secondaryColor = regionColors[0]; // Top-left color
    const accentColor = regionColors[2]; // Bottom-left color
    
    // Create a complex gradient background using the extracted colors
    const backgroundSvg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="mainGradient" cx="30%" cy="20%" r="80%">
            <stop offset="0%" style="stop-color:rgb(${primaryColor.r},${primaryColor.g},${primaryColor.b});stop-opacity:0.9" />
            <stop offset="40%" style="stop-color:rgb(${secondaryColor.r},${secondaryColor.g},${secondaryColor.b});stop-opacity:0.8" />
            <stop offset="100%" style="stop-color:rgb(${accentColor.r},${accentColor.g},${accentColor.b});stop-opacity:0.9" />
          </radialGradient>
          <linearGradient id="overlayGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:rgb(${regionColors[1].r},${regionColors[1].g},${regionColors[1].b});stop-opacity:0.3" />
            <stop offset="100%" style="stop-color:rgb(${regionColors[3].r},${regionColors[3].g},${regionColors[3].b});stop-opacity:0.2" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#mainGradient)" />
        <rect width="100%" height="100%" fill="url(#overlayGradient)" />
      </svg>
    `;
    
    // Create the base background
    let baseBackCover = await sharp(Buffer.from(backgroundSvg))
      .resize(width, height)
      .toBuffer();
    
    // Extract a blurred, low-opacity version of parts of the front cover for texture
    const textureOverlay = await sharp(resizedFrontCover)
      .blur(20)
      .modulate({ brightness: 0.3, saturation: 0.5 })
      .composite([{
        input: {
          create: {
            width,
            height,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 0.7 }
          }
        },
        blend: 'overlay'
      }])
      .toBuffer();
    
    // Start building overlays
    const overlays = [];
    
    // Add the texture overlay first
    overlays.push({
      input: textureOverlay,
      blend: 'soft-light'
    });
    
    // Create text areas with colors that complement the front cover
    const textAreaColor = {
      r: Math.min(255, Math.max(primaryColor.r, secondaryColor.r, accentColor.r) + 40),
      g: Math.min(255, Math.max(primaryColor.g, secondaryColor.g, accentColor.g) + 40),
      b: Math.min(255, Math.max(primaryColor.b, secondaryColor.b, accentColor.b) + 40)
    };
    
    // Main content area (book description)
    const mainContentHeight = Math.floor(height * 0.45);
    const mainContentWidth = Math.floor(width * 0.82);
    const mainContentSvg = `
      <svg width="${mainContentWidth}" height="${mainContentHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="rgba(0,0,0,0.3)"/>
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="rgba(${textAreaColor.r},${textAreaColor.g},${textAreaColor.b},0.95)" rx="12" ry="12" filter="url(#shadow)"/>
        <rect x="3" y="3" width="${mainContentWidth-6}" height="${mainContentHeight-6}" fill="none" stroke="rgba(${primaryColor.r},${primaryColor.g},${primaryColor.b},0.3)" stroke-width="1" rx="9" ry="9"/>
      </svg>
    `;
    
    overlays.push({
      input: Buffer.from(mainContentSvg),
      left: Math.floor((width - mainContentWidth) / 2),
      top: Math.floor(height * 0.18)
    });
    
    // Author bio area
    const authorBioHeight = Math.floor(height * 0.15);
    const authorBioWidth = Math.floor(width * 0.75);
    const authorBioSvg = `
      <svg width="${authorBioWidth}" height="${authorBioHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="bioShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="rgba(0,0,0,0.2)"/>
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="rgba(${textAreaColor.r},${textAreaColor.g},${textAreaColor.b},0.9)" rx="8" ry="8" filter="url(#bioShadow)"/>
        <rect x="2" y="2" width="${authorBioWidth-4}" height="${authorBioHeight-4}" fill="none" stroke="rgba(${secondaryColor.r},${secondaryColor.g},${secondaryColor.b},0.4)" stroke-width="1" rx="6" ry="6"/>
      </svg>
    `;
    
    overlays.push({
      input: Buffer.from(authorBioSvg),
      left: Math.floor((width - authorBioWidth) / 2),
      top: Math.floor(height * 0.72)
    });
    
    // Add decorative elements using the front cover colors
    const decorativeElements = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="accent1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style="stop-color:rgb(${primaryColor.r},${primaryColor.g},${primaryColor.b});stop-opacity:0.6" />
            <stop offset="100%" style="stop-color:rgb(${primaryColor.r},${primaryColor.g},${primaryColor.b});stop-opacity:0" />
          </radialGradient>
          <radialGradient id="accent2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style="stop-color:rgb(${secondaryColor.r},${secondaryColor.g},${secondaryColor.b});stop-opacity:0.4" />
            <stop offset="100%" style="stop-color:rgb(${secondaryColor.r},${secondaryColor.g},${secondaryColor.b});stop-opacity:0" />
          </radialGradient>
        </defs>
        <circle cx="${width * 0.15}" cy="${height * 0.12}" r="40" fill="url(#accent1)"/>
        <circle cx="${width * 0.88}" cy="${height * 0.15}" r="25" fill="url(#accent2)"/>
        <circle cx="${width * 0.12}" cy="${height * 0.85}" r="30" fill="url(#accent1)"/>
        <circle cx="${width * 0.85}" cy="${height * 0.88}" r="20" fill="url(#accent2)"/>
      </svg>
    `;
    
    overlays.push({
      input: Buffer.from(decorativeElements),
      left: 0,
      top: 0,
      blend: 'soft-light'
    });
    
    // Add interior images if provided
    if (interiorImagesUrls && interiorImagesUrls.length > 0) {
      const imageBuffers = [];
      for (const imageUrl of interiorImagesUrls) {
        try {
          let imageBuffer;
          if (imageUrl.startsWith('data:image')) {
            const base64Data = imageUrl.split(',')[1];
            imageBuffer = Buffer.from(base64Data, 'base64');
          } else {
            const imageResponse = await fetch(imageUrl);
            if (!imageResponse.ok) continue;
            imageBuffer = await imageResponse.buffer();
          }
          imageBuffers.push(imageBuffer);
        } catch (error) {
          console.error('Error processing interior image:', error);
        }
      }
      
      if (imageBuffers.length > 0) {
        const imageSize = Math.floor(width * 0.11);
        const spacing = 12;
        const maxImages = Math.min(imageBuffers.length, 4);
        const totalWidth = maxImages * imageSize + (maxImages - 1) * spacing;
        const startX = Math.floor((width - totalWidth) / 2);
        const startY = Math.floor(height * 0.67);
        
        for (let i = 0; i < maxImages; i++) {
          // Create a frame for each interior image using front cover colors
          const frameSize = imageSize + 8;
          const frameSvg = `
            <svg width="${frameSize}" height="${frameSize}" xmlns="http://www.w3.org/2000/svg">
              <rect width="100%" height="100%" fill="rgba(${primaryColor.r},${primaryColor.g},${primaryColor.b},0.8)" rx="6"/>
              <rect x="4" y="4" width="${imageSize}" height="${imageSize}" fill="white" rx="3"/>
            </svg>
          `;
          
          overlays.push({
            input: Buffer.from(frameSvg),
            left: startX + (i * (imageSize + spacing)) - 4,
            top: startY - 4
          });
          
          const resizedImage = await sharp(imageBuffers[i])
            .resize(imageSize, imageSize, { fit: 'cover' })
            .jpeg({ quality: 90 })
            .toBuffer();
          
          overlays.push({
            input: resizedImage,
            left: startX + (i * (imageSize + spacing)),
            top: startY
          });
        }
      }
    }
    
    // Composite all overlays onto the base back cover
    const finalBackCover = await sharp(baseBackCover)
      .composite(overlays)
      .jpeg({ quality: 95 })
      .toBuffer();
    
    console.log('Successfully created styled back cover matching front cover colors');
    return finalBackCover;
    
  } catch (error) {
    console.error('Error in createStyledBackCover:', error);
    
    // Enhanced fallback that still tries to use front cover
    try {
      console.log('Using enhanced fallback approach...');
      
      // Create a blurred, desaturated version of the front cover as base
      const blurredFront = await sharp(frontCoverBuffer)
        .resize(width, height, { fit: 'cover' })
        .blur(15)
        .modulate({ brightness: 0.7, saturation: 0.6 })
        .toBuffer();
      
      // Add semi-transparent overlays for text areas
      const overlays = [
        {
          input: Buffer.from(`
            <svg width="${Math.floor(width * 0.8)}" height="${Math.floor(height * 0.4)}" xmlns="http://www.w3.org/2000/svg">
              <rect width="100%" height="100%" fill="rgba(255,255,255,0.92)" rx="12"/>
            </svg>
          `),
          left: Math.floor(width * 0.1),
          top: Math.floor(height * 0.2)
        },
        {
          input: Buffer.from(`
            <svg width="${Math.floor(width * 0.7)}" height="${Math.floor(height * 0.12)}" xmlns="http://www.w3.org/2000/svg">
              <rect width="100%" height="100%" fill="rgba(240,240,240,0.9)" rx="8"/>
            </svg>
          `),
          left: Math.floor(width * 0.15),
          top: Math.floor(height * 0.75)
        }
      ];
      
      return sharp(blurredFront)
        .composite(overlays)
        .jpeg({ quality: 95 })
        .toBuffer();
        
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      
      // Final fallback - simple colored background
      const simpleFallback = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#2563eb"/>
          <rect x="${width * 0.1}" y="${height * 0.2}" width="${width * 0.8}" height="${height * 0.4}" fill="rgba(255,255,255,0.95)" rx="12"/>
          <rect x="${width * 0.15}" y="${height * 0.75}" width="${width * 0.7}" height="${height * 0.12}" fill="rgba(240,240,240,0.9)" rx="8"/>
        </svg>
      `;
      
      return sharp(Buffer.from(simpleFallback))
        .jpeg({ quality: 95 })
        .toBuffer();
    }
  }
}

/**
 * Parse front cover prompt and extract visual elements for back cover generation
 */
function parseAndBuildBackCoverPrompt(frontPrompt, userBackText = '', interiorImagesCount = 0) {
  console.log('Parsing front cover prompt for back cover generation...');
  
  // Remove title, author, and front-specific text elements
  let visualPrompt = frontPrompt
    // Remove title patterns
    .replace(/title[:\s]*['""]?[^'"".\n,]+['""]?/gi, '')
    .replace(/book title[:\s]*['""]?[^'"".\n,]+['""]?/gi, '')
    .replace(/called[:\s]*['""]?[^'"".\n,]+['""]?/gi, '')
    .replace(/titled[:\s]*['""]?[^'"".\n,]+['""]?/gi, '')
    // Remove author patterns
    .replace(/author[:\s]*['""]?[^'"".\n,]+['""]?/gi, '')
    .replace(/by[:\s]*['""]?[^'"".\n,]+['""]?/gi, '')
    .replace(/written by[:\s]*['""]?[^'"".\n,]+['""]?/gi, '')
    // Remove subtitle patterns
    .replace(/subtitle[:\s]*['""]?[^'"".\n,]+['""]?/gi, '')
    // Remove front-specific elements
    .replace(/front cover/gi, '')
    .replace(/cover design/gi, '')
    .replace(/book cover/gi, '')
    // Clean up extra spaces and punctuation
    .replace(/\s+/g, ' ')
    .replace(/[,\s]+,/g, ',')
    .replace(/^\s*[,.\s]+|[,.\s]+\s*$/g, '')
    .trim();

  // Extract key visual components using regex patterns
  const extractors = {
    // Background elements
    background: [
      /(?:background|backdrop)[:\s]*([^,.]+)/gi,
      /features?\s+(?:a\s+)?([^,.]+?)\s+(?:as\s+)?background/gi,
      /(?:set against|against)\s+([^,.]+)/gi,
      /(?:prominent|featuring)\s+(?:depiction of\s+)?([^,.]+?)(?:\s+as\s+(?:the\s+)?background)?/gi
    ],
    
    // Color schemes
    colors: [
      /colors?[:\s]*([^,.]+)/gi,
      /color scheme[:\s]*([^,.]+)/gi,
      /palette[:\s]*([^,.]+)/gi,
      /(?:using|with|featuring)\s+([^,.]*(?:red|blue|green|yellow|orange|purple|pink|black|white|gray|grey|brown|cream|gold|silver)[^,.]*)/gi
    ],
    
    // Artistic style
    style: [
      /(?:comic-style|vector style|flat design|realistic|watercolor|oil painting|digital art|illustration style)/gi,
      /(?:modern|vintage|retro|contemporary|classic|minimalist|detailed|abstract)/gi,
      /(?:dynamic|bold|soft|dramatic|elegant|rustic|professional)/gi,
      /style[:\s]*([^,.]+)/gi
    ],
    
    // Texture and treatment
    texture: [
      /texture[:\s]*([^,.]+)/gi,
      /(?:with|featuring)\s+([^,.]*texture[^,.]*)/gi,
      /(?:finish|treatment|effect)[:\s]*([^,.]+)/gi
    ]
  };

  const extracted = {
    background: [],
    colors: [],
    style: [],
    texture: []
  };

  // Extract elements using the patterns
  Object.keys(extractors).forEach(key => {
    extractors[key].forEach(regex => {
      const matches = [...visualPrompt.matchAll(regex)];
      matches.forEach(match => {
        if (match[1] && match[1].trim()) {
          extracted[key].push(match[1].trim());
        }
      });
    });
  });

  // Build the back cover prompt using the template
  let backPrompt = '';
  
  // Start with artistic style
  const styles = [...new Set(extracted.style)].filter(s => s.length > 2);
  if (styles.length > 0) {
    backPrompt += `${styles[0]} design with no text. `;
  } else {
    backPrompt += 'Professional design with no text. ';
  }

  // Add background description
  const backgrounds = [...new Set(extracted.background)].filter(b => b.length > 3);
  if (backgrounds.length > 0) {
    backPrompt += `Features ${backgrounds[0]} with no text or lettering, `;
  } else {
    backPrompt += 'Features a complementary background design with no text or lettering, ';
  }

  // Add color scheme
  const colors = [...new Set(extracted.colors)].filter(c => c.length > 3);
  if (colors.length > 0) {
    backPrompt += `maintaining the same color scheme of ${colors[0]}. `;
  } else {
    backPrompt += 'maintaining the same color scheme as the front cover. ';
  }

  // Add artistic style continuation
  if (styles.length > 1) {
    backPrompt += `The artistic style is ${styles.slice(1).join(', ')}, `;
  }

  // Add texture if found
  const textures = [...new Set(extracted.texture)].filter(t => t.length > 3);
  if (textures.length > 0) {
    backPrompt += `with ${textures[0]}. `;
  }

  // Add user-provided back cover text
  if (userBackText && userBackText.trim()) {
    backPrompt += `\n\n${userBackText.trim()}. `;
  }

  // Add interior images description if provided
  if (interiorImagesCount > 0) {
    if (interiorImagesCount === 1) {
      backPrompt += `\n\nIncludes a centered preview of one interior illustration, blending seamlessly with the background design. `;
    } else {
      backPrompt += `\n\nIncludes ${interiorImagesCount} interior preview images arranged harmoniously with the background design. `;
    }
  }

  // Add KDP compliance and consistency requirements
  backPrompt += `\n\nFormat: 6x9 inches artwork. Ensure full visual consistency with the original design style, background treatment, and colors. Clean visual design only. NO TEXT, NO TITLES, NO LETTERS, NO ISBN BARCODE, NO WORDS - pure visual artwork.`;

  console.log('Generated back cover prompt from front cover analysis');
  return backPrompt;
}

module.exports = router; 